import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cx } from "../cx";

/**
 * Row (§9) — things across, wrapping when they run out of room.
 *
 * Generalised from `ChipRow`, which was drafted first and named after the one place it was needed
 * (Scene-Schema.md §2.3). A row of chips and the résumé row are the same object; naming it after the chips was
 * copying the portfolio instead of designing a library. It wraps by default because every real use of it —
 * chips under a card, a button beside a line of text — is content that must not overflow its cell.
 *
 * `align="baseline"` is the one worth knowing: a 28px chip beside 14.5px text sits on the text's baseline, not
 * centred on it, wherever the two are read as one line.
 */
export interface RowProps extends ComponentPropsWithoutRef<"div"> {
  gap?: 8 | 16 | 24 | 40;
  align?: "center" | "start" | "baseline" | "end";
  /** Off makes the row overflow rather than wrap; only for a track that scrolls. */
  wrap?: boolean;
  as?: ElementType;
}

export function Row({ gap = 8, align = "center", wrap = true, className, as, ...rest }: RowProps) {
  const Tag: ElementType = as ?? "div";
  return <Tag className={cx("noo-row", `noo-row--g${gap}`, `noo-row--${align}`, !wrap && "noo-row--nowrap", className)} {...rest} />;
}
