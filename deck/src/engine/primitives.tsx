import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { easeDrawn, exitTransition } from "./motion";

export function lineReveal(delay: number): Variants {
  return {
    enter: { y: "110%" },
    present: { y: "0%", transition: { duration: 1, ease: easeDrawn, delay } },
    exit: { y: "-110%", transition: exitTransition },
  };
}

export function fadeReveal(delay: number, rise = 0): Variants {
  return {
    enter: { opacity: 0, y: rise },
    present: { opacity: 1, y: 0, transition: { duration: 0.9, ease: easeDrawn, delay } },
    exit: { opacity: 0, transition: exitTransition },
  };
}

export function MaskedLines({ lines, delay = 0, stagger = 0.09 }: { lines: string[]; delay?: number; stagger?: number }) {
  return lines.map((line, index) => (
    <span key={line} className="line-mask">
      <motion.span className="block" variants={lineReveal(delay + index * stagger)}>
        {line}
      </motion.span>
    </span>
  ));
}

const stepViewFrame: Variants = { exit: { opacity: 0, transition: exitTransition } };

/** One beat of a slide. Children animate in through the `enter` and `present` variants. */
export function StepView({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div initial="enter" animate="present" exit="exit" variants={stepViewFrame} className={`stage-gutter absolute inset-0 ${className}`}>
      {children}
    </motion.div>
  );
}
