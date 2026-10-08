/**
 * How one-cell elements move on the grid when one of them grows (Motion.md M9): the portfolio's tech column and the
 * numbered pager bar, where the active element expands and the others move along to make room.
 *
 * Pure, but for reading the tokens (`readCellMotion`): a frame is a function of where each element was, where it is
 * going, the motion's numbers and the time since it started. `useCellMotion` (`hooks/use-cell-motion.ts`) plays it: the
 * motion studio with the numbers on a jig, a component — the portfolio's tech column — with the tokens it reads off
 * itself. Positions are px from the top-left of the block's first cell.
 *
 * The elements FLOW onto a block of cells, along rows or down columns, `line` cells to a line; the active one spans two
 * cells along the flow — or as many as its caller asks, a name's worth — and one that no longer fits its line wraps to
 * the next. An element is a RING — its box, one cell or a pill of several — and a DOT, its icon, on the element's first
 * cell.
 *
 * **Only the dot travels.** A ring is a cell and never slides: one that changes cells lights on its new cells in the
 * first half of the move and goes out on its old ones in the second, so a cell that hands over and takes over at once
 * never dips; a ring that only grows or shrinks — one edge changing — glides that edge. **Only the active ring wears
 * the accent**, and it comes and goes on the ring's own curve.
 *
 * The dot's size is a function of where it is on the grid, not of the clock: whole at a cell's centre, smallest on the
 * gutter between two cells, so a dot moving one cell shrinks into the border and grows out of it, and a move
 * interrupted half way still reads right. **A dot is seen only on the cell it leaves and the cell it reaches**: a dot
 * going further than a cell drowns once, leaving, and floats up once, arriving, and is not drawn over the cells between
 * (`travelScale`). A dot that has to change lines goes by the motion's `wrap`.
 */

import { easing, motionEase, motionMs, motionNumber } from "@no-origins/ui/lib/motion"

export type CellAxis = "row" | "column"

/** How elements fill the block: along rows, a full row wrapping to the next, or down columns; `line` cells to a line. */
export type CellFlow = { axis: CellAxis; line: number }

/**
 * How a dot that changes lines gets there. `overflow`: it carries on along its line, out past the line's end, and comes
 * in at the next line's start — or the other way, going back. `travel`: straight across to its new cell. `fade`: it
 * shrinks away where it is and grows in its new cell. A dot that stays on its line travels along it whichever.
 */
export type CellWrap = "overflow" | "travel" | "fade"
export const CELL_WRAPS: readonly CellWrap[] = ["overflow", "travel", "fade"]

export type CellMotion = {
  /** One element's move, in ms. */
  duration: number
  /** Between one element and the next, in ms: positive from the one that grew outward, negative from the far end in. */
  stagger: number
  /** The curve a ring's edge glides on and a cell lights and goes out on. */
  ringEase: (t: number) => number
  dotEase: (t: number) => number
  /** The dot against the cells, as a share of the move, −1..1: positive and it sets off after them, negative before. */
  lag: number
  /** The dot's scale at a border, 0..1 — 0 and it vanishes crossing it. */
  dotMin: number
  /** How far from the centre towards the border it starts to shrink, as a share of the way, 0..1. */
  dotFrom: number
  wrap: CellWrap
}

/**
 * The movement tokens off `el` (globals.css, his pick of 2026-09-27), read when a move starts — never cached, so a
 * subtree that overrides them, the motion studio's stage, moves by its own. The fallbacks are globals.css's values.
 */
export function readCellMotion(el: Element): CellMotion {
  const wrap = getComputedStyle(el).getPropertyValue("--motion-move-wrap").trim() as CellWrap
  return {
    duration: motionMs(el, "--motion-move-duration", 400),
    stagger: motionMs(el, "--motion-move-stagger", 20, true),
    ringEase: motionEase(el, "--motion-move-ring-ease"),
    dotEase: motionEase(el, "--motion-move-dot-ease"),
    lag: motionNumber(el, "--motion-move-dot-lag", -0.1),
    dotMin: motionNumber(el, "--motion-move-dot-min", 0),
    dotFrom: motionNumber(el, "--motion-move-dot-from", 0),
    wrap: CELL_WRAPS.includes(wrap) ? wrap : "overflow",
  }
}

/** Where an element sits in the flow: the cell it starts on, counted in flow order from 0, and the cells it spans. */
export type CellSpot = { at: number; span: number; lit?: number }

/**
 * An element's state in px: its ring's box, how lit it is (0..1), and its dot — at `u` cells along the flow (the order
 * the cells fill in, fractional while it travels) and at x, y.
 */
export type CellState = { l: number; t: number; r: number; b: number; lit: number; u: number; x: number; y: number }

/**
 * One element's move, and where it falls in the order: 0 moves first. `shown`: its dot was drawn where the move starts —
 * false for one caught between cells, which stays unseen until the cell it reaches.
 */
export type CellMove = { from: CellState; to: CellState; order: number; shown: boolean }

/** One element at one moment: its ring, the ring on the cells it is leaving, and its dot's scale. */
export type CellFrame = CellState & {
  opacity: number
  ghost: { l: number; t: number; r: number; b: number; opacity: number; lit: number } | null
  scale: number
}

/**
 * The spots `count` elements take with `active` grown: in flow order, each on the next free cell, the active one `grow`
 * cells long (two unless asked, never more than a line); an element that would run past its line's end starts the next
 * line, leaving the rest of its line empty. A line one cell long has no room to grow, so nothing does.
 */
export function flowSpots(count: number, active: number | null, line: number, grow = 2): CellSpot[] {
  const spots: CellSpot[] = []
  let cursor = 0
  for (let i = 0; i < count; i++) {
    const span = i === active && line >= 2 ? Math.max(1, Math.min(grow, line)) : 1
    const pos = cursor % line
    if (pos + span > line) cursor += line - pos
    spots.push({ at: cursor, span, lit: i === active ? 1 : 0 })
    cursor += span
  }
  return spots
}

/** The px centre of the cell `pos` along its line, on line `lineIndex`. */
function centreOf(pos: number, lineIndex: number, flow: CellFlow, pitch: number, cell: number) {
  const along = pos * pitch + cell / 2
  const across = lineIndex * pitch + cell / 2
  return flow.axis === "row" ? { x: along, y: across } : { x: across, y: along }
}

/** A spot as a state: its ring's box along the flow, and its dot on the first cell. */
export function stateOf(spot: CellSpot, flow: CellFlow, cell: number, gap: number): CellState {
  const pitch = cell + gap
  const lineIndex = Math.floor(spot.at / flow.line)
  const pos = spot.at - lineIndex * flow.line
  const start = pos * pitch
  const end = start + spot.span * cell + (spot.span - 1) * gap
  const top = lineIndex * pitch
  const [l, r, t, b] = flow.axis === "row" ? [start, end, top, top + cell] : [top, top + cell, start, end]
  const { x, y } = centreOf(pos, lineIndex, flow, pitch, cell)
  return { l, t, r, b, lit: spot.lit ?? 0, u: spot.at, x, y }
}

/**
 * Where a dot `u` cells along the flow is drawn when it overflows: on the line that holds it, the change of line
 * falling on the gutter after a line's last cell — so the dot leaves one line at its end border and enters the next at
 * its start border.
 */
function overflowAt(u: number, flow: CellFlow, pitch: number, cell: number) {
  const lineIndex = Math.floor((u + 0.5) / flow.line)
  return centreOf(u - lineIndex * flow.line, lineIndex, flow, pitch, cell)
}

const clamp01 = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Progress through a window [a, b] of a move that is at `t`. */
const within = (t: number, a: number, b: number) => (b <= a ? (t >= b ? 1 : 0) : clamp01((t - a) / (b - a)))
const same = (a: number, b: number) => Math.abs(a - b) < 0.01
const moves = (m: CellMove) =>
  !same(m.from.l, m.to.l) || !same(m.from.r, m.to.r) || !same(m.from.t, m.to.t) || !same(m.from.b, m.to.b) ||
  !same(m.from.x, m.to.x) || !same(m.from.y, m.to.y) || !same(m.from.lit, m.to.lit)

/** When an element starts, in ms from the start of the whole motion. */
function startOf(motion: CellMotion, move: CellMove, last: number) {
  const step = Math.abs(motion.stagger)
  return (motion.stagger >= 0 ? move.order : last - move.order) * step
}

/**
 * The move from `from` to `to`, ordered outward from `anchor` — the element that grew or shrank: it and its neighbour
 * first, then one further each. An element with no `from` (the block just grew) starts where it is going. `from` may be
 * the frames last drawn, a move turned round part way: a dot they drew at no size is not shown again until it arrives.
 */
export function cellMoves(from: readonly (CellState & { scale?: number })[], to: readonly CellState[], anchor: number): CellMove[] {
  return to.map((state, i) => ({
    from: from[i] ?? state,
    to: state,
    order: Math.max(0, Math.abs(i - anchor) - 1),
    shown: (from[i]?.scale ?? 1) > 0,
  }))
}

/** Every element at rest where `states` puts it. */
export function settledFrames(states: readonly CellState[]): CellFrame[] {
  return states.map((s) => ({ ...s, opacity: 1, ghost: null, scale: 1 }))
}

/** How long the whole motion takes, in ms: the last element to move, and its move. */
export function cellMotionTotal(motion: CellMotion, list: readonly CellMove[]): number {
  const moving = list.filter(moves)
  if (!moving.length) return 0
  const last = Math.max(...moving.map((m) => m.order))
  return Math.max(...moving.map((m) => startOf(motion, m, last))) + motion.duration
}

/**
 * The dot's scale at x, y px: 1 at a cell's centre, `min` on the middle of a gutter — the nearer border either way
 * counts, since cells are square — shrinking from `from` of the way there on a smoothstep, so it eases into the border
 * and out of it.
 */
export function dotScale(x: number, y: number, pitch: number, cell: number, min: number, from: number): number {
  const off = (v: number) => {
    const k = Math.round((v - cell / 2) / pitch)
    return clamp01(Math.abs(v - (k * pitch + cell / 2)) / (pitch / 2))
  }
  const d = Math.max(off(x), off(y))
  const start = Math.min(from, 0.999)
  if (d <= start) return 1
  const v = (d - start) / (1 - start)
  return 1 - (1 - min) * v * v * (3 - 2 * v)
}

type Point = { x: number; y: number }

/**
 * A travelling dot's scale at x, y px, on its way from `a` to `b` (px, where it set off and where it is going): its
 * `dotScale` while it is on the cell it set off from or on the cell it is going to, and nothing on any cell between —
 * once it has drowned leaving its cell it is not seen until it floats up in the one it reaches. A cell is the one
 * nearest, either way, so the change from one to the next falls on the middle of the gutter, where at his `dot-min` of 0
 * the dot is already gone; with a `dot-min` above 0 it goes out there and comes back at the far side. `shown` false: it
 * set off unseen, between cells, and is seen only in the cell it reaches. Loading's rings travel by this too (M10).
 */
export function travelScale(x: number, y: number, a: Point, b: Point, pitch: number, cell: number, min: number, from: number, shown = true): number {
  const at = (v: number) => Math.round((v - cell / 2) / pitch)
  const on = (p: Point) => at(p.x) === at(x) && at(p.y) === at(y)
  return (shown && on(a)) || on(b) ? dotScale(x, y, pitch, cell, min, from) : 0
}

/** Every element at `elapsed` ms into the motion, on a block that flows as `flow`. */
export function cellMotionFrame(
  motion: CellMotion,
  list: readonly CellMove[],
  flow: CellFlow,
  elapsed: number,
  cell: number,
  gap: number,
): CellFrame[] {
  const pitch = cell + gap
  const last = Math.max(0, ...list.filter(moves).map((m) => m.order))
  // The ring's and the dot's windows within one element's move: whichever lags starts late and the other ends early.
  const lag = Math.max(-1, Math.min(1, motion.lag))
  const ringWin: [number, number] = lag >= 0 ? [0, 1 - lag] : [-lag, 1]
  const dotWin: [number, number] = lag >= 0 ? [lag, 1] : [0, 1 + lag]
  const lineOf = (u: number) => Math.floor((u + 0.5) / flow.line)

  return list.map((move) => {
    const { from, to } = move
    const t = motion.duration > 0 ? clamp01((elapsed - startOf(motion, move, last)) / motion.duration) : 1
    const [a, b] = ringWin
    const ring = motion.ringEase(within(t, a, b))
    const lit = lerp(from.lit, to.lit, ring)

    // One edge changing is a ring growing or shrinking, which glides. More than one is a ring changing cells, which
    // hands over: its new cells light in the first half and its old ones go out in the second.
    const changed = [!same(from.l, to.l), !same(from.r, to.r), !same(from.t, to.t), !same(from.b, to.b)].filter(Boolean).length
    let box = { l: to.l, t: to.t, r: to.r, b: to.b }
    let opacity = 1
    let ghost: CellFrame["ghost"] = null
    if (changed === 1) {
      box = { l: lerp(from.l, to.l, ring), t: lerp(from.t, to.t, ring), r: lerp(from.r, to.r, ring), b: lerp(from.b, to.b, ring) }
    } else if (changed > 1) {
      const mid = (a + b) / 2
      opacity = motion.ringEase(within(t, a, mid))
      const out = 1 - motion.ringEase(within(t, mid, b))
      ghost = out > 0 ? { l: from.l, t: from.t, r: from.r, b: from.b, opacity: out, lit: from.lit } : null
    }

    const p = motion.dotEase(within(t, dotWin[0], dotWin[1]))
    const u = lerp(from.u, to.u, p)
    let dot: { x: number; y: number }
    let fade = 1
    if (lineOf(from.u) === lineOf(to.u) || motion.wrap === "travel") {
      dot = { x: lerp(from.x, to.x, p), y: lerp(from.y, to.y, p) }
    } else if (motion.wrap === "overflow") {
      dot = overflowAt(u, flow, pitch, cell)
    } else {
      // Fade: gone by half way where it was, back from half way where it goes.
      dot = p < 0.5 ? { x: from.x, y: from.y } : { x: to.x, y: to.y }
      fade = p < 0.5 ? 1 - p * 2 : p * 2 - 1
    }
    // One caught between cells grows in on its way as well, so it cannot appear whole on a cell it is already over.
    const scale = travelScale(dot.x, dot.y, from, to, pitch, cell, motion.dotMin, motion.dotFrom, move.shown) * (move.shown ? 1 : clamp01(p))
    return { ...box, lit, opacity, ghost, u, ...dot, scale: fade * scale }
  })
}

// ── enter and exit, movement's first primitive (Motion.md M11) ─────────────────────────────────────────────────────

/*
 * His, 2026-09-27: "in movement of motion when there is only one cell I would want to play with enter and exit so maybe
 * we can make that as first primitive of movement". One cell has nowhere to move to, so what is left is its element
 * arriving and leaving: its ring lighting on the cell and its dot floating up into it, then the dot drowning out of it
 * and the ring going out. A move of one cell is that exit from one cell and that enter into the next, which is why it
 * is the first primitive: `travelScale` already draws a moving dot on only those two cells. Nothing moves by these yet.
 * Movement's move still reads its own tokens, and whether it reads its halves from these is his call once he has
 * picked.
 */

/**
 * Where a one-cell element comes in and goes out. `place`: it grows and shrinks where it stands. `through`: in at the
 * flow's start border and out at its end, as a dot passing through the cell does inside a move. `rise`: up from the
 * cell's lower border, and back down it.
 */
export type CellWay = "place" | "through" | "rise"
export const CELL_WAYS: readonly CellWay[] = ["place", "through", "rise"]

export type CellEnter = {
  /** Coming in, and going out, in ms. */
  enter: number
  exit: number
  enterEase: (t: number) => number
  exitEase: (t: number) => number
  way: CellWay
  /** The dot's size at the way in and out, 0..1: 0 and it comes from nothing. */
  scale: number
  /** Its opacity there, 0..1: 1 and it does not fade. */
  opacity: number
  /** The ring against the dot, as a share of the enter or the exit, −1..1: positive and the ring lights before the dot comes in and goes out after it leaves. */
  ring: number
  /** Between one element and the next, in ms: movement's own stagger, borrowed, positive from the first outward. */
  stagger: number
}

/** An ease token off `el`, or `fallback` where it is unset: none of enter and exit's tokens is in globals.css yet. */
const easeOr = (el: Element, token: `--motion-${string}`, fallback: string) =>
  easing(getComputedStyle(el).getPropertyValue(token).trim() || fallback)

/**
 * The enter and exit tokens off `el`, read when an enter or an exit starts. None is in globals.css until he picks, so
 * the fallbacks are the studio's preset A: movement's dot at his settings taken apart (Motion.md M11).
 */
export function readCellEnter(el: Element): CellEnter {
  const way = getComputedStyle(el).getPropertyValue("--motion-move-enter-way").trim() as CellWay
  return {
    enter: motionMs(el, "--motion-move-enter", 320),
    exit: motionMs(el, "--motion-move-exit", 80),
    enterEase: easeOr(el, "--motion-move-enter-ease", "cubic-bezier(0.215, 0.61, 0.355, 1)"),
    exitEase: easeOr(el, "--motion-move-exit-ease", "linear"),
    way: CELL_WAYS.includes(way) ? way : "through",
    scale: motionNumber(el, "--motion-move-enter-scale", 0),
    opacity: motionNumber(el, "--motion-move-enter-opacity", 1),
    ring: motionNumber(el, "--motion-move-enter-ring", 0.1),
    stagger: motionMs(el, "--motion-move-stagger", 20, true),
  }
}

/**
 * How far an element is in: its dot's presence and its ring's, 0 gone and 1 at rest on its cell (an overshoot goes
 * past 1), and which half of its way the dot is on, the way in or the way out. They are the same half for `place` and
 * `rise`.
 */
export type CellPresence = { dot: number; ring: number; side: "in" | "out" }

/** One element's enter or exit: where it starts from, and whether it is coming in or going out. */
export type CellEntry = { from: CellPresence; present: boolean }

/** One element at one moment: its presence, its ring's box, and its dot's centre, size and opacity. */
export type CellEnterFrame = CellPresence & { l: number; t: number; r: number; b: number; x: number; y: number; scale: number; opacity: number }

/** `count` elements at rest, all in or all gone. */
export function cellPresence(count: number, present: boolean): CellPresence[] {
  const p = present ? 1 : 0
  return Array.from({ length: count }, () => ({ dot: p, ring: p, side: "in" as const }))
}

/**
 * The enter or the exit from `from`, which may be the frames last drawn, turned round part way. An element that is gone
 * comes in by the way in, and one at rest goes out by the way out. One caught part way keeps its half, so it goes back
 * the way it came: a hover that changes its mind turns it round from where it stands, as a move does.
 */
export function cellEntries(from: readonly CellPresence[], present: boolean): CellEntry[] {
  return from.map((p) => ({
    present,
    from: { dot: p.dot, ring: p.ring, side: present ? (p.dot <= 0 ? "in" : p.side) : p.dot >= 1 ? "out" : p.side },
  }))
}

const startOfEntry = (motion: CellEnter, i: number, last: number) =>
  (motion.stagger >= 0 ? i : last - i) * Math.abs(motion.stagger)

const changes = (e: CellEntry) => e.from.dot !== (e.present ? 1 : 0) || e.from.ring !== (e.present ? 1 : 0)

/** How long the whole enter or exit takes, in ms: the last element to change, and its enter or exit. */
export function cellEnterTotal(motion: CellEnter, list: readonly CellEntry[]): number {
  const last = list.length - 1
  const starts = list.flatMap((e, i) => (changes(e) ? [startOfEntry(motion, i, last)] : []))
  if (!starts.length) return 0
  return Math.max(...starts) + (list[0]!.present ? motion.enter : motion.exit)
}

/**
 * An element at `p` on its cell. `through` and `rise` come in from half a pitch off the centre, the middle of the
 * gutter, where a moving dot changes cells, and the dot's size follows where it is, as a moving dot's does
 * (`dotScale`): smallest at the way in, whole at the centre, on a smoothstep, so an overshoot past the centre dips it
 * again. `place` has nowhere to travel, so its size is its presence. It is not drawn at all once it is gone.
 */
function presenceFrame(motion: CellEnter, p: CellPresence, state: CellState, flow: CellFlow, pitch: number): CellEnterFrame {
  const half = pitch / 2
  const sign = p.side === "in" ? -1 : 1
  const [dx, dy] =
    motion.way === "through" ? (flow.axis === "row" ? [sign * half, 0] : [0, sign * half]) : motion.way === "rise" ? [0, half] : [0, 0]
  const away = 1 - p.dot
  const near = clamp01(1 - Math.abs(1 - p.dot))
  const size = motion.way === "place" ? lerp(motion.scale, 1, p.dot) : motion.scale + (1 - motion.scale) * near * near * (3 - 2 * near)
  const seen = p.dot > 0
  return {
    ...p,
    l: state.l,
    t: state.t,
    r: state.r,
    b: state.b,
    x: state.x + dx * away,
    y: state.y + dy * away,
    scale: seen ? size : 0,
    opacity: seen ? lerp(motion.opacity, 1, clamp01(p.dot)) : 0,
  }
}

/** Every element at rest where `states` puts it, in or gone. */
export function cellEnterSettled(motion: CellEnter, states: readonly CellState[], present: boolean, flow: CellFlow, cell: number, gap: number): CellEnterFrame[] {
  const rest = cellPresence(states.length, present)
  return states.map((s, i) => presenceFrame(motion, rest[i]!, s, flow, cell + gap))
}

/**
 * Every element at `elapsed` ms into the enter or the exit, on its cell in `states`. The ring and the dot share the
 * enter or the exit's length and curve. With a lead, whichever goes first takes the start and the other the end, and
 * the ring goes first coming in and last going out: the station opens before the passenger comes and closes after they
 * go. A negative lead is the other way round.
 */
export function cellEnterFrame(
  motion: CellEnter,
  list: readonly CellEntry[],
  states: readonly CellState[],
  flow: CellFlow,
  elapsed: number,
  cell: number,
  gap: number,
): CellEnterFrame[] {
  const last = list.length - 1
  const lead = Math.max(-1, Math.min(1, motion.ring))
  const early: [number, number] = [0, 1 - Math.abs(lead)]
  const late: [number, number] = [Math.abs(lead), 1]
  return list.map((entry, i) => {
    const target = entry.present ? 1 : 0
    const duration = entry.present ? motion.enter : motion.exit
    const ease = entry.present ? motion.enterEase : motion.exitEase
    const since = elapsed - startOfEntry(motion, i, last)
    const t = duration > 0 ? clamp01(since / duration) : since >= 0 ? 1 : 0
    const ringFirst = entry.present === lead >= 0
    const [ringWin, dotWin] = ringFirst ? [early, late] : [late, early]
    const presence: CellPresence = {
      dot: lerp(entry.from.dot, target, ease(within(t, dotWin[0], dotWin[1]))),
      ring: clamp01(lerp(entry.from.ring, target, ease(within(t, ringWin[0], ringWin[1])))),
      side: entry.from.side,
    }
    return presenceFrame(motion, presence, states[i]!, flow, cell + gap)
  })
}
