// The graders are code too, so they get tests: each rule must pass a good answer and catch a bad one.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from './cases.js';
import { gradeExplanation, sentences } from './graders.js';
import { scoreProfile } from '../../server/scoring.js';

const good = {
  why: 'You said you are new to this, and every new idea in this section comes with a worked example first. Deadlines and rubrics are posted in week one, which matches the structure you asked for.',
  watch_out: 'Exams carry most of the grade, so falling behind on practice problems will cost you more here.',
};
const failing = (output, score = 82) => gradeExplanation(output, { score }).filter((c) => !c.pass).map((c) => c.name);

test('a good explanation passes every check', () => {
  assert.deepEqual(failing(good), []);
});

test('sentence counting ignores titles like Dr. and Prof.', () => {
  assert.equal(sentences('Dr. Reyes posts notes. Prof. Okafor does not.').length, 2);
});

test('each rule catches the failure it exists for', () => {
  assert.ok(failing({ ...good, why: 'Great class.' }).includes('why has 2 or 3 sentences'));
  assert.ok(failing({ ...good, watch_out: 'It is fast. It is hard.' }).includes('watch-out is exactly one sentence'));
  assert.ok(failing({ ...good, why: 'This section has worked examples. Deadlines are posted early.' }).includes('written to the student in second person'));
  assert.ok(failing({ ...good, why: `${good.why.split('.')[0]}. This is a 100% match for you.` }).includes('never contradicts the computed score'));
  assert.ok(failing({ ...good, watch_out: 'The professor has a thick accent.' }).includes('describes the class, not the person'));
  assert.ok(failing({ ...good, why: `${good.why} As a visual learner you will enjoy it.` }).includes('no learning-styles claims'));
  assert.ok(failing({ ...good, why: `${good.why.split('.')[0]}. It will unlock your potential.` }).includes('no hype words'));
  assert.ok(failing({ ...good, watch_out: 'Exams matter a lot — study early.' }).includes('no em dashes'));
});

test('mentioning the real score is allowed', () => {
  assert.deepEqual(failing({ ...good, why: `${good.why.split('.')[0]}. That is why it scores 82% for you.` }), []);
});

test('every eval case is valid input for the scoring function', () => {
  const ids = new Set();
  for (const c of CASES) {
    assert.ok(!ids.has(c.id), `duplicate case ${c.id}`);
    ids.add(c.id);
    const { score, breakdown } = scoreProfile(c.answers, c.profile);
    assert.ok(score >= 0 && score <= 100);
    assert.equal(breakdown.length, 7);
  }
});
