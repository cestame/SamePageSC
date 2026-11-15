// Pure text parsing for registration rows. No DOM access here, so every rule is unit tested.

const COURSE_RE = /\b([A-Z]{2,5})[\s-]*(\d{3}[A-Z]{0,2})\b/;
const SECTION_RE = /\b(\d{5})([A-Z]?)\b/;
const TIME_RE = /(\d{1,2}):(\d{2})\s*([ap])?\.?m?\.?\s*(?:-|–|to)\s*(\d{1,2}):(\d{2})\s*([ap])?\.?m?\.?/i;
const TYPE_RE = /\b(lecture-lab|lecture-discussion|lecture|laboratory|lab|discussion|quiz|seminar|studio)\b/i;
export const WEEK = Object.freeze(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
const FULL_DAY_RE = /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\.?(?=\W|$)/g;
const COMPACT_DAYS_RE = /\b((?:Th|Tu|Sa|Su|M|T|W|R|F)+)\b/;
const COMPACT_UNIT = { M: 'Mon', T: 'Tue', Tu: 'Tue', W: 'Wed', Th: 'Thu', R: 'Thu', F: 'Fri', Sa: 'Sat', Su: 'Sun' };

/** Collapses whitespace, drops control characters and caps length so page text can't bloat messages. */
export function cleanText(value, max = 120) {
  return String(value ?? '')
    .replace(/\p{Cc}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** "CSCI-103", "CSCI 103L" become "CSCI 103" and "CSCI 103L". Returns null when there is no course code. */
export function normalizeCourseCode(text) {
  const m = COURSE_RE.exec(String(text ?? ''));
  return m ? `${m[1]} ${m[2]}` : null;
}

/** Same rule as the server's courseIdFor, plus the base course for lab or quiz suffixes ("csci-103l" then "csci-103"). */
export function courseIdsFor(code) {
  const id = code.toLowerCase().replace(/\s+/g, '-');
  const base = id.replace(/[a-z]+$/, '');
  return base !== id ? [id, base] : [id];
}

function toMinutes(h, m, meridiem) {
  let hour = Number(h);
  if (meridiem) {
    if (hour === 12) hour = 0;
    if (meridiem.toLowerCase() === 'p') hour += 12;
  }
  return hour * 60 + Number(m);
}

/** "10:00am-11:50am", "2:00-3:20pm" and "14:00-15:50" all become minutes after midnight. */
export function parseTimeRange(text) {
  const m = TIME_RE.exec(String(text ?? ''));
  if (!m) return null;
  const [, h1, m1, mer1, h2, m2, mer2] = m;
  const end = toMinutes(h2, m2, mer2);
  let start = toMinutes(h1, m1, mer1 ?? mer2);
  if (!mer1 && mer2 && start > end) start = toMinutes(h1, m1, 'a');
  if (!(start >= 0 && end <= 24 * 60 && end > start)) return null;
  return { start, end, index: m.index };
}

/** Reads "Mon, Wed", "MWF", "TTh" or "TR". Unknown text such as "TBA" gives an empty list. */
export function parseDays(text) {
  const s = String(text ?? '');
  const full = [...s.matchAll(FULL_DAY_RE)].map((m) => m[1]);
  let days = full;
  if (!days.length) {
    const compact = COMPACT_DAYS_RE.exec(s);
    days = compact ? (compact[1].match(/Th|Tu|Sa|Su|M|T|W|R|F/g) ?? []).map((u) => COMPACT_UNIT[u]) : [];
  }
  return WEEK.filter((d) => days.includes(d));
}

/** Maps a table header to the field it holds. Order matters: "Instructor" is checked before generic words. */
const HEADER_RULES = [
  ['instructor', /instructor|professor|faculty/],
  ['location', /location|room|building/],
  ['units', /\bunits?\b/],
  ['seats', /registered|seats|enroll|capacity/],
  ['time', /\btimes?\b/],
  ['days', /\bdays?\b/],
  ['type', /\btype\b/],
  ['section', /\bsect(ion)?\b|class\s*#|section\s*#/],
  ['title', /\btitle\b|\bcourse\b/],
];
export function headerKey(text) {
  const t = cleanText(text, 60).toLowerCase();
  return HEADER_RULES.find(([, re]) => re.test(t))?.[0] ?? null;
}

function capitalize(word) {
  return word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : '';
}

/**
 * Turns one row's cell texts into a section. `cells` is keyed by headerKey, plus `all` for the whole row.
 * Returns null when the row has no five-digit section number, which skips header and note rows.
 */
export function parseRow(cells, courseCode) {
  const all = cleanText(cells.all ?? Object.values(cells).join(' '), 400);
  const sec = SECTION_RE.exec(cells.section ?? all);
  if (!sec || !courseCode) return null;
  const timeText = cells.time ?? all;
  const time = parseTimeRange(timeText);
  const daysSource = cells.days ?? (time ? timeText.slice(Math.max(0, time.index - 24), time.index) : '');
  const type = TYPE_RE.exec(cells.type ?? all)?.[1];
  return {
    courseCode,
    sectionId: sec[1] + sec[2],
    sectionNumber: sec[1],
    type: type ? type.split('-').map(capitalize).join('-') : '',
    days: parseDays(daysSource),
    start: time ? time.start : null,
    end: time ? time.end : null,
    instructor: cleanText(cells.instructor ?? '', 80),
  };
}

/** Last word of a name, lowercased, for a loose instructor match ("Dr. Maya Reyes" gives "reyes"). */
export function lastName(name) {
  const words = cleanText(name, 80).toLowerCase().replace(/[^a-z\s'-]/g, '').split(' ').filter(Boolean);
  return words.at(-1) ?? '';
}
