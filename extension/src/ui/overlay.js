// Everything the extension draws lives in closed shadow roots, so the page's scripts and styles
// can't read or restyle it, and it can't break the page. Text is only ever set with textContent.
import { formatClock } from '../lib/schedule.js';

const STYLE = `
:host { all: initial; display: inline-block; margin-left: 8px; }
* { box-sizing: border-box; font-family: system-ui, "Segoe UI", sans-serif; }
.badge { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 4px 0; font-size: 12.5px; color: #1d1d1f; }
.fit { font-weight: 700; color: #fff; background: #990000; border-radius: 10px; padding: 2px 8px; }
.fit.none { background: #e8e8ea; color: #444; font-weight: 600; }
.flag { background: #fff4d1; color: #6b4e00; border-radius: 10px; padding: 2px 8px; }
.flag.conflict { background: #fde2e1; color: #8a1c13; }
button, a { font: inherit; font-size: 12px; border: 0; border-radius: 6px; padding: 3px 8px; background: #efeff2; color: #1d1d1f; cursor: pointer; text-decoration: none; }
button:hover, a:hover { background: #e2e2e7; }
button:focus-visible, a:focus-visible { outline: 2px solid #990000; outline-offset: 1px; }
.why { flex-basis: 100%; max-width: 560px; background: #fafafa; border-left: 3px solid #990000; padding: 8px 10px; line-height: 1.45; }
.why p { margin: 0 0 6px; }
.note { color: #666; font-size: 11.5px; }
.panel { position: fixed; right: 16px; bottom: 16px; width: 300px; max-height: 60vh; overflow: auto; background: #fff; color: #1d1d1f;
  border-radius: 10px; box-shadow: 0 6px 24px rgba(0,0,0,.18); padding: 12px 14px; font-size: 13px; z-index: 2147483000; }
.panel h2 { margin: 0 0 8px; font-size: 15px; }
.panel ul { margin: 6px 0; padding-left: 18px; }
.panel .row { display: flex; justify-content: space-between; gap: 8px; }
.collapsed .body { display: none; }
`;

function el(tag, attrs = {}, text) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

function shadowHost(tagName) {
  const host = document.createElement(tagName);
  host.setAttribute('data-same-page', '');
  const root = host.attachShadow({ mode: 'closed' });
  root.append(el('style', {}, STYLE));
  return { host, root };
}

function describeTime(s) {
  if (!Number.isInteger(s.start)) return 'Time not listed';
  return `${s.days.join(', ')} ${formatClock(s.start)} to ${formatClock(s.end)}`;
}

/** Builds the fit label. The number always says what it counts. */
function fitLabel(profile, scored) {
  if (!profile) return { text: 'No class notes yet', title: 'Nobody has shared notes or a syllabus for this section yet.', none: true };
  if (!scored || profile.score === null) return { text: 'Teaching profile ready', title: 'Answer the preference questions in the extension to see your fit.', none: true };
  return { text: `${profile.score}% fit`, title: 'Fit across 7 teaching fields: pace, format, structure, assessment, participation, guidance and workload.' };
}

export function createOverlay(handlers) {
  const badges = new Map();

  function badge(row, section, info) {
    const key = `${section.courseCode} ${section.sectionId}`;
    let entry = badges.get(key);
    if (!entry) {
      const { host, root } = shadowHost('same-page-badge');
      const cell = row.cells?.[row.cells.length - 1] ?? row;
      cell.append(host);
      entry = { root, section };
      badges.set(key, entry);
    }
    render(entry, info);
  }

  function render(entry, { profile, scored, flags, conflicts, pinned, tryUrl }) {
    const { root, section } = entry;
    root.querySelector('.badge')?.remove();
    const wrap = el('div', { class: 'badge', role: 'group', 'aria-label': `Same Page details for section ${section.sectionId}` });
    const fit = fitLabel(profile, scored);
    wrap.append(el('span', { class: fit.none ? 'fit none' : 'fit', title: fit.title }, fit.text));
    for (const f of flags) wrap.append(el('span', { class: 'flag' }, f.label));
    for (const c of conflicts) wrap.append(el('span', { class: 'flag conflict' }, `Overlaps ${c.courseCode} ${c.sectionId}`));
    if (profile && scored && profile.score !== null) {
      const why = el('button', { type: 'button' }, 'Why this fits');
      why.addEventListener('click', () => explain(wrap, profile, why));
      wrap.append(why);
    }
    const pin = el('button', { type: 'button', 'aria-pressed': String(pinned) }, pinned ? 'Unpin' : 'Pin to compare');
    pin.addEventListener('click', () => (pinned ? handlers.onUnpin(section) : handlers.onPin(section)));
    wrap.append(pin);
    if (tryUrl) {
      const url = new URL(tryUrl);
      url.searchParams.set('course', section.courseCode);
      url.searchParams.set('section', section.sectionId);
      wrap.append(el('a', { href: url.href, target: '_blank', rel: 'noopener noreferrer' }, 'Try this class'));
    }
    root.append(wrap);
  }

  async function explain(wrap, profile, button) {
    button.disabled = true;
    wrap.querySelector('.why')?.remove();
    const box = el('div', { class: 'why', 'aria-live': 'polite' }, 'Asking Claude…');
    wrap.append(box);
    const res = await handlers.onExplain(profile.professorId);
    box.textContent = '';
    if (!res.ok) {
      box.append(el('p', {}, handlers.describeError(res.error)));
    } else {
      box.append(el('p', {}, res.value.why), el('p', {}, `Watch out: ${res.value.watchOut}`));
      const source = res.value.writtenBy === 'claude'
        ? 'Written by Claude from this section\'s teaching profile. The fit score comes from a fixed formula, not the AI.'
        : 'Claude is offline, so this is a plain summary of the score breakdown.';
      box.append(el('p', { class: 'note' }, source));
    }
    button.disabled = false;
  }

  const { host: panelHost, root: panelRoot } = shadowHost('same-page-panel');
  document.body.append(panelHost);

  function panel({ status, pins, conflicts, busiest }) {
    panelRoot.querySelector('.panel')?.remove();
    const box = el('section', { class: 'panel', 'aria-label': 'Same Page compare list' });
    const head = el('div', { class: 'row' });
    head.append(el('h2', {}, 'Same Page'));
    const toggle = el('button', { type: 'button', 'aria-expanded': 'true' }, 'Hide');
    toggle.addEventListener('click', () => {
      const collapsed = box.classList.toggle('collapsed');
      toggle.textContent = collapsed ? 'Show' : 'Hide';
      toggle.setAttribute('aria-expanded', String(!collapsed));
    });
    head.append(toggle);
    box.append(head);
    const body = el('div', { class: 'body' });
    if (status) body.append(el('p', {}, status));
    if (pins.length) {
      body.append(el('p', {}, `Pinned sections (${pins.length})`));
      const list = el('ul');
      for (const p of pins) list.append(el('li', {}, `${p.courseCode} ${p.sectionId}, ${describeTime(p)}`));
      body.append(list);
    } else {
      body.append(el('p', { class: 'note' }, 'Pin sections to check them for time conflicts.'));
    }
    if (conflicts.length) {
      body.append(el('p', {}, `${conflicts.length} time ${conflicts.length === 1 ? 'conflict' : 'conflicts'}`));
      const list = el('ul');
      for (const [a, b] of conflicts) list.append(el('li', {}, `${a.courseCode} ${a.sectionId} overlaps ${b.courseCode} ${b.sectionId}`));
      body.append(list);
    }
    if (busiest) body.append(el('p', { class: 'note' }, `Your busiest day so far is ${busiest}.`));
    const settings = el('button', { type: 'button' }, 'Open Same Page settings');
    settings.addEventListener('click', handlers.onSettings);
    body.append(settings);
    box.append(body);
    panelRoot.append(box);
  }

  return { badge, panel };
}
