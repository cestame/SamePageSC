import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle, MagnifyingGlass, Plus, X } from '@phosphor-icons/react';
import { api, type CatalogueCourse, type Course, type UscProgram } from '../lib/api';
import { useAsync } from '../lib/hooks';
import type { StudentProfile } from '../lib/storage';
import { ProfileLine } from '../components/ProfileLine';
import { Button, EmptyState, ErrorState, LoadingState } from '../components/ui';

type Update = (change: (p: StudentProfile) => StudentProfile) => void;

const SEARCH_DELAY_MS = 300;
const REQUIREMENTS_POLL_MS = 10_000;

/** Debounced value, so typing doesn't send a request per keystroke. */
function useDebounced<T>(value: T, ms: number) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return settled;
}

// ---------- major ----------

export function MajorStep({ profile, update, onNext }: { profile: StudentProfile; update: Update; onNext: () => void }) {
  const [text, setText] = useState(profile.major);
  const q = useDebounced(text.trim(), SEARCH_DELAY_MS);
  const [results, retry] = useAsync(() => (q.length >= 2 && q !== profile.major ? api.searchPrograms(q) : Promise.resolve([] as UscProgram[])), [q]);

  function choose(p: UscProgram) {
    update((prev) => ({ ...prev, major: p.name, majorPoid: p.poid }));
    setText(p.name);
  }

  return (
    <div className="quiz">
      <div className="stack-3">
        <h2 className="text-display">What's your major, {profile.name}?</h2>
        <p className="text-small text-muted">This searches USC's list of majors and minors, so pick yours from the results.</p>
      </div>
      <div className="stack-3">
        <label className="field">
          <span className="field__label">Search majors</span>
          <span className="search-input">
            <MagnifyingGlass size={18} aria-hidden />
            <input className="input" id="major" type="search" autoComplete="off" value={text} onChange={(e) => setText(e.target.value)} placeholder="Computer Science, Economics, Cinematic Arts..." />
          </span>
        </label>
        {profile.majorPoid && profile.major === text && (
          <p className="confirmations confirmations--some text-small"><CheckCircle size={18} weight="fill" aria-hidden />{profile.major} is your major.</p>
        )}
        {results.status === 'loading' && q.length >= 2 && <LoadingState label="Searching USC majors" lines={3} />}
        {results.status === 'error' && <ErrorState title="Search didn't work" error={results.error} onRetry={retry} />}
        {results.status === 'success' && results.data.length > 0 && (
          <ul className="plain-list stack-2" aria-label="Matching programs">
            {results.data.map((p) => (
              <li key={p.poid}>
                <button type="button" className={p.poid === profile.majorPoid ? 'result result--selected' : 'result'} onClick={() => choose(p)}>
                  <span className="text-strong">{p.name}</span>
                  <span className="text-small text-muted">{p.degree}, {p.school}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {results.status === 'success' && results.data.length === 0 && q.length >= 2 && q !== profile.major && (
          <p className="text-small text-muted">No USC program matches "{q}". Try a shorter word.</p>
        )}
        <div><Button disabled={!profile.majorPoid} onClick={onNext} iconAfter={<ArrowRight size={18} aria-hidden />}>Next: your classes</Button></div>
      </div>
    </div>
  );
}

// ---------- classes ----------

export function ClassesStep({ profile, update, onNext }: { profile: StudentProfile; update: Update; onNext: () => void }) {
  const [courses, retryCourses] = useAsync(api.courses, [profile.courseIds.join(',')]);
  const known = courses.status === 'success' ? courses.data : [];
  const [adding, setAdding] = useState<string | null>(null);
  const [addError, setAddError] = useState<Error | null>(null);

  async function addCatalogueCourse(c: CatalogueCourse) {
    setAdding(c.code);
    setAddError(null);
    try {
      const course = await api.addCourse(c.code, c.title);
      update((p) => (p.courseIds.includes(course.id) ? p : { ...p, courseIds: [...p.courseIds, course.id] }));
    } catch (err) {
      setAddError(err as Error);
    } finally {
      setAdding(null);
    }
  }
  const remove = (id: string) => update((p) => ({ ...p, courseIds: p.courseIds.filter((c) => c !== id) }));
  const picked = profile.courseIds.map((id) => known.find((c) => c.id === id)).filter((c): c is Course => Boolean(c));
  const isPicked = (code: string) => picked.some((c) => sameCourse(c.code, code));

  return (
    <div className="quiz">
      <div className="stack-3">
        <h2 className="text-display">Which classes are you taking this semester?</h2>
        <p className="text-small text-muted">Start with what {profile.major} requires, then add anything else you're curious about.</p>
        {picked.length > 0 && (
          <div className="stack-2">
            <p className="text-heading">Your classes</p>
            <ul className="plain-list chips" aria-label="Your classes">
              {picked.map((c) => (
                <li key={c.id} className="chip">
                  <span>{c.code}</span>
                  <button type="button" className="chip__remove" aria-label={`Remove ${c.code}`} onClick={() => remove(c.id)}><X size={14} aria-hidden /></button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <Button disabled={profile.courseIds.length === 0} onClick={onNext} iconAfter={<ArrowRight size={18} aria-hidden />}>
            {profile.courseIds.length === 0 ? 'Add at least one class' : 'Next: how you like to learn'}
          </Button>
        </div>
      </div>
      <div className="stack-5 min-0">
        {courses.status === 'error' && <ErrorState title="We couldn't load the classes" error={courses.error} onRetry={retryCourses} />}
        {addError && <ErrorState title="That class couldn't be added" error={addError} />}
        <WithProfiles courses={known} pickedIds={profile.courseIds} onAdd={(c) => addCatalogueCourse(c)} />
        {profile.majorPoid && (
          <Required poid={profile.majorPoid} major={profile.major} known={known} isPicked={isPicked} adding={adding} onAdd={addCatalogueCourse} />
        )}
        <CourseSearch isPicked={isPicked} adding={adding} onAdd={addCatalogueCourse} />
      </div>
    </div>
  );
}

const normalize = (code: string) => code.toUpperCase().replace(/\s+/g, ' ').replace(/[A-Z]+$/, '').trim();
const sameCourse = (a: string, b: string) => normalize(a) === normalize(b);

function WithProfiles({ courses, pickedIds, onAdd }: { courses: Course[]; pickedIds: string[]; onAdd: (c: CatalogueCourse) => void }) {
  const profiled = courses.filter((c) => c.sections.length > 0);
  if (!profiled.length) return null;
  return (
    <section className="stack-2">
      <h3 className="text-heading">Classes with section profiles</h3>
      <p className="text-small text-muted">Students have added notes for these, so we can rank their sections for you.</p>
      {profiled.map((c) => {
        const selected = pickedIds.includes(c.id);
        return (
          <motion.button key={c.id} type="button" className={selected ? 'course-option course-option--selected' : 'course-option'} aria-pressed={selected} onClick={() => onAdd(c)} whileTap={{ scale: 0.98 }} disabled={selected}>
            <span className="stack-1 min-0">
              <span className="row"><span className="text-title">{c.code}</span>{selected && <CheckCircle className="course-option__check" size={22} weight="fill" aria-hidden />}</span>
              <span className="text-small text-muted">{c.title}, {c.sections.length} sections</span>
            </span>
            <span className="course-option__shapes" aria-hidden>
              {c.sections.slice(0, 4).map((s) => (
                <ProfileLine key={s.id} values={Object.fromEntries(Object.entries(s.profile).map(([k, v]) => [k, v.value]))} size="glyph" label={s.name} />
              ))}
            </span>
          </motion.button>
        );
      })}
    </section>
  );
}

function Required({ poid, major, known, isPicked, adding, onAdd }: {
  poid: number; major: string; known: Course[]; isPicked: (code: string) => boolean; adding: string | null; onAdd: (c: CatalogueCourse) => void;
}) {
  const [tick, setTick] = useState(0);
  const [req, retry] = useAsync(() => api.requirements(poid), [poid, tick]);
  const queued = req.status === 'success' && req.data.status === 'queued';

  useEffect(() => {
    if (!queued) return;
    const t = window.setTimeout(() => setTick((n) => n + 1), REQUIREMENTS_POLL_MS);
    return () => window.clearTimeout(t);
  }, [queued, tick]);

  return (
    <section className="stack-2">
      <h3 className="text-heading">Required for {major}</h3>
      {req.status === 'error' && <ErrorState title="We couldn't load the requirements" error={req.error} onRetry={retry} />}
      {(req.status === 'loading' || queued) && (
        <div className="stack-2">
          <LoadingState label="Reading the requirements" lines={3} />
          <p className="text-small text-muted">
            We're reading {major} from the USC Catalogue. The catalogue asks sites like ours to wait two minutes between requests, so this can take a moment.
            {queued && req.data.etaSeconds ? ` About ${Math.max(10, req.data.etaSeconds)} seconds to go.` : ''} You can search below in the meantime.
          </p>
        </div>
      )}
      {req.status === 'success' && req.data.status === 'unavailable' && (
        <EmptyState title={`We don't have the ${major} requirements yet`} body="Search for your classes below, or add them by course code from your degree progress report." />
      )}
      {req.status === 'success' && req.data.status === 'ready' && (
        <>
          <p className="text-small text-muted">From the USC Catalogue 2026-2027. Check with your advisor for electives and choices between options.</p>
          <CourseList courses={req.data.courses} known={known} isPicked={isPicked} adding={adding} onAdd={onAdd} />
        </>
      )}
    </section>
  );
}

function CourseSearch({ isPicked, adding, onAdd }: { isPicked: (code: string) => boolean; adding: string | null; onAdd: (c: CatalogueCourse) => void }) {
  const [text, setText] = useState('');
  const q = useDebounced(text.trim(), SEARCH_DELAY_MS);
  const [results] = useAsync(() => (q.length >= 2 ? api.searchCourses(q) : Promise.resolve([] as CatalogueCourse[])), [q]);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');

  function addOwn(e: FormEvent) {
    e.preventDefault();
    onAdd({ code: code.trim(), title: title.trim() });
    setCode('');
    setTitle('');
  }

  return (
    <section className="stack-2">
      <h3 className="text-heading">Add any other class</h3>
      <label className="field">
        <span className="visually-hidden">Search classes</span>
        <span className="search-input">
          <MagnifyingGlass size={18} aria-hidden />
          <input className="input" id="course-search" type="search" autoComplete="off" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search by code or title, like WRIT 150 or film" />
        </span>
      </label>
      {results.status === 'success' && results.data.length > 0 && <CourseList courses={results.data} known={[]} isPicked={isPicked} adding={adding} onAdd={onAdd} />}
      {results.status === 'success' && q.length >= 2 && results.data.length === 0 && (
        <p className="text-small text-muted">We haven't seen "{q}" yet. Add it with its course code below.</p>
      )}
      <form className="add-course" onSubmit={addOwn}>
        <input className="input" id="own-code" aria-label="Course code" placeholder="Code, like THTR 101" value={code} onChange={(e) => setCode(e.target.value)} />
        <input className="input" id="own-title" aria-label="Course title" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button type="submit" variant="secondary" icon={<Plus size={18} aria-hidden />} disabled={!code.trim() || !title.trim()}>Add class</Button>
      </form>
    </section>
  );
}

function CourseList({ courses, known, isPicked, adding, onAdd }: {
  courses: CatalogueCourse[]; known: Course[]; isPicked: (code: string) => boolean; adding: string | null; onAdd: (c: CatalogueCourse) => void;
}) {
  if (!courses.length) return <p className="text-small text-muted">No specific courses were listed for this program.</p>;
  return (
    <ul className="plain-list course-list">
      {courses.map((c) => {
        const picked = isPicked(c.code);
        const profiled = known.find((k) => sameCourse(k.code, c.code) && k.sections.length > 0);
        return (
          <li key={c.code} className="course-list__row">
            <span className="stack-1 min-0">
              <span><span className="text-strong">{c.code}</span> {c.title}</span>
              {profiled && <span className="text-small text-muted">{profiled.sections.length} sections with profiles</span>}
            </span>
            {picked
              ? <CheckCircle className="course-option__check" size={22} weight="fill" aria-label="Added" />
              : <Button variant="secondary" disabled={adding === c.code} onClick={() => onAdd(c)} icon={<Plus size={16} aria-hidden />}>{adding === c.code ? 'Adding' : 'Add'}</Button>}
          </li>
        );
      })}
    </ul>
  );
}
