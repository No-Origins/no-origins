import { AGENT_BODY } from "@no-origins/ui/lib/agent-body";
import { AGENT_FACE } from "@no-origins/ui/lib/agent-face";
import { SPHERE_SIDED } from "@no-origins/ui/lib/sphere-motion";
import type { MotionState } from "@no-origins/ui/lib/motion-states";

import type { Family, FamilyPart } from "./families";
import { SPHERE_FAMILY, SPHERE_START_VALUES } from "./sphere";

/**
 * **The agent's motions** (Motion.md M20, his model of a motion, 2026-09-30; built the same night, his "Yes"): *"a
 * motion will have master timeline … add a motion which is 0.5 seconds of eyes and then the body movement might take for
 * three seconds … put this eyes motion somewhere in between 0.5 and one second so only those properties that I change of
 * the eyes will merge … now that full thing will become one motion."*
 *
 * M19's bench on the agent, beside its page of jigs, not in place of them: the Agent page tunes its version; this one
 * plays motions on it. A motion is a tab — a name, a window, the parts it ticks — of rows, each a part's settings over
 * a span (only the ones moved on it) or another motion placed at its own length, linked; the higher row wins only where
 * both set a value. **Its parts are the agent's own**: Body, and each slot of its face, their controls the declarations'
 * (`AGENT_BODY`, `AGENT_FACE`). **Everything stands on the agent's version** as the Agent page has it tuned
 * (`restFrom`), so a row changes only what it sets.
 *
 * **A Body row that sets Columns or Rows is a hop** that many cells from wherever it sits, at the row's start and at its
 * own speed (his: "keep its speed"), the rest of the span its landing and rest; a hop still in the air when the next
 * would start goes first. Whatever else a Body row sets, that hop leaps with. **Played on its own, a motion stops on its
 * last frame** (his: "for now we will stop on its last frame").
 */

const camel = (id: string) => id.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

/** A part of the agent: Body is every group of its body; each slot of its face is a part of its own. */
const PARTS: FamilyPart[] = [
  { id: "body", label: "Body", tokens: AGENT_BODY.flatMap((g) => g.settings.map((s) => `--motion-sphere-${s.id}`)), ease: "ease-in-out" },
  ...AGENT_FACE.map((slot) => ({
    id: slot.id,
    label: slot.label,
    tokens: [...(slot.style ? [slot.style] : []), ...slot.settings].map((s) => `--motion-sphere-${s.id}`),
    ease: "ease-in-out",
    // A pair's right side, set apart (his, 2026-09-30: "I want to fix the mirror pairs"): the settings the model sides.
    ...(slot.paired ? { sided: slot.settings.filter((s) => (SPHERE_SIDED as readonly string[]).includes(camel(s.id))).map((s) => `--motion-sphere-${s.id}`) } : {}),
  })),
];


/** What is never eased between rows: a choice or a colour switches at a row's start; a hop is a jump, not a slide. */
const DISCRETE = new Set(
  [...AGENT_BODY.flatMap((g) => g.settings), ...AGENT_FACE.flatMap((s) => [...(s.style ? [s.style] : []), ...s.settings])]
    .filter((p) => p.type === "choice" || p.type === "colour" || p.type === "switch" || p.type === "drawing")
    .map((p) => `--motion-sphere-${p.id}`)
    .concat(["--motion-sphere-columns", "--motion-sphere-rows", "--motion-sphere-blink-every", "--motion-sphere-blink"]),
);

/**
 * Version 1 starts from the Agent page's play, written as a motion (M19's rule: "nothing a bench does now is lost the day
 * it lands"): a hop to the nest one column across and six rows down, a hold, and the hop back. His motions are his to make.
 */
const HOP: MotionState = {
  id: "hop",
  name: "Hop",
  event: "start",
  start: 0,
  end: 4000,
  unit: "ms",
  parts: ["body"],
  rows: [
    { id: "hop-there", kind: "part", part: "body", start: 0, end: 1600, ease: "ease-in-out", values: { "--motion-sphere-columns": 1, "--motion-sphere-rows": 6 }, locked: false },
    { id: "hop-back", kind: "part", part: "body", start: 2200, end: 3800, ease: "ease-in-out", values: { "--motion-sphere-columns": -1, "--motion-sphere-rows": -6 }, locked: false },
  ],
};

export const AGENT_MOTIONS_FAMILY: Family = {
  id: "motions",
  label: "Agent motions",
  title: "What your guide does",
  touches:
    "Motions on the agent: each a timeline of rows, a part's settings over a span or another motion placed in it, the higher winning where two set the same thing. A Body row that sets Columns or Rows is a hop.",
  hint: "Add a row for a part, move its controls, and press Play.",
  block: SPHERE_FAMILY.block,
  version: 1,
  tokens: SPHERE_FAMILY.tokens,
  presets: [
    {
      id: "A",
      name: "Version 1",
      why: "The agent's timeline (Motion.md M20): motions made of rows on its parts, placed in each other, standing on the Agent page's version as it is tuned.",
      risk: "Body values other than a hop's are read at a hop's start and held through it. Right sides set apart have no controls yet.",
      values: SPHERE_START_VALUES,
    },
  ],
  machine: {
    parts: PARTS,
    start: [HOP],
    rest: SPHERE_START_VALUES,
    restFrom: "sphere",
    saved: "database",
    discrete: DISCRETE,
    events: ["start"],
  },
};
