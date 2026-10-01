"use client"

import * as React from "react"
import gsap from "gsap"

import { Agent, type AgentPainter } from "@no-origins/ui/components/agent"
import type { GridMetrics } from "@no-origins/ui/components/grid"
import { sphereMotionOf } from "@no-origins/ui/lib/agent-body"
import {
  introActionValues,
  introAt,
  introCast,
  introHome,
  introNestLeft,
  introPlan,
  introResting,
  introRipple,
  introSpots,
  readIntroMotion,
  type IntroActions,
  type IntroAgent,
  type IntroBox,
  type IntroMotions,
  type IntroPlan,
} from "@no-origins/ui/lib/intro-motion"
import { readSphereMotion, sphereBowl } from "@no-origins/ui/lib/sphere-motion"

/**
 * The intro, played (Grid.md D50, Motion.md M22, version 8): the page's agents standing in a row on the field's middle,
 * in a random order, those that bounce each at its own random times, then jumping or diving to the centre of the boxes
 * they open, a small ripple spreading round each as it lands, then diving home to their cells in the field's last column,
 * and the boxes each opens fading in once it is gone. `lib/intro-motion` is who goes where, by which action, and when;
 * this draws them, hands the ripples to the field's painter and shows the boxes. **Then they stay**: it goes on drawing
 * them, resting in their cells, once the intro is over (`settled`).
 *
 * `grid.tsx` mounts it over the page's boxes, on the field, from the intro on, and loads it only then: the agent's model
 * is the biggest thing in the package, and no page without an intro should carry it.
 *
 * **The boxes** are the page's, read off the tracks where the grid put them, with the agents each names
 * (`data-intro-by`). A page arranged once the field is measured mounts them a render or two after the grid, so it waits
 * for them, BOXES_WAIT_MS at most, and plays on an empty field where there are none. While the intro runs globals.css
 * holds every box back; one coming in is shown here, its opacity set to 1 once and faded up from 0 by one animation the
 * compositor plays (`REVEAL_EASE`, over `reveal`), so a busy main thread cannot make it stutter, until the grid lets
 * go of them all at the end. Version 4's clip, re-cut a ring at a time, stuttered (his, 2026-10-01).
 *
 * **The agents** are the design system's `Agent`, each as its look makes it under each action's values
 * (`sphereMotionOf`, the actions `introActionValues` gives); with no cast, one, as the tokens on the grid make it
 * (`readSphereMotion`), for every action. Each sits in a nest the size of a field's cell — the muted tint in a lime line,
 * as the motion studio's nests are — and is painted from GSAP's ticker, one frame of the action it is in a tick
 * (`introAt`), drawn as the studio's stage draws an action: moved behind the page by its shift and cut to the nest it
 * goes out of or comes into, or to the bowl it pops up into. Its last is his Dive home; the nest it dives out of, over
 * the box by then, goes as it does (`introNestLeft`), and the cell it comes up in stays lit under it.
 *
 * **Settled**, the grid's intro over or never played, it draws the cast resting in its cells (`introResting`) on the
 * field it is given: a field that changes after the intro, or a page that skipped it. Under reduced motion they are
 * drawn once, still.
 *
 * **The ripples** are the field's painter's (D38), one pass an agent, all sent as the intro starts, each timed from its
 * landing on the painter's own clock, so a busy main thread cannot hold them back (version 1's rule).
 */

/** How long it waits for the page's boxes before it plays without them. */
const BOXES_WAIT_MS = 600
/** A box fading in: the curve globals.css brings the page in by (`grid-intro-in`). */
const REVEAL_EASE = "cubic-bezier(0.33, 1, 0.68, 1)"
/** The painter's colour the ripples light in: violet, the pointer's lit cell's (D43) and version 1's rings'. */
const RIPPLE_LAYER = 1
/** Far enough out to cut nothing. */
const FAR = 1e5
const UNCUT = `M ${-FAR} ${-FAR} H ${FAR} V ${FAR} H ${-FAR} Z`

/** A nest's circle as a path: the page's opening, which an agent goes out of and comes into behind the page. */
const circlePath = ({ x, y, r }: { x: number; y: number; r: number }) =>
  `M ${(x - r).toFixed(2)} ${y.toFixed(2)} a ${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0 a ${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0 Z`

export type GridIntroProps = {
  metrics: GridMetrics
  /** The grid's root: what the tokens are read off, and what the page's boxes are found in. */
  root: HTMLElement
  /** The cast; none, one agent as the grid's tokens make it. */
  agents?: readonly IntroAgent[]
  /** How the cast bounces, jumps and dives; an action left out, its defaults. */
  actions?: IntroActions
  /**
   * The grid's intro is over, or never played: on a field it has not planned for yet, the cast rests in its cells. Read
   * as it plans, so the intro in play when the grid lets go of the page plays on to its end.
   */
  settled?: boolean
  /** Light the field's cells: one pass of the painter, each cell at `zero + delays[i]` (epoch ms), Infinity never. */
  pass: (delays: Float64Array, span: number, zero: number, layer: number) => void
  /** The last box is in: the page's boxes are let go of, at once (`ms` 0). */
  onReveal: (ms: number) => void
  /** It is over: every box is in and every agent at rest in its cell. It goes on drawing them. */
  onDone: () => void
}

/** A box of the page: its element, and where it is in cells. */
type Found = { el: HTMLElement; cells: IntroBox }

/** Everything the play needs, made once the boxes are known. */
type Play = {
  /** The field it is planned on. */
  metrics: GridMetrics
  found: Found[]
  plan: IntroPlan
  ids: string[]
  ripples: { delays: Float64Array; span: number }[]
  /** How long the boxes take to fade in. */
  reveal: number
  /** Resting in their cells, with nothing to play: the boxes are the grid's, and nothing ends. */
  resting: boolean
  /** Resting under reduced motion: drawn once. */
  still: boolean
}

export function GridIntro({ metrics, root, agents, actions, settled = false, pass, onReveal, onDone }: GridIntroProps) {
  const layer = React.useRef<HTMLDivElement>(null)
  // The page's boxes, and the field they were found on: what it plans on, so a field that changes plans nothing until
  // they are found on it.
  const [found, setFound] = React.useState<{ metrics: GridMetrics; boxes: Found[] } | null>(null)
  // A clip path is named in a url(), which React's ids (with their «» or colons) would break.
  const id = `grid-intro-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  // Read as it plans, never planned on: the grid letting go of the page as the intro ends must not start them over.
  const resting = React.useRef(settled)
  resting.current = settled

  // The page's boxes, in cells from the field's first, once the page has put them on the field. Resting, none: the
  // boxes are the grid's.
  React.useLayoutEffect(() => {
    if (resting.current) {
      setFound({ metrics, boxes: [] })
      return
    }
    const tracks = root.querySelector<HTMLElement>('[data-slot="grid-tracks"]')
    if (!tracks) return
    const pitch = metrics.cell + metrics.gap
    const find = () => {
      const els = [...tracks.querySelectorAll<HTMLElement>(':scope > [data-slot="grid-item"]')]
      if (!els.length) return false
      const at = tracks.getBoundingClientRect()
      const boxes = els.map((el) => {
        const r = el.getBoundingClientRect()
        const cells: IntroBox = {
          col: Math.round((r.left - at.left) / pitch),
          row: Math.round((r.top - at.top) / pitch),
          across: Math.max(1, Math.round((r.width + metrics.gap) / pitch)),
          down: Math.max(1, Math.round((r.height + metrics.gap) / pitch)),
          by: (el.dataset.introBy ?? "").split(/\s+/).filter(Boolean),
        }
        return { el, cells }
      })
      setFound({ metrics, boxes })
      return true
    }
    if (find()) return
    const watch = new MutationObserver(() => {
      if (find()) stop()
    })
    watch.observe(tracks, { childList: true })
    const cap = window.setTimeout(() => {
      stop()
      setFound({ metrics, boxes: [] })
    }, BOXES_WAIT_MS)
    function stop() {
      watch.disconnect()
      window.clearTimeout(cap)
    }
    return stop
    // Found once a field: the grid ends the intro if the field changes under it, and they rest on the new one.
  }, [root, metrics])

  // Who stands where, does what and when, once the boxes are known: the tokens read, and the dice thrown, as it starts.
  // Resting, each in its cell.
  const play = React.useMemo<Play | null>(() => {
    if (!found) return null
    const { metrics } = found
    const cast = agents?.length ? agents : null
    const ids = cast ? cast.map((a) => a.id) : ["agent"]
    const tokens = cast ? null : readSphereMotion(root)
    const values = { bounce: introActionValues(actions, "bounce"), jump: introActionValues(actions, "jump"), dive: introActionValues(actions, "dive") }
    const motions = ids.map((_, a): IntroMotions => {
      const look = cast?.[a]?.look
      return look
        ? { bounce: sphereMotionOf(look, values.bounce), jump: sphereMotionOf(look, values.jump), dive: sphereMotionOf(look, values.dive) }
        : { bounce: tokens!, jump: tokens!, dive: tokens! }
    })
    const { cell, gap, cols, rows } = metrics
    const g = { cell, gap }
    const homes = introHome(ids.length, cols, rows)
    if (resting.current) {
      // Under reduced motion they are drawn once, still: their eyes open.
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      return { metrics, found: [], plan: introResting({ g, homes, motions, still }), ids, ripples: [], reveal: 0, resting: true, still }
    }
    const intro = readIntroMotion(root)
    const boxes = found.boxes.map((f) => f.cells)
    const roles = introCast(ids, boxes)
    const spots = introSpots(roles.map((r) => r.nest), cols, rows)
    const bounces = ids.map((_, a) => cast?.[a]?.bounces ?? true)
    const plan = introPlan({ m: intro, g, roles, spots, homes, motions, boxes, bounces })
    const ripples = plan.parts.map((p) => introRipple({ cols, rows, cell, gap }, p.nest, intro))
    return { metrics, found: found.boxes, plan, ids, ripples, reveal: intro.reveal, resting: false, still: false }
  }, [found, agents, actions, root])

  // The play, on GSAP's ticker.
  const painters = React.useRef<(AgentPainter | null)[]>([])
  const nestFrom = React.useRef<(SVGGElement | null)[]>([])
  const nestTo = React.useRef<(SVGGElement | null)[]>([])
  const cuts = React.useRef<(SVGPathElement | null)[]>([])
  const behind = React.useRef<(SVGGElement | null)[]>([])
  const done = React.useRef({ onReveal, onDone, pass })
  done.current = { onReveal, onDone, pass }
  React.useLayoutEffect(() => {
    if (!play) return
    const { found, plan, ripples, reveal } = play
    const start = performance.now()
    // When it started, on the page's clock: what a probe times its moments from.
    if (layer.current && !play.resting) layer.current.dataset.introStart = String(start)
    // The ripples, at once: the painter keeps each one's time from its landing, on its own clock.
    plan.parts.forEach((p, a) => {
      const r = ripples[a]
      if (r) done.current.pass(r.delays, r.span, performance.timeOrigin + start + p.lands, RIPPLE_LAYER)
    })
    const cutNow: string[] = []
    // Each box's fade, once it has started.
    const fades: (Animation | null)[] = found.map(() => null)
    let ended = play.resting
    const tick = () => {
      const t = performance.now() - start
      plan.parts.forEach((part, a) => {
        const { frame: af, m } = introAt(part, t)
        const [from, to] = af.frame.nests
        // The nest it leaves: its spot's as it goes to its box, and its box's as it dives home, going as it dives into it.
        place(nestFrom.current[a], from.x, from.y, from.lit * introNestLeft(part, t))
        place(nestTo.current[a], to.x, to.y, to.lit)
        // What it is cut to: the action's cut, if any — the nest it goes out of or comes into, or the bowl it pops up into.
        const d = !af.cut ? UNCUT : af.cut.by === "bowl" ? sphereBowl(af.cut.nest) : circlePath(af.cut.nest)
        if (cutNow[a] !== d) {
          cutNow[a] = d
          cuts.current[a]?.setAttribute("d", d)
        }
        const g = behind.current[a]
        if (g) {
          g.setAttribute("transform", `translate(${af.shift.x.toFixed(2)} ${af.shift.y.toFixed(2)})`)
          g.style.display = af.hidden ? "none" : ""
        }
        if (!af.hidden) painters.current[a]?.paint(af.frame, m)
      })
      // The boxes: each fading in once the agent that opens it is gone, from the moment it is due.
      found.forEach(({ el }, i) => {
        const since = t - plan.boxes[i]!
        if (fades[i] || since < 0) return
        el.style.opacity = "1"
        fades[i] = el.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: reveal, delay: -since, easing: REVEAL_EASE }) ?? null
      })
      // Every box in and every agent at rest in its cell: the page is the grid's. They go on resting.
      if (!ended && t >= plan.end) {
        ended = true
        done.current.onReveal(0)
        done.current.onDone()
      }
    }
    tick()
    if (!play.still) gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      // The boxes are the grid's again.
      fades.forEach((fade) => fade?.cancel())
      for (const { el } of found) el.style.opacity = ""
    }
  }, [play])

  if (!play) return <div ref={layer} data-slot="grid-intro" aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" />
  const { cell, gridW, gridH } = play.metrics
  return (
    // Over the page's boxes, on the field; a leap may rise past the field's top edge, so nothing is clipped.
    <div
      ref={layer}
      data-slot="grid-intro"
      data-intro-settled={play.resting ? "" : undefined}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-visible"
    >
      <svg className="absolute top-0 left-0 overflow-visible" style={{ width: gridW, height: gridH }} viewBox={`0 0 ${gridW} ${gridH}`}>
        <defs>
          {play.ids.map((_, a) => (
            <clipPath key={a} id={`${id}-cut-${a}`}>
              <path ref={(el) => void (cuts.current[a] = el)} d={UNCUT} />
            </clipPath>
          ))}
        </defs>
        {/* Each agent's two nests, the one it leaves and the one it goes to: its spot and its box's, then its box's and
            its cell's in the last column, where it rests. */}
        {play.ids.map((_, a) => (
          <React.Fragment key={a}>
            <g ref={(el) => void (nestFrom.current[a] = el)} style={{ opacity: 0 }} data-intro-nest="from">
              <circle r={cell / 2 - 0.5} fill="var(--muted)" stroke="var(--lime)" strokeWidth={1} />
            </g>
            <g ref={(el) => void (nestTo.current[a] = el)} style={{ opacity: 0 }} data-intro-nest="to">
              <circle r={cell / 2 - 0.5} fill="var(--muted)" stroke="var(--lime)" strokeWidth={1} />
            </g>
          </React.Fragment>
        ))}
        {/* Each agent, cut to the nest it goes through and moved behind the page by its shift; how it goes, when it
            lands and where it settles, for a probe. */}
        {play.plan.parts.map((part, a) => (
          <g
            key={a}
            clipPath={`url(#${id}-cut-${a})`}
            data-intro-agent={play.ids[a]}
            data-intro-travel={part.travel}
            data-intro-lands={play.resting ? undefined : Math.round(part.lands)}
            data-intro-home={`${part.home.col},${part.home.row}`}
          >
            <g ref={(el) => void (behind.current[a] = el)}>
              <Agent ref={(el) => void (painters.current[a] = el)} />
            </g>
          </g>
        ))}
      </svg>
    </div>
  )
}

/** A nest at its centre, as lit as it is. */
function place(el: SVGGElement | null | undefined, x: number, y: number, lit: number) {
  if (!el) return
  el.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`)
  el.style.opacity = String(Math.max(0, Math.min(1, lit)))
}
