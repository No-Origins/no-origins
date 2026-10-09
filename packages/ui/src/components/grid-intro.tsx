"use client"

import * as React from "react"
import gsap from "gsap"

import { Agent, type AgentPainter } from "@no-origins/ui/components/agent"
import type { GridMetrics } from "@no-origins/ui/components/grid"
import { sphereMotionOf } from "@no-origins/ui/lib/agent-body"
import {
  introActionValues,
  introActHere,
  introAt,
  introAway,
  introBeside,
  introCast,
  introComeHome,
  introGoHome,
  introGoIn,
  introHeld,
  introHome,
  introNest,
  introNestLeft,
  introPlan,
  introResting,
  introRestsAt,
  introRipple,
  introSpots,
  readIntroMotion,
  type IntroActionId,
  type IntroActions,
  type IntroAgent,
  type IntroBox,
  type IntroCell,
  type IntroMotion,
  type IntroMotions,
  type IntroPart,
  type IntroPlan,
  type IntroRole,
} from "@no-origins/ui/lib/intro-motion"
import { readSphereMotion, sphereBowl } from "@no-origins/ui/lib/sphere-motion"

/**
 * The intro, played (Grid.md D50, Motion.md M22): the page's agents standing in a row on the field's middle, in a
 * random order, those that bounce each at its own random times, then jumping or diving to the centre of the boxes they
 * open, a small ripple spreading round each as it lands, then diving home to their cells (`introHome`), and the boxes
 * each opens fading in once it is gone. `lib/intro-motion` is who goes where, by which action, and when;
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
 * go of them all at the end. Opacity only: a clip re-cut on the main thread stutters.
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
 * landing on the painter's own clock, so a busy main thread cannot hold them back.
 *
 * **One agent in focus** (`focus`): the page shows that agent's section alone, and the agent stays below it, centred
 * (`introBeside`; under it, held behind the page, where no cell round it is free). The intro ends with it there and the
 * rest at home; a new `focus` turns the page — the section on the field fades away over `out` while its agent dives
 * home, the page is told it may put the next section on the field (`onFocus`), and the next agent dives from home to
 * the cell below those boxes, its ripple spreading, and they fade in. While a page turns the grid carries
 * `data-intro-turn`, and globals.css holds back any box it has not shown. Each agent is drawn on a clock of its own
 * (`Live`), so one can turn while the rest go on resting. Resting, it finds the boxes too, to stand the one in focus
 * below them.
 */

/** How long it waits for the page's boxes before it plays without them. */
const BOXES_WAIT_MS = 600
/** A box fading in: the curve globals.css brings the page in by (`grid-intro-in`). */
const REVEAL_EASE = "cubic-bezier(0.33, 1, 0.68, 1)"
/** The painter's colour the ripples light in: violet, the pointer's lit cell's (D43). */
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
  /**
   * The agent in focus, by its id: its section is the page's boxes, and it is under it. A new one turns the page. None:
   * every agent opens its own boxes and they all go home.
   */
  focus?: string
  /** The field is clear for `focus`'s section: the page puts its boxes on the field now. */
  onFocus?: (agent: string) => void
  /**
   * Where the agent in focus stands, a cell of the field, 0-based: the page's to say, read as the intro plans and as
   * each page comes in. None, below its section (`introBeside`).
   */
  focusAt?: IntroCell
  /**
   * An action for an agent to play where it rests — a click on it, say: played each time `key` changes, once the intro
   * is over, when no page is turning and the agent is not in the air or under the page.
   */
  act?: { agent: string; action: IntroActionId; key: number }
}

/** A box of the page: its element, and where it is in cells. */
type Found = { el: HTMLElement; cells: IntroBox }

/** Each agent's part and the moment its clock started (`performance.now()`): what is drawn. */
type Live = { parts: IntroPart[]; zeros: number[] }

/** The page's boxes on the tracks, in cells from the field's first. */
function measureBoxes(tracks: HTMLElement, metrics: GridMetrics): Found[] {
  const pitch = metrics.cell + metrics.gap
  const at = tracks.getBoundingClientRect()
  return [...tracks.querySelectorAll<HTMLElement>(':scope > [data-slot="grid-item"]:not([data-intro-fixed])')].map((el) => {
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
}

/** Everything the play needs, made once the boxes are known. */
type Play = {
  /** The field it is planned on. */
  metrics: GridMetrics
  found: Found[]
  plan: IntroPlan
  ids: string[]
  /** The intro's numbers, each agent's motions and its cell at home: what a turn is planned from. */
  intro: IntroMotion
  motions: IntroMotions[]
  homes: IntroCell[]
  /** The agent in focus as it was planned: under its section, its boxes the page's. */
  focus?: string
  /** Each agent's ripple, none for one that opens nothing. */
  ripples: ({ delays: Float64Array; span: number } | null)[]
  /** How long the boxes take to fade in. */
  reveal: number
  /** Resting in their cells, with nothing to play: the boxes are the grid's, and nothing ends. */
  resting: boolean
  /** Resting under reduced motion: drawn once. */
  still: boolean
}

export function GridIntro({ metrics, root, agents, actions, settled = false, focus, onFocus, focusAt, act, pass, onReveal, onDone }: GridIntroProps) {
  const layer = React.useRef<HTMLDivElement>(null)
  // The page's boxes, and the field they were found on: what it plans on, so a field that changes plans nothing until
  // they are found on it.
  const [found, setFound] = React.useState<{ metrics: GridMetrics; boxes: Found[] } | null>(null)
  // A clip path is named in a url(), which React's ids (with their «» or colons) would break.
  const id = `grid-intro-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  // Read as it plans, never planned on: the grid letting go of the page as the intro ends must not start them over.
  const resting = React.useRef(settled)
  resting.current = settled
  // The focus as it is now, read as it plans.
  const focusNow = React.useRef(focus)
  focusNow.current = focus
  const focusAtNow = React.useRef(focusAt)
  focusAtNow.current = focusAt

  // The page's boxes, in cells from the field's first, once the page has put them on the field. Resting, none: the
  // boxes are the grid's.
  React.useLayoutEffect(() => {
    const tracks = root.querySelector<HTMLElement>('[data-slot="grid-tracks"]')
    if (resting.current) {
      // Resting, the boxes matter only to stand the one in focus below them: measured now, and again as the
      // page arranges itself on the new field, unless a page is turning.
      if (focusNow.current === undefined || !tracks) {
        setFound({ metrics, boxes: [] })
        return
      }
      const measure = () => {
        if (!root.hasAttribute("data-intro-turn")) setFound({ metrics, boxes: measureBoxes(tracks, metrics) })
      }
      measure()
      let frame = 0
      const watch = new MutationObserver(() => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(measure)
      })
      watch.observe(tracks, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] })
      const cap = window.setTimeout(() => watch.disconnect(), BOXES_WAIT_MS)
      return () => {
        watch.disconnect()
        cancelAnimationFrame(frame)
        window.clearTimeout(cap)
      }
    }
    if (!tracks) return
    const find = () => {
      const boxes = measureBoxes(tracks, metrics)
      if (!boxes.length) return false
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
    const intro = readIntroMotion(root)
    // The agent in focus, if the page names one the cast has.
    const focus = focusNow.current !== undefined && ids.includes(focusNow.current) ? focusNow.current : undefined
    const f = focus === undefined ? undefined : ids.indexOf(focus)
    const base = { metrics, ids, intro, motions, homes, focus }
    const boxes = found.boxes.map((b) => b.cells)
    // In focus, it stands where the page says, else below its section.
    const beside = f === undefined ? null : (focusAtNow.current ?? introBeside(boxes, cols, rows, homes))
    if (resting.current) {
      // Under reduced motion they are drawn once, still: their eyes open.
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      return { ...base, found: [], plan: introResting({ g, homes, motions, still, out: f, outAt: beside }), ripples: [], reveal: intro.reveal, resting: true, still }
    }
    // In focus, every box on the field is its section's, and it alone has a nest: below them, else their centre.
    const roles: IntroRole[] =
      f === undefined
        ? introCast(ids, boxes)
        : ids.map((_, a) => (a === f ? { nest: beside ?? introNest(boxes), boxes: boxes.map((_, i) => i) } : { nest: null, boxes: [] }))
    const spots = introSpots(roles.map((r) => r.nest), cols, rows)
    const bounces = ids.map((_, a) => cast?.[a]?.bounces ?? true)
    const plan = introPlan({ m: intro, g, roles, spots, homes, motions, boxes, bounces, focus: f, under: !beside })
    const ripples = plan.parts.map((p) => (p.ripple === false ? null : introRipple({ cols, rows, cell, gap }, p.nest, intro)))
    return { ...base, found: found.boxes, plan, ripples, reveal: intro.reveal, resting: false, still: false }
  }, [found, agents, actions, root])

  // The play, on GSAP's ticker.
  const painters = React.useRef<(AgentPainter | null)[]>([])
  const nestFrom = React.useRef<(SVGGElement | null)[]>([])
  const nestTo = React.useRef<(SVGGElement | null)[]>([])
  const cuts = React.useRef<(SVGPathElement | null)[]>([])
  const behind = React.useRef<(SVGGElement | null)[]>([])
  const done = React.useRef({ onReveal, onDone, pass, onFocus })
  done.current = { onReveal, onDone, pass, onFocus }
  // The agent whose section is on the field, and how the play turns the page to another: set by the play
  // while it can turn — once the intro is over and no page is turning (`idle`).
  const shown = React.useRef<string | undefined>(undefined)
  const turnTo = React.useRef<((agent: string) => void) | null>(null)
  // How the play has an agent do an action where it rests.
  const actHere = React.useRef<((agent: string, action: IntroActionId) => void) | null>(null)
  const [idle, setIdle] = React.useState(false)
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
    // Each agent on its own clock, every one from the start (a turn restarts two of them).
    const live: Live = { parts: [...plan.parts], zeros: plan.parts.map(() => start) }
    shown.current = play.focus
    // The page is told whose section the play takes as on the field. Where the play begins with a focus
    // the page asked for before it could turn — the intro skipped, under reduced motion or on a second mount, and a
    // turn asked before this chunk had loaded — the page would otherwise wait for a hand-over that never comes, and no
    // turn after it would go. Told the agent it already shows, the page changes nothing.
    if (play.focus !== undefined) done.current.onFocus?.(play.focus)
    const cutNow: string[] = []
    // Each box's fade, once it has started.
    const fades: (Animation | null)[] = found.map(() => null)
    let ended = play.resting
    const tracks = root.querySelector<HTMLElement>('[data-slot="grid-tracks"]')
    const g = { cell: play.metrics.cell, gap: play.metrics.gap }

    // A page turning: its section fading away, then the next one's boxes, each fading in from `at`.
    type Turn = {
      to: string
      phase: "out" | "in"
      leaving: Animation[]
      boxes: { el: HTMLElement; at: number; fade: Animation | null }[]
      /** When the next agent's boxes are in and the last one is home: the turn is over. */
      end: number
      timer?: number
      cap?: number
      watch?: MutationObserver
    }
    let turn: Turn | null = null
    const endTurn = () => {
      if (!turn) return
      window.clearTimeout(turn.timer)
      window.clearTimeout(turn.cap)
      turn.watch?.disconnect()
      turn.leaving.forEach((f) => f.cancel())
      turn.boxes.forEach(({ el, fade }) => {
        fade?.cancel()
        el.style.opacity = ""
      })
      delete root.dataset.introTurn
      // Cut short before the page was told: it is told now, so it is never left on the last section.
      if (turn.phase === "out") {
        shown.current = turn.to
        done.current.onFocus?.(turn.to)
      }
      turn = null
    }
    // The next agent's section is on the field: it dives in.
    const comeIn = (b: number) => {
      if (!turn || !tracks) return
      window.clearTimeout(turn.cap)
      turn.watch?.disconnect()
      const now = performance.now()
      const boxes = measureBoxes(tracks, play.metrics)
      const { cols, rows, cell, gap } = play.metrics
      const cells = boxes.map((x) => x.cells)
      // Below its section, else behind its centre.
      const beside = focusAtNow.current ?? introBeside(cells, cols, rows, play.homes)
      const nest = beside ?? introNest(cells) ?? play.homes[b]!
      const before = live.parts[b]!
      // Under reduced motion it is there at once, and so is its section.
      if (play.still) {
        live.parts[b] = introResting({ g, homes: [beside ?? play.homes[b]!], motions: [play.motions[b]!], still: true, out: beside ? undefined : 0 }).parts[0]!
        live.zeros[b] = now
        tick()
        endTurn()
        setIdle(true)
        return
      }
      const part = introGoIn({ m: play.intro, g, home: play.homes[b]!, nest, motions: play.motions[b]!, since: before.since + (now - live.zeros[b]!), under: !beside })
      live.parts[b] = part
      live.zeros[b] = now
      const r = introRipple({ cols, rows, cell, gap }, nest, play.intro)
      done.current.pass(r.delays, r.span, performance.timeOrigin + now + part.lands, RIPPLE_LAYER)
      turn.boxes = boxes.map(({ el }) => ({ el, at: now + part.gone, fade: null }))
      const homeAt = live.parts.reduce((most, p, a) => (introHeld(p, now - live.zeros[a]!) ? most : Math.max(most, live.zeros[a]! + p.settled)), 0)
      turn.end = Math.max(now + part.gone + reveal, homeAt)
    }
    turnTo.current = (agent) => {
      const a = shown.current === undefined ? -1 : play.ids.indexOf(shown.current)
      const b = play.ids.indexOf(agent)
      const now = performance.now()
      // The one in focus goes home: on from where it was held under its section, or by a Dive from below it.
      if (a >= 0) {
        const p = live.parts[a]!
        const home = play.homes[a]!
        if (play.still) {
          live.parts[a] = introResting({ g, homes: [home], motions: [play.motions[a]!], still: true }).parts[0]!
          live.zeros[a] = now
        } else if (p.hold !== undefined) {
          live.zeros[a] = now - p.hold
          live.parts[a] = introComeHome(p)
        } else {
          const at = introRestsAt(p)
          if (at.col !== home.col || at.row !== home.row) {
            live.parts[a] = introGoHome({ g, part: p, t: now - live.zeros[a]!, home, motions: play.motions[a]! })
            live.zeros[a] = now
          }
        }
      }
      // With no agent for it, the page is put on the field at once.
      if (b < 0 || !tracks) {
        shown.current = agent
        done.current.onFocus?.(agent)
        tick()
        setIdle(true)
        return
      }
      // Its section fades away, held back by globals.css from here on but for this fade — at once, under reduced motion.
      root.dataset.introTurn = ""
      const leaving = play.still
        ? []
        : [...tracks.querySelectorAll<HTMLElement>(':scope > [data-slot="grid-item"]:not([data-intro-fixed])')].map((el) => {
            el.style.opacity = "0"
            return el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: play.intro.out, easing: REVEAL_EASE })
          })
      if (play.still) tick()
      turn = { to: agent, phase: "out", leaving, boxes: [], end: Infinity }
      // Then the page puts the next section on the field, and its agent dives in once its boxes are there.
      turn.timer = window.setTimeout(() => {
        if (!turn) return
        turn.phase = "in"
        turn.watch = new MutationObserver(() => {
          if (tracks.querySelector(':scope > [data-slot="grid-item"]:not([data-intro-fixed])')) comeIn(b)
        })
        turn.watch.observe(tracks, { childList: true })
        turn.cap = window.setTimeout(() => comeIn(b), BOXES_WAIT_MS)
        shown.current = agent
        done.current.onFocus?.(agent)
      }, play.still ? 0 : play.intro.out)
    }
    actHere.current = (agent, action) => {
      const a = play.ids.indexOf(agent)
      if (!ended || turn || a < 0 || play.still) return
      const now = performance.now()
      const part = live.parts[a]!
      const t = now - live.zeros[a]!
      if (introAway(part, t)) return
      live.parts[a] = introActHere({ g, part, t, action, motions: play.motions[a]! })
      live.zeros[a] = now
    }
    const tick = () => {
      const now = performance.now()
      const t = now - start
      live.parts.forEach((part, a) => {
        const ta = now - live.zeros[a]!
        const { frame: af, m } = introAt(part, ta)
        const [from, to] = af.frame.nests
        // Held under its section: nothing of it, nor of its nests.
        const held = introHeld(part, ta)
        // The nest it leaves: its spot's as it goes to its box, and its box's as it dives home, going as it dives into it.
        place(nestFrom.current[a], from.x, from.y, held ? 0 : from.lit * introNestLeft(part, ta))
        place(nestTo.current[a], to.x, to.y, held ? 0 : to.lit)
        // What it is cut to: the action's cut, if any — the nest it goes out of or comes into, or the bowl it pops up into.
        const d = !af.cut ? UNCUT : af.cut.by === "bowl" ? sphereBowl(af.cut.nest) : circlePath(af.cut.nest)
        if (cutNow[a] !== d) {
          cutNow[a] = d
          cuts.current[a]?.setAttribute("d", d)
        }
        const hidden = af.hidden || held
        const el = behind.current[a]
        if (el) {
          el.setAttribute("transform", `translate(${af.shift.x.toFixed(2)} ${af.shift.y.toFixed(2)})`)
          el.style.display = hidden ? "none" : ""
        }
        if (!hidden) painters.current[a]?.paint(af.frame, m)
      })
      // A page turning: the next section's boxes, each fading in from its moment, and the end.
      if (turn) {
        for (const box of turn.boxes) {
          const since = now - box.at
          if (box.fade || since < 0) continue
          box.el.style.opacity = "1"
          box.fade = box.el.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: reveal, delay: -since, easing: REVEAL_EASE }) ?? null
        }
        if (now >= turn.end) {
          endTurn()
          setIdle(true)
        }
      }
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
        setIdle(true)
      }
    }
    tick()
    if (!play.still) gsap.ticker.add(tick)
    if (ended) setIdle(true)
    return () => {
      gsap.ticker.remove(tick)
      turnTo.current = null
      actHere.current = null
      endTurn()
      setIdle(false)
      // The boxes are the grid's again.
      fades.forEach((fade) => fade?.cancel())
      for (const { el } of found) el.style.opacity = ""
    }
  }, [play, root])

  // An action where it rests, each time the page asks again.
  const actNow = React.useRef(act)
  actNow.current = act
  const actKey = act?.key
  React.useEffect(() => {
    const ask = actNow.current
    if (actKey !== undefined && ask) actHere.current?.(ask.agent, ask.action)
  }, [actKey])

  // The page turns: once the play can, whenever the focus is not the agent whose section is on the field.
  React.useLayoutEffect(() => {
    if (!idle || focus === undefined || focus === shown.current || !turnTo.current) return
    setIdle(false)
    turnTo.current(focus)
  }, [idle, focus])

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
