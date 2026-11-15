// Tests for the synthetic class generator used by /try-this-class/?synthetic=1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { synthesizeSection } from '../client/public/try-this-class/synthetic.js';

const dir = new URL('../client/public/try-this-class/', import.meta.url);
const html = readFileSync(new URL('index.html', dir), 'utf8');
const LESSONS = JSON.parse(/<script type="application\/json" id="lessons">([\s\S]*?)<\/script>/.exec(html)[1]);
const COURSES = JSON.parse(readFileSync(new URL('courses.json', dir), 'utf8'));
const profile = (overrides = {}) => ({ pace: 3, format: 3, structure: 3, assessment: 3, participation: 3, guidance: 3, workload: 3, ...overrides });
const make = (p, { course = 'CSCI 103', section = '29901', when = 'MW 10:00-11:50', voice = 'f' } = {}) =>
  synthesizeSection({ course, section, name: 'Dr. Maya Reyes', when, voice, profile: p }, LESSONS);
const extremes = [profile({ participation: 1, format: 1, structure: 1, guidance: 1 }), profile({ participation: 5, format: 5, structure: 5, guidance: 5 })];

test('the same section always gets the same synthetic class', () => {
  assert.deepEqual(make(profile()).data, make(profile()).data);
  assert.notDeepEqual(make(profile(), { section: '29901' }).data.behavior, make(profile(), { section: '29903' }).data.behavior);
});

test('each sample course teaches its own subject, and every role it can use exists', () => {
  for (const courseId of Object.keys(COURSES)) {
    const code = courseId.toUpperCase().replace('-', ' ');
    for (const p of extremes) {
      const { lesson, data } = make(p, { course: code });
      assert.equal(lesson.topic, COURSES[courseId].topic);
      assert.match(data.lessonTopic, new RegExp(COURSES[courseId].title));
      for (const s of lesson.steps) {
        assert.equal(s.src.course, courseId);
        assert.ok(COURSES[courseId].roles[s.src.role]?.say, `${courseId} is missing ${s.src.role}`);
      }
      for (const scene of ['open', 'question', 'studentq', 'engage', 'worked', 'close']) assert.ok(lesson.steps.some((s) => s.scene === scene), `${courseId} missing ${scene}`);
    }
  }
});

test('the professor voice follows the data', () => {
  assert.equal(make(profile(), { voice: 'f' }).lesson.voiceGender, 'f');
  assert.equal(make(profile(), { voice: 'm' }).lesson.voiceGender, 'm');
  assert.equal(make(profile(), { voice: 'm' }).lesson.voice, 'A');
});

test('every course clip the simulation can ask for was rendered', () => {
  for (const [courseId, course] of Object.entries(COURSES)) {
    for (const [role, step] of Object.entries(course.roles)) {
      const count = (text) => (String(text ?? '').match(/[^.!?]+[.!?]*/g) ?? []).filter((s) => s.trim()).length;
      for (const part of ['say', 'then']) {
        for (let n = 0; n < count(step[part]); n++) {
          for (const g of ['f', 'm']) assert.ok(existsSync(new URL(`audio/courses/${courseId}/${g}-${role}-${part}-${n}.mp3`, dir)), `${courseId} ${g}-${role}-${part}-${n}`);
        }
      }
      for (let n = 0; n < count(step.ask); n++) assert.ok(existsSync(new URL(`audio/courses/${courseId}/student-${role}-ask-${n}.mp3`, dir)));
    }
  }
});

test('the profile drives the class', () => {
  const quiet = make(profile({ participation: 1, format: 1 })).lesson;
  const active = make(profile({ participation: 5, format: 5 })).lesson;
  assert.ok(active.wait > quiet.wait, 'more participation means a longer wait after questions');
  assert.ok(active.laptop < quiet.laptop, 'lecture-heavy classes have more laptops open');
  assert.ok(active.steps.some((s) => s.move === 'pair') && !quiet.steps.some((s) => s.move === 'pair'));
  assert.ok(active.steps.some((s) => s.tool === 'poll'));
});

test('early classes have more late arrivals, and numbers stay in range', () => {
  const early = make(profile(), { section: '29905', when: 'MWF 08:00-08:50' }).data.behavior;
  const later = make(profile(), { section: '29905', when: 'MWF 13:00-13:50' }).data.behavior;
  assert.ok(early.lateShare.value > later.lateShare.value);
  for (const v of Object.values(early)) assert.ok(Number.isFinite(v.value) && v.value >= 0 && v.rule.length > 10);
  assert.ok(early.enrolled.value <= 144);
});

test('a course without content falls back to the recorded sample lesson, and says so', () => {
  const { data, lesson } = synthesizeSection({ course: 'PHYS 151', section: '47000', name: '', when: '', voice: null, profile: null }, LESSONS);
  assert.match(data.profileSource, /synthetic/);
  assert.match(data.lessonTopic, /No course content yet/);
  assert.equal(lesson.name, 'The professor');
  for (const s of lesson.steps) assert.ok(LESSONS[s.src.lesson].steps[s.src.step]);
});
