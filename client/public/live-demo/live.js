// Live pitch demo: record the room, send the audio once to /api/demo/live-analysis (pyannoteAI separates
// the speaker from the audience, Claude profiles the speaker's words), chart what came back, then replay
// the timeline in the 3D auditorium. The recording stays in this tab's memory for the replay only.
const $ = (id) => document.getElementById(id);
const FIELDS = [['pace', 'Pace'], ['format', 'Format'], ['structure', 'Structure'], ['assessment', 'Grading'], ['participation', 'Participation'], ['guidance', 'Guidance'], ['workload', 'Workload']];
const SVG = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, text) => {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text !== undefined) n.textContent = text;
  return n;
};
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

let recorder = null, stream = null, chunks = [], started = 0, tick = null, audioBlob = null, audioUrl = null, result = null;

function show(id) {
  for (const s of ['screenRecord', 'screenWork', 'screenResults']) $(s).hidden = s !== id;
}

// ---------- recording ----------
async function startRecording() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true } });
  const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
  recorder = new MediaRecorder(stream, type ? { mimeType: type } : {});
  chunks = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.onstop = () => {
    stream.getTracks().forEach((t) => t.stop());
    audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = URL.createObjectURL(audioBlob);
    analyze();
  };
  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const data = new Float32Array(analyser.fftSize);
  started = performance.now();
  tick = setInterval(() => {
    analyser.getFloatTimeDomainData(data);
    const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length);
    $('level').style.width = `${Math.min(100, rms * 500)}%`;
    $('timer').textContent = clock((performance.now() - started) / 1000);
  }, 100);
  recorder.start(1000);
  $('recBtn').classList.add('on');
  $('recBtn').textContent = 'Stop';
  $('recBtn').setAttribute('aria-label', 'Stop and analyze');
  $('recNote').textContent = 'Recording. Press stop when the speaker finishes.';
}

function stopRecording() {
  clearInterval(tick);
  $('recBtn').classList.remove('on');
  recorder.stop();
}

// ---------- analysis ----------
let stepTimers = [];
function runSteps() {
  const ids = ['stepUpload', 'stepSeparate', 'stepProfile'];
  ids.forEach((id) => $(id).className = '');
  $(ids[0]).className = 'on';
  stepTimers.forEach(clearTimeout);
  // The server does these in order; the page can't see inside, so it moves on after typical durations.
  stepTimers = [setTimeout(() => { $(ids[0]).className = 'done'; $(ids[1]).className = 'on'; }, 2500),
    setTimeout(() => { $(ids[1]).className = 'done'; $(ids[2]).className = 'on'; }, 22000)];
  const t0 = performance.now();
  const timer = setInterval(() => { $('elapsed').textContent = `${Math.round((performance.now() - t0) / 1000)} seconds`; }, 500);
  return () => { stepTimers.forEach(clearTimeout); clearInterval(timer); ids.forEach((id) => $(id).className = 'done'); };
}

async function analyze() {
  show('screenWork');
  $('workError').hidden = true;
  $('workActions').hidden = true;
  const done = runSteps();
  try {
    const res = await fetch('/api/demo/live-analysis?consent=yes', { method: 'POST', headers: { 'Content-Type': audioBlob.type || 'audio/webm' }, body: audioBlob });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `The server answered with an error (${res.status}).`);
    done();
    render(data);
  } catch (e) {
    done();
    $('workError').textContent = e.message;
    $('workError').hidden = false;
    $('workActions').hidden = false;
  }
}

async function useSample() {
  const res = await fetch('/api/demo/live-sample');
  render(await res.json());
}

// ---------- charts ----------
function donut(share) {
  const el = $('donut');
  el.textContent = '';
  const r = 70, c = 2 * Math.PI * r;
  el.append(svg('circle', { cx: 100, cy: 100, r, fill: 'none', stroke: '#e0b600', 'stroke-width': 34 }));
  el.append(svg('circle', { cx: 100, cy: 100, r, fill: 'none', stroke: '#922e2e', 'stroke-width': 34, 'stroke-dasharray': `${(share / 100) * c} ${c}`, transform: 'rotate(-90 100 100)' }));
  el.append(svg('text', { x: 100, y: 108, 'text-anchor': 'middle', 'font-size': 30, 'font-weight': 700, fill: '#030027', 'font-family': 'Bricolage Grotesque, sans-serif' }, `${share}%`));
  el.setAttribute('aria-label', `The speaker talked ${share}% of the time; the audience the rest.`);
}

function timeline(segments, duration) {
  const el = $('timeline');
  el.textContent = '';
  const x = (t) => 20 + (t / Math.max(duration, 1)) * 600;
  el.append(svg('text', { x: 20, y: 22, 'font-size': 13, fill: '#5e5c69' }, 'Speaker'), svg('text', { x: 20, y: 72, 'font-size': 13, fill: '#5e5c69' }, 'Audience'));
  for (const s of segments) {
    const y = s.who === 'professor' ? 28 : 78;
    el.append(svg('rect', { x: x(s.start), y, width: Math.max(2, x(s.end) - x(s.start)), height: 22, rx: 3, fill: s.who === 'professor' ? '#922e2e' : '#e0b600' }));
  }
  el.append(svg('line', { x1: 20, x2: 620, y1: 108, y2: 108, stroke: '#e2ddcf' }));
  el.append(svg('text', { x: 20, y: 120, 'font-size': 12, fill: '#5e5c69' }, '0:00'), svg('text', { x: 620, y: 120, 'font-size': 12, fill: '#5e5c69', 'text-anchor': 'end' }, clock(duration)));
  el.setAttribute('aria-label', `${segments.length} turns over ${clock(duration)}.`);
}

const valueOf = (field) => (field && Number.isFinite(Number(field.value)) ? Number(field.value) : null);
const evidenceOf = (field) => (Array.isArray(field?.evidence) ? field.evidence[0] : field?.evidence) || '';

function profileLine(profile) {
  const el = $('profile');
  el.textContent = '';
  const x = (v) => 130 + ((v - 1) / 4) * 210, y = (r) => 18 + r * 30;
  const points = [];
  FIELDS.forEach(([key, label], r) => {
    el.append(svg('line', { x1: x(1), x2: x(5), y1: y(r), y2: y(r), stroke: '#e2ddcf', 'stroke-width': 2 }));
    el.append(svg('text', { x: 0, y: y(r) + 5, 'font-size': 14, fill: '#151e3f', 'font-family': 'Atkinson Hyperlegible Next, sans-serif' }, label));
    const v = valueOf(profile?.[key]);
    points.push({ x: x(v ?? 3), y: y(r), known: v !== null });
  });
  el.append(svg('path', { d: points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' '), fill: 'none', stroke: '#922e2e', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  for (const p of points) el.append(svg('circle', { cx: p.x, cy: p.y, r: 6, fill: p.known ? '#922e2e' : '#fffefa', stroke: '#922e2e', 'stroke-width': 2 }));
  el.setAttribute('aria-label', 'Teaching profile: ' + FIELDS.map(([k, l]) => `${l} ${valueOf(profile?.[k]) ?? 'unknown'}`).join(', '));
}

function render(data) {
  result = data;
  const a = data.analysis;
  const live = data.source === 'live';
  $('sourceBadge').textContent = live ? 'Live: from the audio recorded in this room' : 'Sample recording, not this room';
  $('sourceBadge').className = `badge ${live ? 'live' : 'sample'}`;
  $('statTime').textContent = clock(a.durationSeconds);
  $('statShare').textContent = `${a.professorShare}%`;
  $('statTurns').textContent = a.studentTurns;
  $('statTurnsLabel').textContent = a.studentTurns === 1 ? 'time the audience spoke' : 'times the audience spoke';
  donut(a.professorShare);
  timeline(a.timeline, a.durationSeconds);
  const profile = data.profile ?? data.ratings;
  profileLine(profile);
  $('profileNote').textContent = data.profileNote ?? (data.profile ? 'Hollow dots are traits the talk gave no evidence for.' : '');
  $('summary').textContent = data.summary ?? `The speaker asked the audience ${a.professorQuestions} ${a.professorQuestions === 1 ? 'question' : 'questions'}.`;
  const list = $('evidence');
  list.textContent = '';
  for (const [key, label] of FIELDS) {
    const text = evidenceOf(profile?.[key]);
    if (!text) continue;
    const li = document.createElement('li');
    li.textContent = `${label}: ${text}`;
    list.append(li);
  }
  show('screenResults');
}

// ---------- the 3D room ----------
function openRoom() {
  $('room').hidden = false;
  const frame = $('roomFrame');
  const send = () => frame.contentWindow.postMessage({
    type: 'same-page-live',
    timeline: result.analysis.timeline,
    durationSeconds: result.analysis.durationSeconds,
    audioUrl: result.source === 'live' ? audioUrl : null,
  }, location.origin);
  if (frame.contentDocument?.readyState === 'complete') send();
  else frame.addEventListener('load', send, { once: true });
}

// ---------- wiring ----------
$('consent').addEventListener('change', (e) => { $('recBtn').disabled = !e.target.checked; });
$('recBtn').addEventListener('click', () => {
  if (recorder?.state === 'recording') stopRecording();
  else startRecording().catch((e) => { $('recNote').textContent = `The microphone didn't start: ${e.message}`; });
});
$('retryBtn').addEventListener('click', analyze);
$('sampleBtn').addEventListener('click', () => useSample().catch((e) => { $('workError').textContent = e.message; }));
const restart = () => {
  $('recBtn').textContent = 'Record';
  $('timer').textContent = '0:00';
  $('recNote').textContent = 'Press record when the speaker starts. Press it again to stop and analyze.';
  show('screenRecord');
};
$('againBtn').addEventListener('click', restart);
$('restartBtn').addEventListener('click', restart);
$('roomBtn').addEventListener('click', openRoom);
$('backBtn').addEventListener('click', () => { $('room').hidden = true; });
