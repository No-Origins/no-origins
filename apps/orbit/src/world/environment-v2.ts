import { COLOURS } from "./colours";
import type { Jig } from "./jig";
import type { Block } from "./orbit";

/**
 * The environment, version 2: the Orbit (`orbit.ts`; his: "The world is a floating space covered with a glossy
 * spherical dome. Clouds above and water below the sphere … I should be able to place these spacial units in the 3D
 * space within the sphere. We should always be locked/bounded inside the sphere"). Its controls are mine, for him to
 * tune; so are its starting values.
 *
 * - **The Orbit**: the sphere's Radius, the world's bound.
 * - **Dome**: the glass's colour, how much it tints what is seen through it (Tint), and how bright its shine is (Gloss).
 * - **Sky and clouds**: the sky's colour; the clouds' colour, how many, and how far above the dome they float.
 * - **Water** (his: "The water should feel realistic. I want to set the level of water from the bottom of the sphere"):
 *   its colour, its Level, how high it stands over the sphere's bottom (below it where negative; the sphere sits in the
 *   sea where positive, dry inside), how big its Waves are and how fast they move (Speed).
 * - **Fog** (his: "We need fog control"): its colour, and the Distance it starts at and is whole by.
 * - **Blocks**: their colour, and building them: Place puts a block where the pointer shows it, against a block's face
 *   or on the Level's floor; Remove takes away the block under the pointer. Which blocks stand is not a control: it is
 *   what has been built (`blocks`), sent back by Copy.
 *
 * No portals (his: "Portals are not space units. We don't need those in the environment now"): the portal is an element,
 * seen on its own page (`start.ts`), not a part of the environment.
 *
 * Version 1 (`environment-v1.ts`) is frozen beside it. A version he has seen is frozen: a change to what it can be is
 * version 3, beside this one.
 */
export type EnvironmentConfig = {
  /** The sphere's radius, in metres. */
  radius: number;
  /** The dome: its colour, how much of it shows over what is behind it (0 to 1), how bright its shine (0 to 1). */
  dome: string;
  tint: number;
  gloss: number;
  /** The sky's colour, flat; the clouds': their colour, how many, and how far above the dome's top, in metres. */
  sky: string;
  clouds: string;
  cloudCount: number;
  cloudHeight: number;
  /**
   * The water: its colour; its level, in metres over the sphere's bottom (below it where negative); how big its waves
   * are (0, a mirror, to 1); and how fast they move (0, still).
   */
  water: string;
  waterLevel: number;
  waves: number;
  waveSpeed: number;
  /** The fog: its colour, and where it starts and where it is whole, in metres from the camera. */
  fog: string;
  fogFrom: number;
  fogTo: number;
  /** The blocks' colour, every block standing (`orbit.ts`), and how they are built: the tool, and the level placed on. */
  ground: string;
  blocks: Block[];
  tool: string;
  level: number;
};

/**
 * The start location as blocks (mine): three by three under the visitor, on level −1, so the visitor stands on their
 * tops, the floor of level 0, where the ground was.
 */
const START_BLOCKS: Block[] = [-1, 0, 1].flatMap((row) => [-1, 0, 1].map((column) => [column, row, -1] as const));

/**
 * Before he tunes it (mine): a sphere 60 m round the start, its glass cream, faint, and shining; the sky and the ground
 * as version 1 left them; cream clouds 10 m above the dome; the sphere sitting 15 m deep in a teal sea of middling
 * waves; a fog the sky's colour from 80 m, whole by 1.5 km, so the sea meets the sky; and blocks placed on level 0, the
 * start location's floor.
 */
export const ENVIRONMENT_START: EnvironmentConfig = {
  radius: 60,
  dome: "#f7f1f2",
  tint: 0.12,
  gloss: 0.8,
  sky: "#a7aae6",
  clouds: "#f7f1f2",
  cloudCount: 28,
  cloudHeight: 10,
  water: "#7ddde3",
  waterLevel: 15,
  waves: 0.5,
  waveSpeed: 1,
  fog: "#a7aae6",
  fogFrom: 80,
  fogTo: 1500,
  ground: "#efe5e8",
  blocks: START_BLOCKS,
  tool: "place",
  level: 0,
};

export const ENVIRONMENT_JIG: Jig<EnvironmentConfig> = {
  name: "Environment",
  version: 2,
  start: ENVIRONMENT_START,
  groups: [
    {
      title: "The Orbit",
      controls: [{ kind: "number", key: "radius", label: "Radius", min: 40, max: 200, step: 5, marks: 20, unit: "m" }],
    },
    {
      title: "Dome",
      controls: [
        { kind: "colour", key: "dome", label: "Colour", options: COLOURS },
        { kind: "number", key: "tint", label: "Tint", min: 0, max: 0.6, step: 0.02, marks: 0.1 },
        { kind: "number", key: "gloss", label: "Gloss", min: 0, max: 1, step: 0.05, marks: 0.25 },
      ],
    },
    {
      title: "Sky and clouds",
      controls: [
        { kind: "colour", key: "sky", label: "Sky", options: COLOURS },
        { kind: "colour", key: "clouds", label: "Clouds", options: COLOURS },
        { kind: "number", key: "cloudCount", label: "Count", min: 0, max: 60, step: 1, marks: 10 },
        { kind: "number", key: "cloudHeight", label: "Above", min: 0, max: 100, step: 1, marks: 10, unit: "m" },
      ],
    },
    {
      title: "Water",
      controls: [
        { kind: "colour", key: "water", label: "Colour", options: COLOURS },
        { kind: "number", key: "waterLevel", label: "Level", min: -50, max: 400, step: 1, marks: 50, unit: "m" },
        { kind: "number", key: "waves", label: "Waves", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "waveSpeed", label: "Speed", min: 0, max: 3, step: 0.1, marks: 0.5, unit: "×" },
      ],
    },
    {
      title: "Fog",
      controls: [
        { kind: "colour", key: "fog", label: "Colour", options: COLOURS },
        { kind: "number", key: "fogFrom", to: "fogTo", label: "Distance", min: 0, max: 3000, step: 10, marks: 500, unit: "m" },
      ],
    },
    {
      title: "Blocks",
      note: (config) =>
        `${config.blocks.length} ${config.blocks.length === 1 ? "block" : "blocks"}, each 10 × 10 × 5 m. Click the world to ${
          config.tool === "remove" ? "take away the block under the pointer" : "place a block on the level or against a block"
        }; drag to look round, right-drag to move, the wheel to come nearer.`,
      controls: [
        { kind: "colour", key: "ground", label: "Colour", options: COLOURS },
        {
          kind: "choice",
          key: "tool",
          label: "Tool",
          options: [
            { value: "place", label: "Place" },
            { value: "remove", label: "Remove" },
          ],
        },
        { kind: "number", key: "level", label: "Level", min: -40, max: 39, step: 1, marks: 10 },
      ],
    },
  ],
  // What has been built is sent back with the settings: every block, as [column, row, level].
  copy: (config) => [`Blocks (${config.blocks.length}): ${JSON.stringify(config.blocks)}`],
};
