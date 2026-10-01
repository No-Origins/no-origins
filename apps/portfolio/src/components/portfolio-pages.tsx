"use client";

import * as React from "react";

import { countFor, DEFAULT_GRID_CONFIG, Grid, GRID_REFERENCE_BOX, GridItem, specFor } from "@no-origins/ui/components/grid";
import { useReadingFocus } from "@no-origins/ui/hooks/use-reading-focus";
import type { GridLayoutItem } from "@no-origins/ui/lib/grid-layout";

import type { PortfolioField, PortfolioPage } from "@/content";
import { INTRO_ACTIONS } from "@/content/actions";
import { INTRO_CAST } from "@/content/intro";
import { arrange } from "@/lib/arrange";

/** The field assumed before the grid has measured itself: the xl reference box, bare — the portfolio has no chrome above the grid. */
const XL = GRID_REFERENCE_BOX.xl;
const XL_SPEC = specFor(DEFAULT_GRID_CONFIG, "xl");
const FIRST_FIELD: PortfolioField = {
  bp: "xl",
  cols: countFor(XL.width, XL_SPEC.cell, XL_SPEC.gap),
  rows: countFor(XL.height, XL_SPEC.cell, XL_SPEC.gap),
};

/**
 * The portfolio on the grid, ONE page (Portfolio.md P15, his, 2026-09-27: "We don't need multiple pages in portfolio
 * now. Remove pagination navbar"): a `Grid`, not a `GridPages`, so there is no pager's bar, no turn and nothing to
 * turn it — the scroll and a finger do nothing, and the arrow keys only ever moved focus (Grid.md D45). The grid is the
 * viewport (Grid.md D3, D11) and nothing here scrolls. The page is arranged on the field the grid reports, so every
 * coordinate is honoured as written: the first screen as it was, and the pieces of the pages that went in the room it
 * leaves (`arrange`). It opens with the grid's intro (Grid.md D50, P23, version 7, his, 2026-10-01): the six agents
 * (`INTRO_CAST`) stand side by side in a row on the field's middle, in a random order, and Bali, Kino and Mira bounce,
 * each at its own random times, for two seconds; then each jumps or dives, at random, to the cell at the centre of the
 * boxes it opens — every item names its agent (`by`) — a small ripple of lit cells spreading round it as it lands;
 * then it dives into its nest and its boxes fade in. They bounce, jump and dive as he published those actions
 * (`INTRO_ACTIONS`). The pointer is the grid's violet ring, and the cell under it lights (D34, D43).
 *
 * **Nothing wakes after it** (P16 withdrawn, his, 2026-10-01: "after they load, they uh, glow up. So I don't think we
 * need that anymore"): a box is in its own colours as soon as it fades in. Until then every box came onto the field
 * faded into the page and brightened as a front from the avatar crossed it, once the intro was over.
 */
export function PortfolioPages({ page }: { page: PortfolioPage }) {
  const [field, setField] = React.useState<PortfolioField | null>(null);
  // Where the field sits in the grid's box, for what is drawn behind it (the tagline, P4): the grid centres the field
  // and leaves the rest as margin (Grid.md D14).
  const [frame, setFrame] = React.useState<Frame | null>(null);
  const arranged = React.useMemo(() => arrange(page, field ?? FIRST_FIELD), [page, field]);
  const items = React.useMemo(() => new Map(page.sections.flatMap((s) => s.items).map((item) => [item.id, item])), [page]);
  const backdrop = arranged.backdrop;
  // Tab and the arrows move focus in reading order (Grid.md D45), over the backdrop's handle as well as the grid: it
  // comes first in the document and last on the screen.
  const scope = React.useRef<HTMLDivElement>(null);
  useReadingFocus(scope);
  // The grid's intro (Grid.md D50), as its root carries it: "agent" while the agents play and the page is held back but
  // for the boxes they open, "reveal" as the grid lets go of it, over `--grid-intro-reveal`. The tagline behind the grid is held with the boxes, so it
  // carries the same. Assumed held until the grid says otherwise, so it never shows a frame early.
  const grid = React.useRef<HTMLDivElement>(null);
  const [intro, setIntro] = React.useState<{ phase: string | null; reveal: string }>({ phase: "agent", reveal: "" });
  React.useLayoutEffect(() => {
    const el = grid.current;
    if (!el) return;
    const read = () => setIntro({ phase: el.getAttribute("data-intro"), reveal: el.style.getPropertyValue("--grid-intro-reveal") });
    read();
    const watch = new MutationObserver(read);
    watch.observe(el, { attributes: true, attributeFilter: ["data-intro"] });
    return () => watch.disconnect();
  }, []);

  return (
    <div ref={scope} className="relative">
      {/* Before the grid, so the field's dashes and its boxes are drawn over it. Nothing in it takes the pointer but
          what asks for it (the tagline's handle). It carries the field's cell and gutter, so what it holds can be laid
          out on the cells it covers. */}
      {backdrop && frame ? (
        <div
          className="pointer-events-none absolute"
          data-intro-held={intro.phase ?? undefined}
          style={
            {
              ...place(backdrop, frame),
              "--grid-intro-reveal": intro.reveal || undefined,
              "--grid-cell": `${frame.cell}px`,
              "--grid-gap": `${frame.gap}px`,
            } as React.CSSProperties
          }
        >
          {items.get(backdrop.id)?.render(backdrop)}
        </div>
      ) : null}
      <Grid
        ref={grid}
        overlay
        intro
        introAgents={INTRO_CAST}
        introActions={INTRO_ACTIONS}
        cursor
        onMetrics={(m) => {
          setField((prev) => (prev && prev.cols === m.cols && prev.rows === m.rows && prev.bp === m.bp ? prev : { cols: m.cols, rows: m.rows, bp: m.bp }));
          setFrame((prev) =>
            prev && prev.boxW === m.boxW && prev.boxH === m.boxH && prev.gridW === m.gridW && prev.gridH === m.gridH && prev.cell === m.cell && prev.gap === m.gap
              ? prev
              : { boxW: m.boxW, boxH: m.boxH, gridW: m.gridW, gridH: m.gridH, cell: m.cell, gap: m.gap },
          );
        }}
      >
        {/* Only once the grid has measured: the first field is a guess, and a box placed on it would flash in the wrong
            cells for a frame (GridPages waited the same way). */}
        {field
          ? arranged.items.map((placed) => (
              <GridItem
                key={placed.id}
                col={placed.col}
                row={placed.row}
                colSpan={placed.colSpan}
                rowSpan={placed.rowSpan}
                data-box={placed.id}
                data-intro-by={items.get(placed.id)?.by}
                className="relative select-none"
              >
                {items.get(placed.id)?.render(placed)}
              </GridItem>
            ))
          : null}
      </Grid>
    </div>
  );
}

/** The grid's box and field in px, and its cell and gutter. */
type Frame = { boxW: number; boxH: number; gridW: number; gridH: number; cell: number; gap: number };

/** A rect of cells on the field, in px from the grid's box: the field is centred in it (Grid.md D14). */
function place(rect: GridLayoutItem, { boxW, boxH, gridW, gridH, cell, gap }: Frame): React.CSSProperties {
  const pitch = cell + gap;
  return {
    left: (boxW - gridW) / 2 + (rect.col - 1) * pitch,
    top: (boxH - gridH) / 2 + (rect.row - 1) * pitch,
    width: rect.colSpan * pitch - gap,
    height: rect.rowSpan * pitch - gap,
  };
}
