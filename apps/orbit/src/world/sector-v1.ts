import { COLOURS } from "./colours";
import type { Jig } from "./jig";
import { PLANE_SIZE } from "./orbit";

/**
 * The sector, version 1, when it was called the plane (World.md W24; his: "In elements, add controls for the plane"):
 * the ground the world stands on, an element with its own page, no longer the environment's. A square centred on the
 * start, North −Z (W23), its surface a flat colour warmed by the environment's sunlight, with mineral grain anchored to
 * it. Frozen: he has seen it, and nothing draws it. Version 2 is `sector.ts`.
 */
export const PLANE_VERSION = 1;

export type PlaneConfig = {
  /** How far it reaches each way, in metres: the square's side (his: "a 1000 m × 1000 m plane", W23). */
  size: number;
  /** Its colour, before the sunlight warms it. */
  colour: string;
  /** Its grain: how much it darkens and lightens the colour (0 smooth), and how fine, in metres. */
  grain: number;
  grainSize: number;
};

/**
 * The plane as it was the environment's (mine, his to tune): his size, and the blocks' colour and grain, so the ground
 * still reads as one surface with the blocks until he sets it apart.
 */
export const PLANE_START: PlaneConfig = {
  size: PLANE_SIZE,
  colour: "#efe5e8",
  grain: 0.1,
  grainSize: 0.06,
};

/** The plane's card (World.md W14): its controls, grouped as the card shows them. */
export const PLANE_JIG: Jig<PlaneConfig> = {
  name: "Plane",
  version: PLANE_VERSION,
  start: PLANE_START,
  groups: [
    {
      title: "Size",
      note: (plane) => `${plane.size} × ${plane.size} m, centred on the start; North is −Z. Blocks and every camera stay inside it.`,
      controls: [{ kind: "number", key: "size", label: "Side", min: 200, max: 2000, step: 10, marks: 200, unit: "m" }],
    },
    {
      title: "Surface",
      note: () => "The environment's sunlight warms the colour. The grain stays on the ground as you move.",
      controls: [
        { kind: "colour", key: "colour", label: "Colour", options: COLOURS },
        { kind: "number", key: "grain", label: "Grain", min: 0, max: 0.5, step: 0.01, marks: 0.1 },
        { kind: "number", key: "grainSize", label: "Grain size", min: 0.02, max: 0.3, step: 0.01, marks: 0.07, unit: "m" },
      ],
    },
  ],
  copy: (plane) => [`Settings JSON: ${JSON.stringify(plane)}`],
};
