import { COLOURS } from "./colours";
import type { Jig, JigControl } from "./jig";
import { BLOCK_COLOUR, SIZE_MOST } from "./hierarchy";
import { BASE_BLOCK } from "./orbit";

/**
 * The sector's builder, version 4 (World.md W4, W24, W25): where the world's hierarchy is built, its ecosystems,
 * habitats, sectors and zones, and blocks into its zones. Version 3 (`sector-v3.ts`) is frozen; his notes on it, the
 * decisions of W4 and W25: a block 1 × 1 × 0.25 m, its width, length and height each 1 to 10 times that, its own colour
 * ("Drop it", a zone's), the sector's entry a zone of one block, an entry a pointer ("Pointer"), and every unit's
 * coordinates his, relative to what holds it ("Let's go relative").
 *
 * What is built is kept apart from how it is tuned and how it is being built (W25): the world's data is `hierarchy.ts`
 * (`worldStore`), this jig's settings are its tuning alone, the grain (Reset puts it back, and never touches what is
 * built), and the builder's state is `BuildState` (`buildStore`). Nothing here is three.js.
 */
export const SECTOR_VERSION = 4;

/** The grain of every block: how much it darkens and lightens a colour (0 smooth), and how fine, in metres. */
export type SectorConfig = { grain: number; grainSize: number };

export const SECTOR_START: SectorConfig = { grain: 0.1, grainSize: 0.06 };

/**
 * How blocks are being built (W25: the builder's state, neither what is built nor its tuning): the zone built into, the
 * tool, the level placed on (in the zone's levels), and the next block's size, multiples of the default, and colour.
 */
export type BuildState = { zone: string; tool: string; level: number; width: number; length: number; height: number; colour: string };

/** Building starts in the start's entry zone, on its origin's level, a default block of Sand (mine). */
export const BUILD_START: BuildState = { zone: "zone-1", tool: "place", level: 0, width: 1, length: 1, height: 1, colour: BLOCK_COLOUR };

/** The next block's size in metres, as the card says it: 2 × 1 × 0.5 m. */
export const sizeInMetres = (build: BuildState) =>
  `${build.width * BASE_BLOCK.width} × ${build.length * BASE_BLOCK.length} × ${build.height * BASE_BLOCK.height} m`;

/** A level's height over a zone's origin, in metres. */
export const levelInMetres = (level: number) => level * BASE_BLOCK.height;

/** The builder's controls (his: "length, width, height, color are configurable"), drawn by the sector's card. */
export const BUILD_CONTROLS: readonly JigControl<BuildState>[] = [
  {
    kind: "choice",
    key: "tool",
    label: "Tool",
    options: [
      { value: "place", label: "Place" },
      { value: "remove", label: "Remove" },
    ],
  },
  // A level is the default block's height, 0.25 m, over the zone's origin: 99 nearly 25 m up.
  { kind: "number", key: "level", label: "Level", min: 0, max: 99, step: 1, marks: 10 },
  // Each way 1 to 10 times the default (his: "Example I can just set height to 1 (since it is 4x of default height)").
  { kind: "number", key: "width", label: "Width", min: 1, max: SIZE_MOST, step: 1, unit: "×" },
  { kind: "number", key: "length", label: "Length", min: 1, max: SIZE_MOST, step: 1, unit: "×" },
  { kind: "number", key: "height", label: "Height", min: 1, max: SIZE_MOST, step: 1, unit: "×" },
  { kind: "colour", key: "colour", label: "Colour", options: COLOURS },
];

/**
 * The sector's card (World.md W14): the hierarchy, a group a kind, and Build, drawn by its page from the world's data
 * and the builder's state (`sector-world.tsx`); then Grain, its own settings. Copy adds what is built (its page).
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
