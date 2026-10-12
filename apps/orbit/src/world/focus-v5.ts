import { springAt, springSettled } from "@no-origins/ui/lib/spring";

import { eyeOf, eyeValuesOf, type CameraConfig } from "./camera-v5";

/**
 * FROZEN with the camera's version 5 (`camera-v5.ts`); version 6's is `focus.ts`.
 *
 * A click's flight (the camera's Focus and Move, `camera.ts`; his: "When we click on something, camera should move and
 * zoom into that section … And the selected section should be at the center of the view"). A click on a portal flies
 * the eye to it: it ends the Focus's Distance from the portal's middle, the Focus's Angle above it, coming from the way
 * the eye already faced, the lens at the Focus's Zoom, and looking straight at the portal's middle, so the portal is at
 * the middle of the view. A click on the ground, or Escape, flies it back to where it was.
 *
 * The flight is a spring from where the eye was to where it ends (Move's Response and Bounce;
 * `@no-origins/ui/lib/spring`): the eye travels between the two places, lifting by the Arc on the way, its gaze swinging
 * from what it looked at to the portal, its zoom with it. Every frame is worked out from the moment it set off (Motion.md
 * M17). Under reduced motion the eye is there at once. Nothing here is three.js.
 */

type Vec = readonly [number, number, number];

const RAD = Math.PI / 180;
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const lerpVec = (a: Vec, b: Vec, p: number): Vec => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
const distance = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** The eye's values where a click on `thing` takes it from `eye`: the Focus's place, looking at the thing's middle. */
export function focusOn(eye: CameraConfig, thing: Vec): CameraConfig {
  const { position } = eyeOf(eye);
  // The way in: from the eye towards the thing, over the ground; straight down on it, the way the eye faces.
  let across = [thing[0] - position[0], thing[2] - position[2]];
  if (Math.hypot(across[0], across[1]) < 1e-3) across = [Math.sin(eye.turn * RAD), -Math.cos(eye.turn * RAD)];
  const flat = Math.hypot(across[0], across[1]);
  const way = [across[0] / flat, across[1] / flat];
  const angle = eye.focusAngle * RAD;
  const back = eye.focusDistance * Math.cos(angle);
  const end: Vec = [thing[0] - way[0] * back, thing[1] + eye.focusDistance * Math.sin(angle), thing[2] - way[1] * back];
  return { ...eye, ...eyeValuesOf(end, thing), zoom: eye.focusZoom };
}

/** What an eye looks at, `reach` metres along its gaze. */
function lookingAt(eye: CameraConfig, reach: number): Vec {
  const { position, target } = eyeOf(eye);
  const along = distance(position, target);
  return lerpVec(position, target, reach / along);
}

/**
 * The eye `t` ms into a flight from `from` to `to` about `thing` (the portal flown to, or from), and whether it has
 * come to rest. Each end looks along its own gaze as far as the thing is from it, so the gaze swings from one to the
 * other without a turn the long way round; a focus's end looks at the thing itself.
 */
export function flightAt(from: CameraConfig, to: CameraConfig, thing: Vec, t: number, reduced: boolean): { eye: CameraConfig; done: boolean } {
  if (reduced) return { eye: to, done: true };
  const state = springAt({ x: 0, v: 0 }, 1, t, { response: to.flyResponse, bounce: to.flyBounce });
  if (springSettled(state, 1, 1e-3)) return { eye: to, done: true };
  const p = state.x;
  const a = eyeOf(from).position as Vec;
  const b = eyeOf(to).position as Vec;
  const travelled = Math.min(1, Math.max(0, p));
  const lift = to.arc * 4 * travelled * (1 - travelled);
  const place = lerpVec(a, b, p);
  const position: Vec = [place[0], place[1] + lift, place[2]];
  const look = lerpVec(lookingAt(from, distance(a, thing)), lookingAt(to, distance(b, thing)), p);
  return { eye: { ...to, ...eyeValuesOf(position, look), zoom: lerp(from.zoom, to.zoom, p) }, done: false };
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
