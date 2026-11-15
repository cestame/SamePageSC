// Runs on Web Registration (and on the extension's own practice page). It reads section rows,
// asks the service worker for teaching profiles, and draws badges. All network calls happen in
// the service worker, never here, so the page can't observe or tamper with them.
import { extractSections, } from './lib/dom-extract.js';
import { lastName } from './lib/parse.js';
import { dayLoad, findConflicts, overlaps, timeFlags } from './lib/schedule.js';
import { createOverlay } from './ui/overlay.js';

const ERRORS = {
  consent: 'Turn on Same Page in the extension settings to see teaching profiles.',
  preferences: 'Answer the 8 preference questions in the extension settings to see your fit.',
  'rate-limited': 'Too many requests in a minute. Try again shortly.',
  network: 'Could not reach Same Page. Check your connection or the server address in settings.',
  timeout: 'Same Page took too long to answer. Try again.',
};
const describeError = (code) => ERRORS[code] ?? 'Something went wrong. Try again.';

function send(message) {
  return chrome.runtime.sendMessage(message).catch(() => ({ ok: false, error: 'network' }));
}

/** Exact match on section number first, then a loose match on the instructor's last name. */
export function matchProfile(list, section) {
  if (!Array.isArray(list)) return null;
  const bySection = list.find((p) => p.section && p.section === section.sectionNumber);
  if (bySection) return bySection;
  const last = lastName(section.instructor);
  return last ? list.find((p) => lastName(p.name) === last) ?? null : null;
}

export async function start(root = document) {
  const found = new Map();
  let state = { consented: false, hasAnswers: false, tryUrl: null };
  let profiles = {};
  let pins = [];

  const overlay = createOverlay({
    onExplain: (professorId) => send({ type: 'explainSection', professorId }),
    onPin: async (section) => { await send({ type: 'pinSection', section }); await refreshPins(); },
    onUnpin: async (s) => { await send({ type: 'unpinSection', courseCode: s.courseCode, sectionId: s.sectionId }); await refreshPins(); },
    onSettings: () => send({ type: 'openSettings' }),
    describeError,
  });

  async function refreshState() {
    const res = await send({ type: 'getState' });
    if (res.ok) state = res.value;
  }

  async function refreshPins() {
    const res = await send({ type: 'getPins' });
    pins = res.ok ? res.value : [];
    draw();
  }

  async function lookup(codes) {
    if (!state.consented || !codes.length) return;
    const res = await send({ type: 'lookupCourses', courses: codes.slice(0, 12) });
    if (res.ok) profiles = { ...profiles, ...res.value.courses };
  }

  function statusLine() {
    if (!state.consented) return describeError('consent');
    if (!state.hasAnswers) return describeError('preferences');
    return null;
  }

  function draw() {
    for (const { row, section } of found.values()) {
      const pinned = pins.some((p) => p.courseCode === section.courseCode && p.sectionId === section.sectionId);
      overlay.badge(row, section, {
        profile: matchProfile(profiles[section.courseCode], section),
        scored: state.hasAnswers,
        flags: timeFlags(section),
        conflicts: pinned ? [] : pins.filter((p) => overlaps(p, section)),
        pinned,
        tryUrl: state.tryUrl,
      });
    }
    overlay.panel({ status: statusLine(), pins, conflicts: findConflicts(pins), busiest: dayLoad(pins).busiest });
  }

  async function scan() {
    const fresh = extractSections(root).filter(({ section }) => !found.has(`${section.courseCode} ${section.sectionId}`));
    for (const f of fresh) found.set(`${f.section.courseCode} ${f.section.sectionId}`, f);
    const newCodes = [...new Set(fresh.map((f) => f.section.courseCode))].filter((c) => !(c in profiles));
    await lookup(newCodes);
    draw();
  }

  await refreshState();
  await refreshPins();
  await scan();

  // Web Registration redraws parts of the page as students browse; rescan after it settles.
  let timer = null;
  new MutationObserver((records) => {
    if (records.every((r) => r.target instanceof Element && r.target.closest('[data-same-page]'))) return;
    clearTimeout(timer);
    timer = setTimeout(scan, 400);
  }).observe(root.body ?? root, { childList: true, subtree: true });

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'local' || !('settings' in changes)) return;
    await refreshState();
    profiles = {};
    await lookup([...new Set([...found.values()].map((f) => f.section.courseCode))]);
    draw();
  });
}
