import type { Jig } from "./jig";
import { WORLD_SIZE_START, type BoxSize } from "./orbit";

/**
 * The world's jig, version 1 (World.md W29): its boundaries (his: "I just asked I can set boundaries for the world"),
 * on a page of its own at the top of the builder, since everything else, the environment and every unit of the
 * hierarchy, is inside it. Width runs west to east (x) and breadth north to south (z), each centred on the middle;
 * height runs up from the floor, y 0. Every camera and every block stays inside (`edgesOf` in `orbit.ts`). Nothing here
 * is three.js.
 *
 * Frozen: he has seen it, and nothing draws it. His note on it: "Once I change the config, the values are chaning to
 * +20, like 1020 instead of 1000. The steps should increase with 500m only" (its marks counted from 20 m), version 2.
 */
export const WORLD_VERSION = 1;

/** What each of the world's sizes could be in version 1: across and along from 20 m on a step of 2 m, up from 10 m. */
const WORLD_SIZE_RANGE: Record<keyof BoxSize, { min: number; max: number; step: number }> = {
  width: { min: 20, max: 4000, step: 2 },
  breadth: { min: 20, max: 4000, step: 2 },
  height: { min: 10, max: 2000, step: 1 },
};

/** The world's size as kept: each way on its step, within its range; one not kept is the start's. */
export function sizeOf(kept: Partial<Record<keyof BoxSize, unknown>>): BoxSize {
  const way = (key: keyof BoxSize) => {
    const value = kept[key];
    const { min, max, step } = WORLD_SIZE_RANGE[key];
    if (typeof value !== "number" || !Number.isFinite(value)) return WORLD_SIZE_START[key];
    return Math.min(max, Math.max(min, min + Math.round((value - min) / step) * step));
  };
  return { width: way("width"), breadth: way("breadth"), height: way("height") };
}

export const WORLD_JIG: Jig<BoxSize> = {
  name: "World",
  version: WORLD_VERSION,
  start: WORLD_SIZE_START,
  groups: [
    {
      title: "Boundaries",
      note: ({ width, breadth, height }) =>
        `${width} × ${breadth} m, ${height} m high. Width west to east, breadth north to south, each centred on the middle; height up from the floor. Every camera and every block stays inside; the map draws the floor.`,
      controls: [
        { kind: "number", key: "width", label: "Width", ...WORLD_SIZE_RANGE.width, marks: 500, unit: "m" },
        { kind: "number", key: "breadth", label: "Breadth", ...WORLD_SIZE_RANGE.breadth, marks: 500, unit: "m" },
        { kind: "number", key: "height", label: "Height", ...WORLD_SIZE_RANGE.height, marks: 250, unit: "m" },
      ],
    },
  ],
};
