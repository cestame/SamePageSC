import { MotionGlobalConfig } from "motion/react";
import type { CSSProperties } from "react";
import { STAGE_SIZES, stageStyle, useOrientation } from "@/engine/orientation";
import { useWidthScale } from "@/engine/usePresenterKeys";
import { Footer } from "./SamePageDeck";
import type { DeckConfig } from "./slides";

MotionGlobalConfig.skipAnimations = true;

/**
 * Every beat of every slide on its own page, with animations finished, for PDF export and slide images.
 * On screen, pages shrink to the window's width and follow its orientation. Printing always gets full-size landscape pages.
 */
export function SamePagePrint({ deck }: { deck: DeckConfig }) {
  const orientation = useOrientation();
  const zoom = useWidthScale(STAGE_SIZES[orientation].width);
  const pages = deck.slides.flatMap((slide) => Array.from({ length: slide.steps }, (_, step) => ({ slide, step })));
  return (
    <main className="print-pages" style={{ "--page-zoom": zoom } as CSSProperties}>
      {pages.map(({ slide, step }) => (
        <section
          key={`${slide.id}-${step}`}
          aria-label={`${slide.name}, part ${step + 1}`}
          className="print-page relative overflow-hidden bg-paper not-last:break-after-page"
          style={stageStyle(orientation)}
        >
          <slide.Content step={step} />
          <Footer slide={slide} step={step} />
          <div aria-hidden className="paper-grain pointer-events-none absolute inset-0" />
        </section>
      ))}
    </main>
  );
}
