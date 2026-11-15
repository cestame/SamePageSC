import { useEffect, useRef } from 'react';
import { PRODUCT_LINE, PRODUCT_NAME } from '../../../shared/content.js';

const SEEN_KEY = 'same-page-intro-seen';

/** True once this browser has watched or skipped the intro, so returning students land on the form. */
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
    /* storage unavailable: the intro plays again next visit */
  }
}

/** The timeline in milliseconds. Pages turn like a book: the horse page, then the wordmark page. */
const T = {
  horseStart: 300,
  horseEnd: 4300,
  flightStart: 700,
  flightEnd: 2700,
  firstTurnStart: 3900,
  firstTurnEnd: 5100,
  logoStart: 4700,
  logoEnd: 5400,
  secondTurnStart: 6500,
  secondTurnEnd: 7600,
} as const;

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
  firstTurn: number;
  secondTurn: number;
  logo: number;
  done: boolean;
};

/** Where everything is at `t` ms. Horse position is in vw; turns and flight run from 0 to 1. */
function introFrame(t: number): Frame {
  const flight = between(t, T.flightStart, T.flightEnd);
  const logo = between(t, T.logoStart, T.logoEnd);
  return {
    horseX: -50 + between(t, T.horseStart, T.horseEnd) * 160,
    flight,
    landed: flight >= 1,
    firstTurn: easeInOut(between(t, T.firstTurnStart, T.firstTurnEnd)),
    secondTurn: easeInOut(between(t, T.secondTurnStart, T.secondTurnEnd)),
    logo: logo * (2 - logo),
    done: t >= T.secondTurnEnd,
  };
}

/** A page lifted from its left edge. Shade is strongest halfway, when the page stands upright. */
function turnPage(page: HTMLElement, turn: number) {
  page.style.transform = `rotateY(${-180 * turn}deg)`;
  page.style.setProperty('--shade', String(Math.sin(turn * Math.PI)));
  page.style.visibility = turn >= 1 ? 'hidden' : 'visible';
}

/*
 * The bird is drawn on the same tile grid as the horse image: square tiles at 82% of the cell with a gap
 * between them. Each map is 13 cells wide, facing right. "#" is a tile, anything else is empty.
 */
const BIRD_BODY = [
  '.............',
  '........###..',
  '.......##.##.',
  '#.....######.',
  '##..#######..',
  '.##########..',
  '..########...',
];
const BIRD_BEAK = ['', '', '............#'];
const BIRD_WING_UP = ['....##.......', '....###......', '.....##......', '.....#.......'];
const BIRD_WING_DOWN = ['', '', '', '', '', '', '', '....###......', '.....##......'];
const BIRD_WING_FOLDED = ['', '', '', '', '.....####....', '......###....'];
const BIRD_FEET = ['', '', '', '', '', '', '', '.....#.#.....'];

const TILE = 0.82;

function Tiles({ map, className }: { map: string[]; className: string }) {
  const tiles = map.flatMap((row, y) => [...row].map((cell, x) => (cell === '#' ? { x, y } : null)).filter((t) => t !== null));
  return (
    <g className={className}>
      {tiles.map(({ x, y }) => (
        <rect key={`${x}-${y}`} x={x + (1 - TILE) / 2} y={y + (1 - TILE) / 2} width={TILE} height={TILE} />
      ))}
    </g>
  );
}

function PixelBird({ seated = false }: { seated?: boolean }) {
  return (
    <svg className={seated ? 'pixel-bird pixel-bird--seated' : 'pixel-bird'} viewBox="0 0 13 9" aria-hidden="true">
      <Tiles map={BIRD_BODY} className="pixel-bird__body" />
      <Tiles map={BIRD_BEAK} className="pixel-bird__beak" />
      {seated ? (
        <>
          <Tiles map={BIRD_WING_FOLDED} className="pixel-bird__wing-folded" />
          <Tiles map={BIRD_FEET} className="pixel-bird__feet" />
        </>
      ) : (
        <>
          <Tiles map={BIRD_WING_UP} className="pixel-bird__wing pixel-bird__wing--up" />
          <Tiles map={BIRD_WING_DOWN} className="pixel-bird__wing pixel-bird__wing--down" />
        </>
      )}
    </svg>
  );
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
  turnPage(refs.cover, f.firstTurn);
  turnPage(refs.logoPage, f.secondTurn);
  refs.logoPage.style.setProperty('--cast', String(Math.sin(f.firstTurn * Math.PI)));
  refs.logo.style.opacity = String(f.logo);
  refs.logo.style.transform = `translate3d(0, ${(1 - f.logo) * 32}px, 0)`;
}

/**
 * The opening on the sign-up page. It plays by itself (about 7.6 seconds): a pixel horse gallops across,
 * a bird lands on its back, then the page turns to the wordmark and that page turns to the sign-up form.
 * "Skip" or Escape jumps to the last page turn. The caller leaves it out when reduced motion is on.
 */
export function IntroSequence({ onDone }: { onDone: () => void }) {
  const coverRef = useRef<HTMLDivElement>(null);
  const logoPageRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const horseRef = useRef<HTMLDivElement>(null);
  const birdRef = useRef<HTMLDivElement>(null);
  const seatRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<() => void>(() => {});
  const doneRef = useRef(onDone);
  useEffect(() => { doneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    const [cover, logoPage, logo, horse, bird, seat] = [coverRef, logoPageRef, logoRef, horseRef, birdRef, seatRef].map((r) => r.current);
    if (!cover || !logoPage || !logo || !horse || !bird || !seat) return;
    const refs: Refs = { cover, logoPage, logo, horse, bird, seat };
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    let start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const f = introFrame(now - start);
      paint(refs, f);
      if (f.done) {
        markIntroSeen();
        doneRef.current();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    skipRef.current = () => {
      const elapsed = performance.now() - start;
      if (elapsed < T.secondTurnStart) start = performance.now() - T.secondTurnStart;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skipRef.current();
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKey);
      root.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="intro" aria-label={`${PRODUCT_NAME} opening animation`} role="region">
      <div className="intro__page intro__page--logo" ref={logoPageRef}>
        <div className="intro__face intro__face--front">
          <div className="intro__logo-block" ref={logoRef}>
            <img className="intro__logo" src="/same-page-logo.png" alt={PRODUCT_NAME} width={573} height={173} />
            <p className="intro__line">{PRODUCT_LINE}</p>
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
          <div className="intro-horse" ref={horseRef}>
            <div className="intro-horse__body">
              <img src="/pixel-horse.png" alt="" width={876} height={623} />
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

      <button type="button" className="intro__skip" onClick={() => skipRef.current()}>Skip to sign up</button>
      <p className="visually-hidden">
        A cardinal pixel horse gallops across while a yellow bird lands on its back. The page turns to the {PRODUCT_NAME} wordmark, then turns again to the sign-up form.
      </p>
    </div>
  );
}
