import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanText, courseIdsFor, headerKey, lastName, normalizeCourseCode, parseDays, parseRow, parseTimeRange } from '../src/lib/parse.js';

test('course codes normalize from the formats registration pages use', () => {
  assert.equal(normalizeCourseCode('CSCI-103: Object Oriented Programming'), 'CSCI 103');
  assert.equal(normalizeCourseCode('CSCI 103L'), 'CSCI 103L');
  assert.equal(normalizeCourseCode('WRIT150'), 'WRIT 150');
  assert.equal(normalizeCourseCode('Section 29901'), null);
  assert.equal(normalizeCourseCode('csci 103'), null, 'course codes are uppercase on the page; lowercase text is ignored');
});

test('course ids match the server rule and fall back to the base course', () => {
  assert.deepEqual(courseIdsFor('CSCI 103'), ['csci-103']);
  assert.deepEqual(courseIdsFor('CSCI 103L'), ['csci-103l', 'csci-103']);
});

test('time ranges parse in 12-hour, mixed and 24-hour forms', () => {
  assert.deepEqual(parseTimeRange('10:00am-11:50am'), { start: 600, end: 710, index: 0 });
  assert.equal(parseTimeRange('2:00-3:20pm').start, 14 * 60);
  assert.equal(parseTimeRange('11:00-12:20pm').start, 11 * 60, 'start stays in the morning when pm would put it after the end');
  assert.equal(parseTimeRange('12:00pm-12:50pm').start, 12 * 60);
  assert.equal(parseTimeRange('14:00-15:50').end, 15 * 60 + 50);
  assert.equal(parseTimeRange('TBA'), null);
  assert.equal(parseTimeRange('3:00pm-1:00pm'), null, 'an end before the start is rejected');
});

test('days parse from full names and compact codes, in week order', () => {
  assert.deepEqual(parseDays('Mon, Wed'), ['Mon', 'Wed']);
  assert.deepEqual(parseDays('Wednesday, Monday'), ['Mon', 'Wed']);
  assert.deepEqual(parseDays('MWF'), ['Mon', 'Wed', 'Fri']);
  assert.deepEqual(parseDays('TTh'), ['Tue', 'Thu']);
  assert.deepEqual(parseDays('TR'), ['Tue', 'Thu']);
  assert.deepEqual(parseDays('TBA'), []);
});

test('table headers map to fields', () => {
  assert.equal(headerKey('Section'), 'section');
  assert.equal(headerKey('Instructor'), 'instructor');
  assert.equal(headerKey('Days'), 'days');
  assert.equal(headerKey('Time'), 'time');
  assert.equal(headerKey('Registered'), 'seats');
  assert.equal(headerKey('Units'), 'units');
  assert.equal(headerKey('Notes'), null);
});

test('a row with columns becomes a section', () => {
  const s = parseRow({ section: '29901', type: 'Lecture', time: '10:00am-11:50am', days: 'Mon, Wed', instructor: 'Maya  Reyes', all: '' }, 'CSCI 103');
  assert.deepEqual(s, { courseCode: 'CSCI 103', sectionId: '29901', sectionNumber: '29901', type: 'Lecture', days: ['Mon', 'Wed'], start: 600, end: 710, instructor: 'Maya Reyes' });
});

test('a row without a days column reads days written before the time', () => {
  const s = parseRow({ all: '29950D Lecture TTh 2:00-3:20pm Kim' }, 'MATH 125');
  assert.equal(s.sectionId, '29950D');
  assert.equal(s.sectionNumber, '29950');
  assert.deepEqual(s.days, ['Tue', 'Thu']);
  assert.equal(s.start, 14 * 60);
});

test('header rows, note rows and rows without a course are skipped', () => {
  assert.equal(parseRow({ all: 'Section Type Time Days' }, 'CSCI 103'), null);
  assert.equal(parseRow({ all: '29901 Lecture' }, null), null);
});

test('page text is cleaned and capped', () => {
  assert.equal(cleanText('a\u0000b\n\n  c', 120), 'a b c');
  assert.equal(cleanText('x'.repeat(500), 80).length, 80);
});

test('last names compare loosely', () => {
  assert.equal(lastName('Dr. Maya Reyes'), 'reyes');
  assert.equal(lastName('Reyes, M.'), 'm', 'comma-first names fall back to the last word; section numbers are the primary match');
  assert.equal(lastName(''), '');
});
