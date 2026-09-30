"use client"

import * as React from "react"
import gsap from "gsap"

import { Agent, type AgentPainter } from "@no-origins/ui/components/agent"
import type { GridMetrics } from "@no-origins/ui/components/grid"
import { introPlan, introRings, readIntroMotion, type IntroCircle } from "@no-origins/ui/lib/intro-motion"
import { readSphereMotion, sphereCourse, sphereFrame, sphereStill } from "@no-origins/ui/lib/sphere-motion"

/**
 * The intro, played (Grid.md D50, Motion.md M22): the agent in the page's circle for it, breathing, hopping in place, and
 * the field waking ring by ring from it as it lands; then the agent fading away as the page comes in. `lib/intro-motion`
 * is when each part is; this draws the agent and hands the rings to the field's painter.
 *
 * `grid.tsx` mounts it over the page's boxes, on the field, while its intro runs, and loads it only then: the agent's
 * model is the biggest thing in the package, and no page without an intro should carry it.
 *
 * **Where it stands.** On the element of the page marked `data-intro-agent` — the portfolio's avatar ring — its circle
 * the one inscribed in that element's box, read off the tracks where the grid put it. A page arranged once the field is
 * measured mounts its boxes a render or two after the grid, so it waits for one, ANCHOR_WAIT_MS at most, and stands on
 * the field's centre, a cell across, where there is none.
 *
 * **What it is.** The design system's `Agent`, as the tokens on the grid make it (`readSphereMotion`: SPHERE_START where
 * none is set — the page holds no character's look), in a nest the size of the circle: the muted tint in a lime line,
 * as the character studio's cell is, over the field's cells. It is painted from GSAP's ticker; the rings are one pass of
 * the field's painter, sent as it starts, on the painter's own clock, so a busy main thread cannot hold them back.
 */

/** How long it waits for the page's circle before it stands on the field's centre. */
const ANCHOR_WAIT_MS = 600
/** The painter's colour the rings light in: violet, the pointer's lit cell's (D43), which shows on both themes. */
const RING_LAYER = 1

export type GridIntroProps = {
  metrics: GridMetrics
  /** The grid's root: what the tokens are read off, and what the page's circle is found in. */
  root: HTMLElement
  /** Light the field's cells: one pass of the painter, each cell at `zero + delays[i]` (epoch ms). */
  pass: (delays: Float64Array, span: number, zero: number, layer: number) => void
  /** The last ring has lit: the page comes in over `ms` from now. */
  onReveal: (ms: number) => void
  /** It is over. */
  onDone: () => void
}

export function GridIntro({ metrics, root, pass, onReveal, onDone }: GridIntroProps) {
  const layer = React.useRef<HTMLDivElement>(null)
  const agent = React.useRef<AgentPainter>(null)
  const [circle, setCircle] = React.useState<IntroCircle | null>(null)

  // The page's circle, px from the field's first cell, once the page has put it on the field.
  React.useLayoutEffect(() => {
    const box = layer.current?.parentElement
    if (!box) return
    const find = () => {
      const el = root.querySelector<HTMLElement | SVGElement>("[data-intro-agent]")
      const r = el?.getBoundingClientRect()
      if (!r || !r.width || !r.height) return false
      const at = box.getBoundingClientRect()
      setCircle({ x: r.left - at.left + r.width / 2, y: r.top - at.top + r.height / 2, r: Math.min(r.width, r.height) / 2 })
      return true
    }
    if (find()) return
    const watch = new MutationObserver(() => {
      if (find()) stop()
    })
    watch.observe(root, { childList: true, subtree: true })
    const cap = window.setTimeout(() => {
      stop()
      setCircle({ x: metrics.gridW / 2, y: metrics.gridH / 2, r: metrics.cell / 2 })
    }, ANCHOR_WAIT_MS)
    function stop() {
      watch.disconnect()
      window.clearTimeout(cap)
    }
    return stop
    // Found once, on the field it started on: the grid ends the intro if the field changes under it.
  }, [root, metrics])

  // The play, once the circle is known.
  const done = React.useRef({ onReveal, onDone, pass })
  done.current = { onReveal, onDone, pass }
  React.useLayoutEffect(() => {
    const el = layer.current
    if (!circle || !el) return
    const m = readSphereMotion(root)
    const intro = readIntroMotion(root)
    // A nest the size of the circle, as the character studio's cell is: the agent a share of it across.
    const size = 2 * circle.r
    const g = { cell: size, gap: 0 }
    const nest = { col: 0, row: 0 }
    const still = sphereStill(m, g, nest)
    const hop = sphereCourse(m, g, { from: nest, to: nest }, intro.breathe)
    const plan = introPlan(intro, m.crouch + m.hang, introRings(metrics, circle))

    const start = performance.now()
    // The rings, at once: the painter keeps their time from the landing, on its own clock.
    done.current.pass(plan.delays, plan.span, performance.timeOrigin + start + plan.land, RING_LAYER)
    let revealed = false
    let over = false
    const tick = () => {
      if (over) return
      const t = performance.now() - start
      agent.current?.paint(t < plan.hop ? sphereFrame(still, t, t) : sphereFrame(hop, t - plan.hop, t), m)
      if (t >= plan.vanish) {
        el.style.opacity = String(Math.max(0, 1 - (t - plan.vanish) / Math.max(1, intro.vanish)))
        if (!revealed) {
          revealed = true
          done.current.onReveal(intro.reveal)
        }
      }
      if (t >= plan.end) {
        over = true
        done.current.onDone()
      }
    }
    tick()
    gsap.ticker.add(tick)
    return () => {
      over = true
      gsap.ticker.remove(tick)
    }
  }, [circle, root, metrics])

  const size = circle ? 2 * circle.r : 0
  return (
    // Over the page's boxes, on the field; the hop may rise past the field's top edge, so nothing is clipped.
    <div ref={layer} data-slot="grid-intro" aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      {circle ? (
        <svg
          className="absolute overflow-visible"
          style={{ left: circle.x - circle.r, top: circle.y - circle.r, width: size, height: size }}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle cx={circle.r} cy={circle.r} r={circle.r - 0.5} fill="var(--muted)" stroke="var(--lime)" strokeWidth={1} />
          <Agent ref={agent} />
        </svg>
      ) : null}
    </div>
  )
}
