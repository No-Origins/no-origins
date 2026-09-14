"use client";
import { cloneElement, isValidElement, useId, useState, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from "react";
import { cx } from "../cx";

/**
 * Tooltip (§9) — ink on ground, caption size, radius sm. Text only: a tooltip that needs a link or a picture is a
 * popover, and the platform does not have one yet.
 *
 * It describes the child (`aria-describedby`), so the child must be focusable — a button, a link — or the
 * keyboard never sees it. Shows on hover and on focus, hides on Escape. Positioned by the stylesheet on `side`,
 * centred on the trigger, and never portalled: a tooltip that escapes its scroll container is a tooltip that
 * lags behind it.
 */
export interface TooltipProps extends Omit<ComponentPropsWithoutRef<"span">, "children" | "content"> {
  /** The text. */
  label: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  children: ReactElement<Record<string, unknown>>;
}

export function Tooltip({ label, side = "top", children, className, ...rest }: TooltipProps) {
  const id = `noo-tip${useId().replace(/\W/g, "")}`;
  const [open, setOpen] = useState(false);
  if (!isValidElement(children)) return children;
  const trigger = cloneElement(children, {
    "aria-describedby": [children.props["aria-describedby"], id].filter(Boolean).join(" "),
    onFocus: (e: unknown) => { setOpen(true); (children.props.onFocus as ((e: unknown) => void) | undefined)?.(e); },
    onBlur: (e: unknown) => { setOpen(false); (children.props.onBlur as ((e: unknown) => void) | undefined)?.(e); },
  });
  return (
    <span
      className={cx("noo-tip", `noo-tip--${side}`, open && "is-open", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
      {...rest}
    >
      {trigger}
      <span role="tooltip" id={id} className="noo-tip__bubble">
        {label}
      </span>
    </span>
  );
}
