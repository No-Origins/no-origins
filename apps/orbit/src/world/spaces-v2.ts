import { COLOURS } from "./colours";
import type { Jig, JigControl, NumberControl } from "./jig";
import { BLOCK_COLOUR, SECTOR_LEAST, SECTOR_MOST, SIZE_MOST, type Size } from "./hierarchy";
import { BASE_BLOCK } from "./orbit";
import { newHollow, OUTLINE_LEAST, type Outline } from "./area";

/** A zone's shape as version 2 had it (W89); zones went with W91. */
type ZoneShape = Outline & { hollow: Outline | null };

/**
 * The Sectors card, version 2, FROZEN: he has seen it, and version 3 (`spaces.ts`) answers W91 (his: "let's even remove
 * zones"). Nothing reads it.
 *
 * Spaces (World.md W81; his, 2026-10-15: "Let's remove sector from elements and create another section called Spaces.
 * So basically, spaces is where we will see the world, and I should be able to create spatial units - Zones and
 * Sectors"): the builder's section where the world's spatial units are made, its one page, Sectors, version 1. A sector
 * has a name, a place in the world and a size, its width, length and height each 50 to 1000 m; the camera goes to it
 * once it is made and wherever it is put; there its zones are made, each a name for the group of what is built and
 * placed into it, and blocks are built and elements placed into the zone picked, inside the sector alone (W82; his:
 * "we will not place anything in the world explicitly"). The world is seen as it is placed, the sectors drawn by their
 * edges. The Sector element it takes over, version 5, is frozen (`sector-v5.ts`).
 *
 * Version 2 (W89; his: "when I am placing that in the sector, the controls related to the element should be on the
 * right"): this card keeps where and what, the sector, the zone (now with its shape and its hollow) and Build's Tool and
 * Item; what the item takes, and what is picked, stand on the item's card on the right (`spaces-world.tsx`). Version 1
 * is frozen (`spaces-v1.ts`).
 *
 * What is built is kept apart from how it is tuned and how it is being built (W25): the world's data is `hierarchy.ts`
 * (`worldStore`), this jig's settings are its tuning alone, the blocks' grain (Reset puts it back, and never touches
 * what is built), and the builder's state is `BuildState` (`buildStore`). Nothing here is three.js.
 */
export const SPACES_VERSION = 2;

/** The grain of every block: how much it darkens and lightens a colour (0 smooth), and how fine, in metres. */
export type SpacesConfig = { grain: number; grainSize: number };

export const SPACES_START: SpacesConfig = { grain: 0.1, grainSize: 0.06 };

/** A block's shape, as the card sets it: its size, multiples of the default each way, and its colour. */
export type BlockShape = { width: number; length: number; height: number; colour: string };

/**
 * How a zone is being built into (W25: the builder's state, neither what is built nor its tuning): the zone (and so
 * its sector, the one picked), the tool (Place or Select), what Place puts in (`item`: a block, or a mountain, a tree or
 * a portal, W82), the level a block is placed on (over the sector's floor), the next block's shape, and the blocks
 * picked with Select, in the order picked, the last the one whose values the card shows (let go on a reload). Which
 * variant an element is placed of, the grove brush and the element picked are the placing's (`place.ts`).
 */
export type BuildState = BlockShape & { zone: string; tool: string; item: string; level: number; picked: string[] };

/** Building starts in the start's entry zone, placing blocks on its sector's floor, a default block of Sand, nothing picked (mine). */
export const BUILD_START: BuildState = { zone: "zone-1", tool: "place", item: "block", level: 0, width: 1, length: 1, height: 1, colour: BLOCK_COLOUR, picked: [] };

/**
 * What Place puts into the zone picked (W82): a block, or one of the elements (his: "group of items"); a pipe or a road
 * by its start and its end (W84); trees as a grove filling the zone, and a human (W89).
 */
export const ITEMS = [
  { value: "block", label: "Block" },
  { value: "mountain", label: "Mountain" },
  { value: "tree", label: "Trees" },
  { value: "portal", label: "Portal" },
  { value: "human", label: "Human" },
  { value: "pipe", label: "Pipe" },
  { value: "road", label: "Road" },
] as const;

/** A size in metres, as the card says it: 2 × 1 × 0.5 m. */
export const sizeOf = (size: Size) => `${size[0] * BASE_BLOCK.width} × ${size[1] * BASE_BLOCK.length} × ${size[2] * BASE_BLOCK.height} m`;

/** The next block's size in metres. */
export const sizeInMetres = (build: BuildState) => sizeOf([build.width, build.length, build.height]);

/** A level's height over a sector's floor, in metres. */
export const levelInMetres = (level: number) => level * BASE_BLOCK.height;

/**
 * A block's shape on the card (his: "length, width, height, color are configurable"): the next block's, under Build,
 * and the picked block's own, under Picked.
 */
export const SHAPE_CONTROLS: readonly JigControl<BlockShape>[] = [
  // Each way 1 to 10 times the default (his: "Example I can just set height to 1 (since it is 4x of default height)").
  { kind: "number", key: "width", label: "Width", min: 1, max: SIZE_MOST, step: 1, unit: "×" },
  { kind: "number", key: "length", label: "Length", min: 1, max: SIZE_MOST, step: 1, unit: "×" },
  { kind: "number", key: "height", label: "Height", min: 1, max: SIZE_MOST, step: 1, unit: "×" },
  { kind: "colour", key: "colour", label: "Colour", options: COLOURS },
];

/** The builder's tool (W24): Place puts the item in, Select picks what is there. */
export const TOOL_CONTROL: JigControl<BuildState> = {
  kind: "choice",
  key: "tool",
  label: "Tool",
  // Remove went (his: "I can select and then use backspace"): with Select, Backspace removes what is picked.
  options: [
    { value: "place", label: "Place" },
    { value: "select", label: "Select" },
  ],
};

/** What Place puts in (W82). */
export const ITEM_CONTROL: JigControl<BuildState> = { kind: "choice", key: "item", label: "Item", options: ITEMS };

/** A block's controls under Build: the level it is placed on, and its shape. */
export const BLOCK_CONTROLS: readonly JigControl<BuildState>[] = [
  // A level is the default block's height, 0.25 m, over the sector's floor: 99 nearly 25 m up.
  { kind: "number", key: "level", label: "Level", min: 0, max: 99, step: 1, marks: 10 },
  ...SHAPE_CONTROLS,
];

/** A sector's place and size on the card, in metres (W81): X and Z the middle of its floor, Y its floor; its width, length and height. */
export type SectorShape = { x: number; y: number; z: number; width: number; length: number; height: number };

/**
 * A sector's controls (W81; his: "I can have the control to set the sector width, length and height. Up to the maximum
 * of thousand meters. And minimum of 50 meters"). *Mine:* its place is the middle of its floor, X and Z anywhere over the
 * world's floor, a metre a step, Y from the floor up to where the least sector still fits under the clouds; its place
 * and its size are never refused, and the card says where it stands outside the world.
 */
export const SECTOR_CONTROLS: readonly JigControl<SectorShape>[] = [
  // A row a way (mine): where along it, and how far it reaches; east and west, north and south, up.
  { kind: "number", key: "x", label: "X", min: -500, max: 500, step: 1, marks: 100, unit: "m" },
  { kind: "number", key: "width", label: "Width", min: SECTOR_LEAST, max: SECTOR_MOST, step: 1, marks: 50, unit: "m" },
  { kind: "number", key: "z", label: "Z", min: -500, max: 500, step: 1, marks: 100, unit: "m" },
  { kind: "number", key: "length", label: "Length", min: SECTOR_LEAST, max: SECTOR_MOST, step: 1, marks: 50, unit: "m" },
  { kind: "number", key: "y", label: "Y", min: 0, max: SECTOR_MOST - SECTOR_LEAST, step: 1, marks: 50, unit: "m" },
  { kind: "number", key: "height", label: "Height", min: SECTOR_LEAST, max: SECTOR_MOST, step: 1, marks: 50, unit: "m" },
];

/**
 * A zone's shape on the card (W89), in metres from the middle of its sector's floor, its corners in hundredths: its
 * outline, and whether it has a hollow and the hollow's, from the zone's middle.
 */
export type ZoneShapeCard = { x: number; z: number; width: number; length: number; corners: number; hollow: boolean; hollowX: number; hollowZ: number; hollowWidth: number; hollowLength: number; hollowCorners: number };

/** A zone's shape as the card shows it. */
export function zoneShapeCard(shape: ZoneShape): ZoneShapeCard {
  const hollow = shape.hollow ?? newHollow(shape);
  return {
    x: shape.at[0], z: shape.at[1], width: shape.size[0], length: shape.size[1], corners: Math.round(shape.corners * 100),
    hollow: !!shape.hollow, hollowX: hollow.at[0], hollowZ: hollow.at[1], hollowWidth: hollow.size[0], hollowLength: hollow.size[1], hollowCorners: Math.round(hollow.corners * 100),
  };
}

/** The shape the card's values make; a hollow switched on starts at the zone's middle, half its size (`newHollow`). */
export function zoneShapeFromCard(card: ZoneShapeCard, was: ZoneShape): ZoneShape {
  const outline = { at: [card.x, card.z] as const, size: [Math.max(OUTLINE_LEAST, card.width), Math.max(OUTLINE_LEAST, card.length)] as const, corners: card.corners / 100 };
  if (!card.hollow) return { ...outline, hollow: null };
  if (!was.hollow) return { ...outline, hollow: newHollow(outline) };
  return { ...outline, hollow: { at: [card.hollowX, card.hollowZ], size: [Math.max(OUTLINE_LEAST, card.hollowWidth), Math.max(OUTLINE_LEAST, card.hollowLength)], corners: card.hollowCorners / 100 } };
}

/**
 * A zone's outline on the card (W89; his: "I need border radius for the zone, so that I can also make it like a pill or
 * a circle"), *mine*: X and Width, Z and Length, a row a way as a sector's are, X and Z its middle within its sector,
 * a metre a step, Width and Length a metre up to its sector's; and Corners, 0 square to 100% a pill (a circle where
 * Width and Length are equal).
 */
export function zoneControls(sector: readonly [width: number, length: number]): JigControl<ZoneShapeCard>[] {
  const across = (key: "x" | "z", label: string, size: number): JigControl<ZoneShapeCard> => ({ kind: "number", key, label, min: -Math.floor(size / 2), max: Math.floor(size / 2), step: 1, marks: size > 200 ? 100 : 10, unit: "m" });
  const along = (key: "width" | "length", label: string, size: number): JigControl<ZoneShapeCard> => ({ kind: "number", key, label, min: OUTLINE_LEAST, max: Math.max(OUTLINE_LEAST + 1, size), step: 1, marks: size > 200 ? 100 : 10, unit: "m" });
  return [across("x", "X", sector[0]), along("width", "Width", sector[0]), across("z", "Z", sector[1]), along("length", "Length", sector[1]), CORNERS];
}

const CORNERS: NumberControl<ZoneShapeCard> = { kind: "number", key: "corners", label: "Corners", min: 0, max: 100, step: 1, marks: 25, unit: "%" };

/** Whether the zone has a hollow (W89; his: "allowing me to create a hollow within the shape of the zone"). */
export const HOLLOW_SWITCH: JigControl<ZoneShapeCard> = { kind: "switch", key: "hollow", label: "Hollow" };

/** The hollow's own outline (W89, Z3): its middle from the zone's, anywhere in it, its size up to the zone's, its own Corners. */
export function hollowControls(zone: readonly [width: number, length: number]): JigControl<ZoneShapeCard>[] {
  const across = (key: "hollowX" | "hollowZ", label: string, size: number): JigControl<ZoneShapeCard> => ({ kind: "number", key, label, min: -Math.floor(size / 2), max: Math.floor(size / 2), step: 1, marks: size > 200 ? 100 : 10, unit: "m" });
  const along = (key: "hollowWidth" | "hollowLength", label: string, size: number): JigControl<ZoneShapeCard> => ({ kind: "number", key, label, min: OUTLINE_LEAST, max: Math.max(OUTLINE_LEAST + 1, size), step: 1, marks: size > 200 ? 100 : 10, unit: "m" });
  return [across("hollowX", "X", zone[0]), along("hollowWidth", "Width", zone[0]), across("hollowZ", "Z", zone[1]), along("hollowLength", "Length", zone[1]), { ...CORNERS, key: "hollowCorners" }];
}

/**
 * The Sectors card (World.md W81, W82, W89): the sector picked and the zone picked, with its shape, and Build's Tool and
 * Item, all drawn by its page from the world's data and the builder's state (`spaces-world.tsx`); then Grain, its own
 * settings. What the item takes and what is picked are the item's card's, on the right. Copy adds what is built.
 */
export const SPACES_JIG: Jig<SpacesConfig> = {
  name: "Sectors",
  version: SPACES_VERSION,
  start: SPACES_START,
  groups: [
    { title: "Sector", controls: [] },
    { title: "Zone", controls: [] },
    { title: "Build", controls: [] },
    {
      title: "Grain",
      note: () => "Every block's: how much it darkens and lightens its colour, and how fine.",
      controls: [
        { kind: "number", key: "grain", label: "Grain", min: 0, max: 0.5, step: 0.01, marks: 0.1 },
        { kind: "number", key: "grainSize", label: "Grain size", min: 0.02, max: 0.3, step: 0.01, marks: 0.07, unit: "m" },
      ],
    },
  ],
};
