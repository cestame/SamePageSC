// The only doorway into the service worker. Every message is checked against an allowlist of
// types and keys before anything runs, and the sender must be this extension on an approved page.
import { LIMITS, REGISTRATION_ORIGINS } from '../config.js';
import { WEEK, normalizeCourseCode } from './parse.js';

const SECTION_ID = /^\d{5}[A-Z]?$/;
const GOALS = ['requirement', 'foundation', 'mastery'];
const LIKERT_KEYS = ['prior', 'format', 'structure', 'assessment', 'participation', 'pace', 'workload'];

const ok = (value) => ({ ok: true, value });
const fail = (error) => ({ ok: false, error });
const isPlainObject = (v) => v !== null && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;
const onlyKeys = (obj, keys) => Object.keys(obj).every((k) => keys.includes(k));
const isCourseCode = (c) => typeof c === 'string' && normalizeCourseCode(c) === c;
const isMinute = (v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 24 * 60);

export function validateSection(s) {
  if (!isPlainObject(s)) return fail('section must be an object');
  const keys = ['courseCode', 'sectionId', 'sectionNumber', 'type', 'days', 'start', 'end', 'instructor'];
  if (!onlyKeys(s, keys)) return fail('section has unexpected fields');
  if (!isCourseCode(s.courseCode)) return fail('bad course code');
  if (typeof s.sectionId !== 'string' || !SECTION_ID.test(s.sectionId)) return fail('bad section id');
  if (s.sectionNumber !== s.sectionId.slice(0, 5)) return fail('bad section number');
  if (!Array.isArray(s.days) || s.days.length > 7 || !s.days.every((d) => WEEK.includes(d))) return fail('bad days');
  if (new Set(s.days).size !== s.days.length) return fail('repeated days');
  if (!isMinute(s.start) || !isMinute(s.end)) return fail('bad time');
  if ((s.start === null) !== (s.end === null) || (s.start !== null && s.end <= s.start)) return fail('bad time range');
  if (typeof s.type !== 'string' || s.type.length > 30) return fail('bad type');
  if (typeof s.instructor !== 'string' || s.instructor.length > LIMITS.instructorChars) return fail('bad instructor');
  return ok({ ...s, days: [...s.days] });
}

/** Same rules as server/scoring.js validateAnswers, so the server never sees a request it would reject. */
export function validateAnswers(a) {
  if (!isPlainObject(a)) return fail('answers missing');
  if (!onlyKeys(a, [...LIKERT_KEYS, 'goal'])) return fail('answers have unexpected fields');
  for (const k of LIKERT_KEYS) {
    if (!Number.isInteger(a[k]) || a[k] < 1 || a[k] > 5) return fail(`answer "${k}" must be an integer 1-5`);
  }
  if (!GOALS.includes(a.goal)) return fail('answer "goal" is not a known goal');
  return ok({ ...a });
}

const VALIDATORS = {
  getState: (m) => (onlyKeys(m, ['type']) ? ok(m) : fail('unexpected fields')),
  getPins: (m) => (onlyKeys(m, ['type']) ? ok(m) : fail('unexpected fields')),
  openSettings: (m) => (onlyKeys(m, ['type']) ? ok(m) : fail('unexpected fields')),
  lookupCourses: (m) => {
    if (!onlyKeys(m, ['type', 'courses']) || !Array.isArray(m.courses)) return fail('courses must be a list');
    if (m.courses.length < 1 || m.courses.length > LIMITS.coursesPerLookup) return fail('too many courses');
    if (!m.courses.every(isCourseCode)) return fail('bad course code');
    return ok({ type: m.type, courses: [...new Set(m.courses)] });
  },
  explainSection: (m) => {
    if (!onlyKeys(m, ['type', 'professorId'])) return fail('unexpected fields');
    return Number.isSafeInteger(m.professorId) && m.professorId > 0 ? ok(m) : fail('bad professor id');
  },
  pinSection: (m) => {
    if (!onlyKeys(m, ['type', 'section'])) return fail('unexpected fields');
    const s = validateSection(m.section);
    return s.ok ? ok({ type: m.type, section: s.value }) : s;
  },
  unpinSection: (m) => {
    if (!onlyKeys(m, ['type', 'courseCode', 'sectionId'])) return fail('unexpected fields');
    return isCourseCode(m.courseCode) && SECTION_ID.test(String(m.sectionId)) ? ok(m) : fail('bad section');
  },
};

export const MESSAGE_TYPES = Object.freeze(Object.keys(VALIDATORS));

export function validateMessage(msg) {
  if (!isPlainObject(msg) || typeof msg.type !== 'string') return fail('message must be an object with a type');
  const validate = Object.hasOwn(VALIDATORS, msg.type) ? VALIDATORS[msg.type] : null;
  return validate ? validate(msg) : fail('unknown message type');
}

/**
 * Accepts messages only from this extension: a content script running in a tab on an approved
 * registration origin, or one of the extension's own pages (popup, demo).
 */
export function validateSender(sender, extensionId) {
  if (!sender || sender.id !== extensionId) return false;
  if (sender.tab) return REGISTRATION_ORIGINS.includes(sender.origin) || isOwnPage(sender.url, extensionId);
  return isOwnPage(sender.url, extensionId);
}

function isOwnPage(url, extensionId) {
  return typeof url === 'string' && url.startsWith(`chrome-extension://${extensionId}/`);
}
