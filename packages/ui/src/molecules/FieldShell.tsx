import { useId, type ReactNode } from "react";
import { cx } from "../cx";

/**
 * FieldShell — the frame every form field wears: label above in `caption`, a noo-glass--1 box (radius md, 44) holding
 * the control, hint or error below. `Field`, `Select` and any control that arrives later render this and put their
 * own element in the box, so "what a field looks like" is decided once.
 *
 * Focus: 1.5px `--accent-deep` inside, 3px `--accent` at 25% outside. `error` turns the ring `--bad` and is
 * announced. The shell hands the control its `id` and `aria-describedby` through `children(props)`.
 */
export interface FieldControlProps {
  id: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
}

export interface FieldShellProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  id?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** `multiline` lets the box grow and tops the adornments. `select` reserves the chevron's room. */
  variant?: "input" | "multiline" | "select";
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

export function useFieldId(givenId?: string) {
  const autoId = useId();
  return givenId ?? `noo-field${autoId.replace(/\W/g, "")}`;
}

export function FieldShell({ label, hint, error, id: givenId, leading, trailing, variant = "input", className, children }: FieldShellProps) {
  const id = useFieldId(givenId);
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cx("noo-field", variant === "multiline" && "noo-field--multiline", variant === "select" && "noo-field--select", error ? "noo-field--invalid" : undefined, className)}>
      <label htmlFor={id} className="noo-field__label">
        {label}
      </label>
      <div className="noo-glass noo-glass--1 noo-field__box">
        {leading ? <span className="noo-field__adorn">{leading}</span> : null}
        {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
        {trailing ? <span className="noo-field__adorn">{trailing}</span> : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="noo-field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="noo-field__hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
