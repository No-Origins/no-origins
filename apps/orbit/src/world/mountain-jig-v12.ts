import { COLOURS } from "./colours";
import type { Jig } from "./jig";
import type { Mountain } from "./mountains";

/** World.md W52: individual shape and surface tuning, separate from the seeded scenery layout. */
export type MountainConfig = {
  height: number; diameter: number; taper: number;
  neckTilt: number; headHeight: number; headDepthMetres: number; lean: number;
  neckLength: number; neckDiameter: number;
  lightState: string; lightColour: string; lightPower: number; lightSize: number; lightReach: number;
  algaePastel: number; algaeEdge: number; algaeVariation: number; algaeSeed: number;
  stone: string; mossColour: string; cap: string; overhang: number; glassTint: string; glassClarity: number; glassRoughness: number; glassIor: number; glassThickness: number; stoneTexture: string; stoneRoughness: number; stoneScale: number; stoneDetail: number; algaeThickness: number; algaeScale: number;
};
export type MountainEdits = Record<string, MountainConfig>;
export const mountainId = (seed: number, index: number) => `mountain:${seed}:${index}`;
export const mountainStart = (m: Pick<Mountain, "top" | "radius" | "seed">): MountainConfig => ({
  height: m.top, diameter: m.top * 106 / 547.5, taper: 738 / 106 - 1,
  neckTilt: Math.atan(61 / 106) * 180 / Math.PI, headHeight: m.top * 173 / 547.5, headDepthMetres: m.top * 110 / 547.5, lean: Math.atan(60 / 547.5) * 180 / Math.PI,
  neckLength: m.top * 21.5 / 547.5, neckDiameter: 1.5,
  lightState: "on", lightColour: "#ffe1a6", lightPower: 150, lightSize: 2, lightReach: 30,
  algaePastel: 0.65, algaeEdge: 0.7, algaeVariation: 1, algaeSeed: m.seed,
  stone: "#827e77", mossColour: "#526137", cap: "clear", overhang: 0, glassTint: "#ffffff", glassClarity: 0.98, glassRoughness: 0.04, glassIor: 1.5, glassThickness: 4, stoneTexture: "granite", stoneRoughness: 0.95, stoneScale: 1, stoneDetail: 0.5, algaeThickness: 0.5, algaeScale: 1,
});
export const mountainJig = (name: string, start: MountainConfig): Jig<MountainConfig> => ({
  name, version: 12, start,
  groups: [
    { title: "Shape", note: () => "Curved shoulders widen from an inclined neck. The bottom is open and cut off at the world floor. Height sizes the body; Diameter sizes the neck; Taper reaches 10. Rotation always faces the world centre.", controls: [
      { kind: "number", key: "height", label: "Height", min: 30, max: 250, step: 1, marks: 50, unit: "m" },
      { kind: "number", key: "diameter", label: "Diameter", min: 10, max: 50, step: 0.5, marks: 10, unit: "m" },
      { kind: "number", key: "taper", label: "Taper", min: 0, max: 10, step: 0.05, marks: 2 },
      { kind: "number", key: "lean", label: "Lean", min: -45, max: 45, step: 0.5, marks: 15, unit: "°" },
      { kind: "number", key: "neckTilt", label: "Neck tilt", min: 0, max: 55, step: 1, marks: 15, unit: "°" },
    ] },
    { title: "Body", note: () => "Choose the stone texture and colour, then tune its roughness, grain size and detail. Algae has its own surface layer.", controls: [
      { kind: "choice", key: "stoneTexture", label: "Texture", options: [{ value: "granite", label: "Granite" }, { value: "basalt", label: "Basalt" }, { value: "sandstone", label: "Sandstone" }, { value: "smooth", label: "Smooth" }] },
      { kind: "colour", key: "stone", label: "Colour", options: [{ value: "#827e77", colour: "#827e77", label: "Reference stone" }, ...COLOURS] },
      { kind: "number", key: "stoneRoughness", label: "Roughness", min: 0, max: 1, step: 0.01, marks: 0.25 },
      { kind: "number", key: "stoneScale", label: "Texture scale", min: 0.1, max: 5, step: 0.1, marks: 1 },
      { kind: "number", key: "stoneDetail", label: "Texture strength", min: 0, max: 1, step: 0.01, marks: 0.25 },
    ] },
    { title: "Algae", note: () => "A raised pastel layer with chalky grain and broken brush edges. Every mountain has its own coverage and contour. Pattern seed changes that mountain's pattern.", controls: [
      { kind: "colour", key: "mossColour", label: "Colour", options: [{ value: "#526137", colour: "#526137", label: "Reference algae" }, ...COLOURS] },
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
    { title: "Neck light", note: () => "A bulb at the stem's tip extends into the glass. Brightness controls the bulb and its light; Reach limits how far it illuminates nearby surfaces.", controls: [
      { kind: "choice", key: "lightState", label: "Light", options: [{ value: "on", label: "On" }, { value: "off", label: "Off" }] },
      { kind: "colour", key: "lightColour", label: "Colour", options: [{ value: "#ffe1a6", colour: "#ffe1a6", label: "Warm bulb" }, ...COLOURS] },
      { kind: "number", key: "lightPower", label: "Brightness", min: 0, max: 1000, step: 10, marks: 250 },
      { kind: "number", key: "lightSize", label: "Bulb size", min: 0.25, max: 5, step: 0.05, marks: 1, unit: "m" },
      { kind: "number", key: "lightReach", label: "Reach", min: 5, max: 100, step: 1, marks: 25, unit: "m" },
    ] },
    { title: "Head", note: () => "The glass head joins the body through the thin neck. Height and Depth are both measured in metres, from 2 to 100. Overhang shapes its width.", controls: [
      { kind: "number", key: "headHeight", label: "Height", min: 2, max: 100, step: 0.5, marks: 20, unit: "m" },
      { kind: "number", key: "headDepthMetres", label: "Depth", min: 2, max: 100, step: 0.5, marks: 20, unit: "m" },
      { kind: "number", key: "overhang", label: "Overhang", min: 0, max: 0.3, step: 0.01, marks: 0.1 },
    ] },
    { title: "Glass", note: () => "Choose a glass type, then tune its finish. Clarity controls light passing through; Refraction bends the view. Mirror stays opaque; Stone uses the body colour.", controls: [
      { kind: "choice", key: "cap", label: "Type", options: [{ value: "clear", label: "Clear" }, { value: "frosted", label: "Frosted" }, { value: "tinted", label: "Tinted" }, { value: "mirror", label: "Mirror" }, { value: "stone", label: "Stone" }] },
      { kind: "colour", key: "glassTint", label: "Tint", options: [{ value: "#ffffff", colour: "#ffffff", label: "Clear white" }, { value: "#b7d6de", colour: "#b7d6de", label: "Blue glass" }, ...COLOURS] },
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

/** W56: adopt the complete body/head profile for older saved shapes. */
export function mountainEditsOf(kept: unknown): MountainEdits {
  if (!kept || typeof kept !== "object" || Array.isArray(kept)) return {};
  const defaults = mountainStart({ top: 120, radius: 30, seed: 0 });
  const controls = mountainJig("Mountain", defaults).groups.flatMap((group) => group.controls);
  const edits: MountainEdits = {};
  for (const [id, value] of Object.entries(kept)) {
    if (!id.startsWith("mountain:") || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const saved = { ...value } as Record<string, unknown>;
    // W56: the previous four-sided silhouette was only the head. Rebuild the body from the complete drawing.
    if (saved.headHeight === undefined) {
      const height = typeof saved.height === "number" && Number.isFinite(saved.height) ? Math.max(30, Math.min(250, saved.height)) : defaults.height;
      Object.assign(saved, mountainStart({ top: height, radius: 30, seed: 0 }),
        Object.fromEntries(["stone", "mossColour", "cap"].filter((key) => saved[key] !== undefined).map((key) => [key, saved[key]])));
    }
    // W63: the former depth was a ratio of neck diameter; retain its actual dimensions in metres.
    if (saved.headDepthMetres === undefined && typeof saved.headDepth === "number" && Number.isFinite(saved.headDepth)) {
      const diameter = typeof saved.diameter === "number" && Number.isFinite(saved.diameter) ? Math.max(10, Math.min(50, saved.diameter)) : defaults.diameter;
      saved.headDepthMetres = saved.headDepth * diameter;
    }
    if (saved.glassClarity === undefined && typeof saved.cap === "string") Object.assign(saved, glassStart(saved.cap));
    // Earlier saved shapes acquire unique brush patterns while retaining their colours and tuning.
    const [, layoutSeed, index] = id.split(":");
    const patternSeed = ((Number(layoutSeed) || 0) * 131 + (Number(index) || 0) * 977) % 10000;
    const config = { ...defaults, algaeSeed: Math.abs(patternSeed) };
    for (const c of controls) {
      const v = saved[c.key];
      if (c.kind === "number" && typeof v === "number" && Number.isFinite(v)) {
        Object.assign(config, { [c.key]: Math.max(c.min, Math.min(c.max, v)) });
      } else if (c.kind === "colour" && typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v)) {
        Object.assign(config, { [c.key]: v });
      } else if (c.kind === "choice" && typeof v === "string" && c.options.some((o) => o.value === v)) {
        Object.assign(config, { [c.key]: v });
      }
    }
    edits[id] = config;
  }
  return edits;
}
