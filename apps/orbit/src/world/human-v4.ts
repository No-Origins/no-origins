import { HUMAN_JOINTS, humanGaitAt, type HumanGait, type HumanMotion, type HumanPose, type JointId } from "@no-origins/ui/lib/human-motion";

import { COLOURS } from "./colours";
import type { Jig } from "./jig";

/**
 * The human, version 4: the figure the visitor travels as (World.md W51), with a continuous curved silhouette and
 * softly domed surfaces from both his references (W68),
 * keeping the silhouette he drew (W65; his sketch,
 * 2026-10-13: "I want the character in the world to be like the inspirations I provided. The sketch is what I had in
 * mind"). It is 8 feet tall (his), stands where the visitor is, and walks or runs as it travels, the camera behind it
 * (`camera.ts`, version 9). Version 1, the skeleton alone, is frozen (`human-v1.ts`).
 *
 * The rounded polygon head, short neck and blunt limbs retain the sketch's identity. The shoulders descend from
 * the neck into the arms; overlapping volumes become one smooth body in `build-human.ts`, with fuller depth and
 * softened ends taken from the rendered reference. No face, hands or separate feet. Version 2's cut-out slabs are
 * frozen (`human-v2.ts`); these starting proportions remain his to tune.
 *
 * Its joints are the design system's human rig's (`@no-origins/ui/lib/human-motion`, `HUMAN_JOINTS`: nineteen, hips
 * to head, shoulders to hands, hips to feet), declared in the rig's own units and scaled so the figure stands its
 * height from sole to crown (`UNIT`); the look binds to them (`lookOf`: each slab says which bones carry it). Its
 * walk and its run are the rig's too (`humanGaitAt`), every number a `--motion-human-*` token in globals.css
 * (Motion.md, M3), read off the canvas as it sets off. Mine: it walks up to a speed and runs over it; a stride covers
 * the ground it travels, so its feet never slide; it turns to face the way it goes over the Turn, and its limbs take
 * the Settle to start and to stop. Nothing here is three.js.
 */

/** A foot, in metres. */
export const FOOT = 0.3048;
/** How tall the figure is, in feet (his: "a human character of 8 feet"). */
export const HUMAN_FEET = 8;
/** How tall the figure is, in metres, from sole to crown. */
export const HUMAN_HEIGHT = HUMAN_FEET * FOOT;
/** A new look replaces the persistent renderer during development as well as the jig's starting values. */
export const HUMAN_VERSION = 4;

const joint = (id: JointId) => HUMAN_JOINTS.find((j) => j.id === id)!;

/**
 * The skull of the skeleton, in the rig's units: an egg on the head joint (the rig's head joint is the jaw, where the
 * skull turns), its centre `above` the joint, its radii across, up and front to back. The crown is its top, and the
 * look's head stands its top there too.
 */
export const SKULL = { above: 0.46, radii: [0.38, 0.44, 0.42] as const };
/** Where the skeleton's foot ends, from its ankle, in the rig's units: down to the sole and out to the toe; the rig's front is +z. */
export const TOE = [0, -0.26, 0.7] as const;
/** The crown's height in the rig's units: the head joint, the skull's centre above it and its radius up. */
export const CROWN = joint("head").at[1] + SKULL.above + SKULL.radii[1];
/** A rig unit in metres: what makes the figure its height. */
export const UNIT = HUMAN_HEIGHT / CROWN;
/** How high the hips are, in metres: what the camera looks at, at the middle of its view (`camera.ts`). */
export const HUMAN_HIPS = joint("hips").at[1] * UNIT;
/** A leg's length, hip to ankle, in metres: what a stride is measured against. */
export const HUMAN_LEG = (joint("hips").at[1] - joint("leftFoot").at[1]) * UNIT;

export type HumanConfig = {
  /** The figure's colour, one of the world's, and whether its look or its skeleton is drawn. */
  colour: string;
  shows: "look" | "skeleton";
  /** How thick the slabs are, front to back, and the radius every edge and corner is rounded by, in centimetres. */
  depth: number;
  edge: number;
  /** The head: a regular polygon of so many sides, flat side up, this wide, tall and thick; the neck this wide. */
  headSides: number;
  headWidth: number;
  headHeight: number;
  headDepth: number;
  neck: number;
  /** The body: this wide, its shoulders rounded by this radius, the legs parting this high off the ground, this far apart. */
  body: number;
  shoulder: number;
  split: number;
  gap: number;
  /** An arm: this wide and this long, hanging from the shoulder. */
  arm: number;
  armLength: number;
  /** The speed it walks up to, in metres a second: faster, it runs. */
  walkUpTo: number;
  /** How long it takes to turn to face the way it goes, in seconds, and its limbs to start or stop, in ms. */
  turn: number;
  settle: number;
};

/**
 * Starting refinement (mine): the sketch's rounded octagon and compact silhouette, with the reference's soft
 * sculptural depth. Pale cream, a 48 cm body and 16 cm edge; a 72 × 66 × 48 cm head; broad sloping shoulders, blunt arms
 * ending near the 74 cm split, and a quiet 5 cm leg gap. The gait's starting values remain version 2's.
 */
export const HUMAN_START: HumanConfig = {
  colour: "#fff6e8",
  shows: "look",
  depth: 48,
  edge: 16,
  headSides: 8,
  headWidth: 72,
  headHeight: 66,
  headDepth: 48,
  neck: 24,
  body: 82,
  shoulder: 22,
  split: 74,
  gap: 5,
  arm: 34,
  armLength: 98,
  walkUpTo: 3,
  turn: 0.25,
  settle: 200,
};

export const HUMAN_JIG: Jig<HumanConfig> = {
  name: "Human",
  version: HUMAN_VERSION,
  start: HUMAN_START,
  groups: [
    {
      title: "Figure",
      note: () =>
        `${HUMAN_FEET} feet tall, ${HUMAN_HEIGHT.toFixed(2)} m from sole to crown. A softly sculpted figure with a matte finish. Depth gives it volume; Edge softens its outline. Travel with WASD, the arrows, a drag or the map. Skeleton reveals its joints.`,
      controls: [
        { kind: "colour", key: "colour", label: "Colour", options: COLOURS },
        {
          kind: "choice",
          key: "shows",
          label: "Shows",
          options: [
            { value: "look", label: "Look" },
            { value: "skeleton", label: "Skeleton" },
          ],
        },
        { kind: "number", key: "depth", label: "Depth", min: 10, max: 60, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "edge", label: "Edge", min: 1, max: 20, step: 1, unit: "cm" },
      ],
    },
    {
      title: "Head",
      note: () => "A softly bevelled polygon on a short neck. Its top stays at the crown as its proportions change.",
      controls: [
        { kind: "number", key: "headSides", label: "Sides", min: 5, max: 8, step: 1 },
        { kind: "number", key: "headWidth", label: "Width", min: 40, max: 100, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "headHeight", label: "Height", min: 40, max: 100, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "headDepth", label: "Depth", min: 10, max: 60, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "neck", label: "Neck", min: 10, max: 40, step: 1, marks: 10, unit: "cm" },
      ],
    },
    {
      title: "Body",
      note: () => "Sloping shoulders flow into one continuous body. Split sets where the legs part; Gap opens the space between them.",
      controls: [
        { kind: "number", key: "body", label: "Width", min: 50, max: 120, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "shoulder", label: "Shoulder", min: 0, max: 40, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "split", label: "Split", min: 30, max: 120, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "gap", label: "Gap", min: 0, max: 20, step: 1, unit: "cm" },
      ],
    },
    {
      title: "Arms",
      note: () => "Blunt, softly rounded arms flow from the shoulders and swing as it travels.",
      controls: [
        { kind: "number", key: "arm", label: "Width", min: 15, max: 50, step: 1, marks: 5, unit: "cm" },
        { kind: "number", key: "armLength", label: "Length", min: 50, max: 140, step: 1, marks: 10, unit: "cm" },
      ],
    },
    {
      title: "Gait",
      note: () => "Its walk and its run are the system's human rig's (Motion.md): a stride covers the ground it travels.",
      controls: [
        { kind: "number", key: "walkUpTo", label: "Walk up to", min: 1, max: 8, step: 0.5, unit: "m/s" },
        { kind: "number", key: "turn", label: "Turn", min: 0, max: 1, step: 0.05, unit: "s" },
        { kind: "number", key: "settle", label: "Settle", min: 0, max: 600, step: 50, unit: "ms" },
      ],
    },
  ],
};

/** A point of a slab's outline, in metres: across, up, and the radius its corner is rounded by. */
export type Corner = readonly [x: number, y: number, radius: number];
/** Which bones carry a point of a slab: two joints and how much of the first, 1 all of it. */
export type Carried = readonly [JointId, JointId, number];
/**
 * A volume of the look: a flat shape (its outline counter-clockwise, each corner rounded) cut out
 * `depth` metres thick, centred on the figure's front-to-back middle, every edge rounded by `edge`; and which bones
 * carry each of its points (`carried`, by the point's height and side).
 */
export type Slab = {
  name: string;
  outline: readonly Corner[];
  depth: number;
  edge: number;
  /** The shallow dome across each face, in metres; contained within the total Depth. */
  fullness?: number;
  carried: (x: number, y: number) => Carried;
};

const smoothstep = (x: number, from: number, to: number) => {
  const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
  return t * t * (3 - 2 * t);
};
const rigid = (id: JointId): ((x: number, y: number) => Carried) => () => [id, id, 1];

/** A rectangle's outline, counter-clockwise from the bottom left, each corner's radius given clockwise from the top left. */
const rect = (x0: number, x1: number, y0: number, y1: number, [tl, tr, br, bl]: readonly [number, number, number, number]): Corner[] => [
  [x0, y0, bl],
  [x1, y0, br],
  [x1, y1, tr],
  [x0, y1, tl],
];

/** A sampled cubic contour, already smooth: zero corner radii prevent a second rounding from flattening it. */
const contour = (x: number, y: number) => {
  const points: Corner[] = [[x, y, 0]];
  const line = (nextX: number, nextY: number) => { points.push([nextX, nextY, 0]); x = nextX; y = nextY; };
  const curve = (ax: number, ay: number, bx: number, by: number, nextX: number, nextY: number, steps = 16) => {
    const fromX = x, fromY = y;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps, u = 1 - t;
      points.push([u ** 3 * fromX + 3 * u ** 2 * t * ax + 3 * u * t ** 2 * bx + t ** 3 * nextX,
        u ** 3 * fromY + 3 * u ** 2 * t * ay + 3 * u * t ** 2 * by + t ** 3 * nextY, 0]);
    }
    x = nextX; y = nextY;
  };
  return { points, line, curve };
};

/**
 * The look's overlapping volumes at rest, in metres (World.md W68). Their curved outlines are joined into a single
 * surface by the builder. The head's top stays at the crown; the arms overlap the torso beneath the sloping shoulder,
 * and the legs enter it at the rig's hips. Their carrying weights ease through the shoulders rather than hinging
 * separate blocks. The arms' inner contours open a narrow cleft below their joined shoulders.
 */
export function lookOf(config: HumanConfig): Slab[] {
  const cm = (value: number) => value / 100;
  const depth = cm(config.depth);
  const edge = cm(config.edge);
  const crown = HUMAN_HEIGHT;
  const chest = joint("chest").at[1] * UNIT;
  const hips = joint("hips").at[1] * UNIT;
  const knee = joint("leftKnee").at[1] * UNIT;
  const headHeight = cm(config.headHeight);
  const headBottom = crown - headHeight;
  // Large heads lower the shoulder line instead of silently stopping the Height control before its maximum.
  const top = Math.min(chest, headBottom - 0.08);
  const split = Math.min(cm(config.split), top - 2 * edge);
  const half = cm(config.body) / 2;
  const headDepth = cm(config.headDepth);
  const slabs: Slab[] = [];

  // A tapered shoulder line replaces the old horizontal slab. The centre rises slightly into the neck, while the
  // outer edge descends into the arm. Every allowed neck width fits inside the upper shoulder outline.
  const shoulder = Math.min(cm(config.shoulder), half, (top - split) / 2);
  const neckHalf = cm(config.neck) / 2;
  const drop = Math.min(Math.max(0.15, shoulder), (top - split) * 0.6);
  const bodyRound = Math.min(edge, half * 0.45, (top - split) * 0.2);
  const torso = contour(neckHalf, top + 0.035);
  torso.line(-neckHalf, top + 0.035);
  torso.curve(-neckHalf - (half - neckHalf) * 0.25, top - 0.01, -half, top - 0.02, -half, top - drop);
  torso.curve(-half * 0.97, top - drop - 0.12, -half * 0.96, split + (top - split) * 0.35, -half, split + bodyRound);
  torso.curve(-half, split + bodyRound * 0.45, -half + bodyRound * 0.45, split, -half + bodyRound, split);
  torso.line(half - bodyRound, split);
  torso.curve(half - bodyRound * 0.45, split, half, split + bodyRound * 0.45, half, split + bodyRound);
  torso.curve(half * 0.96, split + (top - split) * 0.35, half * 0.97, top - drop - 0.12, half, top - drop);
  torso.curve(half, top - 0.02, neckHalf + (half - neckHalf) * 0.25, top - 0.01, neckHalf, top + 0.035);
  slabs.push({
    name: "body",
    outline: torso.points,
    depth,
    edge,
    fullness: edge * 0.28,
    carried: (_x, y) =>
      y > 4.1 * UNIT ? ["chest", "spine", smoothstep(y, 4.1 * UNIT, 4.65 * UNIT)] : ["spine", "hips", smoothstep(y, 3.3 * UNIT, 3.95 * UNIT)],
  });

  // Both ends enter their adjoining volume. A shallower neck leaves the rounded head clearly seated above it.
  const neckDepth = Math.min(depth, headDepth) * 0.66;
  slabs.push({
    name: "neck",
    outline: rect(-neckHalf, neckHalf, top - edge, headBottom + edge * 0.6, [edge, edge, edge, edge]),
    depth: neckDepth,
    edge: Math.min(edge, neckDepth / 2, cm(config.neck) / 2),
    fullness: Math.min(0.01, neckDepth * 0.05),
    carried: rigid("chest"),
  });

  // The head: a regular polygon with a flat side up, fitted to its width and height, its top the crown, on the head bone.
  const sides = Math.max(3, Math.round(config.headSides));
  const polygon: [number, number][] = [];
  for (let i = 0; i < sides; i++) {
    const angle = Math.PI / 2 + Math.PI / sides + (i * 2 * Math.PI) / sides;
    polygon.push([Math.cos(angle), Math.sin(angle)]);
  }
  const minX = Math.min(...polygon.map(([x]) => x));
  const maxX = Math.max(...polygon.map(([x]) => x));
  const minY = Math.min(...polygon.map(([, y]) => y));
  const maxY = Math.max(...polygon.map(([, y]) => y));
  const headEdge = Math.min(edge, headDepth / 2);
  slabs.push({
    name: "head",
    outline: polygon.map(([x, y]) => [((x - minX) / (maxX - minX) - 0.5) * cm(config.headWidth), headBottom + ((y - minY) / (maxY - minY)) * headHeight, headEdge] as const),
    depth: headDepth,
    edge: headEdge,
    fullness: headEdge * 0.32,
    carried: rigid("head"),
  });

  for (const side of [-1, 1] as const) {
    const prefix = side === 1 ? "left" : "right";
    // The inner shoulder enters the torso, rather than meeting it at a visible shelf. The top slopes down to the
    // outer shoulder. Upper vertices follow the chest more, lower ones the arm, keeping a continuous moving join.
    const arm = cm(config.arm);
    const armTop = top + 0.015;
    const armBottom = Math.max(edge, armTop - cm(config.armLength));
    // At the shoulder the two front rounds each inset by Edge. Enter far enough to join them across their full
    // depth, while the lower inner contour remains outside the torso to keep the armpit line.
    const inner = Math.max(neckHalf * 0.6, half - Math.max(arm * 0.3, 2 * Math.min(edge, depth * 0.49)));
    const outer = half + arm;
    const innerLower = half + 0.04;
    const end = Math.min(edge * 1.1, (outer - innerLower) * 0.45, (armTop - armBottom) * 0.2);
    const shoulderDrop = Math.min(Math.max(0.16, shoulder * 1.35), (armTop - armBottom) * 0.45);
    const armpit = Math.min(0.34, (armTop - armBottom) * 0.5);
    const limb = contour(inner, armTop);
    limb.curve(inner + (outer - inner) * 0.4, armTop - 0.025, outer, armTop - 0.025, outer, armTop - shoulderDrop);
    limb.curve(outer, armTop - shoulderDrop - 0.12, outer, armBottom + (armTop - armBottom) * 0.35, outer, armBottom + end);
    limb.curve(outer, armBottom + end * 0.45, outer - end * 0.45, armBottom, outer - end, armBottom);
    limb.line(innerLower + end, armBottom);
    limb.curve(innerLower + end * 0.45, armBottom, innerLower, armBottom + end * 0.45, innerLower, armBottom + end);
    limb.line(innerLower, armTop - armpit);
    limb.curve(innerLower, armTop - armpit * 0.5, inner + (innerLower - inner) * 0.35, armTop - 0.06, inner, armTop);
    const armOutline = limb.points.reverse();
    slabs.push({
      name: `${prefix} arm`,
      outline: side === 1 ? armOutline : armOutline.map(([x, y, r]) => [-x, y, r] as const).reverse(),
      depth,
      edge: Math.min(edge, arm / 2),
      fullness: edge * 0.16,
      carried: (_x, y) => [`${prefix}Arm`, "chest", 1 - 0.9 * smoothstep(y, armTop - 0.18, armTop - 0.025)],
    });
    // Equal depth makes the hips flow into the torso without the old inset ledge. Dense surface sampling gives the
    // knee a real bending region instead of deforming the two large triangles of an extruded cap.
    const legIn = cm(config.gap) / 2;
    const legOut = half;
    const legTop = Math.max(hips, split) + edge;
    const [l0, l1] = side === 1 ? [legIn, legOut] : [-legOut, -legIn];
    const legEdge = Math.min(edge, (legOut - legIn) / 2, depth / 2);
    const legRound = Math.min(edge * 1.1, (l1 - l0) * 0.45);
    const leg = contour(l0 + legRound, 0);
    leg.line(l1 - legRound, 0);
    leg.curve(l1 - legRound * 0.45, 0, l1, legRound * 0.45, l1, legRound);
    leg.curve(l1 - 0.012, legTop * 0.3, l1, legTop * 0.65, l1, legTop - legRound);
    leg.curve(l1, legTop - legRound * 0.45, l1 - legRound * 0.45, legTop, l1 - legRound, legTop);
    leg.line(l0 + legRound, legTop);
    leg.curve(l0 + legRound * 0.45, legTop, l0, legTop - legRound * 0.45, l0, legTop - legRound);
    leg.curve(l0, legTop * 0.65, l0 + 0.012, legTop * 0.3, l0, legRound);
    leg.curve(l0, legRound * 0.45, l0 + legRound * 0.45, 0, l0 + legRound, 0);
    slabs.push({
      name: `${prefix} leg`,
      outline: leg.points,
      depth,
      edge: legEdge,
      fullness: edge * 0.16,
      carried: (_x, y) => [`${prefix}Hip`, `${prefix}Knee`, smoothstep(y, knee - 0.2 * UNIT, knee + 0.2 * UNIT)],
    });
  }
  return slabs;
}

/**
 * An outline as points along it, in metres: each corner rounded by its radius (as much of it as its two edges allow)
 * in `segments` steps. The outline is counter-clockwise; a concave armpit corner turns the shorter arc clockwise.
 */
export function outlinePoints(outline: readonly Corner[], segments = 6): [number, number][] {
  const points: [number, number][] = [];
  const n = outline.length;
  for (let i = 0; i < n; i++) {
    const [x, y, radius] = outline[i]!;
    const [px, py] = outline[(i + n - 1) % n]!;
    const [nx, ny] = outline[(i + 1) % n]!;
    const toPrev = [px - x, py - y];
    const toNext = [nx - x, ny - y];
    const lenPrev = Math.hypot(toPrev[0]!, toPrev[1]!);
    const lenNext = Math.hypot(toNext[0]!, toNext[1]!);
    if (radius <= 0 || lenPrev < 1e-9 || lenNext < 1e-9) {
      points.push([x, y]);
      continue;
    }
    const dp = [toPrev[0]! / lenPrev, toPrev[1]! / lenPrev];
    const dn = [toNext[0]! / lenNext, toNext[1]! / lenNext];
    const theta = Math.acos(Math.min(1, Math.max(-1, dp[0]! * dn[0]! + dp[1]! * dn[1]!)));
    if (theta < 1e-6 || Math.PI - theta < 1e-6) {
      points.push([x, y]);
      continue;
    }
    // The corner's arc: tangent to both edges `d` from the corner, its centre on the bisector.
    const d = Math.min(radius / Math.tan(theta / 2), lenPrev / 2, lenNext / 2);
    const r = d * Math.tan(theta / 2);
    const bisector = [dp[0]! + dn[0]!, dp[1]! + dn[1]!];
    const bisectorLength = Math.hypot(bisector[0]!, bisector[1]!);
    const centre = [x + (bisector[0]! / bisectorLength) * (r / Math.sin(theta / 2)), y + (bisector[1]! / bisectorLength) * (r / Math.sin(theta / 2))];
    const a = [x + dp[0]! * d, y + dp[1]! * d];
    const b = [x + dn[0]! * d, y + dn[1]! * d];
    const from = Math.atan2(a[1]! - centre[1]!, a[0]! - centre[0]!);
    let sweep = Math.atan2(b[1]! - centre[1]!, b[0]! - centre[0]!) - from;
    // Use the shorter sweep: left at an outer corner, right at an inner corner.
    while (sweep <= 0) sweep += 2 * Math.PI;
    while (sweep > Math.PI) sweep -= 2 * Math.PI;
    for (let s = 0; s <= segments; s++) {
      const angle = from + (sweep * s) / segments;
      points.push([centre[0]! + r * Math.cos(angle), centre[1]! + r * Math.sin(angle)]);
    }
  }
  return points;
}

type Ground = readonly [number, number];
const RAD = Math.PI / 180;
/** Slower than this, in metres a second, the figure is standing. */
const STANDING = 0.05;

/**
 * The figure as it travels: the way it faces (`heading`, degrees, as the camera's turn: 0 the way the start faces,
 * more to the right as it grows), whether it is walking, running or standing (`gait`), the gait its limbs are in or
 * leaving (`moving`), how far it is through a stride's cycle (`phase`, 0 to 1), and how far its limbs are into the
 * gait from standing (`blend`, 0 to 1).
 */
export type Figure = { heading: number; gait: HumanGait; moving: Exclude<HumanGait, "rest">; phase: number; blend: number };

/** A figure standing, facing `heading`. */
export const figureStanding = (heading: number): Figure => ({ heading, gait: "rest", moving: "walk", phase: 0, blend: 0 });

/**
 * Which gait a speed, in metres a second, asks for: standing under a twentieth of a metre a second, walking up to the
 * Walk up to, running over it; a run keeps on until the speed has dropped a little under it, so a speed wavering about
 * the line never flickers between the two.
 */
export function gaitFor(config: HumanConfig, speed: number, was: HumanGait = "rest"): HumanGait {
  if (speed < STANDING) return "rest";
  const line = was === "run" ? config.walkUpTo * 0.85 : config.walkUpTo;
  return speed <= line ? "walk" : "run";
}

/** How far one step of a gait covers, in metres: the stride's swing, at the figure's leg. */
export function stepOf(motion: HumanMotion, gait: Exclude<HumanGait, "rest">): number {
  return Math.max(0.05, 2 * HUMAN_LEG * Math.sin((gait === "run" ? motion.runStride : motion.walkStride) * RAD));
}

/** The difference between two headings, in degrees, the short way round. */
const turnBetween = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180;

/**
 * The figure `dt` ms on, travelling at `velocity` (metres a ms over the ground): facing its way more, its stride on
 * as far as it went, its limbs more into their gait or back to standing; and whether it has come to rest. Under
 * reduced motion it faces its way and stands or walks at once.
 */
export function figureStep(figure: Figure, config: HumanConfig, motion: HumanMotion, velocity: Ground, dt: number, reduced: boolean): { figure: Figure; done: boolean } {
  const speed = Math.hypot(velocity[0], velocity[1]) * 1000;
  const gait = gaitFor(config, speed, figure.gait);
  const moving = gait === "rest" ? figure.moving : gait;
  // It faces the way it goes; standing, it keeps facing where it was going.
  const wanted = gait === "rest" ? figure.heading : Math.atan2(velocity[0], -velocity[1]) / RAD;
  const away = turnBetween(figure.heading, wanted);
  const tau = config.turn * 1000;
  const heading = reduced || tau <= 0 ? wanted : figure.heading + away * (1 - Math.exp(-dt / tau));
  // A stride's cycle is two steps: the cycle goes on as far as the ground went by, so the feet plant where they fall.
  const phase = gait === "rest" ? figure.phase : (figure.phase + (speed * dt) / 1000 / (2 * stepOf(motion, moving))) % 1;
  const target = gait === "rest" ? 0 : 1;
  const settle = config.settle;
  const blend = reduced || settle <= 0 ? target : figure.blend + (target - figure.blend) * (1 - Math.exp(-dt / settle));
  const next: Figure = {
    heading: Math.abs(turnBetween(heading, wanted)) < 0.05 ? wanted : heading,
    gait,
    moving,
    phase,
    blend: Math.abs(blend - target) < 0.005 ? target : blend,
  };
  return { figure: next, done: gait === "rest" && next.blend === 0 && next.heading === wanted };
}

/** How the figure's limbs stand now: its gait's pose at its phase, as far into it as its limbs are; standing, none. */
export function poseOf(figure: Figure, motion: HumanMotion): { pose: HumanPose; lift: number } {
  if (figure.blend <= 0) return { pose: {}, lift: 0 };
  const cycle = figure.moving === "run" ? motion.runCycle : motion.walkCycle;
  const gait = humanGaitAt(figure.moving, figure.phase * Math.max(1, cycle), motion);
  if (figure.blend >= 1) return gait;
  const pose: HumanPose = {};
  for (const [id, angles] of Object.entries(gait.pose)) pose[id as keyof HumanPose] = angles!.map((a) => a * figure.blend) as [number, number, number];
  return { pose, lift: gait.lift * figure.blend };
}
