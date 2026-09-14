"use client";
import { ViewportPortal } from "@xyflow/react";
import type { Box, SceneThread } from "./scene";

/**
 * Threads — the lines between things (Design-System.md §8.1). Dotted, in `--rule`, no arrows, under the panels.
 *
 * On the ring (§8.3) these are the map's skeleton: a spoke from the blob at the centre out to each section, so
 * that zoomed out — where every word has faded — the structure is still legible.
 *
 * Drawn in a `ViewportPortal` rather than as React Flow edges, because edges need handles on their nodes and
 * blobs have none. Every coordinate is already known from the scene, so the geometry is ours to compute.
 * Portals do not server-render, so these are client-only; they are decorative and `aria-hidden`, so that is fine.
 */
const GAP = 18;

/** Where a line from this box toward (tx, ty) leaves the box, plus a small gap so it never touches. */
function edgePoint(box: Box, tx: number, ty: number) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const tX = Math.abs(ux) < 1e-6 ? Infinity : box.w / 2 / Math.abs(ux);
  const tY = Math.abs(uy) < 1e-6 ? Infinity : box.h / 2 / Math.abs(uy);
  const t = Math.min(tX, tY) + GAP;
  return { x: cx + ux * t, y: cy + uy * t };
}

export function Threads({ threads, boxes }: { threads: SceneThread[]; boxes: Record<string, Box> }) {
  const paths = threads
    .map(({ from, to }) => {
      const a = boxes[from];
      const b = boxes[to];
      if (!a || !b) return null;
      const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
      const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
      const start = edgePoint(a, bc.x, bc.y);
      const end = edgePoint(b, ac.x, ac.y);
      return { key: `${from}-${to}`, d: `M ${start.x} ${start.y} L ${end.x} ${end.y}` };
    })
    .filter((p): p is { key: string; d: string } => p !== null);

  if (!paths.length) return null;
  return (
    <ViewportPortal>
      <svg className="noo-canvas__threads" width="1" height="1" aria-hidden="true">
        {paths.map((p) => (
          <path key={p.key} d={p.d} />
        ))}
      </svg>
    </ViewportPortal>
  );
}
