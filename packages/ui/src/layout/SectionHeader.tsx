import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";

/**
 * SectionHeader (§9) — `label` eyebrow (mono), a title, an optional `lead`. 64px above when it follows something,
 * 32px below. `level` 1 is the page's one h1 (Bowlby 44); 2 is Bowlby at 34; 3 is Hanken 600 at 26, inside a block.
 */
export interface SectionHeaderProps extends Omit<ComponentPropsWithoutRef<"header">, "title"> {
  label?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  level?: 1 | 2 | 3;
  /** id for the heading, so a section can be `aria-labelledby` it. */
  titleId?: string;
}

export function SectionHeader({ label, title, lead, level = 2, titleId, className, ...rest }: SectionHeaderProps) {
  const Heading = level === 1 ? "h1" : level === 3 ? "h3" : "h2";
  return (
    <header className={cx("noo-section-header", className)} {...rest}>
      {label ? <p className="noo-label noo-section-header__label">{label}</p> : null}
      <Heading id={titleId} className={cx(level === 1 ? "noo-h1" : level === 3 ? "noo-h3" : "noo-h2", "noo-section-header__title")}>
        {title}
      </Heading>
      {lead ? <p className="noo-lead noo-section-header__lead">{lead}</p> : null}
    </header>
  );
}
