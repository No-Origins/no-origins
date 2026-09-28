import type { Family, Values } from "./families";

/**
 * Focus (Motion.md M13, his, 2026-09-28): a card in focus, and everything else blurring round it — "start from the card
 * with less intensity and then increase the intensity in a circular fashion from the card … I should be able to
 * control how the intensity starts flowing like a ripple … how do I define the intensity at each point". For the
 * portfolio's cards (Portfolio.md P18), which play it through the package's `useFocusMotion`.
 *
 * Its tokens are in three groups, one on the jig at a time: **Intensity** (the field — how blurred each point is, by
 * its distance from the card), **Ripple** (how the blur comes in) and **Release** (how it goes, and moves on to the next
 * card). They are in globals.css since his pick (2026-09-28, round 1's C Tide, tuned), so preset A is "Today", read off
 * the page, and the package's `readFocusMotion` falls back to the same (`FOCUS_START`). B–E are the other four of
 * round 1: Ripple (round 1's A), Swell, Spotlight and Fade.
 */

const CUBIC_OUT = "cubic-bezier(0.215, 0.61, 0.355, 1)";
const STANDARD = "cubic-bezier(0.4, 0, 0.2, 1)";
const EXPO_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Every token's value, from the ones a preset names. */
const preset = (v: {
  near: number; far: number; clear: number; reach: number; rise: string; rings: number; from: string;
  way: string; in: number; inEase: string; front: number; crest: number;
  exit: string; out: number; outEase: string; shift: string; glide: number; glideEase: string; hold: number;
}): Values => ({
  "--motion-focus-near": v.near,
  "--motion-focus-far": v.far,
  "--motion-focus-clear": v.clear,
  "--motion-focus-reach": v.reach,
  "--motion-focus-rise": v.rise,
  "--motion-focus-rings": v.rings,
  "--motion-focus-from": v.from,
  "--motion-focus-way": v.way,
  "--motion-focus-in": v.in,
  "--motion-focus-in-ease": v.inEase,
  "--motion-focus-front": v.front,
  "--motion-focus-crest": v.crest,
  "--motion-focus-exit": v.exit,
  "--motion-focus-out": v.out,
  "--motion-focus-out-ease": v.outEase,
  "--motion-focus-shift": v.shift,
  "--motion-focus-glide": v.glide,
  "--motion-focus-glide-ease": v.glideEase,
  "--motion-focus-hold": v.hold,
});

export const FOCUS_FAMILY: Family = {
  id: "focus",
  label: "Focus",
  title: "A card in focus, the page blurring round it",
  touches:
    "Hover a card: its border goes violet, and everything else blurs, least at the card and more in rings out from it, the blur spreading from the card like a ripple. Off every card it holds a moment, then goes. For the portfolio's cards.",
  hint: "Hover a card, or press Play.",
  // Eight columns hold the sample: the avatar and the name, the note beside four roles, the address and the résumé.
  block: { columns: 8, rows: 8, max: 12 },
  tokens: [
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
        { value: "corners", label: "Its corners" },
        { value: "centre", label: "Its centre" },
      ],
    },
    {
      group: "Ripple",
      name: "--motion-focus-way",
      label: "Way in",
      touches: "How the blur comes",
      kind: "choice",
      half: true,
      choices: [
        { value: "ripple", label: "Ripple" },
        { value: "swell", label: "Swell" },
        { value: "fade", label: "Fade" },
      ],
    },
    { group: "Ripple", name: "--motion-focus-in", label: "In", touches: "Card to farthest corner", kind: "ms", half: true, min: 0, max: 3000, step: 10 },
    { group: "Ripple", name: "--motion-focus-in-ease", label: "In ease", touches: "The front's travel", kind: "ease", half: true },
    { group: "Ripple", name: "--motion-focus-front", label: "Front", touches: "Its soft leading edge", kind: "scale", unit: "cells", half: true, min: 0.5, max: 12, step: 0.5 },
    { group: "Ripple", name: "--motion-focus-crest", label: "Crest", touches: "Extra blur on the front", kind: "scale", unit: "px", half: true, min: 0, max: 30, step: 1 },
    {
      group: "Release",
      name: "--motion-focus-exit",
      label: "Way out",
      touches: "How the blur goes",
      kind: "choice",
      half: true,
      choices: [
        { value: "clear", label: "Clear outward" },
        { value: "recede", label: "Recede inward" },
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
      touches: "The field moving over",
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
      why: "His pick, 2026-09-28, round 1's Tide, tuned: 1px next to the card and sharp in all but that for a clear ring four cells wide, then rising on ease-in to 22px over ten cells in ten rings. A slow ripple from the card to the farthest corner in 1500ms, its front eight cells soft and no crest; off every card it holds 250ms and fades over 800ms, and it glides from card to card in 500ms. Every curve is cubic in-out. Read off globals.css.",
      risk: "Ten rings are ten full-screen blurs, each redrawn every frame of the ripple: on a slow machine the 1500ms ripple is where it would stutter.",
    },
    {
      id: "B",
      name: "Ripple",
      why: "His brief: 1px next to the card, rising on ease-in to 18px eight cells out, so a neighbour is barely touched and the far edge is gone. The blur comes in as a ripple from the card to the farthest corner in 700ms, a 6px crest on its front, and goes by clearing outward from the card, a second ripple. The field glides from card to card. Round 1's A, what the portfolio played until his pick.",
      risk: "The crest is a blur riding on a blur: on a busy page it can read as a smear passing over rather than a wave.",
      values: preset({
        near: 1, far: 18, clear: 0, reach: 8, rise: "ease-in", rings: 6, from: "corners",
        way: "ripple", in: 700, inEase: CUBIC_OUT, front: 4, crest: 6,
        exit: "clear", out: 450, outEase: CUBIC_OUT, shift: "glide", glide: 300, glideEase: STANDARD, hold: 200,
      }),
    },
    {
      id: "C",
      name: "Swell",
      why: "No front: the whole field grows from sharp to blurred at once, and ebbs back the same way. This tests whether the ripple itself matters, or only the field it leaves.",
      risk: "With nothing travelling, the card does not read as where it came from; it is a page going soft.",
      values: preset({
        near: 0.5, far: 14, clear: 0, reach: 10, rise: "ease-in-out", rings: 6, from: "corners",
        way: "swell", in: 500, inEase: "ease-out", front: 4, crest: 0,
        exit: "ebb", out: 400, outEase: "ease-in", shift: "glide", glide: 360, glideEase: STANDARD, hold: 200,
      }),
    },
    {
      id: "D",
      name: "Spotlight",
      why: "A clear ring round the card, a cell and a half wide, then the blur jumps up (ease-out: steep near, flat far) to 24px within five cells, brought in by a fast ripple with a strong crest. Its neighbours stay sharp and the rest is gone.",
      risk: "The step at the clear ring's edge is a line across whatever sits on it: half a neighbour sharp, half blurred.",
      values: preset({
        near: 0, far: 24, clear: 1.5, reach: 5, rise: "ease-out", rings: 6, from: "corners",
        way: "ripple", in: 450, inEase: EXPO_OUT, front: 3, crest: 10,
        exit: "fade", out: 250, outEase: "ease-in", shift: "glide", glide: 240, glideEase: EXPO_OUT, hold: 150,
      }),
    },
    {
      id: "E",
      name: "Fade",
      why: "The portfolio as it was built first, but on the card: the field fades in and out whole in the state's 150ms, and jumps from card to card, measured from the card's centre. The baseline to hold the ripple against.",
      risk: "A fade of a blur is a crossfade of two pictures, so half way through, the page is doubled rather than half blurred.",
      values: preset({
        near: 2, far: 16, clear: 0, reach: 10, rise: "ease-in", rings: 5, from: "centre",
        way: "fade", in: 150, inEase: STANDARD, front: 4, crest: 0,
        exit: "fade", out: 150, outEase: STANDARD, shift: "jump", glide: 0, glideEase: STANDARD, hold: 200,
      }),
    },
  ],
};
