import { useCallback, useState } from 'react';
import { COURSE_QUESTIONS, GENERAL_QUESTIONS, TIME_QUESTIONS } from '../../../shared/content.js';
import type { Answers } from './api';

// The student's profile lives only in their own browser: there are no server accounts.
// Storage can be unavailable (private windows), so access is guarded and an in-memory copy is kept.

export type GeneralAnswers = Pick<Answers, 'format' | 'structure' | 'assessment' | 'participation' | 'pace' | 'goal'>;
export type CourseAnswers = Pick<Answers, 'prior' | 'workload'>;

export type StudentProfile = {
  name: string;
  major: string;
  courseIds: string[];
  general: Partial<GeneralAnswers>;
  time: { earliest?: number; latest?: number };
  perCourse: Record<string, Partial<CourseAnswers>>;
  /** Sections the student picked by hand, by course id. */
  locked: Record<string, number>;
};

const KEY = 'trojan-fit:profile';
let inMemory: StudentProfile | null | undefined;

export function newProfile(name: string): StudentProfile {
  return { name, major: '', courseIds: [], general: {}, time: {}, perCourse: {}, locked: {} };
}

export function loadProfile(): StudentProfile | null {
  if (inMemory !== undefined) return inMemory;
  try {
    const raw = localStorage.getItem(KEY);
    inMemory = raw ? (JSON.parse(raw) as StudentProfile) : null;
  } catch {
    inMemory = null;
  }
  return inMemory;
}

export function saveProfile(profile: StudentProfile | null) {
  inMemory = profile;
  try {
    if (profile) localStorage.setItem(KEY, JSON.stringify(profile));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: the profile lives only for this visit */
  }
}

/** React state bound to the stored profile. */
export function useProfile() {
  const [profile, setProfile] = useState(loadProfile);
  const update = useCallback((change: (p: StudentProfile) => StudentProfile) => {
    setProfile((current) => {
      if (!current) return current;
      const next = change(current);
      saveProfile(next);
      return next;
    });
  }, []);
  return [profile, update] as const;
}

const has = (obj: object, key: string) => (obj as Record<string, unknown>)[key] !== undefined;

export function setupComplete(p: StudentProfile) {
  return p.major.trim() !== ''
    && p.courseIds.length > 0
    && GENERAL_QUESTIONS.every((q) => has(p.general, q.key))
    && TIME_QUESTIONS.every((q) => has(p.time, q.key));
}

export function courseReady(p: StudentProfile, courseId: string) {
  const answers = p.perCourse[courseId] ?? {};
  return COURSE_QUESTIONS.every((q) => has(answers, q.key));
}

/** Full answers for one class: the general answers plus that class's two questions. */
export function answersFor(p: StudentProfile, courseId: string): Answers | null {
  if (!courseReady(p, courseId)) return null;
  return { ...(p.general as GeneralAnswers), ...(p.perCourse[courseId] as CourseAnswers) };
}
