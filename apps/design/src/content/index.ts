import type { ReactNode } from "react";

import type { GridBreakpoint, Responsive } from "@no-origins/ui/components/grid";
import type { GridLayout, GridLayoutItem, GridShape, SlotFill } from "@no-origins/ui/lib/grid-layout";

/** The field a page is being arranged for: the live counts and the breakpoint that supplied the cell (Grid.md D12). */
export type ShowcaseField = GridShape & { bp: GridBreakpoint };

/** A size in cells, per breakpoint — the one design decision a specimen carries (Grid.md D18). */
export type Span = { cols: number; rows: number };

/**
 * One thing on a showcase page: an id, its span per breakpoint, the box it sits in, and what it shows once placed.
 * The render function gets the placed item, so a specimen can read its own span and get denser as its slot shrinks
 * (Portfolio.md P5) — a slot clips, and a specimen that is cut off is one whose span is too small.
 */
export type SpecimenItem = {
  id: string;
  span: Responsive<Span>;
  /** The slot's fill (Slots.md S3), or `none` — the item IS the component, unwrapped (a Card is already a box). */
  variant?: SlotFill | "none";
  /** False for page furniture — a header, a footnote — that the composer's palette should not offer. */
  palette?: boolean;
  render: (placed: GridLayoutItem) => ReactNode;
};

/** A run of specimens that belong together. A section always starts a new page; a long one spills onto more. */
export type SpecimenSection = { id: string; items: SpecimenItem[] };

/**
 * What a showcase page is made of, as data the composer can read (Grid.md D17): its sections of specimens with their
 * spans, the box variant they default to, and — once the composer has been over it and its export pasted back (D20)
 * — the authored layout, which then wins over arranging the spans. The page is ARRANGED on the field it is shown on,
 * the portfolio's way (Portfolio.md P2, `src/lib/arrange.ts`), since 2026-09-22.
 */
export type PageContent = {
  title: string;
  sections: SpecimenSection[];
  variant: SlotFill;
  /**
   * A narrower band than the default 4 · 6 · 8 · 12 · 16 (Portfolio.md P8), per breakpoint, for a page whose items
   * tile a narrower measure — the overview's three cards divide 12 and not 16. Never wider than the default.
   */
  band?: Partial<Record<GridBreakpoint, number>>;
  layout?: GridLayout;
};

/** Every specimen on a page, in reading order, across its sections. */
export function itemsOf(content: PageContent): SpecimenItem[] {
  return content.sections.flatMap((section) => section.items);
}

/** The specimen with this id, on any of the page's sections. */
export function findItem(content: PageContent, id: string): SpecimenItem | undefined {
  for (const section of content.sections) {
    const item = section.items.find((candidate) => candidate.id === id);
    if (item) return item;
  }
  return undefined;
}

/** Every page the composer can open, by route. Loaded lazily so the composer does not pull all three in at once. */
export const PAGES: Record<string, { title: string; load: () => Promise<PageContent> }> = {
  "/": { title: "Overview", load: () => import("./overview").then((m) => m.OVERVIEW) },
  "/atoms": { title: "Atoms", load: () => import("./atoms").then((m) => m.ATOMS) },
  "/molecules": { title: "Molecules", load: () => import("./molecules").then((m) => m.MOLECULES) },
};
