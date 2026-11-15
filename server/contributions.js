// Shared steps for turning an AI extraction into a stored contribution, used by pasted notes and recordings.
import { FIELD_KEYS } from '../shared/content.js';
import { scrubText, isAboutThePerson } from './privacy.js';
import { isGroundedIn, replaceDashes } from './aiGuards.js';

/**
 * Keeps only fields with evidence, scrubs the evidence again, and drops anything about the person.
 * When the source text is given, it also drops evidence that isn't found in the source, so a stored rating
 * always points at something a reader could check.
 * Returns the profile, the fields dropped for describing the person, the fields dropped as ungrounded,
 * and how many fields were kept.
 */
export function keepEvidencedFields(extracted, sourceText) {
  const profile = {};
  const dropped = [];
  const ungrounded = [];
  for (const key of FIELD_KEYS) {
    const f = extracted[key];
    const evidence = replaceDashes(scrubText(f.evidence || '')).slice(0, 240);
    const reason = rejectionReason(f, evidence, sourceText);
    if (reason === 'person') dropped.push(key);
    if (reason === 'ungrounded') ungrounded.push(key);
    profile[key] = reason ? { value: null, evidence: '' } : { value: Math.min(5, Math.max(1, Math.round(f.value))), evidence };
  }
  const found = FIELD_KEYS.filter((k) => profile[k].value !== null).length;
  return { profile, dropped, ungrounded, found };
}

function rejectionReason(field, evidence, sourceText) {
  if (!field.found) return 'not found';
  if (isAboutThePerson(evidence)) return 'person';
  if (sourceText !== undefined && !isGroundedIn(evidence, sourceText)) return 'ungrounded';
  return null;
}

/** The whole post-processing step after extraction, shared by pasted notes, recordings and the eval suite. */
export function profileFromExtraction(extracted, sourceText) {
  const { profile, dropped, ungrounded, found } = keepEvidencedFields(extracted, sourceText);
  const summary = replaceDashes(scrubText(extracted.summary)).slice(0, 600);
  return { profile, dropped, ungrounded, found, summary };
}

/** Finds the chosen professor for a course, or prepares a new one by name. Returns { prof } or { error }. */
export async function resolveProfessor(query, { courseId, professorId, professorName }) {
  if (professorId) {
    const [prof] = await query('SELECT id, name FROM professors WHERE id = $1 AND course_id = $2', [Number(professorId), courseId]);
    return prof ? { prof } : { error: 'Unknown professor for this course' };
  }
  const name = String(professorName || '').trim().slice(0, 80);
  if (name.length < 3) return { error: 'Enter the professor\'s name' };
  return { prof: { id: null, name } };
}

/** Stores the profile (never the source text) and returns the professor's id. */
export async function saveContribution(query, { courseId, prof, profile, summary, sourceType }) {
  let professor = prof;
  if (!professor.id) {
    const [row] = await query(
      `INSERT INTO professors (course_id, name) VALUES ($1, $2)
       ON CONFLICT (course_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name`,
      [courseId, professor.name],
    );
    professor = row;
  }
  await query(
    'INSERT INTO contributions (professor_id, profile, summary, source_type) VALUES ($1, $2, $3, $4)',
    [professor.id, JSON.stringify(profile), summary, sourceType],
  );
  return professor.id;
}
