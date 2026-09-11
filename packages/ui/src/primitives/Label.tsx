import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cx } from "../cx";

/**
 * Label (§9) — the mono eyebrow: 12px JetBrains, uppercase, 0.1em tracking.
 *
 * One line, always. It is the voice the system uses for metadata — "now", "two years", "the through-line" — and
 * it is capped at 24 characters in the registry (Scene-Schema.md §3.2) because a widget sets its type at roughly
 * twice a document's, so a long eyebrow does not shrink: it wraps, and breaks the diagonal it sits on.
 */
export interface LabelProps extends ComponentPropsWithoutRef<"p"> {
  as?: ElementType;
}

export function Label({ as, className, ...rest }: LabelProps) {
  const Tag: ElementType = as ?? "p";
  return <Tag className={cx("noo-label", className)} {...rest} />;
}
