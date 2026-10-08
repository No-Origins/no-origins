"use client"

import * as React from "react"
import gsap from "gsap"
import { cn } from "cn"

import { useThemeFlipRegistry, type ThemeFlipper } from "@no-origins/ui/components/theme-provider"
import type { IntroActionId, IntroActions, IntroAgent } from "@no-origins/ui/lib/intro-motion"
import {
  FIELD_PAD,
  startFieldPainter,
  type FieldColours,
  type FieldPainter,
  type FieldRgba,
} from "@no-origins/ui/lib/grid-field"

/**
 * The intro's agents (D50), loaded only when a grid plays it: the agent's model is the biggest thing in the package, and
 * a page without an intro should not carry it.
 */
const GridIntro = React.lazy(() => import("@no-origins/ui/components/grid-intro").then((m) => ({ default: m.GridIntro })))

/**
 * The base layout (Grid.md).
 *
 * One square cell is the unit, and THE CELL IS DECIDED: a breakpoint is two numbers, `cell · gap` (D13, D15). The
 * counts are not decided by anyone — a field is as many whole cells as fit across and down the box it is given
 * (D12), so the grid never scrolls and never overflows. What is left over is centred margin (D14), and the box's
 * own padding is one gutter, so the edge of the screen is one more grid line (D15). When a layout holds more than the
 * field can, the surplus goes to another PAGE (grid-pages.tsx) — never off the edge.
 *
 * The grid is always its box: the viewport. There is no `fill`, because nothing ever holds a grid as a block in a
 * page, and no `pad`, because the pad IS the gutter.
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
 * Each breakpoint's reference box (Grid.md D11). A breakpoint is a RANGE, so these are starting points, not the only
 * sizes a page meets: every width in between is a different field (D12). A page that has to lay itself out before the
 * grid has measured its box assumes one of these.
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
 * lives here rather than in the model because the width is a config decision like `cell · gap`, checked against
 * Grid.md §5's principles and recorded in D29. The model imports it from here, as it already imports
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
   * by width on a config with no `xl` row reports `lg`. It keys the cell (D13) and, while authoring is open (Grid.md
   * §7), the layout's authored pages. It does NOT decide the counts: the box does.
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
 * The fewest columns a field has (Grid.md D33): six. Where the decided cell would give fewer, the count is held at
 * six and the cell derives from the width instead — as big as six cells and seven gutters allow, floored, so the
 * field still sits a whole gutter from each edge — and the rows are counted with that cell. The gutter never changes
 * (D13: one texture). Below MIN_CELL the cell stops giving way, so a sliver of a box keeps whatever count fits.
 */
export const MIN_COLS = 6
const MIN_CELL = 24

/**
 * The field a box of this size gets (D12). Width picks the breakpoint, the breakpoint supplies the cell and gap
 * (D13), and both axes are then simply how many cells fit — except that a field is never fewer than MIN_COLS across
 * (D33), where the cell derives from the width instead. A phone on its side gets more columns than rows, with no rule
 * for it. There is no way to name a breakpoint outright: the box decides (D11).
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
   * Open the page with its agents (Grid.md D50): `introAgents` stand side by side in a row on the field's middle, in a random order, and those that `bounces` Bounce, each at its own random times, for two seconds;
   * then each Jumps or Dives, at random, to the centre of the boxes it opens, a small ripple of lit cells spreading round
   * it as it lands; then each Dives home, to its cell of the middle ones in the field's last column, and the boxes it
   * opens fade in once it is gone (Motion.md M22). Each box names the agents that open it (`data-intro-by`, their ids). The
   * intro plays once per document load, by the grid that asks for it, and never under reduced motion; the agents stay in
   * their cells, resting, after it or without it — still, under reduced motion.
   */
  intro?: boolean
  /** The intro's cast, in its order (`IntroAgent`: an id the boxes name, and a look). None, one agent as the tokens make it. */
  introAgents?: readonly IntroAgent[]
  /** How the cast bounces, jumps and dives: each action's values as he published them (M24). One left out, its defaults. */
  introActions?: IntroActions
  /**
   * The agent in focus, by its id (D50): the page's boxes are its section alone, and it is under them. The intro ends with it diving into its section's centre and the rest at home; a new one turns the page — the
   * section fades away as its agent comes home, `onIntroFocus` asks for the next section, and its agent dives out of its
   * cell, into the centre of those boxes, and they fade in. While a page turns the grid carries `data-intro-turn`. None:
   * every agent opens its own boxes and they all go home.
   */
  introFocus?: string
  /** The field is clear for `introFocus`'s section: put its boxes on the field now. */
  onIntroFocus?: (agent: string) => void
  /**
   * Where the agent in focus stands, a cell placed as a box is, 1-based (D50). None, the cell below its section, at its
   * centre.
   */
  introFocusAt?: { col: number; row: number }
  /**
   * An action for an agent to play where it rests, played each time `key` changes (D50): once the intro is over, when no
   * page is turning and the agent is not in the air.
   */
  introAct?: { agent: string; action: IntroActionId; key: number }
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
  introAgents,
  introActions,
  introFocus,
  onIntroFocus,
  introFocusAt,
  introAct,
  cursor: cursorProp = false,
  onMetrics,
  className,
  style,
  ref: refProp,
  ...props
}: GridProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  // The root as state as well, for what renders with it (the intro's agent, D50).
  const [root, setRoot] = React.useState<HTMLDivElement | null>(null)
  // The box measures itself through `ref`; a host's own ref (grid-pages.tsx writes the turn's progress here) is set
  // alongside it, not instead of it — spread after `ref={ref}` it once replaced it, and the field was never measured.
  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node
      setRoot(node)
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

  // The field's paint (D38) — the overlay's dashes, the pointer's cell and the intro's ripples, on canvases one painter
  // draws — first, so its effects have run before the cursor asks anything of it.
  const { field, on: painted } = useGridField(overlay || cursorProp || introProp, metrics, ref, overlay)
  const intro = useGridIntro(introProp, metrics)
  const cursor = useGridCursor(cursorProp, metrics, ref, field)

  // The box's padding is the gutter (D15) — before the field is measured it is the breakpoint's gap by width alone,
  // which is what it will be once measured too. Whatever the count leaves over is centred by the flex box (D14).
  const gap = metrics?.gap ?? specFor(config, breakpointFor(box?.w ?? 0)).gap

  return (
    <div
      ref={setRef}
      data-slot="grid"
      data-breakpoint={metrics?.bp}
      // While the intro runs (D50): "agent" as the agents play, the page's boxes held back by globals.css but for the
      // ones they open; "reveal" as the grid lets go of them.
      data-intro={intro.phase ?? undefined}
      // The ring is the pointer (D34): globals.css draws the system's cursor as the violet ring (D43) over the whole grid.
      data-cursor={cursor.on ? "" : undefined}
      // The grid is always its box: the screen. A className may give it another height when there is chrome above
      // (`h-[calc(100dvh-3.5rem)]`), never a width.
      className={cn("relative flex items-center justify-center h-dvh w-full", className)}
      // The cell, for the system's one radius (D39, globals.css): half of it is every corner on the grid. Before the
      // box is measured the stylesheet's own reckoning of it from the viewport stands in.
      style={{ padding: `${gap}px`, ...(metrics ? { "--grid-cell": `${metrics.cell}px` } : null), ...intro.style, ...style } as React.CSSProperties}
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
            {/* The intro's agents (D50): over the page's boxes, on the field, as it plays, and resting in their cells
                at home once it is over. */}
            {(intro.phase || intro.settled) && root ? (
              <React.Suspense fallback={null}>
                <GridIntro
                  metrics={metrics}
                  root={root}
                  agents={introAgents}
                  actions={introActions}
                  settled={intro.settled}
                  focus={introFocus}
                  onFocus={onIntroFocus}
                  focusAt={introFocusAt ? { col: introFocusAt.col - 1, row: introFocusAt.row - 1 } : undefined}
                  act={introAct}
                  pass={field.pass}
                  onReveal={intro.reveal}
                  onDone={intro.done}
                />
              </React.Suspense>
            ) : null}
          </div>
          {/* The theme's flip (D28) — the outermost grid on the page takes the switch. */}
          <GridThemeFlip />
        </GridContext.Provider>
      ) : null}
    </div>
  )
}

// ── the field (Grid.md D38) ─────────────────────────────────────────────────────────────────────────────────────

/** How long a lit cell takes to fade back, in ms: the pointer's cell when the pointer leaves it (D34), and a ripple's. */
const LIT_FADE_MS = 500
/**
 * The field's painter still takes the lace (grid-field.ts, D40): the gap between a cell's disc and its tile in a
 * reveal. Nothing sends it a reveal, so it cuts nothing.
 */
const LACE_MS = 90

/**
 * The field's paint (Grid.md D38): the overlay's dashes, the pointer's cell and the intro's ripples (D50), on canvases
 * one painter draws (`lib/grid-field.ts`), in a worker wherever the browser can hand it a canvas. The grid tells the
 * painter the field, the theme's colours, the pointer's cell and the intro's passes; the painter keeps time itself.
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
      /**
       * Light the field's cells in one of the painter's colours (0 lime, 1 violet): each at `zero + delays[i]`, epoch
       * ms — Infinity, never — fading over LIT_FADE_MS as the pointer's does: the intro's ripples (D50), a few cells
       * round each agent's nest.
       */
      pass(delays: Float64Array, span: number, zero: number, layer: number) {
        painter.current?.post({ type: "pass", layer, delays, span, zero })
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
 * `--violet`) are the painter's two pass colours, the intro's ripples among them; the glow is 0, since nothing on the
 * field glows. A canvas takes any colour CSS can write, and a pixel of one turns each into plain RGBA to send.
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

// ── the intro (Grid.md D50) ────────────────────────────────────────────────────────────────────────────────────

/**
 * Once per document load (D50): a navigation that mounts another grid does not play it again; a reload
 * does. Set only in the browser, so the server's render always holds the page back.
 */
let introPlayed = false

type IntroPhase = "agent" | "reveal"

/**
 * The intro's state (D50): "agent" from the server's first render on — the page's boxes held back by globals.css, but
 * for the ones the agents are opening — while they play (`GridIntro`), then "reveal" as the grid lets go of the boxes
 * (at once: each came in as it opened), then over. Reduced motion, or a document that has played it, skips it before
 * the first measured frame paints. A new box mid-intro — a phone's bar sliding away, a window resized — hands straight
 * over rather than going on on a field it did not start on. Over or skipped, it is `settled`: the agents rest in their
 * cells on whatever field the grid has.
 */
function useGridIntro(enabled: boolean, metrics: GridMetrics | null) {
  // The same on the server and in the browser's first render, so hydration matches.
  const [phase, setPhase] = React.useState<IntroPhase | null>(() => (enabled && !introPlayed ? "agent" : null))
  const [revealMs, setRevealMs] = React.useState(0)
  const startedOn = React.useRef<GridMetrics | null>(null)

  React.useLayoutEffect(() => {
    if (!phase) return
    if (!enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      introPlayed = true
      setPhase(null)
      return
    }
    if (!metrics) return
    if (startedOn.current && startedOn.current !== metrics) {
      setPhase(null)
      return
    }
    startedOn.current = metrics
    introPlayed = true
  }, [phase, enabled, metrics])

  const reveal = React.useCallback((ms: number) => {
    setRevealMs(ms)
    setPhase((p) => (p ? "reveal" : p))
  }, [])
  const done = React.useCallback(() => setPhase(null), [])
  // How long the boxes take to come in, for globals.css.
  const style = phase === "reveal" ? ({ "--grid-intro-reveal": `${revealMs}ms` } as React.CSSProperties) : undefined
  // Over, or skipped: the agents rest in their cells.
  const settled = enabled && !phase
  return { phase, reveal, done, style, settled }
}

// ── the cursor (Grid.md D34) ─────────────────────────────────────────────────────────────────────────────────────

/**
 * The pointer is a ring with a violet line that fills while pressed, and the cell under it turns its own dashes violet
 * (D34, D43). A cell the pointer leaves fades back over LIT_FADE_MS; the one it is on is lit at once.
 *
 * The ring is the system's cursor, drawn from an image (globals.css), never a div moved on every pointer move: that
 * cost the main thread a whole-page layerize a move and trailed the hand by at least a frame. An image cursor is drawn
 * by the system, where the hand is, and costs the page nothing.
 */

/**
 * The pointer's cell, lit — sent straight to the field's painter from the pointer's events, never through React state:
 * a move costs a subtraction and a division, and one message when it crosses into another cell. It never touches the
 * page: the painter has the field's numbers, paints in a worker, and draws the cell's ring in violet, over the lines and
 * under the page's boxes (D38, D40). The cell is found from the field's numbers,
 * not by hit-testing, so it lights under a card as well (where the card hides it); the gutter between two cells lights
 * nothing, nor do the corners of a cell's square outside its circle (D40). Only where the device can hover with
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
      // A page may still the pointer's cell while `data-cursor-still` is on the grid: the motion studio's hyper focus
      // and focus mode (Motion.md M13, M14), whose blur over the field would smear a lit cell and be redrawn whole for
      // every frame of its fade. The ring is still the pointer.
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
 * how many crests it may have — two to five, of different sizes (D28) — and how it moves: it drifts one full width
 * sideways in `1 / WAVE_DRIFT` beats and breathes in height every `WAVE_BREATH` seconds.
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
 * The theme change as a SHEET OF PAINT falling down the field (Grid.md D28). One sheet, the size of the grid's box, in
 * the NEW theme's colours — the layer wears that theme's class, and globals.css puts the light tokens on `.light` as
 * well as `:root` for exactly this. The sheet is PLAIN paint, no cells drawn on it: the grid is what the paint reveals,
 * not what it carries. Its bottom edge is a sharp WAVE, two to five crests of different sizes, drawn afresh at every
 * toggle and moving as it falls; its top edge is the same wave turned over, for the moment it shows. ONE beat: the
 * sheet falls from above the box until it covers it, gathering speed the way a thing falls; the theme is committed
 * under the cover and the sheet DISSOLVES — it is the new page's own background, so its fade is the content coming
 * through. One element moves, on a transform and then opacity, so nothing lays out and nothing repaints.
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
    // fades away, so the new page comes through the paint. The sheet is the new page's own background, so the dissolve
    // is the content fading in.
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
