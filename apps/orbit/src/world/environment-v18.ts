import { COLOURS } from "./colours";
import type { Jig } from "./jig";
import { PLANE_SIZE } from "./orbit";

/** Environment v18: the open square's atmosphere and cardinal directions (World.md W23), and nothing built: its blocks
 * are gone (his, asked whether the environment's 10 m blocks stay: "remove it"); what is built is the sector's
 * (`sector.ts`, W24). Versions 1–17 and their builders are frozen alongside this version; these starting values are
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
  /** Coverage of the continuous sky layer; no placed cloud count. */
  cloudCoverage: number;
  cloudHeight: number;
  /** Cloud shape: billow scale in metres, layer thickness, wind stretch and fixed seed. */
  cloudSize: number;
  cloudTallness: number;
  cloudStretch: number;
  cloudFlow: number;
  cloudSpeed: number;
  cloudViscosity: number;
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
  /** W31: feathered gas margins, tapered trails, broad pigment and distance contrast. */
  cloudEdgeWidth: number;
  cloudWisps: number;
  cloudPigmentScale: number;
  cloudDistanceSoftness: number;
  /** Samples through the continuous gas layer; no cloud images are used. */
  cloudDetail: number;
  /** The fog: its colour, and where it starts and where it is whole, in metres from the camera. */
  fog: string;
  fogFrom: number;
  fogTo: number;
};

/** W31: a continuous, bounded-cost cloud layer with scattered light and flowing erosion.
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
  cloudCoverage: 0.65,
  cloudHeight: 140,
  cloudSize: 120,
  cloudTallness: 0.7,
  cloudStretch: 2.4,
  cloudFlow: 0.65,
  cloudSpeed: 0.45,
  cloudViscosity: 0.65,
  cloudSeed: 7,
  cloudLight: "#fff0d5",
  cloudShadow: "#90a590",
  cloudWarmth: 0.5,
  cloudShade: 0.6,
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
  cloudDetail: 48,
  fog: "#ffdfbd",
  fogFrom: 180,
  fogTo: 1500,
};

export const ENVIRONMENT_JIG: Jig<EnvironmentConfig> = {
  name: "Environment",
  version: 18,
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
  copy: (config) => [`Square: ${PLANE_SIZE} × ${PLANE_SIZE} m, no ground plane; North −Z, East +X, South +Z, West −X`, `Settings JSON: ${JSON.stringify(config)}`],
};
