// The seven teaching-profile dimensions. Every value is 1-5.
// `low` / `high` describe what 1 and 5 mean, so the UI and the AI prompt share one definition.
export const FIELDS = [
  { key: 'pace', label: 'Pace', low: 'Slow and thorough', high: 'Fast-moving' },
  { key: 'format', label: 'Format', low: 'Lecture-heavy', high: 'Discussion-heavy' },
  { key: 'structure', label: 'Structure', low: 'Loose, flexible', high: 'Highly organized' },
  { key: 'assessment', label: 'Assessment', low: 'Exam-based', high: 'Project-based' },
  { key: 'participation', label: 'Participation', low: 'Optional', high: 'Cold-calling / graded' },
  { key: 'guidance', label: 'Guidance', low: 'Step-by-step worked examples', high: 'Open-ended, figure it out' },
  { key: 'workload', label: 'Workload', low: 'Light', high: 'Heavy' },
];

export const FIELD_KEYS = FIELDS.map((f) => f.key);
