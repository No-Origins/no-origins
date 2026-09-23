import { BREAKPOINT_ORDER, GRID_SPACING, PAGER_CELLS, pagerWidth, type GridBreakpoint, type GridField } from "@no-origins/ui/components/grid"

/**
 * The layout model, as pure functions. Nothing here renders; grid-pages.tsx calls it.
 *
 * A LAYOUT is a set of PAGES, authored per breakpoint. A breakpoint with no authored pages of its own is DERIVED from
 * the nearest authored one — narrower first, else wider (Grid-v2.md D22, mobile-first) — by packing, page by page.
 *
 * Since v2 (D12) the counts are not the breakpoint's but the box's, so two boxes in the same breakpoint can have
 * different fields. Authored pages therefore carry the SHAPE — the cols × rows — they were written on, and when the
 * field on show has another shape the same packer runs on them, exactly as it does across breakpoints.
 */

// ── slots (Slots.md) ─────────────────────────────────────────────────────────────────────────────────────────

export type SlotFill = "transparent" | "background" | "muted" | "card"
export type SlotAlign = "start" | "center" | "end" | "stretch"
/** A slot's padding: a step of the grid's spacing scale, the gutter's own (Grid.md §3). */
export type SlotInset = (typeof GRID_SPACING)[number]

/** A slot's tokens (Slots.md S3): fill, padding, and the alignment of the component in it. No margin. */
export type SlotSpec = { fill?: SlotFill; inset?: SlotInset; alignX?: SlotAlign; alignY?: SlotAlign }

/** The component a slot holds: a registry kind and the props the inspector may have set (Slots.md S4). */
export type SlotComponent = { kind: string; props?: Record<string, unknown> }

/**
 * One placed box — a SLOT. Coordinates are 1-based and describe the field of the breakpoint the page belongs to.
 * It holds a component, or sub-slots (`children`, a layout on the slot's own cells — Slots.md S2, S5), or nothing.
 */
export type GridLayoutItem = {
  id: string
  col: number
  row: number
  colSpan: number
  rowSpan: number
  label?: string
  slot?: SlotSpec
  component?: SlotComponent
  children?: GridLayout
}

export type GridRect = Pick<GridLayoutItem, "col" | "row" | "colSpan" | "rowSpan">

export type GridPage = { id: string; items: GridLayoutItem[] }

/** A field's counts — the only thing a set of coordinates depends on. */
export type GridShape = { cols: number; rows: number }

export type GridLayout = {
  authored: Partial<Record<GridBreakpoint, GridPage[]>>
  /**
   * The shape each authored breakpoint's pages were written on. Absent for a layout saved before 2026-09-21, which
   * was written on v1's fixed counts (LEGACY_SHAPES).
   */
  shapes?: Partial<Record<GridBreakpoint, GridShape>>
  /**
   * What the pager's bar holds, on its own cells — a layout like any other (Grid.md D29, 2026-09-23). ONE BAR PER
   * LAYOUT, not per page: the bar is drawn on every page, so contents that changed between pages would move the
   * arrows under the reader's hand mid-turn. Absent for D27's bar — empty `card` cells, then the arrows.
   */
  bar?: GridLayout
}

/** v1's `DEFAULT_GRID_CONFIG` counts, so a layout saved before v2 still knows the field it was authored on. */
export const LEGACY_SHAPES: Record<GridBreakpoint, GridShape> = {
  base: { cols: 4, rows: 8 },
  sm: { cols: 6, rows: 8 },
  md: { cols: 8, rows: 7 },
  lg: { cols: 12, rows: 6 },
  xl: { cols: 12, rows: 6 },
}

/** The shape a breakpoint's authored pages were written on. */
export function authoredShape(layout: GridLayout, bp: GridBreakpoint): GridShape {
  return layout.shapes?.[bp] ?? LEGACY_SHAPES[bp]
}

export type ResolvedPages = {
  pages: GridPage[]
  /** The breakpoint whose authored pages these are, or were derived from. */
  source: GridBreakpoint
  /** The shape the source pages were authored on. Equal to the field's when `authored` is true. */
  sourceShape: GridShape
  /** True when the pages are the breakpoint's own, on the field they were written on; false when they were derived. */
  authored: boolean
  /** How a derived page got here: `same` shape, `centred` as authored on a field it fits (D25), or `packed`. */
  mode: "same" | "centred" | "packed"
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

// ── rectangles ───────────────────────────────────────────────────────────────────────────────────────────────

/** Two boxes share at least one cell. */
export function rectsOverlap(a: GridRect, b: GridRect) {
  return (
    a.col < b.col + b.colSpan &&
    b.col < a.col + a.colSpan &&
    a.row < b.row + b.rowSpan &&
    b.row < a.row + a.rowSpan
  )
}

/** In bounds, at least one cell, and touching neither another box nor a reserved cell. */
export function rectIsValid(
  rect: GridRect,
  others: readonly GridRect[],
  cols: number,
  rows: number,
  reserved: readonly GridRect[] = [],
) {
  if (rect.colSpan < 1 || rect.rowSpan < 1) return false
  if (rect.col < 1 || rect.row < 1) return false
  if (rect.col + rect.colSpan - 1 > cols) return false
  if (rect.row + rect.rowSpan - 1 > rows) return false
  if (others.some((other) => rectsOverlap(rect, other))) return false
  return !reserved.some((cell) => rectsOverlap(rect, cell))
}

/** The first free box of this size, scanning row by row. Null when nothing that size fits anywhere. */
export function findFreeRect(
  placed: readonly GridRect[],
  cols: number,
  rows: number,
  colSpan: number,
  rowSpan: number,
  reserved: readonly GridRect[] = [],
): GridRect | null {
  const w = clamp(colSpan, 1, cols)
  const h = clamp(rowSpan, 1, rows)
  for (let row = 1; row <= rows - h + 1; row++) {
    for (let col = 1; col <= cols - w + 1; col++) {
      const candidate = { col, row, colSpan: w, rowSpan: h }
      if (rectIsValid(candidate, placed, cols, rows, reserved)) return candidate
    }
  }
  return null
}

/** Top-left first, the way the eye reads the field. */
export function readingOrder<T extends GridRect>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.row - b.row || a.col - b.col)
}

// ── the pager ────────────────────────────────────────────────────────────────────────────────────────────────

export { PAGER_CELLS }

/**
 * How wide the bar is for a call that has a field's number, a plain `true` for the default, or `false` for none
 * (a slot's children, Slots.md S5). Everything below takes the union so a caller with metrics passes `field.pager`
 * and a caller without passes nothing.
 */
export type PagerWidth = number | boolean
const widthOf = (pager: PagerWidth | undefined, cols: number): number => {
  if (pager === false) return 0
  const width = pager === true || pager === undefined ? PAGER_CELLS : pager
  // A field with no room reports 0 (grid.tsx); asking for 0 is asking for no bar, not for the minimum of two.
  return width <= 0 ? 0 : pagerWidth(width, cols)
}

/**
 * The cells the pager occupies on a page — the same on every page (Grid.md D27, 2026-09-21): one row of 1×1 cells at
 * the bottom centre of the field, by default four then the ↑ and ↓ that turn it. Since D29 (2026-09-23) the width is
 * the breakpoint's, carried on the field as `pager`; it is even so the bar is centred on a grid line, and a field too
 * narrow gets as many cells as it has. Nothing may be placed here, on any page, and the packer never puts anything
 * here. (D23 had taken the corner buttons off and left this returning nothing; the pager came back as a fixture on
 * the bottom row.)
 */
export function pagerCells(_pageIndex: number, _pageCount: number, cols: number, rows: number, pager: PagerWidth = true): GridRect[] {
  const n = widthOf(pager, cols)
  if (n < 1 || rows < 1) return []
  return [{ col: Math.floor((cols - n) / 2) + 1, row: rows, colSpan: n, rowSpan: 1 }]
}

// ── packing ──────────────────────────────────────────────────────────────────────────────────────────────────

/** Place items in the given order onto one field. Returns what fit and what did not. */
function packOnce(queue: readonly GridLayoutItem[], cols: number, rows: number, reserved: readonly GridRect[]) {
  const placed: GridLayoutItem[] = []
  const rest: GridLayoutItem[] = []
  for (const item of queue) {
    const rect = findFreeRect(placed, cols, rows, item.colSpan, item.rowSpan, reserved)
    if (rect) placed.push({ ...item, ...rect })
    else rest.push(item)
  }
  return { placed, rest }
}

/**
 * Pack one source page's items onto as many target pages as they need, starting at `firstIndex`. Every page but
 * the last assumes a › in its corner; the caller trims the true last page afterwards.
 */
/**
 * How pages are derived. `pager: false` inside a slot (Slots.md S5): one page, no bar cells reserved. A number is the
 * bar's width in cells (D29) — `resolvePages` passes the field's.
 */
export type DeriveOptions = { pager?: PagerWidth }

/** The block a page uses: the bounding box of its boxes. Null for an empty page. */
export function usedBlock(items: readonly GridRect[]): GridRect | null {
  if (!items.length) return null
  const col = Math.min(...items.map((i) => i.col))
  const row = Math.min(...items.map((i) => i.row))
  const right = Math.max(...items.map((i) => i.col + i.colSpan))
  const bottom = Math.max(...items.map((i) => i.row + i.rowSpan))
  return { col, row, colSpan: right - col, rowSpan: bottom - row }
}

/**
 * A page kept as authored and centred on a field it fits (Grid.md D25), or null when it does not fit. The block's
 * remainder is split like margin (D14), floored, so an odd difference leans to the top-left.
 */
export function centredOnField(items: readonly GridLayoutItem[], cols: number, rows: number, pager: PagerWidth = true): GridLayoutItem[] | null {
  const block = usedBlock(items)
  if (!block) return []
  // The pager's row is the pager's (D27): a kept page is centred in the room above it, so it never lands on the ↑ ↓.
  // The bar is one row however wide it is (D29), so only whether there IS one matters here.
  const room = widthOf(pager, cols) > 0 ? Math.max(1, rows - 1) : rows
  if (block.colSpan > cols || block.rowSpan > room) return null
  const dc = Math.floor((cols - block.colSpan) / 2) - (block.col - 1)
  const dr = Math.floor((room - block.rowSpan) / 2) - (block.row - 1)
  return items.map((item) => ({ ...item, col: item.col + dc, row: item.row + dr }))
}

function packSourcePage(
  items: readonly GridLayoutItem[],
  cols: number,
  rows: number,
  firstIndex: number,
  sourceId: string,
  pager: PagerWidth = true,
): GridPage[] {
  let queue = readingOrder(items).map((item) => ({
    ...item,
    colSpan: clamp(item.colSpan, 1, cols),
    rowSpan: clamp(item.rowSpan, 1, rows),
  }))
  const out: GridPage[] = []

  while (queue.length) {
    const index = firstIndex + out.length
    // Assume there is a page after this one; the last page is re-packed without that corner once it is known. Inside
    // a slot there is no pager, so nothing is reserved — the reserved corner was making a slot's last child vanish
    // onto a page a slot never shows (his report, 2026-09-21).
    const reserved = pagerCells(index, Number.MAX_SAFE_INTEGER, cols, rows, pager)
    let { placed, rest } = packOnce(queue, cols, rows, reserved)

    if (!placed.length) {
      // Nothing fit — the first item is as big as the field and the pager cell is in its way. Shrink its longer
      // side by one cell and try again; a box always makes progress, it never stalls the derivation.
      const first = { ...queue[0]! }
      if (first.colSpan >= first.rowSpan && first.colSpan > 1) first.colSpan -= 1
      else if (first.rowSpan > 1) first.rowSpan -= 1
      else break
      queue = [first, ...queue.slice(1)]
      continue
    }

    out.push({ id: `${sourceId}${out.length ? `-${out.length + 1}` : ""}`, items: placed })
    queue = rest
  }
  return out
}

/**
 * Derive pages for a target field from pages authored on a wider one.
 *
 * An authored page break is a HARD break — page 2 of the source always starts a new page of the target — because
 * it says two groups of boxes belong apart. Overflow within a source page adds pages after it.
 */
export function derivePages(sourcePages: readonly GridPage[], cols: number, rows: number, options: DeriveOptions = {}): GridPage[] {
  const pager = options.pager ?? true
  const out: GridPage[] = []
  for (const page of sourcePages) {
    // A page that fits is kept as authored and centred (D25); only a page that does not fit is packed.
    const kept = centredOnField(page.items, cols, rows, pager)
    if (kept) out.push({ id: page.id, items: kept })
    else out.push(...packSourcePage(page.items, cols, rows, out.length, page.id, pager))
  }
  // (Until D23 the true last page was re-packed here without its › corner. There is no corner now, and re-packing
  // undid D25's centring of a kept page.)
  return out.length ? out : [{ id: "page-1", items: [] }]
}

// ── resolution ───────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The nearest authored breakpoint to derive from: the closest NARROWER one, else the closest wider (Grid.md D22,
 * 2026-09-21). Mobile-first: a layout made on a small field adapts upward into more room, which never spills onto
 * extra pages; packing a wide layout down is the lossy direction, and is only taken when nothing narrower exists.
 * (It was widest-first before — v1 D6 — and he asked for the reverse: "whenever a design is done at a lower
 * breakpoint, that should be adapted automatically to higher breakpoints.")
 */
function nearestAuthored(layout: GridLayout, bp: GridBreakpoint): GridBreakpoint | null {
  const at = BREAKPOINT_ORDER.indexOf(bp)
  for (let i = at - 1; i >= 0; i--) {
    if (layout.authored[BREAKPOINT_ORDER[i]!]) return BREAKPOINT_ORDER[i]!
  }
  for (let i = at + 1; i < BREAKPOINT_ORDER.length; i++) {
    if (layout.authored[BREAKPOINT_ORDER[i]!]) return BREAKPOINT_ORDER[i]!
  }
  return null
}

const clonePages = (pages: readonly GridPage[]): GridPage[] =>
  pages.map((page) => ({ ...page, items: page.items.map((item) => ({ ...item })) }))

/**
 * The pages to show on a field.
 *
 * A breakpoint's own authored pages win outright when the field is the shape they were written on. Otherwise the
 * nearest authored breakpoint — itself, when it has pages of another shape — supplies them, and they are packed
 * into the field's shape unless the two happen to match. Coordinates only mean something on the shape that produced
 * them, so a same-breakpoint pack is not a special case: a 1440px desktop and a 1300px one are both `lg` and get
 * different fields (D12), and the second is packed from the first like any derivation.
 */
export function resolvePages(layout: GridLayout, field: GridField, options: DeriveOptions = {}): ResolvedPages {
  const { bp, cols, rows } = field
  // The bar's width is the field's (D29) unless the caller switches it off — which is what a slot's children do (S5).
  const pager: PagerWidth = options.pager ?? field.pager
  const source = layout.authored[bp] ? bp : nearestAuthored(layout, bp)
  if (!source) {
    return { pages: [{ id: "page-1", items: [] }], source: bp, sourceShape: { cols, rows }, authored: false, mode: "same" }
  }

  const sourcePages = layout.authored[source]!
  const sourceShape = authoredShape(layout, source)
  const sameShape = sourceShape.cols === cols && sourceShape.rows === rows
  if (sameShape) return { pages: clonePages(sourcePages), source, sourceShape, authored: source === bp, mode: "same" }
  const pages = derivePages(sourcePages, cols, rows, { ...options, pager })
  const centred = sourcePages.every((page) => centredOnField(page.items, cols, rows, pager) !== null)
  return { pages, source, sourceShape, authored: false, mode: centred ? "centred" : "packed" }
}

/**
 * A slot's sub-slots on the slot's own cells at a field's breakpoint (Slots.md S2, S5): one page, no pager, the
 * parent's cell and gutter. What `SlotContent` draws.
 */
export function resolveSubSlots(
  children: GridLayout | undefined,
  parent: Pick<GridLayoutItem, "colSpan" | "rowSpan">,
  field: Pick<GridField, "bp" | "cell" | "gap">,
): GridLayoutItem[] {
  if (!children) return []
  return resolvePages(
    children,
    { bp: field.bp, cell: field.cell, gap: field.gap, cols: parent.colSpan, rows: parent.rowSpan, pager: 0 },
    { pager: false },
  ).pages[0]?.items ?? []
}
