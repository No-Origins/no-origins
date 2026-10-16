import type { MountainFoot } from "./mountains";
import { WORLD_SIZE } from "./orbit";
import { TIP_TURN, type TreeConfig } from "./tree-v3";

/**
 * The grove of the trees' version 3, frozen (World.md W71, W72, W73): the Environment's placement, seeded, gathering at
 * the mountains' feet, from which the start world's trees were placed once (`published.ts`). Nothing draws from it:
 * the trees are placed by hand now, assets of a zone (W73).
 */
export type GroveSettings = {
  treeCount: number;
  treeSpacing: number;
  treeGathering: number;
  treeSkirt: number;
  treeSpread: number;
  treeClearing: number;
  treeSeed: number;
};

export type GroveTree = { x: number; z: number; length: number; bendAt: number; bend: number; lean: number; variant: number; colour: string; seed: number };

export const MOST_TREES = 200;
const FOOT_MARGIN = 2;

const drawTree = (config: TreeConfig, random: () => number) => {
  const length = config.lengthFrom + random() * Math.max(0, config.lengthTo - config.lengthFrom);
  const bendAt = Math.max(0, Math.min(length, config.bendAt));
  const drawn = config.bendFrom + random() * Math.max(0, config.bendTo - config.bendFrom);
  const bend = Math.max(drawn, (length - bendAt) / (TIP_TURN * Math.PI / 180));
  const colours = [config.lightColour, config.lightColour2, config.lightColour3, config.lightColour4];
  return { length, bendAt, bend, colour: colours[Math.floor(random() * colours.length)] };
};

export function treesOf(grove: GroveSettings, variants: readonly TreeConfig[], feet: readonly MountainFoot[] = []): GroveTree[] {
  if (!variants.length) return [];
  let state = (Math.round(grove.treeSeed) >>> 0) || 1;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const count = Math.max(0, Math.min(MOST_TREES, Math.round(grove.treeCount)));
  const edge = WORLD_SIZE.diameter / 2 - 20;
  const spread = Math.min(grove.treeSpread, edge);
  const spacing = Math.max(0, grove.treeSpacing);
  const clearing = Math.max(0, grove.treeClearing);
  const gathering = feet.length ? Math.max(0, Math.min(1, grove.treeGathering)) : 0;
  const skirt = Math.max(0, grove.treeSkirt);
  const radius = Math.max(...variants.map((variant) => variant.trunkRadius));
  const trees: GroveTree[] = [];
  for (let tries = count * 40; trees.length < count && tries > 0; tries--) {
    const angle = random() * Math.PI * 2;
    let x: number, z: number;
    if (random() < gathering) {
      const foot = feet[Math.floor(random() * feet.length)];
      const out = foot.radius + FOOT_MARGIN + radius + skirt * random() ** 2;
      x = foot.x + Math.cos(angle) * out;
      z = foot.z + Math.sin(angle) * out;
    } else {
      const distance = Math.sqrt(random()) * spread;
      x = Math.cos(angle) * distance;
      z = Math.sin(angle) * distance;
    }
    const distance = Math.hypot(x, z);
    if (distance < clearing || distance > edge - radius) continue;
    if (feet.some((foot) => Math.hypot(foot.x - x, foot.z - z) < foot.radius + FOOT_MARGIN + radius)) continue;
    if (trees.some((tree) => Math.hypot(tree.x - x, tree.z - z) < spacing)) continue;
    const variant = Math.floor(random() * variants.length);
    const drawn = drawTree(variants[variant], random);
    trees.push({ x, z, ...drawn, lean: random() * 360, variant, seed: Math.floor(random() * 10000) });
  }
  return trees;
}
