import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { Hue } from "../tokens/tokens";
import { cx } from "../cx";
import { Pattern } from "../atoms/patterns/Pattern";
import type { PatternName } from "../atoms/patterns/patterns";
import type { Family } from "../atoms/patterns/generator";

/**
 * Bento (Design-System.md §8.3–8.4, §9) — **the one grid, at two sizes** (revised 2026-09-11).
 *
 * A section is one bento twice over. As a **widget** it is 4 × 3 fixed cells (`--bento-cell` 144, `--bento-gap` 16),
 * so it is exactly 640 × 480 — four boxes by three of the 160 grid. With `page` it is that same grid as a
 * section's **full view**: 10 fluid columns to a 1600 max, rows `minmax(144px, auto)`, scrolling in the document.
 *
 * **Rows grow in page mode, and that is the trade to know.** Strict 144 rows would reinstate exactly the clipping
 * that once forced every panel height to be hand-measured. The cost is that a tall cell pushes its row
 * off the 160 rhythm: the grid stays true horizontally and becomes approximate vertically. A clipped paragraph is
 * a bug; an off-rhythm row is not.
 *
 * Every cell does one job — a figure, a word, an illustration, a list, chips — and **one cell per widget is loud**
 * (`tone="fill"`, in the section's hue); the rest recede. `probe12` in the review sweep enforces it. The rule is a
 * widget's, not a page's: six widgets are compared side by side and must read as a family; a full view is read alone.
 */
export interface BentoProps extends ComponentPropsWithoutRef<"div"> {
  /** The section's hue: `--bento-hue` and its deep tier, for the loud cell and the glyph. */
  hue?: Hue;
  cols?: number;
  rows?: number;
  /** A section's full view: 10 columns, rows that grow, scrolling in the document. */
  page?: boolean;
  /** Names the widget for assistive tech. */
  label?: string;
}

export function Bento({ hue, cols, rows = 3, page, label, className, style, ...rest }: BentoProps) {
  const columns = cols ?? (page ? 10 : 4);
  return (
    <div
      className={cx("noo-bento", page && "noo-bento--page", className)}
      data-hue={hue ?? "accent"}
      role="group"
      aria-label={label}
      style={{ "--bento-cols": columns, "--bento-rows": rows, ...style } as CSSProperties}
      {...rest}
    />
  );
}

/** `bare` is type on the grid with no card under it — a page's intro sits in one. */
export type BentoTone = "quiet" | "fill" | "ink" | "bare";

export interface BentoCellProps extends ComponentPropsWithoutRef<"div"> {
  /** Columns and rows the cell spans. */
  span?: [cols: number, rows: number];
  tone?: BentoTone;
  /**
   * The field across the cell (Patterns.md principle 7): one of the library's patterns by name, or a `Family`
   * for one made in the studio. Drawn last, absolutely, so it sits under the cell's words.
   */
  pattern?: PatternName | Family;
  /** The hue the pattern is drawn in. A cell has none of its own; pass its bento's. */
  hue?: Hue;
}

export function BentoCell({ span = [1, 1], tone = "quiet", pattern, hue, className, style, children, ...rest }: BentoCellProps) {
  return (
    <div
      className={cx("noo-bento__cell", `noo-bento__cell--${tone}`, className)}
      style={{ gridColumn: `span ${span[0]}`, gridRow: `span ${span[1]}`, ...style }}
      {...rest}
    >
      {children}
      {pattern ? <Pattern {...(typeof pattern === "string" ? { name: pattern } : { family: pattern })} hue={hue} placement="field" /> : null}
    </div>
  );
}

export interface BentoFigureProps extends ComponentPropsWithoutRef<"p"> {
  /** A number, or — as a `word` — a short phrase, set in the display face. */
  value: ReactNode;
  label?: ReactNode;
  /** `lg` 96 for a 2 × 2 cell, `md` 56 for a single cell. Only a `figure` has two sizes. */
  size?: "lg" | "md";
  /**
   * What the loud cell says: a count, or a phrase where nothing is countable (Admin.md §6.5c F3). A `word` is the
   * display face at 48 over two lines — same corner, same job, and the honest answer when there is no number.
   */
  kind?: "figure" | "word";
}

export function BentoFigure({ value, label, size = "lg", kind = "figure", className, ...rest }: BentoFigureProps) {
  const word = kind === "word";
  return (
    <p className={cx("noo-bento__figure", word ? "noo-bento__figure--word" : size === "md" && "noo-bento__figure--md", className)} {...rest}>
      <span className="noo-bento__value">{value}</span>
      {label ? <span className="noo-label noo-bento__figure-label">{label}</span> : null}
    </p>
  );
}
