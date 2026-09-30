/** Motion.md M15: every box is on the measured field; no authored column counts or scrolling. */
export type StudioBox = { col: number; row: number; colSpan: number; rowSpan: number };
const box = (col: number, row: number, colSpan: number, rowSpan: number): StudioBox => ({ col, row, colSpan, rowSpan });

/** A select in the head is three cells, and a button one (his, 2026-09-29). */
const PICK = 3;

/**
 * Compact instruments beside the stage; narrow fields visit one workspace at a time. A family built from states (Motion.md
 * M19) asks for a taller transport, `lanes`, so its rows' lanes stand under the playhead: as many rows of the field as
 * leave the stage three, two to five.
 */
export function studioLayout(cols: number, rows: number, actions = true, lanes = false) {
  const wide = cols >= 12 && rows >= 8;
  if (wide) {
    // Two columns of controls where they fit, with only the grid gutter between instruments and stage.
    const fullToolbar = cols >= 16;
    const rail = fullToolbar ? 7 : 5;
    const stage = rail + 1;
    const start = fullToolbar ? 2 : 3;
    const upper = rows - start - 3;
    const transport = lanes ? Math.max(2, Math.min(5, rows - start - 2)) : 2;
    return {
      wide, mosaic: fullToolbar && rows >= 10, toggleOut: false, previewLabel: false, compact: fullToolbar,
      nav: box(1, 1, 4, 1),
      family: fullToolbar ? box(5, 1, 3, 1) : box(stage, 1, 3, 1),
      heading: box(1, 2, rail, 1),
      toggle: box(1, 2, 1, 1),
      reset: box(fullToolbar ? 11 : stage + 3, fullToolbar ? 1 : 2, 1, 1),
      copy: box(fullToolbar ? 12 : stage + 4, fullToolbar ? 1 : 2, 1, 1),
      preset: fullToolbar ? box(8, 1, 3, 1) : box(stage, 2, 3, 1),
      chooser: box(1, 2, rail, 1),
      preview: box(stage, start, cols - stage + 1, rows - start - transport + 1),
      timeline: box(stage, rows - transport + 1, cols - stage + 1, transport),
      work: box(1, fullToolbar && rows >= 10 ? start : 3, rail, rows - (fullToolbar && rows >= 10 ? start : 3) + 1),
      jigs: [box(1, start, rail, upper), box(1, rows - 3, rail, 4)],
    };
  }
  const pick = cols - PICK + 1;
  const choice = Math.floor((cols - (actions ? 2 : 0)) / 2);
  const timelineRows = rows >= 8 ? 2 : 1;
  const end = rows - timelineRows;
  return {
    wide: false, mosaic: false, toggleOut: false, previewLabel: false, compact: true,
    nav: box(1, 1, pick - 1, 1),
    family: box(pick, 1, PICK, 1),
    heading: box(1, 2, cols, 1),
    toggle: box(1, 2, 1, 1),
    reset: box(cols - 1, 2, 1, 1),
    copy: box(cols, 2, 1, 1),
    preset: box(choice + 1, 2, cols - choice - 2, 1),
    chooser: box(1, 2, actions ? choice : cols, 1),
    preview: box(1, 3, cols, Math.max(1, end - 2)),
    timeline: box(1, end + 1, cols, timelineRows),
    work: box(1, 3, cols, Math.max(1, end - 2)),
    jigs: [],
  };
}
