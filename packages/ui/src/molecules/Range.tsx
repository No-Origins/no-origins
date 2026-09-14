"use client";
import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cx } from "../cx";
import { useFieldId } from "./FieldShell";

/**
 * Range (Admin.md §6.5b) — a number chosen by sliding, with its value read out beside the label.
 *
 * The dial the pattern studio is made of: twelve of these set the generator's geometry. A native `<input
 * type="range">` on a 2px rule with a 16px ink thumb — one control height, one focus ring, the value in mono so a
 * column of dials lines up. Controlled with `value` + `onChange`, or uncontrolled with `defaultValue`.
 */
export interface RangeProps extends Omit<ComponentPropsWithoutRef<"input">, "onChange" | "value" | "defaultValue" | "type" | "id" | "children"> {
  label: ReactNode;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  hint?: ReactNode;
  /** Formats the readout; defaults to the value at the step's precision, with `unit` after it. */
  format?: (value: number) => string;
  unit?: string;
  id?: string;
}

function decimals(step: number) {
  const s = String(step);
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
}

export function Range({ label, value, defaultValue, onChange, min, max, step = 1, hint, format, unit, id: givenId, className, disabled, ...rest }: RangeProps) {
  const id = useFieldId(givenId);
  const [inner, setInner] = useState(defaultValue ?? min);
  const current = value ?? inner;
  const set = (v: number) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };
  const shown = format ? format(current) : `${current.toFixed(decimals(step))}${unit ? ` ${unit}` : ""}`;
  return (
    <div className={cx("noo-range", disabled && "is-disabled", className)}>
      <div className="noo-range__head">
        <label htmlFor={id} className="noo-range__label">{label}</label>
        <output htmlFor={id} className="noo-range__value" aria-live="off">{shown}</output>
      </div>
      <input
        id={id}
        type="range"
        className="noo-range__input"
        min={min}
        max={max}
        step={step}
        value={current}
        disabled={disabled}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(e) => set(Number(e.target.value))}
        {...rest}
      />
      {hint ? <p id={`${id}-hint`} className="noo-range__hint">{hint}</p> : null}
    </div>
  );
}
