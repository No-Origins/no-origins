"use client";
import { useEffect, useId, useRef, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode } from "react";
import { cx } from "../cx";

/**
 * Dialog · Sheet (Admin.md §10) — a level-3 surface. Radius xl, e4, one primary action.
 *
 * **A native `<dialog>`, on purpose.** `showModal()` gives the top layer, the focus trap, Escape, `inert` for
 * everything behind and a `::backdrop` — the four behaviours a headless library would be imported for. So there
 * is no peer here; the platform does it, and the stylesheet dresses it.
 *
 * Controlled: `open` + `onClose`. Clicking the backdrop closes. `form="sheet"` slides in from the right on a
 * desktop and up from the bottom below `sm`. `modal={false}` renders it open, in flow, for the catalogue.
 */
export interface DialogProps extends Omit<ComponentPropsWithoutRef<"dialog">, "title" | "open" | "onClose"> {
  open: boolean;
  /** Required for a modal; an inline (`modal={false}`) dialog has nothing to close. */
  onClose?: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Buttons, right-aligned. One primary; a second is a secondary or a ghost. */
  actions?: ReactNode;
  form?: "dialog" | "sheet";
  size?: "sm" | "md" | "lg";
  /** `false` renders an open, non-modal dialog in the flow of the page — the catalogue's sample. */
  modal?: boolean;
  closeLabel?: string;
}

export function Dialog({ open, onClose, title, description, actions, form = "dialog", size = "md", modal = true, closeLabel = "Close", className, children, ...rest }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId().replace(/\W/g, "");

  useEffect(() => {
    const el = ref.current;
    if (!el || !modal) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open, modal]);

  const onBackdrop = (e: MouseEvent<HTMLDialogElement>) => {
    if (modal && e.target === e.currentTarget) onClose?.();
  };

  return (
    <dialog
      ref={ref}
      open={modal ? undefined : open}
      className={cx("noo-surface noo-surface--3 noo-dialog", `noo-dialog--${form}`, `noo-dialog--${size}`, !modal && "noo-dialog--inline", className)}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      onClose={onClose}
      onClick={modal ? onBackdrop : undefined}
      {...rest}
    >
      <div className="noo-dialog__head">
        <h2 id={`${id}-title`} className="noo-heading noo-h3 noo-dialog__title">{title}</h2>
        {onClose ? <button type="button" className="noo-dialog__close" aria-label={closeLabel} onClick={onClose}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" style={{ fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" }} />
          </svg>
        </button> : null}
      </div>
      {description ? <p id={`${id}-desc`} className="noo-body-sm noo-dialog__desc">{description}</p> : null}
      {children ? <div className="noo-dialog__body">{children}</div> : null}
      {actions ? <div className="noo-dialog__actions">{actions}</div> : null}
    </dialog>
  );
}

/** A `Dialog` that slides in from the edge: detail without leaving the list. */
export function Sheet(props: Omit<DialogProps, "form">) {
  return <Dialog form="sheet" {...props} />;
}
