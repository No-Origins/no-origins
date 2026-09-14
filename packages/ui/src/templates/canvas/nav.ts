"use client";
import { createContext, useContext } from "react";

/**
 * Canvas navigation, for content inside the canvas (Design-System.md §8.5). A paragraph that says "the work is on
 * Work" should move the viewport, not reload the document — so the shell publishes `goTo` and anything in a panel
 * can reach it.
 */
export interface CanvasNav {
  goTo: (id: string) => void;
  /** The view the viewport is currently looking at. */
  current?: string;
  /**
   * Open a section's full view (§8.4). A widget calls this on click: React Flow only routes node clicks through
   * its drag machinery, so a node that is deliberately NOT draggable — and a widget must not be dragged off the
   * ring — never receives one. Enter still arrives through the shell's key handler either way.
   */
  open?: (view: string) => void;
}

export const CanvasNavContext = createContext<CanvasNav | null>(null);
export const CanvasNavProvider = CanvasNavContext.Provider;

export function useCanvasNav(): CanvasNav | null {
  return useContext(CanvasNavContext);
}
