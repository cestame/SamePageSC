import { motion } from "motion/react";
import type { ReactNode } from "react";
import { MaskedLines, fadeReveal } from "@/engine/primitives";
import { asset } from "@/engine/asset";

export function Heading({ lines, delay = 0.1, size = "title" }: { lines: string[]; delay?: number; size?: "title" | "headline" }) {
  return (
    <h2 className={`font-display font-bold ${size === "title" ? "text-title" : "text-headline"}`}>
      <MaskedLines lines={lines} delay={delay} />
    </h2>
  );
}

/** One parallel item on a slide: the name large, one short line of detail, and an optional figure above. */
export function Card({ name, detail, figure, delay, className = "" }: { name: string; detail: string; figure?: string; delay: number; className?: string }) {
  return (
    <motion.li variants={fadeReveal(delay, 24)} className={`flex flex-col gap-3 rounded-card bg-paper-raised p-9 shadow-card ${className}`}>
      {figure && <p className="font-display text-title leading-none font-bold text-accent">{figure}</p>}
      <p className="text-point leading-tight font-bold">{name}</p>
      <p className="text-caption text-ink-muted">{detail}</p>
    </motion.li>
  );
}

export function Note({ children, delay, className = "" }: { children: ReactNode; delay: number; className?: string }) {
  return (
    <motion.p variants={fadeReveal(delay)} className={`text-caption text-ink-muted ${className}`}>
      {children}
    </motion.p>
  );
}

/** A statement that carries a slide's takeaway, on the brand's `mark` highlight fill. */
export function Callout({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <motion.p variants={fadeReveal(delay, 16)} className="self-start rounded-card bg-mark px-8 py-5 text-point font-bold text-ink">
      {children}
    </motion.p>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return <img src={asset("/logo.png")} alt="Same Page SC" className={className} />;
}
