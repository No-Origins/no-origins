import type { Jig } from "./jig";
import { WORLD_SIZE_START, type BoxSize } from "./orbit";

/**
 * The world's jig, version 3 (World.md W29, W33): its size, on a page of its own at the top of the builder, since
 * everything else, the environment and every unit of the hierarchy, is inside it. The size is fixed (his: "Let's fix
 * world dimensions. It should be 1000m length, width and height"), so the card says it and has no controls. Width runs
 * west to east (x) and breadth north to south (z), each centred on the middle; height runs up from the floor, y 0, to
 * the clouds' underside (W33). Every camera and every block stays inside (`edgesOf` in `orbit.ts`). Nothing here is
 * three.js. Versions 1 (`bounds-v1.ts`) and 2 (`bounds-v2.ts`), whose sizes were set on the card, are frozen.
 *
 * Frozen: he has seen it, and nothing draws it. His note on it: "Instead of cuboid shaped world, lets make it
 * cylindrical" (World.md W42), version 4.
 */
export const WORLD_VERSION = 3;

export const WORLD_JIG: Jig<BoxSize> = {
  name: "World",
  version: WORLD_VERSION,
  start: WORLD_SIZE_START,
  groups: [
    {
      title: "Size",
      note: ({ width, breadth, height }) =>
        `${width} × ${breadth} m, ${height} m high, fixed. Width west to east, breadth north to south, each centred on the middle; height up from the floor to the clouds' underside, the world's ceiling. Every camera and every block stays inside; the map draws the floor.`,
      controls: [],
    },
  ],
  copy: ({ width, breadth, height }) => [`World: ${width} × ${breadth} × ${height} m, fixed`],
};
