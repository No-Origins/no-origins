import type { HumanPose, JointId } from "@no-origins/ui/lib/human-motion";
import { motionMs, motionNumber } from "@no-origins/ui/lib/motion";

/** Clay's three airborne abilities (World.md W107), independent of the renderer and the Suit's motion. */
export type ClayFlightMode = "hover" | "boost" | "glide";
export type ClayFlightFrame = {
  pose: HumanPose;
  /** Metres above the standing pose; the renderer converts this to rig units. */
  height: number;
  offset: readonly [number, number];
  jets: number;
  trails: number;
  time: number;
};
export type ClayFlightMotion = {
  takeoff: number; landing: number;
  hoverCycle: number; hoverHeight: number; hoverBob: number;
  boostCycle: number; boostHeight: number; boostBob: number; boostLean: number; jetLength: number;
  glideCycle: number; glideHeight: number; glideBob: number; glideLean: number; glideTravel: number;
};

/** Starting values, read as motion tokens (M3); this family has no studio bench yet. */
export function readClayFlightMotion(element: Element): ClayFlightMotion {
  const n = (name: string, fallback: number) => motionNumber(element, `--motion-human-clay-${name}`, fallback);
  const ms = (name: string, fallback: number) => motionMs(element, `--motion-human-clay-${name}`, fallback);
  return {
    takeoff: ms("takeoff", 1100), landing: ms("landing", 950),
    hoverCycle: ms("hover-cycle", 3800), hoverHeight: n("hover-height", 0.38), hoverBob: n("hover-bob", 0.045),
    boostCycle: ms("boost-cycle", 3000), boostHeight: n("boost-height", 0.76), boostBob: n("boost-bob", 0.05),
    boostLean: n("boost-lean", 22), jetLength: n("jet-length", 0.68),
    glideCycle: ms("glide-cycle", 5600), glideHeight: n("glide-height", 0.6), glideBob: n("glide-bob", 0.065),
    glideLean: n("glide-lean", 16), glideTravel: n("glide-travel", 0.22),
  };
}

export const clayFlightMode = (moves: string): ClayFlightMode | null =>
  moves === "hovering" ? "hover" : moves === "flying" ? "boost" : moves === "gliding" ? "glide" : null;

/** A held airborne frame, also used by deterministic rendering and motion review. */
export function clayFlightAt(mode: ClayFlightMode, time: number, motion: ClayFlightMotion, reduced = false): ClayFlightFrame {
  const cycle = mode === "hover" ? motion.hoverCycle : mode === "boost" ? motion.boostCycle : motion.glideCycle;
  const angle = reduced ? 0 : time / Math.max(1, cycle) * 2 * Math.PI;
  const wave = Math.sin(angle), sway = Math.sin(angle + Math.PI / 3);
  if (mode === "hover") return {
    pose: { hips: [0, 0, 2.5 * wave], head: [0, 0, -1.5 * wave], leftArm: [-3, 0, 12 + 2 * sway], rightArm: [-3, 0, -12 - 2 * sway], leftHip: [-2, 0, 0], rightHip: [2, 0, 0] },
    height: motion.hoverHeight + motion.hoverBob * wave, offset: [0, 0], jets: 0, trails: 0, time: reduced ? 0 : time,
  };
  if (mode === "boost") return {
    pose: { hips: [motion.boostLean, 0, -8 + 2 * wave], head: [-motion.boostLean * 0.6, 0, 4], leftArm: [12, 0, 22 + 2 * sway], rightArm: [16, 0, -16], leftHip: [-4, 0, 0], rightHip: [3, 0, 0] },
    height: motion.boostHeight + motion.boostBob * wave, offset: [0.055 * wave, 0], jets: 1, trails: 0, time: reduced ? 0 : time,
  };
  return {
    pose: { hips: [motion.glideLean, 0, 10 * wave], head: [-motion.glideLean * 0.55, 0, -5 * wave], leftArm: [-8, 0, 58 + 4 * sway], rightArm: [-8, 0, -58 - 4 * sway], leftHip: [-7, 0, 4], rightHip: [4, 0, -3] },
    height: motion.glideHeight + motion.glideBob * wave,
    offset: [motion.glideTravel * wave, motion.glideTravel * 0.45 * (Math.cos(angle) - 1)],
    jets: 0, trails: 1, time: reduced ? 0 : time,
  };
}

export function blendFlight(a: ClayFlightFrame, b: ClayFlightFrame, amount: number): ClayFlightFrame {
  const lerp = (x: number, y: number) => x + (y - x) * amount;
  const pose: HumanPose = {};
  const joints = new Set([...Object.keys(a.pose), ...Object.keys(b.pose)] as JointId[]);
  for (const id of joints) {
    const from = a.pose[id] ?? [0, 0, 0], to = b.pose[id] ?? [0, 0, 0];
    pose[id] = [lerp(from[0], to[0]), lerp(from[1], to[1]), lerp(from[2], to[2])];
  }
  return {
    pose, height: lerp(a.height, b.height), offset: [lerp(a.offset[0], b.offset[0]), lerp(a.offset[1], b.offset[1])],
    jets: lerp(a.jets, b.jets), trails: lerp(a.trails, b.trails), time: b.time,
  };
}

export const groundedFlight = (pose: HumanPose = {}, height = 0): ClayFlightFrame => ({ pose, height, offset: [0, 0], jets: 0, trails: 0, time: 0 });
export type ClayFlightState = {
  target: ClayFlightMode | null;
  from: ClayFlightFrame;
  frame: ClayFlightFrame;
  elapsed: number;
  clock: number;
  active: boolean;
  stage: "grounded" | "takeoff" | "airborne" | "landing";
};
export const flightStanding = (frame = groundedFlight()): ClayFlightState => ({ target: null, from: frame, frame, elapsed: 0, clock: 0, active: false, stage: "grounded" });

/** Interruptible takeoff, mode changes and landing; a new selection starts exactly at the current frame. */
export function stepClayFlight(state: ClayFlightState, target: ClayFlightMode | null, dt: number, motion: ClayFlightMotion, ground: ClayFlightFrame, reduced = false): ClayFlightState {
  const changed = state.target !== target;
  const from = changed ? state.frame : state.from;
  const elapsed = (changed ? 0 : state.elapsed) + Math.max(0, dt);
  const clock = state.clock + Math.max(0, dt);
  const duration = Math.max(1, target ? motion.takeoff : motion.landing);
  const t = reduced ? 1 : Math.min(1, elapsed / duration);
  const eased = t * t * t * (t * (t * 6 - 15) + 10);
  const goal = target ? clayFlightAt(target, clock, motion, reduced) : { ...ground, time: clock };
  return {
    target, from, elapsed, clock, frame: blendFlight(from, goal, eased), active: target !== null || t < 1,
    stage: target ? t < 1 ? "takeoff" : "airborne" : t < 1 ? "landing" : "grounded",
  };
}
