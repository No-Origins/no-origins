import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cx } from "../cx";

/**
 * Stack (§9) — things down the page, evenly spaced.
 *
 * Together with `Row` this is the pair that hand-authoring two sections found missing (Scene-Schema.md §8.1 ⑨,
 * §9.3 ⑨): the package had no way to put two things next to each other, so the app reached for a Tailwind
 * utility every single time — and a utility class in an app file cannot be placed in the editor. Seven of the
 * ten gaps were this.
 *
 * `gap` is four steps of the space scale (§6) and nothing between them. A free number would let a document
 * invent spacing the system does not have, which is how a design system stops being one.
 */
export interface StackProps extends ComponentPropsWithoutRef<"div"> {
  gap?: 8 | 16 | 24 | 40;
  align?: "stretch" | "start" | "center" | "end";
  as?: ElementType;
}

export function Stack({ gap = 16, align = "stretch", className, as, ...rest }: StackProps) {
  const Tag: ElementType = as ?? "div";
  return <Tag className={cx("noo-stack", `noo-stack--g${gap}`, align !== "stretch" && `noo-stack--${align}`, className)} {...rest} />;
}
