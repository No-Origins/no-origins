"use client";
import { useSyncExternalStore } from "react";
import { Segmented, type SegmentedProps } from "./Segmented";
import { applyTheme, readTheme, subscribeTheme, type ThemeChoice } from "../tokens/theme";

/**
 * ThemeSwitch — light · system · dark, as an instance of `Segmented` (D3). The document's `data-theme` is the
 * source of truth; the switch writes it (and localStorage) and reads it back, so it agrees with the boot script
 * and other tabs.
 */
export interface ThemeSwitchProps extends Omit<SegmentedProps<ThemeChoice>, "options" | "value" | "defaultValue" | "onChange" | "label"> {
  labels?: Record<ThemeChoice, string>;
  label?: string;
}

const serverTheme = (): ThemeChoice => "system";
const choices: ThemeChoice[] = ["light", "system", "dark"];

export function ThemeSwitch({ labels = { light: "Light", system: "System", dark: "Dark" }, label = "Theme", ...rest }: ThemeSwitchProps) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, serverTheme);
  return <Segmented<ThemeChoice> label={label} options={choices.map((c) => ({ value: c, label: labels[c] }))} value={theme} onChange={applyTheme} {...rest} />;
}
