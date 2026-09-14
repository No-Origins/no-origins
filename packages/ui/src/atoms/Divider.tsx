import type { ComponentPropsWithoutRef } from "react";
import { cx } from "../cx";

/**
 * Divider (§9) — a hairline in `--rule`.
 *
 * An `<hr>`, because that is what it means: a thematic break, which assistive tech announces as a separator.
 * `dotted` is the canvas voice — it is the line under a region label (§8.2) and the one the threads are drawn in.
 */
export interface DividerProps extends ComponentPropsWithoutRef<"hr"> {
  dotted?: boolean;
}

export function Divider({ dotted, className, ...rest }: DividerProps) {
  return <hr className={cx("noo-divider", dotted && "noo-divider--dotted", className)} {...rest} />;
}
