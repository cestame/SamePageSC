import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { GENERAL_QUESTIONS, LEARNING_STYLES_NOTE, TIME_QUESTIONS } from '../../../shared/content.js';
import { navigate } from '../lib/hooks';
import { setupComplete, useProfile, type StudentProfile } from '../lib/storage';
import { Button, QuizQuestion } from '../components/ui';
import { ClassesStep, MajorStep } from './SetupSteps';

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
          {step.kind === 'major' && <MajorStep profile={profile} update={update} onNext={next} />}
          {step.kind === 'classes' && <ClassesStep profile={profile} update={update} onNext={next} />}
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
          <Button onClick={() => navigate('#/home')} iconAfter={<ArrowRight size={18} aria-hidden />}>See my schedule</Button>
        )}
      </div>
    </div>
  );
}

