import { ArrowRight, LockSimple, Warning } from '@phosphor-icons/react';
import { COURSE_QUESTIONS, GENERAL_QUESTIONS } from '../../../shared/content.js';
import { api, type Course, type PlanCourse, type PlanReason, type PlanSection } from '../lib/api';
import { navigate, useAsync } from '../lib/hooks';
import { answersFor, courseReady, saveProfile, useProfile, type StudentProfile } from '../lib/storage';
import { formatMeeting, formatMinutes } from '../lib/time';
import { ProfileLine } from '../components/ProfileLine';
import { WeekGrid, type WeekBlock } from '../components/WeekGrid';
import { Button, Card, Disclosure, EmptyState, ErrorState, FitScore, KeyValue, LoadingState, QuizQuestion } from '../components/ui';

type Update = (change: (p: StudentProfile) => StudentProfile) => void;

const valuesOf = (s: PlanSection) => Object.fromEntries(s.breakdown.map((b) => [b.key, b.actual]));

export function Home() {
  const [profile, update] = useProfile();
  const [courses, retryCourses] = useAsync(api.courses, []);
  if (!profile) return null;

  const readyIds = profile.courseIds.filter((id) => courseReady(profile, id));
  const planKey = JSON.stringify({ readyIds, a: readyIds.map((id) => answersFor(profile, id)), t: profile.time, l: profile.locked });

  return (
    <>
      <div className="stack-4">
        <h1 className="text-display">{profile.name}'s schedule</h1>
        <ProfileSummary profile={profile} />
      </div>
      {courses.status === 'loading' && <LoadingState label="Loading your classes" lines={4} />}
      {courses.status === 'error' && <ErrorState title="We couldn't load your classes" error={courses.error} onRetry={retryCourses} />}
      {courses.status === 'success' && (
        <PlannedClasses key={planKey} profile={profile} update={update} courses={courses.data} readyIds={readyIds} />
      )}
    </>
  );
}

function ProfileSummary({ profile }: { profile: StudentProfile }) {
  const { earliest, latest } = profile.time;
  const window = earliest != null && latest != null ? `${formatMinutes(earliest)} to ${formatMinutes(latest)}` : 'Not set';
  function startOver() {
    saveProfile(null);
    navigate('#/welcome');
  }
  return (
    <div className="summary">
      <KeyValue items={[
        ['Major', <span key="m">{profile.major} <a href="#/setup?step=major">Change</a></span>],
        ['Class times', <span key="t">{window} <a href="#/setup?step=earliest">Change</a></span>],
        ['Learning', <span key="l">{GENERAL_QUESTIONS.length} answers saved <a href={`#/setup?step=${GENERAL_QUESTIONS[0].key}`}>Retake</a></span>],
        ['Classes', <span key="c">{profile.courseIds.length} picked <a href="#/setup?step=classes">Add or remove</a></span>],
      ]} />
      <p className="text-small text-muted">Not {profile.name}? <button type="button" className="link-button" onClick={startOver}>Start over with a new profile</button></p>
    </div>
  );
}

function PlannedClasses({ profile, update, courses, readyIds }: { profile: StudentProfile; update: Update; courses: Course[]; readyIds: string[] }) {
  const [plan, retryPlan] = useAsync(
    () => (readyIds.length
      ? api.plan({
        courses: readyIds.map((id) => ({ courseId: id, answers: answersFor(profile, id)! })),
        earliest: profile.time.earliest,
        latest: profile.time.latest,
        locked: profile.locked,
      })
      : Promise.resolve([] as PlanCourse[])),
    [],
  );
  const planned = plan.status === 'success' ? plan.data : [];
  const codeOf = (id: string) => courses.find((c) => c.id === id)?.code ?? id;

  return (
    <div className="home">
      <section className="stack-3 min-0" aria-label="Your classes">
        {profile.courseIds.map((id) => {
          const course = courses.find((c) => c.id === id);
          if (!course) return null;
          if (!courseReady(profile, id)) return <CourseQuestions key={id} course={course} profile={profile} update={update} />;
          const coursePlan = planned.find((p) => p.id === id);
          if (plan.status === 'loading') return <Card key={id}><LoadingState label={`Ranking ${course.code} sections`} /></Card>;
          if (!coursePlan) return null;
          return <PlannedCourse key={id} plan={coursePlan} profile={profile} update={update} codeOf={codeOf} />;
        })}
      </section>
      <section className="stack-3 min-0 home__week" aria-label="Your week">
        {plan.status === 'error' && <ErrorState title="We couldn't build your schedule" error={plan.error} onRetry={retryPlan} />}
        {plan.status === 'loading' && readyIds.length > 0 && <Card><LoadingState label="Building your week" lines={6} /></Card>}
        {plan.status === 'success' && planned.length === 0 && (
          <EmptyState title="Your week will show up here" body="Answer the two quick questions for a class and its best section is placed on your calendar." />
        )}
        {plan.status === 'success' && planned.length > 0 && (
          <Card>
            <WeekGrid blocks={toBlocks(planned)} earliest={profile.time.earliest} latest={profile.time.latest} />
            <p className="text-small text-muted">
              Each class gets the section with the highest fit that starts and ends inside your hours and doesn't overlap another class. Shaded hours are outside your window.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}

function toBlocks(planned: PlanCourse[]): WeekBlock[] {
  return planned.flatMap((c) => {
    const chosen = c.sections.find((s) => s.id === c.chosenId);
    if (!chosen?.plan.time) return [];
    return [{ id: c.id, title: c.code, detail: lastName(chosen.name), time: chosen.plan.time, problem: chosen.plan.status === 'chosen-with-problem' }];
  });
}

const lastName = (full: string) => full.split(' ').slice(-1)[0];

function CourseQuestions({ course, profile, update }: { course: Course; profile: StudentProfile; update: Update }) {
  const answers = profile.perCourse[course.id] ?? {};
  const answer = (key: string, value: string | number) =>
    update((p) => ({ ...p, perCourse: { ...p.perCourse, [course.id]: { ...p.perCourse[course.id], [key]: value } } }));
  return (
    <Card>
      <div className="stack-1">
        <h2 className="text-title">{course.code}</h2>
        <p className="text-small text-muted">{course.title}. Two quick questions and we'll place it on your week.</p>
      </div>
      {COURSE_QUESTIONS.map((q) => (
        <QuizQuestion
          key={q.key}
          id={`${course.id}-${q.key}`}
          question={q.question.replace('{course}', course.code)}
          headingClass="text-heading"
          layout="chips"
          options={q.options}
          value={(answers as Record<string, number>)[q.key]}
          onSelect={(v) => answer(q.key, v)}
        />
      ))}
    </Card>
  );
}

const REASONS: Record<Exclude<PlanReason, null>, (s: PlanSection, profile: StudentProfile, codeOf: (id: string) => string) => string> = {
  'starts-too-early': (_s, p) => `Starts before ${formatMinutes(p.time.earliest ?? 0)}`,
  'ends-too-late': (_s, p) => `Ends after ${formatMinutes(p.time.latest ?? 0)}`,
  conflict: (s, _p, codeOf) => `Overlaps your ${codeOf(s.plan.conflictWith ?? '')} section`,
};

function reasonText(s: PlanSection, profile: StudentProfile, codeOf: (id: string) => string) {
  return s.plan.reason ? REASONS[s.plan.reason](s, profile, codeOf) : null;
}

function PlannedCourse({ plan, profile, update, codeOf }: { plan: PlanCourse; profile: StudentProfile; update: Update; codeOf: (id: string) => string }) {
  const chosen = plan.sections.find((s) => s.id === plan.chosenId);
  const others = plan.sections.filter((s) => s.id !== plan.chosenId);
  const locked = profile.locked[plan.id] != null;
  const lock = (sectionId: number) => update((p) => ({ ...p, locked: { ...p.locked, [plan.id]: sectionId } }));
  const unlock = () => update((p) => {
    const rest = { ...p.locked };
    delete rest[plan.id];
    return { ...p, locked: rest };
  });
  const changeAnswers = () => update((p) => {
    const rest = { ...p.perCourse };
    delete rest[plan.id];
    return { ...p, perCourse: rest };
  });

  if (!chosen) return <Card><p className="text-heading">{plan.code}</p><p className="text-small text-muted">No sections have profiles yet.</p></Card>;
  const problem = reasonText(chosen, profile, codeOf);

  return (
    <Card as="article">
      <div className="row-between">
        <div className="stack-1 min-0">
          <h2 className="text-title">{plan.code}</h2>
          <p className="text-small text-muted">{plan.title}</p>
        </div>
        {locked && <span className="badge"><LockSimple size={14} aria-hidden />You picked this</span>}
      </div>
      <div className="planned">
        <ProfileLine values={valuesOf(chosen)} size="glyph" label={chosen.name} />
        <div className="stack-1 min-0">
          <a className="text-heading" href={`#/professor/${chosen.id}`}>{chosen.name}</a>
          <span className="text-small text-muted">{formatMeeting(chosen.plan.time)}</span>
          {chosen.is_sample && <span className="text-small text-muted">Sample professor, fictional</span>}
        </div>
        <FitScore score={chosen.score} size="small" />
      </div>
      {problem && (
        <p className="watch-out text-small"><Warning className="watch-out__icon" size={18} weight="fill" aria-hidden />{problem}.{locked ? '' : ` Every ${plan.code} section has a time problem, so this is the best fit among them.`}</p>
      )}
      <Disclosure summary={`Other ${plan.code} sections (${others.length})`}>
        <ul className="plain-list stack-3">
          {others.map((s) => {
            const why = reasonText(s, profile, codeOf);
            return (
              <li key={s.id} className="alternative">
                <ProfileLine values={valuesOf(s)} size="glyph" label={s.name} />
                <span className="stack-1 min-0">
                  <span className="text-strong">{s.name}, {s.score}% fit</span>
                  <span className="text-small text-muted">{formatMeeting(s.plan.time)}</span>
                  {why && <span className="text-small alternative__problem">{why}</span>}
                </span>
                <Button variant="secondary" onClick={() => lock(s.id)}>Use this section</Button>
              </li>
            );
          })}
        </ul>
        {locked && <div><Button variant="quiet" onClick={unlock}>Let the planner choose again</Button></div>}
      </Disclosure>
      <div className="row">
        <Button variant="secondary" href={`#/matches?course=${plan.id}`} iconAfter={<ArrowRight size={18} aria-hidden />}>Why {lastName(chosen.name)} fits you</Button>
        <Button variant="quiet" onClick={changeAnswers}>Change my {plan.code} answers</Button>
      </div>
    </Card>
  );
}
