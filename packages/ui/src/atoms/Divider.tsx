import type { ComponentPropsWithoutRef } from "react";
import { cx } from "../cx";

/**
 * Divider (§9) — a hairline in `--rule`.
 *
 * An `<hr>`, because that is what it means: a thematic break, which assistive tech announces as a separator.
 * `dotted` is the drawn boundary — a rule that reads as a mark rather than a wall.
 */
export interface DividerProps extends ComponentPropsWithoutRef<"hr"> {
  dotted?: boolean;
}

export function Divider({ dotted, className, ...rest }: DividerProps) {
  return <hr className={cx("noo-divider", dotted && "noo-divider--dotted", className)} {...rest} />;
}
