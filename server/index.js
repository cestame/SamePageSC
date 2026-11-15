import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDb, query } from './db.js';
import { seedIfEmpty } from './seed.js';
import { FIELD_KEYS, PRODUCT_NAME } from '../shared/content.js';
import { scoreProfile, mergeContributions, validateAnswers } from './scoring.js';
import { scrubText, isAboutThePerson } from './privacy.js';
import { extractProfile, explainMatch, aiConfigured, AiUnavailableError } from './ai.js';
import { planSchedule } from './planner.js';
import { authRoutes, loadUser, migrateAuth } from './auth.js';
import { getRequirements, migrateUsc, searchCourses, searchPrograms } from './usc.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '200kb' }));
app.set('trust proxy', true);

// ---------- helpers ----------

const asyncRoute = (fn) => (req, res, next) => fn(req, res).catch(next);

function rateLimit({ windowMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const list = (hits.get(req.ip) || []).filter((t) => now - t < windowMs);
    if (list.length >= max) return res.status(429).json({ error: 'Too many requests. Please wait a bit and try again.' });
    list.push(now);
    hits.set(req.ip, list);
    next();
  };
}

async function loadProfessors(where, params) {
  const profs = await query(
    `SELECT p.id, p.course_id, p.name, p.section, p.schedule, p.is_sample, c.code AS course_code, c.title AS course_title
     FROM professors p JOIN courses c ON c.id = p.course_id WHERE ${where} ORDER BY p.id`,
    params,
  );
  if (!profs.length) return [];
  const ids = profs.map((p) => p.id);
  const contributions = await query(
    'SELECT professor_id, profile, summary, is_sample, created_at FROM contributions WHERE professor_id = ANY($1)',
    [ids],
  );
  const feedback = await query(
    `SELECT professor_id,
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE pace_as_expected AND format_as_expected AND workload_as_expected)::int AS confirmed,
            COUNT(*) FILTER (WHERE pace_as_expected)::int AS pace_ok,
            COUNT(*) FILTER (WHERE format_as_expected)::int AS format_ok,
            COUNT(*) FILTER (WHERE workload_as_expected)::int AS workload_ok
     FROM feedback WHERE professor_id = ANY($1) GROUP BY professor_id`,
    [ids],
  );
  return profs
    .map((p) => {
      const mine = contributions
        .filter((c) => c.professor_id === p.id)
        .map((c) => ({ ...c, profile: typeof c.profile === 'string' ? JSON.parse(c.profile) : c.profile }));
      if (!mine.length) return null;
      const fb = feedback.find((f) => f.professor_id === p.id) || { total: 0, confirmed: 0, pace_ok: 0, format_ok: 0, workload_ok: 0 };
      return { ...p, ...mergeContributions(mine), feedback: fb };
    })
    .filter(Boolean);
}

function answersToText(a) {
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

// Used when the AI model is unavailable. Built only from the score breakdown, and labeled as such in the UI.
function templateExplanation(breakdown) {
  const byContribution = [...breakdown].sort((x, y) => y.fit * y.weight - x.fit * x.weight);
  const [best, second] = byContribution;
  const worst = [...breakdown].sort((x, y) => x.fit - y.fit)[0];
  return {
    why: `This class lines up best with you on ${best.label.toLowerCase()} and ${second.label.toLowerCase()}, where it matches what you asked for at ${best.fit}% and ${second.fit}%.`,
    watch_out: `The biggest difference is ${worst.label.toLowerCase()}: you asked for about ${worst.target} out of 5 and this class sits at ${worst.actual}.`,
  };
}

// ---------- API ----------

app.use('/api', loadUser);
authRoutes(app, { asyncRoute, rateLimit });

// ---------- USC majors, requirements and courses ----------

app.get('/api/usc/programs', rateLimit({ windowMs: 60_000, max: 40 }), asyncRoute(async (req, res) => {
  try {
    res.json(await searchPrograms(String(req.query.q || '')));
  } catch (err) {
    res.status(502).json({ error: `We couldn't reach USC's majors list right now (${err.message}).` });
  }
}));

app.get('/api/usc/programs/:poid/requirements', asyncRoute(async (req, res) => {
  const poid = Number(req.params.poid);
  if (!Number.isInteger(poid)) return res.status(400).json({ error: 'bad program id' });
  res.json(await getRequirements(poid));
}));

app.get('/api/usc/courses', asyncRoute(async (req, res) => {
  const q = String(req.query.q || '');
  res.json(q.trim().length < 2 ? [] : await searchCourses(q));
}));

const COURSE_CODE = /^[A-Z]{2,5} \d{3}[A-Z]{0,2}$/;
const courseIdFor = (code) => code.toLowerCase().replace(/\s+/g, '-');

// Adds a class to the course list so a student can plan it, even before anyone has added notes for it.
// "CSCI 103L" maps onto an existing "CSCI 103" when there is one.
app.post('/api/courses', rateLimit({ windowMs: 60_000, max: 30 }), asyncRoute(async (req, res) => {
  const code = String(req.body?.code || '').toUpperCase().replace(/\s+/g, ' ').trim();
  const title = String(req.body?.title || '').trim().slice(0, 120);
  if (!COURSE_CODE.test(code)) return res.status(400).json({ error: 'Use a course code like CSCI 103 or WRIT 150.' });
  if (title.length < 3) return res.status(400).json({ error: 'Add the course title.' });
  const baseId = courseIdFor(code.replace(/[A-Z]+$/, '').trim());
  const [existing] = await query('SELECT id, code, title FROM courses WHERE id = $1 OR id = $2', [courseIdFor(code), baseId]);
  if (existing) return res.json(existing);
  const [created] = await query('INSERT INTO courses (id, code, title) VALUES ($1, $2, $3) RETURNING id, code, title', [courseIdFor(code), code, title]);
  res.json(created);
}));

app.get('/api/health', (req, res) => res.json({ ok: true, ai: aiConfigured() }));

app.get('/api/meta', (req, res) => res.json({ ai: aiConfigured() }));

app.get('/api/courses', asyncRoute(async (req, res) => {
  // Each course carries its sections' profiles so the course picker can draw their shapes.
  const courses = await query('SELECT id, code, title FROM courses ORDER BY code');
  const professors = await loadProfessors('TRUE', []);
  res.json(courses.map((c) => ({
    ...c,
    sections: professors
      .filter((p) => p.course_id === c.id)
      .map((p) => ({ id: p.id, name: p.name, is_sample: p.is_sample, profile: p.profile })),
  })));
}));

app.get('/api/courses/:id/professors', asyncRoute(async (req, res) => {
  res.json(await loadProfessors('p.course_id = $1', [req.params.id]));
}));

app.get('/api/professors/:id', asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'bad id' });
  const [prof] = await loadProfessors('p.id = $1', [id]);
  if (!prof) return res.status(404).json({ error: 'Professor not found' });
  const responses = await query(
    'SELECT body, verified, created_at FROM professor_responses WHERE professor_id = $1 ORDER BY created_at DESC',
    [id],
  );
  res.json({ ...prof, responses });
}));

// Ranking: deterministic, no AI.
app.post('/api/match', asyncRoute(async (req, res) => {
  const { courseId, answers } = req.body || {};
  const err = validateAnswers(answers);
  if (err) return res.status(400).json({ error: err });
  const profs = await loadProfessors('p.course_id = $1', [courseId]);
  const results = profs
    .map((p) => ({ ...p, ...scoreProfile(answers, p.profile) }))
    .sort((a, b) => b.score - a.score || a.id - b.id);
  res.json(results);
}));

const MINUTES_IN_DAY = 24 * 60;
const asMinutes = (v) => (Number.isInteger(v) && v >= 0 && v <= MINUTES_IN_DAY ? v : null);

// Schedule plan: ranks every section of each course for this student, then picks one section per
// course with the best total fit that fits their time window and doesn't overlap.
app.post('/api/plan', asyncRoute(async (req, res) => {
  const { courses, earliest, latest, locked } = req.body || {};
  if (!Array.isArray(courses) || courses.length === 0 || courses.length > 8) {
    return res.status(400).json({ error: 'Send between 1 and 8 courses.' });
  }
  for (const c of courses) {
    const err = validateAnswers(c?.answers);
    if (err) return res.status(400).json({ error: `${c?.courseId}: ${err}` });
  }

  const ranked = [];
  for (const c of courses) {
    const [course] = await query('SELECT id, code, title FROM courses WHERE id = $1', [c.courseId]);
    if (!course) return res.status(400).json({ error: `Unknown course ${c.courseId}` });
    const sections = (await loadProfessors('p.course_id = $1', [course.id]))
      .map((p) => ({ ...p, ...scoreProfile(c.answers, p.profile) }))
      .sort((a, b) => b.score - a.score || a.id - b.id);
    ranked.push({ course, sections });
  }

  const plan = planSchedule(
    ranked.map((r) => ({ courseId: r.course.id, sections: r.sections })),
    { earliest: asMinutes(earliest), latest: asMinutes(latest) },
    locked && typeof locked === 'object' ? locked : {},
  );

  res.json(ranked.map(({ course, sections }) => {
    const coursePlan = plan[course.id];
    return {
      ...course,
      chosenId: coursePlan.chosenId,
      sections: sections.map((s) => ({ ...s, plan: coursePlan.sections.find((p) => p.id === s.id) })),
    };
  }));
}));

// Explanation: written by the AI from the two profiles, cached per (answers, profile) pair.
app.post('/api/explain', rateLimit({ windowMs: 60_000, max: 30 }), asyncRoute(async (req, res) => {
  const { professorId, answers } = req.body || {};
  const err = validateAnswers(answers);
  if (err) return res.status(400).json({ error: err });
  const [prof] = await loadProfessors('p.id = $1', [Number(professorId)]);
  if (!prof) return res.status(404).json({ error: 'Professor not found' });
  const { score, breakdown } = scoreProfile(answers, prof.profile);

  const normalized = Object.fromEntries(['prior', 'format', 'structure', 'assessment', 'participation', 'pace', 'workload', 'goal'].map((k) => [k, answers[k]]));
  const key = crypto.createHash('sha256')
    .update(JSON.stringify({ normalized, id: prof.id, profile: prof.profile, summary: prof.summary }))
    .digest('hex');
  const [cached] = await query('SELECT why, watch_out FROM explanations WHERE cache_key = $1', [key]);
  if (cached) return res.json({ ...cached, source: 'ai' });

  try {
    const out = await explainMatch({
      answersText: answersToText(answers),
      professorName: `${prof.name}, ${prof.course_code}`,
      profile: prof.profile,
      summary: prof.summary,
      score,
      breakdown,
    });
    await query('INSERT INTO explanations (cache_key, why, watch_out) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [key, out.why, out.watch_out]);
    res.json({ ...out, source: 'ai' });
  } catch (e) {
    console.error('explain failed:', e.message);
    // The ranking still works without AI; say plainly that this text is not AI-written.
    res.json({ ...templateExplanation(breakdown), source: 'template', notice: e instanceof AiUnavailableError ? 'AI explanations are offline right now.' : 'AI explanation failed; showing the score breakdown instead.' });
  }
}));

app.post('/api/contribute', rateLimit({ windowMs: 60 * 60_000, max: 15 }), asyncRoute(async (req, res) => {
  const { courseId, professorId, professorName, text, sourceType, consent } = req.body || {};
  if (!consent) return res.status(400).json({ error: 'Please confirm these are your own notes, or that the professor agreed to share them.' });
  if (!['notes', 'syllabus', 'both'].includes(sourceType)) return res.status(400).json({ error: 'sourceType must be notes, syllabus, or both' });
  if (typeof text !== 'string' || text.trim().length < 80) return res.status(400).json({ error: 'Please paste at least a few sentences (80+ characters).' });
  if (text.length > 30_000) return res.status(400).json({ error: 'Text is too long (max 30,000 characters). Paste the most relevant part.' });

  const [course] = await query('SELECT id, code, title FROM courses WHERE id = $1', [courseId]);
  if (!course) return res.status(400).json({ error: 'Unknown course' });

  let prof;
  if (professorId) {
    [prof] = await query('SELECT id, name FROM professors WHERE id = $1 AND course_id = $2', [Number(professorId), courseId]);
    if (!prof) return res.status(400).json({ error: 'Unknown professor for this course' });
  } else {
    const name = String(professorName || '').trim().slice(0, 80);
    if (name.length < 3) return res.status(400).json({ error: 'Enter the professor\'s name' });
    prof = { id: null, name };
  }

  // 1. Strip personal details before the text leaves our server.
  const scrubbed = scrubText(text);

  // 2. Extract the profile with the AI model.
  let extracted;
  try {
    extracted = await extractProfile({ text: scrubbed, sourceType, courseLabel: `${course.code} ${course.title}` });
  } catch (e) {
    const status = e instanceof AiUnavailableError ? 503 : 502;
    return res.status(status).json({ error: e.message });
  }
  if (!extracted.is_course_material) {
    return res.status(422).json({ error: 'That doesn\'t look like class notes or a syllabus, so nothing was saved.' });
  }

  // 3. Keep only fields with evidence; scrub evidence again and drop anything about the person.
  const profile = {};
  const dropped = [];
  for (const key of FIELD_KEYS) {
    const f = extracted[key];
    const evidence = scrubText(f.evidence || '').slice(0, 240);
    if (!f.found || isAboutThePerson(evidence)) {
      if (f.found) dropped.push(key);
      profile[key] = { value: null, evidence: '' };
      continue;
    }
    profile[key] = { value: Math.min(5, Math.max(1, Math.round(f.value))), evidence };
  }
  const found = FIELD_KEYS.filter((k) => profile[k].value !== null);
  if (found.length < 2) {
    return res.status(422).json({ error: 'There wasn\'t enough about how the class is taught to build a profile. Try adding notes about lectures, assignments, or exams.' });
  }
  const summary = scrubText(extracted.summary).slice(0, 600);

  // 4. Store the profile (never the raw notes) and merge with existing contributions.
  if (!prof.id) {
    const [row] = await query(
      `INSERT INTO professors (course_id, name) VALUES ($1, $2)
       ON CONFLICT (course_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name`,
      [courseId, prof.name],
    );
    prof = row;
  }
  await query(
    'INSERT INTO contributions (professor_id, profile, summary, source_type) VALUES ($1, $2, $3, $4)',
    [prof.id, JSON.stringify(profile), summary, sourceType],
  );
  const [merged] = await loadProfessors('p.id = $1', [prof.id]);
  res.json({ extracted: { profile, summary, dropped }, professor: merged });
}));

app.post('/api/feedback', rateLimit({ windowMs: 60 * 60_000, max: 20 }), asyncRoute(async (req, res) => {
  const { professorId, pace, format, workload } = req.body || {};
  if (![pace, format, workload].every((v) => typeof v === 'boolean')) return res.status(400).json({ error: 'Answer all three questions' });
  const [prof] = await query('SELECT id FROM professors WHERE id = $1', [Number(professorId)]);
  if (!prof) return res.status(404).json({ error: 'Professor not found' });
  await query(
    'INSERT INTO feedback (professor_id, pace_as_expected, format_as_expected, workload_as_expected) VALUES ($1, $2, $3, $4)',
    [prof.id, pace, format, workload],
  );
  const [updated] = await loadProfessors('p.id = $1', [prof.id]);
  res.json({ feedback: updated.feedback });
}));

app.post('/api/professors/:id/responses', rateLimit({ windowMs: 60 * 60_000, max: 10 }), asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  const body = String(req.body?.body || '').trim();
  if (body.length < 10 || body.length > 2000) return res.status(400).json({ error: 'Response must be 10-2,000 characters.' });
  const [prof] = await query('SELECT id FROM professors WHERE id = $1', [id]);
  if (!prof) return res.status(404).json({ error: 'Professor not found' });
  const expected = process.env.PROFESSOR_RESPONSE_CODE;
  const verified = Boolean(expected && req.body?.code === expected);
  await query('INSERT INTO professor_responses (professor_id, body, verified) VALUES ($1, $2, $3)', [id, scrubText(body), verified]);
  res.json({ ok: true, verified });
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- frontend ----------

const clientDir = path.join(here, '..', 'dist');
app.use(express.static(clientDir));
app.get('*', (req, res) => res.sendFile(path.join(clientDir, 'index.html'), (err) => {
  if (err) res.status(503).send('The site has not been built yet. Run "npm run build".');
}));

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side.' });
});

const port = Number(process.env.PORT) || 3000;
const kind = await initDb();
await migrateAuth();
await migrateUsc();
if (await seedIfEmpty()) console.log('Seeded sample data.');
app.listen(port, '0.0.0.0', () => {
  console.log(`${PRODUCT_NAME} running on http://localhost:${port} (db: ${kind}, ai: ${aiConfigured() ? 'on' : 'OFF - set ANTHROPIC_API_KEY'})`);
});
