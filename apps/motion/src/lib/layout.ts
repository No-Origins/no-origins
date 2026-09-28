import type { GridPage, GridLayoutItem } from "@no-origins/ui/lib/grid-layout";

import type { Family } from "@/content/families";

/**
 * Where the studio's slots go on a field (Motion.md M5, his: "I want the jigs to be part of the grid. And we only want
 * to see the output in a section center of the grid"). One page per family. On a field wide enough for a stage
 * between two columns of jigs, the centre columns are the stage between a one-row header and a one-row timeline (M6),
 * and the sides are the jigs:
 * the specimen over the presets on the left, the tokens over the settings on the right. The sides run the field's
 * full height — they clear the pager, which is the bottom row's centre (Grid.md D27) — and the stage stops a row short
 * of the bottom, above it. Narrower, the stage comes first and the jigs follow on the pages after it.
 *
 * Written on the live field, like the showcase's pages, so its coordinates are kept as they are (Grid.md D25). Every
 * page is titled with its family's label, which the pager's bar shows on the page's own cells (Grid.md D46).
 */

export type Part = "header" | "stage" | "timeline" | "specimen" | "presets" | "tokens" | "settings";
export type StudioField = { cols: number; rows: number; pager: number };

export const itemId = (family: Family, part: Part) => `${family.id}:${part}`;
export function parseItemId(id: string): { family: string; part: Part } {
  const [family, part] = id.split(":");
  return { family: family!, part: part as Part };
}

const box = (id: string, col: number, row: number, colSpan: number, rowSpan: number): GridLayoutItem => ({ id, col, row, colSpan, rowSpan });

/** The widest a side gets, and the narrowest a stage may be between two sides. */
const SIDE_MAX = 5;
const SIDE_MIN = 4;
const STAGE_MIN = 6;
/** The fewest rows a page with a stage between its jigs is laid out for; shorter goes to pages. */
const ROWS_MIN = 8;

export function studioPages(families: readonly Family[], field: StudioField): GridPage[] {
  const { cols, rows, pager } = field;
  const side = cols >= 2 * SIDE_MAX + STAGE_MIN ? SIDE_MAX : SIDE_MIN;
  // The sides must clear the pager's cells on the bottom row: they are the bottom row's centre, `pager` wide.
  const clearOfPager = side <= Math.floor((cols - pager) / 2);
  const wide = cols - 2 * side >= STAGE_MIN && rows >= ROWS_MIN && clearOfPager;
  return families.flatMap((family) => (wide ? widePage(family, cols, rows, side) : narrowPages(family, cols, rows)));
}

function widePage(family: Family, cols: number, rows: number, side: number): GridPage[] {
  const stageCols = cols - 2 * side;
  // The specimen's jig holds its options only since the timeline took the playback (Motion.md M6): four rows hold a
  // family's, and the presets, whose reasons run to several lines, take the rest.
  const left = 4;
  const settings = rows >= 12 ? 5 : 4;
  const right = side + stageCols + 1;
  return [
    {
      id: family.id,
      title: family.label,
      items: [
        box(itemId(family, "specimen"), 1, 1, side, left),
        box(itemId(family, "presets"), 1, 1 + left, side, rows - left),
        box(itemId(family, "header"), side + 1, 1, stageCols, 1),
        box(itemId(family, "stage"), side + 1, 2, stageCols, rows - 3),
        box(itemId(family, "timeline"), side + 1, rows - 1, stageCols, 1),
        box(itemId(family, "tokens"), right, 1, side, rows - settings),
        box(itemId(family, "settings"), right, 1 + rows - settings, side, settings),
      ],
    },
  ];
}

/**
 * A field too narrow or short for three columns: the header, the stage and the timeline, then the specimen and the presets, then
 * the tokens and the settings — each page above the pager's row. On a phone's six columns the timeline is two rows: its
 * controls take a line of their own over the slider.
 */
function narrowPages(family: Family, cols: number, rows: number): GridPage[] {
  const room = Math.max(2, rows - 1);
  // The specimen's options fit five rows; the presets take the rest.
  const half = Math.min(5, Math.ceil(room / 2));
  const settings = Math.min(4, Math.max(2, Math.floor(room / 3)));
  const line = cols <= 6 ? 2 : 1;
  return [
    {
      id: `${family.id}`,
      title: family.label,
      items: [
        box(itemId(family, "header"), 1, 1, cols, 1),
        box(itemId(family, "stage"), 1, 2, cols, Math.max(1, room - 1 - line)),
        box(itemId(family, "timeline"), 1, room - line + 1, cols, line),
      ],
    },
    { id: `${family.id}-play`, title: family.label, items: [box(itemId(family, "specimen"), 1, 1, cols, half), box(itemId(family, "presets"), 1, 1 + half, cols, room - half)] },
    { id: `${family.id}-tune`, title: family.label, items: [box(itemId(family, "tokens"), 1, 1, cols, room - settings), box(itemId(family, "settings"), 1, 1 + room - settings, cols, settings)] },
  ];
}
