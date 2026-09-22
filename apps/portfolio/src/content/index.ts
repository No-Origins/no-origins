import type { ReactNode } from "react";

import type { GridBreakpoint, Responsive } from "@no-origins/ui/components/grid";
import type { GridLayoutItem, GridShape } from "@no-origins/ui/lib/grid-layout";

/** The field a page is being arranged for: the live counts and the breakpoint that supplied the cell (Grid.md D12). */
export type PortfolioField = GridShape & { bp: GridBreakpoint };

/** A size in cells, per breakpoint — the one design decision an item carries (Grid.md D18). */
export type Span = { cols: number; rows: number };

/** One thing on a page: an id, its span per breakpoint, and what it shows once placed. */
export type PortfolioItem = {
  id: string;
  span: Responsive<Span>;
  render: (placed: GridLayoutItem) => ReactNode;
};

/** A run of items that belong together. A section always starts a new page; a long one spills onto more. */
export type PortfolioSection = { id: string; items: PortfolioItem[] };

/**
 * The portfolio is one page of sections, ARRANGED on the field it is shown on (Portfolio.md P2, `src/lib/arrange.ts`)
 * rather than authored on a reference field and derived: the one rule every screen has — the empty top row — is a
 * rule about the top of THIS field. When the composer has been over a section and its export pasted back (Grid.md
 * D20), an authored `layout` is the thing to add here, and it wins.
 */
export type PortfolioPage = { title: string; sections: PortfolioSection[] };
