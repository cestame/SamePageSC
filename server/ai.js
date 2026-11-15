// All calls to the AI model live here, server-side only. The API key is read from the
// ANTHROPIC_API_KEY environment variable (a Replit Secret) and never reaches the browser.
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { FIELDS } from '../shared/content.js';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';

export class AiUnavailableError extends Error {}

let client;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiUnavailableError('AI is not configured: set the ANTHROPIC_API_KEY secret on the server.');
  }
  client ??= new Anthropic();
  return client;
}

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

async function structuredCall({ system, user, schema, effort }) {
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // If the primary model declines, the API retries on a fallback model in the same call.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort, format: betaZodOutputFormat(schema) },
    system,
    messages: [{ role: 'user', content: user }],
  });
  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    throw new Error('The AI model could not process this text. Try rephrasing or removing unrelated content.');
  }
  return response.parsed_output;
}

// ---------- Profile extraction ----------

const FieldSchema = z.object({
  found: z.boolean().describe('true only if the text gives real evidence for this dimension'),
  value: z.number().int().describe('1-5 on the scale described'),
  evidence: z.string().describe('one short line quoted or closely paraphrased from the text; empty if not found'),
});

const ProfileSchema = z.object({
  is_course_material: z.boolean().describe('false if the text is not class notes or a syllabus'),
  pace: FieldSchema,
  format: FieldSchema,
  structure: FieldSchema,
  assessment: FieldSchema,
  participation: FieldSchema,
  guidance: FieldSchema,
  workload: FieldSchema,
  summary: z.string().describe('exactly 2 plain sentences describing a typical class day'),
});

const SCALES = FIELDS.map((f) => `- ${f.key}: 1 = ${f.low}, 5 = ${f.high}`).join('\n');

const EXTRACT_SYSTEM = `You build structured teaching profiles of university course sections from class notes and syllabi that students contribute.

Rate each dimension 1-5 on these scales:
${SCALES}

Rules:
- Base every rating only on the text. If the text gives no evidence for a dimension, set found=false, value=3, evidence="".
- Each evidence line must be a short quote or close paraphrase from the text, so a reader can check the rating.
- Describe the class, never the person: no comments on the professor's personality, appearance, accent, age, or identity.
- Never include names of students or any personal details (emails, IDs, phone numbers) in evidence or summary. The professor may be referred to as "the professor".
- The summary is exactly two plain sentences about what a typical class day looks like.
- If the text is not class notes or a syllabus, set is_course_material=false.`;

export async function extractProfile({ text, sourceType, courseLabel }) {
  const out = await structuredCall({
    system: EXTRACT_SYSTEM,
    user: `Course: ${courseLabel}\nSource type: ${sourceType}\n\n<source_text>\n${text}\n</source_text>`,
    schema: ProfileSchema,
    effort: 'medium',
  });
  return out;
}

// ---------- Match explanation ----------

/** The student's intake answers as prompt text. Shared by the /api/explain route and evals/explanations. */
export function answersToText(a) {
  const goal = { requirement: 'just meet the requirement', foundation: 'build a solid foundation', mastery: 'master it and go further' }[a.goal];
  return [
    `- Prior knowledge of the subject: ${a.prior}/5`,
    `- Preferred format: ${a.format}/5 (1 = lecture, 5 = discussion)`,
    `- Structure wanted: ${a.structure}/5 (1 = loose, 5 = highly organized)`,
    `- Assessment preference: ${a.assessment}/5 (1 = exams, 5 = projects)`,
    `- Comfort with participation / cold-calling: ${a.participation}/5`,
    `- Pace preference: ${a.pace}/5 (1 = slow, 5 = fast)`,
    `- Workload they can take on: ${a.workload}/5`,
    `- Goal: ${goal}`,
  ].join('\n');
}

const ExplanationSchema = z.object({
  why: z.string().describe('2-3 sentences on why this section fits this student'),
  watch_out: z.string().describe('one honest sentence on what this student should watch out for'),
});

const EXPLAIN_SYSTEM = `You explain to an incoming USC student why a course section fits them. The fit score was already computed by a fixed scoring function; do not change it or invent a different score.

Write in second person ("you"), plainly and specifically, using the student's answers and the section's teaching profile and evidence notes.
- "why": 2-3 sentences on why it fits.
- "watch_out": exactly one honest sentence about the biggest mismatch or challenge for this student. Always give one, even for a strong match.
Describe the class, not the professor as a person. No hype, no emojis.`;

export async function explainMatch({ answersText, professorName, profile, summary, score, breakdown }) {
  const profileText = FIELDS.map((f) => {
    const p = profile[f.key];
    const ev = p.evidence?.[0] ? ` (evidence: ${p.evidence[0]})` : '';
    return `- ${f.label}: ${p.value}/5 where 1=${f.low}, 5=${f.high}${ev}`;
  }).join('\n');
  const breakdownText = breakdown
    .map((b) => `- ${b.label}: student wants ~${b.target}, section is ${b.actual}, fit ${b.fit}%`)
    .join('\n');
  return structuredCall({
    system: EXPLAIN_SYSTEM,
    user: `Student answers:\n${answersText}\n\nSection: ${professorName}\nTypical class: ${summary}\nTeaching profile:\n${profileText}\n\nFit score: ${score}/100\nScore breakdown:\n${breakdownText}`,
    schema: ExplanationSchema,
    effort: 'low',
  });
}
