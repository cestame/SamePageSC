import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { measuredRatings, publicAnalysis, summarizeLecture } from './recording.js';
import { keepEvidencedFields } from './contributions.js';

const lecture = {
  diarization: [
    { speaker: 'A', start: 0, end: 50 },
    { speaker: 'B', start: 50.5, end: 55 },
    { speaker: 'A', start: 55.5, end: 100 },
    { speaker: 'C', start: 100.2, end: 103 },
    { speaker: 'C', start: 103.5, end: 106 },
  ],
  turnLevelTranscription: [
    { speaker: 'A', start: 0, end: 50, text: 'Who can tell me what a pointer stores?' },
    { speaker: 'B', start: 50.5, end: 55, text: 'My name is Jamie and it stores an address' },
    { speaker: 'A', start: 55.5, end: 100, text: 'Right. Does everyone see why?' },
  ],
};

test('the speaker with the most talk time is the professor', () => {
  const out = summarizeLecture(lecture);
  assert.equal(out.professorShare, Math.round((100 * 94.5) / 106));
  assert.equal(out.professorQuestions, 2);
});

test('student words are never kept, only their timing', () => {
  const out = summarizeLecture(lecture);
  assert.ok(!out.professorTranscript.includes('Jamie'));
  assert.ok(!out.professorTranscript.includes('address'));
  assert.deepEqual(out.timeline.map((t) => t.who), ['professor', 'student', 'professor', 'student']);
});

test('segments from the same student close together merge into one turn', () => {
  assert.equal(summarizeLecture(lecture).studentTurns, 2);
});

test('the analysis sent to the browser leaves out the transcript', () => {
  assert.equal('professorTranscript' in publicAnalysis(summarizeLecture(lecture)), false);
});

test('a recording with no speech is rejected', () => {
  assert.throws(() => summarizeLecture({ diarization: [] }));
});

test('measured ratings say what they count', () => {
  const lectureHeavy = measuredRatings({ professorShare: 90, studentTurns: 2, professorQuestions: 1, durationSeconds: 3000 });
  assert.equal(lectureHeavy.format.value, 1);
  assert.equal(lectureHeavy.participation.value, 1);
  assert.match(lectureHeavy.format.evidence, /90% of the 50-minute class/);
  assert.match(lectureHeavy.participation.evidence, /students spoke 2 times in 50 minutes, and the professor asked the class 1 question\./);
  const discussion = measuredRatings({ professorShare: 35, studentTurns: 40, professorQuestions: 12, durationSeconds: 3000 });
  assert.equal(discussion.format.value, 5);
  assert.equal(discussion.participation.value, 5);
});

test('the sample recording runs through the same summary as a live one', () => {
  const sample = JSON.parse(readFileSync(new URL('./sample-recording.json', import.meta.url), 'utf8'));
  const out = summarizeLecture(sample.output);
  assert.ok(out.professorShare > 50);
  assert.ok(out.studentTurns > 0);
  assert.ok(!out.professorTranscript.includes('student words'));
});

test('extracted fields without evidence, or about the person, are dropped', () => {
  const field = (found, value, evidence) => ({ found, value, evidence });
  const { profile, dropped, found } = keepEvidencedFields({
    pace: field(true, 4.6, 'Covers two chapters a week'),
    format: field(false, 3, ''),
    structure: field(true, 5, 'She has a thick accent'),
    assessment: field(true, 2, 'Three midterms'),
    participation: field(false, 3, ''),
    guidance: field(false, 3, ''),
    workload: field(false, 3, ''),
  });
  assert.equal(profile.pace.value, 5);
  assert.equal(profile.format.value, null);
  assert.deepEqual(dropped, ['structure']);
  assert.equal(found, 2);
});
