// Class recording (prototype). A student records a lecture with the professor's agreement, and the
// audio goes to pyannoteAI, which separates the speakers and transcribes them. We keep only the
// professor's words. Everyone else is kept as timing only: their words are never read or stored.
// The API key is read from the PYANNOTE_API_KEY environment variable (a Replit Secret) and never
// reaches the browser. Audio is held in memory only and is never written to disk.
import crypto from 'node:crypto';

const API = 'https://api.pyannote.ai/v1';
const MODEL = 'precision-3';
const POLL_MS = 3000;
const MAX_WAIT_MS = 15 * 60_000;
const FINISHED = new Set(['succeeded', 'failed', 'canceled']);

export const recordingConfigured = () => Boolean(process.env.PYANNOTE_API_KEY);

async function pyannote(path, init = {}) {
  const res = await fetch(API + path, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.PYANNOTE_API_KEY}`, 'Content-Type': 'application/json', ...init.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`The voice separation service answered with an error (${res.status}). ${data.message || ''}`.trim());
  return data;
}

async function waitForJob(jobId) {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    const job = await pyannote(`/jobs/${encodeURIComponent(jobId)}`);
    if (FINISHED.has(job.status)) {
      if (job.status !== 'succeeded' || !job.output) throw new Error(`The voice separation job ${job.status}.`);
      return job.output;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  throw new Error('The voice separation service took too long. Try a shorter recording.');
}

/**
 * Uploads the audio to pyannoteAI's temporary media storage and runs speaker-attributed transcription.
 * pyannoteAI deletes uploaded media automatically within 48 hours; it has no endpoint to delete it sooner.
 */
export async function transcribeLecture(audio) {
  const mediaUrl = `media://samepage/lecture-${crypto.randomUUID()}`;
  const { url: uploadUrl } = await pyannote('/media/input', { method: 'POST', body: JSON.stringify({ url: mediaUrl }) });
  const upload = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: audio });
  if (!upload.ok) throw new Error(`The recording could not be uploaded for analysis (${upload.status}).`);
  const { jobId } = await pyannote('/diarize', { method: 'POST', body: JSON.stringify({ url: mediaUrl, model: MODEL, transcription: true }) });
  return waitForJob(jobId);
}

const isSegment = (s) => s && typeof s.speaker === 'string' && Number.isFinite(s.start) && Number.isFinite(s.end) && s.end > s.start;

/** Pauses shorter than this between two segments from the same side count as one turn. */
const SAME_TURN_GAP_SECONDS = 1.5;

function talkTimeBySpeaker(segments) {
  const talk = new Map();
  for (const s of segments) talk.set(s.speaker, (talk.get(s.speaker) || 0) + (s.end - s.start));
  return talk;
}

function mostTalkative(talk) {
  let best = null;
  for (const [speaker, seconds] of talk) if (!best || seconds > best.seconds) best = { speaker, seconds };
  return best;
}

/** Turns in class order, with consecutive segments from the same side merged. Students are only ever "student". */
function classTimeline(segments, professor) {
  const timeline = [];
  for (const s of segments) {
    const who = s.speaker === professor ? 'professor' : 'student';
    const last = timeline[timeline.length - 1];
    if (last && last.who === who && s.start - last.end <= SAME_TURN_GAP_SECONDS) last.end = Math.max(last.end, s.end);
    else timeline.push({ who, start: s.start, end: s.end });
  }
  return timeline;
}

const round1 = (x) => Math.round(x * 10) / 10;

/**
 * Turns pyannoteAI's output into what we keep: the professor's transcript and timing for everyone else.
 * The speaker with the most talk time is treated as the professor. Other speakers' text is never read.
 */
export function summarizeLecture(output) {
  const segments = (output?.diarization || []).filter(isSegment).sort((a, b) => a.start - b.start);
  if (segments.length === 0) throw new Error('No speech was found in the recording.');
  const top = mostTalkative(talkTimeBySpeaker(segments));
  const durationSeconds = Math.max(...segments.map((s) => s.end));
  const timeline = classTimeline(segments, top.speaker).map((t) => ({ who: t.who, start: round1(t.start), end: round1(t.end) }));
  const professorTranscript = (output.turnLevelTranscription || [])
    .filter((t) => t && t.speaker === top.speaker && typeof t.text === 'string')
    .map((t) => t.text.trim())
    .filter(Boolean)
    .join('\n');
  return {
    durationSeconds: round1(durationSeconds),
    professorShare: Math.round((100 * top.seconds) / durationSeconds),
    studentTurns: timeline.filter((t) => t.who === 'student').length,
    professorQuestions: (professorTranscript.match(/\?/g) || []).length,
    timeline,
    professorTranscript,
  };
}

/* Measured numbers become the Format and Participation ratings, so these two rows rest on what happened in the room. */
const FORMAT_BY_SHARE = [[85, 1], [70, 2], [55, 3], [40, 4]];
const PARTICIPATION_BY_TURNS_PER_10_MIN = [[1, 1], [2, 2], [4, 3], [6, 4]];

function ratingFromSteps(value, steps, fallback, isAtLeast) {
  for (const [limit, rating] of steps) if (isAtLeast ? value >= limit : value < limit) return rating;
  return fallback;
}

export function measuredRatings({ professorShare, studentTurns, professorQuestions, durationSeconds }) {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  const turnsPer10 = studentTurns / (minutes / 10);
  const questions = professorQuestions === 1 ? '1 question' : `${professorQuestions} questions`;
  const times = studentTurns === 1 ? 'once' : `${studentTurns} times`;
  return {
    format: {
      value: ratingFromSteps(professorShare, FORMAT_BY_SHARE, 5, true),
      evidence: `Measured: the professor talked for ${professorShare}% of the ${minutes}-minute class.`,
    },
    participation: {
      value: ratingFromSteps(turnsPer10, PARTICIPATION_BY_TURNS_PER_10_MIN, 5, false),
      evidence: `Measured: students spoke ${times} in ${minutes} minutes, and the professor asked the class ${questions}.`,
    },
  };
}

/** The numbers and timeline shown to the student. The professor's transcript stays on the server. */
export function publicAnalysis(lecture) {
  const { durationSeconds, professorShare, studentTurns, professorQuestions, timeline } = lecture;
  return { durationSeconds, professorShare, studentTurns, professorQuestions, timeline };
}
