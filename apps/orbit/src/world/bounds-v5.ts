import type { Jig } from "./jig";
import { WORLD_SIZE, type WorldSize } from "./orbit";

/**
 * The world's jig, version 5 (World.md W29, W33, W42, W73): its size, on a page of its own at the top of the builder,
 * since everything else, the environment and every unit of the hierarchy, is inside it; and, since W73, where the
 * elements are placed (his: "I can go into the world, and there we can place these elements and their variations
 * wherever we want"). The world is a cylinder (his: "Instead of cuboid shaped world, lets make it cylindrical"), a
 * kilometre across and a kilometre high, fixed (his, W33), so the card says it and has no controls for it. Place and
 * Picked are drawn by the page from the placing's own state (`place.ts`) and the world's data (`hierarchy.ts`). Save
 * and Publish keep the world (W73). Nothing here is three.js. Versions 1 to 3 (`bounds-v1.ts` to `bounds-v3.ts`),
 * boxes, are frozen; version 4 was this without placing.
 *
 * Frozen: he has seen it, and nothing draws it. Version 6 (`bounds.ts`) places nothing (W82; his: "The world page
 * should not have elements be placed in it"): elements are placed into a zone on the Sectors page.
 */
export const WORLD_VERSION = 5;

export const WORLD_JIG: Jig<WorldSize> = {
  name: "World",
  version: WORLD_VERSION,
  start: WORLD_SIZE,
  groups: [
    {
      title: "Size",
      note: ({ diameter, height }) =>
        `A cylinder ${diameter} m across and ${height} m high, fixed. Its floor a round centred on the middle; its height up from the floor to the clouds' underside, the world's ceiling. Every camera and every block stays inside; the map draws the floor. Drag to look round, right-drag to move, the wheel to come nearer; WASD or arrows and the map travel.`,
      controls: [],
    },
    { title: "Place", controls: [] },
    { title: "Picked", controls: [] },
  ],
  copy: ({ diameter, height }) => [`World: a cylinder ${diameter} m across, ${height} m high, fixed`],
};
