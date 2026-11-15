import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { Heading } from "./ui";

const EASE = [0.22, 0.8, 0.2, 1] as const;
const LINE_WIDTHS = [90, 70, 85, 60, 80, 65, 75, 55];

/** One half of the torn sheet: a clip of the full page, so the two halves line up before they split. */
function PaperHalf({ side, split }: { side: "left" | "right"; split: boolean }) {
  const isLeft = side === "left";
  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 flex flex-col gap-5 rounded-lg bg-sheet p-12 shadow-float"
      style={{ clipPath: isLeft ? "polygon(0 0, 52% 0, 46% 100%, 0 100%)" : "polygon(52% 0, 100% 0, 100% 100%, 46% 100%)" }}
      initial={{ y: 60, opacity: 0, rotate: -6 }}
      animate={split ? { x: isLeft ? -460 : 460, y: 0, rotate: isLeft ? -12 : 12, opacity: 0.85 } : { x: 0, y: 0, rotate: -4, opacity: 1 }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      <span className="block h-6 w-3/4 rounded bg-sheet-ink/80" />
      {LINE_WIDTHS.map((w, i) => (
        <span key={i} className="block h-3 rounded bg-sheet-rule" style={{ width: `${w}%` }} />
      ))}
    </motion.div>
  );
}

/** A made-up rating-site review, labeled as fictional. It names no real professor and copies no real site's design. */
function FakeReview() {
  return (
    <motion.figure
      className="absolute top-1/2 left-1/2 z-10 flex w-[780px] flex-col gap-6 rounded-card bg-sheet p-12 text-sheet-ink shadow-float"
      initial={{ x: "-50%", y: "-50%", scale: 0.15, opacity: 0 }}
      animate={{ x: "-50%", y: "-50%", scale: 1, opacity: 1 }}
      transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
    >
      <div className="flex items-center justify-between">
        <p className="text-point font-bold">Professor review</p>
        <p className="text-point font-bold" aria-label="1.4 out of 5 stars">
          <span className="text-accent-deep">★</span>
          <span className="text-sheet-rule">★★★★</span> <span className="font-display">1.4</span>
        </p>
      </div>
      <blockquote className="font-display text-title leading-tight font-bold">“Unapproachable and unfriendly. Don&apos;t bother going to office hours.”</blockquote>
      <figcaption className="text-caption text-sheet-ink/60">Example review, fictional</figcaption>
    </motion.figure>
  );
}

function PaperBeat({ split }: { split: boolean }) {
  return (
    <motion.div key="paper" exit={{ opacity: 0, transition: { duration: 0.6 } }} className="stage-gutter absolute inset-0 flex flex-col justify-between">
      <Heading lines={["Same room.", "Different pages."]} size="headline" />
      <div className="relative mx-auto h-[560px] w-[430px]">
        <PaperHalf side="left" split={split} />
        <PaperHalf side="right" split={split} />
      </div>
      {split && <FakeReview />}
      <span />
    </motion.div>
  );
}

/** A simple figure in the brand's flat style: a head and shoulders. */
function Person({ tone, label }: { tone: "accent" | "soft"; label: string }) {
  const fill = tone === "accent" ? "fill-accent" : "fill-ink-soft";
  return (
    <figure className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 160 220" width={220} aria-hidden>
        <circle cx={80} cy={60} r={44} className={fill} />
        <path d="M10 220 C10 118 150 118 150 220 Z" className={fill} />
      </svg>
      <figcaption className="text-point font-bold">{label}</figcaption>
    </figure>
  );
}

function Bubble({ children, delay, tail, wash = false }: { children: ReactNode; delay: number; tail: "left" | "right"; wash?: boolean }) {
  return (
    <motion.p
      className={`rounded-card px-8 py-5 text-point font-bold shadow-float ${wash ? "bg-accent-wash text-ink" : "bg-sheet text-sheet-ink"} ${tail === "left" ? "rounded-bl-none" : "rounded-br-none"}`}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
    >
      {children}
    </motion.p>
  );
}

/** The professor's words travel across and arrive scrambled: what is said is not what is heard. */
function GarbledMessage() {
  return (
    <motion.div
      aria-label="The professor's message reaches the student scrambled"
      className="absolute -top-36 left-1/2 rounded-card bg-sheet px-8 py-5 text-point font-bold whitespace-nowrap text-sheet-ink shadow-float"
      initial={{ x: "-130%", opacity: 0 }}
      animate={{ x: ["-130%", "-50%", "-5%"], opacity: [0, 1, 1] }}
      transition={{ delay: 2.4, duration: 2.4, times: [0, 0.5, 1], ease: "easeInOut" }}
    >
      <motion.span className="block" animate={{ opacity: [1, 1, 0] }} transition={{ delay: 2.4, duration: 1.8, times: [0, 0.6, 1] }}>
        Questions are always welcome!
      </motion.span>
      <motion.span className="absolute inset-0 flex items-center justify-center text-accent-deep" initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1] }} transition={{ delay: 2.4, duration: 1.8, times: [0, 0.6, 1] }}>
        ?? ... ? ...
      </motion.span>
    </motion.div>
  );
}

function PeopleBeat() {
  const apart = { duration: 1.6, delay: 0.4, ease: EASE };
  return (
    <motion.div key="people" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.8 } }} className="stage-gutter absolute inset-0 flex flex-col justify-between">
      <motion.div initial="enter" animate="present">
        <Heading lines={["Same room.", "Different pages."]} size="headline" />
      </motion.div>
      <div className="relative flex items-end justify-between">
        <motion.div initial={{ x: 420 }} animate={{ x: 0 }} transition={apart} className="flex flex-col items-start gap-6">
          <Bubble delay={1.6} tail="left">Questions are always welcome!</Bubble>
          <Person tone="accent" label="Professor" />
        </motion.div>
        <motion.div initial={{ x: -420 }} animate={{ x: 0 }} transition={apart} className="flex flex-col items-end gap-6">
          <Bubble delay={4.8} tail="right" wash>They seem unapproachable.</Bubble>
          <Person tone="soft" label="Student" />
        </motion.div>
        <GarbledMessage />
      </div>
      <span />
    </motion.div>
  );
}

/** Beat 1: the paper. Beat 2: it splits to reveal a review. Beat 3: two people drift apart and talk past each other. */
export function PaperSlide({ step }: { step: number }) {
  return <AnimatePresence mode="wait">{step < 2 ? <PaperBeat key="paper" split={step === 1} /> : <PeopleBeat key="people" />}</AnimatePresence>;
}
