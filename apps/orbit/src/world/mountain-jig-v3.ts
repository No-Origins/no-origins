import { COLOURS } from "./colours";
import type { Jig } from "./jig";
import type { Mountain } from "./mountains";

/** World.md W52: individual shape and surface tuning, separate from the seeded scenery layout. */
export type MountainConfig = {
  height: number; diameter: number; taper: number;
  tilt: number; turn: number;
  stone: string; mossColour: string; cap: string; overhang: number; thickness: number;
};
export type MountainEdits = Record<string, MountainConfig>;
export const mountainId = (seed: number, index: number) => `mountain:${seed}:${index}`;
export const mountainStart = (m: Pick<Mountain, "top" | "radius" | "seed">): MountainConfig => ({
  height: m.top, diameter: m.radius * 0.88, taper: 1.15,
  tilt: Math.atan(0.6) * 180 / Math.PI, turn: m.seed * 0.01 * 180 / Math.PI % 360,
  stone: "#827e77", mossColour: "#526137", cap: "mirror", overhang: 0.07, thickness: 0.22,
});
export const mountainJig = (name: string, start: MountainConfig): Jig<MountainConfig> => ({
  name, version: 3, start,
  groups: [
    { title: "Shape", note: () => "Circular mountains from base to summit. Diameter sizes the summit; Taper widens the foot, from 0 to 10. Large feet fit within the world and the placement gaps.", controls: [
      { kind: "number", key: "height", label: "Height", min: 30, max: 250, step: 1, marks: 50, unit: "m" },
      { kind: "number", key: "diameter", label: "Diameter", min: 10, max: 50, step: 0.5, marks: 10, unit: "m" },
      { kind: "number", key: "taper", label: "Taper", min: 0, max: 10, step: 0.05, marks: 2 },
      { kind: "number", key: "turn", label: "Turn", min: 0, max: 360, step: 1, marks: 90, unit: "°" },
    ] },
    { title: "Stone and moss", note: () => "Moss climbs and falls in an irregular, balanced edge around the stone, with a soft transition.", controls: [
      { kind: "colour", key: "stone", label: "Stone", options: [{ value: "#827e77", colour: "#827e77", label: "Reference stone" }, ...COLOURS] },
      { kind: "colour", key: "mossColour", label: "Moss", options: [{ value: "#526137", colour: "#526137", label: "Reference moss" }, ...COLOURS] },
    ] },
    { title: "Summit", note: () => "The plate follows the stone's inclined top. Mirror approximates sky and cloud reflections.", controls: [
      { kind: "choice", key: "cap", label: "Surface", options: [{ value: "mirror", label: "Mirror" }, { value: "stone", label: "Stone" }] },
      { kind: "number", key: "tilt", label: "Tilt", min: 0, max: 55, step: 1, marks: 15, unit: "°" },
      { kind: "number", key: "overhang", label: "Overhang", min: 0, max: 0.3, step: 0.01, marks: 0.1 },
      { kind: "number", key: "thickness", label: "Thickness", min: 0.1, max: 2, step: 0.05, marks: 0.5, unit: "m" },
    ] },
  ],
  copy: (config) => [`Settings JSON: ${JSON.stringify(config)}`],
});


/** W53, W54: retain shape/paint tuning, convert rectangular sizing, and drop retired controls. */
export function mountainEditsOf(kept: unknown): MountainEdits {
  if (!kept || typeof kept !== "object" || Array.isArray(kept)) return {};
  const defaults = mountainStart({ top: 120, radius: 30, seed: 0 });
  const controls = mountainJig("Mountain", defaults).groups.flatMap((group) => group.controls);
  const edits: MountainEdits = {};
  for (const [id, value] of Object.entries(kept)) {
    if (!id.startsWith("mountain:") || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const saved = { ...value } as Record<string, unknown>;
    // W54: a former rectangular summit becomes a circle of its larger dimension.
    if (saved.diameter === undefined && typeof saved.width === "number" && typeof saved.depth === "number") {
      saved.diameter = Math.max(saved.width, saved.depth);
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
