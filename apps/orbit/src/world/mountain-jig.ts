import { paletteWith } from "./colours";
import { configOf, type Jig } from "./jig";
import { algaeCrest } from "./mountain-profile";
import type { Mountain } from "./mountains";
import { PUBLISHED_MOUNTAINS } from "./published";
import { reachOf } from "./strength";
import type { Variant } from "./variants";

/**
 * World.md W52: individual shape and surface tuning, separate from the seeded scenery layout. The neck light's Strength
 * is kept as `lightPower`, its reach following from it (W90: `reachOf`); version 13, with Brightness and Reach, is frozen
 * (`mountain-jig-v13.ts` and its builders).
 */
export type MountainConfig = {
  height: number; diameter: number; taper: number;
  neckTilt: number; headHeight: number; headDepthMetres: number; lean: number;
  neckLength: number; neckDiameter: number;
  lightState: string; lightColour: string; lightPower: number; lightSize: number;
  algaePastel: number; algaeEdge: number; algaeVariation: number; algaeSeed: number; algaeReach: number;
  stone: string; mossColour: string; cap: string; overhang: number; glassTint: string; glassClarity: number; glassRoughness: number; glassIor: number; glassThickness: number; stoneTexture: string; stoneRoughness: number; stoneScale: number; stoneDetail: number; algaeThickness: number; algaeScale: number;
};
export const MOUNTAIN_VERSION = 14;
/**
 * His mountains (World.md W71, W72, W73; his, 2026-10-14: "whatever I have configured in inspect for the mountains …
 * make all of them default", then "everything I can have as a variant"): the published copy (`published.ts`), his six
 * variants of the mountain as his Copy sent them on 2026-10-14, named for the places he tuned them at, and the seventh
 * and eighth as the ring's layout derived them; the start world places all eight where the ring stood. The first is
 * what the mountain's page starts from.
 */
export const MOUNTAIN_VARIANTS: readonly Variant<MountainConfig>[] = PUBLISHED_MOUNTAINS;
/** What the mountain's page starts from: his first variant. */
export const MOUNTAIN_START: MountainConfig = MOUNTAIN_VARIANTS[0].settings;
/** The mountain a variant makes (W72, W73), for the builders that shape it: one of its height, at the ring's usual radius, its algae's pattern its own; where it stands is the asset's. */
export const mountainOf = (config: MountainConfig): Mountain => ({ kind: "alpine", x: 0, z: 0, top: config.height, radius: 30, seed: config.algaeSeed });
export const mountainStart = (m: Pick<Mountain, "top" | "radius" | "seed">): MountainConfig => ({
  height: m.top, diameter: m.top * 106 / 547.5, taper: 738 / 106 - 1,
  neckTilt: Math.atan(61 / 106) * 180 / Math.PI, headHeight: m.top * 173 / 547.5, headDepthMetres: m.top * 110 / 547.5, lean: Math.atan(60 / 547.5) * 180 / Math.PI,
  neckLength: m.top * 21.5 / 547.5, neckDiameter: 1.5,
  lightState: "on", lightColour: "#ffe1a6", lightPower: 150, lightSize: 2,
  // W70: Reach starts at the crest version 13's seeded coverage drew for this pattern, so nothing moves until he moves it.
  algaePastel: 0.65, algaeEdge: 0.7, algaeVariation: 1, algaeSeed: m.seed, algaeReach: algaeCrest(m.seed, 1),
  stone: "#827e77", mossColour: "#526137", cap: "clear", overhang: 0, glassTint: "#ffffff", glassClarity: 0.98, glassRoughness: 0.04, glassIor: 1.5, glassThickness: 4, stoneTexture: "granite", stoneRoughness: 0.95, stoneScale: 1, stoneDetail: 0.5, algaeThickness: 0.5, algaeScale: 1,
});
export const mountainJig = (name: string, start: MountainConfig): Jig<MountainConfig> => ({
  name, version: MOUNTAIN_VERSION, start,
  groups: [
    { title: "Shape", note: () => "Curved shoulders widen from an inclined neck. The bottom is open and cut off at the world floor. Height sizes the body; Diameter sizes the neck; Taper reaches 10. Placed in the world, a mountain faces the world's middle unless it is turned.", controls: [
      { kind: "number", key: "height", label: "Height", min: 30, max: 250, step: 1, marks: 50, unit: "m" },
      { kind: "number", key: "diameter", label: "Diameter", min: 10, max: 50, step: 0.5, marks: 10, unit: "m" },
      { kind: "number", key: "taper", label: "Taper", min: 0, max: 10, step: 0.05, marks: 2 },
      { kind: "number", key: "lean", label: "Lean", min: -45, max: 45, step: 0.5, marks: 15, unit: "°" },
      { kind: "number", key: "neckTilt", label: "Neck tilt", min: 0, max: 55, step: 1, marks: 15, unit: "°" },
    ] },
    { title: "Body", note: () => "Choose the stone texture and colour, then tune its roughness, grain size and detail. Algae has its own surface layer.", controls: [
      { kind: "choice", key: "stoneTexture", label: "Texture", options: [{ value: "granite", label: "Granite" }, { value: "basalt", label: "Basalt" }, { value: "sandstone", label: "Sandstone" }, { value: "smooth", label: "Smooth" }] },
      { kind: "colour", key: "stone", label: "Colour", options: paletteWith({ value: "#827e77", colour: "#827e77", label: "Reference stone" }) },
      { kind: "number", key: "stoneRoughness", label: "Roughness", min: 0, max: 1, step: 0.01, marks: 0.25 },
      { kind: "number", key: "stoneScale", label: "Texture scale", min: 0.1, max: 5, step: 0.1, marks: 1 },
      { kind: "number", key: "stoneDetail", label: "Texture strength", min: 0, max: 1, step: 0.01, marks: 0.25 },
    ] },
    { title: "Algae", note: () => "A raised pastel layer with chalky grain and broken brush edges. Reach is how far up the body it climbs, from the floor (0) to the neck (1); every mountain starts at its own. Pattern seed changes that mountain's contour under it.", controls: [
      { kind: "colour", key: "mossColour", label: "Colour", options: paletteWith({ value: "#526137", colour: "#526137", label: "Reference algae" }) },
      { kind: "number", key: "algaeReach", label: "Reach", min: 0, max: 1, step: 0.01, marks: 0.25 },
      { kind: "number", key: "algaeThickness", label: "Thickness", min: 0.1, max: 2, step: 0.05, marks: 0.5, unit: "m" },
      { kind: "number", key: "algaeScale", label: "Texture scale", min: 0.1, max: 5, step: 0.1, marks: 1 },
      { kind: "number", key: "algaePastel", label: "Pastel", min: 0, max: 1, step: 0.01, marks: 0.25 },
      { kind: "number", key: "algaeEdge", label: "Edge softness", min: 0, max: 1, step: 0.01, marks: 0.25 },
      { kind: "number", key: "algaeVariation", label: "Variation", min: 0, max: 1, step: 0.01, marks: 0.25 },
      { kind: "number", key: "algaeSeed", label: "Pattern seed", min: 0, max: 9999, step: 1, marks: 2000 },
    ] },
    { title: "Neck", note: () => "A thin stem enters both the stone body and glass head. Length raises the head; Diameter sizes the stem.", controls: [
      { kind: "number", key: "neckLength", label: "Length", min: 0.5, max: 20, step: 0.1, marks: 5, unit: "m" },
      { kind: "number", key: "neckDiameter", label: "Diameter", min: 0.2, max: 5, step: 0.1, marks: 1, unit: "m" },
    ] },
    { title: "Neck light", note: (c) => `A bulb at the stem's tip extends into the glass. Strength sets the bulb and its light, which weakens with the square of the distance${c.lightState === "on" && c.lightPower > 0 ? `: this one's reaches about ${Math.round(reachOf(c.lightPower))} m` : ""}.`, controls: [
      { kind: "choice", key: "lightState", label: "Light", options: [{ value: "on", label: "On" }, { value: "off", label: "Off" }] },
      { kind: "colour", key: "lightColour", label: "Colour", options: paletteWith({ value: "#ffe1a6", colour: "#ffe1a6", label: "Warm bulb" }) },
      { kind: "number", key: "lightPower", label: "Strength", min: 0, max: 1000, step: 10, marks: 250 },
      { kind: "number", key: "lightSize", label: "Bulb size", min: 0.25, max: 5, step: 0.05, marks: 1, unit: "m" },
    ] },
    // His (W63): the head's scale reads in fives: a floor of 5 m, a mark every 5 m and every 0.05 of overhang, the
    // held head snapping to them; the value typed beside the label still moves by its step between them.
    { title: "Head", note: () => "The glass head joins the body through the thin neck. Height and Depth are both measured in metres, from 5 to 100, marked every 5. Overhang shapes its width.", controls: [
      { kind: "number", key: "headHeight", label: "Height", min: 5, max: 100, step: 0.5, marks: 5, unit: "m" },
      { kind: "number", key: "headDepthMetres", label: "Depth", min: 5, max: 100, step: 0.5, marks: 5, unit: "m" },
      { kind: "number", key: "overhang", label: "Overhang", min: 0, max: 0.3, step: 0.01, marks: 0.05 },
    ] },
    { title: "Glass", note: (c) => c.cap === "stone" ? "Stone uses Body's colour and texture. Select a glass type to tune tint, transmission and the internal light." : c.cap === "mirror" ? "Mirror is opaque: Tint and Roughness tune its reflected sky. The neck bulb remains visible below; internal light does not pass through the mirror." : "Tint colours the glass; Clarity controls transmission and Refraction bends the view. Roughness softens reflections. The neck light scatters through the glass, most strongly in Frosted.", controls: [
      { kind: "choice", key: "cap", label: "Type", options: [{ value: "clear", label: "Clear" }, { value: "frosted", label: "Frosted" }, { value: "tinted", label: "Tinted" }, { value: "mirror", label: "Mirror" }, { value: "stone", label: "Stone" }] },
      { kind: "colour", key: "glassTint", label: "Tint", options: paletteWith({ value: "#ffffff", colour: "#ffffff", label: "Clear white" }, { value: "#b7d6de", colour: "#b7d6de", label: "Blue glass" }) },
      { kind: "number", key: "glassClarity", label: "Clarity", min: 0, max: 1, step: 0.01, marks: 0.25 },
      { kind: "number", key: "glassRoughness", label: "Roughness", min: 0, max: 1, step: 0.01, marks: 0.25 },
      { kind: "number", key: "glassIor", label: "Refraction", min: 1, max: 2.5, step: 0.01, marks: 0.5 },
      { kind: "number", key: "glassThickness", label: "Optical depth", min: 0.1, max: 20, step: 0.1, marks: 5, unit: "m" },
    ] },
  ],
  copy: (config) => [`Settings JSON: ${JSON.stringify(config)}`],
});


/** W58: choosing a glass applies a starting finish that remains independently tunable. */
export function glassStart(type: string): Partial<MountainConfig> {
  if (type === "clear") return { glassTint: "#ffffff", glassClarity: 0.98, glassRoughness: 0.04, glassIor: 1.5, glassThickness: 4 };
  if (type === "frosted") return { glassTint: "#ffffff", glassClarity: 0.9, glassRoughness: 0.55, glassIor: 1.5, glassThickness: 4 };
  if (type === "tinted") return { glassTint: "#b7d6de", glassClarity: 0.92, glassRoughness: 0.08, glassIor: 1.5, glassThickness: 6 };
  if (type === "mirror") return { glassTint: "#ffffff", glassClarity: 0, glassRoughness: 0.04, glassIor: 1.5, glassThickness: 4 };
  return {};
}

/** The mountain's jig, as the page and Inspect draw it: his first variant its start. */
export const MOUNTAIN_JIG: Jig<MountainConfig> = mountainJig("Mountain", MOUNTAIN_START);

/** A mountain's settings as something kept them, read against the jig (a variant, W72); nothing is null. */
export const mountainConfigOf = (saved: unknown) => configOf(MOUNTAIN_JIG, saved);
