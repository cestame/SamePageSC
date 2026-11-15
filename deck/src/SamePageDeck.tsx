import { AnimatePresence, MotionConfig, motion, type Variants } from "motion/react";
import { NotesPanel } from "@/engine/NotesPanel";
import { useDeckNavigation } from "@/engine/useDeckNavigation";
import { useIdleCursor, usePresenterKeys, useStageScale } from "@/engine/usePresenterKeys";
import { exitTransition } from "@/engine/motion";
import { STAGE_SIZES, stageStyle, useOrientation } from "@/engine/orientation";
import { sources } from "./content";
import { samePagePrintPath, samePageSlides, type SamePageSlide } from "./slides";

const slideFrame: Variants = { exit: { opacity: 0, transition: exitTransition } };
const slideStepCounts = samePageSlides.map((slide) => slide.steps);

function sourcesForStep(slide: SamePageSlide, step: number) {
  return slide.sourcesByStep[Math.min(step, slide.sourcesByStep.length - 1)];
}

export function Footer({ slide, step }: { slide: SamePageSlide; step: number }) {
  const cited = sourcesForStep(slide, step);
  if (cited.length === 0) return null;
  return (
    <footer className="pointer-events-none absolute inset-x-0 bottom-0 flex min-h-(--spacing-footer) items-center px-stage-x pb-2">
      <p className="max-w-[1300px] text-fineprint text-ink-faint">
        Source{cited.length > 1 ? "s" : ""}: {cited.map((id) => sources[id].cite).join("; ")}
      </p>
    </footer>
  );
}

export function SamePageDeck() {
  const { index, step, ready, handlePointerDown, handlePointerUp, handleContextMenu } = useDeckNavigation(slideStepCounts);
  const slide = samePageSlides[index];
  const { notesOpen, toggleNotes } = usePresenterKeys(samePagePrintPath);
  const cursorIsIdle = useIdleCursor();
  const orientation = useOrientation();
  const scale = useStageScale(STAGE_SIZES[orientation]);

  return (
    <MotionConfig reducedMotion="user">
      <main
        className={`fixed inset-0 flex items-center justify-center overflow-hidden bg-paper select-none ${cursorIsIdle && !notesOpen ? "cursor-none" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onContextMenu={handleContextMenu}
      >
        <div
          className="relative shrink-0 overflow-hidden bg-paper"
          style={{ ...stageStyle(orientation), transform: `scale(${scale ?? 1})`, transformOrigin: "center", opacity: scale === null || !ready ? 0 : 1 }}
        >
          <AnimatePresence mode="wait">
            {ready && (
              <motion.section
                key={`${slide.id}-${orientation}`}
                aria-label={`Slide ${index + 1} of ${samePageSlides.length}: ${slide.name}`}
                className="absolute inset-0"
                variants={slideFrame}
                initial="enter"
                animate="present"
                exit="exit"
              >
                <slide.Content step={step} />
              </motion.section>
            )}
          </AnimatePresence>
          <Footer slide={slide} step={step} />
          <div aria-hidden className="paper-grain pointer-events-none absolute inset-0" />
        </div>
        <NotesPanel open={notesOpen} slide={slide} step={step} printPath={samePagePrintPath} onClose={toggleNotes} />
      </main>
    </MotionConfig>
  );
}
