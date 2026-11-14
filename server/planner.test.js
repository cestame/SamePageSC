import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSchedule, overlaps, planSchedule } from './planner.js';

test('parses meeting times', () => {
  assert.deepEqual(parseSchedule('MWF 09:00-09:50'), { days: ['M', 'W', 'F'], start: 540, end: 590 });
  assert.deepEqual(parseSchedule('TTh 14:00-15:20').days, ['T', 'Th']);
  assert.equal(parseSchedule('TBA'), null);
});

test('detects overlaps only on shared days', () => {
  assert.ok(overlaps(parseSchedule('MW 10:00-11:50'), parseSchedule('MWF 10:00-10:50')));
  assert.ok(!overlaps(parseSchedule('MW 10:00-11:50'), parseSchedule('TTh 10:00-11:50')));
  assert.ok(!overlaps(parseSchedule('MW 10:00-11:00'), parseSchedule('MW 11:00-12:00')));
});

const courses = [
  { courseId: 'a', sections: [{ id: 1, score: 90, schedule: 'MW 10:00-11:50' }, { id: 2, score: 60, schedule: 'TTh 14:00-15:50' }] },
  { courseId: 'b', sections: [{ id: 3, score: 95, schedule: 'MWF 10:00-10:50' }, { id: 4, score: 70, schedule: 'MW 12:00-13:20' }] },
];

test('picks the highest total fit without conflicts', () => {
  const plan = planSchedule(courses);
  // 1+4 = 160 beats 2+3 = 155, and 1+3 overlaps.
  assert.equal(plan.a.chosenId, 1);
  assert.equal(plan.b.chosenId, 4);
  assert.equal(plan.b.sections.find((s) => s.id === 3).status, 'unavailable');
  assert.equal(plan.b.sections.find((s) => s.id === 3).conflictWith, 'a');
});

test('respects the earliest start time', () => {
  const plan = planSchedule(courses, { earliest: 11 * 60 });
  assert.equal(plan.a.chosenId, 2);
  assert.equal(plan.a.sections.find((s) => s.id === 1).reason, 'starts-too-early');
});

test('keeps a section the student locked in', () => {
  const plan = planSchedule(courses, {}, { b: 3 });
  assert.equal(plan.b.chosenId, 3);
  assert.equal(plan.a.chosenId, 2);
});
