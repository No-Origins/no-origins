/**
 * The Orbit (his: "And the world is called 'The Orbit'"; World.md W4, W16): a floating space inside a glossy sphere,
 * clouds above it and water below, built of blocks, and nothing of it, the camera included, ever outside the sphere.
 * Nothing here is three.js, so a page reads it without loading the world.
 *
 * **A block** is the world's spatial unit (his): 10 m across, 10 m along and 1 m high. Blocks make a zone, zones a
 * sector, sectors a habitat, habitats an ecosystem, and every ecosystem together is the world (his; only the block is
 * built yet). Blocks stand on a lattice: a block is `[column, row, level]`, its middle at `column` × 10 m across (x) and
 * `row` × 10 m along (z), its floor at `level` × 1 m up (y). The visitor starts over block [0, 0], facing −z, standing on
 * level 0's floor, the top of level −1; the start location's cells (2 m, `start.ts`) are five to a block's side, and the
 * cell at its middle is the block's.
 *
 * **The sphere** stands round the middle of the lattice, the point the visitor starts on: a block is in the world only
 * where all of it is inside the sphere, and nothing moves the camera out of it.
 */

/** A block's size, in metres (his: "10m width x 10m length and 5m height", then "reduce the block height from 5m to 1 meter"). */
export const BLOCK = { width: 10, length: 10, height: 1 } as const;

/** A block on the lattice: its column (across, x), its row (along, z) and its level (up, y). */
export type Block = readonly [column: number, row: number, level: number];

type Vec = readonly [number, number, number];

/** How far inside the sphere the camera always stays, in metres, so it never meets the dome. */
export const INSIDE = 0.5;

/** A block's box, in metres: its least corner and its greatest. */
export function boundsOf([column, row, level]: Block): { min: Vec; max: Vec } {
  const x = column * BLOCK.width;
  const z = row * BLOCK.length;
  const y = level * BLOCK.height;
  return {
    min: [x - BLOCK.width / 2, y, z - BLOCK.length / 2],
    max: [x + BLOCK.width / 2, y + BLOCK.height, z + BLOCK.length / 2],
  };
}

/** Whether all of a block is inside a sphere of `radius`: its corner furthest from the middle is. */
export function fits(block: Block, radius: number): boolean {
  const { min, max } = boundsOf(block);
  const far = (low: number, high: number) => Math.max(Math.abs(low), Math.abs(high));
  return Math.hypot(far(min[0], max[0]), far(min[1], max[1]), far(min[2], max[2])) <= radius;
}

/** A block's name, the same for the same block: what tells two apart. */
export const keyOf = ([column, row, level]: Block) => `${column},${row},${level}`;

/** Every block of a level that is in the world, row by row: the slots it may be built on. */
export function slotsAt(level: number, radius: number): Block[] {
  const reach = Math.ceil(radius / BLOCK.width);
  const slots: Block[] = [];
  for (let row = -reach; row <= reach; row++) {
    for (let column = -reach; column <= reach; column++) {
      const slot: Block = [column, row, level];
      if (fits(slot, radius)) slots.push(slot);
    }
  }
  return slots;
}

/**
 * The blocks as kept (a browser's store, a paste), as the world takes them: whole numbers, each block once, and only
 * those all inside the sphere. One the sphere has grown too small for stays kept, and comes back when it grows again.
 */
export function blocksIn(kept: unknown, radius: number): Block[] {
  if (!Array.isArray(kept)) return [];
  const seen = new Set<string>();
  const blocks: Block[] = [];
  for (const entry of kept) {
    if (!Array.isArray(entry) || entry.length !== 3 || !entry.every(Number.isInteger)) continue;
    const block = entry as unknown as Block;
    const key = keyOf(block);
    if (seen.has(key) || !fits(block, radius)) continue;
    seen.add(key);
    blocks.push(block);
  }
  return blocks;
}

/** Where a ray from `origin` going `direction` (a unit) first meets a block's box, how far along it, and the face's way out. */
function hitBox(origin: Vec, direction: Vec, block: Block): { t: number; normal: Vec } | null {
  const { min, max } = boundsOf(block);
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
export function blockUnder(origin: Vec, direction: Vec, blocks: readonly Block[]): { block: Block; normal: Vec; t: number } | null {
  let best: { block: Block; normal: Vec; t: number } | null = null;
  for (const block of blocks) {
    const hit = hitBox(origin, direction, block);
    if (hit && (!best || hit.t < best.t)) best = { block, ...hit };
  }
  return best;
}

/**
 * Where a block would go under a ray, when blocks are being placed on `level`: against the face of the block it meets
 * first, or on the level's floor where it meets that first; or nowhere, where that slot is taken or not all inside the
 * sphere.
 */
export function slotUnder(origin: Vec, direction: Vec, blocks: readonly Block[], level: number, radius: number): Block | null {
  const onBlock = blockUnder(origin, direction, blocks);
  const floor = level * BLOCK.height;
  const t = Math.abs(direction[1]) < 1e-9 ? -1 : (floor - origin[1]) / direction[1];
  let slot: Block | null = null;
  if (t > 0 && (!onBlock || t < onBlock.t)) {
    const x = origin[0] + direction[0] * t;
    const z = origin[2] + direction[2] * t;
    slot = [Math.round(x / BLOCK.width), Math.round(z / BLOCK.length), level];
  } else if (onBlock) {
    const [column, row, at] = onBlock.block;
    const [nx, ny, nz] = onBlock.normal;
    slot = [column + nx, row + nz, at + ny];
  }
  if (!slot || !fits(slot, radius)) return null;
  const taken = new Set(blocks.map(keyOf));
  return taken.has(keyOf(slot)) ? null : slot;
}

/** A point held inside the sphere, `INSIDE` metres in from the dome, along the way from its middle. */
export function inside(point: Vec, radius: number): Vec {
  const most = Math.max(0, radius - INSIDE);
  const far = Math.hypot(point[0], point[1], point[2]);
  if (far <= most) return point;
  const k = most / far;
  return [point[0] * k, point[1] * k, point[2] * k];
}

/**
 * A camera that looks round `target` from `position`, held inside the sphere: what it looks at is kept inside, and a
 * camera past the dome comes in along the line to what it looks at, so it still sees it from the same side.
 */
export function lookingInside(position: Vec, target: Vec, radius: number): { position: Vec; target: Vec } {
  const held = inside(target, radius);
  const most = Math.max(0, radius - INSIDE);
  if (Math.hypot(position[0], position[1], position[2]) <= most) return { position, target: held };
  const way: Vec = [position[0] - held[0], position[1] - held[1], position[2] - held[2]];
  const length = Math.hypot(way[0], way[1], way[2]) || 1;
  const d: Vec = [way[0] / length, way[1] / length, way[2] / length];
  // Along the line from what it looks at, as far as the sphere allows: |held + t·d| = most, the far root.
  const b = held[0] * d[0] + held[1] * d[1] + held[2] * d[2];
  const c = held[0] ** 2 + held[1] ** 2 + held[2] ** 2 - most ** 2;
  const t = Math.max(0, -b + Math.sqrt(Math.max(0, b * b - c)));
  return { position: [held[0] + d[0] * t, held[1] + d[1] * t, held[2] + d[2] * t], target: held };
}

/**
 * Where over the ground the visitor's camera may be at `height`: held within the sphere's round at that height, so it
 * never goes past the dome, however it is moved.
 */
export function overGroundInside(at: readonly [number, number], height: number, radius: number): readonly [number, number] {
  const most = Math.max(0, radius - INSIDE);
  const round = Math.sqrt(Math.max(0, most * most - height * height));
  const far = Math.hypot(at[0], at[1]);
  if (far <= round) return at;
  const k = round / far;
  return [at[0] * k, at[1] * k];
}
