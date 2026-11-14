import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreProfile, mergeContributions, validateAnswers } from './scoring.js';
import { scrubText } from './privacy.js';

const v = (n) => ({ value: n, evidence: '' });
const stepByStep = { pace: v(2), format: v(2), structure: v(5), assessment: v(3), participation: v(2), guidance: v(1), workload: v(3) };
const openEnded = { pace: v(4), format: v(4), structure: v(3), assessment: v(5), participation: v(4), guidance: v(4), workload: v(4) };
const base = { format: 3, structure: 3, assessment: 3, participation: 3, pace: 3, workload: 3, goal: 'foundation' };

test('beginners rank high-guidance sections higher', () => {
  const a = { ...base, prior: 1 };
  assert.ok(scoreProfile(a, stepByStep).score > scoreProfile(a, openEnded).score);
});

test('experienced students do not prefer step-by-step as strongly', () => {
  const beginner = { ...base, prior: 1 };
  const expert = { ...base, prior: 5 };
  const gapBeginner = scoreProfile(beginner, stepByStep).score - scoreProfile(beginner, openEnded).score;
  const gapExpert = scoreProfile(expert, stepByStep).score - scoreProfile(expert, openEnded).score;
  assert.ok(gapExpert < gapBeginner);
});

test('scores are deterministic and within 0-100', () => {
  const a = { ...base, prior: 3 };
  const s1 = scoreProfile(a, openEnded);
  assert.deepEqual(s1, scoreProfile(a, openEnded));
  assert.ok(s1.score >= 0 && s1.score <= 100);
  assert.equal(s1.breakdown.length, 7);
});

test('participation below comfort level is not penalized', () => {
  const a = { ...base, prior: 3, participation: 5 };
  const fit = scoreProfile(a, stepByStep).breakdown.find((b) => b.key === 'participation').fit;
  assert.equal(fit, 100);
});

test('merging averages values and keeps evidence', () => {
  const m = mergeContributions([
    { profile: { pace: { value: 2, evidence: 'old' } }, summary: 'a', created_at: '2026-01-01', is_sample: true },
    { profile: { pace: { value: 4, evidence: 'new' }, format: { value: null, evidence: '' } }, summary: 'b', created_at: '2026-02-01', is_sample: false },
  ]);
  assert.equal(m.profile.pace.value, 3);
  assert.deepEqual(m.profile.pace.evidence, ['new', 'old']);
  assert.equal(m.profile.format.value, 3); // no evidence -> neutral default
  assert.equal(m.summary, 'b');
  assert.equal(m.contributionCount, 2);
});

test('answer validation', () => {
  assert.equal(validateAnswers({ ...base, prior: 3 }), null);
  assert.ok(validateAnswers({ ...base, prior: 9 }));
  assert.ok(validateAnswers({ ...base, prior: 3, goal: 'x' }));
});

test('scrubber removes personal details', () => {
  const out = scrubText('My name is Jane Doe, email jane@usc.edu, ID 1234567890, call 213-555-0199. Jake asked about pointers.');
  for (const leak of ['Jane', 'jane@usc.edu', '1234567890', '555-0199', 'Jake']) assert.ok(!out.includes(leak), leak + ' leaked: ' + out);
  assert.ok(out.includes('pointers'));
});
