"use client"

import * as React from "react"

import {
  Grid,
  DEFAULT_GRID_CONFIG,
  type GridBreakpoint,
  type GridConfig,
  type GridFit,
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
  GridPager,
  GridPageSurface,
  usePageFlip,
  type RenderGridItem,
} from "@no-origins/ui/components/grid-pages"

/**
 * The grid with its boxes editable in place: drag to move, drag a handle to resize, arrow keys to nudge,
 * shift+arrows to resize, Delete to remove.
 *
 * It edits the pages of whatever breakpoint the field is in. On a DERIVED breakpoint the first edit writes the
 * derived pages down as that breakpoint's own — it detaches — and from then on the layout there is hand-made until
 * `withoutAuthored` lets it derive again. Page operations (add, remove, move a box across) live in grid-layout.ts
 * and are the host's to wire, because the toolbar is the host's.
 */

export type GridEditorProps = {
  layout: GridLayout
  onLayoutChange: (layout: GridLayout) => void
  page: number
  onPageChange: (page: number) => void
  selected?: string | null
  onSelectedChange?: (id: string | null) => void
  config?: GridConfig
  fit?: GridFit
  fill?: boolean
  gap?: number
  pad?: number
  overlay?: boolean
  rulers?: boolean
  breakpoint?: GridBreakpoint
  readOnly?: boolean
  className?: string
  renderItem?: RenderGridItem
  onMetrics?: (metrics: GridMetrics) => void
  onResolved?: (resolved: ResolvedPages) => void
}

function GridEditor({
  layout,
  onLayoutChange,
  page,
  onPageChange,
  selected: selectedProp,
  onSelectedChange,
  config = DEFAULT_GRID_CONFIG,
  fit = "square",
  fill = false,
  gap,
  pad,
  overlay = true,
  rulers = false,
  breakpoint,
  readOnly = false,
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

  const resolved = React.useMemo(
    () => (metrics ? resolvePages(layout, metrics, config) : null),
    [layout, metrics, config],
  )
  React.useEffect(() => {
    if (resolved) onResolved?.(resolved)
  }, [resolved, onResolved])

  const count = resolved?.pages.length ?? 1
  const current = Math.min(page, count - 1)
  const { shown, flip, turning } = usePageFlip(current, metrics)
  const shownIndex = Math.min(shown, count - 1)
  const items = resolved?.pages[shownIndex]?.items ?? []

  // A transposed field (a phone on its side) is never authored directly — its pages are always derived.
  const canEdit = !readOnly && !!metrics && !metrics.transposed && !turning

  const reserved = React.useMemo<GridRect[]>(
    () => (metrics ? pagerCells(shownIndex, count, metrics.cols, metrics.rows) : []),
    [metrics, shownIndex, count],
  )

  /** Write this page's items. On a derived breakpoint this is the moment it detaches. */
  const commitItems = React.useCallback(
    (nextItems: GridLayoutItem[]) => {
      if (!metrics || !resolved) return
      const pages: GridPage[] = resolved.pages.map((p, i) => (i === shownIndex ? { ...p, items: nextItems } : p))
      onLayoutChange(withAuthored(layout, metrics.bp, pages))
    },
    [layout, metrics, resolved, shownIndex, onLayoutChange],
  )

  // Keyboard: arrows move the selection, shift+arrows resize it, Delete removes it.
  React.useEffect(() => {
    if (!canEdit || !selected || !metrics) return
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return
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
  }, [canEdit, selected, metrics, items, reserved, commitItems, setSelected])

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
      onPointerDown={() => setSelected(null)}
    >
      <GridPageSurface
        items={items}
        flip={flip}
        renderItem={renderItem}
        editing={canEdit ? { selected, onSelect: setSelected, onCommit: commitItems, reserved } : undefined}
      />
      <GridPager page={current} count={count} onPageChange={onPageChange} disabled={turning} />
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
