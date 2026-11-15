import { useEffect, useState } from 'react';
import { MotionConfig, useReducedMotion } from 'motion/react';
import { NOT_OFFICIAL, PRODUCT_NAME } from '../../shared/content.js';
import { useHashRoute } from './lib/hooks';
import { AuthPage } from './screens/AuthPage';
import { Setup } from './screens/Setup';
import { Home } from './screens/Home';
import { currentUser, loadProfile, restoreSession, setupComplete, signOut } from './lib/storage';
import { navigate } from './lib/hooks';
import { LoadingState } from './components/ui';
import { IntroSequence } from './components/IntroSequence';
import { IS_EXTENSION, asset, followExtensionRoutes } from './lib/target';
import { Matches } from './screens/Matches';
import { ProfessorPage } from './screens/ProfessorPage';
import { Contribute } from './screens/Contribute';
import { Privacy } from './screens/Privacy';
import { EXTENSION_SECTION_ID, Landing } from './screens/Landing';
import { PuzzlePiece } from '@phosphor-icons/react';

const NAV = [
  { href: '#/home', label: 'My schedule', section: 'home' },
  { href: '#/contribute', label: 'Add notes', section: 'contribute' },
  { href: '#/privacy', label: 'Privacy', section: 'privacy' },
];

function sectionOf(first: string | undefined) {
  if (first === 'contribute') return 'contribute';
  if (first === 'privacy') return 'privacy';
  if (!first && !IS_EXTENSION) return 'landing';
  return 'home';
}

// Reading pages stay at a comfortable line length; the planner and match pages use the full width.
const READING_PAGES = new Set(['contribute', 'privacy']);
// Routes that show whichever step the student is on: create profile, setup, or home.
const ENTRY_ROUTES = new Set(['setup', 'home', 'welcome', 'app']);
const AUTH_ROUTES = new Set(['signup', 'login', 'guest']);

/** The website's root is the landing page. The extension's side panel has no landing page: its root is the app. */
const isLanding = (first: string | undefined) => !first && !IS_EXTENSION;

function Screen({ parts, params }: { parts: string[]; params: URLSearchParams }) {
  const [first, second] = parts;
  const profile = loadProfile();
  if (isLanding(first)) return <Landing focusSection={params.get('section')} />;
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

function Wordmark({ decorative = false }: { decorative?: boolean }) {
  return <img className="wordmark" src={asset('same-page-logo.png')} alt={decorative ? '' : PRODUCT_NAME} width={573} height={173} />;
}

export function App() {
  const { parts, params } = useHashRoute();
  const current = sectionOf(parts[0]);
  const [ready, setReady] = useState(false);
  // The intro plays on every load of the landing page and closes itself when it finishes or is skipped.
  // Only a visit that starts on the landing page plays the intro; moving around the site never replays it.
  const [introPending, setIntroPending] = useState(() => isLanding(parts[0]));
  const reduceMotion = useReducedMotion();
  useEffect(() => { restoreSession().finally(() => setReady(true)); }, []);
  useEffect(() => followExtensionRoutes(navigate), []);
  const user = currentUser();
  // The side panel never shows the landing page, so it never plays the intro.
  const showIntro = introPending && !reduceMotion && isLanding(parts[0]);

  async function logOut() {
    await signOut();
    navigate('#/login');
  }
  return (
    <MotionConfig reducedMotion="user">
      {showIntro && <IntroSequence onDone={() => setIntroPending(false)} />}
      <header className="topbar">
        <div className="topbar__inner">
          <a className="brand" href="#/" aria-label={`${PRODUCT_NAME} home`}>
            <Wordmark />
          </a>
          <nav className="nav" aria-label="Main">
            {NAV.map((item) => (
              <a key={item.href} className="nav__link" href={item.href} aria-current={current === item.section ? 'page' : undefined}>
                {item.label}
              </a>
            ))}
            {user && <button type="button" className="nav__link nav__button" onClick={logOut}>Log out</button>}
            {!IS_EXTENSION && <GetExtensionLink onLanding={isLanding(parts[0])} />}
          </nav>
        </div>
      </header>
      <main className={READING_PAGES.has(parts[0]) ? 'page' : 'page page--wide'} key={parts.join('/') + params.toString()}>
        {ready ? <Screen parts={parts} params={params} /> : <LoadingState label="Loading your profile" lines={4} />}
      </main>
      <footer className="footer">
        <div className="footer__inner">
          <Wordmark decorative />
          <p>{NOT_OFFICIAL}</p>
          <a href="#/privacy">How we handle your notes and answers</a>
        </div>
      </footer>
    </MotionConfig>
  );
}

/** The extension is the main way to use Same Page SC, so the top bar always links to how to get it. */
function GetExtensionLink({ onLanding }: { onLanding: boolean }) {
  function go() {
    if (onLanding) document.getElementById(EXTENSION_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else navigate(`#/?section=${EXTENSION_SECTION_ID}`);
  }
  return (
    <button type="button" className="nav__cta" onClick={go}>
      <PuzzlePiece size={18} aria-hidden />
      <span>Get the extension</span>
    </button>
  );
}
