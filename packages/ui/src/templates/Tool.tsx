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
 *   where a screen has them, a `sidebar` on the left, an `inspector` on the right and a `bar` along the bottom.
 *
 * Density comes from what a screen puts in `main` — a `Table`, `Tabs`, `Steps` — never from cards of prose
 * (Brand.md §10). Main is a column with `--s-10` between its children; give it components, not spacing.
 *
 * **The editor's shell** (Admin.md §6.5 row 1, built 2026-09-14): `sidebar` is the palette and the outline, the
 * inspector's mirror at the Menu column's width; `flush` pins the screen to the viewport and strips main's gutters
 * so its one child — the canvas — fills it edge to edge, with the sidebar, the inspector and the bar floating
 * beside it on the ground. The admin's Menu drops to its rail form on that route to make room (`AdminRail`).
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
  /** The palette and the outline, on the left. Only under an editor. */
  sidebar?: ReactNode;
  /** The selected thing's props. Only where a screen has a selection. */
  inspector?: ReactNode;
  /** The bottom bar: zoom, theme, viewport — only under an editor. */
  bar?: ReactNode;
  /** No gutters: the screen is pinned to the viewport and main's one child fills it. For the canvas. */
  flush?: boolean;
  /** id of the main landmark; the Menu's skip link points here. */
  mainId?: string;
  titleId?: string;
}

export function ToolScreen({ eyebrow, title, meta, actions, sidebar, inspector, bar, flush, mainId = "main", titleId = "screen-title", className, children, ...rest }: ToolScreenProps) {
  return (
    <div
      className={cx(
        "noo-tool__screen",
        Boolean(sidebar) && "noo-tool__screen--sidebar",
        Boolean(inspector) && "noo-tool__screen--inspector",
        Boolean(bar) && "noo-tool__screen--bar",
        flush && "noo-tool__screen--flush",
        className,
      )}
      {...rest}
    >
      <header className="noo-tool__header">
        <div className="noo-tool__heading">
          {eyebrow ? <Label className="noo-tool__eyebrow">{eyebrow}</Label> : null}
          <h1 id={titleId} className="noo-heading noo-h4 noo-tool__title">{title}</h1>
          {meta ? <div className="noo-tool__meta">{meta}</div> : null}
        </div>
        {actions ? <div className="noo-tool__actions">{actions}</div> : null}
      </header>
      {sidebar ? <aside className="noo-glass noo-glass--1 noo-tool__sidebar" aria-label="Sidebar">{sidebar}</aside> : null}
      <main id={mainId} tabIndex={-1} className={cx("noo-tool__main", flush && "noo-tool__main--flush")} aria-labelledby={titleId}>
        {children}
      </main>
      {inspector ? <aside className="noo-glass noo-glass--1 noo-tool__inspector" aria-label="Inspector">{inspector}</aside> : null}
      {bar ? <footer className="noo-glass noo-glass--2 noo-tool__bar">{bar}</footer> : null}
    </div>
  );
}
