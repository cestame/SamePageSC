import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, CircleNotch, Eraser, TextAa, Trash, type Icon } from '@phosphor-icons/react';
import { FIELDS, PRIVACY_POINTS } from '../../../shared/content.js';
import { api, type ContributionResult, type Course, type ExtractedProfile, type FieldKey } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { ProfileLine } from '../components/ProfileLine';
import { EvidenceList } from '../components/EvidenceList';
import { Button, Card, EmptyState, ErrorState, KeyValue, LoadingState } from '../components/ui';

const MIN_CHARS = 80;
const NEW_PROFESSOR = 'new';
const SOURCE_TYPES = [
  { value: 'notes', label: 'Class notes' },
  { value: 'syllabus', label: 'A syllabus' },
  { value: 'both', label: 'Notes and a syllabus' },
] as const;
type SourceType = (typeof SOURCE_TYPES)[number]['value'];

const PRIVACY_ICONS: Record<string, Icon> = { text: TextAa, eraser: Eraser, trash: Trash };
const SHOWN_PRIVACY = PRIVACY_POINTS.filter((p) => p.icon in PRIVACY_ICONS);

export function Contribute() {
  const [meta] = useAsync(api.meta, []);
  const [courses, retryCourses] = useAsync(api.courses, []);
  const [result, setResult] = useState<ContributionResult | null>(null);

  if (result) return <Success result={result} onAgain={() => setResult(null)} />;

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
        <ContributionForm courses={courses.data} disabled={meta.status === 'success' && !meta.data.ai} onDone={setResult} />
      )}
    </>
  );
}

function ContributionForm({ courses, disabled, onDone }: { courses: Course[]; disabled: boolean; onDone: (r: ContributionResult) => void }) {
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

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setSending(true);
    setError(null);
    try {
      onDone(await api.contribute({
        courseId,
        professorId: isNew ? undefined : Number(professorId),
        professorName: isNew ? newName.trim() : undefined,
        sourceType,
        text,
        consent,
      }));
    } catch (err) {
      setError(err as Error);
      setSending(false);
    }
  }

  if (sending) return <Working professorName={professorName} />;

  return (
    <form className="stack-4" onSubmit={submit} noValidate>
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

function Success({ result, onAgain }: { result: ContributionResult; onAgain: () => void }) {
  const { extracted, professor } = result;
  const merged = Object.fromEntries(Object.entries(professor.profile).map(([k, v]) => [k, v.value]));
  const droppedLabels = FIELDS.filter((f) => extracted.dropped.includes(f.key)).map((f) => f.label.toLowerCase());

  return (
    <>
      <h1 className="text-display">Your notes are now part of {professor.name}'s profile</h1>
      <Card>
        <ProfileLine values={merged} label={professor.name} />
        <KeyValue items={[
          ['Built from', `${professor.contributionCount} contributions, averaged`],
          ['Your pasted text', 'Discarded after reading'],
        ]} />
      </Card>
      <Card>
        <h2 className="text-title">What the AI found in your text</h2>
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
