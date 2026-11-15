import { AnimatePresence, motion, type Variants } from "motion/react";
import { CountUp, MaskedLines, StepView, fadeReveal } from "@/engine/primitives";
import { easeDrawn, easeSamePage } from "@/engine/motion";
import { ratings, sampleCourse, survey, title } from "../content";
import { HorseIntro } from "../HorseIntro";
import { ProfileLine, profileSizes } from "../ProfileLine";
import { Heading, Wordmark } from "../ui";

type SlideProps = { step: number };

const percent = (value: number) => `${Math.round(value)}%`;

/** The text waits for the horse to arrive, so the slide reads in the same order as the app's intro. */
const TITLE_TEXT_DELAY = 1.2;
const HORSE_PAGE_WIDTH = 820;

/** The cream page the horse runs on, as in the app's intro. It clips the horse so it gallops in from the page's edge. */
function HorsePage() {
  return (
    <div className="absolute inset-y-0 right-0 flex items-center justify-center overflow-hidden bg-brand-cream" style={{ width: HORSE_PAGE_WIDTH }}>
      <div className="flex flex-col items-center">
        <HorseIntro width={620} startX={-HORSE_PAGE_WIDTH} />
        <div aria-hidden className="h-1 w-[720px] bg-brand-cardinal" />
      </div>
    </div>
  );
}

export function TitleSlide() {
  return (
    <StepView className="flex items-center">
      <HorsePage />
      <div className="flex flex-col gap-12" style={{ maxWidth: 1920 - HORSE_PAGE_WIDTH - 200 }}>
        <motion.div variants={fadeReveal(TITLE_TEXT_DELAY, 20)}>
          <Wordmark className="w-[560px]" />
        </motion.div>
        <h1 className="font-display text-headline font-bold">
          <MaskedLines lines={title.pitch} delay={TITLE_TEXT_DELAY + 0.3} />
        </h1>
        <motion.p variants={fadeReveal(TITLE_TEXT_DELAY + 0.9)} className="text-lede font-bold">
          {title.tagline}
        </motion.p>
      </div>
    </StepView>
  );
}

function dotFill(isCounted: boolean, delay: number): Variants {
  return {
    enter: { scale: 0.4, opacity: 0 },
    present: { scale: 1, opacity: isCounted ? 1 : 0.5, transition: { duration: 0.5, ease: easeDrawn, delay } },
  };
}

const DOT_GAP = 41;

function StudentDots({ count, rowDelay }: { count: number; rowDelay: number }) {
  return (
    <svg viewBox={`0 0 ${survey.respondents * DOT_GAP} 36`} className="w-full" role="img" aria-label={`${count} of ${survey.respondents} students`}>
      {Array.from({ length: survey.respondents }, (_, index) => (
        <motion.circle
          key={index}
          cx={index * DOT_GAP + 18}
          cy={18}
          r={15}
          className={index < count ? "fill-accent" : "fill-rule"}
          variants={dotFill(index < count, rowDelay + index * 0.03)}
        />
      ))}
    </svg>
  );
}

export function SurveySlide() {
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={survey.heading} />
      <ul className="flex flex-col gap-14">
        {survey.rows.map((row, index) => {
          const rowDelay = 0.6 + index * 0.9;
          return (
            <motion.li key={row.line} variants={fadeReveal(rowDelay - 0.2)} className="grid grid-cols-[300px_1fr] items-center gap-gap-sm">
              <p className="font-display text-headline leading-none font-bold">
                <CountUp total={row.percent} format={percent} delay={rowDelay} />
              </p>
              <div className="flex flex-col gap-3">
                <StudentDots count={row.count} rowDelay={rowDelay} />
                <p className="text-point">
                  <span className="font-bold">
                    {row.count} of {survey.respondents}
                  </span>{" "}
                  {row.line}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ul>
      <span />
    </StepView>
  );
}

function grow(delay: number, duration = 1.2): Variants {
  return {
    enter: { scaleX: 0 },
    present: { scaleX: 1, transition: { duration, ease: easeSamePage, delay } },
  };
}

function draw(delay: number): Variants {
  return {
    enter: { pathLength: 0 },
    present: { pathLength: 1, transition: { duration: 1, ease: easeSamePage, delay } },
  };
}

const PANEL = "flex flex-col gap-6 rounded-card bg-paper-raised p-10 shadow-card";
const growFromLeft = { transformBox: "fill-box", transformOrigin: "left center" } as const;

/** Easiness and rating correlate at 0.61, shown as a meter from 0 (no relation) to 1 (move in lockstep). */
function EasinessMeter() {
  const { easiness } = ratings.learning;
  return (
    <motion.figure variants={fadeReveal(0.5, 24)} className={PANEL}>
      <p className="font-display text-display leading-none font-bold text-accent">
        <CountUp total={easiness.value} format={(value) => value.toFixed(2)} delay={0.7} />
      </p>
      <svg viewBox="0 0 440 40" className="w-full" aria-hidden>
        <rect width={440} height={24} y={8} rx={12} className="fill-paper-sunken" />
        <motion.rect width={440 * easiness.value} height={24} y={8} rx={12} className="fill-accent" style={growFromLeft} variants={grow(0.7, 1.4)} />
      </svg>
      <figcaption className="text-point font-bold">{easiness.label}</figcaption>
    </motion.figure>
  );
}

/** Ratings rise with the grade a student expects and fall with how they do in the next course. Directions only, no values. */
function GradesSlopes() {
  const { grades } = ratings.learning;
  return (
    <motion.figure variants={fadeReveal(0.8, 24)} className={PANEL}>
      <svg viewBox="0 0 440 200" className="w-full" aria-label={`Ratings go up with the ${grades.up.toLowerCase()} and down with ${grades.down.toLowerCase()}`}>
        <line x1={20} y1={180} x2={420} y2={180} className="stroke-rule" strokeWidth={3} />
        <motion.path d="M30 160 L410 30" fill="none" className="stroke-accent" strokeWidth={10} strokeLinecap="round" variants={draw(1)} />
        <motion.path d="M30 40 L410 150" fill="none" className="stroke-ink-muted" strokeWidth={10} strokeLinecap="round" strokeDasharray="2 18" variants={fadeReveal(1.6)} />
      </svg>
      <dl className="flex flex-col gap-2 text-caption">
        <div className="flex items-center gap-3">
          <dt className="h-2.5 w-10 rounded-full bg-accent" />
          <dd>{grades.up}</dd>
        </div>
        <div className="flex items-center gap-3">
          <dt className="h-2.5 w-10 rounded-full border-t-[5px] border-dotted border-ink-muted" />
          <dd>{grades.down}</dd>
        </div>
      </dl>
      <figcaption className="text-point font-bold">{grades.label}</figcaption>
    </motion.figure>
  );
}

/** A flat line: across multisection studies, ratings and learning are not related. */
function NoLinkLine() {
  return (
    <motion.figure variants={fadeReveal(1.1, 24)} className={PANEL}>
      <svg viewBox="0 0 440 200" className="w-full" aria-label="Ratings and learning show no relation">
        <line x1={20} y1={180} x2={420} y2={180} className="stroke-rule" strokeWidth={3} />
        <line x1={20} y1={20} x2={20} y2={180} className="stroke-rule" strokeWidth={3} />
        <motion.path d="M40 100 L410 100" fill="none" className="stroke-accent" strokeWidth={10} strokeLinecap="round" variants={draw(1.4)} />
      </svg>
      <figcaption className="text-point font-bold">{ratings.learning.learning.label}</figcaption>
    </motion.figure>
  );
}

function LearningView() {
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={ratings.learning.heading} />
      <div className="grid grid-cols-3 items-stretch gap-gap-sm">
        <EasinessMeter />
        <GradesSlopes />
        <NoLinkLine />
      </div>
      <span />
    </StepView>
  );
}

/** Rating scale 1 to 5 drawn over this width. Base bar length is illustrative; the 0.7 gap (midpoint of 0.6 to 0.8) is to scale. */
const SCALE_WIDTH = 560;
const ratingX = (rating: number) => ((rating - 1) / 4) * SCALE_WIDTH;
const ILLUSTRATIVE_RATING = 4;
const CLARITY_GAP = 0.7;

function ClarityBar({ lower }: { lower: boolean }) {
  const end = ratingX(ILLUSTRATIVE_RATING - (lower ? CLARITY_GAP : 0));
  return (
    <svg viewBox={`0 0 ${SCALE_WIDTH} 56`} width={SCALE_WIDTH} aria-hidden>
      <rect width={SCALE_WIDTH} height={56} rx={14} className="fill-paper-sunken" />
      <motion.rect width={end} height={56} rx={14} className={lower ? "fill-rule" : "fill-ink-muted"} style={growFromLeft} variants={grow(1)} />
      {lower && (
        <motion.rect
          x={end}
          width={ratingX(ILLUSTRATIVE_RATING) - end}
          height={56}
          className="fill-accent"
          variants={fadeReveal(2.2)}
        />
      )}
    </svg>
  );
}

function SameTeaching({ label, lower, delay }: { label: string; lower: boolean; delay: number }) {
  return (
    <motion.figure variants={fadeReveal(delay, 24)} className="flex flex-col items-center gap-6 rounded-card bg-paper-raised px-12 py-10 shadow-card">
      <ProfileLine profile={sampleCourse.sections[0].profile} label={`${label}, same teaching profile`} size={profileSizes.mini} delay={delay + 0.2} />
      <figcaption className="text-point font-bold">{label}</figcaption>
      <ClarityBar lower={lower} />
    </motion.figure>
  );
}

function BiasView() {
  const { bias } = ratings;
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={bias.heading} />
      <div className="flex items-end gap-gap">
        <SameTeaching label={bias.instructors[0]} lower={false} delay={0.4} />
        <SameTeaching label={bias.instructors[1]} lower delay={0.6} />
        <motion.div variants={fadeReveal(2.3)} className="flex flex-col gap-5 pb-4">
          <p className="font-display text-title leading-tight font-bold text-accent">{bias.gap}</p>
          {bias.more.map((line) => (
            <p key={line} className="text-caption text-ink-soft">
              {line}
            </p>
          ))}
        </motion.div>
      </div>
      <motion.p variants={fadeReveal(2.6)} className="text-fineprint text-ink-faint">
        {bias.scaleNote}
      </motion.p>
    </StepView>
  );
}

export function RatingsSlide({ step }: SlideProps) {
  return <AnimatePresence mode="wait">{step === 0 ? <LearningView key="learning" /> : <BiasView key="bias" />}</AnimatePresence>;
}
