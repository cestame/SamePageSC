import { MotionGlobalConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { asset } from "@/engine/asset";
import { easeSamePage } from "@/engine/motion";

/**
 * The tile horse and bird from the Same Page SC intro: the horse gallops in and stops, then the bird flies in
 * and lands on its back. Timing and proportions follow the team's horse animation kit: poses change every
 * 120ms, the bird is 13/83 of the horse's width, and it sits at 39/83 across and 12/59 down the horse.
 */

const FRAME_MS = 120;
const GALLOP_POSES = 4;
const HORSE_SECONDS = 2.8;
const BIRD_DELAY_SECONDS = 1.6;
const BIRD_SECONDS = 2;

const GRID = { horseWidth: 83, horseHeight: 59, birdWidth: 13, birdHeight: 9, seatX: 39, seatY: 12 };

const sprite = (name: string) => asset(`/sprites/${name}.svg`);

function isStill(prefersReducedMotion: boolean | null) {
  return prefersReducedMotion === true || MotionGlobalConfig.skipAnimations === true;
}

/** Counts animation frames from mount until `stopAfterMs`, so sprites can swap poses on the brand's 120ms beat. */
function useFrame(stopAfterMs: number, still: boolean) {
  const [frame, setFrame] = useState(0);
  const [running, setRunning] = useState(!still);
  useEffect(() => {
    if (still) return;
    const ticker = window.setInterval(() => setFrame((current) => current + 1), FRAME_MS);
    const stopper = window.setTimeout(() => {
      window.clearInterval(ticker);
      setRunning(false);
    }, stopAfterMs);
    return () => {
      window.clearInterval(ticker);
      window.clearTimeout(stopper);
    };
  }, [stopAfterMs, still]);
  return { frame, running: running && !still };
}

function birdSprite(flying: boolean, frame: number) {
  if (!flying) return "bird-seated";
  return frame % 2 === 0 ? "bird-flying-wings-up" : "bird-flying-wings-down";
}

const ALT = "A cardinal tile horse gallops across while a yellow tile bird flies in and lands on its back.";

export function HorseIntro({ width, startX }: { width: number; startX: number }) {
  const still = isStill(useReducedMotion());
  const horse = useFrame(HORSE_SECONDS * 1000, still);
  const bird = useFrame((BIRD_DELAY_SECONDS + BIRD_SECONDS) * 1000, still);
  const height = (width * GRID.horseHeight) / GRID.horseWidth;
  const birdWidth = (width * GRID.birdWidth) / GRID.horseWidth;
  const seat = { x: (width * GRID.seatX) / GRID.horseWidth, y: (height * GRID.seatY) / GRID.horseHeight };
  const horsePose = horse.running ? (horse.frame % GALLOP_POSES) + 1 : 1;

  return (
    <div role="img" aria-label={ALT} className="relative shrink-0" style={{ width, height }}>
      <motion.div
        className="absolute inset-0"
        initial={still ? false : { x: startX, scale: 0.94 }}
        animate={{
          x: 0,
          scale: [0.94, 1.02, 1],
          transition: {
            x: { duration: HORSE_SECONDS, ease: easeSamePage },
            scale: { duration: HORSE_SECONDS, ease: easeSamePage, times: [0, 0.82, 1] },
          },
        }}
      >
        <img src={sprite(`horse-gallop-${horsePose}`)} alt="" className="block size-full" />
      </motion.div>
      <motion.div
        className="absolute"
        style={{ left: seat.x, top: seat.y, width: birdWidth }}
        initial={still ? false : { x: -width * 0.9, y: -height * 0.9, opacity: 0 }}
        animate={{
          x: [-width * 0.9, -width * 0.35, 0],
          y: [-height * 0.9, -height * 0.75, 0],
          opacity: [0, 1, 1],
          transition: { duration: BIRD_SECONDS, delay: BIRD_DELAY_SECONDS, ease: easeSamePage, times: [0, 0.5, 1] },
        }}
      >
        <img src={sprite(birdSprite(bird.running, bird.frame))} alt="" className="block w-full" />
      </motion.div>
    </div>
  );
}
