import * as React from "react"
import gsap from "gsap"

import type { FocusBox } from "@no-origins/ui/lib/focus-motion"
import {
  boxBetween,
  modeLayerStyles,
  modePanel,
  modeSlideAt,
  paintMode,
  readModeMotion,
  type ModeMotion,
} from "@no-origins/ui/lib/mode-motion"

/** The vertical in focus: a key the caller knows it by, and its box on the surface (the panel adds its pad). */
export type ModeTarget = { key: string; box: FocusBox }

/**
 * One moment of focus mode, for the caller to paint what it owns — the panel, the verticals, the switcher: the panel's
 * box and lift (`p`, the dip taken), the lift before the dip (`base`), how far the cloth is out (`c`), and the slide —
 * the vertical left (`from`, null when not sliding), the one in focus (`to`) and how far along (`s`, 1 when still).
 */
export type ModeFrame = { panel: FocusBox; p: number; base: number; c: number; from: string | null; to: string | null; s: number; shown: boolean }

type ModeMotionOptions = {
  /** The surface the cloth covers, which carries its custom properties. The motion is read off it. */
  surface: React.RefObject<HTMLElement | null>
  /** Whether focus mode is on. */
  on: boolean
  /** The vertical in focus. A new one, while on, is a slide. */
  target: ModeTarget | null
  /** The field's pitch, cell and gutter, px: the cloth's distances are in cells. */
  pitch: number
  /** The system's corner, px (half a cell, Grid.md D39): the cloth's edge keeps it while it rolls. */
  radius: number
  /** Paints what the caller owns, every frame. It touches the DOM and never React state. */
  paint?: (frame: ModeFrame, motion: ModeMotion) => void
  /** Anything that changes when the tokens do (the studio's jig): a new value and the motion is read again. */
  tuning?: unknown
  /** Hold still: nothing is painted here, and the caller paints frames of its own (the studio's timeline). */
  still?: boolean
  /** Play even under reduced motion — only the motion studio. */
  always?: boolean
}

type Tween = { from: number; to: number; start: number; ms: number; ease: (t: number) => number }
type Slide = { from: FocusBox; to: FocusBox; start: number; ms: number }
type Live = { box: FocusBox | null; base: number; c: number; from: string | null; to: string | null; shown: boolean; on: boolean }

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * Focus mode (Motion.md M14) on a surface: turned on, the panel comes out of the page over the vertical in focus and the
 * cloth rolls out from its edges; another vertical is a slide; turned off, the cloth rolls back and the panel goes down.
 * Every change sets off from wherever the mode stands, so a toggle pressed half way turns it round. One GSAP ticker
 * while anything moves, writing the cloth's custom properties on the surface (`paintMode`) and handing the frame to
 * `paint`; nothing renders per frame.
 *
 * Returns the cloth's layers' styles, one element each over the whole surface, in order, for the caller to draw.
 */
export function useModeMotion({ surface, on, target, pitch, radius, paint, tuning, still = false, always = false }: ModeMotionOptions) {
  const [motion, setMotion] = React.useState<ModeMotion | null>(null)
  React.useLayoutEffect(() => {
    if (surface.current) setMotion(readModeMotion(surface.current))
    // `tuning` says when to read the motion off the surface again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface, tuning])
  const layers = React.useMemo(() => (motion ? modeLayerStyles(motion, pitch) : []), [motion, pitch])

  const live = React.useRef<Live>({ box: null, base: 0, c: 0, from: null, to: null, shown: false, on: false })
  const tweens = React.useRef<{ base?: Tween; c?: Tween; slide?: Slide }>({})
  const opts = React.useRef({ surface, radius, paint, still, always })
  React.useLayoutEffect(() => {
    opts.current = { surface, radius, paint, still, always }
  })

  const [clock] = React.useState(() => {
    let on = false
    let m: ModeMotion | null = null
    const frameOf = (now: number): ModeFrame | null => {
      const l = live.current
      if (!l.box || !m) return null
      const sl = tweens.current.slide
      const u = sl ? (sl.ms > 0 ? (now - sl.start) / sl.ms : 1) : 1
      const at = modeSlideAt(m, sl ? u : 1)
      const box = sl ? boxBetween(sl.from, sl.to, at.s) : l.box
      const p = l.base * (sl ? at.lift : 1)
      return { panel: modePanel(box, m), p, base: l.base, c: l.c, from: sl ? l.from : null, to: l.to, s: sl ? at.s : 1, shown: l.shown }
    }
    const draw = (now: number) => {
      const o = opts.current
      if (o.still || !m) return
      const f = frameOf(now)
      if (!f) return
      paintMode(o.surface.current, m, { panel: f.panel, p: f.p, c: f.shown ? f.c : 0 }, o.radius)
      o.paint?.(f, m)
    }
    function tick() {
      const now = performance.now()
      const l = live.current
      const t = tweens.current
      const step = (tw: Tween | undefined) => {
        if (!tw) return null
        const k = tw.ms > 0 ? Math.min(1, Math.max(0, (now - tw.start) / tw.ms)) : now >= tw.start ? 1 : 0
        return { v: tw.from + (tw.to - tw.from) * tw.ease(k), done: now >= tw.start + tw.ms }
      }
      const b = step(t.base)
      if (b) {
        l.base = b.v
        if (b.done) t.base = undefined
      }
      const c = step(t.c)
      if (c) {
        l.c = c.v
        if (c.done) t.c = undefined
      }
      // The frame is taken before a finished slide lets go, so its last frame is where it lands.
      draw(now)
      if (t.slide && now >= t.slide.start + t.slide.ms) {
        l.box = t.slide.to
        l.from = null
        t.slide = undefined
      }
      if (!t.base && !t.c && !t.slide) {
        if (!l.on && l.base <= 0 && l.c <= 0) {
          l.shown = false
          l.to = null
          draw(now)
        }
        stop()
      }
    }
    const stop = () => {
      if (on) gsap.ticker.remove(tick)
      on = false
    }
    return {
      use: (motion: ModeMotion) => void (m = motion),
      paint: () => draw(performance.now()),
      run: () => {
        if (!on) gsap.ticker.add(tick)
        on = true
        tick()
      },
      stop,
    }
  })
  React.useEffect(() => clock.stop, [clock])

  // Letting go of the timeline shows the live state again.
  React.useLayoutEffect(() => {
    if (!still) clock.paint()
  }, [still, clock])

  const key = target?.key ?? null
  const box = target?.box
  const boxKey = box ? `${box.l},${box.t},${box.r},${box.b}` : ""
  React.useEffect(() => {
    const el = opts.current.surface.current
    if (!el) return
    const m = readModeMotion(el)
    clock.use(m)
    const quick = !opts.current.always && reduced()
    const ms = (n: number) => (quick ? 0 : n)
    const l = live.current
    const t = tweens.current
    const now = performance.now()
    const tween = (from: number, to: number, delay: number, length: number, ease: (t: number) => number): Tween => ({
      from,
      to,
      start: now + ms(delay),
      ms: ms(length),
      ease,
    })

    if (on && key && box) {
      if (!l.shown || !l.box) {
        // From nothing: the panel stands over the vertical and comes out; the cloth follows it by the stagger.
        t.slide = undefined
        l.box = box
        l.from = null
        l.to = key
        l.shown = true
      } else if (key !== l.to) {
        // To another vertical: the panel slides over from wherever it stands.
        const sl = t.slide
        const here = sl ? boxBetween(sl.from, sl.to, modeSlideAt(m, sl.ms > 0 ? (now - sl.start) / sl.ms : 1).s) : l.box
        t.slide = { from: here, to: box, start: now, ms: ms(m.slideMs) }
        l.from = l.to
        l.to = key
        l.box = box
      } else if (!t.slide) l.box = box
      if (!l.on) {
        // Coming on, or coming back while going: from where it stands, the lift at once and the cloth by the stagger.
        const back = l.shown && (l.base > 0 || l.c > 0)
        t.base = tween(l.base, 1, 0, m.liftMs * (1 - l.base), m.liftEase)
        t.c = tween(l.c, 1, back ? 0 : m.staggerMs, m.inMs * (1 - l.c), m.inEase)
      }
      l.on = true
      clock.run()
      return
    }

    if (!on && l.on) {
      // Going: the cloth rolls back, then the panel goes down by the stagger.
      l.on = false
      t.c = tween(l.c, 0, 0, m.outMs * l.c, m.outEase)
      t.base = tween(l.base, 0, m.staggerMs, m.liftMs * l.base, m.liftEase)
      clock.run()
    }
    // `boxKey` stands for the box.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, key, boxKey, clock])

  // A retune while nothing moves repaints the mode as it stands.
  React.useEffect(() => {
    if (motion) {
      clock.use(motion)
      clock.paint()
    }
  }, [motion, clock])

  return { motion, layers }
}
