import type { ReactNode } from "react";
import { SectionHeader, type SectionHeaderProps } from "./SectionHeader";

/**
 * @deprecated Merged into `SectionHeader` (Atomic.md D3, 2026-09-14): `<Intro>` is `<SectionHeader rhythm={false}>`.
 * This alias goes with the next minor release.
 */
export interface IntroProps extends Omit<SectionHeaderProps, "label" | "rhythm" | "level"> {
  title: ReactNode;
  lead?: ReactNode;
  level?: 2 | 3 | 4;
}

/** @deprecated Use `<SectionHeader rhythm={false}>`. */
export function Intro(props: IntroProps) {
  return <SectionHeader rhythm={false} {...props} />;
}
