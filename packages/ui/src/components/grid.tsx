"use client"

import * as React from "react"
import gsap from "gsap"
import { cn } from "cn"

import { useThemeFlipRegistry, type ThemeFlipper } from "@no-origins/ui/components/theme-provider"

/**
 * The base layout (Grid.md — v2 since 2026-09-21).
 *
 * One square cell is the unit, and THE CELL IS DECIDED: a breakpoint is two numbers, `cell · gap` (D13, D15). The
 * counts are not decided by anyone — a field is as many whole cells as fit across and down the box it is given
 * (D12), so the grid never scrolls and never overflows. What is left over is centred margin (D14), and the box's
 * own padding is one gutter, so the edge of the screen is one more grid line (D15). When a layout holds more than the
 * field can, the surplus goes to another PAGE (grid-pages.tsx) — never off the edge.
 *
 * The grid is always its box: the viewport (D11). There is no `fill`, because nothing
 * ever holds a grid as a block in a page — "everything will always be on the grid once we are out of the grid
 * editor" — and no `pad`, because the pad IS the gutter.
 */

export type GridBreakpoint = "base" | "sm" | "md" | "lg" | "xl"

/** A value that can change with the breakpoint. Resolution walks DOWN to the nearest defined entry. */
export type Responsive<T> = T | Partial<Record<GridBreakpoint, T>>

export const GRID_BREAKPOINTS: Record<GridBreakpoint, number> = {
  base: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
}

export const BREAKPOINT_ORDER: GridBreakpoint[] = ["base", "sm", "md", "lg", "xl"]

/**
 * Each breakpoint's reference box — Grid-v1.md §4's `Reference box` column, verbatim. A breakpoint is a RANGE, so
 * these are starting points, not the only sizes a page meets: since v2 every width in between is a different field
 * (D12). A page that has to lay itself out before the grid has measured its box assumes one of these.
 */
export const GRID_REFERENCE_BOX: Record<GridBreakpoint, { width: number; height: number }> = {
  base: { width: 390, height: 844 },
  sm: { width: 640, height: 960 },
  md: { width: 768, height: 1024 },
  lg: { width: 1024, height: 768 },
  xl: { width: 1440, height: 900 },
}

/**
 * The spacing scale the gutter draws from (Grid.md §3). A breakpoint's gap is one of these, never a free number; a
 * box's own inset draws from the same five so the space between boxes and the space inside them read as one family.
 * 4px steps because that is the base of the Tailwind spacing the apps lay out with; 0 is on it on purpose — cells
 * that touch are the only field that still reads as a grid at high column counts. The CELL is not on this scale: it
 * is a size, not a spacing, and its own decision (D13).
 */
export const GRID_SPACING = [0, 4, 8, 12, 16] as const

/**
 * The pager bar's width in cells when a breakpoint does not name one (Grid.md D27, D29): four cells then ↑ ↓. It
 * lives here rather than in the model because since D29 the width is a config decision like `cell · gap`, checked
 * against §5's principles and recorded in D29. The model imports it from here, as it already imports
 * BREAKPOINT_ORDER — the other direction would be a cycle.
 */
export const PAGER_CELLS = 6

/**
 * One breakpoint, whole: the side of its square cell in px, the gutter between cells — a step of GRID_SPACING
 * (Grid.md D15) — and how many cells wide the pager's bar is (D29). There are still no counts to decide and no pad,
 * because the pad is the gap.
 */
export type GridSpec = { cell: number; gap: number; pager?: number }
export type GridConfig = Partial<Record<GridBreakpoint, GridSpec>>


/**
 * The brick — DECIDED, Grid.md D13, 2026-09-21. One gutter everywhere so the field has one texture and one edge
 * margin; 72 where there are fingers (a 1×1 is the touch target — the pager fills its cell); 60 from `lg` up where a
 * pointer is likely, and never rising again. Every phone from 375 to 430 gets four columns; a 2×2 card is 156px on
 * touch and 132px on a pointer. Grid.md §5 has the six principles these were checked against.
 */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  base: { cell: 72, gap: 12, pager: PAGER_CELLS },
  sm: { cell: 72, gap: 12, pager: PAGER_CELLS },
  md: { cell: 72, gap: 12, pager: PAGER_CELLS },
  lg: { cell: 60, gap: 12, pager: PAGER_CELLS },
  xl: { cell: 60, gap: 12, pager: PAGER_CELLS },
}

export type GridField = {
  /**
   * The breakpoint whose config supplied the cell and gap — the config key, walking down, so a viewport that is `xl`
   * by width on a config with no `xl` row reports `lg`. It keys the cell (D13) and, until authoring is redecided
   * (Grid-v2.md §7), the layout's authored pages (v1 D6). It does NOT decide the counts: the box does.
   */
  bp: GridBreakpoint
  /** The side of one square cell, in px — this breakpoint's, from the config (D13). */
  cell: number
  /** The gutter between cells, in px, and the box's own padding (D15). */
  gap: number
  /** How many whole cells fit the box, across and down (D12). Derived, never decided. */
  cols: number
  rows: number
  /**
   * How many cells of the bottom row the pager's bar takes (D29) — this breakpoint's `pager`, made even and clamped
   * to the field. Zero on a field with no room for it. The model reserves exactly this much, so it is the one number
   * the packer and the bar both read.
   */
  pager: number
}

export type GridMetrics = GridField & {
  /** The field itself, excluding the margin around it. */
  gridW: number
  gridH: number
  /** The box the grid was given. */
  boxW: number
  boxH: number
}

export function breakpointFor(size: number): GridBreakpoint {
  let bp: GridBreakpoint = "base"
  for (const key of BREAKPOINT_ORDER) if (size >= GRID_BREAKPOINTS[key]) bp = key
  return bp
}

/** Resolve a responsive value at a breakpoint, walking down to the nearest defined entry. */
export function resolveResponsive<T>(value: Responsive<T> | undefined, bp: GridBreakpoint, fallback: T): T {
  if (value === undefined || value === null) return fallback
  if (typeof value !== "object") return value as T
  const map = value as Partial<Record<GridBreakpoint, T>>
  for (let i = BREAKPOINT_ORDER.indexOf(bp); i >= 0; i--) {
    const found = map[BREAKPOINT_ORDER[i]!]
    if (found !== undefined) return found
  }
  return fallback
}

/** A breakpoint's cell and gap and the config key that supplied them, walking down to the nearest defined. */
export function specFor(config: GridConfig, bp: GridBreakpoint): GridSpec & { key: GridBreakpoint } {
  for (let i = BREAKPOINT_ORDER.indexOf(bp); i >= 0; i--) {
    const key = BREAKPOINT_ORDER[i]!
    const found = config[key]
    if (found) return { ...found, key }
  }
  return { ...(DEFAULT_GRID_CONFIG.base as GridSpec), key: "base" }
}

/**
 * How many whole cells of this size fit a span, with one gutter of padding at each end (D15) and a gutter between
 * every two cells: `floor((span − gap) / (cell + gap))`, then rounded down to an EVEN count (D26) so the field's
 * centre is always a grid line and a centred block (D14, D25) is symmetric. Never fewer than two, so a field always
 * exists; the odd cell that would have fit becomes margin.
 */
export function countFor(span: number, cell: number, gap: number) {
  const fit = Math.floor((span - gap) / (cell + gap))
  return Math.max(2, fit - (fit % 2))
}

/**
 * The field a box of this size gets (D12). Width picks the breakpoint, the breakpoint supplies the cell and gap
 * (D13), and both axes are then simply how many cells fit. A phone on its side gets more columns than rows with no
 * rule for it — v1's transposition fell out. There is no way to name a breakpoint outright: the box decides (D11).
 */
export function resolveField(config: GridConfig, width: number, height: number): GridField {
  const spec = specFor(config, breakpointFor(width))
  const cols = countFor(width, spec.cell, spec.gap)
  return {
    bp: spec.key,
    cell: spec.cell,
    gap: spec.gap,
    cols,
    rows: countFor(height, spec.cell, spec.gap),
    pager: pagerWidth(spec.pager ?? PAGER_CELLS, cols),
  }
}

/**
 * The pager bar's width on a field of this many columns (D29). EVEN, rounded down and never below two, because D26's
 * promise is that the field's centre is a grid line and an odd bar sits half a cell off it; and never wider than the
 * field, so a narrow phone gets as many cells as it has (D27's clamp). Counts are even (D26), so the clamp cannot
 * make an even width odd.
 */
export function pagerWidth(width: number, cols: number): number {
  if (cols < 2) return 0
  const even = Math.max(2, Math.floor(width / 2) * 2)
  return Math.min(even, cols)
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

const GridContext = React.createContext<GridMetrics | null>(null)

/** Read the live metrics of the nearest Grid. Null outside one. */
export function useGridMetrics() {
  return React.useContext(GridContext)
}

export type GridProps = Omit<React.ComponentProps<"div">, "children"> & {
  children?: React.ReactNode
  /** Draw the cells behind the items. */
  overlay?: boolean
  onMetrics?: (metrics: GridMetrics) => void
}

/** The grid reads the decided numbers (D13) and nothing else: no prop overrides a breakpoint's `cell · gap`. */
const config = DEFAULT_GRID_CONFIG

function Grid({
  children,
  overlay = false,
  onMetrics,
  className,
  style,
  ref: refProp,
  ...props
}: GridProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  // The box measures itself through `ref`; a host's own ref (grid-pages.tsx writes the turn's progress here) is set
  // alongside it, not instead of it — spread after `ref={ref}` it once replaced it, and the field was never measured.
  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node
      if (typeof refProp === "function") refProp(node)
      else if (refProp) refProp.current = node
    },
    [refProp],
  )
  const [box, setBox] = React.useState<{ w: number; h: number } | null>(null)

  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // Only a CHANGE of size is a new box: a fresh object for the same numbers would make new metrics, and anything
    // keyed on them — the theme flip's timeline — would start over. The theme switch nudges layout enough to fire the
    // observer, and the flip committing the theme, restarting, and committing again was a loop (his report, 2026-09-21).
    const read = () => setBox((prev) => (prev && prev.w === el.clientWidth && prev.h === el.clientHeight ? prev : { w: el.clientWidth, h: el.clientHeight }))
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const metrics = React.useMemo<GridMetrics | null>(() => {
    if (!box || box.w <= 0 || box.h <= 0) return null
    const field = resolveField(config, box.w, box.h)
    const { cell, gap, cols, rows } = field
    return {
      ...field,
      gridW: cell * cols + gap * (cols - 1),
      gridH: cell * rows + gap * (rows - 1),
      boxW: box.w,
      boxH: box.h,
    }
  }, [box])

  React.useEffect(() => {
    if (metrics) onMetrics?.(metrics)
  }, [metrics, onMetrics])

  // The box's padding is the gutter (D15) — before the field is measured it is the breakpoint's gap by width alone,
  // which is what it will be once measured too. Whatever the count leaves over is centred by the flex box (D14).
  const gap = metrics?.gap ?? specFor(config, breakpointFor(box?.w ?? 0)).gap

  return (
    <div
      ref={setRef}
      data-slot="grid"
      data-breakpoint={metrics?.bp}
      // The grid is always its box: the screen. A className may give it another height when there is chrome above
      // (`h-[calc(100dvh-3.5rem)]`), never a width.
      className={cn("relative flex items-center justify-center h-dvh w-full", className)}
      style={{ padding: `${gap}px`, ...style }}
      {...props}
    >
      {metrics ? (
        <GridContext.Provider value={metrics}>
          <div
            data-slot="grid-box"
            className="relative"
            style={{ width: metrics.gridW, height: metrics.gridH }}
          >
            {overlay ? <GridOverlay /> : null}
            <div
              data-slot="grid-tracks"
              className="relative grid"
              style={{
                gridTemplateColumns: `repeat(${metrics.cols}, ${metrics.cell}px)`,
                gridTemplateRows: `repeat(${metrics.rows}, ${metrics.cell}px)`,
                gap: metrics.gap,
              }}
            >
              {children}
            </div>
          </div>
          {/* The theme's flip (D28) — the outermost grid on the page takes the switch. */}
          <GridThemeFlip />
        </GridContext.Provider>
      ) : null}
    </div>
  )
}

/**
 * The sheet's fall, in seconds — the one beat, down over the field. Mine; `FLIP_TEMPO` stretches it (1 is the
 * designed pace; raise it to watch slowly). The wave on the sheet's leading and trailing edge: its full height in px,
 * how many crests it may have — "we should just have 2 to 5 different sized crests", 2026-09-22 — and how it moves:
 * it drifts one full width sideways in `1 / WAVE_DRIFT` beats and breathes in height every `WAVE_BREATH` seconds.
 */
const FLIP_TEMPO = 1
const FALL_MS = 0.9 * FLIP_TEMPO
/** The dissolve, once the box is covered: the sheet fades and the new page comes through it. */
const DISSOLVE_MS = 0.35 * FLIP_TEMPO
const WAVE_H = 72
const WAVE_CRESTS: [number, number] = [2, 5]
const WAVE_DRIFT = 0.5
const WAVE_BREATH = 0.8

/** One crest of the wave: its share of the width and its height, 0..1 of WAVE_H. */
type Crest = { width: number; height: number }

/** Draw the crests for one toggle: between two and five, each its own width and height, so no two falls are alike. */
function drawCrests(): Crest[] {
  const [min, max] = WAVE_CRESTS
  const n = min + Math.floor(Math.random() * (max - min + 1))
  const weights = Array.from({ length: n }, () => 0.6 + Math.random())
  const total = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => ({ width: w / total, height: 0.45 + Math.random() * 0.55 }))
}

/**
 * The wave's line across one width of the sheet, in a 1000 × 100 box, rising and falling once per crest from the
 * midline; starting and ending on the midline, so a copy set after it continues it seamlessly.
 */
function wavePath(crests: Crest[]) {
  let d = "M0 50"
  for (const c of crests) {
    const w = 1000 * c.width
    const a = 50 * c.height
    d += ` q ${w / 4} ${-a} ${w / 2} 0 q ${w / 4} ${a} ${w / 2} 0`
  }
  return d
}

/**
 * The theme change as a SHEET OF PAINT falling down the field (Grid-v2.md D28). It began on 2026-09-21 as cells
 * flipping row by row, became a wave of columns with gutters filling to the average of their neighbours, then cells
 * filling from the top — and on 2026-09-22, having watched that slowed down: "I didn't like this too. I'm thinking we
 * should just make it like a paint sheet falling down."
 *
 * So: one sheet, the size of the grid's box, in the NEW theme's colours — the layer wears that theme's class, and
 * globals.css puts the light tokens on `.light` as well as `:root` for exactly this. The sheet is PLAIN paint: it
 * carried the new theme's empty field for a day, the cells drawn on it, and he took that off ("looks like the sheet
 * has grids on it. It should not", 2026-09-22) — the grid is what the paint reveals, not what it carries. Its
 * bottom edge is a WAVE, sharp — "instead of blurred edge, make it sharp; instead of straight bottom, let's make it
 * like a wave", 2026-09-22 — two to five crests of different sizes, drawn afresh at every toggle, moving as it falls
 * ("dynamic waves"); its top edge is the same wave turned over, for the moment it shows. ONE beat: the sheet falls from
 * above the box until it covers it, gathering speed the way a thing falls; the theme is committed under the cover and
 * the sheet DISSOLVES — it is the new page's own background, so its fade is the content coming through. It kept
 * falling off the bottom for a second beat at first, and the wait read as broken; then it was removed on the spot,
 * and he asked for the dissolve (2026-09-22). One element moves, on a transform and then opacity, so nothing lays
 * out and nothing repaints.
 * GSAP drives it (packages/ui/CLAUDE.md rule 7). Reduced motion switches at once; a toggle during a fall is ignored.
 * The names here — flip, flipper — keep the word he first used for the whole motion.
 */
function GridThemeFlip() {
  const m = useGridMetrics()
  const registry = useThemeFlipRegistry()
  const [flip, setFlip] = React.useState<{ to: "light" | "dark"; commit: () => void; crests: Crest[] } | null>(null)
  const sheet = React.useRef<HTMLDivElement>(null)
  const busy = React.useRef(false)
  const metricsRef = React.useRef(m)
  metricsRef.current = m

  React.useEffect(() => {
    if (!registry) return
    const flipper: ThemeFlipper = (to, commit) => {
      if (busy.current) return
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        commit()
        return
      }
      busy.current = true
      setFlip({ to, commit, crests: drawCrests() })
    }
    return registry.register(flipper)
  }, [registry])

  // The timeline is built once per toggle from a ref of the metrics, never restarted by a re-render.
  React.useEffect(() => {
    const el = sheet.current
    const m = metricsRef.current
    if (!flip || !el || !m) return
    let committed = false
    // The wave moves on its own clock for as long as the sheet is on screen: it drifts one width of the box sideways
    // and loops — the edges are drawn a width wider on each side so the loop never shows — and breathes in height.
    const movers = Array.from(el.querySelectorAll<SVGElement>("[data-wave]")).flatMap((wave) => [
      gsap.fromTo(wave, { x: 0 }, { x: -m.boxW, duration: FALL_MS / WAVE_DRIFT, ease: "none", repeat: -1 }),
      gsap.to(wave, {
        scaleY: 0.6,
        duration: WAVE_BREATH * FLIP_TEMPO,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        transformOrigin: wave.dataset.wave === "top" ? "50% 100%" : "50% 0%",
      }),
    ])
    const tl = gsap.timeline({
      onComplete: () => {
        busy.current = false
        setFlip(null)
      },
    })
    // One fall, then a dissolve: the moment the sheet covers the box the theme is committed under it, and the sheet
    // fades away — "instead of immediately removing, dissolve it", 2026-09-22 — so the new page comes through the
    // paint. It used to keep falling off the bottom for a second beat: "it feels like something is broken as the user
    // is waiting". The sheet is the new page's own background, so the dissolve is the content fading in.
    tl.set(el, { y: -m.boxH - WAVE_H, opacity: 1 })
      .to(el, { y: 0, duration: FALL_MS, ease: "power2.in" })
      .call(() => {
        if (committed) return
        committed = true
        flip.commit()
      })
      .to(el, { opacity: 0, duration: DISSOLVE_MS, ease: "power1.out" })
    return () => {
      tl.kill()
      movers.forEach((tween) => tween.kill())
    }
  }, [flip])

  if (!flip || !m) return null

  // The wave is drawn three widths of the box wide, one copy each side of the one on show, so it can drift a whole
  // width and loop without its end ever showing.
  const path = wavePath(flip.crests)
  const edge = (side: "top" | "bottom") => (
    <svg
      data-wave={side}
      className={cn("fill-background absolute block will-change-transform", side === "bottom" ? "top-full" : "bottom-full")}
      style={{ left: -m.boxW, width: m.boxW * 3, height: WAVE_H }}
      viewBox="0 0 3000 100"
      preserveAspectRatio="none"
    >
      {[0, 1000, 2000].map((dx) => (
        <path key={dx} transform={`translate(${dx} 0)`} d={`${path} L1000 ${side === "bottom" ? 0 : 100} L0 ${side === "bottom" ? 0 : 100} Z`} />
      ))}
    </svg>
  )

  return (
    <div data-slot="grid-theme-flip" aria-hidden className={cn("pointer-events-none absolute inset-0 z-20 overflow-hidden", flip.to)}>
      <div ref={sheet} className="bg-background absolute inset-0 will-change-transform" style={{ transform: `translateY(${-m.boxH - WAVE_H}px)` }}>
        {/* The wave: the sheet's bottom edge leading the fall, and the same wave turned over as its top edge trailing it. */}
        {edge("bottom")}
        {edge("top")}
      </div>
    </div>
  )
}

/** The cells, drawn behind the items. Reads the metrics from context, so it is only valid inside a Grid. */
function GridOverlay({ className }: { className?: string }) {
  const m = useGridMetrics()
  if (!m) return null
  const cells = Array.from({ length: m.cols * m.rows })

  return (
    <div data-slot="grid-overlay" className={cn("pointer-events-none absolute inset-0", className)} aria-hidden>
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: `repeat(${m.cols}, ${m.cell}px)`,
          gridTemplateRows: `repeat(${m.rows}, ${m.cell}px)`,
          gap: m.gap,
        }}
      >
        {cells.map((_, i) => (
          <div key={i} className="border-border/70 border border-dashed" />
        ))}
      </div>
    </div>
  )
}

export type GridItemProps = React.ComponentProps<"div"> & {
  col?: Responsive<number>
  row?: Responsive<number>
  colSpan?: Responsive<number>
  rowSpan?: Responsive<number>
}

/**
 * One item, placed by coordinate. Coordinates are 1-based, like CSS grid lines.
 *
 * Counts change with the box, so a coordinate that is valid on one field may not exist on another. Values can be
 * responsive by breakpoint; whatever is left over is CLAMPED into the grid rather than allowed to overflow it.
 */
function GridItem({ col, row, colSpan, rowSpan, className, style, ...props }: GridItemProps) {
  const m = useGridMetrics()
  const bp = m?.bp ?? "base"
  const cols = m?.cols ?? 4
  const rows = m?.rows ?? 8

  const c = clamp(resolveResponsive(col, bp, 1), 1, cols)
  const r = clamp(resolveResponsive(row, bp, 1), 1, rows)
  const cs = clamp(resolveResponsive(colSpan, bp, 1), 1, cols - c + 1)
  const rs = clamp(resolveResponsive(rowSpan, bp, 1), 1, rows - r + 1)

  return (
    <div
      data-slot="grid-item"
      className={cn("min-h-0 min-w-0", className)}
      style={{ gridColumn: `${c} / span ${cs}`, gridRow: `${r} / span ${rs}`, ...style }}
      {...props}
    />
  )
}

export { Grid, GridItem, GridOverlay }
