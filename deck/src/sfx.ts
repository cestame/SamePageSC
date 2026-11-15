import { useEffect } from "react";

/**
 * Small sound effects for the story deck, synthesized with Web Audio so there are no audio files to load.
 * Browsers only allow sound after a key press or click, which the presenter's first arrow key provides.
 * Press M to mute or unmute.
 */

let context: AudioContext | null = null;
let muted = false;

function audio() {
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

function noiseBuffer(ctx: AudioContext, seconds: number) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Filtered noise with a volume envelope: the base of the tear and whoosh sounds. */
function noise({ seconds, from, to, type, volume }: { seconds: number; from: number; to: number; type: BiquadFilterType; volume: number }) {
  if (muted) return;
  const ctx = audio();
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, seconds);
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(from, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + seconds);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + seconds * 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
}

function tone({ freq, endFreq = freq, seconds, type = "sine", volume = 0.18, at = 0 }: { freq: number; endFreq?: number; seconds: number; type?: OscillatorType; volume?: number; at?: number }) {
  if (muted) return;
  const ctx = audio();
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(endFreq, start + seconds);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

export const sfx = {
  tear: () => noise({ seconds: 0.45, from: 5000, to: 900, type: "bandpass", volume: 0.5 }),
  whoosh: () => noise({ seconds: 0.6, from: 300, to: 3000, type: "bandpass", volume: 0.25 }),
  pop: (pitch = 1) => tone({ freq: 520 * pitch, endFreq: 880 * pitch, seconds: 0.12, volume: 0.2 }),
  thud: () => tone({ freq: 160, endFreq: 70, seconds: 0.25, type: "triangle", volume: 0.3 }),
  glitch: () => {
    [0, 0.07, 0.14, 0.24].forEach((at, i) => tone({ freq: [700, 300, 900, 200][i], seconds: 0.06, type: "square", volume: 0.06, at }));
  },
  chime: () => {
    tone({ freq: 660, seconds: 0.5, volume: 0.15 });
    tone({ freq: 990, seconds: 0.6, volume: 0.1, at: 0.08 });
  },
};

/** Plays each sound at its time (in seconds) after the component mounts, and cancels them if the slide changes first. */
export function useSoundCues(cues: [number, () => void][]) {
  useEffect(() => {
    const timers = cues.map(([seconds, play]) => window.setTimeout(play, seconds * 1000));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
    // The cues are fixed per slide, so they only run on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** M mutes and unmutes every sound effect. */
export function useMuteKey() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "m" && !event.metaKey && !event.ctrlKey && !event.altKey) muted = !muted;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
