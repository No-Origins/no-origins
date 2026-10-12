import type { ColourOption } from "@no-origins/ui/components/colour-picker";

/**
 * The hole, version 2, FROZEN: he has seen it, and version 3 (`portal.ts`) answers his note on it. Nothing draws it.
 *
 * The hole, version 2 (World.md W3: what a thing can be is code). A round hole cut into the ground, as in his first
 * mock of the start location: a pale rim round it, its wall falling into the dark like a shadow, and a band of light
 * inside. Version 2 answers his note on version 1 (`portal-v1.ts`, frozen): "Instead of steps and shade, I think it
 * should be gradient like a shadow or dark hole".
 * This file is what the hole is and which controls it has, and nothing of three.js, so the page's controls can read it
 * without loading the world. `build-portal-v2.ts` makes it.
 *
 * A version he has seen is frozen: a change to what it can be is version 2, beside this one.
 */
export const HOLE_VERSION = 2;

export type HoleConfig = {
  /** The opening's radius, in metres. */
  radius: number;
  /** How far down it goes from the ground, in metres. */
  depth: number;
  /** The rim round the opening: how wide, how high over the ground, in metres, and its colour. */
  rimWidth: number;
  rimHeight: number;
  rim: string;
  /**
   * The wall inside: its colour at the rim, falling smoothly into the dark below it, as a shadow does. `darkness` is
   * how dark the bottom is (0 the wall's colour, 1 the dark), `reach` how far up the wall the dark climbs (0 only at
   * the bottom, 1 from the rim).
   */
  wall: string;
  darkness: number;
  reach: number;
  /** The band of light inside the wall: whether it is there, its colour, and how far down the wall (0 top, 1 bottom). */
  glow: boolean;
  glowColour: string;
  glowAt: number;
};

/**
 * Colours taken from his first mock (mine, named for what they look like), the swatches of every colour the hole
 * picks. Not the agents' paints, which are theirs alone (Orbit.md C20).
 */
export const MOCK_COLOURS: readonly ColourOption[] = [
  { value: "#f7f1f2", label: "Cream", colour: "#f7f1f2" },
  { value: "#efe5e8", label: "Sand", colour: "#efe5e8" },
  { value: "#f2bfa6", label: "Peach", colour: "#f2bfa6" },
  { value: "#e6a3ad", label: "Rose", colour: "#e6a3ad" },
  { value: "#a7aae6", label: "Lavender", colour: "#a7aae6" },
  { value: "#6d6290", label: "Dusk", colour: "#6d6290" },
  { value: "#7ddde3", label: "Teal", colour: "#7ddde3" },
];

/** What the hole is before he tunes it: read off his mock. */
export const HOLE_START: HoleConfig = {
  radius: 0.6,
  depth: 1,
  rimWidth: 0.1,
  rimHeight: 0.04,
  rim: "#f7f1f2",
  wall: "#f2bfa6",
  darkness: 1,
  reach: 1,
  glow: true,
  glowColour: "#7ddde3",
  glowAt: 0.2,
};

type NumberKey = { [K in keyof HoleConfig]: HoleConfig[K] extends number ? K : never }[keyof HoleConfig];

/** A number control: its label, range and step (each at most twenty steps, so the slider's marks show), and unit. */
export type HoleNumber = { key: NumberKey; label: string; min: number; max: number; step: number; unit?: string };

/** The controls, grouped as the card shows them. */
export const HOLE_CONTROLS = {
  size: [
    { key: "radius", label: "Radius", min: 0.2, max: 1.2, step: 0.1, unit: "m" },
    { key: "depth", label: "Depth", min: 0.2, max: 2, step: 0.2, unit: "m" },
  ],
  rim: [
    { key: "rimWidth", label: "Width", min: 0, max: 0.2, step: 0.02, unit: "m" },
    { key: "rimHeight", label: "Height", min: 0, max: 0.1, step: 0.01, unit: "m" },
  ],
  wall: [
    { key: "darkness", label: "Darkness", min: 0, max: 1, step: 0.1 },
    { key: "reach", label: "Reach", min: 0, max: 1, step: 0.1 },
  ],
  glow: [{ key: "glowAt", label: "Depth", min: 0, max: 1, step: 0.1 }],
} satisfies Record<string, readonly HoleNumber[]>;

/** A number as the card shows it and Copy sends it: its step's decimals, and its unit. */
export function formatNumber(control: HoleNumber, value: number): string {
  const decimals = (String(control.step).split(".")[1] ?? "").length;
  return `${value.toFixed(decimals)}${control.unit ? ` ${control.unit}` : ""}`;
}

const colourName = (value: string) => MOCK_COLOURS.find((c) => c.value === value)?.label ?? value;

/** The settings, as the lines Copy sends back. */
export function holeSettings(config: HoleConfig): string {
  const n = (group: readonly HoleNumber[]) => group.map((c) => `${c.label} ${formatNumber(c, config[c.key])}`).join(" · ");
  return [
    `Hole, version ${HOLE_VERSION}`,
    `Size: ${n(HOLE_CONTROLS.size)}`,
    `Rim: ${n(HOLE_CONTROLS.rim)} · ${colourName(config.rim)}`,
    `Wall: ${colourName(config.wall)} · ${n(HOLE_CONTROLS.wall)}`,
    `Glow: ${config.glow ? `${colourName(config.glowColour)} · ${n(HOLE_CONTROLS.glow)}` : "off"}`,
  ].join("\n");
}
