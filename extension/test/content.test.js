import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderQuestionsModule } from '../scripts/build-content.mjs';
import { CONTENT } from '../src/generated/questions.js';
import { matchProfile } from '../src/content-main.js';

test('extension questions are generated from shared/content.js and up to date', () => {
  const onDisk = readFileSync(new URL('../src/generated/questions.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  assert.equal(onDisk, renderQuestionsModule(), 'run: npm run build:extension');
});

test('the extension asks the same 8 questions, and none about learning styles', () => {
  assert.deepEqual(CONTENT.questions.map((q) => q.key), ['prior', 'workload', 'format', 'structure', 'assessment', 'participation', 'pace', 'goal']);
  assert.doesNotMatch(JSON.stringify(CONTENT.questions), /visual|auditory|kinesthetic/i);
});

test('profiles match by section number before instructor name', () => {
  const list = [
    { professorId: 1, name: 'Dr. Maya Reyes', section: '29901' },
    { professorId: 2, name: 'Prof. Daniel Okafor', section: '29903' },
  ];
  const s = (sectionNumber, instructor) => ({ sectionNumber, instructor });
  assert.equal(matchProfile(list, s('29903', 'Maya Reyes')).professorId, 2, 'section number wins over a mismatched name');
  assert.equal(matchProfile(list, s('99999', 'Maya Reyes')).professorId, 1);
  assert.equal(matchProfile(list, s('99999', 'Alex Morgan')), null);
  assert.equal(matchProfile(undefined, s('29901', '')), null);
});
