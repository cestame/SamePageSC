// Email and password accounts. Passwords are hashed with scrypt and a per-user salt;
// sessions are random tokens kept in an httpOnly cookie, and only their SHA-256 hash is stored.
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { query } from './db.js';

const scrypt = promisify(crypto.scrypt);
const COOKIE = 'tf_session';
const SESSION_DAYS = 30;
const KEY_LENGTH = 64;
const MIN_PASSWORD = 8;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function migrateAuth() {
  await query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await query(`CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
  )`);
  await query(`CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, KEY_LENGTH);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

async function passwordMatches(password, stored) {
  const [saltHex, keyHex] = stored.split(':');
  const expected = Buffer.from(keyHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function setSessionCookie(req, res, token, maxAgeSeconds) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const parts = [`${COOKIE}=${encodeURIComponent(token)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSeconds}`];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

async function startSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [hashToken(token), userId, expires]);
  setSessionCookie(req, res, token, SESSION_DAYS * 86_400);
}

/** Express middleware: sets req.user when a valid session cookie is present. */
export async function loadUser(req, res, next) {
  try {
    const token = readCookie(req, COOKIE);
    if (token) {
      const [row] = await query(
        `SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
        [hashToken(token)],
      );
      req.user = row ?? null;
    }
    next();
  } catch (err) {
    next(err);
  }
}

function validateSignup({ name, email, password }) {
  if (typeof name !== 'string' || !name.trim() || name.length > 40) return 'Enter your first name.';
  if (typeof email !== 'string' || !EMAIL.test(email.trim())) return 'Enter a valid email address.';
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) return `Use a password with at least ${MIN_PASSWORD} characters.`;
  if (password.length > 200) return 'That password is too long.';
  return null;
}

async function profileFor(userId) {
  const [row] = await query('SELECT data FROM user_profiles WHERE user_id = $1', [userId]);
  return row?.data ?? null;
}

export function authRoutes(app, { asyncRoute, rateLimit }) {
  const limiter = rateLimit({ windowMs: 15 * 60_000, max: 20 });

  app.post('/api/auth/signup', limiter, asyncRoute(async (req, res) => {
    const error = validateSignup(req.body || {});
    if (error) return res.status(400).json({ error });
    const email = req.body.email.trim().toLowerCase();
    const [existing] = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) return res.status(409).json({ error: 'There is already an account with that email. Log in instead.' });
    const [user] = await query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, req.body.name.trim(), await hashPassword(req.body.password)],
    );
    await startSession(req, res, user.id);
    res.json({ user, profile: null });
  }));

  app.post('/api/auth/login', limiter, asyncRoute(async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const [user] = await query('SELECT id, email, name, password_hash FROM users WHERE email = $1', [email]);
    const ok = user && await passwordMatches(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'That email and password don\'t match an account.' });
    await startSession(req, res, user.id);
    res.json({ user: { id: user.id, email: user.email, name: user.name }, profile: await profileFor(user.id) });
  }));

  app.post('/api/auth/logout', asyncRoute(async (req, res) => {
    const token = readCookie(req, COOKIE);
    if (token) await query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]);
    setSessionCookie(req, res, '', 0);
    res.json({ ok: true });
  }));

  app.get('/api/auth/me', asyncRoute(async (req, res) => {
    if (!req.user) return res.json({ user: null, profile: null });
    res.json({ user: req.user, profile: await profileFor(req.user.id) });
  }));

  app.put('/api/profile', asyncRoute(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Log in to save your profile.' });
    const data = req.body?.data;
    if (!data || typeof data !== 'object' || JSON.stringify(data).length > 20_000) {
      return res.status(400).json({ error: 'Profile data is missing or too large.' });
    }
    await query(
      `INSERT INTO user_profiles (user_id, data, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [req.user.id, JSON.stringify(data)],
    );
    res.json({ ok: true });
  }));
}
