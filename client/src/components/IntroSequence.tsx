import { useEffect, useRef } from 'react';
import { ArrowDown, ArrowRight } from '@phosphor-icons/react';
import { PRODUCT_LINE, PRODUCT_NAME } from '../../../shared/content.js';

const SEEN_KEY = 'same-page-intro-seen';

/** True once this browser has scrolled through or skipped the intro, so returning students land on the form. */
export function introSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markIntroSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* storage unavailable: the intro shows again next visit */
  }
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

type Frame = {
  horseX: number;
  horseRunning: boolean;
  birdX: number;
  birdY: number;
  birdLanded: boolean;
  coverY: number;
  revealOpacity: number;
  revealY: number;
};

/**
 * Where everything sits for a scroll progress from 0 to 1. The horse gallops across over the first 62%
 * (about one full screen of scrolling, so it reads as a walk-by, not a blur), the bird flies in and lands
 * on its back, then the cover slides up to show the wordmark.
 * Horizontal values are in vw, vertical bird values in svh, the reveal offset in px.
 */
function introFrame(progress: number): Frame {
  const horseProgress = clamp((progress - 0.04) / 0.58);
  const horseX = -50 + horseProgress * 155;
  const flight = clamp((progress - 0.04) / 0.3);
  const birdLanded = flight >= 1;
  const reveal = clamp((progress - 0.58) / 0.3);
  const revealEase = reveal * (2 - reveal);
  return {
    horseX,
    horseRunning: horseProgress < 1,
    birdX: birdLanded ? horseX + 20 : 108 + flight * (horseX - 88),
    birdY: birdLanded ? 48 : 20 + flight * 28 - Math.sin(flight * Math.PI) * 27,
    birdLanded,
    coverY: -smoothstep(clamp((progress - 0.62) / 0.33)) * 102,
    revealOpacity: revealEase,
    revealY: (1 - revealEase) * 48,
  };
}

function PixelBird() {
  return (
    <svg className="pixel-bird" viewBox="0 0 14 10" aria-hidden="true">
      <g className="pixel-bird__wing">
        <path d="M5 4V1h1v1h1v1h1v2H6V4z" />
      </g>
      <path d="M2 5V4h2V3h4v1h2v1h3v1h-3v2H8v1H5V8H3V7H1V6h1z" />
      <path className="pixel-bird__beak" d="M1 5H0v1h2V5z" />
      <rect className="pixel-bird__eye" x="4" y="4" width="1" height="1" />
      <path className="pixel-bird__feet" d="M6 8h1v2H6zM8 8h1v2H8z" />
    </svg>
  );
}

/**
 * The scroll-driven opening on the sign-up page. It is skippable, shown once per browser, and the
 * caller leaves it out entirely when the student has reduced motion turned on.
 */
export function IntroSequence({ targetId }: { targetId: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const horseRef = useRef<HTMLDivElement>(null);
  const birdRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const reveal = revealRef.current;
    const cover = coverRef.current;
    const horse = horseRef.current;
    const bird = birdRef.current;
    if (!section || !reveal || !cover || !horse || !bird) return;
    let pending = 0;

    const update = () => {
      pending = 0;
      const bounds = section.getBoundingClientRect();
      const progress = clamp(-bounds.top / Math.max(1, bounds.height - window.innerHeight));
      const f = introFrame(progress);
      reveal.style.opacity = String(f.revealOpacity);
      reveal.style.transform = `translate3d(0, ${f.revealY}px, 0)`;
      cover.style.transform = `translate3d(0, ${f.coverY}svh, 0)`;
      horse.style.transform = `translate3d(${f.horseX}vw, 0, 0)`;
      horse.classList.toggle('intro-horse--running', f.horseRunning);
      bird.style.transform = `translate3d(${f.birdX}vw, ${f.birdY}svh, 0)`;
      bird.classList.toggle('intro-bird--landed', f.birdLanded);
      if (progress >= 0.98) markIntroSeen();
    };
    const requestUpdate = () => {
      if (!pending) pending = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    return () => {
      window.cancelAnimationFrame(pending);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, []);

  function goToForm() {
    markIntroSeen();
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section className="intro" ref={sectionRef} aria-label={`${PRODUCT_NAME} opening animation`}>
      <div className="intro__sticky">
        <div className="intro__reveal" ref={revealRef}>
          <img className="intro__logo" src="/same-page-logo.png" alt={PRODUCT_NAME} width={573} height={173} />
          <p className="intro__line">{PRODUCT_LINE}</p>
          <button type="button" className="button intro__enter" onClick={goToForm}>
            <span>Go to sign up</span>
            <ArrowRight size={19} aria-hidden />
          </button>
        </div>

        <div className="intro__cover" ref={coverRef}>
          <div className="intro__title">
            <p className="intro__kicker">Every class feels different.</p>
            <p className="intro__headline">Find the one that fits.</p>
          </div>
          <button type="button" className="intro__skip" onClick={goToForm}>Skip to sign up</button>
          <div className="intro__ground" aria-hidden="true" />
          <p className="intro__cue" aria-hidden="true">
            <ArrowDown size={18} />
            Scroll to open the page
          </p>
          <div className="intro-horse intro-horse--running" ref={horseRef}>
            <img src="/pixel-horse.png" alt="" width={876} height={623} />
          </div>
          <div className="intro-bird" ref={birdRef}>
            <PixelBird />
          </div>
        </div>
        <p className="visually-hidden">
          A cardinal pixel horse gallops across while a yellow bird lands on its back, and the cover slides up to show the {PRODUCT_NAME} wordmark.
        </p>
      </div>
    </section>
  );
}
