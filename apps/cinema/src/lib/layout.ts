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

/**
 * The home page's pages (Cinema.md F11; the placing mine): the studio's name on the first, then each section, a heading
 * row with its cards under it, side by side and centred, a cell of air between rows and between sections, at most
 * twenty cells across. What does not fit above the pager's row (Grid.md D27) goes on the next page (D5), under its
 * section's heading again; a heading never ends a page without a row of its cards.
 */
export type HomeItem = Rect & { id: string };
export const HOME_CARD = { cols: 6, rows: 3 };
const HOME_WIDEST = 20;

export function homePages(cols: number, rows: number, sections: readonly { id: string; cards: readonly string[] }[]): HomeItem[][] {
  const width = Math.min(cols, HOME_WIDEST);
  const start = Math.floor((cols - width) / 2) + 1;
  const card = Math.min(width, HOME_CARD.cols);
  const across = Math.max(1, Math.floor((width + 1) / (card + 1)));
  const room = Math.max(1, rows - 1);
  const pages: HomeItem[][] = [[{ id: "title", col: start, row: 1, colSpan: width, rowSpan: 2 }]];
  let row = 4;
  for (const section of sections) {
    // Its cards a row at a time; a section with none has one row, to say so.
    const lines = section.cards.length
      ? Array.from({ length: Math.ceil(section.cards.length / across) }, (_, i) => section.cards.slice(i * across, (i + 1) * across))
      : [[]];
    let headed = false;
    for (const line of lines) {
      const tall = line.length ? HOME_CARD.rows : 1;
      // A new page takes whatever comes, so a field too short for a card still shows it, cut off, and the pages end.
      if (row + (headed ? 0 : 1) + tall - 1 > room && row > 2) {
        pages.push([]);
        row = 2;
        headed = false;
      }
      const page = pages.at(-1)!;
      if (!headed) {
        page.push({ id: `heading:${section.id}:${pages.length}`, col: start, row, colSpan: width, rowSpan: 1 });
        row += 1;
        headed = true;
      }
      if (!line.length) page.push({ id: `empty:${section.id}`, col: start, row, colSpan: width, rowSpan: 1 });
      const first = start + Math.floor((width - (line.length * card + (line.length - 1))) / 2);
      line.forEach((id, i) => page.push({ id: `card:${section.id}:${id}`, col: first + i * (card + 1), row, colSpan: card, rowSpan: tall }));
      row += tall + 1;
    }
  }
  return pages;
}
