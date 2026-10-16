import { COLOURS } from "./colours";
import type { Jig } from "./jig";
import type { Mountain } from "./mountains";

/** World.md W52: individual shape and surface tuning, separate from the seeded scenery layout. */
export type MountainConfig = {
  height: number; diameter: number; taper: number;
  neckTilt: number; headHeight: number; headGap: number; lean: number; turn: number;
  stone: string; mossColour: string; cap: string; overhang: number;
};
export type MountainEdits = Record<string, MountainConfig>;
export const mountainId = (seed: number, index: number) => `mountain:${seed}:${index}`;
export const mountainStart = (m: Pick<Mountain, "top" | "radius" | "seed">): MountainConfig => ({
  height: m.top, diameter: m.top * 106 / 547.5, taper: 738 / 106 - 1,
  neckTilt: Math.atan(61 / 106) * 180 / Math.PI, headHeight: m.top * 173 / 547.5, headGap: m.top * 21.5 / 547.5, lean: Math.atan(60 / 547.5) * 180 / Math.PI, turn: m.seed * 0.01 * 180 / Math.PI % 360,
  stone: "#827e77", mossColour: "#526137", cap: "mirror", overhang: 0,
});
export const mountainJig = (name: string, start: MountainConfig): Jig<MountainConfig> => ({
  name, version: 6, start,
  groups: [
    { title: "Shape", note: () => "Curved shoulders widen from an inclined neck. The bottom is open and cut off at the world floor. Height sizes the body; Diameter sizes the neck; Taper reaches 10.", controls: [
      { kind: "number", key: "height", label: "Height", min: 30, max: 250, step: 1, marks: 50, unit: "m" },
      { kind: "number", key: "diameter", label: "Diameter", min: 10, max: 50, step: 0.5, marks: 10, unit: "m" },
      { kind: "number", key: "taper", label: "Taper", min: 0, max: 10, step: 0.05, marks: 2 },
      { kind: "number", key: "lean", label: "Lean", min: -45, max: 45, step: 0.5, marks: 15, unit: "°" },
      { kind: "number", key: "neckTilt", label: "Neck tilt", min: 0, max: 55, step: 1, marks: 15, unit: "°" },
      { kind: "number", key: "turn", label: "Turn", min: 0, max: 360, step: 1, marks: 90, unit: "°" },
    ] },
    { title: "Stone and moss", note: () => "Moss climbs and falls in an irregular, balanced edge around the stone, with a soft transition.", controls: [
      { kind: "colour", key: "stone", label: "Stone", options: [{ value: "#827e77", colour: "#827e77", label: "Reference stone" }, ...COLOURS] },
      { kind: "colour", key: "mossColour", label: "Moss", options: [{ value: "#526137", colour: "#526137", label: "Reference moss" }, ...COLOURS] },
    ] },
    { title: "Head", note: () => "The entire head is reflective glass, with a level top and inclined underside. It replaces the old slab. Height sizes its volume; Gap separates it from the connector.", controls: [
      { kind: "number", key: "headHeight", label: "Height", min: 2, max: 100, step: 0.5, marks: 20, unit: "m" },
      { kind: "number", key: "headGap", label: "Gap", min: 0, max: 20, step: 0.5, marks: 5, unit: "m" },
      { kind: "choice", key: "cap", label: "Surface", options: [{ value: "mirror", label: "Glass" }, { value: "stone", label: "Stone" }] },
      { kind: "number", key: "overhang", label: "Overhang", min: 0, max: 0.3, step: 0.01, marks: 0.1 },
    ] },
  ],
  copy: (config) => [`Settings JSON: ${JSON.stringify(config)}`],
});


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
