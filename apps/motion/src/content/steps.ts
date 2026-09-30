import type { Family, Token } from "./families";

/**
 * The slider's steps (Motion.md M21, his, 2026-09-30): *"For sliders, we need an option to have segments … if the
 * smallest unit is 1 and if the total slider numbers are 5, we can have small dots above them, which can be controlled,
 * the size can be controlled of those dots, and whenever … basically it should give the tactile feedback, and the motion
 * should also be designed."* A motion he named, so it is on the bench (M9), after the grip it plays with.
 *
 * Not M18's segments, which cut the bar itself into pieces and were taken out: the bar stays one fluid body, and a
 * slider given `marks` draws a dot over each step's place above it. **Marks**, the dots; **Tick**, the pop a mark gives
 * when the value lands on it; **Feel**, the head's kick with it, the vibration a tick sends where the device can, and
 * each mark's zone — his, the same night: *"a control where I can control the zone for each mark, and if the cursor
 * holding the head is in that zone, the head should snap right under the mark"* — and how quickly the head snaps.
 *
 * **It is designed version by version, not from presets** (his, 2026-09-30). Its one start is version 1's values; Reset
 * goes back to it and Copy hands his tuning back as the settings block. None of its tokens is in globals.css, so the
 * start is carried here and in the package's `STEP_START` (`@no-origins/ui/lib/step-motion`) and the slider's own
 * fallbacks for the marks (6px, 6px), the same values. Change one, change both.
 */

const MARKS = "Marks";
const TICK = "Tick";
const FEEL = "Feel";

const TOKENS: Token[] = [
  { group: MARKS, name: "--slider-mark-size", label: "Size", touches: "The dot across", kind: "px", unit: "px", half: true, min: 2, max: 16, step: 1 },
  { group: MARKS, name: "--slider-mark-lift", label: "Lift", touches: "From the bar to the dot", kind: "px", unit: "px", half: true, min: 0, max: 16, step: 1 },

  { group: TICK, name: "--motion-step-pop", label: "Pop", touches: "The dot at the top of its tick, times its size", kind: "scale", unit: "multiplier", min: 1, max: 3, step: 0.05 },
  { group: TICK, name: "--motion-step-pop-in", label: "Pop in", touches: "To the top of the pop", kind: "ms", half: true, min: 0, max: 300, step: 5 },
  { group: TICK, name: "--motion-step-settle", label: "Settle", touches: "One swing back to its size", kind: "ms", half: true, min: 0, max: 1500, step: 10 },
  { group: TICK, name: "--motion-step-settle-bounce", label: "Settle bounce", touches: "0 settles, more wobbles", kind: "share", min: 0, max: 0.9, step: 0.05 },

  { group: FEEL, name: "--motion-step-kick", label: "Kick", touches: "The head at a tick, times its size; 1 none", kind: "scale", unit: "multiplier", min: 1, max: 1.6, step: 0.05 },
  { group: FEEL, name: "--motion-step-haptic", label: "Haptic", touches: "A tick's buzz where the phone can; 0 none", kind: "ms", min: 0, max: 50, step: 1 },
  { group: FEEL, name: "--motion-step-zone", label: "Zone", touches: "Either side of a mark a held head snaps under it; 0 none", kind: "px", unit: "px", half: true, min: 0, max: 64, step: 1 },
  { group: FEEL, name: "--motion-step-snap", label: "Snap", touches: "The head going under its mark, 0 at once", kind: "ms", half: true, min: 0, max: 400, step: 5 },
];

export const STEP_FAMILY: Family = {
  id: "step",
  label: "Steps",
  title: "The slider's steps: a dot over each, and a tick as the value lands on one",
  touches:
    "A Slider given marks draws a dot over each step's place, above the bar: the bar's grey, and lime where the value is. Every mark has a zone: a held head whose cursor comes into one snaps right under the mark and takes its value, and that is the tick — the mark lights and pops and springs back, the head kicks with it, and a phone vibrates where it can. Out of every zone the head is the cursor's and the value stays on the last mark, so letting go between two drops it back. With no zone, or from the keys, the tick is the value landing. A mark the value has left stays lime until the body's lime has flowed back past it.",
  hint: "Drag a head across the dots, use the arrow keys, or press Play.",
  // The block is not drawn for a versioned family: the stage lays out its three sliders itself.
  block: { columns: 8, rows: 3, max: 8 },
  // The grip plays with it, at its own values, slowed with the rest.
  borrows: ["grip"],
  version: 1,
  tokens: TOKENS,
  presets: [
    {
      id: "A",
      name: "Version 1",
      why: "His brief as I read it: a 6px dot 6px over the bar at every step; a tick lights it and pops it to 1.8× in 60ms, and it springs back over 360ms with a little wobble, 0.4; the head kicks to 1.2× on the same curve; a 10ms buzz on a phone that has one; and his zone, 16px either side of each mark (mine), the head snapping under it in 90ms (mine). None in globals.css yet: these are the values it starts from, and the slider's own fallbacks.",
      risk: "A snapped head leaves the cursor's ring by up to the zone, so a zone much wider than the ring pulls the head out of it; the value holding on the last mark between zones means a drag let go between two marks drops back to the last one it snapped to, which could read as the slider refusing the hand; and a tick is only felt on a phone whose browser vibrates (Android's, not iOS Safari) — on a laptop it is only seen.",
      values: {
        "--slider-mark-size": 6,
        "--slider-mark-lift": 6,
        "--motion-step-pop": 1.8,
        "--motion-step-pop-in": 60,
        "--motion-step-settle": 360,
        "--motion-step-settle-bounce": 0.4,
        "--motion-step-kick": 1.2,
        "--motion-step-haptic": 10,
        "--motion-step-zone": 16,
        "--motion-step-snap": 90,
      },
    },
  ],
};
