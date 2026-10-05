import * as THREE from "three";

import type { At, Look } from "@/lib/house";

/**
 * The tour (Home.md H9): fixed cameras in the house — the stops — and the walk between them. A stop is a camera the
 * description names, with what the guide says there and, where an image model has made one, the realistic picture of
 * that place, taken from that camera; a leg is the way from one stop to the next, through the doors it opens. Play
 * walks the legs in order and waits at each stop; the picture floats in the room in front of the camera, a window in
 * the model's space (H9). Nothing here draws; the viewer plays what this describes.
 */

/** A realistic picture of a stop, made from the stop's camera; `aspect` is width over height. */
export type Picture = { src: string; aspect: number; made: string };

export type Stop = {
  id: string;
  label: string;
  /** What the guide says here. */
  say: string;
  look: Look;
  picture?: Picture;
};

/**
 * The way from a stop to the next: the points the camera passes, in order, so it goes through doors and not walls —
 * each at the height the eye is there — and the doors that open as it comes. `look` is where the camera looks on the
 * way: ahead along its path, or blending straight from the stop it leaves to the one it reaches (a flight).
 */
export type Leg = {
  via?: readonly At[];
  doors?: readonly string[];
  look?: "ahead" | "blend";
  /** How long the leg takes, seconds, instead of its length at walking speed — the slow approach from the long shot. */
  seconds?: number;
};

/**
 * The long shot (version 4, his): where the model stands when the page opens, before the tour — the whole house from
 * afar — and the way in from it to the first stop, which Play takes slowly. It is not a stop: no number, no picture.
 */
export type Opening = { label: string; say: string; look: Look; approach: Leg };

export type Tour = { opening?: Opening; stops: readonly Stop[]; legs: readonly Leg[] };

/**
 * The tour's numbers: seconds and feet. They are the viewer's for now, not `--motion-*` tokens — the intro's are the
 * same (Grid.md D50) — and his to tune once he has walked it.
 */
export const TOUR_MOTION = {
  /** Walking speed along a leg, feet a second (version 6, his: "very quick" at 6). */
  speed: 4.5,
  /** The least and the most a leg takes, seconds. */
  legMin: 2.5,
  legMax: 12,
  /**
   * The walk's speed profile: it gets up to speed over this share of the leg and slows over the same at the end,
   * cruising between — so its fastest is 1 / (1 − ramp) of its average (1.43× at 0.3), where the cubic ease it had
   * ran the middle of every leg at three times its average.
   */
  ramp: 0.3,
  /**
   * How far ahead on its path the camera looks as it walks, feet; the most its look turns, degrees a second, unless
   * it must turn faster to be on the stop's look as it arrives; and how long its look takes to follow, seconds.
   */
  lookAhead: 6,
  turnRate: 60,
  lookLag: 0.3,
  /** A leg shorter than this is a turn in place: the look swings from the stop it leaves to the one it reaches. */
  turnOnly: 6,
  /** How long the walk waits at a stop before moving on, seconds (version 7, his: "at max three seconds"; 6 while the voice spoke). */
  dwell: 3,
  /** How soon the walk moves on after Play at a stop, seconds. */
  resume: 0.5,
  /** The last stop's pullback into the plan, seconds. */
  ending: 8,
  /** Let the final Plan settle before the thank-you appears. */
  thanksDelay: 0.6,
  /** A picture's fade in on arrival and out on leaving, seconds. */
  pictureIn: 0.6,
  pictureOut: 0.35,
  /** A door's swing, seconds, and how near the camera is when it starts, feet. */
  door: 0.7,
  doorReach: 9,
  /** How much of the view's height or width the picture takes at its stop, and how far in front it hangs, feet. */
  fill: 0.78,
  nearest: 2.5,
  farthest: 8,
  /** The default field of view of a look, degrees top to bottom. */
  fov: 42,
} as const;

/** A swing is just short of a right angle, so an open leaf never lies in its own wall. */
export const DOOR_SWING = (Math.PI / 2) * 0.95;

export const vec = ([x, level, y]: At) => new THREE.Vector3(x, level, y);

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * How far along its leg the walk is at `t` of its time (both 0 to 1): a cruise. Speed rises on a cosine over the
 * first `ramp` of the time, holds, and falls the same way over the last — a walk, not a dash — where `easeInOut`
 * peaks at three times the average. The ramps' shape makes the acceleration continuous, so nothing lurches.
 */
export function walkProfile(t: number, ramp = TOUR_MOTION.ramp): number {
  const r = THREE.MathUtils.clamp(ramp, 0.01, 0.5);
  const x = THREE.MathUtils.clamp(t, 0, 1);
  const peak = 1 / (1 - r);
  // The distance covered by a cosine ramp from rest up to `peak` over `r` of the time, at `x` into it.
  const rise = (x: number) => (peak * (x - (r / Math.PI) * Math.sin((Math.PI * x) / r))) / 2;
  if (x < r) return rise(x);
  if (x <= 1 - r) return rise(r) + peak * (x - r);
  return 1 - rise(1 - x);
}
export const smoothstep = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export type Pose = { position: THREE.Vector3; target: THREE.Vector3; fov: number };

/**
 * A leg's way, worked out once as it sets off: the curve, its length, how long it takes — and where the camera looks
 * at each step of it (`looks`, unit directions, one every `1 / (looks.length − 1)` of the way), smoothed in time,
 * so a frame only reads them.
 */
export type Path = { curve: THREE.CatmullRomCurve3; length: number; duration: number; looks: THREE.Vector3[] };

/** How many steps of the way a leg's looks are worked out at. */
const LOOK_STEPS = 240;

/** `a` turned toward `b` by `t` of the way — the short way, as unit vectors (a normalised lerp, which is enough here). */
const toward = (a: THREE.Vector3, b: THREE.Vector3, t: number) => {
  const out = a.clone().lerp(b, t);
  return out.lengthSq() > 1e-8 ? out.normalize() : b.clone();
};

/** The angle between two unit vectors, radians. */
const between = (a: THREE.Vector3, b: THREE.Vector3) => Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));

/** `a` turned toward `b` by at most `most` radians — all the way when that is enough. */
const turnToward = (a: THREE.Vector3, b: THREE.Vector3, most: number) => {
  const angle = between(a, b);
  if (angle <= most || angle < 1e-6) return b.clone();
  const axis = new THREE.Vector3().crossVectors(a, b);
  // Opposite directions have no axis of their own: turn about the up axis, or any that is not along them.
  if (axis.lengthSq() < 1e-8) axis.crossVectors(a, Math.abs(a.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0));
  return a.clone().applyAxisAngle(axis.normalize(), most);
};

/**
 * The way from where the camera is to a stop: a smooth curve through the leg's points. It starts from the camera's
 * actual position and look — a drag may have left the stop — so a walk never jumps. Points nearly on top of each
 * other are taken as one, since a curve through two of the same has no direction there.
 *
 * The looks (version 6, his: "very quick and shaky"), one for each step of the leg's TIME (`looks[k]` is at
 * `k / (looks.length − 1)` of it, the walk's profile already in): the camera looks where it is going — a point
 * `lookAhead` feet on along its path — leaving the look it set off with over the first third and coming onto the
 * stop's over the second half; a leg shorter than `turnOnly` is a turn in place from the one to the other. These are
 * blended as DIRECTIONS, never as points: a blend of points at different distances swung the camera round as it
 * passed one of them (walking in at the main door it passed the very point it had been looking at, and the look
 * flipped), and the stop's look is its own direction once the stop is near, not "at its point from here", which
 * swings round over the last feet. Then the look FOLLOWS that want through time: it turns at most `turnRate` a
 * second — a corner is turned as a head turns, where a look-ahead point going round a door post turned it in a few
 * frames — unless it must turn faster to be on the stop's look as it arrives, and is smoothed once more with
 * `lookLag` so the turn's speed is continuous; the last step is exactly the stop's look, so arriving never snaps.
 * A flight (`look: "blend"`) keeps lerping its two far targets.
 */
export function legPath(from: Pose, to: Look, leg: Leg, reduced = false): Path {
  const points = [from.position.clone(), ...(leg.via ?? []).map(vec), vec(to.from)].filter(
    (point, i, all) => i === 0 || point.distanceTo(all[i - 1]!) > 0.05,
  );
  if (points.length < 2) points.push(points[0]!.clone().add(new THREE.Vector3(0, 0, 0.1)));
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const length = curve.getLength();
  // How long the walk takes at walking speed; a leg whose look must turn far takes longer, below.
  let duration = reduced ? 0 : (leg.seconds ?? THREE.MathUtils.clamp(length / TOUR_MOTION.speed, TOUR_MOTION.legMin, TOUR_MOTION.legMax));
  const looks: THREE.Vector3[] = [];
  if (leg.look !== "blend") {
    const end = vec(to.to);
    const endFrom = vec(to.from);
    const startDir = from.target.clone().sub(from.position);
    const endDir = end.clone().sub(endFrom);
    if (startDir.lengthSq() < 1e-6) startDir.copy(endDir);
    startDir.normalize();
    endDir.normalize();
    const turnOnly = length < TOUR_MOTION.turnOnly;
    const raw: THREE.Vector3[] = [];
    const ends: THREE.Vector3[] = [];
    for (let k = 0; k <= LOOK_STEPS; k++) {
      // Steps of the leg's time; where the camera is then is the walk's profile of it.
      const u = reduced ? 1 : walkProfile(k / LOOK_STEPS);
      const here = curve.getPointAt(u);
      // The stop's look as it is reached: at the stop's point from here while it is far, then the stop's own
      // direction — the point's direction from a step away swings round as the last feet are walked, and the camera
      // must stand at the stop looking exactly as it does.
      const toEnd = end.clone().sub(here);
      const endHere = toward(toEnd.lengthSq() > 1e-6 ? toEnd.normalize() : endDir, endDir, smoothstep(0.55, 0.85, u));
      ends.push(endHere);
      if (turnOnly) {
        raw.push(toward(startDir, endHere, smoothstep(0, 1, u)));
        continue;
      }
      const aheadAt = Math.min(1, u + TOUR_MOTION.lookAhead / Math.max(length, 0.1));
      const onward = curve.getPointAt(aheadAt).sub(here);
      const ahead = onward.lengthSq() > 1e-6 ? onward.normalize() : curve.getTangentAt(u).normalize();
      const wStart = 1 - smoothstep(0, 0.3, u);
      const wEnd = smoothstep(0.45, 0.8, u);
      const wAhead = Math.max(0, 1 - wStart - wEnd);
      const mixed = new THREE.Vector3().addScaledVector(startDir, wStart).addScaledVector(ahead, wAhead).addScaledVector(endHere, wEnd);
      raw.push(mixed.lengthSq() > 1e-6 ? mixed.normalize() : ahead);
    }
    // A leg is as long as its turn needs, when that is longer than its walk (his: "very quick and shaky" — a stop
    // whose look faces away from the way in was turned onto in the last second): a turn in place takes its angle at
    // `turnRate`, half as long again for its ramps; a walk's turn onto the stop's look, from where the look-ahead
    // has it at the middle, has about half the leg's time to happen in.
    if (!reduced && leg.seconds === undefined) {
      const rate = THREE.MathUtils.degToRad(TOUR_MOTION.turnRate);
      const middle = raw[Math.round(LOOK_STEPS / 2)]!;
      const turnSeconds = turnOnly ? (1.5 * between(startDir, endDir)) / rate : (1.3 * between(middle, endDir)) / rate / 0.5;
      duration = THREE.MathUtils.clamp(Math.max(duration, turnSeconds + 2 * TOUR_MOTION.lookLag), TOUR_MOTION.legMin, TOUR_MOTION.legMax);
    }
    // The look follows the want through time: at most `turnRate` a second, or as fast as arriving on the stop's look
    // needs, with a little in hand for the smoothing after it.
    const dt = (duration || 1) / LOOK_STEPS;
    const rate = THREE.MathUtils.degToRad(TOUR_MOTION.turnRate);
    const followed: THREE.Vector3[] = [];
    let current = raw[0]!.clone();
    for (let k = 0; k <= LOOK_STEPS; k++) {
      const want = raw[k]!;
      const left = Math.max(dt, (1 - k / LOOK_STEPS) * (duration || 1) - 2 * TOUR_MOTION.lookLag);
      const most = reduced ? Math.PI : Math.max(rate * dt, (between(current, want) / left) * dt);
      current = turnToward(current, want, most);
      followed.push(current);
    }
    // Smoothed once more, so the turn's speed is continuous — and exactly the stop's look by the last step.
    const follow = reduced ? 1 : 1 - Math.exp(-dt / TOUR_MOTION.lookLag);
    let smooth = followed[0]!.clone();
    for (let k = 0; k <= LOOK_STEPS; k++) {
      smooth = toward(smooth, followed[k]!, follow);
      looks.push(toward(smooth, ends[k]!, smoothstep(0.92, 1, k / LOOK_STEPS)));
    }
  }
  return { curve, length, duration, looks };
}

/**
 * Where the camera stands and looks `time` of the way through a leg's time (0 to 1): the point on its curve that
 * far along the walk's profile, the look worked out for that moment by `legPath` — or, on a flight, straight from
 * the one target to the other — and the field of view blending from the one stop's to the other's.
 */
export function alongLeg(path: Path, from: Pose, to: Look, leg: Leg, time: number): Pose {
  const u = path.duration > 0 ? walkProfile(THREE.MathUtils.clamp(time, 0, 1)) : 1;
  const position = path.length > 0.05 ? path.curve.getPointAt(u) : from.position.clone();
  const end = vec(to.to);
  const fov = THREE.MathUtils.lerp(from.fov, to.fov ?? TOUR_MOTION.fov, smoothstep(0, 1, u));
  if (leg.look === "blend" || path.looks.length < 2) {
    return { position, target: from.target.clone().lerp(end, smoothstep(0, 1, u)), fov };
  }
  const at = THREE.MathUtils.clamp(time, 0, 1) * (path.looks.length - 1);
  const k = Math.min(path.looks.length - 2, Math.floor(at));
  const dir = toward(path.looks[k]!, path.looks[k + 1]!, at - k);
  // The target is a few feet along the look: far enough that the controls' target is not under the camera.
  return { position, target: position.clone().addScaledVector(dir, TOUR_MOTION.lookAhead), fov };
}

export type Frame = { position: THREE.Vector3; width: number; height: number; distance: number };

/**
 * Where a stop's picture hangs: on the camera's axis, in front of it, upright, sized to fit the view at that distance
 * with a margin of model round it (`fill`) — so standing at the stop the picture lines up with the room behind it,
 * and a step aside shows it as a window hanging in the space. The box's own shape decides which way it is fitted.
 */
export function pictureFrame(look: Look, aspect: number, boxAspect: number): Frame {
  const from = vec(look.from);
  const to = vec(look.to);
  const dir = to.clone().sub(from);
  const reach = dir.length();
  dir.normalize();
  const distance = THREE.MathUtils.clamp(reach * 0.5, TOUR_MOTION.nearest, TOUR_MOTION.farthest);
  const viewHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad((look.fov ?? TOUR_MOTION.fov) / 2));
  const viewWidth = viewHeight * boxAspect;
  const height = Math.min(viewHeight, viewWidth / aspect) * TOUR_MOTION.fill;
  return { position: from.addScaledVector(dir, distance), width: height * aspect, height, distance };
}

/** A picture's shape: a rectangle with the system's corners — one radius, a cell's share of its height (Grid.md D39). */
export function pictureShape(width: number, height: number): THREE.Shape {
  const r = Math.min(width, height) * 0.07;
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.absarc(x + width - r, y + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(x + width, y + height - r);
  shape.absarc(x + width - r, y + height - r, r, 0, Math.PI / 2, false);
  shape.lineTo(x + r, y + height);
  shape.absarc(x + r, y + height - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + r);
  shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
}
