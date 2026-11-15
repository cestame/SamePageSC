import { motion } from "motion/react";
import type { Variants } from "motion/react";
import { easeSamePage, exitTransition } from "@/engine/motion";
import { profileFields, type Profile } from "./content";

const SCALE_STEPS = [1, 2, 3, 4, 5];
const LINE_SECONDS = 0.7;
const DOT_STAGGER = 0.08;

/** The brand kit's motion: the line draws in once (about 0.7s), then the dots pop in one after another. */
function drawIn(delay: number): Variants {
  return {
    enter: { pathLength: 0, opacity: 0 },
    present: {
      pathLength: 1,
      opacity: 1,
      transition: { pathLength: { duration: LINE_SECONDS, ease: easeSamePage, delay }, opacity: { duration: 0.01, delay } },
    },
    exit: { opacity: 0, transition: exitTransition },
  };
}

function popIn(delay: number): Variants {
  return {
    enter: { scale: 0, opacity: 0 },
    present: { scale: 1, opacity: 1, transition: { duration: 0.3, ease: easeSamePage, delay } },
    exit: { opacity: 0, transition: exitTransition },
  };
}

function fadeIn(delay: number): Variants {
  return {
    enter: { opacity: 0 },
    present: { opacity: 1, transition: { duration: 0.5, ease: easeSamePage, delay } },
    exit: { opacity: 0, transition: exitTransition },
  };
}
const ROW_COUNT = profileFields.length;

type Point = { x: number; y: number };
type Geometry = { width: number; rowGap: number; inset: number };

function pointsFor(profile: Profile, { width, rowGap, inset }: Geometry): Point[] {
  return profile.map((value, row) => ({ x: inset + ((value - 1) / 4) * width, y: inset + row * rowGap }));
}

function pathFor(points: Point[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
}

function gapShape(section: Point[], student: Point[]) {
  return `${pathFor(section)} ${[...student].reverse().map((point) => `L${point.x} ${point.y}`).join(" ")} Z`;
}

function Rails({ geometry }: { geometry: Geometry }) {
  const { width, rowGap, inset } = geometry;
  return profileFields.map((field, row) => (
    <g key={field.key} transform={`translate(${inset} ${inset + row * rowGap})`}>
      <line x2={width} className="stroke-rule" strokeWidth={2} />
      {SCALE_STEPS.map((step) => (
        <circle key={step} cx={((step - 1) / 4) * width} r={3.5} className="fill-rule" />
      ))}
    </g>
  ));
}

export type ProfileSize = { width: number; rowGap: number; pointRadius: number };

export const profileSizes = {
  hero: { width: 560, rowGap: 104, pointRadius: 14 },
  large: { width: 440, rowGap: 74, pointRadius: 11 },
  card: { width: 320, rowGap: 62, pointRadius: 10 },
  mini: { width: 260, rowGap: 30, pointRadius: 7 },
} satisfies Record<string, ProfileSize>;

type ProfileLineProps = {
  profile: Profile;
  student?: Profile;
  label: string;
  size?: ProfileSize;
  delay?: number;
};

/**
 * The teaching profile: seven 1 to 5 ratings joined into one line, the motif the Same Page app uses everywhere.
 * With `student`, the student's answers are a dashed line (faded in, because drawing a path in with pathLength replaces its dashes) and the space between the two lines is shaded.
 * The SVG draws at its own pixel size so `ProfileLabels` beside it lines up row for row.
 */
export function ProfileLine({ profile, student, label, size = profileSizes.large, delay = 0 }: ProfileLineProps) {
  const geometry = { width: size.width, rowGap: size.rowGap, inset: size.pointRadius + 4 };
  const section = pointsFor(profile, geometry);
  const answers = student ? pointsFor(student, geometry) : undefined;
  const width = size.width + geometry.inset * 2;
  const height = size.rowGap * (ROW_COUNT - 1) + geometry.inset * 2;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="shrink-0 overflow-visible" role="img" aria-label={label}>
      <Rails geometry={geometry} />
      {answers && (
        <>
          <motion.path d={gapShape(section, answers)} className="fill-accent-wash" variants={fadeIn(delay + LINE_SECONDS * 2 + 0.2)} />
          <motion.path d={pathFor(answers)} fill="none" className="stroke-ink-muted" strokeWidth={3} strokeDasharray="10 9" variants={fadeIn(delay + LINE_SECONDS + DOT_STAGGER * 7)} />
        </>
      )}
      <motion.path
        d={pathFor(section)}
        fill="none"
        className="stroke-accent"
        strokeWidth={size.pointRadius * 0.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        variants={drawIn(delay)}
      />
      {section.map((point, index) => (
        <motion.circle key={profileFields[index].key} cx={point.x} cy={point.y} r={size.pointRadius} className="fill-accent" style={{ transformBox: "fill-box", transformOrigin: "center" }} variants={popIn(delay + LINE_SECONDS + DOT_STAGGER * index)} />
      ))}
    </svg>
  );
}

/** The seven field names, spaced to sit beside a `ProfileLine` of the same size. */
export function ProfileLabels({ size = profileSizes.large, showRange = true }: { size?: ProfileSize; showRange?: boolean }) {
  const inset = size.pointRadius + 4;
  return (
    <ul className="shrink-0" style={{ marginTop: inset - size.rowGap / 2 }}>
      {profileFields.map((field) => (
        <li key={field.key} className="flex flex-col justify-center" style={{ height: size.rowGap }}>
          <span className="text-caption leading-none font-bold text-ink-soft">{field.label}</span>
          {showRange && <span className="mt-1.5 text-fineprint leading-none text-ink-faint">{field.range}</span>}
        </li>
      ))}
    </ul>
  );
}

/** A thumbnail of the profile line, the glyph the extension puts beside each fit badge. */
const glyphTone = { dark: "stroke-accent", light: "stroke-accent-deep" };

/** `light` draws the glyph in cardinal for light pages such as the Web Registration mockup. */
export function ProfileGlyph({ profile, ground = "dark", className = "" }: { profile: Profile; ground?: keyof typeof glyphTone; className?: string }) {
  const points = profile.map((value, row) => ({ x: 3 + ((value - 1) / 4) * 18, y: 3 + row * 5 }));
  return (
    <svg viewBox="0 0 24 36" aria-hidden className={className}>
      <path d={pathFor(points)} fill="none" className={glyphTone[ground]} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
