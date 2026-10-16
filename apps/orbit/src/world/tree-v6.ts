// Trees version 6, frozen (World.md W92); nothing draws this.
import { COLOURS, paletteWith } from "./colours";
import { configOf, type Jig } from "./jig";
import { PUBLISHED_TREES } from "./published";
import { reachOf } from "./strength";
import type { Variant } from "./variants";

/**
 * The trees, version 6: the awakening light (World.md W67; his sheet, 2026-10-13: "We need this sort of trees (these
 * are 1 type of many trees we will create later) in the orbit"), at his size (W68), one tree alone on its page, with
 * its variants (W72; his: "just like human, where there is only one base and a human standing there … similarly for
 * every other element"), its light a tube or an allium's head (W85; his, 2026-10-15: "I also need options with
 * different shape to look like allium flower"), and now no size drawn at random (W86; his, the same day: "instead of us
 * just randomly rendering random sizes, I think I will create trees with different combinations and select colors …
 * I just want to select colors from the swatch. And then while placing, then you can give me options of size"), and its
 * light one Strength, its reach following from it (W90; his: "we can replace reach and brightness with strength"). A tree
 * is two parts aligned on one axis: a trunk, a circle in section at one radius from its base to its tip, straight up to
 * where the bend starts and bent once from there along one continuous curve, with no reverse bend and no kink; and at
 * its tip a light emitting its colour, its Shape a closed tube wider than the trunk, its top and bottom covered (his),
 * following the trunk's tangent, or an allium's head, a ball of six-pointed star florets, each on its own thin stalk
 * from the ball's middle, where the trunk ends.
 *
 * A variant is a kind of tree: its trunk's colour, the range of its height (Length) and of its radius and its bend
 * radius, which follow its height (his: "the width of the tree to also be proportional to the height but with min and
 * max radius"), and its light's shape. The trees stand where he places them (W73), each an asset of a zone, one of the
 * variants, with its own height, picked from its variant's Length, its light's own colour, picked from the swatches
 * (`LIGHT_COLOURS`), both as it is placed on the Sectors page, and its own seed, which leans it its own way (`treeOf`);
 * the grove brush places many at a click (W82), all of one height and colour. This is the first type of tree; the next
 * types come later (his). Nothing here is three.js: `build-tree.ts` makes them. Version 4, the four colours and the
 * sizes drawn by the seed, is frozen (`tree-v4.ts`, `build-tree-v4.ts`), and version 5, the light's Brightness and Reach,
 * after it (`tree-v5.ts`, `build-tree-v5.ts`); version 3, the tube alone, before it
 * (`tree-v3.ts`, `build-tree-v3.ts`, its seeded grove `tree-grove-v3.ts`); version 2, the grove on this page, before
 * that (`tree-v2.ts`, `build-tree-v2.ts`); version 1, a few metres tall, first.
 */
export type TreeConfig = {
  /**
   * The trunk: its colour; the range of its radius, the range of its length (a tree's height, picked as it is placed),
   * where its bend starts, and the range of its bend radius, in metres. A tree's radius and bend radius follow its
   * height through their ranges.
   */
  trunkColour: string;
  radiusFrom: number;
  radiusTo: number;
  lengthFrom: number;
  lengthTo: number;
  bendAt: number;
  bendFrom: number;
  bendTo: number;
  /**
   * The light at the tip, its colour a placed tree's own (W86): its shape (W85); a tube's radius (wider than the trunk)
   * and length in metres; an allium's head radius in metres, how many florets it carries, how wide each is from point
   * to point in metres, its core's radius as a share of the head's, and how far its stalks and core are shaded from the
   * light's colour towards the trunk's (W86); and its light's Strength on what stands near, whichever its shape, its
   * reach following from it (W90: `reachOf`), 0 for no light. Kept as `lightBrightness`, the name version 5 kept it
   * under, so every variant's reads as it was.
   */
  lightShape: LightShape;
  lightRadius: number;
  lightLength: number;
  headRadius: number;
  florets: number;
  floretSize: number;
  core: number;
  stalkShade: number;
  lightBrightness: number;
};

/** The light's shapes (W85): the closed tube of the sheet, or an allium's head. */
export type LightShape = "cylinder" | "allium";

/** The sheet's blue: the light's colour as drawn, offered beside the world's swatches (as the mountain's bulb is). */
export const AWAKENING_BLUE = "#8ed8ff";

/** The lights' swatches (W86): the sheet's blue beside the world's colours, what a tree's light is picked from as it is placed. */
export const LIGHT_COLOURS = paletteWith({ value: AWAKENING_BLUE, colour: AWAKENING_BLUE, label: "Awakening blue" });

/**
 * His four light colours (W71: Awakening blue, Powder blush, Lavender and Cream), in his variant's order: what a tree
 * placed before version 5, which has no colour of its own, still draws its light's from by its seed, as version 4 drew
 * it (W86), so his world stands as it did.
 */
export const W71_LIGHTS = ["#8ed8ff", "#f6b9c9", "#a7aae6", "#f7f1f2"] as const;

/**
 * What versions 4 and 5 add to the light (W85, W86), for a tree kept without them: the tube every tree was, and the
 * allium's head as it starts (mine, at his tree's scale, a trunk 50 to 100 m long and a metre in radius): a ball 10 m
 * in radius of 200 florets, each 3 m across, so the stars close into a ball as a Globemaster's do (at 90 the head reads
 * as a dandelion's clock), round a core of seven tenths of its radius, its stalks and core shaded half way to the
 * trunk's colour.
 */
export const SHAPE_START: Pick<TreeConfig, "lightShape" | "headRadius" | "florets" | "floretSize" | "core" | "stalkShade"> = { lightShape: "cylinder", headRadius: 10, florets: 200, floretSize: 3, core: 0.7, stalkShade: 0.5 };

/**
 * What versions 5 and 6 let go of a tree's kept settings: its one trunk radius, now a range, and its four light colours,
 * now a placed tree's own (W86); its light's Reach, now its Strength's (W90).
 */
const LET_GO = ["trunkRadius", "lightColour", "lightColour2", "lightColour3", "lightColour4", "lightReach"];

/**
 * A tree's settings kept before version 6, read as version 6's: its one trunk Radius a range from it to it, so every
 * tree of it stands as wide as it did; its four light colours let go (W86); a light kept with Reach 0, which gave no
 * light, of Strength 0, so it still gives none (W90).
 */
export function upgraded(saved: unknown): unknown {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return saved;
  const kept: Record<string, unknown> = Object.fromEntries(Object.entries(saved).filter(([key]) => !LET_GO.includes(key)));
  const { trunkRadius, lightReach } = saved as { trunkRadius?: unknown; lightReach?: unknown };
  if (lightReach === 0) kept.lightBrightness = 0;
  return typeof trunkRadius === "number" && typeof kept.radiusFrom !== "number" ? { ...kept, radiusFrom: trunkRadius, radiusTo: trunkRadius } : kept;
}

/**
 * His variants of the tree (W72, W73): the published copy (`published.ts`), the first his tree of 2026-10-14 (W71; his
 * Copy: a Pale sage trunk a metre in radius, 50 to 100 m long, bent from its foot on a radius of 160 to 360 m; a light
 * 6 m in radius and 2 m long, brightness 5000, reach 100 m; its Strength 5000 now, W90). What the trees' page starts
 * from is the first. A variant kept before the allium (W85) has no Shape: it is read over `SHAPE_START`, a tube; one
 * kept before version 6 is `upgraded`, its radius a range of one, its Reach let go; so each stands as it did.
 */
export const TREE_VARIANTS: readonly Variant<TreeConfig>[] = PUBLISHED_TREES.map((variant) => ({ ...variant, settings: { ...SHAPE_START, ...(upgraded(variant.settings) as TreeConfig) } }));
export const TREE_START: TreeConfig = TREE_VARIANTS[0].settings;

/**
 * One tree as placed (W73, W86): where it stands, in metres from the world's middle; its trunk's length (its height),
 * radius, where its bend starts and its bend radius, in metres; the way it leans, in degrees round from east; its
 * light's colour; and its own seed.
 */
export type Tree = { x: number; z: number; length: number; radius: number; bendAt: number; bend: number; lean: number; colour: string; seed: number };

/**
 * The furthest a trunk's tip turns from upright, in degrees (mine): one continuous curve may bend past level, but never
 * curl back on itself. A bend radius too tight for the length past the bend's start is widened to this.
 */
export const TIP_TURN = 120;

/** How far the trunk enters the light, as a share of the light's length (mine, from the sheet's drawing). */
export const ENTRY = 0.25;

/** A height held within a variant's Length (W86): what a tree placed of it stands at. */
export const heightIn = (config: Pick<TreeConfig, "lengthFrom" | "lengthTo">, height: number) => Math.max(config.lengthFrom, Math.min(config.lengthTo, height));

/**
 * How far a height is along its variant's Length, 0 at its shortest and 1 at its tallest (W86): how far along their
 * ranges its radius and its bend radius are. A variant of one length stands at the middle of each.
 */
export function shareOf(config: Pick<TreeConfig, "lengthFrom" | "lengthTo">, height: number): number {
  const span = config.lengthTo - config.lengthFrom;
  return span > 0 ? Math.max(0, Math.min(1, (height - config.lengthFrom) / span)) : 0.5;
}

/**
 * A tree of a variant as placed (W73, W86): its height and its light's colour its own, picked as it was placed, the
 * height held within its variant's Length; its radius and its bend radius following its height through their ranges
 * (`shareOf`); standing where it is placed, leaning its way. A tree placed before version 5 has neither height nor
 * colour: its seed draws its length and its bend radius from the ranges and its light's colour from his four of W71
 * (`W71_LIGHTS`), as version 4 drew every tree, so his world stands as it did. A tree no longer than where its bend
 * starts stands straight.
 */
export function treeOf(config: TreeConfig, seed: number, x = 0, z = 0, lean = 0, own: { colour?: string; height?: number } = {}): Tree {
  let state = (Math.round(seed) >>> 0) || 1;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  // Version 4's draws, in its order, for a tree that has no height or colour of its own.
  const drawnLength = config.lengthFrom + random() * Math.max(0, config.lengthTo - config.lengthFrom);
  const drawnBend = config.bendFrom + random() * Math.max(0, config.bendTo - config.bendFrom);
  const drawnColour = W71_LIGHTS[Math.floor(random() * W71_LIGHTS.length)];
  const length = own.height === undefined ? drawnLength : heightIn(config, own.height);
  const share = shareOf(config, length);
  const bendAt = Math.max(0, Math.min(length, config.bendAt));
  const along = own.height === undefined ? drawnBend : config.bendFrom + share * (config.bendTo - config.bendFrom);
  const bend = Math.max(along, (length - bendAt) / (TIP_TURN * Math.PI / 180));
  const radius = config.radiusFrom + share * (config.radiusTo - config.radiusFrom);
  return { x, z, length, radius, bendAt, bend, lean, colour: own.colour ?? drawnColour, seed };
}

/**
 * One tree alone, on its page (W72, W86): at the world's middle, the middle of its Length, so of its radius and bend
 * radius too, its bend towards the east, its light Awakening blue, so what the card says is what stands there.
 */
export const studioTree = (config: TreeConfig): Tree => treeOf(config, 0, 0, 0, 0, { colour: AWAKENING_BLUE, height: (config.lengthFrom + config.lengthTo) / 2 });

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

/** How far the tip of a tree of this height turns, in degrees, its bend widened as `treeOf` widens it. */
const tipAt = (config: TreeConfig, height: number) => Math.round(Math.min(TIP_TURN, tipTurnOf(treeOf(config, 0, 0, 0, 0, { height }))));

export const TREES_JIG: Jig<TreeConfig> = {
  name: "Trees",
  version: 6,
  start: TREE_START,
  groups: [
    {
      title: "Trunk",
      note: (config) => `A smooth trunk, a circle in section at one radius from base to tip, straight up to where the bend starts and bent once from there along one continuous curve: no reverse bend, no kink. A tree's height is picked from Length as it is placed, on the Sectors page; its Radius and its Bend radius follow its height, the shortest tree the least of each and the tallest the most, in proportion between. This tree stands at the middle of each. One no longer than Bend starts stands straight, and a bend too tight for what is left is widened so the tip turns at most ${TIP_TURN}° from upright (the shortest tree's tip turns ${tipAt(config, config.lengthFrom)}° here, the tallest's ${tipAt(config, config.lengthTo)}°).`,
      controls: [
        { kind: "colour", key: "trunkColour", label: "Colour", options: COLOURS },
        { kind: "number", key: "radiusFrom", to: "radiusTo", label: "Radius", min: 0.5, max: 20, step: 0.5, marks: 5, unit: "m" },
        { kind: "number", key: "lengthFrom", to: "lengthTo", label: "Length", min: 50, max: 300, step: 5, marks: 50, unit: "m" },
        { kind: "number", key: "bendAt", label: "Bend starts", min: 0, max: 200, step: 5, marks: 50, unit: "m" },
        { kind: "number", key: "bendFrom", to: "bendTo", label: "Bend radius", min: 10, max: 400, step: 10, marks: 50, unit: "m" },
      ],
    },
    {
      title: "Light",
      note: (config) => `${config.lightShape === "allium"
        ? "An allium's head at the tip: a ball of six-pointed star florets, each on its own thin stalk from the ball's middle, spread evenly over it and facing out, the trunk entering it from below and ending at its middle, where the stalks start. Core is the inner ball's radius as a share of the head's; Stalk shade how far the stalks and the core are shaded from the light's colour towards the trunk's (0 the light's own, 1 the trunk's)."
        : "A closed tube at the tip, wider than the trunk, its top and bottom covered, following the trunk's tangent, the trunk entering it through the bottom a quarter of its length."} Its colour is a tree's own, picked from the light's swatches as the tree is placed, on the Sectors page; this tree's is Awakening blue. It emits its colour, and lights what stands near it by its Strength (0 for no light), the light weakening with the square of the distance${config.lightBrightness > 0 ? `: this one's reaches about ${Math.round(reachOf(config.lightBrightness))} m` : ""}.`,
      controls: [
        { kind: "choice", key: "lightShape", label: "Shape", options: [{ value: "cylinder", label: "Cylinder" }, { value: "allium", label: "Allium" }] },
        { kind: "number", key: "lightRadius", label: "Radius", min: 1, max: 30, step: 0.5, marks: 5, unit: "m" },
        { kind: "number", key: "lightLength", label: "Length", min: 2, max: 60, step: 1, marks: 10, unit: "m" },
        { kind: "number", key: "headRadius", label: "Head radius", min: 2, max: 40, step: 0.5, marks: 5, unit: "m" },
        { kind: "number", key: "florets", label: "Florets", min: 12, max: 400, step: 1, marks: 50 },
        { kind: "number", key: "floretSize", label: "Floret size", min: 0.5, max: 8, step: 0.1, marks: 1, unit: "m" },
        { kind: "number", key: "core", label: "Core", min: 0, max: 0.95, step: 0.05, marks: 0.25 },
        { kind: "number", key: "stalkShade", label: "Stalk shade", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "lightBrightness", label: "Strength", min: 0, max: 20000, step: 500, marks: 5000 },
      ],
    },
  ],
  copy: (config) => [`Settings JSON: ${JSON.stringify(config)}`],
};

/** Each light shape's own controls (W85, W86): the card shows a shape's alone, as the mountain's Glass shows its cap's. */
export const SHAPE_CONTROLS: Record<LightShape, readonly (keyof TreeConfig)[]> = {
  cylinder: ["lightRadius", "lightLength"],
  allium: ["headRadius", "florets", "floretSize", "core", "stalkShade"],
};

/**
 * An allium's florets (W85), where each points from the head's middle: unit directions spread evenly over the ball by
 * the golden angle (a Fibonacci sphere), from its top down to the edge of the opening the trunk comes up through, the
 * `opening`'s radius a share of the ball's (mine: no floret's stalk runs inside the trunk).
 */
export function floretsOf(count: number, opening: number): [number, number, number][] {
  const n = Math.max(0, Math.round(count));
  const bottom = -Math.sqrt(Math.max(0, 1 - Math.min(1, opening) ** 2));
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - ((i + 0.5) / n) * (1 - bottom);
    const round = Math.sqrt(Math.max(0, 1 - y * y));
    return [Math.cos(i * golden) * round, y, Math.sin(i * golden) * round];
  });
}

/** A tree's settings as something kept them, read against the jig, one kept before version 6 `upgraded`; nothing is null. */
export const treeConfigOf = (saved: unknown) => configOf(TREES_JIG, upgraded(saved));
