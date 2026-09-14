import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";

/**
 * RegionLabel (§8.2, §9) — a map label: one display-face word over a dotted hairline.
 *
 * 96px **in canvas units**, because it is the one heading that has to read at the ring's overview zoom, where a
 * 96px figure renders at about 26 (§8.3). It steps down to 34 in document mode, where there is no zoom to fight.
 *
 * Always `aria-hidden`: the section's meaningful `<h2>` is in its intro, and "Four roles, told as blocks" beats
 * "work" for anyone navigating by heading. Extracted from `RegionNode`, which now renders this — the markup had
 * no name, so a region could not be authored (Scene-Schema.md §2.3).
 */
export interface RegionLabelProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
}

export function RegionLabel({ children, className, ...rest }: RegionLabelProps) {
  return (
    <div className={cx("noo-region", className)} aria-hidden="true" {...rest}>
      <span className="noo-region__label">{children}</span>
      <span className="noo-region__rule" />
    </div>
  );
}
