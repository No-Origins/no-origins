import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cx } from "../cx";

/**
 * Page mode (Design-System.md §8): a reading layout. `Page` is the column — nav, `<main id="main">`, footer —
 * that fills the viewport; `Container` is the 1120px measure with 24 / 48 gutters; `Section` adds the vertical
 * rhythm (96 desktop / 64 mobile between sections). Canvas mode (the home) does not use these.
 */
export interface PageProps extends ComponentPropsWithoutRef<"div"> {
  nav?: ReactNode;
  footer?: ReactNode;
  /** id of the main landmark; the NavBar's skip link points here. */
  mainId?: string;
  mainClassName?: string;
}

export function Page({ nav, footer, mainId = "main", mainClassName, className, children, ...rest }: PageProps) {
  return (
    <div className={cx("noo-page", className)} {...rest}>
      {nav}
      <main id={mainId} tabIndex={-1} className={cx("noo-page__main", mainClassName)}>
        {children}
      </main>
      {footer}
    </div>
  );
}

export interface ContainerProps extends ComponentPropsWithoutRef<"div"> {
  as?: ElementType;
}
export function Container({ as, className, ...rest }: ContainerProps) {
  const Tag: ElementType = as ?? "div";
  return <Tag className={cx("noo-container", className)} {...rest} />;
}

export interface SectionProps extends ComponentPropsWithoutRef<"section"> {
  as?: ElementType;
  /** The page's one orchestrated arrival (§7): sections rise in, staggered 40ms. Off under reduced motion. */
  arrive?: boolean;
}
export function Section({ as, arrive = true, className, ...rest }: SectionProps) {
  const Tag: ElementType = as ?? "section";
  return <Tag className={cx("noo-section noo-container", arrive && "rise-in", className)} {...rest} />;
}
