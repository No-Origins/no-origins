import { resolveResponsive, type GridBreakpoint, type Responsive } from "@no-origins/ui/components/grid";
import { findFreeRect, usedBlock, type GridLayoutItem, type GridRect } from "@no-origins/ui/lib/grid-layout";
import { introHome, introHomeSide } from "@no-origins/ui/lib/intro-motion";

import type { PortfolioField, PortfolioGridPage, PortfolioItem, PortfolioPage, PortfolioSection } from "@/content";

/**
 * The empty row above the content, per breakpoint (Portfolio.md P3).
 *
 * It was one row at every breakpoint — his first rule for the first screen, "leave 1 row on top in all breakpoints" —
 * and **amended the same day: on a phone and a tablet the content takes it** ("instead of leaving the first row empty,
 * let's not waste that space and use it"). A touch field is 6 to 12 rows deep, so a row is a tenth of the screen and
 * costs a card; a pointer field has the room and keeps the air. The split falls on the same line the cell does
 * (Grid.md D13: 72 for fingers, 60 for pointers).
 *
 * **And none on a pointer either since 2026-09-27**: his "push all the verticals one row up" took it first
 * (`FIRST_SCREEN_LIFT`), and the case studies under the projects ("let's also add another section: case studies")
 * needed the row, on a field twelve rows deep, for the work's card not to give up two.
 */
export const TOP_ROWS: Record<GridBreakpoint, number> = { base: 0, sm: 0, md: 0, lg: 0, xl: 0 };

/**
 * The empty row under the content, per breakpoint: the pager's, which the first screen kept when the portfolio was
 * pages (Grid.md D27) and P15 kept so none of its boxes moved. **A pointer's first screen takes it since 2026-09-27**
 * (the case studies, as `TOP_ROWS`); on touch the room still puts the links' old place and the degree there, and a
 * phone's work would otherwise take it from the degree.
 */
export const FOOT_ROWS: Record<GridBreakpoint, number> = { base: 1, sm: 1, md: 1, lg: 0, xl: 0 };

/**
 * The most rows the first screen leaves empty above its block, the tagline included and the top row counted (his,
 * 2026-09-26: "leave only a maximum of 4 rows above in the first page"). Centred down on a tall field the first
 * screen sat six rows down; it is centred still, until the rows over it would be more than these.
 */
export const FIRST_SCREEN_AIR = 4;

/**
 * How many rows the first screen stands higher than it is centred, where there are rows over it (his, 2026-09-27:
 * "push all the verticals one row up"): one. On a field twelve rows deep it takes the empty top row (P3), and on a
 * taller one it leans the centred block a row up.
 */
export const FIRST_SCREEN_LIFT = 1;

/** A span that means "as wide as the band" — the content's full width on this field. */
export const BAND = 999;

/**
 * How many columns the content uses at each breakpoint, centred on the field (Portfolio.md P2). A phone's is six, the
 * whole field, since every field is at least six across (Grid.md D33, 2026-09-25); it was four. The field can be any
 * even count (Grid.md D12, D26); the content keeps a measure it was designed for and the rest is margin, so a 26-column
 * monitor gets the 16-column page with air around it rather than a page stretched to the edges.
 */
export const BAND_COLS: Record<GridBreakpoint, number> = { base: 6, sm: 6, md: 8, lg: 12, xl: 16 };

/**
 * The narrowest a column beside a page's block may be (`PortfolioItem.side`): five cells, the four companies' marks on
 * the first screen's work column and one more, so the active mark grows to hold its name (2026-09-27; at four it had
 * no room and was only filled). Where the band leaves fewer either side of the block, the block takes its items'
 * `narrow` spans if that leaves enough, and otherwise the columns are packed under it instead, as ordinary items.
 */
export const SIDE_MIN = 5;

/**
 * The widest a column beside a page's block may be (his, 2026-09-27: "for large screens can we go up to six columns
 * for the left and right verticals"): six cells, where the band leaves them — a field of twenty-four columns and up, the
 * first screen's band being twenty-four there. A narrower field keeps the room it has, five on twenty-two, twenty and
 * eighteen.
 */
export const SIDE_MAX = 6;

/**
 * The empty columns between the block and each column beside it, the widest first: two where the band leaves the
 * columns SIDE_MIN beside the block's own spans (his, 2026-09-28: "add two column gap in large screen … currently
 * there's only one column gap between each vertical"), a field of twenty-two columns and up; else one (his,
 * 2026-09-27: "leave one column gap between each vertical"), so the three verticals read as three. The field's lines
 * show through it.
 */
export const SIDE_GAPS = [2, 1];

/**
 * The fewest rows an item that `grow`s keeps in its column: two, so the tech stack under the projects keeps its label's
 * row and one more of marks when the art skills went under it (2026-09-27) — one row was its label and four marks.
 */
export const GROW_MIN = 2;

/**
 * The fewest rows an item that `grow`s in a page's flow is given, where it is not a column's: three, his words under
 * the profile (2026-09-27), which then hold the first paragraph and the last — two held the last alone. Where the page
 * leaves it fewer, it is left off.
 */
export const FLOW_GROW_MIN = 3;

export type Span = { cols: number; rows: number };

/**
 * Pieces of whole cells wrapped onto rows `cols` wide, in order, as words wrap on a line: a piece that does not fit
 * what is left of a row starts the next, and none is wider than a row. Where each goes, 1-based like the grid's lines,
 * and how many rows they take. The projects in the first screen's left column wrap this way (his, 2026-09-27: "let the
 * projects wrap instead of behaving like a column of cards"), and `CellWrap` places them with it too, so the rows
 * `arrange` gives them are the rows they take.
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

/**
 * Arrange the portfolio on the field it is shown on, as ONE page (Portfolio.md P2, P15; his, 2026-09-27: "We don't
 * need multiple pages in portfolio now. Remove pagination navbar. For now, try arranging pieces from those pages to the
 * first page, without disturbing the current ones").
 *
 * The first screen is arranged as it always was (`paginate`) — over the bottom row it kept for the pager, so not one
 * of its boxes moves — and its first page is the portfolio. Everything that was not on it goes in the room it leaves
 * (`fillRoom`): every later section's items, in order, and then the first section's own overflow on a short field —
 * in that order since the degree went under the work (2026-09-27), which on a phone took the bottom row from Email
 * and GitHub. What finds no room is not shown.
 */
export function arrange(page: PortfolioPage, field: PortfolioField): PortfolioGridPage {
  const first = paginate(page, field)[0] ?? { id: "page-1", items: [] };
  const shown = new Set(first.items.map((item) => item.id));
  const [screen, ...later] = page.sections;
  // The first screen's tabs stand in for its columns, or the columns for the tabs, as `paginate` chose (`compact`).
  const tabbed = !standingBeside(first.items, screen) && !!screen?.items.some((item) => resolveResponsive(item.compact, field.bp, false));
  // An item that grows in the flow is shown there or not at all: his words under the profile go nowhere else.
  const rest = [...later, ...(screen ? [screen] : [])]
    .flatMap((section) => section.items)
    .filter((item) => !item.backdrop && !shown.has(item.id) && !(item.grow && !item.side))
    .filter((item) => (tabbed ? !item.side : item.compact === undefined));
  return { ...first, items: [...first.items, ...fillRoom(first, page.sections[0], rest, field)] };
}

/** The agent that opens an item: the first it names (`by`). */
export const openerOf = (item: PortfolioItem) => item.by?.split(/\s+/)[0];

/** How many cells across the agent's pill is: its name, a chat button and the way to Orbit, a cell each (P24). */
export const AGENT_PILL_CELLS = 3;

/**
 * One agent's section, alone on the field (Portfolio.md P24, his, 2026-10-03: "having pages is a good idea … each agent
 * can pick a section. So we scroll from one agent to another"): the items it opens (`by`, its first name), in
 * `site.tsx`'s order, one under the other, each at its own span and with its own `air` over it (none over the first) —
 * the column it stood in on the one page, standing alone. The tabs (`compact`) are a phone's way of showing every
 * section at once, so no page has them.
 *
 * **The agents' cells are kept free**, and a line of air before them where the field has one: home is the field's last
 * column, or its bottom row on a field taller than wide (`introHome`, Grid.md D50 version 9) — `cast` agents' cells.
 * The section is centred on the field across, so it stands on the centre line (D26), unless that would bring it to the
 * agents' column.
 *
 * **Where the agent in focus stands** (`stand`, 1-based). On a field wider than tall, **one cell for every page** (his,
 * 2026-10-03: "each agent is taking a different cell in a different row uh, which I did not like. So … put the agent in
 * the bottom third row in the large screen"): the third row from the bottom, at the field's centre — the left of its
 * two middle cells, since a field is an even number of cells across (D26). Lower only where the tallest page needs
 * the rows over it, so it is the same cell on every page of that field. Every section stands over it, a row of air
 * between where there is one, centred down the field as far as that allows. On a phone it is the cell below the
 * section, at its centre, as first built. **The pill** (`pill`) is the three cells beside it, right of it where they
 * fit, else left: what a click on the agent opens. **The homes** (`homes`) are the agents' cells at home, in page
 * order, each a way to its page (his, 2026-10-03: "travel to pages by clicking on the agent on the right column").
 * **The status pill's cell** (`status`, P25, his: "a pill in the bottom right of the portfolio"): the field's
 * bottom-right corner, or the cell left of it where an agent's home is the corner; on a phone, where the agents have the
 * bottom row, the right end of the row over them — the agent's row, whose agent stands at the centre.
 *
 * **Where the rows are short**, an item that `grow`s gives up rows first, down to `FLOW_GROW_MIN`, and then the last
 * items are left off, whole: what the field has no room for is not shown (P15's rule, kept).
 */
export function arrangeAgent(page: PortfolioPage, field: PortfolioField, agent: string, cast: number): PortfolioGridPage {
  const { bp, cols, rows } = field;
  const homes = introHome(cast, cols, rows);
  const byColumn = introHomeSide(cols, rows) === "column";
  // The cells left of the agents' column, or over their row.
  const roomCols = byColumn ? Math.min(...homes.map((h) => h.col)) : cols;
  const items = page.sections.flatMap((section) => section.items).filter((item) => !item.backdrop && item.compact === undefined);
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

/**
 * The first screen's block and the `side` columns standing beside it — none of them across the block's columns — or
 * null where they went under it, or there are none.
 */
function standingBeside(items: GridLayoutItem[], screen: PortfolioSection | undefined) {
  const sided = new Set(screen?.items.filter((item) => item.side).map((item) => item.id));
  const centre = usedBlock(items.filter((item) => !sided.has(item.id)));
  const beside = items.filter((item) => sided.has(item.id));
  const standing = !!centre && beside.length > 0 && beside.every((item) => item.col + item.colSpan <= centre.col || item.col >= centre.col + centre.colSpan);
  return standing && centre ? { centre, beside } : null;
}

/**
 * The room the first screen leaves, and the items that were not on it placed there (2026-09-27). It is two places:
 * the WELL — the centre's columns under its last box, down to the foot of the columns beside it, where they stand
 * taller than it — and every row under the whole block that the tagline does not keep, the pager's old row among
 * them. Nothing goes above the block, beside it, in the air between the verticals (SIDE_GAPS) or outside the band (P8).
 *
 * Each item takes the first of its spans — its own, then its `fallback`s — that fits, first-fit in reading order; a
 * span wider than the band does not fit, and an item none of whose spans fits is left off. Items under the block that
 * stand on the same rows, with nothing else across them, are centred in the band together, the way a block is (P8) —
 * a row of one-row pills, or a section two rows tall, its label's row and its pill's (2026-09-27).
 */
function fillRoom(first: PortfolioGridPage, screen: PortfolioSection | undefined, rest: PortfolioItem[], field: PortfolioField): GridLayoutItem[] {
  const { bp, cols, rows } = field;
  const block = usedBlock(first.items);
  if (!block || !rest.length) return [];
  const band = Math.min(cols, screen?.band?.[bp] ?? BAND_COLS[bp]);
  const start = Math.floor((cols - band) / 2) + 1;
  const end = start + band;
  const under = block.row + block.rowSpan;

  // The well, where the columns beside the centre stand beside it rather than under it.
  const centre = standingBeside(first.items, screen)?.centre;
  const well = centre ? { col: centre.col, row: centre.row + centre.rowSpan, colSpan: centre.colSpan } : null;

  const reserved: GridRect[] = [
    { col: 1, row: 1, colSpan: start - 1, rowSpan: rows },
    { col: end, row: 1, colSpan: cols - end + 1, rowSpan: rows },
    ...(well
      ? [
          { col: start, row: 1, colSpan: well.col - start, rowSpan: under - 1 },
          { col: well.col + well.colSpan, row: 1, colSpan: end - well.col - well.colSpan, rowSpan: under - 1 },
          { col: well.col, row: 1, colSpan: well.colSpan, rowSpan: well.row - 1 },
        ]
      : [{ col: 1, row: 1, colSpan: cols, rowSpan: under - 1 }]),
    ...(first.backdrop ? [first.backdrop] : []),
  ].filter((rect) => rect.colSpan > 0 && rect.rowSpan > 0);

  const placed: GridLayoutItem[] = [];
  for (const item of rest) {
    for (const span of [item.span, ...(item.fallback ?? [])]) {
      const want = resolveResponsive<Span>(span, bp, { cols: band, rows: 1 });
      const colSpan = want.cols >= BAND ? band : want.cols;
      if (colSpan > band) continue;
      const rect = findFreeRect([...first.items, ...placed], cols, rows, colSpan, want.rows, reserved);
      if (!rect) continue;
      placed.push({ id: item.id, ...rect });
      break;
    }
  }

  // First-fit packs a row from the band's start; items under the block on the same rows are centred in it instead.
  const same = (a: GridRect, b: GridRect) => a.row === b.row && a.rowSpan === b.rowSpan;
  const across = (a: GridRect, b: GridRect) => a.row < b.row + b.rowSpan && b.row < a.row + a.rowSpan;
  return placed.map((item) => {
    if (item.row < under || placed.some((other) => !same(other, item) && across(other, item))) return item;
    const run = placed.filter((other) => same(other, item));
    const left = Math.min(...run.map((other) => other.col));
    const right = Math.max(...run.map((other) => other.col + other.colSpan));
    return { ...item, col: item.col + start + Math.floor((band - (right - left)) / 2) - left };
  });
}

/**
 * The first screen's arrangement as it stood when the portfolio was pages (Portfolio.md P2); `arrange` keeps its first
 * page.
 *
 * Every section starts a new page and packs its items in reading order, first-fit, inside the band; what does not fit
 * goes to the next page (Grid.md D5). Reserved on every page: the top row where the breakpoint has one (P3), the
 * bottom row (the pager's, D27) and the columns outside the band. A page's block is then centred in the band **and in
 * the room** — across, so a lone card sits on the field's centre line (D26 makes it one), and down, so it sits in the
 * middle of the rows between the top row and the pager's (P8, 2026-09-21: "let's also do that vertically"). An item
 * taller than the room gives up rows rather than being dropped; a slot clips, so what it holds should read its own
 * size (P5).
 *
 * A section's first page may also stand columns beside its block (`side`) and keep rows free under it, over the
 * pager's, for something drawn behind the field (`backdrop`, the first screen's tagline): the block is centred in the
 * rows over those, and the backdrop comes back on the page as `backdrop` rather than among its items, because it is
 * not a box on the grid. An item that `grow`s in the flow is given its rows first, or left off (`sizeGrowers`).
 */
function paginate(page: PortfolioPage, field: PortfolioField): PortfolioGridPage[] {
  const { bp, cols, rows } = field;
  const top = rows >= 3 ? TOP_ROWS[bp] : 0;
  const foot = rows >= 2 ? FOOT_ROWS[bp] : 0;
  const usable = Math.max(1, rows - top - foot);
  const first = top + 1;

  const out: PortfolioGridPage[] = [];
  for (const authored of page.sections) {
    const section = sizeGrowers(authored, field, usable);
    // The band is the section's own where it widens it (the first screen's three columns), else the breakpoint's.
    const band = Math.min(cols, section.band?.[bp] ?? BAND_COLS[bp]);
    const start = Math.floor((cols - band) / 2) + 1;
    const reserved: GridRect[] = [];
    if (top) reserved.push({ col: 1, row: 1, colSpan: cols, rowSpan: top });
    if (foot) reserved.push({ col: 1, row: rows, colSpan: cols, rowSpan: 1 });
    if (start > 1) reserved.push({ col: 1, row: 1, colSpan: start - 1, rowSpan: rows });
    if (start + band - 1 < cols) reserved.push({ col: start + band, row: 1, colSpan: cols - band - start + 1, rowSpan: rows });
    const resolve = (item: PortfolioItem, narrow: boolean) =>
      resolveResponsive<Span>((narrow && item.narrow) || item.span, bp, { cols: band, rows: 1 });

    // Columns beside the block (`side`): the band's room beside the widest item in the flow shared between them, less
    // a gap each, all of them one width. Where that is SIDE_MIN cells or more they stand in it, out of the flow, the gap
    // the widest of SIDE_GAPS that leaves it so. Where it is not but the flow's `narrow` spans leave that much, the flow takes them —
    // the first screen's centre goes to six cells on an eighteen-column field (his pick, 2026-09-27). Otherwise they
    // are packed after the block like any `below` item.
    const flow = section.items.filter((item) => !item.side && !item.backdrop && item.compact === undefined);
    const lanes = [...new Set(section.items.flatMap((item) => (item.side ? [item.side] : [])))].sort((a, b) => a - b);
    const room = (narrow: boolean, gap: number) =>
      Math.floor((band - Math.max(0, ...flow.map((item) => Math.min(resolve(item, narrow).cols, band))) - lanes.length * gap) / Math.max(1, lanes.length));
    const fits = [false, true].flatMap((narrow) => SIDE_GAPS.map((gap) => ({ narrow, gap }))).find(({ narrow, gap }) => room(narrow, gap) >= SIDE_MIN);
    const { narrow, gap } = (section.items.some((item) => item.side) && fits) || { narrow: false, gap: SIDE_GAPS[SIDE_GAPS.length - 1] };
    // An item that wraps pieces (`wraps`) is the rows they wrap to at its width.
    const wrapped = (item: PortfolioItem, width: number) => wrap(wrapCells(item.wraps ?? [], bp), width).rows;
    const spanOf = (item: PortfolioItem) => {
      const span = resolve(item, narrow);
      return item.wraps ? { ...span, rows: wrapped(item, Math.min(span.cols, band)) } : span;
    };
    const sideCols = Math.min(SIDE_MAX, room(narrow, gap));
    const besideRows = (item: PortfolioItem) => (item.wraps ? wrapped(item, sideCols) : spanOf(item).rows);
    let sides = sideCols >= SIDE_MIN ? section.items.filter((item) => item.side) : [];
    // Where the columns cannot stand beside the block, a `compact` item takes their place and they are left off — the
    // first screen's tabs on a phone and a tablet (2026-09-28). Where they stand beside it, or it is not true at this
    // breakpoint, it is the one left off.
    const beside = sides.length > 0;
    const tabbed = !beside && section.items.some((item) => resolveResponsive(item.compact, bp, false));
    const skipped = (item: PortfolioItem) => (item.compact !== undefined && !tabbed) || (tabbed && !!item.side);
    let backdrop = section.items.find((item) => item.backdrop);

    let placed: GridLayoutItem[] = [];
    let index = 0;
    const commit = () => {
      if (!placed.length) return;
      let items = centreInRoom(placed, start, band, first, usable);
      // The columns beside it: all as tall as the tallest of them and the block, from the block's top, and the block
      // level with their top — it was centred down between them, which left the centre an empty row over it (his,
      // 2026-09-27: "there is one empty row above the center vertical … we don't need that"), labels and all (his, the
      // same day: "Work and Projects top row is above the middle vertical. Let's move the middle vertical a row up
      // too"). A column is its side's items stacked in order (the work over the projects, the tech over the art skills).
      // The block and its columns are centred in the band together, in the order of their `side`s — the profile, then
      // the work, then the projects (his, 2026-09-27: "put the profile vertical in the left, then work and then
      // projects"); the block was in the middle, on the field's centre line, with a column either side.
      const centre = usedBlock(items);
      if (centre && sides.length) {
        const columns = lanes.map((lane) => sides.filter((item) => item.side === lane)).filter((column) => column.length);
        const pitch = sideCols + gap;
        const before = columns.filter((column) => column[0].side! < 0).length;
        const at = start + Math.floor((band - centre.colSpan - columns.length * pitch) / 2) + before * pitch;
        items = items.map((item) => ({ ...item, col: item.col + at - centre.col }));
        const colOf = (i: number) => (i < before ? at - (before - i) * pitch : at + centre.colSpan + gap + (i - before) * pitch);
        // What a column needs: its items' rows, and for one that grows, GROW_MIN; and the `air` each item
        // after its first leaves over itself (his, 2026-09-27: "leave one row gap between projects and skills, and work
        // and education").
        const airOf = (column: PortfolioItem[]) => column.map((item, i) => (i ? (item.air ?? 0) : 0));
        const need = (item: PortfolioItem) => (item.grow ? GROW_MIN : besideRows(item));
        const sum = (rows: number[]) => rows.reduce((total, n) => total + n, 0);
        const tall = Math.min(usable, Math.max(centre.rowSpan, ...columns.map((column) => sum(column.map(need)) + sum(airOf(column)))));
        for (const [index, stacked] of columns.entries()) {
          const col = colOf(index);
          // Where the column's items are more rows than it has even with no air — the one that grows at GROW_MIN — its
          // last items go, whole, until they are not, before any item gives up a row (2026-09-28: his statements took
          // rows in both columns, and at 1440 × 900 the work would have given up its label and a company to keep the
          // case studies' Work In Progress under them). Never the first, and not past one that grows.
          const column = [...stacked];
          while (column.length > 1 && !column[column.length - 1].grow && sum(column.map(need)) > tall) column.pop();
          // The rows the column has over its items go to the one that grows, up to its most; a column with none leaves
          // them empty at its foot (2026-09-27: stretched, the work's card pooled three rows of air over its stack, the mirror of P5).
          // Where the column has fewer rows than its items ask for, its air goes first, the last first — the one that
          // grows keeping GROW_MIN (2026-09-27: when every section's label took a row of its own, the second column at
          // 1440 × 900 was a row over the field, and the work gave up its label) — then the one that grows gives them
          // up, else the first item.
          const heights = column.map((item) => (item.grow ? GROW_MIN : besideRows(item)));
          const airs = airOf(column);
          const grower = column.findIndex((item) => item.grow);
          let over = tall - sum(heights) - sum(airs);
          for (let i = airs.length - 1; i > 0 && over < 0; i--) {
            const give = Math.min(airs[i], -over);
            airs[i] -= give;
            over += give;
          }
          // One that grows stops at its most (`growMost`), whose last row is the air under it (2026-09-28, his: "there
          // are three rows empty between technical skills and art skills. Reduce it to one"); the rest are the foot's.
          const most = grower >= 0 ? column[grower].growMost?.(sideCols) : undefined;
          if (most !== undefined && over > 0 && heights[grower] + over >= most) {
            heights[grower] = most;
            if (grower + 1 < airs.length) airs[grower + 1] = 0;
          } else if (grower >= 0) heights[grower] += over;
          else if (over < 0) heights[0] += over;
          let row = centre.row;
          column.forEach((item, i) => {
            row += airs[i];
            const rowSpan = Math.min(heights[i], centre.row + tall - row);
            if (rowSpan < 1) return;
            items = [...items, { id: item.id, col, row, colSpan: sideCols, rowSpan }];
            row += rowSpan;
          });
        }
      }
      // The rows kept for the backdrop: as many as it asks for that the block leaves, at the foot of the room, and the
      // block centred in the rows over them.
      const block = usedBlock(items);
      const kept = backdrop && block ? Math.max(0, Math.min(spanOf(backdrop).rows, usable - block.rowSpan)) : 0;
      if (sides.length || backdrop) items = centreDown(items, first, usable - kept);
      // The first screen is centred until more than FIRST_SCREEN_AIR rows would be empty over its whole block
      // (Portfolio.md P3, amended 2026-09-26).
      if (!out.length) {
        const excess = Math.max(0, (usedBlock(items)?.row ?? 1) - 1 - FIRST_SCREEN_AIR);
        if (excess) items = items.map((item) => ({ ...item, row: item.row - excess }));
        const lift = Math.min(FIRST_SCREEN_LIFT, (usedBlock(items)?.row ?? 1) - 1);
        if (lift > 0) items = items.map((item) => ({ ...item, row: item.row - lift }));
      }
      const id = `${section.id}${index ? `-${index + 1}` : ""}`;
      out.push(backdrop && kept ? { id, items, backdrop: { id: backdrop.id, col: start, row: first + usable - kept, colSpan: band, rowSpan: kept } } : { id, items });
      sides = [];
      backdrop = undefined;
      index += 1;
      placed = [];
    };

    for (const item of section.items) {
      if (item.backdrop || sides.includes(item) || skipped(item)) continue;
      const span = spanOf(item);
      const colSpan = Math.min(span.cols, band);
      const want = Math.min(span.rows, usable);
      // An item that goes `below` finds its place under the page's block so far: every row down to its foot is taken,
      // and its `air` under that. A `side` item with no room beside the block goes below it.
      const search = (h: number) => {
        const block = item.below || item.side ? usedBlock(placed) : null;
        const taken = block ? [{ col: 1, row: 1, colSpan: cols, rowSpan: block.row + block.rowSpan - 1 + (item.air ?? 0) }] : [];
        return findFreeRect(placed, cols, rows, colSpan, h, [...reserved, ...taken]);
      };
      let rowSpan = want;
      let rect = search(rowSpan);
      // On a page that already holds something, give up a quarter of the rows before starting a new page — so a
      // header keeps its first card under it on a short field instead of standing alone (seen on an iPhone SE). Not
      // more than a quarter: at half, a four-row card became two rows and clipped its own content, which is the
      // grid saying the span is wrong (seen on the tablet's third role card).
      const floor = Math.max(3, Math.ceil((want * 3) / 4));
      while (!rect && placed.length && rowSpan > floor) {
        rowSpan -= 1;
        rect = search(rowSpan);
      }
      // A `compact` item takes its shorter spans (`fallback`) where the rows are short, rather than a page of its own:
      // the tabs on an iPhone SE, which would otherwise leave the rows to his words.
      for (const short of item.compact !== undefined ? (item.fallback ?? []) : []) {
        if (rect) break;
        rowSpan = Math.min(resolveResponsive<Span>(short, bp, { cols: band, rows: 1 }).rows, usable);
        rect = search(rowSpan);
      }
      if (!rect && placed.length) {
        commit();
        rowSpan = want;
        rect = search(rowSpan);
      }
      while (!rect && rowSpan > 1) {
        rowSpan -= 1;
        rect = search(rowSpan);
      }
      if (!rect) continue;
      placed.push({ id: item.id, ...rect });
    }
    commit();
  }
  return out.length ? out : [{ id: "page-1", items: [] }];
}

/**
 * The section with each item that `grow`s in its flow given its rows — his words under the profile (2026-09-27): the
 * rows the section's first page leaves under its flow, at most its span's. Where the columns stand beside the block
 * that is the room under the block's own boxes; where they are packed under it, the room under everything. It is found
 * by arranging the section without it, and an item it leaves fewer than FLOW_GROW_MIN is left off, so it never puts a
 * box of the first screen off the page: on a phone and a tablet the work has the rows.
 */
function sizeGrowers(section: PortfolioSection, field: PortfolioField, usable: number): PortfolioSection {
  const growers = section.items.filter((item) => item.grow && !item.side && !item.backdrop);
  if (!growers.length) return section;
  const trial = paginate({ title: "", sections: [{ ...section, items: section.items.filter((item) => !growers.includes(item)) }] }, field)[0]?.items ?? [];
  const standing = standingBeside(trial, section);
  let left = usable - ((standing ? standing.centre : usedBlock(trial))?.rowSpan ?? 0);
  // The field decides the breakpoint, so a grower's spans are resolved here and handed on as that one span.
  const sized = (span: Responsive<Span>, rows: number) => ({ base: { ...resolveResponsive<Span>(span, field.bp, { cols: BAND, rows: 1 }), rows } });
  const given = new Map<string, PortfolioItem>();
  for (const item of growers) {
    const rows = Math.min(resolveResponsive<Span>(item.span, field.bp, { cols: BAND, rows: 1 }).rows, left);
    if (rows < FLOW_GROW_MIN) continue;
    given.set(item.id, { ...item, span: sized(item.span, rows), narrow: item.narrow && sized(item.narrow, rows) });
    left -= rows;
  }
  return { ...section, items: section.items.flatMap((item) => (!growers.includes(item) ? [item] : given.has(item.id) ? [given.get(item.id)!] : [])) };
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

/** Shift a page down so its whole block is centred in the room, floored as `centreInRoom` is; across is left alone. */
function centreDown(items: GridLayoutItem[], first: number, usable: number): GridLayoutItem[] {
  const block = usedBlock(items);
  if (!block) return items;
  const dr = first + Math.floor((usable - block.rowSpan) / 2) - block.row;
  return dr ? items.map((item) => ({ ...item, row: item.row + dr })) : items;
}

/** A span per breakpoint, walking down to the nearest defined (the grid's own resolution rule). */
export type ResponsiveSpan = Responsive<Span>;
