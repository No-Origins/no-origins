"use client";
import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cx } from "../cx";

/**
 * Checkbox (§9) — a native checkbox wearing a 20px box: surface with a hairline off, ink with a ground
 * tick on. The input stays in the tree (`appearance: none`, not `display: none`), so the keyboard, the form and
 * the screen reader all get the real control; the box is what the eye gets.
 *
 * `label` is the row; `hint` sits under it in the caption voice. `indeterminate` is the "some of these" state a
 * parent checkbox shows for its children — it is a property, not an attribute, which is why the ref.
 */
export interface CheckboxProps extends Omit<ComponentPropsWithoutRef<"input">, "type" | "children"> {
  label: ReactNode;
  hint?: ReactNode;
  indeterminate?: boolean;
}

export function Checkbox({ label, hint, indeterminate = false, className, disabled, ...input }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label className={cx("noo-check", disabled && "is-disabled", className)}>
      <input ref={ref} type="checkbox" className="noo-check__input" disabled={disabled} {...input} />
      <span className="noo-check__box" aria-hidden="true">
        <svg viewBox="0 0 16 16" className="noo-check__mark">
          <path className="noo-check__tick" d="M3.5 8.5l3 3 6-6" />
          <path className="noo-check__dash" d="M4 8h8" />
        </svg>
      </span>
      <span className="noo-check__text">
        <span className="noo-check__label">{label}</span>
        {hint ? <span className="noo-check__hint">{hint}</span> : null}
      </span>
    </label>
  );
}
