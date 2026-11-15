import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi, readExplanation, readProfessors } from '../src/lib/api.js';

function fakeFetch(respond) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    return respond(url, init);
  };
  return { impl, calls };
}
const json = (body, { status = 200, type = 'application/json; charset=utf-8' } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (h) => (h.toLowerCase() === 'content-type' ? type : null) },
  json: async () => body,
});

test('requests carry no cookies, no referrer, and refuse redirects', async () => {
  const f = fakeFetch(() => json([]));
  await createApi({ origin: 'https://same-page.replit.app', fetchImpl: f.impl }).match('csci-103', { prior: 1 });
  const { url, init } = f.calls[0];
  assert.equal(url, 'https://same-page.replit.app/api/match');
  assert.equal(init.credentials, 'omit');
  assert.equal(init.referrerPolicy, 'no-referrer');
  assert.equal(init.redirect, 'error');
  assert.equal(init.cache, 'no-store');
});

test('course ids are encoded into the path', async () => {
  const f = fakeFetch(() => json([]));
  await createApi({ origin: 'http://localhost:3000', fetchImpl: f.impl }).professors('../admin?x=1');
  assert.equal(f.calls[0].url, 'http://localhost:3000/api/courses/..%2Fadmin%3Fx%3D1/professors');
});

test('server failures become short error codes', async () => {
  const cases = [
    [() => json({}, { status: 500 }), 'http-error'],
    [() => json({}, { status: 429 }), 'rate-limited'],
    [() => json('<html>', { type: 'text/html' }), 'bad-response'],
    [() => json({ not: 'a list' }), 'bad-response'],
    [() => { throw new TypeError('Failed to fetch'); }, 'network'],
  ];
  for (const [respond, code] of cases) {
    const api = createApi({ origin: 'http://localhost:3000', fetchImpl: fakeFetch(respond).impl });
    await assert.rejects(api.professors('csci-103'), (e) => e.code === code);
  }
});

test('slow servers time out', async () => {
  const hang = (_url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
  const api = createApi({ origin: 'http://localhost:3000', fetchImpl: hang, timeoutMs: 20 });
  await assert.rejects(api.professors('csci-103'), (e) => e.code === 'timeout');
});

test('responses are rebuilt with only the fields the extension uses', () => {
  const [p] = readProfessors([
    { id: 7, name: 'Dr. Maya Reyes', section: '29901', schedule: 'MW', score: 140, is_sample: true, breakdown: [{ label: 'Pace', fit: 80.4, secret: 1 }], email: 'x@y.z' },
    { id: -1, name: 'bad id' },
    { id: '8', name: 'string id' },
  ]);
  assert.deepEqual(p, { professorId: 7, name: 'Dr. Maya Reyes', section: '29901', schedule: 'MW', isSample: true, score: 100, breakdown: [{ label: 'Pace', fit: 80 }] });
  assert.equal(readProfessors(Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }))).length, 40);
  assert.equal(readProfessors([{ id: 1, name: 'x'.repeat(1000) }])[0].name.length, 120);
});

test('explanations must have both parts and say who wrote them', () => {
  assert.deepEqual(readExplanation({ why: 'Fits.', watch_out: 'Fast pace.', source: 'ai' }), { why: 'Fits.', watchOut: 'Fast pace.', writtenBy: 'claude' });
  assert.equal(readExplanation({ why: 'a', watch_out: 'b', source: 'template' }).writtenBy, 'template');
  assert.throws(() => readExplanation({ why: 'only half' }));
});
