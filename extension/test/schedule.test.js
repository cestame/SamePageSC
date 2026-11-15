import test from 'node:test';
import assert from 'node:assert/strict';
import { dayLoad, findConflicts, formatClock, overlaps, timeFlags } from '../src/lib/schedule.js';

const sec = (courseCode, sectionId, days, start, end) => ({ courseCode, sectionId, sectionNumber: sectionId.slice(0, 5), type: 'Lecture', days, start, end, instructor: '' });
const a = sec('CSCI 103', '29901', ['Mon', 'Wed'], 600, 710);
const b = sec('MATH 125', '39403', ['Mon', 'Wed', 'Fri'], 660, 710);
const c = sec('WRIT 150', '64101', ['Tue', 'Thu'], 570, 650);
const tba = sec('ECON 203', '26301', [], null, null);

test('sections overlap only on a shared day and time', () => {
  assert.equal(overlaps(a, b), true);
  assert.equal(overlaps(a, c), false);
  assert.equal(overlaps(a, sec('X 100', '10000', ['Mon'], 710, 800)), false, 'back-to-back is not an overlap');
  assert.equal(overlaps(a, a), false, 'a section never conflicts with itself');
  assert.equal(overlaps(a, tba), false, 'sections without a time are never flagged');
});

test('conflicts list every overlapping pair once', () => {
  assert.deepEqual(findConflicts([a, b, c]).map(([x, y]) => [x.sectionId, y.sectionId]), [['29901', '39403']]);
});

test('early and late flags say the actual time', () => {
  assert.deepEqual(timeFlags(sec('MATH 125', '39401', ['Mon'], 480, 530)), [{ key: 'early', label: 'Starts at 8:00am' }]);
  assert.deepEqual(timeFlags(sec('CSCI 103', '29907', ['Tue'], 1080, 1190)), [{ key: 'late', label: 'Ends at 7:50pm' }]);
  assert.deepEqual(timeFlags(a), []);
});

test('clock formatting handles noon and midnight', () => {
  assert.equal(formatClock(0), '12:00am');
  assert.equal(formatClock(12 * 60), '12:00pm');
  assert.equal(formatClock(13 * 60 + 5), '1:05pm');
});

test('day load finds the busiest day', () => {
  const { load, busiest } = dayLoad([a, b, c]);
  assert.equal(load.Mon, 110 + 50);
  assert.equal(busiest, 'Mon');
  assert.equal(dayLoad([]).busiest, null);
});
