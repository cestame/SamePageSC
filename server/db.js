// Database access. On Replit (or anywhere DATABASE_URL is set) this uses PostgreSQL.
// Without DATABASE_URL it falls back to PGlite, an embedded Postgres stored in ./data,
// so the app runs locally with zero setup and the same SQL.
import pg from 'pg';

let impl;

export async function initDb() {
  if (process.env.DATABASE_URL) {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false },
    });
    impl = { query: (text, params) => pool.query(text, params), close: () => pool.end(), kind: 'postgres' };
  } else {
    const { PGlite } = await import('@electric-sql/pglite');
    const { mkdirSync } = await import('node:fs');
    const dir = process.env.PGLITE_DIR || './data/pglite';
    mkdirSync(dir, { recursive: true });
    const db = new PGlite(dir);
    await db.waitReady;
    impl = { query: (text, params) => db.query(text, params), close: () => db.close(), kind: 'pglite' };
  }
  await migrate();
  return impl.kind;
}

export async function query(text, params = []) {
  const res = await impl.query(text, params);
  return res.rows;
}

async function migrate() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      title TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS professors (
      id SERIAL PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id),
      name TEXT NOT NULL,
      section TEXT,
      schedule TEXT,
      is_sample BOOLEAN NOT NULL DEFAULT FALSE,
      UNIQUE (course_id, name)
    )`,
    // One row per contribution. Only the extracted profile is stored, never the raw notes.
    `CREATE TABLE IF NOT EXISTS contributions (
      id SERIAL PRIMARY KEY,
      professor_id INTEGER NOT NULL REFERENCES professors(id),
      profile JSONB NOT NULL,
      summary TEXT NOT NULL,
      source_type TEXT NOT NULL,
      is_sample BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      professor_id INTEGER NOT NULL REFERENCES professors(id),
      pace_as_expected BOOLEAN NOT NULL,
      format_as_expected BOOLEAN NOT NULL,
      workload_as_expected BOOLEAN NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS professor_responses (
      id SERIAL PRIMARY KEY,
      professor_id INTEGER NOT NULL REFERENCES professors(id),
      body TEXT NOT NULL,
      verified BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    // Cache of AI match explanations, keyed by a hash of (student answers, profile version).
    `CREATE TABLE IF NOT EXISTS explanations (
      cache_key TEXT PRIMARY KEY,
      why TEXT NOT NULL,
      watch_out TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  ];
  for (const s of statements) await impl.query(s, []);
}

/** Close the connection cleanly. PGlite's files can be damaged if the process is killed mid-write. */
export async function closeDb() {
  await impl?.close();
}
