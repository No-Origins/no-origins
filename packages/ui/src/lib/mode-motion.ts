import type { CSSProperties } from "react"

import { focusRings, type FocusBox } from "@no-origins/ui/lib/focus-motion"
import { easing, motionMs, motionNumber } from "@no-origins/ui/lib/motion"

/**
 * Focus mode (Motion.md M14, his, 2026-09-28), pure: one vertical of the page read at a time. "An overlay on top of the
 * first section … a little above the section, like it's coming out of the screen in 3D … the rest should feel like a
 * cloth overlay … start blurring out from the edges of the focus component … like we are looking through a panel that
 * gives us more focus on that vertical." A **panel** comes out of the page over the vertical, and a **cloth** of blur
 * rolls out from the panel's edges over everything else, least at the panel and rising outward. Moving to another
 * vertical, the panel slides there, and the vertical left sinks back under the cloth as the next one comes up.
 *
 * The panel is a see-through frame with a shadow, lifted in 3D (`modeLift`): perspective, a push towards the eye and a
 * swing on the way. What is under it stays sharp, because the cloth has a hole where the panel stands.
 *
 * The cloth is drawn as focus's is (focus-motion.ts): layers over the surface, each a `backdrop-filter` blur, one a
 * ring of the rise (`focusRings`, the same field). Here a ring is measured from the panel's EDGES, not a circle round a
 * card's centre: each layer is masked to what lies farther than its ring from the hole's rectangle, by four gradients
 * (`modeLayerStyles`). Rolling out, the cloth's edge is a clip, a rounded rectangle growing from the panel to the far
 * corner of the surface. What moves is a few custom properties on the surface (`paintMode`).
 *
 * None of the tokens is in globals.css until he picks (Motion.md M7): every fallback here is the studio's preset A,
 * "As described", whose cloth is focus's decided field measured from the panel's edges.
 */

export type ModeWay = "unfurl" | "swell" | "fade"
export const MODE_WAYS: readonly ModeWay[] = ["unfurl", "swell", "fade"]

/** The motion, read off an element (`readModeMotion`). Distances in cells, blurs and lengths in px, times in ms. */
export type ModeMotion = {
  /** The panel coming out of the page and going back, and its curve. */
  liftMs: number
  liftEase: (t: number) => number
  /** How far it comes towards the eye, px, seen through a perspective `perspective` px away. */
  depth: number
  perspective: number
  /** How far it swings about its horizontal axis on the way, degrees: none at rest, all of it half way. */
  tilt: number
  /** Its shadow's blur when lifted, px; the offset is half of it. */
  shadow: number
  /** The panel's margin round the vertical, px. */
  pad: number
  /** The cloth: its blur at the panel, and at the end of the reach and beyond. */
  near: number
  far: number
  /** A sharp margin round the panel before the blur starts to rise, and how far it rises over, cells. */
  clear: number
  reach: number
  rise: (t: number) => number
  rings: number
  /** A wash of the page's own colour over the cloth, 0 to 1. */
  veil: number
  /** How the cloth comes and goes: rolled out from the panel and back into it, swelling everywhere, or a fade. */
  way: ModeWay
  inMs: number
  inEase: (t: number) => number
  outMs: number
  outEase: (t: number) => number
  /** Coming in, the cloth sets off this long after the panel; going, the panel this long after the cloth. */
  staggerMs: number
  /** From one vertical to the next: the panel's slide, its curve, and how far it sinks on the way, 0 to 1. */
  slideMs: number
  slideEase: (t: number) => number
  dip: number
}

/** Preset A, "As described" (content/mode.ts in the studio): what every token falls back to. */
export const MODE_START = {
  lift: 520,
  liftEase: "cubic-bezier(0.32, 0.72, 0, 1)",
  depth: 48,
  perspective: 1200,
  tilt: 6,
  shadow: 40,
  pad: 8,
  near: 1,
  far: 22,
  clear: 0,
  reach: 10,
  rise: "ease-in",
  rings: 10,
  veil: 0,
  way: "unfurl" as ModeWay,
  in: 1500,
  inEase: "cubic-bezier(0.65, 0, 0.35, 1)",
  out: 800,
  outEase: "cubic-bezier(0.65, 0, 0.35, 1)",
  stagger: 120,
  slide: 500,
  slideEase: "cubic-bezier(0.65, 0, 0.35, 1)",
  dip: 0,
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const clamp01 = (t: number) => clamp(t, 0, 1)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const easeOr = (el: Element, token: `--motion-${string}`, fallback: string) =>
  easing(getComputedStyle(el).getPropertyValue(token).trim() || fallback)

/** The focus-mode tokens off `el`, read when the mode turns on, off or moves — never cached: the studio retunes. */
export function readModeMotion(el: Element): ModeMotion {
  const s = MODE_START
  const way = getComputedStyle(el).getPropertyValue("--motion-mode-way").trim() as ModeWay
  return {
    liftMs: motionMs(el, "--motion-mode-lift", s.lift),
    liftEase: easeOr(el, "--motion-mode-lift-ease", s.liftEase),
    depth: motionNumber(el, "--motion-mode-depth", s.depth),
    perspective: Math.max(100, motionNumber(el, "--motion-mode-perspective", s.perspective)),
    tilt: motionNumber(el, "--motion-mode-tilt", s.tilt),
    shadow: Math.max(0, motionNumber(el, "--motion-mode-shadow", s.shadow)),
    pad: Math.max(0, motionNumber(el, "--motion-mode-pad", s.pad)),
    near: Math.max(0, motionNumber(el, "--motion-mode-near", s.near)),
    far: Math.max(0, motionNumber(el, "--motion-mode-far", s.far)),
    clear: Math.max(0, motionNumber(el, "--motion-mode-clear", s.clear)),
    reach: Math.max(0.1, motionNumber(el, "--motion-mode-reach", s.reach)),
    rise: easeOr(el, "--motion-mode-rise", s.rise),
    rings: clamp(Math.round(motionNumber(el, "--motion-mode-rings", s.rings)), 1, 12),
    veil: clamp01(motionNumber(el, "--motion-mode-veil", s.veil)),
    way: MODE_WAYS.includes(way) ? way : s.way,
    inMs: motionMs(el, "--motion-mode-in", s.in),
    inEase: easeOr(el, "--motion-mode-in-ease", s.inEase),
    outMs: motionMs(el, "--motion-mode-out", s.out),
    outEase: easeOr(el, "--motion-mode-out-ease", s.outEase),
    staggerMs: motionMs(el, "--motion-mode-stagger", s.stagger),
    slideMs: motionMs(el, "--motion-mode-slide", s.slide),
    slideEase: easeOr(el, "--motion-mode-slide-ease", s.slideEase),
    dip: clamp01(motionNumber(el, "--motion-mode-dip", s.dip)),
  }
}

// ── the panel ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The panel round a vertical's box: the box and the pad. */
export const modePanel = (box: FocusBox, m: ModeMotion): FocusBox => ({ l: box.l - m.pad, t: box.t - m.pad, r: box.r + m.pad, b: box.b + m.pad })

export const boxBetween = (a: FocusBox, b: FocusBox, t: number): FocusBox => ({ l: lerp(a.l, b.l, t), t: lerp(a.t, b.t, t), r: lerp(a.r, b.r, t), b: lerp(a.b, b.b, t) })

/**
 * How lifted something is at `p` (0 on the page, 1 all the way out): how far towards the eye, the scale that reads as
 * from the perspective, the swing — none at either end, all of it half way, so nothing jumps as it sets off or lands —
 * and the shadow.
 */
export function modeLift(m: ModeMotion, p: number) {
  const z = m.depth * p
  return {
    z,
    scale: m.perspective / Math.max(1, m.perspective - z),
    tilt: m.tilt * Math.sin(Math.PI * clamp01(p)),
    shadow: m.shadow * p,
  }
}

/** The transform of something lifted `p`, about its own centre: the panel, and the vertical it holds. */
export function modeTransform(m: ModeMotion, p: number): string {
  const { z, tilt } = modeLift(m, p)
  return `perspective(${m.perspective}px) translateZ(${z.toFixed(2)}px) rotateX(${tilt.toFixed(2)}deg)`
}

/** The panel's shadow at `p`: flat, the foreground's colour mixed thin, never a gradient. */
export function modeShadow(m: ModeMotion, p: number): string {
  const { shadow } = modeLift(m, p)
  if (shadow <= 0.1) return "none"
  return `0 ${(shadow / 2).toFixed(1)}px ${shadow.toFixed(1)}px color-mix(in oklch, var(--foreground) ${Math.round(12 + 10 * clamp01(p))}%, transparent)`
}

/** The hole in the cloth: the panel as it is seen, scaled by its lift about its centre. */
export function modeHole(m: ModeMotion, panel: FocusBox, p: number): FocusBox {
  const { scale } = modeLift(m, p)
  const cx = (panel.l + panel.r) / 2
  const cy = (panel.t + panel.b) / 2
  const hw = ((panel.r - panel.l) / 2) * scale
  const hh = ((panel.b - panel.t) / 2) * scale
  return { l: cx - hw, t: cy - hh, r: cx + hw, b: cy + hh }
}

// ── the play ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** Where a moment of the mode stands: the panel's box, its lift (with the slide's dip), and how far the cloth is out. */
export type ModeState = { panel: FocusBox; p: number; c: number }

/** Turning on: how long, and where it is `t` ms in — the panel lifting, the cloth coming `stagger` after it. */
export const modeOnMs = (m: ModeMotion) => Math.max(m.liftMs, m.staggerMs + m.inMs)
export function modeOnAt(m: ModeMotion, t: number) {
  return {
    base: m.liftMs > 0 ? m.liftEase(clamp01(t / m.liftMs)) : 1,
    c: m.inMs > 0 ? m.inEase(clamp01((t - m.staggerMs) / m.inMs)) : t >= m.staggerMs ? 1 : 0,
  }
}

/** Turning off: the cloth going first, the panel going back `stagger` after it. */
export const modeOffMs = (m: ModeMotion) => Math.max(m.outMs, m.staggerMs + m.liftMs)
export function modeOffAt(m: ModeMotion, t: number) {
  return {
    base: 1 - (m.liftMs > 0 ? m.liftEase(clamp01((t - m.staggerMs) / m.liftMs)) : t >= m.staggerMs ? 1 : 0),
    c: 1 - (m.outMs > 0 ? m.outEase(clamp01(t / m.outMs)) : 1),
  }
}

/** The slide, `u` of the way by the clock: how far the panel is along it, and what is left of its lift after the dip. */
export function modeSlideAt(m: ModeMotion, u: number) {
  const k = clamp01(u)
  return { s: m.slideEase(k), lift: 1 - m.dip * Math.sin(Math.PI * k) }
}

// ── the cloth ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The cloth's rings: focus's field, measured from the panel's edges (`from` and `to`, px out from the hole). */
export const modeRings = (m: ModeMotion, pitch: number) => focusRings(m, pitch)

/** Shown where the surface is farther than `to` from the hole's rectangle, fading in from `from`: four half-planes. */
function outside(from: number, to: number): string[] {
  const f = from.toFixed(1)
  const t = to.toFixed(1)
  return [
    `linear-gradient(to right, #000 calc(var(--mode-l) - ${t}px), transparent calc(var(--mode-l) - ${f}px))`,
    `linear-gradient(to left, #000 calc(100% - var(--mode-r) - ${t}px), transparent calc(100% - var(--mode-r) - ${f}px))`,
    `linear-gradient(to bottom, #000 calc(var(--mode-t) - ${t}px), transparent calc(var(--mode-t) - ${f}px))`,
    `linear-gradient(to top, #000 calc(100% - var(--mode-b) - ${t}px), transparent calc(100% - var(--mode-b) - ${f}px))`,
  ]
}

/** The cloth's edge while it rolls: a rounded rectangle `--mode-f` out from the hole, clipped at the surface. */
const EDGE =
  "inset(max(0px, calc(var(--mode-t) - var(--mode-f))) max(0px, calc(100% - var(--mode-r) - var(--mode-f))) max(0px, calc(100% - var(--mode-b) - var(--mode-f))) max(0px, calc(var(--mode-l) - var(--mode-f))) round var(--mode-round))"

/**
 * The layers that draw the cloth, as styles for elements that each cover the surface: one a ring, the first everywhere
 * outside the hole, and the veil last where it has one. Never put an opacity, a filter, a mask or paint containment on
 * anything round them (focus-motion.ts): it becomes their backdrop root, and they blur nothing.
 */
export function modeLayerStyles(m: ModeMotion, pitch: number): CSSProperties[] {
  const blur = (px: number) => `blur(calc(${px.toFixed(2)}px * var(--mode-swell)))`
  const clip = m.way === "unfurl" ? { clipPath: EDGE } : null
  const masked = (masks: string[]): CSSProperties => ({
    maskImage: masks.join(", "),
    maskComposite: "add",
    maskRepeat: "no-repeat",
    maskSize: "100% 100%",
    ...clip,
    opacity: "var(--mode-opacity)",
  })
  const layers: CSSProperties[] = modeRings(m, pitch).map((ring) => ({
    backdropFilter: blur(ring.blur),
    WebkitBackdropFilter: blur(ring.blur),
    ...masked(outside(ring.from ?? 0, ring.to ?? 0)),
  }))
  if (m.veil > 0) {
    layers.push({
      backgroundColor: `color-mix(in oklch, var(--background) calc(${(m.veil * 100).toFixed(0)}% * var(--mode-swell)), transparent)`,
      ...masked(outside(0, 0)),
    })
  }
  return layers
}

/**
 * Writes a moment onto the surface: the hole, the cloth's edge and its strength, and whether it shows at all. `radius`
 * is the system's corner (half a cell, Grid.md D39), which the cloth's edge keeps until it reaches the far corner.
 */
export function paintMode(surface: HTMLElement | null, m: ModeMotion, state: ModeState, radius: number) {
  if (!surface) return
  const s = surface.style
  const hole = modeHole(m, state.panel, state.p)
  const w = surface.clientWidth
  const h = surface.clientHeight
  const extent = Math.max(hole.l, hole.t, w - hole.r, h - hole.b, 0) + radius
  const c = clamp01(state.c)
  const f = m.way === "unfurl" ? c * extent : extent
  s.setProperty("--mode-l", `${hole.l.toFixed(1)}px`)
  s.setProperty("--mode-t", `${hole.t.toFixed(1)}px`)
  s.setProperty("--mode-r", `${hole.r.toFixed(1)}px`)
  s.setProperty("--mode-b", `${hole.b.toFixed(1)}px`)
  s.setProperty("--mode-f", `${f.toFixed(1)}px`)
  s.setProperty("--mode-round", `${(radius * clamp01((extent - f) / Math.max(1, radius))).toFixed(1)}px`)
  s.setProperty("--mode-swell", (m.way === "swell" ? c : 1).toFixed(3))
  s.setProperty("--mode-opacity", (m.way === "fade" ? c : 1).toFixed(3))
  s.visibility = c > 0.001 ? "visible" : "hidden"
}
