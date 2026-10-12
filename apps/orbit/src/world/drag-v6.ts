import { springAt, springSettled } from "@no-origins/ui/lib/spring";

import { eyeOf, gazeOf, REACH, type CameraConfig } from "./camera-v6";

/**
 * FROZEN with the camera's version 6 (`camera-v6.ts`); version 7's is `drag.ts`.
 *
 * The camera's drag (the camera's Drag, `camera.ts`; his: "I'm unable to move with click and drag. Fix that. I also
 * need controls to create drag effects"). The camera is the point it looks at (the aim) and where it stands from it; the
 * hand moves them from what they were when it took hold, by an offset, so the card shows its values moving (his: "I have
 * to see them"):
 *
 * - **Pan** slides the point over the ground, the camera with it: the visitor travels, any way (his: "The user can move
 *   or travel in any direction they want"). At a Speed of 1× the ground under the hand stays under it. No value on the
 *   card moves: where the visitor is, is not one.
 * - **Orbit** swings the camera round the point: Turn and Angle. It never goes under the ground.
 * - **Look** turns the camera where it stands, as a head turns, the point swinging round with its gaze: Turn and Angle.
 *   At 1× the world under the hand stays under it.
 *
 * Let go, the offset carries on at the hand's speed, slowing over the Glide, or springs back to none, to where the hand
 * took hold, on the camera's spring, starting at the hand's speed (Response, Bounce; `@no-origins/ui/lib/spring`). Both
 * are worked out from the moment it was let go, so a frame at any moment is the same however it is reached (Motion.md
 * M17). Nothing here is three.js.
 */

type Vec = readonly [number, number, number];

/** The camera: its values, and the point it looks at. */
export type Rig = { camera: CameraConfig; aim: Vec };

/** How far the drag has moved the camera: turned (`yaw`) and tipped (`pitch`), in radians; the point slid, in metres. */
export type Offset = { yaw: number; pitch: number; x: number; z: number };

export const NO_OFFSET: Offset = { yaw: 0, pitch: 0, x: 0, z: 0 };

const KEYS = ["yaw", "pitch", "x", "z"] as const;
const RAD = Math.PI / 180;

/** How low an orbiting camera may go, in metres over the ground; how far a pan may take the point, in metres. */
const LOWEST = 0.2;
const TRAVEL = 1000;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const wrap = (degrees: number) => ((((degrees + 180) % 360) + 360) % 360) - 180;

/** An offset kept within reach: an orbit above the ground, a look's angle, a pan within the world. */
export function within(held: Rig, offset: Offset): Offset {
  const { camera, aim } = held;
  if (camera.drag === "pan") {
    return { ...offset, x: clamp(offset.x, -TRAVEL - aim[0], TRAVEL - aim[0]), z: clamp(offset.z, -TRAVEL - aim[2], TRAVEL - aim[2]) };
  }
  if (camera.drag === "look") {
    return { ...offset, pitch: clamp(offset.pitch, (camera.angle - REACH.angle.max) * RAD, (camera.angle - REACH.angle.min) * RAD) };
  }
  // An orbit keeps the camera over the ground: it stands `distance` from the point, `angle` above its level.
  const lowest = Math.asin(clamp((LOWEST - aim[1]) / Math.max(0.5, camera.distance), -1, 1)) / RAD;
  return { ...offset, pitch: clamp(offset.pitch, (Math.max(lowest, REACH.angle.min) - camera.angle) * RAD, (REACH.angle.max - camera.angle) * RAD) };
}

/** The camera the drag has moved to: what it was when the hand took hold, by the offset. */
export function moved(held: Rig, offset: Offset): Rig {
  const { camera, aim } = held;
  if (camera.drag === "pan") return { camera, aim: [aim[0] + offset.x, aim[1], aim[2] + offset.z] };
  const turn = wrap(camera.turn - offset.yaw / RAD);
  if (camera.drag === "orbit") return { camera: { ...camera, turn, angle: camera.angle + offset.pitch / RAD }, aim };
  // A look keeps the camera where it stands and swings the point round it, as far away as it was.
  const angle = camera.angle - offset.pitch / RAD;
  const { position } = eyeOf(camera, aim);
  const gaze = gazeOf(turn, angle);
  const d = Math.max(0.5, camera.distance);
  return { camera: { ...camera, turn, angle }, aim: [position[0] + gaze[0] * d, position[1] + gaze[1] * d, position[2] + gaze[2] * d] };
}

/**
 * How far a move of the hand, `dx` and `dy` pixels across a view `height` pixels tall, moves the offset, at a Speed of
 * 1×: an orbit half a turn a height of the view; a look and a slide keeping what is under the hand under it.
 */
export function moveOf(held: Rig, fov: number, height: number, dx: number, dy: number): Offset {
  const { camera } = held;
  if (camera.drag === "pan") {
    const forward: Vec = [Math.sin(camera.turn * RAD), 0, -Math.cos(camera.turn * RAD)];
    const right: Vec = [-forward[2], 0, forward[0]];
    const metres = ((Math.max(0.5, camera.distance) * 2 * Math.tan((fov * Math.PI) / 360)) / height) * camera.speed;
    return { yaw: 0, pitch: 0, x: (-right[0] * dx + forward[0] * dy) * metres, z: (-right[2] * dx + forward[2] * dy) * metres };
  }
  const turn = ((camera.drag === "look" ? fov * RAD : Math.PI) / height) * camera.speed;
  // An orbit swings the camera against the hand, so the world turns with it; a look turns the gaze with the hand's pull.
  const yaw = camera.drag === "look" ? dx * turn : -dx * turn;
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
