// Service worker: the only part of the extension that talks to the network or to storage.
// It trusts nothing from content scripts. Messages are validated, the student's answers are read
// from extension storage (never from a message), and the Claude API key stays on the server.
import { DEFAULT_API_ORIGIN, LIMITS, isAllowedApiOrigin } from './config.js';
import { ApiError, createApi } from './lib/api.js';
import { courseIdsFor } from './lib/parse.js';
import { validateAnswers, validateMessage, validateSection, validateSender } from './lib/messages.js';

class PublicError extends Error {}

async function readSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  const answers = validateAnswers(settings.answers);
  const apiOrigin = isAllowedApiOrigin(settings.apiOrigin) ? settings.apiOrigin.replace(/\/$/, '') : DEFAULT_API_ORIGIN;
  return { consented: settings.consented === true, apiOrigin, answers: answers.ok ? answers.value : null };
}

function requireConsent(settings) {
  if (!settings.consented) throw new PublicError('consent');
}

async function cacheKey(parts) {
  const bytes = new TextEncoder().encode(JSON.stringify(parts));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return 'cache:' + [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function cached(parts, load) {
  const key = await cacheKey(parts);
  const hit = (await chrome.storage.session.get(key))[key];
  if (hit && Date.now() - hit.at < LIMITS.cacheTtlMs) return hit.value;
  const value = await load();
  await chrome.storage.session.set({ [key]: { at: Date.now(), value } });
  return value;
}

async function lookupCourse(api, settings, code) {
  for (const courseId of courseIdsFor(code)) {
    const list = await cached([settings.apiOrigin, courseId, settings.answers], () =>
      settings.answers ? api.match(courseId, settings.answers) : api.professors(courseId),
    );
    if (list.length) return list;
  }
  return [];
}

// A small token bucket so a page can't turn the extension into a request flood against the server.
const bucket = { tokens: LIMITS.explanationsPerMinute, at: Date.now() };
function takeToken() {
  const now = Date.now();
  bucket.tokens = Math.min(LIMITS.explanationsPerMinute, bucket.tokens + ((now - bucket.at) / 60_000) * LIMITS.explanationsPerMinute);
  bucket.at = now;
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}

async function readPins() {
  const { pins = [] } = await chrome.storage.local.get('pins');
  return Array.isArray(pins) ? pins.map(validateSection).filter((r) => r.ok).map((r) => r.value) : [];
}

const HANDLERS = {
  getState: async (_m, s) => ({
    consented: s.consented,
    hasAnswers: Boolean(s.answers),
    tryUrl: `${s.apiOrigin}/try-this-class/`,
  }),
  lookupCourses: async (m, s) => {
    requireConsent(s);
    const api = createApi({ origin: s.apiOrigin, timeoutMs: LIMITS.requestTimeoutMs });
    const entries = await Promise.all(m.courses.map(async (code) => [code, await lookupCourse(api, s, code)]));
    return { courses: Object.fromEntries(entries) };
  },
  explainSection: async (m, s) => {
    requireConsent(s);
    if (!s.answers) throw new PublicError('preferences');
    if (!takeToken()) throw new PublicError('rate-limited');
    const api = createApi({ origin: s.apiOrigin, timeoutMs: 30_000 });
    return api.explain(m.professorId, s.answers);
  },
  getPins: async () => readPins(),
  pinSection: async (m) => {
    const pins = (await readPins()).filter((p) => !(p.courseCode === m.section.courseCode && p.sectionId === m.section.sectionId));
    await chrome.storage.local.set({ pins: [...pins, m.section].slice(-LIMITS.pins) });
    return true;
  },
  unpinSection: async (m) => {
    const pins = (await readPins()).filter((p) => !(p.courseCode === m.courseCode && p.sectionId === m.sectionId));
    await chrome.storage.local.set({ pins });
    return true;
  },
  openSettings: async () => {
    await chrome.runtime.openOptionsPage();
    return true;
  },
};

function publicCode(error) {
  if (error instanceof PublicError) return error.message;
  if (error instanceof ApiError) return error.code;
  return 'internal';
}

async function handle(message, sender) {
  if (!validateSender(sender, chrome.runtime.id)) return { ok: false, error: 'sender' };
  const checked = validateMessage(message);
  if (!checked.ok) return { ok: false, error: 'invalid' };
  try {
    const value = await HANDLERS[checked.value.type](checked.value, await readSettings());
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: publicCode(error) };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handle(message, sender).then(sendResponse);
  return true;
});

// Content scripts can't read session storage, so cached profiles stay inside the worker.
chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') chrome.runtime.openOptionsPage();
});
