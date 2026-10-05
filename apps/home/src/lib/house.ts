/**
 * The house as a description (Home.md H2, H6): typed data from which three.js builds every wall, slab and opening
 * (`lib/build.ts`). Feet throughout (H7). Plan coordinates are the page's, as the wireframes are read — x across to
 * the right, y down the page — and a level is a height above the model's ground. Walls are dimensioned by their
 * centre line, as plans are. Nothing here draws; the functions at the end read a description for the builder.
 */

export type Ft = number;
/** A point on the plan: across, then down the page. */
export type Pt = readonly [Ft, Ft];
/** A point in the house: across, its level, down the page. */
export type At = readonly [Ft, Ft, Ft];

export type MaterialId = string;
/**
 * A surface's name and its one flat colour (H5): the model is exact and plain, and realism is the image models' job.
 * Two ids are spoken for: a door leaf is painted `door`, a window's frame `frame`.
 */
export type Material = { id: MaterialId; label: string; colour: string };

/** A door: one leaf hinged at the jamb nearer the wall's start, or two meeting in the middle; `slides` runs along the wall instead. */
export type Door = { kind: "door"; id: string; at: Ft; width: Ft; height: Ft; leaves?: 1 | 2; slides?: boolean };
export type Window = { kind: "window"; id: string; at: Ft; width: Ft; height: Ft; sill: Ft };
/** An opening in a wall, `at` its distance along the wall from `from` to the opening's centre. */
export type Opening = Door | Window;

/** A wall by its centre line, standing on `base`, `height` tall. */
export type Wall = {
  id: string;
  from: Pt;
  to: Pt;
  thickness: Ft;
  base: Ft;
  height: Ft;
  material: MaterialId;
  openings?: readonly Opening[];
};

/** A pillar at a point of the plan: its section across and down the page. */
export type Pillar = { id: string; at: Pt; size: readonly [Ft, Ft]; base: Ft; height: Ft; material: MaterialId };

/** A slab by its outline on the plan and any holes through it, its top at `top`. */
export type Slab = {
  id: string;
  outline: readonly Pt[];
  holes?: readonly (readonly Pt[])[];
  top: Ft;
  thickness: Ft;
  material: MaterialId;
};

/** A box on the plan — a counter, a landing: two opposite corners, its foot and its height. */
export type Block = { id: string; corners: readonly [Pt, Pt]; base: Ft; height: Ft; material: MaterialId };

/**
 * A dog-leg stair in a well: two flights side by side along the well, the first climbing `climbs` from the well's
 * near end, a half-landing across the far end, the second coming back to arrive at `to`. The near end's strip, a
 * landing deep, is left for the floor it arrives at.
 */
export type Stair = {
  id: string;
  well: readonly [Pt, Pt];
  from: Ft;
  to: Ft;
  climbs: "+x" | "-x" | "+y" | "-y";
  flight: Ft;
  landing: Ft;
  /** The most a riser may be; the count derives. */
  riser: Ft;
  material: MaterialId;
};

/**
 * A straight flight of separate treads on two stringers, a handrail each side — a metal stair (H7, version 2).
 * It stands at `foot` and climbs `climbs`, `run` along the plan from `from` up to `to`, the last riser landing on
 * the floor it reaches; a tread is `tread` deep, so one may overhang the step under it; `rail` is the handrail's
 * height over the treads, 0 for none.
 */
export type Flight = {
  id: string;
  foot: Pt;
  climbs: "+x" | "-x" | "+y" | "-y";
  from: Ft;
  to: Ft;
  width: Ft;
  run: Ft;
  riser: Ft;
  tread: Ft;
  rail: Ft;
  material: MaterialId;
};

/** A railing along a line on the plan: posts, a top rail and a middle one, standing on `base`. */
export type Railing = { id: string; from: Pt; to: Pt; base: Ft; height: Ft; material: MaterialId };

/** A camera (H5, H9): standing at `from`, looking at `to`, seeing `fov` degrees top to bottom — 42 when unsaid. */
export type Look = { from: At; to: At; fov?: number };
/**
 * A named camera (H5): the plan, from straight above with everything from `cut` up taken off; or a look from one
 * point at another, with the same cut if it wants one.
 */
export type View =
  | { id: string; label: string; kind: "plan"; cut: Ft }
  | ({ id: string; label: string; kind: "look"; cut?: Ft } & Look);

export type House = {
  name: string;
  version: number;
  units: "ft";
  materials: readonly Material[];
  pillars: readonly Pillar[];
  walls: readonly Wall[];
  slabs: readonly Slab[];
  blocks: readonly Block[];
  stairs: readonly Stair[];
  flights: readonly Flight[];
  railings: readonly Railing[];
  views: readonly View[];
};

/** A plan direction as a unit vector across and down the page. */
export const DIRECTION: Record<Flight["climbs"], Pt> = { "+x": [1, 0], "-x": [-1, 0], "+y": [0, 1], "-y": [0, -1] };

// ── reading a description ────────────────────────────────────────────────────────────────────────────────────

/** Where a door stands on the plan: its centre, the wall's direction along it and the wall's normal, `null` for no such door. */
export function doorPlace(house: House, id: string): { at: Pt; along: Pt; normal: Pt; door: Door } | null {
  for (const wall of house.walls) {
    const door = wall.openings?.find((opening): opening is Door => opening.kind === "door" && opening.id === id);
    if (!door) continue;
    const length = wallLength(wall);
    const ux = (wall.to[0] - wall.from[0]) / length;
    const uy = (wall.to[1] - wall.from[1]) / length;
    return { at: [wall.from[0] + ux * door.at, wall.from[1] + uy * door.at], along: [ux, uy], normal: [-uy, ux], door };
  }
  return null;
}

export function wallLength(wall: Pick<Wall, "from" | "to">): Ft {
  return Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]);
}

/** A solid stretch of a wall: from `s0` to `s1` along it, standing on `base`, `height` tall. */
export type Piece = { s0: Ft; s1: Ft; base: Ft; height: Ft };

/** The solid of a wall round its openings: the stretches between them, the lintels over them, the walls under sills. */
export function wallPieces(wall: Wall): Piece[] {
  const length = wallLength(wall);
  const top = wall.base + wall.height;
  const pieces: Piece[] = [];
  const solid = (s0: Ft, s1: Ft, base = wall.base, height = top - base) => {
    if (s1 - s0 > 1e-6 && height > 1e-6) pieces.push({ s0, s1, base, height });
  };
  let cursor = 0;
  for (const opening of [...(wall.openings ?? [])].sort((a, b) => a.at - b.at)) {
    const s0 = Math.max(cursor, opening.at - opening.width / 2);
    const s1 = Math.min(length, opening.at + opening.width / 2);
    solid(cursor, s0);
    const foot = wall.base + (opening.kind === "window" ? opening.sill : 0);
    solid(s0, s1, wall.base, foot - wall.base);
    solid(s0, s1, foot + opening.height, top - (foot + opening.height));
    cursor = s1;
  }
  solid(cursor, length);
  return pieces;
}

/** The steps of a stair's two flights and its half-landing, as blocks to build. */
export function stairParts(stair: Stair): Block[] {
  const [[x0, y0], [x1, y1]] = stair.well;
  const alongY = stair.climbs.endsWith("y");
  const [a0, a1] = alongY ? [y0, y1] : [x0, x1];
  const [c0, c1] = alongY ? [x0, x1] : [y0, y1];
  // `dir` runs from the well's near end, where the first flight starts, to its far end.
  const dir = stair.climbs.startsWith("+") ? 1 : -1;
  const near = dir > 0 ? a0 : a1;
  const far = dir > 0 ? a1 : a0;
  const run = Math.abs(a1 - a0) - 2 * stair.landing;
  const rise = stair.to - stair.from;
  const risers = Math.max(2, Math.ceil(rise / stair.riser));
  const first = Math.ceil(risers / 2);
  const r = rise / risers;
  const blocks: Block[] = [];
  const side = (which: 0 | 1): readonly [Ft, Ft] => (which === 0 ? [c0, c0 + stair.flight] : [c1 - stair.flight, c1]);
  const box = (id: string, along: readonly [Ft, Ft], across: readonly [Ft, Ft], base: Ft, height: Ft): Block => {
    const lo = Math.min(...along);
    const hi = Math.max(...along);
    return {
      id,
      corners: alongY ? [[across[0], lo], [across[1], hi]] : [[lo, across[0]], [hi, across[1]]],
      base,
      height,
      material: stair.material,
    };
  };
  // A step is a box the riser and a little more tall, so the flight's underside steps down with it.
  const flight = (which: 0 | 1, count: number, start: Ft, level: Ft, toward: 1 | -1) => {
    const treads = Math.max(1, count - 1);
    const depth = run / treads;
    for (let i = 0; i < treads; i++) {
      const top = level + (i + 1) * r;
      blocks.push(box(`${stair.id}-${which}-${i}`, [start + toward * i * depth, start + toward * (i + 1) * depth], side(which), top - r - 0.5, r + 0.5));
    }
  };
  flight(0, first, near + dir * stair.landing, stair.from, dir);
  const half = stair.from + first * r;
  blocks.push(box(`${stair.id}-landing`, [far, far - dir * stair.landing], [c0, c1], half - 0.5, 0.5));
  flight(1, risers - first, far - dir * stair.landing, half, dir > 0 ? -1 : 1);
  return blocks;
}

/**
 * The house's extent on the plan — what stands: walls, pillars, blocks and stairs, not the slabs, since the ground the
 * model stands on is a slab wider than the house — and the model's top, for framing.
 */
export function houseBounds(house: House): { min: Pt; max: Pt; top: Ft } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, top = 0;
  const point = ([x, y]: Pt) => {
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  };
  for (const slab of house.slabs) top = Math.max(top, slab.top);
  for (const wall of house.walls) { point(wall.from); point(wall.to); top = Math.max(top, wall.base + wall.height); }
  for (const pillar of house.pillars) { point(pillar.at); top = Math.max(top, pillar.base + pillar.height); }
  for (const block of house.blocks) { block.corners.forEach(point); top = Math.max(top, block.base + block.height); }
  for (const stair of house.stairs) { stair.well.forEach(point); top = Math.max(top, stair.to); }
  for (const flight of house.flights) {
    const [ux, uy] = DIRECTION[flight.climbs];
    point(flight.foot);
    point([flight.foot[0] + ux * flight.run, flight.foot[1] + uy * flight.run]);
    top = Math.max(top, flight.to + flight.rail);
  }
  for (const railing of house.railings) { point(railing.from); point(railing.to); top = Math.max(top, railing.base + railing.height); }
  return { min: [minX, minY], max: [maxX, maxY], top };
}
