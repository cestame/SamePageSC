import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderStatus = 'idle' | 'asking' | 'recording' | 'denied' | 'unsupported' | 'failed';

/** Formats the browser can record, best first. Opus at a low bitrate keeps a 50-minute class near 12 MB. */
const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
const BITS_PER_SECOND = 32_000;
const LEVEL_BARS = 48;
const LEVEL_SAMPLE_MS = 80;

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return null;
  return MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
}

function isPermissionError(err: unknown) {
  return err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
}

/** How loud the microphone is right now, from 0 to 1, read from the analyser's waveform. */
function currentLevel(analyser: AnalyserNode, buffer: Uint8Array<ArrayBuffer>) {
  analyser.getByteTimeDomainData(buffer);
  let sum = 0;
  for (const sample of buffer) sum += ((sample - 128) / 128) ** 2;
  return Math.min(1, Math.sqrt(sum / buffer.length) * 4);
}

/**
 * Records from the browser microphone with MediaRecorder and reports elapsed time and a rolling list of
 * audio levels for a live waveform. `stop` resolves with the recorded audio.
 */
export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(LEVEL_BARS).fill(0));
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const cleanup = useRef<() => void>(() => undefined);

  const release = useCallback(() => {
    cleanup.current();
    cleanup.current = () => undefined;
  }, []);

  useEffect(() => release, [release]);

  const start = useCallback(async () => {
    const mimeType = pickMimeType();
    if (mimeType === null || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      return;
    }
    setStatus('asking');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (err) {
      setStatus(isPermissionError(err) ? 'denied' : 'failed');
      return;
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    const buffer = new Uint8Array(analyser.fftSize);

    const media = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: BITS_PER_SECOND });
    chunks.current = [];
    media.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };
    media.start(1000);
    recorder.current = media;

    const startedAt = Date.now();
    const clock = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    const meter = window.setInterval(() => setLevels((prev) => [...prev.slice(1), currentLevel(analyser, buffer)]), LEVEL_SAMPLE_MS);
    cleanup.current = () => {
      window.clearInterval(clock);
      window.clearInterval(meter);
      stream.getTracks().forEach((track) => track.stop());
      void audioContext.close();
    };
    setElapsed(0);
    setStatus('recording');
  }, []);

  const stop = useCallback(
    () =>
      new Promise<Blob>((resolve) => {
        const media = recorder.current;
        if (!media) {
          resolve(new Blob());
          return;
        }
        media.onstop = () => {
          release();
          recorder.current = null;
          setStatus('idle');
          resolve(new Blob(chunks.current, { type: media.mimeType || 'audio/webm' }));
          chunks.current = [];
        };
        media.stop();
      }),
    [release],
  );

  return { status, elapsed, levels, start, stop };
}
