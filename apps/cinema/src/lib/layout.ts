/**
 * Where the shot, its name, the bar and the jigs stand on the field (Cinema-Engine.md E1; version 2's placing, mine).
 * A studio centres what is being designed (Motion.md M15): the picture at the field's centre, its name under it and the
 * bar on the last row; the jigs in a column either side, at most six cells wide, the world's on the left and the
 * shot's (its camera, lights and cast) on the right, a cell of air between each column and the picture. On a field too
 * narrow for columns either side, the picture is on top and every jig in one column under it. Counts are even
 * (Grid.md D26), so the picture's span, even, is centred on a grid line.
 */
export type Rect = { col: number; row: number; colSpan: number; rowSpan: number };
export type StudioLayout = { picture: Rect; caption: Rect; bar: Rect; world: Rect; shot: Rect | null };

export function studioLayout(cols: number, rows: number): StudioLayout {
  if (cols >= 16) {
    const side = cols >= 26 ? 6 : cols >= 22 ? 5 : 4;
    const air = 1;
    const middle = { col: side + air + 1, colSpan: cols - 2 * (side + air) };
    return {
      picture: { ...middle, row: 1, rowSpan: rows - 2 },
      caption: { ...middle, row: rows - 1, rowSpan: 1 },
      bar: { ...middle, row: rows, rowSpan: 1 },
      world: { col: 1, row: 1, colSpan: side, rowSpan: rows },
      shot: { col: cols - side + 1, row: 1, colSpan: side, rowSpan: rows },
    };
  }
  const barRows = 1;
  const pictureRows = Math.max(3, Math.round(rows * 0.35));
  const jigRows = Math.max(1, rows - pictureRows - 1 - barRows);
  return {
    picture: { col: 1, row: 1, colSpan: cols, rowSpan: pictureRows },
    world: { col: 1, row: pictureRows + 1, colSpan: cols, rowSpan: jigRows },
    shot: null,
    caption: { col: 1, row: pictureRows + jigRows + 1, colSpan: cols, rowSpan: 1 },
    bar: { col: 1, row: rows - barRows + 1, colSpan: cols, rowSpan: barRows },
  };
}

/**
 * Where an asset's bench stands on the field (Cinema-Engine.md E1; the placing mine): the asset at the field's centre,
 * as large as the field leaves it, its name under it; its controls in a column either side, at most six cells wide, a
 * cell of air between each column and the picture. No bar: a bench has no time to play. On a field too narrow for
 * columns either side, the picture on top and the controls in one column under it.
 */
export type BenchLayout = { picture: Rect; caption: Rect; left: Rect; right: Rect | null };

export function benchLayout(cols: number, rows: number): BenchLayout {
  if (cols >= 16) {
    const side = cols >= 26 ? 6 : cols >= 22 ? 5 : 4;
    const middle = { col: side + 2, colSpan: cols - 2 * (side + 1) };
    return {
      picture: { ...middle, row: 1, rowSpan: rows - 1 },
      caption: { ...middle, row: rows, rowSpan: 1 },
      left: { col: 1, row: 1, colSpan: side, rowSpan: rows },
      right: { col: cols - side + 1, row: 1, colSpan: side, rowSpan: rows },
    };
  }
  const pictureRows = Math.max(3, Math.round(rows * 0.4));
  return {
    picture: { col: 1, row: 1, colSpan: cols, rowSpan: pictureRows },
    left: { col: 1, row: pictureRows + 1, colSpan: cols, rowSpan: Math.max(1, rows - pictureRows - 1) },
    right: null,
    caption: { col: 1, row: rows, colSpan: cols, rowSpan: 1 },
  };
}
