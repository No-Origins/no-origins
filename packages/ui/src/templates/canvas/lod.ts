"use client";
import { createContext, useContext } from "react";
import { useStore } from "@xyflow/react";

/**
 * Level of detail (Design-System.md §8.4). A canvas can show the shape of the whole thing, then the thing:
 * zoomed out the map reads (region labels, blobs, threads), zoomed in the panels do.
 *
 * The tiers cross-fade opacity and never unmount or `hidden` anything — a screen reader has no zoom level,
 * so every word stays in the accessibility tree at every scale (§12).
 */
export type ZoomTier = "map" | "titles" | "full";

/** Below this, only the map. Between the two, titles and meta. Above, everything. */
export const TIER_TITLES = 0.45;
export const TIER_FULL = 0.75;

export function tierFor(zoom: number): ZoomTier {
  return zoom < TIER_TITLES ? "map" : zoom < TIER_FULL ? "titles" : "full";
}

/** Narrow screens read the canvas as a document (§8.6): no viewport, so no tiers either. */
export const CanvasModeContext = createContext<{ flow: boolean }>({ flow: false });
export const CanvasModeProvider = CanvasModeContext.Provider;
export function useCanvasMode() {
  return useContext(CanvasModeContext);
}

export function useZoomTier(): ZoomTier {
  const { flow } = useCanvasMode();
  const zoom = useStore((s) => s.transform[2]);
  return flow ? "full" : tierFor(zoom);
}
