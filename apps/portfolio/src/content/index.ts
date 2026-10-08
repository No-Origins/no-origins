import type { ReactNode } from "react";

import type { GridBreakpoint, Responsive } from "@no-origins/ui/components/grid";
import type { GridLayoutItem, GridPage, GridShape } from "@no-origins/ui/lib/grid-layout";

/** The field a page is being arranged for: the live counts and the breakpoint that supplied the cell (Grid.md D12). */
export type PortfolioField = GridShape & { bp: GridBreakpoint };

/** A size in cells, per breakpoint — the one design decision an item carries (Grid.md D18). */
export type Span = { cols: number; rows: number };

/**
 * One thing on a page: an id, its span per breakpoint, the agent whose page it is on, and what it shows once placed.
 * `air` is how many rows it leaves empty between it and the item above it, and none when it opens its page.
 */
export type PortfolioItem = {
  id: string;
  span: Responsive<Span>;
  air?: number;
  /**
   * Gives up rows first where its page is short of them, down to `FLOW_GROW_MIN` (`arrange.ts`) — his line and the
   * tech stack, which show as much as the rows they are left hold.
   */
  grow?: boolean;
  /**
   * The pieces an item wraps onto its rows, one span each (only its columns count): its rows are the rows these wrap
   * to at its width, in order, as words wrap (`wrap`, `arrange.ts`). Its span's rows are ignored.
   */
  wraps?: Responsive<Span>[];
  /**
   * The agents that open it (Grid.md D50, Motion.md M22): their ids in `INTRO_AGENTS` (`agents.ts`), space-separated.
   * The first is the agent whose page it is on (`arrangeAgent`, P24).
   */
  by?: string;
  render: (placed: GridLayoutItem) => ReactNode;
};

/** A run of items that belong together. */
export type PortfolioSection = { id: string; items: PortfolioItem[] };

/**
 * The portfolio's sections, ARRANGED on the field they are shown on (Portfolio.md P2, `src/lib/arrange.ts`), one
 * agent's section a page (P24), rather than authored on a reference field and derived.
 */
export type PortfolioPage = { title: string; sections: PortfolioSection[] };

/** The page `arrangeAgent` returns: the grid's own, and where the agents and the status pill stand on it. */
export type PortfolioGridPage = GridPage & {
  /** Where the agent of a page stands, a cell, 1-based (P24), and where its pill opens, its first cell. */
  stand?: { col: number; row: number };
  pill?: { col: number; row: number };
  /** The agents' cells at home, 1-based, in page order (P24): each a way to its page. */
  homes?: { col: number; row: number }[];
  /** The status pill's cell, 1-based (P25): the field's bottom-right corner, or the nearest cell the agents leave. */
  status?: { col: number; row: number };
};
