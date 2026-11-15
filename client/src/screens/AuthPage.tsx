import { useState, type FormEvent } from 'react';
import { ArrowRight, CloudCheck, DeviceMobile, LockSimple } from '@phosphor-icons/react';
import { PRODUCT_NAME } from '../../../shared/content.js';
import { api } from '../lib/api';
import { navigate } from '../lib/hooks';
import { loadProfile, newProfile, saveProfile, setupComplete, signedIn, type StudentProfile } from '../lib/storage';
import { Button, Card, ErrorState } from '../components/ui';

type Mode = 'signup' | 'login' | 'guest';

const HEADINGS: Record<Mode, string> = {
  signup: `Create your ${PRODUCT_NAME} account`,
  login: `Log in to ${PRODUCT_NAME}`,
  guest: 'Try it without an account',
};

export function AuthPage({ mode }: { mode: Mode }) {
  return (
    <div className="split">
      <div className="stack-4">
        <h1 className="text-display">{HEADINGS[mode]}</h1>
        <p className="text-body text-muted">
          You'll tell us your major, the classes you need this semester, how you like to learn and when you can be on campus.
          Then we rank every section of each class for you and build a schedule with no overlaps.
        </p>
        <p className="text-small"><a href="#/contribute">Taking a class now? Add your notes instead</a></p>
      </div>
      <Card>
        <ModeSwitch mode={mode} />
        {mode === 'guest' ? <GuestForm /> : <AccountForm mode={mode} />}
      </Card>
    </div>
  );
}

function ModeSwitch({ mode }: { mode: Mode }) {
  const items: [Mode, string, string][] = [['signup', 'Create account', '#/signup'], ['login', 'Log in', '#/login']];
  return (
    <div className="segmented" role="tablist" aria-label="Account">
      {items.map(([key, label, href]) => (
        <a key={key} role="tab" aria-selected={mode === key} className="segmented__item segmented__item--link" href={href}>{label}</a>
      ))}
    </div>
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
    <form className="stack-4" onSubmit={submit} noValidate>
      {isSignup && (
        <label className="field">
          <span className="field__label">First name</span>
          <input className="input" id="first-name" type="text" autoComplete="given-name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      )}
      <label className="field">
        <span className="field__label">Email</span>
        <input className="input" id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">Password</span>
        <input className="input" id="password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
        {isSignup && <span className="text-small text-muted">At least 8 characters.</span>}
      </label>
      {error && <ErrorState title={isSignup ? 'We couldn\'t create your account' : 'We couldn\'t log you in'} error={error} />}
      <Button type="submit" block disabled={!ready || busy} iconAfter={<ArrowRight size={18} aria-hidden />}>
        {busy ? 'One moment' : isSignup ? 'Create my account' : 'Log in'}
      </Button>
      <ul className="privacy-list">
        <li className="privacy-list__item">
          <CloudCheck className="privacy-list__icon" size={22} aria-hidden />
          <span className="text-small">Your answers and schedule are saved to your account, so you can pick up on any device.</span>
        </li>
        <li className="privacy-list__item">
          <LockSimple className="privacy-list__icon" size={22} aria-hidden />
          <span className="text-small">Your password is stored only as a salted hash, and we never ask for your USC login.</span>
        </li>
      </ul>
      <p className="text-small"><a href="#/guest">Try it without an account</a></p>
    </form>
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
    <form className="stack-4" onSubmit={start}>
      <label className="field">
        <span className="field__label">Your first name</span>
        <input className="input" id="guest-name" type="text" autoComplete="given-name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <p className="privacy-list__item">
        <DeviceMobile className="privacy-list__icon" size={22} aria-hidden />
        <span className="text-small">Without an account, your answers are saved in this browser only. Create an account later and they move into it.</span>
      </p>
      <Button type="submit" block disabled={!trimmed} iconAfter={<ArrowRight size={18} aria-hidden />}>Start without an account</Button>
    </form>
  );
}
