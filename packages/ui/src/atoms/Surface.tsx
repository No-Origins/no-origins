import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cx } from "../cx";

/**
 * Surface — the one material (Design-System.md §3, v1). Flat: the `--surface` fill, a `--rule` hairline and an
 * elevation. Nothing is seen through it, so nothing is asked of the ground behind it.
 *
 * Three levels are three shadows, for how far a thing sits off the ground: `1` (e1) for a card, a field, a chip;
 * `2` (e2) for a bar, a menu, a toast; `3` (e4) for a dialog. Every surface in the system is one of these, which is
 * what makes "a change to the material" one edit.
 */
export type SurfaceLevel = 1 | 2 | 3;
export type Radius = "xs" | "sm" | "md" | "lg" | "xl" | "pill";

export type SurfaceProps<T extends ElementType = "div"> = {
  as?: T;
  level?: SurfaceLevel;
  radius?: Radius;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

export function Surface<T extends ElementType = "div">({ as, level = 1, radius = "lg", className, ...rest }: SurfaceProps<T>) {
  const Tag: ElementType = as ?? "div";
  return <Tag className={cx("noo-surface", `noo-surface--${level}`, `noo-r-${radius}`, className)} {...(rest as Record<string, unknown>)} />;
}
