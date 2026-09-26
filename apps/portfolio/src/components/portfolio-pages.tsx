"use client";

import * as React from "react";

import { countFor, DEFAULT_GRID_CONFIG, GRID_REFERENCE_BOX, PAGER_CELLS, pagerWidth, specFor } from "@no-origins/ui/components/grid";
import { GridPages } from "@no-origins/ui/components/grid-pages";
import { numberedPagerBar } from "@no-origins/ui/components/grid-pager";
import type { GridLayout } from "@no-origins/ui/lib/grid-layout";

import type { PortfolioField, PortfolioPage } from "@/content";
import { arrange } from "@/lib/arrange";

/** The field and the width of its pager's bar (Grid.md D29), which the numbered bar is built on. */
type Field = PortfolioField & { pager: number };

/** The field assumed before the grid has measured itself: the xl reference box, bare — the portfolio has no chrome above the grid. */
const XL = GRID_REFERENCE_BOX.xl;
const XL_SPEC = specFor(DEFAULT_GRID_CONFIG, "xl");
const XL_COLS = countFor(XL.width, XL_SPEC.cell, XL_SPEC.gap);
const FIRST_FIELD: Field = {
  bp: "xl",
  cols: XL_COLS,
  rows: countFor(XL.height, XL_SPEC.cell, XL_SPEC.gap),
  pager: pagerWidth(XL_SPEC.pager ?? PAGER_CELLS, XL_COLS),
};

/**
 * The portfolio on the grid. The grid is the viewport (Grid.md D3, D11): nothing here scrolls, and what does not fit
 * a screen is on the next page — scrolling up turns it, so do the pager's ↑ ↓ on the bottom row and ← → (D27). The
 * page's sections are arranged on the field the grid reports, so every coordinate is honoured as written. It opens
 * with the grid's intro (Grid.md D31): the grid draws itself in, and page 1 turns in once the page has loaded; and
 * every turn after runs the same drawing through the field (D32). The pointer is the grid's lime ring, and the cell
 * under it lights (D34). The bar is numbered (Portfolio.md P14): back on its first cell, forward on its last, the page
 * numbers between.
 */
export function PortfolioPages({ page }: { page: PortfolioPage }) {
  const [field, setField] = React.useState<Field | null>(null);
  const layout = React.useMemo<GridLayout>(() => {
    const on = field ?? FIRST_FIELD;
    return {
      shapes: { [on.bp]: { cols: on.cols, rows: on.rows } },
      authored: { [on.bp]: arrange(page, on) },
      bar: numberedPagerBar(on.pager),
    };
  }, [page, field]);
  const items = React.useMemo(() => new Map(page.sections.flatMap((s) => s.items).map((item) => [item.id, item])), [page]);

  return (
    <GridPages
      layout={layout}
      overlay
      intro
      ripple
      cursor
      onMetrics={(m) =>
        setField((prev) =>
          prev && prev.cols === m.cols && prev.rows === m.rows && prev.bp === m.bp && prev.pager === m.pager
            ? prev
            : { cols: m.cols, rows: m.rows, bp: m.bp, pager: m.pager },
        )
      }
      renderItem={(placed) => items.get(placed.id)?.render(placed) ?? null}
    />
  );
}
