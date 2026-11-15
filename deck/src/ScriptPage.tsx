import { ArrowSquareOut, Printer } from "@phosphor-icons/react";
import { asset } from "@/engine/asset";
import { ForcedOrientation, STAGE_SIZES, stageStyle } from "@/engine/orientation";
import { useWidthScale } from "@/engine/usePresenterKeys";
import type { DeckConfig, SamePageSlide } from "./slides";
import { Wordmark } from "./ui";

/** Speaking pace used for the time estimates, in words per minute. */
const WORDS_PER_MINUTE = 150;
const PITCH_LIMIT_SECONDS = 180;

/** Words actually spoken: stage directions in [brackets] are left out of the timing. */
const wordCount = (text: string) => text.replace(/\[[^\]]*\]/g, " ").split(/\s+/).filter(Boolean).length;
const slideWords = (slide: SamePageSlide) => slide.notes.reduce((total, paragraph) => total + wordCount(paragraph), 0);
const seconds = (words: number) => Math.round((words / WORDS_PER_MINUTE) * 60);

function duration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const rest = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

/** Thumbnails are at most a fifth of full size, and shrink further to fit a phone's width inside the page's side padding. */
const THUMB_MAX_SCALE = 0.2;
const PAGE_SIDE_PADDING = 32;
const SLIDE = STAGE_SIZES.landscape;

/**
 * The slide at its final state, scaled down, so the presenter sees what's on screen while they talk.
 * Thumbnails always show the landscape slide the audience sees, even when the script is read on a phone.
 */
function Thumbnail({ slide, step }: { slide: SamePageSlide; step: number }) {
  const scale = useWidthScale(SLIDE.width, THUMB_MAX_SCALE, PAGE_SIDE_PADDING);
  return (
    <div className="shrink-0 overflow-hidden rounded-lg shadow-card" style={{ width: SLIDE.width * scale, height: SLIDE.height * scale }} aria-hidden>
      <ForcedOrientation.Provider value="landscape">
        <div className="relative origin-top-left bg-paper" style={{ ...stageStyle("landscape"), transform: `scale(${scale})` }}>
          <slide.Content step={step} />
        </div>
      </ForcedOrientation.Provider>
    </div>
  );
}

function Beat({ slide, step }: { slide: SamePageSlide; step: number }) {
  const paragraph = slide.notes[step] ?? "";
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start">
      <Thumbnail slide={slide} step={step} />
      <div className="flex flex-col gap-2">
        {slide.steps > 1 && (
          <p className="text-sm font-bold text-ink-muted">
            Part {step + 1} of {slide.steps}
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
        <div className="flex flex-col gap-1">
          <h2 id={`slide-${slide.id}`} className="font-display text-2xl font-bold">
            {slideNumber}. {slide.name}
          </h2>
          {slide.speaker && <p className="text-base font-bold text-accent">{slide.speaker}</p>}
        </div>
        <p className="shrink-0 text-sm text-ink-muted figures-tabular">about {duration(seconds(slideWords(slide)))}</p>
      </div>
      {Array.from({ length: slide.steps }, (_, step) => (
        <Beat key={step} slide={slide} step={step} />
      ))}
    </section>
  );
}

/** Each speaker's part in presenting order, with its slides and spoken time. */
function speakerParts(slides: SamePageSlide[]) {
  const parts: { speaker: string; slideNumbers: number[]; seconds: number }[] = [];
  slides.forEach((slide, index) => {
    const speaker = slide.speaker ?? "Unassigned";
    const last = parts[parts.length - 1];
    const part = last?.speaker === speaker ? last : { speaker, slideNumbers: [], seconds: 0 };
    if (part !== last) parts.push(part);
    part.slideNumbers.push(index + 1);
    part.seconds += seconds(slideWords(slide));
  });
  return parts;
}

function slideRange(numbers: number[]) {
  const first = numbers[0];
  const last = numbers[numbers.length - 1];
  return first === last ? `Slide ${first}` : `Slides ${first} to ${last}`;
}

/** Who speaks when, so each presenter can find their part and see how long it runs. */
function SpeakerPlan({ slides }: { slides: SamePageSlide[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {speakerParts(slides).map((part) => (
        <li key={part.speaker} className="flex flex-col gap-1 rounded-xl bg-paper-raised p-5 shadow-card">
          <p className="text-lg font-bold">{part.speaker}</p>
          <p className="text-sm text-ink-muted">{slideRange(part.slideNumbers)}</p>
          <p className="font-display text-2xl font-bold figures-tabular">about {duration(part.seconds)}</p>
        </li>
      ))}
    </ol>
  );
}

const linkClass = "flex items-center gap-2 rounded-full bg-paper-raised px-5 py-3 text-base font-bold shadow-card hover:bg-paper-sunken";

/** The pitch script: every beat's words beside a picture of the slide, with time estimates. */
type ScriptPageProps = { deck: DeckConfig; title?: string; intro?: string };

export function ScriptPage({ deck, title = "Pitch script", intro }: ScriptPageProps) {
  const spoken = deck.slides.filter((slide) => slide.id !== "sources");
  const totalSeconds = spoken.reduce((total, slide) => total + seconds(slideWords(slide)), 0);
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:px-10">
      <header className="flex flex-col gap-6">
        <Wordmark className="w-48" />
        <h1 className="font-display text-4xl font-bold md:text-5xl">{title}</h1>
        <p className="max-w-[68ch] text-lg text-ink-soft">
          About {duration(totalSeconds)} spoken at {WORDS_PER_MINUTE} words a minute{totalSeconds <= PITCH_LIMIT_SECONDS ? ", inside the 3-minute limit" : ", over the 3-minute limit"}, not counting pauses. Each
          paragraph goes with the slide beside it, and the same words show in the deck when you press N.
        </p>
        {intro && <p className="max-w-[68ch] text-lg text-ink-soft">{intro}</p>}
        <SpeakerPlan slides={spoken} />
        <nav className="flex flex-wrap gap-3 print:hidden">
          <a className={linkClass} href={asset(deck.deckPath)}>
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
