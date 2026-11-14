import { QUESTIONS } from '../../../shared/content.js';
import type { Answers } from './api';

// Intake answers stay in the student's own browser. Storage can be unavailable (private mode),
// so every access is guarded and the app keeps working without it.
const KEY = 'trojan-fit:answers';
let inMemory: Partial<Answers> | null = null;

export function loadAnswers(): Partial<Answers> {
  if (inMemory) return inMemory;
  try {
    inMemory = JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<Answers>;
  } catch {
    inMemory = {};
  }
  return inMemory;
}

export function saveAnswers(answers: Partial<Answers>) {
  inMemory = answers;
  try {
    localStorage.setItem(KEY, JSON.stringify(answers));
  } catch {
    /* storage unavailable: answers live only for this visit */
  }
}

export function isComplete(answers: Partial<Answers>): answers is Answers {
  return QUESTIONS.every((q) => answers[q.key as keyof Answers] !== undefined);
}
