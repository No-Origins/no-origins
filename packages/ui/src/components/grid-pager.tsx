"use client"

import * as React from "react"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@no-origins/ui/components/button"
import { GridItem, useGridMetrics } from "@no-origins/ui/components/grid"
import { SlotContent } from "@no-origins/ui/components/slot"
import { pagerCells, type GridLayout, type GridLayoutItem } from "@no-origins/ui/lib/grid-layout"

/**
 * The pager — the navbar (Grid.md D27, 2026-09-21; D29, 2026-09-23). A row of 1×1 cells at the bottom centre of every
 * field, on every page. It is a FIXTURE, not a placeable component: `pagerCells` reserves its cells in the model so
 * nothing is ever packed or dropped there, and `GridPages` and `GridEditor` draw it themselves.
 *
 * Since D29 the bar is a SLOT and its cells are SUB-SLOTS (Slots.md S2, S5): one item spanning the bar's cells whose
 * `children` are a layout on them, so a cell can hold anything a slot holds instead of being permanently empty. Its
 * width is the field's `pager` — a number per breakpoint in the config, even and never below two — and the ↑ ↓ pair
 * is one registry molecule (`pager-arrows`) placed in it rather than hardwired to the last two cells. `bar` overrides
 * the default arrangement; the default is D27's bar, so a caller that says nothing gets exactly what it had.
 *
 * The arrows are the scroll's buttons, and ↑ IS FORWARD: scrolling up goes to the next page (his rule, D27), so ↑
 * turns forward and ↓ back. Turning a page is a progress from 0 to 1 (grid-pages.tsx): the wheel or a finger drives
 * it by hand, a click on an arrow plays it. Whichever way, the arrow being turned towards FILLS in proportion — the
 * ↑ from its bottom up, the ↓ from its top down — reading `--grid-turn` off the grid, so the fill follows the scroll
 * without a render and matches the boxes' scale exactly — and once the page has turned, the fill LEAVES the way it
 * came as the new page is revealed, its trailing edge crossing the arrow, rather than filling again or pulling back
 * (2026-09-22). At the last page ↑ is disabled, at the first ↓ is.
 */

/** The turn, published to the bar's contents (D29). The arrows molecule takes it from here, not from props. */
export type GridTurnState = {
  page: number
  count: number
  turn: (dir: 1 | -1) => void
}

const GridTurnContext = React.createContext<GridTurnState | null>(null)

/**
 * The turn of the pager the caller sits in. Null outside a bar — which is why the arrows molecule is offered in the
 * bar only (D29): elsewhere on the field there is a turn to drive, but an ordinary slot is clipped as the page turns
 * and leaves with it, so the control would cut itself away under the finger pressing it.
 */
export function useGridTurn() {
  return React.useContext(GridTurnContext)
}

export type GridPagerProps = {
  /** The page on the field. */
  page: number
  count: number
  /** Turn one page forward (1) or back (-1). */
  onTurn: (dir: 1 | -1) => void
  /** What the bar holds, on its own cells. Omit for D27's bar: empty `card` cells, then the arrows. */
  bar?: GridLayout
}

/**
 * D27's bar on a field this wide: every cell but the last two an empty `card` slot, then the arrows molecule across
 * the last two. Built from the width rather than stored, so widening the bar in the config adds empty cells and the
 * arrows stay at the end.
 */
export function defaultPagerBar(width: number): GridLayout {
  const items: GridLayoutItem[] = []
  for (let col = 1; col <= width - 2; col++) {
    items.push({ id: `pager-cell-${col}`, col, row: 1, colSpan: 1, rowSpan: 1, slot: { fill: "card" } })
  }
  if (width >= 2) {
    items.push({
      id: "pager-arrows",
      col: width - 1,
      row: 1,
      colSpan: 2,
      rowSpan: 1,
      // The molecule draws its own two buttons on the two cells, so the slot is invisible around it (Slots.md S3).
      slot: { fill: "transparent", inset: 0 },
      component: { kind: "pager-arrows" },
    })
  }
  return { authored: { base: [{ id: "pager-bar", items }] }, shapes: { base: { cols: width, rows: 1 } } }
}

function GridPager({ page, count, onTurn, bar }: GridPagerProps) {
  const m = useGridMetrics()
  const turn = React.useMemo<GridTurnState>(() => ({ page, count, turn: onTurn }), [page, count, onTurn])

  const rect = m ? pagerCells(page, count, m.cols, m.rows, m.pager)[0] : undefined
  // The bar is authored on its own width, so the sub-slots resolve verbatim rather than being packed (D25).
  const item = React.useMemo<GridLayoutItem | null>(
    () => (rect ? { id: "pager", ...rect, slot: { fill: "transparent", inset: 0 }, children: bar ?? defaultPagerBar(rect.colSpan) } : null),
    [rect?.col, rect?.row, rect?.colSpan, rect?.rowSpan, bar],
  )
  if (!rect || !item) return null

  return (
    <GridTurnContext.Provider value={turn}>
      <GridItem col={rect.col} row={rect.row} colSpan={rect.colSpan} rowSpan={rect.rowSpan} data-pager="bar" className="relative select-none">
        <SlotContent item={item} />
      </GridItem>
    </GridTurnContext.Provider>
  )
}

/**
 * The ↑ ↓ pair — one molecule on two cells (D29), registered so it is placed in the bar rather than drawn by it. It
 * draws the two buttons on its own two cells with the field's gutter between them, so they sit on the grid exactly as
 * two 1×1 boxes did. It takes the turn from context: a component in a slot is handed props by the inspector, and the
 * turn is not a prop anyone should type.
 */
function GridPagerArrows() {
  const m = useGridMetrics()
  const state = useGridTurn()
  if (!state) return null
  return (
    <div className="grid h-full w-full grid-cols-2" style={{ gap: m?.gap ?? 12 }}>
      <PagerArrow dir="up" disabled={state.page >= state.count - 1} onClick={() => state.turn(1)} />
      <PagerArrow dir="down" disabled={state.page <= 0} onClick={() => state.turn(-1)} />
    </div>
  )
}

function PagerArrow({ dir, disabled, onClick }: { dir: "up" | "down"; disabled: boolean; onClick: () => void }) {
  const Icon = dir === "up" ? ArrowUpIcon : ArrowDownIcon
  // The filled band of this arrow, in its own direction — forward is positive and ↑ — nothing in the other: from the
  // BACK edge to the FRONT edge, measured from the edge the fill enters by (the bottom for ↑, the top for ↓). With the
  // hand the front advances and the back stays, so the band grows in; once the page has turned the front stays and
  // the back advances, so the band leaves the way it came — for ↑ the bottom of the fill rises to the top — rather
  // than pulling back or filling again (grid-pages.tsx, 2026-09-22).
  const sign = dir === "up" ? "" : "-1 * "
  const front = `max(0, calc(${sign}var(--grid-turn-fill-front, 0)))`
  const back = `max(0, calc(${sign}var(--grid-turn-fill-back, 0)))`
  const clip =
    dir === "up"
      ? `inset(calc((1 - ${front}) * 100%) 0 calc(${back} * 100%) 0)`
      : `inset(calc(${back} * 100%) 0 calc((1 - ${front}) * 100%) 0)`
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={dir === "up" ? "Next page" : "Previous page"}
      disabled={disabled}
      onClick={onClick}
      className={cn("bg-card relative size-full overflow-hidden [&_svg]:size-5")}
    >
      <Icon />
      {/* The fill: the same arrow in reverse colours, clipped to the turned share. */}
      <span aria-hidden className="bg-foreground text-background absolute inset-0 grid place-items-center" style={{ clipPath: clip }}>
        <Icon />
      </span>
    </Button>
  )
}

export { GridPager, GridPagerArrows }
