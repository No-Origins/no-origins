import { eyeOf, fovOf, following, type CameraConfig } from "./camera";
import { BLOCK_COLOUR, type Solid } from "./hierarchy";
import { HUMAN_HIPS } from "./human";
import { MOUNTAIN_START } from "./mountain-jig";
import { mountainExtent } from "./mountain-profile";

/**
 * The start location (World.md W1) on its cells (W4), and the views the world is seen from: the visitor's eye, and each
 * jig's page (W14). What stands in it is the world's hierarchy (`hierarchy.ts`): the start's sector, its one block,
 * stands at the world's middle, by the visitor's cell.
 */

/** A cell's size in metres: mine, until the first place decides it (World.md W4, Open: the cell's size). */
export const CELL = 2;

/** A cell, as [column, row]: column along x, row along z; the visitor's cell is [0, 0], facing −z. */
export type Cell = readonly [number, number];

/** The centre of a cell on the ground, in metres. */
export const centreOf = ([column, row]: Cell) => ({ x: column * CELL, z: row * CELL });

/** The visitor's cell: where the human stands as every visit begins (World.md W51), facing −z, the camera behind it. */
export const VISITOR: Cell = [0, 0];

/**
 * The block the human stands on, on its page (his: "place the character on a 4x4 block, so that I can rotate and see
 * the character", W69): 4 × 4 m round the visitor's cell, a default block high, in Sand. It is the human's page's
 * own, not the world's.
 */
export const HUMAN_STAND: Solid = (() => {
  const { x, z } = centreOf(VISITOR);
  return { id: "human-stand", sector: "human-stand", colour: BLOCK_COLOUR, texture: "grain", rotation: [0, 0, 0], centre: [x, 0.125, z], half: [2, 0.125, 2], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] };
})();

/** The top of the human's block, in metres: where its soles stand on its page. */
export const HUMAN_TOP = HUMAN_STAND.centre[1] + HUMAN_STAND.half[1];

/**
 * Where the camera stands and what it looks at, in metres, how wide it sees (degrees), and whether a drag turns it
 * round what it looks at.
 */
export type View = { position: readonly [number, number, number]; target: readonly [number, number, number]; fov: number; look: boolean };

/**
 * The views: the visitor's eye, and a page for each jig, from the sidebar's order (`build-sidebar.tsx`). `start`,
 * `camera` and `map` are the visitor's camera; `world` (the world as the sectors build it, W82), `spaces` (the Sectors
 * page, W81), `environment` (the Sky, Base clouds, Light and texture and Fog pages), `clouds`, `human` and `mountain`
 * are looked round. The portal's, the trees', the pipes' and the roads' pages went with W93: their looks are set as
 * they are placed, on the Sectors page.
 */
export type ViewName = "start" | "world" | "spaces" | "environment" | "clouds" | "camera" | "map" | "human" | "mountain";

/** The view a route is seen from: each route is a place, or a jig's page (W2). */
export function viewOf(pathname: string): ViewName {
  if (pathname.startsWith("/build/mountains")) return "mountain";
  if (pathname.startsWith("/build/world")) return "world";
  if (pathname.startsWith("/build/sectors")) return "spaces";
  if (["/build/environment", "/build/sky", "/build/base-clouds", "/build/light", "/build/fog"].some((route) => pathname.startsWith(route))) return "environment";
  if (pathname.startsWith("/build/clouds")) return "clouds";
  if (pathname.startsWith("/build/camera")) return "camera";
  if (pathname.startsWith("/build/map")) return "map";
  if (pathname.startsWith("/build/human")) return "human";
  return "start";
}

/** How wide a page that looks at something sees. */
const LOOKING_FOV = 50;

/** A view, from the camera and the environment it is seen with. */
export function viewFor(name: ViewName, camera: CameraConfig): View {
  switch (name) {
    // Open ground with room to look round, pan and travel over the plane; the World page, the world as the sectors build
    // it (W82), is the same builder's view, so the sectors are seen from a camera that can stand back.
    case "world":
    case "environment": return { position: [40, 24, 60], target: [0, 40, 0], fov: 75, look: true };
    // The mountain alone at the world's middle (W73), seen from the east, a little above its middle, far enough off for
    // all of it, head and foot, to be in view: its side profile, as its drawing was given.
    case "mountain": {
      const { radius, height } = mountainExtent(MOUNTAIN_START);
      const off = Math.max(radius, height / 2) / Math.sin((LOOKING_FOV / 2) * Math.PI / 180) * 1.25;
      return { position: [off, height / 2 + off * 0.18, 0], target: [0, height / 2, 0], fov: LOOKING_FOV, look: true };
    }
    // The clouds' page sees the ceiling as the environment's does (W38), so the two are tuned on one view.
    case "clouds": return { position: [40, 24, 60], target: [0, 40, 0], fov: 75, look: true };
    // The Sectors page (W81): where it starts, before the world takes the camera to the sector picked, framing it whole
    // (`frame` in the engine); a drag goes round, a right-drag moves, the wheel comes nearer, the keys and the map travel.
    case "spaces": return { position: [40, 24, 60], target: [0, 40, 0], fov: LOOKING_FOV, look: true };
    // Before the human on its block, a little above its eye, looking at its hips, so it is whole in view with its
    // visor towards the camera; a drag goes round it, the wheel comes nearer (World.md W69).
    case "human": {
      const { x, z } = centreOf(VISITOR);
      return { position: [x + 2.6, HUMAN_TOP + 2.0, z + 4.6], target: [x, HUMAN_TOP + HUMAN_HIPS, z], fov: LOOKING_FOV, look: true };
    }
    // The visitor's camera, where it starts: behind the human on the visitor's cell, the figure at the middle of its
    // view (World.md W51); the camera's page is it, and the map's.
    default: {
      const { x, z } = centreOf(VISITOR);
      const eye = eyeOf(camera, following(camera, [x, z], HUMAN_HIPS));
      return { position: eye.position, target: eye.target, fov: fovOf(camera), look: false };
    }
  }
}

/** An element that stands alone on a page (World.md W72): the human, or one mountain (W93: the others' pages went). */
export type Alone = "human" | "mountain";

/**
 * Which element a view shows alone, with nothing else of the world's elements drawn (W72, W73; his: "just like human,
 * where there is only one base and a human standing there … similarly for every other element"): an element's page
 * its element; nothing alone on the World page, the Sectors page (W81: "spaces is where we will see the world"), the
 * Environment's pages and the visitor's views, where the world is drawn as placed.
 */
export function aloneOn(view: ViewName): Alone | null {
  if (view === "human" || view === "mountain") return view;
  return null;
}
