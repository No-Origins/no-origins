/**
 * Where the model, its name and the tour's bar stand on the field (Home.md H3: the screen is his to design; this is
 * version 3's placing, nothing decided). The stage takes the field above the two, a column of air each side where the
 * field has room and a row of air under it where the field is tall; the name — one `hero`, a row where the field is
 * wide and two where a stop's name wraps — stands right over the bar (his: "keep it right above the player"), and the
 * bar — play, the stops, the speed and the plan — on the last row or rows, all centred. The bar's span is the room its
 * pill may take; the pill itself is as wide as its controls. Counts are even (Grid.md D26), so an even span is
 * centred on a grid line. Version 2 had the guide's card here, two rows of the stop's line and the tour's progress;
 * his, 2026-10-03: the name alone, large.
 */

export type Rect = { col: number; row: number; colSpan: number; rowSpan: number };
export type HomeLayout = { stage: Rect; caption: Rect; bar: Rect };

/** The ending is a page on the same field: a five-column Plan, its thank-you, then cell-sized destinations. */
export function farewellLayout(cols: number, rows: number, cell: number, gap: number, bar: Rect, aspect: number) {
  const planCols = Math.min(5, cols);
  // An odd five-column box is centred inside an even six-column area, without fractional grid lines.
  const planAreaCols = Math.min(planCols + 1, cols);
  const planWidth = planCols * cell + (planCols - 1) * gap;
  const textCols = Math.min(12, cols);
  const textWidth = textCols * cell + (textCols - 1) * gap;
  const textRows = textWidth >= 520 ? 2 : 4;
  const buttonCols = cols >= 8 ? 2 : Math.floor(cols / 2);
  const perRow = cols >= 8 ? 4 : 2;
  const buttonRows = Math.ceil(4 / perRow);
  const wantedPlanRows = Math.max(1, Math.round((planWidth / aspect + gap) / (cell + gap)));
  const showPlayer = wantedPlanRows + textRows + buttonRows <= bar.row - 1;
  const available = showPlayer ? bar.row - 1 : rows;
  const planRows = Math.max(1, Math.min(wantedPlanRows, available - textRows - buttonRows));
  const total = planRows + textRows + buttonRows;
  const top = Math.max(1, Math.floor((available - total) / 2) + 1);
  const buttonSpan = perRow * buttonCols;
  const buttonCol = Math.floor((cols - buttonSpan) / 2) + 1;
  return {
    stage: { col: Math.floor((cols - planAreaCols) / 2) + 1, row: top, colSpan: planAreaCols, rowSpan: planRows },
    planWidth,
    planCols,
    hero: { col: Math.floor((cols - textCols) / 2) + 1, row: top + planRows, colSpan: textCols, rowSpan: textRows },
    links: Array.from({ length: 4 }, (_, i) => ({ col: buttonCol + (i % perRow) * buttonCols, row: top + planRows + textRows + Math.floor(i / perRow), colSpan: buttonCols, rowSpan: 1 })),
    showPlayer,
  };
}

/** The bar's controls in a row take about this much, in pixels: play's three buttons, the thirteen stops, the speed and the plan. */
const BAR_ONE_ROW = 880;
const BAR_TWO_ROWS = 440;

export function homeLayout(cols: number, rows: number, cell: number, gap: number): HomeLayout {
  const air = cols >= 10 ? 1 : 0;
  const span = Math.min(cols, 14);
  const width = span * cell + (span - 1) * gap;
  const barRows = width >= BAR_ONE_ROW ? 1 : width >= BAR_TWO_ROWS ? 2 : 3;
  const captionRows = cols >= 10 ? 1 : 2;
  const breath = rows >= 10 && cols >= 10 ? 1 : 0;
  const stageRows = Math.max(1, rows - barRows - captionRows - breath);
  const col = Math.floor((cols - span) / 2) + 1;
  return {
    stage: { col: 1 + air, row: 1, colSpan: cols - 2 * air, rowSpan: stageRows },
    caption: { col, row: stageRows + breath + 1, colSpan: span, rowSpan: captionRows },
    bar: { col, row: rows - barRows + 1, colSpan: span, rowSpan: barRows },
  };
}
