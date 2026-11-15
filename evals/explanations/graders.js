// Deterministic graders for Claude's match explanations. Each one encodes a product rule from
// CLAUDE.md, so the eval fails when the model breaks a rule a student or professor would notice.
import { FIELDS } from '../../shared/content.js';

const ABBREVIATIONS = /\b(Dr|Prof|Mr|Ms|Mrs|St|vs|e\.g|i\.e|approx)\./g;

export function sentences(text) {
  return String(text ?? '')
    .replace(ABBREVIATIONS, '$1')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const PERSONAL = /\b(accent|appearance|attractive|old|young|age|gender|ethnic\w*|nationality|personality|accented)\b/i;
const LEARNING_STYLES = /\b(visual|auditory|kinesthetic)\s+learn|\blearning\s+styles?\b/i;
const HYPE = /\b(revolutionary|seamless\w*|unlock\w*|supercharg\w*|game[- ]chang\w*|perfect fit)\b/i;
const FIELD_WORDS = new RegExp(`\\b(${FIELDS.flatMap((f) => [f.key, f.label]).map((w) => w.toLowerCase()).join('|')}|lecture|exam|project|deadline|example|discussion|cold-call|hours|quiz)`, 'i');

const check = (name, pass, detail = '') => ({ name, pass, detail });

/** Returns one result per rule. `ctx.score` is the deterministic fit score the text must not contradict. */
export function gradeExplanation(output, ctx) {
  const why = String(output?.why ?? '');
  const watchOut = String(output?.watch_out ?? output?.watchOut ?? '');
  const both = `${why} ${watchOut}`;
  const whyCount = sentences(why).length;
  const watchCount = sentences(watchOut).length;
  const percents = [...both.matchAll(/(\d{1,3})\s*(%|\/\s*100|percent)/g)].map((m) => Number(m[1]));

  return [
    check('why has 2 or 3 sentences', whyCount >= 2 && whyCount <= 3, `${whyCount} sentences`),
    check('watch-out is exactly one sentence', watchCount === 1, `${watchCount} sentences`),
    check('written to the student in second person', /\byou(r)?\b/i.test(why)),
    check('names something specific about the class', FIELD_WORDS.test(why)),
    check('never contradicts the computed score', percents.every((n) => n === ctx.score), percents.length ? `mentions ${percents.join(', ')}; score is ${ctx.score}` : ''),
    check('describes the class, not the person', !PERSONAL.test(both), both.match(PERSONAL)?.[0] ?? ''),
    check('no learning-styles claims', !LEARNING_STYLES.test(both)),
    check('no hype words', !HYPE.test(both), both.match(HYPE)?.[0] ?? ''),
    check('no em dashes', !both.includes('—')),
  ];
}
