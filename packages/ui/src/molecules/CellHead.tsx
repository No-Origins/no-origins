import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";
import { Dot } from "../atoms/Dot";
import { Label } from "../atoms/Label";
import type { Hue } from "../tokens/tokens";

/**
 * CellHead (§9) — a widget cell's mono label over a title, with an optional hue dot.
 *
 * The same shape four times in the Work widget alone (Scene-Schema.md §9.3 ⑨), typed out by hand each time as two
 * `<p>` tags inside `content/sections.tsx`. It is composable from `Label` + `Row` + `Dot` + a title, and it is
 * registered anyway: authoring a widget cell should be one node, not four.
 *
 * The title is 22/1.15 Hanken 600 — `--bento-title`, a size that belongs to the widget rather than to the
 * document scale, because a widget is read from about twice as far away (§8.3).
 */
export interface CellHeadProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  label?: ReactNode;
  title: ReactNode;
  dot?: Hue;
}

export function CellHead({ label, title, dot, className, ...rest }: CellHeadProps) {
  return (
    <div className={cx("noo-cellhead", className)} {...rest}>
      {label ? <Label>{label}</Label> : null}
      <p className="noo-bento__title noo-cellhead__title">
        {dot ? <Dot hue={dot} /> : null}
        {title}
      </p>
    </div>
  );
}
