import { resolveResponsive, type GridBreakpoint, type Responsive } from "@no-origins/ui/components/grid";
import { findFreeRect, usedBlock, type GridLayoutItem, type GridPage, type GridRect } from "@no-origins/ui/lib/grid-layout";

/**
 * The admin's arrangement — the showcase's (`apps/design/src/lib/arrange.ts`, Portfolio.md P2, P8) for pages that are
 * lists. It is a copy and not a package export for the reason the showcase gives: the packer is one of the grid's open
 * questions (Grid.md) and the package must not decide it. When it is decided, the copies become one.
 *
 * What differs from the showcase's: a page is one list of boxes, not sections; a box may be `repeat`, placed where the
 * list puts it on the first page and first on every later one — the way home and the page's name, a list's column
 * names — so a list that spills over pages is still named on each; a span may be `null` on a breakpoint, where the box
 * is not on the field; and a page's block is
 * centred down the room by the FIRST page's offset, so what repeats stays where it was as the pages turn.
 */

/** A box's size in cells. `cols` as wide as the band or wider means the band; below zero, the band less that many. */
export type Span = { cols: number; rows: number };

/** The field a page is arranged on: the breakpoint that supplied its cell and its counts (Grid.md D12). */
export type AdminField = { bp: GridBreakpoint; cols: number; rows: number };

export type Arrangeable = { id: string; span: Responsive<Span | null>; repeat?: boolean };

/** A span that means "as wide as the band". */
export const BAND = 999;

/**
 * How many columns the content uses at each breakpoint, centred on the field. Twelve from `lg` up, the home's width
 * (its cards span twelve), so the admin's pages are as wide as the page they are opened from; six on a phone, the whole
 * field (Grid.md D33).
 */
export const BAND_COLS: Record<GridBreakpoint, number> = { base: 6, sm: 6, md: 8, lg: 12, xl: 12 };

/**
 * Arrange a list on the field it is shown on. Boxes pack first-fit in reading order inside the band; what does not
 * fit goes to the next page (Grid.md D5). Reserved on every page: the bottom row (the pager's, D27) and the columns
 * outside the band. A box taller than the room gives up rows rather than being dropped; a slot clips, so a box that
 * is cut off is one whose span is too small.
 */
export function arrange(items: readonly Arrangeable[], field: AdminField): GridPage[] {
  const { bp, cols, rows } = field;
  const band = Math.min(cols, BAND_COLS[bp]);
  const start = Math.floor((cols - band) / 2) + 1;
  const usable = Math.max(1, rows - 1);

  const reserved: GridRect[] = [];
  if (rows >= 2) reserved.push({ col: 1, row: rows, colSpan: cols, rowSpan: 1 });
  if (start > 1) reserved.push({ col: 1, row: 1, colSpan: start - 1, rowSpan: rows });
  if (start + band - 1 < cols) reserved.push({ col: start + band, row: 1, colSpan: cols - band - start + 1, rowSpan: rows });

  const sized = items.flatMap((item) => {
    const span = resolveResponsive<Span | null>(item.span, bp, { cols: band, rows: 1 });
    if (!span) return [];
    const colSpan = span.cols < 0 ? Math.max(1, band + span.cols) : Math.min(span.cols, band);
    return [{ id: item.id, repeat: item.repeat ?? false, colSpan, rowSpan: Math.min(span.rows, usable) }];
  });
  const repeats = sized.filter((item) => item.repeat);

  const pages: GridLayoutItem[][] = [];
  let placed: GridLayoutItem[] = [];
  let listed = false;
  const fit = (colSpan: number, rowSpan: number) => findFreeRect(placed, cols, rows, colSpan, rowSpan, reserved);
  // The first page takes every box in the list's order; each later page starts with the repeats, in theirs. The same
  // id on every page, so what repeats is the same element through a turn.
  const next = () => {
    pages.push(placed);
    placed = [];
    listed = false;
    for (const item of repeats) {
      const rect = fit(item.colSpan, item.rowSpan);
      if (rect) placed.push({ id: item.id, ...rect });
    }
  };

  for (const item of sized) {
    if (item.repeat && placed.some((p) => p.id === item.id)) continue;
    let rowSpan = item.rowSpan;
    let rect = fit(item.colSpan, rowSpan);
    if (!rect && listed) {
      next();
      if (item.repeat) continue;
      rect = fit(item.colSpan, rowSpan);
    }
    while (!rect && rowSpan > 1) {
      rowSpan -= 1;
      rect = fit(item.colSpan, rowSpan);
    }
    if (!rect) continue;
    placed.push({ id: item.id, ...rect });
    if (!item.repeat) listed = true;
  }
  pages.push(placed);

  // Down the room by the first page's offset (clamped so a fuller later page stays above the pager); across the band
  // by each page's own, so a lone box sits on the field's centre line (D26 makes it one).
  const first = usedBlock(pages[0] ?? []);
  const down = first ? 1 + Math.floor((usable - first.rowSpan) / 2) - first.row : 0;
  return pages.map((items, index) => {
    const block = usedBlock(items);
    if (!block) return { id: `page-${index + 1}`, items };
    const dr = Math.max(0, Math.min(down, usable - block.rowSpan - (block.row - 1)));
    const dc = start + Math.floor((band - block.colSpan) / 2) - block.col;
    return { id: `page-${index + 1}`, items: dc || dr ? items.map((item) => ({ ...item, col: item.col + dc, row: item.row + dr })) : items };
  });
}
