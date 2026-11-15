// Security properties checked on every test run, so a later change can't quietly widen access.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGISTRATION_ORIGINS, isAllowedApiOrigin } from '../src/config.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const sources = walk(join(root, 'src')).map((file) => ({ file: relative(root, file).replaceAll('\\', '/'), text: readFileSync(file, 'utf8') }));
const js = sources.filter((s) => s.file.endsWith('.js'));
const registrationMatches = REGISTRATION_ORIGINS.map((o) => `${o}/*`);

test('manifest asks for the least access that works', () => {
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.deepEqual(manifest.host_permissions, ['https://*.replit.app/*', 'https://*.replit.dev/*', 'http://localhost:3000/*']);
  const all = JSON.stringify(manifest);
  for (const broad of ['<all_urls>', '*://*/*', 'https://*/*', 'tabs', 'scripting', 'cookies', 'webRequest', 'history', 'nativeMessaging']) {
    assert.ok(!all.includes(`"${broad}"`), `manifest must not request ${broad}`);
  }
});

test('content scripts and exposed files only run on registration pages', () => {
  assert.equal(manifest.content_scripts.length, 1);
  assert.deepEqual(manifest.content_scripts[0].matches, registrationMatches);
  assert.equal(manifest.content_scripts[0].all_frames, false);
  for (const war of manifest.web_accessible_resources) {
    assert.deepEqual(war.matches, registrationMatches);
    assert.equal(war.use_dynamic_url, true, 'dynamic URLs stop pages from fingerprinting the extension');
    assert.ok(!war.resources.some((r) => /background|popup|generated/.test(r)), 'privileged files are never exposed to pages');
  }
});

test('extension pages run only their own scripts', () => {
  const csp = manifest.content_security_policy.extension_pages;
  assert.match(csp, /script-src 'self'(;|$)/);
  assert.match(csp, /object-src 'none'/);
  assert.doesNotMatch(csp, /unsafe-eval|unsafe-inline|wasm-unsafe-eval|https?:/);
  for (const html of sources.filter((s) => s.file.endsWith('.html'))) {
    assert.doesNotMatch(html.text, /<script(?![^>]*\bsrc=)[^>]*>/, `${html.file} has an inline script`);
    assert.doesNotMatch(html.text, /\son[a-z]+\s*=/i, `${html.file} has an inline event handler`);
    assert.doesNotMatch(html.text, /<script[^>]*src=["']https?:/i, `${html.file} loads remote code`);
  }
});

test('no source file builds HTML from strings or evaluates code', () => {
  const banned = [/\.innerHTML\b/, /\.outerHTML\b/, /insertAdjacentHTML/, /document\.write/, /\beval\(/, /new Function\(/, /setTimeout\(\s*['"`]/, /attachShadow\(\{\s*mode:\s*'open'/];
  for (const { file, text } of js) for (const re of banned) assert.doesNotMatch(text, re, `${file} matches ${re}`);
});

test('only the service worker reaches the network or the cache', () => {
  for (const { file, text } of js) {
    if (file !== 'src/lib/api.js') assert.doesNotMatch(text, /\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon/, `${file} must not make requests`);
    if (!['src/background.js', 'src/popup.js'].includes(file)) assert.doesNotMatch(text, /chrome\.storage\.session/, `${file} must not touch the profile cache`);
  }
  const pageSide = js.filter((s) => /^src\/(content-main|ui\/|lib\/(dom-extract|parse|schedule))/.test(s.file));
  for (const { file, text } of pageSide) assert.doesNotMatch(text, /chrome\.storage\.local\.set|ANTHROPIC|api[_-]?key/i, `${file} must not write settings or mention keys`);
});

test('the server allowlist rejects look-alike and malformed origins', () => {
  for (const good of ['https://same-page.replit.app', 'https://same-page.cestame.replit.app', 'https://x.replit.dev', 'http://localhost:3000', 'https://same-page.replit.app/']) {
    assert.equal(isAllowedApiOrigin(good), true, good);
  }
  for (const bad of ['http://same-page.replit.app', 'https://replit.app', 'https://replit.app.evil.example', 'https://evil.example/?.replit.app',
    'https://a.replit.app/api', 'https://user:pw@a.replit.app', 'http://localhost:3001', 'javascript:alert(1)', '', null, 42]) {
    assert.equal(isAllowedApiOrigin(bad), false, String(bad));
  }
});
