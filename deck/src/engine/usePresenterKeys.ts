import { useEffect, useState, useSyncExternalStore } from "react";
import { asset } from "./asset";

function toggleFullscreen() {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
    return;
  }
  void document.documentElement.requestFullscreen({ navigationUI: "hide" });
}

const BEAT_LABEL_KEY = "same-page-deck:beat-label";
const beatLabelListeners = new Set<() => void>();

function readBeatLabelVisible() {
  try {
    return window.localStorage.getItem(BEAT_LABEL_KEY) !== "hidden";
  } catch {
    return true;
  }
}

function toggleBeatLabel() {
  const nextValue = readBeatLabelVisible() ? "hidden" : "shown";
  try {
    window.localStorage.setItem(BEAT_LABEL_KEY, nextValue);
  } catch {
    return;
  }
  beatLabelListeners.forEach((notify) => notify());
}

function subscribeToBeatLabel(notify: () => void) {
  beatLabelListeners.add(notify);
  window.addEventListener("storage", notify);
  return () => {
    beatLabelListeners.delete(notify);
    window.removeEventListener("storage", notify);
  };
}

export function useBeatLabelVisible() {
  return useSyncExternalStore(subscribeToBeatLabel, readBeatLabelVisible, () => true);
}

export function usePresenterKeys(printPath: string) {
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    const actions: Record<string, () => void> = {
      n: () => setNotesOpen((open) => !open),
      f: toggleFullscreen,
      b: toggleBeatLabel,
      p: () => window.open(asset(printPath), "_blank"),
      Escape: () => setNotesOpen(false),
    };

    function handleKeyDown(event: KeyboardEvent) {
      const action = actions[event.key] ?? actions[event.key.toLowerCase()];
      if (!action || event.metaKey || event.ctrlKey || event.altKey) return;
      event.preventDefault();
      action();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [printPath]);

  return { notesOpen, toggleNotes: () => setNotesOpen((open) => !open) };
}

const CURSOR_IDLE_MS = 1600;

export function useIdleCursor() {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let timer = window.setTimeout(() => setIsIdle(true), CURSOR_IDLE_MS);

    function wake() {
      setIsIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIsIdle(true), CURSOR_IDLE_MS);
    }

    window.addEventListener("pointermove", wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
    };
  }, []);

  return isIdle;
}

/** How far to shrink a slide canvas of this size so it fits the window. */
export function useStageScale({ width, height }: { width: number; height: number }) {
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const measure = () => setScale(Math.min(window.innerWidth / width, window.innerHeight / height));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [width, height]);

  return scale;
}

/** How far to shrink a canvas this wide so it fits the window's width, never enlarging it past `max`. */
export function useWidthScale(width: number, max = 1, margin = 0) {
  const [scale, setScale] = useState(max);

  useEffect(() => {
    const measure = () => setScale(Math.min(max, (window.innerWidth - margin) / width));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [width, max, margin]);

  return scale;
}
