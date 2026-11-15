import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCode, sameInstructor, lookupSections } from './sections.js';
import { scoreProfile, validateAnswers } from './scoring.js';

test('course codes match across webReg and catalogue spellings', () => {
  assert.equal(normalizeCode('CSCI 103L'), 'CSCI103');
  assert.equal(normalizeCode('csci-103'), 'CSCI103');
  assert.equal(normalizeCode('WRIT 150'), 'WRIT150');
  assert.equal(normalizeCode('Lecture'), null);
});

test('instructor names match by their parts, in any order', () => {
  assert.ok(sameInstructor('Reyes, Maya', 'Maya Reyes'));
  assert.ok(sameInstructor('Dr. Maya Reyes', 'Reyes'));
  assert.ok(!sameInstructor('Maya Chen', 'Maya Reyes'));
  assert.ok(!sameInstructor('', 'Maya Reyes'));
});

const field = (value) => ({ value, evidence: [] });
const profile = Object.fromEntries(['pace', 'format', 'structure', 'assessment', 'participation', 'guidance', 'workload'].map((k) => [k, field(3)]));
const general = { format: 2, structure: 4, assessment: 3, participation: 2, pace: 3, goal: 'foundation' };
const courses = [{ id: 'csci-103', code: 'CSCI 103' }];
const professors = [
  { id: 1, name: 'Ada Sample', is_sample: true, profile },
  { id: 2, name: 'Maya Reyes', is_sample: false, profile },
];
const lookup = (perCourse, sections, generalAnswers = general) => lookupSections({
  sections, general: generalAnswers, perCourse, courses,
  professorsFor: async () => professors, score: scoreProfile, validate: validateAnswers,
});

test('only real contributed profiles match webReg sections', async () => {
  const [sample, real, unknown] = await lookup({ 'csci-103': { prior: 2, workload: 3 } }, [
    { key: 'a', code: 'CSCI 103L', instructors: ['Sample, Ada'] },
    { key: 'b', code: 'CSCI 103L', instructors: ['Reyes, Maya'] },
    { key: 'c', code: 'HIST 100', instructors: ['Reyes, Maya'] },
  ]);
  assert.equal(sample.status, 'no-notes');
  assert.equal(real.status, 'scored');
  assert.equal(real.professorId, 2);
  assert.ok(real.score >= 0 && real.score <= 100);
  assert.equal(unknown.status, 'no-notes');
});

test('says which answers are missing instead of guessing', async () => {
  const [needsAnswers] = await lookup({}, [{ key: 'b', code: 'CSCI 103', instructors: ['Maya Reyes'] }]);
  assert.equal(needsAnswers.status, 'needs-answers');
  const [needsSetup] = await lookup({}, [{ key: 'b', code: 'CSCI 103', instructors: ['Maya Reyes'] }], {});
  assert.equal(needsSetup.status, 'needs-setup');
});
