"use client";
import { useSyncExternalStore, type ComponentPropsWithoutRef } from "react";
import { cx } from "../cx";
import { applyTheme, readTheme, subscribeTheme, type ThemeChoice } from "../theme";

/**
 * ThemeSwitch — light · system · dark, in a glass-1 pill. The document's `data-theme` is the source of truth;
 * the switch writes it (and localStorage) and reads it back, so it agrees with the boot script and other tabs.
 */
export interface ThemeSwitchProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  labels?: Record<ThemeChoice, string>;
}

const serverTheme = (): ThemeChoice => "system";
const choices: ThemeChoice[] = ["light", "system", "dark"];

export function ThemeSwitch({ labels = { light: "Light", system: "System", dark: "Dark" }, className, ...rest }: ThemeSwitchProps) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, serverTheme);
  return (
    <div role="group" aria-label="Theme" className={cx("glass glass-1 noo-theme", className)} {...rest}>
      {choices.map((c) => (
        <button key={c} type="button" className="noo-theme__btn" aria-pressed={theme === c} onClick={() => applyTheme(c)}>
          {labels[c]}
        </button>
      ))}
    </div>
  );
}
