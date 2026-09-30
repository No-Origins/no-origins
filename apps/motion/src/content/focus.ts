import type { Family, Values } from "./families";

/**
 * Hyper focus (Motion.md M13, his, 2026-09-28; named so on 2026-09-29, when the portfolio took it as one of its two
 * modes, focus mode, page 6, the other): a card in focus, and everything else blurring round it — "start from the card
 * with less intensity and then increase the intensity in a circular fashion from the card … how do I define the
 * intensity at each point". Since the same night **the blur is a cloth, not a ripple** (his: "I want to consider that
 * as a cloth, a blurring cloth, not as a ripple … the cloth should reach every corner of the viewport" — the container it is in, he said after — "So I need
 * controls about the lift, about the intensity, about the cloth"). For the portfolio's cards (Portfolio.md P18), which
 * play it through the package's `useFocusMotion` while hyper focus is on (P20). Its tokens keep the `focus` name.
 *
 * Its tokens are in four groups, one on the jig at a time: **Cloth** (how it is drawn out from under the card to every
 * corner, and its hem), **Intensity** (how blurred each point is, by its distance from the card), **Lift** (the card
 * coming up over the cloth, its shadow on it) and **Release** (how it goes, and moves on to the next card). Every token
 * is his second pick (2026-09-29, round 2's C Unroll, tuned; round 1's C Tide, tuned, before it) and in globals.css, so
 * preset A is "Today", read off the page, and the package's `readFocusMotion` falls back to the same (`FOCUS_START`).
 * B–E are round 2, the cloth, as they were: Sheet, Unroll, Drape and Swell. Round 1's four, and the Today it replaced,
 * are in Motion.md.
 */

const CUBIC_OUT = "cubic-bezier(0.215, 0.61, 0.355, 1)";
const IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";
const EXPO_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const SHEET = "cubic-bezier(0.32, 0.72, 0, 1)";
const STANDARD = "cubic-bezier(0.4, 0, 0.2, 1)";

/** Every token's value, from the ones a preset names. */
const preset = (v: {
  lift: number; liftEase: string; shadow: number; shade: number;
  near: number; far: number; clear: number; reach: number; rise: string; rings: number; from: string;
  way: string; in: number; inEase: string; pull: number; hem: number; fold: number;
  exit: string; out: number; outEase: string; shift: string; glide: number; glideEase: string; hold: number;
}): Values => ({
  "--motion-focus-way": v.way,
  "--motion-focus-in": v.in,
  "--motion-focus-in-ease": v.inEase,
  "--motion-focus-pull": v.pull,
  "--motion-focus-hem": v.hem,
  "--motion-focus-fold": v.fold,
  "--motion-focus-near": v.near,
  "--motion-focus-far": v.far,
  "--motion-focus-clear": v.clear,
  "--motion-focus-reach": v.reach,
  "--motion-focus-rise": v.rise,
  "--motion-focus-rings": v.rings,
  "--motion-focus-from": v.from,
  "--motion-focus-lift": v.lift,
  "--motion-focus-lift-ease": v.liftEase,
  "--motion-focus-shadow": v.shadow,
  "--motion-focus-shade": v.shade,
  "--motion-focus-exit": v.exit,
  "--motion-focus-out": v.out,
  "--motion-focus-out-ease": v.outEase,
  "--motion-focus-hold": v.hold,
  "--motion-focus-shift": v.shift,
  "--motion-focus-glide": v.glide,
  "--motion-focus-glide-ease": v.glideEase,
});

export const FOCUS_FAMILY: Family = {
  id: "focus",
  label: "Hyper focus",
  title: "A card in focus, a cloth of blur round it",
  touches:
    "Hover a card: its border goes violet and it lifts, and a cloth of blur is drawn out from under it to every corner of its container, least at the card and thicker out from it. Off every card it holds a moment, then goes. The portfolio's hyper focus mode.",
  hint: "Hover a card, or press Play.",
  // Eight columns hold the sample: the avatar and the name, the note beside four roles, the address and the résumé.
  block: { columns: 8, rows: 8, max: 12 },
  tokens: [
    {
      group: "Cloth",
      name: "--motion-focus-way",
      label: "Way in",
      touches: "How the cloth comes",
      kind: "choice",
      half: true,
      choices: [
        { value: "spread", label: "Drawn out" },
        { value: "swell", label: "Swell" },
        { value: "fade", label: "Fade" },
      ],
    },
    { group: "Cloth", name: "--motion-focus-in", label: "In", touches: "Card to every corner", kind: "ms", half: true, min: 0, max: 3000, step: 10 },
    { group: "Cloth", name: "--motion-focus-in-ease", label: "In ease", touches: "Its edges' travel", kind: "ease", half: true },
    { group: "Cloth", name: "--motion-focus-pull", label: "Pull", touches: "100%: every corner at once", kind: "share", half: true, min: 0, max: 1, step: 0.05 },
    { group: "Cloth", name: "--motion-focus-hem", label: "Hem", touches: "Its soft edge; 0 is crisp", kind: "scale", unit: "cells", half: true, min: 0, max: 12, step: 0.5 },
    { group: "Cloth", name: "--motion-focus-fold", label: "Fold", touches: "Extra blur along the hem", kind: "scale", unit: "px", half: true, min: 0, max: 30, step: 1 },
    { group: "Intensity", name: "--motion-focus-near", label: "At the card", touches: "The blur next to it", kind: "scale", unit: "px", half: true, min: 0, max: 10, step: 0.5 },
    { group: "Intensity", name: "--motion-focus-far", label: "Far", touches: "At the reach and past it", kind: "scale", unit: "px", half: true, min: 0, max: 40, step: 1 },
    { group: "Intensity", name: "--motion-focus-clear", label: "Clear", touches: "Before it starts to rise", kind: "scale", unit: "cells", half: true, min: 0, max: 6, step: 0.5 },
    { group: "Intensity", name: "--motion-focus-reach", label: "Reach", touches: "How far it rises over", kind: "scale", unit: "cells", half: true, min: 1, max: 24, step: 0.5 },
    { group: "Intensity", name: "--motion-focus-rise", label: "Rise", touches: "Its curve, out from the card", kind: "ease", half: true },
    { group: "Intensity", name: "--motion-focus-rings", label: "Rings", touches: "Steps drawing the rise", kind: "scale", unit: "count", half: true, min: 2, max: 10, step: 1 },
    {
      group: "Intensity",
      name: "--motion-focus-from",
      label: "Measured from",
      touches: "Where the rings start",
      kind: "choice",
      half: true,
      choices: [
        { value: "edges", label: "Its edges" },
        { value: "corners", label: "Its corners" },
        { value: "centre", label: "Its centre" },
      ],
    },
    { group: "Lift", name: "--motion-focus-lift", label: "Lift", touches: "The card coming up over it", kind: "ms", half: true, min: 0, max: 1500, step: 10 },
    { group: "Lift", name: "--motion-focus-lift-ease", label: "Lift ease", touches: "Its curve", kind: "ease", half: true },
    { group: "Lift", name: "--motion-focus-shadow", label: "Shadow", touches: "Its blur on the cloth", kind: "scale", unit: "px", half: true, min: 0, max: 64, step: 1 },
    { group: "Lift", name: "--motion-focus-shade", label: "Shade", touches: "How dark it is", kind: "share", half: true, min: 0, max: 0.6, step: 0.02 },
    {
      group: "Release",
      name: "--motion-focus-exit",
      label: "Way out",
      touches: "How the cloth goes",
      kind: "choice",
      half: true,
      choices: [
        { value: "withdraw", label: "Drawn back" },
        { value: "ebb", label: "Ebb" },
        { value: "fade", label: "Fade" },
      ],
    },
    { group: "Release", name: "--motion-focus-out", label: "Out", touches: "Going", kind: "ms", half: true, min: 0, max: 3000, step: 10 },
    { group: "Release", name: "--motion-focus-out-ease", label: "Out ease", touches: "Its curve", kind: "ease", half: true },
    { group: "Release", name: "--motion-focus-hold", label: "Hold", touches: "Off a card, before going", kind: "ms", half: true, min: 0, max: 800, step: 10 },
    {
      group: "Release",
      name: "--motion-focus-shift",
      label: "Next card",
      touches: "The cloth moving over",
      kind: "choice",
      half: true,
      choices: [
        { value: "glide", label: "Glide" },
        { value: "jump", label: "Jump" },
      ],
    },
    { group: "Release", name: "--motion-focus-glide", label: "Glide", touches: "Card to card", kind: "ms", half: true, min: 0, max: 1500, step: 10 },
    { group: "Release", name: "--motion-focus-glide-ease", label: "Glide ease", touches: "Its curve", kind: "ease", half: true },
  ],
  presets: [
    {
      id: "A",
      name: "Today",
      why: "His pick, round 2's C Unroll, tuned (2026-09-29): 1px next to the card and sharp in all but that for a clear ring a cell wide, then rising on ease-in to 16px over 21 cells in ten rings, measured from the circle through its corners. The cloth fades in over 80ms rather than being drawn out, so its pull of 50% and its twelve-cell hem wait for a way in that moves it; no fold. The card lifts in 300ms with no shadow. Off every card it holds 120ms and fades over 400ms, and it glides from card to card in 80ms. Every curve is cubic in-out. Read off globals.css.",
      risk: "Ten rings are ten full-screen blurs; an 80ms fade and an 80ms glide redraw them all for only a few frames, so the cost is short, but a fade of a blur is a crossfade of two pictures, which at this speed reads as a cut. The reach, 21 cells, is wider than most screens, so the far 16px is seldom reached.",
    },
    {
      id: "B",
      name: "Sheet",
      why: "A cloth with an edge: no hem, so its edge is a line, drawn out to every corner at once in 900ms on expo out, measured from the card's edges, a sheet with the card in its middle. The card lifts in 320ms with a 24px shadow. It is drawn back under the card on the way out.",
      risk: "A crisp edge of 20px blur against a sharp page crossing text reads as a wipe, not a cloth; and drawn back, the line runs over the card's neighbours twice.",
      values: preset({
        lift: 320, liftEase: CUBIC_OUT, shadow: 24, shade: 0.24,
        near: 1, far: 20, clear: 2, reach: 8, rise: "ease-in", rings: 8, from: "edges",
        way: "spread", in: 900, inEase: EXPO_OUT, pull: 1, hem: 0, fold: 0,
        exit: "withdraw", out: 600, outEase: IN_OUT, shift: "glide", glide: 400, glideEase: IN_OUT, hold: 200,
      }),
    },
    {
      id: "C",
      name: "Unroll",
      why: "Pull at 0: every edge at one speed, so the nearest edge reaches its container's first and the far corner last, the sheet he saw going to the bottom right, as a cloth. A four-cell hem folded over with 8px more, rings round the card's corners, a 16px shadow; it fades out.",
      risk: "With the card by an edge, the cloth reaches that edge at once and the rest goes on alone, so it reads lopsided rather than laid over.",
      values: preset({
        lift: 400, liftEase: "ease-out", shadow: 16, shade: 0.18,
        near: 1, far: 22, clear: 3, reach: 10, rise: "ease-in", rings: 8, from: "corners",
        way: "spread", in: 1400, inEase: CUBIC_OUT, pull: 0, hem: 4, fold: 8,
        exit: "fade", out: 700, outEase: IN_OUT, shift: "glide", glide: 500, glideEase: IN_OUT, hold: 250,
      }),
    },
    {
      id: "D",
      name: "Drape",
      why: "A heavy cloth settling: a twelve-cell hem, so it has no edge, drawn out in 2000ms on the iOS sheet's curve, most of its way at once and then settling into the corners, the corners arriving nearly together (pull 60%). It is thickest, 26px, measured from the card's edges. The card lifts slowly, 700ms, with a deep 40px shadow; it ebbs out.",
      risk: "The hem is twelve cells wide, so on a phone the whole screen is inside it and the cloth reads as a fade; the deep shadow is a dark halo on the dark theme.",
      values: preset({
        lift: 700, liftEase: SHEET, shadow: 40, shade: 0.28,
        near: 0.5, far: 26, clear: 4, reach: 12, rise: "ease-in-out", rings: 10, from: "edges",
        way: "spread", in: 2000, inEase: SHEET, pull: 0.6, hem: 12, fold: 0,
        exit: "ebb", out: 900, outEase: "ease-in", shift: "glide", glide: 600, glideEase: IN_OUT, hold: 300,
      }),
    },
    {
      id: "E",
      name: "Swell",
      why: "No travel: the cloth is over every corner of its container already and swells from sharp in 500ms, measured from the card's edges, then ebbs. The card lifts in 200ms with a 12px shadow. The baseline, to see whether drawing the cloth out matters or only the cloth it leaves.",
      risk: "With nothing travelling, the card does not read as where the cloth came from; it is a page going soft.",
      values: preset({
        lift: 200, liftEase: STANDARD, shadow: 12, shade: 0.14,
        near: 0.5, far: 16, clear: 1, reach: 10, rise: "ease-in", rings: 6, from: "edges",
        way: "swell", in: 500, inEase: "ease-out", pull: 1, hem: 4, fold: 0,
        exit: "ebb", out: 400, outEase: "ease-in", shift: "glide", glide: 360, glideEase: STANDARD, hold: 200,
      }),
    },
  ],
};
