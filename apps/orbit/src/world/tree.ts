import { COLOURS, paletteWith } from "./colours";
import { choicesOf, coloursOf, type JigControl } from "./jig";
import { TREE_VARIANTS, type TreeConfig } from "./tree-v7";

/**
 * The trees, version 8 (World.md W93; his, 2026-10-15: "Trees will have trunk and flower. Trunk will have min and max
 * lenth - from 1m to 100m, color and bend radius. Flowers will now be Cube, Cylinder and Allium. They will not have
 * lights. They will just have colors. The sizes of the flower should be derived from size of trunk"; asked where a
 * tree's look is set, he chose "As they are placed, like a block"). A tree is two parts on one axis: a trunk, a circle
 * in section from its base to its tip, bent from its foot along one continuous curve, with no reverse bend and no kink;
 * and at its tip its flower, a cube, a closed cylinder on the trunk's tangent, or an allium's head (W85), a ball of
 * six-pointed star florets each on its own stalk from the ball's middle, where the trunk ends. The flower is a plain
 * colour lit by the world's sun and sky, as the trunk is: it emits nothing and lights nothing.
 *
 * A tree's look is its grove's (`TreeLook`), set on the item's card as the grove is planted and changed there once it is
 * picked: the trunk's Colour and Bend radius, and the flower's Shapes and Colours, several of each, each tree one shape
 * and one colour drawn by its own seed (W92's colours, W98's shapes). How tall its trees stand, the trunk's Length, lowest to highest, 1 to 100 m, is the grove's
 * too. Everything else follows from a tree's length (his: "derived from size of trunk"): its radius, its flower's size
 * and, the tallest bending on the Bend radius, each shorter one on its share of it, so every tree of a grove is the same
 * shape at its own size. There are no variants and no page of its own. Version 7, a variant's look with a light, is
 * frozen (`tree-v7.ts`, `build-tree-v7.ts`), and a grove or a tree kept with variants is read in its first variant's
 * look. Nothing here is three.js: `build-tree.ts` makes them.
 */

/**
 * The trees' version (W93, W98): 9, a grove's look its own, set as it is planted, its flowers of several shapes in plain
 * colours. Version 8, one shape, is version 9 with one picked, so nothing is frozen.
 */
export const TREES_VERSION = 9;

/** A flower's shape (his): a cube, a closed cylinder, or an allium's head. */
export type FlowerShape = "cube" | "cylinder" | "allium";
export const FLOWER_SHAPES: readonly { value: FlowerShape; label: string }[] = [
  { value: "cube", label: "Cube" },
  { value: "cylinder", label: "Cylinder" },
  { value: "allium", label: "Allium" },
];

/**
 * A tree's look: its trunk's colour and the bend radius of its grove's tallest tree, in metres; its flowers' shapes, one
 * at least, in `FLOWER_SHAPES`' order (W98); and their colours, the swatches' values, one at least, in the swatches'
 * order.
 */
export type TreeLook = { trunkColour: string; bendRadius: number; flowers: FlowerShape[]; colours: string[] };

/** The sheet's blue (W67), offered beside the world's swatches, as it was for the light. */
export const AWAKENING_BLUE = "#8ed8ff";

/** The flowers' swatches: the sheet's blue beside the world's colours (the light's of W86, W92). */
export const FLOWER_COLOURS = paletteWith({ value: AWAKENING_BLUE, colour: AWAKENING_BLUE, label: "Awakening blue" });

/** A trunk's least and most length, in metres (his: "from 1m to 100m"). */
export const TRUNK_LENGTH = { least: 1, most: 100 } as const;
/** The tallest tree's bend radius, least and most, in metres (mine: a 1 m tree may bend tight; W68's most). */
export const BEND_RADIUS = { least: 1, most: 400 } as const;

/**
 * How a tree's sizes follow its length (his: "derived from size of trunk"; *mine*, at his tree, Awakening light, 50 to
 * 100 m long and a metre in radius, its light 6 m in radius and 2 m long, its allium's head 10 m in radius of 3 m
 * florets, at its middle length, 75 m): the trunk's radius; a cube's side, as wide as his cylinder; a cylinder's radius
 * and length; an allium's head radius, its florets' size a share of the head, how many there are, its core's radius a
 * share of the head and how far its stalks and core are shaded towards the trunk's colour (W85's and W86's starts).
 */
export const SIZES = {
  trunk: 1 / 75,
  cube: 0.16,
  cylinder: { radius: 0.08, length: 0.027 },
  allium: { head: 0.133, floret: 0.3, florets: 200, core: 0.7, stalkShade: 0.5 },
} as const;

/** How far the trunk enters a cylinder or a cube, as a share of its length (W67's, from the sheet's drawing). */
export const ENTRY = 0.25;

/**
 * The furthest a trunk's tip turns from upright, in degrees (W68's): one continuous curve may bend past level, but never
 * curl back on itself. A bend radius too tight for the trunk's length is widened to this.
 */
export const TIP_TURN = 120;

/**
 * His tree as a look (W71, W92): Awakening light's Pale sage trunk, bending on 360 m at its tallest (its range was 160
 * to 360 m over 50 to 100 m, so a tree half as tall now bends on 180 m), its flower its light's shape, a cylinder, in
 * its four colours.
 */
export const TREE_LOOK_START: TreeLook = lookOfVariant(TREE_VARIANTS[0]?.settings);

/** A look from a variant of version 7 (W72 to W92): its trunk's colour, its tallest bend, its light's shape and colours. */
export function lookOfVariant(config: TreeConfig | undefined): TreeLook {
  if (!config) return { trunkColour: "#b9c4a6", bendRadius: 360, flowers: ["cylinder"], colours: [AWAKENING_BLUE] };
  const colours = coloursOf(FLOWER_COLOURS, config.lightColours);
  return { trunkColour: config.trunkColour, bendRadius: within(config.bendTo, BEND_RADIUS), flowers: [config.lightShape === "allium" ? "allium" : "cylinder"], colours: colours.length ? colours : [AWAKENING_BLUE] };
}

/** The look of a variant of version 7 by its id, the published copy's; his tree's where it is gone. */
export const lookOfVariantId = (id: unknown): TreeLook => {
  const variant = TREE_VARIANTS.find((candidate) => candidate.id === id);
  return variant ? lookOfVariant(variant.settings) : TREE_LOOK_START;
};

/** The Length a variant of version 7 held (W86), for a tree kept with one: its shortest and tallest, held within version 8's. */
export const lengthsOfVariantId = (id: unknown): [number, number] => {
  const config = TREE_VARIANTS.find((candidate) => candidate.id === id)?.settings ?? TREE_VARIANTS[0]?.settings;
  if (!config) return [50, 100];
  const from = within(config.lengthFrom, TRUNK_LENGTH);
  return [from, Math.max(from, within(config.lengthTo, TRUNK_LENGTH))];
};

/** A value held within a range (a function, so the start above may use it as the module loads). */
function within(value: number, range: { least: number; most: number }) {
  return Math.max(range.least, Math.min(range.most, value));
}

/**
 * A look as kept, or none: a trunk colour, a bend radius, the flowers' shapes and colours, each read against its range;
 * a look kept before W98 with one shape (`flower`) reads as that shape alone.
 */
export function treeLookOf(kept: unknown): TreeLook | null {
  if (!kept || typeof kept !== "object") return null;
  const { trunkColour, bendRadius, flowers, flower, colours } = kept as Record<string, unknown>;
  if (typeof trunkColour !== "string" || !/^#[0-9a-f]{6}$/i.test(trunkColour) || typeof bendRadius !== "number" || !Number.isFinite(bendRadius)) return null;
  const shapes = choicesOf(FLOWER_SHAPES, Array.isArray(flowers) ? flowers : [flower]);
  const picked = coloursOf(FLOWER_COLOURS, colours);
  if (!shapes.length || !picked.length) return null;
  return { trunkColour, bendRadius: within(bendRadius, BEND_RADIUS), flowers: shapes, colours: picked };
}

/**
 * One tree as it stands: where, in metres from the world's middle; its trunk's length (its height), radius, where its
 * bend starts (its foot: his tree bent from it) and its bend radius, in metres; the way it leans, in degrees round from
 * east; its flower's shape and colour; and its own seed.
 */
export type Tree = { x: number; z: number; length: number; radius: number; bendAt: number; bend: number; lean: number; flower: FlowerShape; colour: string; seed: number };

/**
 * A tree of a look (W93): its length its own, within 1 to 100 m; its radius and its bend following its length, the
 * tallest of its grove (`tallest`) bending on the look's Bend radius and a shorter one on its share of it, widened where
 * it would turn its tip past `TIP_TURN`; its flower one of the look's colours, drawn by its seed as version 7 drew it
 * (W92), unless it was given one of its own as it was placed (W86's brush), which it keeps; and one of the look's shapes
 * (W98), drawn by its seed after the colour, so a tree's colour stays what it was and shapes and colours mix freely.
 */
export function treeOf(look: TreeLook, seed: number, x: number, z: number, lean: number, height: number, tallest: number, own: { colour?: string } = {}): Tree {
  let state = (Math.round(seed) >>> 0) || 1;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  // Version 4's draws, in its order, so a tree's colour stays what it was: its length and bend (unused now), its colour.
  random();
  random();
  const colours = look.colours.length ? look.colours : [AWAKENING_BLUE];
  const drawn = colours[Math.min(colours.length - 1, Math.floor(random() * colours.length))];
  const shapes = look.flowers.length ? look.flowers : (["cylinder"] as const);
  const flower = shapes[Math.min(shapes.length - 1, Math.floor(random() * shapes.length))];
  const length = within(height, TRUNK_LENGTH);
  const bend = Math.max((look.bendRadius * length) / Math.max(length, tallest), length / ((TIP_TURN * Math.PI) / 180));
  return { x, z, length, radius: length * SIZES.trunk, bendAt: 0, bend, lean, flower, colour: own.colour ?? drawn, seed };
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

/** How far the tip of a grove's tallest tree turns, in degrees, its bend widened as `treeOf` widens it. */
export const tallestTurnOf = (look: TreeLook, tallest: number) => Math.round(Math.min(TIP_TURN, tipTurnOf(treeOf(look, 0, 0, 0, 0, tallest, tallest))));

/** A trunk's look on the item's card: its Colour, and the tallest tree's Bend radius. */
export const TRUNK_CONTROLS: readonly JigControl<TreeLook>[] = [
  { kind: "colour", key: "trunkColour", label: "Colour", options: COLOURS },
  { kind: "number", key: "bendRadius", label: "Bend radius", min: BEND_RADIUS.least, max: BEND_RADIUS.most, step: 1, marks: 50, unit: "m" },
];

/** A flower's look on the item's card: its Shapes, several (W98), and its Colours, several. */
export const FLOWER_CONTROLS: readonly JigControl<TreeLook>[] = [
  { kind: "choices", key: "flowers", label: "Shapes", options: FLOWER_SHAPES },
  { kind: "colours", key: "colours", label: "Colours", options: FLOWER_COLOURS },
];

/**
 * An allium's florets (W85), where each points from the head's middle: unit directions spread evenly over the ball by
 * the golden angle (a Fibonacci sphere), from its top down to the edge of the opening the trunk comes up through, the
 * `opening`'s radius a share of the ball's (no floret's stalk runs inside the trunk).
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
