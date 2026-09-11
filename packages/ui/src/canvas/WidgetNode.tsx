"use client";
import { memo, type ReactNode } from "react";
import type { NodeProps } from "@xyflow/react";
import { cx } from "../cx";
import { useCanvasNav } from "./nav";
import type { WidgetFlowNode } from "./scene";

/**
 * WidgetNode — one section of the ring, previewed from a distance (Design-System.md §8.3–8.4).
 *
 * It is the counterpart to `PanelNode`: a panel carries reading matter and must never be dragged or clicked
 * away from, a widget is a *destination* and its whole job is to be clicked. So unlike a panel it is focusable,
 * it has a button role, and it takes the pointer.
 *
 * It renders a `SectionWidget` (or anything else the host passes) at a fixed size in canvas space, so the same
 * markup serves the map, the browse tier and the thumbnail in the minimap — nothing is re-rendered per zoom and
 * nothing is ever unmounted, which is what keeps every word in the accessibility tree at every scale (§12).
 */
export interface WidgetNodeData extends Record<string, unknown> {
  /** The widget itself. */
  content: ReactNode;
  /** The view this opens — the shell turns a click or Enter into that. */
  view: string;
  /** Names it for assistive tech: "Work experience. Open." */
  label: string;
}

export const WidgetNode = memo(function WidgetNode({ data }: NodeProps<WidgetFlowNode>) {
  const nav = useCanvasNav();
  // The wrapper already carries role="button", the tab stop and the label (`sceneToNodes`), and Enter is handled
  // by the shell — so this is the pointer path only, and must not add a second set of semantics.
  return (
    <div className={cx("noo-widget nopan")} data-view={data.view} onClick={() => nav?.open?.(data.view)}>
      {data.content}
    </div>
  );
});
