import { COLOURS } from "./colours";
import type { Jig } from "./jig";
import { WORLD_SIZE } from "./orbit";

/** Environment v24: the open square's atmosphere and cardinal directions (World.md W23), and nothing built: its blocks
 * are gone (his, asked whether the environment's 10 m blocks stay: "remove it"); what is built is the sector's
 * (`sector.ts`, W24). The clouds are the world's ceiling (W33), art with no settings here (his, W32: "I don't need any
 * controls for clouds"); their values are `build-clouds.ts`'s. Versions 1–23 and their builders are frozen alongside
 * this version; these starting values are his to tune.
 */
export type EnvironmentConfig = {
  /** All atmosphere clocks pause together, retaining their current moment. */
  motion: string;
  /** Atmosphere: warm horizon, sunlight's direction and tint, and cool shadows. */
  horizon: string;
  sunlight: string;
  shadow: string;
  warmth: number;
  sunHeight: number;
  sunTurn: number;
  shade: number;
  /** The open sky colour, overhead; the clouds are under it, at the world's ceiling. */
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
  /** The clouds' clock, internal art with no controls (W32): it runs while Flow is above 0, at Speed times real time. */
  cloudFlow: number;
  cloudSpeed: number;
  /** Lower cloud gas, independent of the ceiling: W38. Height is the mean bank centre, in world metres. */
  baseCloudDensity: number;
  baseCloudCoverage: number;
  baseCloudHeight: number;
  baseCloudVariation: number;
  baseCloudThickness: number;
  baseCloudScale: number;
  baseCloudSpeed: number;
  baseCloudWind: number;
  /** Mountains: smooth by default, one violet/white material and seeded spacious placement (W41). */
  mountainRoughness: number;
  mountainCount: number;
  mountainSpacing: number;
  mountainSeed: number;
  /** The fog: its colour, and where it starts and where it is whole, in metres from the camera. */
  fog: string;
  fogFrom: number;
  fogTo: number;
};

/** The sky, light and fog as they start; his to tune and send back through Copy. */
export const ENVIRONMENT_START: EnvironmentConfig = {
  motion: "flowing",
  horizon: "#ffdfbd",
  sunlight: "#ffdfbd",
  shadow: "#8b82b3",
  warmth: 0.45,
  sunHeight: 35,
  sunTurn: -90,
  shade: 0.45,
  sky: "#bbcedc",
  skyPigment: "#e6a3ad",
  skyFlow: 0,
  skyScale: 3,
  skySpeed: 0.5,
  skyWind: 45,
  skyViscosity: 0.8,
  skyTurbulence: 0.55,
  skySoftness: 0.75,
  cloudFlow: 0.65,
  cloudSpeed: 0.45,
  baseCloudDensity: 0.65,
  baseCloudCoverage: 0.65,
  baseCloudHeight: -45,
  baseCloudVariation: 50,
  baseCloudThickness: 85,
  baseCloudScale: 130,
  baseCloudSpeed: 0.6,
  baseCloudWind: 45,
  mountainRoughness: 0,
  mountainCount: 8,
  mountainSpacing: 150,
  mountainSeed: 17,
  fog: "#ffdfbd",
  fogFrom: 180,
  fogTo: 1500,
};

export const ENVIRONMENT_JIG: Jig<EnvironmentConfig> = {
  name: "Environment",
  version: 24,
  start: ENVIRONMENT_START,
  groups: [
    {
      title: "The Orbit",
      note: () => `A round ${WORLD_SIZE.diameter} m across, open, its ceiling the clouds' underside ${WORLD_SIZE.height} m up: White fog flows around spaced violet mountains with white tips. What is built stands above them, under Elements › Sector. WASD or arrows to travel; drag to look around, right-drag to pan. Click the map for longer journeys.`,
      controls: [
        { kind: "choice", key: "motion", label: "Motion", options: [{ value: "flowing", label: "Flowing" }, { value: "paused", label: "Paused" }] },
      ],
    },
    {
      title: "Mountains",
      note: () => "One violet pastel texture with white tips. Roughness adds erosion; zero keeps tips plain. Spacing is the clear gap between mountain bases. Randomize changes the layout; the seed keeps it repeatable. Large counts and gaps extend the scenery outward.",
      controls: [
        { kind: "number", key: "mountainRoughness", label: "Roughness", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "mountainCount", label: "Count", min: 0, max: 18, step: 1, marks: 3 },
        { kind: "number", key: "mountainSpacing", label: "Spacing", min: 0, max: 300, step: 10, marks: 50, unit: "m" },
        { kind: "number", key: "mountainSeed", label: "Layout seed", min: 0, max: 9999, step: 1, marks: 1000 },
      ],
    },
    {
      title: "Base clouds",
      note: () => "White gas around the mountains. Density sets how opaque it is; Coverage opens gaps. Height is the bank centre relative to the world floor; Height variation spreads banks above and below it. Speed and Wind move these clouds independently of the ceiling.",
      controls: [
        { kind: "number", key: "baseCloudDensity", label: "Density", min: 0, max: 2, step: 0.05, marks: 0.5 },
        { kind: "number", key: "baseCloudCoverage", label: "Coverage", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "baseCloudHeight", label: "Height", min: -120, max: 60, step: 1, marks: 30, unit: "m" },
        { kind: "number", key: "baseCloudVariation", label: "Height variation", min: 0, max: 100, step: 1, marks: 25, unit: "m" },
        { kind: "number", key: "baseCloudThickness", label: "Thickness", min: 20, max: 160, step: 1, marks: 20, unit: "m" },
        { kind: "number", key: "baseCloudScale", label: "Scale", min: 40, max: 300, step: 1, marks: 50, unit: "m" },
        { kind: "number", key: "baseCloudSpeed", label: "Speed", min: 0, max: 3, step: 0.1, marks: 0.5, unit: "×" },
        { kind: "number", key: "baseCloudWind", label: "Wind", min: -180, max: 180, step: 1, marks: 45, unit: "°" },
      ],
    },
    {
      title: "Light and texture",
      note: () => "Peach light and lavender shade on everything built. Tune the sector's ground texture under Elements › Sector.",
      controls: [
        { kind: "colour", key: "horizon", label: "Horizon", options: COLOURS },
        { kind: "colour", key: "sunlight", label: "Sunlight", options: COLOURS },
        { kind: "colour", key: "shadow", label: "Shadow", options: COLOURS },
        { kind: "number", key: "warmth", label: "Warmth", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "sunHeight", label: "Sun height", min: 0, max: 90, step: 1, marks: 15, unit: "°" },
        { kind: "number", key: "sunTurn", label: "Sun turn", min: -180, max: 180, step: 1, marks: 45, unit: "°" },
        { kind: "number", key: "shade", label: "Shade", min: 0, max: 1, step: 0.05, marks: 0.25 },
      ],
    },
    {
      title: "Sky",
      note: () => "An open pastel sky behind the clouds. Flow adds a subtle colour wash; Wind directs the flow.",
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
      title: "Fog",
      controls: [
        { kind: "colour", key: "fog", label: "Colour", options: COLOURS },
        { kind: "number", key: "fogFrom", to: "fogTo", label: "Distance", min: 0, max: 3000, step: 10, marks: 500, unit: "m" },
      ],
    },
  ],
  copy: (config) => [`World: a cylinder ${WORLD_SIZE.diameter} m across, ${WORLD_SIZE.height} m high, the clouds its ceiling, no ground plane; North −Z, East +X, South +Z, West −X`, `Settings JSON: ${JSON.stringify(config)}`],
};
