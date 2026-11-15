import { useSyncExternalStore } from "react";
import type { Profile } from "../content";

/**
 * The live classroom behind the class deck. The pitch is a class: the deck laptop records it with Same Page SC's
 * Record this class feature, a teammate counts raised hands, and the last slide shows the class's own report card.
 * Everything here runs in the browser; the analysis is the same server endpoint the website uses.
 */

export type ClassTurn = { who: "professor" | "student"; start: number; end: number };
type DraftField = { value: number | null; evidence: string };
export type ClassReport = {
  analysis: { durationSeconds: number; professorShare: number; studentTurns: number; professorQuestions: number; timeline: ClassTurn[] };
  draft: { profile: Record<string, DraftField>; summary: string };
  source: "live" | "sample";
  notice?: string;
};

/** Where a report card came from, so the slide always says so. */
export type ReportOrigin = "live" | "rehearsal" | "sample";
type ReportState =
  | { status: "none" }
  | { status: "analyzing"; since: number }
  | { status: "ready"; report: ClassReport; origin: ReportOrigin; savedAt?: string }
  | { status: "failed"; message: string };

type ClassroomState = {
  recordingSince: number | null;
  micProblem: string | null;
  hands: Record<string, number>;
  report: ReportState;
};

let state: ClassroomState = { recordingSince: null, micProblem: null, hands: {}, report: { status: "none" } };
const listeners = new Set<() => void>();

function update(next: Partial<ClassroomState>) {
  state = { ...state, ...next };
  listeners.forEach((notify) => notify());
}

export function useClassroom() {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    () => state,
    () => state,
  );
}

/* ---------- raised hands, counted by a person ---------- */

export function addHand(slideId: string, change: 1 | -1) {
  const current = state.hands[slideId] ?? 0;
  update({ hands: { ...state.hands, [slideId]: Math.max(0, current + change) } });
}

/** Hands raised on the given slides only, so the report card counts the class and not the intro. */
export const handsOn = (hands: Record<string, number>, slideIds: string[]) => slideIds.reduce((sum, id) => sum + (hands[id] ?? 0), 0);

/* ---------- recording ---------- */

const MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
/** The demo course the report is filed under. The analysis only uses it to name the class. */
const DEMO_COURSE_ID = "csci-103";
const BACKUP_KEY = "same-page-sc-class:rehearsal-report";

let recorder: MediaRecorder | null = null;
let chunks: Blob[] = [];

const MIC_MESSAGES: Record<string, string> = {
  NotAllowedError: "The browser blocked the microphone. Allow it in the address bar, or press S for the backup report card.",
  NotFoundError: "No microphone was found. Press S for the backup report card.",
};

const canRecord = () => Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== "undefined";

function micProblemFor(err: unknown) {
  const name = err instanceof DOMException ? err.name : "";
  return MIC_MESSAGES[name] ?? "The microphone couldn't start. Press S for the backup report card.";
}

function createRecorder(stream: MediaStream) {
  const mimeType = MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
  const media = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 32_000 });
  chunks = [];
  media.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  return media;
}

export async function startRecording() {
  if (recorder || !canRecord()) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    recorder = createRecorder(stream);
    recorder.start(1000);
    update({ recordingSince: Date.now(), micProblem: null });
  } catch (err) {
    update({ micProblem: micProblemFor(err) });
  }
}

function stopRecorder(): Promise<Blob> {
  return new Promise((resolve) => {
    const media = recorder;
    if (!media) {
      resolve(new Blob());
      return;
    }
    media.onstop = () => {
      media.stream.getTracks().forEach((track) => track.stop());
      resolve(new Blob(chunks, { type: media.mimeType || "audio/webm" }));
      chunks = [];
    };
    media.stop();
    recorder = null;
  });
}

function saveAsBackup(report: ClassReport) {
  try {
    window.localStorage.setItem(BACKUP_KEY, JSON.stringify({ report, savedAt: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) }));
  } catch {
    // Without storage the sample still works as the backup.
  }
}

async function requestAnalysis(audio: Blob): Promise<ClassReport> {
  const res = await fetch(`/api/recordings/analyze?courseId=${DEMO_COURSE_ID}&consent=yes`, {
    method: "POST",
    headers: { "Content-Type": audio.type || "application/octet-stream" },
    body: audio,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `The analysis answered with an error (${res.status}).`);
  return data as ClassReport;
}

/** Stops the recording and sends it for analysis. A live result is also saved on this laptop as the next backup. */
export async function stopAndGrade() {
  if (!recorder) return;
  const audio = await stopRecorder();
  update({ recordingSince: null, report: { status: "analyzing", since: Date.now() } });
  try {
    const report = await requestAnalysis(audio);
    const isLive = report.source === "live";
    if (isLive) saveAsBackup(report);
    update({ report: { status: "ready", report, origin: isLive ? "live" : "sample" } });
  } catch (err) {
    update({ report: { status: "failed", message: err instanceof Error ? err.message : "The analysis failed." } });
  }
}

export function toggleRecording() {
  if (recorder) void stopAndGrade();
  else void startRecording();
}

/** The backup report card: the last live run saved on this laptop (a rehearsal), or else the fictional sample lecture. */
export async function showBackup() {
  try {
    const saved = window.localStorage.getItem(BACKUP_KEY);
    if (saved) {
      const { report, savedAt } = JSON.parse(saved) as { report: ClassReport; savedAt: string };
      update({ report: { status: "ready", report, origin: "rehearsal", savedAt } });
      return;
    }
  } catch {
    // Fall through to the sample.
  }
  try {
    const res = await fetch("/api/recordings/sample");
    if (!res.ok) throw new Error();
    update({ report: { status: "ready", report: (await res.json()) as ClassReport, origin: "sample" } });
  } catch {
    update({ report: { status: "failed", message: "No backup report card is available on this laptop." } });
  }
}

/** The seven ratings in the deck's order, for drawing the report card's profile line. */
export function reportProfile(report: ClassReport): Profile {
  const keys = ["pace", "format", "structure", "assessment", "participation", "guidance", "workload"];
  return keys.map((key) => report.draft.profile[key]?.value ?? 3) as unknown as Profile;
}
