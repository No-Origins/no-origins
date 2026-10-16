import { COLOURS } from "./colours";
import type { Jig } from "./jig";

/**
 * The clouds' jig, version 1 (World.md W38; his: "Give me jig controls for the clouds above"): the ceiling clouds (W33),
 * tuned on a page of their own, `/build/clouds`, seen as the Environment's page sees them. What was W36's art, fixed,
 * is now his to tune; these starts are W36's values. Nothing here is three.js; `build-clouds.ts` draws from it.
 */
export const CLOUDS_VERSION = 1;

export type CloudsConfig = {
  /** The layer: how high the masses rise over the ceiling, how much of the sky they fill, and the sizes of their forms. */
  thickness: number;
  coverage: number;
  masses: number;
  billows: number;
  stretch: number;
  /** The edge: how far a mass's edge feathers, and how much of the thin wisps show along the wind. */
  feather: number;
  wisps: number;
  /** The paint: lit, middle and shaded colours; the sky washed over every cloud; the haze; the sun's glow at the margins; the grain. */
  cream: string;
  rose: string;
  sage: string;
  wash: number;
  haze: number;
  glow: number;
  grain: number;
  /** The motion: metres drifted along the Sky's Wind for each second of the clouds' clock, and how fast the billows roll. */
  drift: number;
  roll: number;
};

/** His settings: W36's, softer and pastel, as he saw them in Environment version 22. */
export const CLOUDS_START: CloudsConfig = {
  thickness: 240,
  coverage: 0.5,
  masses: 8000,
  billows: 2600,
  stretch: 1.6,
  feather: 0.08,
  wisps: 0.45,
  cream: "#fff6e8",
  rose: "#f7cdd8",
  sage: "#cdd4c3",
  wash: 0.1,
  haze: 9000,
  glow: 0.3,
  grain: 0.035,
  drift: 10,
  roll: 0.6,
};

export const CLOUDS_JIG: Jig<CloudsConfig> = {
  name: "Clouds",
  version: CLOUDS_VERSION,
  start: CLOUDS_START,
  groups: [
    {
      title: "Layer",
      note: ({ thickness }) =>
        `The world's ceiling, 1000 m up, reaching past its sides to the horizon. The masses rise up to ${thickness} m from it, tallest at their cores; Coverage fills the sky or opens it; Masses and Billows are the sizes of the big forms and the puffs on them; Stretch draws them out along the Sky's Wind.`,
      controls: [
        { kind: "number", key: "thickness", label: "Thickness", min: 0, max: 600, step: 10, marks: 100, unit: "m" },
        { kind: "number", key: "coverage", label: "Coverage", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "masses", label: "Masses", min: 3000, max: 12000, step: 500, marks: 3000, unit: "m" },
        { kind: "number", key: "billows", label: "Billows", min: 1000, max: 5000, step: 100, marks: 1000, unit: "m" },
        { kind: "number", key: "stretch", label: "Stretch", min: 1, max: 4, step: 0.1, marks: 1, unit: "×" },
      ],
    },
    {
      title: "Edge",
      note: () => "Feather is how far an edge fades, like a dry brush; Wisps are the thin streaks along the wind outside a mass.",
      controls: [
        { kind: "number", key: "feather", label: "Feather", min: 0, max: 0.2, step: 0.01, marks: 0.05 },
        { kind: "number", key: "wisps", label: "Wisps", min: 0, max: 1, step: 0.05, marks: 0.25 },
      ],
    },
    {
      title: "Paint",
      note: () => "Cream where lit, rose in the middle tones, sage in shade. Wash is the sky's colour over every cloud; Haze is how far off they dissolve into it; Glow is the sun through the thin margins.",
      controls: [
        { kind: "colour", key: "cream", label: "Cream", options: COLOURS },
        { kind: "colour", key: "rose", label: "Rose", options: COLOURS },
        { kind: "colour", key: "sage", label: "Sage", options: COLOURS },
        { kind: "number", key: "wash", label: "Wash", min: 0, max: 0.5, step: 0.05 },
        { kind: "number", key: "haze", label: "Haze", min: 2000, max: 20000, step: 500, marks: 6000, unit: "m" },
        { kind: "number", key: "glow", label: "Glow", min: 0, max: 1, step: 0.05, marks: 0.25 },
        { kind: "number", key: "grain", label: "Grain", min: 0, max: 0.1, step: 0.005, marks: 0.025 },
      ],
    },
    {
      title: "Motion",
      note: () => "Drift follows the Sky's Wind on the clouds' clock, which the Environment's Motion pauses; Roll is how fast the puffs turn over.",
      controls: [
        { kind: "number", key: "drift", label: "Drift", min: 0, max: 30, step: 1, marks: 10, unit: "m/s" },
        { kind: "number", key: "roll", label: "Roll", min: 0, max: 2, step: 0.1, marks: 0.5, unit: "×" },
      ],
    },
  ],
  copy: (config) => [`Settings JSON: ${JSON.stringify(config)}`],
};
