// Deterministic checks on what the AI model writes. Production code uses them to reject bad output,
// and the eval suite (evals/) uses the same checks to grade the model, so the two never drift apart.
import { isAboutThePerson } from './privacy.js';

const STOPWORDS = new Set([
  'the', 'and', 'that', 'this', 'with', 'from', 'they', 'their', 'there', 'have', 'will', 'each', 'about',
  'into', 'than', 'then', 'when', 'what', 'which', 'were', 'been', 'also', 'very', 'most', 'some', 'more',
  'professor', 'class', 'course', 'students', 'student',
]);

/** Lowercased word stems of 4+ letters, minus filler words. The 5-letter prefix is a cheap stem ("exams" = "exam"). */
function contentStems(text) {
  return (String(text || '').toLowerCase().match(/[a-z0-9]{4,}/g) || [])
    .filter((w) => !STOPWORDS.has(w))
    .map((w) => w.slice(0, 5));
}

/**
 * True when most of an evidence line's content words appear in the source text, so the line is a quote
 * or close paraphrase and not something the model made up. Short lines need every word to match.
 */
export function isGroundedIn(evidence, source, minShare = 0.6) {
  const stems = contentStems(evidence);
  if (stems.length === 0) return false;
  const sourceStems = new Set(contentStems(source));
  const matched = stems.filter((s) => sourceStems.has(s)).length;
  const needed = stems.length <= 2 ? stems.length : Math.ceil(stems.length * minShare);
  return matched >= needed;
}

/** Replaces em and en dashes with commas, since the style guide bans them everywhere. */
export function replaceDashes(text) {
  return String(text || '')
    .replace(/\s*[\u2014\u2013]\s*/g, ', ')
    .replace(/,\s*,/g, ',');
}

export const countSentences = (text) => (String(text || '').trim().match(/[^.!?]+[.!?]+(\s|$)/g) || []).length;

const LEARNING_STYLES = /\b(visual|auditory|kinesthetic|kinaesthetic|tactile)\s+(learner|learning|style)s?\b|\blearning\s+styles?\b/i;
const HYPE = /\b(revolutionary|seamless(ly)?|unlock|supercharge|game[- ]changer|perfect match|ai-powered)\b/i;

/** Problems shared by every piece of AI text shown to a student. Returns a list of short reasons, empty when clean. */
export function textProblems(text) {
  const problems = [];
  if (/[\u2014\u2013]/.test(text)) problems.push('uses an em or en dash');
  if (LEARNING_STYLES.test(text)) problems.push('mentions learning styles');
  if (HYPE.test(text)) problems.push('uses hype words');
  if (isAboutThePerson(text)) problems.push('comments on the professor as a person');
  return problems;
}

/** Percentages in the text that are neither the computed score nor a line of its breakdown. The AI must never invent a fit. */
function inventedPercentages(text, allowed) {
  const found = [...String(text).matchAll(/(\d{1,3})\s*(%|percent|\/\s*100)/gi)].map((m) => Number(m[1]));
  return found.filter((n) => !allowed.has(n));
}

/** Checks a match explanation against the content rules. Returns a list of problems, empty when it can be shown. */
export function explanationProblems(out, { score, breakdown = [] }) {
  const why = String(out?.why || '').trim();
  const watchOut = String(out?.watch_out || '').trim();
  const problems = [];
  if (!why) problems.push('"why" is empty');
  if (!watchOut) problems.push('"watch_out" is empty');
  const both = `${why} ${watchOut}`;
  problems.push(...textProblems(both));
  const allowed = new Set([score, ...breakdown.map((b) => b.fit)]);
  if (inventedPercentages(both, allowed).length) problems.push('states a fit number the scorer did not compute');
  if (!/\byou(r|'re|'ll)?\b/i.test(both)) problems.push('is not written to the student in second person');
  return problems;
}
