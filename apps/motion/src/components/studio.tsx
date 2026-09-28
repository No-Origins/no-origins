"use client";

import * as React from "react";

import { countFor, DEFAULT_GRID_CONFIG, GRID_REFERENCE_BOX, PAGER_CELLS, pagerWidth, specFor, type GridBreakpoint } from "@no-origins/ui/components/grid";
import { GridPages } from "@no-origins/ui/components/grid-pages";
import { numberedPagerBar } from "@no-origins/ui/components/grid-pager";
import type { GridLayout, GridLayoutItem } from "@no-origins/ui/lib/grid-layout";

import { FAMILIES, familyById } from "@/content/families";
import { Header, Presets, Settings, Specimen, Timeline, Tokens } from "@/components/jigs";
import { Stage } from "@/components/stage";
import { StudioProvider } from "@/components/studio-context";
import { parseItemId, studioPages, type StudioField } from "@/lib/layout";

/**
 * The motion studio (Motion.md): the grid is the viewport, each family of the design system's motion is a page, and
 * the numbered pager turns between them (Grid.md D36). The grid loads every page with its own loader — page 1 in the
 * intro, the rest as the turn puts them on the field — and wears its own pointer, as on the portfolio (D31, D34, D48):
 * the studio's frame is the system's motion too.
 */

type Field = StudioField & { bp: GridBreakpoint };

/** The field assumed before the grid has measured itself: the xl reference box, bare — the studio has no chrome. */
const XL = GRID_REFERENCE_BOX.xl;
const XL_SPEC = specFor(DEFAULT_GRID_CONFIG, "xl");
const XL_COLS = countFor(XL.width, XL_SPEC.cell, XL_SPEC.gap);
const FIRST_FIELD: Field = {
  bp: "xl",
  cols: XL_COLS,
  rows: countFor(XL.height, XL_SPEC.cell, XL_SPEC.gap),
  pager: pagerWidth(XL_SPEC.pager ?? PAGER_CELLS, XL_COLS),
};

function renderPlaced(placed: GridLayoutItem) {
  const { family: id, part } = parseItemId(placed.id);
  const family = familyById(id);
  if (!family) return null;
  switch (part) {
    case "header":
      return <Header family={family} index={FAMILIES.indexOf(family)} />;
    case "stage":
      return <Stage family={family} cols={placed.colSpan} rows={placed.rowSpan} />;
    case "timeline":
      return <Timeline family={family} />;
    case "specimen":
      return <Specimen family={family} />;
    case "presets":
      return <Presets family={family} />;
    case "tokens":
      return <Tokens family={family} />;
    case "settings":
      return <Settings family={family} />;
  }
}

export function Studio() {
  const [field, setField] = React.useState<Field | null>(null);
  const layout = React.useMemo<GridLayout>(() => {
    const on = field ?? FIRST_FIELD;
    return {
      shapes: { [on.bp]: { cols: on.cols, rows: on.rows } },
      authored: { [on.bp]: studioPages(FAMILIES, on) },
      bar: numberedPagerBar(on.pager),
    };
  }, [field]);

  return (
    <StudioProvider>
      <GridPages
        layout={layout}
        overlay
        intro
        cursor
        onMetrics={(m) =>
          setField((prev) =>
            prev && prev.cols === m.cols && prev.rows === m.rows && prev.bp === m.bp && prev.pager === m.pager
              ? prev
              : { cols: m.cols, rows: m.rows, bp: m.bp, pager: m.pager },
          )
        }
        renderItem={renderPlaced}
      />
    </StudioProvider>
  );
}
