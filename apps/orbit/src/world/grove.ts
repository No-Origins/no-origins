import { groundOf, onGround } from "./area";
import { isGrove, metresOf, roomOf, sectorOf, solidsOf, type GroveAsset, type Room, type Solid, type WorldData } from "./hierarchy";

/**
 * A grove's trees (World.md W89, T1, W91, W93, W96 and W97; his: "density of the trees", "give me dimensions to set",
 * "Trunk will have min and max lenth - from 1m to 100m", "I should be able to place trees any surface"): drawn from the grove's
 * numbers, its area and what stands under it every time any of them changes, never kept. Nothing here is three.js.
 *
 * *Mine, how:* they stand evenly but never in rows, one a cell of a lattice anchored to the grove's own middle, each
 * cell's tree moved off its middle by the grove's seed, so a grove moved carries its trees with it whole, and one sized
 * or hollowed keeps the trees it still holds where they stood, gaining or losing some only where it changed; a new
 * Spacing is a new lattice (W97), and a new seed another scatter. A tree stands on the area's ground alone, inside its
 * outline and outside its hollow, inside its sector, on any surface (W96: a block's top, a mountain, a pipe, a road,
 * else its sector's floor), the ground of the open space at the height the grove was planted at (W99, `footAt`). Each stands at its own height between the grove's
 * shortest and tallest, and leans its own way; its flower's colour is drawn from the grove's colours by its seed (W92,
 * `treeOf`).
 */

/** A surface crossing a column of the world (W99): its height, in metres, and whether it faces up (a top) or down (an underside). */
export type Crossing = { y: number; up: boolean };

/** Where surfaces cross the column over a point of the floor, in no order (W96, W99). */
export type ColumnAt = (x: number, z: number) => readonly Crossing[];

/** Where the blocks cross each column, turned or not (W96, W99): each its top and its underside, met as a box. */
export function blockColumnAt(solids: readonly Solid[]): ColumnAt {
  return (x, z) => {
    const crossings: Crossing[] = [];
    for (const { centre, half, axes } of solids) {
      // The heights at which the column is inside the box: between each pair of its faces, on all three of its axes.
      let low = -Infinity;
      let high = Infinity;
      for (let i = 0; i < 3 && low <= high; i++) {
        const axis = axes[i];
        const off = (x - centre[0]) * axis[0] - centre[1] * axis[1] + (z - centre[2]) * axis[2];
        if (Math.abs(axis[1]) < 1e-9) {
          if (Math.abs(off) > half[i]) low = Infinity;
          continue;
        }
        const a = (-half[i] - off) / axis[1];
        const b = (half[i] - off) / axis[1];
        low = Math.max(low, Math.min(a, b));
        high = Math.min(high, Math.max(a, b));
      }
      if (low <= high) crossings.push({ y: high, up: true }, { y: low, up: false });
    }
    return crossings;
  };
}

/** Both columns' crossings (W96): the blocks' beside the drawn surfaces'. */
export const bothOf = (one: ColumnAt, other: ColumnAt): ColumnAt => (x, z) => [...one(x, z), ...other(x, z)];

/** How far over the height it was planted at a column is looked at (mine): over the surface it was planted on, never in it. */
const OVER = 0.05;

/**
 * Where something placed at a height in a sector's room stands in a column (W99): on the ground of the open space at
 * that height, the highest top under it, else the room's floor; or, where something stands in the way at that height,
 * on that thing's top (the nearest surface over the height faces up: it is inside). None where that top is over the
 * room's top. Nothing over open air is climbed, so a block over the grove is not where its trees stand.
 */
export function footAt(column: ColumnAt, room: Room, x: number, z: number, height: number): number | null {
  const at = height + OVER;
  const crossings = column(x, z);
  let over: Crossing | null = null;
  for (const crossing of crossings) if (crossing.y > at && (!over || crossing.y < over.y)) over = crossing;
  if (over?.up) return over.y <= room.max[1] + 1e-6 ? over.y : null;
  let ground = room.min[1];
  for (const crossing of crossings) if (crossing.up && crossing.y <= at && crossing.y > ground) ground = crossing.y;
  return ground;
}

/**
 * A grove's area's outline and its hollow's, a point every `step` metres or less, each where a tree there would stand,
 * from the grove's height (W96, W99).
 */
export function drapedLines(lines: readonly (readonly [number, number])[][], column: ColumnAt, room: Room, height: number, step = 1): [number, number, number][][] {
  return lines.map((line) => {
    const draped: [number, number, number][] = [];
    const lay = (x: number, z: number) => draped.push([x, z, footAt(column, room, x, z, height) ?? height]);
    line.forEach(([x, z], index) => {
      if (index === 0) return lay(x, z);
      const [px, pz] = line[index - 1];
      const pieces = Math.max(1, Math.ceil(Math.hypot(x - px, z - pz) / step));
      for (let piece = 1; piece <= pieces; piece++) lay(px + ((x - px) * piece) / pieces, pz + ((z - pz) * piece) / pieces);
    });
    return draped;
  });
}

/** A tree of a grove where it stands in the world, in metres: its foot, its seed, the way it leans and its height. */
export type GroveTree = { x: number; y: number; z: number; seed: number; turn: number; height: number };

/**
 * The most trees one grove draws (mine): past it, the lattice widens until it holds no more, so a large area at a close
 * Spacing is thinned rather than slowing the world (W85: 120 alliums cost about 5 ms a frame).
 */
export const GROVE_MOST = 500;

/** How far apart a grove's trees stand: its Spacing (W97), or wider where its area would hold more than `GROVE_MOST`. */
export const cellOf = (grove: Pick<GroveAsset, "area" | "spacing">): number => Math.max(grove.spacing, Math.sqrt(groundOf(grove.area) / GROVE_MOST));

/** Five numbers from 0 to 1 for a cell of the lattice and a seed: the same cell and seed, the same five. */
function drawsOf(i: number, j: number, seed: number): number[] {
  let h = (Math.imul(i, 0x27d4eb2d) ^ Math.imul(j, 0x165667b1) ^ Math.imul(seed + 1, 0x9e3779b1)) >>> 0;
  const next = () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return [next(), next(), next(), next(), next()];
}

/** How far a cell's tree may stand off the cell's middle, a share of the cell either way: never in rows, never touching the next cell's (mine). */
const JITTER = 0.8;
/** How far a trunk stands clear of the area's edge and its hollow's (mine): half a metre, so none stands on a line. */
const CLEAR = 0.5;

/** A tree of a grove's area, wherever the grove stands: how far off its middle, in metres, and its five draws. */
type AreaTree = { x: number; z: number; lean: number; tall: number };

/**
 * The trees a grove's area holds, wherever it stands and whatever stands under it (W89, W91, W97): its lattice's, on its
 * ground alone, off its middle. How many the next grove will hold, on its card, is these counted.
 */
export function areaTrees(grove: Pick<GroveAsset, "area" | "spacing" | "seed">): AreaTree[] {
  const cell = cellOf(grove);
  const half = [grove.area.size[0] / 2, grove.area.size[1] / 2];
  const trees: AreaTree[] = [];
  for (let i = Math.floor(-half[0] / cell) - 1; i <= Math.ceil(half[0] / cell); i++) {
    for (let j = Math.floor(-half[1] / cell) - 1; j <= Math.ceil(half[1] / cell); j++) {
      const [u, v, lean, , tall] = drawsOf(i, j, grove.seed);
      const x = (i + 0.5 + (u - 0.5) * JITTER) * cell;
      const z = (j + 0.5 + (v - 0.5) * JITTER) * cell;
      if (onGround([0, 0], grove.area, x, z, CLEAR)) trees.push({ x, z, lean, tall });
    }
  }
  return trees;
}

/**
 * Every tree of a grove where it stands in the world (W89, W91, W96, W99), each on the ground of the open space at the
 * grove's height in its column: the blocks' alone unless the engine says what else is drawn there (mountains, pipes,
 * roads).
 */
export function groveTrees(world: WorldData, grove: GroveAsset, column: ColumnAt = blockColumnAt(solidsOf(world))): GroveTree[] {
  const sector = sectorOf(world, grove.sector);
  const [sx, sy, sz] = metresOf(sector.at);
  const room = roomOf(sector);
  const [gx, gz] = grove.at;
  const trees: GroveTree[] = [];
  for (const { x: dx, z: dz, lean, tall } of areaTrees(grove)) {
    const x = gx + dx;
    const z = gz + dz;
    // Inside its sector alone (W82), as everything placed is.
    if (Math.abs(x) > sector.size[0] / 2 || Math.abs(z) > sector.size[1] / 2) continue;
    // On the ground of the open space at the grove's height (W99); none where that is over the sector's top.
    const y = footAt(column, room, sx + x, sz + z, sy + grove.y);
    if (y === null) continue;
    trees.push({
      x: sx + x,
      y,
      z: sz + z,
      seed: Math.floor(tall * 10000),
      turn: lean * 360,
      height: Math.round(grove.heightFrom + tall * (grove.heightTo - grove.heightFrom)),
    });
  }
  return trees;
}

/**
 * A sector's groves that hold no trees (W97): too small for their Spacing, or with none of their trees inside the
 * sector. None of them can be clicked to pick it; the Sector's actions clear them.
 */
export const emptyGroves = (world: WorldData, sector: string): GroveAsset[] =>
  world.assets.filter((asset): asset is GroveAsset => isGrove(asset) && asset.sector === sector && groveTrees(world, asset).length === 0);
