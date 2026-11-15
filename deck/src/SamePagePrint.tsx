import { MotionGlobalConfig } from "motion/react";
import { Footer } from "./SamePageDeck";
import { samePageSlides } from "./slides";

MotionGlobalConfig.skipAnimations = true;

/** Every beat of every slide on its own landscape page, with animations finished, for PDF export and slide images. */
export function SamePagePrint() {
  const pages = samePageSlides.flatMap((slide) => Array.from({ length: slide.steps }, (_, step) => ({ slide, step })));
  return (
    <main>
      {pages.map(({ slide, step }) => (
        <section key={`${slide.id}-${step}`} aria-label={`${slide.name}, part ${step + 1}`} className="stage relative overflow-hidden bg-paper not-last:break-after-page">
          <slide.Content step={step} />
          <Footer slide={slide} step={step} />
          <div aria-hidden className="paper-grain pointer-events-none absolute inset-0" />
        </section>
      ))}
    </main>
  );
}
