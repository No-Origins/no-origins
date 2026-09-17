"use client"

import * as React from "react"
import { cn } from "cn"

/**
 * The base layout.
 *
 * One square cell is the unit. The number of columns AND rows is decided per breakpoint, not by content, and the
 * grid never scrolls: items are placed on cells by coordinate and the grid fits whatever box it is given. When a
 * layout holds more than the field can, the surplus goes to another PAGE (grid-pages.tsx) — never off the edge.
 *
 * Two ways to reconcile "square cells" with "fill the viewport", because at most viewport ratios they disagree:
 *   fit="square"  — cell side is min(trackW, trackH); the grid is centred and the remainder becomes margin.
 *   fit="stretch" — tracks fill the box exactly; cells are only as square as the viewport lets them be.
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
 * A box shorter than this, and wider than it is tall, is a SHORT LANDSCAPE box — a phone on its side. Breakpoints are
 * keyed on width, which would hand such a box a tall field it cannot hold (8 columns and 7 rows in 390px is an 18px
 * cell). Instead it keys on its height and the field is turned on its side: base's 4x8 becomes 8x4.
 */
export const SHORT_BOX = GRID_BREAKPOINTS.sm

export type GridTracks = { cols: number; rows: number }
export type GridConfig = Partial<Record<GridBreakpoint, GridTracks>>

/**
 * The default shape of the grid. Fewer, larger cells on a phone; more, smaller ones on a desktop. Row counts fall
 * as the viewport widens because a wide screen is short relative to its width.
 */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  base: { cols: 4, rows: 8 },
  sm: { cols: 6, rows: 8 },
  md: { cols: 8, rows: 7 },
  lg: { cols: 12, rows: 6 },
}

export type GridFit = "square" | "stretch"

export type GridField = {
  /**
   * The breakpoint whose config produced this field. A viewport that is `xl` by width but whose config only defines
   * `lg` reports `lg`: the field IS the breakpoint, and two viewports with the same field share a layout.
   */
  bp: GridBreakpoint
  cols: number
  rows: number
  /** True when a short landscape box turned the field on its side. */
  transposed: boolean
}

export type GridMetrics = GridField & {
  /** One cell, in px. Equal on both axes when fit="square". */
  cellW: number
  cellH: number
  gap: number
  pad: number
  /** The grid box itself, excluding padding. */
  gridW: number
  gridH: number
  /** The box the grid was given. */
  boxW: number
  boxH: number
  fit: GridFit
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

/** The track counts at a breakpoint and the config key that supplied them, walking down to the nearest defined. */
export function tracksFor(config: GridConfig, bp: GridBreakpoint): GridTracks & { key: GridBreakpoint } {
  for (let i = BREAKPOINT_ORDER.indexOf(bp); i >= 0; i--) {
    const key = BREAKPOINT_ORDER[i]!
    const found = config[key]
    if (found) return { ...found, key }
  }
  return { cols: 4, rows: 8, key: "base" }
}

/**
 * The field a box of this size gets. `height` is only meaningful when the grid fills its box; a content-block grid
 * passes none and keys on width alone. `force` names a breakpoint outright — the editor uses it to preview a narrow
 * field on a wide screen — and skips the short-landscape rule, because a forced field is the one you asked to see.
 */
export function resolveField(config: GridConfig, width: number, height?: number, force?: GridBreakpoint): GridField {
  if (force) {
    const t = tracksFor(config, force)
    return { bp: t.key, cols: t.cols, rows: t.rows, transposed: false }
  }
  const short = height !== undefined && height < SHORT_BOX && width > height
  const t = tracksFor(config, breakpointFor(short ? height : width))
  return short
    ? { bp: t.key, cols: t.rows, rows: t.cols, transposed: true }
    : { bp: t.key, cols: t.cols, rows: t.rows, transposed: false }
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

const GridContext = React.createContext<GridMetrics | null>(null)

/** Read the live metrics of the nearest Grid. Null outside one. */
export function useGridMetrics() {
  return React.useContext(GridContext)
}

export type GridProps = Omit<React.ComponentProps<"div">, "children"> & {
  children?: React.ReactNode
  config?: GridConfig
  fit?: GridFit
  /** Own the viewport: 100dvh, no page scroll. Override the height with a className if there is chrome above. */
  fill?: boolean
  gap?: number
  pad?: number
  /** Draw the cells behind the items. */
  overlay?: boolean
  /** Number the columns and rows along the edges. Implies the overlay. */
  rulers?: boolean
  /** Force the field of this breakpoint regardless of the measured size. Cells still size to the real box. */
  breakpoint?: GridBreakpoint
  onMetrics?: (metrics: GridMetrics) => void
}

function Grid({
  children,
  config = DEFAULT_GRID_CONFIG,
  fit = "square",
  fill = false,
  gap = 12,
  pad = 16,
  overlay = false,
  rulers = false,
  breakpoint,
  onMetrics,
  className,
  style,
  ...props
}: GridProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [box, setBox] = React.useState<{ w: number; h: number } | null>(null)

  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Rulers are drawn OUTSIDE the grid box — along the top and the left only — so those two sides need room of their
  // own or the padding clips them. Only those two: a gutter on the right as well cost every phone a 24px strip it
  // had no numbers in, and the field lost a cell's worth of width to symmetry.
  const rulerPad = rulers ? 24 : 0

  const metrics = React.useMemo<GridMetrics | null>(() => {
    if (!box || box.w <= 0) return null
    const field = resolveField(config, box.w, fill ? box.h : undefined, breakpoint)
    const { cols, rows } = field
    const innerW = Math.max(0, box.w - pad * 2 - rulerPad)
    const trackW = (innerW - gap * (cols - 1)) / cols

    let cellW: number
    let cellH: number
    if (fill) {
      const innerH = Math.max(0, box.h - pad * 2 - rulerPad)
      const trackH = (innerH - gap * (rows - 1)) / rows
      if (fit === "square") {
        const side = Math.max(0, Math.min(trackW, trackH))
        cellW = side
        cellH = side
      } else {
        cellW = Math.max(0, trackW)
        cellH = Math.max(0, trackH)
      }
    } else {
      // Not filling: width decides the cell and the grid is as tall as its rows make it. Always square.
      cellW = Math.max(0, trackW)
      cellH = cellW
    }

    return {
      ...field,
      cellW,
      cellH,
      gap,
      pad,
      gridW: cellW * cols + gap * (cols - 1),
      gridH: cellH * rows + gap * (rows - 1),
      boxW: box.w,
      boxH: box.h,
      fit,
    }
  }, [box, config, fit, fill, gap, rulerPad, pad, breakpoint])

  React.useEffect(() => {
    if (metrics) onMetrics?.(metrics)
  }, [metrics, onMetrics])

  const showOverlay = overlay || rulers

  return (
    <div
      ref={ref}
      data-slot="grid"
      data-fit={fit}
      data-breakpoint={metrics?.bp}
      className={cn("relative flex items-center justify-center", fill ? "h-dvh w-full" : "w-full", className)}
      style={{ padding: `${pad + rulerPad}px ${pad}px ${pad}px ${pad + rulerPad}px`, ...style }}
      {...props}
    >
      {metrics ? (
        <GridContext.Provider value={metrics}>
          <div
            data-slot="grid-box"
            className="relative"
            style={{ width: metrics.gridW, height: fill ? metrics.gridH : undefined }}
          >
            {showOverlay ? <GridOverlay rulers={rulers} /> : null}
            <div
              data-slot="grid-tracks"
              className="relative grid"
              style={{
                gridTemplateColumns: `repeat(${metrics.cols}, ${metrics.cellW}px)`,
                gridTemplateRows: `repeat(${metrics.rows}, ${metrics.cellH}px)`,
                gap: metrics.gap,
                // The page flip (grid-pages.tsx) rotates items in 3D; the vanishing point belongs to their parent.
                perspective: 1600,
              }}
            >
              {children}
            </div>
          </div>
        </GridContext.Provider>
      ) : null}
    </div>
  )
}

/** The cells, drawn behind the items. Reads the metrics from context, so it is only valid inside a Grid. */
function GridOverlay({ rulers = false, className }: { rulers?: boolean; className?: string }) {
  const m = useGridMetrics()
  if (!m) return null
  const cells = Array.from({ length: m.cols * m.rows })

  return (
    <div data-slot="grid-overlay" className={cn("pointer-events-none absolute inset-0", className)} aria-hidden>
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: `repeat(${m.cols}, ${m.cellW}px)`,
          gridTemplateRows: `repeat(${m.rows}, ${m.cellH}px)`,
          gap: m.gap,
        }}
      >
        {cells.map((_, i) => (
          <div key={i} className="border-border/70 border border-dashed" />
        ))}
      </div>
      {rulers ? (
        <>
          <div
            className="text-muted-foreground absolute inset-x-0 -top-5 grid font-mono text-[10px]"
            style={{ gridTemplateColumns: `repeat(${m.cols}, ${m.cellW}px)`, gap: m.gap }}
          >
            {Array.from({ length: m.cols }, (_, i) => (
              <span key={i} className="text-center">
                {i + 1}
              </span>
            ))}
          </div>
          <div
            className="text-muted-foreground absolute inset-y-0 -left-5 grid font-mono text-[10px]"
            style={{ gridTemplateRows: `repeat(${m.rows}, ${m.cellH}px)`, gap: m.gap }}
          >
            {Array.from({ length: m.rows }, (_, i) => (
              <span key={i} className="flex items-center justify-end">
                {i + 1}
              </span>
            ))}
          </div>
        </>
      ) : null}
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
 * Column counts change with the breakpoint, so a coordinate that is valid at lg may not exist at base. Values can be
 * responsive; whatever is left over is CLAMPED into the grid rather than allowed to overflow it.
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
