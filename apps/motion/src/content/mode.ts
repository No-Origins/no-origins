import type { Family, Values } from "./families";

/**
 * Focus mode (Motion.md M14, his, 2026-09-28): the portfolio shows a lot at once, meant for a seven-second glance, and
 * focus mode lets a reader take one vertical at a time. "An option called focus mode … in the bottom right … once we
 * turn it on there should be an overlay on top of the first section … a little above the section, like it's coming
 * out of the screen in 3D … the rest should feel like a cloth overlay … start blurring out from the edges of the focus
 * component … increasing the same blur default that we have right now … like we are looking through a panel … three
 * verticals … the user can click between the verticals … bottom center … should be the cells … the focus component
 * should slide from one vertical to another." The motion is the package's `useModeMotion`. **The slide went the next
 * day** (his, 2026-09-29: "Instead of sliding the focus container, we should just unfocus while refocusing on the next
 * one … both 1 unfocusing and 2 focusing should start at a time"): every vertical has a panel and a cloth of its own,
 * and another vertical is the one left playing the way out and the next the way in, from the same moment. **Its line
 * is not drawn any more** (his, the same day: "Instead of border start from top and all, let's just have the option to
 * border to rise from the viewport directly without that border animation"): the panel rises out of the page with its
 * whole line there, and going is the same steps backward (his: "the vertical in focus will repeat the steps
 * backward").
 *
 * Its tokens are in five groups, one on the jig at a time: **Lift** (the panel rising out of the page and dropping back,
 * each its time and curve: his ask, 2026-09-29, "controls to control the lift and drop timings"), **Panel** (the frame
 * coming out of the page: how far, how seen, its swing, shadow and margin), **Line** (its
 * width, on the page and once up; its Draw and Draw ease went with the draw), **Cloth** (the blur round it, how much at
 * each point) and **Roll** (how the cloth comes and goes). A fifth, **Slide** (the panel's slide, its curve and its
 * dip), went with the slide. Every
 * token is his pick (2026-09-29, A As described, tuned) and in globals.css, so preset A is "Today", read off the page,
 * and the package's `readModeMotion` falls back to the same (`MODE_START`). B–E are round 1's other four, as they were;
 * A As described, the brief's values it was tuned from, is in Motion.md.
 */

const IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";
const SHEET = "cubic-bezier(0.32, 0.72, 0, 1)";
const EXPO_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const OVERSHOOT = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const STANDARD = "cubic-bezier(0.4, 0, 0.2, 1)";

/** Every token's value, from the ones a preset names. */
const preset = (v: {
  lift: number; liftEase: string; drop?: number; dropEase?: string; depth: number; perspective: number; tilt: number; shadow: number; pad: number;
  border: number; fine: number;
  near: number; far: number; clear: number; reach: number; rise: string; rings: number; veil: number;
  way: string; in: number; inEase: string; out: number; outEase: string; stagger: number;
}): Values => ({
  "--motion-mode-lift": v.lift,
  "--motion-mode-lift-ease": v.liftEase,
  // A preset that names no drop drops as it lifts, as every one did until the drop had tokens of its own.
  "--motion-mode-drop": v.drop ?? v.lift,
  "--motion-mode-drop-ease": v.dropEase ?? v.liftEase,
  "--motion-mode-depth": v.depth,
  "--motion-mode-perspective": v.perspective,
  "--motion-mode-tilt": v.tilt,
  "--motion-mode-shadow": v.shadow,
  "--motion-mode-pad": v.pad,
  "--motion-mode-border": v.border,
  "--motion-mode-border-fine": v.fine,
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
});

export const MODE_FAMILY: Family = {
  id: "mode",
  label: "Focus mode",
  title: "One vertical at a time, the page under a cloth",
  touches:
    "Press Focus, bottom right: a panel rises out of the page over the first vertical, and a cloth of blur comes from its edges over the rest, least at the panel and more farther out. The verticals' cells come up at the bottom centre; press one, or a card in another vertical, and the one left plays those steps backward as that one comes into focus, both at once. The portfolio's focus mode, over its three verticals.",
  hint: "Press Focus, bottom right, then the cells or a card. Or press Play.",
  // Fifteen columns hold three verticals three wide with two of air between (his, 2026-09-29) and a column of margin
  // either side for the panel; nine rows hold them over the bar.
  block: { columns: 15, rows: 9, max: 16 },
  // The switcher's cells play movement (M9) as the vertical changes, at its decided values.
  borrows: ["move"],
  tokens: [
    { group: "Lift", name: "--motion-mode-lift", label: "Lift", touches: "Up out of the page", kind: "ms", half: true, min: 0, max: 2000, step: 10 },
    { group: "Lift", name: "--motion-mode-lift-ease", label: "Lift ease", touches: "Its curve", kind: "ease", half: true },
    { group: "Lift", name: "--motion-mode-drop", label: "Drop", touches: "Back into the page", kind: "ms", half: true, min: 0, max: 2000, step: 10 },
    { group: "Lift", name: "--motion-mode-drop-ease", label: "Drop ease", touches: "Its curve", kind: "ease", half: true },
    { group: "Panel", name: "--motion-mode-depth", label: "Depth", touches: "How far out of the page", kind: "scale", unit: "px", half: true, min: 0, max: 200, step: 2 },
    { group: "Panel", name: "--motion-mode-perspective", label: "Perspective", touches: "Nearer, more 3D", kind: "scale", unit: "px", half: true, min: 300, max: 4000, step: 50 },
    { group: "Panel", name: "--motion-mode-tilt", label: "Tilt", touches: "Its swing on the way", kind: "scale", unit: "degrees", half: true, min: -30, max: 30, step: 1 },
    { group: "Panel", name: "--motion-mode-shadow", label: "Shadow", touches: "Under it, lifted", kind: "scale", unit: "px", half: true, min: 0, max: 96, step: 2 },
    { group: "Panel", name: "--motion-mode-pad", label: "Margin", touches: "Round the vertical", kind: "scale", unit: "px", half: true, min: 0, max: 16, step: 4 },
    { group: "Line", name: "--motion-mode-border", label: "Border", touches: "Its line, once up", kind: "scale", unit: "px", half: true, min: 0, max: 8, step: 0.5 },
    { group: "Line", name: "--motion-mode-border-fine", label: "Fine", touches: "Its line, on the page", kind: "scale", unit: "px", half: true, min: 0, max: 4, step: 0.25 },
    { group: "Cloth", name: "--motion-mode-near", label: "At the panel", touches: "The blur at its edge", kind: "scale", unit: "px", half: true, min: 0, max: 10, step: 0.5 },
    { group: "Cloth", name: "--motion-mode-far", label: "Far", touches: "At the reach and past it", kind: "scale", unit: "px", half: true, min: 0, max: 40, step: 1 },
    { group: "Cloth", name: "--motion-mode-clear", label: "Clear", touches: "Sharp before it rises", kind: "scale", unit: "cells", half: true, min: 0, max: 6, step: 0.5 },
    { group: "Cloth", name: "--motion-mode-reach", label: "Reach", touches: "Its rise, at most", kind: "scale", unit: "cells", half: true, min: 1, max: 24, step: 0.5 },
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
    { group: "Roll", name: "--motion-mode-stagger", label: "Stagger", touches: "In: the cloth after the lift sets off · out: the drop after the cloth", kind: "ms", min: 0, max: 1000, step: 10 },
  ],
  presets: [
    {
      id: "A",
      name: "Today",
      why: "His pick, A As described, tuned (2026-09-29), with the line's draw taken out the same day: the panel rises straight out of the page, its whole line there from the start, 0.5px on the page and 2px once up, quickly, 90ms on ease-out, 80px towards the eye through a near 800px perspective, swinging -3° on the way, with a 40px shadow and a 16px margin. The cloth is measured from the panel's edges with no clear margin: 2px at the panel, rising on expo out to 7px over at most sixteen cells in seven rings, under a veil of the page's colour at 60%. It swells in over 250ms on ease-in, 120ms after the panel starts to rise; going is the same steps backward, the cloth thinning out over 1000ms and the panel dropping back into the page 120ms after it, in 90ms on ease-out (the drop is the lift's until he tunes it). Another vertical is both at once: the one left going off and the next coming on. Read off globals.css.",
      risk: "The veil is a translucent wash at 60%, his exception to the no-glass rule, and it mutes the page as much as it softens it: covered verticals may read as disabled. A swell has no edge travelling, so the cloth does not read as coming from the panel; and a 90ms rise is almost a snap, the panel there before the eye sees it come. Going, the cloth's 1000ms is four times its way in, so the steps backward take longer than the steps in.",
    },
    {
      id: "B",
      name: "Lens",
      why: "The panel as a glass lens: barely lifted, 320ms on expo out, no swing, a short shadow, and a quick unfurl on expo out, so the cloth is down almost at once.",
      risk: "With so little depth, the 3D he asked for is nearly gone: it reads as a frame, not as something coming out of the screen.",
      values: preset({
        lift: 320, liftEase: EXPO_OUT, depth: 16, perspective: 1600, tilt: 0, shadow: 20, pad: 8,
        border: 2, fine: 0.5,
        near: 1.5, far: 18, clear: 0, reach: 6, rise: "ease-in", rings: 6, veil: 0,
        way: "unfurl", in: 600, inEase: EXPO_OUT, out: 360, outEase: STANDARD, stagger: 60,
      }),
    },
    {
      id: "C",
      name: "Sheet",
      why: "The 3D pushed: it goes 96px out through a near 900px perspective, a 14° swing and an overshoot, and settles. The cloth swells everywhere at once rather than rolling.",
      risk: "An overshoot on every change is a lot of travel for reading; and with the cards staying at their level, a panel this far out stands 12% larger than the vertical it frames.",
      values: preset({
        lift: 680, liftEase: OVERSHOOT, depth: 96, perspective: 900, tilt: 14, shadow: 64, pad: 12,
        border: 2, fine: 0.5,
        near: 1, far: 20, clear: 0.5, reach: 8, rise: "ease-in", rings: 8, veil: 0,
        way: "swell", in: 700, inEase: "ease-out", out: 500, outEase: "ease-in", stagger: 200,
      }),
    },
    {
      id: "D",
      name: "Drape",
      why: "The cloth as cloth, and a gentle lift. A veil of the page's colour over the blur, so what is covered is muted as well as soft, unfurling slowly on ease-out, and rolled back a good while before the panel comes down. A cell of clear margin round the panel keeps its neighbours' edges readable.",
      risk: "The veil is a translucent wash, which the no-glass rule forbids outside his exception; and a muted page can read as disabled rather than set aside.",
      values: preset({
        lift: 560, liftEase: SHEET, depth: 40, perspective: 1400, tilt: 4, shadow: 36, pad: 8,
        border: 2, fine: 0.5,
        near: 0.5, far: 16, clear: 1, reach: 8, rise: "ease-in-out", rings: 6, veil: 0.25,
        way: "unfurl", in: 1200, inEase: "ease-out", out: 700, outEase: IN_OUT, stagger: 300,
      }),
    },
    {
      id: "E",
      name: "Flat",
      why: "No 3D and no roll: the panel is a flat frame, 2px from the start, shown in the state's time, and the cloth fades in and out whole. The baseline, to see whether the lift and the unfurl earn their time.",
      risk: "A fade of a blur is a crossfade of two pictures, so half way the page is doubled rather than half blurred.",
      values: preset({
        lift: 150, liftEase: STANDARD, depth: 0, perspective: 1200, tilt: 0, shadow: 0, pad: 8,
        border: 2, fine: 2,
        near: 1, far: 22, clear: 0, reach: 10, rise: "ease-in", rings: 8, veil: 0,
        way: "fade", in: 200, inEase: STANDARD, out: 200, outEase: STANDARD, stagger: 0,
      }),
    },
  ],
};
