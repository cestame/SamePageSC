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

export class ApiError extends Error {}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const init: RequestInit = body === undefined
    ? {}
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
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
  meta: () => request<{ ai: boolean }>('/meta'),
  courses: () => request<Course[]>('/courses'),
  professors: (courseId: string) => request<Professor[]>(`/courses/${encodeURIComponent(courseId)}/professors`),
  professor: (id: number) => request<ProfessorDetail>(`/professors/${id}`),
  match: (courseId: string, answers: Answers) => request<Match[]>('/match', { courseId, answers }),
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
