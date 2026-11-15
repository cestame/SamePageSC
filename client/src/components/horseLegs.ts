// The horse's four legs in four gallop poses, drawn as tiles on the same grid as the body (83 x 59 cells,
// facing left, so "forward" is toward column 0). Each leg is a top joint, a knee and a hoof; the tiles
// are filled along those two segments with a thickness that tapers from thigh to hoof.

type Point = readonly [number, number];
type Leg = { knee: Point; hoof: Point };
type Pose = { frontNear: Leg; frontFar: Leg; hindNear: Leg; hindFar: Leg };

const TOPS = {
  frontNear: [17, 34],
  frontFar: [21, 34],
  hindNear: [51, 35],
  hindFar: [56, 35],
} as const satisfies Record<keyof Pose, Point>;

/**
 * The cycle, in order: stretched out in the air, hind legs land, front legs land, legs gathered under
 * the body. Hooves on the ground sit on row 57.
 */
export const GALLOP_POSES: readonly Pose[] = [
  {
    frontNear: { knee: [9, 41], hoof: [2, 46] },
    frontFar: { knee: [14, 45], hoof: [8, 54] },
    hindNear: { knee: [58, 44], hoof: [70, 51] },
    hindFar: { knee: [61, 42], hoof: [74, 47] },
  },
  {
    frontNear: { knee: [11, 42], hoof: [7, 50] },
    frontFar: { knee: [15, 44], hoof: [12, 52] },
    hindNear: { knee: [50, 46], hoof: [46, 57] },
    hindFar: { knee: [57, 45], hoof: [61, 56] },
  },
  {
    frontNear: { knee: [17, 46], hoof: [17, 57] },
    frontFar: { knee: [22, 45], hoof: [27, 55] },
    hindNear: { knee: [58, 44], hoof: [65, 51] },
    hindFar: { knee: [55, 45], hoof: [57, 54] },
  },
  {
    frontNear: { knee: [13, 43], hoof: [19, 49] },
    frontFar: { knee: [17, 44], hoof: [23, 50] },
    hindNear: { knee: [46, 44], hoof: [39, 51] },
    hindFar: { knee: [50, 45], hoof: [43, 52] },
  },
];

const THIGH_RADIUS = 3;
const KNEE_RADIUS = 1.5;
const HOOF_RADIUS = 1.1;

/** Every cell whose centre lies within the tapering radius of the segment from a to b. */
function strokeCells(a: Point, b: Point, radiusA: number, radiusB: number, cells: Set<string>) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const steps = Math.max(1, Math.ceil(length * 4));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = a[0] + (b[0] - a[0]) * t;
    const y = a[1] + (b[1] - a[1]) * t;
    const r = radiusA + (radiusB - radiusA) * t;
    for (let col = Math.floor(x - r); col <= Math.ceil(x + r); col++) {
      for (let row = Math.floor(y - r); row <= Math.ceil(y + r); row++) {
        if (Math.hypot(col + 0.5 - x, row + 0.5 - y) <= r) cells.add(`${col},${row}`);
      }
    }
  }
}

export type Cell = { col: number; row: number };

/** The leg tiles for one pose, split into the far side (drawn darker, behind) and the near side. */
export function legCells(pose: Pose): { far: Cell[]; near: Cell[] } {
  const side = (names: (keyof Pose)[]) => {
    const cells = new Set<string>();
    for (const name of names) {
      const top = TOPS[name];
      const { knee, hoof } = pose[name];
      strokeCells(top, knee, THIGH_RADIUS, KNEE_RADIUS, cells);
      strokeCells(knee, hoof, KNEE_RADIUS, HOOF_RADIUS, cells);
    }
    return [...cells].map((key) => {
      const [col, row] = key.split(',').map(Number);
      return { col, row };
    });
  };
  return { far: side(['frontFar', 'hindFar']), near: side(['frontNear', 'hindNear']) };
}
