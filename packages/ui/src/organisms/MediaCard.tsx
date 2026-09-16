import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cx } from "../cx";
import type { Hue } from "../tokens/tokens";

/**
 * MediaCard (§9) — a card with a picture beside its words.
 *
 * `media` takes an `Image`, a `Pattern` or a `Blob`; with nothing passed, `hue` fills the region with the
 * hue's wash under the grain, so a card is never a blank rectangle waiting for a picture. (The 2026-09-10 "no
 * photographs" rule was lifted when `Image` and `ProfileCard` arrived; this docstring said otherwise until the
 * 2026-09-14 release.)
 *
 * `layout="beside"` puts the media left at half the card and stacks below `sm`; `"above"` is the ordinary card.
 */
export interface MediaCardProps extends Omit<ComponentPropsWithoutRef<"article">, "title"> {
  title: ReactNode;
  /** The mono eyebrow — a date, a kind, a source. */
  meta?: ReactNode;
  /** One line under the title. */
  line?: ReactNode;
  /** An Image, a Pattern, a Blob — or nothing, and `hue` paints the region. */
  media?: ReactNode;
  /** Fills the media region when nothing is passed: the hue's wash under the grain. */
  hue?: Hue;
  layout?: "beside" | "above";
  /** Chips, a button — whatever the card ends with. */
  footer?: ReactNode;
  href?: string;
  as?: ElementType;
}

export function MediaCard({
  title, meta, line, media, hue, layout = "beside", footer, href, as, className, ...rest
}: MediaCardProps) {
  const Tag: ElementType = as ?? (href ? "a" : "article");
  return (
    <Tag
      className={cx("noo-media-card", `noo-media-card--${layout}`, href && "noo-media-card--link", className)}
      data-hue={hue ?? "accent"}
      href={href}
      {...rest}
    >
      <div className="noo-media-card__media noo-textured">{media}</div>
      <div className="noo-media-card__body">
        {meta ? <p className="noo-label noo-media-card__meta">{meta}</p> : null}
        <p className="noo-h4 noo-media-card__title">{title}</p>
        {line ? <p className="noo-body noo-media-card__line">{line}</p> : null}
        {footer ? <div className="noo-media-card__footer">{footer}</div> : null}
      </div>
    </Tag>
  );
}
