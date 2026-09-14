"use client";
import { useState, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode } from "react";
import { cx } from "../cx";

/**
 * Toggle (§9) — a 44 × 26 switch. On: ink track, ground knob. Off: ink at 18% over the ground, surface knob.
 * Controlled with `checked` + `onChange`, or uncontrolled with `defaultChecked`. With `label` it renders inside a
 * `<label>` row so the text is clickable and read as the switch's name; without one, pass `aria-label`.
 */
export interface ToggleProps extends Omit<ComponentPropsWithoutRef<"button">, "onChange" | "children"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: ReactNode;
}

export function Toggle({ checked, defaultChecked = false, onChange, label, className, disabled, onClick, ...rest }: ToggleProps) {
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;
  const flip = (e: MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (checked === undefined) setInner(!on);
    onChange?.(!on);
  };
  const button = (
    <button type="button" role="switch" aria-checked={on} className={cx("noo-toggle", className)} disabled={disabled} onClick={flip} {...rest}>
      <span className="noo-toggle__knob" aria-hidden="true" />
    </button>
  );
  if (!label) return button;
  return (
    <label className={cx("noo-toggle-row", disabled && "is-disabled")}>
      <span className="noo-toggle-row__label">{label}</span>
      {button}
    </label>
  );
}
