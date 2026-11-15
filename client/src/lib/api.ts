import type { FieldKey, Goal } from '../../../shared/content.js';

export type { FieldKey, Goal };

export type FieldValue = { value: number; evidence: string[] };
export type Profile = Record<FieldKey, FieldValue>;
export type ExtractedField = { value: number | null; evidence: string };
export type ExtractedProfile = Record<FieldKey, ExtractedField>;

export type Answers = {
  prior: number;
  format: number;
  structure: number;
  assessment: number;
  participation: number;
  pace: number;
  workload: number;
  goal: Goal;
};

export type FeedbackStats = {
  total: number;
  confirmed: number;
  pace_ok: number;
  format_ok: number;
  workload_ok: number;
};

export type SectionShape = { id: number; name: string; is_sample: boolean; profile: Profile };
export type Course = { id: string; code: string; title: string; sections: SectionShape[] };

export type Professor = {
  id: number;
  course_id: string;
  course_code: string;
  course_title: string;
  name: string;
  section: string | null;
  schedule: string | null;
  is_sample: boolean;
  profile: Profile;
  summary: string;
  contributionCount: number;
  realContributionCount: number;
  feedback: FeedbackStats;
};

export type ProfessorDetail = Professor & {
  responses: { body: string; verified: boolean; created_at: string }[];
};

export type BreakdownRow = {
  key: FieldKey;
  label: string;
  target: number;
  actual: number;
  fit: number;
  weight: number;
  why: string;
};

export type Match = Professor & { score: number; breakdown: BreakdownRow[] };

export type MeetingTime = { days: string[]; start: number; end: number };
export type PlanStatus = 'chosen' | 'chosen-with-problem' | 'available' | 'unavailable';
export type PlanReason = 'starts-too-early' | 'ends-too-late' | 'conflict' | null;
export type PlanSection = Match & {
  plan: { id: number; status: PlanStatus; reason: PlanReason; conflictWith: string | null; time: MeetingTime | null };
};
export type PlanCourse = { id: string; code: string; title: string; chosenId: number | null; sections: PlanSection[] };

export type Explanation = {
  why: string;
  watch_out: string;
  source: 'ai' | 'template';
  notice?: string;
};

export type ContributionResult = {
  extracted: { profile: ExtractedProfile; summary: string; dropped: FieldKey[] };
  professor: Professor;
};

export type User = { id: number; email: string; name: string };
export type Session = { user: User | null; profile: unknown };

export type UscProgram = { poid: number; name: string; degree: string; school: string };
export type CatalogueCourse = { code: string; title: string };
export type RequirementGroup = { label: string; rule: string; courses: CatalogueCourse[] };
export type Requirements = {
  status: 'ready' | 'queued' | 'unavailable';
  courses: CatalogueCourse[];
  groups?: RequirementGroup[];
  notes?: string[];
  source?: string;
  etaSeconds?: number;
};

export class ApiError extends Error {}

async function request<T>(path: string, body?: unknown, method = 'POST'): Promise<T> {
  const init: RequestInit = body === undefined
    ? {}
    : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  let res: Response;
  try {
    res = await fetch('/api' + path, init);
  } catch {
    throw new ApiError('We could not reach the server. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `The server answered with an error (${res.status}).`);
  return data as T;
}

export const api = {
  me: () => request<Session>('/auth/me'),
  searchPrograms: (q: string) => request<UscProgram[]>(`/usc/programs?q=${encodeURIComponent(q)}`),
  requirements: (poid: number) => request<Requirements>(`/usc/programs/${poid}/requirements`),
  searchCourses: (q: string) => request<CatalogueCourse[]>(`/usc/courses?q=${encodeURIComponent(q)}`),
  addCourse: (code: string, title: string) => request<{ id: string; code: string; title: string }>('/courses', { code, title }),
  signup: (name: string, email: string, password: string) => request<Session>('/auth/signup', { name, email, password }),
  login: (email: string, password: string) => request<Session>('/auth/login', { email, password }),
  logout: () => request<{ ok: true }>('/auth/logout', {}),
  saveProfile: (data: unknown) => request<{ ok: true }>('/profile', { data }, 'PUT'),
  meta: () => request<{ ai: boolean }>('/meta'),
  courses: () => request<Course[]>('/courses'),
  professors: (courseId: string) => request<Professor[]>(`/courses/${encodeURIComponent(courseId)}/professors`),
  professor: (id: number) => request<ProfessorDetail>(`/professors/${id}`),
  match: (courseId: string, answers: Answers) => request<Match[]>('/match', { courseId, answers }),
  plan: (body: { courses: { courseId: string; answers: Answers }[]; earliest?: number; latest?: number; locked: Record<string, number> }) =>
    request<PlanCourse[]>('/plan', body),
  explain: (professorId: number, answers: Answers) => request<Explanation>('/explain', { professorId, answers }),
  contribute: (body: {
    courseId: string;
    professorId?: number;
    professorName?: string;
    sourceType: 'notes' | 'syllabus' | 'both';
    text: string;
    consent: boolean;
  }) => request<ContributionResult>('/contribute', body),
  feedback: (professorId: number, answers: { pace: boolean; format: boolean; workload: boolean }) =>
    request<{ feedback: FeedbackStats }>('/feedback', { professorId, ...answers }),
  respond: (professorId: number, body: string, code: string) =>
    request<{ ok: true; verified: boolean }>(`/professors/${professorId}/responses`, { body, code }),
};
