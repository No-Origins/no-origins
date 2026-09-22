"use client"

import * as React from "react"

import {
  Grid,
  DEFAULT_GRID_CONFIG,
  type GridConfig,
  type GridMetrics,
} from "@no-origins/ui/components/grid"
import {
  pagerCells,
  rectIsValid,
  resolvePages,
  withAuthored,
  type GridLayout,
  type GridLayoutItem,
  type GridPage,
  type GridRect,
  type ResolvedPages,
} from "@no-origins/ui/lib/grid-layout"
import {
  GridPageSurface,
  usePageTurn,
  type GridEditing,
  type RenderGridItem,
} from "@no-origins/ui/components/grid-pages"
import { GridPager } from "@no-origins/ui/components/grid-pager"

/**
 * The grid with its boxes editable in place: drag to move, drag a handle to resize, arrow keys to nudge,
 * shift+arrows to resize, Delete to remove.
 *
 * It edits the pages of whatever breakpoint the field is in, on the field's shape. On a DERIVED breakpoint — or an
 * authored one seen on another shape, since v2 the counts follow the box (D12) — the first edit writes the packed
 * pages down as that breakpoint's own, on this shape: it detaches, and from then on the layout there is hand-made
 * until `withoutAuthored` lets it derive again. Page operations (add, remove, move a box across) live in
 * grid-layout.ts and are the host's to wire, because the toolbar is the host's.
 */

export type GridEditorProps = {
  children?: React.ReactNode
  layout: GridLayout
  onLayoutChange: (layout: GridLayout) => void
  page: number
  onPageChange: (page: number) => void
  selected?: string | null
  onSelectedChange?: (id: string | null) => void
  config?: GridConfig
  overlay?: boolean
  rulers?: boolean
  readOnly?: boolean
  /**
   * Draw the pager (Grid.md D27) and keep its cells; false inside a slot, whose children have no pager and may use
   * every cell (Slots.md S5).
   */
  pager?: boolean
  /**
   * Cells nothing may be placed on, besides the pager's. A host editing INSIDE a slot (Slots.md §4) passes the cells
   * outside it, so a drag refuses at the slot's edge the way it refuses at the field's.
   */
  reserved?: readonly GridRect[]
  /** Lets a box be dropped INTO another (Slots.md §4). See `GridEditing`. */
  onDropInto?: NonNullable<GridEditing["onDropInto"]>
  canDropInto?: NonNullable<GridEditing["canDropInto"]>
  /** Double-click on a box (Slots.md §4: the way into a slot). */
  onItemDoubleClick?: (id: string) => void
  className?: string
  renderItem?: RenderGridItem
  onMetrics?: (metrics: GridMetrics) => void
  onResolved?: (resolved: ResolvedPages) => void
}

function GridEditor({
  children,
  layout,
  onLayoutChange,
  page,
  onPageChange,
  selected: selectedProp,
  onSelectedChange,
  config = DEFAULT_GRID_CONFIG,
  overlay = true,
  rulers = false,
  readOnly = false,
  pager = true,
  reserved: reservedProp,
  onDropInto,
  canDropInto,
  onItemDoubleClick,
  className,
  renderItem,
  onMetrics,
  onResolved,
}: GridEditorProps) {
  const [selectedState, setSelectedState] = React.useState<string | null>(null)
  const selected = selectedProp !== undefined ? selectedProp : selectedState
  const setSelected = React.useCallback(
    (id: string | null) => {
      setSelectedState(id)
      onSelectedChange?.(id)
    },
    [onSelectedChange],
  )

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
  const current = Math.min(page, count - 1)
  // The wheel and a finger turn the page here as everywhere (his report, 2026-09-21: "the scroll is not reacting to
  // the pages" in the composer); a completed turn reaches the host through onPageChange.
  const { shown, turn, turning, rootRef, handlers } = usePageTurn(current, count, metrics, onPageChange)
  const shownIndex = Math.min(shown, count - 1)
  const items = resolved?.pages[shownIndex]?.items ?? []

  const canEdit = !readOnly && !!metrics && !turning

  const reserved = React.useMemo<GridRect[]>(
    () => (metrics ? [...(pager ? pagerCells(shownIndex, count, metrics.cols, metrics.rows) : []), ...(reservedProp ?? [])] : []),
    [metrics, pager, shownIndex, count, reservedProp],
  )

  /** Write this page's items, on this field's shape. On a derived breakpoint this is the moment it detaches. */
  const commitItems = React.useCallback(
    (nextItems: GridLayoutItem[]) => {
      if (!metrics || !resolved) return
      const pages: GridPage[] = resolved.pages.map((p, i) => (i === shownIndex ? { ...p, items: nextItems } : p))
      onLayoutChange(withAuthored(layout, metrics.bp, pages, metrics))
    },
    [layout, metrics, resolved, shownIndex, onLayoutChange],
  )

  // Keyboard: with a box selected, arrows move it, shift+arrows resize it, Delete removes it. With nothing selected,
  // ← → turn the page, as the pager's arrows do (Grid.md D27).
  React.useEffect(() => {
    if (!metrics) return
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return
      if (!selected || !canEdit) {
        if (event.key === "ArrowRight" && current < count - 1) onPageChange(current + 1)
        else if (event.key === "ArrowLeft" && current > 0) onPageChange(current - 1)
        return
      }
      const item = items.find((i) => i.id === selected)
      if (!item) return

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault()
        commitItems(items.filter((i) => i.id !== selected))
        setSelected(null)
        return
      }

      const deltas: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      }
      const delta = deltas[event.key]
      if (!delta) return
      event.preventDefault()
      const [dx, dy] = delta
      const next: GridRect = event.shiftKey
        ? { ...item, colSpan: Math.max(1, item.colSpan + dx), rowSpan: Math.max(1, item.rowSpan + dy) }
        : { ...item, col: item.col + dx, row: item.row + dy }
      const others = items.filter((i) => i.id !== selected)
      if (rectIsValid(next, others, metrics.cols, metrics.rows, reserved)) {
        commitItems(items.map((i) => (i.id === selected ? { ...i, ...next } : i)))
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [canEdit, selected, metrics, items, reserved, commitItems, setSelected, current, count, onPageChange])

  return (
    <Grid
      ref={rootRef}
      config={config}
      overlay={overlay}
      rulers={rulers}
      onMetrics={handleMetrics}
      className={className}
      onPointerDown={() => setSelected(null)}
      {...handlers}
    >
      <GridPageSurface
        items={items}
        turn={turn}
        renderItem={renderItem}
        editing={canEdit ? { selected, onSelect: setSelected, onCommit: commitItems, reserved, onDropInto, canDropInto, onDoubleClick: onItemDoubleClick } : undefined}
      />
      {pager ? <GridPager page={shownIndex} count={count} onTurn={(dir) => onPageChange(Math.max(0, Math.min(count - 1, current + dir)))} /> : null}
      {/* The host's own grid children — a drop ghost from a palette (Grid.md D19), say. Placed by coordinate like
          everything else; they read the metrics from context. */}
      {children}
    </Grid>
  )
}

// ── history ──────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Undo/redo over any value, with a cap so a long session cannot grow without bound.
 *
 * One state object, updated by pure functions. An earlier version kept past/present/future as three states and
 * called `setPresent` from inside the `setPast` updater — a second undo silently did nothing, because a state
 * updater that fires other updaters is not a transition React can replay.
 */
type HistoryState<T> = { past: T[]; present: T; future: T[] }

export function useHistory<T>(initial: T, limit = 100) {
  const [state, setState] = React.useState<HistoryState<T>>({ past: [], present: initial, future: [] })

  /** Record a new value and drop the redo stack. */
  const set = React.useCallback(
    (next: T) => {
      setState((s) => ({ past: [...s.past, s.present].slice(-limit), present: next, future: [] }))
    },
    [limit],
  )

  /** Change the value WITHOUT recording it — for corrections the user did not ask for. */
  const replace = React.useCallback((next: T) => {
    setState((s) => (Object.is(s.present, next) ? s : { ...s, present: next }))
  }, [])

  const undo = React.useCallback(() => {
    setState((s) => {
      if (!s.past.length) return s
      const previous = s.past[s.past.length - 1]!
      return { past: s.past.slice(0, -1), present: previous, future: [s.present, ...s.future] }
    })
  }, [])

  const redo = React.useCallback(() => {
    setState((s) => {
      if (!s.future.length) return s
      const [next, ...rest] = s.future
      return { past: [...s.past, s.present], present: next!, future: rest }
    })
  }, [])

  const reset = React.useCallback((next: T) => setState({ past: [], present: next, future: [] }), [])

  return {
    value: state.present,
    set,
    replace,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  }
}

export { GridEditor }
