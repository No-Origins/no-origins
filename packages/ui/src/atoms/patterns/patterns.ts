import type { Family } from "./generator";

/**
 * The pattern library (Patterns.md §6.0a; Admin.md §6.5b) — eighteen parameter sets the generator draws.
 *
 * **Six were measured for the portfolio widgets** and keep their names and their `words`. They moved here from
 * `apps/portfolio/src/content/sections.tsx` on 2026-09-11 because a document can only name something the package
 * exports (Scene-Schema.md §2). **Twelve more were added on 2026-09-14** on Bhargav's note — *"Let's have 18
 * pre defined illustrations"* — and are named for what shapes them rather than for a section, because a library
 * pattern belongs to no composition. They carry no `words`: the boxes a drawing must keep clear belong to the cell
 * it is placed in, and the editor measures them there and writes them back (Scene-Schema.md §3.6).
 *
 * Two of the fourteen parameters are **measurements**, which is why the six portfolio sets stay in code:
 *
 *   `flow`  — the direction the family travels, which decides how much of the cell the words cost.
 *             Read off `e2e/.mcp/flow.mjs` for the six; a dial, shown with its cost, for a pattern made in the editor.
 *   `words` — the text boxes the drawing must keep clear (principle 7). Read off `words.mjs`, measured on the
 *             rendered 304-square loud cell. Never typed.
 *
 * Every set here is a promise (§6.0a): change a number and a live picture changes. Adding one is cheap; a pattern
 * made in the editor lives in its document until it is promoted here by a commit.
 */
export type PatternName =
  // measured for the six portfolio sections
  | "status" | "work" | "cases" | "projects" | "interests" | "philosophy"
  // named for the device or the temperament that shapes them
  | "sweep" | "fan" | "waist" | "bloom" | "quicken" | "tide" | "hush" | "lean" | "swell" | "ridge" | "gather" | "arc";

export const patternNames: readonly PatternName[] = [
  "status", "work", "cases", "projects", "interests", "philosophy",
  "sweep", "fan", "waist", "bloom", "quicken", "tide", "hush", "lean", "swell", "ridge", "gather", "arc",
];

/** One line per pattern, for the picker's tooltip and the catalogue: what shapes it. */
export const patternNotes: Record<PatternName, string> = {
  status: "curl alone — a wide sweep, measured for the status widget",
  work: "taper — the family opens out along its travel",
  cases: "pinch — a waist mid-travel",
  projects: "no device, the widest breath — absence said by geometry",
  interests: "curl and tempo at half — the one that travels horizontally",
  philosophy: "high drift and spread — no two undulations agree",
  sweep: "curl at the top, nothing else — one long turn",
  fan: "full taper with a little curl — gathers at one edge, opens at the other",
  waist: "pinch in — squeezes through the middle and flares at both ends",
  bloom: "pinch out — flares in the middle and gathers at both ends",
  quicken: "tempo — calm at one edge, quick at the other",
  tide: "near-horizontal, a long curl, a slow change of pace",
  hush: "the widest breath and the least drift — a few lines, far apart",
  lean: "forty-five degrees and a tight breath — an angle costs lines, breath buys them back",
  swell: "spread at the top — the rhythm does all the work",
  ridge: "drift at the top with three waves — every line its own crest",
  gather: "taper and a pinch — the family closes toward one corner",
  arc: "curl at the top with a taper — a fan of arcs",
};

export const patterns: Record<PatternName, Family> = {
  // ── the six, measured for the portfolio widgets ──────────────────────────────────────────────────────────────
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

  // ── the twelve, named for what shapes them (2026-09-14) ──────────────────────────────────────────────────────
  // One device each where a device is the point, so the eighteen read as a map of the generator rather than as
  // eighteen moods of one setting. Seeds are spaced so no two families share a phase.
  sweep:   { seed: 21, flow: 96,  scale: 1.5, swing: 42, breath: 30, drift: 0.4,  spread: 0.5,  curl: 1 },
  fan:     { seed: 23, flow: 72,  scale: 1.4, swing: 44, breath: 26, drift: 0.45, spread: 0.5,  taper: 1, curl: 0.3 },
  waist:   { seed: 29, flow: 104, scale: 1.4, swing: 44, breath: 38, drift: 0.5,  spread: 0.5,  pinch: -0.8 },
  bloom:   { seed: 5,  flow: 80,  scale: 1.3, swing: 44, breath: 30, drift: 0.45, spread: 0.5,  pinch: 0.8 },
  quicken: { seed: 9,  flow: 90,  scale: 1.2, swing: 40, breath: 26, drift: 0.25, spread: 0.4,  tempo: 0.9 },
  tide:    { seed: 19, flow: 12,  scale: 1.3, swing: 44, breath: 30, drift: 0.5,  spread: 0.65, curl: 0.7, tempo: 0.3 },
  hush:    { seed: 31, flow: 120, scale: 2.2, swing: 36, breath: 52, drift: 0.2,  spread: 0.25 },
  lean:    { seed: 7,  flow: 45,  scale: 1.4, swing: 44, breath: 19, drift: 0.5,  spread: 0.6,  curl: 0.35 },
  swell:   { seed: 27, flow: 100, scale: 1.5, swing: 44, breath: 24, drift: 0.3,  spread: 1 },
  ridge:   { seed: 33, flow: 84,  scale: 1.4, swing: 48, breath: 26, waves: 3, drift: 1, spread: 0.3 },
  gather:  { seed: 41, flow: 60,  scale: 1.5, swing: 42, breath: 28, drift: 0.4,  spread: 0.5,  taper: 0.6, pinch: -0.5 },
  arc:     { seed: 37, flow: 135, scale: 1.6, swing: 40, breath: 32, drift: 0.35, spread: 0.45, curl: 1, taper: 0.4 },
};

/** @deprecated Renamed `PatternName` on 2026-09-14 (Admin.md §6.5b); alias removed next minor. */
export type FieldName = PatternName;
/** @deprecated Renamed `patterns`; alias removed next minor. */
export const fields = patterns;
/** @deprecated Renamed `patternNames`; alias removed next minor. */
export const fieldNames = patternNames;
