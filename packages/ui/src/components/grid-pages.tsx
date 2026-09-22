"use client"

import * as React from "react"
import { cn } from "cn"
import { isSlotItem, Slot, SlotContent } from "@no-origins/ui/components/slot"
import {
  Grid,
  GridItem,
  DEFAULT_GRID_CONFIG,
  useGridMetrics,
  type GridConfig,
  type GridMetrics,
} from "@no-origins/ui/components/grid"
import { GridPager } from "@no-origins/ui/components/grid-pager"
import {
  rectIsValid,
  resolvePages,
  type GridLayout,
  type GridLayoutItem,
  type GridRect,
  type ResolvedPages,
} from "@no-origins/ui/lib/grid-layout"

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
 * host's toolbar play the same turn over time. Only the boxes move — the field, the rulers and the pager stay where
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
  /** Wheel and touch — the hand turning the page. Every grid takes them, the composer's included. */
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

type Handle = { id: string; hx: -1 | 0 | 1; hy: -1 | 0 | 1; className: string; cursor: string }

const HANDLES: Handle[] = [
  { id: "nw", hx: -1, hy: -1, className: "-top-1 -left-1", cursor: "nwse-resize" },
  { id: "n", hx: 0, hy: -1, className: "-top-1 left-1/2 -translate-x-1/2", cursor: "ns-resize" },
  { id: "ne", hx: 1, hy: -1, className: "-top-1 -right-1", cursor: "nesw-resize" },
  { id: "e", hx: 1, hy: 0, className: "top-1/2 -right-1 -translate-y-1/2", cursor: "ew-resize" },
  { id: "se", hx: 1, hy: 1, className: "-right-1 -bottom-1", cursor: "nwse-resize" },
  { id: "s", hx: 0, hy: 1, className: "-bottom-1 left-1/2 -translate-x-1/2", cursor: "ns-resize" },
  { id: "sw", hx: -1, hy: 1, className: "-bottom-1 -left-1", cursor: "nesw-resize" },
  { id: "w", hx: -1, hy: 0, className: "top-1/2 -left-1 -translate-y-1/2", cursor: "ew-resize" },
]

type Drag =
  | { kind: "move"; id: string; x: number; y: number; origin: GridRect }
  | { kind: "resize"; id: string; x: number; y: number; origin: GridRect; hx: -1 | 0 | 1; hy: -1 | 0 | 1 }

export type GridEditing = {
  selected: string | null
  onSelect: (id: string | null) => void
  onCommit: (items: GridLayoutItem[]) => void
  /** Cells nothing may be placed on — the pager's. */
  reserved: readonly GridRect[]
  /**
   * Present when a box may be dropped INTO another (Slots.md §4): a move that would land on another box is not
   * refused but offered to the host, with the cell under the pointer relative to the target. Return false to refuse
   * this particular target, and the ghost stays red.
   */
  onDropInto?: (itemId: string, targetId: string, cell: { col: number; row: number }) => boolean
  /** Whether a target can take a drop at all — a slot with a component in it cannot, say. */
  canDropInto?: (targetId: string) => boolean
  /** Double-click on a box — the host's way in to a slot's children (Slots.md §4). */
  onDoubleClick?: (id: string) => void
}

export type RenderGridItem = (item: GridLayoutItem, state: { selected: boolean }) => React.ReactNode

export type GridPageSurfaceProps = {
  items: GridLayoutItem[]
  turn?: TurnState
  renderItem?: RenderGridItem
  /** Present when the boxes can be dragged and resized; absent for a read-only surface. */
  editing?: GridEditing
}

/**
 * What an item shows when the host gives no `renderItem`: a slot's content (Slots.md) when it is one, else the
 * editor's tile — the label and the coordinates. Selection is a ring around either.
 */
function DefaultItem({ item, selected }: { item: GridLayoutItem; selected: boolean }) {
  if (isSlotItem(item)) {
    return (
      <div className={cn("relative h-full w-full", selected && "ring-foreground ring-2")}>
        <SlotContent item={item} />
      </div>
    )
  }
  return (
    <Slot fill="card" inset={8} className={cn("place-items-center text-center", selected && "border-foreground ring-ring/40 ring-2")}>
      <span className="flex flex-col items-center gap-1">
        <span className="text-xs font-semibold tracking-wide uppercase">{item.label ?? item.id}</span>
        <span className="text-muted-foreground font-mono text-[10px]">
          {item.col},{item.row} · {item.colSpan}×{item.rowSpan}
        </span>
      </span>
    </Slot>
  )
}

/**
 * One page's boxes as grid children. A fragment on purpose — anything that wrapped them in an element would put a
 * box between the grid and its items and the placement would stop working.
 *
 * With `editing`, a box drags to move and its eight handles drag to resize. Every gesture snaps to whole cells and
 * is REFUSED rather than reflowed when it would leave the field, land on another box or on a pager cell — the ghost
 * turns red and the box stays where it was.
 */
function GridPageSurface({ items, turn, renderItem, editing }: GridPageSurfaceProps) {
  const m = useGridMetrics()
  const [drag, setDrag] = React.useState<Drag | null>(null)
  const [ghost, setGhost] = React.useState<{ rect: GridRect; valid: boolean; into?: { id: string; cell: { col: number; row: number } } } | null>(null)

  /** The cell under the pointer, from the field's own box. Null off the field. */
  const cellUnder = (event: React.PointerEvent) => {
    if (!m) return null
    const tracks = (event.currentTarget as HTMLElement).closest('[data-slot="grid-tracks"]')
    if (!tracks) return null
    const box = tracks.getBoundingClientRect()
    const col = Math.floor((event.clientX - box.left) / stepX) + 1
    const row = Math.floor((event.clientY - box.top) / stepY) + 1
    if (col < 1 || row < 1 || col > m.cols || row > m.rows) return null
    return { col, row }
  }

  // One cell's step in SCREEN px. Pointer deltas arrive in screen px; inside a scaled GridFrame (Grid.md D11) the
  // cell is drawn smaller than it is laid out, so the step it is measured against has to shrink with it. The cell is
  // square, so one step serves both axes.
  const scale = m?.scale ?? 1
  const step = ((m?.cell ?? 0) + (m?.gap ?? 0)) * scale
  const stepX = step
  const stepY = step

  const rectFor = React.useCallback(
    (d: Drag, dx: number, dy: number): GridRect => {
      const dCols = stepX > 0 ? Math.round(dx / stepX) : 0
      const dRows = stepY > 0 ? Math.round(dy / stepY) : 0
      const o = d.origin
      if (d.kind === "move") return { ...o, col: o.col + dCols, row: o.row + dRows }

      let { col, row, colSpan, rowSpan } = o
      if (d.hx === 1) colSpan = o.colSpan + dCols
      if (d.hx === -1) {
        col = o.col + dCols
        colSpan = o.colSpan - dCols
      }
      if (d.hy === 1) rowSpan = o.rowSpan + dRows
      if (d.hy === -1) {
        row = o.row + dRows
        rowSpan = o.rowSpan - dRows
      }
      // A box never collapses: the edge being dragged stops at one cell rather than inverting.
      if (colSpan < 1) {
        colSpan = 1
        if (d.hx === -1) col = o.col + o.colSpan - 1
      }
      if (rowSpan < 1) {
        rowSpan = 1
        if (d.hy === -1) row = o.row + o.rowSpan - 1
      }
      return { col, row, colSpan, rowSpan }
    },
    [stepX, stepY],
  )

  const begin = (event: React.PointerEvent, item: GridLayoutItem, handle?: Handle) => {
    if (!editing) return
    event.preventDefault()
    event.stopPropagation()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    editing.onSelect(item.id)
    const origin: GridRect = { col: item.col, row: item.row, colSpan: item.colSpan, rowSpan: item.rowSpan }
    setDrag(
      handle
        ? { kind: "resize", id: item.id, x: event.clientX, y: event.clientY, origin, hx: handle.hx, hy: handle.hy }
        : { kind: "move", id: item.id, x: event.clientX, y: event.clientY, origin },
    )
    setGhost({ rect: origin, valid: true })
  }

  const move = (event: React.PointerEvent) => {
    if (!drag || !m || !editing) return
    // A handle is a child of its box, so without this the box's own handler runs on the same event and the
    // gesture is applied — and committed — twice.
    event.stopPropagation()
    const rect = rectFor(drag, event.clientX - drag.x, event.clientY - drag.y)
    const others = items.filter((i) => i.id !== drag.id)
    const valid = rectIsValid(rect, others, m.cols, m.rows, editing.reserved)
    // Not valid as a move — but the pointer may be over a box that takes drops: then the ghost is that box.
    if (!valid && drag.kind === "move" && editing.onDropInto) {
      const cell = cellUnder(event)
      const target = cell && others.find((o) => o.col <= cell.col && cell.col < o.col + o.colSpan && o.row <= cell.row && cell.row < o.row + o.rowSpan)
      if (target && (editing.canDropInto?.(target.id) ?? true)) {
        setGhost({
          rect: { col: target.col, row: target.row, colSpan: target.colSpan, rowSpan: target.rowSpan },
          valid: true,
          into: { id: target.id, cell: { col: cell.col - target.col + 1, row: cell.row - target.row + 1 } },
        })
        return
      }
    }
    setGhost({ rect, valid })
  }

  const end = (event: React.PointerEvent) => {
    if (!drag || !m || !editing) return
    event.stopPropagation()
    const rect = rectFor(drag, event.clientX - drag.x, event.clientY - drag.y)
    const o = drag.origin
    const moved = rect.col !== o.col || rect.row !== o.row || rect.colSpan !== o.colSpan || rect.rowSpan !== o.rowSpan
    const others = items.filter((i) => i.id !== drag.id)
    if (ghost?.into && editing.onDropInto) {
      editing.onDropInto(drag.id, ghost.into.id, ghost.into.cell)
    } else if (moved && rectIsValid(rect, others, m.cols, m.rows, editing.reserved)) {
      // A click that went nowhere is a selection, not an edit: committing it would detach a derived breakpoint and
      // put a no-op on the undo stack.
      editing.onCommit(items.map((i) => (i.id === drag.id ? { ...i, ...rect } : i)))
    }
    setDrag(null)
    setGhost(null)
  }

  const turning = turn && turn.phase !== "idle"

  return (
    <>
      {items.map((item) => {
        const isSelected = editing?.selected === item.id
        const isDragging = drag?.id === item.id
        return (
          <GridItem
            key={item.id}
            col={item.col}
            row={item.row}
            colSpan={item.colSpan}
            rowSpan={item.rowSpan}
            data-selected={isSelected || undefined}
            data-turn={turning ? turn.phase : undefined}
            className={cn(
              "relative touch-none select-none",
              isDragging && "opacity-40",
              editing && "cursor-grab active:cursor-grabbing",
            )}
            onPointerDown={editing ? (event) => begin(event, item) : undefined}
            onPointerMove={editing ? move : undefined}
            onPointerUp={editing ? end : undefined}
            onPointerCancel={editing ? end : undefined}
            onDoubleClick={
              editing?.onDoubleClick
                ? (event) => {
                    event.stopPropagation()
                    editing.onDoubleClick!(item.id)
                  }
                : undefined
            }
          >
            {renderItem ? renderItem(item, { selected: isSelected }) : <DefaultItem item={item} selected={isSelected} />}

            {isSelected && editing
              ? HANDLES.map((handle) => (
                  <span
                    key={handle.id}
                    role="presentation"
                    className={cn("bg-background border-foreground absolute z-20 size-2 border touch-none", handle.className)}
                    style={{ cursor: handle.cursor }}
                    onPointerDown={(event) => begin(event, item, handle)}
                    onPointerMove={move}
                    onPointerUp={end}
                    onPointerCancel={end}
                  />
                ))
              : null}
          </GridItem>
        )
      })}

      {ghost ? (
        <GridItem
          col={ghost.rect.col}
          row={ghost.rect.row}
          colSpan={ghost.rect.colSpan}
          rowSpan={ghost.rect.rowSpan}
          aria-hidden
          className={cn(
            "pointer-events-none z-10 border-2 border-dashed",
            ghost.into ? "border-foreground bg-foreground/10" : ghost.valid ? "border-foreground bg-foreground/5" : "border-destructive bg-destructive/10",
          )}
        />
      ) : null}
    </>
  )
}

// ── the runtime ──────────────────────────────────────────────────────────────────────────────────────────────

export type GridPagesProps = {
  layout: GridLayout
  renderItem?: RenderGridItem
  config?: GridConfig
  overlay?: boolean
  rulers?: boolean
  /** Controlled page; omit to let the pager manage it. */
  page?: number
  defaultPage?: number
  onPageChange?: (page: number) => void
  /** ← and → turn the page while nothing is focused that wants the keys. The wheel, a finger and the pager's arrows always do. */
  keyboard?: boolean
  className?: string
  onMetrics?: (metrics: GridMetrics) => void
  onResolved?: (resolved: ResolvedPages) => void
}

/** The read-only grid an app renders a layout with. The editor is this plus the tools. */
function GridPages({
  layout,
  renderItem,
  config = DEFAULT_GRID_CONFIG,
  overlay,
  rulers,
  page: pageProp,
  defaultPage = 0,
  onPageChange,
  keyboard = true,
  className,
  onMetrics,
  onResolved,
}: GridPagesProps) {
  const [metrics, setMetrics] = React.useState<GridMetrics | null>(null)
  const handleMetrics = React.useCallback(
    (next: GridMetrics) => {
      setMetrics(next)
      onMetrics?.(next)
    },
    [onMetrics],
  )

  const resolved = React.useMemo(() => (metrics ? resolvePages(layout, metrics) : null), [layout, metrics])
  React.useEffect(() => {
    if (resolved) onResolved?.(resolved)
  }, [resolved, onResolved])

  const count = resolved?.pages.length ?? 1
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

  const items = resolved?.pages[Math.min(shown, count - 1)]?.items ?? []

  return (
    <Grid
      ref={rootRef}
      config={config}
      overlay={overlay}
      rulers={rulers}
      onMetrics={handleMetrics}
      // touch-none: a finger on the field drives the turn, and the browser must not pan or refresh under it.
      className={cn("touch-none", className)}
      {...handlers}
    >
      <GridPageSurface items={items} turn={turn} renderItem={renderItem} />
      <GridPager page={Math.min(shown, count - 1)} count={count} onTurn={(dir) => setPage(page + dir)} />
    </Grid>
  )
}

export { GridPages, GridPageSurface }
