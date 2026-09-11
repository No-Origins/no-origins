import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cx } from "../cx";
import { Wordmark } from "../wordmark/Wordmark";
import type { NavLink } from "./NavBar";

/**
 * Footer (§9) — the name in running text, a line of meta (the domain), links, and a trailing slot for the theme
 * switch. Sits on the ground, not on glass; a hairline above.
 */
export interface FooterProps extends ComponentPropsWithoutRef<"footer"> {
  links?: NavLink[];
  linkComponent?: ElementType;
  /** Under the name: the domain, a year, a one-liner. */
  meta?: ReactNode;
  trailing?: ReactNode;
}

export function Footer({ links = [], linkComponent, meta, trailing, className, children, ...rest }: FooterProps) {
  const L: ElementType = linkComponent ?? "a";
  return (
    <footer className={cx("noo-footer", className)} {...rest}>
      <div className="noo-container noo-footer__inner">
        <div className="noo-footer__brand">
          <Wordmark as="text" className="noo-footer__name" />
          {meta ? <p className="noo-footer__meta">{meta}</p> : null}
        </div>
        {links.length ? (
          <nav className="noo-footer__links" aria-label="Footer">
            {links.map((link) => (
              <L key={link.href} href={link.href} className="noo-footer__link">
                {link.label}
              </L>
            ))}
          </nav>
        ) : null}
        {children}
        {trailing ? <div className="noo-footer__trailing">{trailing}</div> : null}
      </div>
    </footer>
  );
}
