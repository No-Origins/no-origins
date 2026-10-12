import { eyeOf, fovOf, startAt, type CameraConfig } from "./camera";
import type { EnvironmentConfig } from "./environment-v10";

/**
 * The start location (World.md W1) on its cells (W4), and the views the world is seen from: the visitor's eye, and each
 * jig's page (W14). What stands in it and where is the environment's (`environment.ts`): the start location is the tops
 * of its blocks (`orbit.ts`), five cells to a block's side, the visitor's cell the middle of block [0, 0].
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
 * Where the camera stands and what it looks at, in metres, how wide it sees (degrees), and whether a drag turns it
 * round what it looks at.
 */
export type View = { position: readonly [number, number, number]; target: readonly [number, number, number]; fov: number; look: boolean };

/** The views: the visitor's eye, and a page for each jig, from the sidebar's order (`build-sidebar.tsx`). */
/** `start`, `camera` and `map` are the visitor's camera; `environment` and `portal` are looked round. */
export type ViewName = "start" | "environment" | "camera" | "map" | "portal";

/** The view a route is seen from: each route is a place, or a jig's page (W2). */
export function viewOf(pathname: string): ViewName {
  if (pathname.startsWith("/build/environment")) return "environment";
  if (pathname.startsWith("/build/camera")) return "camera";
  if (pathname.startsWith("/build/map")) return "map";
  if (pathname.startsWith("/build/portal")) return "portal";
  return "start";
}

/** How wide a page that looks at something sees. */
const LOOKING_FOV = 50;

/** A view, from the camera and the environment it is seen with. */
export function viewFor(name: ViewName, camera: CameraConfig, environment: EnvironmentConfig): View {
  switch (name) {
    // Four metres inside the dome, with a wide near-level view of the atmosphere, floating blocks and water below.
    // The construction ghost still follows the hand; drag looks round and right-drag pans.
    case "environment": {
      const way = [0.5, 0.12, 0.86];
      const length = Math.hypot(...way);
      const back = environment.radius - 4;
      const position = way.map((v) => (v / length) * back) as [number, number, number];
      return { position, target: [0, 8, 0], fov: 75, look: true };
    }
    // Close and above the portal, looking in; a drag goes round it.
    case "portal": {
      const { x, z } = centreOf(AHEAD);
      return { position: [x, 2.2, z + 2.4], target: [x, -0.3, z], fov: LOOKING_FOV, look: true };
    }
    // The visitor's camera, where it starts, seeing the cell two ahead at the middle of its view; the camera's page is it.
    default: {
      const eye = eyeOf(camera, startAt(camera, [centreOf(AHEAD)]));
      return { position: eye.position, target: eye.target, fov: fovOf(camera), look: false };
    }
  }
}
