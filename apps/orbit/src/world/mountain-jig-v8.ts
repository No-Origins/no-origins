import { COLOURS } from "./colours";
import type { Jig } from "./jig";
import type { Mountain } from "./mountains";

/** World.md W52: individual shape and surface tuning, separate from the seeded scenery layout. */
export type MountainConfig = {
  height: number; diameter: number; taper: number;
  neckTilt: number; headHeight: number; headDepth: number; lean: number; turn: number;
  stone: string; mossColour: string; cap: string; overhang: number; glassTint: string; glassClarity: number; glassRoughness: number; glassIor: number; glassThickness: number;
};
export type MountainEdits = Record<string, MountainConfig>;
export const mountainId = (seed: number, index: number) => `mountain:${seed}:${index}`;
export const mountainStart = (m: Pick<Mountain, "top" | "radius" | "seed">): MountainConfig => ({
  height: m.top, diameter: m.top * 106 / 547.5, taper: 738 / 106 - 1,
  neckTilt: Math.atan(61 / 106) * 180 / Math.PI, headHeight: m.top * 173 / 547.5, headDepth: 110 / 106, lean: Math.atan(60 / 547.5) * 180 / Math.PI, turn: m.seed * 0.01 * 180 / Math.PI % 360,
  stone: "#827e77", mossColour: "#526137", cap: "clear", overhang: 0, glassTint: "#ffffff", glassClarity: 0.98, glassRoughness: 0.04, glassIor: 1.5, glassThickness: 4,
});
export const mountainJig = (name: string, start: MountainConfig): Jig<MountainConfig> => ({
  name, version: 8, start,
  groups: [
    { title: "Shape", note: () => "Curved shoulders widen from an inclined neck. The bottom is open and cut off at the world floor. Height sizes the body; Diameter sizes the neck; Taper reaches 10.", controls: [
      { kind: "number", key: "height", label: "Height", min: 30, max: 250, step: 1, marks: 50, unit: "m" },
      { kind: "number", key: "diameter", label: "Diameter", min: 10, max: 50, step: 0.5, marks: 10, unit: "m" },
      { kind: "number", key: "taper", label: "Taper", min: 0, max: 10, step: 0.05, marks: 2 },
      { kind: "number", key: "lean", label: "Lean", min: -45, max: 45, step: 0.5, marks: 15, unit: "°" },
      { kind: "number", key: "neckTilt", label: "Neck tilt", min: 0, max: 55, step: 1, marks: 15, unit: "°" },
      { kind: "number", key: "turn", label: "Turn", min: 0, max: 360, step: 1, marks: 90, unit: "°" },
    ] },
    { title: "Stone and algae", note: () => "Algae is a separate raised coating on the stone, with a distinct irregular edge. The mountain continues below the floor cut.", controls: [
      { kind: "colour", key: "stone", label: "Stone", options: [{ value: "#827e77", colour: "#827e77", label: "Reference stone" }, ...COLOURS] },
      { kind: "colour", key: "mossColour", label: "Algae", options: [{ value: "#526137", colour: "#526137", label: "Reference moss" }, ...COLOURS] },
    ] },
    { title: "Head", note: () => "The glass head is seated directly on the inclined neck. Height, Depth and Overhang shape its volume.", controls: [
      { kind: "number", key: "headHeight", label: "Height", min: 2, max: 100, step: 0.5, marks: 20, unit: "m" },
      { kind: "number", key: "headDepth", label: "Depth", min: 0.5, max: 2, step: 0.05, marks: 0.5 },
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
        Object.fromEntries(["turn", "stone", "mossColour", "cap"].filter((key) => saved[key] !== undefined).map((key) => [key, saved[key]])));
    }
    if (saved.glassClarity === undefined && typeof saved.cap === "string") Object.assign(saved, glassStart(saved.cap));
    const config = { ...defaults };
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
