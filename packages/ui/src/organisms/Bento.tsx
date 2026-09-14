import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { Hue } from "../tokens/tokens";
import { cx } from "../cx";

/**
 * Bento (Design-System.md §8.3–8.4, §9) — **the one grid, at two sizes** (revised 2026-09-11).
 *
 * A section is one bento twice over. As a **widget** it is 4 × 3 fixed cells (`--bento-cell` 144, `--bento-gap` 16),
 * so it is exactly 640 × 480 and snaps into four boxes by three on the ring. With `page` it is that same grid as a
 * section's **full view**: 10 fluid columns to a 1600 max, rows `minmax(144px, auto)`, scrolling in the document
 * rather than sitting in canvas space.
 *
 * **Rows grow in page mode, and that is the trade to know.** Strict 144 rows would reinstate exactly the clipping
 * that forced every panel height in `scene.tsx` to be hand-measured. The cost is that a tall cell pushes its row
 * off the 160 rhythm: the grid stays true horizontally and becomes approximate vertically. A clipped paragraph is
 * a bug; an off-rhythm row is not.
 *
 * Every cell does one job — a figure, a word, an illustration, a list, chips — and **one cell per widget is loud**
 * (`tone="fill"`, in the section's hue); the rest recede. That was enforced by `SectionWidget` until it was retired
 * for total freedom; it is enforced by `probe12` in the review sweep now. The rule is a widget's, not a page's: six
 * widgets are compared side by side on the ring and must read as a family, while a full view is read alone.
 */
export interface BentoProps extends ComponentPropsWithoutRef<"div"> {
  /** The section's hue: `--bento-hue` and its deep tier, for the loud cell and the glyph. */
  hue?: Hue;
  cols?: number;
  rows?: number;
  /** A section's full view: 10 columns, rows that grow, scrolling in the document. Not canvas space. */
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
export type BentoTone = "quiet" | "glass" | "fill" | "ink" | "bare";

export interface BentoCellProps extends ComponentPropsWithoutRef<"div"> {
  /** Columns and rows the cell spans. */
  span?: [cols: number, rows: number];
  tone?: BentoTone;
}

export function BentoCell({ span = [1, 1], tone = "quiet", className, style, ...rest }: BentoCellProps) {
  return (
    <div
      className={cx("noo-bento__cell", tone === "glass" && "noo-glass noo-glass--1", `noo-bento__cell--${tone}`, className)}
      style={{ gridColumn: `span ${span[0]}`, gridRow: `span ${span[1]}`, ...style }}
      {...rest}
    />
  );
}

export interface BentoFigureProps extends ComponentPropsWithoutRef<"p"> {
  /** A number or a short word, set in the display face. */
  value: ReactNode;
  label?: ReactNode;
  /** `lg` 96 for a 2 × 2 cell, `md` 56 for a single cell. */
  size?: "lg" | "md";
}

export function BentoFigure({ value, label, size = "lg", className, ...rest }: BentoFigureProps) {
  return (
    <p className={cx("noo-bento__figure", size === "md" && "noo-bento__figure--md", className)} {...rest}>
      <span className="noo-bento__value">{value}</span>
      {label ? <span className="noo-label noo-bento__figure-label">{label}</span> : null}
    </p>
  );
}
