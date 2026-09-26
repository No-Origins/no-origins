"use client"

import * as React from "react"
import gsap from "gsap"
import { cn } from "cn"

import { useThemeFlipRegistry, type ThemeFlipper } from "@no-origins/ui/components/theme-provider"
import { FIELD_PAD, startFieldPainter, type FieldColours, type FieldMessage, type FieldPainter, type FieldRgba } from "@no-origins/ui/lib/grid-field"

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
   * Open by drawing the grid in, and hold the drawing while the page loads (Grid.md D31). Played once per document
   * load, by the grid that asks for it; never under reduced motion.
   */
  intro?: boolean
  /**
   * Run the intro's drawing through the field, lines only, when `page` changes (Grid.md D32): up from the bottom when it
   * grows, down from the top when it shrinks. Never under reduced motion.
   */
  ripple?: boolean
  /** The page on the field, for `ripple`. `GridPages` passes it; a grid without pages has no use for it. */
  page?: number
  /**
   * Draw the pointer as a lime ring that fills while it is pressed, and light the cell under it: its dashes in lime
   * (Grid.md D34). A mouse or a pen only: nothing changes on touch.
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
  ripple = false,
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

  // The field's paint (D38) — the overlay's dashes, the lit lines and the pointer's cell, on canvases one painter
  // draws — first, so its effects have run before the intro, the ripple and the cursor ask anything of it.
  const { field, on: painted } = useGridField(overlay || introProp || ripple || cursorProp, metrics, ref, overlay)
  const intro = useGridIntro(introProp, metrics, ref, field)
  useGridRipple(ripple && !intro.on, metrics, page, field, ref)
  const cursor = useGridCursor(cursorProp, metrics, ref, field)

  // The box's padding is the gutter (D15) — before the field is measured it is the breakpoint's gap by width alone,
  // which is what it will be once measured too. Whatever the count leaves over is centred by the flex box (D14).
  const gap = metrics?.gap ?? specFor(config, breakpointFor(box?.w ?? 0)).gap

  return (
    <div
      ref={setRef}
      data-slot="grid"
      data-breakpoint={metrics?.bp}
      // While the intro runs (D31) — "drawing", then "arriving" as page 1 turns in: the page's boxes and the pager are
      // held back by globals.css until it hands over, and nothing turns a page.
      data-intro={intro.on ? intro.phase : undefined}
      // The ring is the pointer (D34): globals.css draws the system's cursor as the lime ring over the whole grid.
      data-cursor={cursor.on ? "" : undefined}
      // The grid is always its box: the screen. A className may give it another height when there is chrome above
      // (`h-[calc(100dvh-3.5rem)]`), never a width.
      className={cn("relative flex items-center justify-center h-dvh w-full", className)}
      style={{ padding: `${gap}px`, ...introStyle(intro.on), ...style }}
      {...props}
    >
      {/* The field's paint (D38) — its dashes, lit lines and the intro's reveal — over the whole box and under the
          page's boxes; the painter puts its canvases here. */}
      {painted ? <div ref={field.host} data-slot="grid-field" aria-hidden className="pointer-events-none absolute inset-0" /> : null}
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
          </div>
          {/* The theme's flip (D28) — the outermost grid on the page takes the switch. */}
          <GridThemeFlip />
        </GridContext.Provider>
      ) : null}
    </div>
  )
}

// ── the intro (Grid-v2.md D31, 2026-09-24) ───────────────────────────────────────────────────────────────────────

/**
 * His numbers, from the settings he sent back from the motion study: a front that rises from the bottom with a cone
 * for its edge — the centre leads, the sides trail by INTRO_DEPTH steps, the point in the middle — each step
 * INTRO_STEP_MS, every cell a cut. A line is lit the moment it is drawn and fades back to its usual colour over
 * INTRO_FADE_MS, after INTRO_FADE_HOLD_MS. While the page loads the drawing goes again straight away (INTRO_GAP_MS),
 * lines only, lime and violet turn about. The step was 30ms in his settings and is 15ms since 2026-09-25 — "Increase
 * the speed of the ripple" — for the intro and the ripple between pages alike (D32).
 */
const INTRO_STEP_MS = 15
const INTRO_DEPTH = 12
/**
 * The field the cone was tuned on: a 1440 desktop, eighteen columns. INTRO_DEPTH is how far its sides trail THERE; on a
 * narrower field the cone keeps that angle and is shallower, never deeper (his, 2026-09-25: on a phone "the ripple
 * completes the middle two columns and then there is a ripple on the left and right columns" — twelve steps of trail
 * across a half-width of two columns, on a field eight rows tall, was a spike, not a front).
 */
const INTRO_CONE_COLS = 18
const INTRO_POINT = 0.5
const INTRO_FADE_HOLD_MS = 0
const INTRO_FADE_MS = 500
const INTRO_GAP_MS = 0
/** Each pass's colour, turn about: the first is lime. The tokens are globals.css's `--lime` and `--violet`. */
const INTRO_LINES = ["lime", "violet"] as const
/**
 * Mine, tune by looking: page 1's reveal, from its bottom edge upward; and the longest the drawing waits for the page
 * before handing over anyway, so a slow network never leaves anyone on a loader (D31, open item 3).
 */
const INTRO_REVEAL_MS = 420
const INTRO_MAX_WAIT_MS = 3000

/**
 * How long a ripple takes to cross a field of this many cells, in ms: from the first cell it draws to the last (D32).
 * A page turn holds the next page back this long, so the ripple washes the last page away (D37) and the page comes up
 * after it (his, 2026-09-25: "it would be great if the ripple ends and then the components come up on the grid").
 */
export function rippleSpan(cols: number, rows: number) {
  return cols > 0 && rows > 0 ? ripplePlan(cols, rows).span : 0
}

/**
 * Once per document load (D31, open item 5 — mine): a navigation that mounts another grid does not play it again; a
 * reload does. Set only in the browser, so the server's render always carries the cover.
 */
let introPlayed = false

/** Where a pass starts: the bottom (the intro, a turn forward) or the top (a turn back, D32). */
type PassFrom = "bottom" | "top"

/**
 * When a pass reaches each cell, in ms from the pass's start, row-major; and how long the pass is. `along` counts rows
 * from the edge the pass starts at; the cone adds up to `depth` steps with the distance from the point — INTRO_DEPTH
 * on a field as wide as INTRO_CONE_COLS or wider, and in proportion on a narrower one, so the edge keeps its angle.
 * The first cell to be drawn is drawn at 0. Counts are even (D26), so the two centre columns tie and the point is
 * symmetric.
 */
function ripplePlan(cols: number, rows: number, from: PassFrom = "bottom") {
  const delays = new Float64Array(cols * rows)
  const reach = Math.max(INTRO_POINT, 1 - INTRO_POINT) || 1
  const depth = INTRO_DEPTH * Math.min(1, Math.max(0, cols - 1) / (INTRO_CONE_COLS - 1))
  let min = Infinity
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const across = cols > 1 ? c / (cols - 1) : INTRO_POINT
      const along = from === "bottom" ? rows - 1 - r : r
      const d = along + depth * Math.min(1, Math.abs(across - INTRO_POINT) / reach)
      delays[r * cols + c] = d
      min = Math.min(min, d)
    }
  }
  let span = 0
  for (let i = 0; i < delays.length; i++) {
    delays[i] = (delays[i]! - min) * INTRO_STEP_MS
    span = Math.max(span, delays[i]!)
  }
  // The cells in the order the pass reaches them, for handing each its animation just before its turn.
  const order = Array.from({ length: delays.length }, (_, i) => i).sort((a, b) => delays[a]! - delays[b]!)
  return { delays, span, order }
}

/**
 * Ready is the fonts, the images already on the field and the window's load — so page 1 arrives finished and the
 * drawing hides the font swap — or INTRO_MAX_WAIT_MS, whichever is first (D31, open item 4 — mine).
 */
function pageReady(root: HTMLElement | null): Promise<void> {
  const loaded = document.readyState === "complete" ? Promise.resolve() : new Promise<void>((done) => window.addEventListener("load", () => done(), { once: true }))
  const fonts = document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve()
  const images = Array.from(root?.querySelectorAll("img") ?? []).map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined)))
  const cap = new Promise<void>((done) => window.setTimeout(done, INTRO_MAX_WAIT_MS))
  return Promise.race([Promise.all([loaded, fonts, ...images]).then(() => undefined), cap])
}

type IntroPhase = "off" | "drawing" | "arriving"
type RipplePlan = ReturnType<typeof ripplePlan>

/**
 * The first pass of the intro starts this far ahead of the frame that asks for it, in ms: the painter may be starting
 * its worker in that same frame (D38). Until then the grid wears the cover's colour, so the wait is under the cover.
 */
const INTRO_LEAD_MS = 48

/**
 * The field's paint (Grid-v2.md D38, 2026-09-25): the overlay's dashes, the lines the intro and the ripple light, and
 * the pointer's cell — on two canvases one painter draws (`lib/grid-field.ts`), in a worker wherever the browser can
 * hand it a canvas. They were about 1,300 elements, and a pass was 216 CSS animations started at once and handed out
 * from the main thread; in WebKit that alone cost the intro 100–250ms of frames, and a busy main thread made cells miss
 * their turn (his report: the ripple "starts, but then it disappears in the middle and then shows up in the end").
 *
 * The grid tells the painter the field, the theme's colours and when each pass starts, as the plan's delays and a
 * moment on the shared clock; the painter keeps time itself. `play` counts the colours turn about — lime, violet —
 * across the intro and every turn after it, and `next` says which the next pass will be. Passes still running are kept
 * and sent again to a painter that starts over (React's strict mode runs every effect twice), so none is lost.
 */
function useGridField(enabled: boolean, metrics: GridMetrics | null, rootRef: React.RefObject<HTMLDivElement | null>, overlay: boolean) {
  const on = enabled && !!metrics
  const host = React.useRef<HTMLDivElement>(null)
  const painter = React.useRef<FieldPainter | null>(null)
  const canvases = React.useRef<{ field: HTMLCanvasElement; lines: HTMLCanvasElement } | null>(null)
  const passes = React.useRef(0)
  const live = React.useRef<Extract<FieldMessage, { type: "pass" | "reveal" }>[]>([])
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
    const p = startFieldPainter(cvs, { fade: INTRO_FADE_MS, pad: FIELD_PAD })
    painter.current = p
    // Where it paints, for anyone looking: "worker", or "main" where a canvas cannot be handed over.
    el.dataset.painter = p.where
    const now = performance.timeOrigin + performance.now()
    // A reveal stays until the intro is over; a pass until it has faded.
    live.current = live.current.filter((m) => m.type === "reveal" || m.zero + m.span + INTRO_FADE_MS > now)
    for (const m of live.current) p.post(m)
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
      /** The colour the next pass will play in. */
      next: () => INTRO_LINES[passes.current % INTRO_LINES.length]!,
      /** One pass of `plan`, on the next colour, starting at `zero` (ms, the page's clock — `performance.now()`). */
      play(plan: RipplePlan, zero: number) {
        const layer = passes.current % INTRO_LINES.length
        passes.current++
        const m = { type: "pass", layer, delays: plan.delays, span: plan.span, zero: performance.timeOrigin + zero } as const
        const now = performance.timeOrigin + performance.now()
        live.current = [...live.current.filter((l) => l.type === "reveal" || l.zero + l.span + INTRO_FADE_MS > now), m]
        painter.current?.post(m)
      },
      /**
       * The intro's reveal: the box, tile by tile, back from the cover's colour to the page's, and each cell's dashes, on
       * the painter's clock from `zero` (ms, `performance.now()`). Null when the intro is over.
       */
      reveal(plan: RipplePlan | null, zero = 0) {
        live.current = live.current.filter((l) => l.type !== "reveal")
        if (!plan) {
          painter.current?.post({ type: "reveal" })
          return
        }
        const m = { type: "reveal", delays: plan.delays, span: plan.span, zero: performance.timeOrigin + zero } as const
        live.current.push(m)
        painter.current?.post(m)
      },
      /** The pointer's cell, −1 for none: lit at once, and the one it leaves fades back (D34). */
      cursor(cell: number) {
        const fade = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : INTRO_FADE_MS
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
 * (its `border-border/70`), the lines `--lime` and `--violet`, the glow `--grid-intro-glow`, and what the intro reveals
 * the page's own `--background`. A canvas takes any colour
 * CSS can write, and a pixel of one turns each into plain RGBA to send.
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
    lines: INTRO_LINES.map((line) => rgba(`--${line}`)),
    glow: parseFloat(style.getPropertyValue("--grid-intro-glow")) || 16,
    cursor: rgba("--lime"),
    ground: rgba("--background"),
  }
}

/**
 * The intro's clock, and nothing here runs per frame. It ran as a frame loop at first, a writer per frame setting every
 * lit line's opacity, and it lagged (his report, 2026-09-24): every write re-rasterised the glowing layers on the main
 * thread's busiest second, the page's own load. Then every cell was a CSS animation (D31), which cost as much in
 * another way — 216 layers made at once, and later passes handed out from the main thread (D38). Now a pass is one
 * message to the field's painter with the moment it starts — the reveal of the box, tile by tile, on the same moment —
 * and what is left here is a timer per pass: when a pass ends, the page is either ready — page 1 turns in — or the next pass is
 * played.
 */
function useGridIntro(
  enabled: boolean,
  metrics: GridMetrics | null,
  rootRef: React.RefObject<HTMLDivElement | null>,
  field: FieldHandle,
) {
  // The same on the server and in the browser's first render, so hydration matches; reduced motion is taken off in
  // the layout effect, before the first measured frame paints, and globals.css hides the server's cover for it.
  const [phase, setPhase] = React.useState<IntroPhase>(() => (enabled && !introPlayed ? "drawing" : "off"))
  const on = phase !== "off"
  const startedOn = React.useRef<GridMetrics | null>(null)
  const startedAt = React.useRef(0)
  const cols = metrics?.cols ?? 0
  const rows = metrics?.rows ?? 0
  const plan = React.useMemo<RipplePlan | null>(() => (on && cols && rows ? ripplePlan(cols, rows) : null), [on, cols, rows])

  React.useLayoutEffect(() => {
    if (!on) return
    if (!enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      introPlayed = true
      setPhase("off")
      return
    }
    if (!metrics || !plan) return
    // A new box mid-intro — a phone's bar sliding away, a window resized — hands straight over rather than redrawing
    // on a field the drawing did not start on. The same box again is React re-running the effect (strict mode): the
    // first pass is already playing (the DOM kept it), so it is not played twice and the clock keeps its start.
    if (startedOn.current && startedOn.current !== metrics) {
      setPhase("off")
      return
    }
    if (!startedOn.current) {
      startedOn.current = metrics
      // A moment just ahead (INTRO_LEAD_MS), for the reveal and the lines alike: one clock, the painter's.
      const zero = performance.now() + INTRO_LEAD_MS
      startedAt.current = zero
      introPlayed = true
      field.reveal(plan, zero)
      field.play(plan, zero)
    }

    let ready = false
    pageReady(rootRef.current).then(() => {
      ready = true
    })
    const t0 = startedAt.current
    let passStart = 0
    let timer = 0
    const after = (at: number, run: () => void) => {
      timer = window.setTimeout(run, Math.max(0, at - (performance.now() - t0)))
    }
    const endOfPass = () => {
      const passEnd = passStart + plan.span
      if (ready) {
        // Page 1 turns in with the fade (globals.css animates it off `data-intro="arriving"`), and the intro is over
        // when the last line has faded and the page is in.
        setPhase("arriving")
        after(passEnd + INTRO_FADE_HOLD_MS + Math.max(INTRO_FADE_MS, INTRO_REVEAL_MS), () => setPhase("off"))
        return
      }
      // Another pass, lines only, in the other colour, on the moment it is due — the painter starts it part-way if this
      // timer fired late, so the front stays where the clock says it is.
      passStart = passEnd + INTRO_GAP_MS
      field.play(plan, t0 + passStart)
      after(passStart + plan.span, endOfPass)
    }
    after(plan.span, endOfPass)
    return () => window.clearTimeout(timer)
  }, [on, enabled, metrics, plan, rootRef, field])

  // Over: the grid has its own colour again (the attribute is gone from this commit), so the painter may stop painting
  // the reveal's tiles the next time it paints the field. It does not repaint for it — a canvas cleared before the grid
  // lost the cover's colour would flash that colour for a frame.
  const wasOn = React.useRef(on)
  React.useLayoutEffect(() => {
    if (wasOn.current && !on) field.reveal(null)
    wasOn.current = on
  }, [on, field])

  return { phase, on, plan }
}

/**
 * The ripple between pages (D32): when the page on the field changes, one pass of the intro's drawing runs through
 * the field, lines only — up from the bottom when the turn is forward, and down from the top when it is back. It
 * starts at the change — since D37 the moment a turn commits, with the last page still on the field for the pass to
 * wash away (`washAway`, which the turn plays in the same frame) — not while the hand is still scrolling, because a
 * scroll let go short of the turn settles back and turns nothing.
 */
function useGridRipple(
  enabled: boolean,
  metrics: GridMetrics | null,
  page: number | undefined,
  field: FieldHandle,
  rootRef: React.RefObject<HTMLDivElement | null>,
) {
  const shown = React.useRef(page)
  const cols = metrics?.cols ?? 0
  const rows = metrics?.rows ?? 0
  const plans = React.useMemo(
    () => (enabled && cols && rows ? { forward: ripplePlan(cols, rows, "bottom"), back: ripplePlan(cols, rows, "top") } : null),
    [enabled, cols, rows],
  )
  // The field the last page change was seen on. A new field is a resize, and a resize that packs fewer pages clamps the
  // page with no turn: that change is recorded, not played.
  const planned = React.useRef(plans)
  React.useLayoutEffect(() => {
    const was = shown.current
    shown.current = page
    const resized = planned.current !== plans
    planned.current = plans
    if (!plans || resized || page === undefined || was === undefined || page === was) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // One frame after the change, on that frame's own time, which a wash started in the same frame starts on too
    // (`washAway`, D37): the lines and the cut keep step.
    const plan = page > was ? plans.forward : plans.back
    const raf = window.requestAnimationFrame(() => {
      const at = document.timeline.currentTime
      field.play(plan, typeof at === "number" ? at : performance.now())
      if (rootRef.current) rootRef.current.dataset.rippleNext = field.next()
    })
    return () => window.cancelAnimationFrame(raf)
  }, [page, plans, field, rootRef])
  // Which colour the next pass will be, on the grid, for the pager's arrows to fill in (grid-pager.tsx): the arrow a
  // turn fills is the colour of the ripple that turn plays. Only while the ripple is on and can play; otherwise the
  // arrows keep their own fill.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (plans && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) root.dataset.rippleNext = field.next()
    else delete root.dataset.rippleNext
  }, [plans, field, rootRef])
}

/**
 * How far past the box a cut the front has not reached yet lies, in px: room for a card's shadow inside the 12px gutter,
 * so a card keeps it on every side the front has not touched (the bleed D27's clip had).
 */
const WASH_BLEED = 8

/**
 * The ripple washes the page away (Grid-v2.md D37, 2026-09-25, his: "let's not shrink the cards … let the ripple wash
 * away the cards and then let the new page … render"). Every box on the field is cut away cell by cell as the pass's
 * front reaches each of its cells, at the pass's own times from the same plan as the lines, so where the front crosses
 * a card the card is gone and the line lit under it shows. Up from the bottom going forward, down from the top going
 * back. What the front has not reached yet is untouched: nothing in the box moves or is squeezed.
 *
 * Each box is ONE animation of its `clip-path`, a staircase polygon that steps each time the front crosses one of its
 * cells — a cut, like every cell of the intro — so nothing is written per frame. A cut lies in the middle of the gutter
 * inside the box, where the intro's tiles meet (D31). It starts on the timeline's current time, which in an animation frame
 * is the frame's own, as the lines' pass does when it is played in the same frame (`useGridRipple`), so the two keep
 * step. The animations fill forwards: the boxes stay washed until the page is taken off the field. The caller cancels
 * them if the same page comes back instead.
 */
export function washAway(tracks: HTMLElement, m: GridMetrics, dir: 1 | -1): Animation[] {
  const { cols, rows, cell, gap } = m
  const plan = ripplePlan(cols, rows, dir === 1 ? "bottom" : "top")
  const pitch = cell + gap
  const b = WASH_BLEED
  const washing: Animation[] = []
  for (const el of tracks.querySelectorAll<HTMLElement>(':scope > [data-slot="grid-item"]:not([data-pager])')) {
    // The box's cells, read off where the grid put it: the tracks are its offset parent, and a box spans whole cells.
    const w = el.offsetWidth
    const h = el.offsetHeight
    const c0 = Math.round(el.offsetLeft / pitch)
    const r0 = Math.round(el.offsetTop / pitch)
    const cs = Math.max(1, Math.round((w + gap) / pitch))
    const rs = Math.max(1, Math.round((h + gap) / pitch))
    // When the front reaches each cell, column by column. Down a column the times only grow away from the edge the
    // pass starts at, so what is washed of a column is always one run from that edge.
    const at: number[][] = []
    const times = new Set<number>()
    for (let j = 0; j < cs; j++) {
      const column: number[] = []
      for (let i = 0; i < rs; i++) {
        const t = plan.delays[Math.min(rows - 1, r0 + i) * cols + Math.min(cols - 1, c0 + j)]!
        column.push(t)
        times.add(t)
      }
      at.push(column)
    }
    // The edge the front comes from moves; the other stays where it is, `still`. A column is its cells and half the
    // gutter each side of them; the outer ones run out to the bleed.
    const still = dir === 1 ? -b : h + b
    const left = (j: number) => (j === 0 ? -b : j * pitch - gap / 2)
    const right = (j: number) => (j === cs - 1 ? w + b : j * pitch + cell + gap / 2)
    const edge = (washed: number) => {
      if (washed === 0) return dir === 1 ? h + b : -b
      if (washed === rs) return still
      return dir === 1 ? (rs - washed) * pitch - gap / 2 : washed * pitch - gap / 2
    }
    const polygon = (by: number) => {
      const points = [`${-b}px ${still}px`, `${w + b}px ${still}px`]
      for (let j = cs - 1; j >= 0; j--) {
        const y = edge(at[j]!.filter((t) => t <= by).length)
        points.push(`${right(j)}px ${y}px`, `${left(j)}px ${y}px`)
      }
      return `polygon(${points.join(", ")})`
    }
    const steps = [...times].sort((x, y) => x - y)
    const end = steps[steps.length - 1]!
    const frames: Keyframe[] = []
    if (steps[0]! > 0) frames.push({ offset: 0, clipPath: polygon(-1), easing: "step-end" })
    for (const t of steps) frames.push({ offset: end > 0 ? t / end : 0, clipPath: polygon(t), easing: "step-end" })
    if (frames.length === 1) frames.push({ ...frames[0]!, offset: 1 })
    const wash = el.animate(frames, { duration: Math.max(1, end), fill: "forwards" })
    wash.startTime = document.timeline.currentTime
    washing.push(wash)
  }
  return washing
}

/**
 * The intro's numbers as CSS, set on the grid while it runs; globals.css times page 1's reveal with them.
 */
function introStyle(on: boolean): React.CSSProperties | undefined {
  if (!on) return undefined
  return {
    "--grid-intro-reveal": `${INTRO_REVEAL_MS}ms`,
    "--grid-intro-hold": `${INTRO_FADE_HOLD_MS}ms`,
  } as React.CSSProperties
}

// ── the cursor (Grid-v2.md D34, 2026-09-25) ──────────────────────────────────────────────────────────────────────

/**
 * His ask: "make the cursor transparent line bordered circle and it should fill when clicked. Every cell on the grid
 * should turn its border to line. Whenever the cursor is on it." Asked, "line" was lime. A solid line for an afternoon,
 * then the cell's own dashes (his, the same day: "we should still have it dashed border for cells when cursor is over
 * them. Like what we have as default for cells").
 * A cell the pointer leaves fades back over the intro's own INTRO_FADE_MS, the way a line the intro drew does (D31); the
 * one it is on is lit at once.
 *
 * The ring is the system's cursor, drawn from an image (globals.css), since the evening it was built. It was a div the
 * page moved on every pointer move, and each move cost the main thread a whole-page layerize — about 1ms on an
 * M-series Mac, several on a slower laptop (measured 2026-09-25, looking into his report of a jitter over the avatar)
 * — and it trailed the hand by at least a frame, more whenever the page was busy. An image cursor is drawn by the
 * system, where the hand is, and costs the page nothing.
 */

/**
 * The pointer's cell, lit — sent straight to the field's painter from the pointer's events, never through React state:
 * a move costs a subtraction and a division, and one message when it crosses into another cell. The painter draws the
 * cell's dashes in lime, over the lines and under the page's boxes (D38). The cell is found from the field's numbers,
 * not by hit-testing, so it lights under a card as well (where the card hides it) and the gutter between two cells
 * lights nothing. Only where the device can hover with a fine pointer; a touch on a hybrid screen is ignored.
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
      const inCell = x >= 0 && y >= 0 && x < gridW && y < gridH && x - col * pitch < cell && y - row * pitch < cell
      light(inCell ? row * cols + col : -1)
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
