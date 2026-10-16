import { springAt } from "@no-origins/ui/lib/spring";

import { COLOURS } from "./colours";
import { configOf, type Jig } from "./jig";
import { PUBLISHED_PORTALS } from "./published";
import type { Variant } from "./variants";

/**
 * The portal, version 6, FROZEN: he has seen it, and version 7 (`portal.ts`) answers W89 (his: a portal's look "should be
 * configured at the time of placement"). Nothing draws it.
 *
 * The portal, version 6 (World.md W3: what a thing can be is code). Called the hole until version 4 (his: "Let's call
 * these holes as portals"). A round opening in the ground, as in his first mock of the start location: a thin line round
 * its edge, and its wall falling into the dark like a shadow. New in version 5, how it opens (his: "Portals should
 * expand while it loads with a fluid motion"): it grows out of a point to its size on a spring, its edge rippling like
 * a liquid's as it spreads, the ripple dying away as the spring comes to rest. Version 6 lets the dark climb past the
 * opening, and draws the waves round the edge at random from a range, anew each time it opens.
 *
 * His notes on the hole, a version each: on version 1 (`portal-v1.ts`, frozen), "Instead of steps and shade, I think
 * it should be gradient like a shadow or dark hole"; on version 2 (`portal-v2.ts`), "We don't need rim and glow"; on
 * version 3 (`portal-v3.ts`), "I think we should have rim. I'm thinking minimal line rim at the edge?"; on version 4
 * (`portal-v4.ts`), "We need black in the color palette", then the opening; on version 5 (`portal-v5.ts`), "Increase the
 * range for reach till 2.0" and "I need waves to be range I can set and the waves should be random values between the
 * range".
 *
 * This file is what the portal is, its jig and how it opens, and nothing of three.js, so the page's controls can
 * read it without loading the world. `build-portal.ts` makes it.
 *
 * A version he has seen is frozen: a change to what it can be is version 7, beside this one.
 */
export const PORTAL_VERSION = 6;

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
   * the bottom, 1 from the opening, 2 past it, so the wall is half dark already at the opening).
   */
  wall: string;
  darkness: number;
  reach: number;
  /**
   * How it opens. It grows on a spring in the system's terms (`@no-origins/ui/lib/spring`, the slider's grip,
   * Motion.md M16): `response`, ms, how long one swing takes, and `bounce`, 0 none to 0.9, how far it swings past its
   * size and back. `ripple` is how far its edge ripples in and out as it spreads, a share of its radius, and how many
   * waves go round the edge is drawn at random from `wavesFrom` to `wavesTo` each time it opens (`drawWaves`).
   */
  response: number;
  bounce: number;
  ripple: number;
  wavesFrom: number;
  wavesTo: number;
};

/**
 * The portal as he set it (his, 2026-10-12: "Here are the settings I want for Portals"): what every portal in the world
 * is, and what the portal's page starts from and Reset goes back to.
 */
export const PORTAL_START: PortalConfig = PUBLISHED_PORTALS[0].settings;
/** His settings as he sent them (2026-10-12), the first published copy; kept to read, not read by anything. */
export const PORTAL_SENT: PortalConfig = {
  radius: 0.5,
  depth: 2,
  rimWidth: 0.01,
  rim: "#000000",
  wall: "#f7f1f2",
  darkness: 1,
  reach: 1,
  response: 300,
  bounce: 0.4,
  ripple: 0.1,
  wavesFrom: 3,
  wavesTo: 8,
};

/** The portal's card (World.md W14): its controls, grouped as the card shows them. */
export const PORTAL_JIG: Jig<PortalConfig> = {
  name: "Portal",
  version: PORTAL_VERSION,
  start: PORTAL_START,
  groups: [
    {
      title: "Size",
      controls: [
        { kind: "number", key: "radius", label: "Radius", min: 0.2, max: 1.2, step: 0.1, unit: "m" },
        { kind: "number", key: "depth", label: "Depth", min: 0.2, max: 2, step: 0.2, unit: "m" },
      ],
    },
    {
      title: "Rim",
      controls: [
        { kind: "number", key: "rimWidth", label: "Width", min: 0.01, max: 0.1, step: 0.01, unit: "m" },
        { kind: "colour", key: "rim", label: "Colour", options: COLOURS },
      ],
    },
    {
      title: "Wall",
      controls: [
        { kind: "colour", key: "wall", label: "Colour", options: COLOURS },
        { kind: "number", key: "darkness", label: "Darkness", min: 0, max: 1, step: 0.1 },
        { kind: "number", key: "reach", label: "Reach", min: 0, max: 2, step: 0.1 },
      ],
    },
    {
      title: "Opening",
      controls: [
        { kind: "number", key: "response", label: "Response", min: 200, max: 1600, step: 100, unit: "ms" },
        { kind: "number", key: "bounce", label: "Bounce", min: 0, max: 0.9, step: 0.1 },
        { kind: "number", key: "ripple", label: "Ripple", min: 0, max: 0.3, step: 0.02 },
        { kind: "number", key: "wavesFrom", to: "wavesTo", label: "Waves", min: 2, max: 12, step: 1 },
      ],
    },
  ],
  // W71: Copy ends with the settings exactly, so what he sends back is what the world starts from.
  copy: (config) => [`Settings JSON: ${JSON.stringify(config)}`],
};

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
 * The waves round the edge for one opening: three, each going round a whole number of times, drawn at random from
 * `wavesFrom` to `wavesTo`, and each starting at a random place round it. Drawn anew each time the portal opens, so no
 * two openings ripple alike.
 */
export type Waves = { counts: readonly number[]; starts: readonly number[] };

/** How strong each of the three waves is (together 1, so the edge never ripples past `ripple`), and how fast and which way it travels. */
const WAVE_STRENGTH = [0.5, 0.3, 0.2];
const WAVE_SPEED = [1, -0.7, 1.3];

export function drawWaves(config: PortalConfig, random: () => number = Math.random): Waves {
  const from = Math.round(Math.min(config.wavesFrom, config.wavesTo));
  const to = Math.round(Math.max(config.wavesFrom, config.wavesTo));
  return {
    counts: WAVE_STRENGTH.map(() => from + Math.floor(random() * (to - from + 1))),
    starts: WAVE_STRENGTH.map(() => random() * Math.PI * 2),
  };
}

/**
 * How far the opening's edge stands from its centre at an angle round it, in metres: its radius as far as it has
 * grown, rippled by the opening's waves. They travel round the edge at different speeds and in turns opposite to each
 * other, so the ripple reads as a liquid's, not a turning wheel; each is a whole number round, so the edge closes on
 * itself.
 */
export function edgeAt(config: PortalConfig, at: Opening, waves: Waves, angle: number): number {
  let wave = 0;
  for (let i = 0; i < WAVE_STRENGTH.length; i++) {
    wave += WAVE_STRENGTH[i] * Math.sin(waves.counts[i] * angle + waves.starts[i] + WAVE_SPEED[i] * at.phase);
  }
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

/** His variants (World.md W72): the one portal he has tuned (W14, his settings); what stands on its page. */
/** His variants of the portal (W72, W73): the published copy (`published.ts`); the first, his settings of 2026-10-12, is what the page starts from. */
export const PORTAL_VARIANTS: readonly Variant<PortalConfig>[] = PUBLISHED_PORTALS;

/** A portal's settings as something kept them, read against the jig (a variant, W72); nothing is null. */
export const portalConfigOf = (saved: unknown) => configOf(PORTAL_JIG, saved);
