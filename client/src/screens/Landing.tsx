import { useEffect, useState, type ReactNode } from 'react';
import { Armchair, ArrowDown, ArrowRight, ChalkboardTeacher, EyeSlash, FileText, PuzzlePiece, WarningCircle } from '@phosphor-icons/react';
import { PRODUCT_NAME } from '../../../shared/content.js';
import { Button, FitScore } from '../components/ui';
import { ProfileLine } from '../components/ProfileLine';
import { PixelHorse } from '../components/PixelHorse';
import { PixelBird } from '../components/PixelBird';
import { API_ORIGIN, asset } from '../lib/target';

// All copy and figures here come from the team's content brief and survey of 29 USC students
// (November 14 and 15, 2026). The preview uses the fictional sample professor Dr. Maya Reyes and the
// real scoring function's result for the sample student (93).

export const EXTENSION_SECTION_ID = 'extension';

const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/**
 * Each section is a full-width band with its own ground, so the parts of the story read as separate.
 * `paper` is the page, `ink` the dark navy band, `sunk` a light gray, `cream` the brand cream used only
 * for the extension, the part of the project the page leads to.
 */
type Tone = 'paper' | 'ink' | 'sunk' | 'cream';

const SECTIONS: { id: string; tone: Tone }[] = [
  { id: 'problem', tone: 'paper' },
  { id: 'voices', tone: 'ink' },
  { id: 'how', tone: 'sunk' },
  { id: 'preview', tone: 'paper' },
  { id: 'try-class', tone: 'ink' },
  { id: EXTENSION_SECTION_ID, tone: 'cream' },
  { id: 'both-sides', tone: 'sunk' },
];

/**
 * Which section is in the middle of the screen, so the guide bird can sit beside it. A section counts
 * once it crosses a thin band 40% of the way down the viewport.
 */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

const SECTION_IDS = SECTIONS.map((s) => s.id);

export function Landing({ focusSection }: { focusSection?: string | null }) {
  const active = useActiveSection(SECTION_IDS);
  useEffect(() => {
    if (focusSection) scrollToId(focusSection);
  }, [focusSection]);

  const band = (id: string, labelledBy: string, children: ReactNode) => {
    const tone = SECTIONS.find((s) => s.id === id)?.tone ?? 'paper';
    return (
      <section id={id} className={`band band--${tone}`} aria-labelledby={labelledBy}>
        <GuideNode active={active === id} />
        <div className="band__inner">{children}</div>
      </section>
    );
  };

  return (
    <div className="landing">
      <Hero />
      {band('problem', 'problem-title', <Problem />)}
      {band('voices', 'quotes-title', <Quotes />)}
      {band('how', 'how-title', <HowItWorks />)}
      {band('preview', 'preview-title', <Preview />)}
      {band('try-class', 'try-class-title', <TryThisClass />)}
      {band(EXTENSION_SECTION_ID, 'extension-title', <ExtensionSection />)}
      {band('both-sides', 'sides-title', <BothSides />)}
    </div>
  );
}

/** A tile on the dotted guide line; the bird hops onto the tile of the section being read. */
function GuideNode({ active }: { active: boolean }) {
  return (
    <div className={active ? 'guide-node guide-node--active' : 'guide-node'} aria-hidden="true">
      <span className="guide-node__tile" />
      {active && <span className="guide-node__bird"><PixelBird seated /></span>}
    </div>
  );
}

function Hero() {
  return (
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-hero__words">
        <img className="landing-hero__logo" src={asset('same-page-logo.png')} alt={PRODUCT_NAME} width={573} height={173} />
        <h1 id="landing-title" className="landing-hero__title">Know how a class is really taught before you enroll, from notes taken by the students who sat in it.</h1>
        <div className="landing-hero__actions">
          <Button className="button--large" onClick={() => scrollToId(EXTENSION_SECTION_ID)} icon={<PuzzlePiece size={22} aria-hidden />}>
            Get the Chrome extension
          </Button>
          <Button variant="quiet" href="#/home" iconAfter={<ArrowRight size={19} aria-hidden />}>Try it in your browser</Button>
        </div>
        <button type="button" className="landing-hero__next" onClick={() => scrollToId('problem')}>
          <ArrowDown size={18} aria-hidden />
          <span>Why we built it</span>
        </button>
      </div>
      <div className="landing-hero__horse" aria-hidden="true">
        <div className="intro-horse__body">
          <PixelHorse />
          <div className="intro-horse__seat landing-hero__seat">
            <PixelBird seated />
          </div>
        </div>
      </div>
    </section>
  );
}

const STATS = [
  { value: 66, text: 'of students we surveyed use Rate My Professors to choose a class' },
  { value: 76, text: 'say a professor\'s rating matters when they pick, scoring it 4 or 5 out of 5' },
  { value: 45, text: 'said their class matched the ratings only somewhat or worse, 3 or lower out of 5', punchline: true },
];

function Problem() {
  return (
    <div className="landing-problem">
      <div className="stack-3">
        <h2 id="problem-title" className="text-display">Two sections of the same course can feel like two different classes.</h2>
        <p className="text-body band__muted landing-measure">
          Rate My Professors tells you whether people liked someone. It doesn't tell you how the class runs: how fast it moves,
          how tightly it's organized, or how you get graded.
        </p>
      </div>
      <div className="stack-4">
        <dl className="stats">
          {STATS.map((s) => (
            <div key={s.value} className={s.punchline ? 'stat stat--punchline' : 'stat'}>
              <dt className="stat__value">{s.value}<span className="stat__unit">%</span></dt>
              <dd className="stat__text">{s.text}</dd>
            </div>
          ))}
        </dl>
        <p className="text-small band__muted">
          From our survey of 29 USC students, freshmen through grad students in more than 20 majors, November 14 and 15, 2026.
          Accuracy was rated from 1 to 5. The average was 3.4.
        </p>
      </div>
    </div>
  );
}

const QUOTES = [
  { text: 'Strict teaching styles really do not work for me, I don\'t learn well when being harshly judged.', who: 'Senior, Design' },
  { text: 'I appreciate organized professors who come into class each day with a clear vision…', who: 'Sophomore, Biological Sciences' },
  { text: 'My professor does interactive and group work every class instead of just reading off slides…', who: 'Sophomore, Psychology' },
  { text: 'He was very open to questions, and that made me feel very comfortable.', who: 'Freshman, Physics' },
  { text: 'There was some difference between how they actually teach and grade…', who: 'Freshman, Business Administration', emphasis: true },
  { text: 'I prefer professors who connect lessons to real world things around us…', who: 'Junior, Engineering Mechanics' },
];

function Quotes() {
  return (
    <div className="stack-5">
      <div className="stack-3">
        <h2 id="quotes-title" className="text-display">No professor is right for everyone.</h2>
        <p className="text-body band__muted landing-measure">
          We asked students to describe a teaching style that helped or hurt them. Their answers pull in different directions,
          so one star rating can't tell you which class is right for you.
        </p>
      </div>
      <ul className="quotes plain-list">
        {QUOTES.map((q) => (
          <li key={q.who} className={q.emphasis ? 'quote quote--emphasis' : 'quote'}>
            <blockquote className="quote__text">“{q.text}”</blockquote>
            <p className="quote__who text-small">{q.who}</p>
          </li>
        ))}
      </ul>
      <p className="text-small band__muted">Answers from our survey, shortened where marked. Professor names were removed.</p>
    </div>
  );
}

const STEPS = [
  { title: 'Tell us how you learn.', text: 'Eight quick questions about pace, structure and how you like to be graded. There\'s no "visual learner" quiz, because the research doesn\'t back it.' },
  { title: 'See every section ranked.', text: 'Each section gets a fit score built from notes that students took in that exact class.' },
  { title: 'Know why, and what to watch for.', text: 'Every match explains the fit in plain words and names one honest downside.' },
  { title: 'Pass it on.', text: 'After the semester, add your notes so the next Trojan picks well too.' },
];

function HowItWorks() {
  return (
    <div className="stack-5">
      <h2 id="how-title" className="text-display">How it works</h2>
      <ol className="steps-list plain-list">
        {STEPS.map((s, i) => (
          <li key={s.title} className="step">
            <span className="step__number" aria-hidden="true">{i + 1}</span>
            <div className="stack-1">
              <h3 className="text-heading">{s.title}</h3>
              <p className="text-small band__muted">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Dr. Reyes's sample profile and what the sample student asked for (the scoring function's targets). */
const REYES = { pace: 2, format: 2, structure: 5, assessment: 3, participation: 2, guidance: 1, workload: 3 };
const SAMPLE_STUDENT = { pace: 1.5, format: 3, structure: 4, assessment: 3, participation: 2, guidance: 1, workload: 3 };

function Preview() {
  return (
    <div className="stack-5">
      <h2 id="preview-title" className="text-display">This is what being on the same page looks like.</h2>
      <article className="card card--emphasis preview">
        <div className="preview__head">
          <div className="stack-1">
            <p className="text-title">CSCI 103 with Dr. Maya Reyes</p>
            <p className="text-small text-muted">Mondays and Wednesdays, 10:00 to 11:50 am</p>
          </div>
          <FitScore score={93} caption="fit out of 100, from pace, structure, grading and 4 more" />
        </div>
        <div className="preview__body">
          <div className="stack-3">
            <ProfileLine values={REYES} target={SAMPLE_STUDENT} label="Dr. Maya Reyes, a fictional sample professor" />
            <div className="legend" aria-hidden="true">
              <span className="legend__item"><svg className="legend__swatch" viewBox="0 0 22 10"><line x1="1" x2="21" y1="5" y2="5" className="profile-line__target" /></svg>You</span>
              <span className="legend__item"><svg className="legend__swatch" viewBox="0 0 22 10"><line x1="1" x2="21" y1="5" y2="5" className="profile-line__line" strokeWidth="2.5" /></svg>Dr. Reyes</span>
              <span className="legend__item"><span className="legend__swatch legend__swatch--gap" />Where you differ</span>
            </div>
          </div>
          <div className="stack-4">
            <div className="stack-1">
              <h3 className="text-heading">Why it fits</h3>
              <p className="text-body">You're new to coding and want step-by-step guidance. Reyes works through every example live before you try one, at a pace that leaves room for questions.</p>
            </div>
            <div className="watch-out">
              <WarningCircle className="watch-out__icon" size={20} weight="bold" aria-hidden />
              <div className="stack-1">
                <h3 className="text-heading">Watch out for</h3>
                <p className="text-body">Her syllabus is strict and every deadline is fixed, which is a bit more structure than you asked for. Class is mostly lecture, with little discussion.</p>
              </div>
            </div>
            <p className="text-small text-muted">Sample data. Dr. Reyes is a fictional professor.</p>
          </div>
        </div>
      </article>
    </div>
  );
}

/** The 3D lecture hall served from client/public/try-this-class. The extension opens it from each webReg section too. */
const TRY_CLASS_URL = `${API_ORIGIN}/try-this-class/`;
const REYES_PROFILE_PARAM = Object.values(REYES).join(',');
const TRY_REYES_URL = `${TRY_CLASS_URL}?course=CSCI%20103&section=29901&name=Dr.%20Maya%20Reyes&profile=${REYES_PROFILE_PARAM}`;

function TryThisClass() {
  return (
    <div className="landing-try">
      <div className="stack-4">
        <h2 id="try-class-title" className="text-display">Sit in on a class before you register.</h2>
        <p className="text-body band__muted landing-measure">
          Pick any seat in a 3D lecture hall modeled on GFS 106 and watch a short sample lesson. You can switch between two
          teaching styles, jump to moments like a student's question or a worked example, and hear the professor out loud.
        </p>
        <div className="landing-hero__actions">
          <Button className="button--large" href={TRY_CLASS_URL} icon={<Armchair size={22} aria-hidden />}>Sit in on a sample class</Button>
          <Button variant="quiet" href={TRY_REYES_URL} iconAfter={<ArrowRight size={19} aria-hidden />}>Try it as Dr. Reyes's CSCI 103 section</Button>
        </div>
      </div>
      <figure className="try-preview">
        <a href={TRY_CLASS_URL} className="try-preview__link">
          <img
            src={asset('try-this-class/preview.jpg')}
            alt="The simulated lecture hall from the back: rows of students facing a professor beside a slide on eigenvalues, with a caption of what the professor is saying."
            width={1220}
            height={936}
            loading="lazy"
          />
        </a>
        <figcaption className="text-small band__muted">Prof. A and Prof. B are fictional, the voices are synthetic and every number in the room is simulated.</figcaption>
      </figure>
    </div>
  );
}

const INSTALL_STEPS = [
  'Download the extension and unzip it.',
  'Open chrome://extensions and turn on Developer mode, top right.',
  'Click Load unpacked and pick the unzipped same-page-extension folder.',
  'Open your class list in USC Web Registration. A fit badge appears under every section.',
];

function ExtensionSection() {
  return (
    <div className="landing-extension">
      <div className="stack-4">
        <h2 id="extension-title" className="text-display">Same Page works where you register.</h2>
        <p className="text-body band__muted landing-measure">
          The Chrome extension reads the class list you already have open in USC Web Registration and puts a fit badge under
          each section. Tap one to see the match and its downside in Chrome's side panel.
        </p>
        <ol className="install plain-list">
          {INSTALL_STEPS.map((s, i) => (
            <li key={s} className="install__step"><span className="step__number" aria-hidden="true">{i + 1}</span><span className="text-small">{s}</span></li>
          ))}
        </ol>
        <div className="landing-hero__actions">
          <Button className="button--large" href={asset('same-page-extension.zip')} icon={<ArrowDown size={22} aria-hidden />}>Download the extension</Button>
          <Button variant="quiet" href="/demo/webreg" iconAfter={<ArrowRight size={19} aria-hidden />}>Try it on the demo class list</Button>
        </div>
      </div>
      <BadgeIllustration />
    </div>
  );
}

/** A drawn example of a class row with the extension's badge under it. Not a copy of USC's page. */
function BadgeIllustration() {
  return (
    <figure className="badge-demo" aria-label="Example: a CSCI 103 section row with a Same Page badge under it reading 93% teaching fit with Dr. Maya Reyes">
      <div className="badge-demo__row" aria-hidden="true">
        <span><b>29901 R</b></span><span>Lecture</span><span>10:00am-11:50am</span><span>MW</span><span>Reyes, Maya</span>
      </div>
      <div className="badge-demo__badge" aria-hidden="true">
        <ProfileLine values={REYES} size="glyph" label="Dr. Maya Reyes" animate={false} />
        <span><b>93%</b> <span className="text-muted">teaching fit with Dr. Maya Reyes</span></span>
      </div>
      <figcaption className="text-small text-muted">Example badge, with a fictional sample professor.</figcaption>
    </figure>
  );
}

function BothSides() {
  return (
    <div className="stack-5">
      <h2 id="sides-title" className="text-display">Good for both sides of the room.</h2>
      <div className="sides">
        <div className="stack-2">
          <span className="sides__mascot sides__mascot--bird" aria-hidden="true"><PixelBird seated /></span>
          <h3 className="text-title">For students</h3>
          <p className="text-body band__muted">Pick sections that suit how you learn, with reasons you can check against real notes instead of star ratings.</p>
          <div><Button variant="quiet" href="#/home" iconAfter={<ArrowRight size={18} aria-hidden />}>Find my best sections</Button></div>
        </div>
        <div className="stack-2">
          <span className="sides__mascot sides__mascot--horse" aria-hidden="true"><PixelHorse /></span>
          <h3 className="text-title">For professors</h3>
          <p className="text-body band__muted">See how students describe your class, add your own response, and reach the students your teaching style suits best.</p>
          <div><Button variant="quiet" href="#/contribute" iconAfter={<ArrowRight size={18} aria-hidden />}>Add notes from a class</Button></div>
        </div>
      </div>
      <ul className="privacy-points plain-list">
        <li className="privacy-list__item"><FileText className="privacy-list__icon" size={22} aria-hidden /><span className="text-small"><b>Text notes only.</b> We never record classes. Students share typed notes and syllabi.</span></li>
        <li className="privacy-list__item"><EyeSlash className="privacy-list__icon" size={22} aria-hidden /><span className="text-small"><b>Names come out first.</b> Student names and personal details are removed before anything is saved.</span></li>
        <li className="privacy-list__item"><ChalkboardTeacher className="privacy-list__icon" size={22} aria-hidden /><span className="text-small"><b>About the class, not the person.</b> Profiles describe how a class runs. Comments about a professor's personality or looks are dropped.</span></li>
      </ul>
    </div>
  );
}
