// Schedule checks that run entirely inside the extension, with no network and no account.
import { WEEK } from './parse.js';

const hasTime = (s) => Number.isInteger(s.start) && Number.isInteger(s.end) && s.days.length > 0;

export function overlaps(a, b) {
  if (!hasTime(a) || !hasTime(b)) return false;
  if (a.courseCode === b.courseCode && a.sectionId === b.sectionId) return false;
  return a.days.some((d) => b.days.includes(d)) && a.start < b.end && b.start < a.end;
}

/** Every pair of sections that meet at the same time on a shared day. */
export function findConflicts(sections) {
  const pairs = [];
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      if (overlaps(sections[i], sections[j])) pairs.push([sections[i], sections[j]]);
    }
  }
  return pairs;
}

export function formatClock(minutes) {
  const h24 = Math.floor(minutes / 60);
  const m = String(minutes % 60).padStart(2, '0');
  const suffix = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m}${suffix}`;
}

/** Facts about a section's time that are worth a glance: very early starts and late finishes. */
export function timeFlags(section, { early = 9 * 60, late = 19 * 60 } = {}) {
  if (!hasTime(section)) return [];
  const flags = [];
  if (section.start < early) flags.push({ key: 'early', label: `Starts at ${formatClock(section.start)}` });
  if (section.end > late) flags.push({ key: 'late', label: `Ends at ${formatClock(section.end)}` });
  return flags;
}

/** Minutes of class per weekday, and the busiest day, for the sections a student pinned. */
export function dayLoad(sections) {
  const load = Object.fromEntries(WEEK.map((d) => [d, 0]));
  for (const s of sections.filter(hasTime)) for (const d of s.days) load[d] += s.end - s.start;
  const busiest = WEEK.reduce((best, d) => (load[d] > load[best] ? d : best), WEEK[0]);
  return { load, busiest: load[busiest] > 0 ? busiest : null };
}
