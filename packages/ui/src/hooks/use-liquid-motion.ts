import * as React from "react"
import gsap from "gsap"

import { liquidFrame, liquidLevel, liquidStill, readLiquidMotion, type LiquidFrame, type LiquidMotion, type LiquidPour } from "@no-origins/ui/lib/liquid-motion"

type LiquidMotionOptions = {
  /** The liquid's box. The motion is read off it (`readLiquidMotion`) when it starts and when `tuning` changes. */
  block: React.RefObject<HTMLElement | null>
  /** The level it holds, 0 empty to 1 full. It arrives pouring from 0, and a new level pours from where it is. */
  level: number
  /** Writes a frame onto the liquid. It runs every tick, so it touches the DOM and never React state. */
  paint: (frame: LiquidFrame, motion: LiquidMotion) => void
  /** Anything that changes when the tokens do (the studio's jig): a new value and the motion is read again. */
  tuning?: unknown
  /** Hold still: nothing plays and nothing is painted here, and the caller paints a frame of its own (the studio's timeline). */
  still?: boolean
  /**
   * Play even under reduced motion. Only the motion studio, where the motion is what is being looked at; everything
   * else shows the liquid still at its level, a flat surface (Motion.md §5).
   */
  always?: boolean
}

type Clock = { start: number; pourAt: number; pour: LiquidPour; level: number; motion: LiquidMotion | null }

/**
 * Liquid (Motion.md M25, his, 2026-10-03) in a box: the surface flowing as two waves, the level breathing, and a pour
 * when it arrives or its level changes. One GSAP ticker for the box's life, each tick handing `liquidFrame`'s frame to
 * `paint`; nothing renders per frame. Under reduced motion the liquid is painted once, still at its level, and again
 * at each new level.
 */
export function useLiquidMotion({ block, level, paint, tuning, still = false, always = false }: LiquidMotionOptions) {
  const clock = React.useRef<Clock>({ start: 0, pourAt: 0, pour: { from: 0, to: level, since: 0 }, level, motion: null })
  const painter = React.useRef(paint)
  React.useLayoutEffect(() => {
    painter.current = paint
  })

  // One ticker, reading the clock — stable, so GSAP can take it off again.
  const [ticker] = React.useState(() => {
    let on = false
    function frame() {
      const c = clock.current
      if (!c.motion) return
      const now = performance.now()
      painter.current(liquidFrame(c.motion, now - c.start, { ...c.pour, since: now - c.pourAt }), c.motion)
    }
    return {
      start() {
        if (!on) gsap.ticker.add(frame)
        on = true
        frame()
      },
      stop() {
        if (on) gsap.ticker.remove(frame)
        on = false
      },
    }
  })

  const reduced = React.useCallback(() => !always && window.matchMedia("(prefers-reduced-motion: reduce)").matches, [always])

  // The motion, read when the box mounts and when the tokens change; the clock starts once.
  React.useLayoutEffect(() => {
    const el = block.current
    if (!el) return
    const c = clock.current
    c.motion = readLiquidMotion(el)
    if (!c.start) {
      c.start = performance.now()
      c.pourAt = c.start
    }
  }, [block, tuning])

  // A new level pours from wherever the liquid is now.
  React.useLayoutEffect(() => {
    const c = clock.current
    if (c.level === level) return
    const now = performance.now()
    const from = c.motion ? liquidLevel(c.motion, { ...c.pour, since: now - c.pourAt }) : c.pour.to
    c.pour = { from, to: level, since: 0 }
    c.pourAt = now
    c.level = level
    if (c.motion && !still && reduced()) painter.current(liquidStill(level), c.motion)
  }, [level, still, reduced])

  // Running: the ticker while it may move, one still frame under reduced motion, nothing while held.
  React.useLayoutEffect(() => {
    const c = clock.current
    if (!c.motion) return
    if (still) {
      ticker.stop()
      return
    }
    if (reduced()) {
      ticker.stop()
      painter.current(liquidStill(c.pour.to), c.motion)
      return
    }
    ticker.start()
    return () => ticker.stop()
    // `tuning` says when the motion was read again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still, reduced, ticker, tuning])
}
