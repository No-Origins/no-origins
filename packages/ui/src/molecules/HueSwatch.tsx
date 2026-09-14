"use client";
import { useState, type ComponentPropsWithoutRef, type KeyboardEvent } from "react";
import { cx } from "../cx";
import { hues, type Hue } from "../tokens/tokens";

/**
 * HueSwatch (Admin.md §6.5a, E1 A) — the control a `hue` prop renders in the inspector.
 *
 * The seven `Dot`s at 20px in each hue's deep tier, in one row; the chosen one wears a 2px ink ring with a gap; the
 * hue's name reads beside the row, because seven unlabelled circles are a riddle. Where the schema allows
 * `accent`, an eighth glass dot with an ink hairline stands for "the block's own colour".
 *
 * Not the seven-blob swatch §6.1 first asked for: Brand.md makes the blob the mark of an agent, and seven sleeping
 * faces in a form are seven agents that aren't there. A radiogroup — arrow keys move and pick, Home/End jump.
 */
export type HueValue = Hue | "accent";

export interface HueSwatchProps extends Omit<ComponentPropsWithoutRef<"div">, "onChange" | "children" | "defaultValue"> {
  /** Names the control — "Hue", "Dot". */
  label: string;
  value?: HueValue;
  defaultValue?: HueValue;
  onChange?: (hue: HueValue) => void;
  /** Offers the block accent as an eighth choice. */
  accent?: boolean;
  /** Which hues to offer; defaults to all seven. */
  options?: readonly Hue[];
  disabled?: boolean;
  /** Hides the name beside the row — only where the name is already read out nearby. */
  hideName?: boolean;
}

export function HueSwatch({ label, value, defaultValue, onChange, accent, options = hues, disabled, hideName, className, ...rest }: HueSwatchProps) {
  const all: readonly HueValue[] = accent ? [...options, "accent"] : options;
  const [inner, setInner] = useState<HueValue>(defaultValue ?? all[0]!);
  const current = value ?? inner;
  const pick = (h: HueValue) => {
    if (disabled) return;
    if (value === undefined) setInner(h);
    onChange?.(h);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = Math.max(0, all.indexOf(current));
    let next: number | undefined;
    switch (e.key) {
      case "ArrowRight": case "ArrowDown": next = (i + 1) % all.length; break;
      case "ArrowLeft": case "ArrowUp": next = (i - 1 + all.length) % all.length; break;
      case "Home": next = 0; break;
      case "End": next = all.length - 1; break;
      default: return;
    }
    e.preventDefault();
    const h = all[next]!;
    pick(h);
    e.currentTarget.querySelector<HTMLElement>(`[data-hue="${h}"]`)?.focus();
  };
  return (
    <div className={cx("noo-swatch", disabled && "is-disabled", className)} {...rest}>
      <div role="radiogroup" aria-label={label} className="noo-swatch__dots" onKeyDown={onKeyDown}>
        {all.map((h) => (
          <button
            key={h}
            type="button"
            role="radio"
            aria-checked={current === h}
            aria-label={h}
            data-hue={h}
            tabIndex={current === h ? 0 : -1}
            disabled={disabled}
            className={cx("noo-swatch__dot", h === "accent" && "noo-swatch__dot--accent")}
            onClick={() => pick(h)}
          />
        ))}
      </div>
      {hideName ? null : <span className="noo-swatch__name" aria-hidden="true">{current}</span>}
    </div>
  );
}
