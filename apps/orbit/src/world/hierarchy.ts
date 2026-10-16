import { BASE_BLOCK, type WorldSize } from "./orbit";
import { areaFrom, outlineFrom, type Area } from "./area";
import { GROVE_W71, GROVE_W71_VARIANT } from "./grove-w71";
import { PUBLISHED_WORLD } from "./published";
import { pipeLookOf, pipeLookOfVariant, type PipeLook } from "./pipe";
import { roadLookOf, roadLookOfVariant, type RoadLook } from "./road";
import { onLattice, waysFor, type Point, type Way } from "./skeleton";
import { lengthsOfVariantId, lookOfVariantId, TRUNK_LENGTH, treeLookOf, type TreeLook } from "./tree";

/**
 * What is built in the world (World.md W4, W25, W81, W91, W93): sectors, each a place in the world with a size, and in
 * each what is built and placed in it, its blocks and its elements. It is data, kept flat: each asset names the sector
 * that holds it. Zones went with W91 (his: "let's even remove zones. We'll only have sectors, and inside sectors, I will
 * place the elements"). Nothing here is three.js, so the Sectors card reads it without loading the world;
 * `build-blocks.ts` makes the blocks, the engine places them.
 *
 * A sector's place is on the lattice (W4), in steps of the default block (`BASE_BLOCK`): metres east (x), metres south
 * (z), levels up (0.25 m each); it is the middle of its floor in the world, and what it holds stands from there, so
 * moving a sector moves everything in it. A block (W93) is its middle in metres from there, any size, turned any way.
 */

/**
 * The units (W81, W91; his: "We'll only have sectors"): a sector, which holds assets. Habitats and ecosystems are set
 * aside (W81), and zones went (W91).
 */
export type Kind = "sector";
export const KINDS: readonly Kind[] = ["sector"];

/** A place on the lattice: metres east, metres south, levels up. */
export type Place = readonly [x: number, z: number, level: number];

/** A sector's size in metres (W81): width (east), length (south) and height. */
export type Dimensions = readonly [width: number, length: number, height: number];
/** A sector's least and most, each way (his: "Up to the maximum of thousand meters. And minimum of 50 meters"). */
export const SECTOR_LEAST = 50;
export const SECTOR_MOST = 1000;
/** A new sector's size (mine): a hundred metres each way. */
export const SECTOR_SIZE: Dimensions = [100, 100, 100];

/**
 * A sector (W81; his: "A sector will have name, and then a location in the world. And in that location, I will describe
 * the width and height of the sector"): its name, the middle of its floor in the world, and its size. It is held by the
 * world (`parent` none) until habitats come. Its entry, one of its zones (W25), went with the zones (W91).
 */
export type Sector = { id: string; kind: "sector"; name: string; parent: null; at: Place; size: Dimensions };
export type WorldUnit = Sector;

/** A block's size as the lattice had it until W93, a multiple of the default each way, 1 to 10: kept for the frozen versions. */
export type Size = readonly [width: number, length: number, height: number];
export const SIZE_MOST = 10;

/** A block's unit (W93; his pick, "1–100 with a m/cm switch"): its width, length and height in metres or in centimetres. */
export type BlockUnit = "m" | "cm";
/** A block's texture (W93; his pick, "Smooth and Grain"): its colour flat, or with the Sectors card's grain over it. */
export type BlockTexture = "smooth" | "grain";
/** A block's width, length and height, each way, in its unit (his: "The min and max for length, width and height should be 1 m/cm to 100 m/cm"). */
export const BLOCK_LEAST = 1;
export const BLOCK_MOST = 100;
/** A rotation in whole degrees round X, Y (up) and Z, turned round Y, then X, then Z of the block's own (W93; his pick, "Any axis, as in Blender"). */
export type Rotation = readonly [x: number, y: number, z: number];

/**
 * A block, an asset of a sector (W25, W93; his: "A block is a simple basic block. It will have length, width, height,
 * rotation, color and texture. These will be decided while they are being placed in the sector"): where its middle
 * stands, in metres from the middle of its sector's floor (x east, y up, z south); its width (east), length (south) and
 * height, each 1 to 100 in its unit; its rotation; its colour; and its texture. And the pipes subtracted from it (W95;
 * his: "I need option to subtract while I select two items at once using cmd"), by id: where one passes through it,
 * the block is open onto it; none, or no `cuts`, and it is whole.
 */
export type BlockAsset = { id: string; kind: "block"; sector: string; at: Point; size: Size; unit: BlockUnit; rotation: Rotation; colour: string; texture: BlockTexture; cuts?: string[] };
/** What a block is but where it stands: what the next one placed takes, and what the card changes on the ones picked. */
export type BlockShape = Pick<BlockAsset, "size" | "unit" | "rotation" | "colour" | "texture">;

/**
 * The elements placed in the world by hand (World.md W73): a mountain, a human (W89; his: "For human, we don't need any,
 * but only variants similar to mountains"), which stands where it is placed, or a tree placed alone before groves (W89);
 * the visitor is the human of the start (W51). The portal went with W93 (his: "Let's remove Portal because Pipes can be
 * portals now"): one kept is let go.
 */
export type PlacedKind = "mountain" | "tree" | "human";
export const PLACED_KINDS: readonly PlacedKind[] = ["mountain", "tree", "human"];
/**
 * An element placed in a sector (W73, rule 4): which element, which of its variants (by the variant's id, `published.ts`
 * and the database agreeing), its place in the sector (its foot), the way it faces (degrees round from north) or leans
 * (a tree), a tree's own seed; and a tree placed alone, before groves, its look (W93: its variant's, read as it is kept),
 * its height in metres and its own flower colour where it was given one (W86).
 */
export type PlacedAsset = { id: string; kind: PlacedKind; sector: string; at: Place; variant: string; turn: number; seed: number; colour?: string; height?: number; look?: TreeLook };
/**
 * The elements shaped by a skeleton (World.md W84; his: "Pipes will have start and an end", "roads can basically also
 * work like pipe", "something like skeleton, where I can select the joints to define the shape by moving the joints"):
 * a pipe or a road.
 */
export type SkeletonKind = "pipe" | "road";
export const SKELETON_KINDS: readonly SkeletonKind[] = ["pipe", "road"];
/**
 * A pipe or a road placed in a sector (W84, W87, W93): which, its look, its own (his: "As they are placed, like a
 * block"), and its skeleton: its joints from its start to its end, two or more (`skeleton.ts`), each in metres from the
 * middle of its sector's floor (x east, y up, z south), a quarter metre a step, where the pipe's or the road's underside
 * passes, so one placed on a floor lies on it; and each joint's way, or none where the curve decides it.
 */
export type PipeAsset = { id: string; kind: "pipe"; sector: string; look: PipeLook; joints: Point[]; ways: (Way | null)[] };
export type RoadAsset = { id: string; kind: "road"; sector: string; look: RoadLook; joints: Point[]; ways: (Way | null)[] };
export type SkeletonAsset = PipeAsset | RoadAsset;
/**
 * A grove (World.md W89, T1, W91, W93; his: "I will give the inputs for density of the trees", "give me dimensions to
 * set and once I set the dimensions I should see that placeholder with that dimension", then "Trunk will have min and
 * max lenth - from 1m to 100m, color and bend radius. Flowers will now be Cube, Cylinder and Allium"): where its area's
 * middle stands, in whole metres from the middle of its sector's floor, and the height it was planted at over that
 * floor (`y`, W99: its trees stand on the ground of the open space there); its area (`area.ts`: its size, its corners and a
 * hollow); its trees' look (`tree.ts`: the trunk's colour and bend radius, the flower's shape and colours); its Spacing,
 * how far apart its trees stand in metres (W97, in place of W89's Density); the shortest and tallest a tree of it
 * stands, 1 to 100 m; and the seed they are scattered by. Its trees are drawn from these (`grove.ts`), so a change shows
 * at once; it is moved and removed whole.
 */
export type GroveAsset = { id: string; kind: "grove"; sector: string; at: readonly [x: number, z: number]; y: number; area: Area; look: TreeLook; spacing: number; heightFrom: number; heightTo: number; seed: number };
/** What a sector holds: blocks, and the elements placed in it (his: "inside sectors, I will place the elements"). */
export type Asset = BlockAsset | PlacedAsset | SkeletonAsset | GroveAsset;
/** Whether an asset is an element placed at one place (W73): a mountain, a tree or a human. */
export const isPlaced = (asset: Asset): asset is PlacedAsset => PLACED_KINDS.includes(asset.kind as PlacedKind);
/** Whether an asset is a grove (W89). */
export const isGrove = (asset: Asset): asset is GroveAsset => asset.kind === "grove";
/** Whether an asset is shaped by a skeleton (W84): a pipe or a road. */
export const isSkeleton = (asset: Asset): asset is SkeletonAsset => SKELETON_KINDS.includes(asset.kind as SkeletonKind);
/** Whether an asset is a block. */
export const isBlock = (asset: Asset): asset is BlockAsset => asset.kind === "block";

export type WorldData = { units: WorldUnit[]; assets: Asset[] };

/** A new block's colour: Sand, the ground's until there was none (mine). */
export const BLOCK_COLOUR = "#efe5e8";

/**
 * A new block (mine, W93): the default block as it always was, a metre square and a quarter metre high, so 100 × 100 ×
 * 25 cm, square to the world, in Sand, with the grain every block had until it had a texture.
 */
export const BLOCK_START: BlockShape = { size: [100, 100, 25], unit: "cm", rotation: [0, 0, 0], colour: BLOCK_COLOUR, texture: "grain" };

/** A sector kept from before sectors had a size (W81, mine): the whole world, which held everything built in it. */
const WHOLE: Dimensions = [SECTOR_MOST, SECTOR_MOST, SECTOR_MOST];

const isPlace = (value: unknown): value is Place => Array.isArray(value) && value.length === 3 && value.every(Number.isInteger);
/** A point as kept, three finite numbers, or none. */
const pointOf = (value: unknown): Point | null => (Array.isArray(value) && value.length === 3 && value.every(Number.isFinite) ? [value[0], value[1], value[2]] : null);
/** A way as kept, a turn and a tilt in degrees, or none: the curve decides. */
const wayFrom = (value: unknown): Way | null =>
  Array.isArray(value) && value.length === 2 && value.every(Number.isFinite) ? [((value[0] % 360) + 360) % 360, Math.max(-90, Math.min(90, value[1]))] : null;
const isSize = (value: unknown): value is Size =>
  Array.isArray(value) && value.length === 3 && value.every((n) => Number.isInteger(n) && n >= 1 && n <= SIZE_MOST);
const isDimensions = (value: unknown): value is Dimensions =>
  Array.isArray(value) && value.length === 3 && value.every((n) => Number.isInteger(n) && n >= SECTOR_LEAST && n <= SECTOR_MOST);
/** A size each way in a unit, held within 1 to 100, a whole number. */
const blockSizeOf = (value: unknown): Size | null =>
  Array.isArray(value) && value.length === 3 && value.every(Number.isFinite) ? (value.map((n) => Math.max(BLOCK_LEAST, Math.min(BLOCK_MOST, Math.round(n)))) as unknown as Size) : null;
/** A rotation as kept, each way in whole degrees from −180 to 180. */
export const rotationOf = (value: unknown): Rotation =>
  Array.isArray(value) && value.length === 3 && value.every(Number.isFinite) ? (value.map(degreesOf) as unknown as Rotation) : [0, 0, 0];
/** An angle in whole degrees, from −180 (exclusive) to 180. */
export function degreesOf(angle: number): number {
  const turned = ((Math.round(angle) % 360) + 360) % 360;
  return turned > 180 ? turned - 360 : turned;
}

function plus(a: Place, b: Place): Place {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
function minus(a: Place, b: Place): Place {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
/** A metre to the millimetre: what a block's place is kept to, so a block of whole centimetres stands flush where it is put. */
const toMillimetre = (value: number) => Math.round(value * 1000) / 1000;

/**
 * A block kept before W93, on the lattice: its north-west bottom corner and its size, a multiple of the default block
 * each way (W4: a metre across, a quarter metre up). It reads as the same block where it can be: in centimetres where it
 * is a metre or less every way (the default block, 100 × 100 × 25 cm), else in whole metres, its height rounded to the
 * nearest metre (at least one), standing on the floor it stood on; square to the world, in its colour, grained.
 */
function latticeBlock(at: Place, size: Size): Pick<BlockAsset, "at" | "size" | "unit"> {
  const [x, y, z] = metresOf(at);
  const metres = [size[0] * BASE_BLOCK.width, size[1] * BASE_BLOCK.length, size[2] * BASE_BLOCK.height];
  const fine = metres.every((value) => value <= 1);
  const kept = (fine ? metres.map((value) => Math.round(value * 100)) : metres.map((value) => Math.max(1, Math.round(value)))) as unknown as Size;
  const [width, length, height] = blockMetres(kept, fine ? "cm" : "m");
  return { at: [x + width / 2, y + height / 2, z + length / 2], size: kept, unit: fine ? "cm" : "m" };
}

/**
 * The world as kept (a browser's store, a paste, the database), as it is built on, or nothing where it has no sector.
 * Every sector stands where it stood: one kept before W81, under a habitat and an ecosystem, at its origin in the world
 * (their places added to its own), the whole world in size. What a zone held (W81 to W90) is its sector's now (W91),
 * standing where it stood (a zone's own place, gone with W81, added to its assets'); a grove kept in a zone with a shape
 * (W89) takes that shape as its area, one in a zone without one its sector's whole floor. A block kept on the lattice
 * reads as the same block (`latticeBlock`, W93); a pipe, a road or a grove kept with variants in its variant's look, a
 * grove its first's; a portal kept is let go (W93). Each id once.
 */
function mended(kept: unknown): WorldData | null {
  if (!kept || typeof kept !== "object") return null;
  const { units, assets } = kept as { units?: unknown; assets?: unknown };
  type Kept = { id: string; kind: string; name: string; parent: string | null; at: Place; size: unknown; shape: unknown };
  const all = new Map<string, Kept>();
  for (const unit of Array.isArray(units) ? units : []) {
    if (!unit || typeof unit !== "object") continue;
    const { id, kind, name, parent, at, size, shape } = unit as Record<string, unknown>;
    if (typeof id !== "string" || all.has(id) || typeof kind !== "string" || typeof name !== "string") continue;
    if (parent !== null && parent !== undefined && typeof parent !== "string") continue;
    if (at !== undefined && !isPlace(at)) continue;
    all.set(id, { id, kind, name, parent: parent ?? null, at: at ?? [0, 0, 0], size, shape });
  }
  // Where a unit stood in the world: its place added to every place above it (W25's "relative"), whatever their kind.
  const originOf = (id: string): Place => {
    let place: Place = [0, 0, 0];
    const seen = new Set<string>();
    for (let unit = all.get(id); unit && !seen.has(unit.id); unit = unit.parent ? all.get(unit.parent) : undefined) {
      seen.add(unit.id);
      place = plus(place, unit.at);
    }
    return place;
  };

  // The sectors in the order kept, so a world read again is the same world.
  const held: Sector[] = [];
  for (const unit of all.values()) {
    if (unit.kind === "sector") held.push({ id: unit.id, kind: "sector", name: unit.name, parent: null, at: originOf(unit.id), size: isDimensions(unit.size) ? unit.size : WHOLE });
  }
  if (!held.length) return null;
  const sectorIds = new Set(held.map((sector) => sector.id));
  /**
   * Where an asset kept under a unit goes: a sector's stays; a zone's (W81 to W90) goes to its sector, moved by the
   * zone's own old place so it stands where it stood; a zone's shape (W89) kept for its groves.
   */
  const homes = new Map<string, { sector: string; shift: Place; shape: unknown }>();
  for (const id of sectorIds) homes.set(id, { sector: id, shift: [0, 0, 0], shape: null });
  for (const unit of all.values()) {
    if (unit.kind === "zone" && unit.parent && sectorIds.has(unit.parent)) homes.set(unit.id, { sector: unit.parent, shift: unit.at, shape: unit.shape });
  }

  const ids = new Set<string>();
  const assetsHeld: Asset[] = [];
  for (const asset of Array.isArray(assets) ? assets : []) {
    if (!asset || typeof asset !== "object") continue;
    const kept = asset as Record<string, unknown>;
    const { id, kind, at, size, colour, variant, turn, seed, joints, ways } = kept;
    const under = typeof kept.sector === "string" ? kept.sector : kept.zone;
    const home = typeof under === "string" ? homes.get(under) : undefined;
    if (typeof id !== "string" || ids.has(id) || !home) continue;
    const { sector, shift } = home;
    const [sx, sy, sz] = metresOf(shift);
    if (kind === "grove") {
      // A grove (W89, W91, W93): its place and area, or its zone's shape (W89), or its sector's whole floor; its look and numbers.
      const grove = groveFrom(kept, home.shape, held.find((one) => one.id === sector)!);
      if (!grove) continue;
      ids.add(id);
      assetsHeld.push({ id, kind: "grove", sector, ...grove });
      continue;
    }
    if (SKELETON_KINDS.includes(kind as SkeletonKind)) {
      // A pipe or a road (W84, W87, W93): two joints or more, each three numbers in metres from its sector's floor (one
      // kept before W87 on the lattice, [x, z, level], read as metres), their ways, and its look, its own or its variant's.
      if (!Array.isArray(joints) || joints.length < 2) continue;
      const metres = Array.isArray(ways) ? (joints as unknown[]).map(pointOf) : joints.every(isPlace) ? (joints as Place[]).map(([x, z, level]) => [x, level * BASE_BLOCK.height, z] as const) : [];
      if (metres.length !== joints.length || metres.some((point) => !point)) continue;
      const moved = (metres as Point[]).map(([x, y, z]) => [x + sx, y + sy, z + sz] as const);
      const shaped = { joints: moved, ways: waysFor(moved, Array.isArray(ways) ? (ways as unknown[]).map(wayFrom) : undefined) };
      ids.add(id);
      if (kind === "pipe") assetsHeld.push({ id, kind: "pipe", sector, look: pipeLookOf(kept.look) ?? pipeLookOfVariant(variant), ...shaped });
      else assetsHeld.push({ id, kind: "road", sector, look: roadLookOf(kept.look) ?? roadLookOfVariant(variant), ...shaped });
      continue;
    }
    if (kind === "block") {
      if (typeof colour !== "string") continue;
      if (typeof kept.unit === "string") {
        // A block of W93: its middle in metres, its size in its unit, its rotation and texture.
        const middle = pointOf(at);
        const sized = blockSizeOf(size);
        if (!middle || !sized) continue;
        ids.add(id);
        const cuts = Array.isArray(kept.cuts) ? kept.cuts.filter((cut): cut is string => typeof cut === "string") : [];
        assetsHeld.push({ id, kind, sector, at: [middle[0] + sx, middle[1] + sy, middle[2] + sz], size: sized, unit: kept.unit === "m" ? "m" : "cm", rotation: rotationOf(kept.rotation), colour, texture: kept.texture === "smooth" ? "smooth" : "grain", ...(cuts.length ? { cuts } : {}) });
      } else {
        if (!isPlace(at) || !isSize(size)) continue;
        ids.add(id);
        assetsHeld.push({ id, kind, sector, ...latticeBlock(plus(at, shift), size), rotation: [0, 0, 0], colour, texture: "grain" });
      }
      continue;
    }
    if (!isPlace(at)) continue;
    const place = plus(at, shift);
    if (PLACED_KINDS.includes(kind as PlacedKind)) {
      // The grove of W71 is gone (W88; his: "remove all the trees currently placed"), from every world kept before.
      if (kind === "tree" && variant === GROVE_W71_VARIANT && GROVE_W71.has(`${at[0]},${at[1]},${seed}`)) continue;
      // A placed element (W73): its variant by id, its turn in degrees, its seed a whole number; a tree its own look (its
      // variant's, W93), height and colour (W86).
      if (typeof variant !== "string" || typeof turn !== "number" || !Number.isFinite(turn)) continue;
      ids.add(id);
      const own = kind === "tree" ? treeOwnOf(kept, variant, Number.isInteger(seed) ? (seed as number) : 0) : {};
      assetsHeld.push({ id, kind: kind as PlacedKind, sector, at: place, variant, turn: ((turn % 360) + 360) % 360, seed: Number.isInteger(seed) ? (seed as number) : 0, ...own });
    }
  }
  // A cut by a pipe no longer kept is let go (W95).
  const pipes = new Set(assetsHeld.filter((asset) => asset.kind === "pipe").map((asset) => asset.id));
  return { units: held, assets: withoutCutsBy(assetsHeld, (cut) => !pipes.has(cut)) };
}

/**
 * A tree placed alone (W73 to W88) as kept: its look, its own (W93) or its variant's; its height, its own (W86) or as
 * its seed drew it from its variant's Length (version 4's first draw); and its own colour where it was given one.
 */
function treeOwnOf(kept: Record<string, unknown>, variant: string, seed: number): Pick<PlacedAsset, "look" | "height" | "colour"> {
  const look = treeLookOf(kept.look) ?? lookOfVariantId(variant);
  const { height, colour } = kept;
  let drawn = height;
  if (typeof drawn !== "number" || !Number.isFinite(drawn) || drawn <= 0) {
    const [from, to] = lengthsOfVariantId(variant);
    const first = ((Math.imul((Math.round(seed) >>> 0) || 1, 1664525) + 1013904223) >>> 0) / 4294967296;
    drawn = from + first * (to - from);
  }
  return {
    look,
    height: Math.max(TRUNK_LENGTH.least, Math.min(TRUNK_LENGTH.most, drawn as number)),
    ...(typeof colour === "string" && /^#[0-9a-f]{6}$/i.test(colour) ? { colour } : {}),
  };
}

/** The world as kept, as it is built on (`mended`); one with no sector starts again, from his published world. */
export const worldOf = (kept: unknown): WorldData => mended(kept) ?? WORLD_START;

export const unitOf = (world: WorldData, id: string): WorldUnit | undefined => world.units.find((unit) => unit.id === id);
/** The world's sectors, in the order made. */
export const sectorsOf = (world: WorldData): Sector[] => world.units;
/** What a sector holds, in the order placed. */
export const assetsOf = (world: WorldData, sector: string): Asset[] => world.assets.filter((asset) => asset.sector === sector);

/** A sector by its id, or the first, for an id that is gone. */
export function sectorOf(world: WorldData, id: string): Sector {
  return unitOf(world, id) ?? world.units[0];
}

/** Every sector's origin in the world: its place, where what it holds stands from. */
export function originsOf(world: WorldData): Map<string, Place> {
  return new Map(world.units.map((sector) => [sector.id, sector.at]));
}

/** A sector's room in the world, in metres, x y z: from its least corner to its greatest, round the middle of its floor. */
export type Room = { min: readonly [number, number, number]; max: readonly [number, number, number] };

export function roomOf(sector: Sector): Room {
  const [x, y, z] = metresOf(sector.at);
  const [width, length, height] = sector.size;
  return { min: [x - width / 2, y, z - length / 2], max: [x + width / 2, y + height, z + length / 2] };
}

/** Whether a sector stands inside the world (W29, W42): its floor's corners within the round, its floor on or over the floor, its top under the top. */
export function sectorInside(sector: Sector, size: WorldSize): boolean {
  const { min, max } = roomOf(sector);
  const far = Math.hypot(Math.max(Math.abs(min[0]), Math.abs(max[0])), Math.max(Math.abs(min[2]), Math.abs(max[2])));
  return far <= size.diameter / 2 && min[1] >= 0 && max[1] <= size.height;
}

/** A block as the lattice had it until W93, where it stood in the world: kept for the frozen versions (`start-v12.ts`, `build-blocks-v4.ts`). */
export type Box = { id: string; sector: string; colour: string; from: Place; to: Place };

/** A block's width, length and height in metres, from its size in its unit. */
export const blockMetres = (size: Size, unit: BlockUnit): [width: number, length: number, height: number] => {
  const scale = unit === "cm" ? 0.01 : 1;
  return [size[0] * scale, size[1] * scale, size[2] * scale];
};

type Vec = readonly [number, number, number];

/**
 * A block where it stands in the world (W93): its middle in metres (x east, y up, z south), half its width, height and
 * length along its own axes (x, y, z as three.js has them), and those axes in the world, each a unit, as its rotation
 * turns them: round Y, then X, then Z of its own (three.js's order `YXZ`); and the pipes cut out of it (W95).
 */
export type Solid = { id: string; sector: string; colour: string; texture: BlockTexture; rotation: Rotation; centre: Vec; half: Vec; axes: readonly [Vec, Vec, Vec]; cuts?: readonly string[] };

/** A rotation's axes in the world (`YXZ`): where the block's own x, y and z point. */
export function axesOf([rx, ry, rz]: Rotation): [Vec, Vec, Vec] {
  const [x, y, z] = [rx, ry, rz].map((degrees) => (degrees * Math.PI) / 180);
  const [cx, sx, cy, sy, cz, sz] = [Math.cos(x), Math.sin(x), Math.cos(y), Math.sin(y), Math.cos(z), Math.sin(z)];
  return [
    [cy * cz + sy * sx * sz, cx * sz, -sy * cz + cy * sx * sz],
    [-cy * sz + sy * sx * cz, cx * cz, sy * sz + cy * sx * cz],
    [sy * cx, -sx, cy * cx],
  ];
}

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** How far a block reaches from its middle along a way (a unit): half its extent that way, whichever way it is turned. */
export const reachAlong = (shape: { half: Vec; axes: readonly [Vec, Vec, Vec] }, way: Vec) =>
  shape.axes.reduce((sum, axis, i) => sum + Math.abs(dot(axis, way)) * shape.half[i], 0);

/** A block's half sizes and axes, from its shape: what it reaches and how it is turned, wherever it stands. */
export function bodyOf(shape: Pick<BlockShape, "size" | "unit" | "rotation">): { half: Vec; axes: [Vec, Vec, Vec] } {
  const [width, length, height] = blockMetres(shape.size, shape.unit);
  return { half: [width / 2, height / 2, length / 2], axes: axesOf(shape.rotation) };
}

/** Every block where it stands in the world. */
export function solidsOf(world: WorldData): Solid[] {
  const origins = originsOf(world);
  return world.assets.flatMap((asset) => {
    if (!isBlock(asset)) return [];
    const origin = origins.get(asset.sector);
    if (!origin) return [];
    const [ox, oy, oz] = metresOf(origin);
    const { half, axes } = bodyOf(asset);
    return [{ id: asset.id, sector: asset.sector, colour: asset.colour, texture: asset.texture, rotation: asset.rotation, centre: [ox + asset.at[0], oy + asset.at[1], oz + asset.at[2]], half, axes, ...(asset.cuts ? { cuts: asset.cuts } : {}) }];
  });
}

/** A block's eight corners in the world. */
export function cornersOf(solid: Pick<Solid, "centre" | "half" | "axes">): Vec[] {
  const corners: Vec[] = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) {
    const signs = [a, b, c];
    corners.push([0, 1, 2].map((k) => solid.centre[k] + signs.reduce((sum, sign, i) => sum + sign * solid.half[i] * solid.axes[i][k], 0)) as unknown as Vec);
  }
  return corners;
}

/** Whether a block stands inside the world's boundaries (W29, W42): every corner within its round, on or over its floor, under its top. */
export function solidInside(solid: Solid, size: WorldSize): boolean {
  return cornersOf(solid).every(([x, y, z]) => Math.hypot(x, z) <= size.diameter / 2 + 1e-6 && y >= -1e-6 && y <= size.height + 1e-6);
}

/** Whether a point stands inside a block, `clear` metres round it counting as inside. */
export function insideSolid(solid: Pick<Solid, "centre" | "half" | "axes">, point: Vec, clear = 0): boolean {
  const apart: Vec = [point[0] - solid.centre[0], point[1] - solid.centre[1], point[2] - solid.centre[2]];
  return solid.axes.every((axis, i) => Math.abs(dot(apart, axis)) <= solid.half[i] + clear);
}

/** Where a ray from `origin` going `direction` (a unit) first meets a block, how far along, and the face's way out, in the world. */
function hitSolid(origin: Vec, direction: Vec, solid: Solid): { t: number; normal: Vec } | null {
  const apart: Vec = [origin[0] - solid.centre[0], origin[1] - solid.centre[1], origin[2] - solid.centre[2]];
  let near = -Infinity;
  let far = Infinity;
  let face = 0;
  let sign = 0;
  for (let i = 0; i < 3; i++) {
    const from = dot(apart, solid.axes[i]);
    const way = dot(direction, solid.axes[i]);
    if (Math.abs(way) < 1e-9) {
      if (Math.abs(from) > solid.half[i]) return null;
      continue;
    }
    const a = (-solid.half[i] - from) / way;
    const b = (solid.half[i] - from) / way;
    const enter = Math.min(a, b);
    if (enter > near) {
      near = enter;
      face = i;
      sign = way > 0 ? -1 : 1;
    }
    far = Math.min(far, Math.max(a, b));
  }
  if (near > far || far < 0 || near < 0) return null;
  const axis = solid.axes[face];
  return { t: near, normal: [axis[0] * sign, axis[1] * sign, axis[2] * sign] };
}

/** The block a ray meets first, its face's way out, in the world, and how far along the ray. */
export function solidUnder(origin: Vec, direction: Vec, solids: readonly Solid[]): { solid: Solid; normal: Vec; t: number } | null {
  let best: { solid: Solid; normal: Vec; t: number } | null = null;
  for (const solid of solids) {
    const hit = hitSolid(origin, direction, solid);
    if (hit && (!best || hit.t < best.t)) best = { solid, ...hit };
  }
  return best;
}

/**
 * Where a block would stand placed against a face (W93, mine): flush with it, its middle out along the face's way by
 * as far as the block reaches that way, however it is turned; on a face square to the world, its sides across the face
 * kept to its step (its corner on it, as the lattice kept a block's, W4), else where the point is, to the millimetre.
 * `point` and `normal` are in the world.
 */
export function landing(point: Vec, normal: Vec, body: { half: Vec; axes: readonly [Vec, Vec, Vec] }, step: number): Point {
  const out = reachAlong(body, normal);
  const centre = [point[0] + normal[0] * out, point[1] + normal[1] * out, point[2] + normal[2] * out];
  const square = normal.findIndex((n) => Math.abs(n) > 0.999);
  if (square < 0) return centre.map(toMillimetre) as unknown as Point;
  return centre.map((value, k) => {
    if (k === square) return toMillimetre(value);
    const reach = reachAlong(body, k === 0 ? [1, 0, 0] : k === 1 ? [0, 1, 0] : [0, 0, 1]);
    return toMillimetre(Math.round((value - reach) / step) * step + reach);
  }) as unknown as Point;
}

/** How far a block of a unit moves a step (mine, W93): a quarter metre, as the lattice moved up (W4), or a centimetre. */
export const stepOf = (unit: BlockUnit) => (unit === "cm" ? 0.01 : 0.25);

/** Whether two blocks share any room: no axis of either, nor any made of one of each, parts them (the separating axes). */
function overlap(a: Solid, b: Solid): boolean {
  const apart: Vec = [b.centre[0] - a.centre[0], b.centre[1] - a.centre[1], b.centre[2] - a.centre[2]];
  const ways: Vec[] = [...a.axes, ...b.axes];
  for (const u of a.axes) for (const v of b.axes) {
    const cross: Vec = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (Math.hypot(...cross) > 1e-6) ways.push(cross);
  }
  // A hair of room between two blocks face to face is not an overlap.
  return ways.every((way) => Math.abs(dot(apart, way)) < reachAlong(a, way) + reachAlong(b, way) - 1e-3 * Math.hypot(...way));
}

/**
 * The blocks that share room with another: a block placed or moved into another (his places are never refused; the card
 * says what overlaps).
 */
export function overlapsOf(solids: readonly Solid[]): Set<string> {
  const over = new Set<string>();
  for (let i = 0; i < solids.length; i++) {
    for (let j = i + 1; j < solids.length; j++) {
      const [a, b] = [solids[i], solids[j]];
      const reach = Math.hypot(...a.half) + Math.hypot(...b.half);
      if (Math.hypot(a.centre[0] - b.centre[0], a.centre[1] - b.centre[1], a.centre[2] - b.centre[2]) >= reach) continue;
      if (overlap(a, b)) over.add(a.id).add(b.id);
    }
  }
  return over;
}

/** Every step of the lattice a block fills, and which block fills it: the lattice's until W93, kept for the frozen blocks' builder. */
export function occupancyOf(boxes: readonly Box[]): Map<string, string> {
  const taken = new Map<string, string>();
  for (const box of boxes) {
    for (let x = box.from[0]; x < box.to[0]; x++)
      for (let z = box.from[1]; z < box.to[1]; z++)
        for (let level = box.from[2]; level < box.to[2]; level++) if (!taken.has(`${x},${z},${level}`)) taken.set(`${x},${z},${level}`, box.id);
  }
  return taken;
}

/** A placed element where it stands in the world (W73): the asset, and its place in metres, x east, y up, z south. */
export type Placed = { asset: PlacedAsset; x: number; y: number; z: number };

/** Every placed element where it stands in the world. */
export function placedOf(world: WorldData): Placed[] {
  const origins = originsOf(world);
  return world.assets.flatMap((asset) => {
    if (!isPlaced(asset)) return [];
    const origin = origins.get(asset.sector);
    if (!origin) return [];
    const [x, y, z] = metresOf(plus(origin, asset.at));
    return [{ asset, x, y, z }];
  });
}

/** A pipe or a road where it runs in the world (W84, W87): the asset, its joints in metres, x east, y up, z south, and their ways. */
export type Skeleton = { asset: SkeletonAsset; joints: [number, number, number][]; ways: (Way | null)[] };

/** Every pipe and road where it runs in the world. */
export function skeletonsOf(world: WorldData): Skeleton[] {
  const origins = originsOf(world);
  return world.assets.flatMap((asset) => {
    if (!isSkeleton(asset)) return [];
    const origin = origins.get(asset.sector);
    if (!origin) return [];
    const [ox, oy, oz] = metresOf(origin);
    return [{ asset, joints: asset.joints.map(([x, y, z]) => [x + ox, y + oy, z + oz]), ways: waysFor(asset.joints, asset.ways) }];
  });
}

/** A place in metres, as three.js has them: [x, y, z]. */
export const metresOf = ([x, z, level]: Place): [number, number, number] => [x * BASE_BLOCK.width, level * BASE_BLOCK.height, z * BASE_BLOCK.length];

/** A sector changed: the same world with its fields replaced. */
function withUnit(world: WorldData, id: string, next: Partial<Sector>): WorldData {
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

/**
 * A new sector (W81), named in turn ("Sector 2"), at a place in the world, the middle of its floor, of a size, a hundred
 * metres each way unless one is given (mine), with one default block at the middle of its floor (his, W24: "a default
 * created zone in a sector, with default setup of 1 block"; the block stays now the zone has gone, W91). Unless it is
 * given a place, it stands at the world's middle, or a metre further east at a time while its block would stand in one
 * already built (mine): its place is then set on the card.
 */
export function makeSector(world: WorldData, place?: Place, size: Dimensions = SECTOR_SIZE): { world: WorldData; id: string } {
  let at: Place = place ?? [0, 0, 0];
  const lift = blockMetres(BLOCK_START.size, BLOCK_START.unit)[2] / 2;
  if (!place) {
    const solids = solidsOf(world);
    const taken = (spot: Place) => {
      const [x, y, z] = metresOf(spot);
      return solids.some((solid) => insideSolid(solid, [x, y + lift, z], 0.5));
    };
    while (taken(at)) at = plus(at, [1, 0, 0]);
  }
  const id = nextId(world.units.map((unit) => unit.id), "sector");
  const sector: Sector = { id, kind: "sector", name: `Sector ${sectorsOf(world).length + 1}`, parent: null, at, size };
  return { world: withBlock({ ...world, units: [...world.units, sector] }, id, [0, lift, 0], BLOCK_START), id };
}

/** Why a sector cannot be deleted, if it cannot: the world keeps one. */
export function keptBecause(world: WorldData): string | null {
  return sectorsOf(world).length === 1 ? "The world keeps one sector" : null;
}

/** The world without a sector and everything in it; unchanged where it is kept (`keptBecause`). */
export function remove(world: WorldData, id: string): WorldData {
  if (!unitOf(world, id) || keptBecause(world)) return world;
  return { ...world, units: world.units.filter((unit) => unit.id !== id), assets: world.assets.filter((asset) => asset.sector !== id) };
}

export const rename = (world: WorldData, id: string, name: string) => withUnit(world, id, { name });

/** A sector placed and sized anew (W81): moving it moves everything in it with it; its place is never refused. */
export const withSector = (world: WorldData, id: string, change: { at?: Place; size?: Dimensions }) => withUnit(world, id, change);

/** The world with a block in a sector, its middle at a point from the middle of its floor, in metres. */
export function withBlock(world: WorldData, sector: string, at: Point, shape: BlockShape): WorldData {
  const id = nextId(world.assets.map((asset) => asset.id), "block");
  const block: BlockAsset = { id, kind: "block", sector, at: at.map(toMillimetre) as unknown as Point, size: [...shape.size], unit: shape.unit, rotation: [...shape.rotation], colour: shape.colour, texture: shape.texture };
  return { ...world, assets: [...world.assets, block] };
}

/** The world with a block placed into a sector, its middle at a point in the world, in metres, made the sector's. */
export function withBlockAt(world: WorldData, sector: string, worldAt: Point, shape: BlockShape): WorldData {
  const [ox, oy, oz] = metresOf(originsOf(world).get(sector) ?? [0, 0, 0]);
  return withBlock(world, sector, [worldAt[0] - ox, worldAt[1] - oy, worldAt[2] - oz], shape);
}

/** The world without an asset; a pipe removed is no longer cut out of any block (W95). */
export const withoutAsset = (world: WorldData, id: string): WorldData => withoutAssets(world, [id]);
/** The world without several assets: the blocks picked, removed together (World.md W24, Backspace). */
export const withoutAssets = (world: WorldData, ids: readonly string[]): WorldData => ({ ...world, assets: withoutCutsBy(world.assets.filter((asset) => !ids.includes(asset.id)), (cut) => ids.includes(cut)) });

/** A block with these cuts: none, and it is whole, with no `cuts` at all. */
function withCuts(block: BlockAsset, cuts: readonly string[]): BlockAsset {
  const whole: BlockAsset = { ...block };
  delete whole.cuts;
  return cuts.length ? { ...whole, cuts: [...cuts] } : whole;
}

/** The assets with every block's cuts that `gone` says of let go. */
function withoutCutsBy(assets: Asset[], gone: (cut: string) => boolean): Asset[] {
  return assets.map((asset) => (isBlock(asset) && asset.cuts?.some(gone) ? withCuts(asset, asset.cuts.filter((cut) => !gone(cut))) : asset));
}

/**
 * Blocks with a pipe subtracted from them, or put back whole of it (W95; his: "I need option to subtract while I
 * select two items at once using cmd"): each block keeps the rest of its cuts.
 */
export function withCut(world: WorldData, blocks: readonly string[], pipe: string, cut: boolean): WorldData {
  return {
    ...world,
    assets: world.assets.map((asset) => {
      if (!isBlock(asset) || !blocks.includes(asset.id)) return asset;
      const others = (asset.cuts ?? []).filter((id) => id !== pipe);
      return withCuts(asset, cut ? [...others, pipe] : others);
    }),
  };
}

/** A block by its id, where there is one and it is a block. */
export const blockOf = (world: WorldData, id: string | null): BlockAsset | undefined => {
  const asset = id ? world.assets.find((candidate) => candidate.id === id) : undefined;
  return asset && isBlock(asset) ? asset : undefined;
};

/**
 * Several blocks changed the same way (W24, W93: the blocks picked sized, turned, coloured or textured together): what
 * the card changed, each block keeping its own place. Its size and its place are never refused, as a unit's is not
 * (W25): the card says what overlaps, and a block outside the world's boundaries is not drawn.
 */
export function withBlocksChanged(world: WorldData, ids: readonly string[], change: Partial<BlockShape>): WorldData {
  return {
    ...world,
    assets: world.assets.map((asset) => (isBlock(asset) && ids.includes(asset.id) ? { ...asset, ...change } : asset)),
  };
}

/** Several blocks moved by the same metres, each keeping its place among the others: the blocks picked moved together. */
export function withBlocksMoved(world: WorldData, ids: readonly string[], by: Point): WorldData {
  return {
    ...world,
    assets: world.assets.map((asset) => (isBlock(asset) && ids.includes(asset.id) ? { ...asset, at: asset.at.map((value, k) => toMillimetre(value + by[k])) as unknown as Point } : asset)),
  };
}

/** Blocks each put where a turn takes it, turned (W93, R): its middle in the world, in metres, made its sector's, and its rotation. */
export function withBlocksTurned(world: WorldData, turned: readonly { id: string; centre: Point; rotation: Rotation }[]): WorldData {
  const origins = originsOf(world);
  return {
    ...world,
    assets: world.assets.map((asset) => {
      const to = isBlock(asset) ? turned.find((one) => one.id === asset.id) : undefined;
      if (!to || !isBlock(asset)) return asset;
      const [ox, oy, oz] = metresOf(origins.get(asset.sector) ?? [0, 0, 0]);
      return { ...asset, at: [toMillimetre(to.centre[0] - ox), toMillimetre(to.centre[1] - oy), toMillimetre(to.centre[2] - oz)], rotation: to.rotation.map(degreesOf) as unknown as Rotation };
    }),
  };
}

/** A place in the world, in metres over the floor (x east, z south), as the floor's lattice step under it, on a level. */
export const placeAt = ([x, z]: readonly [number, number], level = 0): Place => [Math.round(x / BASE_BLOCK.width), Math.round(z / BASE_BLOCK.length), level];

/** The world with an element placed into a sector (W73): at a place in the world, in metres, made the sector's; facing or leaning its way, with its seed. Its id is its kind's next. */
export function withPlacedAt(world: WorldData, sector: string, worldAt: readonly [number, number], kind: PlacedKind, variant: string, turn: number, seed: number, level = 0): { world: WorldData; id: string } {
  const origin = originsOf(world).get(sector) ?? [0, 0, 0];
  const id = nextId(world.assets.map((asset) => asset.id), kind);
  const asset: PlacedAsset = { id, kind, sector, at: minus(placeAt(worldAt, level), origin), variant, turn: ((turn % 360) + 360) % 360, seed };
  return { world: { ...world, assets: [...world.assets, asset] }, id };
}

/** A placed element with some of it changed: moved to a place in the world (metres), turned, given another variant, or, a tree placed alone, its look, height or colour. */
export function withPlaced(world: WorldData, id: string, change: { worldAt?: readonly [number, number]; level?: number; turn?: number; variant?: string; look?: TreeLook; height?: number; colour?: string }): WorldData {
  const origins = originsOf(world);
  return {
    ...world,
    assets: world.assets.map((asset) => {
      if (asset.id !== id || !isPlaced(asset)) return asset;
      const origin = origins.get(asset.sector) ?? [0, 0, 0];
      const at = change.worldAt ? minus(placeAt(change.worldAt, change.level ?? asset.at[2] + origin[2]), origin) : asset.at;
      const tree = asset.kind === "tree" ? { look: change.look ?? asset.look, height: change.height ?? asset.height, ...(change.colour ?? asset.colour ? { colour: change.colour ?? asset.colour } : {}) } : {};
      return { ...asset, at, turn: change.turn === undefined ? asset.turn : ((change.turn % 360) + 360) % 360, variant: change.variant ?? asset.variant, ...tree };
    }),
  };
}

/** A grove's numbers (W89, W91, W93): what it is but its id, kind and sector. */
export type GroveSettings = Omit<GroveAsset, "id" | "kind" | "sector">;

/** Spacing's least and most, in whole metres (W97, his range): a metre apart to fifty. */
export const SPACING_LEAST = 1;
export const SPACING_MOST = 50;

/** A Spacing held in its range, to the metre. */
export const spacingIn = (value: number) => Math.max(SPACING_LEAST, Math.min(SPACING_MOST, Math.round(value)));

/** The Spacing a grove kept with a Density (W89's trees a hectare) stood at (W97): a hectare shared between them. */
export const spacingOfDensity = (density: number) => spacingIn(100 / Math.sqrt(Math.max(1e-6, density)));

/**
 * A grove's numbers as kept, or none: its look (its own, W93, or its first variant's, read as kept before), a spacing in
 * its range (or, kept before W97, the one its density stood at), its heights within 1 to 100 m and a seed; its place
 * and area, or, a grove kept in a zone (W89), its zone's shape (`shape`) as its area, or its sector's whole floor.
 */
function groveFrom(kept: Record<string, unknown>, shape: unknown, sector: Sector): GroveSettings | null {
  const { variants, spacing, density, heightFrom, heightTo, seed, at, y, area } = kept;
  const look = treeLookOf(kept.look) ?? (Array.isArray(variants) && variants.length ? lookOfVariantId(variants[0]) : null);
  if (!look) return null;
  const apart = typeof spacing === "number" && Number.isFinite(spacing) ? spacingIn(spacing) : typeof density === "number" && Number.isFinite(density) ? spacingOfDensity(density) : null;
  if (apart === null || typeof heightFrom !== "number" || !Number.isFinite(heightFrom) || typeof heightTo !== "number" || !Number.isFinite(heightTo)) return null;
  const old = outlineFrom(shape);
  const place: readonly [number, number] = Array.isArray(at) && at.length === 2 && at.every(Number.isFinite) ? [Math.round(at[0]), Math.round(at[1])] : old ? [old.at[0], old.at[1]] : [0, 0];
  const kept2 = areaFrom(area) ?? (old ? { size: old.size, corners: old.corners, hollow: outlineFrom((shape as { hollow?: unknown }).hollow) } : { size: [sector.size[0], sector.size[1]] as const, corners: 0, hollow: null });
  const held = (value: number) => Math.max(TRUNK_LENGTH.least, Math.min(TRUNK_LENGTH.most, value));
  const low = held(Math.min(heightFrom, heightTo));
  return {
    at: place,
    // A grove kept before W99 was planted on its sector's floor.
    y: typeof y === "number" && Number.isFinite(y) ? toMillimetre(Math.max(0, y)) : 0,
    area: kept2,
    look,
    spacing: apart,
    heightFrom: low,
    heightTo: Math.max(low, held(Math.max(heightFrom, heightTo))),
    seed: Number.isInteger(seed) ? (seed as number) : 1,
  };
}

/**
 * The world with a grove placed into a sector (W89, W91, W99): its area's middle at a place in the world, in metres,
 * made the sector's, to the metre, planted at a height in the world (where the pointer met its middle), made its height
 * over the sector's floor.
 */
export function withGroveAt(world: WorldData, sector: string, worldAt: readonly [number, number], height: number, grove: Omit<GroveSettings, "at" | "y">): { world: WorldData; id: string } {
  const [ox, oy, oz] = metresOf(originsOf(world).get(sector) ?? [0, 0, 0]);
  const id = nextId(world.assets.map((asset) => asset.id), "grove");
  const at: readonly [number, number] = [Math.round(worldAt[0] - ox), Math.round(worldAt[1] - oz)];
  const y = toMillimetre(Math.max(0, height - oy));
  return { world: { ...world, assets: [...world.assets, { id, kind: "grove", sector, at, y, ...grove, look: { ...grove.look, colours: [...grove.look.colours] } }] }, id };
}

/** A grove with some of its numbers changed (W89, W91, W93): its trees are drawn again from them, at once. */
export function withGrove(world: WorldData, id: string, change: Partial<GroveSettings>): WorldData {
  return { ...world, assets: world.assets.map((asset) => (asset.id === id && isGrove(asset) ? { ...asset, ...change } : asset)) };
}

/** A grove by its id, where there is one. */
export const groveOf = (world: WorldData, id: string | null): GroveAsset | undefined => {
  const asset = id ? world.assets.find((candidate) => candidate.id === id) : undefined;
  return asset && isGrove(asset) ? asset : undefined;
};

/** A point in the world, in metres, as its sector keeps it: from the middle of its floor, a quarter metre a step. */
const keptFrom = (origin: Place, point: Point): Point => {
  const [ox, oy, oz] = metresOf(origin);
  return onLattice([point[0] - ox, point[1] - oy, point[2] - oz]);
};

/** A pipe's or a road's look, by its kind. */
export type SkeletonLook<K extends SkeletonKind> = K extends "pipe" ? PipeLook : RoadLook;

/**
 * The world with a pipe or a road placed into a sector (W84, W87, W93): its joints, points in the world in metres from
 * its start to its end, and their ways (none where the curve decides), made the sector's, in its own look. Its id is its
 * kind's next.
 */
export function withSkeletonAt(world: WorldData, sector: string, joints: readonly Point[], ways: readonly (Way | null)[], drawn: { kind: "pipe"; look: PipeLook } | { kind: "road"; look: RoadLook }): { world: WorldData; id: string } {
  const origin = originsOf(world).get(sector) ?? [0, 0, 0];
  const id = nextId(world.assets.map((asset) => asset.id), drawn.kind);
  const kept = joints.map((joint) => keptFrom(origin, joint));
  const asset: SkeletonAsset = drawn.kind === "pipe"
    ? { id, kind: "pipe", sector, look: { ...drawn.look }, joints: kept, ways: waysFor(joints, ways) }
    : { id, kind: "road", sector, look: { ...drawn.look }, joints: kept, ways: waysFor(joints, ways) };
  return { world: { ...world, assets: [...world.assets, asset] }, id };
}

/** A pipe or a road with its skeleton reshaped (its joints points in the world in metres, and their ways), or given another look. */
export function withSkeleton(world: WorldData, id: string, change: { joints?: readonly Point[]; ways?: readonly (Way | null)[]; look?: Partial<PipeLook> | Partial<RoadLook> }): WorldData {
  const origins = originsOf(world);
  return {
    ...world,
    assets: world.assets.map((asset): Asset => {
      if (asset.id !== id || !isSkeleton(asset)) return asset;
      const origin = origins.get(asset.sector) ?? [0, 0, 0];
      const joints = change.joints && change.joints.length >= 2 ? change.joints.map((joint) => keptFrom(origin, joint)) : asset.joints;
      const ways = waysFor(joints, change.ways ?? asset.ways);
      return asset.kind === "pipe"
        ? { ...asset, joints, ways, look: { ...asset.look, ...(change.look as Partial<PipeLook> | undefined) } }
        : { ...asset, joints, ways, look: { ...asset.look, ...(change.look as Partial<RoadLook> | undefined) } };
    }),
  };
}

/** What Copy sends of the world (W25, W73, W81, W91): each sector, its place and size, and how many blocks, elements and groves it holds; then the data. */
export function worldLines(world: WorldData): string[] {
  const lines: string[] = [];
  for (const sector of sectorsOf(world)) {
    const [x, y, z] = metresOf(sector.at);
    const own = assetsOf(world, sector.id);
    const blocks = own.filter(isBlock).length;
    const groves = own.filter(isGrove).length;
    const elements = own.length - blocks - groves;
    lines.push(`${sector.name} (sector) at x ${x}, y ${y}, z ${z} m, ${sector.size.join(" × ")} m; ${blocks} ${blocks === 1 ? "block" : "blocks"}, ${elements} ${elements === 1 ? "element" : "elements"}, ${groves} ${groves === 1 ? "grove" : "groves"}`);
  }
  return [...lines, `World JSON: ${JSON.stringify(world)}`];
}

/**
 * The world as it starts: his published world, copied into code (`published.ts`, World.md W73), as it is built on now
 * (W81, W91, W93): one sector, the whole world, at its middle, holding the start's block and the mountains placed when
 * placing began. Without a copy, one sector of its own.
 */
export const WORLD_START: WorldData = mended(PUBLISHED_WORLD.settings) ?? makeSector({ units: [], assets: [] }, [0, 0, 0], WHOLE).world;
