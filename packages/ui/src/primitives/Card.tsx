import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cx } from "../cx";

/**
 * Card (§9) — `--surface` (default) or glass-1, radius 20, padding 24 (`sm` = 20). `interactive` lifts e1 → e2
 * and one pixel on hover. `as="article"` / `as="a"` with `href` for the element you mean.
 */
export interface CardProps extends ComponentPropsWithoutRef<"div"> {
  surface?: "solid" | "glass";
  padding?: "md" | "sm";
  interactive?: boolean;
  href?: string;
  as?: ElementType;
}

export function Card({ surface = "solid", padding = "md", interactive, href, as, className, ...rest }: CardProps) {
  const Tag: ElementType = as ?? (href ? "a" : "div");
  return (
    <Tag
      className={cx("noo-card", surface === "glass" && "glass glass-1 noo-card--glass", padding === "sm" && "noo-card--pad-sm", interactive && "noo-card--interactive", className)}
      href={href}
      {...rest}
    />
  );
}
