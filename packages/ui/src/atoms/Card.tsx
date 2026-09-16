import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cx } from "../cx";

/**
 * Card (§9) — the surface with padding: radius `lg` (20) or `xl` (28); padding `md` 24, `sm` 20, `lg` 40.
 * `interactive` lifts e1 → e2 and one pixel on hover. `as="article"` / `as="a"` with `href` for the element you mean.
 * `Quote` stands on `padding="lg" radius="xl"` (D3); everything else is the default.
 */
export interface CardProps extends ComponentPropsWithoutRef<"div"> {
  padding?: "md" | "sm" | "lg";
  radius?: "lg" | "xl";
  interactive?: boolean;
  href?: string;
  as?: ElementType;
}

export function Card({ padding = "md", radius = "lg", interactive, href, as, className, ...rest }: CardProps) {
  const Tag: ElementType = as ?? (href ? "a" : "div");
  return (
    <Tag
      className={cx(
        "noo-card",
        padding === "sm" && "noo-card--pad-sm",
        padding === "lg" && "noo-card--pad-lg",
        radius === "xl" && "noo-card--r-xl",
        interactive && "noo-card--interactive",
        className,
      )}
      href={href}
      {...rest}
    />
  );
}
