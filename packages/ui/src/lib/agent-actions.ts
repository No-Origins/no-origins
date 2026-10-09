import { AGENT_BODY } from "./agent-body"
import { AGENT_FACE } from "./agent-face"
import { checkValue, defaultsOf, type PropertyValue, type PropertyValues, type Setting } from "./properties"
import {
  sphereArrival, sphereBeats, sphereCourse, sphereFrame, sphereStill,
  type SphereCell, type SphereFrame, type SphereGeometry, type SphereMotion, type SphereTrip,
} from "./sphere-motion"

/**
 * THE AGENT'S ACTIONS (Motion.md M24): the things an agent does, each by its name, in code, each with the controls he
 * tunes in the motion studio.
 *
 * - **An action is only what he names.** Each is declared here: its name, its controls in groups (typed properties,
 *   `./properties`, the motion studio's cards), and how it plays, worked out from them by the physics the agent already
 *   has (`./sphere-motion`). A new kind of move is a new action here, which he then tunes in the studio. Bounce, Jump
 *   and Dive are the three.
 * - **Its controls are its own.** They are the agent's motion settings (`set: "motion"` in `./agent-body` and
 *   `./agent-face`, so the one reader, `sphereMotionFrom`, reads them), with this action's labels and defaults; an
 *   action's values are kept apart from every other's. The character's look stands under them, and its Material still
 *   shapes every action: a ball lands firmer and slime oozes, whatever the action.
 * - **Its length follows from its controls** (his answer): there is no length to set. A play's `phases` mark its parts
 *   in order, each as long as its controls make it, and add up to its `total`.
 * - **The rest is always there** (his answer): an action sets off from the agent sitting in its nest, breathing and
 *   blinking, and hands back to it. What it does not set is the declaration's default (`SPHERE_START`).
 * - **One that travels** goes from its nest to another, where its Columns and Rows say, or where it is sent.
 *
 * Pure: no element, no clock. What he picks for an action is data, in the studios' drafts and versions.
 */

export type AgentActionGroup = { id: string; label: string; settings: readonly Setting[] }

/** A part of an action, named as the studio's timeline shows it, as long as it lasts, and what it is in a line. */
export type AgentActionPhase = { label: string; ms: number; note: string }

/** A nest's circle, px: what a dive is cut to. */
export type AgentActionNest = { x: number; y: number; r: number }

/**
 * What a dive is cut to at a nest: its `circle`, the page's opening, while it goes out of it or comes into it behind the
 * page; or its `bowl` (`sphereBowl`: the circle's lower half and everything over its middle), as it pops up out of it.
 */
export type AgentActionCut = { nest: AgentActionNest; by: "circle" | "bowl" }

/**
 * One moment of an action, to draw: the agent's frame; how far it has moved behind the page from where the frame draws
 * it, px (a dive's); what it is cut to as it does; and whether it is gone behind the page, nothing of it drawn.
 */
export type AgentActionFrame = { frame: SphereFrame; shift: { x: number; y: number }; cut: AgentActionCut | null; hidden: boolean }

const STILL = { x: 0, y: 0 }

/** An action played from one nest: where it sits once it is over, how long it is, its parts, and any moment of it. */
export type AgentActionPlay = {
  to: SphereCell
  total: number
  /** When it first touches down in the nest it ends in, ms in: where the intro's ripple starts (Motion.md M22). */
  lands: number
  /** When it is gone behind the page, ms in: a dive's, out of the nest it left. None for an action that stays in front. */
  gone?: number
  phases: AgentActionPhase[]
  /** Its moment `t` ms in, the blinks on their own clock `blinkAt`; past its end, sitting where it went. */
  at: (t: number, blinkAt?: number) => AgentActionFrame
}

export type AgentAction = {
  /** Its key in code and in its saved draft. */
  id: string
  /** What he calls it. */
  label: string
  /** What it is, in a line. */
  touches: string
  /** Its design's version, which a change to how it moves in code makes the next. */
  version: number
  /** Whether it goes to another nest: Columns and Rows say where, and on the studio's stage a click on a cell. */
  travels: boolean
  groups: readonly AgentActionGroup[]
  /** The action from `trip.from` (to `trip.to`, where it travels), `rested` ms after the agent got there. */
  play: (m: SphereMotion, g: SphereGeometry, trip: SphereTrip, rested?: number) => AgentActionPlay
}

/** Every motion setting the agent declares, by id. */
const DECLARED = new Map<string, Setting>(
  [...AGENT_BODY.flatMap((g) => g.settings), ...AGENT_FACE.flatMap((s) => s.settings)]
    .filter((s) => s.set === "motion")
    .map((s) => [s.id, s]),
)

/** A declared setting as this action offers it: its own label, line and default where it says so. */
function own(id: string, change: { label?: string; touches?: string; default?: PropertyValue } = {}): Setting {
  const s = DECLARED.get(id)
  if (!s) throw new Error(`The agent declares no motion setting ${id}`)
  return { ...s, ...change } as Setting
}

/** A phase shorter than this, ms, is folded into the one after it: too short to see as its own part. */
const SLIVER = 40

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const smooth = (t: number) => {
  const p = clamp01(t)
  return p * p * (3 - 2 * p)
}
const centre = (c: SphereCell, g: SphereGeometry) => ({ x: c.col * (g.cell + g.gap) + g.cell / 2, y: c.row * (g.cell + g.gap) + g.cell / 2 })

/** The agent sitting in `cell`, breathing and blinking: a play that never ends, and never goes anywhere. */
export function actionStill(m: SphereMotion, g: SphereGeometry, cell: SphereCell, rested = 0): AgentActionPlay {
  const course = sphereStill(m, g, cell, rested)
  return { to: cell, total: 0, lands: 0, phases: [], at: (t, blinkAt = t) => ({ frame: sphereFrame(course, t, blinkAt), shift: STILL, cut: null, hidden: false }) }
}

/**
 * `before`, and what follows its landing, from its beats: each bounce off the floor, a slide where it landed off the
 * bottom, and — where the action keeps one — the settle, its jiggle dying out. A sliver left before it is still goes to
 * the settle, or with none to the phase before it. **Jump and Dive keep none** (his, 2026-10-01: *"I don't think we need
 * settle in this uh, for dive and jump"*): they are over once it has come to rest in the nest it reached, and what is
 * left of its jiggle dies out in the rest after.
 */
function landed(before: readonly AgentActionPhase[], b: { hits: readonly number[]; still: number; settle: number }, settle: boolean): AgentActionPhase[] {
  const out = before.filter((p) => p.ms > 0)
  let last = 0
  b.hits.forEach((hit, i) => {
    out.push({ label: `bounce ${i + 1}`, ms: hit - last, note: `Off its nest's floor and back, ${i + 1} of ${b.hits.length}` })
    last = hit
  })
  const left = b.still - last
  if (left >= SLIVER) out.push({ label: "come back", ms: left, note: "Sliding round its nest and back to the bottom" })
  if (settle) out.push({ label: "settle", ms: b.settle + (left >= SLIVER ? 0 : left), note: "Jiggling still, then resting" })
  else if (left > 0 && left < SLIVER && out.length) out[out.length - 1] = { ...out[out.length - 1]!, ms: out[out.length - 1]!.ms + left }
  return out.filter((p) => p.ms > 0)
}

/**
 * A crouch, a leap and a landing, from one nest to `trip.to` — the same nest, a bounce — as one course; `settle`, with
 * the jiggle dying out after it is still (Bounce's), or over once it is (Jump's).
 */
function leapPlay(m: SphereMotion, g: SphereGeometry, trip: SphereTrip, rested: number, settle: boolean): AgentActionPlay {
  const course = sphereCourse(m, g, trip, rested)
  const b = sphereBeats(m, g, trip)
  const phases = landed([
    { label: "crouch", ms: b.crouch, note: "Squatting before it leaps" },
    { label: "rise", ms: b.rise, note: "Up to the top of its leap" },
    { label: "fall", ms: b.fall, note: "Down into the nest it reaches" },
  ], b, settle)
  const total = settle ? course.total : course.total - b.settle
  return { to: trip.to, total, lands: b.crouch + b.rise + b.fall, phases, at: (t, blinkAt = t) => ({ frame: sphereFrame(course, t, blinkAt), shift: STILL, cut: null, hidden: false }) }
}

/**
 * A dive, diving behind the screen from one cell to another: it crouches, springs up out of its nest (`spring`; 0, it
 * slips straight in) and comes back down into it — into the page's opening — and goes out of it behind the page **the
 * way it is going**, cut to the nest's circle, until it is gone; it is behind the page for `under`, its nest going out
 * and the next one lighting; and it glides into the next nest behind the page the way it is going, on the line through
 * its middle, and **carries on** in front of it, following its inertia: coming up from under, it flies up out of the nest and falls back in; from the side, it arcs into the bowl and slides up
 * its far side and back; from above, it drops onto the floor (`sphereArrival`). It comes in as fast as falling `pop`
 * would make it. **One gravity** for all of it: slipping straight down out of its nest from rest takes `dive`, so the
 * spring, the going out and the coming in take as long as their distances make them.
 */
function divePlay(m: SphereMotion, g: SphereGeometry, trip: SphereTrip, rested = 0): AgentActionPlay {
  const pitch = g.cell + g.gap
  const { from, to } = trip
  const R = (m.size * g.cell) / 2
  const ring = g.cell / 2 - 1
  const track = Math.max(1, ring - R)
  const [a, z] = [centre(from, g), centre(to, g)]
  // The way it goes, as a unit: toward the next nest. Diving back into its own, it goes straight down out of it and
  // comes back up the way it went.
  const span = Math.hypot(z.x - a.x, z.y - a.y)
  const way = span > 0 ? { x: (z.x - a.x) / span, y: (z.y - a.y) / span } : { x: 0, y: 1 }
  const arriving = span > 0 ? way : { x: 0, y: -1 }
  // How far from its seat it goes along `dir` to be out of its nest's circle, px: the seat is low in the circle, so
  // down is its own height, up the circle across, and a little more for its spread.
  const margin = g.cell * 0.2
  const outOf = (dir: { x: number; y: number }) => {
    const along = (ring - R) * dir.y
    return -along + Math.sqrt(along * along - (ring - R) ** 2 + (ring + R) ** 2) + margin
  }
  // One gravity: slipping straight down out of its nest from rest, its own height and more, takes `dive`.
  const G = (2 * outOf({ x: 0, y: 1 })) / (m.dive * m.dive)
  const heightOf = (cells: number) => Math.max(cells * pitch, pitch * 0.25)
  // The crouch and the spring, in its own nest: a leap in place that high, under that gravity.
  const sprung = m.spring > 0
  const springH = heightOf(m.spring)
  const springHang = 2 * Math.sqrt((2 * springH) / G)
  const up = sphereCourse({ ...m, height: m.spring, hang: springHang, landAt: 0, bounces: 0 }, g, { from, to: from }, rested)
  const going = m.crouch + (sprung ? springHang : 0)
  // Out of its nest the way it goes, keeping what of the spring's fall is that way, until it is gone.
  const exit = outOf(way)
  const v0 = (sprung ? Math.sqrt(2 * G * springH) : 0) * Math.max(0, way.y)
  const leaving = (-v0 + Math.sqrt(v0 * v0 + 2 * G * exit)) / G
  const gone = going + leaving
  const under = Math.max(0, m.under)
  const out = gone + under
  // Into the next nest behind the page, on the line through its middle the way it comes, at the speed falling `pop`
  // gives, from out of its circle to the bowl's track; there, in front of the page, it carries on and the bowl takes it.
  const popH = heightOf(m.pop)
  const speed = Math.sqrt(2 * G * popH)
  const onTrack = { x: -arriving.x * track, y: -arriving.y * track }
  const glide = ring + R + margin - track
  const coming = glide / speed
  const arrival = sphereArrival(m, g, to, onTrack, { x: arriving.x * speed, y: arriving.y * speed }, G, m.first * popH)
  const at0 = out + coming
  // Over once it has come to rest in the next nest: no settle (his).
  const total = at0 + arrival.still

  const sitFrom = sphereStill(m, g, from, rested)
  const circleA: AgentActionCut = { nest: { ...a, r: ring }, by: "circle" }
  const circleB: AgentActionCut = { nest: { ...z, r: ring }, by: "circle" }
  const bowlB: AgentActionCut = { nest: { ...z, r: ring }, by: "bowl" }
  const along = (d: number) => ({ x: way.x * d, y: way.y * d })
  // Gliding in: as it will be on the track, short of it by what is left of the glide.
  const shortOf = (left: number) => ({ x: -arriving.x * left, y: -arriving.y * left })
  // Its nest goes out as it is gone, quickly; the next lights while it is under.
  const litA = (t: number) => (t < gone ? 1 : under > 0 ? 1 - smooth((t - gone) / (0.4 * under)) : 0)
  const litB = (t: number) => (t < gone ? 0 : under > 0 ? smooth((t - gone) / under) : 1)
  const withNests = (f: SphereFrame, t: number, here: 0 | 1): SphereFrame => {
    const own = f.nests[0]
    const nests: SphereFrame["nests"] = here === 0
      ? [{ ...own, lit: litA(t) }, { x: z.x, y: z.y, r: g.cell / 2, lit: litB(t) }]
      : [{ x: a.x, y: a.y, r: g.cell / 2, lit: litA(t) }, { ...own, lit: litB(t) }]
    return { ...f, nests }
  }

  // After it comes in: carried on into the bowl until it first lands, then the landing's bounces, slide and settle.
  const [first, ...more] = arrival.hits
  const carried = first ?? arrival.still
  const phases = landed([
    { label: "crouch", ms: m.crouch, note: "Squatting before it springs" },
    { label: "spring", ms: sprung ? springHang : 0, note: "Up out of its nest and back down into it" },
    { label: "dive", ms: leaving, note: "Out of its nest behind the page, the way it is going, until it is gone" },
    { label: "under", ms: under, note: "Behind the page, to the next nest" },
    { label: "come in", ms: coming, note: "Into the next nest behind the page, the way it is going" },
    { label: "carry", ms: carried, note: "Carried on the way it was going, out of the nest's opening and into its bowl" },
  ], { hits: more.map((h) => h - carried), still: arrival.still - carried, settle: arrival.settle }, false)

  return {
    to,
    total,
    lands: at0 + carried,
    gone,
    phases,
    at: (t, blinkAt = t) => {
      if (t < going) return { frame: withNests(sphereFrame(up, t, blinkAt), t, 0), shift: STILL, cut: null, hidden: false }
      if (t < gone) {
        const u = t - going
        return { frame: withNests(sphereFrame(sitFrom, t, blinkAt), t, 0), shift: along(v0 * u + 0.5 * G * u * u), cut: circleA, hidden: false }
      }
      if (t < at0) {
        const left = t < out ? glide : glide - speed * (t - out)
        return { frame: withNests(sphereFrame(arrival.course, 0, blinkAt), t, 1), shift: shortOf(left), cut: circleB, hidden: t < out }
      }
      return { frame: withNests(sphereFrame(arrival.course, t - at0, blinkAt), t, 1), shift: STILL, cut: bowlB, hidden: false }
    },
  }
}

/** Where a traveller goes, as an action offers it: its columns and its rows, in whole cells. */
const where = (columns: number): AgentActionGroup => ({
  id: "where",
  label: "Where",
  settings: [
    own("columns", { touches: "How far across: right +, left −", default: columns }),
    own("rows", { touches: "Down +, up −; with columns, a diagonal", default: 0 }),
  ],
})

/** The tail's swing, at his values (`SPHERE_START`). */
const TAIL: AgentActionGroup = { id: "tail", label: "Tail", settings: [own("stiffness"), own("swing"), own("stretch")] }

/**
 * **Bounce, version 1**: it crouches in its nest, leaps straight up, falls back into the same nest, bounces off its
 * floor — each bounce lower than the last — and settles. Landing off the bottom of its nest (`Land at`), it slides
 * round the bowl and comes back, as a jump's landing does.
 */
const BOUNCE: AgentAction = {
  id: "bounce",
  label: "Bounce",
  touches: "It leaps straight up out of its nest, falls back into it, bounces off its floor and settles.",
  version: 1,
  travels: false,
  groups: [
    {
      id: "take-off",
      label: "Take-off",
      settings: [
        own("crouch", { touches: "Squatting before it leaps, 0 none", default: 140 }),
        own("squat", { touches: "How low the crouch squashes it", default: 0.3 }),
      ],
    },
    {
      id: "leap",
      label: "Leap",
      settings: [
        own("height", { touches: "How high over its nest, in cells", default: 1 }),
        own("hang", { label: "Air time", touches: "From leaving its nest to landing back in it", default: 560 }),
      ],
    },
    {
      id: "bounces",
      label: "Bounces",
      settings: [
        own("bounces", { touches: "Off its nest's floor after it lands, 0 none", default: 3 }),
        own("first", { touches: "The first one's height, of the leap's", default: 0.6 }),
        own("bounciness", { touches: "Each one's height, of the one before", default: 0.55 }),
        own("squash", { touches: "How flat each landing presses it", default: 0.35 }),
        own("give", { touches: "How far the nest dips under each landing", default: 0.12 }),
      ],
    },
    {
      id: "after",
      label: "After landing",
      settings: [
        own("wobble", { touches: "How long it jiggles once it has landed", default: 280 }),
        own("wobble-speed", { touches: "One jiggle, flat to tall and back", default: 200 }),
        own("land-at", { touches: "Where it comes down in its nest: 0 its bottom, − left, + right; off the bottom it slides", default: 0 }),
        own("slippery", { touches: "Landing off the bottom, the speed it keeps along the bowl: 1 all, 0 sticks", default: 1 }),
        own("slide-way", { default: "with" }),
        own("energy", { touches: "How lively it slides and comes back, 0 lazy", default: 0.53 }),
        own("come-back", { touches: "From landing off the bottom to rest; longer and lively, it rocks", default: 500 }),
        own("sway", { touches: "How far its jelly leans as it slides", default: 0.3 }),
        own("squeeze", { touches: "Squished along its way as it slides and brakes", default: 0.2 }),
      ],
    },
    TAIL,
    {
      id: "eyes",
      label: "Eyes",
      settings: [
        own("look", { touches: "How far they look where it is going: up as it rises, down as it falls", default: 0.8 }),
        own("squint", { touches: "How shut each landing squeezes them", default: 0.6 }),
      ],
    },
  ],
  play: (m, g, trip, rested = 0) => leapPlay(m, g, { from: trip.from, to: trip.from }, rested, true),
}

/**
 * **Jump, version 1**: the agent's hop over the cells, nest to nest — a crouch, an arc over the cells under one
 * gravity, a landing in the nest it reaches that bounces, slides round the bowl and comes back, and the settle. Its
 * defaults are his (`SPHERE_START`), going three cells across.
 */
const JUMP: AgentAction = {
  id: "jump",
  label: "Jump",
  touches: "It leaps from its nest over the cells into another, lands, slides round it and settles.",
  version: 1,
  travels: true,
  groups: [
    where(3),
    { id: "take-off", label: "Take-off", settings: [own("crouch"), own("squat")] },
    { id: "leap", label: "Leap", settings: [own("height"), own("hang", { label: "Air time", touches: "From leaving its nest to landing in the next" })] },
    { id: "landing", label: "Landing", settings: [own("bounces"), own("first"), own("bounciness"), own("squash"), own("give")] },
    {
      id: "after",
      label: "After landing",
      settings: [own("land-at"), own("slippery"), own("slide-way"), own("energy"), own("come-back"), own("sway"), own("squeeze"), own("wobble"), own("wobble-speed")],
    },
    TAIL,
    { id: "eyes", label: "Eyes", settings: [own("look"), own("look-lead"), own("squint")] },
  ],
  play: (m, g, trip, rested = 0) => leapPlay(m, g, trip, rested, false),
}

/**
 * **Dive, version 2**: into its nest, out of it behind the page the way it is going, and on into another, carried by its inertia
 * (`divePlay`).
 */
const DIVE: AgentAction = {
  id: "dive",
  label: "Dive",
  touches: "It springs up, dives into its nest and out of it behind the page the way it is going, and carries on into another.",
  version: 2,
  travels: true,
  groups: [
    where(3),
    {
      id: "take-off",
      label: "Take-off",
      settings: [
        own("crouch", { touches: "Squatting before it springs, 0 none", default: 100 }),
        own("squat", { touches: "How low the crouch squashes it", default: 0.25 }),
      ],
    },
    { id: "dive", label: "Dive", settings: [own("spring"), own("dive"), own("under"), own("pop")] },
    {
      id: "landing",
      label: "Landing",
      settings: [
        own("bounces", { touches: "Off the next nest's floor after it lands, 0 none", default: 1 }),
        own("first", { touches: "The first one's height, of the pop's", default: 0.4 }),
        own("bounciness", { default: 0.4 }),
        own("squash", { touches: "How flat landing presses it", default: 0.35 }),
        own("give", { touches: "How far the nest dips as it lands", default: 0.12 }),
        own("wobble", { touches: "How long it jiggles once it has landed", default: 260 }),
        own("wobble-speed", { touches: "One jiggle, flat to tall and back", default: 200 }),
      ],
    },
    {
      // Coming in from the side, it slides up the bowl's far side and back, as a jump's landing does.
      id: "after",
      label: "After landing",
      settings: [
        own("slippery", { touches: "The speed it keeps along the bowl as it lands: 1 all, 0 sticks", default: 1 }),
        own("slide-way", { default: "with" }),
        own("energy", { touches: "How lively it is in the bowl, 0 lazy", default: 0.53 }),
        own("come-back", { touches: "From landing to rest; longer and lively, it rocks", default: 500 }),
        own("sway", { touches: "How far its jelly leans as it slides", default: 0.3 }),
        own("squeeze", { touches: "Squished along its way into the bowl's side and as it brakes", default: 0.2 }),
      ],
    },
    TAIL,
    {
      id: "eyes",
      label: "Eyes",
      settings: [
        own("look", { touches: "How far they look where it is going: up as it springs, down as it dives", default: 0.8 }),
        own("squint", { touches: "How shut landing squeezes them", default: 0.6 }),
      ],
    },
  ],
  play: divePlay,
}

/** Every action there is, in the order the studio offers them. */
export const AGENT_ACTIONS: readonly AgentAction[] = [BOUNCE, JUMP, DIVE]

export const agentAction = (id: string): AgentAction | undefined => AGENT_ACTIONS.find((a) => a.id === id)

/** Every control an action offers, in its groups' order. */
export const actionSettings = (action: AgentAction): readonly Setting[] => action.groups.flatMap((g) => g.settings)

/** An action's values as its version starts them: every control's default. */
export const actionDefaults = (action: AgentAction): PropertyValues => defaultsOf(actionSettings(action))

/**
 * `raw` as an action's values: every control it offers, checked against its declaration, and its default where `raw`
 * has none — a control added since it was saved. What is not one of its controls is dropped. Held whole, as a look is,
 * so a published version never follows a default that changes in code later (Admin.md §7).
 */
export function checkActionValues(action: AgentAction, raw: unknown): PropertyValues {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  return Object.fromEntries(actionSettings(action).map((s) => [s.id, s.id in r ? checkValue(s, r[s.id]) : s.default]))
}
