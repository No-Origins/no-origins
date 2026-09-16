import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";
import { Label } from "../atoms/Label";

/**
 * CellHead (§9) — a widget cell's mono label over a title, spread across the cell.
 *
 * The same shape four times in the Work widget alone (Scene-Schema.md §9.3 ⑨), typed out by hand each time as two
 * `<p>` tags inside `content/sections.tsx`. It is composable from `Label` + a title, and it is registered anyway:
 * authoring a widget cell should be one node, not four.
 *
 * It **fills its cell and spreads** — the label at the top, the title at the bottom (Admin.md §6.5c F1). That
 * diagonal (Design-System.md §8.3) was the cell's job when an author wrote the two tags by hand; it is the
 * component's now, so a document gets it for free. In a page bento, where rows grow, it collapses back to a block.
 *
 * The title is 22/1.15 Hanken 600 — `--t-widget-title`, a size that belongs to the widget rather than to the
 * document scale, because a widget is read from about twice as far away (§8.3).
 */
export interface CellHeadProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  label?: ReactNode;
  title: ReactNode;
  /** A logo or a picture at 24px, inline in the title's first line — where the dot used to be. */
  media?: ReactNode;
}

export function CellHead({ label, title, media, className, ...rest }: CellHeadProps) {
  return (
    <div className={cx("noo-cellhead", className)} {...rest}>
      {label ? <Label>{label}</Label> : null}
      <p className="noo-bento__title noo-cellhead__title">
        {media ? <span className="noo-cellhead__media">{media}</span> : null}
        {title}
      </p>
    </div>
  );
}
