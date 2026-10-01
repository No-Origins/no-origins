import { actionDefaults, actionStill, agentAction, checkActionValues, type AgentActionFrame, type AgentActionPlay } from "@no-origins/ui/lib/agent-actions"
import type { CharacterLook } from "@no-origins/ui/lib/agent-body"
import { motionMs, motionNumber } from "@no-origins/ui/lib/motion"
import type { PropertyValues } from "@no-origins/ui/lib/properties"
import { sphereBeats, type SphereGeometry, type SphereMotion } from "@no-origins/ui/lib/sphere-motion"

/**
 * The intro (Grid.md D50, Motion.md M22), pure: who stands where, what each does and when, which cells its ripple lights,
 * and when each box comes in.
 *
 * **Version 8, home** (his, 2026-10-01: "after the intro scene, once the agents jump into their sections and dive, they
 * all should uh, come and settle in the last row middle six columns cells", and before it was built: "instead of uh,
 * bringing them to the bottom, we'll bring them to the right the last most column vertically centered"). Version 7 as
 * it is until the ripple has spread, but where each goes then:
 *
 * - **Each has a cell of its own in the last column** (`introHome`): the cast one above the other in the field's
 *   right-most column, centred down it, in the cast's order — on the portfolio Bali, Kino, Zaza, Oru, Mira and Lola
 *   from the top.
 * - **Its dive into its nest is his Dive to that cell** (`open`): his action as he published it, out of its nest
 *   behind the page the way it is going and up into its cell, carrying on into its bowl. Version 7's own sink, straight
 *   down through the nest over `dive`, went with the token. It dives once its ripple has spread and its landing has come
 *   to rest, whichever is later: the Dive sets off from the agent sitting in its nest.
 * - **Its nest goes as it dives into it** (`introNestLeft`), version 7's rule, over the Dive's going out of it; the
 *   cell it comes up in lights while it is under, as the Dive lights it, and stays lit.
 * - **Its boxes fade in once it is gone** (`gone`), as in version 7.
 * - **It stays**: in its cell, breathing and blinking, once the intro is over, and on any field the grid is given after
 *   it, or where it never played (`introResting`).
 *
 * **Version 7, the small ripple and then the page** (his, 2026-10-01: "the ripple is now more stuttering it's not smooth
 * and then also it stops at the borders of the section and which is weird so i don't think we need such big uh,
 * ripples i think we can just have small ripples and uh, once the ripple ends we can drop the agents and then render
 * the components"). Version 6 as it is, but how each lands and how its boxes come in:
 *
 * - **Its ripple is small again** (`introRipple`): version 3's, `ripple` rings out from its nest's edge, whatever the
 *   boxes round it; it no longer crosses them or stops at their edges.
 * - **Once it has spread, the agent drops** (`settle`): `settle` after its last ring lights, it dives into its nest.
 * - **Its nest goes as it dives** (`introNestLeft`): the lime ring and its tint fade back to the field's own cell over
 *   the dive (his, the same evening), so the cell is plain by the time it is gone.
 * - **Then its components render** (`reveal`): once it is gone, every box it opens fades in over `reveal`. Opacity only, which the compositor plays: version 4's cell-by-cell clip, re-cut on the main thread
 *   a ring at a time, is what stuttered, and it went with `behind` and `lace`.
 *
 * **Version 6, cells and rest** (his, 2026-10-01: "those who are not bouncing should uh, be in the rest motion. And I
 * also saw that uh, after bouncing, they just randomly appear over uh, some cell which is not part of the grid … They
 * should actually drop into the cells on the grid"). Version 5 as it is, but:
 *
 * - **Every nest is a cell of the field** (`introCast`): where the boxes' middle falls between cells, the cell next to
 *   it that is in one of the boxes, the first in reading order. Version 4's half-way nests are gone.
 * - **Each is seen resting** (`since`): its rest — Breath and blinks, the agent's own (`SPHERE_START`) — plays as if it
 *   had sat one to two Blink every already, at random, so each breathes at its own phase and blinks at its own moment
 *   while they stand. From a start of nothing, all six were half a breath in when they left, and none had blinked.
 *
 * **Version 5, the row** (his, 2026-10-01: "instead of placing this agent's uh, randomly let's place them in uh, row in
 * a line uh, without any gaps in between them uh, their order will be random and also not all the agents will bounce
 * um, let's only make uh, Bali Kino and uh, Mira to bounce"). Version 4 as it is, but how they stand and who bounces:
 *
 * - **They stand in a row** (`introSpots`): a cell each, side by side with no cell between, centred on the field's
 *   middle row — the upper of its two middle rows, since a field's rows are even (D26) — or the nearest row to it that
 *   no agent lands in. Who stands in which cell is random, a different order every load.
 * - **Only some bounce** (`IntroAgent.bounces`, the page's to say): on the portfolio Bali, Kino and Mira. The rest sit
 *   in their nests, breathing and blinking, until they leave.
 *
 * **Version 4, the centre and the ripple** (his, the same day: "the agent should jump to the center of the sections that
 * it is rendering. And uh, instead of uh, expanding these sections from top left they should render along with the uh,
 * ripple"). Version 3 as it was, but where each lands and how its boxes come in:
 *
 * - **It lands on the centre of the boxes it opens** (`introCast`): the middle of the rectangle round them all — a cell
 *   where it is an odd number of cells across, and until version 6 half way between two where it is even. An agent
 *   that opens none sits where version 3 sat it, on the box that names it, a tab on a phone.
 * - **Its ripple crossed them**, until version 7: over every cell of the boxes it opens and a ring past their edges,
 *   each cell of a box coming in a ring's time behind it, its disc and then its tile (D40's lace), the box clipped to
 *   them. It stuttered and stopped at the boxes' edges (his).
 *
 * Version 3 (the same day, his: "Since we have now defined the motions for uh, dive, jump and bounce, in
 * intro, intro will be a three second sequence where all the six agents are randomly placed within the center four by
 * four cells and then they will randomly keep bouncing not together random agents will bounce at random times with
 * random frequency for uh, two seconds and then randomly some agents will dive and some agents will jump to their
 * positions and um, once they reach their destination cell we should have the ripple the first type of ripple that we
 * had … but that should happen for all the agents with small radius"). It plays his three actions
 * (`lib/agent-actions`, M24) as he published them, each agent as its look makes it; nothing of the move is the intro's.
 *
 * - **They stood at random**, until version 5: six cells picked at random from the field's centre four by four — a
 *   different six every load — never a cell an agent lands on; each agent in the one of them that, all told, left the
 *   cast least to travel, so they fanned out.
 * - **They bounce, not together** (`gather`, `first`, `rest`; all of them until version 5, those that `bounces` since):
 *   each its first Bounce at a random moment in the first
 *   `first`, and again at its own pace — a wait it picks up to `rest`, each wait varying round it — so some bounce
 *   often and some seldom. A bounce may start once the last has come to rest; its settle, a jiggle his Bounce does not
 *   squash, is cut by the next. Nothing bounces that would not be at rest when it leaves.
 * - **They leave, some diving and some jumping** (`leave`): each at a random moment in the `leave` after `gather`, by a
 *   Jump or a Dive picked at random — at least one of each — to the nest it lands in (`introCast`): the TOP-LEFT cell of
 *   the box it opened first until version 4.
 * - **Each lands and its ripple spreads** (`ripple`, `ring`): version 1's ripple (2026-09-30) — as it first touches down
 *   in its nest, the cells round it light ring by ring out from the nest's edge, `ring` apart, in violet, each fading as
 *   the pointer's cell does; two rings out, as again since version 7 (versions 4 to 6 crossed its boxes). One pass of
 *   the field's painter an agent (`introRipple`), so two that cross each light their cells.
 * - **It dives into its nest**: in version 3 `settle` after landing, through the page's opening, over `dive`, and the
 *   nest opened into the box by his loader's opening (M10), the other boxes following `cascade` a pitch.
 *
 * Every box is someone's: one that names no agent of the cast is opened by the nearest. An agent no box is opened by
 * lands on the box that names it (its first), or else on the biggest, beside the one that opens it, along its top row —
 * on a phone, four of them on the tabs bar, one a tab.
 *
 * Version 2 (2026-10-01, the six): they gathered in his loader's square on the centre, breathing, and leapt all at once
 * on an arc of the intro's own, every one in the air the same time. Version 1 (2026-09-30): one agent in the avatar's
 * ring, a hop in place, the field lit ring by ring from it out to its far corner.
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
}

/**
 * Version 8 (2026-10-01, mine but `gather`): version 3's bouncing, leaving and ripple — two rings, 80ms apart; the dive
 * home 250ms after the ripple's last ring, so the ripple is seen spread before the agent goes; and the boxes fading in
 * over version 1's 500ms, his first "the card should render smoothly". Version 7's `dive`, its own sink's 320ms, is his
 * Dive's since version 8.
 */
export const INTRO_START: IntroMotion = { gather: 2000, first: 500, rest: 700, leave: 300, ripple: 2, ring: 80, settle: 250, reveal: 500 }

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
  }
}

/**
 * An agent of the cast: its name, which the page's boxes name it by (`data-intro-by`), its look, and whether it bounces
 * while the cast stands in its row (version 5; it does unless the page says not).
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
 * one of the boxes, else the first — always a cell of the field (his, 2026-10-01: "They should actually drop into the
 * cells on the grid"; version 4 stood a nest half way between two).
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
 * in the cast, and an agent that opens any lands on the centre of them (version 4). One left with none lands on the
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
  // have had — on a phone's tabs bar, each over its own tab.
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
 * Where each agent stands as the intro starts, a field `cols` × `rows` (version 5, his): side by side in one row, a cell
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
 * Where each of `n` agents settles once the intro is over, a field `cols` × `rows` (version 8, his): one above the other
 * in its last column, a cell each, centred down it, in the cast's order from the top — the fourth row to the ninth of a
 * field twelve deep, since a field's rows are even (D26). A cast taller than the field goes on in the column left of it.
 */
export function introHome(n: number, cols: number, rows: number): IntroCell[] {
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
  /** Its cell in the last column, where it settles (version 8). */
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
}

/** The intro, played: each agent's part, when each box of the page starts to fade in, and when it is all over. */
export type IntroPlan = { parts: IntroPart[]; boxes: number[]; end: number }

/**
 * Which ring of a ripple from `nest` the cell `c` is in (version 1's count): the whole pitches its centre is out from the
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
  random?: () => number
}): IntroPlan {
  const { m, g, roles, spots, homes, motions, boxes, bounces, random = Math.random } = input
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
    const go = agentAction(travel)!.play(ms[travel], g, { from: spot, to: nest }, restedAt(leave))
    steps.push({ at: leave, play: go, m: ms[travel] })
    const lands = leave + go.lands
    // Home, by his Dive (version 8): once its ripple has spread — its last ring lit, and `settle` more — and its landing
    // has come to rest, since a Dive sets off from the agent sitting in its nest.
    const open = Math.max(lands + rippleSpan(m) + m.settle, leave + go.total)
    const home = homes?.[a] ?? nest
    const back = dive.play(ms.dive, g, { from: nest, to: home }, restedAt(open))
    steps.push({ at: open, play: back, m: ms.dive })
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
      settled: open + back.total,
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
 * The cast at rest in its cells (`homes`) with no intro to play (version 8): once it is over and the grid is given another
 * field, or where it never played — under reduced motion, a grid mounted after it. Each breathes and blinks as if it
 * had sat there a while (`random`), by its Dive's values, as it rests once it has dived home. `still`, to be drawn once
 * and never again: each half way between two blinks, so none is drawn with its eyes shut.
 */
export function introResting(input: {
  g: SphereGeometry
  homes: readonly IntroCell[]
  motions: readonly IntroMotions[]
  still?: boolean
  random?: () => number
}): IntroPlan {
  const { g, homes, motions, still = false, random = Math.random } = input
  const parts = homes.map((home, a): IntroPart => {
    const ms = motions[a]!.dive
    const sat = (1 + random()) * Math.max(ms.blinkEvery, ms.breath, 1)
    const since = still && ms.blinkEvery > 0 ? sat - (sat % ms.blinkEvery) + ms.blinkEvery / 2 : sat
    return {
      spot: home,
      nest: home,
      home,
      boxes: [],
      travel: "dive",
      still: { at: 0, play: actionStill(ms, g, home, since), m: ms },
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

/** An agent at `t` ms into the intro: its moment of the step it is in, or past, and how it moves in it, its blinks on its own clock. */
export function introAt(part: IntroPart, t: number): { frame: AgentActionFrame; m: SphereMotion } {
  let step = part.still
  for (const s of part.steps) {
    if (s.at > t) break
    step = s
  }
  return { frame: step.play.at(t - step.at, part.since + t), m: step.m }
}

/**
 * How much of the nest it landed in is left at `t`: all of it until it dives home, then going back to the field's own
 * cell as it goes out of it, none once it is gone (his, 2026-10-01: "the cell border should also turn to its default
 * state while the agent is diving").
 */
export function introNestLeft(part: IntroPart, t: number): number {
  return t < part.open ? 1 : 1 - clamp01((t - part.open) / Math.max(1, part.gone - part.open))
}

/** From a ripple's first ring lighting to its last, ms. */
const rippleSpan = (m: IntroMotion) => Math.max(0, m.ripple - 1) * m.ring

/** The field, as a ripple is counted on it. */
export type IntroField = { cols: number; rows: number; cell: number; gap: number }

/**
 * An agent's ripple, landing in `nest` (version 3's, small): when each cell of the field lights, ms after it touches
 * down, reading order — one pass of the field's painter — and the last's. As version 1 counted its rings: a cell is in
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
