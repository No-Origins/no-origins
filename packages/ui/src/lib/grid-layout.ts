import {
  BREAKPOINT_ORDER,
  tracksFor,
  type GridBreakpoint,
  type GridConfig,
  type GridField,
  type GridFit,
} from "@no-origins/ui/components/grid"

/**
 * The layout model, as pure functions. Nothing here renders; grid-pages.tsx and grid-editor.tsx call it.
 *
 * A LAYOUT is a set of PAGES, authored per breakpoint. The widest authored breakpoint is the truth; a narrower
 * breakpoint with no authored pages of its own is DERIVED from the nearest wider one by packing, page by page. Hand-
 * editing a derived breakpoint writes its pages down and it stops deriving — until they are removed again.
 */

/** One placed box. Coordinates are 1-based and describe the field of the breakpoint the page belongs to. */
export type GridLayoutItem = {
  id: string
  col: number
  row: number
  colSpan: number
  rowSpan: number
  label?: string
}

export type GridRect = Pick<GridLayoutItem, "col" | "row" | "colSpan" | "rowSpan">

export type GridPage = { id: string; items: GridLayoutItem[] }

export type GridLayout = {
  authored: Partial<Record<GridBreakpoint, GridPage[]>>
}

export type ResolvedPages = {
  pages: GridPage[]
  /** The breakpoint whose authored pages these are, or were derived from. */
  source: GridBreakpoint
  /** True when the pages are the breakpoint's own; false when they were derived. */
  authored: boolean
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

/**
 * The cells the pager occupies on a page: ‹ bottom-left when there is a page before, › bottom-right when there is
 * one after. A single page has neither. The packer treats these as taken; the editor refuses to place a box on them.
 */
export function pagerCells(pageIndex: number, pageCount: number, cols: number, rows: number): GridRect[] {
  if (pageCount <= 1) return []
  const cells: GridRect[] = []
  if (pageIndex > 0) cells.push({ col: 1, row: rows, colSpan: 1, rowSpan: 1 })
  if (pageIndex < pageCount - 1) cells.push({ col: cols, row: rows, colSpan: 1, rowSpan: 1 })
  return cells
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
function packSourcePage(
  items: readonly GridLayoutItem[],
  cols: number,
  rows: number,
  firstIndex: number,
  sourceId: string,
): GridPage[] {
  let queue = readingOrder(items).map((item) => ({
    ...item,
    colSpan: clamp(item.colSpan, 1, cols),
    rowSpan: clamp(item.rowSpan, 1, rows),
  }))
  const out: GridPage[] = []

  while (queue.length) {
    const index = firstIndex + out.length
    // Assume there is a page after this one; the last page is re-packed without that corner once it is known.
    const reserved = pagerCells(index, Number.MAX_SAFE_INTEGER, cols, rows)
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
export function derivePages(sourcePages: readonly GridPage[], cols: number, rows: number): GridPage[] {
  const out: GridPage[] = []
  for (const page of sourcePages) {
    out.push(...packSourcePage(page.items, cols, rows, out.length, page.id))
  }
  if (!out.length) return [{ id: "page-1", items: [] }]

  // The true last page has no ›. Re-pack it without that corner so a box can use the cell.
  const lastIndex = out.length - 1
  const last = out[lastIndex]!
  const reserved = pagerCells(lastIndex, out.length, cols, rows)
  out[lastIndex] = { ...last, items: packOnce(readingOrder(last.items), cols, rows, reserved).placed }
  return out
}

// ── resolution ───────────────────────────────────────────────────────────────────────────────────────────────

/** The widest breakpoint with authored pages — the layout's source of truth. Null for an empty layout. */
export function widestAuthored(layout: GridLayout): GridBreakpoint | null {
  for (let i = BREAKPOINT_ORDER.length - 1; i >= 0; i--) {
    const bp = BREAKPOINT_ORDER[i]!
    if (layout.authored[bp]) return bp
  }
  return null
}

/** The nearest authored breakpoint to derive from: the closest wider one, else the closest narrower. */
function nearestAuthored(layout: GridLayout, bp: GridBreakpoint): GridBreakpoint | null {
  const at = BREAKPOINT_ORDER.indexOf(bp)
  for (let i = at + 1; i < BREAKPOINT_ORDER.length; i++) {
    if (layout.authored[BREAKPOINT_ORDER[i]!]) return BREAKPOINT_ORDER[i]!
  }
  for (let i = at - 1; i >= 0; i--) {
    if (layout.authored[BREAKPOINT_ORDER[i]!]) return BREAKPOINT_ORDER[i]!
  }
  return null
}

const clonePages = (pages: readonly GridPage[]): GridPage[] =>
  pages.map((page) => ({ ...page, items: page.items.map((item) => ({ ...item })) }))

/**
 * The pages to show on a field.
 *
 * A breakpoint's own authored pages win outright. Otherwise the nearest authored breakpoint supplies them: as they
 * are when the two fields have the same shape (an `xl` viewport on an `lg` config), packed into the new shape when
 * they do not. A transposed field never uses authored coordinates directly — a phone on its side is a different
 * field from the same phone upright — so it always derives, even from its own breakpoint.
 */
export function resolvePages(layout: GridLayout, field: GridField, config: GridConfig): ResolvedPages {
  const { bp, cols, rows, transposed } = field
  const own = layout.authored[bp]

  if (own && !transposed) return { pages: clonePages(own), source: bp, authored: true }

  const source = own ? bp : nearestAuthored(layout, bp)
  if (!source) return { pages: [{ id: "page-1", items: [] }], source: bp, authored: false }

  const sourcePages = layout.authored[source]!
  const sourceField = tracksFor(config, source)
  const sameShape = !transposed && sourceField.cols === cols && sourceField.rows === rows
  return {
    pages: sameShape ? clonePages(sourcePages) : derivePages(sourcePages, cols, rows),
    source,
    authored: false,
  }
}

// ── editing ──────────────────────────────────────────────────────────────────────────────────────────────────

/** Write pages for a breakpoint. On a derived breakpoint this is what DETACHES it. */
export function withAuthored(layout: GridLayout, bp: GridBreakpoint, pages: GridPage[]): GridLayout {
  return { authored: { ...layout.authored, [bp]: pages } }
}

/** Drop a breakpoint's own pages so it derives again. The widest authored breakpoint cannot be dropped. */
export function withoutAuthored(layout: GridLayout, bp: GridBreakpoint): GridLayout {
  if (widestAuthored(layout) === bp) return layout
  const authored = { ...layout.authored }
  delete authored[bp]
  return { authored }
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

export function layoutToJSX(layout: GridLayout, fit: GridFit, fill: boolean) {
  const source = widestAuthored(layout) ?? "lg"
  const pages = layout.authored[source] ?? []
  const lines: string[] = [
    `const layout: GridLayout = {`,
    `  authored: {`,
    `    ${source}: [`,
  ]
  for (const page of pages) {
    lines.push(`      { id: "${page.id}", items: [`)
    for (const item of page.items) {
      const label = item.label ? `, label: "${item.label}"` : ""
      lines.push(
        `        { id: "${item.id}", col: ${item.col}, row: ${item.row}, colSpan: ${item.colSpan}, rowSpan: ${item.rowSpan}${label} },`,
      )
    }
    lines.push(`      ] },`)
  }
  lines.push(`    ],`, `  },`, `}`, ``)
  lines.push(`<GridPages layout={layout} fit="${fit}"${fill ? " fill" : ""} renderItem={(item) => <Card>{item.label}</Card>} />`)
  return lines.join("\n")
}
