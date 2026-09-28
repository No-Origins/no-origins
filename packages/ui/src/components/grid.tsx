"use client"

import * as React from "react"
import gsap from "gsap"
import { cn } from "cn"

import { useThemeFlipRegistry, type ThemeFlipper } from "@no-origins/ui/components/theme-provider"
import { paintLoadRing, paintLoadSection, useLoadMotion } from "@no-origins/ui/hooks/use-load-motion"
import type { LoadBox, LoadFrame } from "@no-origins/ui/lib/load-motion"
import {
  FIELD_PAD,
  startFieldPainter,
  type FieldColours,
  type FieldPainter,
  type FieldRgba,
} from "@no-origins/ui/lib/grid-field"

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
 * pointer is likely, and never rising again. A 2×2 card is 156px on touch and 132px on a pointer. Grid.md §5 has the
 * six principles these were checked against. On a box too narrow for MIN_COLS of these cells — every phone — the cell
 * gives way to the count (D33).
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
  /** The side of one square cell, in px — this breakpoint's, from the config (D13), or smaller on a box too narrow for MIN_COLS of them (D33). */
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
 * The fewest columns a field has (Grid-v2.md D33, his, 2026-09-25: "minimum number of columns in any screen should be
 * six"). Four 72px cells on a phone "feel pretty off". Where the decided cell would give fewer, the count is held at
 * six and the cell derives from the width instead — as big as six cells and seven gutters allow, floored, so the
 * field still sits a whole gutter from each edge — and the rows are counted with that cell. The gutter never changes
 * (D13: one texture). Below MIN_CELL the cell stops giving way, so a sliver of a box keeps whatever count fits.
 */
export const MIN_COLS = 6
const MIN_CELL = 24

/**
 * The field a box of this size gets (D12). Width picks the breakpoint, the breakpoint supplies the cell and gap
 * (D13), and both axes are then simply how many cells fit — except that a field is never fewer than MIN_COLS across
 * (D33), where the cell derives from the width instead. A phone on its side gets more columns than rows with no rule
 * for it — v1's transposition fell out. There is no way to name a breakpoint outright: the box decides (D11).
 */
export function resolveField(config: GridConfig, width: number, height: number): GridField {
  const spec = specFor(config, breakpointFor(width))
  let cell = spec.cell
  let cols = countFor(width, cell, spec.gap)
  if (cols < MIN_COLS) {
    const fit = Math.floor((width - spec.gap * (MIN_COLS + 1)) / MIN_COLS)
    if (fit >= MIN_CELL) {
      cell = fit
      cols = MIN_COLS
    }
  }
  return {
    bp: spec.key,
    cell,
    gap: spec.gap,
    cols,
    rows: countFor(height, cell, spec.gap),
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
  /**
   * Load page 1 with the loader (Grid.md D31, D48): a square of dashed lime rings on the field's centre, one a box,
   * turning while the page loads, then each ring going to its box and opening into it — loading, his motion (Motion.md
   * M10). Played once per document load, by the grid that asks for it; never under reduced motion.
   */
  intro?: boolean
  /**
   * The page on the field. `GridPages` passes it, and a change loads the new page with the loader (D48); a grid without
   * pages has no use for it. Never under reduced motion.
   */
  page?: number
  /**
   * Draw the pointer as a violet ring that fills while it is pressed, and light the cell under it: its dashes in violet
   * (Grid.md D34, D43). A mouse or a pen only: nothing changes on touch.
   */
  cursor?: boolean
  onMetrics?: (metrics: GridMetrics) => void
}

/** The grid reads the decided numbers (D13) and nothing else: no prop overrides a breakpoint's `cell · gap`. */
const config = DEFAULT_GRID_CONFIG

function Grid({
  children,
  overlay = false,
  intro: introProp = false,
  page,
  cursor: cursorProp = false,
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

  // The field's paint (D38) — the overlay's dashes and the pointer's cell, on canvases one painter draws — first, so
  // its effects have run before the cursor asks anything of it.
  const { field, on: painted } = useGridField(overlay || cursorProp, metrics, ref, overlay)
  const { load, finish } = useGridLoad(introProp, metrics, page, ref)
  const cursor = useGridCursor(cursorProp, metrics, ref, field)

  // The box's padding is the gutter (D15) — before the field is measured it is the breakpoint's gap by width alone,
  // which is what it will be once measured too. Whatever the count leaves over is centred by the flex box (D14).
  const gap = metrics?.gap ?? specFor(config, breakpointFor(box?.w ?? 0)).gap

  return (
    <div
      ref={setRef}
      data-slot="grid"
      data-breakpoint={metrics?.bp}
      // While a page loads (D48) — "loading" as the loader turns, then "opening" as the page's boxes open out of it:
      // they are held back by globals.css, and then by the loader, until it is over. The intro is the first page's
      // load: meanwhile the pager is held too, and comes up from its bottom edge as page 1 opens, and nothing turns a page.
      data-loading={load?.phase}
      data-intro={load?.intro ? load.phase : undefined}
      // The ring is the pointer (D34): globals.css draws the system's cursor as the violet ring (D43) over the whole grid.
      data-cursor={cursor.on ? "" : undefined}
      // The grid is always its box: the screen. A className may give it another height when there is chrome above
      // (`h-[calc(100dvh-3.5rem)]`), never a width.
      className={cn("relative flex items-center justify-center h-dvh w-full", className)}
      // The cell, for the system's one radius (D39, globals.css): half of it is every corner on the grid. Before the
      // box is measured the stylesheet's own reckoning of it from the viewport stands in.
      style={{ padding: `${gap}px`, ...(metrics ? { "--grid-cell": `${metrics.cell}px` } : null), ...introStyle(!!load?.intro), ...style } as React.CSSProperties}
      {...props}
    >
      {/* The field's paint (D38) — its dashes and the pointer's cell — over the whole box and under the page's boxes;
          the painter puts its canvases here. Clipped to the box: the lines' canvas runs FIELD_PAD past the field, further
          than the margin wherever the count leaves little over, and unclipped it scrolled the page — the scrollbars took
          the box's width, the field re-counted, they went, and round again until React gave up (his report, 2026-09-26:
          the inspector docked on the right). */}
      {painted ? <div ref={field.host} data-slot="grid-field" aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" /> : null}
      {metrics ? (
        <GridContext.Provider value={metrics}>
          <div
            data-slot="grid-box"
            className="relative"
            style={{ width: metrics.gridW, height: metrics.gridH }}
          >
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
            {/* The loader (D48): over the page's boxes, on the field's cells, for as long as the page loads. */}
            {load ? <GridLoader key={load.key} metrics={metrics} ready={load.phase === "opening"} onIn={() => finish(load.key)} /> : null}
          </div>
          {/* The theme's flip (D28) — the outermost grid on the page takes the switch. */}
          <GridThemeFlip />
        </GridContext.Provider>
      ) : null}
    </div>
  )
}

// ── loading: the intro and every page change (Grid-v2.md D48, 2026-09-27) ───────────────────────────────────────────

/**
 * How long a lit cell takes to fade back, in ms: the pointer's cell when the pointer leaves it (D34). It was the intro's
 * lines' fade (D31), his 500ms, until the drawing went (D48).
 */
const LIT_FADE_MS = 500
/**
 * The field's painter still takes the lace (grid-field.ts, D40): the gap between a cell's disc and its tile in the
 * intro's reveal. Nothing sends it a reveal or a pass since D48, so it cuts nothing.
 */
const LACE_MS = 90
/**
 * Mine, tune by looking: the pager's reveal, from its bottom edge upward, as page 1 opens; and the longest the loader
 * waits for the page before opening anyway, so a slow network never leaves anyone on a loader (D31, open item 3).
 */
const INTRO_REVEAL_MS = 420
const INTRO_MAX_WAIT_MS = 3000
/**
 * His (2026-09-27): the least the loader turns on the document's first load, in ms — "add two seconds of artificial
 * load, if there is not throttle". A page that takes longer to be ready waits for itself, up to INTRO_MAX_WAIT_MS.
 */
const INTRO_MIN_MS = 2000

/**
 * Once per document load (D31, open item 5 — mine): a navigation that mounts another grid does not play it again; a
 * reload does. Set only in the browser, so the server's render always holds page 1 back.
 */
let introPlayed = false

/**
 * Ready is the fonts, the images already on the field and the window's load — so page 1 arrives finished and the loader
 * hides the font swap — or INTRO_MAX_WAIT_MS, whichever is first (D31, open item 4 — mine).
 */
function pageReady(root: HTMLElement | null): Promise<void> {
  const loaded = document.readyState === "complete" ? Promise.resolve() : new Promise<void>((done) => window.addEventListener("load", () => done(), { once: true }))
  const fonts = document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve()
  const cap = new Promise<void>((done) => window.setTimeout(done, INTRO_MAX_WAIT_MS))
  return Promise.race([Promise.all([loaded, fonts, imagesReady(pendingImages(root))]).then(() => undefined), cap])
}

/** The images on the page's own boxes still to come: none, and a page needs no loading. */
function pendingImages(root: ParentNode | null): HTMLImageElement[] {
  return Array.from(root?.querySelectorAll<HTMLImageElement>('[data-slot="grid-item"]:not([data-pager]) img') ?? []).filter((img) => !img.complete)
}

function imagesReady(images: HTMLImageElement[]): Promise<void> {
  return Promise.all(images.map((img) => img.decode().catch(() => undefined))).then(() => undefined)
}

/** A page being loaded onto the field: which (`key`), whether it is the document's first (the intro), and how far it is. */
type Load = { key: number; intro: boolean; phase: "loading" | "opening" }

/**
 * The field's paint (Grid-v2.md D38, 2026-09-25): the overlay's dashes and the pointer's cell, on canvases one painter
 * draws (`lib/grid-field.ts`), in a worker wherever the browser can hand it a canvas. They were about 1,300 elements;
 * the intro's passes and the ripple between pages were painted here too, until D48 took them out. The grid tells the
 * painter the field, the theme's colours and the pointer's cell; the painter keeps time itself.
 */
function useGridField(enabled: boolean, metrics: GridMetrics | null, rootRef: React.RefObject<HTMLDivElement | null>, overlay: boolean) {
  const on = enabled && !!metrics
  const host = React.useRef<HTMLDivElement>(null)
  const painter = React.useRef<FieldPainter | null>(null)
  const canvases = React.useRef<{ field: HTMLCanvasElement; lines: HTMLCanvasElement } | null>(null)
  const dpr = useDevicePixelRatio()

  React.useLayoutEffect(() => {
    const el = host.current
    if (!on || !el) return
    const make = (slot: string) => {
      const cv = document.createElement("canvas")
      cv.dataset.slot = slot
      cv.setAttribute("aria-hidden", "true")
      cv.style.position = "absolute"
      cv.style.pointerEvents = "none"
      return cv
    }
    const cvs = { field: make("grid-field-dashes"), lines: make("grid-field-lines") }
    el.append(cvs.field, cvs.lines)
    canvases.current = cvs
    const p = startFieldPainter(cvs, { fade: LIT_FADE_MS, pad: FIELD_PAD, lace: LACE_MS })
    painter.current = p
    // Where it paints, for anyone looking: "worker", or "main" where a canvas cannot be handed over.
    el.dataset.painter = p.where
    return () => {
      p.stop()
      painter.current = null
      canvases.current = null
      cvs.field.remove()
      cvs.lines.remove()
    }
  }, [on])

  // The field: the canvases' place and size here, their pixels in the painter.
  React.useLayoutEffect(() => {
    const p = painter.current
    const cvs = canvases.current
    if (!on || !p || !cvs || !metrics) return
    const { cols, rows, cell, gap, gridW, gridH, boxW, boxH } = metrics
    // The field sits centred in the box (D14), a gutter from each edge at least (D15).
    const fx = (boxW - gridW) / 2
    const fy = (boxH - gridH) / 2
    const place = (cv: HTMLCanvasElement, left: number, top: number, width: number, height: number) => {
      cv.style.left = `${left}px`
      cv.style.top = `${top}px`
      cv.style.width = `${width}px`
      cv.style.height = `${height}px`
    }
    place(cvs.field, 0, 0, boxW, boxH)
    place(cvs.lines, fx - FIELD_PAD, fy - FIELD_PAD, gridW + 2 * FIELD_PAD, gridH + 2 * FIELD_PAD)
    p.post({ type: "geometry", geometry: { cols, rows, cell, gap, gridW, gridH, boxW, boxH, fx, fy, dpr } })
  }, [on, metrics, dpr])

  // The theme's colours, read off the grid, and again whenever the theme changes (next-themes writes the root's class).
  React.useLayoutEffect(() => {
    const p = painter.current
    const root = rootRef.current
    if (!on || !p || !root) return
    let last = ""
    const send = () => {
      const colours = readFieldColours(root)
      const key = JSON.stringify(colours)
      if (key === last) return
      last = key
      p.post({ type: "colours", colours })
    }
    send()
    const watch = new MutationObserver(send)
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] })
    return () => watch.disconnect()
  }, [on, rootRef])

  React.useLayoutEffect(() => {
    if (on) painter.current?.post({ type: "overlay", on: overlay })
  }, [on, overlay])

  const field = React.useMemo(
    () => ({
      /** Where the painter's canvases go: over the field, under the page's boxes. */
      host,
      /** The pointer's cell, −1 for none: lit at once, and the one it leaves fades back (D34). */
      cursor(cell: number) {
        const fade = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : LIT_FADE_MS
        painter.current?.post({ type: "cursor", cell, at: performance.timeOrigin + performance.now(), fade })
      },
    }),
    [],
  )
  return { field, on }
}
type FieldHandle = ReturnType<typeof useGridField>["field"]

/** The screen's density, and again when it changes — a window dragged to another screen, or the page zoomed. */
function useDevicePixelRatio() {
  const [dpr, setDpr] = React.useState(() => (typeof window === "undefined" ? 1 : window.devicePixelRatio || 1))
  React.useEffect(() => {
    let query: MediaQueryList | null = null
    const read = () => {
      query?.removeEventListener("change", read)
      setDpr(window.devicePixelRatio || 1)
      query = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`)
      query.addEventListener("change", read)
    }
    read()
    return () => query?.removeEventListener("change", read)
  }, [])
  return dpr
}

/**
 * The painter's colours, from the theme's tokens as the grid resolves them: the overlay's dashes are `--border` at 70%
 * (its `border-border/70`), the pointer's cell `--violet` (D43), and the page's own `--background`. The lines (`--lime`,
 * `--violet`) and their glow are what the painter drew the intro's passes in; it still takes them. A canvas takes any
 * colour CSS can write, and a pixel of one turns each into plain RGBA to send.
 */
let colourProbe: CanvasRenderingContext2D | null = null
function readFieldColours(root: HTMLElement): FieldColours {
  const style = getComputedStyle(root)
  colourProbe ??= Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true })
  const rgba = (token: string, alpha = 1): FieldRgba => {
    const ctx = colourProbe
    if (!ctx) return [0, 0, 0, 0]
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = "rgba(0, 0, 0, 0)"
    ctx.fillStyle = style.getPropertyValue(token).trim() || "rgba(0, 0, 0, 0)"
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    return [r!, g!, b!, (a! / 255) * alpha]
  }
  return {
    dash: rgba("--border", 0.7),
    lines: [rgba("--lime"), rgba("--violet")],
    glow: 0,
    cursor: rgba("--violet"),
    ground: rgba("--background"),
  }
}

/**
 * Loading a page onto the field (Grid-v2.md D48, 2026-09-27, his: "remove the ripple effect intro and page transitions
 * and replace with the current loaders that we created"). Two moments load a page, and both play the loader
 * (`GridLoader`, loading, Motion.md M10):
 *
 * - **The intro** (`intro`, D31): the document's first page. Held back from the server's render on; the loader turns on
 *   the field until the page is ready — the fonts, the window's load and the images on the field, INTRO_MAX_WAIT_MS at
 *   most — and for INTRO_MIN_MS at the least, and then opens it. Once per document load, never under reduced motion. Until D48 the grid drew itself in
 *   first, a front rising from the bottom (D31, D44), and drew itself again, pass after pass, while the page loaded.
 * - **A page change** (`page`, which `GridPages` passes as the turn puts a page on the field), when the page has images
 *   still to come: the loader turns until they are in and opens it. A page with nothing to load shows at once. Until D48
 *   a ripple ran through the field instead (D32) and washed the last page away (D37).
 *
 * A new box mid-intro — a phone's bar sliding away, a window resized — hands straight over rather than loading on a
 * field it did not start on.
 */
function useGridLoad(enabled: boolean, metrics: GridMetrics | null, page: number | undefined, rootRef: React.RefObject<HTMLDivElement | null>) {
  // The same on the server and in the browser's first render, so hydration matches; reduced motion is taken off in
  // the layout effect, before the first measured frame paints.
  const [load, setLoad] = React.useState<Load | null>(() => (enabled && !introPlayed ? { key: 0, intro: true, phase: "loading" } : null))
  const startedOn = React.useRef<GridMetrics | null>(null)
  const keys = React.useRef(0)
  const intro = load?.intro ? load : null

  React.useLayoutEffect(() => {
    if (!intro) return
    if (!enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      introPlayed = true
      setLoad(null)
      return
    }
    if (!metrics || intro.phase !== "loading") return
    if (startedOn.current && startedOn.current !== metrics) {
      setLoad(null)
      return
    }
    startedOn.current = metrics
    introPlayed = true
    // Two frames after the page is ready — and INTRO_MIN_MS at the least — so a page arranged on the measured field has
    // its boxes in the DOM for the loader to find: `PortfolioPages` mounts them the render after the grid reports its
    // field.
    let live = true
    let raf = 0
    const least = new Promise<void>((done) => window.setTimeout(done, INTRO_MIN_MS))
    Promise.all([pageReady(rootRef.current), least]).then(() => {
      raf = window.requestAnimationFrame(() => {
        raf = window.requestAnimationFrame(() => {
          if (live) setLoad((l) => (l?.key === intro.key && l.phase === "loading" ? { ...l, phase: "opening" } : l))
        })
      })
    })
    return () => {
      live = false
      window.cancelAnimationFrame(raf)
    }
  }, [intro, enabled, metrics, rootRef])

  // A page change loads the page now on the field if it has anything still to load — its images — in the commit that
  // put it there: a layout effect's update renders again before the frame is painted, so the page is held from its
  // first frame. The loader turns until they are in, INTRO_MAX_WAIT_MS at most, and opens. A page with nothing to load
  // — every page `GridPages` holds is rendered from its layout, and its images once fetched are cached — shows at once
  // and fades in (his, 2026-09-27: "when all the pages are uh, either pre-rendered or already loaded and cached which
  // doesn't need any extra loading can directly render the page rather than showing any loading").
  // Keyed on whether the field is measured, not on its metrics: a resize or a turned phone mid-load re-measures, and
  // re-running here would end the load's wait and find no page change to start another, the rings turning for good.
  const measured = metrics !== null
  const shown = React.useRef(page)
  React.useLayoutEffect(() => {
    const was = shown.current
    shown.current = page
    if (page === undefined || was === undefined || page === was || !measured) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const pending = pendingImages(rootRef.current)
    // Nothing to load: shown at once, and a turn's load still running for the page before is over with it.
    if (!pending.length) {
      setLoad((l) => (l && !l.intro ? null : l))
      return
    }
    const key = ++keys.current
    setLoad((l) => (l?.intro ? l : { key, intro: false, phase: "loading" }))
    let live = true
    const cap = new Promise<void>((done) => window.setTimeout(done, INTRO_MAX_WAIT_MS))
    Promise.race([imagesReady(pending), cap]).then(() => {
      if (live) setLoad((l) => (l?.key === key && l.phase === "loading" ? { ...l, phase: "opening" } : l))
    })
    return () => {
      live = false
    }
  }, [page, measured, rootRef])

  const finish = React.useCallback((key: number) => setLoad((l) => (l?.key === key ? null : l)), [])
  return { load, finish }
}

/**
 * The loader (Grid-v2.md D48, 2026-09-27; Motion.md M10, his motion) on the page being loaded: its boxes — the field's
 * own, not the pager's — as a square of dashed lime rings on the field's centre, one a box, never wider than tall
 * (`loaderLayout`), in reading order, turning while the page loads. Once it is `ready` every ring is pressed at once,
 * its dashes closing into a full circle as it shrinks, goes straight to its box's top-left cell as movement's dot does and lands with the rest, is released into the plain border a box wears, and
 * opens out to the box's edges, the box shown inside it and the border fading as it comes. `useLoadMotion` plays it, the
 * hook the motion studio plays it through, on the `--motion-load-*` and `--motion-move-*` tokens, with its painters.
 *
 * The boxes are read off the tracks where the grid put them (their offset parent), whenever the grid renders or a box
 * comes or goes: a page arranged once the field is measured mounts its boxes a frame or two after the grid. **Boxes that
 * carry the same `data-load-section` are one section** (his, 2026-09-27, on the portfolio: "Instead of 10 loading
 * cells, let's have 6. One for each section"): one ring, which opens over the rectangle round them all, each box shown
 * where the ring has reached it. A box without one is a section of its own. **An element inside a box that carries
 * `data-load-box` is a section of its own** (his, 2026-09-28, on the portfolio: "I want all the cards to have one
 * circle … everything"): a box with any is no section itself, and each piece of it — a card, a button, a label, a mark
 * — is one ring, opening over its own edges; pieces of one box with the same value are one (a mark drawn in two
 * layers), and a piece not laid out (in a tab not shown) is none. Each is held back by globals.css (`data-loading`)
 * until the loader paints it, then clipped to its ring until it is in; `clip-path: none` holds it open over the hold
 * until the load is over, and what the loader wrote comes off with it. What a box of pieces holds outside them is
 * hidden until the load is over.
 */
function GridLoader({ metrics, ready, onIn }: { metrics: GridMetrics; ready: boolean; onIn: () => void }) {
  const { cols, rows, cell, gap } = metrics
  const layer = React.useRef<HTMLDivElement>(null)
  const rings = React.useRef<(SVGSVGElement | null)[]>([])
  /** Each section's boxes, where the grid put them, in the order of `targets`. */
  const sections = React.useRef<{ el: HTMLElement; box: LoadBox }[][]>([])
  const [targets, setTargets] = React.useState<LoadBox[]>([])

  React.useLayoutEffect(() => {
    const tracks = layer.current?.parentElement?.querySelector<HTMLElement>(':scope > [data-slot="grid-tracks"]')
    if (!tracks) return
    const read = () => {
      const grouped = new Map<string, { el: HTMLElement; box: LoadBox }[]>()
      const add = (key: string, el: HTMLElement, box: LoadBox) => grouped.set(key, [...(grouped.get(key) ?? []), { el, box }])
      tracks.querySelectorAll<HTMLElement>(':scope > [data-slot="grid-item"]:not([data-pager])').forEach((el, i) => {
        const box = { l: el.offsetLeft, t: el.offsetTop, r: el.offsetLeft + el.offsetWidth, b: el.offsetTop + el.offsetHeight }
        const pieces = el.querySelectorAll<HTMLElement>("[data-load-box]")
        if (!pieces.length) return add(el.dataset.loadSection || `#${i}`, el, box)
        // A box of pieces: each is a section of its own, where it stands in the box — one not laid out (a tab not
        // shown) is none — and pieces that share a value are one.
        const at = el.getBoundingClientRect()
        pieces.forEach((piece, k) => {
          if (piece.parentElement?.closest("[data-load-box]")) return
          const r = piece.getBoundingClientRect()
          if (!r.width || !r.height) return
          const l = box.l + r.left - at.left
          const t = box.t + r.top - at.top
          // Bare (`data-load-box`, which React writes as "true") it is a piece alone; a name groups it.
          const name = piece.dataset.loadBox
          add(`#${i}/${name && name !== "true" ? name : `#${k}`}`, piece, { l, t, r: l + r.width, b: t + r.height })
        })
      })
      // Each section's box is the rectangle round its boxes.
      const found = [...grouped.values()]
        .map((members) => ({
          members,
          box: {
            l: Math.min(...members.map((m) => m.box.l)),
            t: Math.min(...members.map((m) => m.box.t)),
            r: Math.max(...members.map((m) => m.box.r)),
            b: Math.max(...members.map((m) => m.box.b)),
          },
        }))
        .sort((a, b) => a.box.t - b.box.t || a.box.l - b.box.l)
      // What was written on a piece the loader no longer has comes off it, so it is not left clipped.
      const kept = new Set(found.flatMap((f) => f.members.map((m) => m.el)))
      for (const { el } of sections.current.flat()) {
        if (kept.has(el)) continue
        el.style.clipPath = ""
        el.style.opacity = ""
      }
      sections.current = found.map((f) => f.members)
      setTargets((prev) =>
        prev.length === found.length && prev.every((p, i) => Object.entries(found[i]!.box).every(([k, v]) => Math.abs(p[k as keyof LoadBox] - v) < 0.5))
          ? prev
          : found.map((f) => f.box),
      )
    }
    read()
    // The boxes coming and going, and the pieces in them: a box lays its pieces out a render or two after it mounts.
    const watch = new MutationObserver(read)
    watch.observe(tracks, { childList: true, subtree: true })
    return () => watch.disconnect()
  })

  // What the loader wrote on the boxes comes off with it.
  React.useLayoutEffect(
    () => () => {
      for (const { el } of sections.current.flat()) {
        el.style.clipPath = ""
        el.style.opacity = ""
      }
    },
    [],
  )

  const paint = React.useCallback(
    (frames: LoadFrame[]) => {
      frames.forEach((f, j) => {
        paintLoadRing(rings.current[j] ?? null, f, cell)
        // Every box of the section, shown where its ring has reached it — clipped to the ring's box in its own terms.
        for (const { el, box } of sections.current[j] ?? []) {
          paintLoadSection(el, f, box, cell)
          // In, and held open over globals.css's hold until the load is over.
          if (!el.style.clipPath) el.style.clipPath = "none"
        }
      })
    },
    [cell],
  )

  // It loads from its first frame and opens from the next render at the earliest: mounted ready, the hook would take
  // the page for one that was never loading, and put it in at once — a turn's page, which is ready from the start.
  const [armed, setArmed] = React.useState(false)
  React.useLayoutEffect(() => setArmed(true), [])
  useLoadMotion({ block: layer, cols, rows, targets, cell, gap, ready: ready && armed, paint, onIn })

  return (
    // Clipped to the field: a page of more sections than the field has cells stands a row past it (`loaderLayout`),
    // and unclipped that row would scroll the page and re-count the field under the load.
    <div ref={layer} data-slot="grid-loader" aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {targets.map((_, j) => (
        <svg
          key={j}
          ref={(el) => void (rings.current[j] = el)}
          className="absolute top-0 left-0 origin-center overflow-visible"
          style={{ visibility: "hidden" }}
        >
          <rect x={0.5} y={0.5} fill="none" strokeWidth={1} className="stroke-lime" />
        </svg>
      ))}
    </div>
  )
}

/** The intro's numbers as CSS, set on the grid while it runs; globals.css times the pager's reveal with them. */
function introStyle(on: boolean): React.CSSProperties | undefined {
  if (!on) return undefined
  return { "--grid-intro-reveal": `${INTRO_REVEAL_MS}ms` } as React.CSSProperties
}

// ── the cursor (Grid-v2.md D34, 2026-09-25) ──────────────────────────────────────────────────────────────────────

/**
 * His ask: "make the cursor transparent line bordered circle and it should fill when clicked. Every cell on the grid
 * should turn its border to line. Whenever the cursor is on it." Asked, "line" was lime. A solid line for an afternoon,
 * then the cell's own dashes (his, the same day: "we should still have it dashed border for cells when cursor is over
 * them. Like what we have as default for cells"). Violet since D43 (2026-09-26), the ring's colour and then the cell's.
 * A cell the pointer leaves fades back over LIT_FADE_MS, the way a line the intro drew did (D31); the one it is on is
 * lit at once.
 *
 * The ring is the system's cursor, drawn from an image (globals.css), since the evening it was built. It was a div the
 * page moved on every pointer move, and each move cost the main thread a whole-page layerize — about 1ms on an
 * M-series Mac, several on a slower laptop (measured 2026-09-25, looking into his report of a jitter over the avatar)
 * — and it trailed the hand by at least a frame, more whenever the page was busy. An image cursor is drawn by the
 * system, where the hand is, and costs the page nothing.
 */

/**
 * The pointer's cell, lit — sent straight to the field's painter from the pointer's events, never through React state:
 * a move costs a subtraction and a division, and one message when it crosses into another cell. It never touches the
 * page: the painter has the field's numbers, paints in a worker, and draws the cell's ring in violet, over the lines and
 * under the page's boxes (D38, D40). The cell is found from the field's numbers,
 * not by hit-testing, so it lights under a card as well (where the card hides it); the gutter between two cells lights
 * nothing, and since D40 nor do the corners of a cell's square outside its circle. Only where the device can hover with
 * a fine pointer; a touch on a hybrid screen is ignored.
 */
function useGridCursor(enabled: boolean, metrics: GridMetrics | null, rootRef: React.RefObject<HTMLDivElement | null>, field: FieldHandle) {
  const [fine, setFine] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) return
    const query = window.matchMedia("(hover: hover) and (pointer: fine)")
    const read = () => setFine(query.matches)
    read()
    query.addEventListener("change", read)
    return () => query.removeEventListener("change", read)
  }, [enabled])

  const on = enabled && fine

  React.useEffect(() => {
    const root = rootRef.current
    if (!on || !metrics || !root) return
    const { cols, cell, gap, gridW, gridH } = metrics
    const pitch = cell + gap
    // The field's corner on the screen. The grid never scrolls and a turn moves no box, so it only changes with the
    // box — which is new metrics, and this effect again — or with the page around it, which entering it re-reads.
    let left = 0
    let top = 0
    const measure = () => {
      const rect = root.querySelector(':scope > [data-slot="grid-box"]')?.getBoundingClientRect()
      if (rect) ({ left, top } = rect)
    }
    measure()
    let lit = -1
    const light = (i: number) => {
      if (i === lit) return
      lit = i
      field.cursor(i)
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return
      const x = event.clientX - left
      const y = event.clientY - top
      const col = Math.floor(x / pitch)
      const row = Math.floor(y / pitch)
      // In the cell's circle (D40): the corners of its square light nothing, as the gutter does not.
      const dx = x - col * pitch - cell / 2
      const dy = y - row * pitch - cell / 2
      const inCell = x >= 0 && y >= 0 && x < gridW && y < gridH && dx * dx + dy * dy < (cell / 2) * (cell / 2)
      // A page may still the pointer's cell while `data-cursor-still` is on the grid: the portfolio's card in focus
      // (Portfolio.md P18), whose blur over the field would smear a lit cell and be redrawn whole for every frame of its
      // fade (Motion.md M13). The ring is still the pointer.
      light(inCell && !root.hasAttribute("data-cursor-still") ? row * cols + col : -1)
    }
    const leave = () => light(-1)
    root.addEventListener("pointerenter", measure)
    root.addEventListener("pointermove", move)
    root.addEventListener("pointerleave", leave)
    return () => {
      root.removeEventListener("pointerenter", measure)
      root.removeEventListener("pointermove", move)
      root.removeEventListener("pointerleave", leave)
      light(-1)
    }
  }, [on, metrics, rootRef, field])

  return { on }
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

export { Grid, GridItem }
