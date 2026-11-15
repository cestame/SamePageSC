import { Armchair, CircleNotch, HandPalm, Microphone, WarningCircle } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { StepView, fadeReveal } from "@/engine/primitives";
import { useIsPortrait } from "@/engine/orientation";
import { sampleCourse } from "../content";
import { CLASS_SLIDE_IDS, classTitle, dismissed, lesson, popQuiz, remember, reportCard, stars, syllabus } from "../classContent";
import { clock, useRecordingSeconds } from "../classroom/ClassroomControls";
import { reportProfile, handsOn, useClassroom, type ClassReport, type ClassTurn, type ReportOrigin } from "../classroom/store";
import { ProfileGlyph, ProfileLabels, ProfileLine, profileSizes } from "../ProfileLine";
import { Heading, Wordmark } from "../ui";
import { SiteQrCode } from "./plan";

const [reyes] = sampleCourse.sections;

/** A big live count of raised hands for one slide, updated as the TA presses H. */
function HandCount({ slideId, label }: { slideId: string; label: string }) {
  const { hands } = useClassroom();
  const count = hands[slideId] ?? 0;
  return (
    <motion.div variants={fadeReveal(0.6, 16)} className="flex items-center gap-8 self-start rounded-card bg-paper-raised px-12 py-8 shadow-offset">
      <HandPalm size={96} weight="fill" className="text-accent" aria-hidden />
      <p className="flex items-baseline gap-5">
        <motion.span key={count} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className="font-display text-display leading-none font-extrabold figures-tabular">
          {count}
        </motion.span>
        <span className="text-point text-ink-soft">{label}</span>
      </p>
    </motion.div>
  );
}

/** The start of the walkthrough: the slideshow turns into a class, and the recording light comes on. */
export function WelcomeSlide() {
  return (
    <StepView className="flex flex-col justify-center gap-14">
      <motion.div variants={fadeReveal(0.1, 20)}>
        <Wordmark className="w-[360px]" />
      </motion.div>
      <Heading lines={[classTitle.heading]} size="headline" delay={0.3} />
      <motion.p variants={fadeReveal(0.8)} className="text-lede font-bold text-ink-soft">{classTitle.course}</motion.p>
      <motion.p variants={fadeReveal(1.2)} className="flex items-center gap-4 self-start rounded-chip bg-mark px-8 py-4 text-point font-bold">
        <Microphone size={40} aria-hidden />
        {classTitle.recordingNotice}
      </motion.p>
    </StepView>
  );
}

/** A printed page, the joke's prop, drawn as a sheet with ruled lines. */
function PaperSheet() {
  return (
    <motion.div
      aria-hidden
      variants={{ enter: { rotate: -14, y: 60, opacity: 0 }, present: { rotate: -5, y: 0, opacity: 1, transition: { duration: 0.9, delay: 0.4 } } }}
      className="flex h-[520px] w-[400px] flex-col gap-5 rounded-lg bg-sheet p-12 shadow-float"
    >
      <span className="block h-6 w-3/4 rounded bg-sheet-ink/80" />
      {[90, 70, 85, 60, 80, 65, 75, 55].map((width, i) => (
        <span key={i} className="block h-3 rounded bg-sheet-rule" style={{ width: `${width}%` }} />
      ))}
    </motion.div>
  );
}

export function RememberSlide() {
  const tall = useIsPortrait();
  return (
    <StepView className={tall ? "flex flex-col justify-between" : "grid grid-cols-[1fr_auto] items-center gap-gap"}>
      <div className="flex flex-col gap-12">
        <Heading lines={[remember.heading]} size="headline" />
        <motion.p variants={fadeReveal(0.4)} className="text-lede text-ink-soft">{remember.question}</motion.p>
        <HandCount slideId="remember" label={remember.handsLabel} />
      </div>
      {!tall && <PaperSheet />}
    </StepView>
  );
}

export function StarsSlide() {
  const tall = useIsPortrait();
  const { survey } = stars;
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={[stars.heading]} />
      <div className={tall ? "flex flex-col gap-10" : "grid grid-cols-[auto_1fr] items-center gap-gap"}>
        <HandCount slideId="stars" label={stars.handsLabel} />
        <motion.dl variants={fadeReveal(1)} className="flex flex-col gap-6">
          <div className="flex items-baseline gap-5">
            <dt className="font-display text-title font-bold whitespace-nowrap text-accent figures-tabular">{survey.count} of {survey.respondents}</dt>
            <dd className="text-body text-ink-soft">{stars.surveyLine}</dd>
          </div>
          <div className="flex items-baseline gap-5">
            <dt className="font-display text-title font-bold text-accent figures-tabular">{survey.mismatch}</dt>
            <dd className="text-body text-ink-soft">{stars.mismatchLine}</dd>
          </div>
        </motion.dl>
      </div>
      <span />
    </StepView>
  );
}

/** Each syllabus item carries a small picture of the feature, so the room recognizes it without reading. */
const syllabusPictures = [
  <ProfileGlyph key="shape" profile={reyes.profile} className="h-20 w-14" />,
  <span key="fit" className="font-display text-title font-extrabold">{reyes.fit}%</span>,
  <span key="badge" className="flex items-center gap-2 rounded-chip bg-sheet px-4 py-2 text-caption font-bold text-sheet-ink"><ProfileGlyph profile={reyes.profile} ground="light" className="h-9 w-6" />{reyes.fit}%</span>,
  <Armchair key="seat" size={64} weight="fill" className="text-accent" />,
];

export function SyllabusSlide() {
  const tall = useIsPortrait();
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={[syllabus.heading]} size="headline" />
      <ol className={`grid gap-gap-sm ${tall ? "grid-cols-1" : "grid-cols-2"}`}>
        {syllabus.items.map((item, i) => (
          <motion.li key={item.name} variants={fadeReveal(0.4 + i * 0.25, 20)} className="flex items-center gap-8 rounded-card bg-paper-raised p-8 shadow-card">
            <span className="flex size-28 shrink-0 items-center justify-center rounded-card bg-paper-sunken">{syllabusPictures[i]}</span>
            <span className="flex flex-col gap-2">
              <span className="text-point leading-tight font-bold">{i + 1}. {item.name}</span>
              <span className="text-caption text-ink-muted">{item.detail}</span>
            </span>
          </motion.li>
        ))}
      </ol>
      <span />
    </StepView>
  );
}

/** An illustrative timeline that fills in like a recording: long professor stretches with short student turns. */
const DEMO_TIMELINE: ClassTurn[] = [
  { who: "professor", start: 0, end: 40 }, { who: "student", start: 41, end: 46 }, { who: "professor", start: 47, end: 92 },
  { who: "student", start: 93, end: 97 }, { who: "professor", start: 98, end: 140 }, { who: "student", start: 141, end: 148 },
  { who: "professor", start: 149, end: 180 },
];

function TimelineBar({ timeline, durationSeconds, animated }: { timeline: ClassTurn[]; durationSeconds: number; animated: boolean }) {
  const at = (seconds: number) => `${(100 * seconds) / durationSeconds}%`;
  return (
    <div className="relative h-24 overflow-hidden rounded-card bg-paper-sunken" role="img" aria-label="When the professor and students spoke during the class">
      {timeline.map((turn, i) => (
        <motion.span
          key={i}
          className={`absolute inset-y-0 ${turn.who === "professor" ? "bg-accent" : "bg-ink-soft"}`}
          style={{ left: at(turn.start), width: at(turn.end - turn.start), minWidth: 8, transformOrigin: "left center" }}
          initial={animated ? { scaleX: 0 } : false}
          animate={{ scaleX: 1, transition: { duration: 0.5, delay: animated ? 0.6 + i * 0.35 : 0 } }}
        />
      ))}
    </div>
  );
}

function TimelineLegend({ professor, student }: { professor: string; student: string }) {
  return (
    <div className="flex flex-wrap gap-10 text-point">
      <span className="flex items-center gap-4"><i className="size-8 rounded-md bg-accent" />{professor}</span>
      <span className="flex items-center gap-4"><i className="size-8 rounded-md bg-ink-soft" />{student}</span>
    </div>
  );
}

export function LessonSlide() {
  const seconds = useRecordingSeconds();
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={[lesson.heading]} />
      <motion.div variants={fadeReveal(0.4)} className="flex flex-col gap-8">
        <p className="text-caption text-ink-muted">{lesson.exampleLabel}</p>
        <TimelineBar timeline={DEMO_TIMELINE} durationSeconds={180} animated />
        <TimelineLegend professor={lesson.professorLine} student={lesson.studentLine} />
      </motion.div>
      <motion.p variants={fadeReveal(1.2)} className="flex items-center gap-4 text-caption text-ink-muted">
        <Microphone size={30} aria-hidden />
        {seconds !== null ? `This class has been recording for ${clock(seconds)}. ` : ""}
        {lesson.consentLine}
      </motion.p>
    </StepView>
  );
}

export function PopQuizSlide() {
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={[popQuiz.heading]} size="headline" />
      <div className="flex flex-col gap-8">
        <motion.p variants={fadeReveal(0.4)} className="text-lede text-ink-soft">{popQuiz.prompt}</motion.p>
        <HandCount slideId="pop-quiz" label={popQuiz.handsLabel} />
      </div>
      <span />
    </StepView>
  );
}

/* ---------- the report card ---------- */

/** Advances the grading steps on a timer, since the analysis is one request with no progress of its own. */
function Grading({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const step = Math.min(reportCard.steps.length - 1, Math.floor((now - since) / 10_000));
  return (
    <div className="flex flex-col gap-8">
      <p className="flex items-center gap-5 text-lede font-bold" role="status">
        <CircleNotch size={56} className="animate-spin text-accent" aria-hidden />
        {reportCard.steps[step]}
      </p>
      <ol className="flex flex-col gap-3 text-point">
        {reportCard.steps.map((label, i) => (
          <li key={label} className={i <= step ? "text-ink" : "text-ink-faint"}>{label}</li>
        ))}
      </ol>
      <p className="text-caption text-ink-muted">{reportCard.stillGrading}</p>
    </div>
  );
}

function originLabel(origin: ReportOrigin, savedAt?: string) {
  const label = reportCard.originLabel[origin];
  return origin === "rehearsal" && savedAt ? `${label} at ${savedAt}` : label;
}

function Measure({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <dt className="font-display text-headline leading-none font-extrabold figures-tabular">{value}</dt>
      <dd className="text-caption text-ink-muted">{label}</dd>
    </div>
  );
}

function ReportCardBody({ report, origin, savedAt, hands }: { report: ClassReport; origin: ReportOrigin; savedAt?: string; hands: number }) {
  const { analysis, draft } = report;
  const minutes = Math.max(1, Math.round(analysis.durationSeconds / 60));
  const tall = useIsPortrait();
  return (
    <div className="flex flex-col gap-10">
      <p className="self-start rounded-chip bg-mark px-6 py-2 text-caption font-bold">{originLabel(origin, savedAt)}</p>
      <TimelineBar timeline={analysis.timeline} durationSeconds={analysis.durationSeconds} animated={false} />
      <div className={tall ? "flex flex-col gap-10" : "grid grid-cols-[1fr_auto] items-start gap-gap"}>
        <dl className="grid grid-cols-2 gap-x-12 gap-y-10">
          <Measure value={`${analysis.professorShare}%`} label={`of the ${minutes}-minute class was the professor talking`} />
          <Measure value={String(analysis.studentTurns)} label="times students spoke, counted but never transcribed" />
          <Measure value={String(hands)} label={reportCard.handsCounted} />
          <Measure value={String(analysis.professorQuestions)} label="questions the professor asked the class" />
        </dl>
        <div className="flex items-start gap-8 rounded-card bg-paper-raised p-8 shadow-card">
          <ProfileLabels size={profileSizes.mini} showRange={false} />
          <ProfileLine profile={reportProfile(report)} label="This class's draft teaching profile" size={profileSizes.mini} />
        </div>
      </div>
      {draft.profile.participation?.evidence && <p className="text-caption text-ink-soft">{draft.profile.participation.evidence}</p>}
    </div>
  );
}

export function ReportCardSlide() {
  const { report, hands, recordingSince } = useClassroom();
  return (
    <StepView className="flex flex-col gap-10">
      <Heading lines={[reportCard.heading]} />
      <AnimatePresence mode="wait">
        <motion.div key={report.status} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {report.status === "ready" && <ReportCardBody report={report.report} origin={report.origin} savedAt={report.savedAt} hands={handsOn(hands, CLASS_SLIDE_IDS)} />}
          {report.status === "analyzing" && <Grading since={report.since} />}
          {report.status === "failed" && (
            <p className="flex items-start gap-4 text-point">
              <WarningCircle size={44} className="shrink-0 text-warning" aria-hidden />
              {report.message} Press S for the backup report card.
            </p>
          )}
          {report.status === "none" && (
            <p className="text-lede text-ink-soft">{recordingSince ? reportCard.notStopped : reportCard.waiting}</p>
          )}
        </motion.div>
      </AnimatePresence>
    </StepView>
  );
}

export function DismissedSlide() {
  const tall = useIsPortrait();
  return (
    <StepView className={tall ? "flex flex-col items-start justify-center gap-14" : "grid grid-cols-[1fr_auto] items-center gap-gap"}>
      <div className="flex flex-col gap-12">
        <motion.div variants={fadeReveal(0.1, 20)}>
          <Wordmark className="w-[460px]" />
        </motion.div>
        <Heading lines={[dismissed.heading]} size="headline" delay={0.3} />
        <motion.p variants={fadeReveal(0.9)} className="text-lede font-bold text-ink-soft">{dismissed.tagline}</motion.p>
      </div>
      <motion.figure variants={fadeReveal(0.8, 24)} className="flex flex-col items-center gap-6 rounded-card bg-paper-raised p-10 shadow-offset">
        <SiteQrCode size={tall ? 360 : 420} />
        <figcaption className="text-point font-bold">{dismissed.cta}</figcaption>
      </motion.figure>
    </StepView>
  );
}
