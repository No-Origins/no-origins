/** Motion.md M15: every box is on the measured field; no authored column counts or scrolling. */
export type StudioBox = { col: number; row: number; colSpan: number; rowSpan: number };
const box = (col: number, row: number, colSpan: number, rowSpan: number): StudioBox => ({ col, row, colSpan, rowSpan });

/** A select in the head is three cells, and a button one (his, 2026-09-29). */
const PICK = 3;

/** A jig is six cells wide at the most, anywhere (his, 2026-10-01). */
export const JIG_MAX = 6;
/** A jig column is never narrower than four cells: a control's label, its value and its unit need them. */
const JIG_MIN = 4;
/** The timeline is ten cells wide at the most (his, 2026-10-01). */
export const TIMELINE_MAX = 10;

/**
 * The studio's boxes on a field `cols` × `rows`. **The stage is always at the field's centre** (his, 2026-10-01: "the
 * component should always be in the center"), so on a wide field the jigs stand in two columns either side of it, each
 * as wide as the room left — four cells to six — and the timeline under it, ten cells at the most, centred too. Where
 * the stage would be narrower than ten, it takes the room before the jigs grow past four. Narrow fields visit one
 * workspace at a time, the jig six cells at the most and centred.
 *
 * The Agents page picks twice (Motion.md M24): the action, then the agent it is previewed on, each a select of three
 * cells in the head, `picks` 2 — `second` is the action's, where `preset` is the agent's. On a wide field under sixteen
 * cells the studio's bar gives one of its four for it; on a narrow one the two take a row of their own.
 */
export function studioLayout(cols: number, rows: number, picks: 1 | 2 = 1) {
  const wide = cols >= 14 && rows >= 8;
  if (wide) {
    const side = Math.min(JIG_MAX, Math.max(JIG_MIN, Math.floor((cols - TIMELINE_MAX) / 2)));
    const stage = cols - 2 * side;
    const timeline = Math.min(TIMELINE_MAX, stage);
    const transport = 2;
    const nav = picks === 2 && cols < 16 ? 3 : 4;
    const extra = picks === 2 ? PICK : 0;
    return {
      wide,
      nav: box(1, 1, nav, 1),
      family: box(nav + 1, 1, PICK, 1),
      second: picks === 2 ? box(nav + 1 + PICK, 1, PICK, 1) : null,
      preset: box(nav + 1 + PICK + extra, 1, PICK, 1),
      reset: box(nav + 1 + 2 * PICK + extra, 1, 1, 1),
      copy: box(nav + 2 + 2 * PICK + extra, 1, 1, 1),
      chooser: null,
      preview: box(side + 1, 2, stage, rows - 1 - transport),
      timeline: box(side + 1 + Math.floor((stage - timeline) / 2), rows - transport + 1, timeline, transport),
      work: null,
      /** The jigs' two columns, the left and the right of the stage, from under the head to the field's foot. */
      columns: [box(1, 2, side, rows - 1), box(cols - side + 1, 2, side, rows - 1)] as const,
    };
  }
  const pick = cols - PICK + 1;
  const timelineRows = rows >= 8 ? 2 : 1;
  const end = rows - timelineRows;
  const work = Math.min(JIG_MAX, cols);
  const timeline = Math.min(TIMELINE_MAX, cols);
  // The head's rows: the bar and the family; then the view, the preset and the buttons — and the two picks before them.
  const head = picks === 2 ? 3 : 2;
  const half = Math.floor(cols / 2);
  const choice = picks === 2 ? cols - 2 : Math.floor((cols - 2) / 2);
  return {
    wide: false,
    nav: box(1, 1, pick - 1, 1),
    family: box(pick, 1, PICK, 1),
    second: picks === 2 ? box(1, 2, half, 1) : null,
    preset: picks === 2 ? box(half + 1, 2, cols - half, 1) : box(choice + 1, 2, cols - choice - 2, 1),
    reset: box(cols - 1, head, 1, 1),
    copy: box(cols, head, 1, 1),
    chooser: box(1, head, choice, 1),
    preview: box(1, head + 1, cols, Math.max(1, end - head)),
    timeline: box(1 + Math.floor((cols - timeline) / 2), end + 1, timeline, timelineRows),
    work: box(1 + Math.floor((cols - work) / 2), head + 1, work, Math.max(1, end - head)),
    columns: null,
  };
}
