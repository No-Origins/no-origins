import { COLOURS } from "./colours";
import type { Jig, JigControl } from "./jig";
import { BLOCK_COLOUR, SIZE_MOST, type Size } from "./hierarchy";
import { BASE_BLOCK } from "./orbit";

/**
 * The sector's builder, version 5 (World.md W4, W24, W25): where the world's hierarchy is built, its ecosystems,
 * habitats, sectors and zones, and blocks into its zones, and where a block already built is edited. Version 4
 * (`sector-v4.ts`) is frozen; version 5 adds Select (his, 2026-10-15: "Along with Place and Remove option in Sector
 * Page, add Select option too, so that I can edit the existing items"; then "We should be able to do multi-select",
 * and the Remove tool goes, "I can select and then use backspace"): a click picks a block, Shift-click more, the
 * card's Picked group moves, sizes and colours them together, and Backspace removes them. His notes on version 3,
 * the decisions of W4 and W25, stand: a block
 * 1 × 1 × 0.25 m, its width, length and height each 1 to 10 times that, its own colour ("Drop it", a zone's), the
 * sector's entry a zone of one block, an entry a pointer ("Pointer"), and every unit's coordinates his, relative to what
 * holds it ("Let's go relative").
 *
 * Frozen: he has seen it, and nothing draws it. Its page went with W81 (his, 2026-10-15: "Let's remove sector from
 * elements and create another section called Spaces"): Spaces' Sectors page is `spaces.ts`, where a sector has a place
 * and a size and holds zones, with no ecosystem or habitat over it. It still reads the hierarchy's block types.
 *
 * What is built is kept apart from how it is tuned and how it is being built (W25): the world's data is `hierarchy.ts`
 * (`worldStore`), this jig's settings are its tuning alone, the grain (Reset puts it back, and never touches what is
 * built), and the builder's state is `BuildState` (`buildStore`). Nothing here is three.js.
 */
export const SECTOR_VERSION = 5;

/** The grain of every block: how much it darkens and lightens a colour (0 smooth), and how fine, in metres. */
export type SectorConfig = { grain: number; grainSize: number };

export const SECTOR_START: SectorConfig = { grain: 0.1, grainSize: 0.06 };

/** A block's shape, as the card sets it: its size, multiples of the default each way, and its colour. */
export type BlockShape = { width: number; length: number; height: number; colour: string };

/**
 * How blocks are being built (W25: the builder's state, neither what is built nor its tuning): the zone built into, the
 * tool (Place or Select), the level placed on (in the zone's levels), the next block's shape, and the blocks picked
 * with Select, in the order picked, the last the one whose values the card shows (let go on a reload, as the World
 * page's pick is).
 */
export type BuildState = BlockShape & { zone: string; tool: string; level: number; picked: string[] };

/** Building starts in the start's entry zone, on its origin's level, a default block of Sand, nothing picked (mine). */
export const BUILD_START: BuildState = { zone: "zone-1", tool: "place", level: 0, width: 1, length: 1, height: 1, colour: BLOCK_COLOUR, picked: [] };

/** A size in metres, as the card says it: 2 × 1 × 0.5 m. */
export const sizeOf = (size: Size) => `${size[0] * BASE_BLOCK.width} × ${size[1] * BASE_BLOCK.length} × ${size[2] * BASE_BLOCK.height} m`;

/** The next block's size in metres. */
export const sizeInMetres = (build: BuildState) => sizeOf([build.width, build.length, build.height]);

/** A level's height over a zone's origin, in metres. */
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

/** The builder's controls, drawn by the sector's card: the tool, the level, and the next block's shape. */
export const BUILD_CONTROLS: readonly JigControl<BuildState>[] = [
  {
    kind: "choice",
    key: "tool",
    label: "Tool",
    // Remove went (his: "I can select and then use backspace"): with Select, Backspace removes the blocks picked.
    options: [
      { value: "place", label: "Place" },
      { value: "select", label: "Select" },
    ],
  },
  // A level is the default block's height, 0.25 m, over the zone's origin: 99 nearly 25 m up.
  { kind: "number", key: "level", label: "Level", min: 0, max: 99, step: 1, marks: 10 },
  ...SHAPE_CONTROLS,
];

/**
 * The sector's card (World.md W14): the hierarchy, a group a kind, Build, and Picked, the blocks Select picked, all
 * drawn by its page from the world's data and the builder's state (`sector-world.tsx`); then Grain, its own settings.
 * Copy adds what is built (its page).
 */
export const SECTOR_JIG: Jig<SectorConfig> = {
  name: "Sector",
  version: SECTOR_VERSION,
  start: SECTOR_START,
  groups: [
    { title: "Ecosystem", controls: [] },
    { title: "Habitat", controls: [] },
    { title: "Sector", controls: [] },
    { title: "Zone", controls: [] },
    { title: "Build", controls: [] },
    { title: "Picked", controls: [] },
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
