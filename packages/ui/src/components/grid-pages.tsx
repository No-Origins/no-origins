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
 * Turning the page is a PROGRESS from 0 to 1 (Grid.md D27, 2026-09-21), and everything on the field follows it in
 * the same proportion. The wheel or a finger drives it by hand — scrolling UP is forward, to the next page, and "up"
 * is the hand's: fingers moving up the trackpad or the screen, a wheel rolled towards you — and as
 * it moves the boxes on show lose height from the bottom, keeping their top, while the ↑ fills from its bottom up by
 * the same share. When the scroll is complete the page turns and the next page's boxes are revealed from their
 * bottom edge upward. Scrolling down is the same in reverse, with the ↓. Let go short of the turn and the
 * boxes settle back; past half way and the turn completes on its own. A click on the pager's arrow, ← →, or a
 * host's toolbar play the same turn over time. Only the boxes move — the field and the pager stay where
 * they are, because they are the room and the boxes are the furniture.
 *
 * The progress lives in `--grid-turn` on the grid, written per frame without a render: each box's clip and the
 * pager's fill are CSS functions of it. **Only the box's visible height changes** (D27): the box is CLIPPED, never
 * scaled, so the content inside keeps its exact size and position and nothing is squeezed or narrowed. Scaling in Y
 * squashed the glyphs and scaling uniformly changed the width; both were sent back, 2026-09-21.
 */

/** One phase — out or in — in ms. Short: the turn is snappy. */
export const TURN_MS = 160
/** Settling back after the hand lets go. */
const RELAX_MS = 120
/** No wheel event for this long is the hand letting go. */
const SETTLE_MS = 100
/** Past this share of the range a let-go turn completes rather than settles back. */
const COMMIT_AT = 0.5
/** The share of the field's height one page of scroll travel is. */
const RANGE_OF_FIELD = 1 / 3
/**
 * After a turn, the wheel is MUTED until it has been quiet this long: a trackpad keeps sending its momentum tail after
 * the page has turned, and those events started a second turn that relaxed back — a wobble after every turn
 * (2026-09-22). To turn again, the hand pauses and scrolls again.
 */
const MUTE_MS = 160

export type TurnPhase = "idle" | "drive" | "relax" | "out" | "in"
export type TurnState = { phase: TurnPhase; dir: 1 | -1 }

const easeIn = (t: number) => t * t
const easeOut = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t)

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
  turn: TurnState
  turning: boolean
  /** Goes on the Grid: the progress is written here. */
  rootRef: React.RefObject<HTMLDivElement | null>
  /** Wheel and touch — the hand turning the page. */
  handlers: Pick<React.ComponentProps<"div">, "onWheel" | "onTouchStart" | "onTouchMove" | "onTouchEnd" | "onTouchCancel">
}

/**
 * Drive the turn. `page` is where the caller wants to be; `shown` is the page on the field. A change of `page` plays
 * an out-phase and then an in-phase; the wheel or a finger drives the out-phase by hand and, when it completes,
 * turns the page itself and tells the caller through `onPage`.
 */
export function usePageTurn(page: number, count: number, metrics: GridMetrics | null, onPage?: (page: number) => void): PageTurn {
  const [shown, setShown] = React.useState(page)
  const [turn, setTurn] = React.useState<TurnState>({ phase: "idle", dir: 1 })
  const reduce = usePrefersReducedMotion()
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  // Everything the frame loop and the event handlers read, kept out of React state so a wheel event costs one style
  // write and no render.
  const shownRef = React.useRef(page)
  const phaseRef = React.useRef<TurnPhase>("idle")
  const dirRef = React.useRef<1 | -1>(1)
  const progress = React.useRef(0) // signed: + forward, − back
  const raf = React.useRef(0)
  const settle = React.useRef(0)
  const touchY = React.useRef<number | null>(null)
  const muted = React.useRef(false)
  const muteTimer = React.useRef(0)
  const onPageRef = React.useRef(onPage)
  onPageRef.current = onPage
  const range = Math.max(1, (metrics?.gridH ?? 0) * RANGE_OF_FIELD)

  const write = React.useCallback((p: number) => {
    progress.current = p
    const el = rootRef.current
    if (!el) return
    el.style.setProperty("--grid-turn", String(p))
    el.style.setProperty("--grid-turn-abs", String(Math.abs(p)))
    // The pager's arrow has its own two values (grid-pager.tsx): the FRONT of its fill and the BACK, as shares of the
    // arrow from the edge the fill enters by, signed like the progress. With the hand, the front advances with the
    // progress and the back stays at the entry edge, so the fill grows in. During the in-phase — when the progress
    // runs 0 → 1 a second time to reveal the next page — the front stays at 1 and the BACK advances instead, so the
    // fill LEAVES the way it came, its trailing edge crossing the arrow: never a second fill (it filled twice, his
    // report, 2026-09-22), and never pulled back ("once the page changes, bring the bottom to top", the same day).
    const inward = phaseRef.current === "in"
    el.style.setProperty("--grid-turn-fill-front", String(inward ? dirRef.current : p))
    el.style.setProperty("--grid-turn-fill-back", String(inward ? p : 0))
  }, [])

  const setPhase = React.useCallback((phase: TurnPhase, dir: 1 | -1) => {
    phaseRef.current = phase
    dirRef.current = dir
    const el = rootRef.current
    if (el) {
      // Out falls from 1, in rises from 0 — set with the progress so no frame sees one without the other. The box
      // is anchored to one edge and clipped from the other, so the motion runs in the direction of travel: forward,
      // a box keeps its top and loses its bottom on the way out, and the next page is revealed from its bottom edge
      // on the way in; back, the reverse.
      const inward = phase === "in"
      const anchorBottom = inward === (dir === 1)
      el.style.setProperty("--grid-turn-base", inward ? "0" : "1")
      el.style.setProperty("--grid-turn-sign", inward ? "1" : "-1")
      el.style.setProperty("--grid-turn-hide-top", anchorBottom ? "1" : "0")
      el.style.setProperty("--grid-turn-hide-bottom", anchorBottom ? "0" : "1")
    }
    setTurn({ phase, dir })
  }, [])

  const stop = React.useCallback(() => {
    if (raf.current) window.cancelAnimationFrame(raf.current)
    raf.current = 0
    if (settle.current) window.clearTimeout(settle.current)
    settle.current = 0
  }, [])

  /** Run |progress| from where it is to `to` over `ms`, then `done`. */
  const tween = React.useCallback(
    (to: number, ms: number, ease: (t: number) => number, dir: 1 | -1, done: () => void) => {
      if (raf.current) window.cancelAnimationFrame(raf.current)
      const from = Math.abs(progress.current)
      if (ms <= 0 || from === to) {
        write(dir * to)
        done()
        return
      }
      const start = performance.now()
      const frame = (now: number) => {
        // Clamped at 0 as well as 1: the first frame's timestamp can predate `start` — rAF hands the frame's start
        // time, which may be earlier than the call that scheduled it — and a negative t through the ease wrote a
        // negative progress for one frame: the arrow blinked from full to empty at the turn (2026-09-22).
        const t = Math.min(1, Math.max(0, (now - start) / ms))
        write(dir * (from + (to - from) * ease(t)))
        if (t < 1) raf.current = window.requestAnimationFrame(frame)
        else {
          raf.current = 0
          done()
        }
      }
      raf.current = window.requestAnimationFrame(frame)
    },
    [write],
  )

  /** The out-phase is complete: put the next page on the field and grow it in. */
  const arrive = React.useCallback(
    (next: number, dir: 1 | -1) => {
      shownRef.current = next
      setShown(next)
      setPhase("in", dir)
      write(0)
      const ms = reduce ? 0 : TURN_MS
      tween(1, ms, easeOut, dir, () => {
        setPhase("idle", dir)
        write(0)
      })
    },
    [reduce, setPhase, tween, write],
  )

  /** Finish a turn from wherever the progress is: out to 1, then arrive. */
  const complete = React.useCallback(
    (next: number, dir: 1 | -1) => {
      // From the hand, the boxes are already moving: ease out of it. From rest, ease in.
      const fromHand = phaseRef.current === "drive"
      setPhase("out", dir)
      const left = 1 - Math.abs(progress.current)
      const ms = reduce ? 0 : Math.max(0, TURN_MS * left)
      tween(1, ms, fromHand ? easeOut : easeIn, dir, () => arrive(next, dir))
    },
    [reduce, setPhase, tween, arrive],
  )

  /** Let go short of the turn: the boxes come back. */
  const relax = React.useCallback(() => {
    const dir: 1 | -1 = progress.current < 0 ? -1 : 1
    setPhase("relax", dir)
    tween(0, reduce ? 0 : RELAX_MS, easeOut, dir, () => {
      setPhase("idle", dir)
      write(0)
    })
  }, [reduce, setPhase, tween, write])

  /** The hand has let go, at whatever progress: complete past half way, else relax. */
  const release = React.useCallback(() => {
    if (phaseRef.current !== "drive") return
    const p = progress.current
    const dir: 1 | -1 = p < 0 ? -1 : 1
    if (Math.abs(p) >= COMMIT_AT) {
      const next = shownRef.current + dir
      complete(next, dir)
      onPageRef.current?.(next)
    } else relax()
  }, [complete, relax])

  /** Move the progress by a scroll delta in px. The one entry point for the wheel and the finger. */
  const drive = React.useCallback(
    (deltaPx: number) => {
      const phase = phaseRef.current
      if (phase === "out" || phase === "in" || count <= 1) return false
      let p = Math.max(-1, Math.min(1, progress.current + deltaPx / range))
      // Nothing before the first page or after the last: the progress stops at 0 in that direction.
      if (shownRef.current <= 0) p = Math.max(0, p)
      if (shownRef.current >= count - 1) p = Math.min(0, p)
      if (raf.current) window.cancelAnimationFrame(raf.current)
      raf.current = 0
      const dir: 1 | -1 = p < 0 ? -1 : 1
      if (phase !== "drive" || (dirRef.current !== dir && p !== 0)) setPhase("drive", dir)
      write(p)
      if (Math.abs(p) >= 1) {
        const next = shownRef.current + dir
        complete(next, dir)
        onPageRef.current?.(next)
        return false
      }
      return true
    },
    [count, range, setPhase, write, complete],
  )

  const onWheel = React.useCallback(
    (event: React.WheelEvent) => {
      if (!metrics) return
      // While the turn plays out and in, and for MUTE_MS of quiet after it, the wheel is the momentum tail of the
      // gesture that turned the page, not a new gesture: swallow it, and keep the mute alive while it comes.
      const phase = phaseRef.current
      if (muted.current || phase === "out" || phase === "in") {
        muted.current = true
        if (muteTimer.current) window.clearTimeout(muteTimer.current)
        muteTimer.current = window.setTimeout(() => {
          muted.current = false
        }, MUTE_MS)
        return
      }
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.gridH : 1
      // Scrolling up is forward, to the next page (D27: "scrolling up means going to next page") — and "up" is the
      // HAND'S up, fingers moving up the trackpad, which the browser reports as a positive delta (the same as a wheel
      // rolled towards you). Not negated since 2026-09-21: negating it made a trackpad and a finger on the screen
      // disagree, because the finger handler below already reads the hand's direction.
      if (!drive(event.deltaY * unit)) return
      if (settle.current) window.clearTimeout(settle.current)
      settle.current = window.setTimeout(release, SETTLE_MS)
    },
    [metrics, drive, release],
  )
  const onTouchStart = React.useCallback((event: React.TouchEvent) => {
    touchY.current = event.touches[0]?.clientY ?? null
  }, [])
  const onTouchMove = React.useCallback(
    (event: React.TouchEvent) => {
      const y = event.touches[0]?.clientY
      if (y === undefined || touchY.current === null) return
      // A finger moving up is forward, like fingers moving up on a trackpad.
      if (!drive(touchY.current - y)) touchY.current = null
      else touchY.current = y
    },
    [drive],
  )
  const onTouchEnd = React.useCallback(() => {
    touchY.current = null
    release()
  }, [release])

  // A change of `page` from outside — ← →, an arrow, a host's toolbar — plays the turn. A request that arrives
  // mid-turn waits for the field to be idle; the effect runs again when the phase settles.
  React.useEffect(() => {
    if (page === shownRef.current) return
    const phase = phaseRef.current
    if (phase === "out" || phase === "in") return
    stop()
    if (!metrics) {
      shownRef.current = page
      setShown(page)
      setPhase("idle", 1)
      write(0)
      return
    }
    const dir: 1 | -1 = page > shownRef.current ? 1 : -1
    // A drive the other way is abandoned before the turn starts.
    if (Math.sign(progress.current) !== dir) write(0)
    complete(page, dir)
  }, [page, turn.phase, metrics, stop, setPhase, write, complete])

  React.useEffect(
    () => () => {
      stop()
      if (muteTimer.current) window.clearTimeout(muteTimer.current)
    },
    [stop],
  )

  return {
    shown,
    turn,
    turning: turn.phase !== "idle",
    rootRef,
    handlers: { onWheel, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd },
  }
}

// ── the surface ──────────────────────────────────────────────────────────────────────────────────────────────

export type RenderGridItem = (item: GridLayoutItem) => React.ReactNode

type GridPageSurfaceProps = {
  items: GridLayoutItem[]
  turn?: TurnState
  renderItem?: RenderGridItem
}

/**
 * One page's boxes as grid children. A fragment on purpose — anything that wrapped them in an element would put a
 * box between the grid and its items and the placement would stop working. With no `renderItem`, a slot item draws
 * its own content (Slots.md); anything else draws nothing.
 */
function GridPageSurface({ items, turn, renderItem }: GridPageSurfaceProps) {
  const turning = turn && turn.phase !== "idle"
  return (
    <>
      {items.map((item) => (
        <GridItem
          key={item.id}
          col={item.col}
          row={item.row}
          colSpan={item.colSpan}
          rowSpan={item.rowSpan}
          data-turn={turning ? turn.phase : undefined}
          className="relative touch-none select-none"
        >
          {renderItem ? renderItem(item) : isSlotItem(item) ? <SlotContent item={item} /> : null}
        </GridItem>
      ))}
    </>
  )
}

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
  className?: string
  onMetrics?: (metrics: GridMetrics) => void
}

/** The grid an app renders a layout with. */
function GridPages({
  layout,
  renderItem,
  overlay,
  page: pageProp,
  defaultPage = 0,
  onPageChange,
  keyboard = true,
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

  const { shown, turn, rootRef, handlers } = usePageTurn(page, metrics ? count : 1, metrics, setPage)

  React.useEffect(() => {
    if (!keyboard) return
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return
      if (event.key === "ArrowRight") setPage(page + 1)
      else if (event.key === "ArrowLeft") setPage(page - 1)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [keyboard, page, setPage])

  const items = pages?.[Math.min(shown, count - 1)]?.items ?? []

  return (
    <Grid
      ref={rootRef}
      overlay={overlay}
      onMetrics={handleMetrics}
      // touch-none: a finger on the field drives the turn, and the browser must not pan or refresh under it.
      className={cn("touch-none", className)}
      {...handlers}
    >
      <GridPageSurface items={items} turn={turn} renderItem={renderItem} />
      <GridPager page={Math.min(shown, count - 1)} count={count} onTurn={(dir) => setPage(page + dir)} bar={layout.bar} />
    </Grid>
  )
}

export { GridPages }
