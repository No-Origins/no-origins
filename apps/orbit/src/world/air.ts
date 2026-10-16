import type { HumanPose, JointAngles, JointId } from "@no-origins/ui/lib/human-motion";
import { motionMs, motionNumber } from "@no-origins/ui/lib/motion";

import type { Crossing } from "./grove";
import { GRAVITY } from "./walking";

/**
 * How the visitor's figure leaves the ground (his: "The default motion of the character the orbit should be walk. And
 * should run using Shift. Space should jump. And double space should enable flight. When in flight, the rest state
 * should be hover and moving should be flying with boosters on."). Nothing here is three.js.
 *
 * - **It walks**, at its Gait's Walk up to; **Shift runs** it, at the camera's Keys.
 * - **Space jumps** it from the ground, this high (`jumpHeight`), and the fall (`walking.ts`, W101) brings it down.
 * - **Space twice**, the second within `tap` of the first, starts its **flight** where it is (the first has jumped it);
 *   twice again ends it, and it falls. *Mine:* in flight Space held rises and Shift held sinks, at `flyRise`; sunk onto
 *   the ground it lands and walks again.
 * - **In flight it hovers at rest and flies as it goes**, on its boosters: the Human page's Hovering and
 *   Flying (`inPlaceOf`), the figure easing from one to the other, and from the ground's gait into them, over its Settle.
 *   It flies `flyPace` times the camera's Keys, so a flight is faster than a run however fast the Keys are.
 *
 * Every number is a `--motion-human-*` token read off the canvas with these starting values, mine (Motion.md M3; on
 * the bench, not yet in globals.css), as the hover's and the flight's are (`readHoverMotion`).
 */
export type AirMotion = { jumpHeight: number; tap: number; flyPace: number; flyRise: number };

export function readAirMotion(element: Element): AirMotion {
  return {
    jumpHeight: motionNumber(element, "--motion-human-jump-height", 1.2),
    tap: motionMs(element, "--motion-human-fly-tap", 300),
    flyPace: motionNumber(element, "--motion-human-fly-pace", 1.5),
    flyRise: motionNumber(element, "--motion-human-fly-rise", 6),
  };
}

/** The speed a jump leaves the ground at, in metres a second, to rise `height` metres under `GRAVITY`. */
export const jumpSpeed = (height: number) => Math.sqrt(2 * GRAVITY * Math.max(0, height));

/**
 * The underside nearest over `from` metres in a column (`Crossing`s facing down): what a figure rising from there meets
 * first, its head stopping under it; `Infinity` where nothing is over it.
 */
export function ceilingOver(crossings: readonly Crossing[], from: number): number {
  let ceiling = Infinity;
  for (const crossing of crossings) if (!crossing.up && crossing.y > from && crossing.y < ceiling) ceiling = crossing.y;
  return ceiling;
}

/** Two poses mixed, `t` of the way from `a` to `b` (0 to 1), a joint either leaves out standing at none. */
export function mixPoses(a: { pose: HumanPose; lift: number }, b: { pose: HumanPose; lift: number }, t: number): { pose: HumanPose; lift: number } {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const pose: HumanPose = {};
  const none: JointAngles = [0, 0, 0];
  for (const id of new Set([...Object.keys(a.pose), ...Object.keys(b.pose)]) as Set<JointId>) {
    const from = a.pose[id] ?? none;
    const to = b.pose[id] ?? none;
    pose[id] = [0, 1, 2].map((i) => from[i] + (to[i] - from[i]) * t) as JointAngles;
  }
  return { pose, lift: a.lift + (b.lift - a.lift) * t };
}
