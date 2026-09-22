import { BREAKPOINT_ORDER, type GridBreakpoint, type GridConfig, type GridField } from "@no-origins/ui/components/grid"

/**
 * The layout model, as pure functions. Nothing here renders; grid-pages.tsx and grid-editor.tsx call it.
 *
 * A LAYOUT is a set of PAGES, authored per breakpoint. The widest authored breakpoint is the truth; a narrower
 * breakpoint with no authored pages of its own is DERIVED from the nearest wider one by packing, page by page. Hand-
 * editing a derived breakpoint writes its pages down and it stops deriving — until they are removed again. That is
 * v1's D6, still in force while authoring is deferred (Grid-v2.md §7).
 *
 * Since v2 (D12) the counts are not the breakpoint's but the box's, so two boxes in the same breakpoint can have
 * different fields. Authored pages therefore carry the SHAPE — the cols × rows — they were written on, and when the
 * field on show has another shape the same packer runs on them, exactly as it does across breakpoints.
 */

// ── slots (Slots.md) ─────────────────────────────────────────────────────────────────────────────────────────

export type SlotFill = "transparent" | "background" | "muted" | "card"
export type SlotAlign = "start" | "center" | "end" | "stretch"
export type SlotInset = 0 | 4 | 8 | 12 | 16

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

/** How many boxes sit on a cell another box already claims. Zero for any layout that fits. */
export function countOverlaps(items: readonly GridRect[]) {
  let n = 0
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (rectsOverlap(items[i]!, items[j]!)) n++
    }
  }
  return n
}

/** Top-left first, the way the eye reads the field. */
export function readingOrder<T extends GridRect>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.row - b.row || a.col - b.col)
}

// ── the pager ────────────────────────────────────────────────────────────────────────────────────────────────

/** The pager's width in cells (Grid.md D27): four empty, then ↑ and ↓. On a field narrower than that it is the field. */
export const PAGER_CELLS = 6

/**
 * The cells the pager occupies on a page — the same on every page (Grid.md D27, 2026-09-21): one row of `PAGER_CELLS`
 * 1×1 cells at the bottom centre of the field, the last two the ↑ and ↓ that turn it. Counts are even (D26) and so is
 * the pager, so it is centred on a grid line; a field too narrow for six gets as many as it has. Nothing may be placed
 * here, on any page, and the packer never puts anything here. (D23 had taken the corner buttons off and left this
 * returning nothing; the pager came back as a fixture on the bottom row.)
 */
export function pagerCells(_pageIndex: number, _pageCount: number, cols: number, rows: number): GridRect[] {
  const n = Math.min(PAGER_CELLS, cols)
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
 * How pages are derived. `pager: false` inside a slot (Slots.md S5): one page, no corner cells reserved. `keep:
 * false` forces packing even when a page would fit — for a page that has no arrangement yet (`layoutFromSpans`).
 */
export type DeriveOptions = { pager?: boolean; keep?: boolean }

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
export function centredOnField(items: readonly GridLayoutItem[], cols: number, rows: number, pager = true): GridLayoutItem[] | null {
  const block = usedBlock(items)
  if (!block) return []
  // The pager's row is the pager's (D27): a kept page is centred in the room above it, so it never lands on the ↑ ↓.
  const room = pager ? Math.max(1, rows - 1) : rows
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
  pager = true,
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
    const reserved = pager ? pagerCells(index, Number.MAX_SAFE_INTEGER, cols, rows) : []
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
  const keep = options.keep ?? true
  const out: GridPage[] = []
  for (const page of sourcePages) {
    // A page that fits is kept as authored and centred (D25); only a page that does not fit is packed.
    const kept = keep ? centredOnField(page.items, cols, rows, pager) : null
    if (kept) out.push({ id: page.id, items: kept })
    else out.push(...packSourcePage(page.items, cols, rows, out.length, page.id, pager))
  }
  // (Until D23 the true last page was re-packed here without its › corner. There is no corner now, and re-packing
  // undid D25's centring of a kept page.)
  return out.length ? out : [{ id: "page-1", items: [] }]
}

/** What a box wants to be, before it has a place: an id, a size in cells, and what it is. */
export type GridSpan = Omit<GridLayoutItem, "col" | "row">

/**
 * A layout from a list of sizes, in reading order, packed onto one shape and authored there.
 *
 * For a page whose boxes have sizes but no positions worth deciding by hand — the showcase's specimens, a list of
 * cards — this is the whole authoring step: the packer places them first-fit in the order given, spilling onto more
 * pages as it goes, and every other field derives from the result (v1 D6, still in force). The shape should be a
 * real one — the widest reference box's field, minus whatever chrome sits above the grid — so the source is a field
 * someone could see.
 */
export function layoutFromSpans(spans: readonly GridSpan[], shape: GridShape, bp: GridBreakpoint = "xl"): GridLayout {
  // One source page holding every box in order; derivePages does the placing and the paging. Only the layout's own
  // fields travel: a caller's richer objects (a render function, say) must not end up in an export.
  const queue: GridLayoutItem[] = spans.map(({ id, colSpan, rowSpan, label, slot, component, children }, i) => ({
    id,
    colSpan,
    rowSpan,
    ...(label !== undefined && { label }),
    ...(slot !== undefined && { slot }),
    ...(component !== undefined && { component }),
    ...(children !== undefined && { children }),
    col: 1,
    row: i + 1,
  }))
  const pages = derivePages([{ id: "page-1", items: queue }], shape.cols, shape.rows, { keep: false })
  return { shapes: { [bp]: { cols: shape.cols, rows: shape.rows } }, authored: { [bp]: pages } }
}

// ── resolution ───────────────────────────────────────────────────────────────────────────────────────────────

/** The widest breakpoint with authored pages. Null for an empty layout. */
export function widestAuthored(layout: GridLayout): GridBreakpoint | null {
  for (let i = BREAKPOINT_ORDER.length - 1; i >= 0; i--) {
    const bp = BREAKPOINT_ORDER[i]!
    if (layout.authored[bp]) return bp
  }
  return null
}

/** The narrowest breakpoint with authored pages — the layout's source of truth since D22 (mobile-first). */
export function narrowestAuthored(layout: GridLayout): GridBreakpoint | null {
  for (const bp of BREAKPOINT_ORDER) if (layout.authored[bp]) return bp
  return null
}

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
  const source = layout.authored[bp] ? bp : nearestAuthored(layout, bp)
  if (!source) {
    return { pages: [{ id: "page-1", items: [] }], source: bp, sourceShape: { cols, rows }, authored: false, mode: "same" }
  }

  const sourcePages = layout.authored[source]!
  const sourceShape = authoredShape(layout, source)
  const sameShape = sourceShape.cols === cols && sourceShape.rows === rows
  if (sameShape) return { pages: clonePages(sourcePages), source, sourceShape, authored: source === bp, mode: "same" }
  const pages = derivePages(sourcePages, cols, rows, options)
  const centred = (options.keep ?? true) && sourcePages.every((page) => centredOnField(page.items, cols, rows, options.pager ?? true) !== null)
  return { pages, source, sourceShape, authored: false, mode: centred ? "centred" : "packed" }
}

/**
 * A slot's sub-slots on the slot's own cells at a field's breakpoint (Slots.md S2, S5): one page, no pager, the
 * parent's cell and gutter. What `SlotContent` draws and what the composer edits when you enter a slot.
 */
export function resolveSubSlots(
  children: GridLayout | undefined,
  parent: Pick<GridLayoutItem, "colSpan" | "rowSpan">,
  field: Pick<GridField, "bp" | "cell" | "gap">,
): GridLayoutItem[] {
  if (!children) return []
  return resolvePages(children, { bp: field.bp, cell: field.cell, gap: field.gap, cols: parent.colSpan, rows: parent.rowSpan }, { pager: false }).pages[0]?.items ?? []
}

// ── editing ──────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Write pages for a breakpoint, on the shape they were written on. On a derived breakpoint this is what DETACHES
 * it; on an authored one whose pages were written on another shape, it replaces them — a breakpoint holds one set of
 * pages, on one shape, until authoring is redecided (Grid-v2.md §7).
 */
export function withAuthored(layout: GridLayout, bp: GridBreakpoint, pages: GridPage[], shape: GridShape): GridLayout {
  return {
    authored: { ...layout.authored, [bp]: pages },
    shapes: { ...layout.shapes, [bp]: { cols: shape.cols, rows: shape.rows } },
  }
}

/** Drop a breakpoint's own pages so it derives again. The last authored breakpoint cannot be dropped. */
export function withoutAuthored(layout: GridLayout, bp: GridBreakpoint): GridLayout {
  if (Object.keys(layout.authored).filter((key) => layout.authored[key as GridBreakpoint]).length <= 1) return layout
  const authored = { ...layout.authored }
  delete authored[bp]
  const shapes = { ...layout.shapes }
  delete shapes[bp]
  return { authored, shapes }
}

/**
 * Move any box that sits on a pager cell out of its way — to the first free cell of its size on the same page, else
 * onto the next page. Run after anything that changes the page count, because adding page 2 is what puts a › on
 * page 1's corner.
 */
export function evictFromPagerCells(pages: readonly GridPage[], cols: number, rows: number): GridPage[] {
  const out = clonePages(pages)
  for (let index = 0; index < out.length; index++) {
    const page = out[index]!
    const reserved = pagerCells(index, out.length, cols, rows)
    if (!reserved.length) continue

    const staying: GridLayoutItem[] = []
    const displaced: GridLayoutItem[] = []
    for (const item of page.items) {
      if (reserved.some((cell) => rectsOverlap(item, cell))) displaced.push(item)
      else staying.push(item)
    }
    if (!displaced.length) continue

    for (const item of displaced) {
      const rect = findFreeRect(staying, cols, rows, item.colSpan, item.rowSpan, reserved)
      if (rect) {
        staying.push({ ...item, ...rect })
      } else if (index + 1 < out.length) {
        out[index + 1] = { ...out[index + 1]!, items: [...out[index + 1]!.items, item] }
      } else {
        staying.push(item) // last page, nowhere to go: it stays and overlaps, and countOverlaps will say so
      }
    }
    out[index] = { ...page, items: staying }
  }
  return out
}

let pageSeq = 0
export const newPageId = () => `page-${Date.now().toString(36)}-${(pageSeq++).toString(36)}`

export function addPage(pages: readonly GridPage[], cols: number, rows: number): GridPage[] {
  return evictFromPagerCells([...pages, { id: newPageId(), items: [] }], cols, rows)
}

/** Remove a page and everything on it. A layout always keeps at least one page. */
export function removePage(pages: readonly GridPage[], index: number, cols: number, rows: number): GridPage[] {
  if (pages.length <= 1) return clonePages(pages)
  return evictFromPagerCells(
    pages.filter((_, i) => i !== index),
    cols,
    rows,
  )
}

/** Move one box to another page, at the first free cell of its size. Null when that page has no room for it. */
export function moveItemToPage(
  pages: readonly GridPage[],
  itemId: string,
  from: number,
  to: number,
  cols: number,
  rows: number,
): GridPage[] | null {
  if (to < 0 || to >= pages.length || from === to) return null
  const item = pages[from]?.items.find((candidate) => candidate.id === itemId)
  if (!item) return null
  const target = pages[to]!
  const rect = findFreeRect(target.items, cols, rows, item.colSpan, item.rowSpan, pagerCells(to, pages.length, cols, rows))
  if (!rect) return null
  return pages.map((page, i) => {
    if (i === from) return { ...page, items: page.items.filter((candidate) => candidate.id !== itemId) }
    if (i === to) return { ...page, items: [...page.items, { ...item, ...rect }] }
    return page
  })
}

// ── export ───────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The layout as code — every authored breakpoint with the shape its pages were written on, because coordinates only
 * mean something on the shape that produced them. This is the first of the export's two copy blocks (Grid.md D20):
 * it is what gets pasted to the agent, which puts it on the page the composer was opened from.
 */
export function layoutCode(layout: GridLayout) {
  return `const layout: GridLayout = ${layoutLiteral(layout, "")}`
}

/** A value as a TS literal, one line: identifier keys unquoted, strings quoted, nested objects inline. */
function literal(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value)
  if (typeof value === "function") return "undefined"
  if (typeof value !== "object" || value === null) return String(value)
  if (Array.isArray(value)) return `[${value.map(literal).join(", ")}]`
  const entries = Object.entries(value).filter(([, v]) => v !== undefined && typeof v !== "function")
  if (!entries.length) return "{}"
  return `{ ${entries.map(([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${literal(v)}`).join(", ")} }`
}

function layoutLiteral(layout: GridLayout, indent: string): string {
  const i1 = indent + "  "
  const i2 = i1 + "  "
  const i3 = i2 + "  "
  const i4 = i3 + "  "
  const lines: string[] = [`{`, `${i1}shapes: {`]
  for (const bp of BREAKPOINT_ORDER) {
    if (!layout.authored[bp]) continue
    const shape = authoredShape(layout, bp)
    lines.push(`${i2}${bp}: { cols: ${shape.cols}, rows: ${shape.rows} },`)
  }
  lines.push(`${i1}},`, `${i1}authored: {`)
  for (const bp of BREAKPOINT_ORDER) {
    const pages = layout.authored[bp]
    if (!pages) continue
    lines.push(`${i2}${bp}: [`)
    for (const page of pages) {
      lines.push(`${i3}{ id: "${page.id}", items: [`)
      for (const item of page.items) {
        const { children, ...rest } = item
        const head = literal(rest).slice(0, -2) // drop the closing " }"
        if (children) {
          lines.push(`${i4}${head}, children: ${layoutLiteral(children, i4)} },`)
        } else {
          lines.push(`${i4}${head} },`)
        }
      }
      lines.push(`${i3}] },`)
    }
    lines.push(`${i2}],`)
  }
  lines.push(`${i1}},`, `${indent}}`)
  return lines.join("\n")
}

/** The config as code — the second copy block (Grid.md D20). `cell · gap` per breakpoint, nothing else (D15). */
export function configCode(config: GridConfig) {
  const lines: string[] = [`const config: GridConfig = {`]
  for (const bp of BREAKPOINT_ORDER) {
    const spec = config[bp]
    if (!spec) continue
    lines.push(`  ${bp}: { cell: ${spec.cell}, gap: ${spec.gap} },`)
  }
  lines.push(`}`)
  return lines.join("\n")
}
