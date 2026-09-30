"use client"

import * as React from "react"

import {
  GRIP_REST,
  GRIP_RING,
  gripAt,
  gripFrame,
  gripTotal,
  paintGrip,
  readGripMotion,
  type GripMotion,
  type GripState,
} from "@no-origins/ui/lib/grip-motion"
import { springAt, springSettled, type SpringState } from "@no-origins/ui/lib/spring"
import {
  markLit,
  paintMark,
  readStepMotion,
  stepHaptic,
  stepPopAt,
  stepPopSettled,
  zoneOf,
  type StepMotion,
} from "@no-origins/ui/lib/step-motion"

type Edge = "left" | "right" | "top" | "bottom"

type Run = { index: number; held: boolean; from: GripState; t0: number; motion: GripMotion }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Plays the grip (Motion.md M16) on a slider: `hold` when the pointer takes a head, `move` as it goes, `letGo` when it is
 * released, `retarget` when radix hands the held value to another head — and the body's follow, for every head,
 * whenever its value moves, by the hand or the keyboard. One frame loop, running while a head is held, a let go is
 * under way or the body has not caught its head, reading the motion off the track when each starts (so the studio's
 * stage retunes it) and painting `gripFrame` straight onto the head and the track — no render. A move of the value is
 * caught in a layout effect, so the body's meeting point is painted where it was before the browser shows the head in
 * its new place. The follow is kept as a share of the bar's length, so a resize between two moves does not throw it.
 * While held the head is at the cursor, held to the bar: along it the head stays on the bar, and across it follows the
 * cursor anywhere over the bar or the ring round it, so pressed on the bar it sits in the ring. Under reduced motion
 * nothing takes any time; the head still follows the hand.
 *
 * A slider with `marks` plays its steps on the same loop (Motion.md M21): `land` pops the marks the value has just
 * landed on and kicks the heads that took it there, with a vibration where the device has one; and every frame the body
 * moves, each mark is lit where the value is (the slider's render, `data-lit`) or as far as the lime still reaches it.
 * At rest the marks are the slider's own render again. **The zone**: while a head is held, `move` finds the mark whose
 * zone the cursor is in, hands it to `onSnap` so the slider takes the mark's value, ticks it, and the head goes under
 * it on the snap spring; `snapped` tells the slider which mark holds the value, so a value radix reckons from the
 * pointer does not move it off the mark, nor onto one it has not snapped to. With a zone, a value landing is no tick.
 */
export function useGripMotion({
  track,
  vertical,
  start,
  values,
  marks = false,
  onSnap,
}: {
  track: React.RefObject<HTMLElement | null>
  vertical: boolean
  /** The edge radix slides the heads from, so a move along the bar is measured the way the segments are. */
  start: Edge
  /** The heads' values, joined: a change sets the body following. */
  values: string
  /** Whether the slider draws its steps' marks (`data-slot="slider-mark"`, each its share of the travel in `data-at`). */
  marks?: boolean
  /** A held head has snapped under mark `mark` (by index): the slider gives head `index` that mark's value. */
  onSnap?: (index: number, mark: number) => void
}) {
  const state = React.useRef<GripState>(GRIP_REST)
  const run = React.useRef<Run | null>(null)
  const pointer = React.useRef<{ x: number; y: number } | null>(null)
  // Where each head's body meets, as a share of the bar from the start edge, with its velocity and when it was stepped.
  const flows = React.useRef<(SpringState & { t: number })[]>([])
  const painted = React.useRef(new Set<number>())
  // Whether `flows` were measured from heads radix had placed.
  const measured = React.useRef(false)
  const motion = React.useRef<GripMotion | null>(null)
  const steps = React.useRef<StepMotion | null>(null)
  // When each mark's tick set off, by its index, and each head's kick, by its.
  const pops = React.useRef(new Map<number, number>())
  const kicks = React.useRef(new Map<number, number>())
  // The zone: the mark the held head is snapped under, by index (null in none), whether the press has not moved yet,
  // and the spring the head goes under it on — how far it is from the cursor along the bar, px.
  const zoned = React.useRef<number | null>(null)
  const pressing = React.useRef(false)
  const snap = React.useRef<SpringState & { t: number }>({ x: 0, v: 0, t: 0 })
  const snapTo = React.useRef(onSnap)
  React.useLayoutEffect(() => void (snapTo.current = onSnap))
  const frame = React.useRef(0)
  // Whether the loop is running: a spring at rest keeps the time it came to rest, so waking takes up the clock again.
  const running = React.useRef(false)

  const readSteps = React.useCallback((el: Element) => {
    const s = readStepMotion(el)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      s.pop = 1
      s.popIn = 0
      s.snap = 0
    }
    steps.current = s
    return s
  }, [])

  const read = React.useCallback(() => {
    const el = track.current
    if (!el) return null
    const m = readGripMotion(el)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      m.in = 0
      m.out = 0
      m.follow = { ...m.follow, response: 0 }
    }
    motion.current = m
    readSteps(el)
    return m
  }, [track, readSteps])

  const heads = React.useCallback(
    () => [...(track.current?.parentElement?.querySelectorAll<HTMLElement>('[data-slot="slider-thumb"]') ?? [])],
    [track]
  )

  /** The marks' places along the bar, px from the start edge. */
  const places = React.useCallback(
    (box: DOMRect) => {
      const el = track.current
      if (!el) return []
      const length = (vertical ? box.height : box.width) || 1
      const head = parseFloat(getComputedStyle(el).getPropertyValue("--slider-head")) || 24
      return [...el.querySelectorAll<HTMLElement>('[data-slot="slider-mark"]')].map((d) => Number(d.dataset.at) * (length - head) + head / 2)
    },
    [track, vertical]
  )

  /** A box's centre along the bar from the start edge, and the bar's length. */
  const along = React.useCallback(
    (bar: DOMRect, r: DOMRect) => {
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      return start === "left" ? cx - bar.left : start === "right" ? bar.right - cx : start === "top" ? cy - bar.top : bar.bottom - cy
    },
    [start]
  )

  const tick = React.useCallback(() => {
    const el = track.current
    const m = motion.current ?? read()
    if (!el || !m) return
    const now = performance.now()
    if (!running.current) flows.current.forEach((f) => (f.t = now))
    running.current = true
    const box = el.getBoundingClientRect()
    const length = (vertical ? box.height : box.width) || 1
    const style = getComputedStyle(el)
    const bar = parseFloat(style.getPropertyValue("--slider-bar")) || 24
    const gap = parseFloat(style.getPropertyValue("--slider-gap")) || 0
    const shape = { bar, gap, size: clamp(m.size, 0, GRIP_RING - 4) }

    const r = run.current
    if (r) state.current = gripAt(r.motion, r.from, r.held, now - r.t0)
    if (r && !r.held && now - r.t0 >= gripTotal(r.motion, false)) {
      run.current = null
      state.current = GRIP_REST
    }
    let still = !run.current

    heads().forEach((head, i) => {
      const slot = (head.parentElement ?? head).getBoundingClientRect()
      const rest = along(box, slot)
      const mine = run.current?.index === i
      const s = mine ? state.current : GRIP_REST
      let offset = { x: 0, y: 0, along: 0 }
      if (mine) {
        const cx = slot.left + slot.width / 2
        const cy = slot.top + slot.height / 2
        const p = pointer.current ?? { x: cx, y: cy }
        const half = shape.size / 2
        // Across the bar the head may go as far as the ring round it reaches.
        const reach = Math.max(bar, GRIP_RING) / 2
        const mid = vertical ? box.left + box.width / 2 : box.top + box.height / 2
        const px = vertical ? clamp(p.x, mid - reach, mid + reach) : clamp(p.x, box.left + half, box.right - half)
        const py = vertical ? clamp(p.y, box.top + half, box.bottom - half) : clamp(p.y, mid - reach, mid + reach)
        let x = px - cx
        let y = py - cy
        const cursor = start === "left" ? x : start === "right" ? -x : start === "top" ? y : -y
        // In a mark's zone the head goes under the mark, on the snap spring; out of every zone, back to the cursor.
        const mark = zoned.current !== null ? places(box)[zoned.current] : undefined
        const aim = mark !== undefined && s.head > 0 ? mark - (rest + cursor) : 0
        const sn = springAt(snap.current, aim, now - snap.current.t, { response: steps.current?.snap ?? 0, bounce: 0 })
        snap.current = { ...sn, t: now }
        if (!springSettled(sn, aim, 0.05)) still = false
        const pull = sn.x
        if (vertical) y += start === "top" ? pull : -pull
        else x += start === "left" ? pull : -pull
        offset = { x, y, along: cursor + pull }
      }
      // The body chases the head: where it is along the bar, as a share of the bar.
      const target = (rest + offset.along * s.head) / length
      const f = flows.current[i] ?? { x: target, v: 0, t: now }
      const next = springAt(f, target, now - f.t, m.follow)
      flows.current[i] = { ...next, t: now }
      const caught = springSettled(next, target, 0.05 / length)
      if (!caught) still = false
      // A tick's kick, on the same curve as the mark's pop.
      const k0 = kicks.current.get(i)
      const sm = steps.current
      let kick = 1
      if (k0 !== undefined && sm) {
        if (stepPopSettled(sm, now - k0)) kicks.current.delete(i)
        else kick = stepPopAt(sm, now - k0, sm.kick)
      }
      if (kick !== 1) still = false
      if (!mine && caught && kick === 1) {
        if (painted.current.has(i)) paintGrip(el, head, i, null)
        painted.current.delete(i)
        return
      }
      const flow = { x: next.x * length - rest, v: next.v * length }
      const f0 = gripFrame(s, shape, offset, m, flow)
      // In the cursor the kick stops at the ring's inside.
      const room = s.head > 0 ? Math.max(f0.scale, (GRIP_RING - 4) / bar) : Infinity
      paintGrip(el, head, i, { ...f0, scale: Math.min(room, f0.scale * kick) })
      painted.current.add(i)
    })

    // The marks: lit as far as the body's lime reaches, and each tick's pop.
    const dots = marks ? [...(el.parentElement?.querySelectorAll<HTMLElement>('[data-slot="slider-mark"]') ?? [])] : []
    const sm = steps.current
    if (dots.length && sm) {
      const ends = flows.current.map((f) => f.x * length).sort((a, b) => a - b)
      const from = ends.length > 1 ? ends[0]! : -Infinity
      const to = ends[ends.length - 1] ?? -Infinity
      const head = parseFloat(style.getPropertyValue("--slider-head")) || bar
      const size = parseFloat(style.getPropertyValue("--slider-mark")) || 6
      const frames = dots.map((dot, k) => {
        const at = Number(dot.dataset.at) * (length - head) + head / 2
        const t0 = pops.current.get(k)
        let scale = 1
        if (t0 !== undefined) {
          if (stepPopSettled(sm, now - t0)) pops.current.delete(k)
          else scale = stepPopAt(sm, now - t0)
        }
        return { lit: dot.dataset.lit !== undefined ? 1 : markLit(at, size, from, to), scale }
      })
      if (pops.current.size) still = false
      // At rest the slider's own render is right: the lime is at the values.
      dots.forEach((dot, k) => paintMark(dot, still && !run.current?.held ? null : frames[k]!))
    }

    cancelAnimationFrame(frame.current)
    if (!still || run.current?.held) frame.current = requestAnimationFrame(tick)
    else running.current = false
  }, [track, read, heads, along, places, vertical, start, marks])

  // A move of the value: the body sets off after the head. The first render only learns where the heads are.
  React.useLayoutEffect(() => {
    const el = track.current
    if (!el) return
    // Radix hides a head on its first render, until it knows its index, so a head measured then is at the start edge
    // with no size: measure until every head has one, or the first move would pour the lime in from the start.
    if (!measured.current || flows.current.length !== heads().length) {
      const measure = () => {
        const box = el.getBoundingClientRect()
        const length = (vertical ? box.height : box.width) || 1
        const now = performance.now()
        const all = heads()
        flows.current = all.map((h) => ({ x: along(box, (h.parentElement ?? h).getBoundingClientRect()) / length, v: 0, t: now }))
        measured.current = all.every((h) => h.getBoundingClientRect().width > 0)
      }
      measure()
      if (measured.current) return
      const id = requestAnimationFrame(() => void (!running.current && measure()))
      return () => cancelAnimationFrame(id)
    }
    if (!run.current) read()
    tick()
  }, [values, track, heads, along, vertical, read, tick])

  /** A tick: these marks, by index, pop, these heads kick, and the hand feels it once. */
  const feel = React.useCallback(
    (landed: number[], moved: number[]) => {
      const sm = steps.current
      if (!sm) return
      stepHaptic(sm)
      if (sm.pop <= 1) return
      const now = performance.now()
      landed.forEach((k) => pops.current.set(k, now))
      if (sm.kick > 1) moved.forEach((i) => kicks.current.set(i, now))
      tick()
    },
    [tick]
  )

  /** Whether the held head's cursor is in a mark's zone: if it has come into one, snap to it and tick. */
  const zone = React.useCallback(() => {
    const el = track.current
    const r = run.current
    const p = pointer.current
    if (!marks || !el || !r?.held || !p || !steps.current?.zone) return
    const box = el.getBoundingClientRect()
    const inside = zoneOf(along(box, { left: p.x, top: p.y, width: 0, height: 0 } as DOMRect), places(box), steps.current.zone)
    if (inside === zoned.current) return
    zoned.current = inside
    if (inside === null) return
    snapTo.current?.(r.index, inside)
    feel([inside], [r.index])
  }, [marks, track, along, places, feel])

  const hold = React.useCallback(
    (index: number, event: { clientX: number; clientY: number }) => {
      const m = read()
      const el = track.current
      if (!m || !el) return
      pointer.current = { x: event.clientX, y: event.clientY }
      const prev = run.current
      if (prev && prev.index !== index) state.current = GRIP_REST
      const now = performance.now()
      run.current = { index, held: true, from: state.current, t0: now, motion: m }
      // The mark the head is on as it is taken, so pressing it is no tick, and pressing another's zone is.
      snap.current = { x: 0, v: 0, t: now }
      const head = heads()[index]
      const box = el.getBoundingClientRect()
      const at = head ? along(box, (head.parentElement ?? head).getBoundingClientRect()) : NaN
      const on = places(box).findIndex((p) => Math.abs(p - at) < 1)
      zoned.current = on >= 0 ? on : null
      pressing.current = true
      zone()
      tick()
    },
    [read, tick, track, heads, along, places, zone]
  )

  const move = React.useCallback(
    (event: { clientX: number; clientY: number }) => {
      if (!run.current?.held) return
      pointer.current = { x: event.clientX, y: event.clientY }
      pressing.current = false
      zone()
    },
    [zone]
  )

  const letGo = React.useCallback(() => {
    const r = run.current
    const m = read()
    if (!r?.held || !m) return
    run.current = { ...r, held: false, from: state.current, t0: performance.now(), motion: m }
    zoned.current = null
    pressing.current = false
    tick()
  }, [read, tick])

  /**
   * The value has just landed on these marks, by index, moved by these heads: a tick — unless a head is held with a
   * zone, where the snap is the tick.
   */
  const land = React.useCallback(
    (landed: number[], moved: number[]) => {
      if (!marks || !landed.length) return
      if (!run.current) read()
      else if (track.current) readSteps(track.current)
      if (run.current?.held && steps.current?.zone) return
      feel(landed, moved)
    },
    [marks, read, readSteps, track, feel]
  )

  /**
   * Which mark holds the held head's value: `{ index, mark }`, the mark null out of every zone — where the value may not
   * land on a mark — or null when no head is held with a zone, or the press has not moved yet and radix's value stands.
   */
  const snapped = React.useCallback((): { index: number; mark: number | null } | null => {
    const r = run.current
    if (!marks || !r?.held || !steps.current?.zone) return null
    if (pressing.current && zoned.current === null) return null
    return { index: r.index, mark: zoned.current }
  }, [marks])

  const retarget = React.useCallback((index: number) => {
    const r = run.current
    if (r && r.index !== index) r.index = index
  }, [])

  React.useEffect(() => () => cancelAnimationFrame(frame.current), [])

  return { hold, move, letGo, retarget, land, snapped }
}
