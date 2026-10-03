import { easing, motionMs, motionNumber } from "./motion"

/**
 * Liquid (Motion.md M25, his, 2026-10-03): *"to represent that as an icon, let's fill a cell beside in progress with
 * flowing liquid. Fill only 40% of the liquid. So first to test the liquid, we need that in motions."* A box — a cell,
 * which is a circle (Grid.md D39) — holding liquid up to a level, its surface flowing: two waves running across it, the
 * front in the liquid's colour and the back a tone of it mixed toward the card (mixed, never translucent: the no-glass
 * rule), trailing and a little slower, so the two drift past each other; the whole level breathing up and down a
 * little (the bob); and the pour — when the liquid arrives, or its level changes, it rises to the new level over a
 * curve rather than being there at once.
 *
 * Pure: `liquidFrame` is any moment of it, `liquidPath` the SVG path of one wave filling the box below it, and
 * `paintLiquid` writes a frame onto a `Liquid` (components/liquid.tsx). `hooks/use-liquid-motion.ts` plays it, and
 * the motion studio's Liquid page paints any moment of it from here. None of its tokens is in globals.css until he
 * picks (M7): `LIQUID_START` is version 1's.
 */

export type LiquidMotion = {
  /** A wave's height, crest to trough, as a share of the box's height. */
  wave: number
  /** One wavelength, as a multiple of the box's width. */
  length: number
  /** How long one wavelength takes to pass, ms: the flow's speed. 0 and the surface stands still. */
  period: number
  /** The back wave's height, times the front's. */
  backHeight: number
  /** How far the back wave trails the front, as a share of a wavelength. */
  backLag: number
  /** The back wave's speed, times the front's. */
  backSpeed: number
  /** How far the back wave's colour is mixed toward the card: 0 the liquid's own, 1 the card's. */
  backTone: number
  /** How far the whole level rises and falls, as a share of the box's height. */
  bob: number
  /** How long one rise and fall takes, ms. */
  bobPeriod: number
  /** How long the liquid takes to rise to its level, ms, and the curve it rises on. */
  pour: number
  pourEase: (t: number) => number
}

/**
 * Version 1's values: a wave 8% of the box tall and 1.2 boxes long passing in 2.4s; a back wave 70% as tall, a third
 * of a wavelength behind at four fifths of the speed, mixed 45% toward the card; the level breathing 1.5% over 4.2s;
 * and a 1.4s pour on expo out.
 */
export const LIQUID_START = {
  wave: 0.08,
  length: 1.2,
  period: 2400,
  backHeight: 0.7,
  backLag: 0.35,
  backSpeed: 0.8,
  backTone: 0.45,
  bob: 0.015,
  bobPeriod: 4200,
  pour: 1400,
  pourEase: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** The liquid's tokens off `el`, read when it starts to play and when its tokens change, never cached. */
export function readLiquidMotion(el: Element): LiquidMotion {
  const ease = getComputedStyle(el).getPropertyValue("--motion-liquid-pour-ease").trim()
  return {
    wave: clamp(motionNumber(el, "--motion-liquid-wave", LIQUID_START.wave), 0, 0.5),
    length: clamp(motionNumber(el, "--motion-liquid-length", LIQUID_START.length), 0.1, 8),
    period: motionMs(el, "--motion-liquid-period", LIQUID_START.period),
    backHeight: clamp(motionNumber(el, "--motion-liquid-back-height", LIQUID_START.backHeight), 0, 3),
    backLag: clamp(motionNumber(el, "--motion-liquid-back-lag", LIQUID_START.backLag), 0, 1),
    backSpeed: clamp(motionNumber(el, "--motion-liquid-back-speed", LIQUID_START.backSpeed), 0, 4),
    backTone: clamp(motionNumber(el, "--motion-liquid-back-tone", LIQUID_START.backTone), 0, 1),
    bob: clamp(motionNumber(el, "--motion-liquid-bob", LIQUID_START.bob), 0, 0.5),
    bobPeriod: motionMs(el, "--motion-liquid-bob-period", LIQUID_START.bobPeriod),
    pour: motionMs(el, "--motion-liquid-pour", LIQUID_START.pour),
    pourEase: easing(ease || LIQUID_START.pourEase),
  }
}

/** A pour: from one level to another, `since` ms ago. The liquid arrives pouring from 0. */
export type LiquidPour = { from: number; to: number; since: number }

/**
 * One moment of the liquid: its level (0 empty to 1 full, the pour reckoned in), where each wave is along its length
 * (a share of a wavelength), how far the level is bobbed, and whether the waves are drawn (0 under reduced motion, where
 * the surface is a line).
 */
export type LiquidFrame = { level: number; phase: number; backPhase: number; bob: number; waves: number }

/** The level `pour.since` ms into a pour: from `from` to `to` on the pour's curve, there at once with no pour time. */
export function liquidLevel(m: LiquidMotion, pour: LiquidPour): number {
  const k = m.pour <= 0 ? 1 : clamp(pour.since / m.pour, 0, 1)
  return clamp(pour.from + (pour.to - pour.from) * m.pourEase(k), 0, 1)
}

/** Whether a pour is over: the level is where it is going. */
export const liquidPoured = (m: LiquidMotion, pour: LiquidPour) => m.pour <= 0 || pour.since >= m.pour

/** The liquid `t` ms after it started flowing, in a pour. */
export function liquidFrame(m: LiquidMotion, t: number, pour: LiquidPour): LiquidFrame {
  const flow = m.period > 0 ? t / m.period : 0
  return {
    level: liquidLevel(m, pour),
    phase: flow % 1,
    backPhase: (flow * m.backSpeed + m.backLag) % 1,
    bob: m.bobPeriod > 0 ? m.bob * Math.sin((2 * Math.PI * t) / m.bobPeriod) : 0,
    waves: 1,
  }
}

/** The liquid still at `level`: a flat surface, no waves, no bob — what reduced motion shows. */
export const liquidStill = (level: number): LiquidFrame => ({ level: clamp(level, 0, 1), phase: 0, backPhase: 0, bob: 0, waves: 0 })

/**
 * One wave as an SVG path filling the box below it: the surface from the left edge to the right, sampled every few px,
 * then down the right edge, along the bottom and back up. `w` × `h` is the box in px. Empty when there is nothing to
 * draw.
 */
export function liquidPath(m: LiquidMotion, f: LiquidFrame, w: number, h: number, which: "front" | "back"): string {
  if (w <= 0 || h <= 0) return ""
  const level = clamp(f.level + f.bob, 0, 1)
  const amp = (f.waves * (which === "front" ? m.wave : m.wave * m.backHeight) * h) / 2
  if (level <= 0 && amp <= 0) return ""
  const phase = which === "front" ? f.phase : f.backPhase
  const length = Math.max(1, m.length * w)
  const top = h * (1 - level)
  const step = clamp(w / 24, 2, 8)
  const points: string[] = []
  for (let x = 0; ; x += step) {
    const at = Math.min(w, x)
    const y = top + amp * Math.sin(2 * Math.PI * (at / length - phase))
    points.push(`${at.toFixed(1)} ${y.toFixed(2)}`)
    if (at >= w) break
  }
  return `M${points[0]} L${points.slice(1).join(" L")} L${w} ${h} L0 ${h} Z`
}

/** The back wave's colour: the liquid's, mixed `tone` of the way toward the card. Mixed, never translucent. */
export function liquidBackColour(colour: string, tone: number): string {
  const own = Math.round((1 - clamp(tone, 0, 1)) * 100)
  return own >= 100 ? colour : `color-mix(in oklch, ${colour} ${own}%, var(--card))`
}

/**
 * Writes a frame onto a `Liquid`: its waves' paths to its box's size and their fills, from the colour it carries
 * (`--liquid-colour`, the primary unless given). The box is read each time, so a liquid that is resized is right on
 * its next frame.
 */
export function paintLiquid(root: HTMLElement, m: LiquidMotion, f: LiquidFrame): void {
  const svg = root.querySelector<SVGSVGElement>('[data-slot="liquid-waves"]')
  const back = root.querySelector<SVGPathElement>('[data-slot="liquid-back"]')
  const front = root.querySelector<SVGPathElement>('[data-slot="liquid-front"]')
  if (!svg || !back || !front) return
  const w = root.clientWidth
  const h = root.clientHeight
  svg.setAttribute("viewBox", `0 0 ${Math.max(1, w)} ${Math.max(1, h)}`)
  const colour = root.style.getPropertyValue("--liquid-colour").trim() || "var(--primary)"
  back.setAttribute("d", liquidPath(m, f, w, h, "back"))
  back.setAttribute("fill", liquidBackColour(colour, m.backTone))
  front.setAttribute("d", liquidPath(m, f, w, h, "front"))
  front.setAttribute("fill", colour)
}
