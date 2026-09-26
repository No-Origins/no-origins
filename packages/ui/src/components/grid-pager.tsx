"use client"

import * as React from "react"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@no-origins/ui/components/button"
import { GridItem, useGridMetrics } from "@no-origins/ui/components/grid"
import { Slot, SlotContent } from "@no-origins/ui/components/slot"
import { pagerCells, type GridLayout, type GridLayoutItem } from "@no-origins/ui/lib/grid-layout"

/**
 * The pager — the navbar (Grid.md D27, 2026-09-21; D29, 2026-09-23). A row of 1×1 cells at the bottom centre of every
 * field, on every page. It is a FIXTURE, not a placeable component: `pagerCells` reserves its cells in the model so
 * nothing is ever packed there, and `GridPages` draws it itself.
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
 * ↑ from its bottom up, the ↓ from its top down — reading the fill's two edges off the bar, where the turn writes them,
 * so the fill follows the scroll without a render; it is the one thing on the field that does, since the boxes stay
 * whole until the ripple washes them away (Grid.md D37) — and once the page has turned, the fill LEAVES the way it came
 * as the new page fades in, its trailing edge crossing the arrow, rather than filling again or pulling back
 * (2026-09-22). At the last page ↑ is disabled, at the first ↓ is. Where the grid ripples between pages (Grid.md
 * D32), the fill is the colour of the ripple the turn plays — lime or violet — rather than the reverse colours.
 *
 * Since D36 (2026-09-25) a bar may number its pages instead: `numberedPagerBar` puts one arrow on each end cell and a
 * page number on every cell between, the arrows split into one registry entry a cell (`pager-arrow`) and the numbers
 * one a cell too (`pager-page`), sliding to keep the page in view when there are more pages than cells.
 */

/** The turn, published to the bar's contents (D29). The arrows and the page numbers take it from here, not from props. */
export type GridTurnState = {
  page: number
  /**
   * The page the field is turning to: `page` at rest, and the next page from the moment the last page's boxes have gone
   * — through the ripple's hold, where a hand still scrolling moves it on a page a pass (D32, D35).
   */
  coming: number
  count: number
  turn: (dir: 1 | -1) => void
  /** Turn straight to `page`: one turn and one ripple, however far it is (D36). */
  go: (page: number) => void
}

const GridTurnContext = React.createContext<GridTurnState | null>(null)

/**
 * The turn of the pager the caller sits in. Null outside a bar — which is why the arrows molecule is offered in the
 * bar only (D29): elsewhere on the field there is a turn to drive, but an ordinary slot is washed away as the page
 * turns (D37) and leaves with it, so the control would cut itself away under the finger pressing it.
 */
export function useGridTurn() {
  return React.useContext(GridTurnContext)
}

export type GridPagerProps = {
  /** The page on the field. */
  page: number
  /** The page the field is turning to; `page` when omitted. */
  coming?: number
  count: number
  /** Turn one page forward (1) or back (-1). */
  onTurn: (dir: 1 | -1) => void
  /** Turn straight to a page. */
  onGo: (page: number) => void
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

/**
 * The numbered bar (Grid.md D36, 2026-09-25; the portfolio's, Portfolio.md P14): the arrow that turns back on the first
 * cell, the arrow that turns forward on the last, and a page number on every cell between. Two cells wide it is just
 * the two arrows. Built from the width, like D27's.
 */
export function numberedPagerBar(width: number): GridLayout {
  const cell = (id: string, col: number, component: GridLayoutItem["component"]): GridLayoutItem => ({
    id,
    col,
    row: 1,
    colSpan: 1,
    rowSpan: 1,
    slot: { fill: "transparent", inset: 0 },
    component,
  })
  const items: GridLayoutItem[] = []
  if (width >= 2) {
    const numbers = width - 2
    items.push(cell("pager-back", 1, { kind: "pager-arrow", props: { dir: "down" } }))
    for (let at = 0; at < numbers; at++) items.push(cell(`pager-page-${at}`, at + 2, { kind: "pager-page", props: { at, of: numbers } }))
    items.push(cell("pager-forward", width, { kind: "pager-arrow", props: { dir: "up" } }))
  }
  return { authored: { base: [{ id: "pager-bar", items }] }, shapes: { base: { cols: width, rows: 1 } } }
}

/**
 * Which pages `cells` number cells show (D36): every page when they fit, else a run of `cells` pages holding `page`
 * second — one page back, the rest ahead — slid against the first page and the last.
 */
export function pagerWindow(page: number, count: number, cells: number): number[] {
  const n = Math.max(0, Math.min(cells, count))
  const start = Math.max(0, Math.min(page - 1, count - n))
  return Array.from({ length: n }, (_, i) => start + i)
}

/** Memoised: the turn renders its grid at every phase, and the bar has nothing to redraw until the page or count moves. */
const GridPager = React.memo(function GridPager({ page, coming = page, count, onTurn, onGo, bar }: GridPagerProps) {
  const m = useGridMetrics()
  const turn = React.useMemo<GridTurnState>(
    () => ({ page, coming, count, turn: onTurn, go: onGo }),
    [page, coming, count, onTurn, onGo],
  )

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
})

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

/**
 * One arrow on one cell — the pair split (D36), so a bar can put the arrow that turns back on its first cell and the one
 * that turns forward on its last. `up` is forward, as everywhere in the pager (D27); the glyphs are swapped as they are
 * in the pair.
 */
function GridPagerArrow({ dir }: { dir: "up" | "down" }) {
  const state = useGridTurn()
  if (!state) return null
  return dir === "up" ? (
    <PagerArrow dir="up" disabled={state.page >= state.count - 1} onClick={() => state.turn(1)} />
  ) : (
    <PagerArrow dir="down" disabled={state.page <= 0} onClick={() => state.turn(-1)} />
  )
}

/**
 * One page number on one cell (D36): the `at`-th of the `of` pages `pagerWindow` shows. It marks the page the field is
 * turning to rather than the one on it, so a hand turning on through the empty field sees the number run ahead of it
 * (D35); a press turns straight to its page. A cell with no page — a layout with fewer pages than cells — is an empty
 * `card` cell, like D27's.
 */
function GridPagerPage({ at, of }: { at: number; of: number }) {
  const state = useGridTurn()
  if (!state) return null
  const page = pagerWindow(state.coming, state.count, of)[at]
  if (page === undefined) return <Slot fill="card" />
  const current = page === state.coming
  return (
    <Button
      variant={current ? "default" : "outline"}
      size="icon"
      aria-label={`Page ${page + 1}`}
      aria-current={current ? "page" : undefined}
      onClick={() => state.go(page)}
      className={cn("size-full text-sm tracking-normal tabular-nums", !current && "bg-card")}
    >
      {page + 1}
    </Button>
  )
}

function PagerArrow({ dir, disabled, onClick }: { dir: "up" | "down"; disabled: boolean; onClick: () => void }) {
  // Icons are swapped against the turn direction on purpose: the button that turns forward ("up") wears the ↓ glyph
  // and the one that turns back ("down") wears ↑ — his call, the arrows read more naturally this way (2026-09-23).
  const Icon = dir === "up" ? ArrowDownIcon : ArrowUpIcon
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
      {/* The fill: the same arrow clipped to the turned share — in reverse colours, or, where the grid ripples between
          pages, in the colour of the ripple the turn plays, lime or violet, with a dark glyph that reads on both
          (Grid.md D32; the turn sets --grid-turn-fill-color, grid-pages.tsx). */}
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center"
        style={{
          clipPath: clip,
          background: "var(--grid-turn-fill-color, var(--foreground))",
          color: "var(--grid-turn-fill-ink, var(--background))",
        }}
      >
        <Icon />
      </span>
    </Button>
  )
}

export { GridPager, GridPagerArrow, GridPagerArrows, GridPagerPage }
