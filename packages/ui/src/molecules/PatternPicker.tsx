"use client";
import { useState, type ComponentPropsWithoutRef, type KeyboardEvent } from "react";
import { cx } from "../cx";
import type { Hue } from "../tokens/tokens";
import { Pattern } from "../atoms/patterns/Pattern";
import type { Family } from "../atoms/patterns/generator";
import { patternNames, patternNotes, patterns } from "../atoms/patterns/patterns";
import { Icon } from "../icons/Icon";

/**
 * PatternPicker (Admin.md §6.5a, E2 A; §6.5b) — the control a `pattern` prop renders in the inspector.
 *
 * The library's patterns in a grid, each drawn by the generator in the node's own hue with its name under; the
 * chosen one wears the same ink ring as the `HueSwatch`, so "chosen" looks the same everywhere in the inspector.
 * A picture is chosen by looking, and the canvas node is the live preview. The eighteen in `patterns.ts` come
 * first; a document's own patterns (`extra`) follow, drawn the same way; and when `onNew` is given the grid ends
 * with *New pattern*, which the host answers by opening a `PatternStudio`.
 *
 * Thumbnails are drawn without `words`: the holes a drawing keeps clear belong to the cell it is placed in, not to
 * the pattern.
 */
export interface PatternOption {
  name: string;
  family: Family;
  /** One line on what shapes it — the tile's tooltip. */
  note?: string;
}

export const libraryPatterns: readonly PatternOption[] = patternNames.map((name) => ({ name, family: patterns[name], note: patternNotes[name] }));

export interface PatternPickerProps extends Omit<ComponentPropsWithoutRef<"div">, "onChange" | "children" | "defaultValue"> {
  /** Names the control — "Pattern". */
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (name: string) => void;
  /** The node's hue; every thumbnail is drawn in it. Defaults to the block accent. */
  hue?: Hue | "accent";
  /** What to offer; defaults to the eighteen in the library. */
  options?: readonly PatternOption[];
  /** The document's own patterns, listed after the library. */
  extra?: readonly PatternOption[];
  /** Renders the *New pattern* tile; the host opens a `PatternStudio`. */
  onNew?: () => void;
  newLabel?: string;
  columns?: 3 | 4;
  disabled?: boolean;
}

export function PatternPicker({ label, value, defaultValue, onChange, hue = "accent", options = libraryPatterns, extra = [], onNew, newLabel = "New pattern", columns = 3, disabled, className, ...rest }: PatternPickerProps) {
  const all = [...options, ...extra];
  const [inner, setInner] = useState<string | undefined>(defaultValue ?? all[0]?.name);
  const current = value ?? inner;
  const pick = (name: string) => {
    if (disabled) return;
    if (value === undefined) setInner(name);
    onChange?.(name);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = Math.max(0, all.findIndex((o) => o.name === current));
    let next: number | undefined;
    switch (e.key) {
      case "ArrowRight": next = Math.min(all.length - 1, i + 1); break;
      case "ArrowLeft": next = Math.max(0, i - 1); break;
      case "ArrowDown": next = Math.min(all.length - 1, i + columns); break;
      case "ArrowUp": next = Math.max(0, i - columns); break;
      case "Home": next = 0; break;
      case "End": next = all.length - 1; break;
      default: return;
    }
    e.preventDefault();
    const o = all[next]!;
    pick(o.name);
    e.currentTarget.querySelector<HTMLElement>(`[data-pattern="${o.name}"]`)?.focus();
  };
  const ill = hue === "accent" ? undefined : hue;
  return (
    <div className={cx("noo-pp", columns === 4 && "noo-pp--4", disabled && "is-disabled", className)} {...rest}>
      <div role="radiogroup" aria-label={label} className="noo-pp__group" onKeyDown={onKeyDown}>
        {all.map((o) => (
          <button
            key={o.name}
            type="button"
            role="radio"
            aria-checked={current === o.name}
            data-pattern={o.name}
            tabIndex={current === o.name ? 0 : -1}
            title={o.note}
            disabled={disabled}
            className="noo-pp__item"
            onClick={() => pick(o.name)}
          >
            <span className="noo-pp__pic" data-hue={hue}>
              <Pattern family={{ ...o.family, words: undefined }} hue={ill} />
            </span>
            <span className="noo-pp__name">{o.name}</span>
          </button>
        ))}
      </div>
      {onNew ? (
        <button type="button" className="noo-pp__item noo-pp__new" disabled={disabled} onClick={onNew}>
          <span className="noo-pp__pic noo-pp__pic--new" aria-hidden="true"><Icon name="plus" /></span>
          <span className="noo-pp__name">{newLabel}</span>
        </button>
      ) : null}
    </div>
  );
}
