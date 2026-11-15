// Every origin the extension touches is listed here. The manifest grants nothing broader,
// and test/security.test.js fails the build if the two drift apart.

/** Pages the content script reads. Read-only: the extension never clicks, submits or fills anything. */
export const REGISTRATION_ORIGINS = Object.freeze(['https://webreg.usc.edu', 'https://classes.usc.edu']);

/** Where the Same Page API may live. The server holds the Claude API key; the extension never does. */
const API_ORIGIN_RULES = Object.freeze([
  /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.replit\.app$/,
  /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.replit\.dev$/,
  /^http:\/\/localhost:3000$/,
]);

export const DEFAULT_API_ORIGIN = 'http://localhost:3000';

export const LIMITS = Object.freeze({
  coursesPerLookup: 12,
  requestTimeoutMs: 8000,
  cacheTtlMs: 10 * 60_000,
  explanationsPerMinute: 8,
  pins: 12,
  instructorChars: 80,
});

/** True only for a bare origin (no path, query, credentials) that matches the allowlist. */
export function isAllowedApiOrigin(value) {
  if (typeof value !== 'string') return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.origin !== value.replace(/\/$/, '')) return false;
  return API_ORIGIN_RULES.some((rule) => rule.test(url.origin));
}
