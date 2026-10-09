import { actionDefaults, actionStill, agentAction, checkActionValues, type AgentActionFrame, type AgentActionPlay } from "@no-origins/ui/lib/agent-actions"
import type { CharacterLook } from "@no-origins/ui/lib/agent-body"
import { motionMs, motionNumber } from "@no-origins/ui/lib/motion"
import type { PropertyValues } from "@no-origins/ui/lib/properties"
import { sphereBeats, type SphereGeometry, type SphereMotion } from "@no-origins/ui/lib/sphere-motion"

/**
 * The intro (Grid.md D50, Motion.md M22), pure: who stands where, what each does and when, which cells its ripple lights,
 * and when each box comes in. It plays his three actions (`lib/agent-actions`, M24) as he published them, each agent as
 * its look makes it; nothing of the move is the intro's.
 *
 * - **They stand in a row** (`introSpots`): a cell each, side by side with no cell between, centred on the field's
 *   middle row — the upper of its two middle rows, since a field's rows are even (D26) — or the nearest row to it that
 *   no agent lands in. Who stands in which cell is random, a different order every load.
 * - **Some bounce, not together** (`gather`, `first`, `rest`; `IntroAgent.bounces`, the page's to say — on the
 *   portfolio Bali, Kino and Mira): each its first Bounce at a random moment in the first `first`, and again at its own
 *   pace — a wait it picks up to `rest`, each wait varying round it — so some bounce often and some seldom. A bounce may
 *   start once the last has come to rest; its settle, a jiggle his Bounce does not squash, is cut by the next. Nothing
 *   bounces that would not be at rest when it leaves. The rest sit in their nests until they leave.
 * - **Each is seen resting** (`since`): its rest — Breath and blinks, the agent's own (`SPHERE_START`) — plays as if it
 *   had sat one to two Blink every already, at random, so each breathes at its own phase and blinks at its own moment.
 * - **They leave, some diving and some jumping** (`leave`): each at a random moment in the `leave` after `gather`, by a
 *   Jump or a Dive picked at random — at least one of each — to the nest it lands in.
 * - **It lands on the centre of the boxes it opens** (`introCast`): the cell at the middle of the rectangle round them,
 *   always a cell of the field.
 * - **Its ripple spreads** (`ripple`, `ring`; `introRipple`): as it first touches down, the cells round its nest light
 *   ring by ring out from the nest's edge, `ring` apart, in violet, each fading as the pointer's cell does. One pass of
 *   the field's painter an agent, so two that cross each light their cells.
 * - **Then it dives home** (`settle`): once its ripple has spread and its landing has come to rest, his Dive out of its
 *   nest, behind the page, and up into its cell at home. Its nest fades back to the field's own cell as it goes
 *   (`introNestLeft`); the cell it comes up in lights while it is under, and stays lit.
 * - **Its boxes fade in once it is gone** (`reveal`): opacity only, which the compositor plays.
 * - **Home** (`introHome`): a cell each in the field's last column, the cast one above the other and centred down it,
 *   in the cast's order — on the portfolio Bali, Kino, Zaza, Oru, Mira and Lola from the top; on a field taller than it
 *   is wide, the bottom row. They stay there, breathing and blinking, once the intro is over, and on any field the grid
 *   is given after it, or where it never played (`introResting`).
 *
 * **One agent in focus** (`focus`): where the page names one, the boxes on the field are its section alone, and:
 *
 * - **The intro ends with that one below its section and the rest at home** (`introPlan` with `focus`): the one in
 *   focus jumps or dives to its cell below its section, its ripple spreads, and once it has, the section fades in. The
 *   others jump or dive straight to their cells at home, with no ripple: they open nothing.
 * - **It stays below its section** (`introBeside`): in the cell under the section's last row, at its centre, never on
 *   it, resting there, its nest lit under it, until the page turns. Where the field has no free cell round the section,
 *   it dives into the section's centre and is **held** there, gone behind the page (`hold`).
 * - **The page turns by the agents** (`introGoIn`, `introGoHome`): the one in focus dives out of its cell below its
 *   section, under the page and up into its cell at home, while its section fades away (`out`); the next one dives out
 *   of its cell at home and comes up below its own section, its ripple spreads, and the section fades in. An empty cell
 *   at home is the page being shown.
 *
 * Every box is someone's: one that names no agent of the cast is opened by the nearest. An agent no box is opened by
 * lands on the box that names it (its first), or else on the biggest, seated along its top row beside the one that
 * opens it.
 *
 * The numbers are mine but the two seconds, his to tune. None of the `--motion-intro-*` tokens is in globals.css yet:
 * `readIntroMotion` falls back to INTRO_START.
 */
export type IntroMotion = {
  /** How long they bounce on the field's centre before the first may leave, ms. */
  gather: number
  /** The latest an agent's first bounce starts, ms: each starts at a random moment before it. */
  first: number
  /** The longest an agent waits between one bounce coming to rest and the next, ms: its pace, picked up to this. */
  rest: number
  /** How long after `gather` the last of them may leave, ms: each leaves at a random moment in it. */
  leave: number
  /** How far its ripple spreads, in rings of cells out from its nest's edge. */
  ripple: number
  /** From one ring of its ripple lighting to the next, ms. */
  ring: number
  /** How long after its ripple's last ring lights it dives home, ms, its landing at rest by then. */
  settle: number
  /** How long the boxes it opens take to fade in, once it is gone behind the page, ms. */
  reveal: number
  /** How long a section takes to fade away as the page turns, ms: its agent is already on its way home. */
  out: number
}

/**
 * The intro's numbers, mine but `gather`: two rings of ripple, 80ms apart; the dive home 250ms after the ripple's last
 * ring, so the ripple is seen spread before the agent goes; the boxes fading in over 500ms; and `out`, a section fading
 * away as the page turns, the grid's own turn's 160ms (`TURN_MS`, D49).
 */
export const INTRO_START: IntroMotion = { gather: 2000, first: 500, rest: 700, leave: 300, ripple: 2, ring: 80, settle: 250, reveal: 500, out: 160 }

/** The intro's tokens off `el`, read as it starts; INTRO_START where one is unset. */
export function readIntroMotion(el: Element): IntroMotion {
  return {
    gather: motionMs(el, "--motion-intro-gather", INTRO_START.gather),
    first: Math.max(0, motionMs(el, "--motion-intro-first", INTRO_START.first)),
    rest: Math.max(0, motionMs(el, "--motion-intro-rest", INTRO_START.rest)),
    leave: Math.max(0, motionMs(el, "--motion-intro-leave", INTRO_START.leave)),
    ripple: Math.max(0, Math.round(motionNumber(el, "--motion-intro-ripple", INTRO_START.ripple))),
    ring: Math.max(0, motionMs(el, "--motion-intro-ring", INTRO_START.ring)),
    settle: Math.max(0, motionMs(el, "--motion-intro-settle", INTRO_START.settle)),
    reveal: Math.max(0, motionMs(el, "--motion-intro-reveal", INTRO_START.reveal)),
    out: Math.max(0, motionMs(el, "--motion-intro-out", INTRO_START.out)),
  }
}

/**
 * An agent of the cast: its name, which the page's boxes name it by (`data-intro-by`), its look, and whether it bounces
 * while the cast stands in its row (it does unless the page says not).
 */
export type IntroAgent = { id: string; look: CharacterLook; bounces?: boolean }

/** The actions the intro plays (M24). */
export type IntroActionId = "bounce" | "jump" | "dive"

/**
 * How the cast does each action: an action's values as he published them (`studio_versions` of kind `action`), held
 * whole as `checkActionValues` holds them. One left out is played as its version starts it, every control's default.
 */
export type IntroActions = Partial<Record<IntroActionId, PropertyValues>>

/** `actions`' values for the action `id`, checked against its declaration; its defaults where none is given. */
export function introActionValues(actions: IntroActions | undefined, id: IntroActionId): PropertyValues {
  const action = agentAction(id)
  if (!action) return {}
  return checkActionValues(action, actions?.[id] ?? actionDefaults(action))
}

/** A cell of the field, 0-based from its first. */
export type IntroCell = { col: number; row: number }

/** A box of the page on the field, in cells, 0-based, and the agents it names as opening it, first the one that does. */
export type IntroBox = IntroCell & { across: number; down: number; by: readonly string[] }

/** An agent's part on the page: the nest it lands in (none with no box on the field), and the boxes it opens. */
export type IntroRole = {
  nest: IntroCell | null
  /** The boxes it opens, by their index in the page's boxes, in reading order. */
  boxes: number[]
}

const reading = (a: IntroCell, b: IntroCell) => a.row - b.row || a.col - b.col
const area = (b: IntroBox) => b.across * b.down
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** How far a box is from a cell, in pitches: to the nearest of its cells. */
function reach(b: IntroBox, c: IntroCell) {
  const dc = Math.max(b.col - c.col, 0, c.col - (b.col + b.across - 1))
  const dr = Math.max(b.row - c.row, 0, c.row - (b.row + b.down - 1))
  return Math.hypot(dc, dr)
}

/**
 * The cell at the middle of the rectangle round `list`: the middle itself where the rectangle is an odd number of cells
 * across and down; where it is even, of the two (or four) cells round the middle, the first in reading order that is in
 * one of the boxes, else the first — always a cell of the field, never a point between cells.
 */
function middle(list: readonly IntroBox[]): IntroCell {
  const l = Math.min(...list.map((b) => b.col))
  const t = Math.min(...list.map((b) => b.row))
  const r = Math.max(...list.map((b) => b.col + b.across - 1))
  const b = Math.max(...list.map((x) => x.row + x.down - 1))
  const either = (v: number) => (Number.isInteger(v) ? [v] : [Math.floor(v), Math.ceil(v)])
  const round = either((t + b) / 2).flatMap((row) => either((l + r) / 2).map((col) => ({ col, row })))
  return round.find((c) => list.some((box) => reach(box, c) === 0)) ?? round[0]!
}

/**
 * The nest an agent opens `boxes` from: the cell at the centre of them all (`middle`) — a section's, as the page turns
 * to it. None, with no boxes.
 */
export function introNest(boxes: readonly IntroBox[]): IntroCell | null {
  return boxes.length ? middle(boxes) : null
}

/**
 * The `k`-th of `count` agents landing on a box: along its top row, the first at its top-left and the last at its
 * top-right, evenly between; a row down, and so on, where its top row has fewer cells than agents.
 */
function seat(b: IntroBox, k: number, count: number): IntroCell {
  if (count <= b.across) {
    return { col: b.col + (count <= 1 ? 0 : Math.round((k * (b.across - 1)) / (count - 1))), row: b.row }
  }
  return { col: b.col + (k % b.across), row: b.row + Math.min(b.down - 1, Math.floor(k / b.across)) }
}

/** `list` in a random order (Fisher–Yates), on `random`. */
function shuffled<T>(list: readonly T[], random: () => number): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

/**
 * The cast's parts on the page, `ids` in the cast's order. Each box is opened by the first of the agents it names that is
 * in the cast, and an agent that opens any lands on the centre of them. One left with none lands on the
 * first box that names it, or else the biggest — opening that box, on its centre, if no one else does, and otherwise
 * seated along its top row after the one that opens it. A box that names none of them goes to the agent whose nest is
 * nearest.
 */
export function introCast(ids: readonly string[], boxes: readonly IntroBox[]): IntroRole[] {
  const n = ids.length
  const owner = boxes.map((b) => {
    const first = b.by.find((id) => ids.includes(id))
    return first === undefined ? -1 : ids.indexOf(first)
  })
  const byReading = boxes.map((_, i) => i).sort((a, b) => reading(boxes[a]!, boxes[b]!))
  const biggest = [...byReading].sort((a, b) => area(boxes[b]!) - area(boxes[a]!))[0]
  // Those that open none: on the box that names them, or the biggest, opening it where no one does.
  const guests = boxes.map((): number[] => [])
  for (let a = 0; a < n; a++) {
    if (owner.includes(a)) continue
    const at = byReading.find((i) => boxes[i]!.by.includes(ids[a]!)) ?? biggest
    if (at === undefined) continue
    if (owner[at]! < 0) owner[at] = a
    else guests[at]!.push(a)
  }
  // Each that opens boxes on their centre; each guest in its seat, after the seat the one that opens the box would
  // have had.
  const nests = ids.map((_, a) => {
    const own = boxes.filter((_, i) => owner[i] === a)
    return own.length ? middle(own) : null
  })
  guests.forEach((list, i) => {
    const by = boxes[i]!.by
    const rank = (a: number) => (by.includes(ids[a]!) ? by.indexOf(ids[a]!) : n + a)
    const order = [...list].sort((a, b) => rank(a) - rank(b))
    order.forEach((a, k) => (nests[a] = seat(boxes[i]!, k + 1, order.length + 1)))
  })
  // A box no agent of the cast opens goes to the nearest.
  boxes.forEach((b, i) => {
    if (owner[i]! >= 0) return
    let best = -1
    nests.forEach((c, a) => {
      if (c && (best < 0 || reach(b, c) < reach(b, nests[best]!))) best = a
    })
    owner[i] = best
  })
  return ids.map((_, a) => ({ nest: nests[a] ?? null, boxes: byReading.filter((i) => owner[i] === a) }))
}

/**
 * Where each agent stands as the intro starts, a field `cols` × `rows`: side by side in one row, a cell
 * each with no cell between, centred across the field, in a random order (`random`). The row is the field's middle —
 * the upper of its two middle rows — or the nearest to it where no agent lands (`nests`, in the cast's order); a cast
 * wider than the field goes on in the rows under it.
 */
export function introSpots(nests: readonly (IntroCell | null)[], cols: number, rows: number, random: () => number = Math.random): IntroCell[] {
  const n = nests.length
  const across = Math.max(1, Math.min(n, cols))
  const down = Math.ceil(n / across)
  const c0 = Math.floor((cols - across) / 2)
  const mid = (rows - down) / 2
  const tops = Array.from({ length: Math.max(1, rows - down + 1) }, (_, r) => r).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b)
  const row = (top: number) => Array.from({ length: n }, (_, k) => ({ col: c0 + (k % across), row: top + Math.floor(k / across) }))
  // A cell an agent lands in.
  const landing = (c: IntroCell) => nests.some((x) => x && Math.abs(x.col - c.col) < 1 && Math.abs(x.row - c.row) < 1)
  const top = tops.find((t) => !row(t).some(landing)) ?? tops[0]!
  return shuffled(row(top), random)
}

/**
 * Where the agent in focus stands on its page: the cell under the section `boxes` make, at its centre — where the
 * section is an even number of cells across, the left of its two middle cells, then the right, since an agent stands
 * on a cell. Where that row is not free, the same cells over the section, then the cell left of its first row and the
 * one right of it. Never in a box nor in any cell of `taken` (the agents' cells at home). None, with no boxes or no
 * such cell.
 */
export function introBeside(boxes: readonly IntroBox[], cols: number, rows: number, taken: readonly IntroCell[] = []): IntroCell | null {
  if (!boxes.length) return null
  const l = Math.min(...boxes.map((b) => b.col))
  const t = Math.min(...boxes.map((b) => b.row))
  const r = Math.max(...boxes.map((b) => b.col + b.across - 1))
  const b = Math.max(...boxes.map((x) => x.row + x.down - 1))
  const mid = [...new Set([Math.floor((l + r) / 2), Math.ceil((l + r) / 2)])]
  const free = (c: IntroCell) =>
    c.col >= 0 && c.row >= 0 && c.col < cols && c.row < rows && !boxes.some((x) => reach(x, c) === 0) && !taken.some((h) => h.col === c.col && h.row === c.row)
  const candidates = [...mid.map((col) => ({ col, row: b + 1 })), ...mid.map((col) => ({ col, row: t - 1 })), { col: l - 1, row: t }, { col: r + 1, row: t }]
  return candidates.find(free) ?? null
}

/**
 * Where home is on a field `cols` × `rows`: its last column, or its bottom row where it is taller than it is wide — a
 * phone's, whose six columns are the six cells, where a last column would stand over its boxes.
 */
export const introHomeSide = (cols: number, rows: number): "column" | "row" => (rows > cols ? "row" : "column")

/**
 * Where each of `n` agents settles once the intro is over, a field `cols` × `rows`: one above the other
 * in its last column, a cell each, centred down it, in the cast's order from the top — the fourth row to the ninth of a
 * field twelve deep, since a field's rows are even (D26). A cast taller than the field goes on in the column left of it.
 * **On a field taller than it is wide, side by side along its bottom row** (`introHomeSide`), centred across
 * it, in the cast's order from the left; a cast wider than the field goes on in the row over it.
 */
export function introHome(n: number, cols: number, rows: number): IntroCell[] {
  if (introHomeSide(cols, rows) === "row") {
    const across = Math.max(1, Math.min(n, cols))
    const c0 = Math.floor((cols - across) / 2)
    return Array.from({ length: n }, (_, k) => ({ col: c0 + (k % across), row: Math.max(0, rows - 1 - Math.floor(k / across)) }))
  }
  const down = Math.max(1, Math.min(n, rows))
  const r0 = Math.floor((rows - down) / 2)
  return Array.from({ length: n }, (_, k) => ({ col: Math.max(0, cols - 1 - Math.floor(k / down)), row: r0 + (k % down) }))
}

/** How an agent moves in each action: its look under that action's values (`sphereMotionOf`). */
export type IntroMotions = Record<IntroActionId, SphereMotion>

/** A play of an action an agent starts at `at` ms, and how it moves in it. */
export type IntroStep = { at: number; play: AgentActionPlay; m: SphereMotion }

/** An agent's intro, played. */
export type IntroPart = {
  spot: IntroCell
  nest: IntroCell
  /** Its cell at home, where it settles (`introHome`). */
  home: IntroCell
  /** The boxes it opens, as its role has them. */
  boxes: IntroRole["boxes"]
  /** How it goes to its nest. */
  travel: "jump" | "dive"
  /** Sitting at its spot, from the start: before its first bounce. */
  still: IntroStep
  /** Its bounces, its jump or dive to its nest, and its Dive home, in order. */
  steps: IntroStep[]
  /** How long it is as if it had sat in its spot when the intro starts, ms: where its breath and its blinks are. */
  since: number
  /**
   * When it leaves for its nest; when it first touches down in it, and its ripple starts; when it dives home out of it;
   * when it is gone behind the page, and its boxes start to fade in; when it has come to rest in its cell. Infinity for
   * what it never does.
   */
  leave: number
  lands: number
  open: number
  gone: number
  settled: number
  /**
   * Held, from this moment on, gone behind the page: the agent in focus, dived into its section's nest and
   * staying under it while its section is shown, until the page turns (`introComeHome`). None, never held.
   */
  hold?: number
  /** Whether its landing in its nest lights a ripple; it does unless it says not (one going home opens nothing). */
  ripple?: boolean
}

/** The intro, played: each agent's part, when each box of the page starts to fade in, and when it is all over. */
export type IntroPlan = { parts: IntroPart[]; boxes: number[]; end: number }

/**
 * Which ring of a ripple from `nest` the cell `c` is in: the whole pitches its centre is out from the
 * nest's edge, the cells round the nest the first, 0.
 */
function ringOf({ cell, gap }: SphereGeometry, nest: IntroCell, c: IntroCell) {
  const pitch = cell + gap
  return Math.max(0, Math.floor((Math.hypot(c.col - nest.col, c.row - nest.row) * pitch - cell / 2) / pitch))
}

/**
 * The intro's plan, `random` deciding what is random: each agent's bounces at its spot, if it `bounces`, its travel to
 * its nest and its Dive from there to its cell of `homes`, by its `motions`, on a field of `g`; and the page's `boxes`
 * coming in as `roles` say, each once the agent that opens it is gone behind the page.
 */
export function introPlan(input: {
  m: IntroMotion
  g: SphereGeometry
  roles: readonly IntroRole[]
  spots: readonly IntroCell[]
  /** Where each settles (`introHome`); its nest where none is given. */
  homes?: readonly IntroCell[]
  motions: readonly IntroMotions[]
  boxes: readonly IntroBox[]
  /** Whether each agent bounces while they stand (`IntroAgent.bounces`); every one where none is given. */
  bounces?: readonly boolean[]
  /**
   * The agent in focus, by its index: it alone goes to its nest — below its section — and opens every box, staying
   * there; the rest go straight home. None: each opens its own and every one goes home.
   */
  focus?: number
  /** Its nest is its section's centre, with no cell below it: once its ripple has spread it dives in and is held. */
  under?: boolean
  random?: () => number
}): IntroPlan {
  const { m, g, roles, spots, homes, motions, boxes, bounces, focus, under = false, random = Math.random } = input
  const bounce = agentAction("bounce")!
  const dive = agentAction("dive")!
  const n = roles.length
  // Who dives: some, and the rest jump — at least one of each where there are two.
  const many = n < 2 ? (random() < 0.5 ? n : 0) : 1 + Math.floor(random() * (n - 1))
  const divers = new Set(shuffled(roles.map((_, a) => a), random).slice(0, many))

  const parts = roles.map((role, a): IntroPart => {
    const spot = spots[a]!
    const nest = role.nest ?? spot
    const ms = motions[a]!
    const leave = m.gather + random() * m.leave
    const here = { from: spot, to: spot }
    // A bounce has come to rest once it has landed and stopped moving in its nest: before its settle.
    const b = sphereBeats(ms.bounce, g, here)
    const resting = b.crouch + b.rise + b.fall + b.still
    const pace = m.rest * (0.2 + 0.8 * random())
    // Seen resting: as if it had sat a while, one to two blinks' time, so its breath and its next blink are its own.
    const since = (1 + random()) * Math.max(ms.bounce.blinkEvery, ms.bounce.breath, 1)
    const steps: IntroStep[] = []
    // When the play before ends, to rest from: it has sat since before the start, before the first.
    const restedAt = (t: number) => {
      const last = steps[steps.length - 1]
      return last ? Math.max(0, t - (last.at + last.play.total)) : since + t
    }
    let t = random() * Math.max(0, Math.min(m.first, leave - resting))
    // One that does not bounce sits, breathing and blinking, until it leaves.
    while ((bounces?.[a] ?? true) && t + resting <= leave) {
      steps.push({ at: t, play: bounce.play(ms.bounce, g, here, restedAt(t)), m: ms.bounce })
      t += resting + pace * (0.65 + 0.7 * random())
    }
    const travel = divers.has(a) ? "dive" : "jump"
    // One not in focus goes straight home, and that is all it does.
    if (focus !== undefined && a !== focus) {
      const home = homes?.[a] ?? spot
      const go = agentAction(travel)!.play(ms[travel], g, { from: spot, to: home }, restedAt(leave))
      steps.push({ at: leave, play: go, m: ms[travel] })
      return {
        spot,
        nest: home,
        home,
        boxes: [],
        travel,
        still: { at: 0, play: actionStill(ms.bounce, g, spot, since), m: ms.bounce },
        steps,
        since,
        leave,
        lands: leave + go.lands,
        open: Infinity,
        gone: Infinity,
        settled: leave + go.total,
        ripple: false,
      }
    }
    const go = agentAction(travel)!.play(ms[travel], g, { from: spot, to: nest }, restedAt(leave))
    steps.push({ at: leave, play: go, m: ms[travel] })
    const lands = leave + go.lands
    // The one in focus stays below its section, which fades in once its ripple has spread.
    if (focus === a && !under) {
      return {
        spot,
        nest,
        home: homes?.[a] ?? nest,
        boxes: role.boxes,
        travel,
        still: { at: 0, play: actionStill(ms.bounce, g, spot, since), m: ms.bounce },
        steps,
        since,
        leave,
        lands,
        open: Infinity,
        gone: lands + rippleSpan(m),
        settled: leave + go.total,
      }
    }
    // Home, by his Dive: once its ripple has spread — its last ring lit, and `settle` more — and its landing
    // has come to rest, since a Dive sets off from the agent sitting in its nest.
    const open = Math.max(lands + rippleSpan(m) + m.settle, leave + go.total)
    const home = homes?.[a] ?? nest
    const back = dive.play(ms.dive, g, { from: nest, to: home }, restedAt(open))
    steps.push({ at: open, play: back, m: ms.dive })
    // The one in focus stays under its section once it has dived in.
    const held = focus === a ? open + (back.gone ?? back.lands) : undefined
    return {
      spot,
      nest,
      home,
      boxes: role.boxes,
      travel,
      still: { at: 0, play: actionStill(ms.bounce, g, spot, since), m: ms.bounce },
      steps,
      since,
      leave,
      lands,
      open,
      gone: open + (back.gone ?? back.lands),
      settled: held ?? open + back.total,
      hold: held,
    }
  })
  // Each box once the agent that opens it is gone; a box no one opens, with the first of them.
  const first = parts.length ? Math.min(...parts.map((p) => p.gone)) : m.gather
  const by = new Map(parts.flatMap((p) => p.boxes.map((i) => [i, p] as const)))
  const reveals = boxes.map((_, i) => by.get(i)?.gone ?? first)
  return {
    parts,
    boxes: reveals,
    end: Math.max(m.gather, ...parts.map((p) => p.settled), ...reveals.map((at) => at + m.reveal)),
  }
}

/**
 * The cast at rest in its cells (`homes`) with no intro to play: once it is over and the grid is given another
 * field, or where it never played — under reduced motion, a grid mounted after it. Each breathes and blinks as if it
 * had sat there a while (`random`), by its Dive's values, as it rests once it has dived home. `still`, to be drawn once
 * and never again: each half way between two blinks, so none is drawn with its eyes shut.
 */
export function introResting(input: {
  g: SphereGeometry
  homes: readonly IntroCell[]
  motions: readonly IntroMotions[]
  still?: boolean
  /** The agent in focus, by its index: below its section, its cell at home empty. */
  out?: number
  /** Where the one in focus stands, below its section (`introBeside`); none, under it (`hold`). */
  outAt?: IntroCell | null
  random?: () => number
}): IntroPlan {
  const { g, homes, motions, still = false, out, outAt, random = Math.random } = input
  const parts = homes.map((home, a): IntroPart => {
    const ms = motions[a]!.dive
    const sat = (1 + random()) * Math.max(ms.blinkEvery, ms.breath, 1)
    const since = still && ms.blinkEvery > 0 ? sat - (sat % ms.blinkEvery) + ms.blinkEvery / 2 : sat
    if (a === out && !outAt) return introUnder(g, home, ms, sat)
    const at = a === out && outAt ? outAt : home
    return {
      spot: at,
      nest: home,
      home,
      boxes: [],
      travel: "dive",
      still: { at: 0, play: actionStill(ms, g, at, since), m: ms },
      steps: [],
      since,
      leave: Infinity,
      lands: Infinity,
      open: Infinity,
      gone: Infinity,
      settled: 0,
    }
  })
  return { parts, boxes: [], end: 0 }
}

/**
 * An agent under the page with no section to have dived into: the page in focus on a field the intro did not
 * play on. Held, from its start, at the moment its Dive home from its own cell is gone; `introComeHome` brings it up.
 */
function introUnder(g: SphereGeometry, home: IntroCell, m: SphereMotion, since: number): IntroPart {
  const back = agentAction("dive")!.play(m, g, { from: home, to: home }, since)
  const gone = back.gone ?? back.lands
  return {
    spot: home,
    nest: home,
    home,
    boxes: [],
    travel: "dive",
    still: { at: 0, play: actionStill(m, g, home, since), m },
    steps: [{ at: -gone, play: back, m }],
    since,
    leave: -Infinity,
    lands: -Infinity,
    open: -gone,
    gone: 0,
    settled: 0,
    hold: 0,
    ripple: false,
  }
}

/**
 * The agent in focus diving in as the page turns to its section: out of its cell at `home` by his Dive and up
 * in `nest`, below its section, its ripple spreading as it lands; the section fades in from `gone`, once the ripple has
 * spread, and it stays there, resting. `under`, with no cell below it: `nest` is the section's centre, and it dives
 * into it once the ripple has spread and it is at rest — the intro's own timing (`settle`) — and is held there, gone
 * behind the page, while the section fades in. `since`, how long it has sat at home: where its breath and its blinks are.
 */
export function introGoIn(input: { m: IntroMotion; g: SphereGeometry; home: IntroCell; nest: IntroCell; motions: IntroMotions; since: number; under?: boolean }): IntroPart {
  const { m, g, home, nest, motions, since, under = false } = input
  const dive = agentAction("dive")!
  const ms = motions.dive
  const go = dive.play(ms, g, { from: home, to: nest }, since)
  if (!under) {
    return {
      spot: home,
      nest,
      home,
      boxes: [],
      travel: "dive",
      still: { at: 0, play: actionStill(ms, g, home, since), m: ms },
      steps: [{ at: 0, play: go, m: ms }],
      since,
      leave: 0,
      lands: go.lands,
      open: Infinity,
      gone: go.lands + rippleSpan(m),
      settled: go.total,
    }
  }
  const open = Math.max(go.lands + rippleSpan(m) + m.settle, go.total)
  const back = dive.play(ms, g, { from: nest, to: home }, open - go.total)
  const gone = open + (back.gone ?? back.lands)
  return {
    spot: home,
    nest,
    home,
    boxes: [],
    travel: "dive",
    still: { at: 0, play: actionStill(ms, g, home, since), m: ms },
    steps: [
      { at: 0, play: go, m: ms },
      { at: open, play: back, m: ms },
    ],
    since,
    leave: 0,
    lands: go.lands,
    open,
    gone,
    settled: gone,
    hold: gone,
  }
}

/** Where an agent is at rest once its part is over: where its last step went, else where it sat. */
export const introRestsAt = (part: IntroPart): IntroCell => part.steps[part.steps.length - 1]?.play.to ?? part.spot

/**
 * The agent in focus going home as the page turns away from its section: from the cell below the section where it rests, `t` ms into its part, by his Dive, out of that
 * nest — which goes as it does (`introNestLeft`) — under the page and up into its cell at `home`. A part on a clock of its
 * own, from 0.
 */
export function introGoHome(input: { g: SphereGeometry; part: IntroPart; t: number; home: IntroCell; motions: IntroMotions }): IntroPart {
  const { g, part, t, home, motions } = input
  const ms = motions.dive
  const from = introRestsAt(part)
  const last = part.steps[part.steps.length - 1]
  const rested = Math.max(0, last ? t - (last.at + last.play.total) : t)
  const since = part.since + t
  const back = agentAction("dive")!.play(ms, g, { from, to: home }, rested)
  return {
    spot: from,
    nest: from,
    home,
    boxes: [],
    travel: "dive",
    still: { at: 0, play: actionStill(ms, g, from, since), m: ms },
    steps: [{ at: 0, play: back, m: ms }],
    since,
    leave: 0,
    lands: back.lands,
    open: 0,
    gone: back.gone ?? back.lands,
    settled: back.total,
    ripple: false,
  }
}

/**
 * An action played where the agent rests, `t` ms into its part — a click on it, say: his Bounce, or any action, from its cell back into it, as it moves in that action; then resting
 * there. A part on a clock of its own, from 0.
 */
export function introActHere(input: { g: SphereGeometry; part: IntroPart; t: number; action: IntroActionId; motions: IntroMotions }): IntroPart {
  const { g, part, t, action, motions } = input
  const m = motions[action]
  const at = introRestsAt(part)
  const last = part.steps[part.steps.length - 1]
  const rested = Math.max(0, last ? t - (last.at + last.play.total) : t)
  const since = part.since + t
  const play = agentAction(action)!.play(m, g, { from: at, to: at }, rested)
  return {
    spot: at,
    nest: at,
    home: part.home,
    boxes: [],
    travel: part.travel,
    still: { at: 0, play: actionStill(m, g, at, since), m },
    steps: [{ at: 0, play, m }],
    since,
    leave: 0,
    lands: play.lands,
    open: Infinity,
    gone: Infinity,
    settled: play.total,
    ripple: false,
  }
}

/** Whether an agent is in the air or under the page at `t`: an action it is in has not landed yet. */
export const introAway = (part: IntroPart, t: number) => {
  if (introHeld(part, t)) return true
  const last = part.steps[part.steps.length - 1]
  return !!last && t >= last.at && t < last.at + last.play.lands
}

/**
 * A held agent let go of: it carries on the Dive it was held in, under the page and up into its cell at
 * home, from where it was held — so the clock it is drawn on runs from `hold` ms before the page turned. Done once it has
 * come to rest there (`settled`).
 */
export function introComeHome(part: IntroPart): IntroPart {
  const last = part.steps[part.steps.length - 1]
  return { ...part, hold: undefined, ripple: false, settled: last ? last.at + last.play.total : part.settled }
}

/**
 * An agent at `t` ms into the intro: its moment of the step it is in, or past, and how it moves in it, its blinks on its
 * own clock. Held, it stays at `hold`, gone behind the page.
 */
export function introAt(part: IntroPart, t: number): { frame: AgentActionFrame; m: SphereMotion } {
  const at = part.hold === undefined ? t : Math.min(t, part.hold)
  let step = part.still
  for (const s of part.steps) {
    if (s.at > at) break
    step = s
  }
  return { frame: step.play.at(at - step.at, part.since + t), m: step.m }
}

/** Whether an agent is held under the page at `t`: nothing of it is drawn. */
export const introHeld = (part: IntroPart, t: number) => part.hold !== undefined && t >= part.hold

/**
 * How much of the nest it landed in is left at `t`: all of it until it dives home, then going back to the field's own
 * cell as it goes out of it, none once it is gone.
 */
export function introNestLeft(part: IntroPart, t: number): number {
  return t < part.open ? 1 : 1 - clamp01((t - part.open) / Math.max(1, part.gone - part.open))
}

/** From a ripple's first ring lighting to its last, ms. */
const rippleSpan = (m: IntroMotion) => Math.max(0, m.ripple - 1) * m.ring

/** The field, as a ripple is counted on it. */
export type IntroField = { cols: number; rows: number; cell: number; gap: number }

/**
 * An agent's ripple, landing in `nest`, small: when each cell of the field lights, ms after it touches down, reading
 * order — one pass of the field's painter — and the last's. A cell is in
 * the ring of the whole pitches its centre is out from the nest's edge, the cells round the nest the first; those
 * `ripple` rings out and more never light (Infinity), nor the nest's own cell, under it.
 */
export function introRipple({ cols, rows, cell, gap }: IntroField, nest: IntroCell, m: IntroMotion): { delays: Float64Array; span: number } {
  const g = { cell, gap }
  const delays = new Float64Array(cols * rows).fill(Infinity)
  let span = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c === nest.col && r === nest.row) continue
      const ring = ringOf(g, nest, { col: c, row: r })
      if (ring >= m.ripple) continue
      delays[r * cols + c] = ring * m.ring
      span = Math.max(span, ring * m.ring)
    }
  }
  return { delays, span }
}
