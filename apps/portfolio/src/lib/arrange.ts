import { resolveResponsive, type GridBreakpoint, type Responsive } from "@no-origins/ui/components/grid";
import type { GridLayoutItem } from "@no-origins/ui/lib/grid-layout";
import { introHome, introHomeSide } from "@no-origins/ui/lib/intro-motion";

import type { PortfolioField, PortfolioGridPage, PortfolioItem, PortfolioPage } from "@/content";

/** A span that means "as wide as the row" — the whole width of what it is placed in. */
export const BAND = 999;

/** The fewest rows an item that `grow`s comes down to where a page is short of rows (`arrangeAgent`): three. */
export const FLOW_GROW_MIN = 3;

export type Span = { cols: number; rows: number };

/**
 * Pieces of whole cells wrapped onto rows `cols` wide, in order, as words wrap on a line: a piece that does not fit
 * what is left of a row starts the next, and none is wider than a row. Where each goes, 1-based like the grid's lines,
 * and how many rows they take. `CellWrap` places its pieces with it, so the rows `arrangeAgent` gives an item that
 * `wraps` are the rows its pieces take.
 */
export function wrap(cells: number[], cols: number) {
  const at: { col: number; row: number; span: number }[] = [];
  let row = 0;
  let used = cols;
  for (const n of cells) {
    const span = Math.max(1, Math.min(n, cols));
    if (used + span > cols) {
      row += 1;
      used = 0;
    }
    at.push({ col: used + 1, row, span });
    used += span;
  }
  return { at, rows: row };
}

/** The cells each of an item's `wraps` takes at a breakpoint. */
export const wrapCells = (spans: Responsive<Span>[], bp: GridBreakpoint) => spans.map((span) => resolveResponsive<Span>(span, bp, { cols: 1, rows: 1 }).cols);

/** The agent that opens an item: the first it names (`by`). */
export const openerOf = (item: PortfolioItem) => item.by?.split(/\s+/)[0];

/** How many cells across the agent's pill is: its name, a chat button and the way to Orbit, a cell each (P24). */
export const AGENT_PILL_CELLS = 3;

/**
 * One agent's section, alone on the field (Portfolio.md P24): the items it opens (`by`, its first name), in
 * `site.tsx`'s order, one under the other, each at its own span and with its own `air` over it (none over the first).
 *
 * **The agents' cells are kept free**, and a line of air before them where the field has one: home is the field's last
 * column, or its bottom row on a field taller than wide (`introHome`, Grid.md D50) — `cast` agents' cells. The section
 * is centred on the field across, so it stands on the centre line (D26), unless that would bring it to the agents'
 * column.
 *
 * **Where the agent in focus stands** (`stand`, 1-based). On a field wider than tall, **one cell for every page**: the
 * third row from the bottom, at the field's centre — the left of its two middle cells, since a field is an even number
 * of cells across (D26). Lower only where the tallest page needs the rows over it, so it is the same cell on every page
 * of that field. Every section stands over it, a row of air between where there is one, centred down the field as far
 * as that allows. On a phone it is the cell below the section, at its centre. **The pill** (`pill`) is the three cells
 * beside it, right of it where they fit, else left: what hovering the agent opens. **The homes** (`homes`) are the
 * agents' cells at home, in page order, each a way to its page. **The status pill's cell** (`status`, P25): the field's
 * bottom-right corner, or the cell left of it where an agent's home is the corner; on a phone, where the agents have the
 * bottom row, the right end of the row over them — the agent's row, whose agent stands at the centre.
 *
 * **Where the rows are short**, an item that `grow`s gives up rows first, down to `FLOW_GROW_MIN`, and then the last
 * items are left off, whole: what the field has no room for is not shown.
 */
export function arrangeAgent(page: PortfolioPage, field: PortfolioField, agent: string, cast: number): PortfolioGridPage {
  const { bp, cols, rows } = field;
  const homes = introHome(cast, cols, rows);
  const byColumn = introHomeSide(cols, rows) === "column";
  // The cells left of the agents' column, or over their row.
  const roomCols = byColumn ? Math.min(...homes.map((h) => h.col)) : cols;
  const items = page.sections.flatMap((section) => section.items);
  const sectionOf = (who: string) =>
    items
      .filter((item) => openerOf(item) === who)
      .map((item) => {
        const span = resolveResponsive<Span>(item.span, bp, { cols: 1, rows: 1 });
        const width = Math.max(1, Math.min(span.cols, roomCols));
        const height = item.wraps ? wrap(wrapCells(item.wraps, bp), width).rows : span.rows;
        return { item, cols: width, rows: Math.max(1, height) };
      });
  const heightOf = (list: { item: PortfolioItem; rows: number }[]) => list.reduce((sum, p, i) => sum + p.rows + (i ? (p.item.air ?? 0) : 0), 0);
  // On a wide field the agent's row is every page's: the third from the bottom, or lower where the tallest needs it.
  const tallest = Math.max(0, ...[...new Set(items.map(openerOf))].map((who) => heightOf(sectionOf(who ?? ""))));
  const standRow = byColumn ? Math.min(rows - 1, Math.max(rows - 3, tallest + 1)) : -1;
  // The rows the section may take: over the agent's row on a wide field, over the agents' row on a phone.
  const roomRows = byColumn ? standRow : Math.min(...homes.map((h) => h.row));
  // The rows the section's boxes may take: the room, less the agent's row below them on a phone, which is the row over
  // the agents' and never a box's (a 6×10 field: nine rows of room, eight for the boxes, the agent on the ninth).
  const sectionRows = byColumn ? roomRows : Math.max(1, roomRows - 1);
  const placed = sectionOf(agent);
  // Short of rows: the growers give up theirs first, then the last items go.
  for (const p of placed) {
    if (p.item.grow) p.rows = Math.max(Math.min(p.rows, FLOW_GROW_MIN), p.rows - Math.max(0, heightOf(placed) - sectionRows));
  }
  while (placed.length > 1 && heightOf(placed) > sectionRows) placed.pop();
  const block = { cols: Math.max(0, ...placed.map((p) => p.cols)), rows: heightOf(placed) };
  // Across: centred on the field, but never in the agents' column, nor in the line of air before it where there is one.
  const centred = Math.floor((cols - block.cols) / 2);
  const left = byColumn ? Math.max(0, Math.min(centred, roomCols - block.cols - (roomCols - block.cols >= 1 ? 1 : 0))) : centred;
  // Down: over the room's last row, a row of air between where there is one; centred on the field as far as that allows.
  const lastRow = roomRows - 1 - (roomRows - block.rows >= 1 ? 1 : 0);
  let row = Math.max(0, Math.min(Math.floor(((byColumn ? rows : roomRows - 1) - block.rows) / 2), lastRow - block.rows + 1));
  const out: GridLayoutItem[] = placed.map((p, i) => {
    if (i) row += p.item.air ?? 0;
    const at = { id: p.item.id, col: left + Math.floor((block.cols - p.cols) / 2) + 1, row: row + 1, colSpan: p.cols, rowSpan: p.rows };
    row += p.rows;
    return at;
  });
  // Where the agent stands (0-based here): the field's centre on the agent's row, or below the section on a phone.
  const stand = byColumn
    ? { col: Math.floor((cols - 1) / 2), row: standRow }
    : { col: left + Math.floor((block.cols - 1) / 2), row: Math.min(roomRows - 1, row) };
  // The pill beside it: right where three cells fit before the agents' column or the field's edge, else left.
  const pillCol = stand.col + AGENT_PILL_CELLS < roomCols ? stand.col + 1 : Math.max(0, stand.col - AGENT_PILL_CELLS);
  // The status pill (P25): the bottom-right corner, or beside it where an agent's home is the corner; the row over the
  // agents' row on a phone.
  const statusRow = byColumn ? rows - 1 : Math.max(0, roomRows - 1);
  const statusCol = homes.some((h) => h.col === cols - 1 && h.row === statusRow) ? Math.max(0, cols - 2) : cols - 1;
  return {
    id: `page-${agent}`,
    title: agent,
    items: out,
    stand: { col: stand.col + 1, row: stand.row + 1 },
    pill: { col: pillCol + 1, row: stand.row + 1 },
    homes: homes.map((h) => ({ col: h.col + 1, row: h.row + 1 })),
    status: { col: statusCol + 1, row: statusRow + 1 },
  };
}
