import type { ComponentPropsWithoutRef } from "react";
import { cx } from "../cx";
import type { Hue } from "../tokens/tokens";

/**
 * Dot (§9) — a hue, as a mark.
 *
 * It became a component because a hue has to survive the map zoom tier and text does not (Design-System.md §8.3):
 * a card carries its hue as a dot rather than a blob, so a zoomed-out column stays colour-coded when every word
 * in it has stopped being legible. The chip has its own 8px dot built in; this is the standalone 12px one, which
 * lived in `apps/portfolio/src/content/sections.tsx` as four lines of Tailwind until now.
 *
 * Decorative by definition — it repeats a hue the text beside it already names — so it is always `aria-hidden`.
 */
export interface DotProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  hue: Hue;
}

export function Dot({ hue, className, ...rest }: DotProps) {
  return <span aria-hidden="true" className={cx("noo-dot", className)} data-hue={hue} {...rest} />;
}
