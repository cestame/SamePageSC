import { ArrowDown, ArrowRight, ChalkboardTeacher, EyeSlash, FileText, PuzzlePiece, WarningCircle } from '@phosphor-icons/react';
import { PRODUCT_NAME } from '../../../shared/content.js';
import { Button, FitScore } from '../components/ui';
import { ProfileLine } from '../components/ProfileLine';
import { PixelHorse } from '../components/PixelHorse';
import { PixelBird } from '../components/PixelBird';
import { asset } from '../lib/target';

// All copy and figures here come from the team's content brief and survey of 29 USC students
// (November 14 and 15, 2026). The preview uses the fictional sample professor Dr. Maya Reyes and the
// real scoring function's result for the sample student (93).

const EXTENSION_SECTION_ID = 'extension';

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export function Landing() {
  return (
    <div className="landing">
      <Hero />
      <Problem />
      <Quotes />
      <HowItWorks />
      <Preview />
      <ExtensionSection />
      <BothSides />
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
          <Button href="#/home" iconAfter={<ArrowRight size={19} aria-hidden />}>Find my best sections</Button>
          <Button variant="quiet" onClick={() => scrollTo(EXTENSION_SECTION_ID)} icon={<PuzzlePiece size={19} aria-hidden />}>Get the Chrome extension</Button>
        </div>
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
    <section className="landing-section landing-problem" aria-labelledby="problem-title">
      <div className="stack-3">
        <h2 id="problem-title" className="text-display">Two sections of the same course can feel like two different classes.</h2>
        <p className="text-body text-muted landing-measure">
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
        <p className="text-small text-muted">
          From our survey of 29 USC students, freshmen through grad students in more than 20 majors, November 14 and 15, 2026.
          Accuracy was rated from 1 to 5. The average was 3.4.
        </p>
      </div>
    </section>
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
    <section className="landing-section" aria-labelledby="quotes-title">
      <div className="stack-3">
        <h2 id="quotes-title" className="text-display">No professor is right for everyone.</h2>
        <p className="text-body text-muted landing-measure">
          We asked students to describe a teaching style that helped or hurt them. Their answers pull in different directions,
          so one star rating can't tell you which class is right for you.
        </p>
      </div>
      <ul className="quotes plain-list">
        {QUOTES.map((q) => (
          <li key={q.who} className={q.emphasis ? 'quote quote--emphasis' : 'quote'}>
            <blockquote className="quote__text">“{q.text}”</blockquote>
            <p className="quote__who text-small text-muted">{q.who}</p>
          </li>
        ))}
      </ul>
      <p className="text-small text-muted">Answers from our survey, shortened where marked. Professor names were removed.</p>
    </section>
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
    <section className="landing-section" aria-labelledby="how-title">
      <h2 id="how-title" className="text-display">How it works</h2>
      <ol className="steps-list plain-list">
        {STEPS.map((s, i) => (
          <li key={s.title} className="step">
            <span className="step__number" aria-hidden="true">{i + 1}</span>
            <div className="stack-1">
              <h3 className="text-heading">{s.title}</h3>
              <p className="text-small text-muted">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Dr. Reyes's sample profile and what the sample student asked for (the scoring function's targets). */
const REYES = { pace: 2, format: 2, structure: 5, assessment: 3, participation: 2, guidance: 1, workload: 3 };
const SAMPLE_STUDENT = { pace: 1.5, format: 3, structure: 4, assessment: 3, participation: 2, guidance: 1, workload: 3 };

function Preview() {
  return (
    <section className="landing-section" aria-labelledby="preview-title">
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
    </section>
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
    <section className="landing-section landing-extension" id={EXTENSION_SECTION_ID} aria-labelledby="extension-title">
      <div className="stack-4">
        <h2 id="extension-title" className="text-display">Same Page works where you register.</h2>
        <p className="text-body text-muted landing-measure">
          The Chrome extension reads the class list you already have open in USC Web Registration and puts a fit badge under
          each section. Tap one to see the match and its downside in Chrome's side panel.
        </p>
        <ol className="install plain-list">
          {INSTALL_STEPS.map((s, i) => (
            <li key={s} className="install__step"><span className="step__number" aria-hidden="true">{i + 1}</span><span className="text-small">{s}</span></li>
          ))}
        </ol>
        <div className="landing-hero__actions">
          <Button href={asset('same-page-extension.zip')} icon={<ArrowDown size={19} aria-hidden />}>Download the extension</Button>
          <Button variant="quiet" href="/demo/webreg" iconAfter={<ArrowRight size={19} aria-hidden />}>Try it on the demo class list</Button>
        </div>
      </div>
      <BadgeIllustration />
    </section>
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
    <section className="landing-section" aria-labelledby="sides-title">
      <h2 id="sides-title" className="text-display">Good for both sides of the room.</h2>
      <div className="sides">
        <div className="stack-2">
          <h3 className="text-title">For students</h3>
          <p className="text-body text-muted">Pick sections that suit how you learn, with reasons you can check against real notes instead of star ratings.</p>
          <div><Button variant="quiet" href="#/home" iconAfter={<ArrowRight size={18} aria-hidden />}>Find my best sections</Button></div>
        </div>
        <div className="stack-2">
          <h3 className="text-title">For professors</h3>
          <p className="text-body text-muted">See how students describe your class, add your own response, and reach the students your teaching style suits best.</p>
          <div><Button variant="quiet" href="#/contribute" iconAfter={<ArrowRight size={18} aria-hidden />}>Add notes from a class</Button></div>
        </div>
      </div>
      <ul className="privacy-points plain-list">
        <li className="privacy-list__item"><FileText className="privacy-list__icon" size={22} aria-hidden /><span className="text-small"><b>Text notes only.</b> We never record classes. Students share typed notes and syllabi.</span></li>
        <li className="privacy-list__item"><EyeSlash className="privacy-list__icon" size={22} aria-hidden /><span className="text-small"><b>Names come out first.</b> Student names and personal details are removed before anything is saved.</span></li>
        <li className="privacy-list__item"><ChalkboardTeacher className="privacy-list__icon" size={22} aria-hidden /><span className="text-small"><b>About the class, not the person.</b> Profiles describe how a class runs. Comments about a professor's personality or looks are dropped.</span></li>
      </ul>
    </section>
  );
}
