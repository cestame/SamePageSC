import { MotionConfig } from 'motion/react';
import { NOT_OFFICIAL, PRODUCT_NAME, TAGLINE } from '../../shared/content.js';
import { ProfileLine } from './components/ProfileLine';
import { useHashRoute } from './lib/hooks';
import { CoursePicker } from './screens/CoursePicker';
import { Intake } from './screens/Intake';
import { Matches } from './screens/Matches';
import { ProfessorPage } from './screens/ProfessorPage';
import { Contribute } from './screens/Contribute';
import { Privacy } from './screens/Privacy';

const BRAND_SHAPE = { pace: 2, format: 1, structure: 5, assessment: 3, participation: 1, guidance: 2, workload: 4 };

const NAV = [
  { href: '#/', label: 'Match', section: 'match' },
  { href: '#/contribute', label: 'Add notes', section: 'contribute' },
  { href: '#/privacy', label: 'Privacy', section: 'privacy' },
];

function sectionOf(first: string | undefined) {
  if (first === 'contribute') return 'contribute';
  if (first === 'privacy') return 'privacy';
  return 'match';
}

function Screen({ parts, params }: { parts: string[]; params: URLSearchParams }) {
  const [first, second] = parts;
  if (first === 'intake') return <Intake courseId={params.get('course')} />;
  if (first === 'matches') return <Matches courseId={params.get('course')} />;
  if (first === 'professor' && second) return <ProfessorPage id={Number(second)} />;
  if (first === 'contribute') return <Contribute />;
  if (first === 'privacy') return <Privacy />;
  return <CoursePicker />;
}

export function App() {
  const { parts, params } = useHashRoute();
  const current = sectionOf(parts[0]);
  return (
    <MotionConfig reducedMotion="user">
      <header className="topbar">
        <div className="topbar__inner">
          <a className="brand" href="#/">
            <ProfileLine values={BRAND_SHAPE} size="glyph" label={PRODUCT_NAME} animate={false} />
            {PRODUCT_NAME}
          </a>
          <nav className="nav" aria-label="Main">
            {NAV.map((item) => (
              <a key={item.href} className="nav__link" href={item.href} aria-current={current === item.section ? 'page' : undefined}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="page" key={parts.join('/') + params.toString()}>
        <Screen parts={parts} params={params} />
      </main>
      <footer className="footer">
        <p>{TAGLINE} {NOT_OFFICIAL}</p>
        <p><a href="#/privacy">How we handle your notes and answers</a></p>
      </footer>
    </MotionConfig>
  );
}
