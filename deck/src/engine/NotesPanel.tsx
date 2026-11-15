import { Printer, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { asset } from "./asset";
import { easeDrawn } from "./motion";

const shortcuts = [
  ["Next", "→ or Space"],
  ["Back", "←"],
  ["Notes", "N"],
  ["Full screen", "F"],
  ["Slide and beat label", "B"],
  ["Print", "P"],
];

export type NotesSlide = { name: string; steps: number; notes: string[]; speaker?: string };

type NotesPanelProps = { open: boolean; slide: NotesSlide; step: number; printPath: string; onClose: () => void };

function notesForBeat(slide: NotesSlide, step: number) {
  return slide.notes.length === slide.steps ? [slide.notes[step]] : slide.notes;
}

function BeatPosition({ slide, step }: { slide: NotesSlide; step: number }) {
  if (slide.steps < 2) return null;
  return (
    <p className="text-sm font-semibold text-ink-muted figures-tabular">
      Beat {step + 1} of {slide.steps}
    </p>
  );
}

/** The presenter's script for the current beat, opened with N. */
export function NotesPanel({ open, slide, step, printPath, onClose }: NotesPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          aria-label="Presenter notes"
          data-interactive
          className="absolute inset-x-4 bottom-4 z-40 mx-auto flex max-h-[42vh] max-w-4xl cursor-auto flex-col overflow-hidden rounded-2xl bg-paper-raised shadow-float select-text"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: easeDrawn } }}
          exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }}
        >
          <div className="flex items-center justify-between gap-4 px-6 pt-5">
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-bold">{slide.name}</h2>
              <BeatPosition slide={slide} step={step} />
              {slide.speaker && <p className="text-sm font-bold text-accent">{slide.speaker} presents</p>}
            </div>
            <div className="flex items-center gap-1">
              <a href={asset(printPath)} target="_blank" className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-ink-muted hover:bg-paper-sunken hover:text-ink">
                <Printer size={18} aria-hidden />
                Print or save as PDF
              </a>
              <button type="button" onClick={onClose} aria-label="Close notes" className="rounded-full p-2 text-ink-muted hover:bg-paper-sunken hover:text-ink">
                <X size={18} aria-hidden />
              </button>
            </div>
          </div>
          <div className="space-y-3 overflow-y-auto px-6 pt-3 pb-4 text-base leading-relaxed">
            {notesForBeat(slide, step).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <dl className="flex flex-wrap gap-x-5 gap-y-1 bg-paper px-6 py-3 text-sm text-ink-muted">
            {shortcuts.map(([action, key]) => (
              <div key={action} className="flex gap-1.5">
                <dt>{action}</dt>
                <dd className="font-semibold text-ink">{key}</dd>
              </div>
            ))}
          </dl>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
