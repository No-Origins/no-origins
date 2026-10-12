import { COLOURS } from "./colours";
import type { Jig } from "./jig";
import { blocksIn, keyOf, SECTOR_BLOCK, type Block } from "./orbit";

/**
 * The sector, version 3 (World.md W4, W24): a named group of zones, and always its entry zone, a floor of blocks the
 * sector is entered on. There is no plane any more. Version 1 was the plane (`sector-v1.ts`), version 2 the sector on a
 * plane with "zones" a metre across (`sector-v2.ts`); both are frozen. His notes on version 2: "Let's remove the plane
 * and instead of side, give me number of blocks", and, asked what he meant:
 *
 * - "A sector will have a base/entry floor which is made of N x N blocks. That will be the entry zone of the sector.
 *   Then, I can also create multiple zones in a sector. Each zone is a combination of blocks and many other assets
 *   later. So when creating anything from the level of zones and above, I should be able to name them. And then I
 *   should be able to group the items in it."
 * - "Each block will be 1m x 1m x 0.3m" (`SECTOR_BLOCK` in `orbit.ts`).
 *
 * This file is what the sector is, its jig, and how blocks are built into its zones, and nothing of three.js, so the
 * page's controls can read it without loading the world. `build-blocks.ts` makes its blocks.
 *
 * Frozen: he has seen it, and nothing draws it (`sector-zones-v3.tsx` was its zones, `build-blocks-sector-v3.ts` its
 * blocks). Version 4 is `sector.ts`: the hierarchy of World.md W25 (`hierarchy.ts`), a block's own size and colour, and
 * the entry a zone of one block.
 */
export const SECTOR_VERSION = 3;

/** A zone: its name, its colour, and the blocks built into it, each `[column, row, level]` on the blocks' lattice. */
export type SectorZone = { id: string; name: string; colour: string; blocks: Block[] };

export type SectorConfig = {
  /** What it is called (his: "I should be able to name them"). */
  name: string;
  /** The entry zone's floor: how many blocks to a side (his: "instead of side, give me number of blocks"). */
  floor: number;
  /** The grain of every block in it: how much it darkens and lightens a colour (0 smooth), and how fine, in metres. */
  grain: number;
  grainSize: number;
  /** Its zones, the entry first, and which one blocks are built into, by its id. */
  zones: SectorZone[];
  zone: string;
  /** How blocks are built: the tool, and the level placed on. */
  tool: string;
  level: number;
};

/** The top of the entry's floor, level 0's: where one stands in the sector, and where a portal is cut into it. */
export const FLOOR_TOP = SECTOR_BLOCK.height;

/** The entry zone's id: it is always there, and cannot be deleted. */
export const ENTRY = "entry";

/**
 * A new sector (mine, his to name and tune): a floor of 10 × 10 blocks, the least he set ("start from 10"), in Sand, the
 * ground's colour until now, and blocks built on it from level 1, its top.
 */
export const SECTOR_START: SectorConfig = {
  name: "Sector 1",
  floor: 10,
  grain: 0.1,
  grainSize: 0.06,
  zones: [{ id: ENTRY, name: "Entry", colour: "#efe5e8", blocks: [] }],
  zone: ENTRY,
  tool: "place",
  level: 1,
};

/** The colours a new zone takes in turn (mine), the first none of the sector's zones wears yet: each zone told apart. */
const ZONE_COLOURS = ["#f2bfa6", "#a7aae6", "#7ddde3", "#e6a3ad", "#b6c5b4", "#9caee5", "#ffdfbd", "#f7f1f2"];

/**
 * The entry zone's floor: `floor` blocks to a side on level 0, round the start; with an even count, the one more is to
 * the west and north, so the start's block is one of the middle four.
 */
export function floorOf(floor: number): Block[] {
  const count = Math.max(1, Math.round(floor));
  const from = -Math.floor(count / 2);
  const blocks: Block[] = [];
  for (let row = from; row < from + count; row++) for (let column = from; column < from + count; column++) blocks.push([column, row, 0]);
  return blocks;
}

/**
 * The zones as kept (a browser's store, a paste), as the world takes them: the entry first and always there, each with
 * a name and a colour, and its blocks whole numbers, each once.
 */
export function zonesOf(sector: SectorConfig): SectorZone[] {
  const kept = (Array.isArray(sector.zones) ? sector.zones : []).filter(
    (zone): zone is SectorZone => !!zone && typeof zone.id === "string" && typeof zone.name === "string" && typeof zone.colour === "string",
  );
  const zones = kept.map((zone) => ({ ...zone, blocks: blocksIn(zone.blocks, Infinity, SECTOR_BLOCK) }));
  const entry = zones.find((zone) => zone.id === ENTRY) ?? SECTOR_START.zones[0];
  return [entry, ...zones.filter((zone) => zone.id !== ENTRY)];
}

/** The zone blocks are built into: the one picked, or the entry, if that one is gone. */
export function zoneOf(sector: SectorConfig): SectorZone {
  const zones = zonesOf(sector);
  return zones.find((zone) => zone.id === sector.zone) ?? zones[0];
}

/**
 * Each zone's blocks as they stand: the entry's floor and what is built into it, then each zone's. A block stands once:
 * where the floor has grown under one, the floor's stands.
 */
export function standingOf(sector: SectorConfig): { zone: SectorZone; blocks: Block[] }[] {
  const taken = new Set<string>();
  const once = (blocks: Block[]) => blocks.filter((block) => !taken.has(keyOf(block)) && taken.add(keyOf(block)));
  const floor = once(floorOf(sector.floor));
  return zonesOf(sector).map((zone) => ({ zone, blocks: zone.id === ENTRY ? [...floor, ...once(zone.blocks)] : once(zone.blocks) }));
}

/** Every block built, which Remove may take away: the entry's floor is the sector's base, and stays. */
export function builtOf(sector: SectorConfig): Block[] {
  const floor = new Set(floorOf(sector.floor).map(keyOf));
  return zonesOf(sector).flatMap((zone) => zone.blocks.filter((block) => !floor.has(keyOf(block))));
}

/** The zones with a block built into the zone being built. */
export function withBlock(sector: SectorConfig, block: Block): SectorZone[] {
  const into = zoneOf(sector).id;
  return zonesOf(sector).map((zone) => (zone.id === into ? { ...zone, blocks: [...zone.blocks, block] } : zone));
}

/** The zones with a block taken away, from whichever zone it was built into. */
export function withoutBlock(sector: SectorConfig, block: Block): SectorZone[] {
  const key = keyOf(block);
  return zonesOf(sector).map((zone) => ({ ...zone, blocks: zone.blocks.filter((b) => keyOf(b) !== key) }));
}

/** A new zone, after the last: named in turn, in the next colour none of the zones wears yet, with no blocks. */
export function newZone(sector: SectorConfig): SectorZone {
  const zones = zonesOf(sector);
  const ids = new Set(zones.map((zone) => zone.id));
  let n = zones.length + 1;
  while (ids.has(`zone-${n}`)) n++;
  const worn = new Set(zones.map((zone) => zone.colour));
  const colour = ZONE_COLOURS.find((c) => !worn.has(c)) ?? ZONE_COLOURS[zones.length % ZONE_COLOURS.length];
  return { id: `zone-${n}`, name: `Zone ${n}`, colour, blocks: [] };
}

/** How many blocks a zone has: the entry counts its floor. */
export function countOf(sector: SectorConfig, zone: SectorZone): number {
  return standingOf(sector).find((standing) => standing.zone.id === zone.id)?.blocks.length ?? 0;
}

/** How high a level's floor stands over the ground, in metres: a block's height a level. */
const heightOf = (level: number) => Math.round(level * SECTOR_BLOCK.height * 100) / 100;

/** The sector's card (World.md W14): its controls, grouped as the card shows them; Zones is drawn by its page. */
export const SECTOR_JIG: Jig<SectorConfig> = {
  name: "Sector",
  version: SECTOR_VERSION,
  start: SECTOR_START,
  groups: [
    {
      title: "Sector",
      note: () => "A sector groups its zones, and always has its entry zone. The grain is every block's in it.",
      controls: [
        { kind: "text", key: "name", label: "Name" },
        { kind: "number", key: "grain", label: "Grain", min: 0, max: 0.5, step: 0.01, marks: 0.1 },
        { kind: "number", key: "grainSize", label: "Grain size", min: 0.02, max: 0.3, step: 0.01, marks: 0.07, unit: "m" },
      ],
    },
    {
      title: "Entry zone",
      note: (sector) =>
        `Where the sector is entered: a floor of ${sector.floor} × ${sector.floor} blocks at the start, each ${SECTOR_BLOCK.width} × ${SECTOR_BLOCK.length} × ${SECTOR_BLOCK.height} m, on level 0.`,
      controls: [{ kind: "number", key: "floor", label: "Blocks", min: 10, max: 100, step: 1, marks: 10 }],
    },
    {
      title: "Zones",
      note: (sector) => {
        const count = zonesOf(sector).length;
        return `${count} ${count === 1 ? "zone" : "zones"}. Each groups the blocks built into it. Pick the one to build into; name it and colour it.`;
      },
      controls: [],
    },
    {
      title: "Build",
      note: (sector) =>
        `Blocks go into ${zoneOf(sector).name}. Level ${sector.level} stands ${heightOf(sector.level)} m over the ground; the entry's floor is level 0. Click the world to ${
          sector.tool === "remove" ? "take away the block under the pointer (the floor stays)" : "place a block on the level or against a block"
        }; drag to look round, right-drag to move, the wheel to come nearer.`,
      controls: [
        {
          kind: "choice",
          key: "tool",
          label: "Tool",
          options: [
            { value: "place", label: "Place" },
            { value: "remove", label: "Remove" },
          ],
        },
        // A level is a block's height (0.3 m): 0 the entry's floor, 99 nearly 30 m over the ground.
        { kind: "number", key: "level", label: "Level", min: 0, max: 99, step: 1, marks: 10 },
      ],
    },
  ],
  // What has been built is sent back: each zone, its name and blocks (the entry's floor is its count, above).
  copy: (sector) => [
    ...zonesOf(sector).map((zone) => `${zone.name}: ${countOf(sector, zone)} blocks; built ${JSON.stringify(zone.blocks)}`),
    `Settings JSON: ${JSON.stringify(sector)}`,
  ],
};

/** The colours a zone may be: the world's (the root CLAUDE.md: every pick of a colour is a `ColourPicker`). */
export const ZONE_OPTIONS = COLOURS;
