import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cx } from "../cx";

/**
 * Heading (§9) — a heading at one of three levels.
 *
 * The Bowlby rule (§5) is carried here rather than remembered: the display face appears at level 2 (34px) and
 * nowhere smaller; 3 and 4 are Hanken 600. Level 1 is not offered, because a surface has exactly one `h1` (§12)
 * and it is the page's or the canvas's, never a composed block's.
 *
 * `as` separates the look from the semantics for the rare case where the outline needs a different rank than the
 * size — use it deliberately, and never to get an `h1`.
 */
export interface HeadingProps extends ComponentPropsWithoutRef<"h2"> {
  level?: 2 | 3 | 4;
  as?: ElementType;
}

const SCALE = { 2: "noo-h2", 3: "noo-h3", 4: "noo-h4" } as const;

export function Heading({ level = 2, as, className, ...rest }: HeadingProps) {
  const Tag: ElementType = as ?? (`h${level}` as ElementType);
  return <Tag className={cx("noo-heading", SCALE[level], className)} {...rest} />;
}
