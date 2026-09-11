"use client";
import { memo, type ReactNode } from "react";
import type { NodeProps } from "@xyflow/react";
import { cx } from "../cx";
import { useZoomTier } from "./lod";
import type { PanelFlowNode } from "./scene";

/**
 * PanelNode — a surface in canvas space holding one card (Design-System.md §8.2). The workhorse of a canvas that
 * carries reading matter: every word of the portfolio lands in one of these.
 *
 * Three things it has to undo about React Flow, all of them found the hard way:
 *  - `.react-flow__node` sets `user-select: none`, so without `.noo-panel` re-enabling it not one word can be copied;
 *  - a drag inside a panel would pan the canvas instead of selecting text, hence `nopan`;
 *  - the node must not be draggable at all — dragging what you are reading is hostile (set in `sceneToNodes`).
 */
export interface PanelNodeData extends Record<string, unknown> {
  content: ReactNode;
  /** `none` is bare type on the grid — region intros use it, exactly as `SectionHeader` does in page mode. */
  surface?: "glass" | "solid" | "none";
  /** Names the panel for assistive tech when its content has no heading of its own. */
  label?: string;
  /** Content taller than the panel scrolls inside it; `nowheel` so the wheel scrolls rather than pans. */
  scroll?: boolean;
}

export const PanelNode = memo(function PanelNode({ data }: NodeProps<PanelFlowNode>) {
  const tier = useZoomTier();
  const surface = data.surface ?? "glass";
  return (
    <div
      className={cx(
        "noo-panel nopan",
        surface === "glass" && "glass glass-1 noo-panel--glass",
        surface === "solid" && "noo-panel--solid",
        surface === "none" && "noo-panel--bare",
        data.scroll && "noo-panel--scroll nowheel",
      )}
      data-tier={tier}
    >
      <div className="noo-panel__content">{data.content}</div>
    </div>
  );
});
