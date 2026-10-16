import { COLOURS } from "./colours";
import type { JigControl } from "./jig";
import { ROAD_VARIANTS } from "./road-v1";

/**
 * The roads, version 2 (World.md W93; his, 2026-10-15: "Roads will have color, start and end similar to Pipes, width
 * and thickness"; asked where a road's look is set, he chose "As they are placed, like a block"). A road is a slab of
 * one width and thickness along its skeleton (`skeleton.ts`), level from side to side, drawn on the Sectors page a joint
 * a click as a pipe is; a joint is where its underside passes, so a road on a floor lies on it, and a joint raised makes
 * a ramp. Its look is its own, Colour, Width and Thickness, set on the item's card as it is placed. There are no
 * variants, no page of its own and no lines on its top: version 1's, a variant's look with its edges and a centre line,
 * is frozen (`road-v1.ts`), and a road kept with a variant is read in that variant's colour, width and thickness.
 * Nothing here is three.js: `build-skeletons.ts` makes it.
 */
export type RoadLook = {
  /** Its colour, and its width and its thickness in metres. */
  colour: string;
  width: number;
  thickness: number;
};

/** The roads' version (W93): 2, its look its own, set as it is placed, with no lines. */
export const ROAD_VERSION = 2;

/** A road's least and most width and thickness, in metres (W84's). */
export const ROAD_WIDTH = { least: 2, most: 60 } as const;
export const ROAD_THICKNESS = { least: 0.25, most: 5 } as const;

/** The first road (W84's, and his variant's): Slate, ten metres wide and half a metre thick. */
export const ROAD_START: RoadLook = { colour: "#5c6068", width: 10, thickness: 0.5 };

/** A road's look on the item's card: its Colour, its Width and its Thickness. */
export const ROAD_CONTROLS: readonly JigControl<RoadLook>[] = [
  { kind: "colour", key: "colour", label: "Colour", options: COLOURS },
  { kind: "number", key: "width", label: "Width", min: ROAD_WIDTH.least, max: ROAD_WIDTH.most, step: 0.5, marks: 10, unit: "m" },
  { kind: "number", key: "thickness", label: "Thickness", min: ROAD_THICKNESS.least, max: ROAD_THICKNESS.most, step: 0.25, marks: 1, unit: "m" },
];

const within = (value: number, range: { least: number; most: number }) => Math.max(range.least, Math.min(range.most, value));

/** A road's look as kept, or none: a colour `#rrggbb`, and a width and a thickness within their ranges. */
export function roadLookOf(kept: unknown): RoadLook | null {
  if (!kept || typeof kept !== "object") return null;
  const { colour, width, thickness } = kept as Record<string, unknown>;
  if (typeof colour !== "string" || !/^#[0-9a-f]{6}$/i.test(colour)) return null;
  if (typeof width !== "number" || !Number.isFinite(width) || typeof thickness !== "number" || !Number.isFinite(thickness)) return null;
  return { colour, width: within(width, ROAD_WIDTH), thickness: within(thickness, ROAD_THICKNESS) };
}

/** A road kept with a variant of version 1 (W84 to W92): that variant's colour, width and thickness, or the start's where it is gone. */
export function roadLookOfVariant(id: unknown): RoadLook {
  const settings = ROAD_VARIANTS.find((variant) => variant.id === id)?.settings;
  return roadLookOf(settings) ?? ROAD_START;
}
