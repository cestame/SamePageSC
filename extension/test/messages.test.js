import test from 'node:test';
import assert from 'node:assert/strict';
import { MESSAGE_TYPES, validateAnswers, validateMessage, validateSection, validateSender } from '../src/lib/messages.js';

const EXT = 'abcdefghijklmnopabcdefghijklmnop';
const section = { courseCode: 'CSCI 103', sectionId: '29901', sectionNumber: '29901', type: 'Lecture', days: ['Mon', 'Wed'], start: 600, end: 710, instructor: 'Maya Reyes' };
const answers = { prior: 2, format: 3, structure: 4, assessment: 3, participation: 2, pace: 3, workload: 3, goal: 'foundation' };

test('only known message types get through', () => {
  assert.deepEqual([...MESSAGE_TYPES].sort(), ['explainSection', 'getPins', 'getState', 'lookupCourses', 'openSettings', 'pinSection', 'unpinSection']);
  assert.equal(validateMessage({ type: 'deleteEverything' }).ok, false);
  assert.equal(validateMessage({ type: 'toString' }).ok, false, 'inherited property names are not message types');
  assert.equal(validateMessage(null).ok, false);
  assert.equal(validateMessage('getState').ok, false);
});

test('messages with extra fields are rejected, so a page cannot smuggle answers or URLs in', () => {
  assert.equal(validateMessage({ type: 'getState' }).ok, true);
  assert.equal(validateMessage({ type: 'getState', apiOrigin: 'https://evil.example' }).ok, false);
  assert.equal(validateMessage({ type: 'explainSection', professorId: 3, answers }).ok, false);
});

test('course lookups are capped and must be real course codes', () => {
  assert.deepEqual(validateMessage({ type: 'lookupCourses', courses: ['CSCI 103', 'CSCI 103'] }).value.courses, ['CSCI 103']);
  assert.equal(validateMessage({ type: 'lookupCourses', courses: [] }).ok, false);
  assert.equal(validateMessage({ type: 'lookupCourses', courses: Array.from({ length: 13 }, (_, i) => `CSCI ${100 + i}`) }).ok, false);
  assert.equal(validateMessage({ type: 'lookupCourses', courses: ['<img src=x onerror=alert(1)>'] }).ok, false);
  assert.equal(validateMessage({ type: 'lookupCourses', courses: ['../../admin'] }).ok, false);
});

test('professor ids must be positive integers', () => {
  for (const professorId of [3, 9007199254740991]) assert.equal(validateMessage({ type: 'explainSection', professorId }).ok, true);
  for (const professorId of [0, -1, 1.5, '3', null, 2 ** 60]) assert.equal(validateMessage({ type: 'explainSection', professorId }).ok, false);
});

test('pinned sections are validated field by field', () => {
  assert.equal(validateSection(section).ok, true);
  assert.equal(validateSection({ ...section, extra: 1 }).ok, false);
  assert.equal(validateSection({ ...section, days: ['Mon', 'Mon'] }).ok, false);
  assert.equal(validateSection({ ...section, days: ['Funday'] }).ok, false);
  assert.equal(validateSection({ ...section, end: 500 }).ok, false);
  assert.equal(validateSection({ ...section, start: null, end: null }).ok, true);
  assert.equal(validateSection({ ...section, start: null }).ok, false);
  assert.equal(validateSection({ ...section, sectionNumber: '11111' }).ok, false);
  assert.equal(validateSection({ ...section, instructor: 'x'.repeat(81) }).ok, false);
  assert.equal(validateMessage({ type: 'pinSection', section }).ok, true);
});

test('answers follow the same rules as the server', () => {
  assert.equal(validateAnswers(answers).ok, true);
  assert.equal(validateAnswers({ ...answers, prior: 6 }).ok, false);
  assert.equal(validateAnswers({ ...answers, pace: '3' }).ok, false);
  assert.equal(validateAnswers({ ...answers, goal: 'vibes' }).ok, false);
  assert.equal(validateAnswers({ ...answers, learningStyle: 'visual' }).ok, false);
});

test('only this extension, on approved pages, can send messages', () => {
  const tab = { id: 1 };
  assert.equal(validateSender({ id: EXT, tab, origin: 'https://webreg.usc.edu', url: 'https://webreg.usc.edu/x' }, EXT), true);
  assert.equal(validateSender({ id: EXT, tab, origin: 'https://classes.usc.edu', url: 'https://classes.usc.edu/term' }, EXT), true);
  assert.equal(validateSender({ id: EXT, url: `chrome-extension://${EXT}/src/popup.html` }, EXT), true);
  assert.equal(validateSender({ id: EXT, tab, origin: 'https://evil.example', url: 'https://evil.example/' }, EXT), false);
  assert.equal(validateSender({ id: 'other-extension', tab, origin: 'https://webreg.usc.edu' }, EXT), false);
  assert.equal(validateSender({ id: EXT, tab, origin: 'https://webreg.usc.edu.evil.example' }, EXT), false);
  assert.equal(validateSender(undefined, EXT), false);
});
