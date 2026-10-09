"use client";

import * as React from "react";
import type { ReactNode } from "react";

import { countFor, DEFAULT_GRID_CONFIG, GRID_REFERENCE_BOX, specFor, useGridMetrics, type Responsive } from "@no-origins/ui/components/grid";
import { Slot } from "@no-origins/ui/components/slot";
import { GridPages } from "@no-origins/ui/components/grid-pages";
import { Text } from "@no-origins/ui/components/text";
import type { GridLayout, GridLayoutItem } from "@no-origins/ui/lib/grid-layout";

import { renderSidebar, SIDEBAR_COLS, SIDEBAR_LEFT, SIDEBAR_MIN_COLS, sidebarFixtures, sidebarItems, useSidebarListRows } from "@/components/sidebar";
import { findItem, type PageContent, type ShowcaseField, type Span, type SpecimenItem } from "@/content";
import { arrange, BAND } from "@/lib/arrange";

/**
 * The showcase on the grid: the grid is the viewport, so no reading page scrolls and every specimen is a box on the
 * field. It is arranged **the portfolio's way** (Portfolio.md P2, P7, P8): a page is sections, each starting a page and
 * spilling onto more; every specimen has a span per breakpoint; the specimens pack first-fit inside a centred band of
 * 6 · 6 · 8 · 12 · 16 columns, above the pager's row, and a page's block is centred in the band and in the room.
 * Overflow goes to the next page, never off the edge.
 *
 * Why the live field and not a reference one: a layout packed onto one shape and then derived onto another treats
 * every packed page as a hard break, so a screen one row shorter than the reference would get each page's last row on
 * a page of its own. A list of sizes has no page breaks worth keeping, so it is arranged fresh for whatever shape the
 * grid reports.
 */

/** The field assumed before the grid has measured itself: the xl reference box. One frame, at most. */
const XL = GRID_REFERENCE_BOX.xl;
const XL_SPEC = specFor(DEFAULT_GRID_CONFIG, "xl");
/** The live field, with what the sidebar sizes its list by: the cell, the gutter and the pager bar's width. */
type PagesField = ShowcaseField & { cell: number; gap: number; pager: number };

const FIRST_FIELD: PagesField = {
  bp: "xl",
  cols: countFor(XL.width, XL_SPEC.cell, XL_SPEC.gap),
  rows: countFor(XL.height, XL_SPEC.cell, XL_SPEC.gap),
  cell: XL_SPEC.cell,
  gap: XL_SPEC.gap,
  pager: XL_SPEC.pager ?? 6,
};

// ── spans ─────────────────────────────────────────────────────────────────────────────────────────────────────
//
// Spans per breakpoint, read against the decided cell (Grid.md D13) and the band (Portfolio.md P8: 6 · 6 · 8 · 12 · 16
// columns). Two widths, both dividing the band on every pointer field so rows tile without holes: a HALF is two to a
// row from `lg` up (564px on xl, 420 on lg) and a QUARTER is four to a row on xl (276px) and two on lg (420 — a
// third, 204px, is not a specimen). Under `lg` the band is one specimen wide except on a tablet, where a quarter is
// two to a row (324px). The rows are the same at every breakpoint — a touch cell is 72 to a pointer's 60, so the same
// count is a fifth taller where the columns are fewer and the content wraps more — except that a tall HALF squeezed to
// a phone takes more (`onPhone`), since its rows of controls wrap to twice as many. A specimen whose rows
// wrap on one breakpoint only spreads the preset and sets that breakpoint by hand.

/**
 * A phone's rows for a span measured on a touch cell. Every field is six across (Grid.md D33), so a phone's cell gives
 * way — 51px on a 390 phone against a touch cell's 72 — and one step down is 63px, three quarters of the 84 the rows
 * were counted in: a phone span takes a third more of them to stay the same height, rounded up.
 */
export const onPhone = (rows: number) => Math.ceil((rows * 4) / 3);

/** As wide as the band, `rows` tall — `phoneRows` on a phone, where text wraps to twice the lines. */
export const band = (rows: number, phoneRows = rows): Responsive<Span> => ({ base: { cols: BAND, rows: onPhone(phoneRows) }, sm: { cols: BAND, rows } });
/** Half the band from `lg` up; the whole band under it. */
export const half = (rows: number): Responsive<Span> => ({
  base: { cols: 6, rows: onPhone(rows >= 4 ? rows + 1 : rows) },
  sm: { cols: 6, rows },
  md: { cols: 8, rows },
  lg: { cols: 6, rows },
  xl: { cols: 8, rows },
});
/** A quarter of the band on xl, a half on lg and on a tablet — 276 to 420px; the whole band on a phone. */
export const quarter = (rows: number): Responsive<Span> => ({
  base: { cols: 6, rows: onPhone(rows) },
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
 * A specimen in a surface box is padded by the `inset` job (Spacing.md SP3), 32px since 2026-10-09, where its span was
 * counted with 12px round it: one more row holds the 40px it gained. A text card or a drawing (`none`) sizes itself, and
 * a transparent box has no padding.
 */
function withInset(content: PageContent): PageContent {
  const grow = (span: SpecimenItem["span"]): SpecimenItem["span"] => {
    if (typeof span === "function") return (band, bp, cell) => {
      const s = span(band, bp, cell);
      return { ...s, rows: s.rows + 1 };
    };
    if ("cols" in span) return { ...(span as Span), rows: (span as Span).rows + 1 };
    return Object.fromEntries(Object.entries(span).map(([bp, s]) => [bp, { ...(s as Span), rows: (s as Span).rows + 1 }])) as SpecimenItem["span"];
  };
  return {
    ...content,
    sections: content.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        const variant = item.variant ?? content.variant;
        return variant === "card" || variant === "muted" ? { ...item, span: grow(item.span) } : item;
      }),
    })),
  };
}

/**
 * A page of specimens on the grid: the sections are arranged on the field the page is on, so every coordinate is
 * honoured as written (Portfolio.md P2).
 */
export function SpecimenPages({ content: written }: { content: PageContent }) {
  const content = React.useMemo(() => withInset(written), [written]);
  const [field, setField] = React.useState<PagesField | null>(null);
  const on = field ?? FIRST_FIELD;
  // The sidebar stands beside the pages where the field has room for it and a page's band; else it is the first page.
  const beside = on.cols >= SIDEBAR_MIN_COLS;
  // Its list runs from row 2 down to the bottom row, or the row above it where the pager's bar reaches its columns;
  // as the first page, it has the rows above the pager's but the name's.
  const barStart = Math.floor((on.cols - on.pager) / 2) + 1;
  const room = beside ? on.rows - (barStart <= SIDEBAR_COLS ? 2 : 1) : on.rows - 2;
  const listRows = useSidebarListRows(Math.max(1, room), on.cell, on.gap);
  const layout = React.useMemo<GridLayout>(() => {
    const pages = beside
      ? arrange(content, on, SIDEBAR_LEFT)
      : arrange({ ...content, sections: [{ id: "sidebar", items: sidebarItems(listRows) }, ...content.sections] }, on);
    return {
      shapes: { [on.bp]: { cols: on.cols, rows: on.rows } },
      authored: { [on.bp]: pages },
      fixtures: beside ? sidebarFixtures(listRows) : undefined,
    };
  }, [content, on, beside, listRows]);
  return (
    <GridPages
      layout={layout}
      overlay
      cursor
      onMetrics={(m) =>
        setField((prev) =>
          prev && prev.cols === m.cols && prev.rows === m.rows && prev.bp === m.bp && prev.cell === m.cell && prev.pager === m.pager
            ? prev
            : { cols: m.cols, rows: m.rows, bp: m.bp, cell: m.cell, gap: m.gap, pager: m.pager },
        )
      }
      renderItem={(placed) => renderSidebar(placed) ?? renderContentItem(content, placed)}
    />
  );
}

// ── the boxes ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * A section's name, on the row above its specimens (Portfolio.md P7): the number and the section in small caps, the
 * title under them. The title steps down a role on a narrow slot (a phone's) so it stays one line.
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
