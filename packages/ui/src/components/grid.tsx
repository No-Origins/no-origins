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

  const lines = useGridLines()
  const intro = useGridIntro(introProp, metrics, ref, lines)
  useGridRipple(ripple && !intro.on, metrics, page, lines, ref)
  const lit = intro.on || ripple

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
      // The grid is always its box: the screen. A className may give it another height when there is chrome above
      // (`h-[calc(100dvh-3.5rem)]`), never a width.
      className={cn("relative flex items-center justify-center h-dvh w-full", className)}
      style={{ padding: `${gap}px`, ...rippleStyle(lit), ...style }}
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
            {lit ? <GridRippleLines cols={metrics.cols} rows={metrics.rows} cell={metrics.cell} gap={metrics.gap} layers={lines.layers} /> : null}
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
      {intro.on ? <GridIntroCover metrics={metrics} plan={intro.plan} /> : null}
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
 * Once per document load (D31, open item 5 — mine): a navigation that mounts another grid does not play it again; a
 * reload does. Set only in the browser, so the server's render always carries the cover.
 */
let introPlayed = false

/** Where a pass starts: the bottom (the intro, a turn forward) or the top (a turn back, D32). */
type PassFrom = "bottom" | "top"

/**
 * When a pass reaches each cell, in ms from the pass's start, row-major; and how long the pass is. `along` counts rows
 * from the edge the pass starts at; the cone adds up to INTRO_DEPTH steps with the distance from the point. The first
 * cell to be drawn is drawn at 0. Counts are even (D26), so the two centre columns tie and the point is symmetric.
 */
function ripplePlan(cols: number, rows: number, from: PassFrom = "bottom") {
  const delays = new Float64Array(cols * rows)
  const reach = Math.max(INTRO_POINT, 1 - INTRO_POINT) || 1
  let min = Infinity
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const across = cols > 1 ? c / (cols - 1) : INTRO_POINT
      const along = from === "bottom" ? rows - 1 - r : r
      const d = along + INTRO_DEPTH * Math.min(1, Math.abs(across - INTRO_POINT) / reach)
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
 * How far ahead of its turn a cell is handed its animation. Handing all of them out at the start of a pass made every
 * cell a new compositor layer in one frame — the frame that dropped when a page turned (measured 2026-09-25); handed
 * out a few frames ahead, the layers are made a few at a time across the pass and are ready when they are due.
 */
const LINES_LOOKAHEAD_MS = 64

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
 * The lit lines, shared by the intro and the ripple between pages (D31, D32): the two layers, and `play`, which runs
 * one pass on the next colour — lime, violet, lime, turn about, counted across the intro and every turn after it. A
 * pass restarts every cell's fade with the cell's delay, handing each cell its animation just before its turn
 * (LINES_LOOKAHEAD_MS); a CSS animation restarts only when its name changes, so each layer turns between two identical
 * keyframes. `late` starts the pass part-way, for a timer that fired after the pass was due. The fades themselves run
 * on the compositor; the only per-frame work here is handing out the next few cells.
 */
function useGridLines() {
  const layers = React.useRef<(HTMLDivElement | null)[]>([])
  const passes = React.useRef(0)
  const uses = React.useRef(INTRO_LINES.map(() => 0))
  const handing = React.useRef(INTRO_LINES.map(() => 0))
  React.useEffect(() => () => handing.current.forEach((raf) => window.cancelAnimationFrame(raf)), [])
  return React.useMemo(
    () => ({
      layers,
      /** The colour the next pass will play in. `atOnce` hands every cell out now rather than just ahead of its turn. */
      next: () => INTRO_LINES[passes.current % INTRO_LINES.length]!,
      play(plan: RipplePlan, late = 0, atOnce = false) {
        const layer = passes.current % INTRO_LINES.length
        passes.current++
        const name = `grid-intro-lit-${uses.current[layer]! % 2 ? "b" : "a"}`
        uses.current[layer]!++
        window.cancelAnimationFrame(handing.current[layer]!)
        const cells = layers.current[layer]?.children
        if (!cells) return
        // The pass's zero, and the cells handed out so far. Each cell gets its fade LINES_LOOKAHEAD_MS before it is
        // due, with the delay that is left then — negative if the frame came late, so it starts part-way and the
        // front stays where the clock says.
        const zero = performance.now() - late
        let next = 0
        const hand = () => {
          const now = performance.now() - zero
          while (next < plan.order.length && (atOnce || plan.delays[plan.order[next]!]! <= now + LINES_LOOKAHEAD_MS)) {
            const i = plan.order[next++]!
            const cell = cells[i] as HTMLElement | undefined
            if (!cell) continue
            cell.style.animationName = name
            cell.style.animationDelay = `${plan.delays[i]! + INTRO_FADE_HOLD_MS - now}ms`
          }
          if (next < plan.order.length) handing.current[layer] = window.requestAnimationFrame(hand)
        }
        hand()
      },
    }),
    [],
  )
}
type GridLines = ReturnType<typeof useGridLines>

/**
 * The intro's clock — and it is not a frame loop. It ran as one at first, a writer per frame setting every lit
 * line's opacity, and it lagged (his report, 2026-09-24): each write repainted the two glowing layers, and a glow is
 * a blur, so every frame re-rasterised two field-sized blurs at the screen's density — two seconds of raster work in a
 * 1.2-second intro, on the main thread's busiest second, the page's own load. So every cell is now a CSS animation,
 * scheduled once per pass with its own delay: a tile's lift and a line's fade are opacity, which the compositor runs
 * on its own thread, so nothing repaints per frame and a busy main thread cannot stall them. What is left here is a
 * timer per pass: when a pass ends, the page is either ready — page 1 turns in — or the next pass is played.
 */
function useGridIntro(enabled: boolean, metrics: GridMetrics | null, rootRef: React.RefObject<HTMLDivElement | null>, lines: GridLines) {
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
      startedAt.current = performance.now()
      introPlayed = true
      // The first pass, in this frame and all at once: the cover's tiles were given the same delays by the render that
      // mounted them, and the lines keep time with them on the compositor. Handed out a few frames ahead instead, as
      // later passes are, the lines would wait on the main thread in the page's load, its busiest second, and start
      // part-faded behind the tiles; the frame this costs is the mounting one, under the cover, before anything moves.
      lines.play(plan, 0, true)
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
      // Another pass, lines only, in the other colour — started part-way if this timer fired late, so the front stays
      // where the clock says it is.
      passStart = passEnd + INTRO_GAP_MS
      lines.play(plan, performance.now() - t0 - passStart)
      after(passStart + plan.span, endOfPass)
    }
    after(plan.span, endOfPass)
    return () => window.clearTimeout(timer)
  }, [on, enabled, metrics, plan, rootRef, lines])

  return { phase, on, plan }
}

/**
 * The ripple between pages (D32): when the page on the field changes, one pass of the intro's drawing runs through
 * the field, lines only — up from the bottom when the turn is forward, as the next page's boxes arrive from their
 * bottom edge, and down from the top when it is back. It starts at the change, as the new page comes in, not while
 * the hand is still scrolling, because a scroll let go short of the turn settles back and turns nothing.
 */
function useGridRipple(
  enabled: boolean,
  metrics: GridMetrics | null,
  page: number | undefined,
  lines: GridLines,
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
    // One frame after the change, not in it: the frame the page changes is the frame its boxes mount, and restarting
    // every cell's animation in that frame too was the frame that dropped (measured 2026-09-25). A frame's delay
    // cannot be seen at the front's pace.
    const plan = page > was ? plans.forward : plans.back
    const raf = window.requestAnimationFrame(() => {
      lines.play(plan)
      if (rootRef.current) rootRef.current.dataset.rippleNext = lines.next()
    })
    return () => window.cancelAnimationFrame(raf)
  }, [page, plans, lines, rootRef])
  // Which colour the next pass will be, on the grid, for the pager's arrows to fill in (grid-pager.tsx): the arrow a
  // turn fills is the colour of the ripple that turn plays. Only while the ripple is on and can play; otherwise the
  // arrows keep their own fill.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (plans && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) root.dataset.rippleNext = lines.next()
    else delete root.dataset.rippleNext
  }, [plans, lines, rootRef])
}

/**
 * The numbers as CSS, set once on the grid while the lines are mounted; globals.css times the animations with them.
 */
function rippleStyle(on: boolean): React.CSSProperties | undefined {
  if (!on) return undefined
  return {
    "--grid-intro-fade": `${INTRO_FADE_MS}ms`,
    "--grid-intro-reveal": `${INTRO_REVEAL_MS}ms`,
    "--grid-intro-hold": `${INTRO_FADE_HOLD_MS}ms`,
  } as React.CSSProperties
}

/**
 * The empty screen the drawing starts from: the visitor's own background on light, black on dark
 * (`--grid-intro-from`, globals.css). Before the field is measured — the server's render included — it is one sheet;
 * after, one tile per cell, each the cell and half the gutter round it and the outer ones running to the box's edge,
 * so the tiles cover the box exactly and a tile's going reveals its cell and its share of the gutter together. Each
 * tile lifts at its cell's time by a CSS animation (globals.css) whose delay is set here, at mount — the frame the
 * intro starts. Neighbours overlap by a pixel so no seam shows between two that are still up.
 */
const GridIntroCover = React.memo(function GridIntroCover({ metrics, plan }: { metrics: GridMetrics | null; plan: RipplePlan | null }) {
  const base = "pointer-events-none absolute inset-0 z-30 motion-reduce:hidden"
  if (!metrics || !plan) return <div data-slot="grid-intro-cover" aria-hidden className={base} style={{ background: "var(--grid-intro-from)" }} />
  const { cols, rows, cell, gap, boxW, boxH, gridW, gridH } = metrics
  const gx = (boxW - gridW) / 2
  const gy = (boxH - gridH) / 2
  const span = (i: number, n: number, origin: number, end: number) => {
    const at = origin + i * (cell + gap)
    const from = i === 0 ? 0 : at - gap / 2 - 0.5
    const to = i === n - 1 ? end : at + cell + gap / 2 + 0.5
    return [from, to - from] as const
  }
  const tiles: React.ReactNode[] = []
  for (let r = 0; r < rows; r++) {
    const [top, height] = span(r, rows, gy, boxH)
    for (let c = 0; c < cols; c++) {
      const [left, width] = span(c, cols, gx, boxW)
      const i = r * cols + c
      tiles.push(<div key={i} className="absolute" style={{ left, top, width, height, animationDelay: `${plan.delays[i]}ms` }} />)
    }
  }
  return (
    <div data-slot="grid-intro-cover" data-measured="" aria-hidden className={base}>
      {tiles}
    </div>
  )
})

/**
 * The lit lines: the overlay's own cells and dashes again, in lime and in violet, each cell glowing in its layer's
 * colour (globals.css) — for the intro (D31) and for the ripple between pages (D32). Drawing the same cells with the
 * same border means a line fading back is only a change of colour over the overlay beneath it, never a second dash
 * pattern. The glow is a blur, kept on his word as the one exception to the no-glass rule of 2026-09-16: on a line,
 * while it is lit. Every cell rests at opacity 0 and each pass is played on it by `useGridLines`. The glow is on each
 * cell, not on the layer: on the layer it was one field-sized blur the compositor redid every frame over the fading
 * cells; on a cell it is painted once into the cell's own layer, and a frame only changes an opacity.
 */
const GridRippleLines = React.memo(function GridRippleLines({
  cols,
  rows,
  cell,
  gap,
  layers,
}: {
  cols: number
  rows: number
  cell: number
  gap: number
  layers: React.RefObject<(HTMLDivElement | null)[]>
}) {
  const cells = Array.from({ length: cols * rows })
  return (
    <>
      {INTRO_LINES.map((line, l) => (
        <div
          key={line}
          ref={(el) => {
            layers.current[l] = el
          }}
          data-slot="grid-intro-lines"
          data-line={line}
          aria-hidden
          className="pointer-events-none absolute inset-0 grid"
          style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridTemplateRows: `repeat(${rows}, ${cell}px)`, gap }}
        >
          {cells.map((_, i) => (
            // The outer box fades (its own layer while it animates); the inner is the dashed box and its glow, which
            // is painted into that layer once rather than blurred again every frame.
            <div key={i}>
              <div className="size-full border border-dashed" />
            </div>
          ))}
        </div>
      ))}
    </>
  )
})

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
