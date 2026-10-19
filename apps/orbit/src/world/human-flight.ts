import type { HumanPose, JointId } from "@no-origins/ui/lib/human-motion";
import { motionMs, motionNumber } from "@no-origins/ui/lib/motion";

/** Clay's three airborne abilities (World.md W107), independent of the renderer and the Suit's motion. */
export type ClayFlightMode = "hover" | "boost" | "glide";
export type ClayFlightFrame = {
  pose: HumanPose;
  /** Metres above the standing pose; the renderer converts this to rig units. */
  height: number;
  /** The part of `height` that is the ability's own bob, which the world adds over the height it is flying at. */
  bob: number;
  offset: readonly [number, number];
  jets: number;
  trails: number;
  time: number;
};
export type ClayFlightMotion = {
  takeoff: number; landing: number; change: number;
  hoverCycle: number; hoverHeight: number; hoverBob: number;
  boostCycle: number; boostHeight: number; boostBob: number; boostLean: number; jetLength: number;
  glideCycle: number; glideHeight: number; glideBob: number; glideLean: number; glideTravel: number;
};

/** Starting values, read as motion tokens (M3); this family has no studio bench yet. */
export function readClayFlightMotion(element: Element): ClayFlightMotion {
  const n = (name: string, fallback: number) => motionNumber(element, `--motion-human-clay-${name}`, fallback);
  const ms = (name: string, fallback: number) => motionMs(element, `--motion-human-clay-${name}`, fallback);
  return {
    takeoff: ms("takeoff", 1100), landing: ms("landing", 950), change: ms("change", 520),
    hoverCycle: ms("hover-cycle", 3800), hoverHeight: n("hover-height", 0.38), hoverBob: n("hover-bob", 0.045),
    boostCycle: ms("boost-cycle", 3000), boostHeight: n("boost-height", 0.76), boostBob: n("boost-bob", 0.05),
    boostLean: n("boost-lean", 22), jetLength: n("jet-length", 0.68),
    glideCycle: ms("glide-cycle", 5600), glideHeight: n("glide-height", 0.6), glideBob: n("glide-bob", 0.065),
    glideLean: n("glide-lean", 24), glideTravel: n("glide-travel", 0.22),
  };
}

export const clayFlightMode = (moves: string): ClayFlightMode | null =>
  moves === "hovering" ? "hover" : moves === "flying" ? "boost" : moves === "gliding" ? "glide" : null;

/**
 * A held airborne frame, also used by deterministic rendering and motion review. Each limb rides its own phase behind
 * the body's bob, so arms and legs follow through the float instead of moving in lockstep with it.
 */
export function clayFlightAt(mode: ClayFlightMode, time: number, motion: ClayFlightMotion, reduced = false): ClayFlightFrame {
  const cycle = mode === "hover" ? motion.hoverCycle : mode === "boost" ? motion.boostCycle : motion.glideCycle;
  const angle = reduced ? 0 : time / Math.max(1, cycle) * 2 * Math.PI;
  const wave = Math.sin(angle), sway = Math.sin(angle + Math.PI / 3);
  const lag = Math.sin(angle - 0.9), trail = Math.sin(angle - 1.6);
  if (mode === "hover") {
    const bob = motion.hoverBob * (wave + 0.25 * Math.sin(2 * angle + 1));
    return {
      pose: {
        hips: [0, 0, 2.5 * wave], spine: [-1.5 * lag, 0, 0], head: [1.2 * lag, 0, -1.5 * wave],
        leftArm: [-3 + 2 * trail, 0, 12 + 3 * lag], rightArm: [-3 + 2 * trail, 0, -12 - 3 * lag],
        leftHip: [-2 + 2 * trail, 0, 1], rightHip: [2 - 1.5 * trail, 0, -1],
      },
      height: motion.hoverHeight + bob, bob, offset: [0, 0], jets: 0, trails: 0, time: reduced ? 0 : time,
    };
  }
  if (mode === "boost") {
    // The jets' fine shudder runs on its own fast clock; the legs ride it, the arms only the slow bob.
    const shudder = reduced ? 0 : Math.sin(time / 83) * 0.6 + Math.sin(time / 47 + 1.3) * 0.4;
    const bob = motion.boostBob * wave;
    return {
      pose: {
        hips: [motion.boostLean, 0, -8 + 2 * wave], spine: [2, 0, 0], head: [-motion.boostLean * 0.6 - 2, 0, 4],
        leftArm: [12 + 3 * lag, 0, 22 + 2 * sway], rightArm: [16 + 3 * lag, 0, -16 - 2 * sway],
        leftHip: [-4 + 1.2 * shudder, 0, 1], rightHip: [3 - 1.2 * shudder, 0, -1],
      },
      height: motion.boostHeight + bob, bob, offset: [0.055 * wave, 0], jets: 1, trails: 0, time: reduced ? 0 : time,
    };
  }
  // The glide: chest open, arms spread and swept a little back like a wing, the legs together and trailing; the long
  // bank rocks it, and each arm answers the bank late, the far arm later than the near one.
  const bob = motion.glideBob * wave;
  return {
    pose: {
      hips: [motion.glideLean, 0, 7 * wave], spine: [-5, 0, -2 * lag], chest: [-3, 0, 0],
      head: [-motion.glideLean * 0.7, 0, -4 * wave],
      leftArm: [10 + 3 * lag, 0, 64 + 5 * lag], rightArm: [10 + 3 * trail, 0, -64 - 5 * trail],
      leftHip: [9 + 1.5 * trail, 0, 3], rightHip: [11 - 1.5 * trail, 0, -3],
    },
    height: motion.glideHeight + bob, bob,
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
    pose, height: lerp(a.height, b.height), bob: lerp(a.bob, b.bob), offset: [lerp(a.offset[0], b.offset[0]), lerp(a.offset[1], b.offset[1])],
    jets: lerp(a.jets, b.jets), trails: lerp(a.trails, b.trails), time: b.time,
  };
}

export const groundedFlight = (pose: HumanPose = {}, height = 0): ClayFlightFrame => ({ pose, height, bob: 0, offset: [0, 0], jets: 0, trails: 0, time: 0 });
export type ClayFlightState = {
  target: ClayFlightMode | null;
  from: ClayFlightFrame;
  frame: ClayFlightFrame;
  elapsed: number;
  /** How long the blend from `from` lasts, ms: chosen when the target changes. */
  duration: number;
  clock: number;
  active: boolean;
  stage: "grounded" | "takeoff" | "airborne" | "landing";
};
export const flightStanding = (frame = groundedFlight()): ClayFlightState => ({ target: null, from: frame, frame, elapsed: 0, duration: 1, clock: 0, active: false, stage: "grounded" });

/** Interruptible takeoff, mode changes and landing; a new selection starts exactly at the current frame. */
export function stepClayFlight(state: ClayFlightState, target: ClayFlightMode | null, dt: number, motion: ClayFlightMotion, ground: ClayFlightFrame, reduced = false): ClayFlightState {
  const changed = state.target !== target;
  const from = changed ? state.frame : state.from;
  const elapsed = (changed ? 0 : state.elapsed) + Math.max(0, dt);
  const clock = state.clock + Math.max(0, dt);
  // Lifting off takes the Takeoff, landing the Landing, and changing ability in the air the shorter Change, so the
  // body answers the keys sooner.
  const duration = !changed ? state.duration : Math.max(1, !target ? motion.landing : state.target ? motion.change : motion.takeoff);
  const t = reduced ? 1 : Math.min(1, elapsed / duration);
  const eased = t * t * t * (t * (t * 6 - 15) + 10);
  const goal = target ? clayFlightAt(target, clock, motion, reduced) : { ...ground, time: clock };
  return {
    target, from, elapsed, duration, clock, frame: blendFlight(from, goal, eased), active: target !== null || t < 1,
    stage: target ? t < 1 ? "takeoff" : "airborne" : t < 1 ? "landing" : "grounded",
  };
}

/** A damped spring's value and speed. */
type Spring = { x: number; v: number };
const still = (): Spring => ({ x: 0, v: 0 });
/** One spring `dt` seconds on toward `to`, at `hz` with `damping` (1 critical), in fixed small steps so it never blows up. */
function spring(s: Spring, to: number, dt: number, hz: number, damping: number): Spring {
  const w = 2 * Math.PI * hz;
  let { x, v } = s;
  for (let left = dt; left > 0; left -= 1 / 240) {
    const h = Math.min(left, 1 / 240);
    v += (w * w * (to - x) - 2 * damping * w * v) * h;
    x += v * h;
  }
  return { x, v };
}

/**
 * The body's secondary motion in the air: what its travel does to it on top of the ability's pose. It pitches into
 * acceleration and flares back as it brakes, banks into a turn by how fast it turns at how fast it goes, its arms
 * swing behind a push and its legs trail its speed, each on a looser spring than the body so they follow through, and
 * its clay squashes and stretches as it launches and lands. The head counters the body, so the gaze stays level.
 */
export type ClayFlightBody = { pitch: Spring; roll: Spring; arms: Spring; spread: Spring; legs: Spring; squash: Spring };
export const flightBodyStill = (): ClayFlightBody => ({ pitch: still(), roll: still(), arms: still(), spread: still(), legs: still(), squash: still() });
export type ClayFlightDrive = {
  /** How far into the air it is, 0 on the ground to 1 flying. */
  air: number;
  /** Acceleration along the way it faces and to its right, metres a second squared. */
  ahead: number; side: number;
  /** Its speed over the ground as a share of its flying speed. */
  speed: number;
  /** How fast it is turning, degrees a second, positive to its right. */
  yaw: number;
  /** Vertical speed, metres a second, up positive. */
  climb: number;
};

/** A kick to the body: on launch, `stretch` up; on landing, an impact (m/s) squashes it and throws its arms out. */
export function kickFlightBody(body: ClayFlightBody, kick: { stretch?: number; impact?: number }): ClayFlightBody {
  const stretch = kick.stretch ?? 0, impact = kick.impact ?? 0;
  return {
    ...body,
    // Launching, the arms push down and back and open a little for balance, the legs kick back; landing, the
    // body dips forward over its feet, the arms fly out and forward.
    squash: { ...body.squash, v: body.squash.v + stretch * 1.6 - impact * 0.26 },
    arms: { ...body.arms, v: body.arms.v + stretch * 150 - impact * 20 },
    spread: { ...body.spread, v: body.spread.v + stretch * 60 + impact * 45 },
    legs: { ...body.legs, v: body.legs.v + stretch * 120 },
    pitch: { ...body.pitch, v: body.pitch.v + impact * 12 },
  };
}

export function stepFlightBody(body: ClayFlightBody, drive: ClayFlightDrive, dt: number, reduced: boolean): ClayFlightBody {
  if (reduced) return flightBodyStill();
  const s = Math.max(0, dt) / 1000, clamp = (x: number, low: number, high: number) => Math.min(high, Math.max(low, x));
  const { air } = drive;
  return {
    pitch: spring(body.pitch, air * clamp(drive.ahead * 1.5 - drive.climb * 1.2, -16, 18), s, 1.4, 0.75),
    roll: spring(body.roll, air * clamp(drive.yaw * drive.speed * 0.32 + drive.side * 0.8, -30, 30), s, 1.1, 0.8),
    arms: spring(body.arms, air * clamp(drive.ahead * 2.4 + drive.climb * 3, -20, 28), s, 1.6, 0.42),
    spread: spring(body.spread, air * clamp(-drive.climb * 5, -10, 26), s, 1.5, 0.45),
    legs: spring(body.legs, air * clamp(drive.speed * 12 + drive.ahead * 1.2, -8, 22), s, 1.2, 0.5),
    squash: spring(body.squash, 0, s, 3.2, 0.32),
  };
}

/** Whether the body is still moving of its own accord, so the world keeps drawing until it settles. */
export const flightBodyMoving = (body: ClayFlightBody) =>
  Object.values(body).some(({ x, v }) => Math.abs(x) > 0.01 || Math.abs(v) > 0.01);

/** The ability's pose with the body's secondary motion added. */
export function withFlightBody(pose: HumanPose, body: ClayFlightBody): HumanPose {
  const add = (id: JointId, by: readonly [number, number, number]) => {
    const [x, y, z] = pose[id] ?? [0, 0, 0];
    return [x + by[0], y + by[1], z + by[2]] as [number, number, number];
  };
  const pitch = body.pitch.x, roll = body.roll.x, arms = body.arms.x, spread = body.spread.x, legs = body.legs.x;
  return {
    ...pose,
    hips: add("hips", [pitch, 0, roll]),
    chest: add("chest", [0, 0, roll * 0.2]),
    head: add("head", [-pitch * 0.65, 0, -roll * 0.55]),
    leftArm: add("leftArm", [arms, 0, spread + roll * 0.25]),
    rightArm: add("rightArm", [arms, 0, -spread + roll * 0.25]),
    leftHip: add("leftHip", [legs, 0, -roll * 0.15]),
    rightHip: add("rightHip", [legs * 1.08, 0, -roll * 0.15]),
  };
}

/** The clay's squash and stretch as scales, its volume kept: taller is thinner. */
export const squashOf = (body: ClayFlightBody): readonly [across: number, up: number] => {
  const up = Math.min(1.18, Math.max(0.84, 1 + body.squash.x));
  return [1 / Math.sqrt(up), up];
};
