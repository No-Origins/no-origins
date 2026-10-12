import { COLOURS } from "./colours";
import type { Jig } from "./jig";
import { PLANE_SIZE, SECTOR_BLOCK as ZONE, type Block } from "./orbit";

/**
 * The sector, version 2 (World.md W24): the ground the world stands on, an element with its own page. It was the plane
 * in version 1 (`sector-v1.ts`, frozen); his notes on it: "Instead of naming them plane, let's call it sector. A sector
 * is made of zones. And each zone will be … one meter width, one meter length, and 0.3 meters height. And I should be
 * able to select a level for zones so I should be able to place blocks for a zone at the level that is set."
 *
 * A square centred on the start, North −Z (W23), its surface a flat colour warmed by the environment's sunlight, with
 * mineral grain anchored to it; on it, the zones placed (`ZONE` in `orbit.ts`), on a lattice of their own, a level a
 * zone's height, built on its page as the environment's blocks are on the environment's.
 *
 * Frozen: he has seen it, and nothing draws it. Version 3 is `sector.ts`: on it, "zones" are blocks (his: "Each block
 * will be 1m x 1m x 0.3m"), and the plane is gone.
 */
export const SECTOR_VERSION = 2;

export type SectorConfig = {
  /** How far it reaches each way, in metres: the square's side (his: "a 1000 m × 1000 m plane", W23). */
  size: number;
  /** Its ground's colour, before the sunlight warms it. */
  colour: string;
  /** Its grain, the ground's and the zones': how much it darkens and lightens the colour (0 smooth), and how fine, in metres. */
  grain: number;
  grainSize: number;
  /** The zones' colour, every zone placed, as [column, row, level], and how they are built: the tool, and the level placed on. */
  zoneColour: string;
  zones: Block[];
  tool: string;
  level: number;
};

/**
 * The sector as the plane was (mine, his to tune), with no zones yet: his size, and the blocks' colour and grain, so the
 * ground still reads as one surface with the blocks. Zones start Cream (mine), a shade off the ground, so each reads.
 */
export const SECTOR_START: SectorConfig = {
  size: PLANE_SIZE,
  colour: "#efe5e8",
  grain: 0.1,
  grainSize: 0.06,
  zoneColour: "#f7f1f2",
  zones: [],
  tool: "place",
  level: 0,
};

/** How high a level's floor stands over the ground, in metres: a zone's height a level. */
const floorOf = (level: number) => Math.round(level * ZONE.height * 100) / 100;

/** The sector's card (World.md W14): its controls, grouped as the card shows them. */
export const SECTOR_JIG: Jig<SectorConfig> = {
  name: "Sector",
  version: SECTOR_VERSION,
  start: SECTOR_START,
  groups: [
    {
      title: "Size",
      note: (sector) => `${sector.size} × ${sector.size} m, centred on the start; North is −Z. Zones, blocks and every camera stay inside it.`,
      controls: [{ kind: "number", key: "size", label: "Side", min: 200, max: 2000, step: 10, marks: 200, unit: "m" }],
    },
    {
      title: "Surface",
      note: () => "The environment's sunlight warms the colour. The grain stays on the ground and the zones as you move.",
      controls: [
        { kind: "colour", key: "colour", label: "Colour", options: COLOURS },
        { kind: "number", key: "grain", label: "Grain", min: 0, max: 0.5, step: 0.01, marks: 0.1 },
        { kind: "number", key: "grainSize", label: "Grain size", min: 0.02, max: 0.3, step: 0.01, marks: 0.07, unit: "m" },
      ],
    },
    {
      title: "Zones",
      note: (sector) =>
        `${sector.zones.length} ${sector.zones.length === 1 ? "zone" : "zones"}, each ${ZONE.width} × ${ZONE.length} × ${ZONE.height} m. Level ${sector.level} stands ${floorOf(sector.level)} m over the ground. Click the world to ${
          sector.tool === "remove" ? "take away the zone under the pointer" : "place a zone on the level or against a zone"
        }; drag to look round, right-drag to move, the wheel to come nearer.`,
      controls: [
        { kind: "colour", key: "zoneColour", label: "Colour", options: COLOURS },
        {
          kind: "choice",
          key: "tool",
          label: "Tool",
          options: [
            { value: "place", label: "Place" },
            { value: "remove", label: "Remove" },
          ],
        },
        // A level is a zone's height (0.3 m): 0 on the ground, 99 nearly 30 m over it.
        { kind: "number", key: "level", label: "Level", min: 0, max: 99, step: 1, marks: 10 },
      ],
    },
  ],
  // What has been built is sent back with the settings: every zone, as [column, row, level].
  copy: (sector) => [`Zones (${sector.zones.length}): ${JSON.stringify(sector.zones)}`, `Settings JSON: ${JSON.stringify(sector)}`],
};
