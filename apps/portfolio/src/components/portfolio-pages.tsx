"use client";

import * as React from "react";

import { countFor, DEFAULT_GRID_CONFIG, specFor } from "@no-origins/ui/components/grid";
import { GridPages } from "@no-origins/ui/components/grid-pages";
import { GRID_REFERENCE_BOX } from "@no-origins/ui/components/grid-frame";
import type { GridLayout } from "@no-origins/ui/lib/grid-layout";

import type { PortfolioField, PortfolioPage } from "@/content";
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
 * The portfolio on the grid. The grid is the viewport (Grid.md D3, D11): nothing here scrolls, and what does not fit
 * a screen is on the next page — scrolling up turns it, so do the pager's ↑ ↓ on the bottom row and ← → (D27). The
 * page's sections are arranged on the field the grid reports, so every coordinate is honoured as written.
 */
export function PortfolioPages({ page }: { page: PortfolioPage }) {
  const [field, setField] = React.useState<PortfolioField | null>(null);
  const layout = React.useMemo<GridLayout>(() => {
    const on = field ?? FIRST_FIELD;
    return { shapes: { [on.bp]: { cols: on.cols, rows: on.rows } }, authored: { [on.bp]: arrange(page, on) } };
  }, [page, field]);
  const items = React.useMemo(() => new Map(page.sections.flatMap((s) => s.items).map((item) => [item.id, item])), [page]);

  return (
    <GridPages
      layout={layout}
      overlay
      onMetrics={(m) =>
        setField((prev) => (prev && prev.cols === m.cols && prev.rows === m.rows && prev.bp === m.bp ? prev : { cols: m.cols, rows: m.rows, bp: m.bp }))
      }
      renderItem={(placed) => items.get(placed.id)?.render(placed) ?? null}
    />
  );
}
