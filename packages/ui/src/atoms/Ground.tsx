import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cx } from "../cx";

/**
 * Ground (Atomic.md, Atoms) — the surface everything sits on: warm grey with 160px grid lines (Design-System.md §8).
 *
 * It was a class every app typed onto `<body>` by hand; now it is a component too, so a page, a fixture or a
 * demo well can stand on the ground without knowing the class. The class still works on `<body>`, where React
 * has no element to give you.
 */
export interface GroundProps extends ComponentPropsWithoutRef<"div"> {
  as?: ElementType;
}

export function Ground({ as, className, ...rest }: GroundProps) {
  const Tag: ElementType = as ?? "div";
  return <Tag className={cx("noo-ground", className)} {...rest} />;
}
