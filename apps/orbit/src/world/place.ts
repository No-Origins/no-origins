import { AREA_START, type Area } from "./area";
import type { NumberControl } from "./jig";
import { SPACING_LEAST, SPACING_MOST, spacingIn, type GroveSettings } from "./hierarchy";
import { PIPE_START, type PipeLook } from "./pipe";
import { ROAD_START, type RoadLook } from "./road";
import { TREE_LOOK_START, TRUNK_LENGTH, type TreeLook } from "./tree";

/**
 * Placing, on the Sectors page (World.md W73, option D, W82, W89, W91, W93; his: "we will not place anything in the world
 * explicitly", then "inside sectors, I will place the elements"): the builder's state, neither what is placed (the
 * world's data, `hierarchy.ts`) nor an element's tuning. Which variant of a mountain and of a human the next click
 * places (one remembered an element); which element, and into which sector, are the Sectors page's Build (`BuildState`'s
 * `item` and `sector`, `spaces.ts`); what the next one placed takes, set on the item's card on the right of the page
 * (W89): a pipe's look and a road's (W93; his: "As they are placed, like a block"), and a grove's area (W91), its trees'
 * look (W93: the trunk's colour and bend radius, the flower's shape and colours), its Spacing (W97), the shortest and tallest
 * its trees stand (1 to 100 m) and the seed the next is scattered by; and the placed element picked, if any, with the
 * joint of its skeleton picked, if it is a pipe or a road. Nothing here is three.js.
 */
export type PlaceState = {
  mountain: string;
  human: string;
  /** The next pipe's look and the next road's (W93). */
  pipeLook: PipeLook;
  roadLook: RoadLook;
  /** The next grove's (W89, W91, W93, W97): its area, its trees' look, its Spacing, its heights (`treeHeight` its shortest, `treeHeightTo` its tallest) and seed. */
  area: Area;
  treeLook: TreeLook;
  spacing: number;
  treeHeight: number;
  treeHeightTo: number;
  seed: number;
  picked: string | null;
  joint: number | null;
};

/**
 * Each element's first variant until one is picked; a pipe and a road in their starts; a grove 60 m square
 * (`AREA_START`) of his tree's look, its trees 32 m apart (W89's 10 a hectare, W97), 50 to 100 m tall, his tree's whole Length.
 */
export const PLACE_START: PlaceState = { mountain: "", human: "", pipeLook: PIPE_START, roadLook: ROAD_START, area: AREA_START, treeLook: TREE_LOOK_START, spacing: 32, treeHeight: 50, treeHeightTo: 100, seed: 1, picked: null, joint: null };

/** A grove's Length (his: "Trunk will have min and max lenth - from 1m to 100m"): one slider of two heads, the shortest and the tallest. */
export const LENGTH_CONTROL: NumberControl<{ treeHeight: number; treeHeightTo: number }> = { kind: "number", key: "treeHeight", to: "treeHeightTo", label: "Length", min: TRUNK_LENGTH.least, max: TRUNK_LENGTH.most, step: 1, marks: 10, unit: "m" };

/** A shortest and a tallest held within 1 to 100 m, the tallest never under the shortest. */
export function heightsIn(low: number, high: number): [number, number] {
  const held = (value: number) => Math.max(TRUNK_LENGTH.least, Math.min(TRUNK_LENGTH.most, Math.round(value)));
  const from = held(Math.min(low, high));
  return [from, Math.max(from, held(high))];
}

/** A grove's Spacing (W97, his pick, in place of W89's Density): how far apart its trees stand, a metre to fifty. */
export const SPACING_CONTROL: NumberControl<{ spacing: number }> = { kind: "number", key: "spacing", label: "Spacing", min: SPACING_LEAST, max: SPACING_MOST, step: 1, marks: 10, unit: "m" };

/** The next grove (W89, W91, W93, W97): the placing's numbers and look, its spacing and heights held in their ranges. */
export function nextGrove(state: PlaceState): Omit<GroveSettings, "at" | "y"> {
  const [heightFrom, heightTo] = heightsIn(state.treeHeight, state.treeHeightTo);
  return { area: state.area, look: state.treeLook, spacing: spacingIn(state.spacing), heightFrom, heightTo, seed: state.seed };
}

/** The next seed after a grove is planted, or Scatter anew: another scatter next time. */
export const nextSeed = (seed: number) => (seed + 1 + Math.floor(Math.random() * 9998)) % 10000;
