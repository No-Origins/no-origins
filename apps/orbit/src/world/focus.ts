import { springAt, springSettled } from "@no-origins/ui/lib/spring";

import { overlooking, type CameraConfig, type Ground } from "./camera";

/**
 * A click's flight (the camera's Focus and Flight, `camera.ts`; his: "When we click on something, camera should move and
 * zoom into that section … And the selected section should be at the center of the view"). A click on a portal moves
 * the camera so the portal is at the middle of the view: at the Focus's Height, looking down the Focus's Angle, the lens
 * at the Focus's Zoom, facing the way it faced. A click on the ground, or Escape, takes it back to where it was.
 *
 * The flight is a spring from where the camera was to where it goes (Flight's Response and Bounce;
 * `@no-origins/ui/lib/spring`): it travels over the ground between the two, its height, angle and zoom with it, lifting
 * by the Arc on the way, which its Height on the card shows. Every frame is worked out from the moment it set off
 * (Motion.md M17). Under reduced motion it is there at once. Nothing here is three.js.
 */

type Vec = readonly [number, number, number];

/** The camera: its values, and where it is over the ground. */
export type Rig = { camera: CameraConfig; at: Ground };

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Where a click on `thing` takes the camera: the Focus's height, angle and zoom, standing where it sees the thing at the middle. */
export function focusOn(rig: Rig, thing: Vec): Rig {
  const camera = { ...rig.camera, height: rig.camera.focusHeight, angle: rig.camera.focusAngle, zoom: rig.camera.focusZoom };
  return { camera, at: overlooking(camera, { x: thing[0], z: thing[2] }) };
}

/** The camera `t` ms into a flight from `from` to `to`, and whether it has come to rest. */
export function flightAt(from: Rig, to: Rig, t: number, reduced: boolean): { rig: Rig; done: boolean } {
  if (reduced) return { rig: to, done: true };
  const state = springAt({ x: 0, v: 0 }, 1, t, { response: to.camera.flyResponse, bounce: to.camera.flyBounce });
  if (springSettled(state, 1, 1e-3)) return { rig: to, done: true };
  const p = state.x;
  const travelled = Math.min(1, Math.max(0, p));
  const lift = to.camera.arc * 4 * travelled * (1 - travelled);
  return {
    rig: {
      camera: {
        ...to.camera,
        height: lerp(from.camera.height, to.camera.height, p) + lift,
        angle: lerp(from.camera.angle, to.camera.angle, p),
        turn: lerp(from.camera.turn, to.camera.turn, p),
        zoom: lerp(from.camera.zoom, to.camera.zoom, p),
      },
      at: [lerp(from.at[0], to.at[0], p), lerp(from.at[1], to.at[1], p)],
    },
    done: false,
  };
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
