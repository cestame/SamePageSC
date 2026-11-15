import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, CircleNotch, ClipboardText, Eraser, Microphone, NotePencil, Timer, Trash, type Icon } from '@phosphor-icons/react';
import { FIELDS, PRIVACY_POINTS } from '../../../shared/content.js';
import { api, type ContributionResult, type Course, type ExtractedProfile, type FieldKey, type ProfessorChoice } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { ProfileLine } from '../components/ProfileLine';
import { EvidenceList } from '../components/EvidenceList';
import { Badge, Button, Card, EmptyState, ErrorState, KeyValue, LoadingState } from '../components/ui';
import { RecordClass } from '../components/RecordClass';

const MIN_CHARS = 80;
const NEW_PROFESSOR = 'new';
const SOURCE_TYPES = [
  { value: 'notes', label: 'Class notes' },
  { value: 'syllabus', label: 'A syllabus' },
  { value: 'both', label: 'Notes and a syllabus' },
] as const;
type SourceType = (typeof SOURCE_TYPES)[number]['value'];

const PRIVACY_ICONS: Record<string, Icon> = { microphone: Microphone, timer: Timer, eraser: Eraser, trash: Trash };

/** The three ways to add notes. Recording is the default; pasting is the original flow, unchanged. */
type Method = 'record' | 'paste' | 'granola';
const METHODS: { value: Method; label: string; detail: string; Icon: Icon; prototype?: boolean }[] = [
  { value: 'record', label: 'Record this class', detail: 'Listens to the lecture and builds the profile from it', Icon: Microphone, prototype: true },
  { value: 'paste', label: 'Paste notes or a syllabus', detail: 'Type or paste what you wrote down', Icon: ClipboardText },
  { value: 'granola', label: 'Import from Granola', detail: 'Bring in notes you took in Granola', Icon: NotePencil },
];

type Added = { result: ContributionResult; from: 'notes' | 'recording' };
const SHOWN_PRIVACY = PRIVACY_POINTS.filter((p) => p.icon in PRIVACY_ICONS);

export function Contribute() {
  const [meta] = useAsync(api.meta, []);
  const [courses, retryCourses] = useAsync(api.courses, []);
  const [added, setAdded] = useState<Added | null>(null);

  if (added) return <Success result={added.result} from={added.from} onAgain={() => setAdded(null)} />;

  return (
    <>
      <h1 className="text-display">Add notes from a class you're taking</h1>
      <ul className="privacy-list">
        {SHOWN_PRIVACY.map((p) => {
          const PointIcon = PRIVACY_ICONS[p.icon];
          return (
            <li key={p.icon} className="privacy-list__item">
              <PointIcon className="privacy-list__icon" size={22} aria-hidden />
              <span className="text-small"><span className="text-strong">{p.title}.</span> {p.body}</span>
            </li>
          );
        })}
      </ul>
      <p className="text-small"><a href="#/privacy">All of our privacy rules</a></p>

      {meta.status === 'success' && !meta.data.ai && (
        <EmptyState
          title="Adding notes is paused"
          body="The server doesn't have its AI key set up yet, so it can't read notes right now. Matching and profiles still work."
        />
      )}
      {courses.status === 'loading' && <LoadingState label="Loading courses" />}
      {courses.status === 'error' && <ErrorState title="We couldn't load the courses" error={courses.error} onRetry={retryCourses} />}
      {courses.status === 'success' && (
        <ContributionForm
          courses={courses.data}
          disabled={meta.status === 'success' && !meta.data.ai}
          recordingBlocked={meta.status === 'success' && Boolean(meta.data.recording) && !meta.data.ai}
          onDone={setAdded}
        />
      )}
    </>
  );
}

function MethodPicker({ method, onChange }: { method: Method; onChange: (m: Method) => void }) {
  return (
    <div className="stack-2">
      <h2 id="method-title" className="text-heading">How do you want to add notes?</h2>
      <div className="method-options" role="radiogroup" aria-labelledby="method-title">
        {METHODS.map(({ value, label, detail, Icon: MethodIcon, prototype }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={method === value}
            className={method === value ? 'method-option method-option--selected' : 'method-option'}
            onClick={() => onChange(value)}
          >
            <MethodIcon className="method-option__icon" size={28} aria-hidden />
            <span className="method-option__label">{label}</span>
            <span className="text-small text-muted">{detail}</span>
            {prototype && <Badge>Prototype</Badge>}
          </button>
        ))}
      </div>
    </div>
  );
}

function GranolaImport() {
  const [asked, setAsked] = useState(false);
  return (
    <div className="stack-3">
      <Button variant="secondary" block onClick={() => setAsked(true)}>Import notes from Granola (coming soon)</Button>
      {asked && (
        <p className="text-small" role="status">
          Granola import is planned. For now, copy your notes out of Granola and use Paste notes or a syllabus.
        </p>
      )}
    </div>
  );
}

/**
 * `disabled` stops the paste flow when the server has no AI key. Recording without a voice-separation key
 * falls back to the sample, so it is only blocked when live recording is set up but the AI key is missing.
 */
function ContributionForm({ courses, disabled, recordingBlocked, onDone }: {
  courses: Course[];
  disabled: boolean;
  recordingBlocked: boolean;
  onDone: (added: Added) => void;
}) {
  const [method, setMethod] = useState<Method>('record');
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const course = courses.find((c) => c.id === courseId);
  const [professorId, setProfessorId] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('notes');
  const [text, setText] = useState('');
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setProfessorId(course?.sections[0] ? String(course.sections[0].id) : NEW_PROFESSOR);
  }, [course]);

  const isNew = professorId === NEW_PROFESSOR;
  const professorName = isNew ? newName.trim() : course?.sections.find((s) => String(s.id) === professorId)?.name ?? '';
  const ready = !disabled && consent && text.trim().length >= MIN_CHARS && professorName.length >= 3;
  const choice: ProfessorChoice | null = professorName.length >= 3
    ? { courseId, ...(isNew ? { professorName: newName.trim() } : { professorId: Number(professorId) }) }
    : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setSending(true);
    setError(null);
    try {
      onDone({ from: 'notes', result: await api.contribute({
        courseId,
        professorId: isNew ? undefined : Number(professorId),
        professorName: isNew ? newName.trim() : undefined,
        sourceType,
        text,
        consent,
      }) });
    } catch (err) {
      setError(err as Error);
      setSending(false);
    }
  }

  if (sending) return <Working professorName={professorName} />;

  return (
    <div className="stack-5">
      <div className="stack-4">
      <label className="field">
        <span className="field__label">Course</span>
        <select className="input" id="course" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.code}, {c.title}</option>)}
        </select>
      </label>
      <label className="field">
        <span className="field__label">Professor</span>
        <select className="input" id="professor" value={professorId} onChange={(e) => setProfessorId(e.target.value)}>
          {course?.sections.map((s) => <option key={s.id} value={s.id}>{s.name}{s.is_sample ? ' (sample)' : ''}</option>)}
          <option value={NEW_PROFESSOR}>Someone not on this list</option>
        </select>
      </label>
      {isNew && (
        <label className="field">
          <span className="field__label">Professor's name</span>
          <input className="input" id="professor-name" type="text" maxLength={80} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Dr. Jordan Smith" />
        </label>
      )}
      </div>
      <MethodPicker method={method} onChange={setMethod} />
      {method === 'record' && <RecordClass choice={choice} disabled={recordingBlocked} onDone={(result) => onDone({ from: 'recording', result })} />}
      {method === 'granola' && <GranolaImport />}
      {method === 'paste' && (
      <form className="stack-4" onSubmit={submit} noValidate>
      <label className="field">
        <span className="field__label">What you're pasting</span>
        <select className="input" id="source-type" value={sourceType} onChange={(e) => setSourceType(e.target.value as SourceType)}>
          {SOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </label>
      <label className="field">
        <span className="field__label">Your notes or syllabus</span>
        <textarea className="input" id="text" value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Lecture 4: she opened with a five-minute recap quiz, then live-coded a linked list while we typed along..." />
        <span className="text-small text-muted">
          {text.trim().length < MIN_CHARS
            ? `Paste at least ${MIN_CHARS} characters so there is enough to go on (${text.trim().length} so far).`
            : 'Notes about lectures, assignments, exams and participation give the best profile.'}
        </span>
      </label>
      <label className="check">
        <input type="checkbox" id="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>These are my own notes, or the professor agreed to share these materials.</span>
      </label>
      {error && <ErrorState title="We couldn't build a profile from that" error={error} />}
      <Button type="submit" block disabled={!ready}>
        {professorName ? `Build the profile for ${professorName}` : 'Build the profile'}
      </Button>
      </form>
      )}
    </div>
  );
}

function Working({ professorName }: { professorName: string }) {
  return (
    <Card>
      <div className="row">
        <CircleNotch className="spinner steps__icon" size={24} aria-hidden />
        <h2 className="text-heading" role="status">Reading your notes for {professorName}</h2>
      </div>
      <ol className="steps">
        <li className="steps__item">Names, emails and IDs are removed first.</li>
        <li className="steps__item">The AI model rates the seven rows and quotes the line behind each rating.</li>
        <li className="steps__item">The ratings are averaged into the existing profile, and your pasted text is discarded.</li>
      </ol>
      <p className="text-small text-muted">This can take up to half a minute.</p>
    </Card>
  );
}

const SOURCE_FATE = {
  notes: { heading: 'Your notes are now part of', key: 'Your pasted text', value: 'Discarded after reading', found: 'What the AI found in your text' },
  recording: { heading: 'This class is now part of', key: 'Your recording', value: 'Deleted after it was analyzed', found: 'What the recording showed' },
};

function Success({ result, from, onAgain }: { result: ContributionResult; from: Added['from']; onAgain: () => void }) {
  const fate = SOURCE_FATE[from];
  const { extracted, professor } = result;
  const merged = Object.fromEntries(Object.entries(professor.profile).map(([k, v]) => [k, v.value]));
  const droppedLabels = FIELDS.filter((f) => extracted.dropped.includes(f.key)).map((f) => f.label.toLowerCase());

  return (
    <>
      <h1 className="text-display">{fate.heading} {professor.name}'s profile</h1>
      <Card>
        <ProfileLine values={merged} label={professor.name} />
        <KeyValue items={[
          ['Built from', `${professor.contributionCount} contributions, averaged`],
          [fate.key, fate.value],
        ]} />
      </Card>
      <Card>
        <h2 className="text-title">{fate.found}</h2>
        <p className="text-body">{extracted.summary}</p>
        <EvidenceList rows={toEvidenceRows(extracted.profile)} />
        {droppedLabels.length > 0 && (
          <p className="text-small text-muted">
            We removed what your text said about {droppedLabels.join(' and ')} because it described the professor as a person rather than the class.
          </p>
        )}
      </Card>
      <div className="stack-2">
        <Button href={`#/professor/${professor.id}`} iconAfter={<ArrowRight size={18} aria-hidden />}>See {professor.name}'s full profile</Button>
        <Button variant="secondary" onClick={onAgain}>Add notes for another class</Button>
      </div>
    </>
  );
}

function toEvidenceRows(profile: ExtractedProfile) {
  return Object.fromEntries(
    FIELDS.map((f) => [f.key, { value: profile[f.key].value, evidence: profile[f.key].evidence ? [profile[f.key].evidence] : [] }]),
  ) as Record<FieldKey, { value: number | null; evidence: string[] }>;
}
