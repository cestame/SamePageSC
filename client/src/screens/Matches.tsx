import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CaretDown, CheckCircle, Warning } from '@phosphor-icons/react';
import { api, type Answers, type Explanation, type FeedbackStats, type Match } from '../lib/api';
import { navigate, useAsync } from '../lib/hooks';
import { isComplete, loadAnswers } from '../lib/storage';
import { ProfileLine } from '../components/ProfileLine';
import { Button, Card, Disclosure, EmptyState, ErrorState, FitScore, LoadingState, SampleBadge } from '../components/ui';

type ExplanationState = Explanation | Error | undefined;

const valuesOf = (m: Match) => Object.fromEntries(m.breakdown.map((b) => [b.key, b.actual]));
const targetsOf = (m: Match) => Object.fromEntries(m.breakdown.map((b) => [b.key, b.target]));

export function Matches({ courseId }: { courseId: string | null }) {
  const answers = loadAnswers();
  const [courses, retryCourses] = useAsync(api.courses, []);
  const activeId = courseId ?? (courses.status === 'success' ? courses.data[0]?.id : null);

  useEffect(() => {
    if (!isComplete(answers)) navigate(`#/intake${courseId ? `?course=${courseId}` : ''}`);
  }, [answers, courseId]);

  if (!isComplete(answers)) return null;
  if (courses.status === 'loading') return <LoadingState label="Loading courses" lines={4} />;
  if (courses.status === 'error') return <ErrorState title="We couldn't load the courses" error={courses.error} onRetry={retryCourses} />;

  const course = courses.data.find((c) => c.id === activeId);
  if (!course) {
    return <EmptyState title="We don't know that class" body="Pick one of the classes we have profiles for." action={<Button href="#/">Choose a class</Button>} />;
  }

  return (
    <>
      <h1 className="text-display">{course.code} sections ranked for you</h1>
      {courses.data.length > 1 && (
        <div className="segmented" role="tablist" aria-label="Course">
          {courses.data.map((c) => (
            <button key={c.id} type="button" role="tab" aria-selected={c.id === course.id} className="segmented__item" onClick={() => navigate(`#/matches?course=${c.id}`)}>
              {c.code}
            </button>
          ))}
        </div>
      )}
      <RankedSections courseId={course.id} answers={answers} />
      <div><Button variant="quiet" href={`#/intake?course=${course.id}`}>Change my answers</Button></div>
    </>
  );
}

function RankedSections({ courseId, answers }: { courseId: string; answers: Answers }) {
  const [matches, retry] = useAsync(() => api.match(courseId, answers), [courseId]);
  const explanations = useExplanations(matches.status === 'success' ? matches.data : [], answers);

  if (matches.status === 'loading') return <Card emphasis><LoadingState label="Ranking sections" lines={5} /></Card>;
  if (matches.status === 'error') return <ErrorState title="We couldn't rank the sections" error={matches.error} onRetry={retry} />;
  if (matches.data.length === 0) {
    return (
      <EmptyState
        title="No section profiles for this class yet"
        body="A profile appears once a current student adds notes or a syllabus."
        action={<Button variant="secondary" href="#/contribute">Add notes for this class</Button>}
      />
    );
  }

  const [top, ...rest] = matches.data;
  return (
    <>
      <TopMatch match={top} explanation={explanations[top.id]} />
      {rest.length > 0 && (
        <div className="stack-3">
          {rest.map((m) => <OtherMatch key={m.id} match={m} explanation={explanations[m.id]} />)}
        </div>
      )}
    </>
  );
}

/** Loads the AI explanation for each match independently, so the ranking shows right away. */
function useExplanations(matches: Match[], answers: Answers) {
  const [byId, setById] = useState<Record<number, ExplanationState>>({});
  const ids = matches.map((m) => m.id).join(',');

  useEffect(() => {
    let cancelled = false;
    setById({});
    for (const m of matches) {
      api.explain(m.id, answers)
        .then((ex) => { if (!cancelled) setById((prev) => ({ ...prev, [m.id]: ex })); })
        .catch((err: Error) => { if (!cancelled) setById((prev) => ({ ...prev, [m.id]: err })); });
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  return byId;
}

function TopMatch({ match, explanation }: { match: Match; explanation: ExplanationState }) {
  return (
    <Card as="article" emphasis>
      <div className="stack-2">
        <div className="row">
          <span className="top-match__marker" aria-hidden />
          <span className="visually-hidden">Best fit:</span>
          <h2 className="text-title"><a href={`#/professor/${match.id}`}>{match.name}</a></h2>
        </div>
        {match.is_sample && <div><SampleBadge /></div>}
        <MeetingSentence match={match} />
      </div>
      <FitScore score={match.score} caption="fit, meaning how close this class is to your answers across the seven rows below" />
      <MatchDiagram match={match} />
      <ExplanationBlock explanation={explanation} />
      <Confirmations stats={match.feedback} />
      <Breakdown match={match} />
      <div><Button variant="secondary" href={`#/professor/${match.id}`} iconAfter={<ArrowRight size={18} aria-hidden />}>Evidence and full profile for {match.name}</Button></div>
    </Card>
  );
}

function OtherMatch({ match, explanation }: { match: Match; explanation: ExplanationState }) {
  const [open, setOpen] = useState(false);
  const watchOut = explanation && !(explanation instanceof Error) ? explanation.watch_out : null;
  return (
    <Card as="article">
      <button type="button" className="match-row" aria-expanded={open} onClick={() => setOpen(!open)}>
        <ProfileLine values={valuesOf(match)} size="glyph" label={match.name} />
        <span className="stack-1 min-0">
          <span className="match-row__name">{match.name}</span>
          {match.is_sample && <span className="text-small text-muted">Sample professor, fictional</span>}
        </span>
        <span className="row">
          <FitScore score={match.score} size="small" />
          <motion.span className="icon-inline" animate={{ rotate: open ? 180 : 0 }}><CaretDown size={18} aria-hidden /></motion.span>
        </span>
      </button>
      {watchOut && !open && <WatchOut text={watchOut} />}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="stack-4 collapse"
          >
            <MeetingSentence match={match} />
            <p className="text-small text-muted">{match.score}% fit, meaning how close this class is to your answers across the seven rows below.</p>
            <MatchDiagram match={match} />
            <ExplanationBlock explanation={explanation} />
            <Confirmations stats={match.feedback} />
            <Breakdown match={match} />
            <div><Button variant="secondary" href={`#/professor/${match.id}`} iconAfter={<ArrowRight size={18} aria-hidden />}>Evidence and full profile</Button></div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function MeetingSentence({ match }: { match: Match }) {
  if (!match.section && !match.schedule) return null;
  const parts = [match.section && `Section ${match.section}`, match.schedule && `meets ${match.schedule}`].filter(Boolean);
  return <p className="text-small text-muted">{parts.join(', ')}.</p>;
}

function MatchDiagram({ match }: { match: Match }) {
  return (
    <div className="stack-3">
      <ProfileLine values={valuesOf(match)} target={targetsOf(match)} label={match.name} />
      <div className="legend" aria-hidden>
        <span className="legend__item">
          <svg className="legend__swatch" viewBox="0 0 22 10"><line x1="0" y1="5" x2="22" y2="5" className="profile-line__line" strokeWidth="2.5" /></svg>
          This class
        </span>
        <span className="legend__item">
          <svg className="legend__swatch" viewBox="0 0 22 10"><line x1="0" y1="5" x2="22" y2="5" className="profile-line__target" /></svg>
          What you asked for
        </span>
        <span className="legend__item">
          <svg className="legend__swatch" viewBox="0 0 22 10"><rect width="22" height="10" rx="2" className="profile-line__gap" /></svg>
          The gap that lowers the score
        </span>
      </div>
    </div>
  );
}

function ExplanationBlock({ explanation }: { explanation: ExplanationState }) {
  if (!explanation) return <LoadingState label="Writing why this section fits you" lines={3} />;
  if (explanation instanceof Error) {
    return <p className="text-small text-muted">We couldn't write an explanation for this one ({explanation.message}). The score and diagram above still apply.</p>;
  }
  return (
    <div className="stack-3">
      <p className="text-body">{explanation.why}</p>
      <WatchOut text={explanation.watch_out} />
      <p className="text-small text-muted">
        {explanation.source === 'ai'
          ? 'An AI model wrote this from your answers and this class\'s profile. The ranking comes from the score, not the AI.'
          : `${explanation.notice ?? ''} This text comes straight from the score breakdown.`}
      </p>
    </div>
  );
}

function WatchOut({ text }: { text: string }) {
  return (
    <p className="watch-out text-body">
      <Warning className="watch-out__icon" size={20} weight="fill" aria-hidden />
      <span><span className="visually-hidden">Watch out: </span>{text}</span>
    </p>
  );
}

function Confirmations({ stats }: { stats: FeedbackStats }) {
  if (!stats.total) {
    return <p className="confirmations text-small">No students who took this class have checked the profile yet.</p>;
  }
  return (
    <p className="confirmations confirmations--some text-small">
      <CheckCircle size={18} weight="fill" aria-hidden />
      {stats.confirmed} of {stats.total} students who took it said the profile matched on pace, format and workload.
    </p>
  );
}

function Breakdown({ match }: { match: Match }) {
  return (
    <Disclosure summary="How this score was worked out">
      <div className="table-scroll">
        <table className="breakdown">
          <thead>
            <tr><th>Row</th><th className="num">You</th><th className="num">Class</th><th className="num">Weight</th><th className="num">Fit</th></tr>
          </thead>
          <tbody>
            {match.breakdown.map((b) => (
              <tr key={b.key}>
                <td><span className="text-strong">{b.label}</span><br /><span className="text-small text-muted">Based on {b.why}</span></td>
                <td className="num text-figure">{b.target}</td>
                <td className="num text-figure">{b.actual}</td>
                <td className="num text-figure">{b.weight}</td>
                <td className="num text-figure">{b.fit}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-small text-muted">
        Each row scores how close the class is to what you asked for, from 0% (4 steps apart) to 100% (the same). The fit is the weighted average of the rows.
        Participation and workload only count against a class when it asks for more than you said you want.
      </p>
    </Disclosure>
  );
}
