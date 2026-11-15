import { useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { NOT_OFFICIAL, PRODUCT_NAME, TAGLINE } from '../../shared/content.js';
import { ProfileLine } from './components/ProfileLine';
import { useHashRoute } from './lib/hooks';
import { AuthPage } from './screens/AuthPage';
import { Setup } from './screens/Setup';
import { Home } from './screens/Home';
import { currentUser, loadProfile, restoreSession, setupComplete, signOut } from './lib/storage';
import { navigate } from './lib/hooks';
import { LoadingState } from './components/ui';
import { Matches } from './screens/Matches';
import { ProfessorPage } from './screens/ProfessorPage';
import { Contribute } from './screens/Contribute';
import { Privacy } from './screens/Privacy';

const BRAND_SHAPE = { pace: 2, format: 1, structure: 5, assessment: 3, participation: 1, guidance: 2, workload: 4 };

const NAV = [
  { href: '#/', label: 'My schedule', section: 'home' },
  { href: '#/contribute', label: 'Add notes', section: 'contribute' },
  { href: '#/privacy', label: 'Privacy', section: 'privacy' },
];

function sectionOf(first: string | undefined) {
  if (first === 'contribute') return 'contribute';
  if (first === 'privacy') return 'privacy';
  return 'home';
}

// Reading pages stay at a comfortable line length; the planner and match pages use the full width.
const READING_PAGES = new Set(['contribute', 'privacy']);
// Routes that show whichever step the student is on: create profile, setup, or home.
const ENTRY_ROUTES = new Set(['setup', 'home', 'welcome']);
const AUTH_ROUTES = new Set(['signup', 'login', 'guest']);

function Screen({ parts, params }: { parts: string[]; params: URLSearchParams }) {
  const [first, second] = parts;
  const profile = loadProfile();
  if (AUTH_ROUTES.has(first)) return <AuthPage mode={first as 'signup' | 'login' | 'guest'} />;
  if (!first || ENTRY_ROUTES.has(first)) {
    if (!profile) return <AuthPage mode="signup" />;
    if (first === 'setup' || !setupComplete(profile)) return <Setup requestedStep={params.get('step')} />;
    return <Home />;
  }
  if (first === 'matches') return <Matches courseId={params.get('course')} />;
  if (first === 'professor' && second) return <ProfessorPage id={Number(second)} />;
  if (first === 'contribute') return <Contribute />;
  if (first === 'privacy') return <Privacy />;
  return <Home />;
}

export function App() {
  const { parts, params } = useHashRoute();
  const current = sectionOf(parts[0]);
  const [ready, setReady] = useState(false);
  useEffect(() => { restoreSession().finally(() => setReady(true)); }, []);
  const user = currentUser();

  async function logOut() {
    await signOut();
    navigate('#/login');
  }
  return (
    <MotionConfig reducedMotion="user">
      <header className="topbar">
        <div className="topbar__inner">
          <a className="brand" href="#/" aria-label={`${PRODUCT_NAME} home`}>
            <ProfileLine values={BRAND_SHAPE} size="glyph" label={PRODUCT_NAME} animate={false} />
            <span className="brand__name">{PRODUCT_NAME}</span>
          </a>
          <nav className="nav" aria-label="Main">
            {NAV.map((item) => (
              <a key={item.href} className="nav__link" href={item.href} aria-current={current === item.section ? 'page' : undefined}>
                {item.label}
              </a>
            ))}
            {user && <button type="button" className="nav__link nav__button" onClick={logOut}>Log out</button>}
          </nav>
        </div>
      </header>
      <main className={READING_PAGES.has(parts[0]) ? 'page' : 'page page--wide'} key={parts.join('/') + params.toString()}>
        {ready ? <Screen parts={parts} params={params} /> : <LoadingState label="Loading your profile" lines={4} />}
      </main>
      <footer className="footer">
        <p>{TAGLINE} {NOT_OFFICIAL}</p>
        <p><a href="#/privacy">How we handle your notes and answers</a></p>
      </footer>
    </MotionConfig>
  );
}
