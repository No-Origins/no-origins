import { CAMERA_JIG, CAMERA_START, type CameraConfig } from "./camera";
import { CLOUDS_JIG, CLOUDS_START, type CloudsConfig } from "./clouds";
import { COLOURS } from "./colours";
import { configOf, type Jig } from "./jig";
import { MAP_JIG, MAP_START, type MapConfig } from "./map";
import { WORLD_SIZE } from "./orbit";

/**
 * Environment v36: the open square's atmosphere and cardinal directions (World.md W23), a page a group under the
 * sidebar's Environment (W73; his: "under environment, we should have clouds, camera, map, and base clouds, light and
 * texture, fog, individually to configure", and a Sky page of their own): Sky (with the Motion that pauses every clock),
 * Base clouds, Light and texture and Fog, each page a slice of this one jig and its one store (`environmentPage`),
 * so the pages tune one atmosphere. What stands in the world, and where, is the World page's now (W73): version 34's
 * placement, the ring's places and the grove, is frozen beside this (`environment-v34.ts`). The clouds are the
 * world's ceiling (W33), tuned on their own page (W38). Version 36 turns things on and off by a switch (W76; his: "give
 * me option to enable or disable something just by using toggle"): Motion, and each part, the sky's colour flow, the
 * base clouds and the fog, which drawn off are as if their amount were nothing (`drawnOf`). Versions 1 to 35 and their
 * builders are frozen alongside this version; these starting values are his to tune.
 */
export type EnvironmentConfig = {
  /** All atmosphere clocks run while on; off, they pause together, retaining their current moment. */
  motion: boolean;
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
  /** Pastel gas: shown or not, second pigment, amount, billow scale, wind-driven speed/direction, viscosity and turbulence. */
  skyFlowShown: boolean;
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
  baseCloudsShown: boolean;
  baseCloudDensity: number;
  baseCloudCoverage: number;
  baseCloudHeight: number;
  baseCloudVariation: number;
  baseCloudThickness: number;
  baseCloudScale: number;
  baseCloudSpeed: number;
  baseCloudWind: number;
  /** The fog: shown or not, its colour, and where it starts and where it is whole, in metres from the camera. */
  fogShown: boolean;
  fog: string;
  fogFrom: number;
  fogTo: number;
};

/**
 * The atmosphere's settings: what the sky, the base gas and the cloud light are built from, this version's as drawn
 * (`drawnOf`, the switches already in its numbers), or a frozen version's that carried placement too, or Motion as a
 * word; so neither Motion nor a switch is read here.
 */
export type AtmosphereSettings = Omit<EnvironmentConfig, "motion" | "skyFlowShown" | "baseCloudsShown" | "fogShown">;

/** The sky, light and fog as they start; his to tune and send back through Copy. */
export const ENVIRONMENT_START: EnvironmentConfig = {
  motion: true,
  horizon: "#ffdfbd",
  sunlight: "#ffdfbd",
  shadow: "#8b82b3",
  warmth: 0.45,
  sunHeight: 35,
  sunTurn: -90,
  shade: 0.45,
  sky: "#bbcedc",
  skyFlowShown: true,
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
  baseCloudsShown: true,
  baseCloudDensity: 0.65,
  baseCloudCoverage: 0.65,
  baseCloudHeight: 0,
  baseCloudVariation: 50,
  baseCloudThickness: 85,
  baseCloudScale: 130,
  baseCloudSpeed: 0.6,
  baseCloudWind: 45,
  fogShown: true,
  fog: "#ffdfbd",
  fogFrom: 180,
  fogTo: 1500,
};

export const ENVIRONMENT_JIG: Jig<EnvironmentConfig> = {
  name: "Environment",
  version: 36,
  start: ENVIRONMENT_START,
  groups: [
    {
      title: "Motion",
      note: () => `A round ${WORLD_SIZE.diameter} m across, open, its ceiling the clouds' underside ${WORLD_SIZE.height} m up. Every clock of the atmosphere, the sky's, the ceiling's and the base clouds', runs while Motion is on and pauses together when it is off. WASD or arrows to travel; drag to look around, right-drag to pan. Click the map for longer journeys.`,
      controls: [
        { kind: "switch", key: "motion", label: "Motion", heads: true },
      ],
    },
    {
      title: "Base clouds",
      note: () => "White gas around the mountains; off, none is drawn. Density sets how opaque it is; Coverage opens gaps. Height is the bank centre relative to the world floor; Height variation spreads banks above and below it. Speed and Wind move these clouds independently of the ceiling.",
      controls: [
        { kind: "switch", key: "baseCloudsShown", label: "Base clouds shown", heads: true },
        { kind: "number", key: "baseCloudDensity", label: "Density", min: 0, max: 2, step: 0.05, marks: 0.5 },
        { kind: "number", key: "baseCloudCoverage", label: "Coverage", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "baseCloudHeight", label: "Height", min: 0, max: 180, step: 1, marks: 30, unit: "m" },
        { kind: "number", key: "baseCloudVariation", label: "Height variation", min: 0, max: 100, step: 1, marks: 25, unit: "m" },
        { kind: "number", key: "baseCloudThickness", label: "Thickness", min: 20, max: 160, step: 1, marks: 20, unit: "m" },
        { kind: "number", key: "baseCloudScale", label: "Scale", min: 40, max: 300, step: 1, marks: 50, unit: "m" },
        { kind: "number", key: "baseCloudSpeed", label: "Speed", min: 0, max: 3, step: 0.1, marks: 0.5, unit: "×" },
        { kind: "number", key: "baseCloudWind", label: "Wind", min: -180, max: 180, step: 1, marks: 45, unit: "°" },
      ],
    },
    {
      title: "Light and texture",
      note: () => "Sun height and turn light the mountains and cloud walls. Shade softens the sky fill; Warmth colours the sunlight. Tune ground texture under Elements › Sector.",
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
      note: () => "An open pastel sky behind the clouds.",
      controls: [
        { kind: "colour", key: "sky", label: "Colour", options: COLOURS },
      ],
    },
    {
      // W76: the sky's own switch is its colour flow's, so the flow is a group of its own with the switch on its header.
      title: "Colour flow",
      note: () => "A pastel wash flowing over the sky; off, the sky is its colour alone. Pigment is the wash's colour and Flow how much of it; Wind directs the flow.",
      controls: [
        { kind: "switch", key: "skyFlowShown", label: "Colour flow shown", heads: true },
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
      note: () => "The fog paints the blocks and the portals, never a mountain; off, nothing is fogged.",
      controls: [
        { kind: "switch", key: "fogShown", label: "Fog shown", heads: true },
        { kind: "colour", key: "fog", label: "Colour", options: COLOURS },
        { kind: "number", key: "fogFrom", to: "fogTo", label: "Distance", min: 0, max: 3000, step: 10, marks: 500, unit: "m" },
      ],
    },
  ],
  copy: (config) => [`World: a cylinder ${WORLD_SIZE.diameter} m across, ${WORLD_SIZE.height} m high, the clouds its ceiling, no ground plane; North −Z, East +X, South +Z, West −X`, `Settings JSON: ${JSON.stringify(config)}`],
};

/** The Environment's pages (W73), each the groups of the one jig it shows, by its route. */
export const ENVIRONMENT_PAGES = {
  sky: { name: "Sky", groups: ["Motion", "Sky", "Colour flow"] },
  "base-clouds": { name: "Base clouds", groups: ["Base clouds"] },
  light: { name: "Light and texture", groups: ["Light and texture"] },
  fog: { name: "Fog", groups: ["Fog"] },
} as const;

/** One page's jig: the environment's, named for the page, with that page's groups alone; Copy sends those groups. */
export function environmentPage(page: keyof typeof ENVIRONMENT_PAGES): Jig<EnvironmentConfig> {
  const { name, groups } = ENVIRONMENT_PAGES[page];
  return { ...ENVIRONMENT_JIG, name, groups: ENVIRONMENT_JIG.groups.filter((group) => (groups as readonly string[]).includes(group.title)), copy: (config) => [`Settings JSON: ${JSON.stringify(Object.fromEntries(ENVIRONMENT_JIG.groups.filter((group) => (groups as readonly string[]).includes(group.title)).flatMap((group) => group.controls.flatMap((c) => (c.kind === "number" && c.to ? [c.key, c.to] : [c.key]))).map((key) => [key, config[key as keyof EnvironmentConfig]])))}`] };
}

/** The keys a page's groups tune: what its Reset puts back. */
export function environmentKeys(page: keyof typeof ENVIRONMENT_PAGES): (keyof EnvironmentConfig)[] {
  const { groups } = ENVIRONMENT_PAGES[page];
  return ENVIRONMENT_JIG.groups.filter((group) => (groups as readonly string[]).includes(group.title)).flatMap((group) => group.controls.flatMap((c) => (c.kind === "number" && c.to ? [c.key, c.to] : [c.key]))) as (keyof EnvironmentConfig)[];
}

/** Where fog that is off starts: beyond anything the camera sees (its far plane is 20 km). */
const NO_FOG = 1_000_000;
const drawn = new WeakMap<EnvironmentConfig, EnvironmentConfig>();

/**
 * The atmosphere as the world draws it (W76): a part switched off is drawn as if its amount were nothing, the sky's
 * colour flow and the base clouds' density nothing, the fog starting beyond the far plane, so every builder reads one
 * set of numbers and nothing is remade for a switch. The same settings give the same object.
 */
export function drawnOf(config: EnvironmentConfig): EnvironmentConfig {
  let held = drawn.get(config);
  if (!held) {
    held = {
      ...config,
      skyFlow: config.skyFlowShown ? config.skyFlow : 0,
      baseCloudDensity: config.baseCloudsShown ? config.baseCloudDensity : 0,
      fogFrom: config.fogShown ? config.fogFrom : NO_FOG,
      fogTo: config.fogShown ? config.fogTo : NO_FOG,
    };
    drawn.set(config, held);
  }
  return held;
}

/**
 * The Environment as one item in the database (World.md W75; his: "we don't need names in environment. We need versions
 * to keep publishing"): what every page under the sidebar's Environment tunes, kept together, unnamed and without
 * variants, its draft saved and its versions published as the world's are: this jig's atmosphere, the ceiling clouds
 * (`clouds.ts`), the visitor's camera (`camera.ts`) and the map (`map.ts`).
 */
export type EnvironmentData = { atmosphere: EnvironmentConfig; clouds: CloudsConfig; camera: CameraConfig; map: MapConfig };

/** The environment as kept, each part read against its jig (`configOf`); a part missing is its jig's start, and a value not an object null. */
export function environmentOf(saved: unknown): EnvironmentData | null {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return null;
  const { atmosphere, clouds, camera, map } = saved as Record<string, unknown>;
  return {
    atmosphere: configOf(ENVIRONMENT_JIG, atmosphere) ?? ENVIRONMENT_START,
    clouds: configOf(CLOUDS_JIG, clouds) ?? CLOUDS_START,
    camera: configOf(CAMERA_JIG, camera) ?? CAMERA_START,
    map: configOf(MAP_JIG, map) ?? MAP_START,
  };
}
