import type { Family, Token } from "./families";

/**
 * Liquid (Motion.md M25, his, 2026-10-03: "fill a cell beside in progress with flowing liquid. Fill only 40% of the
 * liquid. So first to test the liquid, we need that in motions"): eleven tokens in four groups. **Wave** is the front
 * surface — how tall, how long, how fast. **Back wave** is the second surface behind it, in a tone of the colour:
 * its height against the front's, how far it trails and how much slower it runs (the two drift past each other), and
 * how far its colour is mixed toward the card. **Sway** is the whole level breathing. **Pour** is how the liquid
 * rises to its level when it arrives or the level changes. None is in globals.css: `LIQUID_START` in the package is
 * version 1's, and these are the same values.
 */
const TOKENS: Token[] = [
  { name: "--motion-liquid-wave", label: "Height", touches: "How tall each wave is, crest to trough, as a share of the box's height.", kind: "share", min: 0, max: 0.4, step: 0.005, group: "Wave" },
  { name: "--motion-liquid-length", label: "Length", touches: "One wavelength, as a multiple of the box's width.", kind: "scale", unit: "multiplier", min: 0.25, max: 4, step: 0.05, group: "Wave" },
  { name: "--motion-liquid-period", label: "Period", touches: "How long one wave takes to pass: the flow's speed.", kind: "ms", min: 400, max: 8000, step: 100, group: "Wave" },
  { name: "--motion-liquid-back-height", label: "Height", touches: "The back wave's height, times the front's.", kind: "scale", unit: "multiplier", min: 0, max: 2, step: 0.05, group: "Back wave" },
  { name: "--motion-liquid-back-lag", label: "Lag", touches: "How far the back wave trails the front, as a share of a wavelength.", kind: "share", min: 0, max: 1, step: 0.05, group: "Back wave" },
  { name: "--motion-liquid-back-speed", label: "Speed", touches: "The back wave's speed, times the front's: anything but 1 and the two drift past each other.", kind: "scale", unit: "multiplier", min: 0, max: 2, step: 0.05, group: "Back wave" },
  { name: "--motion-liquid-back-tone", label: "Tone", touches: "How far the back wave's colour is mixed toward the card: 0 the liquid's own, 1 the card's.", kind: "share", min: 0, max: 1, step: 0.05, group: "Back wave" },
  { name: "--motion-liquid-bob", label: "Bob", touches: "How far the whole level rises and falls, as a share of the box's height; 0 holds it.", kind: "share", min: 0, max: 0.2, step: 0.005, group: "Sway" },
  { name: "--motion-liquid-bob-period", label: "Bob period", touches: "How long one rise and fall takes.", kind: "ms", min: 500, max: 12000, step: 100, group: "Sway" },
  { name: "--motion-liquid-pour", label: "Pour", touches: "How long the liquid takes to rise to its level when it arrives or the level changes; 0 and it is there at once.", kind: "ms", min: 0, max: 4000, step: 50, group: "Pour" },
  { name: "--motion-liquid-pour-ease", label: "Pour ease", touches: "The curve it rises on.", kind: "ease", group: "Pour" },
];

export const LIQUID_FAMILY: Family = {
  id: "liquid",
  label: "Liquid",
  title: "Liquid: a box filled to a level, its surface flowing",
  touches:
    "A Liquid holds liquid up to a level in whatever box it is given — a cell is a circle. Its surface flows as two waves running across it: the front in the liquid's colour, the back a tone of it mixed toward the card, trailing and a little slower, so the two drift past each other. The whole level breathes up and down a little. When the liquid arrives, or its level changes, it pours: the level rises on a curve rather than being there at once. The status page fills a cell beside each app that is in progress with it, 40% full.",
  hint: "Watch it flow; set the level on the specimen; press Play to pour it from empty.",
  // The block is the liquid's box: a cell to start with, as the status page has it.
  block: { columns: 1, rows: 1, max: 6 },
  version: 1,
  tokens: TOKENS,
  presets: [
    {
      id: "A",
      name: "Version 1",
      why: "His brief as I read it: a wave 8% of the box tall and 1.2 boxes long passing in 2.4s, so a cell shows about one crest at a time; a back wave 70% as tall a third of a wavelength behind at four fifths of the speed, mixed 45% toward the card, which gives the surface depth with one flat colour and no translucency; the level breathing 1.5% over 4.2s so it is never quite still; and a 1.4s pour on expo out when it arrives. None in globals.css yet: these are the values it starts from.",
      risk: "In a cell 60px wide a wave 8% tall is under 5px, which may read as a shimmer rather than liquid; the back wave's tone depends on the card's colour, so it reads differently in the two themes; and a bob on eight cells at once on the status page may look like the page breathing rather than each liquid — the bob can go to 0.",
      values: {
        "--motion-liquid-wave": 0.08,
        "--motion-liquid-length": 1.2,
        "--motion-liquid-period": 2400,
        "--motion-liquid-back-height": 0.7,
        "--motion-liquid-back-lag": 0.35,
        "--motion-liquid-back-speed": 0.8,
        "--motion-liquid-back-tone": 0.45,
        "--motion-liquid-bob": 0.015,
        "--motion-liquid-bob-period": 4200,
        "--motion-liquid-pour": 1400,
        "--motion-liquid-pour-ease": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  ],
};
