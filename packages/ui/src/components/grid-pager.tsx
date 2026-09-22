"use client"

import * as React from "react"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@no-origins/ui/components/button"
import { GridItem, useGridMetrics } from "@no-origins/ui/components/grid"
import { Slot } from "@no-origins/ui/components/slot"
import { pagerCells } from "@no-origins/ui/lib/grid-layout"

/**
 * The pager — the navbar (Grid.md D27, 2026-09-21). A row of 1×1 cells at the bottom centre of every field, on
 * every page: four empty, then ↑ and ↓. It is a FIXTURE, not a placeable component: `pagerCells` reserves its cells
 * in the model so nothing is ever packed or dropped there, and `GridPages` and `GridEditor` draw it themselves.
 *
 * The arrows are the scroll's buttons, and ↑ IS FORWARD: scrolling up goes to the next page (his rule, D27), so ↑
 * turns forward and ↓ back. Turning a page is a progress from 0 to 1 (grid-pages.tsx): the wheel or a finger drives
 * it by hand, a click on an arrow plays it. Whichever way, the arrow being turned towards FILLS in proportion — the
 * ↑ from its bottom up, the ↓ from its top down — reading `--grid-turn` off the grid, so the fill follows the scroll
 * without a render and matches the boxes' scale exactly — and once the page has turned, the fill LEAVES the way it
 * came as the new page is revealed, its trailing edge crossing the arrow, rather than filling again or pulling back
 * (2026-09-22). At the last page ↑ is disabled, at the first ↓ is.
 */

export type GridPagerProps = {
  /** The page on the field. */
  page: number
  count: number
  /** Turn one page forward (1) or back (-1). */
  onTurn: (dir: 1 | -1) => void
}

function GridPager({ page, count, onTurn }: GridPagerProps) {
  const m = useGridMetrics()
  if (!m) return null
  const rect = pagerCells(page, count, m.cols, m.rows)[0]
  if (!rect) return null

  const cells = Array.from({ length: rect.colSpan }, (_, i) => rect.col + i)
  // The last two cells are the arrows; on a two-wide field that is all there is.
  const upCol = cells[cells.length - 2]
  const downCol = cells[cells.length - 1]

  return (
    <>
      {cells.map((col) => {
        const arrow = col === upCol ? "up" : col === downCol ? "down" : null
        return (
          <GridItem key={col} col={col} row={rect.row} data-pager={arrow ?? "empty"} className="relative select-none">
            {arrow ? (
              <PagerArrow dir={arrow} disabled={arrow === "up" ? page >= count - 1 : page <= 0} onClick={() => onTurn(arrow === "up" ? 1 : -1)} />
            ) : (
              <Slot fill="card" />
            )}
          </GridItem>
        )
      })}
    </>
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

export { GridPager }
