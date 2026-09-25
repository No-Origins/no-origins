import type { ReactNode } from "react";

import type { GridBreakpoint, Responsive } from "@no-origins/ui/components/grid";
import type { GridLayoutItem, GridShape } from "@no-origins/ui/lib/grid-layout";

/** The field a page is being arranged for: the live counts and the breakpoint that supplied the cell (Grid.md D12). */
export type PortfolioField = GridShape & { bp: GridBreakpoint };

/** A size in cells, per breakpoint — the one design decision an item carries (Grid.md D18). */
export type Span = { cols: number; rows: number };

/**
 * One thing on a page: an id, its span per breakpoint, and what it shows once placed. `below` starts it under
 * everything placed before it on its page, never beside it — first-fit would otherwise put a line that belongs under a
 * card next to it wherever the band holds both; `air` is how many rows it leaves empty between it and what is above
 * it, and none when it opens a page. `above` takes it out of the flow, as if it were absolutely positioned: the page is
 * centred without it, and it then takes the rows directly over the page's block, centred on it — the tagline over the
 * profile card (Portfolio.md P4). Its rows are still held back while the page packs, so it is never squeezed out.
 */
export type PortfolioItem = {
  id: string;
  span: Responsive<Span>;
  below?: boolean;
  air?: number;
  above?: boolean;
  render: (placed: GridLayoutItem) => ReactNode;
};

/** A run of items that belong together. A section always starts a new page; a long one spills onto more. */
export type PortfolioSection = { id: string; items: PortfolioItem[] };

/**
 * The portfolio is one page of sections, ARRANGED on the field it is shown on (Portfolio.md P2, `src/lib/arrange.ts`)
 * rather than authored on a reference field and derived: the one rule every screen has — the empty top row — is a
 * rule about the top of THIS field.
 */
export type PortfolioPage = { title: string; sections: PortfolioSection[] };
