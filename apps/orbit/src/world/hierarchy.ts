import { BASE_BLOCK, type WorldSize } from "./orbit";

/**
 * What is built in the world (World.md W4, W25): ecosystems of habitats, habitats of sectors, sectors of zones, and
 * each zone's assets, its blocks. It is data, kept flat: each unit and each asset names the one that holds it, and a
 * unit its entry, one of its own. Nothing here is three.js, so the sector's card reads it without loading the world;
 * `build-blocks.ts` makes the blocks, the engine places them.
 *
 * Every place is on the lattice (W4), in steps of the default block (`BASE_BLOCK`): metres east (x), metres south (z),
 * levels up (0.25 m each). A unit's place is its origin in the unit that holds it (his: "Let's go relative"), an
 * ecosystem's in the world's, so moving a unit moves everything in it; a block's is its north-west corner at its
 * bottom, in its zone's.
 */

/** The units, from the world down (his: "Blocks combine into a zone, zones into a sector, … every ecosystem together is the world"). */
export type Kind = "ecosystem" | "habitat" | "sector" | "zone";
export const KINDS: readonly Kind[] = ["ecosystem", "habitat", "sector", "zone"];
/** What a unit holds, and what holds it. */
export const CHILD: Record<Kind, Kind | null> = { ecosystem: "habitat", habitat: "sector", sector: "zone", zone: null };
export const PARENT: Record<Kind, Kind | null> = { ecosystem: null, habitat: "ecosystem", sector: "habitat", zone: "sector" };

/** A place on the lattice: metres east, metres south, levels up. */
export type Place = readonly [x: number, z: number, level: number];

/**
 * A unit (W25): its name, what holds it (none, for an ecosystem), its origin there, and its entry, one of what it holds
 * (his: "Pointer"); a zone holds assets, and has none.
 */
export type WorldUnit = { id: string; kind: Kind; name: string; parent: string | null; at: Place; entry: string | null };

/** A block's size, each way a whole multiple of the default block's, 1 to 10 (his; W4): width, length, height. */
export type Size = readonly [width: number, length: number, height: number];
export const SIZE_MOST = 10;

/** A block, an asset of a zone (W25: a builder at a version, its configuration and its place): its size and colour. */
export type BlockAsset = { id: string; kind: "block"; zone: string; at: Place; size: Size; colour: string };
/** What a zone groups: blocks, and later portals, rocks and the library's (his). */
export type Asset = BlockAsset;

export type WorldData = { units: WorldUnit[]; assets: Asset[] };

/** A new block's colour: Sand, the ground's until there was none (mine). */
export const BLOCK_COLOUR = "#efe5e8";

/** How far a new unit stands east of what its parent holds already, in metres (mine): a cell of air between them. */
const CLEAR = 2;

/**
 * The world as it starts (mine, his to name): one ecosystem, its habitat, its sector, and the sector's entry zone of one
 * default block (his: "a default created zone in a sector, with default setup of 1 block"), each the entry of the one
 * above, all at the world's middle.
 */
export const WORLD_START: WorldData = {
  units: [
    { id: "ecosystem-1", kind: "ecosystem", name: "Ecosystem 1", parent: null, at: [0, 0, 0], entry: "habitat-1" },
    { id: "habitat-1", kind: "habitat", name: "Habitat 1", parent: "ecosystem-1", at: [0, 0, 0], entry: "sector-1" },
    { id: "sector-1", kind: "sector", name: "Sector 1", parent: "habitat-1", at: [0, 0, 0], entry: "zone-1" },
    { id: "zone-1", kind: "zone", name: "Entry", parent: "sector-1", at: [0, 0, 0], entry: null },
  ],
  assets: [{ id: "block-1", kind: "block", zone: "zone-1", at: [0, 0, 0], size: [1, 1, 1], colour: BLOCK_COLOUR }],
};

const isPlace = (value: unknown): value is Place => Array.isArray(value) && value.length === 3 && value.every(Number.isInteger);
const isSize = (value: unknown): value is Size =>
  Array.isArray(value) && value.length === 3 && value.every((n) => Number.isInteger(n) && n >= 1 && n <= SIZE_MOST);

/**
 * The world as kept (a browser's store, a paste), as it is built on: each unit held by one of the kind above it, each
 * asset in a zone, every place on the lattice, each id once; a unit that holds nothing is given its default (W25: never
 * empty), and an entry that is gone is the first it holds. A world with no ecosystem starts again.
 */
export function worldOf(kept: unknown): WorldData {
  if (!kept || typeof kept !== "object") return WORLD_START;
  const { units, assets } = kept as { units?: unknown; assets?: unknown };
  const seen = new Map<string, WorldUnit>();
  for (const unit of Array.isArray(units) ? units : []) {
    if (!unit || typeof unit !== "object") continue;
    const { id, kind, name, parent, at, entry } = unit as Record<string, unknown>;
    if (typeof id !== "string" || seen.has(id) || !KINDS.includes(kind as Kind) || typeof name !== "string" || !isPlace(at)) continue;
    if (parent !== null && typeof parent !== "string") continue;
    seen.set(id, { id, kind: kind as Kind, name, parent, at, entry: typeof entry === "string" ? entry : null });
  }
  // Top down, so a unit is kept only when what holds it is.
  const held: WorldUnit[] = [];
  const keptIds = new Set<string>();
  for (const kind of KINDS) {
    for (const unit of seen.values()) {
      if (unit.kind !== kind) continue;
      const parent = unit.parent === null ? null : seen.get(unit.parent);
      const fits = kind === "ecosystem" ? unit.parent === null : !!parent && parent.kind === PARENT[kind] && keptIds.has(parent.id);
      if (!fits) continue;
      held.push(kind === "zone" ? { ...unit, entry: null } : unit);
      keptIds.add(unit.id);
    }
  }
  if (!held.some((unit) => unit.kind === "ecosystem")) return WORLD_START;

  const ids = new Set<string>();
  const kinds = new Map(held.map((unit) => [unit.id, unit.kind]));
  const blocks: Asset[] = [];
  for (const asset of Array.isArray(assets) ? assets : []) {
    if (!asset || typeof asset !== "object") continue;
    const { id, kind, zone, at, size, colour } = asset as Record<string, unknown>;
    if (typeof id !== "string" || ids.has(id) || kind !== "block" || typeof zone !== "string" || kinds.get(zone) !== "zone") continue;
    if (!isPlace(at) || !isSize(size) || typeof colour !== "string") continue;
    ids.add(id);
    blocks.push({ id, kind, zone, at, size, colour });
  }

  let world: WorldData = { units: held, assets: blocks };
  for (const kind of KINDS) {
    if (kind === "zone") continue;
    for (const unit of world.units.filter((u) => u.kind === kind)) {
      const own = childrenOf(world, unit.id);
      if (!own.length) {
        const made = makeIn(world, CHILD[kind] as Kind, unit.id, [0, 0, 0]);
        world = withUnit(made.world, unit.id, { entry: made.id });
        continue;
      }
      if (!own.some((child) => child.id === unit.entry)) world = withUnit(world, unit.id, { entry: own[0].id });
    }
  }
  return world;
}

export const unitOf = (world: WorldData, id: string): WorldUnit | undefined => world.units.find((unit) => unit.id === id);
/** What a unit holds, in the order made; for `null`, the ecosystems. */
export const childrenOf = (world: WorldData, id: string | null): WorldUnit[] => world.units.filter((unit) => unit.parent === id);
export const assetsOf = (world: WorldData, zone: string): Asset[] => world.assets.filter((asset) => asset.zone === zone);

/** Every unit under one, deepest last: what goes with it when it is deleted. */
function within(world: WorldData, id: string): Set<string> {
  const under = new Set([id]);
  for (const kind of KINDS) for (const unit of world.units) if (unit.kind === kind && unit.parent && under.has(unit.parent)) under.add(unit.id);
  return under;
}

/** The units a zone is in, by kind, and the zone: where it is in the hierarchy. */
export function chainOf(world: WorldData, zone: string): Record<Kind, WorldUnit> {
  const chain = {} as Record<Kind, WorldUnit>;
  let unit = unitOf(world, zone);
  while (unit) {
    chain[unit.kind] = unit;
    unit = unit.parent ? unitOf(world, unit.parent) : undefined;
  }
  return chain;
}

/**
 * A unit's entry zone (W25): following its entry, and its entry's, down to a zone; a zone is its own. A habitat's entry
 * zone is its entry sector's.
 */
export function entryZoneOf(world: WorldData, id: string): string {
  let unit = unitOf(world, id);
  while (unit && unit.kind !== "zone") {
    const next = unit.entry ? unitOf(world, unit.entry) : childrenOf(world, unit.id)[0];
    if (!next) break;
    unit = next;
  }
  return unit?.kind === "zone" ? unit.id : (world.units.find((u) => u.kind === "zone")?.id ?? "");
}

/** The zone a builder picked, if it is still there; else the first ecosystem's entry zone. */
export function pickedZone(world: WorldData, zone: string): WorldUnit {
  const picked = unitOf(world, zone);
  if (picked?.kind === "zone") return picked;
  const first = childrenOf(world, null)[0];
  return unitOf(world, entryZoneOf(world, first.id)) as WorldUnit;
}

/** Whether a unit is the entry of what holds it. */
export const isEntry = (world: WorldData, unit: WorldUnit) => !!unit.parent && unitOf(world, unit.parent)?.entry === unit.id;

const plus = (a: Place, b: Place): Place => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const minus = (a: Place, b: Place): Place => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/** Every unit's origin in the world: its own place added to every place above it (his: relative). */
export function originsOf(world: WorldData): Map<string, Place> {
  const origins = new Map<string, Place>();
  for (const kind of KINDS) {
    for (const unit of world.units) {
      if (unit.kind !== kind) continue;
      const above = unit.parent ? origins.get(unit.parent) : ([0, 0, 0] as Place);
      if (above) origins.set(unit.id, plus(above, unit.at));
    }
  }
  return origins;
}

/** A block where it stands in the world: from its least corner to its greatest (exclusive), on the lattice. */
export type Box = { id: string; zone: string; colour: string; from: Place; to: Place };

/** Every block where it stands in the world. */
export function boxesOf(world: WorldData): Box[] {
  const origins = originsOf(world);
  return world.assets.flatMap((asset) => {
    const origin = origins.get(asset.zone);
    if (!origin) return [];
    const from = plus(origin, asset.at);
    return [{ id: asset.id, zone: asset.zone, colour: asset.colour, from, to: plus(from, asset.size) }];
  });
}

/** A place in metres, as three.js has them: [x, y, z]. */
export const metresOf = ([x, z, level]: Place): [number, number, number] => [x * BASE_BLOCK.width, level * BASE_BLOCK.height, z * BASE_BLOCK.length];

/** Whether a box stands inside the world's boundaries (W29): within its width and breadth, on or over its floor, under its top. */
export function inside(box: { from: Place; to: Place }, size: WorldSize): boolean {
  const [x0, y0, z0] = metresOf(box.from);
  const [x1, y1, z1] = metresOf(box.to);
  return x0 >= -size.width / 2 && x1 <= size.width / 2 && z0 >= -size.breadth / 2 && z1 <= size.breadth / 2 && y0 >= 0 && y1 <= size.height;
}

const stepKey = (x: number, z: number, level: number) => `${x},${z},${level}`;

/** Every step of the lattice a block fills, and which block fills it: one block a step (W4). */
export function occupancyOf(boxes: readonly Box[]): Map<string, string> {
  const taken = new Map<string, string>();
  for (const box of boxes) {
    for (let x = box.from[0]; x < box.to[0]; x++)
      for (let z = box.from[1]; z < box.to[1]; z++)
        for (let level = box.from[2]; level < box.to[2]; level++) if (!taken.has(stepKey(x, z, level))) taken.set(stepKey(x, z, level), box.id);
  }
  return taken;
}

/** Whether a box would fill a step another fills. */
function collides(from: Place, size: Size, taken: Map<string, string>): boolean {
  for (let x = from[0]; x < from[0] + size[0]; x++)
    for (let z = from[1]; z < from[1] + size[1]; z++)
      for (let level = from[2]; level < from[2] + size[2]; level++) if (taken.has(stepKey(x, z, level))) return true;
  return false;
}

/**
 * The blocks that share a step with another: a unit moved over another (his coordinates are never refused; the card
 * says what overlaps).
 */
export function overlapsOf(boxes: readonly Box[]): Set<string> {
  const taken = occupancyOf(boxes);
  const over = new Set<string>();
  for (const box of boxes) {
    for (let x = box.from[0]; x < box.to[0]; x++)
      for (let z = box.from[1]; z < box.to[1]; z++)
        for (let level = box.from[2]; level < box.to[2]; level++) {
          const owner = taken.get(stepKey(x, z, level));
          if (owner && owner !== box.id) over.add(box.id).add(owner);
        }
  }
  return over;
}

type Vec = readonly [number, number, number];

/** Where a ray from `origin` going `direction` (a unit) first meets a box, how far along, and the face's way out. */
function hitBox(origin: Vec, direction: Vec, box: Box): { t: number; normal: Vec } | null {
  const min = metresOf(box.from);
  const max = metresOf(box.to);
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

/** The block a ray meets first, its face's way out (in metres' axes, x y z), and how far along the ray. */
export function boxUnder(origin: Vec, direction: Vec, boxes: readonly Box[]): { box: Box; normal: Vec; t: number } | null {
  let best: { box: Box; normal: Vec; t: number } | null = null;
  for (const box of boxes) {
    const hit = hitBox(origin, direction, box);
    if (hit && (!best || hit.t < best.t)) best = { box, ...hit };
  }
  return best;
}

/**
 * Where a block of `size` would go under a ray, in the world, when blocks are placed on `level` (the world's levels):
 * against the face of the block the ray meets first, or on the level's floor where it meets that first; centred on the
 * point the ray meets along the face, and flush with it across. Nowhere, where it would fill a step another fills or
 * leave the world's boundaries (`bounds`).
 */
export function placeUnder(origin: Vec, direction: Vec, boxes: readonly Box[], taken: Map<string, string>, level: number, size: Size, bounds: WorldSize): Place | null {
  const hit = boxUnder(origin, direction, boxes);
  const floor = level * BASE_BLOCK.height;
  const t = Math.abs(direction[1]) < 1e-9 ? -1 : (floor - origin[1]) / direction[1];
  // The face met, in the lattice's axes (x, z, level), and where on it, in lattice steps.
  let normal: Place;
  let face: number;
  let at: number;
  if (t > 0 && (!hit || t < hit.t)) {
    at = t;
    normal = [0, 0, origin[1] > floor ? 1 : -1];
    face = level;
  } else if (hit) {
    at = hit.t;
    normal = [hit.normal[0], hit.normal[2], hit.normal[1]];
    const axis = normal.findIndex((n) => n !== 0);
    face = normal[axis] > 0 ? hit.box.to[axis] : hit.box.from[axis];
  } else return null;
  const point: Place = [
    (origin[0] + direction[0] * at) / BASE_BLOCK.width,
    (origin[2] + direction[2] * at) / BASE_BLOCK.length,
    (origin[1] + direction[1] * at) / BASE_BLOCK.height,
  ];
  const from = [0, 1, 2].map((axis) => {
    if (normal[axis] > 0) return face;
    if (normal[axis] < 0) return face - size[axis];
    return Math.round(point[axis] - size[axis] / 2);
  }) as unknown as Place;
  if (!inside({ from, to: plus(from, size) }, bounds) || collides(from, size, taken)) return null;
  return from;
}

/** A unit changed: the same world with one unit's fields replaced. */
function withUnit(world: WorldData, id: string, next: Partial<WorldUnit>): WorldData {
  return { ...world, units: world.units.map((unit) => (unit.id === id ? { ...unit, ...next } : unit)) };
}

/** The next id of a kind: one more than the most it has numbered. */
function nextId(ids: readonly string[], kind: string): string {
  const most = ids.reduce((n, id) => {
    const m = id.match(new RegExp(`^${kind}-(\\d+)$`));
    return m ? Math.max(n, Number(m[1])) : n;
  }, 0);
  return `${kind}-${most + 1}`;
}

/** A new unit's name (mine): a sector's first zone is its Entry; the rest are named for their kind, in turn. */
function nameOf(world: WorldData, kind: Kind, parent: string | null): string {
  const label = kind[0].toUpperCase() + kind.slice(1);
  if (kind === "zone") return childrenOf(world, parent).length ? `Zone ${childrenOf(world, parent).length + 1}` : "Entry";
  return `${label} ${world.units.filter((unit) => unit.kind === kind).length + 1}`;
}

/** A unit made at `at` in what holds it, with what it holds by default (W25), each the entry of the one above. */
function makeIn(world: WorldData, kind: Kind, parent: string | null, at: Place): { world: WorldData; id: string } {
  const id = nextId(world.units.map((unit) => unit.id), kind);
  let next: WorldData = { ...world, units: [...world.units, { id, kind, name: nameOf(world, kind, parent), parent, at, entry: null }] };
  const child = CHILD[kind];
  if (child) {
    const made = makeIn(next, child, id, [0, 0, 0]);
    next = withUnit(made.world, id, { entry: made.id });
  } else if (!childrenOf(world, parent).length) {
    // A sector's first zone is its entry, of one default block (his).
    next = withBlock(next, id, [0, 0, 0], [1, 1, 1], BLOCK_COLOUR);
  }
  return { world: next, id };
}

/**
 * A new unit in what holds it (none: an ecosystem), named in turn, with what it holds by default (W25). A zone stands at
 * its sector's origin, and is built into; any other stands east of everything its parent holds, a cell of air clear,
 * and further east still while its first block would overlap one already built (mine).
 */
export function make(world: WorldData, kind: Kind, parent: string | null): { world: WorldData; id: string } {
  if (kind === "zone") return makeIn(world, kind, parent, [0, 0, 0]);
  const origins = originsOf(world);
  const base: Place = parent ? (origins.get(parent) ?? [0, 0, 0]) : [0, 0, 0];
  const under = parent ? within(world, parent) : new Set(world.units.map((unit) => unit.id));
  const boxes = boxesOf(world);
  const east = boxes.filter((box) => under.has(box.zone)).reduce((most, box) => Math.max(most, box.to[0] - base[0]), -Infinity);
  const taken = occupancyOf(boxes);
  let x = Number.isFinite(east) ? east + CLEAR : 0;
  while (collides(plus(base, [x, 0, 0]), [1, 1, 1], taken)) x += 1;
  return makeIn(world, kind, parent, [x, 0, 0]);
}

/** Why a unit cannot be deleted, if it cannot: the entry stays until another is made the entry, and the world keeps one ecosystem. */
export function keptBecause(world: WorldData, unit: WorldUnit): string | null {
  if (isEntry(world, unit)) return "The entry stays until another is made the entry";
  if (unit.kind === "ecosystem" && childrenOf(world, null).length === 1) return "The world keeps one ecosystem";
  return null;
}

/** The world without a unit, and everything in it; unchanged where it is kept (`keptBecause`). */
export function remove(world: WorldData, id: string): WorldData {
  const unit = unitOf(world, id);
  if (!unit || keptBecause(world, unit)) return world;
  const gone = within(world, id);
  return { ...world, units: world.units.filter((u) => !gone.has(u.id)), assets: world.assets.filter((asset) => !gone.has(asset.zone)) };
}

export const rename = (world: WorldData, id: string, name: string) => withUnit(world, id, { name });
export const moveTo = (world: WorldData, id: string, at: Place) => withUnit(world, id, { at });

/** The world with a unit made the entry of what holds it (an ecosystem's entry is the world's, not decided: Open). */
export function makeEntry(world: WorldData, id: string): WorldData {
  const unit = unitOf(world, id);
  return unit?.parent ? withUnit(world, unit.parent, { entry: id }) : world;
}

/** The world with a block in a zone, at a place in the zone's coordinates. */
export function withBlock(world: WorldData, zone: string, at: Place, size: Size, colour: string): WorldData {
  const id = nextId(world.assets.map((asset) => asset.id), "block");
  return { ...world, assets: [...world.assets, { id, kind: "block", zone, at, size, colour }] };
}

/** The world with a block placed at a place in the world, into a zone: its place made the zone's. */
export function withBlockAt(world: WorldData, zone: string, worldAt: Place, size: Size, colour: string): WorldData {
  const origin = originsOf(world).get(zone) ?? [0, 0, 0];
  return withBlock(world, zone, minus(worldAt, origin), size, colour);
}

export const withoutAsset = (world: WorldData, id: string): WorldData => ({ ...world, assets: world.assets.filter((asset) => asset.id !== id) });

/** What Copy sends of the world (W25): each unit, indented by depth, its place and its entry, each zone's blocks; then the data. */
export function worldLines(world: WorldData): string[] {
  const lines: string[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const unit of childrenOf(world, parent)) {
      const place = metresOf(unit.at);
      const entry = unit.entry ? `; entry ${unitOf(world, unit.entry)?.name}` : "";
      const count = assetsOf(world, unit.id).length;
      const blocks = unit.kind === "zone" ? `; ${count} ${count === 1 ? "block" : "blocks"}` : "";
      lines.push(`${"  ".repeat(depth)}${unit.name} (${unit.kind}) at x ${place[0]}, y ${place[1]}, z ${place[2]} m${entry}${blocks}`);
      walk(unit.id, depth + 1);
    }
  };
  walk(null, 0);
  return [...lines, `World JSON: ${JSON.stringify(world)}`];
}
