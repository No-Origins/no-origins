import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";
import { Heading } from "../atoms/Heading";
import { Label } from "../atoms/Label";
import { Text } from "../atoms/Text";

/**
 * SectionHeader (§9) — an optional `label` eyebrow (mono), a title, an optional `lead`.
 *
 * It composes `Label`, `Heading` and `Text` rather than picking class names itself, so a change to an atom reaches
 * every header (Atomic.md rule 3). `level` 1 is the page's one h1 — the one place the display face goes above
 * `Heading`'s range, which is why it is drawn here and not offered there (§12).
 *
 * `rhythm` is the document spacing: 64 above when it follows something, 32 below. Off, it is the top of a panel
 * or a full view — what `Intro` used to be (D3). It exists at all because **markdown cannot express a type
 * scale** (Scene-Schema.md §8.1 ④): the lead is a real step and has no syntax, so the pair is a component.
 */
export interface SectionHeaderProps extends Omit<ComponentPropsWithoutRef<"header">, "title"> {
  label?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  level?: 1 | 2 | 3 | 4;
  /** Document rhythm (64 above, 32 below). `false` at the top of a panel, where the panel owns the spacing. */
  rhythm?: boolean;
  /** id for the heading, so a section can be `aria-labelledby` it. */
  titleId?: string;
}

export function SectionHeader({ label, title, lead, level = 2, rhythm = true, titleId, className, ...rest }: SectionHeaderProps) {
  return (
    <header className={cx("noo-section-header", !rhythm && "noo-section-header--flush", className)} {...rest}>
      {label ? <Label className="noo-section-header__label">{label}</Label> : null}
      {level === 1 ? (
        <h1 id={titleId} className="noo-heading noo-h1 noo-section-header__title">{title}</h1>
      ) : (
        <Heading level={level} id={titleId} className="noo-section-header__title">{title}</Heading>
      )}
      {lead ? <Text size="lead" className="noo-section-header__lead">{lead}</Text> : null}
    </header>
  );
}
