/** Trees version 1, frozen (World.md W67): the first awakening light, a few metres tall; version 2 (`tree.ts`, W68) answers his note. Nothing draws this. */
import { COLOURS } from "./colours";
import type { Jig } from "./jig";
import { WORLD_SIZE } from "./orbit";

/**
 * The trees, version 1: the awakening light (World.md W67; his sheet, 2026-10-13: "We need this sort of trees (these
 * are 1 type of many trees we will create later) in the orbit"). A tree is two parts aligned on one axis: a white trunk,
 * a circle in section at one radius from its base to its tip, bent once along one continuous curve, with no reverse
 * bend and no kink; and at its tip a light, an open tube wider than the trunk, with no top and no bottom, following the
 * trunk's tangent and emitting blue. What varies from tree to tree is the sheet's: the trunk's length, its bend radius
 * and the way it leans; they stand in a natural, park-like scatter.
 *
 * This is the first type of tree; the next types come later (his). Nothing here is three.js: `build-tree.ts` makes
 * them. The page is `/build/trees`; these starting values are mine, his to tune.
 */
export type TreesConfig = {
  /** The trunk: its colour, one radius in centimetres, and the ranges each tree's length and bend radius are drawn from, in metres. */
  trunkColour: string;
  trunkRadius: number;
  lengthFrom: number;
  lengthTo: number;
  bendFrom: number;
  bendTo: number;
  /** The light at the tip: its colour, its radius (wider than the trunk) in centimetres, its length in metres, and its light on what stands near. */
  lightColour: string;
  lightRadius: number;
  lightLength: number;
  lightBrightness: number;
  lightReach: number;
  /** The grove: how many trees, the clear gap between them, how far from the world's middle they stand, the clearing at the middle, and the seed. */
  count: number;
  spacing: number;
  spread: number;
  clearing: number;
  seed: number;
};

/** The sheet's blue: the light's colour as drawn, offered beside the world's swatches (as the mountain's bulb is). */
export const AWAKENING_BLUE = "#8ed8ff";

/** Mine, from the sheet's proportions against the human's 8 feet; his to tune. */
export const TREES_START: TreesConfig = {
  trunkColour: "#f7f1f2",
  trunkRadius: 15,
  lengthFrom: 4,
  lengthTo: 8,
  bendFrom: 6,
  bendTo: 14,
  lightColour: AWAKENING_BLUE,
  lightRadius: 26,
  lightLength: 1.2,
  lightBrightness: 120,
  lightReach: 12,
  count: 16,
  spacing: 5,
  spread: 40,
  seed: 7,
  clearing: 6,
};

/**
 * One tree of the grove: where it stands, in metres from the world's middle; its trunk's length and bend radius, in
 * metres; the way it leans, in degrees round from east; and its own seed.
 */
export type Tree = { x: number; z: number; length: number; bend: number; lean: number; seed: number };

/**
 * The furthest a trunk's tip turns from upright, in degrees (mine): one continuous curve may bend past level, but never
 * curl back on itself. A bend radius too tight for the length is widened to this.
 */
export const TIP_TURN = 120;

/** How far the trunk enters the light, as a share of the light's length (mine, from the sheet's drawing). */
export const ENTRY = 0.25;

/**
 * The trees, placed from the seed: candidates drawn at random within the Spread, each kept only where it stands at
 * least the Spacing from every tree kept before it and the Clearing from the world's middle, until the Count stands or
 * the candidates run out. The same seed places the same trees; Count 0 is no trees.
 */
export function treesOf(config: TreesConfig): Tree[] {
  let state = (Math.round(config.seed) >>> 0) || 1;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const count = Math.max(0, Math.min(60, Math.round(config.count)));
  const spread = Math.min(config.spread, WORLD_SIZE.diameter / 2 - 20);
  const spacing = Math.max(0, config.spacing);
  const clearing = Math.max(0, config.clearing);
  const trees: Tree[] = [];
  for (let tries = count * 40; trees.length < count && tries > 0; tries--) {
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * spread;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    if (distance < clearing) continue;
    if (trees.some((tree) => Math.hypot(tree.x - x, tree.z - z) < spacing)) continue;
    const length = config.lengthFrom + random() * Math.max(0, config.lengthTo - config.lengthFrom);
    const drawn = config.bendFrom + random() * Math.max(0, config.bendTo - config.bendFrom);
    const bend = Math.max(drawn, length / (TIP_TURN * Math.PI / 180));
    trees.push({ x, z, length, bend, lean: random() * 360, seed: Math.floor(random() * 10000) });
  }
  return trees;
}

/**
 * A point of the trunk, `s` metres along it from its base, before it leans: the trunk stands up from the origin and
 * bends towards +x on a circle of its bend radius, one continuous curve. The tangent there, the way the trunk points.
 */
export function trunkAt(tree: Pick<Tree, "bend">, s: number): { point: [number, number, number]; tangent: [number, number, number] } {
  const turn = s / tree.bend;
  return {
    point: [tree.bend * (1 - Math.cos(turn)), tree.bend * Math.sin(turn), 0],
    tangent: [Math.sin(turn), Math.cos(turn), 0],
  };
}

/** How far the tip has turned from upright, in degrees. */
export const tipTurnOf = (tree: Pick<Tree, "bend" | "length">) => (tree.length / tree.bend) * 180 / Math.PI;

export const TREES_JIG: Jig<TreesConfig> = {
  name: "Trees",
  version: 1,
  start: TREES_START,
  groups: [
    {
      title: "Trunk",
      note: (config) => `A smooth trunk, a circle in section at one radius from base to tip, bent once along one continuous curve: no reverse bend, no kink. Each tree draws its length and its bend radius from these ranges and leans its own way; a bend too tight for its length is widened so the tip turns at most ${TIP_TURN}° from upright (the tip turns ${Math.round(tipTurnOf({ length: config.lengthFrom, bend: config.bendTo }))}° to ${Math.round(Math.min(TIP_TURN, tipTurnOf({ length: config.lengthTo, bend: config.bendFrom })))}° here).`,
      controls: [
        { kind: "colour", key: "trunkColour", label: "Colour", options: COLOURS },
        { kind: "number", key: "trunkRadius", label: "Radius", min: 5, max: 40, step: 1, marks: 5, unit: "cm" },
        { kind: "number", key: "lengthFrom", to: "lengthTo", label: "Length", min: 1, max: 15, step: 0.5, marks: 2, unit: "m" },
        { kind: "number", key: "bendFrom", to: "bendTo", label: "Bend radius", min: 2, max: 40, step: 1, marks: 5, unit: "m" },
      ],
    },
    {
      title: "Light",
      note: () => "An open tube at the tip, wider than the trunk, with no top and no bottom, following the trunk's tangent, the trunk entering it a quarter of its length. It emits its colour, and lights what stands within Reach (0 for no light).",
      controls: [
        { kind: "colour", key: "lightColour", label: "Colour", options: [{ value: AWAKENING_BLUE, colour: AWAKENING_BLUE, label: "Awakening blue" }, ...COLOURS] },
        { kind: "number", key: "lightRadius", label: "Radius", min: 5, max: 80, step: 1, marks: 10, unit: "cm" },
        { kind: "number", key: "lightLength", label: "Length", min: 0.2, max: 3, step: 0.1, marks: 0.5, unit: "m" },
        { kind: "number", key: "lightBrightness", label: "Brightness", min: 0, max: 500, step: 10, marks: 100 },
        { kind: "number", key: "lightReach", label: "Reach", min: 0, max: 40, step: 1, marks: 10, unit: "m" },
      ],
    },
    {
      title: "Grove",
      note: (config) => `${treesOf(config).length} of ${config.count} trees stand within ${config.spread} m of the world's middle, in a natural, park-like scatter: none nearer than Spacing to another, none within the Clearing at the middle, where the visitor starts. Randomize draws another scatter; the seed keeps it. Each tree carries a light.`,
      controls: [
        { kind: "number", key: "count", label: "Count", min: 0, max: 40, step: 1, marks: 10 },
        { kind: "number", key: "spacing", label: "Spacing", min: 2, max: 30, step: 1, marks: 5, unit: "m" },
        { kind: "number", key: "spread", label: "Spread", min: 10, max: 300, step: 10, marks: 50, unit: "m" },
        { kind: "number", key: "clearing", label: "Clearing", min: 0, max: 20, step: 1, marks: 5, unit: "m" },
        { kind: "number", key: "seed", label: "Seed", min: 0, max: 9999, step: 1, marks: 1000 },
      ],
    },
  ],
  copy: (config) => [
    `Trees: ${treesOf(config).map((tree) => `(${tree.x.toFixed(1)}, ${tree.z.toFixed(1)}) ${tree.length.toFixed(1)} m, bend ${tree.bend.toFixed(1)} m, lean ${Math.round(tree.lean)}°`).join("; ")}`,
    `Settings JSON: ${JSON.stringify(config)}`,
  ],
};
