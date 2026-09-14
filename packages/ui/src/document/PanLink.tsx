"use client";
import type { MouseEvent, ReactNode } from "react";
import { useCanvasNav } from "../templates/canvas/nav";

/**
 * PanLink — the `:pan[text]{view=id}` directive (Scene-Schema.md §3.5; Admin.md R4): a real `<a href>` that moves
 * the viewport instead of loading a document (Design-System.md §8.5). Crawlable, middle-clickable, and a plain
 * link before hydration or outside a canvas. The portfolio hand-wrote this in `pan-link.tsx`; a document needs it
 * in the package, because a document's prose renders here.
 */
export interface PanLinkProps {
  view: string;
  /** The view's own href, so the link works as a link. Falls back to a fragment. */
  href?: string;
  children: ReactNode;
}

export function PanLink({ view, href, children }: PanLinkProps) {
  const nav = useCanvasNav();
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!nav || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    nav.goTo(view);
  };
  return (
    <a href={href ?? `#${view}`} onClick={onClick} className="noo-panlink">
      {children}
    </a>
  );
}
