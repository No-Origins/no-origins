import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { Blob } from "../blob/Blob";
import { Card } from "../primitives/Card";
import { Chip } from "../primitives/Chip";
import type { Hue } from "../tokens";
import { cx } from "../cx";

/**
 * BlockCard (§9) — Card + Blob `sm` in the block's hue + h4 + one line + Chips. The Work item.
 * `details` adds a short list under the line; `meta` is the eyebrow (company · when). With `href` the whole card
 * is a link, so keep the chips as labels (they are, unless given `onClick`).
 */
export interface BlockChip {
  label: ReactNode;
  hue?: Hue | "accent";
}

export interface BlockCardProps extends Omit<ComponentPropsWithoutRef<"article">, "title"> {
  hue: Hue;
  title: ReactNode;
  line: ReactNode;
  meta?: ReactNode;
  details?: ReactNode[];
  chips?: BlockChip[];
  href?: string;
  as?: ElementType;
  /** The blob's state; `sleep` for a block that is not here yet. */
  state?: "idle" | "sleep";
  /**
   * Show the blob. **Off by default since 2026-09-10:** the blob is the mark for an *agent*, and a job is not an
   * agent (Brand.md §9). Without it the card carries its hue as a dot, which — unlike the text — survives the
   * map zoom tier, so a zoomed-out column stays colour-coded.
   */
  blob?: boolean;
}

export function BlockCard({ hue, title, line, meta, details, chips, href, as, state = "idle", blob = false, className, children, ...rest }: BlockCardProps) {
  return (
    <Card as={as ?? (href ? "a" : "article")} href={href} interactive={Boolean(href)} className={cx("noo-block-card", !blob && "noo-block-card--dot", className)} data-hue={hue} {...rest}>
      {blob ? (
        <Blob size="sm" hue={hue} state={state} refraction={false} className="noo-block-card__blob" />
      ) : (
        <span className="noo-block-card__hue" aria-hidden="true" />
      )}
      <div className="noo-block-card__body">
        {meta ? <p className="noo-label noo-block-card__meta">{meta}</p> : null}
        <h3 className="noo-h4 noo-block-card__title">{title}</h3>
        <p className="noo-body-sm noo-block-card__line">{line}</p>
        {details?.length ? (
          <ul className="noo-body-sm noo-block-card__details">
            {details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        ) : null}
        {children}
        {chips?.length ? (
          <div className="noo-block-card__chips">
            {chips.map((c, i) => (
              <Chip key={i} hue={c.hue ?? hue}>
                {c.label}
              </Chip>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
