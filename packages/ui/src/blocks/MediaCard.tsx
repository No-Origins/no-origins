import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cx } from "../cx";
import type { Hue } from "../tokens";

/**
 * MediaCard (§9) — a card with a picture beside its words.
 *
 * The `media` region is **not an image slot**. No photographs anywhere on the platform (decided 2026-09-10):
 * what goes in here is an `Illustration`, a `Blob`, or a tinted-and-grained panel, which is what `tone` gives you
 * for free. If that decision is ever reversed this is the component that gains an `Image`, and until then the
 * region is honest about being drawn rather than shot.
 *
 * `layout="beside"` puts the media left at half the card and stacks below `sm`; `"above"` is the ordinary card.
 */
export interface MediaCardProps extends Omit<ComponentPropsWithoutRef<"article">, "title"> {
  title: ReactNode;
  /** The mono eyebrow — a date, a kind, a source. */
  meta?: ReactNode;
  /** One line under the title. */
  line?: ReactNode;
  /** Illustration, blob, or a drawn panel. Never a photograph. */
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
      data-hue={hue}
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
