import type { MeetingTime } from './api';

const DAY_NAMES: Record<string, string> = { M: 'Mon', T: 'Tue', W: 'Wed', Th: 'Thu', F: 'Fri' };
export const WEEK_DAYS = ['M', 'T', 'W', 'Th', 'F'] as const;
export const dayName = (d: string) => DAY_NAMES[d] ?? d;

/** 540 -> "9:00 am", 750 -> "12:30 pm" */
export function formatMinutes(minutes: number) {
  const h24 = Math.floor(minutes / 60);
  const m = String(minutes % 60).padStart(2, '0');
  const suffix = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m} ${suffix}`;
}

/** "Mon and Wed, 10:00 am to 11:50 am" */
export function formatMeeting(time: MeetingTime | null) {
  if (!time) return 'Meeting time not listed';
  const days = time.days.map(dayName);
  const dayText = days.length > 1 ? `${days.slice(0, -1).join(', ')} and ${days[days.length - 1]}` : days[0];
  return `${dayText}, ${formatMinutes(time.start)} to ${formatMinutes(time.end)}`;
}
