import { useEffect, useState } from 'react';
import { CircleNotch, Microphone, MicrophoneSlash, Stop } from '@phosphor-icons/react';
import { api, type ProfessorChoice, type RecordingResult } from '../lib/api';
import { useRecorder } from '../lib/useRecorder';
import { Badge, Button, Card, ErrorState } from './ui';
import { RecordingAnalysis } from './RecordingAnalysis';
import type { ContributionResult } from '../lib/api';

const ANALYSIS_STEPS = ["Separating the professor's voice", 'Reading the lecture', 'Building the profile'];
const STEP_SECONDS = 8;

function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/** The analysis is one request, so the steps advance on a timer and the last one waits for the answer. */
function Analyzing() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStep((s) => Math.min(ANALYSIS_STEPS.length - 1, s + 1)), STEP_SECONDS * 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <Card>
      <div className="row">
        <CircleNotch className="spinner steps__icon" size={24} aria-hidden />
        <h2 className="text-heading" role="status">{ANALYSIS_STEPS[step]}</h2>
      </div>
      <ol className="steps">
        {ANALYSIS_STEPS.map((label, i) => (
          <li key={label} className={i <= step ? 'steps__item steps__item--done' : 'steps__item text-muted'}>{label}</li>
        ))}
      </ol>
      <p className="text-small text-muted">A full class can take a few minutes. Your recording is deleted from our server once this finishes.</p>
    </Card>
  );
}

/** A live waveform: one bar per recent audio level. */
function Waveform({ levels }: { levels: number[] }) {
  return (
    <div className="waveform" aria-hidden="true">
      {levels.map((level, i) => <span key={i} className="waveform__bar" style={{ height: `${Math.max(6, level * 100)}%` }} />)}
    </div>
  );
}

const MIC_PROBLEMS: Record<string, string> = {
  denied: "Your browser blocked the microphone. Allow microphone access for this site in your browser's address bar, then try again.",
  unsupported: "This browser can't record audio. Try Chrome, Edge or Safari, or paste notes instead.",
  failed: "We couldn't open a microphone. Check that one is connected and not in use by another app.",
};

type Props = { choice: ProfessorChoice | null; disabled: boolean; onDone: (result: ContributionResult) => void };

/** Record a lecture, analyze it on the server, and review the draft profile before anything is saved. */
export function RecordClass({ choice, disabled, onDone }: Props) {
  const recorder = useRecorder();
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<'ready' | 'analyzing' | 'review'>('ready');
  const [result, setResult] = useState<RecordingResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  async function run(load: () => Promise<RecordingResult>) {
    setPhase('analyzing');
    setError(null);
    try {
      setResult(await load());
      setPhase('review');
    } catch (err) {
      setError(err as Error);
      setPhase('ready');
    }
  }

  async function stopAndAnalyze() {
    const audio = await recorder.stop();
    if (!choice) return;
    await run(() => api.analyzeRecording(audio, choice.courseId));
  }

  function discard() {
    setResult(null);
    setPhase('ready');
  }

  if (phase === 'analyzing') return <Analyzing />;
  if (phase === 'review' && result) {
    return <RecordingAnalysis result={result} choice={choice} consent={consent} onDiscard={discard} onDone={onDone} />;
  }

  const recording = recorder.status === 'recording';
  const problem = MIC_PROBLEMS[recorder.status];
  return (
    <div className="stack-4">
      <div className="row">
        <h2 className="text-title">Record this class</h2>
        <Badge>Prototype</Badge>
      </div>
      <p className="text-small text-muted">
        Same Page SC listens to the lecture, keeps only the professor's words, and counts student turns without transcribing them.
      </p>
      <label className="check">
        <input type="checkbox" id="record-consent" checked={consent} disabled={recording} onChange={(e) => setConsent(e.target.checked)} />
        <span>My professor agreed to this class being recorded and told the class.</span>
      </label>

      {recording ? (
        <Card>
          <div className="recorder">
            <span className="recorder__dot" aria-hidden="true" />
            <span className="text-title recorder__time" role="timer" aria-label={`Recording for ${clock(recorder.elapsed)}`}>{clock(recorder.elapsed)}</span>
            <Waveform levels={recorder.levels} />
          </div>
          <Button block icon={<Stop size={20} weight="fill" aria-hidden />} onClick={stopAndAnalyze}>Stop and analyze</Button>
        </Card>
      ) : (
        <Button
          className="button--large"
          block
          disabled={!consent || disabled || !choice || recorder.status === 'asking'}
          icon={<Microphone size={22} aria-hidden />}
          onClick={recorder.start}
        >
          {recorder.status === 'asking' ? 'Waiting for the microphone' : 'Start recording'}
        </Button>
      )}

      {problem && (
        <p className="watch-out" role="alert">
          <MicrophoneSlash className="watch-out__icon" size={20} aria-hidden />
          <span className="text-small">{problem}</span>
        </p>
      )}
      {error && <ErrorState title="We couldn't analyze that recording" error={error} />}
      <p className="text-small">
        <button type="button" className="link-button" onClick={() => run(api.sampleRecording)}>Try it with a sample recording</button>
        <span className="text-muted"> to see the result without a microphone.</span>
      </p>
    </div>
  );
}
