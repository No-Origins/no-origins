import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cx } from "../cx";

/**
 * Text (§9) — every run of words on the platform, at one of four sizes.
 *
 * It replaces the loose `<p className="noo-body">` that panels typed by hand, and it absorbs two components that
 * were briefly drafted separately (Scene-Schema.md §2.3): `Prose` was this at `body`, `Note` was this at
 * `small` + `muted`. One component, because they differ by a step on the scale and nothing else.
 *
 * **The prop a document sets is `markdown`; the prop this component takes is `children`** (Scene-Schema.md §2.2).
 * The two prop surfaces are deliberately different: markdown cannot be handed to React, so the adapter parses it
 * — directives included (R4) — and passes the result here. Nothing in the package parses anything.
 *
 * `size` is a step on the type scale (§5), not a preference: `lead` 19/1.5 opens a section, `body` 16/1.55 is
 * reading matter, `small` 14.5/1.5 is an aside, and `widget` 20/1.35 is the size a bento cell is read at — from
 * about twice as far away (Design-System.md §8.3, Admin.md §6.5c F2). `tone="muted"` is the only colour it offers,
 * because a run of prose that needs a colour needs a component.
 */
export interface TextProps extends ComponentPropsWithoutRef<"p"> {
  size?: "lead" | "body" | "small" | "widget";
  tone?: "default" | "muted";
  /** `div` when the content holds block elements — a `<p>` cannot legally contain one. */
  as?: ElementType;
}

const SIZE = { lead: "noo-lead", body: "noo-body", small: "noo-body-sm", widget: "noo-widget-text" } as const;

export function Text({ size = "body", tone = "default", as, className, ...rest }: TextProps) {
  const Tag: ElementType = as ?? "p";
  return <Tag className={cx("noo-text", SIZE[size], tone === "muted" && "noo-text--muted", className)} {...rest} />;
}
