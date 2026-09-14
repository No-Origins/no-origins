import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { FieldShell } from "./FieldShell";

/**
 * Field (§9) — a text input or textarea in the `FieldShell`: label above, noo-glass--1 box at `--ctl-md`, hint or
 * error below. `className` styles the wrapper; the control receives everything else.
 */
export interface FieldProps extends Omit<ComponentPropsWithoutRef<"input">, "id"> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  id?: string;
  multiline?: boolean;
  rows?: number;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function Field({ label, hint, error, id, multiline, rows = 4, leading, trailing, className, ...control }: FieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} id={id} leading={leading} trailing={trailing} variant={multiline ? "multiline" : "input"} className={className}>
      {(a11y) =>
        multiline ? (
          <textarea rows={rows} className="noo-field__input" {...a11y} {...(control as unknown as ComponentPropsWithoutRef<"textarea">)} />
        ) : (
          <input className="noo-field__input" {...a11y} {...control} />
        )
      }
    </FieldShell>
  );
}
