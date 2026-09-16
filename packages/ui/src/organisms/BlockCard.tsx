import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { Blob } from "../atoms/blob/Blob";
import { Card } from "../atoms/Card";
import { Chip } from "../atoms/Chip";
import type { Hue } from "../tokens/tokens";
import { cx } from "../cx";

/**
 * BlockCard (§9) — Card + the block's hue (a dot, or a Blob `sm`) + h4 + one line + Chips. The Work item, and —
 * with `state="sleep"` — the roadmap item too (D3): a block that is not here yet carries a hollow dot or a sleeping
 * blob and says what it will do, never "coming soon" (Brand.md principle 4). `progress` is its short state in the
 * mono voice: "designing", "after the portfolio".
 *
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
  /** A short state in the mono label voice, under everything: "after the portfolio · designing". */
  progress?: ReactNode;
  href?: string;
  as?: ElementType;
  /** `sleep` for a block that is not here yet: the blob sleeps, the dot goes hollow. */
  state?: "idle" | "sleep";
  /**
   * Show the blob. **Off by default since 2026-09-10:** the blob is the mark for an *agent*, and a job is not an
   * agent (Brand.md §9). Without it the card carries its hue as a dot, which — unlike the text — survives the
   * map zoom tier, so a zoomed-out column stays colour-coded.
   */
  blob?: boolean;
}

export function BlockCard({ hue, title, line, meta, details, chips, progress, href, as, state = "idle", blob = false, className, children, ...rest }: BlockCardProps) {
  return (
    <Card
      as={as ?? (href ? "a" : "article")}
      href={href}
      interactive={Boolean(href)}
      className={cx("noo-block-card", !blob && "noo-block-card--dot", state === "sleep" && "noo-block-card--sleep", className)}
      data-hue={hue}
      {...rest}
    >
      {blob ? (
        <Blob size="sm" hue={hue} state={state} className="noo-block-card__blob" />
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
        {progress ? <p className="noo-label noo-block-card__progress">{progress}</p> : null}
      </div>
    </Card>
  );
}
