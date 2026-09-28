import type { Family, Values } from "./families";

/**
 * Focus mode (Motion.md M14, his, 2026-09-28): the portfolio shows a lot at once, meant for a seven-second glance, and
 * focus mode lets a reader take one vertical at a time. "An option called focus mode … in the bottom right … once we
 * turn it on there should be an overlay on top of the first section … a little above the section, like it's coming
 * out of the screen in 3D … the rest should feel like a cloth overlay … start blurring out from the edges of the focus
 * component … increasing the same blur default that we have right now … like we are looking through a panel … three
 * verticals … the user can click between the verticals … bottom center … should be the cells … the focus component
 * should slide from one vertical to another." The motion is the package's `useModeMotion`.
 *
 * Its tokens are in four groups, one on the jig at a time: **Panel** (the frame coming out of the page), **Cloth** (the
 * blur round it, how much at each point), **Roll** (how the cloth comes and goes) and **Slide** (vertical to vertical). None
 * is in globals.css until he picks, so preset A carries the brief's values: the cloth is focus's decided field (1px
 * rising on ease-in to 22px over ten cells, in ten rings, a 1500ms way in and an 800ms way out, cubic in-out), measured
 * from the panel's edges with no clear margin, his "start blurring out from the edges".
 */

const IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";
const SHEET = "cubic-bezier(0.32, 0.72, 0, 1)";
const EXPO_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const OVERSHOOT = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const STANDARD = "cubic-bezier(0.4, 0, 0.2, 1)";

/** Every token's value, from the ones a preset names. */
const preset = (v: {
  lift: number; liftEase: string; depth: number; perspective: number; tilt: number; shadow: number; pad: number;
  near: number; far: number; clear: number; reach: number; rise: string; rings: number; veil: number;
  way: string; in: number; inEase: string; out: number; outEase: string; stagger: number;
  slide: number; slideEase: string; dip: number;
}): Values => ({
  "--motion-mode-lift": v.lift,
  "--motion-mode-lift-ease": v.liftEase,
  "--motion-mode-depth": v.depth,
  "--motion-mode-perspective": v.perspective,
  "--motion-mode-tilt": v.tilt,
  "--motion-mode-shadow": v.shadow,
  "--motion-mode-pad": v.pad,
  "--motion-mode-near": v.near,
  "--motion-mode-far": v.far,
  "--motion-mode-clear": v.clear,
  "--motion-mode-reach": v.reach,
  "--motion-mode-rise": v.rise,
  "--motion-mode-rings": v.rings,
  "--motion-mode-veil": v.veil,
  "--motion-mode-way": v.way,
  "--motion-mode-in": v.in,
  "--motion-mode-in-ease": v.inEase,
  "--motion-mode-out": v.out,
  "--motion-mode-out-ease": v.outEase,
  "--motion-mode-stagger": v.stagger,
  "--motion-mode-slide": v.slide,
  "--motion-mode-slide-ease": v.slideEase,
  "--motion-mode-dip": v.dip,
});

export const MODE_FAMILY: Family = {
  id: "mode",
  label: "Focus mode",
  title: "One vertical at a time, the page under a cloth",
  touches:
    "Press Focus, bottom right: a panel comes out of the page over the first vertical, and a cloth of blur rolls out from its edges over the rest, least at the panel and more farther out. The verticals' cells come up at the bottom centre; press one, or a card in another vertical, and the panel slides there. For the portfolio's three verticals.",
  hint: "Press Focus, bottom right, then the cells or a card. Or press Play.",
  // Eight columns hold three verticals two cells wide with a cell of air between; nine rows hold them over the bar.
  block: { columns: 8, rows: 9, max: 16 },
  // The switcher's cells play movement (M9) as the vertical changes, at its decided values.
  borrows: ["move"],
  tokens: [
    { group: "Panel", name: "--motion-mode-lift", label: "Lift", touches: "Coming out, going back", kind: "ms", half: true, min: 0, max: 2000, step: 10 },
    { group: "Panel", name: "--motion-mode-lift-ease", label: "Lift ease", touches: "Its curve", kind: "ease", half: true },
    { group: "Panel", name: "--motion-mode-depth", label: "Depth", touches: "How far out of the page", kind: "scale", unit: "px", half: true, min: 0, max: 200, step: 2 },
    { group: "Panel", name: "--motion-mode-perspective", label: "Perspective", touches: "Nearer, more 3D", kind: "scale", unit: "px", half: true, min: 300, max: 4000, step: 50 },
    { group: "Panel", name: "--motion-mode-tilt", label: "Tilt", touches: "Its swing on the way", kind: "scale", unit: "degrees", half: true, min: -30, max: 30, step: 1 },
    { group: "Panel", name: "--motion-mode-shadow", label: "Shadow", touches: "Under it, lifted", kind: "scale", unit: "px", half: true, min: 0, max: 96, step: 2 },
    { group: "Panel", name: "--motion-mode-pad", label: "Margin", touches: "Round the vertical", kind: "scale", unit: "px", half: true, min: 0, max: 16, step: 4 },
    { group: "Cloth", name: "--motion-mode-near", label: "At the panel", touches: "The blur at its edge", kind: "scale", unit: "px", half: true, min: 0, max: 10, step: 0.5 },
    { group: "Cloth", name: "--motion-mode-far", label: "Far", touches: "At the reach and past it", kind: "scale", unit: "px", half: true, min: 0, max: 40, step: 1 },
    { group: "Cloth", name: "--motion-mode-clear", label: "Clear", touches: "Sharp before it rises", kind: "scale", unit: "cells", half: true, min: 0, max: 6, step: 0.5 },
    { group: "Cloth", name: "--motion-mode-reach", label: "Reach", touches: "How far it rises over", kind: "scale", unit: "cells", half: true, min: 1, max: 24, step: 0.5 },
    { group: "Cloth", name: "--motion-mode-rise", label: "Rise", touches: "Its curve, out from the panel", kind: "ease", half: true },
    { group: "Cloth", name: "--motion-mode-rings", label: "Rings", touches: "Steps drawing the rise", kind: "scale", unit: "count", half: true, min: 1, max: 10, step: 1 },
    { group: "Cloth", name: "--motion-mode-veil", label: "Veil", touches: "The page's colour over it", kind: "share", half: true, min: 0, max: 0.6, step: 0.05 },
    {
      group: "Roll",
      name: "--motion-mode-way",
      label: "Way",
      touches: "How the cloth comes and goes",
      kind: "choice",
      half: true,
      choices: [
        { value: "unfurl", label: "Unfurl" },
        { value: "swell", label: "Swell" },
        { value: "fade", label: "Fade" },
      ],
    },
    { group: "Roll", name: "--motion-mode-in", label: "In", touches: "Out to the far corner", kind: "ms", half: true, min: 0, max: 3000, step: 10 },
    { group: "Roll", name: "--motion-mode-in-ease", label: "In ease", touches: "Its curve", kind: "ease", half: true },
    { group: "Roll", name: "--motion-mode-out", label: "Out", touches: "Back to the panel", kind: "ms", half: true, min: 0, max: 3000, step: 10 },
    { group: "Roll", name: "--motion-mode-out-ease", label: "Out ease", touches: "Its curve", kind: "ease", half: true },
    { group: "Roll", name: "--motion-mode-stagger", label: "Stagger", touches: "In: after the panel · out: before it", kind: "ms", min: 0, max: 1000, step: 10 },
    { group: "Slide", name: "--motion-mode-slide", label: "Slide", touches: "Vertical to vertical", kind: "ms", half: true, min: 0, max: 1500, step: 10 },
    { group: "Slide", name: "--motion-mode-slide-ease", label: "Slide ease", touches: "Its curve", kind: "ease", half: true },
    { group: "Slide", name: "--motion-mode-dip", label: "Dip", touches: "0 stays out · 1 goes down to the page on the way", kind: "share", min: 0, max: 1, step: 0.05 },
  ],
  presets: [
    {
      id: "A",
      name: "As described",
      why: "His brief, read literally. The panel comes out 48px towards the eye through a 1200px perspective on the iOS sheet's curve in 520ms, swinging 6° on the way, with a 40px shadow and a margin of 8. The cloth is today's focus field measured from the panel's edges: 1px at the edge, rising on ease-in to 22px over ten cells in ten rings, unfurling from the panel in 1500ms 120ms after it, rolling back in 800ms, cubic in-out. The panel slides in 500ms, staying out. Not in globals.css yet.",
      risk: "Ten cells of reach is more than the stage has: here the far edge is at about 9px, and on the portfolio's wide screen the far corners reach 22px. And the unfurl's edge is a sharp line crossing the page for a second and a half.",
      values: preset({
        lift: 520, liftEase: SHEET, depth: 48, perspective: 1200, tilt: 6, shadow: 40, pad: 8,
        near: 1, far: 22, clear: 0, reach: 10, rise: "ease-in", rings: 10, veil: 0,
        way: "unfurl", in: 1500, inEase: IN_OUT, out: 800, outEase: IN_OUT, stagger: 120,
        slide: 500, slideEase: IN_OUT, dip: 0,
      }),
    },
    {
      id: "B",
      name: "Lens",
      why: "The panel as a glass lens: barely lifted, no swing, a short shadow, and a quick unfurl on expo out, so the cloth is down almost at once. It slides fast and stays out, and what passes under it is sharp on the way.",
      risk: "With so little depth, the 3D he asked for is nearly gone: it reads as a frame, not as something coming out of the screen.",
      values: preset({
        lift: 320, liftEase: EXPO_OUT, depth: 16, perspective: 1600, tilt: 0, shadow: 20, pad: 8,
        near: 1.5, far: 18, clear: 0, reach: 6, rise: "ease-in", rings: 6, veil: 0,
        way: "unfurl", in: 600, inEase: EXPO_OUT, out: 360, outEase: STANDARD, stagger: 60,
        slide: 360, slideEase: EXPO_OUT, dip: 0,
      }),
    },
    {
      id: "C",
      name: "Sheet",
      why: "The 3D pushed: 96px out through a near 900px perspective, a 14° swing and an overshoot, so it peels off the page and settles. The cloth swells everywhere at once rather than rolling. Between verticals it goes most of the way down, slides, and comes back up.",
      risk: "An overshoot and a dip on every change is a lot of travel for reading, and the swing can make the text on the panel wobble.",
      values: preset({
        lift: 680, liftEase: OVERSHOOT, depth: 96, perspective: 900, tilt: 14, shadow: 64, pad: 12,
        near: 1, far: 20, clear: 0.5, reach: 8, rise: "ease-in", rings: 8, veil: 0,
        way: "swell", in: 700, inEase: "ease-out", out: 500, outEase: "ease-in", stagger: 200,
        slide: 620, slideEase: IN_OUT, dip: 0.7,
      }),
    },
    {
      id: "D",
      name: "Drape",
      why: "The cloth as cloth: a veil of the page's colour over the blur, so what is covered is muted as well as soft, unfurling slowly on ease-out a good while after the panel. A cell of clear margin round the panel keeps its neighbours' edges readable. The slide sinks a little on the way.",
      risk: "The veil is a translucent wash, which the no-glass rule forbids outside his exception; and a muted page can read as disabled rather than set aside.",
      values: preset({
        lift: 560, liftEase: SHEET, depth: 40, perspective: 1400, tilt: 4, shadow: 36, pad: 8,
        near: 0.5, far: 16, clear: 1, reach: 8, rise: "ease-in-out", rings: 6, veil: 0.25,
        way: "unfurl", in: 1200, inEase: "ease-out", out: 700, outEase: IN_OUT, stagger: 300,
        slide: 560, slideEase: IN_OUT, dip: 0.3,
      }),
    },
    {
      id: "E",
      name: "Flat",
      why: "No 3D and no roll: the panel is a frame drawn in the state's time, and the cloth fades in and out whole. The baseline, to see whether the lift and the unfurl earn their time.",
      risk: "A fade of a blur is a crossfade of two pictures, so half way the page is doubled rather than half blurred.",
      values: preset({
        lift: 150, liftEase: STANDARD, depth: 0, perspective: 1200, tilt: 0, shadow: 0, pad: 8,
        near: 1, far: 22, clear: 0, reach: 10, rise: "ease-in", rings: 8, veil: 0,
        way: "fade", in: 200, inEase: STANDARD, out: 200, outEase: STANDARD, stagger: 0,
        slide: 240, slideEase: STANDARD, dip: 0,
      }),
    },
  ],
};
