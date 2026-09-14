"use client";
import { useId, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../cx";

/**
 * Tabs (§9) — a row of ghost buttons on a hairline; the current one carries the NavBar's marker, 2px `--accent-deep`
 * underneath. Panels swap below.
 *
 * The WAI-ARIA tabs pattern, hand-rolled because it is forty lines: one tab stop for the list, arrow keys and
 * Home/End move between tabs and activate as they go, each panel is labelled by its tab. Controlled with `value` +
 * `onChange`, or uncontrolled with `defaultValue`. Inactive panels are `hidden`, not unmounted, so their state
 * (a half-typed field) survives a look at the neighbour.
 */
export interface Tab {
  value: string;
  label: ReactNode;
  panel: ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends Omit<ComponentPropsWithoutRef<"div">, "onChange" | "children"> {
  tabs: readonly Tab[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Names the tablist — "Token groups". */
  label: string;
}

export function Tabs({ tabs, value, defaultValue, onChange, label, className, ...rest }: TabsProps) {
  const baseId = useId().replace(/\W/g, "");
  const enabled = tabs.filter((t) => !t.disabled);
  const [inner, setInner] = useState(defaultValue ?? enabled[0]?.value);
  const current = value ?? inner;
  const listRef = useRef<HTMLDivElement>(null);

  const select = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = enabled.findIndex((t) => t.value === current);
    if (i < 0) return;
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % enabled.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + enabled.length) % enabled.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = enabled.length - 1;
    else return;
    e.preventDefault();
    const v = enabled[next]!.value;
    select(v);
    listRef.current?.querySelector<HTMLButtonElement>(`[data-value="${v}"]`)?.focus();
  };

  return (
    <div className={cx("noo-tabs", className)} {...rest}>
      <div ref={listRef} role="tablist" aria-label={label} className="noo-tabs__list" onKeyDown={onKeyDown}>
        {tabs.map((t) => {
          const on = t.value === current;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              id={`${baseId}-tab-${t.value}`}
              aria-selected={on}
              aria-controls={`${baseId}-panel-${t.value}`}
              tabIndex={on ? 0 : -1}
              disabled={t.disabled}
              data-value={t.value}
              className="noo-tabs__tab"
              onClick={() => select(t.value)}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div
          key={t.value}
          role="tabpanel"
          id={`${baseId}-panel-${t.value}`}
          aria-labelledby={`${baseId}-tab-${t.value}`}
          hidden={t.value !== current}
          tabIndex={0}
          className="noo-tabs__panel"
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
}
