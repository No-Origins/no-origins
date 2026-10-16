import { HUMAN_JOINTS, humanGaitAt, setHumanJoint, type HumanGait, type HumanMotion, type HumanPose, type JointId } from "@no-origins/ui/lib/human-motion";
import { motionMs, motionNumber } from "@no-origins/ui/lib/motion";

import { COLOURS } from "./colours";
import { configOf, type Jig } from "./jig";
import { PUBLISHED_HUMANS } from "./published-humans-v8";
import type { Variant } from "./variants";

/**
 * The human, version 5: the figure the visitor travels as (World.md W51), its silhouette his sketch (W65), its volume
 * the rendered figure (W66), jointed and puffed (W69; his, 2026-10-13: "The arms and legs should have joints. Right
 * now, they look like they don't have. Puff up the character. Make the head rounded. Arms and legs rounded. Controls
 * to puff up at joints like the ends of arms and legs, but smoothly"). It is 8 feet tall (his), stands where the
 * visitor is, and walks or runs as it travels, the camera behind it (`camera.ts`, version 9).
 *
 * Every part is a round volume with a section of its own. The head is a ball with a round glass visor in a thin
 * metal rim on its front, his picture (W69: a white sphere, a convex lens set into it); the neck a short column; the body a thick slab with big rounds and domed
 * faces; each shoulder one slope from the neck's base to the arm's dome. An arm is two round bars, the upper arm from
 * its dome to the elbow and the forearm from the elbow to its end, with a swell at the shoulder, the elbow and the
 * hand, each a width of its own, a joint wider than the bars beside it a swell blended into them, so it bends where
 * it swells. A leg is the same: a thigh hidden in the body, a knee, a shin, and a foot flat on the ground with a
 * rounded rim, each its own width. The arms hang flush against the body, the Groove of air away (the sketch's line),
 * tilting out just enough for their joints to clear it and the knees as both swing. `build-human.ts` joins each limb's volumes smoothly, then the limbs to the body with a crease, into one
 * surface; the head is a piece of its own on the head bone, resting on the neck. Versions 1 to 4 are frozen beside
 * it (`human-v1.ts` to `human-v4.ts`, with their builders).
 *
 * Frozen (World.md W102): version 6 (`human.ts`) keeps this look as its Suit and adds the Clay, his turnaround's
 * figure; nothing draws this file. Kept as it was seen, beside its builder (`build-human-v5.ts`).
 *
 * Its joints are the design system's human rig's (`@no-origins/ui/lib/human-motion`, `HUMAN_JOINTS`: nineteen, hips
 * to head, shoulders to hands, hips to feet), declared in the rig's own units and scaled so the figure stands its
 * height from sole to crown (`UNIT`); the look binds to them (`lookOf`: each part says which bones carry it). Its
 * walk and its run are the rig's too (`humanGaitAt`), every number a `--motion-human-*` token in globals.css
 * (Motion.md, M3), read off the canvas as it sets off. Mine: it walks up to a speed and runs over it; a stride covers
 * the ground it travels, so its feet never slide; it turns to face the way it goes over the Turn, and its limbs take
 * the Settle to start and to stop. Its head is held in its Expression, or, with Looks at cursor on, turned to the
 * pointer wherever it is over the world (`gazeAt`: the bone's turn to a direction, within the rig's limits). Nothing
 * here is three.js.
 */

/** A foot, in metres. */
export const FOOT = 0.3048;
/** How tall the figure is, in feet (his: "a human character of 8 feet"). */
export const HUMAN_FEET = 8;
/** How tall the figure is, in metres, from sole to crown. */
export const HUMAN_HEIGHT = HUMAN_FEET * FOOT;
/** A new look replaces the persistent renderer during development as well as the jig's starting values. */
export const HUMAN_VERSION = 5;

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

/** A posture the figure holds on its page: standing, a step of its walk or its run, hovering on its boosters, waving. */
export type Posture = "stand" | "walk" | "run" | "hover" | "wave";
/** How the head is held, for expression: ahead, turned, tilted, or a turn and a tilt together. */
export type Expression = "ahead" | "up" | "down" | "left" | "right" | "tiltLeft" | "tiltRight" | "curious" | "shy";
/** Whether the figure moves on its page: still in its posture, or walking, running, hovering or flying in place on its block. */
export type Moves = "still" | "walking" | "running" | "hovering" | "flying";

export type HumanConfig = {
  /**
   * The figure's colour, one of the world's; what is drawn (its look, its head alone, its skeleton, or its look with
   * its boosters firing); the posture it holds on its page, and whether it moves in place there instead.
   */
  colour: string;
  shows: "look" | "head" | "skeleton" | "boost";
  posture: Posture;
  moves: Moves;
  /**
   * The head: held in its expression, or turned to look at the pointer while it is over the world; a ball this big
   * across, with a round visor this big across on its front, a glass lens doming out of its rim's plane by the Bulge,
   * in a metal rim this wide, set this deep into the ball; the neck a round column this wide, showing this much under
   * the head.
   */
  expression: Expression;
  looksAtCursor: boolean;
  headSize: number;
  visor: number;
  visorBulge: number;
  visorRim: number;
  visorInset: number;
  neck: number;
  neckHeight: number;
  /**
   * The body: the slab between the arms, this wide and thick, every edge rounded by this radius, each face domed by
   * this much; the shoulders one slope, the arm's top this far below the neck's base.
   */
  body: number;
  bodyDepth: number;
  bodyEdge: number;
  bodyDome: number;
  slope: number;
  /**
   * An arm: round, this long from the top of its dome to its end, the Groove of air from the body; its shoulder,
   * upper arm, elbow, forearm and hand each this wide, a joint wider than the bars beside it a swell, blended into
   * them over the Blend.
   */
  armLength: number;
  groove: number;
  shoulder: number;
  upperArm: number;
  elbow: number;
  forearm: number;
  hand: number;
  armBlend: number;
  /**
   * A leg: round, parting from the other this high off the ground and this far from it; its thigh, knee, shin and
   * foot each this wide, blended over the Blend; its sole's rim rounded by this radius.
   */
  split: number;
  gap: number;
  thigh: number;
  knee: number;
  shin: number;
  foot: number;
  legBlend: number;
  /**
   * The boosters: every hand and foot is cut flat across its end, with a round hole this wide in the middle of the
   * cut, a matte black rim this wide round the hole standing this far out of the cut, its section's corners rounded
   * by this curve (none, a square edge); the cut's edge rounded by this radius.
   */
  hole: number;
  extrude: number;
  boosterRim: number;
  rimCurve: number;
  endEdge: number;
  /** The torch: the visor's rim lit, throwing this colour ahead at this strength (W90; kept as brightness) over this wide a cone; or off. */
  torch: "on" | "off";
  torchColour: string;
  torchBrightness: number;
  torchSpread: number;
  /** The boost: from the feet's nozzles alone, a jet this colour and long, lighting what is under it at this strength (W90; kept as brightness). */
  boostColour: string;
  boostLength: number;
  boostBrightness: number;
  /** The speed it walks up to, in metres a second: faster, it runs; and the speed under which it stands. */
  walkUpTo: number;
  standUnder: number;
  /** How long it takes to turn to face the way it goes, in seconds, and its limbs to start or stop, in ms. */
  turn: number;
  settle: number;
};

/**
 * His settings (World.md W71; the Settings JSON his Copy sent on 2026-10-14, verbatim): what the world draws and the
 * card starts from. Version 5 started at mine, the sketch's measure against the figure's height, puffed; his are
 * slighter in the limbs, the head a little larger, the torch off, the gait slower to run and quicker to turn.
 */
export const HUMAN_START: HumanConfig = PUBLISHED_HUMANS[0].settings;
/** His settings as he sent them (W71), the first published copy; kept to read, not read by anything. */
export const HUMAN_SENT: HumanConfig = {
  colour: "#f7f1f2",
  shows: "look",
  posture: "stand",
  moves: "still",
  expression: "ahead",
  looksAtCursor: false,
  headSize: 70,
  visor: 50,
  visorBulge: 10,
  visorRim: 2,
  visorInset: 1,
  neck: 10,
  neckHeight: 5,
  body: 50,
  bodyDepth: 40,
  bodyEdge: 39,
  bodyDome: 5,
  slope: 10,
  armLength: 100,
  groove: 3,
  shoulder: 20,
  upperArm: 10,
  elbow: 10,
  forearm: 20,
  hand: 10,
  armBlend: 10,
  split: 110,
  gap: 3,
  thigh: 10,
  knee: 10,
  shin: 20,
  foot: 20,
  legBlend: 0,
  hole: 17,
  extrude: 2,
  boosterRim: 2,
  rimCurve: 4,
  endEdge: 1,
  torch: "off",
  torchColour: "#f6b9c9",
  torchBrightness: 1000,
  torchSpread: 40,
  boostColour: "#e6a3ad",
  boostLength: 0.9,
  boostBrightness: 1,
  walkUpTo: 1,
  standUnder: 0.55,
  turn: 0.1,
  settle: 50,
};

export const HUMAN_JIG: Jig<HumanConfig> = {
  name: "Human",
  version: HUMAN_VERSION,
  start: HUMAN_START,
  groups: [
    {
      title: "Figure",
      note: () =>
        `${HUMAN_FEET} feet tall, ${HUMAN_HEIGHT.toFixed(2)} m from sole to crown: his sketch's silhouette, puffed, every limb a round volume swelling at its joints, one matte colour. Here it stands on its block in its Posture, or walks, runs, hovers or flies in place (Motion): a drag goes round it, the wheel comes nearer. In the world it walks where the visitor goes, and the visitor looks out through its helmet. Shows its look, its head alone, its skeleton, or its boosters firing (Boost, from the feet alone, as they do hovering and flying).`,
      controls: [
        { kind: "colour", key: "colour", label: "Colour", options: COLOURS },
        {
          kind: "choice",
          key: "shows",
          label: "Shows",
          options: [
            { value: "look", label: "Look" },
            { value: "head", label: "Head" },
            { value: "skeleton", label: "Skeleton" },
            { value: "boost", label: "Boost" },
          ],
        },
        {
          kind: "choice",
          key: "posture",
          label: "Posture",
          options: [
            { value: "stand", label: "Stand" },
            { value: "walk", label: "Walk" },
            { value: "run", label: "Run" },
            { value: "hover", label: "Hover" },
            { value: "wave", label: "Wave" },
          ],
        },
        {
          kind: "choice",
          key: "moves",
          label: "Motion",
          options: [
            { value: "still", label: "Still" },
            { value: "walking", label: "Walking" },
            { value: "running", label: "Running" },
            { value: "hovering", label: "Hovering" },
            { value: "flying", label: "Flying" },
          ],
        },
      ],
    },
    {
      title: "Head",
      note: () =>
        "A ball, its top at the crown, with a round glass visor on its front: a lens doming out by the Bulge, in a metal rim set into the ball by the Inset. It rests on a short round neck and turns with it. Expression holds it ahead, turned, tilted or both; the visitor's eye in the helmet looks where it is held. Looks at cursor turns it to the pointer instead, as far as its neck allows, while the pointer is over the world; off the world it is held in its Expression again.",
      controls: [
        {
          kind: "choice",
          key: "expression",
          label: "Expression",
          options: [
            { value: "ahead", label: "Ahead" },
            { value: "up", label: "Up" },
            { value: "down", label: "Down" },
            { value: "left", label: "Left" },
            { value: "right", label: "Right" },
            { value: "tiltLeft", label: "Tilt left" },
            { value: "tiltRight", label: "Tilt right" },
            { value: "curious", label: "Curious" },
            { value: "shy", label: "Shy" },
          ],
        },
        { kind: "switch", key: "looksAtCursor", label: "Looks at cursor" },
        { kind: "number", key: "headSize", label: "Size", min: 40, max: 100, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "visor", label: "Visor", min: 10, max: 90, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "visorBulge", label: "Bulge", min: 0, max: 20, step: 1, marks: 5, unit: "cm" },
        { kind: "number", key: "visorRim", label: "Rim", min: 0, max: 5, step: 0.5, unit: "cm" },
        { kind: "number", key: "visorInset", label: "Inset", min: 0, max: 5, step: 0.5, unit: "cm" },
        { kind: "number", key: "neck", label: "Neck", min: 10, max: 40, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "neckHeight", label: "Neck height", min: 0, max: 20, step: 1, unit: "cm" },
      ],
    },
    {
      title: "Body",
      note: () =>
        "A thick slab between the arms, its edges rounded by Edge (at half its Depth, no flat is left) and its faces domed. Slope is how far the arm's top falls below the neck's base along the shoulder's one slope.",
      controls: [
        { kind: "number", key: "body", label: "Width", min: 50, max: 120, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "bodyDepth", label: "Depth", min: 20, max: 80, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "bodyEdge", label: "Edge", min: 2, max: 40, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "bodyDome", label: "Dome", min: 0, max: 12, step: 1, unit: "cm" },
        { kind: "number", key: "slope", label: "Slope", min: 0, max: 40, step: 1, marks: 10, unit: "cm" },
      ],
    },
    {
      title: "Arms",
      note: () =>
        "Round arms hang flush against the body, the Groove of air away, and bend at the elbow as it travels. Shoulder, Elbow and Hand are the joints' widths, Upper arm and Forearm the widths between them: alike, one smooth tube; a joint wider, a swell, its root rounded by Blend. An arm tilts out just enough to clear the body and the knees as it swings.",
      controls: [
        { kind: "number", key: "armLength", label: "Length", min: 50, max: 140, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "groove", label: "Groove", min: 0, max: 6, step: 0.5, unit: "cm" },
        { kind: "number", key: "shoulder", label: "Shoulder", min: 10, max: 60, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "upperArm", label: "Upper arm", min: 10, max: 60, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "elbow", label: "Elbow", min: 10, max: 60, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "forearm", label: "Forearm", min: 10, max: 60, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "hand", label: "Hand", min: 10, max: 60, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "armBlend", label: "Blend", min: 0, max: 30, step: 1, marks: 10, unit: "cm" },
      ],
    },
    {
      title: "Legs",
      note: () =>
        "Round legs, the thigh hidden in the body down to the Split, the knee just under it, the foot flat on the ground. Thigh, Knee, Shin and Foot are their widths: alike, one smooth column; a joint wider, a swell, its root rounded by Blend. The legs part by the Gap and what their widest needs.",
      controls: [
        { kind: "number", key: "split", label: "Split", min: 30, max: 120, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "gap", label: "Gap", min: 0, max: 20, step: 1, unit: "cm" },
        { kind: "number", key: "thigh", label: "Thigh", min: 10, max: 60, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "knee", label: "Knee", min: 10, max: 60, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "shin", label: "Shin", min: 10, max: 60, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "foot", label: "Foot", min: 10, max: 60, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "legBlend", label: "Blend", min: 0, max: 30, step: 1, marks: 10, unit: "cm" },
      ],
    },
    {
      title: "Torch",
      note: () => "The visor's rim is a torch: lit, it glows its colour and throws it ahead of the figure, as wide as the Spread.",
      controls: [
        {
          kind: "choice",
          key: "torch",
          label: "Torch",
          options: [
            { value: "on", label: "On" },
            { value: "off", label: "Off" },
          ],
        },
        { kind: "colour", key: "torchColour", label: "Colour", options: COLOURS },
        { kind: "number", key: "torchBrightness", label: "Strength", min: 0, max: 2000, step: 10, marks: 500 },
        { kind: "number", key: "torchSpread", label: "Spread", min: 10, max: 90, step: 1, marks: 20, unit: "°" },
      ],
    },
    {
      title: "Boost",
      note: () => "What the feet's nozzles throw when it hovers or flies, or when Shows is Boost: a jet this colour and this long, lighting what is under it. The hands never boost.",
      controls: [
        { kind: "colour", key: "boostColour", label: "Colour", options: COLOURS },
        { kind: "number", key: "boostLength", label: "Length", min: 0.2, max: 3, step: 0.1, marks: 1, unit: "m" },
        { kind: "number", key: "boostBrightness", label: "Strength", min: 0, max: 30, step: 0.5, marks: 10 },
      ],
    },
    {
      title: "Boosters",
      note: () =>
        "Every hand and foot is cut flat across its end, a round hole in the middle of the cut with a matte black rim round it, standing out of the cut by Extrude: what it hovers and glides on, and what the feet stand on. Curve rounds the rim's corners; none is a square edge. Edge rounds the cut's own edge.",
      controls: [
        { kind: "number", key: "hole", label: "Hole", min: 2, max: 20, step: 1, marks: 5, unit: "cm" },
        { kind: "number", key: "extrude", label: "Extrude", min: 0, max: 10, step: 0.5, marks: 5, unit: "cm" },
        { kind: "number", key: "boosterRim", label: "Rim", min: 0, max: 4, step: 0.5, unit: "cm" },
        { kind: "number", key: "rimCurve", label: "Curve", min: 0, max: 4, step: 0.5, unit: "cm" },
        { kind: "number", key: "endEdge", label: "Edge", min: 1, max: 16, step: 1, unit: "cm" },
      ],
    },
    {
      title: "Gait",
      note: () =>
        "Its walk and its run are the system's human rig's (Motion.md): a stride covers the ground it travels, but a step never takes longer than the gait's own cycle, so slowing it shortens its steps instead of crawling. Under Stands under it stands while the camera coasts to a stop.",
      controls: [
        { kind: "number", key: "walkUpTo", label: "Walk up to", min: 1, max: 8, step: 0.5, unit: "m/s" },
        { kind: "number", key: "standUnder", label: "Stands under", min: 0.05, max: 2, step: 0.05, marks: 0.5, unit: "m/s" },
        { kind: "number", key: "turn", label: "Turn", min: 0, max: 1, step: 0.05, unit: "s" },
        { kind: "number", key: "settle", label: "Settle", min: 0, max: 600, step: 50, unit: "ms" },
      ],
    },
  ],
  // W71: Copy ends with the settings exactly, so what he sends back is what the world starts from.
  copy: (config) => [`Settings JSON: ${JSON.stringify(config)}`],
};

/** Which bones carry a point of a part: two joints and how much of the first, 1 all of it. */
export type Carried = readonly [JointId, JointId, number];
type Carrier = (x: number, y: number) => Carried;
type Common = { name: string; carried: Carrier };
/**
 * A flat shape cut out thick: a convex polygon in the figure's front plane (counter-clockwise, in metres), its corners
 * rounded by `round`, cut out `depth` thick about the figure's middle with every edge rounded by `edge`, each face
 * domed outward by `dome` at its middle.
 */
export type SlabPart = Common & { kind: "slab"; polygon: readonly (readonly [number, number])[]; round: number; depth: number; edge: number; dome: number };
/**
 * A round bar in the figure's front plane, from one ball to another: round in section, a hemisphere at each end, its
 * width changing evenly from the one ball's to the other's. The neck, a shoulder's slope, an upper arm, a forearm, a
 * thigh, a shin.
 */
export type BarPart = Common & { kind: "bar"; from: readonly [number, number]; to: readonly [number, number]; radii: readonly [number, number] };
/** A ball in the figure's front plane: a joint's swell, the shoulder's dome, the elbow, the hand, the knee, the foot. */
export type BallPart = Common & { kind: "ball"; at: readonly [number, number]; radius: number };
export type Part = SlabPart | BarPart | BallPart;
/**
 * A booster's end: the piece is cut flat at this height, the cut's edge rounded by `edge`, with a round hole of this
 * radius into it at `x` (the limb's axis), and a rim this wide round the hole, standing `extrude` out of the cut, its
 * section's corners rounded by `curve`.
 */
export type Cut = { y: number; edge: number; x: number; hole: number; rim: number; extrude: number; curve: number };
/**
 * A piece of the figure: its parts joined into one closed surface, blended into each other over `blend`, standing on
 * one bone, or on the trunk's bones by height (`bone` null: the body, the neck, the shoulders' slopes and the arms'
 * domes, which never move from the chest). Pieces overlap rather than join, so a bend never opens a seam: a joint's
 * ball is in both pieces it belongs to, the second a millimetre smaller, and turns about its own centre, which keeps
 * its shape. `cut`: the piece ends in a booster (a forearm's hand, a shin's foot).
 */
export type Piece = { name: string; bone: JointId | null; blend: number; cut?: Cut; parts: Part[] };

/** Where an arm's joints are, in metres, for its bones to stand: its dome's centre, its elbow and its end's centre. */
export type ArmJoints = { dome: readonly [number, number]; elbow: readonly [number, number]; end: readonly [number, number]; radius: number };
/**
 * The head, in metres: a ball of this radius, its centre this high, with its visor on its front (+z): the lens's
 * radius inside the rim, the rim's plane this far from the centre along the front (set in by the Inset), the lens's
 * bulge out of that plane, and the rim's width.
 */
export type Head = { centre: readonly [number, number]; radius: number; visor: { radius: number; plane: number; bulge: number; rim: number } };
export type Look = {
  pieces: Piece[];
  head: Head;
  arms: { left: ArmJoints; right: ArmJoints };
};

/**
 * A shoulder's slope is a bar this much of the arm's radius: it hides inside the body's roof, and the arm's dome stands
 * the rest proud of the slope, as the render's shoulders do.
 */
export const SHOULDER_BAR = 0.9;
/**
 * The fillet where two parts meet that are not a joint, in metres: a clay crease, narrow enough to keep the Groove and
 * the line between the legs open. A part laid flush under another sits this far under it, so the join never bulges.
 */
export const FILLET = 0.015;
/** The air an arm keeps from the legs' widest part as both swing, in metres: an arm and a knee never touch. */
const CLEAR = 0.01;
/** A joint's ball is in both its pieces; the lower piece's copy is this much smaller, in metres, so the two never fight for one surface. */
const COPY_IN = 0.001;
/** How much of a hand's or a foot's ball is cut off flat, as a share of its radius: the foot's above the ground by its rim, the hand's at its end. */
const END_CUT = 0.35;
/**
 * Where the body's skin turns from one bone to the next, in the rig's units: from the spine to the chest over the
 * chest's lower half, and from the hips to the spine over the spine's lower half, so a twist and a sway bend it.
 */
const CHEST_TURN = [4.1, 4.65] as const;
const SPINE_TURN = [3.3, 3.95] as const;

const smoothstep = (x: number, from: number, to: number) => {
  const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
  return t * t * (3 - 2 * t);
};
const rigid = (id: JointId): Carrier => () => [id, id, 1];

/**
 * The look's parts at rest, in metres. The head's top is the crown; under its ball the neck shows for Neck height, so
 * the neck's base is where the shoulders' slope starts, at the neck's edge. The slope reaches the arm's top at the
 * arm's centre, Slope below the neck's base; the arm's dome stands a little proud of it. The body's roof is the slope
 * itself, so the shoulder's bar lies flush inside it and shows only where it bridges to the dome. An arm hangs flush
 * against the body's side, the Groove away, its elbow at its middle, and ends at Length below its dome's top; every
 * part of it keeps the Groove and clears the legs' widest part, so the arm tilts out from its dome by what they need. The legs
 * run from the ground up into the body to the rig's hips; the body ends at the Split, where they part, their knees
 * at the rig's, just under it; their thighs narrow at the hip to stay inside the body.
 */
export function lookOf(config: HumanConfig): Look {
  const cm = (value: number) => value / 100;
  const crown = HUMAN_HEIGHT;
  const hips = joint("hips").at[1] * UNIT;
  const knee = joint("leftKnee").at[1] * UNIT;
  const trunk: Part[] = [];
  const pieces: Piece[] = [];
  const armBlend = Math.max(FILLET, cm(config.armBlend));
  const legBlend = Math.max(FILLET, cm(config.legBlend));

  // The head: a ball, its top at the crown, on the head bone; its visor's rim is where a circle of the Visor's width
  // meets the ball, set in by the Inset, the lens inside the rim doming out by the Bulge.
  const headRadius = cm(config.headSize) / 2;
  const headBottom = crown - 2 * headRadius;
  const headCentre = crown - headRadius;
  const visorRadius = Math.min(cm(config.visor) / 2, headRadius * 0.95);
  const rim = Math.min(cm(config.visorRim), visorRadius / 2);
  const head: Head = {
    centre: [0, headCentre],
    radius: headRadius,
    visor: { radius: visorRadius - rim, plane: Math.sqrt(headRadius * headRadius - visorRadius * visorRadius) - cm(config.visorInset), bulge: cm(config.visorBulge), rim },
  };

  // The neck's base is where the slope starts. A head taller than its range allows would push the shoulders under the
  // arms; the slope starts no lower than half way from the hips to the head.
  const neckRadius = cm(config.neck) / 2;
  const neckBase = Math.max(headBottom - cm(config.neckHeight), hips + 0.5 * (headBottom - hips));
  const half = cm(config.body) / 2;
  const bodyDepth = cm(config.bodyDepth);
  const bodyEdge = Math.min(cm(config.bodyEdge), bodyDepth / 2, half / 2);
  const split = Math.min(cm(config.split), neckBase - 2 * bodyEdge);

  // The legs' numbers first: each part must clear the other leg's, so the legs stand their widest from the middle
  // line, and the arms must clear them as both swing.
  const thighRadius = cm(config.thigh) / 2;
  const kneeRadius = cm(config.knee) / 2;
  const shinRadius = cm(config.shin) / 2;
  const footRadius = cm(config.foot) / 2;
  const legWidest = Math.max(thighRadius, kneeRadius, shinRadius, footRadius);
  const legX = cm(config.gap) / 2 + legWidest;
  const legOuter = legX + legWidest;
  // The legs together are wider than the body between the arms (the sketch's): a thigh narrows at the hip to a crease inside the body's side.
  const hipRadius = Math.min(thighRadius, Math.max(0.02, half - FILLET - legX));
  const booster = { edge: cm(config.endEdge), hole: cm(config.hole) / 2, rim: cm(config.boosterRim), extrude: cm(config.extrude), curve: cm(config.rimCurve) };
  // The foot's ball is cut by the ground less what its rim stands out: the figure stands on its rims.
  const footY = booster.extrude + footRadius * (1 - END_CUT);
  // Below here the legs are at their widest: an arm's inner side keeps clear of them down to the ground.
  const legTop = Math.max(knee + kneeRadius, footY + footRadius);

  // The arm's numbers, since the body's roof is drawn to the dome. The upper arm hangs flush against the body, the
  // Groove away; from its dome down, the arm tilts out just as far as a wider joint, a wider forearm or the legs'
  // widest part needs, never back in, so the elbow and the hand keep the Groove and clear the knees as they swing.
  const groove = cm(config.groove);
  const shoulderRadius = cm(config.shoulder) / 2;
  const upperRadius = cm(config.upperArm) / 2;
  const elbowRadius = cm(config.elbow) / 2;
  const forearmRadius = cm(config.forearm) / 2;
  const handRadius = cm(config.hand) / 2;
  const barRadius = upperRadius * SHOULDER_BAR;
  const domeX = half + groove + upperRadius;
  const armTop = neckBase - cm(config.slope);
  const slopeAt = (x: number) => neckBase - (neckBase - armTop) * ((Math.abs(x) - neckRadius) / (domeX - neckRadius));
  const domeY = armTop - barRadius;
  const domeTop = domeY + Math.max(shoulderRadius, upperRadius);
  // The end's centre is Length below the dome's top less its own radius, and never above the dome's underside.
  const endY = Math.min(domeY - upperRadius, domeTop - cm(config.armLength) + Math.max(handRadius, forearmRadius));
  // The elbow is at the arm's middle: the look's arm is shorter and fuller than the rig's, so it bends where it swells.
  const elbowY = (domeY + endY) / 2;
  // How far in an arm's inner side may come at a height: the Groove from the body, or clear of the legs below their top.
  const innerAt = (y: number) => (y <= legTop ? Math.max(half + groove, legOuter + CLEAR) : half + groove);
  // A bar between two nodes keeps its inner side clear where it crosses the legs' top, as well as at its ends.
  const crossing = (fromX: number, fromY: number, toY: number, radius: number) => {
    if (!(fromY > legTop && toY < legTop)) return 0;
    const t = (fromY - legTop) / (fromY - toY);
    return fromX + (legOuter + CLEAR + radius - fromX) / t;
  };
  const elbowX = Math.max(domeX, innerAt(elbowY) + Math.max(elbowRadius, upperRadius, forearmRadius), crossing(domeX, domeY, elbowY, upperRadius));
  const endX = Math.max(elbowX, innerAt(endY) + Math.max(handRadius, forearmRadius), crossing(elbowX, elbowY, endY, forearmRadius));

  trunk.push({
    kind: "slab",
    name: "body",
    polygon: [
      [-half, split],
      [half, split],
      [half, slopeAt(half)],
      [neckRadius, neckBase],
      [-neckRadius, neckBase],
      [-half, slopeAt(half)],
    ],
    round: bodyEdge,
    depth: bodyDepth,
    edge: bodyEdge,
    dome: cm(config.bodyDome),
    carried: (_x, y) =>
      y > CHEST_TURN[0] * UNIT
        ? ["chest", "spine", smoothstep(y, CHEST_TURN[0] * UNIT, CHEST_TURN[1] * UNIT)]
        : ["spine", "hips", smoothstep(y, SPINE_TURN[0] * UNIT, SPINE_TURN[1] * UNIT)],
  });
  // The neck runs from inside the body up into the head, so neither end shows: a plain column between them.
  trunk.push({ kind: "bar", name: "neck", from: [0, neckBase - neckRadius], to: [0, headCentre], radii: [neckRadius, neckRadius], carried: rigid("chest") });

  const arms = {} as Look["arms"];
  for (const side of [-1, 1] as const) {
    const prefix = side === 1 ? "left" : "right";
    // The shoulder: a bar from the middle, under the neck, to the arm's dome, its top a crease under the slope, so
    // it lies inside the body's roof and shows only where it bridges the body's corner to the dome.
    trunk.push({
      kind: "bar",
      name: `${prefix} shoulder`,
      from: [0, slopeAt(0) - FILLET - barRadius],
      to: [side * domeX, domeY - FILLET],
      radii: [barRadius, barRadius],
      carried: rigid("chest"),
    });
    // The arm's dome never moves from the chest (the arm turns about its centre), so the trunk carries it too, and
    // the shoulder's slope and the body's corner flow into it. The upper arm is a piece on the arm bone, dome to
    // elbow; the forearm a piece on the elbow's, elbow to hand: the elbow bends where its ball is.
    const dome = [side * domeX, domeY] as const;
    const elbow = [side * elbowX, elbowY] as const;
    const end = [side * endX, endY] as const;
    const onArm = rigid(`${prefix}Arm`);
    const onElbow = rigid(`${prefix}Elbow`);
    trunk.push({ kind: "ball", name: `${prefix} arm dome`, at: dome, radius: shoulderRadius, carried: rigid("chest") });
    pieces.push({
      name: `${prefix} upper arm`,
      bone: `${prefix}Arm`,
      blend: armBlend,
      parts: [
        { kind: "ball", name: `${prefix} arm dome`, at: dome, radius: shoulderRadius - COPY_IN, carried: onArm },
        { kind: "bar", name: `${prefix} upper arm`, from: dome, to: elbow, radii: [upperRadius, upperRadius], carried: onArm },
        { kind: "ball", name: `${prefix} elbow`, at: elbow, radius: elbowRadius, carried: onArm },
      ],
    });
    pieces.push({
      name: `${prefix} forearm`,
      bone: `${prefix}Elbow`,
      blend: armBlend,
      cut: { ...booster, y: endY - handRadius * (1 - END_CUT), x: side * endX },
      parts: [
        { kind: "ball", name: `${prefix} elbow`, at: elbow, radius: elbowRadius - COPY_IN, carried: onElbow },
        { kind: "bar", name: `${prefix} forearm`, from: elbow, to: end, radii: [forearmRadius, forearmRadius], carried: onElbow },
        { kind: "ball", name: `${prefix} hand`, at: end, radius: handRadius, carried: onElbow },
      ],
    });
    arms[prefix] = { dome, elbow, end, radius: upperRadius };

    // The leg: a thigh from the rig's hip, inside the body, to the knee, its ball, a piece on the hip bone; and a
    // shin from the knee to the foot's ball, which the ground cuts flat, a piece on the knee's: the walk bends it there.
    const x = side * legX;
    const onHip = rigid(`${prefix}Hip`);
    const onKnee = rigid(`${prefix}Knee`);
    pieces.push({
      name: `${prefix} thigh`,
      bone: `${prefix}Hip`,
      blend: legBlend,
      parts: [
        { kind: "bar", name: `${prefix} thigh`, from: [x, hips], to: [x, knee], radii: [hipRadius, thighRadius], carried: onHip },
        { kind: "ball", name: `${prefix} knee`, at: [x, knee], radius: kneeRadius, carried: onHip },
      ],
    });
    pieces.push({
      name: `${prefix} shin`,
      bone: `${prefix}Knee`,
      blend: legBlend,
      cut: { ...booster, y: booster.extrude, x },
      parts: [
        { kind: "ball", name: `${prefix} knee`, at: [x, knee], radius: kneeRadius - COPY_IN, carried: onKnee },
        { kind: "bar", name: `${prefix} shin`, from: [x, knee], to: [x, footY], radii: [shinRadius, shinRadius], carried: onKnee },
        { kind: "ball", name: `${prefix} foot`, at: [x, footY], radius: footRadius, carried: onKnee },
      ],
    });
  }
  pieces.unshift({ name: "trunk", bone: null, blend: FILLET, parts: trunk });
  return { pieces, head, arms };
}

type Ground = readonly [number, number];
const RAD = Math.PI / 180;

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
 * Which gait a speed, in metres a second, asks for: standing under the Stands under (the camera coasts to a stop on
 * its Glide, slower and slower, and a figure does not crawl the last of it), walking up to the Walk up to, running
 * over it; a run keeps on until the speed has dropped a little under it, so a speed wavering about the line never
 * flickers between the two.
 */
export function gaitFor(config: HumanConfig, speed: number, was: HumanGait = "rest"): HumanGait {
  if (speed < config.standUnder) return "rest";
  const line = was === "run" ? config.walkUpTo * 0.85 : config.walkUpTo;
  return speed <= line ? "walk" : "run";
}

/** How far one step of a gait covers, in metres: the stride's swing, at the figure's leg. */
export function stepOf(motion: HumanMotion, gait: Exclude<HumanGait, "rest">): number {
  return Math.max(0.05, 2 * HUMAN_LEG * Math.sin((gait === "run" ? motion.runStride : motion.walkStride) * RAD));
}

/** How long a gait's cycle (two steps) takes at the slowest, in ms: the rig's own cycle, so a step is never a crawl. */
export function cycleOf(motion: HumanMotion, gait: Exclude<HumanGait, "rest">): number {
  return Math.max(1, gait === "run" ? motion.runCycle : motion.walkCycle);
}

/** The difference between two headings, in degrees, the short way round. */
export const turnBetween = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180;

/**
 * The figure `dt` ms on, travelling at `velocity` (metres a ms over the ground): facing its way more, its stride on
 * as far as it went, its limbs more into their gait or back to standing; and whether it has come to rest. Under
 * reduced motion it faces its way and stands or walks at once. With `facing` (degrees, a heading) it faces that way
 * at once, whichever way it goes: the visitor steering from its helmet, where the body faces the way the eye looks
 * (World.md W78) and the eye's own Smoothing eases the turn.
 */
export function figureStep(figure: Figure, config: HumanConfig, motion: HumanMotion, velocity: Ground, dt: number, reduced: boolean, facing?: number): { figure: Figure; done: boolean } {
  const speed = Math.hypot(velocity[0], velocity[1]) * 1000;
  const gait = gaitFor(config, speed, figure.gait);
  const moving = gait === "rest" ? figure.moving : gait;
  // It faces the way it goes; standing, it keeps facing where it was going.
  const wanted = facing ?? (gait === "rest" ? figure.heading : Math.atan2(velocity[0], -velocity[1]) / RAD);
  const away = turnBetween(figure.heading, wanted);
  const tau = config.turn * 1000;
  const heading = facing !== undefined || reduced || tau <= 0 ? wanted : figure.heading + away * (1 - Math.exp(-dt / tau));
  // A stride's cycle is two steps: the cycle goes on as far as the ground went by, so the feet plant where they fall;
  // but never slower than the gait's own cycle, so a figure slowing to a stop shortens its steps and does not crawl.
  const phase = gait === "rest" ? figure.phase : (figure.phase + Math.max((speed * dt) / 1000 / (2 * stepOf(motion, moving)), dt / cycleOf(motion, moving))) % 1;
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

/**
 * The expressions (his: "possible head rotation, tilt and direction options for expression"): the head bone's turn
 * in degrees about the rig's axes, down (+x), to its left (+y) and tilted to its right (+z), within the rig's limits.
 */
const EXPRESSIONS: Record<Expression, [number, number, number]> = {
  ahead: [0, 0, 0],
  up: [-25, 0, 0],
  down: [25, 0, 0],
  left: [0, 45, 0],
  right: [0, -45, 0],
  tiltLeft: [0, 0, -20],
  tiltRight: [0, 0, 20],
  curious: [-8, 15, 18],
  shy: [20, -20, -8],
};

/** A pose with the head held in an expression as well: the expression's turn added to the pose's own, within the rig's limits. */
export function withExpression(pose: HumanPose, expression: Expression): HumanPose {
  const [x, y, z] = EXPRESSIONS[expression];
  if (!x && !y && !z) return pose;
  const [hx, hy, hz] = pose.head ?? [0, 0, 0];
  let held = setHumanJoint(pose, "head", 0, hx + x);
  held = setHumanJoint(held, "head", 1, hy + y);
  return setHumanJoint(held, "head", 2, hz + z);
}

/** The head's turn, in degrees, down (+x) and to its left (+y): what `gazeAt` gives and `withGaze` holds. */
export type Gaze = readonly [down: number, left: number];

/**
 * The head bone's turn that looks along a direction given in its parent's frame (the rig's: +x its left, +y up, +z its
 * front), for Looks at cursor. The bone turns about its x then its y (the builder's Euler order), so a direction ahead
 * of the neck is met exactly: the turn to its left is the arcsine of the direction's x, and the turn down the angle of
 * its y against its z. A direction behind the neck is out of the head's reach: it turns as far as the rig allows to
 * the side the direction is on, and down or up by the direction's own pitch, so the head strains after the pointer
 * instead of flipping. `setHumanJoint` holds every turn within the rig's limits.
 */
export function gazeAt(direction: readonly [number, number, number]): Gaze {
  const length = Math.hypot(direction[0], direction[1], direction[2]);
  if (!length) return [0, 0];
  const [x, y, z] = direction.map((d) => d / length) as [number, number, number];
  if (z <= 0) {
    const [, limit] = joint("head").limits[1];
    return [Math.atan2(-y, Math.hypot(x, z)) / RAD, (x < 0 ? -1 : 1) * limit];
  }
  return [Math.atan2(-y, z) / RAD, Math.asin(Math.max(-1, Math.min(1, x))) / RAD];
}

/** A pose with the head turned to a gaze instead of the gait's own turn or an expression's: down, left, and no tilt. */
export function withGaze(pose: HumanPose, [down, left]: Gaze): HumanPose {
  let held = setHumanJoint(pose, "head", 0, down);
  held = setHumanJoint(held, "head", 1, left);
  return setHumanJoint(held, "head", 2, 0);
}

/** Whether the feet's boosters fire: shown as such, or hovering or flying (his: "boost will only come from legs"). */
export const boosting = (config: HumanConfig) => config.shows === "boost" || config.moves === "hovering" || config.moves === "flying";

/** Where in its cycle a gait's step is held as a posture: a quarter in, one leg forward and the other back. */
const POSTURE_PHASE = 0.25;
/**
 * The postures (his: "postures of the character to select from"), each the rig's joints in degrees: a step of the
 * walk and of the run, from the rig's own gaits; hovering, the arms held a little out and back and the knees a touch
 * bent, as a thing balanced on its boosters; waving, the right arm up and its forearm turned out.
 */
export function postureOf(posture: Posture, motion: HumanMotion): { pose: HumanPose; lift: number } {
  switch (posture) {
    case "walk": return humanGaitAt("walk", POSTURE_PHASE * cycleOf(motion, "walk"), motion);
    case "run": return humanGaitAt("run", POSTURE_PHASE * cycleOf(motion, "run"), motion);
    case "hover": return { pose: { leftArm: [-15, 0, 28], rightArm: [-15, 0, -28], leftElbow: [-20, 0, 0], rightElbow: [-20, 0, 0], leftKnee: [12, 0, 0], rightKnee: [12, 0, 0], leftHip: [-6, 0, 0], rightHip: [-6, 0, 0], chest: [-4, 0, 0] }, lift: 0 };
    case "wave": return { pose: { rightArm: [-150, 0, -25], rightElbow: [-40, 0, 0], head: [0, -12, 0] }, lift: 0 };
    default: return { pose: {}, lift: 0 };
  }
}

/**
 * How it hovers and flies on its boosters (his: "hover and fly option in the character motion"), every number a
 * `--motion-human-*` token read off the canvas with these starting values (Motion.md M3; on the bench, not yet in
 * globals.css): hovering, it floats this high over its block, bobbing by this much over a cycle this long, in its
 * hover posture; flying, it floats higher, leans this far into the way it faces, its arms swept back and its legs
 * trailing, banking this far either way over its cycle.
 */
export type HoverMotion = { hoverCycle: number; hoverHeight: number; hoverBob: number; flyCycle: number; flyHeight: number; flyBob: number; flyLean: number; flyBank: number };
export function readHoverMotion(element: Element): HoverMotion {
  const n = (name: string, fallback: number) => motionNumber(element, `--motion-human-${name}`, fallback);
  return {
    hoverCycle: motionMs(element, "--motion-human-hover-cycle", 2600), hoverHeight: n("hover-height", 0.4), hoverBob: n("hover-bob", 0.06),
    flyCycle: motionMs(element, "--motion-human-fly-cycle", 3200), flyHeight: n("fly-height", 0.9), flyBob: n("fly-bob", 0.08),
    flyLean: n("fly-lean", 60), flyBank: n("fly-bank", 5),
  };
}

/** How long one cycle of a motion in place takes, in ms: a gait's the rig's, a hover's and a flight's their own. */
export function cycleFor(moves: Exclude<Moves, "still">, motion: HumanMotion, hover: HoverMotion): number {
  if (moves === "hovering") return Math.max(1, hover.hoverCycle);
  if (moves === "flying") return Math.max(1, hover.flyCycle);
  return cycleOf(motion, moves === "running" ? "run" : "walk");
}

/**
 * The figure moving in place on its page (his: "a toggle if I want the character to walk", then "hover and fly"):
 * its walk or its run at the gait's own pace, or hovering or flying on its boosters, this far through the cycle
 * (0 to 1). The lift is in the rig's units, as a stride's bounce is.
 */
export function inPlaceOf(moves: Exclude<Moves, "still">, phase: number, motion: HumanMotion, hover: HoverMotion): { pose: HumanPose; lift: number } {
  const wave = Math.sin(phase * Math.PI * 2);
  if (moves === "hovering") {
    const { pose } = postureOf("hover", motion);
    return { pose: { ...pose, leftArm: [-15, 0, 28 + 3 * wave], rightArm: [-15, 0, -28 - 3 * wave] }, lift: (hover.hoverHeight + hover.hoverBob * wave) / UNIT };
  }
  if (moves === "flying") {
    const pose: HumanPose = {
      hips: [hover.flyLean, 0, hover.flyBank * wave],
      head: [-hover.flyLean * 0.6, 0, 0],
      leftArm: [35, 0, 15],
      rightArm: [35, 0, -15],
      leftElbow: [-15, 0, 0],
      rightElbow: [-15, 0, 0],
    };
    return { pose, lift: (hover.flyHeight + hover.flyBob * wave) / UNIT };
  }
  const gait = moves === "running" ? "run" : "walk";
  return humanGaitAt(gait, phase * cycleOf(motion, gait), motion);
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

/** His variants (World.md W72): the one figure he has tuned; what the visitor travels as, everywhere. */
/** His variants of the human (W72, W73): the published copy (`published.ts`); the first, his settings of 2026-10-14 (W71), is what the page starts from. */
export const HUMAN_VARIANTS: readonly Variant<HumanConfig>[] = PUBLISHED_HUMANS;

/** A figure's settings as something kept them, read against the jig (a variant, W72); nothing is null. */
export const humanConfigOf = (saved: unknown) => configOf(HUMAN_JIG, saved);
