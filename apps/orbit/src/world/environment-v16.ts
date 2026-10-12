import { COLOURS } from "./colours";
import type { Jig } from "./jig";
import { PLANE_SIZE } from "./orbit";

/** Environment v16: the open square's atmosphere and cardinal directions (World.md W23), and nothing built: its blocks
 * are gone (his, asked whether the environment's 10 m blocks stay: "remove it"); what is built is the sector's
 * (`sector.ts`, W24). Versions 1–15 and their builders are frozen alongside this version; these starting values are
 * his to tune.
 */
export type EnvironmentConfig = {
  /** All atmosphere clocks pause together, retaining their current moment. */
  motion: string;
  /** Atmosphere: warm horizon, sunlight's direction and tint, cool shadows, and surface grain in world metres. */
  horizon: string;
  sunlight: string;
  shadow: string;
  warmth: number;
  sunHeight: number;
  sunTurn: number;
  shade: number;
  /** How fine the clouds' grain is, in metres (`cloudGrain` is how much). */
  grainSize: number;
  /** The open sky colour. Clouds stand above the plane. */
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
  /** Cloud shape: width in metres, height relative to width, wind stretch, distribution and fixed seed. */
  cloudSize: number;
  cloudTallness: number;
  cloudStretch: number;
  cloudFlow: number;
  cloudSpeed: number;
  cloudViscosity: number;
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
  /** Volumetric extinction, broken margins, scattered fill and the second pastel pigment. */
  cloudDensity: number;
  cloudErosion: number;
  cloudPowder: number;
  cloudPigment: string;
  cloudBlend: number;
  /** W30: feathered gas margins, tapered trails, broad pigment and distance contrast. */
  cloudEdgeWidth: number;
  cloudWisps: number;
  cloudPigmentScale: number;
  cloudDistanceSoftness: number;
  /** Samples along each local gas volume; no cloud images are used. */
  cloudDetail: number;
  /** The fog: its colour, and where it starts and where it is whole, in metres from the camera. */
  fog: string;
  fogFrom: number;
  fogTo: number;
};

/** W30: a sculpted density bank, scattered light and flowing erosion, following Integrated powder.
 * The colours, layering and motion are his to tune and send back through Copy.
 */
export const ENVIRONMENT_START: EnvironmentConfig = {
  motion: "flowing",
  horizon: "#ffdfbd",
  sunlight: "#ffdfbd",
  shadow: "#8b82b3",
  warmth: 0.45,
  sunHeight: 35,
  sunTurn: -90,
  shade: 0.45,
  grainSize: 0.06,
  sky: "#bbcedc",
  skyPigment: "#e6a3ad",
  skyFlow: 0,
  skyScale: 3,
  skySpeed: 0.5,
  skyWind: 45,
  skyViscosity: 0.8,
  skyTurbulence: 0.55,
  skySoftness: 0.75,
  clouds: "#fff0d5",
  cloudCount: 1,
  cloudHeight: 25,
  cloudSize: 120,
  cloudTallness: 0.7,
  cloudStretch: 2.4,
  cloudFlow: 0.65,
  cloudSpeed: 0.45,
  cloudViscosity: 0.65,
  cloudSpread: 1.3,
  cloudScatter: 0.35,
  cloudSeed: 7,
  cloudLight: "#fff0d5",
  cloudShadow: "#90a590",
  cloudWarmth: 0.5,
  cloudShade: 0.95,
  cloudSoftness: 0.55,
  cloudGrain: 0.03,
  cloudDensity: 1.2,
  cloudErosion: 0.5,
  cloudPowder: 0.65,
  cloudPigment: "#f6b9c9",
  cloudBlend: 1,
  cloudEdgeWidth: 0.6,
  cloudWisps: 0.7,
  cloudPigmentScale: 120,
  cloudDistanceSoftness: 0.25,
  cloudDetail: 80,
  fog: "#ffdfbd",
  fogFrom: 180,
  fogTo: 1500,
};

export const ENVIRONMENT_JIG: Jig<EnvironmentConfig> = {
  name: "Environment",
  version: 16,
  start: ENVIRONMENT_START,
  groups: [
    {
      title: "The Orbit",
      note: () => `A ${PLANE_SIZE} × ${PLANE_SIZE} m square, open: no ground plane; what stands in it is the sector's, under Elements › Sector. WASD or arrows to travel; drag to look around, right-drag to pan. Click the map for longer journeys.`,
      controls: [
        { kind: "choice", key: "motion", label: "Motion", options: [{ value: "flowing", label: "Flowing" }, { value: "paused", label: "Paused" }] },
      ],
    },
    {
      title: "Light and texture",
      note: () => "Peach light and lavender shade on everything built. Grain size is how fine the clouds' grain is; the sector's blocks have their own (Elements › Sector).",
      controls: [
        { kind: "colour", key: "horizon", label: "Horizon", options: COLOURS },
        { kind: "colour", key: "sunlight", label: "Sunlight", options: COLOURS },
        { kind: "colour", key: "shadow", label: "Shadow", options: COLOURS },
        { kind: "number", key: "warmth", label: "Warmth", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "sunHeight", label: "Sun height", min: 0, max: 90, step: 1, marks: 15, unit: "°" },
        { kind: "number", key: "sunTurn", label: "Sun turn", min: -180, max: 180, step: 1, marks: 45, unit: "°" },
        { kind: "number", key: "shade", label: "Shade", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "grainSize", label: "Grain size", min: 0.02, max: 0.3, step: 0.01, marks: 0.07, unit: "m" },
      ],
    },
    {
      title: "Sky",
      note: () => "An open pastel sky behind the clouds. Flow adds a subtle colour wash; Wind also directs the cloud banks.",
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
      note: () => "Flowing cream billows with blush pigment, sage recesses and dissolving gas edges, following Integrated powder. One bank starts this spatial review. Viscosity slows the flow; Speed 0 holds the clouds still.",
      controls: [
        { kind: "number", key: "cloudCount", label: "Count", min: 0, max: 60, step: 1, marks: 10 },
        { kind: "number", key: "cloudHeight", label: "Above", min: 10, max: 300, step: 5, marks: 50, unit: "m" },
        { kind: "number", key: "cloudSize", label: "Width", min: 20, max: 120, step: 5, marks: 20, unit: "m" },
        { kind: "number", key: "cloudTallness", label: "Height", min: 0.15, max: 1.5, step: 0.05, marks: 0.25, unit: "×" },
        { kind: "number", key: "cloudStretch", label: "Stretch", min: 1, max: 6, step: 0.1, marks: 1, unit: "×" },
        { kind: "number", key: "cloudWisps", label: "Wisps", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudFlow", label: "Flow", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudSpeed", label: "Speed", min: 0, max: 3, step: 0.1, marks: 0.5, unit: "×" },
        { kind: "number", key: "cloudViscosity", label: "Viscosity", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudSpread", label: "Spread", min: 1, max: 5, step: 0.1, marks: 1, unit: "×" },
        { kind: "number", key: "cloudScatter", label: "Scatter", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudSeed", label: "Seed", min: 0, max: 999, step: 1, marks: 100 },
      ],
    },
    {
      title: "Cloud texture",
      note: () => "Density holds the core; Edge width feathers its margins. Erosion acts mainly at the edge. Softness spreads the light; fine Grain stays quiet. Colour and light travel through the volume.",
      controls: [
        { kind: "number", key: "cloudDensity", label: "Density", min: 0.2, max: 3, step: 0.1, marks: 0.5 },
        { kind: "number", key: "cloudEdgeWidth", label: "Edge width", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudErosion", label: "Erosion", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudPowder", label: "Powder", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudSoftness", label: "Softness", min: 0.05, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudGrain", label: "Grain", min: 0, max: 0.5, step: 0.01, marks: 0.1 },
        { kind: "number", key: "cloudDetail", label: "Detail", min: 24, max: 96, step: 8, marks: 24 },
      ],
    },
    {
      title: "Cloud colour",
      controls: [
        { kind: "colour", key: "clouds", label: "Colour", options: COLOURS },
        { kind: "colour", key: "cloudPigment", label: "Pigment", options: COLOURS },
        { kind: "number", key: "cloudPigmentScale", label: "Pigment scale", min: 40, max: 300, step: 10, marks: 50, unit: "m" },
        { kind: "number", key: "cloudDistanceSoftness", label: "Distance softness", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudBlend", label: "Blend", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "colour", key: "cloudLight", label: "Light", options: COLOURS },
        { kind: "colour", key: "cloudShadow", label: "Shadow", options: COLOURS },
        { kind: "number", key: "cloudWarmth", label: "Warmth", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudShade", label: "Shade", min: 0, max: 1, step: 0.05, marks: 0.25 },
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
  copy: (config) => [`Square: ${PLANE_SIZE} × ${PLANE_SIZE} m, no ground plane; North −Z, East +X, South +Z, West −X`, `Settings JSON: ${JSON.stringify(config)}`],
};
