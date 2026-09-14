"use client";
import { useSyncExternalStore, type ComponentPropsWithoutRef, type ElementType, type MouseEvent, type ReactNode } from "react";
import { cx } from "../cx";
import { Wordmark } from "../atoms/Wordmark";
import { breakpoints, type Hue } from "../tokens/tokens";

/**
 * Menu (Atomic.md D9) — the one navigation column, in five forms.
 *
 * - `column` (280): brand, groups of pill items at `--ctl-md`, one level of children on a rule, a trailing slot.
 *   The current item is an ink pill — the primary button's material — replacing the Rail's 2px edge bar.
 * - `rail` (72): the same items with their labels lifted into a hover/focus bubble; groups keep a hairline.
 * - two columns (≥ `lg`): when the current top-level item declares a `panel`, its groups open in a second column;
 *   below `lg` the panel folds into the item's children. Not a form you ask for — the item asks for it.
 * - `floating` (188): no brand, items at `--ctl-sm`. The canvas's view switcher, placed as a `menu` node.
 * - `sheet`: the small-screen bottom bar with icons over short labels — the NavBar's old sheet, now this.
 *
 * `auto` picks column ≥ `md`, rail between `sm` and `md`, and below `sm` a sheet when five or fewer top-level
 * items fit in it, else the rail. Same grammar throughout: xl outside, pill items, the current item in ink.
 *
 * It replaces `Rail`, the NavBar's sheet and `CanvasShell`'s built-in menu — three hand-built menus, one answer to
 * "where am I". `linkComponent` is the router's link (Next: `Link`); the default is `<a>` (§11.2 rule 1). An item
 * with `onSelect` and no `href` renders a button; with both, the click is intercepted and `onSelect` runs unless a
 * modifier key asks for a new tab.
 */
export interface MenuItem {
  /** Stable key; defaults to `href`, then the label. */
  id?: string;
  label: ReactNode;
  href?: string;
  /** Moves something instead of loading something — the canvas pans. */
  onSelect?: () => void;
  /** An `<Icon>` from `@no-origins/ui/icons`, or any 20px glyph. */
  icon?: ReactNode;
  /** A short count. */
  badge?: ReactNode;
  /** A trailing control beside the item — an add button, a pin. Hidden in the rail and the sheet. */
  action?: ReactNode;
  /** One level of children, shown while this item is current. A menu that needs two is a `Tree`. */
  items?: MenuItem[];
  /** Groups for a second column while this item is current (≥ `lg`); they fold into children below. */
  panel?: MenuGroup[];
  /** Mark current without a pathname (the canvas knows which view it is looking at). */
  current?: boolean;
}

export interface MenuGroup {
  /** The mono eyebrow over the group. */
  label?: ReactNode;
  /** The layer's hue — it puts Admin.md §1's three layers in the navigation rather than only in a heading. */
  hue?: Hue;
  items: MenuItem[];
}

export type MenuForm = "auto" | "column" | "rail" | "floating" | "sheet";

export interface MenuProps extends Omit<ComponentPropsWithoutRef<"nav">, "title"> {
  groups?: MenuGroup[];
  /** Shorthand for one unlabelled group. */
  items?: MenuItem[];
  form?: MenuForm;
  /** The pathname to mark current. Matched exactly, or as a prefix for nested routes. */
  currentHref?: string;
  homeHref?: string;
  linkComponent?: ElementType;
  /** Replaces the wordmark at the top; `false` removes the brand row. */
  brand?: ReactNode | false;
  /** Pinned to the bottom: the theme switch, who is signed in. */
  trailing?: ReactNode;
  /** The skip link's target; `false` for a menu that is not the page's primary navigation. */
  skipTo?: string | false;
  skipLabel?: ReactNode;
  "aria-label"?: string;
}

function isCurrent(href: string | undefined, current?: string): boolean {
  if (!href || !current) return false;
  if (href === "/") return current === "/";
  return current === href || current.startsWith(href + "/");
}

const keyOf = (item: MenuItem, i: number) => item.id ?? item.href ?? (typeof item.label === "string" ? item.label : String(i));

/* `auto` resolves against the viewport on the client; the server renders the column. */
const QUERIES = { md: `(min-width: ${breakpoints.md}px)`, sm: `(min-width: ${breakpoints.sm}px)` };
const subscribeWidth = (cb: () => void) => {
  if (typeof window === "undefined") return () => undefined;
  const mqs = Object.values(QUERIES).map((q) => window.matchMedia(q));
  mqs.forEach((m) => m.addEventListener("change", cb));
  return () => mqs.forEach((m) => m.removeEventListener("change", cb));
};
const readWidth = (): "md" | "sm" | "xs" => {
  if (typeof window === "undefined") return "md";
  if (window.matchMedia(QUERIES.md).matches) return "md";
  if (window.matchMedia(QUERIES.sm).matches) return "sm";
  return "xs";
};
const serverWidth = () => "md" as const;

export function Menu({
  groups: givenGroups,
  items,
  form = "auto",
  currentHref,
  homeHref = "/",
  linkComponent,
  brand,
  trailing,
  skipTo = "#main",
  skipLabel = "Skip to content",
  className,
  ...rest
}: MenuProps) {
  const L: ElementType = linkComponent ?? "a";
  const groups: MenuGroup[] = givenGroups ?? (items ? [{ items }] : []);
  const topLevel = groups.reduce((n, g) => n + g.items.length, 0);
  const width = useSyncExternalStore(subscribeWidth, readWidth, serverWidth);
  const resolved: Exclude<MenuForm, "auto"> =
    form !== "auto" ? form : width === "md" ? "column" : width === "sm" ? "rail" : topLevel <= 5 ? "sheet" : "rail";

  const current = (item: MenuItem): boolean => item.current ?? isCurrent(item.href, currentHref);
  const open = (item: MenuItem): boolean => current(item) || (item.items?.some(open) ?? false) || (item.panel?.some((g) => g.items.some(open)) ?? false);
  const panelOwner = groups.flatMap((g) => g.items).find((it) => it.panel?.length && open(it));

  const renderItem = (item: MenuItem, i: number, depth: 0 | 1): ReactNode => {
    const isCur = current(item);
    const onClick = item.onSelect
      ? (e: MouseEvent<HTMLElement>) => {
          if (item.href && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) return;
          if (item.href) e.preventDefault();
          item.onSelect?.();
        }
      : undefined;
    const inner = (
      <>
        {item.icon ? (
          <span className="noo-menu__icon" aria-hidden="true">{item.icon}</span>
        ) : (
          /* the rail and the sheet need a glyph; without an icon the label's initial stands in */
          <span className="noo-menu__initial" aria-hidden="true">{typeof item.label === "string" ? item.label.trim().charAt(0) : "·"}</span>
        )}
        <span className="noo-menu__label">{item.label}</span>
        {item.badge !== undefined ? <span className="noo-menu__badge">{item.badge}</span> : null}
      </>
    );
    const link = item.href ? (
      <L href={item.href} className="noo-menu__link" aria-current={isCur ? "page" : undefined} onClick={onClick}>
        {inner}
      </L>
    ) : (
      <button type="button" className="noo-menu__link" aria-current={isCur ? "true" : undefined} onClick={onClick}>
        {inner}
      </button>
    );
    const showChildren = depth === 0 && open(item);
    const folded = showChildren && item.panel?.length ? item.panel.flatMap((g) => g.items) : [];
    return (
      <li key={keyOf(item, i)} className="noo-menu__item">
        <div className="noo-menu__row">
          {link}
          {item.action ? <span className="noo-menu__action">{item.action}</span> : null}
        </div>
        {showChildren && (item.items?.length || folded.length) ? (
          <ul className={cx("noo-menu__list noo-menu__list--sub", folded.length > 0 && !item.items?.length && "noo-menu__fold")}>
            {(item.items ?? []).map((child, j) => renderItem(child, j, 1))}
            {folded.map((child, j) => renderItem(child, j + 1000, 1))}
          </ul>
        ) : null}
      </li>
    );
  };

  const renderGroups = (gs: MenuGroup[]) =>
    gs.map((group, gi) => (
      <div key={gi} className="noo-menu__group" data-hue={group.hue ?? "accent"}>
        {group.label ? (
          <p className="noo-label noo-menu__group-label">
            <span className="noo-menu__group-dot" aria-hidden="true" />
            {group.label}
          </p>
        ) : null}
        <ul className="noo-menu__list">{group.items.map((item, i) => renderItem(item, i, 0))}</ul>
      </div>
    ));

  const showBrand = brand !== false && resolved !== "floating" && resolved !== "sheet";
  return (
    <nav
      className={cx("noo-glass noo-glass--2 noo-menu", `noo-menu--${resolved}`, panelOwner && resolved === "column" && "noo-menu--two", className)}
      aria-label={rest["aria-label"] ?? "Primary"}
      {...rest}
    >
      {skipTo && resolved !== "floating" ? (
        <a href={skipTo} className="noo-skip">
          {skipLabel}
        </a>
      ) : null}
      <div className="noo-menu__col">
        {showBrand ? (
          <div className="noo-menu__brand">
            <L href={homeHref} className="noo-menu__home" aria-label="No Origins — home">
              {brand ?? <Wordmark aria-hidden="true" />}
            </L>
          </div>
        ) : null}
        <div className="noo-menu__groups">{renderGroups(groups)}</div>
        {trailing ? <div className="noo-menu__trailing">{trailing}</div> : null}
      </div>
      {panelOwner && resolved === "column" ? (
        <>
          <div className="noo-menu__divider" aria-hidden="true" />
          <div className="noo-menu__col noo-menu__panel">{renderGroups(panelOwner.panel!)}</div>
        </>
      ) : null}
    </nav>
  );
}
