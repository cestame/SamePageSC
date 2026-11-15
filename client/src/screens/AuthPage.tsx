import { useState, type FormEvent } from 'react';
import { ArrowRight, Check, DeviceMobile, LockSimple } from '@phosphor-icons/react';
import { api } from '../lib/api';
import { navigate } from '../lib/hooks';
import { loadProfile, newProfile, saveProfile, setupComplete, signedIn, type StudentProfile } from '../lib/storage';
import { Button, ErrorState } from '../components/ui';
import { ProfileLine } from '../components/ProfileLine';

type Mode = 'signup' | 'login' | 'guest';

export const ACCOUNT_PANEL_ID = 'account';

const HEADINGS: Record<Mode, { title: string; hint: string }> = {
  signup: { title: 'Build a schedule that fits', hint: 'Answer a few questions, then compare the sections of every class you need.' },
  login: { title: 'Pick up where you left off', hint: 'Use the email and password you signed up with.' },
  guest: { title: 'Try it without an account', hint: 'Tell us what to call you and you can start right away.' },
};

/** A fictional class used to show what a teaching profile looks like before the student has any. */
const SAMPLE_SHAPE = { pace: 2, format: 1, structure: 5, assessment: 3, participation: 1, guidance: 2, workload: 4 };

export function AuthPage({ mode }: { mode: Mode }) {
  const heading = HEADINGS[mode];
  return (
    <div className="auth">
      <section className="auth__panel" id={ACCOUNT_PANEL_ID} aria-labelledby="auth-title">
        <ModeSwitch mode={mode} />
        <div className="stack-2">
          <h1 id="auth-title" className="text-display">{heading.title}</h1>
          <p className="text-small text-muted">{heading.hint}</p>
        </div>
        {mode === 'guest' ? <GuestForm /> : <AccountForm mode={mode} />}
      </section>
      <ProfilePreview />
    </div>
  );
}

function ProfilePreview() {
  return (
    <aside className="auth__motif" aria-labelledby="motif-title">
      <ProfileLine values={SAMPLE_SHAPE} size="card" label="a sample class" />
      <div className="stack-3">
        <h2 id="motif-title" className="text-title">Every class gets a shape</h2>
        <p className="text-body text-muted">
          Students who took a class add their notes and syllabus. We turn them into seven ratings, from pace to workload,
          and draw them as one line, so you can tell two sections apart at a glance. This one is a fictional sample.
        </p>
        <ul className="plain-list stack-2">
          <li className="auth__proof"><Check size={18} weight="bold" aria-hidden />Your answers are drawn over each section's line</li>
          <li className="auth__proof"><Check size={18} weight="bold" aria-hidden />Every match names one honest downside</li>
        </ul>
        <p className="text-small"><a href="#/contribute">Taking a class now? Add your notes instead</a></p>
      </div>
    </aside>
  );
}

function ModeSwitch({ mode }: { mode: Mode }) {
  const items: [Mode, string, string][] = [['signup', 'Create account', '#/signup'], ['login', 'Log in', '#/login']];
  return (
    <div className="segmented segmented--fill" role="tablist" aria-label="Account">
      {items.map(([key, label, href]) => (
        <a key={key} role="tab" aria-selected={mode === key} className="segmented__item segmented__item--link" href={href}>{label}</a>
      ))}
    </div>
  );
}

function SecurityNote() {
  return (
    <p className="auth__note text-small text-muted">
      <LockSimple size={20} aria-hidden />
      <span>We never ask for your USC login. Your password is stored only as a salted hash.</span>
    </p>
  );
}

function AccountForm({ mode }: { mode: 'signup' | 'login' }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isSignup = mode === 'signup';
  const ready = email.trim() && password && (!isSignup || (name.trim() && password.length >= 8));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const session = isSignup ? await api.signup(name.trim(), email.trim(), password) : await api.login(email.trim(), password);
      if (session.user) signedIn(session.user, session.profile as StudentProfile | null);
      const profile = loadProfile();
      navigate(profile && setupComplete(profile) ? '#/home' : '#/setup');
    } catch (err) {
      setError(err as Error);
      setBusy(false);
    }
  }

  return (
    <>
      <form className="stack-4" onSubmit={submit} noValidate>
        {isSignup && (
          <label className="field">
            <span className="field__label">First name</span>
            <input className="input" id="first-name" type="text" autoComplete="given-name" maxLength={40} placeholder="Tommy" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label className="field">
          <span className="field__label">Email</span>
          <input className="input" id="email" type="email" autoComplete="email" placeholder="you@usc.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Password</span>
          <input
            className="input"
            id="password"
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <ErrorState title={isSignup ? 'We couldn\'t create your account' : 'We couldn\'t log you in'} error={error} />}
        <Button type="submit" block disabled={!ready || busy} iconAfter={<ArrowRight size={19} aria-hidden />}>
          {busy ? 'One moment' : isSignup ? 'Create my account' : 'Log in'}
        </Button>
      </form>
      <Button variant="accent-link" href="#/guest" iconAfter={<ArrowRight size={19} aria-hidden />}>Try it without an account</Button>
      <SecurityNote />
    </>
  );
}

function GuestForm() {
  const [name, setName] = useState('');
  const trimmed = name.trim();
  function start(e: FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    saveProfile(newProfile(trimmed));
    navigate('#/setup');
  }
  return (
    <>
      <form className="stack-4" onSubmit={start}>
        <label className="field">
          <span className="field__label">Your first name</span>
          <input className="input" id="guest-name" type="text" autoComplete="given-name" maxLength={40} placeholder="Tommy" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <Button type="submit" block disabled={!trimmed} iconAfter={<ArrowRight size={19} aria-hidden />}>Start without an account</Button>
      </form>
      <p className="auth__note text-small text-muted">
        <DeviceMobile size={20} aria-hidden />
        <span>Without an account, your answers are saved in this browser only. Create an account later and they move into it.</span>
      </p>
    </>
  );
}
