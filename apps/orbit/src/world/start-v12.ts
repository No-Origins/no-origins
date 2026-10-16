import { eyeOf, fovOf, startAt, type CameraConfig } from "./camera-v8";
import { BLOCK_COLOUR, metresOf, type Box } from "./hierarchy";

/**
 * The start location (World.md W1) on its cells (W4), and the views the world is seen from: the visitor's eye, and each
 * jig's page (W14). What stands in it is the world's hierarchy (`hierarchy.ts`): the start's entry zone, its one block,
 * stands at the world's middle, by the visitor's cell.
 */

/** A cell's size in metres: mine, until the first place decides it (World.md W4, Open: the cell's size). */
export const CELL = 2;

/** A cell, as [column, row]: column along x, row along z; the visitor's cell is [0, 0], facing −z. */
export type Cell = readonly [number, number];

/** The centre of a cell on the ground, in metres. */
export const centreOf = ([column, row]: Cell) => ({ x: column * CELL, z: row * CELL });

/**
 * The cell two ahead of the visitor's: what the visitor's camera starts looking at (mine, where the first portal stood),
 * and where the portal stands on its own page, the one place it is shown. The environment has no portals (his: "Portals
 * are not space units. We don't need those in the environment now").
 */
export const AHEAD: Cell = [0, -2];

/** The portals a view shows, by their cells: the portal's own page shows one; nothing else shows any. */
export const portalsOn = (view: ViewName): Cell[] => (view === "portal" ? [AHEAD] : []);

/**
 * The block the portal stands on, on its page (mine, World.md W24): 2 × 2 m round its cell, a default block high, in
 * Sand, wide enough to hold the portal's cut (just over a metre across at his settings), which one default block is not.
 * It is the portal's page's own, not the world's.
 */
export const PORTAL_STAND: Box = (() => {
  const { x, z } = centreOf(AHEAD);
  return { id: "portal-stand", sector: "portal-stand", colour: BLOCK_COLOUR, from: [x - 1, z - 1, 0], to: [x + 1, z + 1, 1] };
})();

/** The top of the portal's block, in metres: where the portal is cut. */
export const PORTAL_TOP = metresOf(PORTAL_STAND.to)[1];

/**
 * Where the camera stands and what it looks at, in metres, how wide it sees (degrees), and whether a drag turns it
 * round what it looks at.
 */
export type View = { position: readonly [number, number, number]; target: readonly [number, number, number]; fov: number; look: boolean };

/** The views: the visitor's eye, and a page for each jig, from the sidebar's order (`build-sidebar.tsx`). */
/** `start`, `camera` and `map` are the visitor's camera; `environment`, `portal` and `sector` are looked round. */
export type ViewName = "start" | "environment" | "camera" | "map" | "portal" | "sector";

/** The view a route is seen from: each route is a place, or a jig's page (W2). */
export function viewOf(pathname: string): ViewName {
  if (pathname.startsWith("/build/environment")) return "environment";
  if (pathname.startsWith("/build/camera")) return "camera";
  if (pathname.startsWith("/build/map")) return "map";
  if (pathname.startsWith("/build/portal")) return "portal";
  if (pathname.startsWith("/build/sector")) return "sector";
  return "start";
}

/** How wide a page that looks at something sees. */
const LOOKING_FOV = 50;

/** A view, from the camera and the environment it is seen with. */
export function viewFor(name: ViewName, camera: CameraConfig): View {
  switch (name) {
    // Open ground with room to look round, pan and travel over the plane.
    case "environment": return { position: [40, 18, 60], target: [0, 0, 0], fov: 75, look: true };
    // Over the start's entry zone, about 8 m off (mine, World.md W24): its block, a metre across, plain to place round;
    // a drag goes round, a right-drag moves, the wheel comes nearer, the keys and the map travel.
    case "sector": return { position: [4, 4, 6.5], target: [0.5, 0, 0.5], fov: LOOKING_FOV, look: true };
    // Close and above the portal, looking in; a drag goes round it. It stands on its own block (World.md W24).
    case "portal": {
      const { x, z } = centreOf(AHEAD);
      return { position: [x, PORTAL_TOP + 2.2, z + 2.4], target: [x, PORTAL_TOP - 0.3, z], fov: LOOKING_FOV, look: true };
    }
    // The visitor's camera, where it starts, seeing the cell two ahead at the middle of its view; the camera's page is it.
    default: {
      const eye = eyeOf(camera, startAt(camera, [centreOf(AHEAD)]));
      return { position: eye.position, target: eye.target, fov: fovOf(camera), look: false };
    }
  }
}
