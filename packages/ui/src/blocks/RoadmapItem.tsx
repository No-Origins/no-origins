import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Blob } from "../blob/Blob";
import { Card } from "../primitives/Card";
import type { Hue } from "../tokens";
import { cx } from "../cx";

/**
 * RoadmapItem (§9) — Card + Blob `sm` asleep + h4 + "not here yet — here's what it'll do" + an optional progress
 * label. Principle 4: unfinished things get a sleeping blob, never a "coming soon".
 */
export interface RoadmapItemProps extends Omit<ComponentPropsWithoutRef<"article">, "title"> {
  hue: Hue;
  title: ReactNode;
  description: ReactNode;
  /** A short state, in the mono label voice: "designing", "after the portfolio". */
  progress?: ReactNode;
  /** Show the sleeping blob. Off by default — see `BlockCard.blob`. */
  blob?: boolean;
}

export function RoadmapItem({ hue, title, description, progress, blob = false, className, children, ...rest }: RoadmapItemProps) {
  return (
    <Card as="article" className={cx("noo-roadmap-item", !blob && "noo-block-card--dot", className)} data-hue={hue} {...rest}>
      {blob ? (
        <Blob size="sm" hue={hue} state="sleep" refraction={false} className="noo-roadmap-item__blob" />
      ) : (
        <span className="noo-block-card__hue" aria-hidden="true" />
      )}
      <div className="noo-roadmap-item__body">
        <h3 className="noo-h4 noo-roadmap-item__title">{title}</h3>
        <p className="noo-body-sm noo-roadmap-item__description">{description}</p>
        {children}
        {progress ? <p className="noo-label noo-roadmap-item__progress">{progress}</p> : null}
      </div>
    </Card>
  );
}
