"use client";
import { useId, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cx } from "../cx";

/**
 * Radio (§9) — one native radio wearing a 20px ring: surface with the hairline off, ink ring with a ground dot on.
 * Same anatomy as `Checkbox` — box, label, hint — with the corners rounded all the way. Use it inside
 * `RadioGroup`, which supplies the shared `name` and the fieldset's legend.
 */
export interface RadioProps extends Omit<ComponentPropsWithoutRef<"input">, "type" | "children"> {
  label: ReactNode;
  hint?: ReactNode;
}

export function Radio({ label, hint, className, disabled, ...input }: RadioProps) {
  return (
    <label className={cx("noo-check noo-check--radio", disabled && "is-disabled", className)}>
      <input type="radio" className="noo-check__input" disabled={disabled} {...input} />
      <span className="noo-check__box" aria-hidden="true">
        <span className="noo-check__dot" />
      </span>
      <span className="noo-check__text">
        <span className="noo-check__label">{label}</span>
        {hint ? <span className="noo-check__hint">{hint}</span> : null}
      </span>
    </label>
  );
}

/**
 * RadioGroup — a `<fieldset>` of `Radio`s with one `name`. Controlled with `value` + `onChange`, or uncontrolled
 * with `defaultValue`. Options that need a sentence each go here; two or three words each is a `Segmented`.
 */
export interface RadioOption<V extends string = string> {
  value: V;
  label: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps<V extends string = string> extends Omit<ComponentPropsWithoutRef<"fieldset">, "onChange" | "children"> {
  label: ReactNode;
  options: readonly RadioOption<V>[];
  name?: string;
  value?: V;
  defaultValue?: V;
  onChange?: (value: V) => void;
  /** Side by side instead of stacked. Below `sm` it stacks regardless. */
  orientation?: "vertical" | "horizontal";
}

export function RadioGroup<V extends string = string>({ label, options, name: givenName, value, defaultValue, onChange, orientation = "vertical", className, disabled, ...rest }: RadioGroupProps<V>) {
  const autoId = useId();
  const name = givenName ?? `noo-radio${autoId.replace(/\W/g, "")}`;
  const [inner, setInner] = useState<V | undefined>(defaultValue);
  const current = value ?? inner;
  return (
    <fieldset className={cx("noo-radiogroup", orientation === "horizontal" && "noo-radiogroup--across", className)} disabled={disabled} {...rest}>
      <legend className="noo-field__label noo-radiogroup__legend">{label}</legend>
      <div className="noo-radiogroup__options">
        {options.map((o) => (
          <Radio
            key={o.value}
            name={name}
            value={o.value}
            label={o.label}
            hint={o.hint}
            disabled={o.disabled}
            checked={current === o.value}
            onChange={() => {
              if (value === undefined) setInner(o.value);
              onChange?.(o.value);
            }}
          />
        ))}
      </div>
    </fieldset>
  );
}
