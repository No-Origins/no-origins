import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cx } from "../cx";
import { Wordmark } from "../wordmark/Wordmark";
import type { Hue } from "../tokens";

/**
 * Rail (Admin.md §10) — page mode's `NavBar` as a column.
 *
 * **Why a column at all.** §4: "Rail, not tabs. Seven-plus destinations in a row collides the same way the canvas
 * view switcher did at five (Design-System.md §8.5) — the answer there was a column, and it is the answer here."
 * So this is not a second nav with a different look; it is the same nav rotated, and it keeps the bar's grammar:
 * the wordmark goes home, the current item is `--accent-deep`, and there is a skip link before anything else.
 *
 * **The one translated detail is the current marker.** The bar underlines; a column cannot, because an underline
 * in a stack reads as a divider between two items rather than as a mark on one. It becomes a 2px bar on the
 * leading edge — the same 2px, the same `--accent-deep`, on the edge a column actually has.
 *
 * **Groups carry a hue, and that is structural.** Admin.md §1 is a claim about three layers; §4 asks every screen
 * to state which one it is on. A group's `hue` puts that claim in the navigation itself rather than only in an
 * eyebrow, so the three layers are visible before you have opened anything.
 *
 * `linkComponent` is the router's link (Next: `Link`); the default is a plain `<a>`, per Design-System.md §11.2
 * rule 1 — the package must stand up with no framework under it.
 */
export interface RailItem {
  href: string;
  label: ReactNode;
  /** One level of nesting, and one only. A rail that needs two is an outline, which is a different component. */
  items?: RailItem[];
}

export interface RailGroup {
  /** The mono eyebrow over the group. */
  label?: ReactNode;
  /** The layer's hue — it puts §1's three layers in the navigation rather than only in a heading. */
  hue?: Hue;
  items: RailItem[];
}

export interface RailProps extends Omit<ComponentPropsWithoutRef<"nav">, "title"> {
  groups: RailGroup[];
  /** The pathname to mark current. Matched exactly, or as a prefix for nested routes. */
  currentHref?: string;
  homeHref?: string;
  linkComponent?: ElementType;
  /** Replaces the wordmark at the top. */
  brand?: ReactNode;
  /** Pinned to the bottom: the theme switch, who is signed in. */
  trailing?: ReactNode;
  skipTo?: string;
  skipLabel?: ReactNode;
  "aria-label"?: string;
}

function isCurrent(href: string, current?: string): boolean {
  if (!current) return false;
  if (href === "/") return current === "/";
  return current === href || current.startsWith(href + "/");
}

export function Rail({
  groups,
  currentHref,
  homeHref = "/",
  linkComponent,
  brand,
  trailing,
  skipTo = "#main",
  skipLabel = "Skip to content",
  className,
  ...rest
}: RailProps) {
  const L: ElementType = linkComponent ?? "a";

  const renderItem = (item: RailItem, depth: 0 | 1) => {
    const current = isCurrent(item.href, currentHref);
    return (
      <li key={item.href} className="noo-rail__item">
        <L
          href={item.href}
          className={cx("noo-rail__link", depth === 1 && "noo-rail__link--sub")}
          aria-current={current ? "page" : undefined}
        >
          {item.label}
        </L>
        {/* Children render only under the branch you are in. A rail that shows every leaf at once is an outline
            with no fold, and at that point the column has the same problem the row had. */}
        {item.items?.length && current ? (
          <ul className="noo-rail__list noo-rail__list--sub">
            {item.items.map((child) => renderItem(child, 1))}
          </ul>
        ) : null}
      </li>
    );
  };

  return (
    <nav className={cx("glass glass-2 noo-rail", className)} aria-label={rest["aria-label"] ?? "Primary"} {...rest}>
      <a href={skipTo} className="noo-skip">
        {skipLabel}
      </a>

      <div className="noo-rail__brand">
        <L href={homeHref} className="noo-rail__home" aria-label="No Origins — home">
          {brand ?? <Wordmark aria-hidden="true" />}
        </L>
      </div>

      <div className="noo-rail__groups">
        {groups.map((group, i) => (
          <div key={i} className="noo-rail__group" data-hue={group.hue}>
            {group.label ? (
              <p className="noo-label noo-rail__group-label">
                <span className="noo-rail__group-dot" aria-hidden="true" />
                {group.label}
              </p>
            ) : null}
            <ul className="noo-rail__list">{group.items.map((item) => renderItem(item, 0))}</ul>
          </div>
        ))}
      </div>

      {trailing ? <div className="noo-rail__trailing">{trailing}</div> : null}
    </nav>
  );
}
