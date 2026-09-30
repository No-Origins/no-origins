import * as React from "react"
import gsap from "gsap"

import type { FocusBox } from "@no-origins/ui/lib/focus-motion"
import {
  MODE_NO_SHAPE,
  modeClothAfter,
  modeLayerStyles,
  modePanel,
  modeShape,
  paintMode,
  readModeMotion,
  type ModeMotion,
  type ModeShape,
} from "@no-origins/ui/lib/mode-motion"

/** The vertical in focus: a key the caller knows it by, and its box on the surface (the panel adds its pad). */
export type ModeTarget = { key: string; box: FocusBox }

/**
 * One moment of one vertical's panel and cloth, for the caller to paint what it owns — the panel, the verticals: the
 * panel's box and how far it has risen (`p`; it shows while it is off the page), what it looks like (`shape`, for
 * `paintModePanel`), how far its cloth is out (`c`), whether it is the vertical in focus, coming on or on (`on`), or one
 * going, and whether anything of it shows.
 */
export type ModeFrame = {
  key: string
  panel: FocusBox
  p: number
  shape: ModeShape
  c: number
  on: boolean
  shown: boolean
}

/**
 * A moment of focus mode: a frame for every vertical that has a cloth (`cloths`), in no order — those with nothing
 * showing have `shown` false — and the vertical that stands over the cloths (`lifted`): the one whose cloth is the only
 * one out. Moving to another, the one left goes under at once, its own cloth's hole keeping it sharp while the next
 * one's comes, and the next stands over the cloths once the one left is all gone.
 */
export type ModeFrames = { frames: ModeFrame[]; lifted: string | null }

type ModeMotionOptions = {
  /** Where the cloths are, over the page: the motion is read off it. It carries nothing and only holds them. */
  surface: React.RefObject<HTMLElement | null>
  /**
   * One cloth a vertical, by its key: an element over the whole surface holding `layers`, which carries that cloth's
   * custom properties (`paintMode`). Every vertical that can be in focus has one, and a panel the caller draws.
   */
  cloths: React.RefObject<Map<string, HTMLElement | null>>
  /** Whether focus mode is on. */
  on: boolean
  /** The vertical in focus. A new one, while on, is the one left going off and it coming on, at once. */
  target: ModeTarget | null
  /** The field's pitch, cell and gutter, px: the cloth's distances are in cells. */
  pitch: number
  /** The system's corner, px (half a cell, Grid.md D39): the cloth's edge keeps it while it rolls. */
  radius: number
  /** Paints what the caller owns, every frame. It touches the DOM and never React state. */
  paint?: (frames: ModeFrames, motion: ModeMotion) => void
  /** Anything that changes when the tokens do (the studio's jig): a new value and the motion is read again. */
  tuning?: unknown
  /** Hold still: nothing is painted here, and the caller paints frames of its own (the studio's timeline). */
  still?: boolean
  /** Play even under reduced motion — only the motion studio. */
  always?: boolean
}

type Tween = { from: number; to: number; start: number; ms: number; ease: (t: number) => number }
/** One vertical's panel and cloth as they stand — the rise and the cloth — and where each is going. */
type Live = { key: string; box: FocusBox; p: number; c: number; shown: boolean; on: boolean; tweens: { p?: Tween; c?: Tween } }

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** A vertical with nothing showing, as a frame. */
const idle = (key: string): ModeFrame => ({ key, panel: MODE_NO_SHAPE.hole, p: 0, shape: MODE_NO_SHAPE, c: 0, on: false, shown: false })

/**
 * Focus mode (Motion.md M14) on a surface: turned on, the panel rises out of the page over the vertical in focus, its
 * whole line there from the start, and the cloth comes from its edges; turned off, the same steps backward — the cloth
 * goes, and the panel sinks back into the page. **Another vertical is both at once** (his, 2026-09-29: "if moving from
 * 1 to 2, both 1 unfocusing and 2 focusing should start at a time" … "the vertical in focus will repeat the steps
 * backward and the other will get into focus"): every vertical has a panel and a cloth of its own, and the one left
 * goes off as the next comes on. Every change sets off from wherever each stands, so a toggle pressed
 * half way turns it round, and a vertical pressed again while it is going comes back from there. One GSAP ticker while
 * anything moves, writing each cloth's custom properties on it (`paintMode`) and handing the frames to `paint`; nothing
 * renders per frame.
 *
 * Returns the cloth's layers' styles, one element each over the whole surface, in order, for the caller to draw in
 * every cloth.
 */
export function useModeMotion({ surface, cloths, on, target, pitch, radius, paint, tuning, still = false, always = false }: ModeMotionOptions) {
  const [motion, setMotion] = React.useState<ModeMotion | null>(null)
  React.useLayoutEffect(() => {
    if (surface.current) setMotion(readModeMotion(surface.current))
    // `tuning` says when to read the motion off the surface again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface, tuning])
  const layers = React.useMemo(() => (motion ? modeLayerStyles(motion, pitch) : []), [motion, pitch])

  // Every vertical that has had focus since it was last all gone, by its key.
  const live = React.useRef(new Map<string, Live>())
  const opts = React.useRef({ cloths, radius, paint, still, always })
  React.useLayoutEffect(() => {
    opts.current = { cloths, radius, paint, still, always }
  })

  const [clock] = React.useState(() => {
    let on = false
    let m: ModeMotion | null = null
    const frameOf = (l: Live): ModeFrame => {
      const panel = modePanel(l.box, m!)
      const shape = modeShape(m!, { panel, p: l.p }, opts.current.radius)
      return { key: l.key, panel, p: l.p, shape, c: l.c, on: l.on, shown: l.shown }
    }
    const draw = () => {
      const o = opts.current
      if (o.still || !m) return
      const frames: ModeFrame[] = []
      for (const [key, el] of o.cloths.current) {
        if (!el) continue
        const l = live.current.get(key)
        const f = l ? frameOf(l) : idle(key)
        paintMode(el, m, { hole: f.shape.hole, c: f.shown ? f.c : 0 }, o.radius)
        frames.push(f)
      }
      const shown = frames.filter((f) => f.shown)
      const lifted = shown.length === 1 ? shown[0]!.key : null
      o.paint?.({ frames, lifted }, m)
    }
    function tick() {
      const now = performance.now()
      const step = (tw: Tween | undefined) => {
        if (!tw) return null
        const k = tw.ms > 0 ? Math.min(1, Math.max(0, (now - tw.start) / tw.ms)) : now >= tw.start ? 1 : 0
        return { v: tw.from + (tw.to - tw.from) * tw.ease(k), done: now >= tw.start + tw.ms }
      }
      let moving = false
      for (const l of live.current.values()) {
        for (const k of ["p", "c"] as const) {
          const s = step(l.tweens[k])
          if (!s) continue
          l[k] = s.v
          if (s.done) l.tweens[k] = undefined
          else moving = true
        }
        // A vertical all gone lets go of its panel and its cloth.
        if (!l.on && !l.tweens.p && !l.tweens.c && l.p <= 0 && l.c <= 0) {
          l.shown = false
          live.current.delete(l.key)
        }
      }
      draw()
      if (!moving) stop()
    }
    const stop = () => {
      if (on) gsap.ticker.remove(tick)
      on = false
    }
    return {
      use: (motion: ModeMotion) => void (m = motion),
      paint: draw,
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
    const el = surface.current
    if (!el) return
    const m = readModeMotion(el)
    clock.use(m)
    const quick = !opts.current.always && reduced()
    const ms = (n: number) => (quick ? 0 : n)
    const now = performance.now()
    const tween = (from: number, to: number, delay: number, length: number, ease: (t: number) => number): Tween => ({
      from,
      to,
      start: now + ms(delay),
      ms: ms(length),
      ease,
    })
    // Each step sets off from where it stands, coming in or going back, so a toggle pressed half way turns it round.
    /** Coming on, or coming back while going: the panel rising, and the cloth the stagger after it — at once, if it is out. */
    const comeOn = (l: Live) => {
      const back = l.p > 0 || l.c > 0
      l.tweens.p = tween(l.p, 1, 0, m.liftMs * (1 - l.p), m.liftEase)
      l.tweens.c = tween(l.c, 1, back ? 0 : modeClothAfter(m), m.inMs * (1 - l.c), m.inEase)
      l.shown = true
      l.on = true
    }
    /** Going, the way in backward: the cloth goes, then the stagger after it the panel drops back into the page. */
    const goOff = (l: Live) => {
      l.on = false
      l.tweens.c = tween(l.c, 0, 0, m.outMs * l.c, m.outEase)
      l.tweens.p = tween(l.p, 0, l.c > 0 ? m.staggerMs : 0, m.dropMs * l.p, m.dropEase)
    }

    if (on && key && box) {
      let l = live.current.get(key)
      if (!l) {
        l = { key, box, p: 0, c: 0, shown: false, on: false, tweens: {} }
        live.current.set(key, l)
      }
      l.box = box
      if (!l.on) comeOn(l)
      // The vertical left unfocuses as this one focuses, from the same moment.
      for (const other of live.current.values()) if (other !== l && other.on) goOff(other)
      clock.run()
      return
    }
    if (!on) {
      let going = false
      for (const l of live.current.values()) {
        if (!l.on) continue
        goOff(l)
        going = true
      }
      if (going) clock.run()
    }
    // `boxKey` stands for the box.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, key, boxKey, clock, surface])

  // A retune while nothing moves repaints the mode as it stands.
  React.useEffect(() => {
    if (motion) {
      clock.use(motion)
      clock.paint()
    }
  }, [motion, clock])

  return { motion, layers }
}
