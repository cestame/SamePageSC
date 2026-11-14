// Deterministic matching. The AI never decides the ranking: this function does,
// so every score is explainable and repeatable. The AI only writes the explanation.
import { FIELDS, FIELD_KEYS, GOALS } from '../shared/content.js';

export { GOALS };

const clamp = (x, lo = 1, hi = 5) => Math.min(hi, Math.max(lo, x));
const round1 = (x) => Math.round(x * 10) / 10;

export function validateAnswers(a) {
  if (!a || typeof a !== 'object') return 'answers missing';
  for (const k of ['prior', 'format', 'structure', 'assessment', 'participation', 'pace', 'workload']) {
    const v = Number(a[k]);
    if (!Number.isInteger(v) || v < 1 || v > 5) return `answer "${k}" must be an integer 1-5`;
  }
  if (!GOALS.includes(a.goal)) return 'answer "goal" must be one of ' + GOALS.join(', ');
  return null;
}

// Turn the student's intake answers into a target value and weight per field.
export function studentTargets(a) {
  const prior = Number(a.prior);
  const goal = a.goal;
  return {
    // Prior knowledge drives guidance: beginners (1) want step-by-step examples (1),
    // experienced students (5) are comfortable with open-ended work (~4).
    guidance: {
      target: clamp(1 + (prior - 1) * 0.75 + (goal === 'mastery' ? 0.5 : 0)),
      weight: 1 + (5 - prior) * 0.25,
      mode: 'closest',
      why: 'how much you already know',
    },
    // Prior knowledge also tempers pace: a beginner who wants "fast" still benefits from a steadier class.
    pace: {
      target: clamp(0.5 * Number(a.pace) + 0.5 * prior),
      weight: 1,
      mode: 'closest',
      why: 'the pace you asked for and how much you already know',
    },
    format: { target: Number(a.format), weight: 1, mode: 'closest', why: 'the kind of class time you prefer' },
    structure: { target: Number(a.structure), weight: 1, mode: 'closest', why: 'how much structure you want' },
    assessment: { target: Number(a.assessment), weight: 1.2, mode: 'closest', why: 'whether you prefer exams or projects' },
    // Participation only hurts when the class asks for MORE than you are comfortable with.
    participation: { target: Number(a.participation), weight: 1.2, mode: 'max', why: 'how you feel about being called on' },
    // Workload only hurts fully when it is heavier than you can take on; lighter counts half.
    workload: {
      target: Number(a.workload),
      weight: goal === 'requirement' ? 1.5 : goal === 'mastery' ? 0.6 : 1,
      mode: 'max-soft',
      why: 'the hours you can give each week',
    },
  };
}

export function scoreProfile(answers, profile) {
  const targets = studentTargets(answers);
  let total = 0;
  let weights = 0;
  const breakdown = FIELDS.map(({ key, label }) => {
    const t = targets[key];
    const actual = Number(profile[key]?.value ?? 3);
    let dist;
    if (t.mode === 'max') dist = Math.max(0, actual - t.target);
    else if (t.mode === 'max-soft') dist = actual > t.target ? actual - t.target : (t.target - actual) * 0.5;
    else dist = Math.abs(actual - t.target);
    const fit = 1 - Math.min(dist, 4) / 4;
    total += fit * t.weight;
    weights += t.weight;
    return {
      key,
      label,
      target: round1(t.target),
      actual: round1(actual),
      fit: Math.round(fit * 100),
      weight: round1(t.weight),
      why: t.why,
    };
  });
  return { score: Math.round((100 * total) / weights), breakdown };
}

// Merge every contribution for a professor into one profile: values are averaged,
// evidence notes are kept (newest first) so nothing a contributor added is overwritten.
export function mergeContributions(contributions) {
  const sorted = [...contributions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const profile = {};
  for (const key of FIELD_KEYS) {
    const entries = sorted.map((c) => c.profile[key]).filter((e) => e && e.value != null && Number.isFinite(Number(e.value)));
    const avg = entries.length ? entries.reduce((s, e) => s + Number(e.value), 0) / entries.length : 3;
    profile[key] = {
      value: round1(avg),
      evidence: entries.map((e) => e.evidence).filter(Boolean).slice(0, 3),
    };
  }
  return {
    profile,
    summary: sorted[0]?.summary ?? '',
    contributionCount: sorted.length,
    realContributionCount: sorted.filter((c) => !c.is_sample).length,
  };
}
