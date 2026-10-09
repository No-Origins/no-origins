"use client";

import type { GridBreakpoint } from "@no-origins/ui/components/grid";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";

import { band } from "@/components/specimen";
import type { SpecimenItem } from "@/content";
import type { DocEntry } from "@/content/sitemap";
import { BAND } from "@/lib/arrange";

/** The boxes a sitemap page is made of: its title row, and cards of text as tall as their text in whole cells. */

/** The cell a breakpoint counts in: a phone's derives from its width (about 54px), so it is counted as 50. */
const CELL: Record<GridBreakpoint, number> = { base: 50, sm: 72, md: 72, lg: 60, xl: 60 };

/** A box's padding, the `inset` job (Spacing.md SP3): 32px on every cell the grid has today. */
const INSET = 32;

const lines = (text: string, chars: number) => Math.max(1, Math.ceil(text.length / chars));

/**
 * A card's rows on a band `band` columns wide: the line holds as many characters of body as its width allows (a
 * character is about 7px, a point is indented 20px), and the card is its inset of 8 and hairline, the label, then the
 * lead's lines and the points'.
 */
function cardRows(band: number, bp: GridBreakpoint, lead: string | undefined, points: string[], measured?: number) {
  const cell = measured ?? CELL[bp];
  // The box's inset (Spacing.md SP3) round it, and its hairline.
  const width = band * cell + (band - 1) * 12 - 2 * INSET - 2;
  const chars = Math.max(20, Math.floor(width / 6.8));
  const leadPx = lead ? lines(lead, chars) * 20 : 0;
  const pointsPx = points.length ? 6 + points.reduce((sum, point) => sum + lines(point, chars - 3) * 22, 0) : 0;
  const px = 2 * INSET + 2 + 16 + 8 + leadPx + pointsPx + 4;
  return Math.max(1, Math.ceil((px + 12) / (cell + 12)));
}

/** A card of text: a label, then a paragraph or a list, as tall as its text in whole cells on every breakpoint. */
export function docCard(id: string, label: string, lead: string | undefined, points: string[]): SpecimenItem {
  return {
    id,
    span: (band, bp, cell) => ({ cols: BAND, rows: cardRows(band, bp, lead, points, cell) }),
    variant: "none",
    keep: true,
    render: () => (
      <Slot fill="card">
        <div className="flex min-h-0 flex-col gap-stack">
          <Text role="label" tone="muted" as="h2">
            {label}
          </Text>
          {lead ? <Text role="body">{lead}</Text> : null}
          {points.length ? (
            <ul className="marker:text-muted-foreground flex list-disc flex-col gap-0 ps-5">
              {points.map((point) => (
                <li key={point}>
                  <Text role="body">{point}</Text>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Slot>
    ),
  };
}

/** A page's title row: where it sits in the sitemap, over its name. */
export function docTitle(entry: DocEntry): SpecimenItem {
  const { group, category, page, index } = entry;
  const place = `${String(index).padStart(2, "0")} — ${group.title}${category ? ` · ${category.title}` : ""}`;
  return {
    id: "title",
    span: band(1),
    variant: "none",
    render: () => (
      <Slot fill="transparent" alignY="end">
        <div className="flex min-w-0 flex-col justify-end gap-0.5">
          <Text role="label" tone="muted">
            {place}
          </Text>
          <Text role="title" as="h1" className="truncate">
            {page.title}
          </Text>
        </div>
      </Slot>
    ),
  };
}

