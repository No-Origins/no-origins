import type { ReactNode } from "react";

import type { GridBreakpoint, Responsive } from "@no-origins/ui/components/grid";
import type { GridLayoutItem, GridPage, GridShape } from "@no-origins/ui/lib/grid-layout";

/** The field a page is being arranged for: the live counts and the breakpoint that supplied the cell (Grid.md D12). */
export type PortfolioField = GridShape & { bp: GridBreakpoint };

/** A size in cells, per breakpoint — the one design decision an item carries (Grid.md D18). */
export type Span = { cols: number; rows: number };

/**
 * One thing on a page: an id, its span per breakpoint, and what it shows once placed. `below` starts it under
 * everything placed before it on its page, never beside it — first-fit would otherwise put a line that belongs under a
 * card next to it wherever the band holds both; `air` is how many rows it leaves empty between it and what is above
 * it, and none when it opens a page.
 */
export type PortfolioItem = {
  id: string;
  span: Responsive<Span>;
  below?: boolean;
  air?: number;
  /**
   * A column beside the section's first block, numbered from it: 1 is the first column right of the block, 2 the next,
   * -1 the first left of it (2026-09-27, his: "put the profile vertical in the left, then work and then projects" — the
   * work is 1 and the projects 2; until then the tech was left of the centre and the work right of it, the first
   * screen's three columns — Portfolio.md P4, 2026-09-26). Out of the flow: the block is packed without it, and the
   * columns share the band's room beside the block, each one width and `SIDE_GAPS` (two columns of air where the band has room, else one) from the next, the
   * block and its columns centred in the band together, from the block's top; every column and the block are as tall
   * as the tallest of them, and the block stands level with their top (2026-09-27). Where that room is under SIDE_MIN
   * cells (`arrange.ts`), and the block's `narrow` spans do not make it enough, it is an ordinary item packed under the
   * block, and its span's columns are its width.
   *
   * **Several items with one side stack down its column**, in `site.tsx`'s order, each taking its span's rows (his,
   * 2026-09-27: the projects over the skills, the degree under the work). The rows a column has over its items go to
   * the one that `grow`s, else stay empty at its foot. An item after the first leaves its `air` empty over it (a row,
   * 2026-09-27: between the projects and the skills, the work and the education).
   */
  side?: number;
  /**
   * In a `side` column: takes the rows the column has left over the rest of its items (at least `GROW_MIN`), and its own rows
   * do not set the column's height — the tech stack under the projects (2026-09-27), which shows as many marks as the rows it is
   * left hold. Its span is still what it takes packed under the block.
   *
   * **In the flow**, not a column's: takes the rows the section's first page leaves under the flow, at most its span's,
   * and is left off where that is fewer than `FLOW_GROW_MIN` (`arrange.ts`) — his words under the profile (2026-09-27:
   * "the about me text should be just below the avatar and name row"), which give way to every other box of the first
   * screen, so a phone and a tablet keep the work. It is shown there or not at all, never in the room.
   */
  grow?: boolean;
  /**
   * The most rows an item that `grow`s takes in a `side` column, at the column's width — **its last row the air under
   * it**: where it takes them all, the item under it keeps no `air` of its own, and the column's rows over them are
   * left empty at its foot. The tech stack (2026-09-28, his: "there are three rows empty between technical skills and
   * art skills. Reduce it to one"): its label, its marks and a row for what a grown mark pushes over.
   */
  growMost?: (cols: number) => number;
  /**
   * **Takes the place of the section's `side` columns where they cannot stand beside its block** — at the breakpoints
   * it is true at — and is not shown where they do. It is packed under the block like a `below` item, its `fallback`s
   * where the rows are short, and the `side` items are left off. The first screen's tabs on a phone and a tablet
   * (2026-09-28, his, from the recruiter quick view: "I loved the mobile layout … take references from that and update
   * ours too"): Work, Projects, Tech and Interests (Art until 2026-10-01) in the rows under the profile's column, where
   * only the work stood.
   */
  compact?: Responsive<boolean>;
  /**
   * The pieces an item wraps onto its rows, one span each (only its columns count): its rows are the rows these wrap
   * to at its width, in order, as words wrap (`wrap`, `arrange.ts`) — the projects in the left column, after their
   * label's cell (his, 2026-09-27: "let the projects wrap instead of behaving like a column of cards"). Its span's rows
   * are ignored.
   */
  wraps?: Responsive<Span>[];
  /**
   * The span an item in the flow takes where its own `span` would leave the section's `side` columns under SIDE_MIN
   * cells and this one would not — the first screen's centre on an eighteen-column field (2026-09-27), six cells
   * rather than eight, so the columns either side are five and the work's active mark has room for its name.
   */
  narrow?: Responsive<Span>;
  /**
   * Drawn behind the field, not on it — the first screen's tagline (P4, 2026-09-27): it takes no box on the grid. On
   * the section's first page the rows its span asks for are kept free at the foot of the room, over the pager's, as
   * many as the block leaves, and the block is centred over them; the page carries where they are as `backdrop`, and
   * the renderer draws the item there, under the grid's cells. Its span's columns are ignored: it is the band's width.
   */
  backdrop?: boolean;
  /**
   * The spans an item that is not on the first screen tries after its own, in order, for the room the first screen
   * leaves (`arrange.ts`, 2026-09-27): the portfolio is one page, and a piece of the pages that went finds a place
   * there at the first of its spans that fits, or is not shown.
   */
  fallback?: Responsive<Span>[];
  /**
   * The agents that open it in the intro (Grid.md D50, Motion.md M22, version 2, 2026-10-01): their ids in
   * `INTRO_AGENTS` (`agents.ts`), space-separated, the one that opens it first; any after it land on its top row beside
   * it (the phone's tabs, one agent a tab). Left out, the nearest agent opens it.
   */
  by?: string;
  render: (placed: GridLayoutItem) => ReactNode;
};

/**
 * A run of items that belong together. The first section is the first screen; every later one's items are placed in
 * the room it leaves, since the portfolio is one page (2026-09-27 — until then a section started a page and a long
 * one spilled onto more). `band` widens the content's measure (`BAND_COLS`) for this section at the breakpoints it
 * names.
 */
export type PortfolioSection = { id: string; items: PortfolioItem[]; band?: Partial<Record<GridBreakpoint, number>> };

/**
 * The portfolio is one page of sections, ARRANGED on the field it is shown on (Portfolio.md P2, `src/lib/arrange.ts`)
 * rather than authored on a reference field and derived: the one rule every screen has — the empty top row — is a
 * rule about the top of THIS field.
 */
export type PortfolioPage = { title: string; sections: PortfolioSection[] };

/**
 * The page `arrange` returns: the grid's own, and where its backdrop goes, if it has one and there is room for it.
 */
export type PortfolioGridPage = GridPage & { backdrop?: GridLayoutItem };
