import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cx } from "../cx";

/**
 * Button (§9) — a pill, 44px minimum (36px `sm`).
 *  - `primary`: ink fill, ground text.  - `secondary`: a level-1 surface as a pill.  - `ghost`: text, underline on hover.
 * With `href` it renders an `<a>`; pass `as={Link}` for a router's link component (§11.2 rule 1).
 */
export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "sm";

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leading?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  /** Anchor attributes, for when `href` makes this a link. */
  target?: string;
  download?: string | boolean;
  as?: ElementType;
}

export function Button({ variant = "primary", size = "md", leading, trailing, href, as, className, children, type, ...rest }: ButtonProps) {
  const Tag: ElementType = as ?? (href ? "a" : "button");
  return (
    <Tag
      className={cx("noo-btn", `noo-btn--${variant}`, size === "sm" && "noo-btn--sm", className)}
      href={href}
      type={Tag === "button" ? (type ?? "button") : undefined}
      {...rest}
    >
      {leading ? <span className="noo-btn__icon">{leading}</span> : null}
      <span className="noo-btn__text">{children}</span>
      {trailing ? <span className="noo-btn__icon">{trailing}</span> : null}
    </Tag>
  );
}
