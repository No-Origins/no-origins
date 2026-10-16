import { springAt, springSettled } from "@no-origins/ui/lib/spring";

import { facing, reachOf, type CameraConfig, type Ground } from "./camera";

/**
 * How the camera moves (the camera's Movement, `camera.ts`; his: "We don't need modes … click and drag or arrows or
 * qwerty should move"). The camera keeps its height, angle and turn, and moves over the ground: where it is in the world
 * is not a setting, so nothing on the card moves with it.
 *
 * - **A drag** slides it, the ground under the hand following the hand at a Speed of 1×. Let go, it carries on at the
 *   hand's speed and slows over the Glide, or springs back to where the hand took hold (After a drag: Return), on the
 *   camera's spring, from the hand's speed (Response, Bounce; `@no-origins/ui/lib/spring`).
 * - **The arrows and W A S D** carry it the way it faces (↑ W), back (↓ S), left (← A) and right (→ D), at the Keys'
 *   metres a second, picking up and losing speed over the Glide.
 * - **E and Q** raise and lower a looked-round camera and what it looks at (his: "there is no way currently for me to
 *   move vertically"), at the same speed and over the same Glide; the visitor walks on the ground, so never theirs.
 *
 * However it moves, it stays over the Orbit's plane (`overGroundPlane` in `orbit.ts`, held by the engine).
 *
 * Under reduced motion nothing glides or springs. Nothing here is three.js.
 */

export const add = (a: Ground, b: Ground, by = 1): Ground => [a[0] + b[0] * by, a[1] + b[1] * by];
export const NOWHERE: Ground = [0, 0];

/**
 * How far a move of the hand, `dx` and `dy` pixels across a view `height` pixels tall, slides the camera, in metres:
 * at 1× the ground at the middle of the view keeps to the hand; dragged towards you, the camera goes forward.
 */
export function slideOf(camera: CameraConfig, fov: number, height: number, dx: number, dy: number): Ground {
  const way = facing(camera.turn);
  const right: Ground = [-way[2], way[0]];
  const along = Math.hypot(reachOf(camera), Math.max(0.2, camera.height));
  const metres = ((along * 2 * Math.tan((fov * Math.PI) / 360)) / height) * camera.speed;
  return [(-right[0] * dx + way[0] * dy) * metres, (-right[1] * dx + way[2] * dy) * metres];
}

/**
 * Where a let-go drag is `t` ms after it was let go `from` (the slide since the hand took hold), moving at `speed`
 * (metres a ms), and whether it has come to rest: carrying on and slowing over the Glide, or springing back to none.
 */
export function releasedAt(camera: CameraConfig, from: Ground, speed: Ground, t: number, reduced: boolean): { slid: Ground; done: boolean } {
  if (camera.after === "return") {
    if (reduced) return { slid: NOWHERE, done: true };
    const spring = { response: camera.response, bounce: camera.bounce };
    const states = [0, 1].map((i) => springAt({ x: from[i], v: speed[i] }, 0, t, spring));
    const done = states.every((state) => springSettled(state, 0, 1e-3));
    return { slid: done ? NOWHERE : [states[0].x, states[1].x], done };
  }
  const tau = camera.glide * 1000;
  if (reduced || tau <= 0) return { slid: from, done: true };
  // Slowing as a thing coasting does: the speed falls away by e every Glide, and it comes to rest where it would end.
  return { slid: add(from, speed, tau * (1 - Math.exp(-t / tau))), done: t > tau * 6 };
}

/** The keys that move the camera, each the way it moves: forward, back, left, right. */
const KEYS: Record<string, Ground> = {
  ArrowUp: [0, 1],
  KeyW: [0, 1],
  ArrowDown: [0, -1],
  KeyS: [0, -1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};

/** Whether a key moves the camera (by its `code`, so W A S D are where they are on any keyboard). */
export const movesCamera = (code: string) => code in KEYS;

/**
 * The speed the held keys ask for, in metres a ms over the ground: the Keys' speed the way they point. Without
 * `sideways` the keys across (A, D, ← →) carry nothing: they turn instead (`keysTurn`, World.md W78).
 */
export function keysWant(camera: CameraConfig, held: ReadonlySet<string>, sideways = true): Ground {
  let across = 0;
  let ahead = 0;
  for (const code of held) {
    const way = KEYS[code];
    if (!way || (!sideways && way[0])) continue;
    across += way[0];
    ahead += way[1];
  }
  const size = Math.hypot(across, ahead);
  if (!size) return NOWHERE;
  const way = facing(camera.turn);
  const right: Ground = [-way[2], way[0]];
  const metres = camera.keys / 1000 / size;
  return [(right[0] * across + way[0] * ahead) * metres, (right[1] * across + way[2] * ahead) * metres];
}

/** The keys that raise (E) and lower (Q) a looked-round camera, beside W A S D. */
const RISE: Record<string, number> = { KeyE: 1, KeyQ: -1 };

/** Whether a key raises or lowers a looked-round camera (by its `code`, as W A S D are). */
export const risesCamera = (code: string) => code in RISE;

/** The speed the held E and Q ask for, in metres a ms: up or down at the Keys' speed, none while both or neither are held. */
export function keysRise(camera: CameraConfig, held: ReadonlySet<string>): number {
  let rise = 0;
  for (const code of held) rise += RISE[code] ?? 0;
  return (Math.sign(rise) * camera.keys) / 1000;
}

/** Which way the held keys across turn the look (World.md W78, A and D: Turn): −1 to the left, 1 to the right, 0 neither. */
export function keysTurn(held: ReadonlySet<string>): number {
  let turn = 0;
  for (const code of held) turn += KEYS[code]?.[0] ?? 0;
  return Math.sign(turn);
}

/** The keys' speed `dt` ms on: closing on what they want over the Glide, at once under reduced motion or none. */
export function steer(camera: CameraConfig, speed: Ground, want: Ground, dt: number, reduced: boolean): Ground {
  const tau = camera.glide * 1000;
  if (reduced || tau <= 0) return want;
  const k = 1 - Math.exp(-dt / tau);
  return [speed[0] + (want[0] - speed[0]) * k, speed[1] + (want[1] - speed[1]) * k];
}
