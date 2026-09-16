import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cx } from "../cx";

/**
 * Document (Atomic.md §6 step 5) — the 68ch reading column the editor block publishes into.
 *
 * Markdown rendered into the ramp: h2–h4 on the scale, paragraphs at `body`, lists with a marker in `--muted`,
 * code on `--ground-2`, a blockquote on a rule, a table on hairlines, an image at the column's own corner. R4 fixed
 * the prose's shape (markdown plus one directive); this is what it wears. Nothing here is a component a document
 * names — it is the stylesheet a document's plain HTML lands in, so a renderer emits `<h2>` and gets `h2`.
 */
export interface DocumentProps extends ComponentPropsWithoutRef<"article"> {
  as?: ElementType;
  /** `wide` lifts the measure to 80ch for a document that is mostly tables or code. */
  measure?: "reading" | "wide";
}

export function Document({ as, measure = "reading", className, ...rest }: DocumentProps) {
  const Tag: ElementType = as ?? "article";
  return <Tag className={cx("noo-document", measure === "wide" && "noo-document--wide", className)} {...rest} />;
}
