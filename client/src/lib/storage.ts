import { useCallback, useState } from 'react';
import { COURSE_QUESTIONS, GENERAL_QUESTIONS, TIME_QUESTIONS } from '../../../shared/content.js';
import { api, type Answers, type User } from './api';

// A signed-in student's profile is saved to their account on the server. A guest's profile lives only
// in their browser. Browser storage can be unavailable (private windows), so an in-memory copy is kept.

export type GeneralAnswers = Pick<Answers, 'format' | 'structure' | 'assessment' | 'participation' | 'pace' | 'goal'>;
export type CourseAnswers = Pick<Answers, 'prior' | 'workload'>;

export type StudentProfile = {
  name: string;
  major: string;
  /** The program's id in the USC Catalogue, used to look up its requirements. */
  majorPoid?: number;
  courseIds: string[];
  general: Partial<GeneralAnswers>;
  time: { earliest?: number; latest?: number };
  perCourse: Record<string, Partial<CourseAnswers>>;
  /** Sections the student picked by hand, by course id. */
  locked: Record<string, number>;
};

const KEY = 'trojan-fit:profile';
const SAVE_DELAY_MS = 400;
let inMemory: StudentProfile | null | undefined;
let account: User | null = null;
let saveTimer: number | undefined;

export const currentUser = () => account;

/** Called once on load: a valid session cookie means the profile comes from the account. */
export async function restoreSession() {
  try {
    const { user, profile } = await api.me();
    if (user) signedIn(user, profile as StudentProfile | null);
  } catch {
    /* offline or server error: fall back to the browser copy */
  }
}

/** After signup or login. A guest profile already on this device moves into a new account. */
export function signedIn(user: User, serverProfile: StudentProfile | null) {
  account = user;
  const guest = readBrowserCopy();
  const profile = serverProfile ?? (guest ? { ...guest, name: user.name } : newProfile(user.name));
  inMemory = profile;
  if (!serverProfile) saveProfile(profile);
  clearBrowserCopy();
}

export async function signOut() {
  await api.logout().catch(() => undefined);
  account = null;
  inMemory = null;
}

function readBrowserCopy(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StudentProfile) : null;
  } catch {
    return null;
  }
}

function clearBrowserCopy() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}

export function newProfile(name: string): StudentProfile {
  return { name, major: '', courseIds: [], general: {}, time: {}, perCourse: {}, locked: {} };
}

export function loadProfile(): StudentProfile | null {
  if (inMemory === undefined) inMemory = readBrowserCopy();
  return inMemory;
}

export function saveProfile(profile: StudentProfile | null) {
  inMemory = profile;
  if (account) {
    window.clearTimeout(saveTimer);
    if (profile) saveTimer = window.setTimeout(() => { api.saveProfile(profile).catch(() => undefined); }, SAVE_DELAY_MS);
    return;
  }
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
