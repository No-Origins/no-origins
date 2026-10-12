import { springAt, springSettled } from "@no-origins/ui/lib/spring";

import { eyeOf } from "./camera-v7";
import type { Rig } from "./drag-v7";

/**
 * FROZEN with the camera's version 7 (`camera-v7.ts`); version 8's is `focus.ts`.
 *
 * A click's flight (the camera's Focus and Move, `camera.ts`; his: "When we click on something, camera should move and
 * zoom into that section … And the selected section should be at the center of the view"). A click on a portal flies
 * the point the camera looks at onto the portal's middle, so the portal is at the middle of the view, the camera ending
 * the Focus's Distance back from it over the ground and the Focus's Height up, from the side it already looked from,
 * the lens at the Focus's Zoom. A click on the ground, or Escape, flies it back to where it was.
 *
 * The flight is a spring from where the camera was to where it ends (Move's Response and Bounce;
 * `@no-origins/ui/lib/spring`): the point slides between the two, the camera's Height, Distance, Turn and Zoom go with
 * it, and it lifts by the Arc on the way, which the Height shows. Every frame is worked out from the moment it set off (Motion.md M17). Under
 * reduced motion it is there at once. Nothing here is three.js.
 */

type Vec = readonly [number, number, number];

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const wrap = (degrees: number) => ((((degrees + 180) % 360) + 360) % 360) - 180;

/** Where a click on `thing` takes the camera: the point onto the thing, the Focus's distance, height and zoom. */
export function focusOn(rig: Rig, thing: Vec): Rig {
  const { camera } = rig;
  const { position } = eyeOf(camera, rig.aim);
  // The side it comes from: the way from the camera to the thing, over the ground; the way it looked, if right above.
  const across = [thing[0] - position[0], thing[2] - position[2]];
  const turn = Math.hypot(across[0], across[1]) < 1e-3 ? camera.turn : (Math.atan2(across[0], -across[1]) * 180) / Math.PI;
  return {
    camera: { ...camera, distance: camera.focusDistance, height: thing[1] + camera.focusHeight, turn, zoom: camera.focusZoom },
    aim: thing,
  };
}

/**
 * The camera `t` ms into a flight from `from` to `to`, and whether it has come to rest. The point slides from one aim
 * to the other; Height, Distance and Zoom go between their two; Turn goes the short way round; the camera lifts by the
 * Arc, highest half way. The values the card shows are the camera's as it is, lift and all.
 */
export function flightAt(from: Rig, to: Rig, t: number, reduced: boolean): { rig: Rig; done: boolean } {
  if (reduced) return { rig: to, done: true };
  const state = springAt({ x: 0, v: 0 }, 1, t, { response: to.camera.flyResponse, bounce: to.camera.flyBounce });
  if (springSettled(state, 1, 1e-3)) return { rig: to, done: true };
  const p = state.x;
  const aim: Vec = [lerp(from.aim[0], to.aim[0], p), lerp(from.aim[1], to.aim[1], p), lerp(from.aim[2], to.aim[2], p)];
  const travelled = Math.min(1, Math.max(0, p));
  const lift = to.camera.arc * 4 * travelled * (1 - travelled);
  const values = {
    height: lerp(from.camera.height, to.camera.height, p) + lift,
    distance: Math.max(0, lerp(from.camera.distance, to.camera.distance, p)),
    turn: wrap(from.camera.turn + wrap(to.camera.turn - from.camera.turn) * p),
  };
  return { rig: { camera: { ...to.camera, ...values, zoom: lerp(from.camera.zoom, to.camera.zoom, p) }, aim }, done: false };
}

/**
 * Which portal a click falls on, from where the click's ray meets the ground: the one whose opening (and a little round
 * it, for a hand) holds that point, or none. `centres` are the portals' middles on the ground.
 */
export function portalUnder(origin: Vec, direction: Vec, centres: readonly Vec[], reach: number): number | null {
  if (direction[1] >= -1e-6) return null;
  const t = -origin[1] / direction[1];
  const hit: Vec = [origin[0] + direction[0] * t, 0, origin[2] + direction[2] * t];
  let nearest: number | null = null;
  let best = reach;
  centres.forEach((centre, i) => {
    const d = Math.hypot(hit[0] - centre[0], hit[2] - centre[2]);
    if (d <= best) {
      best = d;
      nearest = i;
    }
  });
  return nearest;
}
