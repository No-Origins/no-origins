"use client"

import * as React from "react"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@no-origins/ui/components/button"
import { GRID_SPACING, GridItem, useGridMetrics } from "@no-origins/ui/components/grid"
import { Slot, SlotContent } from "@no-origins/ui/components/slot"
import { Text } from "@no-origins/ui/components/text"
import { useCellMotion } from "@no-origins/ui/hooks/use-cell-motion"
import { flowSpots, stateOf, type CellFlow, type CellFrame, type CellState } from "@no-origins/ui/lib/cell-motion"
import { pagerCells, type GridLayout, type GridLayoutItem } from "@no-origins/ui/lib/grid-layout"

/**
 * The pager — the navbar (Grid.md D27, D29). A row of 1×1 cells at the bottom centre of every
 * field, on every page. It is a FIXTURE, not a placeable component: `pagerCells` reserves its cells in the model so
 * nothing is ever packed there, and `GridPages` draws it itself.
 *
 * The bar is a SLOT and its cells are SUB-SLOTS (D29; Slots.md S2, S5): one item spanning the bar's cells whose
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
 * whole until the turn commits and the page fades away (Grid.md D37, D49) — and once the page has turned, the fill
 * LEAVES the way it came as the new page arrives, its trailing edge crossing the arrow, rather than filling again or
 * pulling back. At the last page ↑ is disabled, at the first ↓ is.
 *
 * A bar may number its pages instead (D36): `numberedPagerBar` puts one arrow on each end cell and the pages between,
 * the arrows split into one registry entry a cell (`pager-arrow`). The page the field is on grows to two cells to show
 * its number and title, beside the pages before and after it (D46), and the pages are one block (`pager-pages`) that
 * plays movement (Motion.md M9) as the page changes (D47).
 */

/** The turn, published to the bar's contents (D29). The arrows and the page numbers take it from here, not from props. */
export type GridTurnState = {
  page: number
  /**
   * The page the field is turning to: `page` at rest, and the next page from the moment the turn commits — through the
   * hold while the last page fades away, where a hand still scrolling moves it on a page a step (D35, D49).
   */
  coming: number
  count: number
  /** Each page's title, for the numbered bar (D46); undefined for a page with none. */
  titles: readonly (string | undefined)[]
  turn: (dir: 1 | -1) => void
  /** Turn straight to `page`: one turn, however far it is (D36). */
  go: (page: number) => void
}

const GridTurnContext = React.createContext<GridTurnState | null>(null)

/**
 * The turn of the pager the caller sits in. Null outside a bar — which is why the arrows molecule is offered in the
 * bar only (D29): elsewhere on the field there is a turn to drive, but an ordinary slot fades away as the page turns
 * (D37) and leaves with it, so the control would vanish under the finger pressing it.
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
  /** Each page's title (D46). */
  titles?: readonly (string | undefined)[]
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
 * The numbered bar (Grid.md D36, 2026-09-25; D46, D47, 2026-09-27): the arrow that turns back on the first cell, the
 * arrow that turns forward on the last, and between them the pages, one block (`pager-pages`) in which the page the
 * field is on is grown to two cells with its number and title. Two cells wide it is just the two arrows. Built from the
 * width, like D27's.
 */
export function numberedPagerBar(width: number): GridLayout {
  const cell = (id: string, col: number, colSpan: number, component: GridLayoutItem["component"]): GridLayoutItem => ({
    id,
    col,
    row: 1,
    colSpan,
    rowSpan: 1,
    slot: { fill: "transparent", inset: 0 },
    component,
  })
  const items: GridLayoutItem[] = []
  if (width >= 2) {
    items.push(cell("pager-back", 1, 1, { kind: "pager-arrow", props: { dir: "down" } }))
    if (width >= 4) items.push(cell("pager-pages", 2, width - 2, { kind: "pager-pages", props: { cells: width - 2 } }))
    items.push(cell("pager-forward", width, 1, { kind: "pager-arrow", props: { dir: "up" } }))
  }
  return { authored: { base: [{ id: "pager-bar", items }] }, shapes: { base: { cols: width, rows: 1 } } }
}

/**
 * The first page `cells` cells show with the page on the field grown to two (D47): as many pages as fit, `cells − 1`,
 * holding the page at the middle of them, slid against the first page and the last. On six cells, which leave four
 * between the arrows, the first page stands on the bar's second cell, a page with pages either side on its middle two,
 * and the last page on its fourth and fifth.
 */
export function pagerStart(page: number, count: number, cells: number): number {
  const shown = Math.max(1, cells - 1)
  const hold = Math.floor((shown - 1) / 2)
  return Math.max(0, Math.min(page - hold, count - shown))
}

const NO_TITLES: readonly (string | undefined)[] = []
const NO_SMALL: readonly boolean[] = []

/** Memoised: the turn renders its grid at every phase, and the bar has nothing to redraw until the page or count moves. */
const GridPager = React.memo(function GridPager({ page, coming = page, count, titles = NO_TITLES, onTurn, onGo, bar }: GridPagerProps) {
  const m = useGridMetrics()
  const turn = React.useMemo<GridTurnState>(
    () => ({ page, coming, count, titles, turn: onTurn, go: onGo }),
    [page, coming, count, titles, onTurn, onGo],
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
 * two 1×1 boxes did. It takes the turn from context: a component in a slot is handed props by its layout, and the
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

/** From the first cell's centre, where the number stands, to where the title starts: a step of the spacing scale. */
const TITLE_AFTER = GRID_SPACING[3]
/** The air after a title, inside the pill's round end. */
const TITLE_PAD = GRID_SPACING[3]

/**
 * The numbered bar's pages (D46, D47): one block on the cells between the arrows, playing movement (Motion.md M9), his,
 * the motion the portfolio's tech column plays. Every page is a one-cell element — a ring with its number on it — on one
 * line, and the page the field is turning to is grown to two cells, its title riding after its number. When the page
 * changes, the one that was grown shrinks, the new one grows, and the numbers between travel a cell, shrinking into the
 * border and growing out of it; rings never slide, they hand over (`cellMotionFrame`). The block shows `cells − 1`
 * pages and slides along the line to hold the page (`pagerStart`), so pages that leave it hand over to cells outside the
 * block, which clips them. It follows the page the field is turning to, so a hand turning on moves it again from where
 * it stands (D35). Under reduced motion it jumps.
 */
function GridPagerPages({ cells }: { cells: number }) {
  const m = useGridMetrics()
  const state = useGridTurn()
  const cell = m?.cell ?? 60
  const gap = m?.gap ?? 12
  const count = state?.count ?? 0
  const active = state ? Math.min(state.coming, count - 1) : null

  const block = React.useRef<HTMLDivElement>(null)
  const rings = React.useRef<(HTMLButtonElement | null)[]>([])
  const ghosts = React.useRef<(HTMLDivElement | null)[]>([])
  const numbers = React.useRef<(HTMLElement | null)[]>([])
  const titles = React.useRef<(HTMLElement | null)[]>([])

  // One line long enough that nothing wraps; which pages show is a shift along it.
  const flow = React.useMemo<CellFlow>(() => ({ axis: "row", line: count + 2 }), [count])
  const statesFor = React.useCallback(
    (which: number | null): CellState[] => {
      const shift = pagerStart(which ?? 0, count, cells) * (cell + gap)
      return flowSpots(count, which, flow.line).map((spot) => {
        const at = stateOf(spot, flow, cell, gap)
        return { ...at, l: at.l - shift, r: at.r - shift, x: at.x - shift }
      })
    },
    [count, cells, flow, cell, gap],
  )

  const paint = React.useCallback((frames: CellFrame[]) => {
    frames.forEach((f, i) => {
      const ring = rings.current[i]
      const ghost = ghosts.current[i]
      const number = numbers.current[i]
      const title = titles.current[i]
      if (!ring || !ghost || !number || !title) return
      place(ring, f)
      ring.style.opacity = String(f.opacity)
      // Through custom properties, so the Button's own focus border and a hover on a page not grown still win.
      ring.style.setProperty("--page-fill", towards("var(--primary)", "var(--card)", f.lit))
      ring.style.setProperty("--page-line", towards("var(--primary)", "var(--border)", f.lit))
      if (f.ghost) {
        place(ghost, f.ghost)
        ghost.style.opacity = String(f.ghost.opacity)
        ghost.style.backgroundColor = towards("var(--primary)", "var(--card)", f.ghost.lit)
        ghost.style.borderColor = towards("var(--primary)", "var(--border)", f.ghost.lit)
        ghost.style.visibility = "visible"
      } else ghost.style.visibility = "hidden"
      number.style.transform = `translate(${f.x}px, ${f.y}px) translate(-50%, -50%) scale(${f.scale})`
      number.style.color = towards("var(--primary-foreground)", "var(--foreground)", f.lit)
      // The title rides a step after its number, inside the ring (less its pixel of border), which clips it as it grows.
      title.style.opacity = String(f.lit)
      title.style.transform = `translateX(${f.x - f.l - 1 + TITLE_AFTER}px)`
    })
  }, [])

  useCellMotion({ block, states: statesFor, active, flow, cell, gap, paint })

  // A title too wide for its two cells steps down a role, as the showcase's section header does on a narrow slot: a
  // phone's cell is derived (Grid.md D33), and "Movement" was cut there. Measured in the numbers' font — always body —
  // at the title's weight, and again when the fonts arrive.
  const titleWidth = 2 * cell + gap - cell / 2 - TITLE_AFTER - TITLE_PAD
  const pageTitles = state?.titles ?? NO_TITLES
  const [small, setSmall] = React.useState<readonly boolean[]>(NO_SMALL)
  React.useLayoutEffect(() => {
    const probe = numbers.current[0]
    const ctx = document.createElement("canvas").getContext("2d")
    if (!probe || !ctx) return
    let live = true
    const measure = () => {
      if (!live) return
      const font = getComputedStyle(probe)
      ctx.font = `400 ${font.fontSize} ${font.fontFamily}`
      const next = Array.from({ length: count }, (_, i) => Math.ceil(ctx.measureText(pageTitles[i] ?? "Page").width) > titleWidth)
      setSmall((was) => (was.length === next.length && was.every((v, i) => v === next[i]) ? was : next))
    }
    measure()
    void document.fonts.ready.then(measure)
    return () => {
      live = false
    }
  }, [count, pageTitles, titleWidth])

  if (!state || active === null) return null
  const start = pagerStart(active, count, cells)
  const shown = Math.max(1, cells - 1)
  // Where each page stands for the first frame; the motion writes over it from then on.
  const rest = statesFor(active)
  const pitch = cell + gap

  return (
    <div ref={block} role="group" aria-label="Pages" className="relative size-full">
      {/* Fewer pages than the block holds: the cells past them are D27's empty `card` cells. */}
      {Array.from({ length: Math.max(0, cells - count - 1) }, (_, k) => {
        const col = count + 1 + k
        return <Slot key={`empty-${col}`} fill="card" className="absolute" style={{ left: col * pitch, top: 0, width: cell, height: cell }} />
      })}
      {rest.map((at, i) => {
        const current = i === active
        const title = state.titles[i]
        return (
          <Button
            key={i}
            ref={(el) => void (rings.current[i] = el)}
            variant="outline"
            aria-label={current ? `Page ${i + 1} of ${count}${title ? `: ${title}` : ""}` : `Page ${i + 1}${title ? `: ${title}` : ""}`}
            aria-current={current ? "page" : undefined}
            // A page the block has slid past is clipped away, and is no stop.
            inert={i < start || i >= start + shown}
            onClick={() => state.go(i)}
            // The motion writes the box, the fill and the line every frame, so nothing here may transition them.
            className="absolute h-auto min-w-0 overflow-hidden border-(--page-line) bg-(--page-fill) p-0 font-normal tracking-normal normal-case transition-none aria-[current=page]:hover:bg-(--page-fill)"
            style={{ ...boxOf(at), "--page-fill": towards("var(--primary)", "var(--card)", at.lit), "--page-line": towards("var(--primary)", "var(--border)", at.lit) } as React.CSSProperties}
          >
            <span
              ref={(el) => void (titles.current[i] = el)}
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center"
              style={{ opacity: at.lit, transform: `translateX(${at.x - at.l - 1 + TITLE_AFTER}px)` }}
            >
              <Text
                as="span"
                role={small[i] ? "caption" : "body"}
                className="text-primary-foreground truncate whitespace-nowrap"
                style={{ maxWidth: titleWidth }}
              >
                {title ?? "Page"}
              </Text>
            </span>
          </Button>
        )
      })}
      {/* A ring's old cells go out OVER the new ring coming in: the pill stays lime while a page hands it on as the block
          slides, where under it the new ring's own light, still coming up, showed through pale. */}
      {rest.map((_, i) => (
        <div
          key={`ghost-${i}`}
          ref={(el) => void (ghosts.current[i] = el)}
          aria-hidden
          className="pointer-events-none absolute rounded-lg border"
          style={{ visibility: "hidden" }}
        />
      ))}
      {rest.map((at, i) => (
        <Text
          key={`number-${i}`}
          as="span"
          ref={(el: HTMLElement | null) => void (numbers.current[i] = el)}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 font-semibold whitespace-nowrap tabular-nums"
          style={{ transform: `translate(${at.x}px, ${at.y}px) translate(-50%, -50%)`, color: towards("var(--primary-foreground)", "var(--foreground)", at.lit) }}
        >
          {i + 1}
        </Text>
      ))}
    </div>
  )
}

type Box = { l: number; t: number; r: number; b: number }
const boxOf = (box: Box) => ({ left: box.l, top: box.t, width: box.r - box.l, height: box.b - box.t })

function place(el: HTMLElement, box: Box) {
  el.style.left = `${box.l}px`
  el.style.top = `${box.t}px`
  el.style.width = `${box.r - box.l}px`
  el.style.height = `${box.b - box.t}px`
}

/** `to` as far as a page is the one grown, over `from`: mixed, never translucent. */
const towards = (to: string, from: string, lit: number) =>
  lit <= 0 ? from : lit >= 1 ? to : `color-mix(in oklch, ${to} ${lit * 100}%, ${from})`

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
      {/* The fill: the same arrow clipped to the turned share, in reverse colours. */}
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center"
        style={{ clipPath: clip, background: "var(--foreground)", color: "var(--background)" }}
      >
        <Icon />
      </span>
    </Button>
  )
}

export { GridPager, GridPagerArrow, GridPagerArrows, GridPagerPages }
