import { COLOURS } from "./colours";
import type { Jig } from "./jig";
import { PLANE_SIZE } from "./orbit";

/** Environment v12: the open square's atmosphere and cardinal directions (World.md W23), and nothing built: its blocks
 * are gone (his, asked whether the environment's 10 m blocks stay: "remove it"); what is built is the sector's
 * (`sector.ts`, W24). Versions 1–11 and their builders are frozen alongside this version; these starting values are
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
  /** Powdered volume: extinction, density erosion, diffuse scattering and second pastel pigment. */
  cloudDensity: number;
  cloudErosion: number;
  cloudPowder: number;
  cloudPigment: string;
  cloudBlend: number;
  cloudDetail: number;
  /** The fog: its colour, and where it starts and where it is whole, in metres from the camera. */
  fog: string;
  fogFrom: number;
  fogTo: number;
};

/** First real-time interpretation of 05: powder blue, blush/cream cloud banks, sage shade and a powdery ground plane.
 * The colours, volume and motion are his to tune and send back through Copy.
 */
export const ENVIRONMENT_START: EnvironmentConfig = {
  motion: "flowing",
  horizon: "#ffdfbd",
  sunlight: "#ffdfbd",
  shadow: "#8b82b3",
  warmth: 0.45,
  sunHeight: 24,
  sunTurn: -30,
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
  clouds: "#e6a3ad",
  cloudCount: 24,
  cloudHeight: 70,
  cloudSize: 60,
  cloudTallness: 1.1,
  cloudStretch: 1.6,
  cloudFlow: 0.8,
  cloudSpeed: 0.7,
  cloudViscosity: 0.65,
  cloudSpread: 3.4,
  cloudScatter: 0.65,
  cloudSeed: 7,
  cloudLight: "#f7f1f2",
  cloudShadow: "#b6c5b4",
  cloudWarmth: 0.35,
  cloudShade: 0.8,
  cloudSoftness: 0.55,
  cloudGrain: 0.14,
  cloudDensity: 1.3,
  cloudErosion: 0.45,
  cloudPowder: 0.5,
  cloudPigment: "#f7f1f2",
  cloudBlend: 0.75,
  cloudDetail: 32,
  fog: "#ffdfbd",
  fogFrom: 180,
  fogTo: 1500,
};

export const ENVIRONMENT_JIG: Jig<EnvironmentConfig> = {
  name: "Environment",
  version: 12,
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
      note: () => "Powdered banks with real depth, drifting and folding in the wind. Viscosity resists small folds; Speed 0 holds the clouds still.",
      controls: [
        { kind: "number", key: "cloudCount", label: "Count", min: 0, max: 60, step: 1, marks: 10 },
        { kind: "number", key: "cloudHeight", label: "Above", min: 10, max: 300, step: 5, marks: 50, unit: "m" },
        { kind: "number", key: "cloudSize", label: "Width", min: 20, max: 120, step: 5, marks: 20, unit: "m" },
        { kind: "number", key: "cloudTallness", label: "Height", min: 0.15, max: 1.5, step: 0.05, marks: 0.25, unit: "×" },
        { kind: "number", key: "cloudStretch", label: "Stretch", min: 1, max: 6, step: 0.1, marks: 1, unit: "×" },
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
      note: () => "Density thickens the gas. Erosion breaks up its edge; Softness dissolves it. Detail trades smooth volume sampling against drawing cost.",
      controls: [
        { kind: "number", key: "cloudDensity", label: "Density", min: 0.2, max: 3, step: 0.1, marks: 0.5 },
        { kind: "number", key: "cloudErosion", label: "Erosion", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudPowder", label: "Powder", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudSoftness", label: "Softness", min: 0.05, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "cloudGrain", label: "Grain", min: 0, max: 0.5, step: 0.01, marks: 0.1 },
        { kind: "number", key: "cloudDetail", label: "Detail", min: 16, max: 64, step: 8, marks: 16 },
      ],
    },
    {
      title: "Cloud colour",
      controls: [
        { kind: "colour", key: "clouds", label: "Colour", options: COLOURS },
        { kind: "colour", key: "cloudPigment", label: "Pigment", options: COLOURS },
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
