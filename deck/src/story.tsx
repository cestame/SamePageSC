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
import type { DeckConfig, SamePageSlide } from "./slides";
import { Heading, Wordmark } from "./ui";
import "./styles.css";

/** The story pitch: Dean Garrett's paper joke, the star-rating problem, Srinija's class demo on video, and the egret and horse. */

function PaperSlide() {
  return (
    <StepView className="grid grid-cols-[1fr_auto] items-center gap-gap">
      <div className="flex flex-col gap-10">
        <Heading lines={["Same room.", "Different pages."]} size="headline" />
        <motion.p variants={fadeReveal(0.9)} className="text-lede text-ink-soft">“The least hip person in the room.”</motion.p>
      </div>
      <motion.div
        aria-hidden
        variants={{ enter: { rotate: -18, y: 80, opacity: 0 }, present: { rotate: -5, y: 0, opacity: 1, transition: { duration: 1, delay: 0.4 } } }}
        className="flex h-[560px] w-[430px] flex-col gap-5 rounded-lg bg-sheet p-12 shadow-float"
      >
        <span className="block h-6 w-3/4 rounded bg-sheet-ink/80" />
        {[90, 70, 85, 60, 80, 65, 75, 55].map((w, i) => (
          <span key={i} className="block h-3 rounded bg-sheet-rule" style={{ width: `${w}%` }} />
        ))}
      </motion.div>
    </StepView>
  );
}

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

function VideoSlide({ clip, heading, step }: { clip: string; heading: string; step: string }) {
  return (
    <StepView className="flex flex-col gap-8">
      <div className="flex items-center gap-6">
        <motion.span variants={fadeReveal(0.1)} className="rounded-chip bg-accent px-6 py-2 text-caption font-bold text-on-control">{step}</motion.span>
        <Heading lines={[heading]} />
      </div>
      <motion.div
        variants={{ enter: { opacity: 0, scale: 0.94, y: 30 }, present: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.8, delay: 0.3 } } }}
        className="min-h-0 flex-1 overflow-hidden rounded-card bg-paper-raised shadow-float"
      >
        <video src={asset(`/${clip}`)} autoPlay muted playsInline className="size-full object-contain" />
      </motion.div>
    </StepView>
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
  slide("paper", "Same room, different pages", "Ame", "Recall this time yesterday... Dean Garrett stood here with this sheet of paper, joking that he was “the least hip person in the room.” We all laughed. But his joke got us thinking: professors and students can be in the same room without being on the same page. A professor walks in hoping to challenge students. A student walks in having read “impossible class.” The professor invites discussion. The student remembers a review calling them “unapproachable” and hesitates to raise their hand. Before either has a chance to understand the other, someone else's experience has already shaped their relationship.", PaperSlide),
  slide("stars", "Five stars", "Lia", "The first time we ever meet our professors is as a number on a five star scale, the same way restaurants or movies are rated. But let me ask you something: have you ever been moved by a movie from just reading the reviews? In our survey, 82% of respondents said Rate My Professors was their main source for choosing between classes. Students are left guessing. Professors are left represented by reviews that may barely reflect how they teach.", StarsSlide),
  slide("question", "How do we get on the same page?", "Lia", "So, how do we get on the Same Page?", QuestionSlide),
  slide("record", "Demo: recording", "Srinija", "Welcome to class. Start the recording. [Clicker starts the recording.] Today's lesson: how does Same Page work? Students, are you ready for registration? [Everyone: Yes!] Awesome. Open USC Web Registration and your Same Page extension. Once you've answered questions based on class preferences, you can see which professors you're the best fit with.", (p) => <VideoSlide {...p} clip="demo-record.mp4" step="1" heading="Recording the class" />),
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
