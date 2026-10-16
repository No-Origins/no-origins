import { HUMAN_JOINTS, humanGaitAt, type HumanGait, type HumanMotion, type HumanPose, type JointId } from "@no-origins/ui/lib/human-motion";

import { COLOURS } from "./colours";
import type { Jig } from "./jig";

/**
 * The human, version 2: the figure the visitor travels as (World.md W51), wearing the look he drew (W65; his sketch,
 * 2026-10-13: "I want the character in the world to be like the inspirations I provided. The sketch is what I had in
 * mind"). It is 8 feet tall (his), stands where the visitor is, and walks or runs as it travels, the camera behind it
 * (`camera.ts`, version 9). Version 1, the skeleton alone, is frozen (`human-v1.ts`).
 *
 * The look is his sketch cut out and given a thickness: a head that is a regular polygon, flat side up, on a short
 * neck; one slab for the body from the neck down to where the legs part; an arm a slab each, hanging flush against
 * the body, no elbow and no hand; a leg a slab each, flat on the ground, no foot. Every edge is rounded by one radius,
 * the Edge, so the arm against the body and the legs against each other meet in a groove, the sketch's line. Nothing
 * is inflated: the generated picture he showed puffed every part into a cushion, and that is what the slabs refuse.
 * Its proportions start from the sketch, measured (`HUMAN_START`), and every one is a control, his to tune.
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
 * The figure before he tunes it (mine): the sketch, measured against its height (its head a quarter of it and a little
 * wider than tall, a regular octagon; its body a third of its height wide; its arms reaching to where the legs part,
 * which is at the rig's knee; its legs parted by a line), 30 cm thick with an 8 cm edge and a 12 cm shoulder, in Cream, like both pictures;
 * walking up to 3 m/s; a quarter-second turn.
 */
export const HUMAN_START: HumanConfig = {
  colour: "#f7f1f2",
  shows: "look",
  depth: 30,
  edge: 8,
  headSides: 8,
  headWidth: 65,
  headHeight: 61,
  headDepth: 40,
  neck: 24,
  body: 76,
  shoulder: 12,
  split: 68,
  gap: 6,
  arm: 32,
  armLength: 104,
  walkUpTo: 3,
  turn: 0.25,
  settle: 200,
};

export const HUMAN_JIG: Jig<HumanConfig> = {
  name: "Human",
  version: 2,
  start: HUMAN_START,
  groups: [
    {
      title: "Figure",
      note: () =>
        `${HUMAN_FEET} feet tall (his), ${HUMAN_HEIGHT.toFixed(2)} m from sole to crown, standing where the visitor is: it walks where the camera goes (WASD, the arrows, a drag or a click on the map). Its look is his sketch, cut out this thick, every edge rounded by the Edge; Skeleton shows the bones it hangs on.`,
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
      note: () => "A regular polygon, a flat side up, its top the crown; the neck stands between it and the body.",
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
      note: () => "One slab from the neck to the Split, where the legs part, the Gap between them; the legs hinge at the rig's hips, inside it.",
      controls: [
        { kind: "number", key: "body", label: "Width", min: 50, max: 120, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "shoulder", label: "Shoulder", min: 0, max: 40, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "split", label: "Split", min: 30, max: 120, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "gap", label: "Gap", min: 0, max: 20, step: 1, unit: "cm" },
      ],
    },
    {
      title: "Arms",
      note: () => "A slab each, flush against the body, swinging whole from the shoulder: no elbow, as the sketch has none.",
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
 * A slab of the look: a flat shape (its outline a convex polygon, counter-clockwise, each corner rounded) cut out
 * `depth` metres thick, centred on the figure's front-to-back middle, every edge rounded by `edge`; and which bones
 * carry each of its points (`carried`, by the point's height and side).
 */
export type Slab = { name: string; outline: readonly Corner[]; depth: number; edge: number; carried: (x: number, y: number) => Carried };

/** How far a limb nests inside the body's faces, in metres, so no two faces lie in one plane. */
const NEST = 0.01;

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

/**
 * The look's slabs at rest, in metres, from the jig's centimetres (World.md W65). The head's top is the crown, so the
 * figure keeps its height whatever its head's; the body's top is the rig's chest joint, the sketch's neck base; the
 * legs run up to the rig's hips inside the body, nested a centimetre in, so they hinge where the rig's do and the body
 * keeps covering them as they swing; the arms hang from the body's top, flush against its sides.
 */
export function lookOf(config: HumanConfig): Slab[] {
  const cm = (value: number) => value / 100;
  const depth = cm(config.depth);
  const edge = cm(config.edge);
  const crown = HUMAN_HEIGHT;
  const chest = joint("chest").at[1] * UNIT;
  const hips = joint("hips").at[1] * UNIT;
  const knee = joint("leftKnee").at[1] * UNIT;
  const top = chest;
  const split = Math.min(cm(config.split), top - 2 * edge);
  const half = cm(config.body) / 2;
  const headHeight = Math.min(cm(config.headHeight), crown - top - edge);
  const headBottom = crown - headHeight;
  const headDepth = cm(config.headDepth);
  const slabs: Slab[] = [];

  // The body: one slab, its shoulders rounded by the Shoulder, carried by the chest, the spine and the hips as the
  // rig's own clothes were (`hiddenstack-rig.ts`), so it turns and sways with the stride.
  const shoulder = Math.min(cm(config.shoulder), half, (top - split) / 2);
  slabs.push({
    name: "body",
    outline: rect(-half, half, split, top, [shoulder, shoulder, edge, edge]),
    depth,
    edge,
    carried: (_x, y) =>
      y > 4.1 * UNIT ? ["chest", "spine", smoothstep(y, 4.1 * UNIT, 4.65 * UNIT)] : ["spine", "hips", smoothstep(y, 3.3 * UNIT, 3.95 * UNIT)],
  });

  // The neck: a short slab from inside the body to inside the head, carried by the chest.
  const neckDepth = Math.min(depth, headDepth) - 2 * NEST;
  slabs.push({
    name: "neck",
    outline: rect(-cm(config.neck) / 2, cm(config.neck) / 2, top - edge, headBottom + edge, [edge, edge, edge, edge]),
    depth: neckDepth,
    edge: Math.min(edge, neckDepth / 2, cm(config.neck) / 2),
    carried: rigid("chest"),
  });

  // The head: a regular polygon with a flat side up, fitted to its width and height, its top the crown, on the head bone.
  const sides = Math.max(3, Math.round(config.headSides));
  const polygon: [number, number][] = [];
  for (let i = 0; i < sides; i++) {
    const angle = Math.PI / 2 + Math.PI / sides + (i * 2 * Math.PI) / sides;
    polygon.push([Math.cos(angle), Math.sin(angle)]);
  }
  const extentX = Math.max(...polygon.map(([x]) => Math.abs(x)));
  const extentY = Math.max(...polygon.map(([, y]) => Math.abs(y)));
  const headEdge = Math.min(edge, headDepth / 2);
  slabs.push({
    name: "head",
    outline: polygon.map(([x, y]) => [(x / extentX) * (cm(config.headWidth) / 2), headBottom + ((y / extentY + 1) * headHeight) / 2, headEdge] as const),
    depth: headDepth,
    edge: headEdge,
    carried: rigid("head"),
  });

  for (const side of [-1, 1] as const) {
    const prefix = side === 1 ? "left" : "right";
    // An arm: a slab beside the body, hanging from under the body's round shoulder, which lands on its top (a square
    // inner corner there, so the two rounds never meet in a notch), its own outer shoulder rounded by the Shoulder;
    // carried whole by the upper arm, so it swings from the rig's shoulder.
    const arm = cm(config.arm);
    const armTop = top - Math.max(shoulder, edge);
    const armBottom = Math.max(edge, armTop - cm(config.armLength));
    const armShoulder = Math.min(shoulder, arm / 2, (armTop - armBottom) / 2);
    const inner = half;
    const outer = half + arm;
    const [x0, x1] = side === 1 ? [inner, outer] : [-outer, -inner];
    slabs.push({
      name: `${prefix} arm`,
      outline: rect(x0, x1, armBottom, armTop, side === 1 ? [0, armShoulder, edge, edge] : [armShoulder, 0, edge, edge]),
      depth,
      edge: Math.min(edge, arm / 2),
      carried: rigid(`${prefix}Arm`),
    });
    // A leg: a slab from the ground up into the body, as far as the rig's hips, carried by the thigh above the knee
    // and the shin below it, so the walk's knee bends it where the sketch parts the legs.
    const legIn = cm(config.gap) / 2 + NEST;
    const legOut = half - NEST;
    const legTop = Math.max(hips, split) + edge;
    const [l0, l1] = side === 1 ? [legIn, legOut] : [-legOut, -legIn];
    const legEdge = Math.min(edge, (legOut - legIn) / 2, (depth - 2 * NEST) / 2);
    slabs.push({
      name: `${prefix} leg`,
      outline: rect(l0, l1, 0, legTop, [legEdge, legEdge, legEdge, legEdge]),
      depth: depth - 2 * NEST,
      edge: legEdge,
      carried: (_x, y) => [`${prefix}Hip`, `${prefix}Knee`, smoothstep(y, knee - 0.2 * UNIT, knee + 0.2 * UNIT)],
    });
  }
  return slabs;
}

/**
 * An outline as points along it, in metres: each corner rounded by its radius (as much of it as its two edges allow)
 * in `segments` steps. The outline is convex and counter-clockwise, so every corner turns left.
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
    // Counter-clockwise, the arc turns left: a sweep that came out the long way round is brought back.
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
