import { createContext, useContext, useSyncExternalStore, type CSSProperties } from "react";

/**
 * The deck has two canvases. Landscape is the projector slide. Portrait is for phones and tablets held upright,
 * where the slides stack their columns instead of shrinking a wide slide into a thin strip.
 * Printing always uses landscape, so a PDF saved from a phone still has slide-shaped pages.
 */
export type Orientation = "landscape" | "portrait";

export const STAGE_SIZES: Record<Orientation, { width: number; height: number }> = {
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 900, height: 1600 },
};

/** Tighter gutters and a taller footer on the narrow canvas, where source lines wrap. */
const PORTRAIT_SPACING = { "--spacing-stage-x": "64px", "--spacing-stage-y": "72px", "--spacing-footer": "96px" } as CSSProperties;

const PORTRAIT_QUERY = "(orientation: portrait)";
let printing = false;

function readOrientation(): Orientation {
  if (printing) return "landscape";
  return window.matchMedia(PORTRAIT_QUERY).matches ? "portrait" : "landscape";
}

function subscribe(notify: () => void) {
  const query = window.matchMedia(PORTRAIT_QUERY);
  const startPrint = () => {
    printing = true;
    notify();
  };
  const endPrint = () => {
    printing = false;
    notify();
  };
  query.addEventListener("change", notify);
  window.addEventListener("beforeprint", startPrint);
  window.addEventListener("afterprint", endPrint);
  return () => {
    query.removeEventListener("change", notify);
    window.removeEventListener("beforeprint", startPrint);
    window.removeEventListener("afterprint", endPrint);
  };
}

/** Pins every slide inside it to one orientation, such as the landscape thumbnails on the script page. */
export const ForcedOrientation = createContext<Orientation | null>(null);

export function useOrientation(): Orientation {
  const forced = useContext(ForcedOrientation);
  const live = useSyncExternalStore(subscribe, readOrientation, () => "landscape" as const);
  return forced ?? live;
}

export function useIsPortrait() {
  return useOrientation() === "portrait";
}

/** Width, height and spacing for one slide canvas in the current orientation. */
export function stageStyle(orientation: Orientation): CSSProperties {
  const { width, height } = STAGE_SIZES[orientation];
  return { width, height, ...(orientation === "portrait" ? PORTRAIT_SPACING : {}) };
}
