/**
 * Where the shot, its name and the bar stand on the field (Cinema-Engine.md E1; version 1's placing, mine). The
 * picture takes the field above the two, a column of air each side where the field is wide; the name is a row over the
 * bar; the bar, play, the time, the frame and the shot, is on the last row or two, centred. Counts are even (Grid.md
 * D26), so an even span is centred on a grid line.
 */
export type Rect = { col: number; row: number; colSpan: number; rowSpan: number };

export function studioLayout(cols: number, rows: number): { picture: Rect; caption: Rect; bar: Rect } {
  const air = cols >= 10 ? 1 : 0;
  const span = Math.min(cols, 14);
  const barRows = cols >= 10 ? 1 : 2;
  const captionRows = 1;
  const pictureRows = Math.max(1, rows - barRows - captionRows);
  const col = Math.floor((cols - span) / 2) + 1;
  return {
    picture: { col: 1 + air, row: 1, colSpan: cols - 2 * air, rowSpan: pictureRows },
    caption: { col, row: pictureRows + 1, colSpan: span, rowSpan: captionRows },
    bar: { col, row: rows - barRows + 1, colSpan: span, rowSpan: barRows },
  };
}
