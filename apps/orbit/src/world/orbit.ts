/**
 * The Orbit: an open box of his size (World.md W29), centred at x/z 0 and standing on y 0, and the blocks' sizes. The
 * lattice version 4 of the sector builds on, a block's own size and colour in a zone of the hierarchy, is
 * `hierarchy.ts`; the lattice below, a block of one size at `[column, row, level]` round the start, is the frozen
 * versions'.
 */
/** The world's square's side, in metres (his: "a 1000 m × 1000 m plane", W23): the start's width and breadth, and the frozen versions' square. */
export const PLANE_SIZE = 1000;

/**
 * The world's size, in metres (his, W29: "Can we set the world width, breadth and height?"): its width west to east (x),
 * its breadth north to south (z), each centred on the middle, and its height up from its floor, y 0. Every camera and
 * everything built stays inside it; the sky and the clouds are beyond it.
 */
export type WorldSize = { readonly width: number; readonly breadth: number; readonly height: number };

/** The world as it starts (mine, his to tune): W23's kilometre square, a kilometre high, so nothing it held moves. */
export const WORLD_SIZE_START: WorldSize = { width: PLANE_SIZE, breadth: PLANE_SIZE, height: 1000 };

/**
 * What each of the world's sizes may be (mine): across and along on a step of 2 m, so the middle stays on a whole metre
 * and the edges on the lattice (W4); up, a metre at a time, from 10 m, room for a camera over a block.
 */
export const WORLD_SIZE_RANGE: Record<keyof WorldSize, { min: number; max: number; step: number }> = {
  width: { min: 20, max: 4000, step: 2 },
  breadth: { min: 20, max: 4000, step: 2 },
  height: { min: 10, max: 2000, step: 1 },
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

/** How far from the middle a camera may be, across (x) and along (z), and how high: half a metre inside each side. */
export function edgesOf(size: WorldSize): { x: number; z: number; top: number } {
  return {
    x: Math.max(0, size.width / 2 - INSIDE),
    z: Math.max(0, size.breadth / 2 - INSIDE),
    top: Math.max(LOWEST, size.height - INSIDE),
  };
}

const within = (v: number, edge: number) => Math.max(-edge, Math.min(edge, v));

/** A camera held inside the world: over its floor, under its top, and inside each side, each on its own. */
export function onPlane(point: Vec, size: WorldSize): Vec {
  const edge = edgesOf(size);
  return [within(point[0], edge.x), Math.max(LOWEST, Math.min(edge.top, point[1])), within(point[2], edge.z)];
}

/**
 * Clip an orbiting camera along its line of sight at the world's sides, floor and top; targets may sit below the floor
 * for the portal inspection, never over the top.
 */
export function lookingOverPlane(position: Vec, target: Vec, size: WorldSize): { position: Vec; target: Vec } {
  const edge = edgesOf(size);
  const held: Vec = [within(target[0], edge.x), Math.min(edge.top, target[1]), within(target[2], edge.z)];
  const delta: Vec = [position[0] - held[0], position[1] - held[1], position[2] - held[2]];
  let t = 1;
  for (const [axis, side] of [[0, edge.x], [2, edge.z]] as const) {
    if (delta[axis] > 0) t = Math.min(t, (side - held[axis]) / delta[axis]);
    if (delta[axis] < 0) t = Math.min(t, (-side - held[axis]) / delta[axis]);
  }
  if (delta[1] < 0 && held[1] >= LOWEST) t = Math.min(t, (LOWEST - held[1]) / delta[1]);
  if (delta[1] > 0) t = Math.min(t, (edge.top - held[1]) / delta[1]);
  return { position: onPlane([held[0] + delta[0] * t, held[1] + delta[1] * t, held[2] + delta[2] * t], size), target: held };
}

/** Where over the floor a camera may be: inside the world's width and breadth, each on its own, whatever its height. */
export function overGroundPlane(at: readonly [number, number], size: WorldSize): readonly [number, number] {
  const edge = edgesOf(size);
  return [within(at[0], edge.x), within(at[1], edge.z)];
}
