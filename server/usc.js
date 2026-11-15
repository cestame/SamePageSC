// Reads public USC information. We never crawl:
// - Majors come from the keyword filter on usc.edu/majors-minors, one request per search a student types,
//   cached so repeated searches don't reach USC again.
// - Program requirements come from shared/requirements.json, which the team fills in from catalogue.usc.edu
//   by hand. The catalogue turns away automated requests (an empty 202), so live fetching is off unless
//   CATALOGUE_LIVE_FETCH=true, and even then requests are spaced 120 seconds apart as its robots.txt asks.
import { readFileSync } from 'node:fs';
import { query } from './db.js';

const CURATED = JSON.parse(readFileSync(new URL('../shared/requirements.json', import.meta.url), 'utf8'));
const curatedCourses = (program) => program.groups.flatMap((g) => g.courses);
const LIVE_FETCH = process.env.CATALOGUE_LIVE_FETCH === 'true';

const USER_AGENT = 'Mozilla/5.0 (Same Page SC student course-matching project)';
const MAJORS_URL = 'https://www.usc.edu/majors-minors/?search-by-keyword=';
const CATALOGUE = 'https://catalogue.usc.edu';
export const CATALOGUE_ID = 22; // USC Catalogue 2026-2027
const CATALOGUE_GAP_MS = 121_000;
const SEARCH_CACHE_LIMIT = 500;

const searchCache = new Map();

const decode = (s) => s
  .replace(/&amp;/g, '&').replace(/&#0?39;|&rsquo;|&#8217;/g, '\'').replace(/&quot;/g, '"')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/&ndash;|&#8211;/g, '-').replace(/\s+/g, ' ').trim();

export async function migrateUsc() {
  await query(`CREATE TABLE IF NOT EXISTS usc_programs (
    poid INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    degree TEXT NOT NULL,
    school TEXT NOT NULL
  )`);
  await query(`CREATE TABLE IF NOT EXISTS usc_requirements (
    poid INTEGER PRIMARY KEY,
    status TEXT NOT NULL,
    courses JSONB NOT NULL DEFAULT '[]',
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await query(`CREATE TABLE IF NOT EXISTS usc_courses (
    code TEXT PRIMARY KEY,
    title TEXT NOT NULL
  )`);
}

// ---------- majors ----------

export function parseProgramResults(html) {
  const pattern = /item-title">([^<]*)<[\s\S]*?<h4>\s*([^<]*?)\s*<\/h4>[\s\S]*?preview_program\.php\?catoid=\d+&(?:amp;)?poid=(\d+)/g;
  return [...html.matchAll(pattern)].map(([, title, kind, poid]) => {
    const [degree, school = ''] = decode(kind).split('|').map((s) => s.trim());
    return { poid: Number(poid), name: decode(title), degree, school };
  });
}

/** Searches USC's majors and minors list. Results are cached by query and saved for later lookups. */
export async function searchPrograms(rawQuery) {
  const q = rawQuery.trim().toLowerCase().slice(0, 60);
  if (q.length < 2) return [];
  if (searchCache.has(q)) return searchCache.get(q);

  const res = await fetch(MAJORS_URL + encodeURIComponent(q), { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`USC's majors page answered ${res.status}`);
  const programs = parseProgramResults(await res.text());

  if (searchCache.size > SEARCH_CACHE_LIMIT) searchCache.clear();
  searchCache.set(q, programs);
  for (const p of programs) {
    await query(
      `INSERT INTO usc_programs (poid, name, degree, school) VALUES ($1, $2, $3, $4)
       ON CONFLICT (poid) DO UPDATE SET name = EXCLUDED.name, degree = EXCLUDED.degree, school = EXCLUDED.school`,
      [p.poid, p.name, p.degree, p.school],
    );
  }
  return programs;
}

// ---------- catalogue requirements ----------

let nextCatalogueSlot = 0;
const inFlight = new Map();

async function politeCatalogueFetch(path) {
  const wait = Math.max(0, nextCatalogueSlot - Date.now());
  nextCatalogueSlot = Math.max(Date.now(), nextCatalogueSlot) + CATALOGUE_GAP_MS;
  if (wait) await new Promise((r) => setTimeout(r, wait));
  const res = await fetch(CATALOGUE + path, { headers: { 'User-Agent': USER_AGENT } });
  const body = await res.text();
  // The catalogue answers automated clients it wants to slow down with an empty 202.
  if (res.status !== 200 || body.length < 500) throw new Error(`catalogue answered ${res.status}`);
  return body;
}

/** Pulls "CSCI 103L Introduction to Programming" style course links out of a catalogue program page. */
export function parseRequirementCourses(html) {
  const seen = new Map();
  const pattern = /([A-Z]{2,5})\s+(\d{3}[A-Z]{0,2})\s*(?:-|&#8211;|&ndash;)\s*([^<(]{3,120})/g;
  const core = html.slice(html.indexOf('acalog-core') > -1 ? html.indexOf('acalog-core') : 0);
  for (const [, dept, num, title] of core.matchAll(pattern)) {
    const code = `${dept} ${num}`;
    if (!seen.has(code)) seen.set(code, { code, title: decode(title).replace(/\s*Units?:.*$/i, '') });
  }
  return [...seen.values()];
}

/** Returns cached requirements, or starts a polite fetch and reports that it is queued. */
export async function getRequirements(poid) {
  const curated = CURATED[String(poid)];
  if (curated) {
    return { status: 'ready', courses: curatedCourses(curated), groups: curated.groups, notes: curated.notes ?? [], source: curated.source };
  }
  if (!LIVE_FETCH) return { status: 'unavailable', courses: [] };
  const [cached] = await query('SELECT status, courses, fetched_at FROM usc_requirements WHERE poid = $1', [poid]);
  if (cached?.status === 'ready') return { status: 'ready', courses: cached.courses };
  if (cached?.status === 'blocked' && Date.now() - new Date(cached.fetched_at).getTime() < 3_600_000) {
    return { status: 'unavailable', courses: [] };
  }
  if (!inFlight.has(poid)) {
    const job = politeCatalogueFetch(`/preview_program.php?catoid=${CATALOGUE_ID}&poid=${poid}`)
      .then(async (html) => {
        const courses = parseRequirementCourses(html);
        await saveRequirements(poid, 'ready', courses);
      })
      .catch(async (err) => {
        console.error(`catalogue program ${poid}:`, err.message);
        await saveRequirements(poid, 'blocked', []);
      })
      .finally(() => inFlight.delete(poid));
    inFlight.set(poid, job);
  }
  return { status: 'queued', courses: [], etaSeconds: Math.ceil(Math.max(0, nextCatalogueSlot - Date.now()) / 1000) };
}

async function saveRequirements(poid, status, courses) {
  await query(
    `INSERT INTO usc_requirements (poid, status, courses, fetched_at) VALUES ($1, $2, $3, NOW())
     ON CONFLICT (poid) DO UPDATE SET status = EXCLUDED.status, courses = EXCLUDED.courses, fetched_at = NOW()`,
    [poid, status, JSON.stringify(courses)],
  );
  for (const c of courses) {
    await query('INSERT INTO usc_courses (code, title) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING', [c.code, c.title]);
  }
}

/** Searches courses from the requirements file, courses seen in fetched pages, and courses with profiles. */
export async function searchCourses(rawQuery) {
  const needle = rawQuery.trim().toLowerCase();
  const fromFile = Object.values(CURATED).flatMap(curatedCourses)
    .filter((c) => c.code.toLowerCase().includes(needle) || c.title.toLowerCase().includes(needle));
  const q = `%${rawQuery.trim().slice(0, 40)}%`;
  const fromDb = await query(
    `SELECT code, title FROM (
       SELECT code, title FROM usc_courses
       UNION SELECT code, title FROM courses
     ) all_courses
     WHERE code ILIKE $1 OR title ILIKE $1 OR REPLACE(code, ' ', '') ILIKE REPLACE($1, ' ', '')
     ORDER BY code LIMIT 20`,
    [q],
  );
  const byCode = new Map([...fromFile, ...fromDb].map((c) => [c.code, c]));
  return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code)).slice(0, 20);
}
