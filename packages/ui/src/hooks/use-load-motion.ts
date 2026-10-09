import * as React from "react"
import gsap from "gsap"

import {
  loadFrame,
  loadPlan,
  loadRing,
  loadSettled,
  loadTotal,
  readLoadMotion,
  type LoadBox,
  type LoadFrame,
  type LoadMotion,
} from "@no-origins/ui/lib/load-motion"

type LoadMotionOptions = {
  /** What the loader stands on. The motion is read off it (`readLoadMotion`) when loading starts and when it is ready. */
  block: React.RefObject<HTMLElement | null>
  /** The block's cells, across and down: the loader stands on its centre. */
  cols: number
  rows: number
  /** Each section's box, px from the block's first cell, in reading order: one loader cell a section. */
  targets: LoadBox[]
  cell: number
  gap: number
  /** False while the page loads — the cells turn — and true once it is ready: they expand into their sections. */
  ready: boolean
  /** Writes a frame onto the rings and the sections. It runs every tick, so it touches the DOM and never React state. */
  paint: (frames: LoadFrame[]) => void
  /** Anything that changes when the tokens do (the studio's jig): a new value and the motion is read again. */
  tuning?: unknown
  /**
   * Hold still: nothing plays and nothing is painted here, and the caller paints a frame of its own (the studio's
   * scrub). Letting go loads again, or puts the sections in if the page is ready.
   */
  still?: boolean
  /**
   * Play even under reduced motion. Only the motion studio, where the motion is what is being looked at; everything
   * else holds the cells still while it loads and puts the sections in at once when it is ready (Motion.md §5).
   */
  always?: boolean
  /** Called once the last section is in, after `ready`. */
  onIn?: () => void
}

type Shape = Pick<LoadMotionOptions, "cols" | "rows" | "targets" | "cell" | "gap" | "paint" | "onIn">
type Clock = { start: number; ready: number | null; motion: LoadMotion | null; loading: boolean }

/**
 * Loading (Motion.md M10) on a block: while `ready` is false the loader's cells turn at its centre,
 * one a section; when it goes true each expands into its section. One GSAP ticker while anything moves, each tick
 * handing `loadFrame`'s frame to `paint`; nothing renders per frame, and once the last section is in the ticker stops.
 * `ready` going false again starts loading over.
 *
 * Returns `untilLanded`: how long, from now, the sections would take to be in if the page were ready now — what the
 * studio waits before it holds the page.
 */
export function useLoadMotion({ block, cols, rows, targets, cell, gap, ready, paint, tuning, still = false, always = false, onIn }: LoadMotionOptions) {
  const clock = React.useRef<Clock>({ start: 0, ready: null, motion: null, loading: false })
  const shape = React.useRef<Shape>({ cols, rows, targets, cell, gap, paint, onIn })

  // The newest block for the ticker, which reads it every tick: a block that changes mid-turn turns on in its new shape.
  React.useLayoutEffect(() => {
    shape.current = { cols, rows, targets, cell, gap, paint, onIn }
  })

  // One ticker for the block's life, reading the refs — stable, so GSAP can take it off again. It stops itself once the
  // last section is in.
  const [ticker] = React.useState(() => {
    let on = false
    const planOf = (motion: LoadMotion, readyAt: number | null) => {
      const s = shape.current
      return loadPlan(motion, s.targets, s.cols, s.rows, s.cell, s.gap, readyAt)
    }
    const stop = () => {
      if (on) gsap.ticker.remove(frame)
      on = false
    }
    function frame() {
      const c = clock.current
      if (!c.motion) return
      const plan = planOf(c.motion, c.ready)
      const t = performance.now() - c.start
      // In: every section, or none to wait for.
      if (c.ready !== null && (t >= loadTotal(plan) || !plan.targets.length)) {
        shape.current.paint(loadSettled(plan.targets))
        stop()
        shape.current.onIn?.()
        return
      }
      shape.current.paint(loadFrame(plan, t))
    }
    return {
      planOf,
      stop,
      running: () => on,
      start() {
        if (!on) gsap.ticker.add(frame)
        on = true
        frame()
      },
      /** Paint once, for a block that is not moving: in, or — under reduced motion — its cells still. */
      still() {
        const c = clock.current
        if (!c.motion) return
        const plan = planOf(c.motion, c.ready)
        shape.current.paint(c.ready !== null || !c.loading ? loadSettled(plan.targets) : loadFrame(plan, 0))
      },
    }
  })

  const reduced = React.useCallback(() => !always && window.matchMedia("(prefers-reduced-motion: reduce)").matches, [always])

  React.useLayoutEffect(() => {
    const el = block.current
    if (!el) return
    const c = clock.current
    const now = performance.now()
    c.motion = readLoadMotion(el)
    if (still) {
      ticker.stop()
      return
    }
    if (!ready) {
      c.start = now
      c.ready = null
      c.loading = true
    } else if (c.loading && c.ready === null) {
      c.ready = now - c.start
    }
    // A block that was never loading — mounted ready — is simply in.
    if (reduced() || !c.loading) {
      ticker.stop()
      ticker.still()
      if (ready) shape.current.onIn?.()
      return
    }
    ticker.start()
    // Only `ready` and `still`: the block's shape is read every tick, and the tokens on `tuning`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, still])

  // The jig moved: read the motion again. What is moving moves by it from the next tick; what is still is painted.
  React.useLayoutEffect(() => {
    const el = block.current
    if (!el || !clock.current.motion) return
    clock.current.motion = readLoadMotion(el)
    if (!ticker.running() && !still) ticker.still()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuning])

  // A block that changed shape while still — another count of sections, another field — is painted in its new one.
  React.useLayoutEffect(() => {
    if (!ticker.running() && !still) ticker.still()
    // Not on `still`: letting go is the effect on `ready` above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, rows, targets, cell, gap, ticker])

  React.useEffect(() => ticker.stop, [ticker])

  const untilLanded = React.useCallback(() => {
    const el = block.current
    const c = clock.current
    if (!el || still || reduced() || !c.loading || c.ready !== null) return 0
    const t = performance.now() - c.start
    return Math.max(0, loadTotal(ticker.planOf(readLoadMotion(el), t)) - t)
  }, [block, still, reduced, ticker])

  return { untilLanded }
}

/** A ring's line: the loader's lime, the plain border a section wears, or a mix of the two as it is released. */
const lineColour = (lime: number) =>
  lime >= 1 ? "var(--lime)" : lime <= 0 ? "var(--border)" : `color-mix(in oklch, var(--lime) ${lime * 100}%, var(--border))`

/**
 * The painter for a ring drawn as an SVG holding one `rect` (the motion studio's stage), px from the block's first
 * cell: its box, its corner (a cell's circle), its dashes — how far round and how closed — how lit, its line's colour,
 * and how big it is drawn in its box, about the box's centre, so its dashes keep their count while it is pressed or
 * drowns. `shown` 0 hides it whatever the frame says.
 */
export function paintLoadRing(svg: SVGSVGElement | null, f: LoadFrame, cell: number, shown = 1) {
  const rect = svg?.firstElementChild as SVGRectElement | null | undefined
  if (!svg || !rect) return
  const opacity = f.opacity * shown
  if (opacity <= 0 || f.scale <= 0) {
    svg.style.visibility = "hidden"
    return
  }
  const w = f.r - f.l
  const h = f.b - f.t
  const ring = loadRing(w, h, cell, f.solid)
  svg.style.visibility = "visible"
  svg.style.opacity = String(opacity)
  svg.style.transform = `translate(${f.l}px, ${f.t}px) scale(${f.scale})`
  svg.style.width = `${w}px`
  svg.style.height = `${h}px`
  rect.setAttribute("width", String(ring.width))
  rect.setAttribute("height", String(ring.height))
  rect.setAttribute("rx", String(ring.radius))
  rect.setAttribute("ry", String(ring.radius))
  rect.setAttribute("stroke-dasharray", `${ring.dash} ${ring.gap}`)
  // Clockwise: the path runs clockwise from the top-left, and a negative offset carries the dashes along it.
  rect.setAttribute("stroke-dashoffset", String(-f.dash))
  rect.style.stroke = lineColour(f.lime)
}

/**
 * The painter for a section: shown INSIDE its ring — clipped to the ring's box, a cell's circle at its corners — and as
 * far in as the frame says, so it is revealed as the ring opens and never shows past it. `target` is the section's own
 * box, px on the same cells. Once it is in, the clip comes off.
 */
export function paintLoadSection(el: HTMLElement | null, f: LoadFrame, target: LoadBox, cell: number) {
  if (!el) return
  el.style.opacity = f.content >= 1 ? "" : String(f.content)
  const inset = [f.t - target.t, target.r - f.r, target.b - f.b, f.l - target.l]
  const radius = Math.max(0, Math.min(cell / 2, (f.r - f.l) / 2, (f.b - f.t) / 2))
  el.style.clipPath =
    f.content >= 1 && inset.every((v) => Math.abs(v) < 0.5) ? "" : `inset(${inset.map((v) => `${v}px`).join(" ")} round ${radius}px)`
}
