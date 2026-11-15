import { Armchair, WarningCircle } from "@phosphor-icons/react";
import { motion, type Variants } from "motion/react";
import { asset } from "@/engine/asset";
import { CountUp, StepView, fadeReveal } from "@/engine/primitives";
import { easeSamePage } from "@/engine/motion";
import { useIsPortrait } from "@/engine/orientation";
import { fit, links, sampleCourse, sampleLabel, shapes, tryClass, webreg, type SampleSection } from "../content";
import { ProfileGlyph, ProfileLabels, ProfileLine, profileSizes } from "../ProfileLine";
import { Heading, Note } from "../ui";

const [reyes] = sampleCourse.sections;
const percent = (value: number) => `${Math.round(value)}%`;

/** On the portrait canvas the three sections stack, each card carrying its own field names at a smaller size. */
function ShapeCards({ tall }: { tall: boolean }) {
  const size = tall ? profileSizes.mini : profileSizes.card;
  return sampleCourse.sections.map((section, index) => (
    <motion.figure
      key={section.number}
      variants={fadeReveal(0.5 + index * 0.6, 24)}
      className={`flex rounded-card bg-paper-raised shadow-card ${tall ? "flex-col gap-4 px-8 py-6" : "flex-col gap-8 px-10 pt-8 pb-10"}`}
    >
      <figcaption>
        <p className="text-point leading-tight font-bold">{section.instructor}</p>
      </figcaption>
      <div className="flex items-start gap-8">
        {tall && <ProfileLabels size={size} showRange={false} />}
        <ProfileLine profile={section.profile} label={`Teaching profile for ${section.instructor}'s section`} size={size} delay={0.8 + index * 0.6} />
      </div>
    </motion.figure>
  ));
}

export function ShapesSlide() {
  const tall = useIsPortrait();
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={shapes.heading} size="headline" />
      <div className={`flex gap-12 ${tall ? "flex-col gap-6" : "items-end"}`}>
        {!tall && (
          <motion.div variants={fadeReveal(0.5)}>
            <ProfileLabels size={profileSizes.card} showRange={false} />
          </motion.div>
        )}
        <ShapeCards tall={tall} />
      </div>
      <Note delay={2.3}>All instructors shown are fictional samples.</Note>
    </StepView>
  );
}

function Legend() {
  return (
    <motion.dl variants={fadeReveal(2)} className="flex gap-10 text-caption text-ink-muted">
      <div className="flex items-center gap-3">
        <dt className="h-1 w-12 border-t-[3px] border-dashed border-ink-muted" />
        <dd>{fit.legend.student}</dd>
      </div>
      <div className="flex items-center gap-3">
        <dt className="h-1.5 w-12 bg-accent" />
        <dd>{fit.legend.section}</dd>
      </div>
      <div className="flex items-center gap-3">
        <dt className="h-6 w-12 bg-accent-wash" />
        <dd>{fit.legend.gap}</dd>
      </div>
    </motion.dl>
  );
}

export function FitSlide() {
  const tall = useIsPortrait();
  const size = tall ? profileSizes.card : profileSizes.large;
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={fit.heading} />
      <div className={tall ? "flex flex-col gap-10" : "grid grid-cols-[auto_1fr] items-center gap-gap"}>
        <div className={`flex flex-col ${tall ? "gap-6" : "gap-10"}`}>
          <div className="flex items-start gap-10">
            <ProfileLabels size={size} showRange={false} />
            <ProfileLine profile={reyes.profile} student={fit.student} label="Dr. Reyes's profile with the student's answers drawn over it" size={size} delay={0.4} />
          </div>
          <Legend />
        </div>
        <motion.article variants={fadeReveal(1.6, 24)} className={`flex flex-col rounded-card bg-paper-raised shadow-offset ${tall ? "gap-6 p-10" : "gap-10 p-12"}`}>
          <div>
            <p className="text-point font-bold">
              {reyes.instructor}, {sampleCourse.code}
            </p>
            <p className="text-fineprint text-ink-faint">{sampleLabel}</p>
          </div>
          <p className="flex items-center gap-6">
            <span aria-hidden className="size-6 shrink-0 rounded-full bg-mark-strong" />
            <span className="font-display text-display leading-none font-extrabold figures-tabular">
              <CountUp total={reyes.fit} format={percent} delay={1.8} duration={1.2} />
            </span>
            <span className="max-w-[360px] text-caption text-ink-muted">{fit.scoreCounts}</span>
          </p>
          <motion.div variants={fadeReveal(2.6)}>
            <p className="text-caption font-bold text-ink-muted">{fit.whyTitle}</p>
            <p className="text-point">{fit.why}</p>
          </motion.div>
          <motion.div variants={fadeReveal(3.2)}>
            <p className="flex items-center gap-2 text-caption font-bold text-ink-muted">
              <WarningCircle size={28} className="text-warning" aria-hidden />
              {fit.downsideTitle}
            </p>
            <p className="text-point">{fit.downside}</p>
          </motion.div>
        </motion.article>
      </div>
      <span />
    </StepView>
  );
}

/* The Web Registration demo plays as one short sequence: rows, then badges popping in, then a click that opens the panel. */
const BADGES_AT = 1;
const BADGE_STAGGER = 0.4;
const CLICK_AT = 3.2;
const PANEL_AT = CLICK_AT + 0.3;

function popIn(delay: number): Variants {
  return {
    enter: { scale: 0.6, opacity: 0 },
    present: { scale: 1, opacity: 1, transition: { duration: 0.45, ease: easeSamePage, delay } },
  };
}

/** The pointer travels to Reyes's badge, then a ring shows the click. */
function ClickCursor() {
  return (
    <>
      <motion.span
        aria-hidden
        className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-accent"
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: [0.3, 1.6], opacity: [0, 1, 0], transition: { duration: 0.6, delay: CLICK_AT, times: [0, 0.2, 1] } }}
      />
      <motion.svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-1/2 left-1/2 size-14 drop-shadow"
        initial={{ x: 360, y: 260, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1, transition: { duration: 1.1, ease: easeSamePage, delay: CLICK_AT - 1.1 } }}
      >
        <path d="M4 2 L4 20 L9 15 L12.5 22 L15.5 20.5 L12 13.5 L19 13.5 Z" className="fill-sheet-ink stroke-sheet" strokeWidth={1.5} strokeLinejoin="round" />
      </motion.svg>
    </>
  );
}

function SectionRow({ section, index }: { section: SampleSection; index: number }) {
  const isClicked = index === 0;
  return (
    <li className="flex flex-col gap-3 border-b-2 border-sheet-rule pb-5">
      <div className="grid grid-cols-[180px_1fr_200px] text-caption">
        <span className="font-bold">{section.number} R</span>
        <span>{section.instructor}</span>
        <span>
          {section.days} {section.time.split(" to ")[0]}
        </span>
      </div>
      <motion.span variants={popIn(BADGES_AT + index * BADGE_STAGGER)} className="relative flex items-center gap-3 self-start rounded-chip bg-sheet px-5 py-2 text-body shadow-lift ring-2 ring-sheet-rule">
        <ProfileGlyph profile={section.profile} ground="light" className="h-11 w-7" />
        <span className="font-extrabold figures-tabular">
          <CountUp total={section.fit} format={percent} delay={BADGES_AT + index * BADGE_STAGGER} duration={0.8} />
        </span>
        <span>fit with {section.shortName}</span>
        {isClicked && <ClickCursor />}
      </motion.span>
    </li>
  );
}

function WebRegMock() {
  return (
    <motion.figure variants={fadeReveal(0.3, 24)} className="overflow-hidden rounded-card bg-sheet text-sheet-ink shadow-float">
      <p className="bg-accent-deep px-10 py-5 font-display text-title leading-none font-bold text-sheet">{webreg.page}</p>
      <div className="flex flex-col gap-5 px-10 pt-7 pb-8">
        <p className="text-point font-bold">
          {sampleCourse.code}: {sampleCourse.name}
        </p>
        <ul className="flex flex-col gap-5">
          {sampleCourse.sections.map((section, index) => (
            <SectionRow key={section.number} section={section} index={index} />
          ))}
        </ul>
      </div>
    </motion.figure>
  );
}

const panelSlide: Variants = {
  enter: { x: 160, opacity: 0 },
  present: { x: 0, opacity: 1, transition: { duration: 0.7, ease: easeSamePage, delay: PANEL_AT } },
};

function SidePanelMock() {
  const tall = useIsPortrait();
  return (
    <motion.aside variants={panelSlide} className={`flex flex-col gap-6 rounded-card bg-paper-raised p-10 shadow-offset ${tall ? "w-full" : "w-[520px]"}`}>
      <p className="text-caption text-ink-muted">{webreg.panelTitle}</p>
      <p className="flex items-baseline gap-4">
        <span className="font-display text-title leading-none font-extrabold">{reyes.fit}%</span>
        <span className="text-caption">fit with {reyes.instructor}</span>
      </p>
      <ProfileLine profile={reyes.profile} student={fit.student} label="The side panel shows the profile with your answers" size={tall ? profileSizes.mini : profileSizes.card} delay={PANEL_AT + 0.4} />
      <p className="flex items-start gap-2 text-caption text-ink-soft">
        <WarningCircle size={28} className="mt-0.5 shrink-0 text-warning" aria-hidden />
        {fit.downside}
      </p>
    </motion.aside>
  );
}

export function WebRegSlide() {
  const tall = useIsPortrait();
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={webreg.heading} />
      <div className={tall ? "flex flex-col gap-8" : "grid grid-cols-[1fr_auto] items-center gap-gap"}>
        <WebRegMock />
        <SidePanelMock />
      </div>
      <Note delay={PANEL_AT + 1}>{webreg.demoNote}</Note>
    </StepView>
  );
}

/* A real frame of the 3D hall, taken from the simulation. It drifts slowly so the slide feels alive while the presenter talks. */
const slowZoom: Variants = {
  enter: { scale: 1.08, opacity: 0 },
  present: { scale: 1, opacity: 1, transition: { scale: { duration: 9, ease: "easeOut" }, opacity: { duration: 0.8 } } },
};

const MOMENT_HEIGHT = 84;
const MOMENT_SECONDS = 1.8;

/** A highlight walks down the moments, the way a student jumps between them in the simulation. */
function MomentHighlight() {
  const stops = tryClass.moments.map((_, index) => index * MOMENT_HEIGHT);
  return (
    <motion.span
      aria-hidden
      className="absolute inset-x-0 top-0 rounded-card bg-control"
      style={{ height: MOMENT_HEIGHT - 12 }}
      initial={{ y: 0, opacity: 0 }}
      animate={{
        y: stops,
        opacity: 1,
        transition: { y: { duration: MOMENT_SECONDS * stops.length, delay: 1.6, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }, opacity: { delay: 1.4 } },
      }}
    />
  );
}

export function TryClassSlide() {
  const tall = useIsPortrait();
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={tryClass.heading} />
      <div className={tall ? "flex flex-col gap-8" : "grid grid-cols-[1fr_440px] items-center gap-gap"}>
        <motion.figure variants={fadeReveal(0.3, 24)} className="relative overflow-hidden rounded-card shadow-float" style={{ height: tall ? 480 : 600 }}>
          <motion.img variants={slowZoom} src={asset("/hall.jpg")} alt="The simulated 3D lecture hall, seen from the back during a lesson" className="size-full object-cover" />
          <motion.span
            aria-hidden
            className="absolute flex size-20 items-center justify-center rounded-full bg-accent text-on-control shadow-float"
            style={{ left: "58%", top: "62%" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.15, 1], opacity: 1, transition: { delay: 1.2, duration: 0.6, ease: easeSamePage } }}
          >
            <Armchair size={44} weight="fill" />
          </motion.span>
        </motion.figure>
        <motion.ol variants={fadeReveal(1)} className="relative flex flex-col">
          <MomentHighlight />
          {tryClass.moments.map((moment) => (
            <li key={moment} className="relative flex items-center px-7 text-body" style={{ height: MOMENT_HEIGHT }}>
              <span className="relative -translate-y-1.5 text-ink mix-blend-difference">{moment}</span>
            </li>
          ))}
        </motion.ol>
      </div>
      <Note delay={1.6}>
        {tryClass.status}. Live at{" "}
        <a data-interactive href={links.tryClass} target="_blank" rel="noreferrer" className="pointer-events-auto underline underline-offset-4">
          samepage.replit.app/try-this-class
        </a>
      </Note>
    </StepView>
  );
}
