// Synthetic class data for one webReg section. Everything here is SIMULATED: it turns the section's
// 1-5 teaching profile and meeting time into classroom behavior and a lesson built from recorded steps.
// Each rule says what it is based on. The same section always produces the same data (seeded by
// course and section), so a student sees a stable class, not a new random one on every visit.

const FIELDS = ['pace', 'format', 'structure', 'assessment', 'participation', 'guidance', 'workload'];

function seeded(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

/** "MW 10:00-11:50" or "10:00am-11:50am" to minutes after midnight for the start, or null. */
function startMinutes(when) {
  const m = /(\d{1,2}):(\d{2})\s*(am|pm)?/i.exec(String(when || ''));
  if (!m) return null;
  let h = Number(m[1]);
  const meridiem = m[3]?.toLowerCase();
  if (meridiem === 'pm' && h < 12) h += 12;
  if (meridiem === 'am' && h === 12) h = 0;
  return h * 60 + Number(m[2]);
}

/** The behavior rules. Each returns { value, rule } so the page can show where every number came from. */
function behavior(p, start, rnd) {
  const lectureHeavy = (5 - p.format) / 4; // 1 for all lecture, 0 for all discussion
  return {
    enrolled: { value: Math.round(clamp(150 - (p.format - 1) * 18 + (rnd() - 0.5) * 20, 20, 144)), rule: 'Lecture-heavy sections are larger; capped at the 144 seats in this room.' },
    attendanceStart: { value: round(0.93 + rnd() * 0.04), rule: 'Most students attend week 1.' },
    attendanceDropPerWeek: { value: round(0.006 + 0.02 * lectureHeavy + 0.004 * (p.workload - 3) / 2, 3), rule: 'Assumption: lecture-heavy sections lose more attendance over the term (active-learning sections keep students engaged; Freeman et al. 2014).' },
    lateShare: { value: round(start !== null && start < 9 * 60 ? 0.16 + rnd() * 0.06 : start !== null && start < 10 * 60 ? 0.08 + rnd() * 0.04 : 0.03 + rnd() * 0.03), rule: 'Assumption: early classes see more late arrivals (students do worse when class times fight their sleep schedule; Smarr and Schirmer 2018).' },
    laptopShare: { value: round(0.12 + 0.3 * lectureHeavy), rule: 'Assumption: more students open laptops during long stretches of lecture.' },
    handsPerQuestion: { value: round(0.03 + 0.045 * p.participation), rule: 'Scales with the participation score from student notes.' },
    waitSeconds: { value: round(clamp(0.9 + 0.55 * (p.participation - 1) + (rnd() - 0.5) * 0.4, 0.8, 3.8), 1), rule: 'Typical classes wait about 1 second after a question; waits of 3 seconds or more draw more and longer answers (Rowe 1986).' },
    pairSeconds: { value: Math.round(10 + p.format * 3), rule: 'Longer pair discussions in discussion-heavy sections.' },
    packUpShare: { value: round(clamp(0.42 - 0.07 * p.participation, 0.05, 0.4)), rule: 'Assumption: fewer students pack up early in classes that keep them involved.' },
    pace: { value: round(0.94 + (p.pace - 1) * 0.035), rule: 'Playback speed of the professor voice, from the pace score.' },
  };
}

const copy = (lessons, key, i) => ({ ...structuredClone(lessons[key].steps[i]), src: { lesson: key, step: i } });

/** Builds the lesson from recorded steps of both sample lessons, chosen by the profile. */
function composeSteps(p, b, lessons, rnd) {
  const pick = (key, i) => copy(lessons, key, i);
  const steps = [];
  steps.push(p.structure >= 4 ? pick('B', 0) : pick('A', 0));
  if (p.participation >= 3) steps.push(pick('B', 1), pick('B', 2));
  else steps.push(pick('A', 1));
  steps.push(p.participation >= 3 ? pick('B', 3) : pick('A', 2));
  if (p.format >= 4 || (p.format === 3 && rnd() < 0.5)) steps.push(pick('B', 4), pick('B', 5));
  steps.push(pick('A', 3));
  steps.push(pick('A', 4)); // even the quietest section asks once; participation sets the wait and the hands
  if (p.guidance <= 2) steps.push(pick('A', 5), pick('A', 6));
  else steps.push(pick('B', 6));
  if (p.participation >= 4) steps.push(pick('B', 7));
  steps.push(p.structure >= 4 ? pick('B', 8) : pick('A', 7));

  for (const s of steps) {
    delete s.scene;
    if (s.wait) { s.wait = b.waitSeconds.value; s.hands = s.tool === 'poll' ? 0.03 : b.handsPerQuestion.value; }
    if (s.pair) s.pair = b.pairSeconds.value;
    if (s.packUp) s.packUp = b.packUpShare.value;
  }
  const first = (test) => steps.find(test);
  const tag = (step, scene) => { if (step && !step.scene) step.scene = scene; };
  tag(steps[0], 'open');
  tag(first((s) => s.move === 'question'), 'question');
  tag(first((s) => s.move === 'studentq'), 'studentq');
  tag(first((s) => s.move === 'pair') ?? steps[1], 'engage');
  tag(first((s) => s.move === 'worked'), 'worked');
  tag(steps.at(-1), 'close');
  return steps;
}

function describeStyle(p, steps) {
  const has = (move) => steps.some((s) => s.move === move);
  const parts = [
    p.structure >= 4 ? 'opens with a recap of last class' : 'starts the new topic right away',
    has('pair') ? 'stops for a pair discussion' : 'keeps students in lecture mode',
    p.guidance <= 2 ? 'works examples step by step on the board' : 'writes examples under the document camera',
    steps.at(-1).exitTicket ? 'closes with an exit ticket' : 'ends with homework reminders',
  ];
  return `In this synthetic class, the professor ${parts.join(', ')}.`;
}

/**
 * section: { course, section, name, when, profile } where profile is { pace: 1-5, ... } or null.
 * lessons: the two recorded sample lessons (A and B) from index.html.
 * Returns { lesson, data } where lesson plugs into the simulation and data is the readable record.
 */
export function synthesizeSection(section, lessons) {
  const rnd = seeded(`${section.course}|${section.section}`);
  const profileFromNotes = Boolean(section.profile);
  const p = Object.fromEntries(FIELDS.map((k) => [k, Math.round(section.profile?.[k] ?? 1 + Math.floor(rnd() * 5))]));
  const start = startMinutes(section.when);
  const b = behavior(p, start, rnd);
  const steps = composeSteps(p, b, lessons, rnd);
  const voice = rnd() < 0.5 ? 'A' : 'B';
  const tools = ['Laser projector and slides', 'Clicker', 'Wireless mic'];
  if (steps.some((s) => s.board)) tools.push('Whiteboard wall');
  if (steps.some((s) => s.tool === 'doccam')) tools.push('Document camera');
  if (steps.some((s) => s.tool === 'poll')) tools.push('Live poll');
  const shirts = ['#2f3b52', '#7a2e2e', '#3c5a3a', '#4a3f6b', '#5b4636'];
  const lesson = {
    name: section.name || 'The professor',
    when: section.when || 'Meeting time not listed',
    voice,
    rate: lessons[voice].rate,
    pitch: lessons[voice].pitch,
    playback: b.pace.value,
    voiceHint: lessons[voice].voiceHint,
    wait: b.waitSeconds.value,
    laptop: b.laptopShare.value,
    late: b.lateShare.value,
    att: [b.attendanceStart.value, b.attendanceDropPerWeek.value, 0.45],
    profile: p,
    shirt: shirts[Math.floor(rnd() * shirts.length)],
    pants: '#34363d',
    hair: ['#3a2a1e', '#9a9a9a', '#1a1410', '#6b4a2b'][Math.floor(rnd() * 4)],
    tools,
    style: describeStyle(p, steps),
    steps,
  };
  const data = {
    synthetic: true,
    course: section.course,
    section: section.section,
    profileSource: profileFromNotes ? 'Teaching profile from student notes (sample data)' : 'No profile yet, so the profile itself is synthetic',
    profile: p,
    behavior: Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v])),
    lessonOutline: steps.map((s) => `${s.move}${s.tool ? ` (${s.tool})` : ''} from sample lesson ${s.src.lesson}`),
    note: 'Simulated classroom behavior for a demo. Not observed data about any real class or professor.',
  };
  return { lesson, data };
}
