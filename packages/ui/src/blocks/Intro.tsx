import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";
import { Heading } from "../primitives/Heading";
import { Text } from "../primitives/Text";

/**
 * Intro (§9) — a heading with a lead under it. The top of most panels and of every full view.
 *
 * It exists because **markdown cannot express a type scale** (Scene-Schema.md §8.1 ④). A document that wrote its
 * intro as markdown would get `##` → `h2` and a paragraph → body, and the *lead* — 19/1.5, a real step on the
 * scale (§5) — has no syntax at all. Rather than invent one, the pair becomes a component and the typographic
 * decision leaves the document, where it never belonged.
 *
 * `scene.tsx` has had it since step 9 as the unnamed `intro()` helper. This is that, named.
 */
export interface IntroProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  title: ReactNode;
  lead?: ReactNode;
  level?: 2 | 3 | 4;
}

export function Intro({ title, lead, level = 2, className, ...rest }: IntroProps) {
  return (
    <div className={cx("noo-intro", className)} {...rest}>
      <Heading level={level} className="noo-intro__title">{title}</Heading>
      {lead ? <Text size="lead" className="noo-intro__lead">{lead}</Text> : null}
    </div>
  );
}
