import { HUMAN_JOINTS, humanGaitAt, setHumanJoint, type HumanGait, type HumanMotion, type HumanPose, type JointId } from "@no-origins/ui/lib/human-motion";
import { motionMs, motionNumber } from "@no-origins/ui/lib/motion";

import { TURNAROUND } from "./clay-turnaround-v6";
import { COLOURS } from "./colours";
import { configOf, type Jig, type JigControl, type JigGroup } from "./jig";
import { PUBLISHED_HUMANS } from "./published-humans-v8";
import type { Variant } from "./variants";

/**
 * The human, version 6 (World.md W102): two forms, picked by the Form. The Suit is version 5's figure, below; the Clay
 * is his turnaround's (his, 2026-10-16: "Create another human in the orbit that looks exactly like the character
 * created in the image. It should match exactly."), a soft matte figure: a faceted head on a short wide neck, broad
 * round shoulders flowing into paddle arms pressed to the torso, two thick column legs, no face, hands or joints. Its
 * outlines are the turnaround's, measured (`clay-turnaround.ts`), every size a control that starts at the measure;
 * `lookOf` builds it of lofts, each section filling the picture's front and side outline row by row. Its second
 * variant, Clay, is the Clay; the first is his Suit. Version 5 is frozen (`human-v5.ts`, with its builder).
 *
 * The Suit, as version 5 had it: the figure the visitor travels as (World.md W51), its silhouette his sketch (W65), its volume
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
export const HUMAN_VERSION = 6;

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
/** Which figure it is (W102): the Suit, version 5's, jointed and puffed with his visor and boosters; or the Clay, his turnaround's. */
export type Form = "suit" | "clay";

export type HumanConfig = {
  /**
   * The figure's colour, one of the world's; what is drawn (its look, its head alone, its skeleton, or its look with
   * its boosters firing); the posture it holds on its page, and whether it moves in place there instead.
   */
  colour: string;
  shows: "look" | "head" | "skeleton" | "boost";
  posture: Posture;
  moves: Moves;
  /** Which figure it is (W102): each has its own Head, Body, Arms and Legs on the card; the rest are both's. */
  form: Form;
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
  /**
   * The Clay (W102), every size in centimetres, each starting at his turnaround's measure: its head this wide, tall
   * and deep; its neck this wide, showing this much under the head; its torso this wide between the arms and this
   * deep; its arms this long from the armpit, this wide at their widest and this deep, the Groove off the torso; its
   * legs this long up to the crotch, each this wide and deep, parted by the Gap.
   */
  clayHeadWidth: number;
  clayHeadHeight: number;
  clayHeadDepth: number;
  clayNeck: number;
  clayNeckHeight: number;
  clayBody: number;
  clayBodyDepth: number;
  clayArmLength: number;
  clayArmWidth: number;
  clayArmDepth: number;
  clayGroove: number;
  clayLegLength: number;
  clayLegWidth: number;
  clayLegDepth: number;
  clayGap: number;
};

/** The figure's height in centimetres: what the Clay's turnaround fractions are of. */
const HEIGHT_CM = HUMAN_HEIGHT * 100;
/** A measure held to its control's step: where the control starts. */
const toStep = (value: number, step: number) => Math.round(value / step) * step;

/**
 * The turnaround's measures in centimetres (W102), exactly: what each of the Clay's controls scales the turnaround's
 * outlines from, so the figure drawn is as big as the controls say, and every part lands where the others expect it
 * (the legs' tops at the hips' feet, the head's foot on the neck). The controls start at these held to their steps,
 * within half a centimetre of the picture's.
 */
export const CLAY_MEASURES = (() => {
  const t = TURNAROUND;
  const innerOf = (rows: readonly (readonly number[])[]) => Math.min(...rows.map((row) => row[1]!));
  return {
    headWidth: Math.max(...t.head.map(([, half]) => 2 * half)) * HEIGHT_CM,
    headHeight: (1 - t.headFoot) * HEIGHT_CM,
    headDepth: Math.max(...t.head.map(([, , back, front]) => front - back)) * HEIGHT_CM,
    neck: 2 * t.neck.half * HEIGHT_CM,
    neckHeight: (t.headFoot - t.shoulderTop) * HEIGHT_CM,
    body: 2 * t.crease * HEIGHT_CM,
    bodyDepth: Math.max(...t.torso.map(([, , back, front]) => front - back)) * HEIGHT_CM,
    armLength: (t.armpit - Math.min(...t.arm.map(([y]) => y))) * HEIGHT_CM,
    armWidth: Math.max(...t.arm.map(([, inner, outer]) => outer - inner)) * HEIGHT_CM,
    armDepth: Math.max(...t.arm.map(([, , , back, front]) => front - back)) * HEIGHT_CM,
    groove: Math.max(0, innerOf(t.arm) - t.crease) * HEIGHT_CM,
    legLength: t.crotch * HEIGHT_CM,
    legWidth: Math.max(...t.leg.map(([, inner, outer]) => outer - inner)) * HEIGHT_CM,
    legDepth: Math.max(...t.leg.map(([, , , back, front]) => front - back)) * HEIGHT_CM,
    gap: 2 * innerOf(t.leg) * HEIGHT_CM,
  };
})();

/** What version 6 added, as it starts (W102): the Suit, and the Clay's sizes at the turnaround's measures. */
export const FORM_START: Pick<HumanConfig, "form" | `clay${string}` & keyof HumanConfig> = {
  form: "suit",
  clayHeadWidth: toStep(CLAY_MEASURES.headWidth, 1),
  clayHeadHeight: toStep(CLAY_MEASURES.headHeight, 1),
  clayHeadDepth: toStep(CLAY_MEASURES.headDepth, 1),
  clayNeck: toStep(CLAY_MEASURES.neck, 1),
  clayNeckHeight: toStep(CLAY_MEASURES.neckHeight, 0.5),
  clayBody: toStep(CLAY_MEASURES.body, 1),
  clayBodyDepth: toStep(CLAY_MEASURES.bodyDepth, 1),
  clayArmLength: toStep(CLAY_MEASURES.armLength, 1),
  clayArmWidth: toStep(CLAY_MEASURES.armWidth, 1),
  clayArmDepth: toStep(CLAY_MEASURES.armDepth, 1),
  clayGroove: toStep(CLAY_MEASURES.groove, 0.5),
  clayLegLength: toStep(CLAY_MEASURES.legLength, 1),
  clayLegWidth: toStep(CLAY_MEASURES.legWidth, 1),
  clayLegDepth: toStep(CLAY_MEASURES.legDepth, 1),
  clayGap: toStep(CLAY_MEASURES.gap, 0.5),
};

/**
 * His settings (World.md W71; the Settings JSON his Copy sent on 2026-10-14, verbatim): what the world draws and the
 * card starts from. Version 5 started at mine, the sketch's measure against the figure's height, puffed; his are
 * slighter in the limbs, the head a little larger, the torch off, the gait slower to run and quicker to turn.
 */
export const HUMAN_START: HumanConfig = { ...FORM_START, ...PUBLISHED_HUMANS[0].settings };
/** His settings as he sent them (W71), the first published copy, version 5's keys; kept to read, not read by anything. */
export const HUMAN_SENT: Omit<HumanConfig, keyof typeof FORM_START> = {
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

/** How the head is held, both forms': an expression, or turned to the pointer (W69). */
const EXPRESSION: JigControl<HumanConfig> = {
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
};
const LOOKS_AT_CURSOR: JigControl<HumanConfig> = { kind: "switch", key: "looksAtCursor", label: "Looks at cursor" };

/**
 * The Clay's groups (W102): its sizes, each starting at the turnaround's measure (`CLAY_MEASURES`), so at their starts
 * it is the picture's; the card shows these in place of the Suit's when the Form is Clay (`humanJigOf`).
 */
const CLAY_GROUPS: JigGroup<HumanConfig>[] = [
  {
    title: "Head",
    note: () =>
      "A soft faceted head, his turnaround's: from the front, the side and three quarters round its outline is the picture's, its ridges soft. Width, Height and Depth size it, its crown always at the figure's height; it rests its flat foot on a short wide neck and turns on it. Expression holds it ahead, turned, tilted or both; Looks at cursor turns it to the pointer while the pointer is over the world. In the world the visitor looks out from inside it.",
    controls: [
      EXPRESSION,
      LOOKS_AT_CURSOR,
      { kind: "number", key: "clayHeadWidth", label: "Width", min: 40, max: 110, step: 1, marks: 10, unit: "cm" },
      { kind: "number", key: "clayHeadHeight", label: "Height", min: 40, max: 100, step: 1, marks: 10, unit: "cm" },
      { kind: "number", key: "clayHeadDepth", label: "Depth", min: 40, max: 100, step: 1, marks: 10, unit: "cm" },
      { kind: "number", key: "clayNeck", label: "Neck", min: 20, max: 60, step: 1, marks: 10, unit: "cm" },
      { kind: "number", key: "clayNeckHeight", label: "Neck height", min: 0, max: 20, step: 0.5, marks: 5, unit: "cm" },
    ],
  },
  {
    title: "Body",
    note: () =>
      "The torso, its sides where the arms press on it, widening below to the legs; its shoulders the turnaround's broad round yoke, flowing into the arms' tops. Width is across between the arms, Depth front to back.",
    controls: [
      { kind: "number", key: "clayBody", label: "Width", min: 40, max: 100, step: 1, marks: 10, unit: "cm" },
      { kind: "number", key: "clayBodyDepth", label: "Depth", min: 30, max: 90, step: 1, marks: 10, unit: "cm" },
    ],
  },
  {
    title: "Arms",
    note: () =>
      "Paddle arms, narrow at the shoulder and widest near their round ends, hanging pressed to the torso as the picture's are; Groove opens air between them. No elbow or hand. Each turns at its shoulder, inside the yoke, as it walks and runs. Length is from the armpit to the end.",
    controls: [
      { kind: "number", key: "clayArmLength", label: "Length", min: 40, max: 120, step: 1, marks: 10, unit: "cm" },
      { kind: "number", key: "clayArmWidth", label: "Width", min: 15, max: 60, step: 1, marks: 10, unit: "cm" },
      { kind: "number", key: "clayArmDepth", label: "Depth", min: 15, max: 60, step: 1, marks: 10, unit: "cm" },
      { kind: "number", key: "clayGroove", label: "Groove", min: 0, max: 6, step: 0.5, unit: "cm" },
    ],
  },
  {
    title: "Legs",
    note: () =>
      "Two thick column legs, a little wider at their flat round feet, parted by the Gap at the crotch, one skin with the torso; no knee or foot. Each bends at its hip as it walks and runs. Length is from the ground to the crotch.",
    controls: [
      { kind: "number", key: "clayLegLength", label: "Length", min: 40, max: 120, step: 1, marks: 10, unit: "cm" },
      { kind: "number", key: "clayLegWidth", label: "Width", min: 20, max: 70, step: 1, marks: 10, unit: "cm" },
      { kind: "number", key: "clayLegDepth", label: "Depth", min: 20, max: 70, step: 1, marks: 10, unit: "cm" },
      { kind: "number", key: "clayGap", label: "Gap", min: 0, max: 20, step: 0.5, marks: 5, unit: "cm" },
    ],
  },
];

export const HUMAN_JIG: Jig<HumanConfig> = {
  name: "Human",
  version: HUMAN_VERSION,
  start: HUMAN_START,
  groups: [
    {
      title: "Figure",
      note: (config) =>
        config.form === "clay"
          ? `${HUMAN_FEET} feet tall, ${HUMAN_HEIGHT.toFixed(2)} m from sole to crown: the Clay, his turnaround's figure, its outlines the picture's from the front, three quarters round, the side and the back; soft and matte, a faceted head, paddle arms and column legs, no face, hands, boosters or joints but where it turns. Here it stands on its block in its Posture, or walks, runs, hovers or flies in place (Motion): a drag goes round it, the wheel comes nearer. In the world it walks where the visitor goes, and the visitor looks out from inside its head. Shows its look, its head alone, or its skeleton; it has no boosters to fire.`
          : `${HUMAN_FEET} feet tall, ${HUMAN_HEIGHT.toFixed(2)} m from sole to crown: his sketch's silhouette, puffed, every limb a round volume swelling at its joints, one matte colour. Here it stands on its block in its Posture, or walks, runs, hovers or flies in place (Motion): a drag goes round it, the wheel comes nearer. In the world it walks where the visitor goes, and the visitor looks out through its helmet. Shows its look, its head alone, its skeleton, or its boosters firing (Boost, from the feet alone, as they do hovering and flying).`,
      controls: [
        {
          kind: "choice",
          key: "form",
          label: "Form",
          options: [
            { value: "suit", label: "Suit" },
            { value: "clay", label: "Clay" },
          ],
        },
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
        EXPRESSION,
        LOOKS_AT_CURSOR,
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
    ...CLAY_GROUPS,
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

/** The groups both forms show: what the figure is, and how it walks. */
const SHARED_GROUPS = ["Figure", "Gait"];
/** The jig as the card shows it for a form (W102): the shared groups, and the Suit's or the Clay's own. */
export function humanJigOf(form: Form): Jig<HumanConfig> {
  return { ...HUMAN_JIG, groups: HUMAN_JIG.groups.filter((group) => SHARED_GROUPS.includes(group.title) || CLAY_GROUPS.includes(group) === (form === "clay")) };
}

/** Which bones carry a point of a part: two joints and how much of the first, 1 all of it. */
export type Carried = readonly [JointId, JointId, number];
type Carrier = (x: number, y: number) => Carried;
/**
 * `side`, where given (−1 its right, 1 its left), keeps a part's skin to its own side: a point near it takes no weight
 * from a part on the other side (the Clay's legs, side by side in one skin, W102), so neither drags the other.
 */
type Common = { name: string; carried: Carrier; side?: -1 | 1 };
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
/**
 * A loft (the Clay's, W102): a soft column up the figure whose section at each height is a superellipse (exponent
 * `n`: 2 an ellipse, more a rounded rectangle) filling its row's extents, so its outline from the front is each row's
 * `x0`–`x1` and from the side `z0`–`z1`, exactly, smoothly between rows, and three quarters round as full as `n`
 * makes it; flat across under its first row and over its last, a row of no width closing it. Metres, the rows
 * ascending.
 */
export type LoftRow = readonly [y: number, x0: number, x1: number, z0: number, z1: number] | readonly [y: number, x0: number, x1: number, z0: number, z1: number, n: number];
/**
 * A row's sixth number, where given, is its own exponent, in place of the loft's `n` (the Clay's head, by row).
 * `inner`, where given, is the side of the section toward the figure's middle (−1 its x below the section's middle, 1
 * above), squared to `innerN` there: a limb pressed flat against the body on that side, round on the other (the Clay's
 * arms, D-shaped), fading to `n` between the two heights of `innerFade` (metres), where given, so at its top (the
 * shoulder's joint) its section is the joint's. `roundBottom`, where given, rounds the edge of its flat bottom by that
 * radius (the Clay's soles).
 */
export type LoftPart = Common & { kind: "loft"; rows: readonly LoftRow[]; n: number; inner?: -1 | 1; innerN?: number; innerFade?: readonly [number, number]; roundBottom?: number };
/**
 * A body turned about an axis across the figure (the Clay's joints, W102): its cross-section through its middle is a
 * superellipse `rx` across and `r` deep (exponent `n`), turned about the line across the figure through `at`, so it is
 * the same whatever it is turned about that line by. A limb's top is one, round its pivot: the limb swings forward and
 * back about that line, and its top fills the same room at every angle. Metres.
 */
export type RevolvedPart = Common & { kind: "revolved"; at: readonly [number, number, number]; rx: number; r: number; n: number };
export type Part = SlabPart | BarPart | BallPart | LoftPart | RevolvedPart;
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
export type Piece = {
  name: string;
  bone: JointId | null;
  blend: number;
  /** Where the blend is less than `blend`, by place (metres): the Clay's trunk is tight where its creases are, its armpits and crotch. */
  blendAt?: (x: number, y: number) => number;
  cut?: Cut;
  parts: Part[];
};

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
  /** The Suit's head, a ball with its visor; the Clay's head is a piece of its own, on the head bone. */
  head: Head | null;
  /** Where the Suit's arms' joints are, for their bones to stand. */
  arms?: { left: ArmJoints; right: ArmJoints };
  /** Where the Clay stands the bones it moves, in metres; the rest as the rig declares them. */
  bones?: Partial<Record<JointId, readonly [number, number, number]>>;
  /** Where the Clay's head's middle is, in metres: its head piece is held there, and the visitor's eye with it. */
  eye?: readonly [number, number, number];
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
  if (config.form === "clay") return clayLookOf(config);
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

  const arms = {} as NonNullable<Look["arms"]>;
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

/** How far one step of a gait covers, in metres: the stride's swing, at the figure's leg (the Suit's the rig's). */
export function stepOf(motion: HumanMotion, gait: Exclude<HumanGait, "rest">, leg = HUMAN_LEG): number {
  return Math.max(0.05, 2 * leg * Math.sin((gait === "run" ? motion.runStride : motion.walkStride) * RAD));
}

/**
 * The figure's leg, in metres, from where it turns to the ground (W102): the rig's for the Suit, whose knee bends; the
 * Clay's from its hip's pivot, since its whole leg swings from there, so its stride covers the ground its feet do.
 */
export function legOf(config: HumanConfig): number {
  if (config.form !== "clay") return HUMAN_LEG;
  return TURNAROUND.leg[TURNAROUND.leg.length - 1]![0] * (config.clayLegLength / CLAY_MEASURES.legLength) * HUMAN_HEIGHT;
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
  const phase = gait === "rest" ? figure.phase : (figure.phase + Math.max((speed * dt) / 1000 / (2 * stepOf(motion, moving, legOf(config))), dt / cycleOf(motion, moving))) % 1;
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

/**
 * The Clay's look (W102): his turnaround's outlines (`TURNAROUND`, fractions of the height) scaled by its controls and
 * stood on the rig's bones. Up the figure: the crown at its height, the head's foot under it by the head's Height, the
 * shoulders' top under that by the Neck height, the crotch at the legs' Length; the trunk between the crotch and the
 * shoulders' top is the turnaround's, stretched to fit, and the armpit with it. Across: the torso's sides at the
 * creases are the Body's Width; an arm presses on them (the Groove opens air between), its own Width wide, the
 * shoulder's outline widening with it; a leg's inner edge is half the Gap from the middle, its own Width wide.
 *
 * Six pieces, overlapping rather than joined, as the Suit's: the trunk (the torso, a shoulder over each arm's top, a hip
 * over each leg's, and the neck, flowing into each other), skinned to the hips, the spine and the chest by height; a
 * shoulder and a hip run a short skirt down their limb, drawing in to close inside it, so at rest no edge shows where
 * they meet, and inside the limb's ball, so no swing shows it; each arm on its arm bone
 * and each leg on its hip bone; and the head, on the head bone, which stands at the head's foot on the neck. A limb's
 * joint is a ball, as the Suit's shoulder is: its top is a body turned about the line across the figure through its
 * pivot (`RevolvedPart`), its cross-section the limb's top row, so as the limb swings forward and back its top fills
 * the same room at every angle, under the shoulder's dome or the torso's hips, and nothing opens. Every limb turns
 * there alone: the turnaround has no elbow or knee, so none is drawn.
 */
function clayLookOf(config: HumanConfig): Look {
  const t = TURNAROUND;
  const m = CLAY_MEASURES;
  const H = HUMAN_HEIGHT;
  const scale = {
    headWidth: config.clayHeadWidth / m.headWidth,
    headHeight: config.clayHeadHeight / m.headHeight,
    headDepth: config.clayHeadDepth / m.headDepth,
    neck: config.clayNeck / m.neck,
    body: config.clayBody / m.body,
    depth: config.clayBodyDepth / m.bodyDepth,
    armLength: config.clayArmLength / m.armLength,
    armWidth: config.clayArmWidth / m.armWidth,
    armDepth: config.clayArmDepth / m.armDepth,
    legLength: config.clayLegLength / m.legLength,
    legWidth: config.clayLegWidth / m.legWidth,
    legDepth: config.clayLegDepth / m.legDepth,
  };
  // Heights, as fractions of the figure's height.
  const headFoot = 1 - config.clayHeadHeight / HEIGHT_CM;
  const shoulderTop = headFoot - config.clayNeckHeight / HEIGHT_CM;
  const crotch = config.clayLegLength / HEIGHT_CM;
  const stretch = (shoulderTop - crotch) / (t.shoulderTop - t.crotch);
  const trunkUp = (y: number) => crotch + (y - t.crotch) * stretch;
  const armpit = trunkUp(t.armpit);
  // Across: the creases, the Groove's air, and the legs' edges.
  const crease = t.crease * scale.body;
  const groove = config.clayGroove / HEIGHT_CM;
  const legInner = Math.min(...t.leg.map(([, inner]) => inner));
  const gap = config.clayGap / HEIGHT_CM / 2;
  const legAcross = (x: number) => gap + (x - legInner) * scale.legWidth;
  const armInner = Math.min(...t.arm.map(([, inner]) => inner));
  const armAcross = (x: number) => crease + (armInner - t.crease) + groove + (x - armInner) * scale.armWidth;
  const metres = (row: readonly number[]) => row.map((value) => value * H) as unknown as LoftRow;
  const depthOf = (back: number, front: number, by: number) => {
    const middle = ((back + front) / 2) * scale.depth;
    const half = ((front - back) / 2) * by;
    return [middle - half, middle + half] as const;
  };

  // The legs: the turnaround's rows, the sole to the crotch, scaled.
  const legRows = t.leg.map(([y, inner, outer, back, front, n]) => [y * scale.legLength, legAcross(inner), legAcross(outer), ...depthOf(back, front, scale.legDepth), n] as const);
  // The torso: the turnaround's rows stretched between the crotch and the shoulders' top, its sides the creases at the
  // Body's Width, the legs' tops at the crotch, closing above into the neck.
  const torsoRows = t.torso.map(([y, half, back, front, n]): LoftRow => {
    const across = y < t.crotch + 0.06 ? legAcross(half) : half * scale.body;
    const [z0, z1] = depthOf(back, front, scale.depth);
    return [(y < t.crotch ? y * scale.legLength : trunkUp(y)) * H, -across * H, across * H, z0 * H, z1 * H, n];
  });
  // The shoulders: each a dome over its arm's top, the turnaround's outline from the armpit over to the torso; past
  // the crease it widens with the arm, as the arm's own rows do.
  const shoulderAcross = (x: number) => (x >= armInner ? armAcross(x) : x * scale.body);
  const shoulderRows = t.shoulder.map(([y, inner, outer, back, front]) => [y < t.armpit ? armpit - (t.armpit - y) * scale.armLength : trunkUp(y), shoulderAcross(inner), shoulderAcross(outer), ...depthOf(back, front, scale.armDepth)] as const);
  // The arms: the turnaround's rows, the end up to the armpit, hung from the armpit by the Length.
  const armRows = t.arm.map(([y, inner, outer, back, front]) => [y > t.armpit ? trunkUp(y) : armpit - (t.armpit - y) * scale.armLength, armAcross(inner), armAcross(outer), ...depthOf(back, front, scale.armDepth)] as const);
  const armEnd = armRows[0]![0];
  // The arm's row at the armpit: where it turns, and its ball's section.
  const armJoint = armRows.reduce((a, b) => (Math.abs(b[0] - armpit) < Math.abs(a[0] - armpit) ? b : a));
  // A joint's ball: a limb's top row, turned about the line across the figure through its middle (`RevolvedPart`).
  const ballOf = (row: readonly number[], n: number, across: number) => ({
    at: [(row[1] + row[2]) / 2, row[0], (row[3] + row[4]) / 2] as const,
    rx: ((row[2] - row[1]) / 2) * across,
    r: ((row[4] - row[3]) / 2) * JOINT_DEEP,
    n,
  });
  const shoulder = ballOf(armJoint, t.square.arm, JOINT_ACROSS.arm);
  // A leg turns at the middle of its row at the crotch: its skin bends there (`LEG_TURN`), with no ball.
  const legTop = legRows.reduce((a, b) => (Math.abs(b[0] - crotch) < Math.abs(a[0] - crotch) ? b : a));
  const hip = { at: [(legTop[1] + legTop[2]) / 2, legTop[0], (legTop[3] + legTop[4]) / 2] as const };
  // The neck: from inside the trunk up into the head, round about its middle, its depth the turnaround's in proportion.
  const neckHalf = t.neck.half * scale.neck;
  const neckMiddle = ((t.neck.back + t.neck.front) / 2) * scale.depth;
  const neckDeep = ((t.neck.front - t.neck.back) / 2) * scale.neck;
  // It runs up inside the head as far as `NECK_IN`, its top rounded over, so a head turned, tilted or raised as far as
  // the rig allows never shows the neck's top: the head turns about its foot, on the neck.
  const neckTop = headFoot + NECK_IN;
  const neckRows: LoftRow[] = [
    ...[shoulderTop - 0.03, neckTop - NECK_DOME].map((y) => metres([y, -neckHalf, neckHalf, neckMiddle - neckDeep, neckMiddle + neckDeep])),
    ...Array.from({ length: 6 }, (_, i) => {
      const angle = ((i + 1) / 6) * (Math.PI / 2);
      const shrink = Math.cos(angle);
      return metres([neckTop - NECK_DOME + NECK_DOME * Math.sin(angle), -neckHalf * shrink, neckHalf * shrink, neckMiddle - neckDeep * shrink, neckMiddle + neckDeep * shrink]);
    }),
  ];
  // The head: its rows about its middle, the crown held at the figure's height, each row its own squareness.
  const headUp = (y: number) => 1 - (1 - y) * scale.headHeight;
  const headMiddle = t.headCentre * scale.depth;
  const headRows = t.head.map(([y, half, back, front, n]) => {
    const across = half * scale.headWidth;
    const through = (z: number) => headMiddle + (z - t.headCentre) * scale.headDepth;
    return [headUp(y) * H, -across * H, across * H, through(back) * H, through(front) * H, n] as const;
  });

  // The skin turns from the hips to the spine over the crotch's rise, and from the spine to the chest under the
  // armpit, the first held under the second whatever the sizes, so a long leg or a tall head never jumps it.
  const chestFrom = (armpit - 0.1) * H;
  const chestTo = (armpit - 0.04) * H;
  const spineTo = Math.min((crotch + 0.12) * H, chestFrom);
  const spineFrom = Math.min((crotch + 0.04) * H, spineTo - 0.01);
  const carriedByHeight = (_x: number, y: number): Carried =>
    y > chestFrom ? ["chest", "spine", smoothstep(y, chestFrom, chestTo)] : ["spine", "hips", smoothstep(y, spineFrom, spineTo)];

  // A row mirrored to the right where it must be, in metres, its own exponent (a sixth number) kept as it is.
  const mirrored = (rows: readonly (readonly number[])[], side: -1 | 1): LoftRow[] =>
    rows.map(([y, x0, x1, z0, z1, n]) => {
      const [a, b] = side === 1 ? [x0!, x1!] : [-x1!, -x0!];
      const row = [y! * H, a * H, b * H, z0! * H, z1! * H] as const;
      return n === undefined ? row : [...row, n];
    });
  const revolved = (name: string, ball: ReturnType<typeof ballOf>, side: -1 | 1, carried: Carrier): RevolvedPart => ({
    kind: "revolved",
    name,
    at: [side * ball.at[0] * H, ball.at[1] * H, ball.at[2] * H],
    rx: ball.rx * H,
    r: ball.r * H,
    n: ball.n,
    carried,
  });
  // The trunk's parts flow into each other (`CLAY_BLEND`), and over the shoulders more (`CLAY_YOKE`), as the
  // turnaround's do, but meet tightly beside each armpit, where an arm's crease begins, and the neck stands clear.
  const trunkBlend = (x: number, y: number) => {
    const up = y / H;
    const beside = smoothstep(Math.abs(x) / H, crease * 0.6, crease * 0.9);
    const pit = 1 - (1 - smoothstep(Math.abs(up - armpit), 0.005, 0.045)) * beside;
    const yoke = 1 + (CLAY_YOKE / CLAY_BLEND - 1) * smoothstep(up, armpit + 0.02, armpit + 0.06) * beside;
    const neck = 1 - (1 - CLAY_NECK / CLAY_BLEND) * smoothstep(up, shoulderTop - 0.05, shoulderTop - 0.005);
    // Round the crotch, where the legs and the torso meet on one surface, barely (`CLAY_HIPS`), rising to the torso's
    // own above it; between the legs, under the crotch, barely too, so the slit stays open.
    const hips = smoothstep(up, crotch + 0.012, crotch + 0.05);
    const slit = up < crotch ? 1 - smoothstep(Math.abs(x) / H, 0.004, 0.02) : 0;
    const low = CLAY_TIGHT + (CLAY_HIPS - CLAY_TIGHT) * (1 - slit);
    return Math.min(low + (CLAY_BLEND * Math.min(yoke, neck) - low) * hips, CLAY_TIGHT + (CLAY_BLEND * Math.min(yoke, neck) - CLAY_TIGHT) * pit);
  };
  const pieces: Piece[] = [
    {
      name: "trunk",
      bone: null,
      blend: CLAY_YOKE,
      blendAt: trunkBlend,
      parts: [
        { kind: "loft", name: "torso", rows: torsoRows, n: t.square.torso, carried: carriedByHeight },
        // A shoulder's foot is the arm's section (its inner side flat, where the arm presses on the torso), rounding to
        // its own over the arm's top, so at the joint the two are one section.
        ...([1, -1] as const).map((side): Part => ({
          kind: "loft",
          name: `${side === 1 ? "left" : "right"} shoulder`,
          rows: mirrored(shoulderRows, side),
          n: t.square.shoulder,
          inner: side === 1 ? -1 : 1,
          innerN: ARM_INNER_SQUARE,
          innerFade: [(armpit + 0.004) * H, (armpit + 0.04) * H],
          carried: rigid("chest"),
        })),
        // The legs are the trunk's own skin (W102): one surface from the belly down the thighs, as the picture's clay is,
        // each leg carried by its hip bone below the hips and by the hips above, turning between over `LEG_TURN`, so
        // the hips bend as a soft clay one would and nothing opens there.
        ...([1, -1] as const).map((side): Part => {
          const prefix = side === 1 ? "left" : "right";
          const crotchAt = crotch * H;
          return {
            kind: "loft",
            name: `${prefix} leg`,
            rows: mirrored(legRows, side),
            n: t.square.leg,
            side,
            roundBottom: t.footRound * H * scale.legLength,
            carried: (_x, y) => [`${prefix}Hip`, "hips", 1 - smoothstep(y, crotchAt - LEG_TURN.below, crotchAt + LEG_TURN.above)],
          };
        }),
        { kind: "loft", name: "neck", rows: neckRows, n: 2, carried: rigid("chest") },
      ],
    },
  ];
  const bones: NonNullable<Look["bones"]> = {
    neck: [0, shoulderTop * H, neckMiddle * H],
    head: [0, headFoot * H, headMiddle * H],
  };
  for (const side of [-1, 1] as const) {
    const prefix = side === 1 ? "left" : "right";
    // The right side is the left mirrored across the middle line. A limb's top is its ball, turning about its pivot.
    pieces.push({
      name: `${prefix} arm`,
      bone: `${prefix}Arm`,
      // The arm and its ball share one section at the joint, so they meet with one slope: joined plainly, since a
      // blend would swell a ridge round the arm there.
      blend: 0,
      parts: [
        { kind: "loft", name: `${prefix} arm`, rows: mirrored(armRows, side), n: t.square.arm, inner: side === 1 ? -1 : 1, innerN: ARM_INNER_SQUARE, carried: rigid(`${prefix}Arm`) },
        revolved(`${prefix} shoulder ball`, shoulder, side, rigid(`${prefix}Arm`)),
      ],
    });
    const at = (x: number, y: number, z: number) => [side * x * H, y * H, z * H] as const;
    bones[`${prefix}Shoulder`] = at(crease * 0.8, (armpit + shoulderTop) / 2, 0);
    bones[`${prefix}Arm`] = at(...shoulder.at);
    bones[`${prefix}Elbow`] = at(shoulder.at[0], (shoulder.at[1] + armEnd) / 2, shoulder.at[2]);
    bones[`${prefix}Hand`] = at(shoulder.at[0], armEnd, shoulder.at[2]);
    bones[`${prefix}Hip`] = at(...hip.at);
    bones[`${prefix}Knee`] = at(hip.at[0], hip.at[1] / 2, hip.at[2]);
    bones[`${prefix}Foot`] = at(hip.at[0], 0.01, hip.at[2]);
  }
  pieces.push({ name: "head", bone: "head", blend: 0, parts: [{ kind: "loft", name: "head", rows: headRows, n: 2.4, carried: rigid("head") }] });
  return { pieces, head: null, bones, eye: [0, ((1 + headFoot) / 2) * H, headMiddle * H] };
}

/**
 * How wide the shoulder's ball is across, as a share of the arm's top (its depth is the arm's): a little narrower, so as
 * it rises into the shoulder's dome, which narrows over it, it stays inside.
 */
const JOINT_ACROSS = { arm: 0.92 };
/** And how deep, as a share of the arm's top: a hair less, so under the joint, where the arm narrows a little, it stays inside. */
const JOINT_DEEP = 0.96;
/** Where a Clay's leg's skin turns from its hip bone to the hips, in metres below and above the crotch. */
const LEG_TURN = { below: 0.16, above: 0.04 };
/** How far the Clay's torso, shoulders and neck flow into each other where they meet, in metres: a soft clay fillet. */
const CLAY_BLEND = 0.045;
/** How they meet beside the armpits instead, in metres: barely, so an arm's crease stays a crease. */
const CLAY_TIGHT = 0.003;
/**
 * How the legs and the torso meet round the crotch, in metres: barely, since there their surfaces are one (the
 * outline's), and a blend of two surfaces in one place would bulge them into a ridge.
 */
const CLAY_HIPS = 0.003;
/** How far a shoulder's dome and the torso fold into each other over the armpit, in metres: one broad round. */
const CLAY_YOKE = 0.09;
/** How far the Clay's neck runs up inside its head, and the height of the dome that closes it there, as fractions of the figure's height. */
const NECK_IN = 0.06;
const NECK_DOME = 0.025;
/** How far the neck flows into the shoulders, in metres: a small flare, the neck standing clear. */
const CLAY_NECK = 0.012;
/**
 * How square an arm's section is on its inner side, where it presses on the torso (the picture's dark crease is a line,
 * the two pressed together), against its own exponent outside.
 */
const ARM_INNER_SQUARE = 4.5;

/**
 * His variants of the human (W72, W73): the published copy (`published.ts`), the first his settings of 2026-10-14
 * (W71), the Suit, what the page starts from; and the Clay (W102), the Clay at his turnaround's measures, in code until
 * he publishes it from its card (its id is the one its item in the database will have). Its name is one New variant
 * never gives ("Human 2" would be), so it meets no item already in the database.
 */
export const HUMAN_CLAY: Variant<HumanConfig> = { id: "cd89fe2e-e46b-4561-b8a9-c8661d5745dd", name: "Clay", settings: { ...HUMAN_START, form: "clay" } };

/** A figure's settings as something kept them, read against the jig (a variant, W72); nothing is null. */
export const humanConfigOf = (saved: unknown) => configOf(HUMAN_JIG, saved);

// The published copy was saved before version 6, so it is read against the jig as the database's rows are: what it
// lacks (the Form, the Clay's sizes) comes from the start, and a pick of it is whole, the Suit. The Clay in code joins
// it only while the copy lacks it: once published and copied (`copy:published`), the copy's is the one.
export const HUMAN_VARIANTS: readonly Variant<HumanConfig>[] = [
  ...PUBLISHED_HUMANS.map((variant) => ({ ...variant, settings: humanConfigOf(variant.settings) ?? variant.settings })),
  ...(PUBLISHED_HUMANS.some((variant) => variant.id === HUMAN_CLAY.id) ? [] : [HUMAN_CLAY]),
];
