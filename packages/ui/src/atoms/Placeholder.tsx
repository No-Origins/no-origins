import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";

/**
 * Placeholder (§9) — a section that exists on the map but has no copy yet.
 *
 * Two jobs, one look. While a block is being built it holds the geometry so the layout can be reviewed before the
 * words arrive, and it is marked `draft` so nobody mistakes scaffolding for finished writing. Shipped without
 * `draft` it is the honest empty state Brand.md §9 requires: say what will be here and why it is not, in plain
 * words. Never "coming soon" — that is the one phrasing the brand rules out.
 */
export interface PlaceholderProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  /** What will eventually be here. */
  title: ReactNode;
  /** Why it is not here yet, or what shape it will take. */
  children?: ReactNode;
  /** Scaffolding, not content: adds a visible "draft" tag. */
  draft?: boolean;
}

export function Placeholder({ title, children, draft, className, ...rest }: PlaceholderProps) {
  return (
    <div className={cx("noo-placeholder", draft && "noo-placeholder--draft", className)} {...rest}>
      {draft ? <span className="noo-placeholder__tag">draft</span> : null}
      <p className="noo-h4 noo-placeholder__title">{title}</p>
      {children ? <div className="noo-body-sm noo-placeholder__body">{children}</div> : null}
    </div>
  );
}
