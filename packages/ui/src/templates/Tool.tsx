import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";
import { Label } from "../atoms/Label";

/**
 * Tool (Atomic.md D6) — the control surface's shell: menu · header · main · sidebar · inspector · bar.
 *
 * `Page` is a reading layout and stays one; a tool wants persistent chrome — a menu that does not scroll away, a
 * header that stays, an inspector pinned to an edge (Admin.md §3). Two parts, because a Next layout wraps pages:
 *
 * - `Tool` holds the `menu` (a `Menu` in its column form) beside a column. The layout renders it once, so the menu
 *   never remounts between screens.
 * - `ToolScreen` is one screen inside that column: a 60px header on the ground with a hairline below — the layer
 *   eyebrow, the title, the screen's `meta` and `actions` — then `main#main`, fluid with 32px gutters, and only
 *   where a screen has them, a `sidebar` on the left, an `inspector` on the right and a `bar` along the bottom.
 *   The three regions are surfaces (level 1 at the sides, level 2 for the bar) around their own scroll region.
 *
 * Density comes from what a screen puts in `main` — a `Table`, `Tabs`, `Steps` — never from cards of prose
 * (Brand.md §10). Main is a column with `--s-10` between its children; give it components, not spacing.
 *
 * **The tool is the viewport** (2026-09-15). `Tool` is exactly one screen tall and its column is the one thing
 * that scrolls — the document never does, so the menu and the header stay where they are.
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
  /** The layer, in the menu's own words: "Projects", "Systems", "Products" (Admin.md §4). */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Beside the title: state chips, a saved-at time. */
  meta?: ReactNode;
  /** Right-aligned: the screen's one or two buttons. */
  actions?: ReactNode;
  /** A left column: an outline, a list of things to pick from. */
  sidebar?: ReactNode;
  /** The selected thing's props. Only where a screen has a selection. */
  inspector?: ReactNode;
  /** The bottom bar: a screen's persistent controls. */
  bar?: ReactNode;
  /** id of the main landmark; the Menu's skip link points here. */
  mainId?: string;
  titleId?: string;
}

export function ToolScreen({ eyebrow, title, meta, actions, sidebar, inspector, bar, mainId = "main", titleId = "screen-title", className, children, ...rest }: ToolScreenProps) {
  return (
    <div
      className={cx(
        "noo-tool__screen",
        Boolean(sidebar) && "noo-tool__screen--sidebar",
        Boolean(inspector) && "noo-tool__screen--inspector",
        Boolean(bar) && "noo-tool__screen--bar",
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
      {sidebar ? (
        <aside className="noo-surface noo-surface--1 noo-tool__sidebar" aria-label="Sidebar">
          <div className="noo-tool__scroll">{sidebar}</div>
        </aside>
      ) : null}
      <main id={mainId} tabIndex={-1} className="noo-tool__main" aria-labelledby={titleId}>
        {children}
      </main>
      {inspector ? (
        <aside className="noo-surface noo-surface--1 noo-tool__inspector" aria-label="Inspector">
          <div className="noo-tool__scroll">{inspector}</div>
        </aside>
      ) : null}
      {bar ? <footer className="noo-surface noo-surface--2 noo-tool__bar">{bar}</footer> : null}
    </div>
  );
}
