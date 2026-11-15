// The extension's only network client. Requests carry no cookies, no referrer and no identity,
// redirects are refused, and every response is rebuilt field by field before anyone reads it.

export class ApiError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const int = (v, lo, hi) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : null);

/** Rebuilds the professor list from /api/match or /api/courses/:id/professors with only the fields we use. */
export function readProfessors(json) {
  if (!Array.isArray(json)) throw new ApiError('bad-response');
  return json
    .slice(0, 40)
    .filter((p) => p && Number.isSafeInteger(p.id) && p.id > 0)
    .map((p) => ({
      professorId: p.id,
      name: str(p.name, 120),
      section: str(p.section, 12),
      schedule: str(p.schedule, 60),
      isSample: p.is_sample === true,
      score: int(p.score, 0, 100),
      breakdown: Array.isArray(p.breakdown)
        ? p.breakdown.slice(0, 7).map((b) => ({ label: str(b?.label, 40), fit: int(b?.fit, 0, 100) }))
        : [],
    }));
}

export function readExplanation(json) {
  if (!json || typeof json.why !== 'string' || typeof json.watch_out !== 'string') throw new ApiError('bad-response');
  return {
    why: str(json.why, 900),
    watchOut: str(json.watch_out, 400),
    writtenBy: json.source === 'ai' ? 'claude' : 'template',
  };
}

export function createApi({ origin, fetchImpl = globalThis.fetch, timeoutMs = 8000 }) {
  async function request(path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res;
    try {
      res = await fetchImpl(origin + path, {
        method: body ? 'POST' : 'GET',
        headers: body ? { 'content-type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
        redirect: 'error',
        signal: controller.signal,
      });
    } catch (e) {
      throw new ApiError(e?.name === 'AbortError' ? 'timeout' : 'network');
    } finally {
      clearTimeout(timer);
    }
    if (res.status === 429) throw new ApiError('rate-limited', 429);
    if (!res.ok) throw new ApiError('http-error', res.status);
    if (!String(res.headers.get('content-type') ?? '').includes('application/json')) throw new ApiError('bad-response');
    try {
      return await res.json();
    } catch {
      throw new ApiError('bad-response');
    }
  }

  return {
    professors: async (courseId) => readProfessors(await request(`/api/courses/${encodeURIComponent(courseId)}/professors`)),
    match: async (courseId, answers) => readProfessors(await request('/api/match', { courseId, answers })),
    explain: async (professorId, answers) => readExplanation(await request('/api/explain', { professorId, answers })),
  };
}
