import type { CSSProperties } from "react"

import { easing, motionMs, motionNumber } from "@no-origins/ui/lib/motion"

/**
 * Focus (Motion.md M13, his, 2026-09-28), pure: a card in focus, and the page blurring round it — "the blurring to
 * start from the card with less intensity and then increase the intensity in a circular fashion from the card".
 *
 * **The blur is a cloth, not a ripple** (his, the same night: "I want to consider that as a cloth, a blurring cloth,
 * not as a ripple … the cloth should reach every corner of the viewport"). It is attached to the card, least blurred
 * next to it and thicker out from it (the field, `focusRings`), and it is drawn out from under the card: each of its
 * four edges goes out to the surface's, so its corners run straight to the surface's corners and all four arrive
 * together (`pull` 1), or its edges go at one speed and the nearest lands first (`pull` 0). The card is lifted over
 * it, its shadow on the cloth coming up as it lifts.
 *
 * It is drawn as layers over a surface (the screen), each a `backdrop-filter` blur of what is under it — the layers
 * before it included, so they compound — masked to its ring of the field and to the cloth's four edges
 * (`focusLayerStyles`). What moves is a few custom properties on the surface (`paintFocus`): the card's box, the
 * cloth's edges, the blur's strength and opacity, and the lift. The card in focus stands over the layers; that is the
 * caller's.
 *
 * The numbers are his since 2026-09-28, and his second pick since 2026-09-29 (globals.css, `--motion-focus-*`); every
 * fallback here is the same value.
 */

export type FocusWay = "spread" | "swell" | "fade"
export type FocusExit = "withdraw" | "ebb" | "fade"
export type FocusShift = "glide" | "jump"
export type FocusFrom = "edges" | "corners" | "centre"

export const FOCUS_WAYS: readonly FocusWay[] = ["spread", "swell", "fade"]
export const FOCUS_EXITS: readonly FocusExit[] = ["withdraw", "ebb", "fade"]
export const FOCUS_SHIFTS: readonly FocusShift[] = ["glide", "jump"]
export const FOCUS_FROMS: readonly FocusFrom[] = ["edges", "corners", "centre"]

/** The motion, read off an element (`readFocusMotion`). Distances in cells, blurs in px, times in ms. */
export type FocusMotion = {
  /** The card coming up over the cloth, and its curve. */
  liftMs: number
  liftEase: (t: number) => number
  /** The shadow it casts on the cloth once up, px (its offset is half of it), and how dark, 0 to 1. */
  shadow: number
  shade: number
  /** The blur at the card, and at the end of the reach and beyond. */
  near: number
  far: number
  /** A clear margin round the card before the blur starts to rise, and how far it rises over. */
  clear: number
  reach: number
  /** How it rises across the reach, as an easing of the way out. */
  rise: (t: number) => number
  /** How many rings draw the rise. */
  rings: number
  /** Where the rings are measured from: the card's edges, the circle through its corners, or its centre. */
  from: FocusFrom
  /** How the cloth comes: drawn out from under the card to every corner, swelling everywhere at once, or a fade. */
  way: FocusWay
  inMs: number
  inEase: (t: number) => number
  /** How the edges share the way out: 1, each at its own speed so every corner arrives at once; 0, all at one. */
  pull: number
  /** The cloth's soft edge, cells: how far in from its edge it takes to be all there. 0 is a crisp edge. */
  hem: number
  /** An extra blur along the hem, px: the cloth's edge folded over. */
  fold: number
  /** How it goes: drawn back under the card, thinning everywhere at once, or a fade. */
  exit: FocusExit
  outMs: number
  outEase: (t: number) => number
  /** From one card to the next: the cloth glides over, or jumps. */
  shift: FocusShift
  glideMs: number
  glideEase: (t: number) => number
  /** How long the focus waits, off every card, before it goes: a gutter crossed to the next card keeps it. */
  holdMs: number
}

/**
 * The values globals.css has, what every token falls back to where it is unset, as `readLoadMotion`'s do. His pick
 * (2026-09-29, "C Unroll, tuned", replacing round 1's Tide): 1px next to the card, sharp in all but that for a cell, then
 * rising on ease-in to 16px over 21 cells in ten rings, measured from the circle through its corners; the cloth fades
 * in over 80ms (so its pull and twelve-cell hem play no part), no fold; the card lifts in 300ms with no shadow; a 120ms
 * hold, a 400ms fade out, an 80ms glide, every curve cubic in-out.
 */
export const FOCUS_START = {
  lift: 300,
  liftEase: "cubic-bezier(0.65, 0, 0.35, 1)",
  shadow: 0,
  shade: 0.16,
  near: 1,
  far: 16,
  clear: 1,
  reach: 21,
  rise: "ease-in",
  rings: 10,
  from: "corners" as FocusFrom,
  way: "fade" as FocusWay,
  in: 80,
  inEase: "cubic-bezier(0.65, 0, 0.35, 1)",
  pull: 0.5,
  hem: 12,
  fold: 0,
  exit: "fade" as FocusExit,
  out: 400,
  outEase: "cubic-bezier(0.65, 0, 0.35, 1)",
  shift: "glide" as FocusShift,
  glide: 80,
  glideEase: "cubic-bezier(0.65, 0, 0.35, 1)",
  hold: 120,
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const clamp01 = (t: number) => clamp(t, 0, 1)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** A choice token off `el`, or `fallback` where it is unset or not one of `list`. */
function choice<T extends string>(el: Element, token: `--motion-${string}`, list: readonly T[], fallback: T): T {
  const value = getComputedStyle(el).getPropertyValue(token).trim() as T
  return list.includes(value) ? value : fallback
}

const easeOr = (el: Element, token: `--motion-${string}`, fallback: string) =>
  easing(getComputedStyle(el).getPropertyValue(token).trim() || fallback)

/** The focus tokens off `el`, read when a focus starts, moves or goes — never cached: the studio retunes between two. */
export function readFocusMotion(el: Element): FocusMotion {
  const s = FOCUS_START
  return {
    liftMs: motionMs(el, "--motion-focus-lift", s.lift),
    liftEase: easeOr(el, "--motion-focus-lift-ease", s.liftEase),
    shadow: Math.max(0, motionNumber(el, "--motion-focus-shadow", s.shadow)),
    shade: clamp01(motionNumber(el, "--motion-focus-shade", s.shade)),
    near: Math.max(0, motionNumber(el, "--motion-focus-near", s.near)),
    far: Math.max(0, motionNumber(el, "--motion-focus-far", s.far)),
    clear: Math.max(0, motionNumber(el, "--motion-focus-clear", s.clear)),
    reach: Math.max(0.1, motionNumber(el, "--motion-focus-reach", s.reach)),
    rise: easeOr(el, "--motion-focus-rise", s.rise),
    rings: clamp(Math.round(motionNumber(el, "--motion-focus-rings", s.rings)), 1, 12),
    from: choice(el, "--motion-focus-from", FOCUS_FROMS, s.from),
    way: choice(el, "--motion-focus-way", FOCUS_WAYS, s.way),
    inMs: motionMs(el, "--motion-focus-in", s.in),
    inEase: easeOr(el, "--motion-focus-in-ease", s.inEase),
    pull: clamp01(motionNumber(el, "--motion-focus-pull", s.pull)),
    hem: Math.max(0, motionNumber(el, "--motion-focus-hem", s.hem)),
    fold: Math.max(0, motionNumber(el, "--motion-focus-fold", s.fold)),
    exit: choice(el, "--motion-focus-exit", FOCUS_EXITS, s.exit),
    outMs: motionMs(el, "--motion-focus-out", s.out),
    outEase: easeOr(el, "--motion-focus-out-ease", s.outEase),
    shift: choice(el, "--motion-focus-shift", FOCUS_SHIFTS, s.shift),
    glideMs: motionMs(el, "--motion-focus-glide", s.glide),
    glideEase: easeOr(el, "--motion-focus-glide-ease", s.glideEase),
    holdMs: motionMs(el, "--motion-focus-hold", s.hold),
  }
}

// ── the field ────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * One ring of the field: the blur its layer adds (`blur`), the blur the field has reached at its outer edge once the
 * layers under it are counted (`level`), and where it fades in, from nothing at `from` to all of it at `to`, px out
 * from the card. The first, the blur at the card, has no ring: it is everywhere the cloth is.
 */
export type FocusRing = { blur: number; level: number; from: number | null; to: number | null }

/**
 * The field as rings: the blur at the card, then the rise from `near` to `far` over the reach, cut into `rings` steps
 * along the rise's curve. Blurs compound — one of a over one of b is one of √(a² + b²) — so each ring adds what takes
 * the field from the last step's level to its own, and the field can only rise: a curve that dips is held level.
 */
export function focusRings(m: Pick<FocusMotion, "near" | "far" | "clear" | "reach" | "rise" | "rings">, pitch: number): FocusRing[] {
  const rings: FocusRing[] = []
  if (m.near > 0) rings.push({ blur: m.near, level: m.near, from: null, to: null })
  let before = m.near
  for (let k = 1; k <= m.rings; k++) {
    const level = Math.max(before, m.near + (m.far - m.near) * m.rise(k / m.rings))
    const blur = Math.sqrt(Math.max(0, level * level - before * before))
    if (blur > 0.05) {
      rings.push({
        blur,
        level,
        from: (m.clear + (m.reach * (k - 1)) / m.rings) * pitch,
        to: (m.clear + (m.reach * k) / m.rings) * pitch,
      })
    }
    before = level
  }
  return rings
}

/** A ring measured from a circle: nothing inside `from` px out from it, all of it past `to`. */
const circle = (from: number, to: number) =>
  `radial-gradient(circle at var(--focus-x) var(--focus-y), transparent calc(var(--focus-r0) + ${from.toFixed(1)}px), #000 calc(var(--focus-r0) + ${to.toFixed(1)}px))`

/** A ring measured from the card's edges: what lies farther than it from the card's box, by four half-planes. */
const edges = (from: number, to: number) => {
  const f = from.toFixed(1)
  const t = to.toFixed(1)
  return [
    `linear-gradient(to right, #000 calc(var(--focus-l) - ${t}px), transparent calc(var(--focus-l) - ${f}px))`,
    `linear-gradient(to left, #000 calc(100% - var(--focus-r) - ${t}px), transparent calc(100% - var(--focus-r) - ${f}px))`,
    `linear-gradient(to bottom, #000 calc(var(--focus-t) - ${t}px), transparent calc(var(--focus-t) - ${f}px))`,
    `linear-gradient(to top, #000 calc(100% - var(--focus-b) - ${t}px), transparent calc(100% - var(--focus-b) - ${f}px))`,
  ]
}

/** Inside the cloth's four edges, fading in across `w` px from each: the hem. 0 is a crisp edge. */
const within = (w: number) => {
  const h = w.toFixed(1)
  return [
    `linear-gradient(to right, transparent var(--cloth-l), #000 calc(var(--cloth-l) + ${h}px))`,
    `linear-gradient(to left, transparent calc(100% - var(--cloth-r)), #000 calc(100% - var(--cloth-r) + ${h}px))`,
    `linear-gradient(to bottom, transparent var(--cloth-t), #000 calc(var(--cloth-t) + ${h}px))`,
    `linear-gradient(to top, transparent calc(100% - var(--cloth-b)), #000 calc(100% - var(--cloth-b) + ${h}px))`,
  ]
}

/** Within `to` px of the cloth's edges, fading out from `from`: a band along the inside of its hem, for the fold. */
const along = (from: number, to: number) => {
  const f = from.toFixed(1)
  const t = to.toFixed(1)
  return [
    `linear-gradient(to right, #000 calc(var(--cloth-l) + ${f}px), transparent calc(var(--cloth-l) + ${t}px))`,
    `linear-gradient(to left, #000 calc(100% - var(--cloth-r) + ${f}px), transparent calc(100% - var(--cloth-r) + ${t}px))`,
    `linear-gradient(to bottom, #000 calc(var(--cloth-t) + ${f}px), transparent calc(var(--cloth-t) + ${t}px))`,
    `linear-gradient(to top, #000 calc(100% - var(--cloth-b) + ${f}px), transparent calc(100% - var(--cloth-b) + ${t}px))`,
  ]
}

/**
 * A mask that is every one of `all` and any one of `any`. Mask layers composite in turn from the last up, each with the
 * ones under it, so the `any` go last, added to each other, and the `all` over them, each intersected with the rest.
 */
function masked(all: string[], any: string[]): CSSProperties | null {
  const images = [...all, ...any]
  if (!images.length) return null
  const ops = [...all.map(() => "intersect"), ...any.map(() => "add")]
  // The last layer composites with nothing, which an intersect would empty.
  ops[ops.length - 1] = "add"
  return { maskImage: images.join(", "), maskComposite: ops.join(", "), maskRepeat: "no-repeat", maskSize: "100% 100%" }
}

/**
 * The layers that draw the cloth, as styles for elements that each cover the surface: one a ring of the field, masked
 * to it and to the cloth's four edges, a last one for the fold along the hem, and the card's shadow (`focusShadow`).
 * They read the moving numbers off the surface (`paintFocus`). Never put an opacity, a filter, a mask or paint
 * containment on anything round them: it becomes their backdrop root, and they blur only what is inside it — nothing,
 * or a stage without the field's dashes under it (Chrome counts `contain: paint`). Nor a `mix-blend-mode` anywhere in
 * the stacking context round them that is not isolated below it: to blend it, Chrome isolates that context, which
 * makes it their backdrop root too (measured 2026-09-29: the Avatar's ring, now `isolate`, kept the field sharp
 * whenever a card other than the avatar was in focus).
 */
export function focusLayerStyles(m: FocusMotion, pitch: number): CSSProperties[] {
  const blur = (px: number) => `blur(calc(${px.toFixed(2)}px * var(--focus-swell)))`
  const hem = m.hem * pitch
  // Only an edge the motion moves: a mask is redrawn on every layer every frame the cloth moves, so edges that stay past
  // the surface are work for nothing. They move when the cloth is drawn out, or drawn back.
  const moves = m.way === "spread" || m.exit === "withdraw"
  const cloth = moves ? within(hem) : []
  const layer = (px: number, all: string[], any: string[]): CSSProperties => ({
    backdropFilter: blur(px),
    WebkitBackdropFilter: blur(px),
    ...masked(all, any),
    opacity: "var(--focus-opacity)",
  })
  const layers = focusRings(m, pitch).map((ring) =>
    layer(ring.blur, cloth, ring.from === null || ring.to === null ? [] : m.from === "edges" ? edges(ring.from, ring.to) : [circle(ring.from, ring.to)]),
  )
  if (moves && m.fold > 0) {
    // The fold: up across the first half of the hem, down across the second — a cell wide on a crisp one.
    const band = hem > 0 ? hem : pitch
    layers.push(layer(m.fold, within(hem / 2), along(band / 2, band)))
  }
  const shadow = focusShadow(m)
  return shadow ? [...layers, shadow] : layers
}

/**
 * The card's shadow on the cloth, as a layer's style: a box as the card's, casting `shadow` px down it as far as the
 * card is lifted, never inside it — the card stands over it there. Black at any theme: a light one would be a glow.
 */
export function focusShadow(m: FocusMotion): CSSProperties | null {
  if (m.shadow <= 0 || m.shade <= 0) return null
  const k = "var(--focus-lift)"
  return {
    left: "var(--focus-l)",
    top: "var(--focus-t)",
    width: "calc(var(--focus-r) - var(--focus-l))",
    height: "calc(var(--focus-b) - var(--focus-t))",
    borderRadius: "var(--radius)",
    boxShadow: `0 calc(${(m.shadow / 2).toFixed(1)}px * ${k}) calc(${m.shadow.toFixed(1)}px * ${k}) color-mix(in oklch, #000 calc(${(m.shade * 100).toFixed(0)}% * ${k}), transparent)`,
    opacity: "var(--focus-opacity)",
  }
}

// ── where, and how far out ───────────────────────────────────────────────────────────────────────────────────────

/** A box on the surface, px from its top-left. */
export type FocusBox = { l: number; t: number; r: number; b: number }

/** Where a ring measured from a circle is centred, and the radius it is measured from. */
export function focusCentre(box: FocusBox, from: FocusFrom) {
  return {
    x: (box.l + box.r) / 2,
    y: (box.t + box.b) / 2,
    r0: from === "corners" ? Math.hypot(box.r - box.l, box.b - box.t) / 2 : 0,
  }
}

/** The cloth on its way from one card to the next: the box it is attached to. */
export const placeBetween = (a: FocusBox, b: FocusBox, t: number): FocusBox => ({ l: lerp(a.l, b.l, t), t: lerp(a.t, b.t, t), r: lerp(a.r, b.r, t), b: lerp(a.b, b.b, t) })

/**
 * The cloth's four edges `c` of the way out, px on a surface `w` × `h`: from the card's box to the surface's, less the
 * hem outside it so it is all there to the corners. Each edge has its own way to go; with `pull` at 1 each goes at its
 * own speed and all four arrive together, so every corner of the cloth reaches its corner at once; at 0 all go at the
 * farthest one's speed, and the nearest lands first.
 */
export function clothEdges(m: Pick<FocusMotion, "pull" | "hem">, box: FocusBox, c: number, w: number, h: number, pitch: number): FocusBox {
  const out = m.hem * pitch
  const d = { l: Math.max(0, box.l + out), t: Math.max(0, box.t + out), r: Math.max(0, w + out - box.r), b: Math.max(0, h + out - box.b) }
  const far = Math.max(1, d.l, d.t, d.r, d.b)
  const k = clamp01(c)
  /** How far along an edge is: it arrives at `lerp(its share of the farthest, 1, pull)` of the way. */
  const at = (way: number) => {
    const arrives = lerp(way / far, 1, m.pull)
    return arrives <= 0 ? 1 : clamp01(k / arrives)
  }
  return { l: box.l - d.l * at(d.l), t: box.t - d.t * at(d.t), r: box.r + d.r * at(d.r), b: box.b + d.b * at(d.b) }
}

/**
 * How far out the cloth is: how far drawn out from under the card (`c`, 0 to 1), its strength (`swell`, 0 to 1, the
 * blurs scaled) and its opacity.
 */
export type FocusLevel = { c: number; swell: number; opacity: number }

/** All out. */
export const FOCUS_ON: FocusLevel = { c: 1, swell: 1, opacity: 1 }

export const levelBetween = (a: FocusLevel, b: FocusLevel, t: number): FocusLevel => ({
  c: lerp(a.c, b.c, t),
  swell: lerp(a.swell, b.swell, t),
  opacity: lerp(a.opacity, b.opacity, t),
})

/** Where a focus comes in from, by its way in: the cloth under the card, all out at no strength, or unseen. */
export function levelEntering(m: Pick<FocusMotion, "way">): FocusLevel {
  switch (m.way) {
    case "spread":
      return { c: 0, swell: 1, opacity: 1 }
    case "swell":
      return { c: 1, swell: 0, opacity: 1 }
    case "fade":
      return { c: 1, swell: 1, opacity: 0 }
  }
}

/** Where a focus goes, from `from`, by its way out: drawn back under the card, thinned to nothing, or faded. */
export function levelLeaving(m: Pick<FocusMotion, "exit">, from: FocusLevel): FocusLevel {
  switch (m.exit) {
    case "withdraw":
      return { ...from, c: 0 }
    case "ebb":
      return { ...from, swell: 0 }
    case "fade":
      return { ...from, opacity: 0 }
  }
}

/** A moment of the focus: the box the cloth is attached to, how far out it is, how far the card is lifted, and whether it shows. */
export type FocusFrame = { box: FocusBox; level: FocusLevel; lift: number; shown: boolean }

/** An edge past any surface. */
const FAR = 100000

/** Writes a frame onto the surface: the custom properties its layers read, and whether it shows at all. */
export function paintFocus(surface: HTMLElement | null, m: FocusMotion, frame: FocusFrame, pitch: number) {
  if (!surface) return
  const s = surface.style
  const { box, level } = frame
  const px = (v: number) => `${v.toFixed(1)}px`
  const at = focusCentre(box, m.from)
  // All out, the cloth is past every edge, whatever size the surface has come to since.
  const cloth = level.c >= 1 ? { l: -FAR, t: -FAR, r: FAR, b: FAR } : clothEdges(m, box, level.c, surface.clientWidth, surface.clientHeight, pitch)
  s.setProperty("--focus-l", px(box.l))
  s.setProperty("--focus-t", px(box.t))
  s.setProperty("--focus-r", px(box.r))
  s.setProperty("--focus-b", px(box.b))
  s.setProperty("--focus-x", px(at.x))
  s.setProperty("--focus-y", px(at.y))
  s.setProperty("--focus-r0", px(at.r0))
  s.setProperty("--cloth-l", px(cloth.l))
  s.setProperty("--cloth-t", px(cloth.t))
  s.setProperty("--cloth-r", px(cloth.r))
  s.setProperty("--cloth-b", px(cloth.b))
  s.setProperty("--focus-swell", level.swell.toFixed(3))
  s.setProperty("--focus-opacity", level.opacity.toFixed(3))
  s.setProperty("--focus-lift", clamp01(frame.lift).toFixed(3))
  s.visibility = frame.shown ? "visible" : "hidden"
}
