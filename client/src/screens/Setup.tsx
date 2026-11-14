import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { GENERAL_QUESTIONS, LEARNING_STYLES_NOTE, MAJOR_SUGGESTIONS, TIME_QUESTIONS } from '../../../shared/content.js';
import { api, type Course } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { setupComplete, useProfile, type StudentProfile } from '../lib/storage';
import { ProfileLine } from '../components/ProfileLine';
import { Button, ErrorState, LoadingState, QuizQuestion } from '../components/ui';

type Question = (typeof GENERAL_QUESTIONS)[number];
type Step =
  | { kind: 'major'; key: 'major' }
  | { kind: 'classes'; key: 'classes' }
  | { kind: 'general'; key: string; question: Question }
  | { kind: 'time'; key: string; question: Question };

const STEPS: Step[] = [
  { kind: 'major', key: 'major' },
  { kind: 'classes', key: 'classes' },
  ...GENERAL_QUESTIONS.map((q) => ({ kind: 'general' as const, key: q.key, question: q })),
  ...TIME_QUESTIONS.map((q) => ({ kind: 'time' as const, key: q.key, question: q as Question })),
];

const ADVANCE_DELAY_MS = 220;

function isAnswered(p: StudentProfile, step: Step) {
  if (step.kind === 'major') return p.major.trim() !== '';
  if (step.kind === 'classes') return p.courseIds.length > 0;
  const bucket = step.kind === 'general' ? p.general : p.time;
  return (bucket as Record<string, unknown>)[step.key] !== undefined;
}

function startIndex(p: StudentProfile, requested: string | null) {
  const asked = STEPS.findIndex((s) => s.key === requested);
  if (asked !== -1) return asked;
  const firstOpen = STEPS.findIndex((s) => !isAnswered(p, s));
  return firstOpen === -1 ? 0 : firstOpen;
}

export function Setup({ requestedStep }: { requestedStep: string | null }) {
  const [profile, update] = useProfile();
  const [index, setIndex] = useState(() => (profile ? startIndex(profile, requestedStep) : 0));
  if (!profile) return null;

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const next = () => setIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const answeredHere = isAnswered(profile, step);

  function answer(value: string | number) {
    update((p) => (step.kind === 'general'
      ? { ...p, general: { ...p.general, [step.key]: value } }
      : { ...p, time: { ...p.time, [step.key]: value } }));
    if (!isLast) window.setTimeout(next, ADVANCE_DELAY_MS);
  }

  return (
    <div className="setup">
      <h1 className="visually-hidden">Set up your profile</h1>
      <div className="progress" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
        <span className="text-heading" aria-hidden>{index + 1} of {STEPS.length}</span>
        <div className="progress__track" aria-hidden>
          <motion.div className="progress__fill" initial={false} animate={{ scaleX: (index + (answeredHere ? 1 : 0)) / STEPS.length }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step.key} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
          {step.kind === 'major' && <MajorStep profile={profile} onChange={(major) => update((p) => ({ ...p, major }))} onNext={next} />}
          {step.kind === 'classes' && <ClassesStep profile={profile} onToggle={(id) => update((p) => toggleCourse(p, id))} onNext={next} />}
          {(step.kind === 'general' || step.kind === 'time') && (
            <QuizQuestion
              id={`q-${step.key}`}
              question={step.question.question}
              options={step.question.options}
              value={(step.kind === 'general' ? profile.general : profile.time)[step.key as never]}
              onSelect={answer}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {step.key === GENERAL_QUESTIONS[0].key && <p className="text-small text-muted">{LEARNING_STYLES_NOTE}</p>}

      <div className="row-between">
        {index > 0
          ? <Button variant="quiet" icon={<ArrowLeft size={18} aria-hidden />} onClick={() => setIndex(index - 1)}>Previous</Button>
          : <span />}
        {setupComplete(profile) && (
          <Button href="#/home" iconAfter={<ArrowRight size={18} aria-hidden />}>See my schedule</Button>
        )}
      </div>
    </div>
  );
}

function toggleCourse(p: StudentProfile, id: string): StudentProfile {
  const has = p.courseIds.includes(id);
  return { ...p, courseIds: has ? p.courseIds.filter((c) => c !== id) : [...p.courseIds, id] };
}

function MajorStep({ profile, onChange, onNext }: { profile: StudentProfile; onChange: (v: string) => void; onNext: () => void }) {
  return (
    <form className="quiz" onSubmit={(e) => { e.preventDefault(); if (profile.major.trim()) onNext(); }}>
      <h2 className="text-display">What's your major, {profile.name}?</h2>
      <div className="stack-3">
        <label className="field">
          <span className="field__label">Major</span>
          <input className="input" id="major" type="text" list="majors" maxLength={80} value={profile.major} onChange={(e) => onChange(e.target.value)} placeholder="Start typing, or pick a suggestion" />
          <datalist id="majors">{MAJOR_SUGGESTIONS.map((m) => <option key={m} value={m} />)}</datalist>
        </label>
        <div><Button type="submit" disabled={!profile.major.trim()} iconAfter={<ArrowRight size={18} aria-hidden />}>Next: pick your classes</Button></div>
      </div>
    </form>
  );
}

function ClassesStep({ profile, onToggle, onNext }: { profile: StudentProfile; onToggle: (id: string) => void; onNext: () => void }) {
  const [courses, retry] = useAsync(api.courses, []);
  return (
    <div className="quiz">
      <div className="stack-3">
        <h2 className="text-display">Which classes do you need to take this semester?</h2>
        <p className="text-small text-muted">Pick the ones your {profile.major || 'major'} requires, or any you're considering. Only classes that students have added notes for are listed so far.</p>
      </div>
      <div className="stack-3">
        {courses.status === 'loading' && <LoadingState label="Loading classes" lines={3} />}
        {courses.status === 'error' && <ErrorState title="We couldn't load the classes" error={courses.error} onRetry={retry} />}
        {courses.status === 'success' && (
          <div className="stack-3" role="group" aria-label="Classes">
            {courses.data.map((c) => <CourseToggle key={c.id} course={c} selected={profile.courseIds.includes(c.id)} onToggle={() => onToggle(c.id)} />)}
          </div>
        )}
        <div>
          <Button disabled={profile.courseIds.length === 0} onClick={onNext} iconAfter={<ArrowRight size={18} aria-hidden />}>
            {profile.courseIds.length === 0 ? 'Pick at least one class' : `Next: how you like to learn (${profile.courseIds.length} class${profile.courseIds.length === 1 ? '' : 'es'} picked)`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CourseToggle({ course, selected, onToggle }: { course: Course; selected: boolean; onToggle: () => void }) {
  return (
    <motion.button type="button" className={selected ? 'course-option course-option--selected' : 'course-option'} aria-pressed={selected} onClick={onToggle} whileTap={{ scale: 0.98 }}>
      <span className="stack-1 min-0">
        <span className="row">
          <span className="text-title">{course.code}</span>
          {selected && <CheckCircle className="course-option__check" size={22} weight="fill" aria-hidden />}
        </span>
        <span className="text-small text-muted">{course.title}, {course.sections.length} sections</span>
      </span>
      <span className="course-option__shapes" aria-hidden>
        {course.sections.slice(0, 4).map((s) => (
          <ProfileLine key={s.id} values={Object.fromEntries(Object.entries(s.profile).map(([k, v]) => [k, v.value]))} size="glyph" label={s.name} />
        ))}
      </span>
    </motion.button>
  );
}
