import { COLOURS } from "./colours";
import { configOf, type Jig } from "./jig";
import { PUBLISHED_PIPES } from "./published";
import type { Point } from "./skeleton";
import type { Variant } from "./variants";

/**
 * Frozen with World.md W93, where a pipe's look became its own, set as it is placed (`pipe.ts`, version 2); nothing
 * draws it, and only an old world's variant is read from it.
 *
 * The pipes, version 1 (World.md W84; his, 2026-10-15: "Pipes will have start and an end. I should be able to select or
 * like pick a start on the screen and then I can select the end. And then in between pipe will be formed. And for the
 * pipe, I should be able to decide the shape of it, like I should be able to mold it to any way that I want"). A pipe is
 * a tube of one radius along its skeleton (`skeleton.ts`): placed on the Sectors page by its start and its end, with
 * joints between, and shaped there by moving them; its look, the same along all of it, is this jig's, a variant of it
 * named and saved as every element's is (W72, W73). A joint is where the pipe's underside passes, so a pipe placed on a
 * floor lies on it. Nothing here is three.js: `build-skeletons.ts` makes it.
 */
export type PipeConfig = {
  /** Its colour, its radius in metres, and how glossy its surface is (0 matte, 1 a mirror's shine). */
  colour: string;
  radius: number;
  gloss: number;
};

/** His variants of the pipe (W73): the published copy (`published.ts`); the first is what its page starts from. */
export const PIPE_VARIANTS: readonly Variant<PipeConfig>[] = PUBLISHED_PIPES;
/** The first pipe (mine): Silver, a metre and a half in radius, a little glossy. */
const PIPE_DEFAULT: PipeConfig = { colour: "#c3c6cb", radius: 1.5, gloss: 0.3 };
export const PIPE_START: PipeConfig = { ...PIPE_DEFAULT, ...PIPE_VARIANTS[0]?.settings };

/**
 * One pipe alone on its page (W72, mine): from the west of the world's middle to its east, out to the south, up over
 * the middle and back, so a bend each way and a rise are in view as it is tuned.
 */
export const STUDIO_PIPE: readonly Point[] = [[-40, 0, 0], [-20, 0, 16], [0, 14, 0], [20, 4, -16], [40, 0, 0]];

export const PIPE_JIG: Jig<PipeConfig> = {
  name: "Pipes",
  version: 1,
  start: PIPE_START,
  groups: [
    {
      title: "Pipe",
      note: () => "A tube of one radius from its start to its end, along one smooth curve through every joint of its skeleton, closed at both ends. Pipes are placed and shaped on the Sectors page: Place with Pipe the item, click where it starts and where it ends, then drag its joints.",
      controls: [
        { kind: "colour", key: "colour", label: "Colour", options: COLOURS },
        { kind: "number", key: "radius", label: "Radius", min: 0.25, max: 20, step: 0.25, marks: 5, unit: "m" },
        { kind: "number", key: "gloss", label: "Gloss", min: 0, max: 1, step: 0.05, marks: 0.25 },
      ],
    },
  ],
  copy: (config) => [`Settings JSON: ${JSON.stringify(config)}`],
};

/** A pipe's settings as something kept them, read against the jig; nothing is null. */
export const pipeConfigOf = (saved: unknown) => configOf(PIPE_JIG, saved);
