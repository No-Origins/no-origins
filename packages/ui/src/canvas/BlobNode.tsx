"use client";
import { memo, type ReactNode } from "react";
import { NodeToolbar, Position, useStore, type Node, type NodeProps } from "@xyflow/react";
import { Blob } from "../blob/Blob";
import { Bubble } from "../primitives/Bubble";
import { cx } from "../cx";
import type { Hue } from "../tokens";
import { useCanvasMode } from "./lod";

/**
 * BlobNode — a blob as a React Flow node (Design-System.md §8.2). The host is the same node with `variant: "glass"`.
 * A speaking blob carries its bubble as a NodeToolbar: anchored, follows the node, hides below zoom 0.5.
 *
 * In document mode (§8.6) the bubble is rendered inline instead: a NodeToolbar is positioned against the node's
 * transform, and in document mode there isn't one.
 */
export interface BlobNodeData extends Record<string, unknown> {
  label: string;
  hue?: Hue;
  variant?: "character" | "glass";
  state?: "idle" | "sleep";
  /** What the blob is saying, if anything. */
  say?: ReactNode;
  /** Tint for the bubble; default is plain glass. */
  tint?: Hue;
  /** Where clicking the blob goes. Without one — or a `view` — the blob is decorative. */
  href?: string;
  /** A view to pan to instead of a destination to open (§8.5). */
  view?: string;
  /** Put the bubble under the blob instead of top-right (narrow layouts). */
  below?: boolean;
  /** With `below`: which way the bubble opens, so it never leaves the viewport. */
  bubbleAlign?: "start" | "center" | "end";
}
export type BlobFlowNode = Node<BlobNodeData, "blob">;

/** Bubbles hide when the canvas is zoomed out past this. */
export const BUBBLE_MIN_ZOOM = 0.5;

export const BlobNode = memo(function BlobNode({ data, dragging }: NodeProps<BlobFlowNode>) {
  const { flow } = useCanvasMode();
  const zoom = useStore((s) => s.transform[2]);
  const speaking = Boolean(data.say) && (flow || zoom >= BUBBLE_MIN_ZOOM);
  const blob = (
    <Blob
      variant={data.variant ?? "character"}
      hue={data.hue}
      state={data.state}
      size="md"
      label={data.label}
      interactive={Boolean(data.href || data.view)}
      look={!dragging}
      className="noo-canvas__blob"
    />
  );

  if (flow) {
    return (
      <>
        {blob}
        {speaking ? (
          <Bubble tint={data.tint} className="noo-canvas__bubble noo-canvas__bubble--below">
            {data.say}
          </Bubble>
        ) : null}
      </>
    );
  }

  return (
    <>
      <NodeToolbar
        isVisible={speaking}
        position={data.below ? Position.Bottom : Position.Right}
        align={data.below ? (data.bubbleAlign ?? "center") : "start"}
        offset={8}
        className="noo-canvas__toolbar"
      >
        <Bubble tint={data.tint} pop className={cx("noo-canvas__bubble", data.below && "noo-canvas__bubble--below")}>
          {data.say}
        </Bubble>
      </NodeToolbar>
      {blob}
    </>
  );
});
