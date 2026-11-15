import { HORSE_BODY, HORSE_COLUMNS, HORSE_ROWS } from './horseBody';
import { GALLOP_POSES, legCells, type Cell } from './horseLegs';

/** Tiles fill 82% of each cell, leaving the same gap as the original pixel horse. */
const TILE = 0.82;
const INSET = (1 - TILE) / 2;

/** One path for many tiles keeps the SVG to a handful of elements instead of thousands of rects. */
function tilesPath(cells: Cell[]) {
  return cells.map(({ col, row }) => `M${col + INSET} ${row + INSET}h${TILE}v${TILE}h-${TILE}z`).join('');
}

const BODY_PATH = tilesPath(
  HORSE_BODY.flatMap((line, row) => [...line].flatMap((cell, col) => (cell === '#' ? [{ col, row }] : []))),
);
const FRAMES = GALLOP_POSES.map((pose) => {
  const { far, near } = legCells(pose);
  return { far: tilesPath(far), near: tilesPath(near) };
});

/**
 * The cardinal tile horse, galloping: the body is fixed and four leg poses take turns (see the
 * pixel-horse__frame animation). Drawn facing left, like the source image; CSS flips it.
 */
export function PixelHorse() {
  return (
    <svg className="pixel-horse" viewBox={`0 0 ${HORSE_COLUMNS} ${HORSE_ROWS}`} aria-hidden="true" shapeRendering="crispEdges">
      {FRAMES.map((frame, i) => (
        <g key={i} className={`pixel-horse__frame pixel-horse__frame--${i}`}>
          <path className="pixel-horse__far" d={frame.far} />
          <path d={frame.near} />
        </g>
      ))}
      <path d={BODY_PATH} />
    </svg>
  );
}
