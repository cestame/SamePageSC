import { ArrowSquareOut, Printer } from "@phosphor-icons/react";
import { asset } from "@/engine/asset";
import { samePageSlides, type SamePageSlide } from "./slides";
import { Wordmark } from "./ui";

/** Speaking pace used for the time estimates, in words per minute. */
const WORDS_PER_MINUTE = 150;

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
const slideWords = (slide: SamePageSlide) => slide.notes.reduce((total, paragraph) => total + wordCount(paragraph), 0);
const seconds = (words: number) => Math.round((words / WORDS_PER_MINUTE) * 60);

function duration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const rest = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

const THUMB_SCALE = 0.2;

/** The slide at its final state, scaled down, so the presenter sees what's on screen while they talk. */
function Thumbnail({ slide, step }: { slide: SamePageSlide; step: number }) {
  return (
    <div className="shrink-0 overflow-hidden rounded-lg shadow-card" style={{ width: 1920 * THUMB_SCALE, height: 1080 * THUMB_SCALE }} aria-hidden>
      <div className="stage relative origin-top-left bg-paper" style={{ scale: THUMB_SCALE }}>
        <slide.Content step={step} />
      </div>
    </div>
  );
}

function Beat({ slide, step, slideNumber }: { slide: SamePageSlide; step: number; slideNumber: number }) {
  const paragraph = slide.notes[step] ?? "";
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start">
      <Thumbnail slide={slide} step={step} />
      <div className="flex flex-col gap-2">
        {slide.steps > 1 && (
          <p className="text-sm font-bold text-ink-muted">
            Slide {slideNumber}, beat {step + 1}
          </p>
        )}
        <p className="max-w-[68ch] text-lg leading-relaxed">{paragraph}</p>
      </div>
    </div>
  );
}

function SlideScript({ slide, slideNumber }: { slide: SamePageSlide; slideNumber: number }) {
  return (
    <section className="flex flex-col gap-6 border-t border-rule pt-8 break-inside-avoid" aria-labelledby={`slide-${slide.id}`}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={`slide-${slide.id}`} className="font-display text-2xl font-bold">
          {slideNumber}. {slide.name}
        </h2>
        <p className="shrink-0 text-sm text-ink-muted figures-tabular">about {duration(seconds(slideWords(slide)))}</p>
      </div>
      {Array.from({ length: slide.steps }, (_, step) => (
        <Beat key={step} slide={slide} step={step} slideNumber={slideNumber} />
      ))}
    </section>
  );
}

const linkClass = "flex items-center gap-2 rounded-full bg-paper-raised px-5 py-3 text-base font-bold shadow-card hover:bg-paper-sunken";

/** The pitch script: every beat's words beside a picture of the slide, with time estimates. */
export function ScriptPage() {
  const spoken = samePageSlides.filter((slide) => slide.id !== "sources");
  const totalSeconds = spoken.reduce((total, slide) => total + seconds(slideWords(slide)), 0);
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:px-10">
      <header className="flex flex-col gap-6">
        <Wordmark className="w-48" />
        <h1 className="font-display text-4xl font-bold md:text-5xl">Pitch script</h1>
        <p className="max-w-[68ch] text-lg text-ink-soft">
          About {duration(totalSeconds)} spoken at {WORDS_PER_MINUTE} words a minute. Each paragraph goes with the slide beside it, and the
          same words show in the deck when you press N.
        </p>
        <nav className="flex flex-wrap gap-3 print:hidden">
          <a className={linkClass} href={asset("/index.html")}>
            <ArrowSquareOut size={20} aria-hidden />
            Open the deck
          </a>
          <button type="button" className={linkClass} onClick={() => window.print()}>
            <Printer size={20} aria-hidden />
            Print the script
          </button>
        </nav>
      </header>
      {spoken.map((slide, index) => (
        <SlideScript key={slide.id} slide={slide} slideNumber={index + 1} />
      ))}
    </main>
  );
}
