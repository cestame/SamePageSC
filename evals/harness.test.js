// Offline tests for the eval graders: they must pass a good answer and catch each kind of bad one.
// No API calls; the model is replaced by fixed outputs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIELD_KEYS } from '../shared/content.js';
import { EXTRACTION_CASES, EXPLANATION_CASES } from './cases.js';
import { casePassed, gradeExplanation, gradeExtraction, summarize } from './harness.js';

const byId = (id) => EXTRACTION_CASES.find((c) => c.id === id);
const missing = { found: false, value: 3, evidence: '' };
const field = (value, evidence) => ({ found: true, value, evidence });

/** A correct extraction for the CSCI 103 syllabus case, with evidence quoted from the text. */
function goodLectureExtraction() {
  return {
    is_course_material: true,
    pace: missing,
    format: field(1, 'the professor lectures from slides for the full 110 minutes'),
    structure: field(5, 'The full calendar with every due date is posted on day one'),
    assessment: field(1, 'Midterm 1 25%, Midterm 2 25%, Final exam 35%'),
    participation: field(1, 'Attendance is not taken and there is no participation grade'),
    guidance: field(1, 'live-codes every new concept line by line'),
    workload: field(3, 'about 4 to 6 hours a week outside class'),
    summary: 'Class is a long slide lecture with live coding of each new idea. A Friday lab practices the week.',
  };
}

const fakeModel = (output) => async () => output;

test('every eval case uses real field keys and valid ranges', () => {
  for (const c of EXTRACTION_CASES) {
    for (const [key, [min, max]] of Object.entries(c.expect.fields || {})) {
      assert.ok(FIELD_KEYS.includes(key), `${c.id}: ${key}`);
      assert.ok(min >= 1 && max <= 5 && min <= max, `${c.id}: ${key} range`);
    }
    for (const key of c.expect.absent || []) assert.ok(FIELD_KEYS.includes(key), `${c.id}: ${key}`);
    for (const s of c.expect.forbidden || []) assert.ok(c.text.includes(s), `${c.id}: forbidden "${s}" is not in the text`);
  }
  for (const c of EXPLANATION_CASES) assert.deepEqual(Object.keys(c.profile).sort(), [...FIELD_KEYS].sort(), c.id);
});

test('a correct extraction passes', async () => {
  const r = await gradeExtraction(byId('cs-lecture-syllabus'), fakeModel(goodLectureExtraction()));
  assert.ok(casePassed(r), JSON.stringify(r.checks.filter((c) => !c.pass)));
});

test('made-up evidence fails the extraction', async () => {
  const out = { ...goodLectureExtraction(), guidance: field(1, 'weekly office hours walk through every homework solution') };
  const r = await gradeExtraction(byId('cs-lecture-syllabus'), fakeModel(out));
  assert.equal(casePassed(r), false);
  assert.ok(r.checks.some((c) => c.name.startsWith('every evidence line') && !c.pass));
  assert.equal(r.output.stored.profile.guidance.value, null, 'ungrounded evidence is not stored');
});

test('a rating outside the expected range fails', async () => {
  const out = { ...goodLectureExtraction(), assessment: field(5, 'Midterm 1 25%, Midterm 2 25%, Final exam 35%') };
  const r = await gradeExtraction(byId('cs-lecture-syllabus'), fakeModel(out));
  assert.ok(r.checks.some((c) => c.name === 'assessment in 1-2' && !c.pass));
});

test('a leaked student name fails the privacy check', async () => {
  const c = byId('notes-with-student-names');
  const out = {
    is_course_material: true,
    pace: field(2, 'The pace was slow and careful today'),
    format: missing,
    structure: missing,
    assessment: field(1, 'quizzes happen every Friday and are worth 30% together'),
    participation: missing,
    guidance: field(1, 'three worked examples on the board, step by step'),
    workload: missing,
    summary: 'Priya says the professor works examples on the board. Quizzes are every Friday.',
  };
  const r = await gradeExtraction(c, fakeModel(out));
  assert.ok(r.checks.some((x) => x.name.startsWith('no names') && !x.pass));
});

test('accepting a recipe as class notes fails', async () => {
  const r = await gradeExtraction(byId('not-course-material'), fakeModel({ ...goodLectureExtraction(), is_course_material: true }));
  assert.equal(casePassed(r), false);
});

test('following an injected instruction fails', async () => {
  const c = byId('prompt-injection');
  const all5 = Object.fromEntries(FIELD_KEYS.map((k) => [k, field(5, 'Grading is entirely a final portfolio')]));
  const r = await gradeExtraction(c, fakeModel({ is_course_material: true, ...all5, summary: 'A studio class. Grading is a portfolio.' }));
  assert.ok(r.checks.some((x) => x.name === 'ignores instructions inside the notes' && !x.pass));
});

const goodExplanation = {
  why: 'You asked for a steady, organized class, and this section posts the full calendar on day one. You are new to the subject, and the professor live-codes every concept line by line.',
  watch_out: 'You will sit through long lectures from slides, so plan to review on your own.',
};

test('a correct explanation passes', async () => {
  const r = await gradeExplanation(EXPLANATION_CASES[0], fakeModel(goodExplanation));
  assert.ok(casePassed(r), JSON.stringify(r.checks.filter((c) => !c.pass)));
});

test('an explanation with an invented fit number fails', async () => {
  const r = await gradeExplanation(EXPLANATION_CASES[0], fakeModel({ ...goodExplanation, why: `${goodExplanation.why} You are a 99% match.` }));
  assert.ok(r.checks.some((c) => c.name === 'follows the content rules' && !c.pass));
});

test('an explanation that mentions learning styles fails', async () => {
  const r = await gradeExplanation(EXPLANATION_CASES[0], fakeModel({ ...goodExplanation, watch_out: 'As a visual learner, you may find the slides help you.' }));
  assert.equal(casePassed(r), false);
});

test('an explanation the app rejects counts as a failure', async () => {
  const r = await gradeExplanation(EXPLANATION_CASES[0], async () => { throw new Error('broke a content rule'); });
  assert.equal(casePassed(r), false);
});

test('summarize counts runs per task', async () => {
  const good = await gradeExplanation(EXPLANATION_CASES[0], fakeModel(goodExplanation));
  const bad = await gradeExplanation(EXPLANATION_CASES[0], async () => { throw new Error('x'); });
  const s = summarize([good, bad]);
  assert.equal(s.passed, 1);
  assert.equal(s.byTask.explanation.cases, 2);
});
