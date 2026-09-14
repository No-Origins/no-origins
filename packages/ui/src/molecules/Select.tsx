import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { FieldShell } from "./FieldShell";

/**
 * Select (§9) — a native `<select>` in the `FieldShell`, the chevron drawn as a trailing adornment.
 *
 * Native on purpose: the OS picker is the one control every reader already knows on a phone, and a custom
 * listbox buys nothing the admin's inspector needs. `options` may be flat or grouped. `placeholder` renders a
 * disabled first option, so an untouched select reads as empty rather than as its first choice.
 */
export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}
export interface SelectGroup {
  label: string;
  options: readonly SelectOption[];
}

export interface SelectProps extends Omit<ComponentPropsWithoutRef<"select">, "id" | "children"> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  id?: string;
  options: readonly (SelectOption | SelectGroup)[];
  placeholder?: string;
  leading?: ReactNode;
}

const isGroup = (o: SelectOption | SelectGroup): o is SelectGroup => "options" in o;

export function Select({ label, hint, error, id, options, placeholder, leading, className, defaultValue, value, ...control }: SelectProps) {
  const chevron = (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="noo-field__chevron">
      <path d="M4 6l4 4 4-4" style={{ fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" }} />
    </svg>
  );
  const render = (o: SelectOption) => (
    <option key={o.value} value={o.value} disabled={o.disabled}>
      {o.label}
    </option>
  );
  return (
    <FieldShell label={label} hint={hint} error={error} id={id} leading={leading} trailing={chevron} variant="select" className={className}>
      {(a11y) => (
        <select
          className="noo-field__input noo-field__select"
          {...a11y}
          {...control}
          value={value}
          defaultValue={value === undefined ? (defaultValue ?? (placeholder ? "" : undefined)) : undefined}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((o) =>
            isGroup(o) ? (
              <optgroup key={o.label} label={o.label}>
                {o.options.map(render)}
              </optgroup>
            ) : (
              render(o)
            ),
          )}
        </select>
      )}
    </FieldShell>
  );
}
