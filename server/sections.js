// Matching sections read from USC web registration (by the Chrome extension) to teaching profiles.
// The extension sends only what is on the student's screen: course code, section number and instructor
// names. Only profiles built from real contributed notes can match. Sample professors are fictional,
// so they never match a real section.

const TITLES = new Set(['dr', 'prof', 'professor', 'mr', 'mrs', 'ms', 'mx']);

/** "csci-103l", "CSCI 103L" and "CSCI103" all become "CSCI103". The lab/lecture letter is dropped. */
export function normalizeCode(code) {
  const compact = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = compact.match(/^([A-Z]{2,5})(\d{3})[A-Z]?$/);
  return match ? match[1] + match[2] : null;
}

/** Lowercase name parts without titles or initials: "Reyes, Maya A." becomes ["reyes", "maya"]. */
export function nameTokens(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z'-]+/)
    .map((t) => t.replace(/^['-]+|['-]+$/g, ''))
    .filter((t) => t.length > 1 && !TITLES.has(t));
}

/**
 * True when every name part of the shorter name appears in the longer one, so "Reyes" matches
 * "Maya Reyes" and "Reyes, Maya", but "Maya Chen" does not match "Maya Reyes".
 */
export function sameInstructor(a, b) {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (!ta.length || !tb.length) return false;
  const [shorter, longer] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  return shorter.every((t) => longer.includes(t));
}

/** The answer set for one course, or which part of setup the student still has to do. */
export function answersForCourse(general, perCourse, courseId, validate) {
  const generalOnly = { prior: 3, workload: 3, ...general };
  if (validate(generalOnly)) return { status: 'needs-setup' };
  const answers = { ...general, ...(perCourse?.[courseId] || {}) };
  if (validate(answers)) return { status: 'needs-answers' };
  return { status: 'ready', answers };
}

const profileValues = (profile) => Object.fromEntries(Object.entries(profile).map(([k, f]) => [k, f.value]));

/**
 * One result per section the extension sent. Sample professors match only when `includeSamples` is set,
 * which the demo class list does; on real webReg pages they never do.
 * `courses` is every course row; `professorsFor(courseId)` loads that course's merged profiles.
 */
export async function lookupSections({ sections, general, perCourse, courses, professorsFor, score, validate, includeSamples = false }) {
  const byCode = new Map(courses.map((c) => [normalizeCode(c.code), c]));
  const results = [];
  for (const s of sections) {
    const course = byCode.get(normalizeCode(s.code));
    if (!course) {
      results.push({ key: s.key, status: 'no-notes' });
      continue;
    }
    const candidates = (await professorsFor(course.id)).filter((p) => includeSamples || !p.is_sample);
    const prof = candidates.find((p) => (s.instructors || []).some((name) => sameInstructor(name, p.name)));
    if (!prof) {
      results.push({ key: s.key, status: 'no-notes', courseId: course.id });
      continue;
    }
    const base = { key: s.key, courseId: course.id, professorId: prof.id, name: prof.name, isSample: Boolean(prof.is_sample), profile: profileValues(prof.profile) };
    const answers = answersForCourse(general, perCourse, course.id, validate);
    if (answers.status !== 'ready') {
      results.push({ ...base, status: answers.status });
      continue;
    }
    results.push({ ...base, status: 'scored', score: score(answers.answers, prof.profile).score });
  }
  return results;
}
