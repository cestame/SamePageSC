// Lecture audio capture. Everything runs in this browser tab:
//   microphone -> voice activity detection -> per-utterance speaker fingerprint (WavLM)
//   -> speaker label (you, professor, another student) -> Whisper transcript.
// Each audio clip is dropped as soon as it is processed. Other students' words are never kept.
import { pipeline, AutoProcessor, AutoModel } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1';

const $ = (id) => document.getElementById(id);
const RATE = 16000;
const SAME_SPEAKER = 0.82;      // cosine similarity for "this is the enrolled voice"
const SAME_CLUSTER = 0.78;      // cosine similarity for "same unknown speaker as before"
const QUESTION = /\?\s*$|^(what|why|how|when|where|who|which|can|could|does|do|did|is|are|will|would|should|anyone|any questions)\b/i;

let asr = null, speakerProcessor = null, speakerModel = null;
let youVoice = null, profVoice = null;
const clusters = [];            // unknown voices: { id, centroid, seconds, texts[] }
const lines = [];               // { role, cluster, text, start, seconds, question }
const waits = [];
let sessionStart = 0, lastEnd = 0, pendingQuestionEnd = null;

// ---------- models ----------
async function loadModels() {
  // Ask for a real GPU adapter first: a failed WebGPU start can't fall back to CPU in the same session.
  const adapter = navigator.gpu ? await navigator.gpu.requestAdapter().catch(() => null) : null;
  const device = adapter ? 'webgpu' : 'wasm';
  const files = new Map();
  const progress = (p) => {
    if (p.status !== 'progress' || !p.total) return;
    files.set(p.file, [p.loaded, p.total]);
    const [done, total] = [...files.values()].reduce((a, [l, t]) => [a[0] + l, a[1] + t], [0, 0]);
    $('progress').firstElementChild.style.width = `${Math.round((done / total) * 100)}%`;
  };
  $('progress').hidden = false;
  $('loadNote').textContent = `Downloading Whisper and the voice model once (about 300 MB). Running on ${device === 'webgpu' ? 'your GPU' : 'your CPU'}.`;
  const loadWhisper = (d) => pipeline('automatic-speech-recognition', 'onnx-community/whisper-base.en', { device: d, dtype: d === 'webgpu' ? 'fp32' : 'q8', progress_callback: progress });
  asr = await loadWhisper(device);
  speakerProcessor = await AutoProcessor.from_pretrained('Xenova/wavlm-base-plus-sv');
  speakerModel = await AutoModel.from_pretrained('Xenova/wavlm-base-plus-sv', { device: 'wasm', dtype: 'q8', progress_callback: progress });
  $('loadNote').textContent = 'Models are ready. They are cached, so next time this is instant.';
}

async function fingerprint(audio) {
  const inputs = await speakerProcessor(audio);
  const { embeddings } = await speakerModel(inputs);
  return Float32Array.from(embeddings.data);
}

async function transcribe(audio) {
  const out = await asr(audio);
  return String(out.text ?? '').trim();
}

const cosine = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / Math.sqrt(na * nb);
};

// ---------- microphone ----------
let micStream = null, audioCtx = null, frameHandler = null;
async function openMic(onFrame) {
  micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true } });
  audioCtx = new AudioContext({ sampleRate: RATE });
  const source = audioCtx.createMediaStreamSource(micStream);
  const processor = audioCtx.createScriptProcessor(4096, 1, 1);
  const silent = audioCtx.createGain();
  silent.gain.value = 0;
  frameHandler = onFrame;
  processor.onaudioprocess = (e) => frameHandler?.(new Float32Array(e.inputBuffer.getChannelData(0)));
  source.connect(processor).connect(silent).connect(audioCtx.destination);
}
function closeMic() {
  frameHandler = null;
  micStream?.getTracks().forEach((t) => t.stop());
  audioCtx?.close();
  micStream = audioCtx = null;
}
const rms = (f) => Math.sqrt(f.reduce((s, v) => s + v * v, 0) / f.length);
const concat = (chunks) => {
  const out = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
};

async function recordSeconds(seconds) {
  const chunks = [];
  await openMic((f) => { chunks.push(f); $('levelBar').style.width = `${Math.min(100, rms(f) * 600)}%`; });
  await new Promise((r) => setTimeout(r, seconds * 1000));
  closeMic();
  return concat(chunks);
}

// ---------- voice activity: cut the stream into utterances ----------
function makeSegmenter(onUtterance) {
  let floor = 0.01, speaking = false, quiet = 0, chunks = [], startedAt = 0;
  return (frame) => {
    const level = rms(frame);
    $('levelBar').style.width = `${Math.min(100, level * 600)}%`;
    const now = (performance.now() - sessionStart) / 1000;
    const loud = level > Math.max(0.012, floor * 3);
    if (!speaking && !loud) floor = floor * 0.95 + level * 0.05;
    if (loud && !speaking) { speaking = true; chunks = []; startedAt = now - frame.length / RATE; }
    if (!speaking) return;
    chunks.push(frame);
    quiet = loud ? 0 : quiet + 1;
    const seconds = chunks.length * frame.length / RATE;
    if (quiet >= 3 || seconds > 12) {
      speaking = false;
      if (seconds > 0.6) onUtterance(concat(chunks), startedAt, seconds);
      chunks = [];
    }
  };
}

// ---------- labeling ----------
function professorCluster() {
  if (profVoice) return null;
  return clusters.reduce((best, c) => (!best || c.seconds > best.seconds ? c : best), null);
}

function assign(voice, seconds) {
  const toYou = youVoice ? cosine(voice, youVoice) : -1;
  const toProf = profVoice ? cosine(voice, profVoice) : -1;
  if (toYou >= SAME_SPEAKER && toYou >= toProf) return { role: 'you' };
  if (toProf >= SAME_SPEAKER) return { role: 'professor' };
  let best = null, score = -1;
  for (const c of clusters) {
    const s = cosine(voice, c.centroid);
    if (s > score) { score = s; best = c; }
  }
  if (!best || score < SAME_CLUSTER) {
    best = { id: clusters.length + 1, centroid: Float32Array.from(voice), seconds: 0, count: 0 };
    clusters.push(best);
  } else {
    for (let i = 0; i < voice.length; i++) best.centroid[i] = (best.centroid[i] * best.count + voice[i]) / (best.count + 1);
  }
  best.count += 1;
  best.seconds += seconds;
  return { role: 'cluster', cluster: best };
}

const roleOf = (line) => {
  if (line.role !== 'cluster') return line.role;
  return line.cluster === professorCluster() ? 'professor' : 'other';
};

/** Words from anyone who isn't the professor or you are deleted once the professor is clear. */
function forgetOtherStudents() {
  const prof = professorCluster();
  if (!profVoice && (!prof || prof.seconds < 60)) return;
  for (const line of lines) if (roleOf(line) === 'other') line.text = null;
}

// ---------- processing queue ----------
const queue = [];
let busy = false;
function enqueue(audio, start, seconds) {
  queue.push({ audio, start, seconds });
  if (!busy) drain();
}
async function drain() {
  busy = true;
  while (queue.length) {
    const job = queue.shift();
    let label, text;
    try {
      label = assign(await fingerprint(job.audio), job.seconds);
      text = await transcribe(job.audio);
    } catch (error) {
      console.warn('Skipped one clip:', error.message);
      continue;
    } finally {
      job.audio = null; // the clip is gone once processed
    }
    if (!text || /^\[.*\]$|^\(.*\)$/.test(text)) continue;
    recordWait(job.start);
    const line = { ...label, text, start: job.start, seconds: job.seconds, question: QUESTION.test(text) };
    lines.push(line);
    if (roleOf(line) === 'professor' && line.question) pendingQuestionEnd = job.start + job.seconds;
    lastEnd = job.start + job.seconds;
    forgetOtherStudents();
    render();
  }
  busy = false;
}
function recordWait(start) {
  if (pendingQuestionEnd === null) return;
  const gap = start - pendingQuestionEnd;
  if (gap >= 0 && gap < 30) waits.push(gap);
  pendingQuestionEnd = null;
}

// ---------- rendering ----------
const NAMES = { you: 'You', professor: 'Professor', other: 'Another student' };
function render() {
  const list = $('lines');
  list.textContent = '';
  $('empty').hidden = lines.length > 0;
  for (const line of lines.slice(-200)) {
    const role = roleOf(line);
    const li = document.createElement('li');
    li.className = role;
    const who = document.createElement('b');
    who.textContent = `${NAMES[role]}, ${formatTime(line.start)}`;
    li.append(who);
    if (role === 'other') {
      li.append(document.createTextNode(`Spoke for ${line.seconds.toFixed(1)} seconds. Words not kept.`));
    } else {
      li.append(document.createTextNode(line.text));
      if (line.question) {
        const q = document.createElement('span');
        q.className = 'q';
        q.textContent = 'question';
        li.append(q);
      }
    }
    list.append(li);
  }
  list.scrollTop = list.scrollHeight;
  renderStats();
}

function totals() {
  const t = { professor: 0, you: 0, other: 0, otherTurns: 0, profQ: 0, yourQ: [] };
  for (const line of lines) {
    const role = roleOf(line);
    t[role] += line.seconds;
    if (role === 'other') t.otherTurns += 1;
    if (role === 'professor' && line.question) t.profQ += 1;
    if (role === 'you' && line.question) t.yourQ.push(line.text);
  }
  return t;
}

function renderStats() {
  const t = totals();
  const all = t.professor + t.you + t.other || 1;
  $('sProf').textContent = `${Math.round((t.professor / all) * 100)}%`;
  $('sYou').textContent = `${Math.round((t.you / all) * 100)}%`;
  $('sOther').textContent = `${Math.round((t.other / all) * 100)}%`;
  $('sTurns').textContent = t.otherTurns;
  $('sProfQ').textContent = t.profQ;
  $('sWait').textContent = waits.length ? `${(waits.reduce((a, b) => a + b, 0) / waits.length).toFixed(1)} seconds` : 'none yet';
  $('sYouQ').textContent = t.yourQ.length;
  const list = $('yourQuestions');
  list.textContent = '';
  for (const q of t.yourQ.length ? t.yourQ : ['None yet.']) {
    const li = document.createElement('li');
    li.textContent = q;
    list.append(li);
  }
}

const formatTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function exportSummary() {
  const t = totals();
  const summary = {
    kind: 'same-page-class-capture',
    capturedAt: new Date(Date.now() - (performance.now() - sessionStart)).toISOString(),
    durationSeconds: Math.round(lastEnd),
    secondsSpeaking: { professor: Math.round(t.professor), you: Math.round(t.you), otherStudents: Math.round(t.other) },
    otherStudentTurns: t.otherTurns,
    professorQuestions: t.profQ,
    waitAfterQuestionSeconds: waits.map((w) => Math.round(w * 10) / 10),
    yourQuestions: t.yourQ,
    professorTranscript: lines.filter((l) => roleOf(l) === 'professor').map((l) => ({ at: formatTime(l.start), text: l.text, question: l.question })),
    privacy: 'No audio. No words from other students. Speaker voices are compared on this device and never saved.',
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'class-summary.json' });
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- wiring ----------
$('consent').addEventListener('change', (e) => { $('loadBtn').disabled = !e.target.checked; });
$('loadBtn').addEventListener('click', async () => {
  $('loadBtn').disabled = true;
  try {
    await loadModels();
    $('enrollBox').hidden = false;
  } catch (error) {
    $('loadNote').textContent = `The models could not load: ${error.message}. Check your connection and try again.`;
    $('loadBtn').disabled = false;
  }
});
$('enrollYou').addEventListener('click', async () => {
  $('enrollYou').disabled = true;
  $('enrollNote').textContent = 'Listening for 8 seconds. Read the sentence above.';
  youVoice = await fingerprint(await recordSeconds(8));
  $('enrollYou').classList.add('done');
  $('enrollYou').textContent = 'Your voice is saved on this laptop';
  $('enrollYou').disabled = false;
  $('startBtn').disabled = false;
  $('enrollNote').textContent = 'Done. Without a professor sample, the voice that talks the most is treated as the professor.';
});
$('enrollProf').addEventListener('click', async () => {
  $('enrollProf').disabled = true;
  $('enrollNote').textContent = 'Listening for 8 seconds while the professor talks.';
  profVoice = await fingerprint(await recordSeconds(8));
  $('enrollProf').classList.add('done');
  $('enrollProf').textContent = "The professor's voice is saved on this laptop";
  $('enrollProf').disabled = false;
  $('enrollNote').textContent = 'Done.';
});
$('startBtn').addEventListener('click', async () => {
  sessionStart = performance.now();
  await openMic(makeSegmenter(enqueue));
  $('startBtn').disabled = true;
  $('stopBtn').disabled = false;
  $('exportBtn').disabled = false;
});
$('stopBtn').addEventListener('click', () => {
  closeMic();
  $('startBtn').disabled = false;
  $('stopBtn').disabled = true;
});
$('exportBtn').addEventListener('click', exportSummary);
