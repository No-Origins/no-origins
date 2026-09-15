"use client";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";

/**
 * Toast (§9) — one short message that arrives and leaves: a level-2 surface, radius lg, a semantic wash mixed in.
 * Admin.md §10: the one place the admin speaks in the brand voice, so the words are a sentence, not a status code.
 *
 * `tone` is the semantic colour — `good` is `--good`, `warn`, `bad`; `neutral` is ink. `role="status"` for the
 * three that inform, `role="alert"` for `bad`, which interrupts. Presentational: whoever shows it owns the timer
 * and the list, and renders them inside a `ToastStack`.
 */
export type ToastTone = "neutral" | "good" | "warn" | "bad";

export interface ToastProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  tone?: ToastTone;
  title?: ReactNode;
  /** One action — "Undo", "View". A toast with two buttons is a dialog that got lost. */
  action?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
}

export function Toast({ tone = "neutral", title, action, onDismiss, dismissLabel = "Dismiss", className, children, ...rest }: ToastProps) {
  return (
    <div
      role={tone === "bad" ? "alert" : "status"}
      className={cx("noo-surface noo-surface--2 noo-toast", `noo-toast--${tone}`, className)}
      {...rest}
    >
      <span className="noo-toast__mark" aria-hidden="true" />
      <div className="noo-toast__body">
        {title ? <p className="noo-toast__title">{title}</p> : null}
        {children ? <p className="noo-toast__text">{children}</p> : null}
      </div>
      {action ? <span className="noo-toast__action">{action}</span> : null}
      {onDismiss ? (
        <button type="button" className="noo-toast__close" aria-label={dismissLabel} onClick={onDismiss}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" style={{ fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" }} />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

/** Where toasts land: bottom-right on a desktop, the full width above the bar on a phone. One per page. */
export interface ToastStackProps extends ComponentPropsWithoutRef<"div"> {
  label?: string;
}

export function ToastStack({ label = "Notifications", className, ...rest }: ToastStackProps) {
  return <div role="region" aria-label={label} className={cx("noo-toasts", className)} {...rest} />;
}
