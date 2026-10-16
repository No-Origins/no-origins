import { COLOURS } from "./colours";
import { configOf, type Jig } from "./jig";
import { PUBLISHED_ROADS } from "./published";
import type { Point } from "./skeleton";
import type { Variant } from "./variants";

/**
 * Frozen with World.md W93, where a road's look became its own, set as it is placed, and its lines went (`road.ts`,
 * version 2); nothing draws it, and only an old world's variant is read from it.
 *
 * The roads, version 1 (World.md W84; his, 2026-10-15: "roads can basically also work like pipe, I will define the
 * start and end, and I should be able to decide the shape of it"). A road is a slab of one width and thickness along its
 * skeleton (`skeleton.ts`), level from side to side, placed and shaped on the Sectors page as a pipe is; a joint is
 * where its underside passes, so a road placed on a floor lies on it, and a joint raised makes a ramp. *Mine:* its
 * edges and its centre line, painted on its top, a hair over it; a centre line of dashes, or one line where Dash is 0.
 * Nothing here is three.js: `build-skeletons.ts` makes it.
 */
export type RoadConfig = {
  /** The road: its colour, its width and its thickness, in metres. */
  colour: string;
  width: number;
  thickness: number;
  /** The lines on its top: the edges' colour and width, the centre line's colour and width, and each dash's length (0 one line). */
  edgeColour: string;
  edgeWidth: number;
  lineColour: string;
  lineWidth: number;
  dash: number;
};

/** His variants of the road (W73): the published copy (`published.ts`); the first is what its page starts from. */
export const ROAD_VARIANTS: readonly Variant<RoadConfig>[] = PUBLISHED_ROADS;
/** The first road (mine): Slate, ten metres wide and half a metre thick, Cream edges and a dashed Cream centre line. */
const ROAD_DEFAULT: RoadConfig = { colour: "#5c6068", width: 10, thickness: 0.5, edgeColour: "#f7f1f2", edgeWidth: 0.4, lineColour: "#f7f1f2", lineWidth: 0.3, dash: 4 };
export const ROAD_START: RoadConfig = { ...ROAD_DEFAULT, ...ROAD_VARIANTS[0]?.settings };

/**
 * One road alone on its page (W72, mine): across the world's middle from the south-west to the north-east, bending
 * one way and back, on the floor, so its width, its lines and its bends are in view as it is tuned.
 */
export const STUDIO_ROAD: readonly Point[] = [[-50, 0, 20], [-18, 0, -12], [18, 0, 14], [50, 0, -16]];

export const ROAD_JIG: Jig<RoadConfig> = {
  name: "Roads",
  version: 1,
  start: ROAD_START,
  groups: [
    {
      title: "Road",
      note: () => "A slab of one width and thickness from its start to its end, level from side to side, along one smooth curve through every joint of its skeleton. Roads are placed and shaped on the Sectors page: Place with Road the item, click where it starts and where it ends, then drag its joints; a joint raised makes a ramp.",
      controls: [
        { kind: "colour", key: "colour", label: "Colour", options: COLOURS },
        { kind: "number", key: "width", label: "Width", min: 2, max: 60, step: 0.5, marks: 10, unit: "m" },
        { kind: "number", key: "thickness", label: "Thickness", min: 0.25, max: 5, step: 0.25, marks: 1, unit: "m" },
      ],
    },
    {
      title: "Lines",
      note: () => "Painted on the road's top: its two edges, and a centre line of dashes, each dash as long as the gap after it (Dash 0 draws one line). A width of 0 paints none.",
      controls: [
        { kind: "colour", key: "edgeColour", label: "Edge colour", options: COLOURS },
        { kind: "number", key: "edgeWidth", label: "Edge width", min: 0, max: 3, step: 0.1, marks: 0.5, unit: "m" },
        { kind: "colour", key: "lineColour", label: "Centre colour", options: COLOURS },
        { kind: "number", key: "lineWidth", label: "Centre width", min: 0, max: 2, step: 0.1, marks: 0.5, unit: "m" },
        { kind: "number", key: "dash", label: "Dash", min: 0, max: 20, step: 0.5, marks: 5, unit: "m" },
      ],
    },
  ],
  copy: (config) => [`Settings JSON: ${JSON.stringify(config)}`],
};

/** A road's settings as something kept them, read against the jig; nothing is null. */
export const roadConfigOf = (saved: unknown) => configOf(ROAD_JIG, saved);
