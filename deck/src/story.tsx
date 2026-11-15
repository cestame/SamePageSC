import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "motion/react";
import { asset } from "@/engine/asset";
import { StepView, fadeReveal } from "@/engine/primitives";
import { CountUp } from "@/engine/primitives";
import { HorseIntro } from "./HorseIntro";
import { SamePageDeck } from "./SamePageDeck";
import { SiteQrCode } from "./slides/plan";
import { TitleSlide } from "./slides/problem";
import { ShapesSlide, WebRegSlide } from "./slides/product";
import type { DeckConfig, SamePageSlide } from "./slides";
import { Heading, Wordmark } from "./ui";
import { PaperSlide } from "./PaperScene";
import "./styles.css";

/** The story pitch: Dean Garrett's paper joke, the star-rating problem, Srinija's class demo on video, and the egret and horse. */

function Stars() {
  return (
    <motion.div variants={fadeReveal(0.3, 20)} className="flex gap-4 text-[120px] leading-none" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className={i < 2 ? "text-accent" : "text-rule"}
          variants={{ enter: { scale: 0, rotate: -40 }, present: { scale: 1, rotate: 0, transition: { delay: 0.4 + i * 0.12, type: "spring", stiffness: 260 } } }}
        >
          ★
        </motion.span>
      ))}
    </motion.div>
  );
}

function StarsSlide() {
  return (
    <StepView className="flex flex-col justify-between">
      <Heading lines={["We meet our professors", "as a number out of five."]} />
      <div className="flex items-end justify-between gap-gap">
        <Stars />
        <motion.div variants={fadeReveal(1.2, 20)} className="flex flex-col gap-3 rounded-card bg-paper-raised p-10 shadow-offset">
          <p className="font-display text-display leading-none font-extrabold text-accent">
            <CountUp total={82} format={(v) => `${Math.round(v)}%`} delay={1.4} />
          </p>
          <p className="max-w-[560px] text-point">of students we surveyed use Rate My Professors as their main source for choosing classes</p>
        </motion.div>
      </div>
      <span />
    </StepView>
  );
}

function QuestionSlide() {
  return (
    <StepView className="flex flex-col items-start justify-center gap-12">
      <Heading lines={["So, how do we get", "on the same page?"]} size="headline" />
      <motion.div variants={fadeReveal(1, 20)}>
        <Wordmark className="w-[520px]" />
      </motion.div>
    </StepView>
  );
}

/**
 * The screen recording fills the whole slide, as if the presenter switched to the browser.
 */
function VideoSlide({ clip, heading, step }: { clip: string; heading: string; step: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-paper">
      <motion.div className="size-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
        <video src={asset(`/${clip}`)} autoPlay muted playsInline className="size-full object-cover" />
      </motion.div>
      <motion.p
        className="absolute bottom-10 left-10 flex items-center gap-4 rounded-chip bg-paper/90 py-3 pr-8 pl-3 text-point font-bold shadow-float"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.8 } }}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-caption text-on-control">{step}</span>
        {heading}
      </motion.p>
    </div>
  );
}

function SymbiosisSlide() {
  return (
    <StepView className="grid grid-cols-[1fr_auto] items-center gap-gap">
      <div className="flex flex-col gap-10">
        <Heading lines={["Egrets and wild horses", "help each other."]} />
        <motion.p variants={fadeReveal(1.4)} className="text-lede text-ink-soft">Same Page SC does the same for students and professors.</motion.p>
      </div>
      <div className="rounded-card bg-brand-cream p-14">
        <HorseIntro width={620} startX={-700} />
      </div>
    </StepView>
  );
}

function ClosingSlide() {
  return (
    <StepView className="grid grid-cols-[1fr_auto] items-center gap-gap">
      <div className="flex flex-col gap-12">
        <motion.div variants={fadeReveal(0.1, 20)}><Wordmark className="w-[460px]" /></motion.div>
        <Heading lines={["Your next chapter begins", "with the right class."]} size="headline" delay={0.3} />
      </div>
      <motion.figure variants={fadeReveal(0.8, 24)} className="flex flex-col items-center gap-6 rounded-card bg-paper-raised p-10 shadow-offset">
        <SiteQrCode size={420} />
        <figcaption className="text-point font-bold">Scan to try it</figcaption>
      </motion.figure>
    </StepView>
  );
}

const slide = (id: string, name: string, speaker: string, note: string, Content: SamePageSlide["Content"]): SamePageSlide => ({
  id, name, steps: 1, sourcesByStep: [[]], notes: [note], speaker, Content,
});

const slides: SamePageSlide[] = [
  slide("title", "Same Page SC", "Everyone", "Hi, I'm Lia, Alexis, Srinija... and I'm Ame.", TitleSlide),
  {
    id: "paper",
    name: "Same room, different pages",
    steps: 3,
    sourcesByStep: [[]],
    speaker: "Ame",
    notes: [
      "Recall this time yesterday, when we were all buzzing with excitement for the weekend ahead. Our very first speaker, Dean Garrett, stood here with this sheet of paper, joking that he was \u201cthe least hip person in the room.\u201d We all laughed. But his joke got us thinking: professors and students can be in the same room without being on the same page.",
      "A professor walks in hoping to challenge students. A student walks in having read \u201cimpossible class.\u201d The professor invites discussion. The student remembers a review calling them \u201cunapproachable\u201d and hesitates to raise their hand.",
      "Before either has a chance to understand the other, someone else's experience has already shaped their relationship.",
    ],
    Content: PaperSlide,
  },
  slide("stars", "Five stars", "Lia", "The first time we ever meet our professors is as a number on a five star scale, the same way restaurants or movies are rated. But let me ask you something: have you ever been moved by a movie from just reading the reviews? In our survey, 82% of respondents said Rate My Professors was their main source for choosing between classes. Students are left guessing. Professors are left represented by reviews that may barely reflect how they teach.", StarsSlide),
  slide("shapes", "One profile, seven teaching traits", "Lia", "Instead of a star, Same Page SC gives every section a shape: seven teaching traits, from pace to workload, built from what happens in class. Here are three sections of the same course. Same course, three very different classes. All three are fictional samples.", ShapesSlide),
  slide("question", "How do we get on the same page?", "Lia", "So, how do we get on the Same Page?", QuestionSlide),
  slide("record", "Demo: recording", "Srinija", "Welcome to class. Start the recording. [Clicker starts the recording.] Today's lesson: how does Same Page work? Students, are you ready for registration? [Everyone: Yes!] Awesome. Open USC Web Registration and your Same Page extension. Once you've answered questions based on class preferences, you can see which professors you're the best fit with.", (p) => <VideoSlide {...p} clip="demo-record.mp4" step="1" heading="Recording the class" />),
  slide("webreg", "Inside Web Registration", "Srinija", "Here's what students see: a fit badge under every section in Web Registration. Click one and the full match opens in the side panel.", WebRegSlide),
  slide("analyze", "Demo: analyzing", "Srinija", "[Student raises hand: But what if I really want to understand the class?] No worries, because you can! Using spatial mapping and verbal diarization, you can experience a comprehensive class lecture. [Student 2: But how does this work?] Same Page collects audio during class lectures and transcribes them. It also lets students upload class notes.", (p) => <VideoSlide {...p} clip="demo-analyze.mp4" step="2" heading="Analyzing the lecture" />),
  slide("rating", "Demo: the rating", "Srinija", "[End the recording.] And here's my class's rating.", (p) => <VideoSlide {...p} clip="demo-rating.mp4" step="3" heading="The professor's profile" />),
  slide("symbiosis", "The bird and the horse", "Alexis", "You may be wondering why our logo is a bird and a horse. It's based on symbiotic relationships in nature. Egrets and wild horses have a mutually beneficial relationship, and in a similar way, Same Page provides a mutually beneficial relationship for students and professors.", SymbiosisSlide),
  slide("closing", "Conclusion", "Everyone", "[Conclusion.]", ClosingSlide),
];

const storyDeck: DeckConfig = { slides, deckPath: "/story.html", printPath: "/story.html", scriptPath: "/story.html" };

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SamePageDeck deck={storyDeck} />
  </StrictMode>,
);
