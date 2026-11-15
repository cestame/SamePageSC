// Tests for the synthetic class generator used by /try-this-class/?synthetic=1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { synthesizeSection } from '../client/public/try-this-class/synthetic.js';

const html = readFileSync(new URL('../client/public/try-this-class/index.html', import.meta.url), 'utf8');
const LESSONS = JSON.parse(/<script type="application\/json" id="lessons">([\s\S]*?)<\/script>/.exec(html)[1]);
const profile = (overrides = {}) => ({ pace: 3, format: 3, structure: 3, assessment: 3, participation: 3, guidance: 3, workload: 3, ...overrides });
const make = (p, section = '29901', when = 'MW 10:00-11:50') => synthesizeSection({ course: 'CSCI 103', section, name: 'Dr. Maya Reyes', when, profile: p }, LESSONS);

test('the same section always gets the same synthetic class', () => {
  assert.deepEqual(make(profile()).data, make(profile()).data);
  assert.notDeepEqual(make(profile(), '29901').data.behavior, make(profile(), '29903').data.behavior);
});

test('every moment button has a step, and every step points at a recorded lesson step', () => {
  for (const p of [profile({ participation: 1, format: 1, structure: 1, guidance: 1 }), profile({ participation: 5, format: 5, structure: 5, guidance: 5 })]) {
    const { lesson } = make(p);
    for (const scene of ['open', 'question', 'studentq', 'engage', 'worked', 'close']) {
      assert.ok(lesson.steps.some((s) => s.scene === scene), `missing ${scene}`);
    }
    for (const s of lesson.steps) assert.ok(LESSONS[s.src.lesson].steps[s.src.step], 'step must exist in a recorded lesson');
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
  const early = make(profile(), '29905', 'MWF 08:00-08:50').data.behavior;
  const later = make(profile(), '29905', 'MWF 13:00-13:50').data.behavior;
  assert.ok(early.lateShare.value > later.lateShare.value);
  for (const v of Object.values(early)) assert.ok(Number.isFinite(v.value) && v.value >= 0 && v.rule.length > 10);
  assert.ok(early.enrolled.value <= 144);
});

test('a section without a profile still gets a full synthetic class, marked as such', () => {
  const { data, lesson } = synthesizeSection({ course: 'MATH 125', section: '39401', name: '', when: '', profile: null }, LESSONS);
  assert.match(data.profileSource, /synthetic/);
  assert.equal(lesson.name, 'The professor');
  assert.ok(lesson.steps.length >= 6);
});
