import type { CSSProperties } from "react"

import { easing, motionMs, motionNumber } from "@no-origins/ui/lib/motion"

/**
 * Focus (Motion.md M13, his, 2026-09-28), pure: a card in focus, and the page blurring round it — "the blurring to
 * start from the card with less intensity and then increase the intensity in a circular fashion from the card". The
 * blur is a field of rings on the card's centre, least at the card and rising outward; it comes in and goes out as a
 * motion, a ripple spreading from the card by default.
 *
 * It is drawn as layers over a surface (the screen, the studio's stage), each a `backdrop-filter` blur of what is under
 * it — the layers before it included, so they compound — masked to its ring (`focusLayerStyles`). What moves is a few
 * custom properties on the surface (`paintFocus`): the centre, the card's own radius, the ripple's front and the
 * clearing front behind it, the blur's strength and its opacity. The card in focus stands over the layers; that is the
 * caller's.
 *
 * The tokens are his since 2026-09-28 (globals.css, `--motion-focus-*`), and every fallback here is the same value.
 */

export type FocusWay = "ripple" | "swell" | "fade"
export type FocusExit = "clear" | "recede" | "ebb" | "fade"
export type FocusShift = "glide" | "jump"
export type FocusFrom = "corners" | "centre"

export const FOCUS_WAYS: readonly FocusWay[] = ["ripple", "swell", "fade"]
export const FOCUS_EXITS: readonly FocusExit[] = ["clear", "recede", "ebb", "fade"]
export const FOCUS_SHIFTS: readonly FocusShift[] = ["glide", "jump"]
export const FOCUS_FROMS: readonly FocusFrom[] = ["corners", "centre"]

/** The motion, read off an element (`readFocusMotion`). Distances in cells, blurs in px, times in ms. */
export type FocusMotion = {
  /** The blur at the card, and at the end of the reach and beyond. */
  near: number
  far: number
  /** A clear ring round the card before the blur starts to rise, and how far it rises over. */
  clear: number
  reach: number
  /** How it rises across the reach, as an easing of the way out. */
  rise: (t: number) => number
  /** How many rings draw the rise. */
  rings: number
  /** Where the rings are measured from: the circle through the card's corners, or its centre. */
  from: FocusFrom
  /** How the blur comes in: a front spreading from the card, the whole field growing, or a fade. */
  way: FocusWay
  inMs: number
  inEase: (t: number) => number
  /** The ripple's leading edge: how wide the band is where it goes from nothing to all. */
  front: number
  /** An extra blur riding the front, px: the ripple's crest. */
  crest: number
  /** How it goes: clearing outward from the card, receding into it, ebbing everywhere at once, or a fade. */
  exit: FocusExit
  outMs: number
  outEase: (t: number) => number
  /** From one card to the next: the field glides over, or jumps. */
  shift: FocusShift
  glideMs: number
  glideEase: (t: number) => number
  /** How long the focus waits, off every card, before it goes: a gutter crossed to the next card keeps it. */
  holdMs: number
}

/**
 * His pick (2026-09-28, "C Tide, tuned"), the values globals.css has: what every token falls back to where it is unset,
 * as `readLoadMotion`'s do. A slow ripple from the card, 1px next to it and sharp in all but that for four cells, then
 * rising on ease-in to 22px over ten; a 250ms hold, an 800ms fade out, a 500ms glide, every curve cubic in-out.
 */
export const FOCUS_START = {
  near: 1,
  far: 22,
  clear: 4,
  reach: 10,
  rise: "ease-in",
  rings: 10,
  from: "corners" as FocusFrom,
  way: "ripple" as FocusWay,
  in: 1500,
  inEase: "cubic-bezier(0.65, 0, 0.35, 1)",
  front: 8,
  crest: 0,
  exit: "fade" as FocusExit,
  out: 800,
  outEase: "cubic-bezier(0.65, 0, 0.35, 1)",
  shift: "glide" as FocusShift,
  glide: 500,
  glideEase: "cubic-bezier(0.65, 0, 0.35, 1)",
  hold: 250,
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
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
    front: Math.max(0.1, motionNumber(el, "--motion-focus-front", s.front)),
    crest: Math.max(0, motionNumber(el, "--motion-focus-crest", s.crest)),
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
 * from the card's own radius. The first, the blur at the card, has no ring: it is everywhere the front has been.
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

const AT = "circle at var(--focus-x) var(--focus-y)"
/** Shown inside the ripple's front, fading out across its leading edge `w` wide. */
const outer = (w: number) => `radial-gradient(${AT}, #000 calc(var(--focus-f) - ${w}px), transparent var(--focus-f))`
/** Hidden inside the clearing front, fading in across its edge. */
const inner = (w: number) => `radial-gradient(${AT}, transparent var(--focus-g), #000 calc(var(--focus-g) + ${w}px))`

/**
 * The layers that draw the field, as styles for elements that each cover the surface: one a ring, and a last one
 * for the crest riding the front. Every one is masked to where the ripple has been and the clearing has not, and
 * reads the moving numbers off the surface (`paintFocus`). Never put an opacity, a filter, a mask or paint containment
 * on anything round them: it becomes their backdrop root, and they blur only what is inside it — nothing, or a stage
 * without the field's dashes under it (Chrome counts `contain: paint`).
 */
export function focusLayerStyles(m: FocusMotion, pitch: number): CSSProperties[] {
  const w = m.front * pitch
  const blur = (px: number) => `blur(calc(${px.toFixed(2)}px * var(--focus-swell)))`
  // Only the fronts the motion moves: a mask is redrawn on every layer every frame the field moves, so one the motion
  // never moves is work for nothing. The ripple's front moves on a ripple in, a recede out and under a crest; the
  // clearing front only on a clear out.
  const clearing = m.exit === "clear" ? [inner(w)] : []
  const fronts = [...(m.way === "ripple" || m.exit === "recede" || m.crest > 0 ? [outer(w)] : []), ...clearing]
  const layer = (px: number, masks: string[]): CSSProperties => ({
    backdropFilter: blur(px),
    WebkitBackdropFilter: blur(px),
    ...(masks.length ? { maskImage: masks.join(", "), maskComposite: "intersect" } : null),
    opacity: "var(--focus-opacity)",
  })
  const rings = focusRings(m, pitch).map((ring) =>
    layer(
      ring.blur,
      ring.from === null || ring.to === null
        ? fronts
        : [`radial-gradient(${AT}, transparent calc(var(--focus-r0) + ${ring.from}px), #000 calc(var(--focus-r0) + ${ring.to}px))`, ...fronts],
    ),
  )
  if (m.crest <= 0) return rings
  const crest = `radial-gradient(${AT}, transparent calc(var(--focus-f) - ${w}px), #000 calc(var(--focus-f) - ${w / 2}px), transparent var(--focus-f))`
  return [...rings, layer(m.crest, [crest, ...clearing])]
}

// ── where, and how far in ────────────────────────────────────────────────────────────────────────────────────────

/** A box on the surface, px from its top-left. */
export type FocusBox = { l: number; t: number; r: number; b: number }

/** Where the field stands: the card's centre, and the radius its rings are measured from. */
export type FocusPlace = { x: number; y: number; r0: number }

export function focusPlace(box: FocusBox, from: FocusFrom): FocusPlace {
  return {
    x: (box.l + box.r) / 2,
    y: (box.t + box.b) / 2,
    r0: from === "corners" ? Math.hypot(box.r - box.l, box.b - box.t) / 2 : 0,
  }
}

/** How far a surface `w` × `h` reaches from a place: to its farthest corner. */
export const focusReach = (p: FocusPlace, w: number, h: number) => Math.hypot(Math.max(p.x, w - p.x), Math.max(p.y, h - p.y))

export const placeBetween = (a: FocusPlace, b: FocusPlace, t: number): FocusPlace => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), r0: lerp(a.r0, b.r0, t) })

/**
 * How far in the blur is: the ripple's front (`f`) and the clearing front behind it (`g`), px from the centre — the
 * field is shown between the two — and its strength (`swell`, 0 to 1, the blurs scaled) and its opacity.
 */
export type FocusLevel = { f: number; g: number; swell: number; opacity: number }

/** A front past any surface. */
export const FOCUS_FAR = 100000

/** All in: the fronts past every edge. */
export const FOCUS_ON: FocusLevel = { f: FOCUS_FAR, g: -FOCUS_FAR, swell: 1, opacity: 1 }

export const levelBetween = (a: FocusLevel, b: FocusLevel, t: number): FocusLevel => ({
  f: lerp(a.f, b.f, t),
  g: lerp(a.g, b.g, t),
  swell: lerp(a.swell, b.swell, t),
  opacity: lerp(a.opacity, b.opacity, t),
})

/**
 * A level as a motion can start from it: fronts past the surface brought to just past its farthest corner, `reach`,
 * which looks the same — so a front that moves sets off at once rather than crossing nothing first.
 */
export const levelFrom = (l: FocusLevel, reach: number, w: number): FocusLevel => ({ ...l, f: Math.min(l.f, reach + w), g: Math.max(l.g, -w) })

/** All in, as a motion ends: the front just past the farthest corner. */
export const levelIn = (reach: number, w: number): FocusLevel => ({ f: reach + w, g: -w, swell: 1, opacity: 1 })

/** Where a focus comes in from, by its way in: the front at the card's centre, the blur at nothing, or unseen. */
export function levelEntering(m: FocusMotion, w: number): FocusLevel {
  switch (m.way) {
    case "ripple":
      return { f: 0, g: -w, swell: 1, opacity: 1 }
    case "swell":
      return { f: FOCUS_FAR, g: -w, swell: 0, opacity: 1 }
    case "fade":
      return { f: FOCUS_FAR, g: -w, swell: 1, opacity: 0 }
  }
}

/**
 * Where a focus goes, from `from`, by its way out: clearing outward from the card past the farthest corner, the front
 * receding into the card's centre, the blur ebbing to nothing everywhere at once, or fading.
 */
export function levelLeaving(m: FocusMotion, from: FocusLevel, reach: number, w: number): FocusLevel {
  switch (m.exit) {
    case "clear":
      return { ...from, g: reach + w }
    case "recede":
      return { ...from, f: 0 }
    case "ebb":
      return { ...from, swell: 0 }
    case "fade":
      return { ...from, opacity: 0 }
  }
}

/** Writes a frame onto the surface: the custom properties its layers read, and whether it shows at all. */
export function paintFocus(surface: HTMLElement | null, place: FocusPlace, level: FocusLevel, shown: boolean) {
  if (!surface) return
  const s = surface.style
  s.setProperty("--focus-x", `${place.x.toFixed(1)}px`)
  s.setProperty("--focus-y", `${place.y.toFixed(1)}px`)
  s.setProperty("--focus-r0", `${place.r0.toFixed(1)}px`)
  s.setProperty("--focus-f", `${level.f.toFixed(1)}px`)
  s.setProperty("--focus-g", `${level.g.toFixed(1)}px`)
  s.setProperty("--focus-swell", level.swell.toFixed(3))
  s.setProperty("--focus-opacity", level.opacity.toFixed(3))
  s.visibility = shown ? "visible" : "hidden"
}
