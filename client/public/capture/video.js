// Day-one classroom video from several cameras, protected on this laptop before anything is saved.
//   camera -> MediaPipe person + face detection -> pixelate heads, faces and opt-out areas -> canvas
// Only those protected canvases are recorded, saved as stills or summarized. If detection goes stale
// for a camera, that whole view is pixelated (fail closed) until detection catches up.
import { FilesetResolver, FaceDetector, ObjectDetector } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';

const $ = (id) => document.getElementById(id);
const MAX_CAMERAS = 4;
const STALE_MS = 600;
const MODELS = {
  wasm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
  face: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
  person: 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
};

let faceDetector = null, personDetector = null;
const cameras = [];   // { id, label, video, canvas, ctx, boxes, detectedAt, zones, people, prevSmall }
const timeline = [];  // { t, people, motion }
let startedAt = 0, peak = 0, lastTs = 0;

async function loadDetectors() {
  const vision = await FilesetResolver.forVisionTasks(MODELS.wasm);
  const base = (path) => ({ modelAssetPath: path, delegate: 'GPU' });
  faceDetector = await FaceDetector.createFromOptions(vision, { baseOptions: base(MODELS.face), runningMode: 'VIDEO', minDetectionConfidence: 0.4 });
  personDetector = await ObjectDetector.createFromOptions(vision, {
    baseOptions: base(MODELS.person), runningMode: 'VIDEO', scoreThreshold: 0.3, categoryAllowlist: ['person'], maxResults: 60,
  });
}

// ---------- cameras ----------
async function listCameras() {
  const probe = await navigator.mediaDevices.getUserMedia({ video: true });
  probe.getTracks().forEach((t) => t.stop());
  const devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
  const box = $('cameraList');
  box.textContent = '';
  devices.slice(0, 8).forEach((d, i) => {
    const label = document.createElement('label');
    label.className = 'check';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = d.deviceId;
    input.checked = i < MAX_CAMERAS;
    input.dataset.label = d.label || `Camera ${i + 1}`;
    label.append(input, document.createTextNode(d.label || `Camera ${i + 1}`));
    box.append(label);
  });
  $('status').textContent = devices.length ? `Found ${devices.length} camera${devices.length === 1 ? '' : 's'}. Pick up to ${MAX_CAMERAS}.` : 'No cameras found.';
  $('startBtn').disabled = devices.length === 0;
}

async function startCameras() {
  const chosen = [...$('cameraList').querySelectorAll('input:checked')].slice(0, MAX_CAMERAS);
  $('status').textContent = 'Loading the face and person detectors.';
  await loadDetectors();
  for (const input of chosen) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: input.value }, width: { ideal: 1280 }, height: { ideal: 720 } } });
    const video = Object.assign(document.createElement('video'), { srcObject: stream, muted: true, playsInline: true });
    await video.play();
    cameras.push(makeTile(input.dataset.label, video));
  }
  $('viewsEmpty').hidden = cameras.length > 0;
  startedAt = performance.now();
  $('status').textContent = `${cameras.length} camera${cameras.length === 1 ? '' : 's'} running, protected on this laptop.`;
  for (const id of ['recBtn', 'stillBtn', 'clearZones', 'exportBtn']) $(id).disabled = false;
  $('startBtn').disabled = true;
  requestAnimationFrame(loop);
  setInterval(sample, 5000);
}

function makeTile(label, video) {
  const tile = document.createElement('div');
  tile.className = 'tile';
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = label;
  tile.append(canvas, tag);
  $('tiles').append(tile);
  const cam = { label, video, canvas, ctx: canvas.getContext('2d'), tag, boxes: [], detectedAt: 0, zones: [], people: 0, prevSmall: null, motion: 0 };
  enableZoneDrawing(cam);
  return cam;
}

// ---------- detection and protection ----------
const scratch = document.createElement('canvas');
function pixelate(ctx, x, y, w, h, block) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  x = Math.max(0, Math.floor(x)); y = Math.max(0, Math.floor(y));
  w = Math.min(W - x, Math.ceil(w)); h = Math.min(H - y, Math.ceil(h));
  if (w < 2 || h < 2) return;
  scratch.width = Math.max(1, Math.round(w / block));
  scratch.height = Math.max(1, Math.round(h / block));
  scratch.getContext('2d').drawImage(ctx.canvas, x, y, w, h, 0, 0, scratch.width, scratch.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(scratch, 0, 0, scratch.width, scratch.height, x, y, w, h);
  ctx.imageSmoothingEnabled = true;
}

function nextTimestamp() {
  lastTs = Math.max(performance.now(), lastTs + 1);
  return lastTs;
}

function detect(cam) {
  const ts = nextTimestamp();
  const people = personDetector.detectForVideo(cam.video, ts).detections.map((d) => d.boundingBox);
  const faces = faceDetector.detectForVideo(cam.video, nextTimestamp()).detections.map((d) => d.boundingBox);
  // Each person's head is roughly the top third of their box; faces get a 30% margin.
  const heads = people.map((b) => ({ x: b.originX - b.width * 0.1, y: b.originY - b.height * 0.05, w: b.width * 1.2, h: b.height * 0.4 }));
  const faceBoxes = faces.map((b) => ({ x: b.originX - b.width * 0.3, y: b.originY - b.height * 0.3, w: b.width * 1.6, h: b.height * 1.6 }));
  cam.boxes = [...heads, ...faceBoxes];
  cam.people = Math.max(people.length, faces.length);
  cam.detectedAt = performance.now();
}

let turn = 0;
function loop() {
  if (cameras.length) {
    // Detection takes turns across cameras so several feeds stay smooth on one GPU.
    const cam = cameras[turn++ % cameras.length];
    if (cam.video.readyState >= 2) {
      try { detect(cam); } catch { cam.detectedAt = 0; }
    }
    for (const c of cameras) drawProtected(c);
    record.draw();
  }
  requestAnimationFrame(loop);
}

function drawProtected(cam) {
  const { ctx, canvas, video } = cam;
  if (video.readyState < 2) return;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const stale = performance.now() - cam.detectedAt > STALE_MS * Math.max(1, cameras.length);
  if (stale) {
    pixelate(ctx, 0, 0, canvas.width, canvas.height, 40);
  } else {
    const sx = canvas.width / video.videoWidth, sy = canvas.height / video.videoHeight;
    for (const b of cam.boxes) pixelate(ctx, b.x * sx, b.y * sy, b.w * sx, b.h * sy, 16);
  }
  ctx.fillStyle = '#000';
  for (const z of cam.zones) ctx.fillRect(z.x * canvas.width, z.y * canvas.height, z.w * canvas.width, z.h * canvas.height);
  cam.tag.textContent = stale ? `${cam.label}: fully blurred while detection catches up` : `${cam.label}: ${cam.people} people, blurred`;
  cam.tag.classList.toggle('warn', stale);
}

// ---------- opt-out areas ----------
function enableZoneDrawing(cam) {
  let start = null;
  const point = (e) => {
    const r = cam.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  cam.canvas.addEventListener('pointerdown', (e) => { start = point(e); cam.canvas.setPointerCapture(e.pointerId); });
  cam.canvas.addEventListener('pointerup', (e) => {
    if (!start) return;
    const end = point(e);
    const zone = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), w: Math.abs(end.x - start.x), h: Math.abs(end.y - start.y) };
    if (zone.w > 0.02 && zone.h > 0.02) cam.zones.push(zone);
    start = null;
  });
}

// ---------- recording the protected views ----------
const record = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  let recorder = null, chunks = [];
  return {
    draw() {
      if (!recorder) return;
      const cols = cameras.length > 1 ? 2 : 1, rows = Math.ceil(cameras.length / cols);
      const w = canvas.width / cols, h = canvas.height / rows;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      cameras.forEach((c, i) => ctx.drawImage(c.canvas, (i % cols) * w, Math.floor(i / cols) * h, w, h));
    },
    toggle() {
      if (recorder) { recorder.stop(); return false; }
      chunks = [];
      const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t));
      recorder = new MediaRecorder(canvas.captureStream(15), { mimeType: type, videoBitsPerSecond: 4_000_000 });
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = () => { download(new Blob(chunks, { type: 'video/webm' }), 'day-one-protected.webm'); recorder = null; };
      recorder.start(1000);
      return true;
    },
  };
})();

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function saveStills() {
  cameras.forEach((c, i) => c.canvas.toBlob((b) => b && download(b, `room-still-camera-${i + 1}.png`), 'image/png'));
}

// ---------- how the room is used ----------
const small = document.createElement('canvas');
small.width = 32;
small.height = 18;
function motionOf(cam) {
  const sctx = small.getContext('2d', { willReadFrequently: true });
  sctx.drawImage(cam.canvas, 0, 0, 32, 18);
  const data = sctx.getImageData(0, 0, 32, 18).data;
  const gray = new Float32Array(32 * 18);
  for (let i = 0; i < gray.length; i++) gray[i] = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
  let diff = 0;
  if (cam.prevSmall) for (let i = 0; i < gray.length; i++) diff += Math.abs(gray[i] - cam.prevSmall[i]);
  cam.prevSmall = gray;
  return cam.prevSmall && diff ? diff / gray.length / 255 : 0;
}

function sample() {
  const people = Math.max(0, ...cameras.map((c) => c.people));
  const motion = cameras.length ? cameras.reduce((s, c) => s + motionOf(c), 0) / cameras.length : 0;
  timeline.push({ t: Math.round((performance.now() - startedAt) / 1000), people, motion: Math.round(motion * 1000) / 1000 });
  peak = Math.max(peak, people);
  $('mPeople').textContent = people;
  $('mPeak').textContent = peak;
  $('mMotion').textContent = motion > 0.06 ? 'a lot (group work or moving around)' : motion > 0.02 ? 'some' : 'little (lecture)';
  $('mMinutes').textContent = Math.floor((performance.now() - startedAt) / 60000);
  drawSpark();
}

function drawSpark() {
  const svg = $('spark');
  svg.textContent = '';
  if (timeline.length < 2) return;
  const maxP = Math.max(1, ...timeline.map((p) => p.people));
  const x = (i) => (i / (timeline.length - 1)) * 300;
  const line = (values, color) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    path.setAttribute('points', values.map((v, i) => `${x(i).toFixed(1)},${(58 - v * 54).toFixed(1)}`).join(' '));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2');
    svg.append(path);
  };
  line(timeline.map((p) => p.people / maxP), '#922e2e');
  line(timeline.map((p) => Math.min(1, p.motion * 8)), '#151e3f');
}

function exportSummary() {
  const summary = {
    kind: 'same-page-day-one-room',
    cameras: cameras.map((c) => ({ label: c.label, optOutAreas: c.zones.length })),
    minutesCaptured: Math.round((performance.now() - startedAt) / 6000) / 10,
    mostPeopleSeenAtOnce: peak,
    timeline,
    privacy: 'Counts only. Heads, faces and opt-out areas were pixelated on this laptop before any frame was recorded or saved.',
  };
  download(new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' }), 'day-one-room-summary.json');
}

// ---------- wiring ----------
const consents = [...document.querySelectorAll('.consent')];
consents.forEach((c) => c.addEventListener('change', () => { $('findBtn').disabled = !consents.every((x) => x.checked); }));
$('findBtn').addEventListener('click', () => listCameras().catch((e) => { $('status').textContent = `Camera access failed: ${e.message}`; }));
$('startBtn').addEventListener('click', () => startCameras().catch((e) => { $('status').textContent = `Could not start: ${e.message}`; }));
$('recBtn').addEventListener('click', () => {
  const on = record.toggle();
  $('recBtn').textContent = on ? 'Stop and save recording' : 'Start recording';
  $('recState').hidden = !on;
});
$('stillBtn').addEventListener('click', saveStills);
$('clearZones').addEventListener('click', () => cameras.forEach((c) => { c.zones = []; }));
$('exportBtn').addEventListener('click', exportSummary);
