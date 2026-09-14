import type { Family } from "./generator";

/**
 * The six field families (Illustrations.md §6.0a) — the parameter sets the live widgets are drawn from.
 *
 * **These moved here from `apps/portfolio/src/content/sections.tsx` on 2026-09-11.** They had to: a document can
 * only name something the package exports (Scene-Schema.md §2), so while the parameters lived in the app, an
 * illustration could be placed in hand-written TSX and never authored in the editor.
 *
 * Two of the fourteen parameters are **measurements, not choices**, and that is why the whole set stays in code
 * rather than becoming fourteen sliders in an inspector (§3.6):
 *
 *   `flow`  — the direction the family travels, which decides how much of the cell the words cost.
 *             Read off `e2e/.mcp/flow.mjs`. Never estimated; it has already cost a round.
 *   `words` — the text boxes the drawing must keep clear (principle 7). Read off `words.mjs`, measured on the
 *             rendered 304-square loud cell.
 *
 * **`words` is measured against a PARTICULAR composition**, which is the catch. The boxes below are true for the
 * six portfolio widgets as composed today — a mono eyebrow top-left, a figure or word bottom-left. Recompose a
 * cell and they are wrong, so under free composition `words` becomes something the editor measures and writes
 * back, exactly as it does a panel height (Admin.md §6.3), with `probe10` checking the result.
 */
export type FieldName = "status" | "work" | "cases" | "projects" | "interests" | "philosophy";

export const fieldNames: readonly FieldName[] = ["status", "work", "cases", "projects", "interests", "philosophy"];

export const fields: Record<FieldName, Family> = {
  // curl alone — a wide sweep. Off its cheapest angle by twelve degrees, bought by shortening the caption.
  status: {
    seed: 4, flow: 105, scale: 1.5, swing: 42, breath: 24, drift: 0.4, spread: 0.5, curl: 0.85,
    words: [[16, 15, 56, 28], [16, 105, 91, 224]],
  },
  // taper — the family opens out along its travel, four roles going somewhere.
  work: {
    seed: 7, flow: 90, scale: 1.5, swing: 44, breath: 28, drift: 0.4, spread: 0.45, taper: 0.8,
    words: [[16, 15, 42, 28], [16, 105, 69, 224]],
  },
  // pinch — a waist mid-travel. The longest caption of the six, so the cheapest angle mattered most here.
  cases: {
    seed: 2, flow: 58, scale: 1.0, swing: 44, breath: 22, drift: 0.5, spread: 0.5, pinch: -0.8,
    words: [[16, 15, 95, 28], [16, 105, 155, 224]],
  },
  // no device at all, and the widest breath of the six: an empty section, said by geometry.
  projects: {
    seed: 17, flow: 90, scale: 2.4, swing: 38, breath: 46, drift: 0.3, spread: 0.35,
    words: [[16, 15, 69, 28], [16, 105, 134, 224]],
  },
  // curl + tempo, both at half — the only one that travels horizontally.
  interests: {
    seed: 11, flow: 0, scale: 1.2, swing: 44, breath: 24, drift: 0.5, spread: 0.55, curl: 0.5, tempo: 0.5,
    words: [[16, 15, 75, 28], [16, 140, 217, 236]],
  },
  // temperament rather than a device: high drift and spread, so no two undulations agree.
  philosophy: {
    seed: 13, flow: 68, scale: 1.7, swing: 42, breath: 26, drift: 0.9, spread: 0.75,
    words: [[16, 15, 82, 28], [16, 140, 135, 236]],
  },
};
