import { COLOURS } from "./colours";
import type { Jig } from "./jig";
import { BLOCK, type Block } from "./orbit";

/** Environment v7: peach sunlight, lavender shade and mineral grain from his landscape reference.
 * Versions 2–6 and their builders are frozen alongside this version; these starting values are his to tune.
 */
export type EnvironmentConfig = {
  /** The sphere's radius, in metres. */
  radius: number;
  /** Atmosphere: warm horizon, sunlight's direction and tint, cool shadows, and surface grain in world metres. */
  horizon: string;
  sunlight: string;
  shadow: string;
  warmth: number;
  sunHeight: number;
  sunTurn: number;
  shade: number;
  grain: number;
  grainSize: number;
  /** The dome: its colour, how much of it shows over what is behind it (0 to 1), how bright its shine (0 to 1). */
  dome: string;
  tint: number;
  gloss: number;
  /** The sky's colour, flat; the clouds': their colour, how many, and how far above the dome's top, in metres. */
  sky: string;
  /** Pastel gas: second pigment, amount, billow scale, wind-driven speed/direction, viscosity and turbulence. */
  skyPigment: string;
  skyFlow: number;
  skyScale: number;
  skySpeed: number;
  skyWind: number;
  skyViscosity: number;
  skyTurbulence: number;
  skySoftness: number;
  clouds: string;
  cloudCount: number;
  cloudHeight: number;
  /** Cloud shape: width in dome radii, height relative to width, puffs per cloud, distribution and fixed seed. */
  cloudSize: number;
  cloudTallness: number;
  cloudPuffiness: number;
  cloudSpread: number;
  cloudScatter: number;
  cloudSeed: number;
  /** Independent pastel shading and fine surface grain; Softness rounds the light-to-shadow transition. */
  cloudLight: string;
  cloudShadow: string;
  cloudWarmth: number;
  cloudShade: number;
  cloudSoftness: number;
  cloudGrain: number;
  /**
   * The water: its colour; its level, in metres over the sphere's bottom (below it where negative); how big its waves
   * are (0, still colour, to 1); and how fast they move (0, still).
   */
  water: string;
  waterLevel: number;
  waves: number;
  waveSpeed: number;
  waterPigment: string;
  waveLength: number;
  waveDirection: number;
  waterContrast: number;
  waveHeight: number;
  crossWaves: number;
  /** Fine contour threads painted on the moving sheet, without thousands of line objects. */
  waterThreads: number;
  threadDensity: number;
  threadWidth: number;
  threadColour: string;
  /** Higher viscosity broadens and slows the pastel water's ripples; reach bounds its disc outside the dome. */
  viscosity: number;
  waterReach: number;
  boundary: number;
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

/** Starting atmosphere from his reference: blue-lavender overhead, apricot horizon, rose water,
 * pale sand, a low peach sun, cool shadows and fine grain. These are a first pass for him to tune.
 */
export const ENVIRONMENT_START: EnvironmentConfig = {
  radius: 60,
  horizon: "#ffdfbd",
  sunlight: "#f2bfa6",
  shadow: "#8b82b3",
  warmth: 0.55,
  sunHeight: 12,
  sunTurn: 135,
  shade: 0.45,
  grain: 0.18,
  grainSize: 0.06,
  dome: "#f7f1f2",
  tint: 0.28,
  gloss: 0.12,
  sky: "#9caee5",
  skyPigment: "#e6a3ad",
  skyFlow: 0.65,
  skyScale: 3,
  skySpeed: 0.5,
  skyWind: 45,
  skyViscosity: 0.8,
  skyTurbulence: 0.55,
  skySoftness: 0.75,
  clouds: "#f7f1f2",
  cloudCount: 28,
  cloudHeight: 10,
  cloudSize: 0.2,
  cloudTallness: 0.55,
  cloudPuffiness: 0.6,
  cloudSpread: 3,
  cloudScatter: 0.65,
  cloudSeed: 7,
  cloudLight: "#f2bfa6",
  cloudShadow: "#8b82b3",
  cloudWarmth: 0.35,
  cloudShade: 0.3,
  cloudSoftness: 0.8,
  cloudGrain: 0.08,
  water: "#80bfce",
  waterLevel: 0,
  waves: 0.7,
  waveSpeed: 0.5,
  waterPigment: "#e6a3ad",
  waveLength: 18,
  waveDirection: 30,
  waterContrast: 0.65,
  waveHeight: 2.5,
  crossWaves: 0.45,
  waterThreads: 0.75,
  threadDensity: 48,
  threadWidth: 0.12,
  threadColour: "#f7f1f2",
  viscosity: 0.7,
  waterReach: 2.5,
  boundary: 0.25,
  fog: "#ffdfbd",
  fogFrom: 80,
  fogTo: 1500,
  ground: "#efe5e8",
  blocks: START_BLOCKS,
  tool: "place",
  level: 0,
};

export const ENVIRONMENT_JIG: Jig<EnvironmentConfig> = {
  name: "Environment",
  version: 7,
  start: ENVIRONMENT_START,
  groups: [
    {
      title: "The Orbit",
      controls: [{ kind: "number", key: "radius", label: "Radius", min: 40, max: 200, step: 5, marks: 20, unit: "m" }],
    },
    {
      title: "Light and texture",
      note: () => "Peach light, lavender shade and fine mineral grain. Grain stays on the surface as you move.",
      controls: [
        { kind: "colour", key: "horizon", label: "Horizon", options: COLOURS },
        { kind: "colour", key: "sunlight", label: "Sunlight", options: COLOURS },
        { kind: "colour", key: "shadow", label: "Shadow", options: COLOURS },
        { kind: "number", key: "warmth", label: "Warmth", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "sunHeight", label: "Sun height", min: 0, max: 90, step: 1, marks: 15, unit: "°" },
        { kind: "number", key: "sunTurn", label: "Sun turn", min: -180, max: 180, step: 1, marks: 45, unit: "°" },
        { kind: "number", key: "shade", label: "Shade", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "grain", label: "Grain", min: 0, max: 0.5, step: 0.01, marks: 0.1 },
        { kind: "number", key: "grainSize", label: "Grain size", min: 0.02, max: 0.3, step: 0.01, marks: 0.07, unit: "m" },
      ],
    },
    {
      title: "Dome",
      controls: [
        { kind: "colour", key: "dome", label: "Colour", options: COLOURS },
        { kind: "number", key: "tint", label: "Tint", min: 0, max: 0.6, step: 0.02, marks: 0.1 },
        { kind: "number", key: "gloss", label: "Gloss", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "boundary", label: "Contours", min: 0, max: 1, step: 0.05, marks: 0.25 },
      ],
    },
    {
      title: "Sky",
      note: () => "Thick pastel gases carried by wind. Viscosity slows the drift and stretches the billows; Speed 0 holds them still.",
      controls: [
        { kind: "colour", key: "sky", label: "Colour", options: COLOURS },
        { kind: "colour", key: "skyPigment", label: "Pigment", options: COLOURS },
        { kind: "number", key: "skyFlow", label: "Flow", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "skyScale", label: "Billows", min: 1, max: 8, step: 0.25, marks: 1 },
        { kind: "number", key: "skySpeed", label: "Speed", min: 0, max: 3, step: 0.1, marks: 0.5, unit: "×" },
        { kind: "number", key: "skyWind", label: "Wind", min: -180, max: 180, step: 1, marks: 45, unit: "°" },
        { kind: "number", key: "skyViscosity", label: "Viscosity", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "skyTurbulence", label: "Turbulence", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "skySoftness", label: "Softness", min: 0.05, max: 1, step: 0.05, marks: 0.25 },
      ],
    },
    {
      title: "Clouds",
      note: () => "Sculpt a still sky from soft puffs. The same seed keeps its arrangement; changing Count adds clouds without moving the others.",
      controls: [
        { kind: "number", key: "cloudCount", label: "Count", min: 0, max: 60, step: 1, marks: 10 },
        { kind: "number", key: "cloudHeight", label: "Above", min: 0, max: 100, step: 1, marks: 10, unit: "m" },
        { kind: "number", key: "cloudSize", label: "Width", min: 0.05, max: 0.5, step: 0.01, marks: 0.1, unit: "×" },
        { kind: "number", key: "cloudTallness", label: "Height", min: 0.15, max: 1.5, step: 0.05, marks: 0.25, unit: "×" },
        { kind: "number", key: "cloudPuffiness", label: "Puffiness", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudSpread", label: "Spread", min: 1, max: 5, step: 0.1, marks: 1, unit: "×" },
        { kind: "number", key: "cloudScatter", label: "Scatter", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudSeed", label: "Seed", min: 0, max: 999, step: 1, marks: 100 },
      ],
    },
    {
      title: "Cloud colour",
      controls: [
        { kind: "colour", key: "clouds", label: "Colour", options: COLOURS },
        { kind: "colour", key: "cloudLight", label: "Light", options: COLOURS },
        { kind: "colour", key: "cloudShadow", label: "Shadow", options: COLOURS },
        { kind: "number", key: "cloudWarmth", label: "Warmth", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudShade", label: "Shade", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudSoftness", label: "Softness", min: 0.05, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudGrain", label: "Grain", min: 0, max: 0.5, step: 0.01, marks: 0.1 },
      ],
    },
    {
      title: "Water",
      note: () => "Broad blue and pink swells, crossed by finer waves. Height sets their rise; Length is the distance between crests, in metres. Waves sets their strength.",
      controls: [
        { kind: "colour", key: "water", label: "Colour", options: COLOURS },
        { kind: "colour", key: "waterPigment", label: "Pigment", options: COLOURS },
        { kind: "number", key: "waterLevel", label: "Level", min: -50, max: 400, step: 1, marks: 50, unit: "m" },
        { kind: "number", key: "waves", label: "Waves", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "waveHeight", label: "Height", min: 0, max: 8, step: 0.1, marks: 1, unit: "m" },
        { kind: "number", key: "crossWaves", label: "Cross waves", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "waveLength", label: "Length", min: 2, max: 60, step: 1, marks: 10, unit: "m" },
        { kind: "number", key: "waveDirection", label: "Direction", min: -180, max: 180, step: 1, marks: 45, unit: "°" },
        { kind: "number", key: "waterContrast", label: "Contrast", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "waveSpeed", label: "Speed", min: 0, max: 3, step: 0.1, marks: 0.5, unit: "×" },
        { kind: "number", key: "viscosity", label: "Viscosity", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "waterReach", label: "Reach", min: 1.25, max: 5, step: 0.25, marks: 0.75, unit: "×" },
      ],
    },
    {
      title: "Water threads",
      note: () => "Fine pastel contours follow the swells. Density counts the threads across one wavelength; Amount 0 leaves the water smooth.",
      controls: [
        { kind: "colour", key: "threadColour", label: "Colour", options: COLOURS },
        { kind: "number", key: "waterThreads", label: "Amount", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "threadDensity", label: "Density", min: 8, max: 120, step: 1, marks: 20 },
        { kind: "number", key: "threadWidth", label: "Width", min: 0.03, max: 0.5, step: 0.01, marks: 0.1 },
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
        `${config.blocks.length} ${config.blocks.length === 1 ? "block" : "blocks"}, each ${BLOCK.width} × ${BLOCK.length} × ${BLOCK.height} m. Click the world to ${
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
        // A level is a block's height (1 m): as many as the largest sphere holds, below the start's floor and above it.
        { kind: "number", key: "level", label: "Level", min: -200, max: 199, step: 1, marks: 50 },
      ],
    },
  ],
  // What has been built is sent back with the settings: every block, as [column, row, level].
  copy: (config) => [`Blocks (${config.blocks.length}): ${JSON.stringify(config.blocks)}`],
};
