/**
 * A skeleton (World.md W84; his, 2026-10-15: "for pipes and roads, we can have something like skeleton, where I can
 * select the joints to define the shape by moving the joints"): the joints a pipe or a road runs through, from its start
 * to its end, in metres, x east, y up, z south. Between them it runs along one smooth curve through every joint
 * (`build-skeletons.ts`, a centripetal Catmull-Rom, which never loops or overshoots between two joints); the bones
 * drawn over a picked one are the straight lines from joint to joint. Nothing here is three.js: the Sectors page and its
 * card read it without loading the world.
 */
export type Point = readonly [number, number, number];

/**
 * A joint's way (World.md W87; his: "there is no way for me to set the direction of the joint of a pipe or road"): the
 * way the pipe or road runs through it, from its start towards its end, as degrees round from north, clockwise seen
 * from above as every turn is (`turn`), and up from level (`tilt`). A joint without one lets the curve decide.
 */
export type Way = readonly [turn: number, tilt: number];

/** The fewest joints a skeleton has: its start and its end. */
export const JOINTS_LEAST = 2;
/** The most a skeleton has (mine): its start, its end and thirty joints between. */
export const JOINTS_MOST = 32;

/**
 * A point held to the skeleton's grid, a quarter metre every way (mine, W87): the lattice's level (W4), and fine enough
 * across that a pipe's end lands where it was clicked on a block's face rather than at the face's corner.
 */
export const onLattice = ([x, y, z]: Point): Point => [Math.round(x * 4) / 4, Math.round(y * 4) / 4, Math.round(z * 4) / 4];

/** A way as the unit direction it points, in metres' axes (north −z, east +x, up +y). */
export function directionOf([turn, tilt]: Way): Point {
  const [t, a] = [(turn * Math.PI) / 180, (tilt * Math.PI) / 180];
  return [Math.sin(t) * Math.cos(a), Math.sin(a), -Math.cos(t) * Math.cos(a)];
}

/** A direction as a way, in whole degrees: its turn from north (0 to 359) and its tilt from level; straight up or down turns north. */
export function wayOf([x, y, z]: Point): Way {
  const length = Math.hypot(x, y, z) || 1;
  const tilt = Math.round((Math.asin(Math.max(-1, Math.min(1, y / length))) * 180) / Math.PI);
  const level = Math.hypot(x, z);
  const turn = level < 1e-6 ? 0 : Math.round(((Math.atan2(x, -z) * 180) / Math.PI + 360) % 360) % 360;
  return [turn, tilt];
}

/**
 * Where a pipe's middle or a road's top passes at a joint (W84, W87): a joint is where the underside passes, so a
 * road's top is its thickness over it and a free pipe's middle its radius over it; a pipe with a way has its middle
 * the radius off the joint across that way, upward (none for a pipe going straight up or down, so a pipe that leaves
 * a block's top stands on the joint, where it was clicked).
 */
export function centreOf(joint: Point, way: Way | null, lift: number, kind: "pipe" | "road"): Point {
  if (kind === "road" || !way) return [joint[0], joint[1] + lift, joint[2]];
  const d = directionOf(way);
  return [joint[0] - lift * d[1] * d[0], joint[1] + lift * (1 - d[1] * d[1]), joint[2] - lift * d[1] * d[2]];
}

/** The joint whose middle (`centreOf`) is a point: where a pipe attached to a face keeps its joint, the face's point its middle. */
export function jointOf(centre: Point, way: Way | null, lift: number, kind: "pipe" | "road"): Point {
  const up = centreOf([0, 0, 0], way, lift, kind);
  return [centre[0] - up[0], centre[1] - up[1], centre[2] - up[2]];
}

/**
 * The way a joint runs when the curve decides it (mine): from the joint before it to the one after it, or at an end
 * towards its neighbour, as near as the curve itself goes; what a way set on the card starts from.
 */
export function wayAlong(joints: readonly Point[], index: number): Way {
  const before = joints[Math.max(0, index - 1)];
  const after = joints[Math.min(joints.length - 1, index + 1)];
  return wayOf([after[0] - before[0], after[1] - before[1], after[2] - before[2]]);
}

/**
 * A new skeleton (mine): its start and its end where the two clicks were, and `between` joints evenly spaced along the
 * straight line from one to the other, each on the lattice, so there is something to take hold of at once.
 */
export function jointsBetween(start: Point, end: Point, between: number): Point[] {
  const count = Math.max(0, Math.min(JOINTS_MOST - 2, Math.round(between)));
  const inner = Array.from({ length: count }, (_, i) => {
    const share = (i + 1) / (count + 1);
    return onLattice([start[0] + (end[0] - start[0]) * share, start[1] + (end[1] - start[1]) * share, start[2] + (end[2] - start[2]) * share]);
  });
  return [onLattice(start), ...inner, onLattice(end)];
}

/**
 * A joint added (mine): half way between the joint picked and the next, or, past the end, half way between the end and
 * the joint before it, so the shape it runs along barely changes until the new joint is moved. Where the skeleton has
 * its most, as it was.
 */
export function withJointAfter(joints: readonly Point[], ways: readonly (Way | null)[], index: number): { joints: Point[]; ways: (Way | null)[]; added: number } {
  if (joints.length >= JOINTS_MOST) return { joints: [...joints], ways: [...ways], added: index };
  const at = Math.max(0, Math.min(joints.length - 2, index));
  const [a, b] = [joints[at], joints[at + 1]];
  const middle = onLattice([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]);
  // The new joint is free: the curve decides its way.
  return { joints: [...joints.slice(0, at + 1), middle, ...joints.slice(at + 1)], ways: [...ways.slice(0, at + 1), null, ...ways.slice(at + 1)], added: at + 1 };
}

/** A joint taken away, with its way: the start or the end too, the next then the start or the end; never below two joints. */
export function withoutJoint(joints: readonly Point[], ways: readonly (Way | null)[], index: number): { joints: Point[]; ways: (Way | null)[] } {
  if (joints.length <= JOINTS_LEAST || index < 0 || index >= joints.length) return { joints: [...joints], ways: [...ways] };
  return { joints: joints.filter((_, i) => i !== index), ways: ways.filter((_, i) => i !== index) };
}

/** A skeleton's ways, one a joint, none where none was kept. */
export const waysFor = (joints: readonly Point[], ways: readonly (Way | null)[] | undefined): (Way | null)[] => joints.map((_, i) => ways?.[i] ?? null);

/** How long the bones are, joint to joint, in metres: the curve is a little longer where it bends. */
export const reachOf = (joints: readonly Point[]) =>
  joints.slice(1).reduce((sum, joint, i) => sum + Math.hypot(joint[0] - joints[i][0], joint[1] - joints[i][1], joint[2] - joints[i][2]), 0);

/** A joint's name on the card: the start, the end, or its number between them. */
export const jointName = (index: number, count: number) => (index === 0 ? "Start" : index === count - 1 ? "End" : `Joint ${index}`);
