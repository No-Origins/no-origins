import { resolveResponsive, type GridBreakpoint } from "@no-origins/ui/components/grid";
import { findFreeRect, usedBlock, type GridLayoutItem, type GridPage, type GridRect } from "@no-origins/ui/lib/grid-layout";

import type { PageContent, ShowcaseField, Span } from "@/content";

/**
 * The portfolio's way of arranging a page (Portfolio.md P2, P7, P8), on the showcase: sections packed first-fit into a
 * centred band. It is the showcase's own and not a package export on purpose: which field is authored on and the packer
 * itself are the grid's open questions (Grid.md), and the package must not decide them in code.
 */

/** The empty row above the content, per breakpoint: none. */
export const TOP_ROWS: Record<GridBreakpoint, number> = { base: 0, sm: 0, md: 0, lg: 0, xl: 0 };

/** A span that means "as wide as the band" — the content's full width on this field. */
export const BAND = 999;

/**
 * How many columns the content uses at each breakpoint, centred on the field (Portfolio.md P8). The field can be any
 * even count (Grid.md D12, D26); the content keeps a measure it was designed for and the rest is margin, so a 26-column
 * monitor gets the 16-column page with air around it rather than specimens stretched to the edges.
 */
// A phone's band is six, the whole field: every field is at least six across (Grid.md D33).
export const BAND_COLS: Record<GridBreakpoint, number> = { base: 6, sm: 6, md: 8, lg: 12, xl: 16 };

/**
 * Arrange a showcase page on the field it is shown on (Portfolio.md P2).
 *
 * Every section starts a new page and packs its items in reading order, first-fit, inside the band — the page's own
 * where it names one narrower, else `BAND_COLS` (P8); what does not fit
 * goes to the next page (Grid.md D5). Reserved on every page: the bottom row (the pager's, D27) and the columns outside
 * the band. A page's block is then centred in the band **and in the room** — across, so a lone box sits on the field's
 * centre line (D26 makes it one), and down, so it sits in the middle of the rows above the pager's (P8). An item
 * taller than the room gives up rows rather than being dropped; a slot clips, so what it holds should read its own
 * size (P5).
 *
 * `left` columns are kept off on every page — the sidebar's and its column of air (`components/sidebar.tsx`) — and
 * the band is centred in what is right of them. Where that room is narrower than the xl band, the spans are read as
 * `lg`'s: both have the same cell (Grid.md D13), and lg's widths tile a 12-column band.
 */
export function arrange(page: PageContent, field: ShowcaseField, left = 0): GridPage[] {
  const { cols, rows } = field;
  const room = Math.max(1, cols - left);
  const bp = field.bp === "xl" && room < BAND_COLS.xl ? "lg" : field.bp;
  const band = Math.min(room, BAND_COLS[bp], page.band?.[bp] ?? BAND_COLS[bp]);
  const start = left + Math.floor((room - band) / 2) + 1;
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
      const span = typeof item.span === "function" ? item.span(band, bp, field.cell) : resolveResponsive<Span>(item.span, bp, { cols: band, rows: 1 });
      const colSpan = Math.min(span.cols, band);
      const want = Math.min(span.rows, usable);
      let rowSpan = want;
      let rect = findFreeRect(placed, cols, rows, colSpan, rowSpan, reserved);
      // On a page that already holds something, give up a quarter of the rows before starting a new page — so a
      // header keeps its first specimen under it on a short field instead of standing alone. Not more than a
      // quarter: past that a specimen clips its own content, which is the grid saying the span is wrong.
      const floor = item.keep ? want : Math.max(3, Math.ceil((want * 3) / 4));
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
 * is `usable` rows from `first` (down to the row above the pager's). A block as wide as the band, or as tall as the
 * room, does not move on that axis. An odd remainder is floored, so it leans to the top-left — the same lean as the
 * grid's own centring of a kept page (Grid.md D25).
 */
function centreInRoom(items: GridLayoutItem[], start: number, band: number, first: number, usable: number): GridLayoutItem[] {
  const block = usedBlock(items);
  if (!block) return items;
  const dc = start + Math.floor((band - block.colSpan) / 2) - block.col;
  const dr = first + Math.floor((usable - block.rowSpan) / 2) - block.row;
  return dc || dr ? items.map((item) => ({ ...item, col: item.col + dc, row: item.row + dr })) : items;
}
