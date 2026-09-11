import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { Hue } from "../tokens";
import { cx } from "../cx";

/**
 * Bento (Design-System.md §8.3–8.4, §9) — the widget: how a section previews itself from a distance.
 *
 * A CSS grid of fixed cells (`--bento-cell` 148, `--bento-gap` 16 in canvas units), so a 4 × 3 widget is 640 × 476.
 * Every cell does one job — a figure, a word, a glyph, a list, chips, media — and **one cell per widget is loud**
 * (`tone="fill"`, in the section's hue); the rest recede. Read from twice as far away as a document, so nothing in
 * it is set smaller than 20.
 */
export interface BentoProps extends ComponentPropsWithoutRef<"div"> {
  /** The section's hue: `--bento-hue` and its deep tier, for the loud cell and the glyph. */
  hue?: Hue;
  cols?: number;
  rows?: number;
  /** Names the widget for assistive tech. */
  label?: string;
}

export function Bento({ hue, cols = 4, rows = 3, label, className, style, ...rest }: BentoProps) {
  return (
    <div
      className={cx("noo-bento", className)}
      data-hue={hue}
      role="group"
      aria-label={label}
      style={{ "--bento-cols": cols, "--bento-rows": rows, ...style } as CSSProperties}
      {...rest}
    />
  );
}

export type BentoTone = "quiet" | "glass" | "fill" | "ink";

export interface BentoCellProps extends ComponentPropsWithoutRef<"div"> {
  /** Columns and rows the cell spans. */
  span?: [cols: number, rows: number];
  tone?: BentoTone;
}

export function BentoCell({ span = [1, 1], tone = "quiet", className, style, ...rest }: BentoCellProps) {
  return (
    <div
      className={cx("noo-bento__cell", tone === "glass" && "glass glass-1", `noo-bento__cell--${tone}`, className)}
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
