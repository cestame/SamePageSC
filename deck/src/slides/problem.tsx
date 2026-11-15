import { AnimatePresence, motion, type Variants } from "motion/react";
import { MaskedLines, StepView, fadeReveal } from "@/engine/primitives";
import { easeDrawn } from "@/engine/motion";
import { ratings, survey, title } from "../content";
import { HorseIntro } from "../HorseIntro";
import { Callout, Card, Heading, Note, Wordmark } from "../ui";

type SlideProps = { step: number };

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
        <Note delay={TITLE_TEXT_DELAY + 1.2}>{title.byline}</Note>
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
          variants={dotFill(index < count, rowDelay + index * 0.025)}
        />
      ))}
    </svg>
  );
}

export function SurveySlide() {
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={survey.heading} />
      <ul className="flex flex-col gap-12">
        {survey.rows.map((row, index) => (
          <motion.li key={row.line} variants={fadeReveal(0.6 + index * 0.5)} className="grid grid-cols-[300px_1fr] items-center gap-gap-sm">
            <p className="font-display text-headline leading-none font-bold">{row.percent}%</p>
            <div className="flex flex-col gap-3">
              <StudentDots count={row.count} rowDelay={0.8 + index * 0.5} />
              <p className="text-point">
                <span className="font-bold">
                  {row.count} of {survey.respondents}
                </span>{" "}
                {row.line}
              </p>
            </div>
          </motion.li>
        ))}
      </ul>
      <Note delay={2.4}>{survey.legend}</Note>
    </StepView>
  );
}

type RatingsView = (typeof ratings)["learning"];

function RatingsCards({ view, takeaway }: { view: RatingsView; takeaway: string }) {
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={view.heading} />
      <ul className="grid grid-cols-3 gap-gap-sm">
        {view.cards.map((card, index) => (
          <Card key={card.name} figure={card.figure} name={card.name} detail={card.detail} delay={0.6 + index * 0.25} />
        ))}
      </ul>
      <Callout delay={1.6}>{takeaway}</Callout>
    </StepView>
  );
}

export function RatingsSlide({ step }: SlideProps) {
  return (
    <AnimatePresence mode="wait">
      {step === 0 ? (
        <RatingsCards key="learning" view={ratings.learning} takeaway={ratings.followNote} />
      ) : (
        <RatingsCards key="bias" view={ratings.bias} takeaway={ratings.bias.uscNote} />
      )}
    </AnimatePresence>
  );
}
