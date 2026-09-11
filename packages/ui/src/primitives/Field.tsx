import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cx } from "../cx";

/**
 * Field (§9) — label above in `caption`, a glass-1 box (radius 14, 48px) holding the control, hint or error below.
 * Focus: 1.5px `--accent-deep` inside, 3px `--accent` at 25% outside. `error` turns the ring `--bad` and is announced.
 * `className` styles the wrapper; the control receives everything else.
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

export function Field({ label, hint, error, id: givenId, multiline, rows = 4, leading, trailing, className, ...control }: FieldProps) {
  const autoId = useId();
  const id = givenId ?? `noo-field${autoId.replace(/\W/g, "")}`;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const controlProps = {
    id,
    className: "noo-field__input",
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    ...control,
  };
  return (
    <div className={cx("noo-field", multiline && "noo-field--multiline", error ? "noo-field--invalid" : undefined, className)}>
      <label htmlFor={id} className="noo-field__label">
        {label}
      </label>
      <div className="glass glass-1 noo-field__box">
        {leading ? <span className="noo-field__adorn">{leading}</span> : null}
        {multiline ? <textarea rows={rows} {...(controlProps as unknown as ComponentPropsWithoutRef<"textarea">)} /> : <input {...controlProps} />}
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
