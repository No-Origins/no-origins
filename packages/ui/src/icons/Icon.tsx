import type { ComponentPropsWithoutRef } from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import * as glyphs from "./glyphs";
import { cx } from "../cx";

/**
 * Icon (Atomic.md D8) — one set, one weight, three sizes.
 *
 * The glyphs are Phosphor's, regular weight, through `@no-origins/ui/icons` — a separate entry so the main entry
 * never depends on the icon library — it is the one optional peer (§11.2 rule 1
 * gains its second named exception). Only the glyphs listed in `glyphs.ts` exist here: a curated set, named in the
 * system's words, so a document may name one (the registry offers the list) and the bundle carries only those.
 *
 * Size comes from the three icon tokens through a class, not from an attribute, so a stroke drawn at 24 scales
 * with the token and every icon in a row agrees. `currentColor` throughout: an icon in a muted label is muted.
 * `duotone` is reserved for a current or loud item; everywhere else is noise.
 *
 * Decorative by default — `aria-hidden` — and an image only when given a `label`.
 */
export type IconName = keyof typeof glyphs;
export const iconNames = Object.keys(glyphs) as IconName[];

export interface IconProps extends Omit<ComponentPropsWithoutRef<"svg">, "name"> {
  name: IconName;
  size?: "sm" | "md" | "lg";
  /** The filled tier — only on a current or loud item. */
  duotone?: boolean;
  /** Accessible name. Without one the icon is decorative. */
  label?: string;
}

export function Icon({ name, size = "md", duotone, label, className, ...rest }: IconProps) {
  const Glyph = glyphs[name] as PhosphorIcon;
  const a11y = label ? { role: "img" as const, "aria-label": label, "aria-hidden": undefined } : { "aria-hidden": true as const };
  return <Glyph weight={duotone ? "duotone" : "regular"} className={cx("noo-icon", size !== "md" && `noo-icon--${size}`, className)} {...a11y} {...rest} />;
}
