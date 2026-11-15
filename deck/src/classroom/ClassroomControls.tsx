import { Microphone } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { addHand, showBackup, toggleRecording, useClassroom } from "./store";

/**
 * Keys for the teammate running the laptop during the class pitch:
 * R starts the recording, and pressed again stops it and grades the class.
 * H counts one raised hand on the current slide; Shift+H takes one back.
 * S shows the backup report card.
 */
export function useClassroomKeys(slideIds: string[]) {
  useEffect(() => {
    const currentSlideId = () => {
      const number = Number.parseInt(window.location.hash.slice(1), 10);
      return slideIds[Number.isFinite(number) ? Math.min(Math.max(number - 1, 0), slideIds.length - 1) : 0];
    };
    const actions: Record<string, () => void> = {
      r: toggleRecording,
      R: toggleRecording,
      h: () => addHand(currentSlideId(), 1),
      H: () => addHand(currentSlideId(), -1),
      s: () => void showBackup(),
      S: () => void showBackup(),
    };
    function handleKeyDown(event: KeyboardEvent) {
      const action = actions[event.key];
      if (!action || event.metaKey || event.ctrlKey || event.altKey) return;
      event.preventDefault();
      action();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slideIds]);
}

export function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Seconds since the recording started, ticking while it runs. */
export function useRecordingSeconds() {
  const { recordingSince } = useClassroom();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!recordingSince) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [recordingSince]);
  return recordingSince ? Math.max(0, Math.floor((now - recordingSince) / 1000)) : null;
}

/** The red recording light in the corner of every slide, so the room can see the class is being recorded. */
export function RecordingLight() {
  const { micProblem } = useClassroom();
  const seconds = useRecordingSeconds();
  if (micProblem) {
    return <p className="absolute top-8 right-10 z-10 max-w-[560px] rounded-card bg-paper-raised px-6 py-3 text-caption text-warning shadow-card">{micProblem}</p>;
  }
  if (seconds === null) return null;
  return (
    <p className="absolute top-8 right-10 z-10 flex items-center gap-3 rounded-chip bg-paper-raised px-6 py-3 text-caption font-bold shadow-card" role="timer">
      <span aria-hidden className="size-4 animate-pulse rounded-full bg-accent" />
      <Microphone size={26} aria-hidden />
      Recording {clock(seconds)}
    </p>
  );
}
