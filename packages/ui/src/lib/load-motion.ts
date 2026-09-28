/**
 * How a page loads (Motion.md M10, 2026-09-27, his: "ripple is not the loading state that I want … when it first loads,
 * we will have X number of line dashed bordered cells at the center which will be rotating the x is defined by the
 * number of cards or sections in the page so they will rotate uh, and then once everything is ready to render they will
 * expand to the component that they are supposed to be"). "Line" is lime, as it was for the pointer (Grid.md D34).
 *
 * Pure, but for reading the tokens (`readLoadMotion`): a frame is a function of the motion's numbers, the block, where
 * each section lands, when the page was ready and the time since loading began. `useLoadMotion`
 * (`hooks/use-load-motion.ts`) plays it: the motion studio with the numbers on a jig, and a page, when one adopts it,
 * with the tokens it reads off itself. Positions are px from the top-left of the block's first cell. **Its numbers are
 * his** (2026-09-27, the `--motion-load-*` tokens in globals.css, from the studio's preset A tuned), and for the travel
 * it reads movement's.
 *
 * **The loader is a square** (his, the same night: "I want them to be distributed between same number of columns and
 * rows"; the page folded, a row of cells for each of its rows, before). One cell a section, a lime ring in dashes, in a
 * block at the block's centre as near square as it can be, a row taller rather than wider (ten stand as 3, 3, 3, 1), in
 * the page's reading order. **While the page loads** it turns, by the motion's `turn`, and the turn is on the rings, never the page: every
 * ring's dashes go round (spin), neighbours turn opposite ways, meshed like gears (gears), a closed ring goes round the
 * page, handing over like a marquee (chase), or one ring at a time turns once round and hands on to the next (relay).
 * **The turn does not stop for the move** (his, the same night: "the turn should continue while expanding too"): it goes
 * on through the press, while the dashes close, and on under the closed ring as it travels, until each ring is released
 * into a plain border ("without the dashed borders"), and the lap is only how fast it goes ("lab speed is basically how
 * fast the cell is evolving"), never how long the page takes.
 *
 * **When it is ready, each ring moves to its section as movement's dot does** (Motion.md M9; his, the same night: "the
 * beauty in the movement motion that we designed is that there is a filled circle in the center … when it moves, it
 * shrinks so that it appears as it is drowning into the cell and then floating back in another cell … once the
 * handover starts, the line dashed border treating it like a different component on the cell should scale down its
 * size by 0.8 as if it's a tactical feedback and then perform the movement and then once it reaches its destination
 * cell it should tactically scale up to fill the cell and then open up"). Then, the same night: "the press should
 * happen to all the loading circles at once. And then they have to travel to their cell we can account for the distance
 * so every cell can reach its destination cell based on the distance and then once they reach the press goes back to
 * one and open … without the dashed borders just have the border". And then: "the expectation was to do the movement
 * directly from the cell it is in to its destination cell the values that we kept default in the movement motion
 * should be the same … once it shrinks to 0.8 that means it is basically in the state of how we setup movement". Then:
 * "change the press to 0.5 instead of 0.8 … once the cell is moving from one cell to another, once it shrinks down and
 * exits its first cell, it should not be visible anywhere else again except where it reached its destination cell" —
 * which movement's dot now does too (`travelScale`). And last: "let all the loading cells reach their destination cell
 * at once … every thing reaching at its own pace it feels a little off". And the next day, 2026-09-28: "just before the
 * transition from one cell to another, the circle shrinks. So, while shrinking it should not be bordered circle. The
 * dashes should slowly as they shrink should become full circle".
 *
 * So every ring is pressed at once, to his 0.5 (`LOAD_PRESS`), its dashes growing into their gaps as it shrinks until
 * it is a full circle — pressed, it is movement's dot at rest — and then goes
 * straight to the cell of its section nearest it, in ONE move of movement's dot: its curve, its duration
 * (`--motion-move-duration`), however far it goes, so every ring lands at once, and its size, set by where it is
 * (`travelScale`) — it drowns leaving its cell, is not seen over any cell between, and floats up in the cell it
 * reaches. A ring with nowhere to go stays pressed until the rest land. All are released together, back to the cell's
 * size, their lime turning into the plain border a section wears as they grow; **then each opens, the
 * moment it has**, outward to its section's edges, smoothly or a whole cell at a time (`open`), with the section coming
 * in over the last `reveal` of it and the border going as it comes. An opening section stays inside its own box, and
 * one whose box a ring has yet to pass through waits for that ring to have left it. The press, the release, the opening
 * and a chase's or a relay's hand-over are on movement's ring curve, as movement's own growing ring is: the loading
 * family has no curve, and no speed, of its own.
 *
 * Every box is a cell's circle at its corners (Grid.md D39), so a 1×1 is a circle and the expansion is the system's
 * own geometry: the circle becomes the section's box without a second shape.
 */

import { readCellMotion, travelScale } from "@no-origins/ui/lib/cell-motion"
import { motionMs, motionNumber } from "@no-origins/ui/lib/motion"

/**
 * How the rings turn. All four are on the rings themselves, so the turn can go on while the cells travel and open: a
 * turn that moved the page (a wheel, a page stepping round a square, both tried on 2026-09-27) could not, since a page
 * still moving would carry its cells off their rows and columns.
 */
export type LoadTurn = "spin" | "gears" | "chase" | "relay"
export const LOAD_TURNS: readonly LoadTurn[] = ["spin", "gears", "chase", "relay"]

/** How a section opens from its cell: smoothly, or a whole cell at a time. */
export type LoadOpen = "smooth" | "cells"
export const LOAD_OPENS: readonly LoadOpen[] = ["smooth", "cells"]

export type LoadMotion = {
  turn: LoadTurn
  /** Once round, in ms: a ring's revolution (spin, gears), or the turn once round the square (chase, relay). Speed only. */
  lap: number
  open: LoadOpen
  /** One section's opening, in ms, from its cell to its edges. */
  duration: number
  /** The last share of the opening, 0..1, over which the section comes in. */
  reveal: number
  /** The press before the rings travel, and each one's release as it lands, in ms each. */
  press: number
  /**
   * Movement (Motion.md M9, his, decided), borrowed rather than copied: a move, in ms (every ring's travel, however far),
   * the dot's curve (a ring's travel), its size on the gutter and where it starts to shrink, and the ring's curve (the
   * press, the release, the opening, a chase's or a relay's hand-over) — `--motion-move-duration`, `-dot-ease`,
   * `-dot-min`, `-dot-from` and `-ring-ease`, read with `readCellMotion`.
   */
  move: { duration: number; dot: (t: number) => number; min: number; from: number; ring: (t: number) => number }
}

/** How far the press scales a ring: his number, 2026-09-27 ("change the press to 0.5 instead of 0.8"). */
export const LOAD_PRESS = 0.5

/** The fallbacks: globals.css's values, his pick of 2026-09-27 (Motion.md M10), for an element that has no tokens. */
const PICKED = { turn: "chase", lap: 6000, open: "smooth", press: 200, duration: 1200, reveal: 1 } as const

function choice<T extends string>(el: Element, token: `--motion-${string}`, list: readonly T[], fallback: T): T {
  const value = getComputedStyle(el).getPropertyValue(token).trim() as T
  return list.includes(value) ? value : fallback
}

/** The loading tokens off `el`, read when loading starts and again when the page is ready — never cached. */
export function readLoadMotion(el: Element): LoadMotion {
  const move = readCellMotion(el)
  return {
    turn: choice(el, "--motion-load-turn", LOAD_TURNS, PICKED.turn),
    lap: Math.max(1, motionMs(el, "--motion-load-lap", PICKED.lap)),
    open: choice(el, "--motion-load-open", LOAD_OPENS, PICKED.open),
    duration: motionMs(el, "--motion-load-duration", PICKED.duration),
    reveal: clamp01(motionNumber(el, "--motion-load-reveal", PICKED.reveal)),
    press: motionMs(el, "--motion-load-press", PICKED.press),
    move: { duration: move.duration, dot: move.dotEase, min: move.dotMin, from: move.dotFrom, ring: move.ringEase },
  }
}

/** A box in px: a cell, a section, or anything between. */
export type LoadBox = { l: number; t: number; r: number; b: number }

/** A cell on the block, 0-based. */
type Cell = { col: number; row: number }

/** A section in cells: where it starts, 0-based, and how many it spans. */
type Section = Cell & { across: number; down: number }

/**
 * The loader on a block: each section's cell in it (`spots`, in the order of the sections), the cell of its
 * section each moves to (`anchors`), the order a chase and a relay go round (`round`, clockwise from the top-left), and
 * the square's centre in px, which they go round.
 */
export type LoaderLayout = { spots: Cell[]; anchors: Cell[]; round: number[]; cx: number; cy: number }

/** The dashes: this many round a cell's circle, half dash and half gap — coarse enough that a turn reads, not shimmers. */
export const LOAD_DASHES = 12

/** Where a chase and a relay start round: the top-left. */
const ROUND_FROM = (-3 * Math.PI) / 4

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const clamp01 = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Progress through a window [a, b] of something that is at `t`. */
const within = (t: number, a: number, b: number) => (b <= a ? (t >= b ? 1 : 0) : clamp01((t - a) / (b - a)))
const lerpBox = (a: LoadBox, b: LoadBox, t: number): LoadBox => ({ l: lerp(a.l, b.l, t), t: lerp(a.t, b.t, t), r: lerp(a.r, b.r, t), b: lerp(a.b, b.b, t) })

/** A section's box back in cells: the targets stand on the block's cells. */
function sectionOf(b: LoadBox, cell: number, gap: number): Section {
  const pitch = cell + gap
  return {
    col: Math.round(b.l / pitch),
    row: Math.round(b.t / pitch),
    across: Math.max(1, Math.round((b.r - b.l + gap) / pitch)),
    down: Math.max(1, Math.round((b.b - b.t + gap) / pitch)),
  }
}

/**
 * The loader on the centre of a block `cols` × `rows`: a block of cells as near a square as it can be, one a section
 * (his, 2026-09-27: "I want them to be distributed between same number of columns and rows") — as many rows as the side
 * of the smallest square that holds them all, and as few columns as fill those rows, so it is square or a row taller
 * than wide, never wider (his, the same night, of ten: "Instead of 4, 4, 2 for the first loaders, try 3, 3, 3, 1") —
 * filled in the page's reading order, row by row, a row that is not full centred under the rest. An even field's centre
 * is a grid line (Grid.md D26), so an odd row sits half a cell left of it, on the grid. The square is centred down as
 * well. Where the field is narrower than the square, it is as wide as the field and as many rows tall as that takes.
 *
 * Each cell moves to its section's TOP-LEFT cell, and the section opens out from that corner, rightward and down (his,
 * the same night: "Instead of moving the loader to the nearest corner, let's always move them to the top left corner of
 * any component"). *Before*, the nearest of its four corners ("it should open up only from the corners"); before that,
 * the nearest of any of its cells, which could open a section from the middle of an edge or from inside it; and before
 * that, the page folded, a row of cells for each row its sections start on, side by side — on a real page mostly one
 * cell a row, a column that read as scattered.
 */
export function loaderLayout(targets: readonly LoadBox[], cols: number, rows: number, cell: number, gap: number): LoaderLayout {
  const pitch = cell + gap
  const sections = targets.map((b) => sectionOf(b, cell, gap))
  const n = sections.length
  // Never wider than the field: a page of a ring a card is more than a phone's six columns can square (2026-09-28).
  // Nor taller: on a short field (a phone on its side, four rows) it widens until its rows fit, so no ring stands
  // outside the grid's box.
  const square = Math.ceil(n / Math.max(1, Math.ceil(Math.sqrt(n))))
  const side = Math.max(1, Math.min(cols, Math.max(square, Math.ceil(n / Math.max(1, rows)))))
  const lines = Math.ceil(n / side)
  const top0 = Math.max(0, Math.floor((rows - lines) / 2))
  const order = sections.map((_, i) => i).sort((a, b) => sections[a]!.row - sections[b]!.row || sections[a]!.col - sections[b]!.col)
  const spots = new Array<Cell>(n)
  const anchors = new Array<Cell>(n)
  order.forEach((i, k) => {
    const line = Math.floor(k / side)
    const inLine = Math.min(side, n - line * side)
    const spot = { col: Math.floor((cols - inLine) / 2) + (k % side), row: top0 + line }
    const s = sections[i]!
    spots[i] = spot
    // A piece that starts past the middle of the field's last cell rounds to the line beyond it: its cell is the last.
    anchors[i] = { col: clamp(s.col, 0, cols - 1), row: clamp(s.row, 0, rows - 1) }
  })
  const colsUsed = spots.map((s) => s.col)
  const rowsUsed = spots.map((s) => s.row)
  const cx = n ? ((Math.min(...colsUsed) + Math.max(...colsUsed)) * pitch + cell) / 2 : 0
  const cy = n ? ((Math.min(...rowsUsed) + Math.max(...rowsUsed)) * pitch + cell) / 2 : 0
  const angle = (s: Cell) => {
    const a = Math.atan2(s.row * pitch + cell / 2 - cy, s.col * pitch + cell / 2 - cx) - ROUND_FROM
    return ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  }
  const round = spots.map((_, i) => i).sort((a, b) => angle(spots[a]!) - angle(spots[b]!))
  return { spots, anchors, round, cx, cy }
}

/** What loading is, fixed for one pass: the motion, the loader's square, where each section lands, and when the page was ready. */
export type LoadPlan = {
  motion: LoadMotion
  layout: LoaderLayout
  /** Each section's box, px, on the block's cells. */
  targets: LoadBox[]
  cell: number
  gap: number
  /** When the page was ready, ms after loading began; null while it is still loading. */
  ready: number | null
  /** How long the rings travel, in ms, all together, and when each section starts to open, ms after ready (`openings`). */
  travel: number
  opens: number[]
}

export function loadPlan(motion: LoadMotion, targets: LoadBox[], cols: number, rows: number, cell: number, gap: number, ready: number | null): LoadPlan {
  const layout = loaderLayout(targets, cols, rows, cell, gap)
  return { motion, layout, targets, cell, gap, ready, ...openings(motion, layout, targets, cell, gap) }
}

type Point = { x: number; y: number }

/** A ring's centre `u` of the way (0..1, the curve applied) from `a` to `b`, px: straight there. */
const along = (a: Point, b: Point, u: number): Point => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) })

/**
 * How long the rings travel and when each section opens, in ms after the page is ready. Every ring is pressed at once;
 * then all go straight to their cells in one move of movement's duration, however far, and are released together as
 * they land — a ring with nowhere to go waits for them, pressed; with none to go anywhere they are released straight
 * after the press. A section opens the moment its ring has been released, unless another ring is still to pass
 * through its box, from where it waits to where it lands: then it waits for that ring to have left it, which is what
 * keeps an opening section from crossing a ring on its way.
 */
function openings(m: LoadMotion, layout: LoaderLayout, targets: readonly LoadBox[], cell: number, gap: number) {
  const pitch = cell + gap
  const centre = (c: Cell | undefined) => ({ x: (c?.col ?? 0) * pitch + cell / 2, y: (c?.row ?? 0) * pitch + cell / 2 })
  const goes = targets.map((_, j) => {
    const a = centre(layout.spots[j])
    const b = centre(layout.anchors[j])
    return a.x !== b.x || a.y !== b.y
  })
  const travel = goes.some(Boolean) ? m.move.duration : 0
  const lands = m.press + travel + m.press
  const meets = (a: LoadBox, b: LoadBox) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b
  // Each travelling ring's way, sampled at even steps of its time: where it stands, as big as it is there (the press
  // left out: bigger), or nothing where it has drowned too far to be seen.
  const STEPS = 32
  const ways = targets.map((_, j) => {
    if (!goes[j]) return [] as (LoadBox | null)[]
    const from = centre(layout.spots[j])
    const to = centre(layout.anchors[j])
    return Array.from({ length: STEPS + 1 }, (_, k) => {
      const p = along(from, to, m.move.dot(k / STEPS))
      const half = (cell / 2) * (k === 0 || k === STEPS ? 1 : travelScale(p.x, p.y, from, to, pitch, cell, m.move.min, m.move.from))
      return half < 0.5 ? null : { l: p.x - half, r: p.x + half, t: p.y - half, b: p.y + half }
    })
  })
  // When ring `i` has left `box` for good: the step after the last one it touches it at.
  const leaves = (i: number, box: LoadBox) => {
    const last = ways[i]!.findLastIndex((b) => b !== null && meets(b, box))
    return last < 0 ? 0 : m.press + (travel * Math.min(STEPS, last + 1)) / STEPS
  }
  const opens = targets.map((box, j) => targets.reduce((at, _, i) => (i === j ? at : Math.max(at, leaves(i, box))), lands))
  return { travel, opens }
}

/** When the cells set off for their sections, ms after loading began: the moment the page is ready. The turn does not wait. */
export function loadExpandsAt(plan: LoadPlan): number {
  return plan.ready === null ? Infinity : plan.ready
}

/** When the last section is in, ms after loading began; Infinity while the page is still loading. */
export function loadTotal(plan: LoadPlan): number {
  return loadExpandsAt(plan) + Math.max(0, ...plan.opens) + plan.motion.duration
}

/** A ring's turn at a moment: how far round its dashes have gone, and how closed they are (a chase's). */
type Turn = { dash: number; solid: number }

/**
 * Ring `j`'s turn at `t` ms after loading began. It depends on the time and the ring, never on where the ring is, so it
 * goes on unchanged while the ring travels and opens.
 */
function turnOf(plan: LoadPlan, j: number, t: number): Turn {
  const { motion: m, layout, cell } = plan
  const round = Math.PI * cell
  switch (m.turn) {
    case "spin":
      return { dash: (t / m.lap) * round, solid: 0 }
    case "gears": {
      // Meshed: a ring turns against its neighbours in the square — the way it turns is its cell's parity.
      const spot = layout.spots[j] ?? { col: 0, row: 0 }
      const way = (spot.col + spot.row) % 2 === 0 ? 1 : -1
      return { dash: way * (t / m.lap) * round, solid: 0 }
    }
    case "chase": {
      // A closed ring goes round, handing over as movement's rings do (Motion.md M9): the next closes in the first half
      // of a hand-over, the last opens in the second, so the ring is never lost between two cells.
      const n = Math.max(1, layout.round.length)
      const step = m.lap / n
      const k = Math.floor(t / step)
      const phase = (t - k * step) / step
      let solid = 0
      if (j === layout.round[(k + 1) % n]) solid = m.move.ring(within(phase, 0, 0.5))
      if (j === layout.round[k % n]) solid = Math.max(solid, 1 - m.move.ring(within(phase, 0.5, 1)))
      return { dash: 0, solid }
    }
    case "relay": {
      // One ring at a time turns once round, then the next round the page does: a baton. Each ring keeps the turns it
      // has made, so its dashes stand where its last turn left them.
      const n = Math.max(1, layout.round.length)
      const step = m.lap / n
      const at = Math.max(0, layout.round.indexOf(j))
      const laps = Math.floor(t / m.lap)
      const into = t - laps * m.lap
      const turns = laps + m.move.ring(within(into, at * step, (at + 1) * step))
      return { dash: turns * round, solid: 0 }
    }
  }
}

/**
 * Whole cells, snapping: `v` cells, where the fraction between two whole numbers stays on the lower until half way and
 * then snaps up on a smoothstep — so a box opening by cells is seen to count them.
 */
function stepped(v: number): number {
  const n = Math.floor(v)
  const s = clamp01((v - n - 0.5) * 2)
  return n + s * s * (3 - 2 * s)
}

/** A section opening from its anchor's cell `a` to its box `to`, `q` of the way: each edge outward, never past its own. */
function openBox(m: LoadMotion, a: LoadBox, to: LoadBox, q: number, pitch: number): LoadBox {
  if (m.open !== "cells") return lerpBox(a, to, q)
  const by = (from: number, edge: number) => stepped(Math.round(Math.abs(edge - from) / pitch) * q) * pitch
  return { l: a.l - by(a.l, to.l), r: a.r + by(a.r, to.r), t: a.t - by(a.t, to.t), b: a.b + by(a.b, to.b) }
}

/**
 * One section at one moment: its ring (its box, how big it is drawn in that box, how lit, how lime, how far round its
 * dashes have gone, how closed they are) and how far the section itself has come in (0..1), in the order of the
 * sections. A painter shows the section INSIDE the ring's box — clipped to it, a cell's circle at its corners — so it is
 * revealed as the ring opens and never shows past it (a ring opening by whole cells is behind the section's fade).
 */
export type LoadFrame = LoadBox & {
  opacity: number
  /** 1 the loader's lime, 0 the plain border a section wears (`--border`), between them a mix. */
  lime: number
  /** How big the ring is drawn in its box, about the box's centre: pressed, and smaller still as it drowns on its way. */
  scale: number
  /** How far the dashes have gone round, px along the ring, clockwise. */
  dash: number
  /** 0 in dashes, 1 closed: a chase's ring, and every ring once it is pressed. */
  solid: number
  /** The section: 0 not there, 1 in. */
  content: number
}

/** Ring `j` on its cell in the square, px. */
function homeOf(plan: LoadPlan, j: number): LoadBox {
  const pitch = plan.cell + plan.gap
  const spot = plan.layout.spots[j] ?? { col: 0, row: 0 }
  return { l: spot.col * pitch, t: spot.row * pitch, r: spot.col * pitch + plan.cell, b: spot.row * pitch + plan.cell }
}

/**
 * Every section at `t` ms after loading began. Until the page is ready, each is its cell in the square, turning. Then every ring
 * is pressed at once, its dashes closing into a full circle as it shrinks, and, pressed, goes straight to its section's
 * cell in one move of movement's dot — all in the same time, drowning as it leaves, unseen between, floating up as it
 * arrives — and all are released there together, their lime turning into a plain border as they grow back; each opens
 * as that border from the moment `openings` gives it. The turn goes on until the rings are released.
 */
export function loadFrame(plan: LoadPlan, t: number): LoadFrame[] {
  const { motion: m, layout, targets, cell, gap } = plan
  const pitch = cell + gap
  const at = loadExpandsAt(plan)
  const loader = { opacity: 1, lime: 1, content: 0 }
  if (t < at) return targets.map((_, j) => ({ ...homeOf(plan, j), scale: 1, ...turnOf(plan, j, t), ...loader }))
  const moving = at + m.press
  return targets.map((target, j) => {
    const home = homeOf(plan, j)
    const anchor = layout.anchors[j] ?? { col: 0, row: 0 }
    const a: LoadBox = { l: anchor.col * pitch, t: anchor.row * pitch, r: anchor.col * pitch + cell, b: anchor.row * pitch + cell }
    const turn = turnOf(plan, j, t)
    const opens = at + (plan.opens[j] ?? 0)
    if (t >= opens) {
      // The plain border, opening; the section comes in over the end of it, and the border goes as it comes — handing
      // over to the section's own, or to none where the section wears none (a page's borderless column, Grid.md D48).
      const q = within(t, opens, opens + m.duration)
      const content = m.reveal > 0 ? within(q, 1 - m.reveal, 1) : q >= 1 ? 1 : 0
      return { ...openBox(m, a, target, m.move.ring(q), pitch), scale: 1, opacity: 1 - content, lime: 0, dash: 0, solid: 1, content }
    }
    const landed = moving + plan.travel
    if (t < moving) {
      // Pressed: its dashes grow into their gaps as it shrinks, so it is a full circle by the time it sets off.
      const p = m.move.ring(within(t, at, moving))
      return { ...home, scale: lerp(1, LOAD_PRESS, p), ...turn, solid: Math.max(turn.solid, p), ...loader }
    }
    if (t >= landed) {
      // Released: back to the cell's size, the lime going as it grows.
      const r = m.move.ring(within(t, landed, landed + m.press))
      return { ...a, scale: lerp(LOAD_PRESS, 1, r), dash: turn.dash, solid: 1, opacity: 1, lime: 1 - r, content: 0 }
    }
    const from = { x: home.l + cell / 2, y: home.t + cell / 2 }
    const to = { x: a.l + cell / 2, y: a.t + cell / 2 }
    const p = along(from, to, m.move.dot(within(t, moving, landed)))
    const scale = LOAD_PRESS * travelScale(p.x, p.y, from, to, pitch, cell, m.move.min, m.move.from)
    return { l: p.x - cell / 2, t: p.y - cell / 2, r: p.x + cell / 2, b: p.y + cell / 2, scale, ...turn, solid: 1, ...loader }
  })
}

/** Every section in, its ring gone. */
export function loadSettled(targets: readonly LoadBox[]): LoadFrame[] {
  return targets.map((b) => ({ ...b, opacity: 0, lime: 0, scale: 1, dash: 0, solid: 1, content: 1 }))
}

/**
 * A ring's dashes on a box `w` × `h` px, for a painter: its corner radius (a cell's circle, D39, shrunk to fit), its
 * length round, and a dash and a gap that divide that length evenly — LOAD_DASHES round a cell, as many as fit round a
 * bigger box — the dash taking the gap as `solid` goes to 1. For a 1px line drawn on the half pixel inside the box.
 */
export function loadRing(w: number, h: number, cell: number, solid: number) {
  const iw = Math.max(0, w - 1)
  const ih = Math.max(0, h - 1)
  const radius = Math.max(0, Math.min(cell / 2 - 0.5, iw / 2, ih / 2))
  const length = 2 * (iw + ih) - 8 * radius + 2 * Math.PI * radius
  const pitch = (Math.PI * cell) / LOAD_DASHES
  const count = Math.max(1, Math.round(length / pitch))
  const each = length / count
  const dash = each / 2 + (each / 2) * clamp01(solid)
  return { width: iw, height: ih, radius, length, dash, gap: each - dash }
}
