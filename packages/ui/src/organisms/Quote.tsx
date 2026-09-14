import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Card } from "../atoms/Card";
import { cx } from "../cx";

/**
 * Quote (§9) — someone else's words, attributed.
 *
 * A `<figure>` with a `<blockquote>` and a `<figcaption>`, because that is exactly what this is and the markup
 * is free. The attribution rule is a left border on the caption, not a glyph: a decorative quotation mark would
 * be the second thing on the platform pretending to be an image.
 *
 * It stands on `Card padding="lg" radius="xl"` (D3), so the quote's surface, corner and lift are the card's and
 * change with them.
 *
 * `figure` is the number above it — a stat the quote then makes human ("98% on-time delivery", and then the
 * sentence that says what that felt like). Honest counts only (Patterns.md principle 8): a figure here is a
 * measurement or it is absent.
 */
// `role` here is a job title, which collides with the ARIA attribute of the same name — omitted rather
// than renamed, because "Operations Manager" IS their role and any other word for it would be worse.
export interface QuoteProps extends Omit<ComponentPropsWithoutRef<"figure">, "title" | "role"> {
  /** Who said it. */
  by?: ReactNode;
  /** Their role, where it is what makes the quote worth reading. */
  role?: ReactNode;
  /** A measured number the quote gives meaning to. */
  figure?: { value: ReactNode; label?: ReactNode };
  /** A portrait, an illustration, a blob — whatever stands beside the words. */
  media?: ReactNode;
  children: ReactNode;
}

export function Quote({ by, role, figure, media, children, className, ...rest }: QuoteProps) {
  return (
    <Card as="figure" padding="lg" radius="xl" className={cx("noo-quote", Boolean(media) && "noo-quote--media", className)} {...rest}>
      <div className="noo-quote__words">
        {figure ? (
          <p className="noo-quote__figure">
            <span className="noo-quote__value">{figure.value}</span>
            {figure.label ? <span className="noo-label noo-quote__figure-label">{figure.label}</span> : null}
          </p>
        ) : null}
        <blockquote className="noo-quote__text noo-h3">{children}</blockquote>
        {by ? (
          <figcaption className="noo-quote__by">
            <span className="noo-quote__name">{by}</span>
            {role ? <span className="noo-quote__role noo-body-sm">{role}</span> : null}
          </figcaption>
        ) : null}
      </div>
      {media ? <div className="noo-quote__media">{media}</div> : null}
    </Card>
  );
}
