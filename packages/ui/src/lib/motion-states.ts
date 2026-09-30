import { easing } from "./motion"

/**
 * States (Motion.md M19, his, 2026-09-30): a motion as he builds it on the studio's timeline, not as a fixed list of
 * phases. *"I should be able to select which component … will be configured. And then once I configure, I can lock it.
 * So that configuration can have its own … start and end … maybe we can call each tab a state. And then I might be able
 * to attach multiple states. I can also overlap states. So, the preferences drives from top to bottom. The higher, the
 * more preference."*
 *
 * - **A state** is a named timeline: a window from `start` to `end` in ms, shown in a `unit`, the event that plays it,
 *   and its rows, the first the highest.
 * - **A row** is a part configured over a span — the values set on it, reached from wherever the part stands at the
 *   span's start by its end, on its ease (his: the motion fills its span) — or another state attached over a span,
 *   linked, its window stretched onto the span.
 * - **Top to bottom is priority.** Rows that overlap in time both play; only where two set the same value at the same
 *   moment does the higher one's show (his answer: "turn and jump"). When the higher one ends while the lower is still
 *   in its span, the lower takes the value on from where it stands, over what is left of its span, so nothing jumps.
 *   Outside every span a value stays where the last row left it.
 *
 * Pure: no element, no clock. A stage paints `stateValuesAt` at any moment, so a play is seekable, and an event arriving
 * mid-play starts its state `from` where everything stands.
 */

export type StateUnit = "ms" | "s" | "min"
/** How many ms one of each unit is. */
export const STATE_UNIT_MS: Record<StateUnit, number> = { ms: 1, s: 1000, min: 60_000 }

/** What plays a state: `start` is ↺, Play and a page's ready; the rest are the pointer's on the specimen. */
export type StateEvent = "start" | "enter" | "leave" | "press" | "release" | "click"
export const STATE_EVENTS: readonly StateEvent[] = ["start", "enter", "leave", "press", "release", "click"]

export type StateValue = number | string
export type StateValues = Record<string, StateValue>

/** A part configured over a span: only the values set on it, keyed by token. */
export type PartRow = {
  id: string
  kind: "part"
  part: string
  start: number
  end: number
  /** How it gets there, as CSS: an ease keyword or a `cubic-bezier()`. */
  ease: string
  values: StateValues
  locked: boolean
}

/**
 * Another state attached over a span, by its id: linked, so an edit to it plays wherever it is attached. A published
 * state pins it (M20, his: "a published motion should freeze"): `version` is the version of it that was current when the
 * state holding it was published; a draft plays the state as it stands.
 */
export type AttachRow = { id: string; kind: "state"; state: string; start: number; end: number; locked: boolean; version?: string }

export type StateRow = PartRow | AttachRow

export type MotionState = {
  id: string
  name: string
  event: StateEvent
  start: number
  end: number
  unit: StateUnit
  /** The first is the highest. */
  rows: StateRow[]
  /**
   * The parts it moves (M20, his: "I will just check the checkbox"): a part left out is not touched by it, its rows
   * kept but not played. Left out altogether, every part.
   */
  parts?: string[]
}

/** A part row in a play's own time, attached states flattened into theirs, in priority order. */
export type PlacedRow = { id: string; start: number; end: number; ease: (t: number) => number; values: StateValues }

const finite = (v: number, fallback = 0) => (Number.isFinite(v) ? v : fallback)
const clamp01 = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v)

/** The states `id` holds, at any depth, itself included. */
function holds(states: readonly MotionState[], id: string, seen = new Set<string>()): Set<string> {
  if (seen.has(id)) return seen
  seen.add(id)
  const state = states.find((s) => s.id === id)
  for (const row of state?.rows ?? []) if (row.kind === "state") holds(states, row.state, seen)
  return seen
}

/** Whether `attach` may be attached to `into`: never itself, and never a state that holds `into` already. */
export const canAttach = (states: readonly MotionState[], into: string, attach: string) => !holds(states, attach).has(into)

/**
 * A state's rows in its own time, in priority order: its part rows as they are, and each attached state's rows in its
 * place, their times mapped from its window onto the attaching row's span. A state reached twice down one branch (a
 * loop, which `canAttach` keeps out) is left out the second time.
 */
export function flattenState(states: readonly MotionState[], id: string, path: readonly string[] = []): PlacedRow[] {
  const state = states.find((s) => s.id === id)
  if (!state || path.includes(id)) return []
  const out: PlacedRow[] = []
  for (const row of state.rows) {
    if (row.kind === "part") {
      // A part the state does not tick is not touched by it.
      if (state.parts && !state.parts.includes(row.part)) continue
      out.push({ id: row.id, start: row.start, end: row.end, ease: easing(row.ease), values: row.values })
      continue
    }
    const inner = states.find((s) => s.id === row.state)
    if (!inner) continue
    const length = inner.end - inner.start
    const scale = length > 0 ? (row.end - row.start) / length : 0
    const map = (t: number) => row.start + (t - inner.start) * scale
    for (const r of flattenState(states, inner.id, [...path, id])) {
      out.push({ ...r, id: `${row.id}/${r.id}`, start: map(r.start), end: map(r.end) })
    }
  }
  return out
}

/**
 * Every value at `t` ms: from `from` (where each stands when the play sets off, the rest where it is not given) at
 * `origin`, through every row that sets it. Walked from boundary to boundary of the rows that set a value, the row in
 * charge of each stretch is the highest in its span there, and it moves the value from where it stands towards its
 * own over what is left of its span, so however the walk is split the value is the same. A `discrete` value (a blink's
 * clock) is not eased: it is the row's from the moment the row takes charge.
 */
export function stateValuesAt(
  rows: readonly PlacedRow[],
  from: StateValues,
  t: number,
  { origin = 0, discrete }: { origin?: number; discrete?: ReadonlySet<string> } = {},
): StateValues {
  const out: StateValues = { ...from }
  const keys = new Set(rows.flatMap((r) => Object.keys(r.values)))
  for (const key of keys) {
    const setting = rows.filter((r) => key in r.values && r.end > r.start)
    const cuts = [...new Set(setting.flatMap((r) => [r.start, r.end]).filter((c) => c > origin && c < t))].sort((a, b) => a - b)
    const stops = [origin, ...cuts, t]
    let value = out[key]
    for (let i = 0; i + 1 < stops.length; i++) {
      const a = stops[i]!
      const b = stops[i + 1]!
      if (!(b > a)) continue
      const mid = (a + b) / 2
      const row = setting.find((r) => r.start <= mid && mid < r.end)
      if (!row) continue
      const target = row.values[key]!
      if (discrete?.has(key) || typeof target !== "number" || typeof value !== "number") {
        value = target
        continue
      }
      const length = row.end - row.start
      const pa = row.ease(clamp01((a - row.start) / length))
      const pb = row.ease(clamp01((b - row.start) / length))
      const left = 1 - pa
      value = Math.abs(left) < 1e-6 ? target : finite(value) + (target - finite(value)) * ((pb - pa) / left)
    }
    if (value !== undefined) out[key] = value
  }
  return out
}

/** A time in ms as its unit reads it: whole ms, seconds to the hundredth, minutes to the thousandth. */
export function formatStateTime(ms: number, unit: StateUnit): string {
  const v = ms / STATE_UNIT_MS[unit]
  return unit === "ms" ? String(Math.round(v)) : unit === "s" ? v.toFixed(2) : v.toFixed(3)
}

/** The step a time is typed in, in its unit: 10ms, a hundredth of a second, a thousandth of a minute. */
export const STATE_UNIT_STEP: Record<StateUnit, number> = { ms: 10, s: 0.01, min: 0.001 }
