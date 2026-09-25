"use client";

import * as React from "react";
import type { ReactNode } from "react";

import { countFor, DEFAULT_GRID_CONFIG, GRID_REFERENCE_BOX, specFor, useGridMetrics, type Responsive } from "@no-origins/ui/components/grid";
import { Slot } from "@no-origins/ui/components/slot";
import { GridPages } from "@no-origins/ui/components/grid-pages";
import { Text } from "@no-origins/ui/components/text";
import type { GridLayout, GridLayoutItem } from "@no-origins/ui/lib/grid-layout";

import { findItem, type PageContent, type ShowcaseField, type Span, type SpecimenItem } from "@/content";
import { arrange, BAND } from "@/lib/arrange";

/**
 * The showcase on the grid — his rule, 2026-09-21: "the grid is the viewport", so the reading pages stopped scrolling
 * and became boxes on the field. Since 2026-09-22 it is arranged **the portfolio's way** (Portfolio.md P2, P7, P8):
 * a page is sections, each starting a page and spilling onto more; every specimen has a span per breakpoint; the
 * specimens pack first-fit inside a centred band of 4 · 6 · 8 · 12 · 16 columns, above the pager's row, and a page's
 * block is centred in the band and in the room. Overflow goes to the next page, never off the edge.
 *
 * Why the live field and not a reference one: a layout packed onto one shape and then derived onto another treats
 * every packed page as a hard break (v1 D6), so a screen one row shorter than the reference got each page's last
 * row on a page of its own — "multiple pages without filling the first" (his report, 2026-09-21). A list of
 * sizes has no page breaks worth keeping, so it is arranged fresh for whatever shape the grid reports.
 */

/** The nav bar's height, which the grid sits under (see showcase-nav.tsx). */
export const NAV_HEIGHT = 56;

/** The field assumed before the grid has measured itself: the xl reference box, minus the nav. One frame, at most. */
const XL = GRID_REFERENCE_BOX.xl;
const XL_SPEC = specFor(DEFAULT_GRID_CONFIG, "xl");
const FIRST_FIELD: ShowcaseField = {
  bp: "xl",
  cols: countFor(XL.width, XL_SPEC.cell, XL_SPEC.gap),
  rows: countFor(XL.height - NAV_HEIGHT, XL_SPEC.cell, XL_SPEC.gap),
};

// ── spans ─────────────────────────────────────────────────────────────────────────────────────────────────────
//
// Spans per breakpoint, read against the decided cell (Grid.md D13) and the band (Portfolio.md P8: 4 · 6 · 8 · 12 · 16
// columns). Two widths, both dividing the band on every pointer field so rows tile without holes: a HALF is two to a
// row from `lg` up (564px on xl, 420 on lg) and a QUARTER is four to a row on xl (276px) and two on lg (420 — a
// third, 204px, is not a specimen). Under `lg` the band is one specimen wide except on a tablet, where a quarter is
// two to a row (324px). The rows are the same at every breakpoint — a touch cell is 72 to a pointer's 60, so the same
// count is a fifth taller where the columns are fewer and the content wraps more — except that a tall HALF squeezed to
// a phone's four columns takes one more, since its rows of controls wrap to twice as many. A specimen whose rows
// wrap on one breakpoint only spreads the preset and sets that breakpoint by hand.

/** As wide as the band, `rows` tall — `phoneRows` on a phone, where text wraps to twice the lines. */
export const band = (rows: number, phoneRows = rows): Responsive<Span> => ({ base: { cols: BAND, rows: phoneRows }, sm: { cols: BAND, rows } });
/** Half the band from `lg` up; the whole band under it. */
export const half = (rows: number): Responsive<Span> => ({
  base: { cols: 4, rows: rows >= 4 ? rows + 1 : rows },
  sm: { cols: 6, rows },
  md: { cols: 8, rows },
  lg: { cols: 6, rows },
  xl: { cols: 8, rows },
});
/** A quarter of the band on xl, a half on lg and on a tablet — 276 to 420px; the whole band on a phone. */
export const quarter = (rows: number): Responsive<Span> => ({
  base: { cols: 4, rows },
  sm: { cols: 6, rows },
  md: { cols: 4, rows },
  lg: { cols: 6, rows },
  xl: { cols: 4, rows },
});

// ── the pages ─────────────────────────────────────────────────────────────────────────────────────────────────

/** One placed item, in its box or bare. */
function renderContentItem(content: PageContent, placed: GridLayoutItem) {
  const item = findItem(content, placed.id);
  if (!item) return null;
  return renderSpecimen(content, item, placed);
}

function renderSpecimen(content: PageContent, item: SpecimenItem, placed: GridLayoutItem) {
  const variant = item.variant ?? content.variant;
  return variant === "none" ? item.render(placed) : <Slot fill={variant}>{item.render(placed)}</Slot>;
}

/**
 * A page of specimens on the grid: the sections are arranged on the field the page is on, so every coordinate is
 * honoured as written (Portfolio.md P2).
 */
export function SpecimenPages({ content }: { content: PageContent }) {
  const [field, setField] = React.useState<ShowcaseField | null>(null);
  const layout = React.useMemo<GridLayout>(() => {
    const on = field ?? FIRST_FIELD;
    return { shapes: { [on.bp]: { cols: on.cols, rows: on.rows } }, authored: { [on.bp]: arrange(content, on) } };
  }, [content, field]);
  return (
    <GridPages
      layout={layout}
      overlay
      className="h-[calc(100dvh-3.5rem)]"
      onMetrics={(m) =>
        setField((prev) => (prev && prev.cols === m.cols && prev.rows === m.rows && prev.bp === m.bp ? prev : { cols: m.cols, rows: m.rows, bp: m.bp }))
      }
      renderItem={(placed) => renderContentItem(content, placed)}
    />
  );
}

// ── the boxes ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * A section's name, on the row above its specimens — the portfolio's header (Portfolio.md P7): the number and the
 * section in small caps, the title under them. The title steps down a role on a narrow slot (a phone's four columns)
 * so it stays one line.
 */
export function SectionHeader({ index, label, title, cols }: { index: string; label: string; title: string; cols: number }) {
  const m = useGridMetrics();
  const width = m ? cols * m.cell + (cols - 1) * m.gap : 999;
  return (
    <Slot fill="transparent" alignY="end">
      <div className="flex min-w-0 flex-col justify-end gap-0.5">
        <Text role="label" tone="muted">
          {index} — {label}
        </Text>
        <Text role={width < 400 ? "heading" : "title"} as="h2" className="truncate">
          {title}
        </Text>
      </div>
    </Slot>
  );
}

/**
 * One component, named, with its live examples below the name. Sized by the box it is in: the name and the note are
 * `Text` roles (Type.md T1), the note clamps to two lines, and the examples wrap into whatever room is left and clip
 * — a specimen that is cut off is one whose span is too small (Portfolio.md P5).
 */
export function Specimen({ name, note, children }: { name: string; note?: string; children: ReactNode }) {
  return (
    <section id={name} className="flex h-full min-h-0 flex-col gap-2">
      <header className="shrink-0">
        <Text role="label" as="h3">
          {name}
        </Text>
        {note ? (
          <Text role="caption" className="mt-0.5 line-clamp-2">
            {note}
          </Text>
        ) : null}
      </header>
      <div className="flex min-h-0 flex-1 flex-wrap content-start items-start gap-3 overflow-hidden">{children}</div>
    </section>
  );
}
