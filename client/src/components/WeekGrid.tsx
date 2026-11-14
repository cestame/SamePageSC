import { motion } from 'motion/react';
import { Warning } from '@phosphor-icons/react';
import type { MeetingTime } from '../lib/api';
import { WEEK_DAYS, dayName, formatMinutes } from '../lib/time';

export type WeekBlock = { id: string; title: string; detail: string; time: MeetingTime; problem: boolean };

const HOUR_HEIGHT = 44;

/** A Monday-to-Friday calendar of the planned sections, with the student's time window marked. */
export function WeekGrid({ blocks, earliest, latest }: { blocks: WeekBlock[]; earliest?: number; latest?: number }) {
  const starts = blocks.map((b) => b.time.start);
  const ends = blocks.map((b) => b.time.end);
  const firstHour = Math.floor(Math.min(earliest ?? 9 * 60, ...starts) / 60);
  const lastHour = Math.ceil(Math.max(Math.min(latest ?? 17 * 60, 20 * 60), ...ends) / 60);
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i);
  const top = (minutes: number) => ((minutes - firstHour * 60) / 60) * HOUR_HEIGHT;
  const height = hours.length * HOUR_HEIGHT;

  return (
    <div className="week" role="table" aria-label="Your week">
      <div className="week__head" role="row">
        <span role="columnheader"><span className="visually-hidden">Time</span></span>
        {WEEK_DAYS.map((d) => <span key={d} role="columnheader" className="week__day text-small">{dayName(d)}</span>)}
      </div>
      <div className="week__body" style={{ height }}>
        <div className="week__hours" aria-hidden>
          {hours.map((h) => (
            <span key={h} className="week__hour text-small text-muted" style={{ top: top(h * 60) }}>{formatMinutes(h * 60).replace(':00', '')}</span>
          ))}
        </div>
        {earliest != null && earliest > firstHour * 60 && (
          <div className="week__outside" style={{ top: 0, height: top(earliest) }} aria-hidden />
        )}
        {latest != null && latest < lastHour * 60 && (
          <div className="week__outside" style={{ top: top(latest), height: height - top(latest) }} aria-hidden />
        )}
        {WEEK_DAYS.map((d, col) => (
          <div key={d} className="week__column" style={{ gridColumn: col + 2 }} role="row">
            {blocks.filter((b) => b.time.days.includes(d)).map((b, i) => (
              <motion.div
                key={b.id}
                role="cell"
                className={b.problem ? 'week__block week__block--problem' : 'week__block'}
                style={{ top: top(b.time.start), height: top(b.time.end) - top(b.time.start) }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * (col + i), duration: 0.2 }}
                aria-label={`${dayName(d)}: ${b.title}, ${b.detail}`}
              >
                <span className="week__block-title">{b.title}</span>
                <span className="week__block-detail">{b.detail}</span>
                {b.problem && <Warning className="week__block-icon" size={14} weight="fill" aria-hidden />}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
