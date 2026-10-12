import { springAt, springSettled } from "@no-origins/ui/lib/spring";

import { eyeOf, eyeValuesOf, REACH, type CameraConfig, type EyeValues } from "./camera-v5";

/**
 * FROZEN with the camera's version 5 (`camera-v5.ts`); version 6's is `drag.ts`.
 *
 * The eye's drag (the camera's Drag, `camera.ts`; his: "I'm unable to move with click and drag. Fix that. I also need
 * controls to create drag effects"). The hand moves the eye's own values, from what they were when it took hold, by an
 * offset, so the card shows them moving (his: "I have to see them"):
 *
 * - **Orbit** swings the eye round what it looks at, the middle of the row of portals (`pivot`), the eye and its gaze
 *   turned together so nothing jumps when the hand takes hold: Side, Distance, Height, Turn and Tilt all move. It never
 *   goes under the ground, nor over the Height's reach.
 * - **Look** turns the eye where it stands, as a head turns: Turn and Tilt. At a Speed of 1× the world under the hand
 *   stays under it.
 * - **Pan** slides the eye over the ground: Side and Distance. At 1× the ground under the hand stays under it.
 *
 * Let go, the offset carries on at the hand's speed, slowing over the Glide, or springs back to none, to where the hand
 * took hold, on the camera's spring, starting at the hand's speed (Response, Bounce; `@no-origins/ui/lib/spring`). Both
 * are worked out from the moment it was let go, so a frame at any moment is the same however it is reached (Motion.md
 * M17). Nothing here is three.js.
 */

type Vec = readonly [number, number, number];

/** How far the drag has moved the eye: turned round (`yaw`) and up or down (`pitch`), in radians; slid, in metres. */
export type Offset = { yaw: number; pitch: number; x: number; z: number };

export const NO_OFFSET: Offset = { yaw: 0, pitch: 0, x: 0, z: 0 };

const KEYS = ["yaw", "pitch", "x", "z"] as const;
const RAD = Math.PI / 180;

/** How low an orbiting eye may go, in metres over the ground, and how close to straight up or down it may swing. */
const LOWEST = 0.2;
const EDGE = 0.05;

const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const length = (a: Vec) => Math.hypot(a[0], a[1], a[2]);
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const wrap = (degrees: number) => ((((degrees + 180) % 360) + 360) % 360) - 180;

/** `v` turned `angle` round the unit `axis` (Rodrigues' formula). */
function turned(v: Vec, axis: Vec, angle: number): Vec {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dot = axis[0] * v[0] + axis[1] * v[1] + axis[2] * v[2];
  const cross: Vec = [axis[1] * v[2] - axis[2] * v[1], axis[2] * v[0] - axis[0] * v[2], axis[0] * v[1] - axis[1] * v[0]];
  return [0, 1, 2].map((i) => v[i] * cos + cross[i] * sin + axis[i] * dot * (1 - cos)) as unknown as Vec;
}

/** The eye as points: where it stands, and what it looks at. */
function pointsOf(camera: EyeValues) {
  const eye = eyeOf(camera);
  return { position: eye.position as Vec, target: eye.target as Vec };
}

/** The level axis an orbit tips the eye round: across the way from the pivot to the eye (or the gaze, from straight above). */
function across(position: Vec, target: Vec, pivot: Vec): Vec {
  const out = sub(position, pivot);
  let dir: Vec = [out[0], 0, out[2]];
  if (Math.hypot(dir[0], dir[2]) < 1e-3) {
    const gaze = sub(target, position);
    dir = [-gaze[0], 0, -gaze[2]];
  }
  const flat = Math.hypot(dir[0], dir[2]);
  return flat < 1e-3 ? [1, 0, 0] : [dir[2] / flat, 0, -dir[0] / flat];
}

/** How far the eye's gaze reaches the ground, 2 to 30 m: what a pan keeps under the hand. */
function reachOf(camera: EyeValues) {
  const sin = Math.sin(camera.tilt * RAD);
  return sin > 0.01 ? clamp(camera.height / sin, 2, 30) : 30;
}

/** An offset kept within the eye's reach (`REACH`): an orbit above the ground, a look's tilt, a pan's slide. */
export function within(grab: CameraConfig, offset: Offset, pivot: Vec): Offset {
  if (grab.drag === "pan") {
    return {
      ...offset,
      x: clamp(offset.x, REACH.side.min - grab.side, REACH.side.max - grab.side),
      z: clamp(offset.z, REACH.distance.min - grab.distance, REACH.distance.max - grab.distance),
    };
  }
  if (grab.drag === "look") {
    return { ...offset, pitch: clamp(offset.pitch, (grab.tilt - REACH.tilt.max) * RAD, (grab.tilt - REACH.tilt.min) * RAD) };
  }
  const out = sub(pointsOf(grab).position, pivot);
  const r = length(out);
  const phi0 = Math.acos(clamp(out[1] / r, -1, 1));
  const highest = Math.max(EDGE, Math.acos(clamp((REACH.height.max - pivot[1]) / r, -1, 1)));
  const lowest = Math.acos(clamp((LOWEST - pivot[1]) / r, -1, 1));
  return { ...offset, pitch: clamp(offset.pitch, phi0 - lowest, phi0 - highest) };
}

/** The eye's values the drag has moved to: what they were when the hand took hold, by the offset. */
export function movedEye(grab: CameraConfig, offset: Offset, pivot: Vec): EyeValues {
  if (grab.drag === "pan") {
    return { ...grab, side: grab.side + offset.x, distance: grab.distance + offset.z };
  }
  if (grab.drag === "look") {
    return { ...grab, turn: wrap(grab.turn - offset.yaw / RAD), tilt: grab.tilt - offset.pitch / RAD };
  }
  // Tipped up round the level axis across the pivot, then turned round the upright through it: the eye and its gaze
  // together, so at no offset it is exactly where the hand took hold.
  const { position, target } = pointsOf(grab);
  const axis = across(position, target, pivot);
  const swing = (point: Vec) => add(pivot, turned(turned(sub(point, pivot), axis, -offset.pitch), [0, 1, 0], offset.yaw));
  const moved = eyeValuesOf(swing(position), swing(target));
  return {
    side: clamp(moved.side, REACH.side.min, REACH.side.max),
    distance: clamp(moved.distance, REACH.distance.min, REACH.distance.max),
    height: moved.height,
    turn: wrap(moved.turn),
    tilt: moved.tilt,
  };
}

/**
 * How far a move of the hand, `dx` and `dy` pixels across a view `height` pixels tall, moves the offset, at a Speed of
 * 1×: an orbit half a turn a height of the view; a look and a slide keeping what is under the hand under it.
 */
export function moveOf(grab: CameraConfig, fov: number, height: number, dx: number, dy: number): Offset {
  if (grab.drag === "pan") {
    const turn = grab.turn * RAD;
    const forward: Vec = [Math.sin(turn), 0, -Math.cos(turn)];
    const right: Vec = [-forward[2], 0, forward[0]];
    const metres = ((reachOf(grab) * 2 * Math.tan((fov * Math.PI) / 360)) / height) * grab.speed;
    return { yaw: 0, pitch: 0, x: (-right[0] * dx + forward[0] * dy) * metres, z: (-right[2] * dx + forward[2] * dy) * metres };
  }
  const turn = ((grab.drag === "look" ? fov * RAD : Math.PI) / height) * grab.speed;
  // Orbit turns the eye against the hand, so the world turns with it; Look turns the gaze with the hand's pull.
  const yaw = grab.drag === "look" ? dx * turn : -dx * turn;
  return { yaw, pitch: dy * turn, x: 0, z: 0 };
}

export const addOffsets = (a: Offset, b: Offset, by = 1): Offset => ({ yaw: a.yaw + b.yaw * by, pitch: a.pitch + b.pitch * by, x: a.x + b.x * by, z: a.z + b.z * by });

/**
 * Where the offset is `t` ms after the hand let go of it at `from`, moving at `speed` (per ms), and whether it has come
 * to rest: gliding on and slowing, or springing back to none. Under reduced motion it stays where it was let go, or is
 * back at once.
 */
export function releasedAt(camera: CameraConfig, from: Offset, speed: Offset, t: number, reduced: boolean): { offset: Offset; done: boolean } {
  if (camera.after === "return") {
    if (reduced) return { offset: NO_OFFSET, done: true };
    const spring = { response: camera.response, bounce: camera.bounce };
    const states = KEYS.map((key) => springAt({ x: from[key], v: speed[key] }, 0, t, spring));
    const offset = Object.fromEntries(KEYS.map((key, i) => [key, states[i].x])) as Offset;
    const done = states.every((state, i) => springSettled(state, 0, KEYS[i] === "x" || KEYS[i] === "z" ? 1e-3 : 1e-4));
    return { offset: done ? NO_OFFSET : offset, done };
  }
  const tau = camera.glide * 1000;
  if (reduced || tau <= 0) return { offset: from, done: true };
  // Slowing as a thing coasting does: the speed falls away by e every Glide, and it comes to rest where it would end.
  const carried = tau * (1 - Math.exp(-t / tau));
  return { offset: addOffsets(from, speed, carried), done: t > tau * 6 };
}
