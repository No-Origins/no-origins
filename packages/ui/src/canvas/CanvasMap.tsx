"use client";
import { useEffect, useState } from "react";
import { MiniMap } from "@xyflow/react";
import { hues, type Hue } from "../tokens";
import type { SceneFlowNode } from "./scene";

/**
 * CanvasMap — React Flow's MiniMap dressed as glass-1 (Design-System.md §8.1). Off in v1 stopped being right the
 * moment the canvas grew wider than a screen: content off-screen is content that does not exist.
 *
 * Panels and regions draw as plates in the rule colour; a blob draws in its own hue, so the family is legible
 * even at map size.
 *
 * Rendered only after mount, and that is not a preference. React Flow's MiniMap picks its own `shapeRendering`
 * from something that resolves differently on the server than in the browser, so server-rendering it puts a
 * hydration mismatch on every page that carries a canvas. Nothing is lost by leaving it out of the first HTML:
 * it is a navigation aid, not content, and it appears the moment the canvas itself becomes interactive.
 */
const isHue = (v: unknown): v is Hue => typeof v === "string" && (hues as readonly string[]).includes(v);

export function CanvasMap({ label = "Canvas map" }: { label?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <MiniMap<SceneFlowNode>
      className="noo-canvas__map"
      position="top-left"
      pannable
      zoomable
      ariaLabel={label}
      offsetScale={2}
      nodeStrokeWidth={0}
      nodeBorderRadius={3}
      nodeColor={(n) => {
        if (n.type === "region") return "transparent";                     // the label is decoration; on the map it would be a slab
        if (n.type !== "blob") return "color-mix(in oklch, var(--ink) 20%, var(--ground))";
        const hue = n.data.hue;
        if (n.data.variant === "glass") return "var(--muted)";
        return isHue(hue) ? `var(--${hue})` : "var(--accent)";
      }}
    />
  );
}
