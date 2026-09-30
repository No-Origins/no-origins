import type { CSSProperties } from "react"

import { focusRings, type FocusBox } from "@no-origins/ui/lib/focus-motion"
import { easing, motionMs, motionNumber } from "@no-origins/ui/lib/motion"

/**
 * Focus mode (Motion.md M14, his, 2026-09-28), pure: one vertical of the page read at a time. "An overlay on top of the
 * first section … a little above the section, like it's coming out of the screen in 3D … the rest should feel like a
 * cloth overlay … start blurring out from the edges of the focus component … like we are looking through a panel that
 * gives us more focus on that vertical." A **panel** comes out of the page over the vertical, and a **cloth** of blur
 * rolls out from the panel's edges over everything else, least at the panel and rising outward. **Moving to another
 * vertical, the one left unfocuses while the next focuses, both from the same moment** (his, 2026-09-29: "Instead of
 * sliding the focus container, we should just unfocus while refocusing on the next one"): each vertical has a panel
 * and a cloth of its own, the one left plays the way out (`modeOffAt`) and the next the way in (`modeOnAt`), and the
 * two cloths, one over the other, compound where both are out (`modeSwitchMs`). The panel slid there until then.
 *
 * The panel is a see-through frame with a shadow, lifted in 3D: perspective, a push towards the eye and a swing on the
 * way. What is under it stays sharp, because the cloth has a hole where the panel stands. **Only the panel lifts** (his,
 * 2026-09-28: "the components that are in the focus mode should not scale. They have to remain at the level that they
 * are at"): the vertical it holds is never moved, scaled or swung, and keeps its place on the page.
 *
 * **It rises straight out of the page, its whole line there from the start** (his, 2026-09-29: "Instead of border
 * start from top and all, let's just have the option to border to rise from the viewport directly without that border
 * animation"). Its way in is two steps, the panel rising (`p`) and the cloth coming the stagger after it (`c`); its
 * way out is the same steps backward, the cloth going and the panel dropping back into the page the stagger after,
 * each by its own time and curve (`lift`, `drop`; `modeOnAt`, `modeOffAt`). Until then its line was drawn first, from the middle of its top down both sides to the
 * middle of its bottom, and then it lifted. The panel is an outline (`modeShape`): each point of its rounded rectangle
 * is swung, lifted and seen through the perspective, and drawn as SVG.
 *
 * The cloth is drawn as focus's is (focus-motion.ts): layers over the surface, each a `backdrop-filter` blur, one a
 * ring of the rise (`focusRings`, the same field). Here a ring is measured from the panel's EDGES, not a circle round a
 * card's centre: each layer is masked to what lies farther than its ring from the hole's rectangle, by four gradients
 * (`modeLayerStyles`). **The cloth is attached to the panel**: the hole is the panel as seen, no wider than the panel
 * lying flat at its lift, so the cloth meets the panel's line, and a part swung nearer than that passes over the cloth,
 * as the panel stands over everything. (The hole cannot be the outline itself: Chromium draws a `backdrop-filter` with
 * a mask wrongly under any clip that is not a rounded rectangle, measured 2026-09-28.) Coming in, the cloth sets off
 * the stagger after the panel starts to lift. Rolling out, the cloth's edge is a clip, a rounded rectangle growing from
 * the panel to the far corner of the surface. What moves is a few custom properties on the surface (`paintMode`).
 *
 * The numbers are his since 2026-09-29 (globals.css, `--motion-mode-*`, "A As described, tuned"); every fallback here is
 * the same value.
 */

export type ModeWay = "unfurl" | "swell" | "fade"
export const MODE_WAYS: readonly ModeWay[] = ["unfurl", "swell", "fade"]

/** The motion, read off an element (`readModeMotion`). Distances in cells, blurs and lengths in px, times in ms. */
export type ModeMotion = {
  /** The panel rising out of the page, and its curve. */
  liftMs: number
  liftEase: (t: number) => number
  /** The panel dropping back into the page, and its curve (his ask, 2026-09-29: "controls to control the lift and drop
   *  timings"). */
  dropMs: number
  dropEase: (t: number) => number
  /** How far it comes towards the eye, px, seen through a perspective `perspective` px away. */
  depth: number
  perspective: number
  /** How far it swings about its horizontal axis on the way, degrees: none at rest, all of it half way. */
  tilt: number
  /** Its shadow's blur when lifted, px; the offset is half of it. */
  shadow: number
  /** The panel's margin round the vertical, px, and the width of its line, px: `fine` while it is on the page, growing
   *  to `border` as it is lifted all the way. */
  pad: number
  border: number
  fine: number
  /** The cloth: its blur at the panel, and at the end of the reach and beyond. */
  near: number
  far: number
  /** A sharp margin round the panel before the blur starts to rise, and how far it rises over, cells: at most, as on a
   *  side nearer the container's edge than that it rises over what there is, so the whole container is under the cloth
   *  and every edge of it is at the far blur. */
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
  /** Coming in, the cloth sets off this long after the panel starts to lift; going, the panel comes down this long
   *  after the cloth. */
  staggerMs: number
}

/**
 * The values globals.css has, what every token falls back to where it is unset. His pick (2026-09-29, "A As described,
 * tuned"): a quick 90ms rise on ease-out, and a drop the same until he tunes it, 80px out through 800px, a -3° swing, a 40px
 * shadow, a 16px margin; a cloth from 2px at the panel rising on expo out to 7px over at most 16 cells in seven rings,
 * under a 60% veil, swelling in over 250ms and thinning out over 1000ms. (A 500ms slide that stayed out, cubic in-out,
 * and a line drawn round the panel in 700ms, cubic in-out, before it lifted, were his too, until he took both out the
 * same day.)
 */
export const MODE_START = {
  lift: 90,
  liftEase: "ease-out",
  drop: 90,
  dropEase: "ease-out",
  depth: 80,
  perspective: 800,
  tilt: -3,
  shadow: 40,
  pad: 16,
  border: 2,
  fine: 0.5,
  near: 2,
  far: 7,
  clear: 0,
  reach: 16,
  rise: "cubic-bezier(0.16, 1, 0.3, 1)",
  rings: 7,
  veil: 0.6,
  way: "swell" as ModeWay,
  in: 250,
  inEase: "ease-in",
  out: 1000,
  outEase: "cubic-bezier(0.65, 0, 0.35, 1)",
  stagger: 120,
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const clamp01 = (t: number) => clamp(t, 0, 1)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const easeOr = (el: Element, token: `--motion-${string}`, fallback: string) =>
  easing(getComputedStyle(el).getPropertyValue(token).trim() || fallback)

const choiceOr = <T extends string>(el: Element, token: `--motion-${string}`, choices: readonly T[], fallback: T): T => {
  const v = getComputedStyle(el).getPropertyValue(token).trim() as T
  return choices.includes(v) ? v : fallback
}

/** The focus-mode tokens off `el`, read when the mode turns on, off or moves — never cached: the studio retunes. */
export function readModeMotion(el: Element): ModeMotion {
  const s = MODE_START
  return {
    liftMs: motionMs(el, "--motion-mode-lift", s.lift),
    liftEase: easeOr(el, "--motion-mode-lift-ease", s.liftEase),
    dropMs: motionMs(el, "--motion-mode-drop", s.drop),
    dropEase: easeOr(el, "--motion-mode-drop-ease", s.dropEase),
    depth: motionNumber(el, "--motion-mode-depth", s.depth),
    perspective: Math.max(100, motionNumber(el, "--motion-mode-perspective", s.perspective)),
    tilt: motionNumber(el, "--motion-mode-tilt", s.tilt),
    shadow: Math.max(0, motionNumber(el, "--motion-mode-shadow", s.shadow)),
    pad: Math.max(0, motionNumber(el, "--motion-mode-pad", s.pad)),
    border: clamp(motionNumber(el, "--motion-mode-border", s.border), 0, 12),
    fine: clamp(motionNumber(el, "--motion-mode-border-fine", s.fine), 0, 12),
    near: Math.max(0, motionNumber(el, "--motion-mode-near", s.near)),
    far: Math.max(0, motionNumber(el, "--motion-mode-far", s.far)),
    clear: Math.max(0, motionNumber(el, "--motion-mode-clear", s.clear)),
    reach: Math.max(0.1, motionNumber(el, "--motion-mode-reach", s.reach)),
    rise: easeOr(el, "--motion-mode-rise", s.rise),
    rings: clamp(Math.round(motionNumber(el, "--motion-mode-rings", s.rings)), 1, 12),
    veil: clamp01(motionNumber(el, "--motion-mode-veil", s.veil)),
    way: choiceOr(el, "--motion-mode-way", MODE_WAYS, s.way),
    inMs: motionMs(el, "--motion-mode-in", s.in),
    inEase: easeOr(el, "--motion-mode-in-ease", s.inEase),
    outMs: motionMs(el, "--motion-mode-out", s.out),
    outEase: easeOr(el, "--motion-mode-out-ease", s.outEase),
    staggerMs: motionMs(el, "--motion-mode-stagger", s.stagger),
  }
}

// ── the panel ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The panel round a vertical's box: the box and the pad. */
export const modePanel = (box: FocusBox, m: ModeMotion): FocusBox => ({ l: box.l - m.pad, t: box.t - m.pad, r: box.r + m.pad, b: box.b + m.pad })

/** Where the panel stands at a moment: its box, and how far it has risen (`p`, 0 on the page, 1 at its depth). */
export type ModePose = { panel: FocusBox; p: number }

/** What the panel looks like at a moment (`modeShape`): SVG paths on the surface's own px, and the hole it leaves. */
export type ModeShape = {
  /** The panel's frame, as the eye sees it, closed: the shadow is cut out inside it. */
  outline: string
  /** Its line, a band filled inside the outline, as a border runs inside its box, all the way round. */
  line: string
  /** The shadow of the panel, on the page; "" while it is on it. Its blur, px, and its strength, % of the line's colour. */
  shadow: string
  blur: number
  tint: number
  /** The cloth's hole: the panel as seen, no wider than it lying flat at its lift. */
  hole: FocusBox
}

/** A panel that is not there: a vertical with nothing of focus mode round it. */
export const MODE_NO_SHAPE: ModeShape = { outline: "", line: "", shadow: "", blur: 0, tint: 0, hole: { l: 0, t: 0, r: 0, b: 0 } }

type Pt = { x: number; y: number }

/**
 * The panel's rounded rectangle as points, clockwise from the middle of its top edge, at most `step` px apart so the
 * perspective shows along its edges.
 */
function roundedRect(box: FocusBox, radius: number, step = 6): Pt[] {
  const { l, t, r, b } = box
  const k = Math.max(0, Math.min(radius, (r - l) / 2, (b - t) / 2))
  const cx = (l + r) / 2
  const pts: Pt[] = []
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step))
    for (let i = 0; i < n; i++) pts.push({ x: lerp(x0, x1, i / n), y: lerp(y0, y1, i / n) })
  }
  const arc = (cx: number, cy: number, from: number) => {
    const n = Math.max(2, Math.ceil((k * Math.PI) / 2 / step))
    for (let i = 0; i < n; i++) {
      const a = from + ((Math.PI / 2) * i) / n
      pts.push({ x: cx + k * Math.cos(a), y: cy + k * Math.sin(a) })
    }
  }
  line(cx, t, r - k, t)
  arc(r - k, t + k, -Math.PI / 2)
  line(r, t + k, r, b - k)
  arc(r - k, b - k, 0)
  line(r - k, b, l + k, b)
  arc(l + k, b - k, Math.PI / 2)
  line(l, b - k, l, t + k)
  arc(l + k, t + k, Math.PI)
  line(l + k, t, cx, t)
  return pts
}

const pathOf = (pts: Pt[]) => (pts.length < 3 ? "" : `M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L")}Z`)

/**
 * A line along a run of the outline, as a filled band: its outer side on the outline, its inner side `width` in from
 * it, as a border runs inside its box. The outline goes clockwise on the screen, so in is its tangent turned a quarter
 * clockwise. A whole ring is two closed paths, for the even-odd rule.
 */
function band(pts: Pt[], width: number, ring: boolean): string {
  const n = pts.length
  if (n < 2 || width <= 0) return ""
  const inner: Pt[] = []
  let nx = 0
  let ny = 1
  for (let i = 0; i < n; i++) {
    const a = pts[ring ? (i - 1 + n) % n : Math.max(0, i - 1)]!
    const b = pts[ring ? (i + 1) % n : Math.min(n - 1, i + 1)]!
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    if (len > 1e-6) {
      nx = -(b.y - a.y) / len
      ny = (b.x - a.x) / len
    }
    inner.push({ x: pts[i]!.x + nx * width, y: pts[i]!.y + ny * width })
  }
  return ring ? `${pathOf(pts)} ${pathOf(inner)}` : pathOf([...pts, ...inner.reverse()])
}

/**
 * The panel at a moment, as the eye sees it. Each point of its rounded rectangle (`radius`, the system's corner) is
 * swung by the `tilt` about the panel's middle, lifted, and seen through the perspective from its own centre, as a CSS
 * `perspective()` would show it. Its line is all the way round it, `fine` while the panel is on the page and its
 * `border` once it is up (the square of the rise, so it stays fine for most of the way). Its shadow falls straight down the page, half the shadow's blur for the
 * whole depth risen, never past it.
 */
export function modeShape(m: ModeMotion, pose: ModePose, radius: number): ModeShape {
  const { panel } = pose
  const cx = (panel.l + panel.r) / 2
  const cy = (panel.t + panel.b) / 2
  const z0 = m.depth * pose.p
  const tilt = (m.tilt * Math.sin(Math.PI * clamp01(pose.p)) * Math.PI) / 180
  const cos = Math.cos(tilt)
  const sin = Math.sin(tilt)
  const edge = roundedRect(panel, radius)

  /** Where a point of the panel is in 3D: swung about the panel's middle, then lifted. */
  const place = (q: Pt) => ({ x: q.x, y: cy + (q.y - cy) * cos, z: (q.y - cy) * sin + z0 })
  const seen = (s: { x: number; y: number; z: number }): Pt => {
    const k = m.perspective / Math.max(1, m.perspective - s.z)
    return { x: cx + (s.x - cx) * k, y: cy + (s.y - cy) * k }
  }

  const placed = edge.map(place)
  const outline = placed.map(seen)
  // The hole: the box round the panel as seen, no wider than the panel lying flat at its lift, so a part swung nearer
  // than that is over the cloth and the cloth meets the line everywhere else.
  const box = outline.reduce<FocusBox>(
    (b, q) => ({ l: Math.min(b.l, q.x), t: Math.min(b.t, q.y), r: Math.max(b.r, q.x), b: Math.max(b.b, q.y) }),
    { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity },
  )
  const k0 = m.perspective / Math.max(1, m.perspective - z0)
  const hole: FocusBox = {
    l: Math.max(box.l, cx + (panel.l - cx) * k0),
    t: Math.max(box.t, cy + (panel.t - cy) * k0),
    r: Math.min(box.r, cx + (panel.r - cx) * k0),
    b: Math.min(box.b, cy + (panel.b - cy) * k0),
  }

  // The shadow: each point let down onto the page and moved down it by its height.
  const high = Math.max(0, ...placed.map((s) => s.z))
  const full = Math.max(1, m.depth)
  const reach = clamp01(high / full)
  const blur = m.shadow * reach
  const shadow =
    blur > 0.1 ? pathOf(placed.map((s) => ({ x: s.x, y: s.y + (m.shadow / 2) * clamp01(Math.max(0, s.z) / full) }))) : ""

  const width = m.fine + (m.border - m.fine) * clamp01(pose.p) ** 2
  return {
    outline: pathOf(outline),
    line: band(outline, width, true),
    shadow,
    blur,
    tint: Math.round(12 + 10 * reach),
    hole,
  }
}

/**
 * The SVG the panel is drawn in, as the caller renders it: its line (`line`, a path FILLED with the even-odd rule, as
 * the line is a band inside the outline), the shadow, the shadow's blur and its cut-out. The caller gives the panel's
 * group its colour (`color`), and the line fills with it (`currentColor`).
 */
export type ModePanelParts = {
  panel: SVGGElement | null
  line: SVGPathElement | null
  shadow: SVGPathElement | null
  blur: SVGFEGaussianBlurElement | null
  cut: SVGPathElement | null
}

/**
 * Draws a moment of the panel: its line, and its shadow — shown only outside the panel (`cut` is the panel in the
 * shadow's mask), so what is under the panel is never darkened, as a box-shadow never paints inside its box. The shadow
 * is the line's own colour (his, 2026-09-28: "the shadow should be derived from the border"): the panel's
 * `currentColor`, so whatever colours the line colours it too, in either theme. It was the page's foreground, which
 * is white on the dark theme.
 */
export function paintModePanel(parts: ModePanelParts, shape: ModeShape, opacity: number) {
  parts.panel?.setAttribute("opacity", clamp01(opacity).toFixed(3))
  parts.line?.setAttribute("d", shape.line)
  parts.cut?.setAttribute("d", shape.outline)
  parts.blur?.setAttribute("stdDeviation", (shape.blur / 2).toFixed(2))
  if (parts.shadow) {
    parts.shadow.setAttribute("d", shape.shadow)
    parts.shadow.style.fill = `color-mix(in oklch, currentColor ${shape.tint}%, transparent)`
  }
}

// ── the play ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** Where a moment of the cloth stands: the hole the panel leaves in it (`ModeShape.hole`), and how far it is out. */
export type ModeState = { hole: FocusBox; c: number }

const eased = (ease: (t: number) => number, t: number, ms: number) => (ms > 0 ? ease(clamp01(t / ms)) : t >= 0 ? 1 : 0)

/** Coming in, when the cloth sets off after the panel does: the stagger after it starts to rise. */
export const modeClothAfter = (m: ModeMotion) => m.staggerMs

/**
 * Turning on, the way in: how long, and where it is `t` ms in — the panel rising (`p`), and the cloth coming the
 * stagger after it (`c`).
 */
export const modeOnMs = (m: ModeMotion) => Math.max(m.liftMs, modeClothAfter(m) + m.inMs)
export function modeOnAt(m: ModeMotion, t: number) {
  return { p: eased(m.liftEase, t, m.liftMs), c: eased(m.inEase, t - modeClothAfter(m), m.inMs) }
}

/**
 * Turning off, the way in backward (his, 2026-09-29: "the vertical in focus will repeat the steps backward"): the cloth
 * going first, by its own time and curve, and the panel dropping back into the page the stagger after it, by the
 * drop's.
 */
export const modeOffMs = (m: ModeMotion) => Math.max(m.outMs, m.staggerMs + m.dropMs)
export function modeOffAt(m: ModeMotion, t: number) {
  return { p: 1 - eased(m.dropEase, t - m.staggerMs, m.dropMs), c: 1 - eased(m.outEase, t, m.outMs) }
}

/**
 * From one vertical to another: the one left going off and the next coming on, both from the same moment (his,
 * 2026-09-29), each on its own clock — `modeOffAt` and `modeOnAt` at the same `t` — so it is over when the longer is.
 */
export const modeSwitchMs = (m: ModeMotion) => Math.max(modeOnMs(m), modeOffMs(m))

// ── the cloth ────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * A ring of the cloth: the blur its layer adds and the level it brings the cloth to, and where it lies, as shares of the
 * rise on each side (`share`, from and to; null for the first layer, everywhere outside the hole).
 */
export type ModeRing = { blur: number; level: number; share: [number, number] | null }

/** The cloth's rings: focus's field, measured from the panel's edges and fitted to the container on each side. */
export function modeRings(m: ModeMotion, pitch: number): ModeRing[] {
  const share = (px: number) => (px / pitch - m.clear) / m.reach
  return focusRings(m, pitch).map((r) => ({
    blur: r.blur,
    level: r.level,
    share: r.from === null || r.to === null ? null : [share(r.from), share(r.to)],
  }))
}

/**
 * Where a ring `share` of the way up the rise lies, on each side of the hole, as CSS lengths from the surface's top left
 * — its left and right `l`, `r` across it, its top and bottom `t`, `b` down it. Out from each side of the hole it is past
 * the clear margin, the rise spread over the reach or over what is left to the surface's edge on that side, whichever
 * is less (his, 2026-09-28: "I expected cloth to work as the full container … that should be full overlay"): on a stage
 * narrower than the reach every edge of it is at the far blur, where the reach alone left the field next to the panel
 * at a pixel or two, too little to take its dashes. `null` is the hole's own edges.
 */
export function modeRingEdges(m: ModeMotion, pitch: number, share: number | null) {
  const clear = m.clear * pitch
  const reach = m.reach * pitch
  const out = (span: string) =>
    share === null ? "0px" : `(${clear.toFixed(1)}px + min(${reach.toFixed(1)}px, max(0px, ${span} - ${clear.toFixed(1)}px)) * ${share.toFixed(4)})`
  return {
    l: `calc(var(--mode-l) - ${out("var(--mode-l)")})`,
    t: `calc(var(--mode-t) - ${out("var(--mode-t)")})`,
    r: `calc(var(--mode-r) + ${out("(100% - var(--mode-r))")})`,
    b: `calc(var(--mode-b) + ${out("(100% - var(--mode-b))")})`,
  }
}

/** Shown where the surface is past the ring at `to` from the hole, fading in from the one at `from`: four half-planes. */
function outside(m: ModeMotion, pitch: number, from: number | null, to: number | null): string[] {
  const f = modeRingEdges(m, pitch, from)
  const t = modeRingEdges(m, pitch, to)
  return [
    `linear-gradient(to right, #000 ${t.l}, transparent ${f.l})`,
    `linear-gradient(to left, #000 calc(100% - ${t.r}), transparent calc(100% - ${f.r}))`,
    `linear-gradient(to bottom, #000 ${t.t}, transparent ${f.t})`,
    `linear-gradient(to top, #000 calc(100% - ${t.b}), transparent calc(100% - ${f.b}))`,
  ]
}

/** The cloth's edge while it rolls: a rounded rectangle `--mode-f` out from the hole, clipped at the surface. */
const EDGE =
  "inset(max(0px, calc(var(--mode-t) - var(--mode-f))) max(0px, calc(100% - var(--mode-r) - var(--mode-f))) max(0px, calc(100% - var(--mode-b) - var(--mode-f))) max(0px, calc(var(--mode-l) - var(--mode-f))) round var(--mode-round))"

/**
 * The layers that draw the cloth, as styles for elements that each cover the surface: one a ring, the first everywhere
 * outside the hole, and the veil last where it has one. Never put an opacity, a filter, a mask or paint containment on
 * anything round them, nor an unisolated blend beside them (focus-motion.ts): it becomes their backdrop root, and they
 * blur nothing past it (the Avatar's blended ring, until it was `isolate`, kept the field sharp once the panel had
 * slid off the profile). Nor a clip but a rounded rectangle on them: under a `path()` or a `polygon()`, Chromium drops
 * their masks and blurs everything.
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
    ...masked(outside(m, pitch, ring.share?.[0] ?? null, ring.share?.[1] ?? null)),
  }))
  if (m.veil > 0) {
    layers.push({
      backgroundColor: `color-mix(in oklch, var(--background) calc(${(m.veil * 100).toFixed(0)}% * var(--mode-swell)), transparent)`,
      ...masked(outside(m, pitch, null, null)),
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
  const { hole } = state
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
