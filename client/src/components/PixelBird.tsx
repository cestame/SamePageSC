// The tile bird from the intro, on the same grid as the tile horse. Seated, it faces right with its wing folded.

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

export function PixelBird({ seated = false }: { seated?: boolean }) {
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

