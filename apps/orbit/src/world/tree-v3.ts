// Trees version 3, frozen (World.md W85); nothing draws this.
import { COLOURS, paletteWith } from "./colours";
import { configOf, type Jig } from "./jig";
import { PUBLISHED_TREES } from "./published";
import type { Variant } from "./variants";

/**
 * The trees, version 3: the awakening light (World.md W67; his sheet, 2026-10-13: "We need this sort of trees (these
 * are 1 type of many trees we will create later) in the orbit"), at his size (W68), and now one tree alone on its
 * page, with its variants (W72; his: "just like human, where there is only one base and a human standing there …
 * similarly for every other element"). A tree is two parts aligned on one axis: a trunk, a circle in section at one
 * radius from its base to its tip, straight up to where the bend starts and bent once from there along one continuous
 * curve, with no reverse bend and no kink; and at its tip a light, a closed tube wider than the trunk, its top and
 * bottom covered (his), following the trunk's tangent and emitting one of four colours (his, W71). What varies from
 * tree to tree is the sheet's: the trunk's length, its bend radius and the way it leans, drawn from a variant's ranges.
 *
 * The trees stand where he places them (W73): each an asset of a zone, one of the trees' variants, with its own seed,
 * which draws its length, its bend radius and its light's colour from the variant's ranges (`treeOf`); the grove brush
 * on the Sectors page places many at a click (W82). This is the first type of tree; the next types come later (his). Nothing
 * here is three.js: `build-tree.ts` makes them. Version 2, the grove on this page, is frozen (`tree-v2.ts`,
 * `build-tree-v2.ts`), version 3's seeded grove beside it (`tree-grove-v3.ts`); version 1, a few metres tall, before.
 */
export type TreeConfig = {
  /** The trunk: its colour, one radius in metres, the range each tree's length is drawn from, where its bend starts, and the range its bend radius is drawn from, in metres. */
  trunkColour: string;
  trunkRadius: number;
  lengthFrom: number;
  lengthTo: number;
  bendAt: number;
  bendFrom: number;
  bendTo: number;
  /**
   * The light at the tip: its four colours, each tree's drawn from them by the seed (W71); its radius (wider than the
   * trunk) and its length in metres, and its light on what stands near.
   */
  lightColour: string;
  lightColour2: string;
  lightColour3: string;
  lightColour4: string;
  lightRadius: number;
  lightLength: number;
  lightBrightness: number;
  lightReach: number;
};

/** The sheet's blue: the light's colour as drawn, offered beside the world's swatches (as the mountain's bulb is). */
export const AWAKENING_BLUE = "#8ed8ff";

/**
 * His variants of the tree (W72, W73): the published copy (`published.ts`), the first his tree of 2026-10-14 (W71; his
 * Copy: a Pale sage trunk a metre in radius, 50 to 100 m long, bent from its foot on a radius of 160 to 360 m; a light
 * 6 m in radius and 2 m long, brightness 5000, reach 100 m; the four light colours as he named them). What the trees'
 * page starts from is the first.
 */
export const TREE_VARIANTS: readonly Variant<TreeConfig>[] = PUBLISHED_TREES as unknown as readonly Variant<TreeConfig>[];
export const TREE_START: TreeConfig = TREE_VARIANTS[0].settings;

/**
 * One tree as placed (W73): where it stands, in metres from the world's middle; its trunk's length, where its bend
 * starts and its bend radius, in metres; the way it leans, in degrees round from east; its light's colour, one of its
 * variant's four; and its own seed.
 */
export type Tree = { x: number; z: number; length: number; bendAt: number; bend: number; lean: number; colour: string; seed: number };

/**
 * The furthest a trunk's tip turns from upright, in degrees (mine): one continuous curve may bend past level, but never
 * curl back on itself. A bend radius too tight for the length past the bend's start is widened to this.
 */
export const TIP_TURN = 120;

/** How far the trunk enters the light, as a share of the light's length (mine, from the sheet's drawing). */
export const ENTRY = 0.25;

/**
 * A tree of a variant, drawn by its seed (W73): its length and its bend radius from the variant's ranges, its light's
 * colour one of the four, the same seed the same tree wherever it stands; standing where it is placed, leaning its way.
 * A tree no longer than where its bend starts stands straight.
 */
export function treeOf(config: TreeConfig, seed: number, x = 0, z = 0, lean = 0): Tree {
  let state = (Math.round(seed) >>> 0) || 1;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const length = config.lengthFrom + random() * Math.max(0, config.lengthTo - config.lengthFrom);
  const bendAt = Math.max(0, Math.min(length, config.bendAt));
  const drawn = config.bendFrom + random() * Math.max(0, config.bendTo - config.bendFrom);
  const bend = Math.max(drawn, (length - bendAt) / (TIP_TURN * Math.PI / 180));
  const colours = [config.lightColour, config.lightColour2, config.lightColour3, config.lightColour4];
  return { x, z, length, bendAt, bend, lean, colour: colours[Math.floor(random() * colours.length)], seed };
}

/**
 * One tree alone, on its page (W72): at the world's middle, its length and bend radius the middle of its ranges, its
 * bend towards the east, its light the first colour, so what the card says is what stands there.
 */
export function studioTree(config: TreeConfig): Tree {
  const length = (config.lengthFrom + config.lengthTo) / 2;
  const bendAt = Math.max(0, Math.min(length, config.bendAt));
  const bend = Math.max((config.bendFrom + config.bendTo) / 2, (length - bendAt) / (TIP_TURN * Math.PI / 180));
  return { x: 0, z: 0, length, bendAt, bend, lean: 0, colour: config.lightColour, seed: 0 };
}

/**
 * A point of the trunk, `s` metres along it from its base, before it leans: the trunk stands straight up from the
 * origin to where its bend starts, then bends towards +x on a circle of its bend radius, one continuous curve. The
 * tangent there, the way the trunk points.
 */
export function trunkAt(tree: Pick<Tree, "bend" | "bendAt">, s: number): { point: [number, number, number]; tangent: [number, number, number] } {
  if (s <= tree.bendAt) return { point: [0, s, 0], tangent: [0, 1, 0] };
  const turn = (s - tree.bendAt) / tree.bend;
  return {
    point: [tree.bend * (1 - Math.cos(turn)), tree.bendAt + tree.bend * Math.sin(turn), 0],
    tangent: [Math.sin(turn), Math.cos(turn), 0],
  };
}

/** How far the tip has turned from upright, in degrees. */
export const tipTurnOf = (tree: Pick<Tree, "bend" | "bendAt" | "length">) => (Math.max(0, tree.length - tree.bendAt) / tree.bend) * 180 / Math.PI;

/** The lights' swatches: the sheet's blue beside the world's colours. */
const LIGHT_COLOURS = paletteWith({ value: AWAKENING_BLUE, colour: AWAKENING_BLUE, label: "Awakening blue" });

export const TREES_JIG: Jig<TreeConfig> = {
  name: "Trees",
  version: 3,
  start: TREE_START,
  groups: [
    {
      title: "Trunk",
      note: (config) => `A smooth trunk, a circle in section at one radius from base to tip, straight up to where the bend starts and bent once from there along one continuous curve: no reverse bend, no kink. This tree stands at the middle of its ranges; in the world each tree of this variant draws its length and its bend radius from them by its own seed and leans its own way; one no longer than Bend starts stands straight, and a bend too tight for what is left is widened so the tip turns at most ${TIP_TURN}° from upright (the tip turns ${Math.round(tipTurnOf({ length: config.lengthFrom, bendAt: config.bendAt, bend: config.bendTo }))}° to ${Math.round(Math.min(TIP_TURN, tipTurnOf({ length: config.lengthTo, bendAt: config.bendAt, bend: config.bendFrom })))}° here).`,
      controls: [
        { kind: "colour", key: "trunkColour", label: "Colour", options: COLOURS },
        { kind: "number", key: "trunkRadius", label: "Radius", min: 1, max: 20, step: 0.5, marks: 5, unit: "m" },
        { kind: "number", key: "lengthFrom", to: "lengthTo", label: "Length", min: 50, max: 300, step: 5, marks: 50, unit: "m" },
        { kind: "number", key: "bendAt", label: "Bend starts", min: 0, max: 200, step: 5, marks: 50, unit: "m" },
        { kind: "number", key: "bendFrom", to: "bendTo", label: "Bend radius", min: 10, max: 400, step: 10, marks: 50, unit: "m" },
      ],
    },
    {
      title: "Light",
      note: () => "A closed tube at the tip, wider than the trunk, its top and bottom covered, following the trunk's tangent, the trunk entering it through the bottom a quarter of its length. This tree's light is the first colour; in the world each tree of this variant draws one of the four by its seed. It emits its colour, and lights what stands within Reach (0 for no light). Where the trees stand is the World page's: a click places a grove of this variant.",
      controls: [
        { kind: "colour", key: "lightColour", label: "First colour", options: LIGHT_COLOURS },
        { kind: "colour", key: "lightColour2", label: "Second colour", options: LIGHT_COLOURS },
        { kind: "colour", key: "lightColour3", label: "Third colour", options: LIGHT_COLOURS },
        { kind: "colour", key: "lightColour4", label: "Fourth colour", options: LIGHT_COLOURS },
        { kind: "number", key: "lightRadius", label: "Radius", min: 1, max: 30, step: 0.5, marks: 5, unit: "m" },
        { kind: "number", key: "lightLength", label: "Length", min: 2, max: 60, step: 1, marks: 10, unit: "m" },
        { kind: "number", key: "lightBrightness", label: "Brightness", min: 0, max: 20000, step: 500, marks: 5000 },
        { kind: "number", key: "lightReach", label: "Reach", min: 0, max: 500, step: 10, marks: 100, unit: "m" },
      ],
    },
  ],
  copy: (config) => [`Settings JSON: ${JSON.stringify(config)}`],
};

/** A tree's settings as something kept them, read against the jig; nothing is null. */
export const treeConfigOf = (saved: unknown) => configOf(TREES_JIG, saved);
