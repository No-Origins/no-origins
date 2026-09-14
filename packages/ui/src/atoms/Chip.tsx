import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import type { Hue } from "../tokens/tokens";
import { cx } from "../cx";

/**
 * Chip (§9) — a 28px pill. Background is the hue's pastel at 45% over the surface (§2.2 "tints are derived");
 * text is ink; the leading dot is the hue's deep tier. Renders a `<button>` with `onClick`, an `<a>` with `href`.
 * `pressed` marks a selected filter chip (`aria-pressed`).
 */
export interface ChipProps extends ComponentPropsWithoutRef<"span"> {
  hue?: Hue | "accent";
  /** The leading dot in the hue's deep tier. Default: shown unless `leading` is given. */
  dot?: boolean;
  leading?: ReactNode;
  pressed?: boolean;
  href?: string;
  as?: ElementType;
  onClick?: ComponentPropsWithoutRef<"button">["onClick"];
}

export function Chip({ hue = "accent", dot, leading, pressed, href, as, className, children, onClick, ...rest }: ChipProps) {
  const Tag: ElementType = as ?? (href ? "a" : onClick ? "button" : "span");
  const showDot = dot ?? !leading;
  return (
    <Tag
      className={cx("noo-chip", Tag !== "span" && "noo-chip--interactive", className)}
      data-hue={hue}
      href={href}
      type={Tag === "button" ? "button" : undefined}
      aria-pressed={Tag === "button" && pressed !== undefined ? pressed : undefined}
      onClick={onClick}
      {...rest}
    >
      {leading ? <span className="noo-chip__icon">{leading}</span> : showDot ? <span className="noo-chip__dot" aria-hidden="true" /> : null}
      {children}
    </Tag>
  );
}
