import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cx } from "../cx";
import { Wordmark } from "../atoms/Wordmark";
import { Menu } from "./Menu";

/**
 * NavBar (§9) — a level-2 surface, 60px, sticky. Wordmark left, links right; the current link is `--accent-deep` with a
 * 2px underline. Below `md` the links move to a `Menu` in its sheet form at the bottom of the viewport (D9); the bar
 * keeps the wordmark. `linkComponent` is the router's link (Next: `Link`); default `<a>` (§11.2 rule 1). The first
 * thing in the bar is a skip link to `#main`.
 */
export interface NavLink {
  href: string;
  label: ReactNode;
}

export interface NavBarProps extends ComponentPropsWithoutRef<"header"> {
  links: NavLink[];
  /** The pathname to mark as current (`aria-current="page"`). Matched exactly, or as a prefix for nested routes. */
  currentHref?: string;
  homeHref?: string;
  linkComponent?: ElementType;
  /** Right-hand slot: a CTA, a theme switch. */
  trailing?: ReactNode;
  skipTo?: string;
  skipLabel?: ReactNode;
}

function isCurrent(href: string, current?: string): boolean {
  if (!current) return false;
  if (href === "/") return current === "/";
  return current === href || current.startsWith(href + "/");
}

export function NavBar({ links, currentHref, homeHref = "/", linkComponent, trailing, skipTo = "#main", skipLabel = "Skip to content", className, ...rest }: NavBarProps) {
  const L: ElementType = linkComponent ?? "a";
  const renderLinks = () =>
    links.map((link) => {
      const current = isCurrent(link.href, currentHref);
      return (
        <L key={link.href} href={link.href} className={cx("noo-nav__link", current && "is-current")} aria-current={current ? "page" : undefined}>
          {link.label}
        </L>
      );
    });
  return (
    <>
      <header className={cx("noo-surface noo-surface--2 noo-nav", className)} {...rest}>
        <a href={skipTo} className="noo-skip">
          {skipLabel}
        </a>
        <div className="noo-container noo-nav__inner">
          <L href={homeHref} className="noo-nav__home" aria-label="No Origins — home">
            <Wordmark aria-hidden="true" />
          </L>
          <nav className="noo-nav__links" aria-label="Primary">
            {renderLinks()}
          </nav>
          {trailing ? <div className="noo-nav__trailing">{trailing}</div> : null}
        </div>
      </header>
      <Menu form="sheet" items={links} currentHref={currentHref} linkComponent={linkComponent} skipTo={false} brand={false} className="noo-nav__sheet" aria-label="Primary" />
    </>
  );
}
