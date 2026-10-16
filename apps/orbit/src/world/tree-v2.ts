// Trees version 2, frozen (World.md W72); nothing draws this.
import { COLOURS } from "./colours";
import type { Jig } from "./jig";
import type { MountainFoot } from "./mountains";
import { WORLD_SIZE } from "./orbit";

/**
 * The trees, version 2: the awakening light (World.md W67; his sheet, 2026-10-13: "We need this sort of trees (these
 * are 1 type of many trees we will create later) in the orbit"), at his size (W68: "For trunk length, I want range from
 * 100 to 150 m. The bend should start only above 100m. Adjust remaining accordingly"). A tree is two parts aligned on
 * one axis: a white trunk, a circle in section at one radius from its base to its tip, straight up to where the bend
 * starts (50 m, his) and bent once from there along one continuous curve, with no reverse bend and no kink; and at its tip a light,
 * a closed tube wider than the trunk, its top and bottom covered (his, 2026-10-14: the sheet drew it open), following
 * the trunk's tangent and emitting blue. What
 * varies from tree to tree is the sheet's: the trunk's length, its bend radius and the way it leans; they stand in a
 * natural, park-like scatter, their feet in the base gas and their lights above it.
 *
 * The grove is many, and gathers at the mountains (World.md W71; his, 2026-10-14: "place the trees in such a way that
 * they are lot of trees and they should tend to grow around mountains more"): most of the trees grow round a
 * mountain's foot, thickest beside it and thinning outwards, and the rest stand in the open; and the lights are four
 * colours (his: "use Awakening blue, Powder blush, Lavender and cream colors for light"), each tree's drawn from them
 * by the seed.
 *
 * This is the first type of tree; the next types come later (his). Nothing here is three.js: `build-tree.ts` makes
 * them. The page is `/build/trees`. Version 1, a few metres tall, is frozen (`tree-v1.ts`, `build-tree-v1.ts`); the
 * rest of these starting values are mine, scaled to his length, his to tune.
 */
export type TreesConfig = {
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
  /**
   * The grove: how many trees, the clear gap between them, how far from the world's middle the open ones stand, the
   * clearing at the middle, the share that grows at the mountains and how far out from a mountain's foot they stand
   * (W71), and the seed.
   */
  count: number;
  spacing: number;
  spread: number;
  clearing: number;
  gathering: number;
  skirt: number;
  seed: number;
};

/** The sheet's blue: the light's colour as drawn, offered beside the world's swatches (as the mountain's bulb is). */
export const AWAKENING_BLUE = "#8ed8ff";

/**
 * His trunk and light (World.md W71; his Copy of 2026-10-14): a Pale sage trunk a metre in radius, 50 to 100 m long,
 * bent from its foot on a radius of 160 to 360 m; a light 6 m in radius and 2 m long, brightness 5000, reach 100 m;
 * and the Spread, Clearing and seed as his Copy sent them. His four light colours as he named them (Awakening blue,
 * Powder blush, Lavender, Cream). The grove's Count, Spacing, Gathering and Skirt are mine for "lot of trees … around
 * mountains" (his Copy's Count 10 and Spacing 60 were his tuning from before that); his to tune.
 */
export const TREES_START: TreesConfig = {
  trunkColour: "#cdd4c3",
  trunkRadius: 1,
  lengthFrom: 50,
  lengthTo: 100,
  bendAt: 0,
  bendFrom: 160,
  bendTo: 360,
  lightColour: AWAKENING_BLUE,
  lightColour2: "#f6b9c9",
  lightColour3: "#a7aae6",
  lightColour4: "#f7f1f2",
  lightRadius: 6,
  lightLength: 2,
  lightBrightness: 5000,
  lightReach: 100,
  count: 120,
  spacing: 40,
  spread: 250,
  clearing: 40,
  gathering: 0.8,
  skirt: 150,
  seed: 7,
};

/**
 * One tree of the grove: where it stands, in metres from the world's middle; its trunk's length, where its bend starts
 * and its bend radius, in metres; the way it leans, in degrees round from east; its light's colour, one of the four;
 * and its own seed.
 */
export type Tree = { x: number; z: number; length: number; bendAt: number; bend: number; lean: number; colour: string; seed: number };

/** The most trees a grove holds, whatever the Count: a light a tree is the cost (W67, Open). */
export const MOST_TREES = 200;

/** The clear air between a mountain's foot and the nearest tree's, in metres (mine): a trunk never leaves a mountain's body. */
const FOOT_MARGIN = 2;

/** His mountains' feet (W71), what the grove gathers round where no page is tuning them; worked out once. */
// Frozen (World.md W72): version 3 tunes one tree alone and places the grove from the Environment; nothing draws this.
export const HIS_FEET = (): MountainFoot[] => [];

/**
 * The furthest a trunk's tip turns from upright, in degrees (mine): one continuous curve may bend past level, but never
 * curl back on itself. A bend radius too tight for the length past the bend's start is widened to this.
 */
export const TIP_TURN = 120;

/** How far the trunk enters the light, as a share of the light's length (mine, from the sheet's drawing). */
export const ENTRY = 0.25;

/**
 * The trees, placed from the seed round the mountains' feet (W71): each candidate is drawn, by the Gathering, at a
 * mountain's foot, a mountain picked at random, standing from the clear air beside its body out to the Skirt and
 * thickest beside it (the distance out is drawn squared, so the grove thins as it goes); the rest at random within the
 * Spread of the world's middle. Each is kept only where it stands at least the Spacing from every tree kept before it,
 * the Clearing from the world's middle, out of every mountain's body and inside the world, until the Count stands or
 * the candidates run out. Each draws its light's colour from the four. The same seed places the same trees; Count 0
 * is no trees; with no mountains, every tree stands in the open. A tree no longer than where the bend starts stands
 * straight.
 */
export function treesOf(config: TreesConfig, feet: readonly MountainFoot[] = []): Tree[] {
  let state = (Math.round(config.seed) >>> 0) || 1;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const count = Math.max(0, Math.min(MOST_TREES, Math.round(config.count)));
  const edge = WORLD_SIZE.diameter / 2 - 20;
  const spread = Math.min(config.spread, edge);
  const spacing = Math.max(0, config.spacing);
  const clearing = Math.max(0, config.clearing);
  const gathering = feet.length ? Math.max(0, Math.min(1, config.gathering)) : 0;
  const skirt = Math.max(0, config.skirt);
  const colours = [config.lightColour, config.lightColour2, config.lightColour3, config.lightColour4];
  const trees: Tree[] = [];
  for (let tries = count * 40; trees.length < count && tries > 0; tries--) {
    const angle = random() * Math.PI * 2;
    let x: number, z: number;
    if (random() < gathering) {
      const foot = feet[Math.floor(random() * feet.length)];
      const out = foot.radius + FOOT_MARGIN + config.trunkRadius + skirt * random() ** 2;
      x = foot.x + Math.cos(angle) * out;
      z = foot.z + Math.sin(angle) * out;
    } else {
      const distance = Math.sqrt(random()) * spread;
      x = Math.cos(angle) * distance;
      z = Math.sin(angle) * distance;
    }
    const distance = Math.hypot(x, z);
    if (distance < clearing || distance > edge - config.trunkRadius) continue;
    if (feet.some((foot) => Math.hypot(foot.x - x, foot.z - z) < foot.radius + FOOT_MARGIN + config.trunkRadius)) continue;
    if (trees.some((tree) => Math.hypot(tree.x - x, tree.z - z) < spacing)) continue;
    const length = config.lengthFrom + random() * Math.max(0, config.lengthTo - config.lengthFrom);
    const bendAt = Math.max(0, Math.min(length, config.bendAt));
    const drawn = config.bendFrom + random() * Math.max(0, config.bendTo - config.bendFrom);
    const bend = Math.max(drawn, (length - bendAt) / (TIP_TURN * Math.PI / 180));
    const colour = colours[Math.floor(random() * colours.length)];
    trees.push({ x, z, length, bendAt, bend, lean: random() * 360, colour, seed: Math.floor(random() * 10000) });
  }
  return trees;
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
const LIGHT_COLOURS = [{ value: AWAKENING_BLUE, colour: AWAKENING_BLUE, label: "Awakening blue" }, ...COLOURS];

export const TREES_JIG: Jig<TreesConfig> = {
  name: "Trees",
  version: 2,
  start: TREES_START,
  groups: [
    {
      title: "Trunk",
      note: (config) => `A smooth trunk, a circle in section at one radius from base to tip, straight up to where the bend starts and bent once from there along one continuous curve: no reverse bend, no kink. Each tree draws its length and its bend radius from these ranges and leans its own way; one no longer than Bend starts stands straight, and a bend too tight for what is left is widened so the tip turns at most ${TIP_TURN}° from upright (the tip turns ${Math.round(tipTurnOf({ length: config.lengthFrom, bendAt: config.bendAt, bend: config.bendTo }))}° to ${Math.round(Math.min(TIP_TURN, tipTurnOf({ length: config.lengthTo, bendAt: config.bendAt, bend: config.bendFrom })))}° here).`,
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
      note: () => "A closed tube at the tip, wider than the trunk, its top and bottom covered, following the trunk's tangent, the trunk entering it through the bottom a quarter of its length. Each tree's light is one of the four colours, drawn by the seed; it emits its colour, and lights what stands within Reach (0 for no light).",
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
    {
      title: "Grove",
      note: (config) => {
        const feet = HIS_FEET();
        const trees = treesOf(config, feet);
        const gathered = trees.filter((tree) => feet.some((foot) => Math.hypot(foot.x - tree.x, foot.z - tree.z) < foot.radius + FOOT_MARGIN + config.trunkRadius + config.skirt)).length;
        return `${trees.length} of ${config.count} trees stand, ${gathered} of them at the ${feet.length} mountains' feet: Gathering is the share that grows round a mountain, thickest beside it and thinning out to the Skirt; the rest stand within the Spread of the world's middle, in a natural, park-like scatter. None is nearer than Spacing to another, within the Clearing at the middle, where the visitor starts, or in a mountain's body. Randomize draws another scatter; the seed keeps it. Each tree carries a light.`;
      },
      controls: [
        { kind: "number", key: "count", label: "Count", min: 0, max: MOST_TREES, step: 1, marks: 50 },
        { kind: "number", key: "spacing", label: "Spacing", min: 10, max: 300, step: 10, marks: 50, unit: "m" },
        { kind: "number", key: "gathering", label: "Gathering", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "skirt", label: "Skirt", min: 0, max: 400, step: 10, marks: 100, unit: "m" },
        { kind: "number", key: "spread", label: "Spread", min: 50, max: 400, step: 10, marks: 100, unit: "m" },
        { kind: "number", key: "clearing", label: "Clearing", min: 0, max: 200, step: 10, marks: 50, unit: "m" },
        { kind: "number", key: "seed", label: "Seed", min: 0, max: 9999, step: 1, marks: 1000 },
      ],
    },
  ],
  copy: (config) => [
    `Trees: ${treesOf(config, HIS_FEET()).map((tree) => `(${tree.x.toFixed(0)}, ${tree.z.toFixed(0)}) ${tree.length.toFixed(0)} m, bent from ${tree.bendAt.toFixed(0)} m at ${tree.bend.toFixed(0)} m, lean ${Math.round(tree.lean)}°, ${LIGHT_COLOURS.find((option) => option.value === tree.colour)?.label ?? tree.colour}`).join("; ")}`,
    `Settings JSON: ${JSON.stringify(config)}`,
  ],
};
