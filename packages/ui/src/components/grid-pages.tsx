"use client"

import * as React from "react"
import { cn } from "cn"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@no-origins/ui/components/button"
import {
  Grid,
  GridItem,
  DEFAULT_GRID_CONFIG,
  useGridMetrics,
  type GridBreakpoint,
  type GridConfig,
  type GridFit,
  type GridMetrics,
} from "@no-origins/ui/components/grid"
import {
  pagerCells,
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
 * Turning the page flips the boxes: the ones on show rotate edge-on and away in a wave from the top-left, then the
 * next page's boxes rotate in from the other side. Only the boxes move — the field, the rulers and the pager stay
 * where they are, because they are the room and the boxes are the furniture.
 */

/** One flip, out or in, in ms. The wave adds `FLIP_STAGGER` per diagonal on top. */
export const FLIP_MS = 260
export const FLIP_STAGGER = 22

export type FlipPhase = "idle" | "out" | "in"
export type FlipState = { phase: FlipPhase; dir: 1 | -1 }

/** Delay a box's flip by its distance from the top-left, so the page turns as a wave rather than a blink. */
export function flipDelay(rect: GridRect) {
  return (rect.col - 1 + (rect.row - 1)) * FLIP_STAGGER
}

/** How long a whole phase takes on this field — the flip plus the last diagonal's delay. */
export function flipPhaseMs(cols: number, rows: number) {
  return FLIP_MS + (cols - 1 + (rows - 1)) * FLIP_STAGGER
}

/**
 * Drive the two-phase flip. `page` is where the caller wants to be; `shown` is the page whose boxes are on the
 * field right now. They differ for one out-phase, then `shown` catches up and the in-phase plays.
 */
export function usePageFlip(page: number, metrics: GridMetrics | null, enabled = true) {
  const [shown, setShown] = React.useState(page)
  const [flip, setFlip] = React.useState<FlipState>({ phase: "idle", dir: 1 })
  // The page on the field, readable from inside a timer without the effect having to depend on it — an effect
  // that re-ran when `shown` changed would tear down the settle timer it had just armed, and the pager would stay
  // disabled forever.
  const shownRef = React.useRef(page)
  const timers = React.useRef<number[]>([])

  const clear = () => {
    for (const t of timers.current) window.clearTimeout(t)
    timers.current = []
  }

  React.useEffect(() => {
    if (page === shownRef.current) return
    clear()
    if (!enabled || !metrics) {
      shownRef.current = page
      setShown(page)
      setFlip((f) => ({ ...f, phase: "idle" }))
      return
    }
    const dir: 1 | -1 = page > shownRef.current ? 1 : -1
    const ms = flipPhaseMs(metrics.cols, metrics.rows)
    setFlip({ phase: "out", dir })
    timers.current.push(
      window.setTimeout(() => {
        shownRef.current = page
        setShown(page)
        setFlip({ phase: "in", dir })
        timers.current.push(window.setTimeout(() => setFlip({ phase: "idle", dir }), ms))
      }, ms),
    )
  }, [page, metrics, enabled])

  React.useEffect(() => clear, [])

  return { shown, flip, turning: flip.phase !== "idle" }
}

// ── the pager ────────────────────────────────────────────────────────────────────────────────────────────────

export type GridPagerProps = {
  page: number
  count: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

/** ‹ in the bottom-left cell, › in the bottom-right. Each exists only when it has somewhere to go. */
function GridPager({ page, count, onPageChange, disabled }: GridPagerProps) {
  const m = useGridMetrics()
  if (!m || count <= 1) return null
  const cells = pagerCells(page, count, m.cols, m.rows)

  return (
    <>
      {cells.map((cell) => {
        const isPrev = cell.col === 1
        return (
          <GridItem key={isPrev ? "prev" : "next"} col={cell.col} row={cell.row} data-slot="grid-pager" className="z-30">
            <Button
              variant="outline"
              size="icon"
              className="size-full"
              disabled={disabled}
              aria-label={isPrev ? `Previous page (${page} of ${count})` : `Next page (${page + 2} of ${count})`}
              onClick={(event) => {
                event.stopPropagation()
                onPageChange(page + (isPrev ? -1 : 1))
              }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {isPrev ? <ChevronLeftIcon className="rtl:rotate-180" /> : <ChevronRightIcon className="rtl:rotate-180" />}
            </Button>
          </GridItem>
        )
      })}
    </>
  )
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
}

export type RenderGridItem = (item: GridLayoutItem, state: { selected: boolean }) => React.ReactNode

export type GridPageSurfaceProps = {
  items: GridLayoutItem[]
  flip?: FlipState
  renderItem?: RenderGridItem
  /** Present when the boxes can be dragged and resized; absent for a read-only surface. */
  editing?: GridEditing
}

function DefaultItem({ item, selected }: { item: GridLayoutItem; selected: boolean }) {
  return (
    <div
      className={cn(
        "bg-card flex h-full w-full flex-col items-center justify-center gap-1 border p-2 text-center",
        selected ? "border-foreground ring-ring/40 ring-2" : "border-border",
      )}
    >
      <span className="text-xs font-semibold tracking-wide uppercase">{item.label ?? item.id}</span>
      <span className="text-muted-foreground font-mono text-[10px]">
        {item.col},{item.row} · {item.colSpan}×{item.rowSpan}
      </span>
    </div>
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
function GridPageSurface({ items, flip, renderItem, editing }: GridPageSurfaceProps) {
  const m = useGridMetrics()
  const [drag, setDrag] = React.useState<Drag | null>(null)
  const [ghost, setGhost] = React.useState<{ rect: GridRect; valid: boolean } | null>(null)

  const stepX = (m?.cellW ?? 0) + (m?.gap ?? 0)
  const stepY = (m?.cellH ?? 0) + (m?.gap ?? 0)

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
    setGhost({ rect, valid: rectIsValid(rect, others, m.cols, m.rows, editing.reserved) })
  }

  const end = (event: React.PointerEvent) => {
    if (!drag || !m || !editing) return
    event.stopPropagation()
    const rect = rectFor(drag, event.clientX - drag.x, event.clientY - drag.y)
    const o = drag.origin
    const moved = rect.col !== o.col || rect.row !== o.row || rect.colSpan !== o.colSpan || rect.rowSpan !== o.rowSpan
    const others = items.filter((i) => i.id !== drag.id)
    // A click that went nowhere is a selection, not an edit: committing it would detach a derived breakpoint and
    // put a no-op on the undo stack.
    if (moved && rectIsValid(rect, others, m.cols, m.rows, editing.reserved)) {
      editing.onCommit(items.map((i) => (i.id === drag.id ? { ...i, ...rect } : i)))
    }
    setDrag(null)
    setGhost(null)
  }

  const flipping = flip && flip.phase !== "idle"

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
            data-flip={flipping ? flip.phase : undefined}
            style={flipping ? { animationDelay: `${flipDelay(item)}ms` } : undefined}
            className={cn(
              "relative touch-none select-none",
              isDragging && "opacity-40",
              editing && "cursor-grab active:cursor-grabbing",
            )}
            onPointerDown={editing ? (event) => begin(event, item) : undefined}
            onPointerMove={editing ? move : undefined}
            onPointerUp={editing ? end : undefined}
            onPointerCancel={editing ? end : undefined}
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
            ghost.valid ? "border-foreground bg-foreground/5" : "border-destructive bg-destructive/10",
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
  fit?: GridFit
  fill?: boolean
  gap?: number
  pad?: number
  overlay?: boolean
  rulers?: boolean
  breakpoint?: GridBreakpoint
  /** Controlled page; omit to let the pager manage it. */
  page?: number
  defaultPage?: number
  onPageChange?: (page: number) => void
  /** ← and → turn the page while nothing is focused that wants the keys. */
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
  fit = "square",
  fill = false,
  gap,
  pad,
  overlay,
  rulers,
  breakpoint,
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

  const resolved = React.useMemo(
    () => (metrics ? resolvePages(layout, metrics, config) : null),
    [layout, metrics, config],
  )
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

  const { shown, flip, turning } = usePageFlip(page, metrics)

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
      config={config}
      fit={fit}
      fill={fill}
      gap={gap}
      pad={pad}
      overlay={overlay}
      rulers={rulers}
      breakpoint={breakpoint}
      onMetrics={handleMetrics}
      className={className}
      style={{ "--grid-flip-dir": flip.dir } as React.CSSProperties}
    >
      <GridPageSurface items={items} flip={flip} renderItem={renderItem} />
      <GridPager page={page} count={count} onPageChange={setPage} disabled={turning} />
    </Grid>
  )
}

export { GridPages, GridPageSurface, GridPager }
