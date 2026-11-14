import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { LEARNING_STYLES_NOTE, QUESTIONS } from '../../../shared/content.js';
import { api, type Answers } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { isComplete, loadAnswers, saveAnswers } from '../lib/storage';
import { Button, QuizQuestion } from '../components/ui';

const ADVANCE_DELAY_MS = 220;

function firstUnanswered(answers: Partial<Answers>) {
  const index = QUESTIONS.findIndex((q) => answers[q.key as keyof Answers] === undefined);
  return index === -1 ? 0 : index;
}

export function Intake({ courseId }: { courseId: string | null }) {
  const [answers, setAnswers] = useState<Partial<Answers>>(loadAnswers);
  const [index, setIndex] = useState(() => firstUnanswered(loadAnswers()));
  const [courses] = useAsync(api.courses, []);

  const question = QUESTIONS[index];
  const isLast = index === QUESTIONS.length - 1;
  const course = courses.status === 'success' ? courses.data.find((c) => c.id === courseId) : undefined;

  function choose(value: string | number) {
    const next = { ...answers, [question.key]: value };
    setAnswers(next);
    saveAnswers(next);
    if (!isLast) window.setTimeout(() => setIndex((i) => Math.min(i + 1, QUESTIONS.length - 1)), ADVANCE_DELAY_MS);
  }

  return (
    <>
      <h1 className="visually-hidden">Questions about how you like to learn</h1>
      <div className="progress" aria-label={`Question ${index + 1} of ${QUESTIONS.length}`}>
        <span className="text-heading" aria-hidden>{index + 1} of {QUESTIONS.length}</span>
        <div className="progress__track" aria-hidden>
          <motion.div
            className="progress__fill"
            initial={false}
            animate={{ scaleX: (index + (answers[question.key as keyof Answers] !== undefined ? 1 : 0)) / QUESTIONS.length }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={question.key}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
        >
          <QuizQuestion
            id={`q-${question.key}`}
            question={question.question}
            options={question.options}
            value={answers[question.key as keyof Answers]}
            onSelect={choose}
          />
        </motion.div>
      </AnimatePresence>

      {index === 0 && <p className="text-small text-muted">{LEARNING_STYLES_NOTE}</p>}

      <div className="row-between">
        {index > 0
          ? <Button variant="quiet" icon={<ArrowLeft size={18} aria-hidden />} onClick={() => setIndex(index - 1)}>Previous question</Button>
          : <span />}
        {isComplete(answers) && <FinishButton courseId={courseId} courseCode={course?.code} />}
      </div>
    </>
  );
}

function FinishButton({ courseId, courseCode }: { courseId: string | null; courseCode?: string }) {
  if (!courseId) {
    return <Button href="#/" iconAfter={<ArrowRight size={18} aria-hidden />}>Pick a class to see your matches</Button>;
  }
  return (
    <Button href={`#/matches?course=${courseId}`} iconAfter={<ArrowRight size={18} aria-hidden />}>
      See my matches for {courseCode ?? 'this class'}
    </Button>
  );
}
