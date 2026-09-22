import { resolveResponsive, type GridBreakpoint, type Responsive } from "@no-origins/ui/components/grid";
import { findFreeRect, usedBlock, type GridLayoutItem, type GridPage, type GridRect } from "@no-origins/ui/lib/grid-layout";

import type { PortfolioField, PortfolioPage } from "@/content";

/**
 * The empty row above the content, per breakpoint (Portfolio.md P3).
 *
 * It was one row at every breakpoint — his first rule for the first screen, "leave 1 row on top in all breakpoints" —
 * and **amended the same day: on a phone and a tablet the content takes it** ("instead of leaving the first row empty,
 * let's not waste that space and use it"). A touch field is 6 to 12 rows deep, so a row is a tenth of the screen and
 * costs a card; a pointer field has the room and keeps the air. The split falls on the same line the cell does
 * (Grid.md D13: 72 for fingers, 60 for pointers).
 */
export const TOP_ROWS: Record<GridBreakpoint, number> = { base: 0, sm: 0, md: 0, lg: 1, xl: 1 };

/** A span that means "as wide as the band" — the content's full width on this field. */
export const BAND = 999;

/**
 * How many columns the content uses at each breakpoint, centred on the field (Portfolio.md P2). The field can be any
 * even count (Grid.md D12, D26); the content keeps a measure it was designed for and the rest is margin, so a 26-column
 * monitor gets the 16-column page with air around it rather than a page stretched to the edges.
 */
export const BAND_COLS: Record<GridBreakpoint, number> = { base: 4, sm: 6, md: 8, lg: 12, xl: 16 };

export type Span = { cols: number; rows: number };

/**
 * Arrange a portfolio page on the field it is shown on (Portfolio.md P2).
 *
 * Every section starts a new page and packs its items in reading order, first-fit, inside the band; what does not fit
 * goes to the next page (Grid.md D5). Reserved on every page: the top row where the breakpoint has one (P3), the
 * bottom row (the pager's, D27) and
 * the columns outside the band. A page's block is then centred in the band **and in the room** — across, so a lone card
 * sits on the field's centre line (D26 makes it one), and down, so it sits in the middle of the rows between the top
 * row and the pager's (P8, 2026-09-21: "let's also do that vertically"). An item taller than the room gives up rows
 * rather than being dropped; a slot clips, so what it holds should read its own size (P5).
 */
export function arrange(page: PortfolioPage, field: PortfolioField): GridPage[] {
  const { bp, cols, rows } = field;
  const band = Math.min(cols, BAND_COLS[bp]);
  const start = Math.floor((cols - band) / 2) + 1;
  const top = rows >= 3 ? TOP_ROWS[bp] : 0;
  const usable = Math.max(1, rows - top - 1);

  const reserved: GridRect[] = [];
  if (top) reserved.push({ col: 1, row: 1, colSpan: cols, rowSpan: top });
  if (rows >= 2) reserved.push({ col: 1, row: rows, colSpan: cols, rowSpan: 1 });
  if (start > 1) reserved.push({ col: 1, row: 1, colSpan: start - 1, rowSpan: rows });
  if (start + band - 1 < cols) reserved.push({ col: start + band, row: 1, colSpan: cols - band - start + 1, rowSpan: rows });

  const out: GridPage[] = [];
  for (const section of page.sections) {
    let placed: GridLayoutItem[] = [];
    let index = 0;
    const commit = () => {
      if (!placed.length) return;
      out.push({ id: `${section.id}${index ? `-${index + 1}` : ""}`, items: centreInRoom(placed, start, band, top + 1, usable) });
      index += 1;
      placed = [];
    };

    for (const item of section.items) {
      const span = resolveResponsive<Span>(item.span, bp, { cols: band, rows: 1 });
      const colSpan = Math.min(span.cols, band);
      const want = Math.min(span.rows, usable);
      let rowSpan = want;
      let rect = findFreeRect(placed, cols, rows, colSpan, rowSpan, reserved);
      // On a page that already holds something, give up a quarter of the rows before starting a new page — so a
      // header keeps its first card under it on a short field instead of standing alone (seen on an iPhone SE). Not
      // more than a quarter: at half, a four-row card became two rows and clipped its own content, which is the
      // grid saying the span is wrong (seen on the tablet's third role card).
      const floor = Math.max(3, Math.ceil((want * 3) / 4));
      while (!rect && placed.length && rowSpan > floor) {
        rowSpan -= 1;
        rect = findFreeRect(placed, cols, rows, colSpan, rowSpan, reserved);
      }
      if (!rect && placed.length) {
        commit();
        rowSpan = want;
        rect = findFreeRect(placed, cols, rows, colSpan, rowSpan, reserved);
      }
      while (!rect && rowSpan > 1) {
        rowSpan -= 1;
        rect = findFreeRect(placed, cols, rows, colSpan, rowSpan, reserved);
      }
      if (!rect) continue;
      placed.push({ id: item.id, ...rect });
    }
    commit();
  }
  return out.length ? out : [{ id: "page-1", items: [] }];
}

/**
 * Shift a page's block so it is centred in the band and in the room: the band is `band` columns from `start`, the room
 * is `usable` rows from `first` (the row under the top row, down to the row above the pager's). A block as wide as the
 * band, or as tall as the room, does not move on that axis. An odd remainder is floored, so it leans to the top-left
 * — the same lean as the grid's own centring of a kept page (Grid.md D25).
 */
function centreInRoom(items: GridLayoutItem[], start: number, band: number, first: number, usable: number): GridLayoutItem[] {
  const block = usedBlock(items);
  if (!block) return items;
  const dc = start + Math.floor((band - block.colSpan) / 2) - block.col;
  const dr = first + Math.floor((usable - block.rowSpan) / 2) - block.row;
  return dc || dr ? items.map((item) => ({ ...item, col: item.col + dc, row: item.row + dr })) : items;
}

/** A span per breakpoint, walking down to the nearest defined (the grid's own resolution rule). */
export type ResponsiveSpan = Responsive<Span>;
