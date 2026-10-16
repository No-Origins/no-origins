/**
 * The Orbit: an open cylinder a kilometre across and a kilometre high (World.md W29, W33, W42), centred at x/z 0 and
 * standing on y 0, its ceiling the clouds, and the blocks' sizes. The
 * lattice version 4 of the sector builds on, a block's own size and colour in a zone of the hierarchy, is
 * `hierarchy.ts`; the lattice below, a block of one size at `[column, row, level]` round the start, is the frozen
 * versions'.
 */
/** The world's square's side, in metres (his: "a 1000 m × 1000 m plane", W23): the start's width and breadth, and the frozen versions' square. */
export const PLANE_SIZE = 1000;

/**
 * The world's size, in metres (W42): a cylinder (his: "Instead of cuboid shaped world, lets make it cylindrical"), its
 * diameter across the floor, centred on the middle, and its height up from its floor, y 0. Every camera and everything
 * built stays inside it; its top is the clouds' underside (W33), and cloud walls conceal everything beyond its round side (W43).
 */
export type WorldSize = { readonly diameter: number; readonly height: number };

/** The world's size, fixed (his, W33: "It should be 1000m length, width and height"): a kilometre across and high. */
export const WORLD_SIZE: WorldSize = { diameter: 1000, height: 1000 };

/** The box the frozen World versions 1 to 3 were: its width west to east (x), its breadth north to south (z), its height. */
export type BoxSize = { readonly width: number; readonly breadth: number; readonly height: number };

/** Where the frozen World versions 1 and 2 started, and version 3's fixed size: the kilometre cube. */
export const WORLD_SIZE_START: BoxSize = { width: 1000, breadth: 1000, height: 1000 };

/**
 * What World version 2, frozen, let each size be: 500 m at a time each way (his: "The steps should increase with 500m
 * only"), from 500 m; across and along to 4000 m, up to 2000 m (mine).
 */
export const WORLD_SIZE_RANGE: Record<keyof BoxSize, { min: number; max: number; step: number }> = {
  width: { min: 500, max: 4000, step: 500 },
  breadth: { min: 500, max: 4000, step: 500 },
  height: { min: 500, max: 2000, step: 500 },
};

/** A box's size on a lattice, in metres: across (x), along (z) and up (y). */
export type Unit = { readonly width: number; readonly length: number; readonly height: number };

/**
 * The environment's blocks, in metres (his: "10m width x 10m length and 5m height", then "reduce the block height from
 * 5m to 1 meter"), from before a block was 1 × 1 × 0.3 m (`SECTOR_BLOCK`; World.md W4, Open: what these become).
 */
export const BLOCK: Unit = { width: 10, length: 10, height: 1 };

/**
 * A block, in metres (his, World.md W4: "Each block will be 1m x 1m x 0.3m"): the sector's versions 2 and 3, frozen.
 */
export const SECTOR_BLOCK: Unit = { width: 1, length: 1, height: 0.3 };

/**
 * The default block, in metres (his, World.md W4: "Lets make the height 0.3 to 0.25"): the lattice's step each way, a
 * level its height. A block is 1 to 10 of it each way (`hierarchy.ts`).
 */
export const BASE_BLOCK: Unit = { width: 1, length: 1, height: 0.25 };

/**
 * A box on a lattice, a block or a zone: its column (across, x), its row (along, z) and its level (up, y), in steps of
 * its unit, round the start.
 */
export type Block = readonly [column: number, row: number, level: number];

type Vec = readonly [number, number, number];

/** Camera margin inside the world's sides and top, in metres. */
export const INSIDE = 0.5;

/** A box's bounds, in metres: its least corner and its greatest. A block's, unless it is of another unit. */
export function boundsOf([column, row, level]: Block, unit: Unit = BLOCK): { min: Vec; max: Vec } {
  const x = column * unit.width;
  const z = row * unit.length;
  const y = level * unit.height;
  return {
    min: [x - unit.width / 2, y, z - unit.length / 2],
    max: [x + unit.width / 2, y + unit.height, z + unit.length / 2],
  };
}

/** Whether the whole box's footprint lies on the plane; construction height is independent. */
export function fits(block: Block, halfSize: number, unit: Unit = BLOCK): boolean {
  const { min, max } = boundsOf(block, unit);
  return min[0] >= -halfSize && max[0] <= halfSize && min[2] >= -halfSize && max[2] <= halfSize;
}

/** A block's name, the same for the same block: what tells two apart. */
export const keyOf = ([column, row, level]: Block) => `${column},${row},${level}`;

/** Every block of a level that is in the world, row by row: the slots it may be built on. */
export function slotsAt(level: number, halfSize: number): Block[] {
  const reach = Math.ceil(halfSize / BLOCK.width);
  const slots: Block[] = [];
  for (let row = -reach; row <= reach; row++) {
    for (let column = -reach; column <= reach; column++) {
      const slot: Block = [column, row, level];
      if (fits(slot, halfSize)) slots.push(slot);
    }
  }
  return slots;
}

/**
 * The blocks as kept (a browser's store, a paste), as the world takes them: whole numbers, each block once, and only
 * those with their complete footprint on the plane. Invalid or duplicate entries never reach the renderer.
 */
export function blocksIn(kept: unknown, halfSize: number, unit: Unit = BLOCK): Block[] {
  if (!Array.isArray(kept)) return [];
  const seen = new Set<string>();
  const blocks: Block[] = [];
  for (const entry of kept) {
    if (!Array.isArray(entry) || entry.length !== 3 || !entry.every(Number.isInteger)) continue;
    const block = entry as unknown as Block;
    const key = keyOf(block);
    if (seen.has(key) || !fits(block, halfSize, unit)) continue;
    seen.add(key);
    blocks.push(block);
  }
  return blocks;
}

/** Where a ray from `origin` going `direction` (a unit) first meets a block's box, how far along it, and the face's way out. */
function hitBox(origin: Vec, direction: Vec, block: Block, unit: Unit): { t: number; normal: Vec } | null {
  const { min, max } = boundsOf(block, unit);
  let near = -Infinity;
  let far = Infinity;
  let axis = 0;
  let sign = 0;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(direction[i]) < 1e-9) {
      if (origin[i] < min[i] || origin[i] > max[i]) return null;
      continue;
    }
    const a = (min[i] - origin[i]) / direction[i];
    const b = (max[i] - origin[i]) / direction[i];
    const enter = Math.min(a, b);
    if (enter > near) {
      near = enter;
      axis = i;
      sign = direction[i] > 0 ? -1 : 1;
    }
    far = Math.min(far, Math.max(a, b));
  }
  if (near > far || far < 0 || near < 0) return null;
  const normal: [number, number, number] = [0, 0, 0];
  normal[axis] = sign;
  return { t: near, normal };
}

/** The block a ray meets first, which face, and how far along the ray; or none. */
export function blockUnder(origin: Vec, direction: Vec, blocks: readonly Block[], unit: Unit = BLOCK): { block: Block; normal: Vec; t: number } | null {
  let best: { block: Block; normal: Vec; t: number } | null = null;
  for (const block of blocks) {
    const hit = hitBox(origin, direction, block, unit);
    if (hit && (!best || hit.t < best.t)) best = { block, ...hit };
  }
  return best;
}

/**
 * Where a block would go under a ray, when blocks are being placed on `level`: against the face of the block it meets
 * first, or on the level's floor where it meets that first; or nowhere, where that slot is taken or not all inside the
 * plane.
 */
export function slotUnder(origin: Vec, direction: Vec, blocks: readonly Block[], level: number, halfSize: number, unit: Unit = BLOCK): Block | null {
  const onBlock = blockUnder(origin, direction, blocks, unit);
  const floor = level * unit.height;
  const t = Math.abs(direction[1]) < 1e-9 ? -1 : (floor - origin[1]) / direction[1];
  let slot: Block | null = null;
  if (t > 0 && (!onBlock || t < onBlock.t)) {
    const x = origin[0] + direction[0] * t;
    const z = origin[2] + direction[2] * t;
    slot = [Math.round(x / unit.width), Math.round(z / unit.length), level];
  } else if (onBlock) {
    const [column, row, at] = onBlock.block;
    const [nx, ny, nz] = onBlock.normal;
    slot = [column + nx, row + nz, at + ny];
  }
  if (!slot || !fits(slot, halfSize, unit)) return null;
  const taken = new Set(blocks.map(keyOf));
  return taken.has(keyOf(slot)) ? null : slot;
}

/** The lowest a camera stands, in metres over the world's floor (W23). */
const LOWEST = 0.2;

/** How far from the middle a camera may be over the floor, and how high: half a metre inside the round side and the top. */
export function edgesOf(size: WorldSize): { radius: number; top: number } {
  return { radius: Math.max(0, size.diameter / 2 - INSIDE), top: Math.max(LOWEST, size.height - INSIDE) };
}

type Ground = readonly [x: number, z: number];

/** A point over the floor held within `radius` of the middle: one beyond it is brought in along the way to the middle. */
function withinRound([x, z]: Ground, radius: number): Ground {
  const far = Math.hypot(x, z);
  return far <= radius ? [x, z] : [(x * radius) / far, (z * radius) / far];
}

/** A camera held inside the world: over its floor, under its top, and inside its round side. */
export function onPlane(point: Vec, size: WorldSize): Vec {
  const edge = edgesOf(size);
  const [x, z] = withinRound([point[0], point[2]], edge.radius);
  return [x, Math.max(LOWEST, Math.min(edge.top, point[1])), z];
}

/**
 * Clip an orbiting camera along its line of sight at the world's round side, floor and top; targets may sit below the
 * floor for the portal inspection, never over the top.
 */
export function lookingOverPlane(position: Vec, target: Vec, size: WorldSize): { position: Vec; target: Vec } {
  const edge = edgesOf(size);
  const [hx, hz] = withinRound([target[0], target[2]], edge.radius);
  const held: Vec = [hx, Math.min(edge.top, target[1]), hz];
  const delta: Vec = [position[0] - held[0], position[1] - held[1], position[2] - held[2]];
  let t = 1;
  // Where the line from the target meets the round side: the larger root of |held + t·delta| = radius over the floor.
  const a = delta[0] ** 2 + delta[2] ** 2;
  if (a > 1e-12) {
    const b = 2 * (hx * delta[0] + hz * delta[2]);
    const c = hx ** 2 + hz ** 2 - edge.radius ** 2;
    t = Math.min(t, Math.max(0, (-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a)));
  }
  if (delta[1] < 0 && held[1] >= LOWEST) t = Math.min(t, (LOWEST - held[1]) / delta[1]);
  if (delta[1] > 0) t = Math.min(t, (edge.top - held[1]) / delta[1]);
  return { position: onPlane([held[0] + delta[0] * t, held[1] + delta[1] * t, held[2] + delta[2] * t], size), target: held };
}

/**
 * How far a looked-round camera and what it looks at may rise together, `by` metres asked (down when negative): as far
 * as it takes them, short of the camera passing the world's floor or either passing its top. What it looks at may sink
 * below the floor, as `lookingOverPlane` lets it.
 */
export function riseInside(position: Vec, target: Vec, by: number, size: WorldSize): number {
  const { top } = edgesOf(size);
  if (by > 0) return Math.max(0, Math.min(by, top - position[1], top - target[1]));
  return Math.min(0, Math.max(by, LOWEST - position[1]));
}

/** Where over the floor a camera may be: inside the world's round side, whatever its height. */
export function overGroundPlane(at: Ground, size: WorldSize): Ground {
  return withinRound(at, edgesOf(size).radius);
}

/**
 * How far points over the floor may move together (a looked-round camera and what it looks at), `shift` asked: as far
 * as it takes them, and where one would leave the round side, slid along it instead, so a hand or a key held against
 * the side carries on round it and never stops dead.
 */
export function slideInside(points: readonly Ground[], shift: Ground, size: WorldSize): Ground {
  const { radius } = edgesOf(size);
  let [sx, sz] = shift;
  for (let i = 0; i < 4; i++) {
    let worst: { over: number; at: Ground } | null = null;
    for (const [x, z] of points) {
      const at: Ground = [x + sx, z + sz];
      const over = Math.hypot(at[0], at[1]) - radius;
      if (over > 1e-9 && (!worst || over > worst.over)) worst = { over, at };
    }
    if (!worst) break;
    const [ix, iz] = withinRound(worst.at, radius);
    sx += ix - worst.at[0];
    sz += iz - worst.at[1];
  }
  return [sx, sz];
}
