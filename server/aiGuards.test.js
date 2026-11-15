import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countSentences, explanationProblems, isGroundedIn, replaceDashes } from './aiGuards.js';
import { keepEvidencedFields } from './contributions.js';

const source = 'Grading: two midterms and a final exam. The professor live-codes every new concept line by line.';

test('evidence quoted or closely paraphrased from the source is grounded', () => {
  assert.ok(isGroundedIn('two midterms and a final exam', source));
  assert.ok(isGroundedIn('live-coding of every new concept', source));
});

test('evidence that is not in the source is not grounded', () => {
  assert.equal(isGroundedIn('weekly group projects with presentations', source), false);
  assert.equal(isGroundedIn('', source), false);
});

test('replaceDashes turns em and en dashes into commas', () => {
  assert.equal(replaceDashes('Fast pace \u2014 lots of homework'), 'Fast pace, lots of homework');
  assert.equal(replaceDashes('Exams–mostly'), 'Exams, mostly');
});

test('countSentences counts plain sentences', () => {
  assert.equal(countSentences('One here. Two here! Three?'), 3);
  assert.equal(countSentences(''), 0);
});

const breakdown = [{ fit: 75 }, { fit: 50 }];

test('a clean explanation has no problems', () => {
  const out = { why: 'You wanted structure, and this class posts every date on day one.', watch_out: 'Exams are 75% of your grade here.' };
  assert.deepEqual(explanationProblems(out, { score: 82, breakdown }), []);
});

test('explanations are checked for invented numbers, learning styles, hype and missing parts', () => {
  const problems = (why, watch_out) => explanationProblems({ why, watch_out }, { score: 82, breakdown });
  assert.ok(problems('You are a 95% fit.', 'You may struggle.').some((p) => p.includes('fit number')));
  assert.ok(problems('You are a visual learner.', 'You may struggle.').some((p) => p.includes('learning styles')));
  assert.ok(problems('This seamless class fits you.', 'You may struggle.').some((p) => p.includes('hype')));
  assert.ok(problems('Fits you.', '').some((p) => p.includes('watch_out')));
  assert.ok(problems('The class is organized.', 'It is fast.').some((p) => p.includes('second person')));
});

test('keepEvidencedFields drops evidence missing from the source', () => {
  const missing = { found: false, value: 3, evidence: '' };
  const extracted = {
    pace: missing, format: missing, structure: missing, participation: missing, workload: missing,
    assessment: { found: true, value: 1, evidence: 'two midterms and a final exam' },
    guidance: { found: true, value: 1, evidence: 'weekly office hours with solutions' },
  };
  const { profile, ungrounded, found } = keepEvidencedFields(extracted, source);
  assert.equal(profile.assessment.value, 1);
  assert.equal(profile.guidance.value, null);
  assert.deepEqual(ungrounded, ['guidance']);
  assert.equal(found, 1);
});
