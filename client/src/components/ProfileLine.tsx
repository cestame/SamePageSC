import { motion } from 'motion/react';
import { FIELDS } from '../../../shared/content.js';
import type { FieldKey } from '../lib/api';

type Values = Partial<Record<FieldKey, number | null>>;

type Props = {
  values: Values;
  /** What the student asked for, drawn on top as a dashed line. The shaded gap between the lines is the mismatch. */
  target?: Values;
  size?: 'glyph' | 'card';
  /** Name used in the accessible description, e.g. "Dr. Maya Reyes". */
  label: string;
  animate?: boolean;
};

const SIZES = {
  glyph: { width: 30, rowGap: 6, pad: 3, labelWidth: 0, dot: 2, stroke: 1.6 },
  card: { width: 340, rowGap: 30, pad: 12, labelWidth: 112, dot: 5.5, stroke: 2.5 },
} as const;

const EASE = [0.22, 0.8, 0.2, 1] as const;

/**
 * The teaching profile drawn as one line: seven rows (one per field), a dot at the 1-5 value on each,
 * joined top to bottom. Every class gets a recognizable shape. Missing values sit at the midpoint, hollow.
 */
export function ProfileLine({ values, target, size = 'card', label, animate = true }: Props) {
  const dims = SIZES[size];
  const trackStart = dims.labelWidth + dims.pad;
  const trackWidth = dims.width - trackStart - dims.pad;
  const x = (v: number) => trackStart + ((v - 1) / 4) * trackWidth;
  const y = (row: number) => dims.pad + row * dims.rowGap;
  const height = y(FIELDS.length - 1) + dims.pad;

  const points = FIELDS.map((f, row) => ({ key: f.key, known: values[f.key] != null, x: x(values[f.key] ?? 3), y: y(row) }));
  const linePath = toPath(points);
  const targetPoints = target ? FIELDS.map((f, row) => ({ x: x(target[f.key] ?? 3), y: y(row) })) : null;

  return (
    <svg
      className={`profile-line profile-line--${size}`}
      viewBox={`0 0 ${dims.width} ${height}`}
      width={dims.width}
      role="img"
      aria-label={describe(label, values, target)}
    >
      {FIELDS.map((f, row) => (
        <g key={f.key}>
          <line className="profile-line__track" x1={x(1)} x2={x(5)} y1={y(row)} y2={y(row)} />
          {size === 'card' && [1, 2, 3, 4, 5].map((step) => (
            <circle key={step} className="profile-line__step" cx={x(step)} cy={y(row)} r={1.6} />
          ))}
          {size === 'card' && (
            <text className="profile-line__label" x={0} y={y(row) + 5}>{f.label}</text>
          )}
        </g>
      ))}

      {targetPoints && (
        <>
          <polygon
            className="profile-line__gap"
            points={[...points, ...[...targetPoints].reverse()].map((p) => `${p.x},${p.y}`).join(' ')}
          />
          <path className="profile-line__target" d={toPath(targetPoints)} />
          {targetPoints.map((p, row) => (
            <circle key={row} className="profile-line__target-dot" cx={p.x} cy={p.y} r={dims.dot - 0.5} />
          ))}
        </>
      )}

      <motion.path
        className="profile-line__line"
        d={linePath}
        strokeWidth={dims.stroke}
        initial={animate ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
      />
      {points.map((p, row) => (
        <motion.circle
          key={p.key}
          className={p.known ? 'profile-line__dot' : 'profile-line__dot profile-line__dot--unknown'}
          cx={p.x}
          cy={p.y}
          r={dims.dot}
          initial={animate ? { scale: 0 } : false}
          animate={{ scale: 1 }}
          transition={{ duration: 0.25, delay: 0.15 + row * 0.08, ease: EASE }}
        />
      ))}
    </svg>
  );
}

function toPath(points: { x: number; y: number }[]) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
}

function describe(label: string, values: Values, target?: Values) {
  const rows = FIELDS.map((f) => {
    const v = values[f.key];
    const own = v == null ? `${f.label} unknown` : `${f.label} ${v} of 5`;
    const want = target?.[f.key];
    return want == null ? own : `${own}, you asked for ${want}`;
  });
  return `Teaching profile for ${label}: ${rows.join('; ')}.`;
}
