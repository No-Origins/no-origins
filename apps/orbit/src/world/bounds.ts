import type { Jig } from "./jig";
import { WORLD_SIZE, type WorldSize } from "./orbit";

/**
 * The world's jig, version 6 (World.md W29, W33, W42, W73, W82): its size, on a page of its own at the top of the
 * builder, since everything else, the environment and every sector, is inside it. The world is a cylinder (his:
 * "Instead of cuboid shaped world, lets make it cylindrical"), a kilometre across and a kilometre high, fixed (his,
 * W33), so the card says it and has no controls for it. **Nothing is placed here** (his, W82: "The world page should
 * not have elements be placed in it. Since we are using the spaces to create sectors, the sectors also hold location.
 * So we will not place anything in the world explicitly. But the sectors that are created should be rendered in the
 * world"): the page shows the world as the sectors build it, no sector's edges drawn (W103), and
 * elements are placed into a sector on the Sectors page. Save and Publish keep the world (W73). Nothing here is
 * three.js. Version 5, which placed, is frozen (`bounds-v5.ts`), and versions 1 to 3, boxes (`bounds-v1.ts` to
 * `bounds-v3.ts`); version 4 was version 5 without placing.
 */
export const WORLD_VERSION = 6;

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
    { title: "Sectors", controls: [] },
  ],
  copy: ({ diameter, height }) => [`World: a cylinder ${diameter} m across, ${height} m high, fixed`],
};
