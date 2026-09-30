"use client"

import * as React from "react"
import { cn } from "cn"
import { isSlotItem, SlotContent } from "@no-origins/ui/components/slot"
import { Grid, GridItem, type GridMetrics } from "@no-origins/ui/components/grid"
import { GridPager } from "@no-origins/ui/components/grid-pager"
import { resolvePages, type GridLayout, type GridLayoutItem } from "@no-origins/ui/lib/grid-layout"

/**
 * A layout, one page at a time.
 *
 * Turning the page is a PROGRESS from 0 to 1 (Grid.md D27, 2026-09-21) that the wheel or a finger drives by hand —
 * scrolling UP is forward, to the next page, and "up" is the hand's: fingers moving up the trackpad or the screen, a
 * wheel rolled towards you. As it moves the ↑ fills from its bottom up; scrolling down, the ↓ from its top down. The
 * boxes do not follow the hand (D37, 2026-09-25, his: "let's not shrink the cards"): until the turn commits they stay
 * whole. Let go short of half way and the fill settles back; past it, or a whole page of travel, and the turn commits:
 * the page fades away over TURN_MS, and the next page is put on the field and fades in over the same (Grid.md D49,
 * 2026-09-30, his: "remove all the current loaders … let the components load quickly"). From D48 the grid's loader
 * brought a page with images still to come in out of its rings, and until D48 a ripple ran through the field and washed
 * the page away, box by box, cell by cell (D32, D37). A hand that goes on scrolling goes
 * on turning (D35): through the emptied field it turns on, a page a step, and the page it stops on is put on the field
 * when it stops; only the decaying tail of a trackpad's fling is ignored. A click on the pager's arrow, ← →, or a host's
 * toolbar play the same turn. The field and the pager never move.
 *
 * Nothing here renders per frame. The hand's progress is two custom properties on the pager's bar, the only thing that
 * reads them; the phase is `data-turn` on the grid's tracks, which globals.css fades the page away off.
 */

/**
 * The fill finishing, and the page fading away as the turn commits, in ms; and the page fading back in when the hand
 * brings the turn back to it, and the next page fading in. Short: the turn is snappy.
 */
export const TURN_MS = 160
/** Settling back after the hand lets go. */
const RELAX_MS = 120
/** No wheel event for this long is the hand letting go — a trackpad's, which sends an event every frame. */
const SETTLE_MS = 100
/**
 * …and a notched wheel's, which sends one event a notch: a steady roll is a notch every 100–250ms, so with the
 * trackpad's 100ms the turn let go between two notches and the boxes fell back — a slow roll turned no page at all
 * (measured 2026-09-25, a Windows mouse: 22 notches, seven pages of travel, nothing).
 */
const NOTCH_SETTLE_MS = 260
/** One wheel event this big, in px, is a notch rather than a trackpad's frame. */
const NOTCH_PX = 50
/** Past this share of the range a let-go turn completes rather than settles back. */
const COMMIT_AT = 0.5
/** The share of the field's height one page of scroll travel is. */
const RANGE_OF_FIELD = 1 / 3
/**
 * How closely the boxes follow the wheel, in ms: the time constant of an exponential follow — 63% of the way in this
 * long, 95% in three times it. A notch is a third of a page in one event, and it was drawn in one frame, a jump; now it
 * glides, and a trackpad's uneven events are evened out. A finger is not smoothed: it is on the glass.
 */
const FOLLOW_MS = 40
/**
 * While the page fades away, the hand's travel turns the next page too (2026-09-25, his: "if I'm continuously slow
 * scrolling, we can just continue the ripple without rendering the cards" — the ripple went with D48, the turning on
 * stayed). Steps follow each other no closer than this share of the hold, however fast the wheel spins.
 */
const STEP_MIN_SHARE = 0.5
/**
 * The stroke that turned the page goes on after it — a hard flick's own travel was nearly two pages before the fingers
 * lifted (measured on a synthetic flick, 2026-09-25) — and what it does in the first TURN_MS after it commits, while the
 * arrow is still filling, counts for at most this share of a page. So one stroke turns one page, and a hand that means
 * more keeps going through the emptied field.
 */
const FOLLOW_THROUGH = 0.5

// ── the hand, and the tail of a fling ─────────────────────────────────────────────────────────────────────────

/**
 * A trackpad goes on sending wheel events after the fingers lift — the fling's momentum, decaying frame by frame — and
 * after a turn that tail is not the hand: it started a second turn that relaxed back, a wobble after every turn
 * (2026-09-22). Until 2026-09-25 the whole wheel was muted until it had been quiet for 160ms, which muted the hand too:
 * a mouse rolled steadily, or fingers still moving, never turned a second page. Now each event is read. A TAIL is a run
 * of falls in the size of the events — a fling's momentum only ever shrinks — and only the tail is dropped. The hand is
 * anything else: a new push after a pause or the other way, an event that rises, and a steady roll of equal notches.
 * The first few events of a fall are MAYBE: kept aside, counted once the hand is seen to go on, dropped if the fall
 * turns out to be a tail. Tuned on randomised hands, flings, notches and 120Hz streams with coalesced frames
 * (2026-09-25): a jittery slow hand lost none of its travel and a fling was known by its seventh event, never
 * relapsing.
 */
type WheelKind = "hand" | "maybe" | "tail"
/** A pause this long, in ms, starts a new gesture. */
const FRESH_MS = 120
/** This many falls in a row is a tail. Four let a jittery hand read as one; six took longer to know a fling. */
const TAIL_RUN = 5
/** A tail is broken by an event this much bigger than the one before it, and by at least 2px more. */
const TAIL_RISE = 1.25

type WheelTrace = { at: number; mag: number; sign: number; run: number; tail: boolean; frame: number }
const wheelTrace = (): WheelTrace => ({ at: -Infinity, mag: 0, sign: 0, run: 0, tail: false, frame: 1000 / 60 })

/**
 * Read one wheel event (`px`, signed, at `now` ms) against the stream before it. Sizes are compared per frame of the
 * stream's own rate, so a 120Hz screen reads as it is, and a frame the browser coalesced when the main thread was busy
 * — two frames' travel in one event — reads as its share per frame rather than as a push.
 */
function readWheel(t: WheelTrace, now: number, px: number): WheelKind {
  const mag = Math.abs(px)
  const sign = Math.sign(px)
  const dt = now - t.at
  if (dt > FRESH_MS || sign !== t.sign) {
    Object.assign(t, { at: now, mag, sign, run: 0, tail: false })
    return "hand"
  }
  const frames = Math.max(1, Math.round(dt / t.frame))
  if (frames === 1) t.frame = t.frame * 0.8 + dt * 0.2
  const m = frames > 1 && mag > t.mag * 1.5 ? mag / frames : mag
  let kind: WheelKind
  if (t.tail) {
    if (m > t.mag * TAIL_RISE + 2) {
      t.tail = false
      t.run = 0
      kind = "hand"
    } else kind = "tail"
  } else if (m < t.mag) {
    t.run++
    t.tail = t.run >= TAIL_RUN
    kind = t.tail ? "tail" : "maybe"
  } else if (m > t.mag) {
    t.run = 0
    kind = "hand"
  } else kind = t.run > 0 ? "maybe" : "hand"
  t.at = now
  t.mag = m
  t.sign = sign
  return kind
}

// ── the turn ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * `wash` is the turn from the moment it commits until the next page is put on the field: the last page fades away
 * (globals.css, off `data-turn="wash"`; the ripple washed it away until D48, and the name stayed). The hand may go on
 * turning pages through it, and the page is put on the field only when the hold is over and the hand has stopped. `in`
 * is that page arriving: it fades in (D49), as the page the hand brought the turn back to fades back in.
 */
export type TurnPhase = "idle" | "drive" | "relax" | "wash" | "in"
export type TurnState = { phase: TurnPhase; dir: 1 | -1 }

const easeIn = (t: number) => t * t
const easeOut = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t)
const clampUnit = (n: number) => Math.max(-1, Math.min(1, n))
const clampFollow = (n: number) => Math.max(-FOLLOW_THROUGH, Math.min(FOLLOW_THROUGH, n))

function usePrefersReducedMotion() {
  const [reduce, setReduce] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduce(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return reduce
}

export type PageTurn = {
  /** The page whose boxes are on the field right now. */
  shown: number
  /**
   * The page the field is turning to: `shown` at rest, and the next page from the moment the turn commits — through the
   * wash — until it is shown. The pager's bar moves to it at once; while the hand keeps turning through the wash, it
   * moves on a page a step.
   */
  coming: number
  turn: TurnState
  turning: boolean
  /** Goes on the Grid: the turn finds its tracks and the pager's bar through it. */
  rootRef: React.RefObject<HTMLDivElement | null>
  /** Wheel and touch — the hand turning the page. */
  handlers: Pick<React.ComponentProps<"div">, "onWheel" | "onTouchStart" | "onTouchMove" | "onTouchEnd" | "onTouchCancel">
}

/** What the turn reads from the render it was last given. */
type TurnInputs = {
  count: number
  /** The field's height, for a wheel that counts in pages. */
  gridH: number
  /** Scroll travel, in px, for one page. */
  range: number
  /** How long a committed turn holds the next page back: the last page fading away (TURN_MS). 0 under reduced motion. */
  hold: number
  reduce: boolean
  measured: boolean
  metrics: GridMetrics | null
  onPage?: (page: number) => void
}

/**
 * The turn itself, made once per grid: its state is plain variables, not React state, so a wheel event costs a few
 * style writes and no render. It tells React only what React draws — the page on the field, the page coming, and the
 * phase — through the three setters.
 */
function createTurn(
  initial: number,
  root: React.RefObject<HTMLDivElement | null>,
  inputs: React.RefObject<TurnInputs>,
  react: { setShown: (page: number) => void; setComing: (page: number) => void; setTurn: (turn: TurnState) => void },
) {
  let phase: TurnPhase = "idle"
  let dir: 1 | -1 = 1
  let shown = initial
  /** The page `shown` React has put in the DOM. */
  let committed = initial
  let coming = initial
  /** How far the hand has turned the page, signed: + forward, − back. The arrow's fill shows it; the boxes do not (D37). */
  let progress = 0
  /** Where the hand has put the turn; `progress` follows it. */
  let goal = 0
  let raf = 0
  let following = false
  let settle = 0
  let holdTimer = 0
  let touchY: number | null = null
  /** Set by a turn, cleared by the hand's next push: until then a fling's tail is not the hand (see `readWheel`). */
  let muted = false
  const trace = wheelTrace()
  /** The hand's travel while the field is turning, in pages, and the part of it not yet known to be the hand. */
  let ahead = 0
  let pending = 0
  /** When the hand last moved, and how long its quiet has to be to count as let go. */
  let handAt = -Infinity
  let handSettle = SETTLE_MS
  /** When the pass on the field began, and until when the hand's travel is still the stroke that committed the turn. */
  let passAt = 0
  let followUntil = 0
  /** The next page is set on the field and the arrival waits for React to have put it in the DOM. */
  let waitingIn = false

  // The phase goes on the grid's TRACKS — globals.css fades the page away off it — and the hand's progress on the
  // pager's BAR, the one thing that reads it. Custom properties inherit, so a value written every frame restyles
  // everything under the element it is written on: on the grid's root it restyled every element in the grid, the
  // overlay's cells and the ripple's line layers (three times the style work, and dropped frames, measured
  // 2026-09-25); on the tracks, every box on the page, which read it for their clip until D37. The root keeps the
  // defaults (globals.css).
  let tracks: HTMLElement | null = null
  let bar: HTMLElement | null = null
  const tracksEl = () => {
    if (!tracks?.isConnected) tracks = root.current?.querySelector<HTMLElement>(':scope [data-slot="grid-tracks"]') ?? null
    return tracks
  }
  const barEl = () => {
    if (!bar?.isConnected) bar = tracksEl()?.querySelector<HTMLElement>(':scope > [data-pager="bar"]') ?? null
    return bar
  }

  const write = (p: number) => {
    progress = p
    const el = barEl()
    if (!el) return
    // The pager's arrow has two values (grid-pager.tsx): the FRONT of its fill and the BACK, as shares of the arrow
    // from the edge the fill enters by, signed like the progress. With the hand, the front advances with the progress
    // and the back stays at the entry edge, so the fill grows in. During the in-phase — when the progress runs 0 → 1 a
    // second time as the next page fades in — the front stays at 1 and the BACK advances instead, so the fill LEAVES the
    // way it came, its trailing edge crossing the arrow: never a second fill (it filled twice, his report, 2026-09-22),
    // and never pulled back ("once the page changes, bring the bottom to top", the same day).
    const inward = phase === "in"
    el.style.setProperty("--grid-turn-fill-front", String(inward ? dir : p))
    el.style.setProperty("--grid-turn-fill-back", String(inward ? p : 0))
  }

  // The arrow filled in the colour of the ripple the turn would play (D32) until D48 took the ripple out: it keeps its
  // own fill.

  const setPhase = (next: TurnPhase, d: 1 | -1) => {
    const from = phase
    const changed = from !== next || d !== dir
    phase = next
    dir = d
    // An attribute on the tracks rather than a prop on each box, so a phase costs no render of the cards on the page.
    const el = tracksEl()
    if (el) {
      if (next === "idle") delete el.dataset.turn
      else el.dataset.turn = next
    }
    if (changed) react.setTurn({ phase: next, dir: d })
  }

  const cancel = () => {
    if (raf) window.cancelAnimationFrame(raf)
    raf = 0
    following = false
  }

  const stop = () => {
    cancel()
    window.clearTimeout(settle)
    settle = 0
    window.clearTimeout(holdTimer)
    holdTimer = 0
  }

  /** Show `p`, turning the fill round when the hand crosses from one direction to the other. */
  const show = (p: number) => {
    const d: 1 | -1 = p < 0 ? -1 : 1
    if (p !== 0 && d !== dir && phase === "drive") setPhase("drive", d)
    write(p)
  }

  /** Run |progress| from where it is to `to` over `ms`, then `done`. */
  const tween = (to: number, ms: number, ease: (t: number) => number, d: 1 | -1, done: () => void) => {
    cancel()
    const from = Math.abs(progress)
    if (ms <= 0 || from === to) {
      write(d * to)
      done()
      return
    }
    const start = performance.now()
    const frame = (now: number) => {
      // Clamped at 0 as well as 1: the first frame's timestamp can predate `start` — rAF hands the frame's start
      // time, which may be earlier than the call that scheduled it — and a negative t through the ease wrote a
      // negative progress for one frame: the arrow blinked from full to empty at the turn (2026-09-22).
      const t = Math.min(1, Math.max(0, (now - start) / ms))
      write(d * (from + (to - from) * ease(t)))
      if (t < 1) raf = window.requestAnimationFrame(frame)
      else {
        raf = 0
        done()
      }
    }
    raf = window.requestAnimationFrame(frame)
  }

  /** Ease what is shown towards the hand's goal, a frame at a time, for as long as they differ. */
  const follow = () => {
    if (following) return
    cancel()
    following = true
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(64, Math.max(8, now - last))
      last = now
      const next = Math.abs(goal - progress) < 0.002 ? goal : progress + (goal - progress) * (1 - Math.exp(-dt / FOLLOW_MS))
      show(next)
      if (next === goal) {
        raf = 0
        following = false
      } else raf = window.requestAnimationFrame(frame)
    }
    raf = window.requestAnimationFrame(frame)
  }

  /** Keep the hand's travel from running past the first page or the last. */
  const bound = () => {
    const { count } = inputs.current
    if (coming <= 0) ahead = Math.max(0, ahead)
    if (coming >= count - 1) ahead = Math.min(0, ahead)
  }

  /**
   * React has put the next page in the DOM: it fades in as the arrow's fill leaves (globals.css, off `data-turn="in"`,
   * D49), the page the hand came back to as well.
   */
  const reveal = () => {
    waitingIn = false
    const d = dir
    tween(1, inputs.current.reduce ? 0 : TURN_MS, easeOut, d, () => {
      setPhase("idle", d)
      write(0)
      goal = 0
      // The hand came back while the page was fading in: its travel starts the next turn, and it is the hand, so the
      // tail's mute is over.
      if (ahead !== 0) {
        const px = ahead * inputs.current.range
        ahead = 0
        pending = 0
        muted = false
        if (drive(px, true)) settle = window.setTimeout(release, handSettle)
      }
    })
  }

  /**
   * The hold is over and the hand has stopped: put the page on the field. Whatever travel the hand
   * had not finished a page with is dropped — it has let go, and there is nothing on the field to settle back.
   */
  const arrive = (next: number, d: 1 | -1) => {
    ahead = 0
    pending = 0
    shown = next
    setPhase("in", d)
    write(0)
    // The arrival starts once the page is in the DOM (`committed`, from a layout effect): started before, its first
    // frame could show the page that was leaving.
    waitingIn = true
    react.setShown(next)
    if (committed === next) reveal()
  }

  /**
   * The field is washing: arrive, turn a page more, or wait. A page more when the hand has travelled one since the step
   * began, and the hold is at least STEP_MIN_SHARE through; arrive when the hold is over and the hand has been quiet
   * for its settle (with no hold, at once — the hand's travel then starts the next turn once this page is in).
   */
  const check = () => {
    window.clearTimeout(holdTimer)
    holdTimer = 0
    if (phase !== "wash") return
    const now = performance.now()
    const { hold } = inputs.current
    bound()
    if (hold > 0 && Math.abs(ahead) >= 1) {
      const at = passAt + hold * STEP_MIN_SHARE
      if (now >= at) return step(coming + (ahead < 0 ? -1 : 1))
      holdTimer = window.setTimeout(check, at - now)
      return
    }
    const due = hold > 0 ? Math.max(passAt + hold, handAt + handSettle) : now
    if (now >= due) arrive(coming, dir)
    else holdTimer = window.setTimeout(check, due - now)
  }

  /**
   * Turn on to `next` without putting anything on the field: the pager's bar moves on, and the hold starts again. The
   * last page has already faded away, or is still fading.
   */
  const step = (next: number) => {
    const d: 1 | -1 = next > coming ? 1 : -1
    ahead = 0
    pending = 0
    setPhase("wash", d)
    write(d)
    coming = next
    react.setComing(next)
    passAt = performance.now()
    followUntil = 0
    inputs.current.onPage?.(next)
    check()
  }

  /**
   * Commit a turn from wherever the hand had it: the page fades away, the arrow fills the rest of the way, and the next
   * page comes when the hold is over. `carry` is travel past the turn, in pages.
   */
  const complete = (next: number, d: 1 | -1, carry = 0) => {
    // From the hand, the fill is already moving: ease out of it. From rest, ease in.
    const fromHand = phase === "drive"
    window.clearTimeout(settle)
    settle = 0
    muted = true
    coming = next
    ahead = clampFollow(carry)
    pending = 0
    if (Math.sign(progress) === -d) write(0)
    setPhase("wash", d)
    goal = d
    passAt = performance.now()
    followUntil = passAt + TURN_MS
    // Under reduced motion there is no hold: the page is swapped at once.
    react.setComing(next)
    const ms = inputs.current.reduce ? 0 : Math.max(0, TURN_MS * (1 - Math.abs(progress)))
    tween(1, ms, fromHand ? easeOut : easeIn, d, () => {})
    check()
  }

  /** Let go short of the turn: the fill goes back. */
  const relax = () => {
    const d: 1 | -1 = progress < 0 ? -1 : 1
    goal = 0
    setPhase("relax", d)
    tween(0, inputs.current.reduce ? 0 : RELAX_MS, easeOut, d, () => {
      setPhase("idle", d)
      write(0)
    })
  }

  /** The hand has let go, at whatever it had reached: complete past half way, else relax. */
  function release() {
    settle = 0
    if (phase !== "drive") return
    const d: 1 | -1 = goal < 0 ? -1 : 1
    if (Math.abs(goal) >= COMMIT_AT) {
      complete(shown + d, d)
      inputs.current.onPage?.(shown + d)
    } else relax()
  }

  /**
   * Move the turn by a scroll delta in px — the one entry point for the wheel and the finger. The wheel's is followed
   * (`smooth`); a finger's is shown as it is.
   */
  function drive(px: number, smooth: boolean) {
    const { count, range } = inputs.current
    if (phase === "wash" || phase === "in" || count <= 1) return false
    const raw = (phase === "drive" ? goal : progress) + px / range
    let g = clampUnit(raw)
    // Nothing before the first page or after the last: the turn stops at 0 in that direction.
    if (shown <= 0) g = Math.max(0, g)
    if (shown >= count - 1) g = Math.min(0, g)
    if (phase !== "drive") {
      cancel()
      setPhase("drive", (progress || g) < 0 ? -1 : 1)
    }
    goal = g
    if (Math.abs(g) >= 1) {
      const d: 1 | -1 = g < 0 ? -1 : 1
      complete(shown + d, d, raw - d)
      inputs.current.onPage?.(shown + d)
      return false
    }
    if (smooth) follow()
    else {
      cancel()
      show(g)
    }
    return true
  }

  /** The hand moving while the field turns: its travel is kept for the next page, and a fling's tail is not. */
  const keep = (px: number, kind: WheelKind) => {
    if (kind === "tail") {
      pending = 0
      return
    }
    if (kind === "maybe") {
      pending += px / inputs.current.range
      return
    }
    ahead = clampUnit(ahead + pending + px / inputs.current.range)
    // The stroke that committed the turn, still going while the arrow fills, counts for at most FOLLOW_THROUGH.
    if (performance.now() < followUntil) ahead = clampFollow(ahead)
    pending = 0
    if (phase === "wash") check()
  }

  const onWheel = (event: React.WheelEvent) => {
    const { measured, gridH } = inputs.current
    if (!measured) return
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? gridH : 1
    // Scrolling up is forward, to the next page (D27: "scrolling up means going to next page") — and "up" is the
    // HAND'S up, fingers moving up the trackpad, which the browser reports as a positive delta (the same as a wheel
    // rolled towards you). Not negated since 2026-09-21: negating it made a trackpad and a finger on the screen
    // disagree, because the finger handler below already reads the hand's direction.
    const px = event.deltaY * unit
    if (px === 0) return
    const now = performance.now()
    const kind = readWheel(trace, event.timeStamp || now, px)
    const settleMs = event.deltaMode !== 0 || Math.abs(px) >= NOTCH_PX ? NOTCH_SETTLE_MS : SETTLE_MS
    if (kind !== "tail") {
      handAt = now
      handSettle = settleMs
    }
    if (phase === "wash" || phase === "in") return keep(px, kind)
    // After a turn, until the hand pushes again, the wheel is the tail of the gesture that turned the page.
    if (muted) {
      if (kind !== "hand") return
      muted = false
    }
    if (!drive(px, true)) return
    window.clearTimeout(settle)
    settle = window.setTimeout(release, settleMs)
  }

  const onTouchStart = (event: React.TouchEvent) => {
    touchY = event.touches[0]?.clientY ?? null
  }
  const onTouchMove = (event: React.TouchEvent) => {
    const y = event.touches[0]?.clientY
    if (y === undefined || touchY === null) return
    // A finger moving up is forward, like fingers moving up on a trackpad. A finger has no fling, so it is always the
    // hand, and it goes on counting through a turn as the wheel does.
    const dy = touchY - y
    touchY = y
    if (dy === 0) return
    handAt = performance.now()
    handSettle = SETTLE_MS
    if (phase === "wash" || phase === "in") return keep(dy, "hand")
    muted = false
    drive(dy, false)
  }
  const onTouchEnd = () => {
    touchY = null
    if (phase === "wash") check()
    else release()
  }

  /**
   * A change of `page` from outside — ← →, an arrow, a host's toolbar — plays the turn; through the wash it turns on
   * with it, a step. A request that arrives while the next page is arriving waits for the field to be idle; the caller
   * asks again when the phase settles.
   */
  const request = (page: number) => {
    if (phase === "wash") {
      if (page !== coming) step(page)
      return
    }
    if (page === shown) return
    if (phase === "in") return
    stop()
    if (!inputs.current.measured) {
      shown = coming = page
      react.setShown(page)
      react.setComing(page)
      setPhase("idle", 1)
      write(0)
      return
    }
    complete(page, page > shown ? 1 : -1)
  }

  /** React has put page `page` in the DOM. */
  const commit = (page: number) => {
    committed = page
    if (waitingIn && page === shown && phase === "in") reveal()
  }

  return {
    handlers: { onWheel, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd },
    request,
    commit,
    dispose: stop,
  }
}

/**
 * Drive the turn. `page` is where the caller wants to be; `shown` is the page on the field. A change of `page` plays
 * the turn — the wash, then the in-phase; the wheel or a finger fills the arrow by hand and, when the turn commits,
 * turns the page itself and tells the caller through `onPage`. `hold` is how long the wash holds the next page back —
 * the last page fading away — and the next page is only put on the field after it, and after the hand has stopped: a
 * hand still scrolling turns on through the emptied field, a page a step.
 */
export function usePageTurn(page: number, count: number, metrics: GridMetrics | null, onPage?: (page: number) => void, hold = 0): PageTurn {
  const [shown, setShown] = React.useState(page)
  const [coming, setComing] = React.useState(page)
  const [turn, setTurn] = React.useState<TurnState>({ phase: "idle", dir: 1 })
  const reduce = usePrefersReducedMotion()
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  const inputs = React.useRef<TurnInputs>({ count, gridH: 0, range: 1, hold: 0, reduce, measured: false, metrics: null, onPage })
  inputs.current = {
    count,
    gridH: metrics?.gridH ?? 0,
    range: Math.max(1, (metrics?.gridH ?? 0) * RANGE_OF_FIELD),
    hold: reduce ? 0 : hold,
    reduce,
    measured: !!metrics,
    metrics,
    onPage,
  }

  const engine = React.useRef<ReturnType<typeof createTurn> | null>(null)
  if (!engine.current) engine.current = createTurn(page, rootRef, inputs, { setShown, setComing, setTurn })
  const t = engine.current

  // The arrival waits for the next page to be in the DOM; a layout effect runs before that frame is painted.
  React.useLayoutEffect(() => t.commit(shown), [t, shown])
  // A request that arrived mid-turn is asked again whenever the phase moves on.
  React.useEffect(() => t.request(page), [t, page, turn.phase, metrics])
  React.useEffect(() => () => t.dispose(), [t])

  return { shown, coming, turn, turning: turn.phase !== "idle", rootRef, handlers: t.handlers }
}


// ── the surface ──────────────────────────────────────────────────────────────────────────────────────────────

export type RenderGridItem = (item: GridLayoutItem) => React.ReactNode

type GridPageSurfaceProps = {
  items: GridLayoutItem[]
  renderItem?: RenderGridItem
}

/**
 * One page's boxes as grid children. A fragment on purpose — anything that wrapped them in an element would put a
 * box between the grid and its items and the placement would stop working. With no `renderItem`, a slot item draws
 * its own content (Slots.md); anything else draws nothing.
 *
 * Memoised, and the turn is not a prop: the phase is an attribute on the tracks, which globals.css fades the page away
 * and in off, so a turn starting, washing or ending renders no card. It rendered
 * every card on the page at each phase — the first wheel event of every turn among them.
 */
const GridPageSurface = React.memo(function GridPageSurface({ items, renderItem }: GridPageSurfaceProps) {
  return (
    <>
      {items.map((item) => (
        <GridItem key={item.id} col={item.col} row={item.row} colSpan={item.colSpan} rowSpan={item.rowSpan} className="relative touch-none select-none">
          {renderItem ? renderItem(item) : isSlotItem(item) ? <SlotContent item={item} /> : null}
        </GridItem>
      ))}
    </>
  )
})

// ── the runtime ──────────────────────────────────────────────────────────────────────────────────────────────

export type GridPagesProps = {
  layout: GridLayout
  renderItem?: RenderGridItem
  overlay?: boolean
  /** Controlled page; omit to let the pager manage it. */
  page?: number
  defaultPage?: number
  onPageChange?: (page: number) => void
  /** ← and → turn the page while nothing is focused that wants the keys. The wheel, a finger and the pager's arrows always do. */
  keyboard?: boolean
  /** The pointer is a violet ring that fills while pressed, and the cell under it is lit (Grid.md D34, D43). */
  cursor?: boolean
  className?: string
  onMetrics?: (metrics: GridMetrics) => void
}

const TURN_STYLE = { "--grid-turn-fade": `${TURN_MS}ms` } as React.CSSProperties

/** The grid an app renders a layout with. */
function GridPages({
  layout,
  renderItem,
  overlay,
  page: pageProp,
  defaultPage = 0,
  onPageChange,
  keyboard = true,
  cursor,
  className,
  onMetrics,
}: GridPagesProps) {
  const [metrics, setMetrics] = React.useState<GridMetrics | null>(null)
  const handleMetrics = React.useCallback(
    (next: GridMetrics) => {
      setMetrics(next)
      onMetrics?.(next)
    },
    [onMetrics],
  )

  const pages = React.useMemo(() => (metrics ? resolvePages(layout, metrics) : null), [layout, metrics])

  const count = pages?.length ?? 1
  // What the numbered bar calls each page (D46), memoised with the pages so the memoised bar is not redrawn every frame.
  const titles = React.useMemo(() => pages?.map((p) => p.title), [pages])
  const [pageState, setPageState] = React.useState(defaultPage)
  const page = Math.min(pageProp ?? pageState, count - 1)
  const setPage = React.useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(next, count - 1))
      setPageState(clamped)
      onPageChange?.(clamped)
    },
    [count, onPageChange],
  )

  // A turn holds the next page back while the last one fades away; then it fades in (D49). It held it while a ripple
  // crossed the field and washed the page away until D48 (D32, D37).
  const hold = metrics ? TURN_MS : 0
  const { shown, coming, rootRef, handlers } = usePageTurn(page, metrics ? count : 1, metrics, setPage, hold)
  const onTurn = React.useCallback((dir: 1 | -1) => setPage(page + dir), [setPage, page])
  // A page number in the bar (D36) turns straight to its page.
  const onGo = setPage

  // The keys turn as the pager's arrows do: ↓ presses the arrow that wears ↓, forward, and ↑ the one that wears ↑,
  // back (their glyphs are swapped against the hand's direction, grid-pager.tsx) — his, 2026-09-26: "map the up and
  // down arrow with keys". ← → as before. A key a focused component has already taken — a menu, a select, a slider,
  // a radio group all use ↑ ↓ — is theirs, and so is one held with a modifier.
  React.useEffect(() => {
    if (!keyboard) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      const target = event.target as HTMLElement | null
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return
      const dir = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0
      if (!dir) return
      event.preventDefault()
      setPage(page + dir)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [keyboard, page, setPage])

  const items = pages?.[Math.min(shown, count - 1)]?.items ?? []

  return (
    <Grid
      ref={rootRef}
      overlay={overlay}
      cursor={cursor}
      onMetrics={handleMetrics}
      // touch-none: a finger on the field drives the turn, and the browser must not pan or refresh under it.
      className={cn("touch-none", className)}
      // How long the page takes to fade away (globals.css), the wash's own length.
      style={TURN_STYLE}
      {...handlers}
    >
      <GridPageSurface items={items} renderItem={renderItem} />
      <GridPager
        page={Math.min(shown, count - 1)}
        coming={Math.min(coming, count - 1)}
        count={count}
        titles={titles}
        onTurn={onTurn}
        onGo={onGo}
        bar={layout.bar}
      />
    </Grid>
  )
}

export { GridPages }
