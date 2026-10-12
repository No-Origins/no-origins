import type { ColourOption } from "@no-origins/ui/components/colour-picker";
import { springAt } from "@no-origins/ui/lib/spring";

/**
 * The portal, version 5, FROZEN: he has seen it, and version 6 (`portal.ts`) answers his notes on it. Nothing draws it.
 *
 * The portal, version 5 (World.md W3: what a thing can be is code). Called the hole until version 4 (his: "Let's call
 * these holes as portals"). A round opening in the ground, as in his first mock of the start location: a thin line round
 * its edge, and its wall falling into the dark like a shadow. New in version 5, how it opens (his: "Portals should
 * expand while it loads with a fluid motion"): it grows out of a point to its size on a spring, its edge rippling like
 * a liquid's as it spreads, the ripple dying away as the spring comes to rest.
 *
 * His notes on the hole, a version each: on version 1 (`portal-v1.ts`, frozen), "Instead of steps and shade, I think
 * it should be gradient like a shadow or dark hole"; on version 2 (`portal-v2.ts`), "We don't need rim and glow"; on
 * version 3 (`portal-v3.ts`), "I think we should have rim. I'm thinking minimal line rim at the edge?"; on version 4
 * (`portal-v4.ts`), "We need black in the color palette", then the opening.
 *
 * This file is what the portal is, its controls and how it opens, and nothing of three.js, so the page's controls can
 * read it without loading the world. `build-portal-v5.ts` makes it.
 *
 * A version he has seen is frozen: a change to what it can be is version 6, beside this one.
 */
export const PORTAL_VERSION = 5;

export type PortalConfig = {
  /** The opening's radius, in metres. */
  radius: number;
  /** How far down it goes from the ground, in metres. */
  depth: number;
  /** The rim: a line on the ground round the opening's edge, how wide in metres, and its colour. */
  rimWidth: number;
  rim: string;
  /**
   * The wall inside: its colour at the opening, falling smoothly into the dark below it, as a shadow does. `darkness`
   * is how dark the bottom is (0 the wall's colour, 1 the dark), `reach` how far up the wall the dark climbs (0 only at
   * the bottom, 1 from the opening).
   */
  wall: string;
  darkness: number;
  reach: number;
  /**
   * How it opens. It grows on a spring in the system's terms (`@no-origins/ui/lib/spring`, the slider's grip,
   * Motion.md M16): `response`, ms, how long one swing takes, and `bounce`, 0 none to 0.9, how far it swings past its
   * size and back. `ripple` is how far its edge ripples in and out as it spreads, a share of its radius, and `waves`
   * how many waves go round the edge.
   */
  response: number;
  bounce: number;
  ripple: number;
  waves: number;
};

/**
 * The swatches of the rim's and the wall's colours: seven taken from his first mock (mine, named for what they look
 * like), and black (his: "We need black in the color palette"). Not the agents' paints, which are theirs alone
 * (Orbit.md C20).
 */
export const COLOURS: readonly ColourOption[] = [
  { value: "#f7f1f2", label: "Cream", colour: "#f7f1f2" },
  { value: "#efe5e8", label: "Sand", colour: "#efe5e8" },
  { value: "#f2bfa6", label: "Peach", colour: "#f2bfa6" },
  { value: "#e6a3ad", label: "Rose", colour: "#e6a3ad" },
  { value: "#a7aae6", label: "Lavender", colour: "#a7aae6" },
  { value: "#6d6290", label: "Dusk", colour: "#6d6290" },
  { value: "#7ddde3", label: "Teal", colour: "#7ddde3" },
  { value: "#000000", label: "Black", colour: "#000000" },
];

/** What the portal is before he tunes it. The opening's four are mine, for him to tune. */
export const PORTAL_START: PortalConfig = {
  radius: 0.6,
  depth: 1,
  rimWidth: 0.02,
  rim: "#6d6290",
  wall: "#f2bfa6",
  darkness: 1,
  reach: 1,
  response: 700,
  bounce: 0.3,
  ripple: 0.12,
  waves: 3,
};

type NumberKey = { [K in keyof PortalConfig]: PortalConfig[K] extends number ? K : never }[keyof PortalConfig];

/** A number control: its label, range and step (each at most twenty steps, so the slider's marks show), and unit. */
export type PortalNumber = { key: NumberKey; label: string; min: number; max: number; step: number; unit?: string };

/** The controls, grouped as the card shows them. */
export const PORTAL_CONTROLS = {
  size: [
    { key: "radius", label: "Radius", min: 0.2, max: 1.2, step: 0.1, unit: "m" },
    { key: "depth", label: "Depth", min: 0.2, max: 2, step: 0.2, unit: "m" },
  ],
  rim: [{ key: "rimWidth", label: "Width", min: 0.01, max: 0.1, step: 0.01, unit: "m" }],
  wall: [
    { key: "darkness", label: "Darkness", min: 0, max: 1, step: 0.1 },
    { key: "reach", label: "Reach", min: 0, max: 1, step: 0.1 },
  ],
  opening: [
    { key: "response", label: "Response", min: 200, max: 1600, step: 100, unit: "ms" },
    { key: "bounce", label: "Bounce", min: 0, max: 0.9, step: 0.1 },
    { key: "ripple", label: "Ripple", min: 0, max: 0.3, step: 0.02 },
    { key: "waves", label: "Waves", min: 2, max: 8, step: 1 },
  ],
} satisfies Record<string, readonly PortalNumber[]>;

/** A number as the card shows it and Copy sends it: its step's decimals, and its unit. */
export function formatNumber(control: PortalNumber, value: number): string {
  const decimals = (String(control.step).split(".")[1] ?? "").length;
  return `${value.toFixed(decimals)}${control.unit ? ` ${control.unit}` : ""}`;
}

const colourName = (value: string) => COLOURS.find((c) => c.value === value)?.label ?? value;

/** The settings, as the lines Copy sends back. */
export function portalSettings(config: PortalConfig): string {
  const n = (group: readonly PortalNumber[]) => group.map((c) => `${c.label} ${formatNumber(c, config[c.key])}`).join(" · ");
  return [
    `Portal, version ${PORTAL_VERSION}`,
    `Size: ${n(PORTAL_CONTROLS.size)}`,
    `Rim: ${n(PORTAL_CONTROLS.rim)} · ${colourName(config.rim)}`,
    `Wall: ${colourName(config.wall)} · ${n(PORTAL_CONTROLS.wall)}`,
    `Opening: ${n(PORTAL_CONTROLS.opening)}`,
  ].join("\n");
}

// ── how it opens ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The portal at one moment of its opening: how far it has grown (0 a point, 1 its size, past 1 while it swings over),
 * how far its edge ripples now, where the waves have travelled round it, and whether it has come to rest.
 */
export type Opening = { grown: number; ripple: number; phase: number; done: boolean };

/** At rest, open: its size, and its edge round. */
export const OPEN: Opening = { grown: 1, ripple: 0, phase: 0, done: true };

/**
 * The opening `t` ms after it set off, the same frame however it is reached (Motion.md M17). It grows from a point on
 * the spring; the ripple is as strong as the spring is still moving (how far it is from its size, and how fast it is
 * going), so it dies away as the portal comes to rest. The waves travel round the edge one wave a swing.
 */
export function openingAt(config: PortalConfig, t: number): Opening {
  if (!Number.isFinite(t)) return OPEN;
  const { x, v } = springAt({ x: 0, v: 0 }, 1, t, { response: config.response, bounce: config.bounce });
  const w0 = (2 * Math.PI) / config.response;
  const moving = Math.min(1, Math.hypot(1 - x, v / w0));
  return { grown: x, ripple: config.ripple * moving, phase: (2 * Math.PI * t) / config.response, done: moving < 0.001 };
}

/**
 * How far the opening's edge stands from its centre at an angle round it, in metres: its radius as far as it has
 * grown, rippled. Two waves go round the edge in turns opposite to each other, so the ripple reads as a liquid's, not
 * a turning wheel; `waves` is a whole number, so the edge closes on itself.
 */
export function edgeAt(config: PortalConfig, at: Opening, angle: number): number {
  const k = config.waves;
  const wave = 0.6 * Math.sin(k * angle + at.phase) + 0.4 * Math.sin((k + 1) * angle - 0.7 * at.phase + 2.1);
  return Math.max(0, config.radius * at.grown * (1 + at.ripple * wave));
}

/** How wide the rim is at a moment of the opening: it grows in with the portal, never past its width. */
export const rimAt = (config: PortalConfig, at: Opening) => config.rimWidth * Math.min(1, Math.max(0, at.grown));

/**
 * How far out the ground is cut round the portal: past the furthest its rim reaches at any moment of its opening, so
 * nothing the portal does ever meets the ground. Between the rim and the cut lies a collar of the ground's own colour
 * (`build-portal.ts`), so at rest the portal looks cut to its rim.
 */
export function cutOf(config: PortalConfig): number {
  let far = config.radius + config.rimWidth;
  for (let t = 0; t < 60_000; t += 8) {
    const at = openingAt(config, t);
    far = Math.max(far, config.radius * at.grown * (1 + at.ripple) + rimAt(config, at));
    if (at.done) break;
  }
  return far * 1.01 + 0.002;
}
