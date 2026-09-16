"use client";
import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cx } from "../cx";

/**
 * Segmented (§9) — a few exclusive choices in a level-1 surface as a pill; the chosen one is ink on ground.
 *
 * One control for every "one of these" that fits in a row: light · system · dark, desktop · phone, grid · off.
 * More than four options, or options that need a sentence, is a `Select` or a `RadioGroup`. Controlled with
 * `value` + `onChange`, or uncontrolled with `defaultValue`.
 *
 * Toggle buttons with `aria-pressed` in a named group, not a radiogroup: every button is reachable with Tab, which
 * is what a two- or three-way switch wants — the arrow-key roving of a radiogroup is for long lists.
 */
export interface SegmentedOption<V extends string = string> {
  value: V;
  label: ReactNode;
  /** Names the option when `label` is an icon. */
  title?: string;
}

export interface SegmentedProps<V extends string = string> extends Omit<ComponentPropsWithoutRef<"div">, "onChange" | "children"> {
  options: readonly SegmentedOption<V>[];
  value?: V;
  defaultValue?: V;
  onChange?: (value: V) => void;
  /** What the group is for — "Theme", "Viewport". Required: three unlabelled buttons in a pill are a riddle. */
  label: string;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function Segmented<V extends string = string>({ options, value, defaultValue, onChange, label, size = "sm", disabled, className, ...rest }: SegmentedProps<V>) {
  const [inner, setInner] = useState<V | undefined>(defaultValue ?? options[0]?.value);
  const current = value ?? inner;
  const pick = (v: V) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };
  return (
    <div role="group" aria-label={label} className={cx("noo-surface noo-surface--1 noo-segmented", size === "md" && "noo-segmented--md", className)} {...rest}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="noo-segmented__btn"
          aria-pressed={current === o.value}
          title={o.title}
          disabled={disabled}
          onClick={() => pick(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
