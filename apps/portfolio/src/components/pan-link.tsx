"use client";
import type { MouseEvent, ReactNode } from "react";
import { useCanvasNav } from "@no-origins/ui/canvas";

/**
 * A link inside the canvas that moves the viewport instead of loading a document (Design-System.md §8.5).
 * It stays a real `<a href>`, so it is crawlable, middle-clickable and works before hydration.
 */
export function PanLink({ view, href, children }: { view: string; href: string; children: ReactNode }) {
  const nav = useCanvasNav();
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!nav || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    nav.goTo(view);
  };
  return (
    <a href={href} onClick={onClick} className="font-medium text-accent-deep underline decoration-1 underline-offset-3">
      {children}
    </a>
  );
}
