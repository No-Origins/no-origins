import type { ComponentPropsWithoutRef, ElementType } from "react";
import type { Hue } from "../tokens/tokens";
import { cx } from "../cx";

/**
 * Bubble (§9) — a noo-glass--1 pill of real text, `bubble` type (15/1.40, Hanken 500), padding 10 × 16.
 * `tint` mixes the hue's pastel at 45% into the surface. `pop` plays bubble-pop on mount (origin toward the blob).
 * Anchoring is the layout's job: top-right of the blob with an 8px gap in Page mode; a NodeToolbar on the canvas.
 */
export interface BubbleProps extends ComponentPropsWithoutRef<"p"> {
  tint?: Hue;
  pop?: boolean;
  as?: ElementType;
}

export function Bubble({ tint, pop, as, className, ...rest }: BubbleProps) {
  const Tag: ElementType = as ?? "p";
  return <Tag className={cx("noo-glass noo-glass--1 noo-bubble", tint && "noo-bubble--tint", pop && "noo-pop", className)} data-hue={tint} {...rest} />;
}
