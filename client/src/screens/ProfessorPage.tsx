import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle, PaperPlaneTilt, SealCheck } from '@phosphor-icons/react';
import { FEEDBACK_PROMPTS } from '../../../shared/content.js';
import { api, type FeedbackStats, type ProfessorDetail } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { ProfileLine } from '../components/ProfileLine';
import { EvidenceList } from '../components/EvidenceList';
import { Badge, Button, Card, Disclosure, ErrorState, KeyValue, LoadingState, QuizQuestion, SampleBadge } from '../components/ui';

type FeedbackKey = 'pace' | 'format' | 'workload';
const YES_NO = [{ value: true, label: 'Yes' }, { value: false, label: 'Not really' }] as const;

export function ProfessorPage({ id }: { id: number }) {
  const [state, retry] = useAsync(() => api.professor(id), [id]);
  if (state.status === 'loading') return <Card><LoadingState label="Loading the profile" lines={6} /></Card>;
  if (state.status === 'error') return <ErrorState title="We couldn't load this profile" error={state.error} onRetry={retry} />;
  return <Profile professor={state.data} onChanged={retry} />;
}

function Profile({ professor: p, onChanged }: { professor: ProfessorDetail; onChanged: () => void }) {
  const values = Object.fromEntries(Object.entries(p.profile).map(([k, v]) => [k, v.value]));
  const sourceText = p.is_sample
    ? 'Sample data written by the team for the demo'
    : `${p.contributionCount} student contribution${p.contributionCount === 1 ? '' : 's'}, averaged`;
  const facts: [string, string][] = [['Course', `${p.course_code}, ${p.course_title}`]];
  if (p.section) facts.push(['Section', p.section]);
  if (p.schedule) facts.push(['Meets', p.schedule]);
  facts.push(['Built from', sourceText]);

  return (
    <>
      <div><Button variant="quiet" href={`#/matches?course=${p.course_id}`} icon={<ArrowLeft size={18} aria-hidden />}>Back to {p.course_code} matches</Button></div>
      <div className="stack-3">
        <h1 className="text-display">{p.name}</h1>
        {p.is_sample && <div><SampleBadge /></div>}
        <KeyValue items={facts} />
      </div>

      <Card>
        <ProfileLine values={values} label={p.name} />
        <p className="text-body">{p.summary}</p>
      </Card>

      <Card>
        <h2 className="text-title">Where each rating comes from</h2>
        <EvidenceList rows={p.profile} />
      </Card>

      <FeedbackCard professorId={p.id} initial={p.feedback} />
      <Responses professor={p} onPosted={onChanged} />
    </>
  );
}

function Tally({ stats }: { stats: FeedbackStats }) {
  if (!stats.total) return <p className="text-small text-muted">No one who took this class has checked the profile yet.</p>;
  const rows: [string, number][] = [['Pace matched', stats.pace_ok], ['Format matched', stats.format_ok], ['Workload matched', stats.workload_ok]];
  return (
    <div className="tally" aria-label={`Answers from ${stats.total} students who took this class`}>
      {rows.map(([label, yes]) => (
        <div key={label} className="tally__row">
          <span className="text-small">{label}</span>
          <span className="text-small text-figure">{yes} of {stats.total}</span>
          <div className="tally__bar" aria-hidden>
            <motion.div className="tally__fill" initial={{ width: 0 }} animate={{ width: `${(yes / stats.total) * 100}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function FeedbackCard({ professorId, initial }: { professorId: number; initial: FeedbackStats }) {
  const [stats, setStats] = useState(initial);
  const [picks, setPicks] = useState<Partial<Record<FeedbackKey, boolean>>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<Error | null>(null);
  const ready = FEEDBACK_PROMPTS.every((q) => picks[q.key as FeedbackKey] !== undefined);

  async function send() {
    setStatus('sending');
    setError(null);
    try {
      const res = await api.feedback(professorId, picks as Record<FeedbackKey, boolean>);
      setStats(res.feedback);
      setStatus('sent');
    } catch (e) {
      setError(e as Error);
      setStatus('idle');
    }
  }

  return (
    <Card>
      <h2 className="text-title">Took this class?</h2>
      <Tally stats={stats} />
      {status === 'sent' ? (
        <p className="confirmations confirmations--some text-body">
          <CheckCircle size={20} weight="fill" aria-hidden />
          Thanks. Your three answers are counted above.
        </p>
      ) : (
        <div className="stack-4">
          {FEEDBACK_PROMPTS.map((q) => (
            <QuizQuestion
              key={q.key}
              id={`fb-${q.key}`}
              question={q.question}
              headingClass="text-heading"
              layout="pair"
              options={YES_NO}
              value={picks[q.key as FeedbackKey]}
              onSelect={(v) => setPicks({ ...picks, [q.key]: v })}
            />
          ))}
          {error && <ErrorState title="Your answers didn't send" error={error} />}
          <Button block disabled={!ready || status === 'sending'} onClick={send}>
            {status === 'sending' ? 'Sending' : 'Send my three answers'}
          </Button>
        </div>
      )}
    </Card>
  );
}

function Responses({ professor: p, onPosted }: { professor: ProfessorDetail; onPosted: () => void }) {
  const [body, setBody] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function post() {
    setSending(true);
    setError(null);
    try {
      await api.respond(p.id, body, code);
      onPosted();
    } catch (e) {
      setError(e as Error);
      setSending(false);
    }
  }

  return (
    <Card>
      <h2 className="text-title">From the professor</h2>
      {p.responses.length === 0 && <p className="text-small text-muted">{p.name} hasn't responded to this profile.</p>}
      {p.responses.map((r, i) => (
        <div key={i} className="stack-2">
          <p className="text-body">{r.body}</p>
          <div>
            {r.verified
              ? <Badge tone="verified"><SealCheck size={16} weight="fill" aria-hidden />Verified professor</Badge>
              : <Badge>Not verified</Badge>}
          </div>
        </div>
      ))}
      <Disclosure summary={`Are you ${p.name}? Respond to this profile`}>
        <label className="field">
          <span className="field__label">Your response</span>
          <textarea className="input" id="response-body" maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="Corrections, context, or tips for students thinking about your section" />
        </label>
        <label className="field">
          <span className="field__label">Verification code</span>
          <input className="input" id="response-code" type="password" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} />
          <span className="text-small text-muted">Ask the team for a code to get the verified mark. Without one, your response shows as not verified.</span>
        </label>
        {error && <ErrorState title="Your response wasn't posted" error={error} />}
        <div>
          <Button disabled={sending || body.trim().length < 10} onClick={post} icon={<PaperPlaneTilt size={18} aria-hidden />}>
            {sending ? 'Posting' : 'Post my response'}
          </Button>
        </div>
      </Disclosure>
    </Card>
  );
}
