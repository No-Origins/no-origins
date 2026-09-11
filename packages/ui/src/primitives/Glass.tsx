import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cx } from "../cx";

/**
 * Glass — the surface primitive (Design-System.md §3). Everything translucent is built on it.
 * Three levels of one recipe; glass only over something worth seeing through; at most two stacked; six visible.
 */
export type GlassLevel = 1 | 2 | 3;
export type Radius = "xs" | "sm" | "md" | "lg" | "xl" | "pill";

export type GlassProps<T extends ElementType = "div"> = {
  as?: T;
  level?: GlassLevel;
  radius?: Radius;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

export function Glass<T extends ElementType = "div">({ as, level = 1, radius = "lg", className, ...rest }: GlassProps<T>) {
  const Tag: ElementType = as ?? "div";
  return <Tag className={cx("glass", `glass-${level}`, "noo-glass", `noo-r-${radius}`, className)} {...(rest as Record<string, unknown>)} />;
}
