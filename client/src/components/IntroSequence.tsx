import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { PRODUCT_LINE, PRODUCT_NAME } from '../../../shared/content.js';
import { PixelHorse } from './PixelHorse';
import { PixelBird } from './PixelBird';
import { asset } from '../lib/target';

/** The timeline in milliseconds: the horse page plays, turns like a book page, and the wordmark page waits. */
const T = {
  horseStart: 300,
  horseEnd: 4300,
  flightStart: 700,
  flightEnd: 2700,
  turnStart: 3900,
  turnEnd: 5100,
  logoStart: 4700,
  logoEnd: 5400,
} as const;

/** How long the overlay takes to fade away once the student enters. */
const CLOSE_MS = 320;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function between(t: number, start: number, end: number) {
  return clamp((t - start) / (end - start));
}

function easeInOut(p: number) {
  return p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
}

type Frame = {
  horseX: number;
  flight: number;
  landed: boolean;
  turn: number;
  logo: number;
  settled: boolean;
};

/** Where everything is at `t` ms. Horse position is in vw; the turn and flight run from 0 to 1. */
function introFrame(t: number): Frame {
  const flight = between(t, T.flightStart, T.flightEnd);
  const logo = between(t, T.logoStart, T.logoEnd);
  return {
    horseX: -50 + between(t, T.horseStart, T.horseEnd) * 160,
    flight,
    landed: flight >= 1,
    turn: easeInOut(between(t, T.turnStart, T.turnEnd)),
    logo: logo * (2 - logo),
    settled: t >= Math.max(T.turnEnd, T.logoEnd),
  };
}

/** A page lifted from its left edge. Shade is strongest halfway, when the page stands upright. */
function turnPage(page: HTMLElement, turn: number) {
  page.style.transform = `rotateY(${-180 * turn}deg)`;
  page.style.setProperty('--shade', String(Math.sin(turn * Math.PI)));
  page.style.visibility = turn >= 1 ? 'hidden' : 'visible';
}

/** The flying bird's path: in from the top right, arcing up, ending exactly on the seat. Returns px. */
function birdPosition(flight: number, page: DOMRect, seat: DOMRect) {
  const startX = page.width * 1.08;
  const startY = page.height * 0.18;
  const endX = seat.left - page.left;
  const endY = seat.top - page.top;
  return {
    x: startX + (endX - startX) * flight,
    y: startY + (endY - startY) * flight - Math.sin(flight * Math.PI) * page.height * 0.2,
  };
}

type Refs = {
  cover: HTMLDivElement;
  logoPage: HTMLDivElement;
  logo: HTMLDivElement;
  horse: HTMLDivElement;
  bird: HTMLDivElement;
  seat: HTMLDivElement;
};

function paint(refs: Refs, f: Frame) {
  refs.horse.style.transform = `translate3d(${f.horseX}vw, 0, 0)`;
  refs.horse.classList.toggle('intro-horse--carrying', f.landed);
  refs.bird.style.visibility = f.landed ? 'hidden' : 'visible';
  if (!f.landed) {
    const { x, y } = birdPosition(f.flight, refs.cover.getBoundingClientRect(), refs.seat.getBoundingClientRect());
    refs.bird.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }
  turnPage(refs.cover, f.turn);
  refs.logoPage.style.setProperty('--cast', String(Math.sin(f.turn * Math.PI)));
  refs.logo.style.opacity = String(f.logo);
  refs.logo.style.transform = `translate3d(0, ${(1 - f.logo) * 32}px, 0)`;
  // Hidden (and out of the tab order) until it has started to appear.
  refs.logo.style.visibility = f.logo > 0 ? 'visible' : 'hidden';
}

/**
 * The opening of the landing page. A pixel horse gallops across, a bird lands on its back, then the page
 * turns like a book page to the wordmark, which waits with a button that brings the student into the site.
 * "Skip intro" or Escape goes straight in. Reduced-motion users get a still cover with an enter button.
 */
export function IntroSequence({ onDone, reducedMotion }: { onDone: () => void; reducedMotion: boolean }) {
  const coverRef = useRef<HTMLDivElement>(null);
  const logoPageRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const horseRef = useRef<HTMLDivElement>(null);
  const birdRef = useRef<HTMLDivElement>(null);
  const seatRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef(onDone);
  const [closing, setClosing] = useState(false);
  useEffect(() => { doneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    const [cover, logoPage, logo, horse, bird, seat] = [coverRef, logoPageRef, logoRef, horseRef, birdRef, seatRef].map((r) => r.current);
    if (!cover || !logoPage || !logo || !horse || !bird || !seat) return;
    const refs: Refs = { cover, logoPage, logo, horse, bird, seat };
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    if (reducedMotion) {
      skipRef.current?.focus({ preventScroll: true });
      return () => { root.style.overflow = previousOverflow; };
    }

    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const f = introFrame(now - start);
      paint(refs, f);
      if (f.settled) {
        enterRef.current?.focus({ preventScroll: true });
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      root.style.overflow = previousOverflow;
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => doneRef.current(), reducedMotion ? 0 : CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [closing, reducedMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setClosing(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const enter = () => setClosing(true);

  const introClass = ['intro', reducedMotion && 'intro--reduced-motion', closing && 'intro--closing'].filter(Boolean).join(' ');

  return (
    <div className={introClass} aria-label={`${PRODUCT_NAME} opening ${reducedMotion ? 'screen' : 'animation'}`} role="region">
      <div className="intro__page intro__page--logo" ref={logoPageRef}>
        <div className="intro__face intro__face--front">
          <div className="intro__logo-block" ref={logoRef}>
            <img className="intro__logo" src={asset('same-page-logo.png')} alt={PRODUCT_NAME} width={573} height={173} />
            <p className="intro__line">{PRODUCT_LINE}</p>
            <button type="button" className="button intro__enter" ref={enterRef} onClick={enter}>
              <span>Enter {PRODUCT_NAME}</span>
              <ArrowRight size={19} aria-hidden />
            </button>
          </div>
        </div>
        <div className="intro__face intro__face--back" />
      </div>

      <div className="intro__page intro__page--cover" ref={coverRef}>
        <div className="intro__face intro__face--front">
          <div className="intro__title">
            <p className="intro__kicker">Every class feels different.</p>
            <p className="intro__headline">Find the one that fits.</p>
          </div>
          <div className="intro__ground" aria-hidden="true" />
          <div className={reducedMotion ? 'intro-horse intro-horse--carrying' : 'intro-horse'} ref={horseRef}>
            <div className="intro-horse__body">
              <PixelHorse />
              <div className="intro-horse__seat" ref={seatRef}>
                <PixelBird seated />
              </div>
            </div>
          </div>
          <div className="intro-bird" ref={birdRef}>
            <PixelBird />
          </div>
        </div>
        <div className="intro__face intro__face--back" />
      </div>

      <button type="button" className="intro__skip" ref={skipRef} onClick={enter}>
        {reducedMotion ? `Enter ${PRODUCT_NAME}` : 'Skip intro'}
      </button>
      <p className="visually-hidden">
        {reducedMotion
          ? `A still cardinal pixel horse carries a yellow bird. Enter ${PRODUCT_NAME} to continue.`
          : `A cardinal pixel horse gallops across while a yellow bird lands on its back. The page turns to the ${PRODUCT_NAME} wordmark, with a button to enter the site.`}
      </p>
    </div>
  );
}
