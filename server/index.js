import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeDb, initDb, query } from './db.js';
import { SAMPLE_VOICES, seedSamples } from './seed.js';
import { PRODUCT_NAME } from '../shared/content.js';
import { scoreProfile, mergeContributions, validateAnswers } from './scoring.js';
import { scrubText } from './privacy.js';
import { extractProfile, explainMatch, answersToText, aiConfigured, AiUnavailableError } from './ai.js';
import { planSchedule } from './planner.js';
import { authRoutes, loadUser, migrateAuth } from './auth.js';
import { getRequirements, migrateUsc, searchCourses, searchPrograms } from './usc.js';
import { lookupSections } from './sections.js';
import { renderDemoPage } from './demoPage.js';
import { profileFromExtraction, resolveProfessor, saveContribution } from './contributions.js';
import { measuredRatings, publicAnalysis, recordingConfigured, summarizeLecture, transcribeLecture } from './recording.js';
import { readFileSync } from 'node:fs';

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

const COURSE_CODE = /^([A-Z]{2,5})[\s-]*(\d{3}[A-Z]{0,2})$/;
const courseIdFor = (code) => code.toLowerCase().replace(/\s+/g, '-');

/** "writ150", "WRIT-150" and "Writ 150" all become "WRIT 150". Returns null when it isn't a course code. */
function normalizeCourseCode(raw) {
  const match = COURSE_CODE.exec(String(raw || '').toUpperCase().trim());
  return match ? `${match[1]} ${match[2]}` : null;
}

// Adds a class to the course list so a student can plan it, even before anyone has added notes for it.
// The title is optional. "CSCI 103L" maps onto an existing "CSCI 103" when there is one.
app.post('/api/courses', rateLimit({ windowMs: 60_000, max: 30 }), asyncRoute(async (req, res) => {
  const code = normalizeCourseCode(req.body?.code);
  const title = String(req.body?.title || '').trim().slice(0, 120);
  if (!code) return res.status(400).json({ error: 'Use a course code like CSCI 103 or WRIT 150.' });
  const baseId = courseIdFor(code.replace(/[A-Z]+$/, '').trim());
  const [existing] = await query('SELECT id, code, title FROM courses WHERE id = $1 OR id = $2', [courseIdFor(code), baseId]);
  if (existing) return res.json(existing);
  const [created] = await query('INSERT INTO courses (id, code, title) VALUES ($1, $2, $3) RETURNING id, code, title', [courseIdFor(code), code, title]);
  res.json(created);
}));

app.get('/api/health', (req, res) => res.json({ ok: true, ai: aiConfigured() }));

app.get('/api/meta', (req, res) => res.json({ ai: aiConfigured(), recording: recordingConfigured() }));

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

// The Chrome extension: fit for the sections a student is looking at in USC web registration.
app.post('/api/sections/lookup', rateLimit({ windowMs: 60_000, max: 60 }), asyncRoute(async (req, res) => {
  const { sections, general, perCourse, includeSamples } = req.body || {};
  if (!Array.isArray(sections) || sections.length === 0 || sections.length > 100) {
    return res.status(400).json({ error: 'Send between 1 and 100 sections.' });
  }
  const clean = sections.map((s) => ({
    key: String(s?.key ?? '').slice(0, 64),
    code: String(s?.code ?? '').slice(0, 16),
    instructors: (Array.isArray(s?.instructors) ? s.instructors : []).slice(0, 6).map((n) => String(n).slice(0, 80)),
  }));
  const courses = await query('SELECT id, code FROM courses');
  const cache = new Map();
  const professorsFor = (courseId) => {
    if (!cache.has(courseId)) cache.set(courseId, loadProfessors('p.course_id = $1', [courseId]));
    return cache.get(courseId);
  };
  res.json(await lookupSections({
    sections: clean,
    general: general && typeof general === 'object' ? general : {},
    perCourse: perCourse && typeof perCourse === 'object' ? perCourse : {},
    courses,
    professorsFor,
    score: scoreProfile,
    validate: validateAnswers,
    // Only the demo class list (fictional sections) asks for sample professors.
    includeSamples: includeSamples === true,
  }));
}));

// The demo class list for trying the extension without a USC login. Fictional sample sections only.
app.get('/demo/webreg', asyncRoute(async (req, res) => {
  const courses = await query('SELECT id, code, title FROM courses ORDER BY code');
  const samples = await loadProfessors('p.is_sample = TRUE', []);
  const listed = courses
    .map((c) => ({ ...c, sections: samples.filter((p) => p.course_id === c.id && p.section).map((p) => ({ ...p, voice: SAMPLE_VOICES[p.name] })) }))
    .filter((c) => c.sections.length > 0);
  res.type('html').send(renderDemoPage(listed));
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

  const { prof, error } = await resolveProfessor(query, { courseId, professorId, professorName });
  if (error) return res.status(400).json({ error });

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

  // 3. Keep only fields with evidence found in the notes; scrub evidence again and drop anything about the person.
  const { profile, dropped, found, summary } = profileFromExtraction(extracted, scrubbed);
  if (found < 2) {
    return res.status(422).json({ error: 'There wasn\'t enough about how the class is taught to build a profile. Try adding notes about lectures, assignments, or exams.' });
  }
  // 4. Store the profile (never the raw notes) and merge with existing contributions.
  const id = await saveContribution(query, { courseId, prof, profile, summary, sourceType });
  const [merged] = await loadProfessors('p.id = $1', [id]);
  res.json({ extracted: { profile, summary, dropped }, professor: merged });
}));

// ---------- class recording (prototype) ----------

/**
 * A recording's draft profile is signed when the server builds it, so a browser can only submit a profile
 * that came from a real analysis. Sample results are signed as samples and can never be submitted.
 */
const DRAFT_SIGNING_KEY = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const signDraft = (draft, source) => crypto.createHmac('sha256', DRAFT_SIGNING_KEY).update(JSON.stringify({ draft, source })).digest('hex');

function draftMatches(draft, token) {
  const expected = Buffer.from(signDraft(draft, 'live'));
  const given = Buffer.from(String(token || ''));
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

const SAMPLE_RECORDING = JSON.parse(readFileSync(path.join(here, 'sample-recording.json'), 'utf8'));
const MAX_RECORDING_BYTES = 60 * 1024 * 1024;

/** The pre-processed sample lecture, run through the same summary as a live recording so the demo never needs a microphone or the API. */
function sampleRecordingResult(notice) {
  const lecture = summarizeLecture(SAMPLE_RECORDING.output);
  const draft = { profile: { ...SAMPLE_RECORDING.draft.profile, ...measuredRatings(lecture) }, summary: SAMPLE_RECORDING.draft.summary, dropped: [] };
  return { analysis: publicAnalysis(lecture), draft, source: 'sample', notice, token: signDraft(draft, 'sample') };
}

/** Builds the draft profile from the professor's words. Format and Participation come from the measured numbers. */
async function draftFromLecture(lecture, course) {
  const transcript = scrubText(lecture.professorTranscript).slice(0, 30_000);
  if (transcript.trim().length < 80) throw Object.assign(new Error('There wasn\'t enough of the professor speaking to build a profile.'), { status: 422 });
  const extracted = await extractProfile({ text: transcript, sourceType: 'lecture transcript (professor only)', courseLabel: `${course.code} ${course.title}` });
  if (!extracted.is_course_material) throw Object.assign(new Error('That recording doesn\'t sound like a class, so nothing was kept.'), { status: 422 });
  const { profile, dropped, summary } = profileFromExtraction(extracted, transcript);
  return { profile: { ...profile, ...measuredRatings(lecture) }, summary, dropped };
}

app.get('/api/recordings/sample', (req, res) => {
  res.json(sampleRecordingResult('This is a sample recording of a fictional CSCI 103 lecture, analyzed ahead of time.'));
});

app.post(
  '/api/recordings/analyze',
  rateLimit({ windowMs: 60 * 60_000, max: 6 }),
  express.raw({ type: ['audio/*', 'video/webm', 'application/octet-stream'], limit: MAX_RECORDING_BYTES }),
  asyncRoute(async (req, res) => {
    if (req.query.consent !== 'yes') return res.status(400).json({ error: 'Please confirm the professor agreed to the recording and told the class.' });
    const [course] = await query('SELECT id, code, title FROM courses WHERE id = $1', [req.query.courseId]);
    if (!course) return res.status(400).json({ error: 'Unknown course' });
    if (!recordingConfigured()) {
      return res.json(sampleRecordingResult('Live recording isn\'t set up on this server yet, so this shows the sample recording instead. Your audio was not sent anywhere.'));
    }
    if (!aiConfigured()) return res.status(503).json({ error: 'The server doesn\'t have its AI key set up, so it can\'t build a profile right now.' });
    if (!Buffer.isBuffer(req.body) || req.body.length < 1000) return res.status(400).json({ error: 'The recording was empty. Try recording again.' });

    // The audio lives only in this request's memory. It is dropped as soon as the voice separation is back.
    let lecture;
    try {
      lecture = summarizeLecture(await transcribeLecture(req.body));
    } catch (e) {
      return res.status(502).json({ error: e.message });
    } finally {
      req.body = null;
    }

    try {
      const draft = await draftFromLecture(lecture, course);
      res.json({ analysis: publicAnalysis(lecture), draft, source: 'live', token: signDraft(draft, 'live') });
    } catch (e) {
      const status = e.status || (e instanceof AiUnavailableError ? 503 : 502);
      res.status(status).json({ error: e.message });
    }
  }),
);

app.post('/api/recordings/submit', rateLimit({ windowMs: 60 * 60_000, max: 15 }), asyncRoute(async (req, res) => {
  const { courseId, professorId, professorName, draft, token, consent } = req.body || {};
  if (!consent) return res.status(400).json({ error: 'Please confirm the professor agreed to the recording and told the class.' });
  if (!draft || !draftMatches(draft, token)) {
    return res.status(400).json({ error: 'Only a profile built from your own recording can be submitted. Sample results are for trying it out.' });
  }
  const [course] = await query('SELECT id FROM courses WHERE id = $1', [courseId]);
  if (!course) return res.status(400).json({ error: 'Unknown course' });
  const { prof, error } = await resolveProfessor(query, { courseId, professorId, professorName });
  if (error) return res.status(400).json({ error });

  const id = await saveContribution(query, { courseId, prof, profile: draft.profile, summary: draft.summary, sourceType: 'recording' });
  const [merged] = await loadProfessors('p.id = $1', [id]);
  res.json({ extracted: draft, professor: merged });
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
const seeded = await seedSamples();
if (seeded) console.log(`Added ${seeded} sample sections.`);
app.listen(port, '0.0.0.0', () => {
  console.log(`${PRODUCT_NAME} running on http://localhost:${port} (db: ${kind}, ai: ${aiConfigured() ? 'on' : 'OFF - set ANTHROPIC_API_KEY'})`);
});

// Ctrl+C locally, or Replit stopping the app: finish closing the database before exiting.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    console.log(`Closing the database (${signal}).`);
    closeDb().catch((err) => console.error('Closing the database failed:', err.message)).finally(() => process.exit(0));
  });
}
