import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";
import { Label } from "../atoms/Label";

/**
 * Tool (Atomic.md D6) — the control surface's shell: rail · header · main · inspector · footer bar.
 *
 * `Page` is a reading layout and stays one; a tool wants persistent chrome — a rail that does not pan away, a
 * header that stays, an inspector pinned to an edge (Admin.md §3). Two parts, because a Next layout wraps pages:
 *
 * - `Tool` holds the `menu` (a `Menu`, which takes the rail area) beside a column. The layout renders it once, so
 *   the rail never remounts between screens.
 * - `ToolScreen` is one screen inside that column: a 56px header on the ground with a hairline below — the layer
 *   eyebrow, the title, the screen's `meta` and `actions` — then `main#main`, fluid with 32px gutters, and only
 *   where a screen has them, an `inspector` on the right and a `bar` along the bottom.
 *
 * Density comes from what a screen puts in `main` — a `Table`, `Tabs`, `Steps` — never from cards of prose
 * (Brand.md §10). Main is a column with `--s-10` between its children; give it components, not spacing.
 */
export interface ToolProps extends ComponentPropsWithoutRef<"div"> {
  /** The navigation: a `Menu` in its column form (`auto` resolves to it on a desktop). */
  menu: ReactNode;
}

export function Tool({ menu, className, children, ...rest }: ToolProps) {
  return (
    <div className={cx("noo-tool", className)} {...rest}>
      {menu}
      <div className="noo-tool__column">{children}</div>
    </div>
  );
}

export interface ToolScreenProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  /** The layer, in the rail's own words: "Projects", "Systems", "Products" (Admin.md §4). */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Beside the title: state chips, a saved-at time. */
  meta?: ReactNode;
  /** Right-aligned: the screen's one or two buttons. */
  actions?: ReactNode;
  /** The selected thing's props. Only where a screen has a selection. */
  inspector?: ReactNode;
  /** The bottom bar: zoom, theme, viewport — only under an editor. */
  bar?: ReactNode;
  /** id of the main landmark; the Menu's skip link points here. */
  mainId?: string;
  titleId?: string;
}

export function ToolScreen({ eyebrow, title, meta, actions, inspector, bar, mainId = "main", titleId = "screen-title", className, children, ...rest }: ToolScreenProps) {
  return (
    <div className={cx("noo-tool__screen", Boolean(inspector) && "noo-tool__screen--inspector", Boolean(bar) && "noo-tool__screen--bar", className)} {...rest}>
      <header className="noo-tool__header">
        <div className="noo-tool__heading">
          {eyebrow ? <Label className="noo-tool__eyebrow">{eyebrow}</Label> : null}
          <h1 id={titleId} className="noo-heading noo-h4 noo-tool__title">{title}</h1>
          {meta ? <div className="noo-tool__meta">{meta}</div> : null}
        </div>
        {actions ? <div className="noo-tool__actions">{actions}</div> : null}
      </header>
      <main id={mainId} tabIndex={-1} className="noo-tool__main" aria-labelledby={titleId}>
        {children}
      </main>
      {inspector ? <aside className="noo-glass noo-glass--1 noo-tool__inspector" aria-label="Inspector">{inspector}</aside> : null}
      {bar ? <footer className="noo-glass noo-glass--2 noo-tool__bar">{bar}</footer> : null}
    </div>
  );
}
