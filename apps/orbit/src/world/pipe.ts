import { COLOURS } from "./colours";
import type { JigControl } from "./jig";
import { PIPE_VARIANTS } from "./pipe-v1";

/**
 * The pipes, version 3 (World.md W93, W94; his, 2026-10-15: "Pipes will have Color and Radius. The way we create pipes
 * is by placing start and then the sub sequent joints. The pipe will take share as we place the points. Let's remove
 * Portal because Pipes can be portals now"; asked where a pipe's look is set, he chose "As they are placed, like a
 * block"; then "I want option to delete face of pipe at start and/or end"). A pipe is a tube of one radius along its
 * skeleton (`skeleton.ts`), a joint a click, drawn on the Sectors page; its look is its own, its Colour, its Radius and
 * whether a face closes its start and its end, set on the item's card as it is placed and changed there once picked.
 * There are no variants and no page of its own: version 1's, a variant's look with a Gloss, is frozen (`pipe-v1.ts`),
 * and a pipe kept with a variant is read in that variant's colour and radius. Version 2 is version 3 with both faces,
 * so a pipe kept without them is closed at both ends. Nothing here is three.js: `build-skeletons.ts` makes it.
 */
export type PipeLook = {
  /** Its colour, and its radius in metres. */
  colour: string;
  radius: number;
  /** Whether a face closes it where it starts (its first joint) and where it ends (its last); without one it is open there. */
  startFace: boolean;
  endFace: boolean;
};

/** The pipes' version (W94): 3, its look its own, set as it is placed, each end's face kept or taken away. */
export const PIPE_VERSION = 3;

/** A pipe's least and most radius, in metres (W84's). */
export const PIPE_RADIUS = { least: 0.25, most: 20 } as const;

/** The first pipe (W84's, and his variant's): Silver, a metre and a half in radius, closed at both ends. */
export const PIPE_START: PipeLook = { colour: "#c3c6cb", radius: 1.5, startFace: true, endFace: true };

/** A pipe's look on the item's card: its Colour, its Start face and End face side by side (mine: a row of their own), and its Radius. */
export const PIPE_CONTROLS: readonly JigControl<PipeLook>[] = [
  { kind: "colour", key: "colour", label: "Colour", options: COLOURS },
  { kind: "switch", key: "startFace", label: "Start face" },
  { kind: "switch", key: "endFace", label: "End face" },
  { kind: "number", key: "radius", label: "Radius", min: PIPE_RADIUS.least, max: PIPE_RADIUS.most, step: 0.25, marks: 5, unit: "m" },
];

/** How a pipe's ends are, as a note says it: closed at both ends, open at its start or its end, or open at both. */
export function pipeEndsOf(look: PipeLook): string {
  if (look.startFace && look.endFace) return "closed at both ends";
  if (!look.startFace && !look.endFace) return "open at both ends";
  return look.startFace ? "open at its end" : "open at its start";
}

/** A pipe's look as kept, or none: a colour `#rrggbb` and a radius within its range; a face not kept is there (version 2's). */
export function pipeLookOf(kept: unknown): PipeLook | null {
  if (!kept || typeof kept !== "object") return null;
  const { colour, radius, startFace, endFace } = kept as Record<string, unknown>;
  if (typeof colour !== "string" || !/^#[0-9a-f]{6}$/i.test(colour) || typeof radius !== "number" || !Number.isFinite(radius)) return null;
  return { colour, radius: Math.max(PIPE_RADIUS.least, Math.min(PIPE_RADIUS.most, radius)), startFace: startFace !== false, endFace: endFace !== false };
}

/** A pipe kept with a variant of version 1 (W84 to W92): that variant's colour and radius, or the start's where it is gone. */
export function pipeLookOfVariant(id: unknown): PipeLook {
  const settings = PIPE_VARIANTS.find((variant) => variant.id === id)?.settings;
  return pipeLookOf(settings) ?? PIPE_START;
}
