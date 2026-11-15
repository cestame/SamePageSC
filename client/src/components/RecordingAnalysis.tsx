import { useState } from 'react';
import { CheckCircle, Info } from '@phosphor-icons/react';
import { FIELDS } from '../../../shared/content.js';
import { api, type ClassTurn, type ContributionResult, type FieldKey, type ProfessorChoice, type RecordingResult } from '../lib/api';
import { Badge, Button, Card, ErrorState } from './ui';
import { EvidenceList } from './EvidenceList';
import { ProfileLine } from './ProfileLine';

const minutes = (seconds: number) => Math.max(1, Math.round(seconds / 60));
const times = (n: number) => (n === 1 ? 'once' : `${n} times`);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** The class as one bar: professor stretches in the accent, student turns in a second colour, labelled only "Student". */
function ClassTimeline({ timeline, durationSeconds }: { timeline: ClassTurn[]; durationSeconds: number }) {
  const at = (seconds: number) => `${(100 * seconds) / durationSeconds}%`;
  return (
    <figure className="class-timeline">
      <div className="class-timeline__bar" role="img" aria-label={`Timeline of a ${minutes(durationSeconds)}-minute class showing when the professor and students spoke`}>
        {timeline.map((turn, i) => (
          <span
            key={i}
            className={`class-timeline__turn class-timeline__turn--${turn.who}`}
            style={{ left: at(turn.start), width: at(turn.end - turn.start) }}
            title={turn.who === 'professor' ? 'Professor' : 'Student'}
          />
        ))}
      </div>
      <figcaption className="class-timeline__legend text-small">
        <span><i className="class-timeline__key class-timeline__key--professor" />Professor</span>
        <span><i className="class-timeline__key class-timeline__key--student" />Student</span>
        <span className="text-muted">0 to {minutes(durationSeconds)} minutes</span>
      </figcaption>
    </figure>
  );
}

type Props = {
  result: RecordingResult;
  choice: ProfessorChoice | null;
  consent: boolean;
  onDiscard: () => void;
  onDone: (result: ContributionResult) => void;
};

/** The analysis of a recording, shown in full before anything is saved. */
export function RecordingAnalysis({ result, choice, consent, onDiscard, onDone }: Props) {
  const { analysis, draft, source, notice } = result;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isSample = source === 'sample';
  const values = Object.fromEntries(FIELDS.map((f) => [f.key, draft.profile[f.key]?.value ?? null]));
  const rows = Object.fromEntries(
    FIELDS.map((f) => [f.key, { value: draft.profile[f.key]?.value ?? null, evidence: draft.profile[f.key]?.evidence ? [draft.profile[f.key].evidence] : [] }]),
  ) as Record<FieldKey, { value: number | null; evidence: string[] }>;

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      if (!choice) return;
      onDone(await api.submitRecording({ ...choice, draft, token: result.token, consent }));
    } catch (err) {
      setError(err as Error);
      setSaving(false);
    }
  }

  return (
    <div className="stack-4">
      <div className="row">
        <h2 className="text-title">What we measured in this class</h2>
        {isSample ? <Badge tone="sample">Sample recording, fictional</Badge> : <Badge>Prototype</Badge>}
      </div>
      {notice && (
        <p className="watch-out">
          <Info className="watch-out__icon" size={20} aria-hidden />
          <span className="text-small">{notice}</span>
        </p>
      )}

      <Card>
        <ClassTimeline timeline={analysis.timeline} durationSeconds={analysis.durationSeconds} />
        <dl className="measures">
          <div className="measure">
            <dt className="text-score measure__value">{analysis.professorShare}<span className="fit-score__unit">%</span></dt>
            <dd className="text-small">of the {minutes(analysis.durationSeconds)}-minute class was the professor talking</dd>
          </div>
          <div className="measure">
            <dt className="text-score measure__value">{analysis.studentTurns}</dt>
            <dd className="text-small">times students spoke, counted but never transcribed</dd>
          </div>
          <div className="measure">
            <dt className="text-score measure__value">{analysis.professorQuestions}</dt>
            <dd className="text-small">{analysis.professorQuestions === 1 ? 'question' : 'questions'} the professor asked the class</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="text-title">Draft profile</h2>
        <p className="text-body">{draft.summary}</p>
        <ProfileLine values={values} label="Draft profile from this recording" />
        <EvidenceList rows={rows} />
        <p className="text-small text-muted">
          Format and Participation come from the measured numbers: {analysis.professorShare}% professor talk time, and students speaking {times(analysis.studentTurns)} with {plural(analysis.professorQuestions, 'question')} from the professor.
        </p>
      </Card>

      {error && <ErrorState title="We couldn't save this profile" error={error} />}
      {isSample && <p className="text-small text-muted">Sample results can't be added to a real profile. Record a class to submit one.</p>}
      <div className="stack-2">
        <Button block disabled={isSample || saving || !consent || !choice} icon={<CheckCircle size={20} aria-hidden />} onClick={submit}>
          {saving ? 'Saving the profile' : 'Submit this profile'}
        </Button>
        <Button block variant="secondary" disabled={saving} onClick={onDiscard}>Discard</Button>
      </div>
    </div>
  );
}
