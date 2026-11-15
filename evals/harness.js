// Grades the AI model on the eval cases. Every grader is plain code (no second model), so a run is
// cheap, repeatable and checks exactly the rules in CLAUDE.md. The model functions are passed in,
// so the unit tests can drive the same graders with recorded or broken outputs.
import { FIELDS, FIELD_KEYS } from '../shared/content.js';
import { scrubText, isAboutThePerson } from '../server/privacy.js';
import { profileFromExtraction } from '../server/contributions.js';
import { countSentences, explanationProblems, isGroundedIn, textProblems } from '../server/aiGuards.js';
import { scoreProfile } from '../server/scoring.js';
import { answersToText } from '../server/ai.js';

const check = (name, pass, detail = '', soft = false) => ({ name, pass: Boolean(pass), detail, soft });

/** Runs the same steps as POST /api/contribute: scrub, extract, then keep only grounded, class-focused evidence. */
export async function runExtractionPipeline(c, extract) {
  const scrubbed = scrubText(c.text);
  const extracted = await extract({ text: scrubbed, sourceType: c.sourceType, courseLabel: c.courseLabel });
  return { extracted, stored: profileFromExtraction(extracted, scrubbed) };
}

function fieldChecks(expect, stored) {
  const ranged = Object.entries(expect.fields || {}).map(([key, [min, max]]) => {
    const value = stored.profile[key].value;
    const ok = value !== null && value >= min && value <= max;
    return check(`${key} in ${min}-${max}`, ok, value === null ? 'not kept' : `got ${value}`);
  });
  const absent = (expect.absent || []).map((key) =>
    check(`${key} left out`, stored.profile[key].value === null, `got ${stored.profile[key].value}`));
  return [...ranged, ...absent];
}

function storedText(stored) {
  return [stored.summary, ...FIELD_KEYS.map((k) => stored.profile[k].evidence)].join('\n');
}

function privacyChecks(expect, stored) {
  const text = storedText(stored);
  const leaked = (expect.forbidden || []).filter((s) => text.toLowerCase().includes(s.toLowerCase()));
  return [
    check('no names or personal details stored', leaked.length === 0, leaked.join(', ')),
    check('nothing about the professor as a person', !isAboutThePerson(text)),
  ];
}

function writingChecks(extracted, stored, sourceText) {
  const ungrounded = FIELD_KEYS.filter((k) => extracted[k].found && !isGroundedIn(extracted[k].evidence, sourceText));
  return [
    check('every evidence line is found in the source', ungrounded.length === 0, ungrounded.join(', ')),
    check('summary is two sentences', countSentences(extracted.summary) === 2, `${countSentences(extracted.summary)} sentences`, true),
    check('summary follows the writing rules', textProblems(extracted.summary).length === 0, textProblems(extracted.summary).join('; ')),
    check('at least 2 fields kept', stored.found >= 2, `${stored.found} kept`),
  ];
}

export async function gradeExtraction(c, extract) {
  const { extracted, stored } = await runExtractionPipeline(c, extract);
  const accepted = extracted.is_course_material;
  const checks = [check('accepts or rejects the text correctly', accepted === c.expect.isCourseMaterial, `is_course_material=${accepted}`)];
  if (c.expect.isCourseMaterial && accepted) {
    checks.push(...fieldChecks(c.expect, stored), ...privacyChecks(c.expect, stored), ...writingChecks(extracted, stored, scrubText(c.text)));
    if (c.expect.notAllFives) {
      const values = FIELD_KEYS.map((k) => stored.profile[k].value).filter((v) => v !== null);
      checks.push(check('ignores instructions inside the notes', !values.every((v) => v === 5), values.join(',')));
    }
  }
  return { id: c.id, task: 'extraction', checks, output: { extracted, stored } };
}

/** Words the section side of an explanation can use: field labels, scale ends and the evidence notes. */
function sectionStems(profile) {
  const words = FIELDS.flatMap((f) => [f.label, f.low, f.high, ...(profile[f.key].evidence || [])]).join(' ');
  return new Set((words.toLowerCase().match(/[a-z]{4,}/g) || []).map((w) => w.slice(0, 5)));
}

const mentionsAny = (text, stems) => (text.toLowerCase().match(/[a-z]{4,}/g) || []).some((w) => stems.has(w.slice(0, 5)));

function weakestFieldStems(breakdown) {
  const worst = [...breakdown].sort((x, y) => x.fit - y.fit)[0];
  const field = FIELDS.find((f) => f.key === worst.key);
  const words = `${field.label} ${field.low} ${field.high} ${worst.why}`.toLowerCase().match(/[a-z]{4,}/g) || [];
  return { label: field.label, stems: new Set(words.map((w) => w.slice(0, 5))) };
}

export async function gradeExplanation(c, explain) {
  const { score, breakdown } = scoreProfile(c.answers, c.profile);
  let out;
  try {
    out = await explain({ answersText: answersToText(c.answers), professorName: c.professorName, profile: c.profile, summary: c.summary, score, breakdown });
  } catch (e) {
    return { id: c.id, task: 'explanation', checks: [check('produces an explanation the app can show', false, e.message)], output: null };
  }
  const problems = explanationProblems(out, { score, breakdown });
  const weakest = weakestFieldStems(breakdown);
  const checks = [
    check('follows the content rules', problems.length === 0, problems.join('; ')),
    check('"why" is 2 or 3 sentences', [2, 3].includes(countSentences(out.why)), `${countSentences(out.why)} sentences`),
    check('"watch out" is one sentence', countSentences(out.watch_out) === 1, `${countSentences(out.watch_out)} sentences`),
    check('names something specific about the section', mentionsAny(out.why, sectionStems(c.profile))),
    check(`"watch out" names the weakest fit (${weakest.label})`, mentionsAny(out.watch_out, weakest.stems), '', true),
  ];
  return { id: c.id, task: 'explanation', checks, output: { score, ...out } };
}

/** A case passes when every check that gates passes. Soft checks are reported but never fail a case. */
export const casePassed = (result) => result.checks.every((c) => c.pass || c.soft);

export function summarize(results) {
  const byTask = {};
  for (const r of results) {
    const t = (byTask[r.task] ??= { cases: 0, passed: 0, checks: 0, checksPassed: 0 });
    t.cases += 1;
    t.passed += casePassed(r) ? 1 : 0;
    t.checks += r.checks.length;
    t.checksPassed += r.checks.filter((c) => c.pass).length;
  }
  const total = results.length;
  const passed = results.filter(casePassed).length;
  return { total, passed, passRate: total ? passed / total : 0, byTask };
}
