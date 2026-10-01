/**
 * Where everything stands on the field (Orbit.md C2, C4, C7). Pure: cells in, boxes out.
 *
 * **The stage** (his, 2026-09-30: *"we will pick a cell at the center and make it with radius of three cells"*) is one
 * cell grown to a radius of three: a circle six cells across, centred across the field. Counts are even (Grid.md D26),
 * so six cells stand on the centre line symmetrically. **It stands at the top, one row above it** (his, the same day:
 * *"move the sphere to the top and leave only one row above it"*): its first row is the field's second.
 *
 * **The controls are sections** (C7, his, 2026-09-30: *"instead of drop down for eyes pupils and all of that I want
 * individual cards of controls for each of that with heading. So even the size and shade should have the heading of
 * body … like we did for projects and case studies or work"*): each is its heading's row, the portfolio's section
 * label, and its cards under it, each card as many rows as it has lines — never stretched to the room it stands in
 * (his, the same day: *"you are just allowing the components to take up the full height and full width and there is
 * no spacing respected"*).
 *
 * **The body** is the card under the circle (his: *"a card that takes up four columns and two rows"*), its heading on
 * the row between them. **The face's sections flow down the room to the circle's left, the body's own — its shape,
 * colour, texture and rest — down the room to its right** (C11, his, 2026-09-30: *"the controls … are all over the
 * place … reorganize them"*: the right room held the versions too), each room a column of air from the circle, and as
 * many columns of cards as it holds. What a room cannot hold goes to its next page, since nothing on the grid scrolls
 * (Grid.md D5), and the room's pager takes the field's last row under it. **The draft's bar** is on that row too, under
 * the circle, between the two pagers: the character's draft and versions are the whole character's, not a section of
 * it. Where the body's card and the bar do not both fit under the circle, the body goes first in the right room rather
 * than the circle shrinking. A field with no room beside the circle — a tablet stood up, a phone — has one room under
 * it, where the body and the face flow in that order, the bar on the row above its pager.
 */

/** The circle's radius, in cells (his). */
export const STAGE_RADIUS = 3;
/** The body's card, across and down (his). */
export const CARD_COLS = 4;
export const CARD_ROWS = 2;
/** A column of cards is at least this wide, so a slider has room between its label and its value. */
const COLUMN_MIN_PX = 320;
/** And at most this many cells across. */
export const COLUMN_MAX = 6;
/** Cells of air between the circle and the rooms beside it, and between two columns of cards. */
export const AIR = 1;
/** The pager, across at most: the page before, where it is, the next. */
const PAGER_MAX = 6;

export type StudioBox = { col: number; row: number; colSpan: number; rowSpan: number };

/** Where sections flow: its columns, side by side from its first row, `rows` deep, and its pager's row under them. */
export type Room = { columns: { col: number; colSpan: number }[]; row: number; rows: number; pager: StudioBox };

export type StudioLayout = {
  stage: StudioBox;
  /** The body's heading and its card under the circle; null where the body flows with the rest. */
  body: { label: StudioBox; card: StudioBox } | null;
  /** The face's room, to the circle's left; on a narrow field the one room under it, which everything flows into. */
  face: Room;
  /** The body's room, to the circle's right: its shape, colour, texture and rest; null on a narrow field. */
  looks: Room | null;
  /** The draft's bar: the versions, the draft's state, its name and Publish, one row under the circle. */
  draft: StudioBox;
};

const even = (n: number) => n - (n % 2);

/** The cells `px` takes on this field: the least whole number of cells and their gutters as wide. */
const cellsFor = (px: number, cell: number, gap: number) => Math.ceil((px + gap) / (cell + gap));

/** Columns of cards in `room` cells across: as many as are `least` wide with air between, each at most `COLUMN_MAX`. */
function columnsIn(room: number, least: number) {
  const count = Math.max(1, Math.floor((room + AIR) / (least + AIR)));
  return { count, width: Math.min(COLUMN_MAX, Math.floor((room + AIR) / count) - AIR) };
}

function pagerUnder(columns: Room["columns"], row: number): StudioBox {
  const first = columns[0]!.col;
  const last = columns.at(-1)!;
  const across = last.col + last.colSpan - first;
  const width = Math.min(PAGER_MAX, across);
  return { col: first + Math.floor((across - width) / 2), row, colSpan: width, rowSpan: 1 };
}

export function studioLayout(cols: number, rows: number, cell: number, gap: number): StudioLayout {
  const least = Math.min(cols, cellsFor(COLUMN_MIN_PX, cell, gap));
  // The rows beside the circle: from its first to the field's last but one; the last is the pagers'.
  const beside = Math.max(1, rows - 2);

  // Wide: the circle, a column of air each side of it, and a room of cards beyond each; the draft's bar on the last row
  // under it. The biggest circle that leaves them — six across, else four — with the body under it where the body and
  // the bar both fit there, else with the body first in the right room; failing all, the biggest that leaves the rooms.
  const wide = (span: number, withBody: boolean): StudioLayout => {
    const stage = { col: (cols - span) / 2 + 1, row: 2, colSpan: span, rowSpan: span };
    const { count, width } = columnsIn((cols - span) / 2 - AIR, least);
    const block = count * width + (count - 1) * AIR;
    // The columns stand against the air by the circle; what a room has over is margin at the field's edges.
    const left = Array.from({ length: count }, (_, i) => ({ col: stage.col - AIR - block + i * (width + AIR), colSpan: width }));
    const right = Array.from({ length: count }, (_, i) => ({ col: stage.col + span + AIR + i * (width + AIR), colSpan: width }));
    const across = Math.min(CARD_COLS, span);
    const col = stage.col + (span - across) / 2;
    return {
      stage,
      body: withBody
        ? { label: { col, row: 2 + span, colSpan: across, rowSpan: 1 }, card: { col, row: 3 + span, colSpan: across, rowSpan: CARD_ROWS } }
        : null,
      face: { columns: left, row: 2, rows: beside, pager: pagerUnder(left, rows) },
      looks: { columns: right, row: 2, rows: beside, pager: pagerUnder(right, rows) },
      draft: { col: stage.col, row: rows, colSpan: span, rowSpan: 1 },
    };
  };
  const roomBeside = (span: number) => (cols - span) / 2 - AIR >= least;
  // Under the circle: the row between it and the body's heading is the heading's; the body's card; the bar's row.
  const under = (span: number, withBody: boolean) => 1 + span + (withBody ? 1 + CARD_ROWS : 0) + 1 <= rows;
  for (const want of [2 * STAGE_RADIUS, 2 * STAGE_RADIUS - 2]) {
    for (const withBody of [true, false]) {
      if (want <= cols && under(want, withBody) && roomBeside(want)) return wide(want, withBody);
    }
  }
  for (const want of [2 * STAGE_RADIUS, 2 * STAGE_RADIUS - 2]) {
    const span = Math.max(2, even(Math.min(want, cols, rows - 2)));
    if (roomBeside(span)) return wide(span, false);
  }

  // Narrow: the circle, and one column of cards under it as wide as the circle, at least two rows of it; the bar's row
  // and the pager's under that.
  const span = Math.max(2, even(Math.min(2 * STAGE_RADIUS, cols, rows - 5)));
  const stage = { col: (cols - span) / 2 + 1, row: 2, colSpan: span, rowSpan: span };
  const width = Math.min(cols, Math.max(span, least), COLUMN_MAX);
  const column = [{ col: Math.floor((cols - width) / 2) + 1, colSpan: width }];
  return {
    stage,
    body: null,
    face: { columns: column, row: 2 + span, rows: Math.max(1, rows - 3 - span), pager: pagerUnder(column, rows) },
    looks: null,
    draft: { col: column[0]!.col, row: rows - 1, colSpan: width, rowSpan: 1 },
  };
}

// ── the flow ───────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * A section as the flow sees it: its id, and its cards — each so many lines, a line a row — in order under its heading.
 * A card that may `split` can go on in the next column, its heading over it again; one that may not goes whole.
 */
export type FlowSection = { id: string; blocks: { key: string; lines: number; split: boolean }[] };

export type FlowPiece =
  | { kind: "label"; section: string; part: number; box: StudioBox }
  | { kind: "block"; section: string; key: string; from: number; to: number; box: StudioBox };

/**
 * `sections` in `room`, page by page: down each column in turn, in order, a section's heading on the row over its
 * first card. A section goes to the next column whole where it fits whole there; only one taller than a whole column
 * is split, at a line, and its heading is over each part. A page is the room's columns; what they do not hold is the
 * next page's.
 */
export function flow(sections: FlowSection[], room: Room): FlowPiece[][] {
  const pages: FlowPiece[][] = [[]];
  if (room.rows < 2 || !room.columns.length) return pages;
  let column = 0;
  let used = 0;
  const next = () => {
    column += 1;
    used = 0;
    if (column >= room.columns.length) {
      column = 0;
      pages.push([]);
    }
  };
  const box = (rows: number): StudioBox => {
    const c = room.columns[column]!;
    const at = { col: c.col, colSpan: c.colSpan, row: room.row + used, rowSpan: rows };
    used += rows;
    return at;
  };
  for (const section of sections) {
    const whole = 1 + section.blocks.reduce((sum, b) => sum + b.lines, 0);
    if (used > 0 && used + whole > room.rows) next();
    let part = 0;
    const label = () => pages.at(-1)!.push({ kind: "label", section: section.id, part: part++, box: box(1) });
    label();
    for (const block of section.blocks) {
      let from = 0;
      while (from < block.lines) {
        const left = room.rows - used;
        const want = block.lines - from;
        if (want <= left) {
          pages.at(-1)!.push({ kind: "block", section: section.id, key: block.key, from, to: block.lines, box: box(want) });
          from = block.lines;
        } else if (left > 0 && (block.split || used === 1)) {
          // A card that may split, or one taller than a column under its heading: as many lines as are left here.
          pages.at(-1)!.push({ kind: "block", section: section.id, key: block.key, from, to: from + left, box: box(left) });
          from += left;
          next();
          label();
        } else {
          next();
          label();
        }
      }
    }
  }
  return pages;
}

/** The circle's diameter in px: its cells and the gutters between them. */
export const stageDiameter = (span: number, cell: number, gap: number) => span * cell + (span - 1) * gap;

/**
 * The cells of the field the circle overlaps, by their centres in px from the box's top-left: the ones it takes the place
 * of (his, 2026-09-30: "I just don't want to see those the main circle will overlap"). A cell is its circle (Grid.md
 * D40), so it is overlapped when the two circles meet at all. The ones in the box's corners it misses stay on the field
 * (his: "the corners circles for which there is no effect from the circle. I need them back"); six across, those are the
 * four corner cells.
 */
export function coveredCells(span: number, cell: number, gap: number): { x: number; y: number }[] {
  const pitch = cell + gap;
  const centre = stageDiameter(span, cell, gap) / 2;
  const reach = centre + cell / 2;
  const out: { x: number; y: number }[] = [];
  for (let row = 0; row < span; row++) {
    for (let col = 0; col < span; col++) {
      const x = col * pitch + cell / 2;
      const y = row * pitch + cell / 2;
      if (Math.hypot(x - centre, y - centre) < reach) out.push({ x, y });
    }
  }
  return out;
}
