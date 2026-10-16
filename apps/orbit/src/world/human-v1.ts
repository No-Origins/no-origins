/**
 * Human, version 1, frozen (World.md W51; apps/orbit/CLAUDE.md: a version he has seen is frozen beside the next): the
 * figure as its skeleton alone, before he gave its look (version 2, `human.ts`, W65). Nothing draws it.
 */
import { HUMAN_JOINTS, humanGaitAt, type HumanGait, type HumanMotion, type HumanPose } from "@no-origins/ui/lib/human-motion";

import { COLOURS } from "./colours";
import type { Jig } from "./jig";

/**
 * The human, version 1 (his, 2026-10-13: "We need a human character of 8 feet in orbit. I will later give you the look
 * of the character, currently we will need human skeleton at the least to travel in the orbit"): the figure the
 * visitor travels as (World.md W51). It is 8 feet tall (his), stands where the visitor is, and walks or runs as it
 * travels, the camera behind it (`camera.ts`, version 9). Its look is his to give later: until then it is its
 * skeleton, every bone and joint drawn (`build-human.ts`).
 *
 * Its joints are the design system's human rig's (`@no-origins/ui/lib/human-motion`, `HUMAN_JOINTS`: nineteen, hips
 * to head, shoulders to hands, hips to feet), declared in the rig's own units and scaled so the figure stands its
 * height from sole to crown (`UNIT`). Its walk and its run are the rig's too (`humanGaitAt`), every number a
 * `--motion-human-*` token in globals.css (Motion.md, M3), read off the canvas as it sets off. Mine: it walks up to
 * a speed and runs over it; a stride covers the ground it travels, so its feet never slide; it turns to face the way
 * it goes over the Turn, and its limbs take the Settle to start and to stop. Nothing here is three.js.
 */

/** A foot, in metres. */
export const FOOT = 0.3048;
/** How tall the figure is, in feet (his: "a human character of 8 feet"). */
export const HUMAN_FEET = 8;
/** How tall the figure is, in metres, from sole to crown. */
export const HUMAN_HEIGHT = HUMAN_FEET * FOOT;

const joint = (id: string) => HUMAN_JOINTS.find((j) => j.id === id)!;

/**
 * The skull, in the rig's units: an egg on the head joint (the rig's head joint is the jaw, where the skull turns),
 * its centre `above` the joint, its radii across, up and front to back. The crown is its top.
 */
export const SKULL = { above: 0.46, radii: [0.38, 0.44, 0.42] as const };
/** Where a foot ends, from its ankle, in the rig's units: down to the sole and out to the toe; the rig's front is +z. */
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
  /** The skeleton's colour, one of the world's, and its bones' and joints' thickness, in centimetres. */
  colour: string;
  bone: number;
  joint: number;
  /** The speed it walks up to, in metres a second: faster, it runs. */
  walkUpTo: number;
  /** How long it takes to turn to face the way it goes, in seconds, and its limbs to start or stop, in ms. */
  turn: number;
  settle: number;
};

/** The figure before he tunes it (mine): Dusk, bones 5 cm and joints 8 cm thick; walking up to 3 m/s; a quarter-second turn. */
export const HUMAN_START: HumanConfig = {
  colour: "#6d6290",
  bone: 5,
  joint: 8,
  walkUpTo: 3,
  turn: 0.25,
  settle: 200,
};

export const HUMAN_JIG: Jig<HumanConfig> = {
  name: "Human",
  version: 1,
  start: HUMAN_START,
  groups: [
    {
      title: "Figure",
      note: () =>
        `${HUMAN_FEET} feet tall (his), ${HUMAN_HEIGHT.toFixed(2)} m from sole to crown, standing where the visitor is: it walks where the camera goes (WASD, the arrows, a drag or a click on the map). Its skeleton stands in for its look, his to give.`,
      controls: [
        { kind: "colour", key: "colour", label: "Colour", options: COLOURS },
        { kind: "number", key: "bone", label: "Bone", min: 2, max: 12, step: 1, unit: "cm" },
        { kind: "number", key: "joint", label: "Joint", min: 2, max: 16, step: 1, unit: "cm" },
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
