"use client";
import { cx } from "../cx";
import { useCanvasZoom } from "../templates/canvas/lod";
import type { Hue } from "../tokens/tokens";

/**
 * What the editor draws OVER the canvas (Admin.md §6.5c S1, S2) — and nothing else. §6.1: the editor adds
 * selection outlines, box highlights and drag handles, "nothing that changes how a node renders". So these are
 * absolutely-positioned frames in canvas coordinates, handed to `CanvasShell`'s `overlay`, which puts them inside
 * React Flow's viewport transform: they pan and zoom with the nodes and the node components never hear about it.
 *
 * S1: selection is the ring focus already wears — 2px `--accent-deep` at 4px offset — plus a tag above the
 * top-left corner saying kind · name in the mono voice with the node's hue dot. The tag counter-scales so it
 * stays legible at any zoom and **hides below 0.4**, where the canvas is a map and a label per node is noise.
 * Hover is a 1px hairline.
 *
 * S2: the drop ghost is a dashed accent frame at the component's default size, already snapped to box corners by
 * the host, with the boxes it will take washed in the accent.
 */
export interface OverlayBox {
  id: string;
  /** Canvas units. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** What the tag says on the left of the dot separator — "widget", "panel". */
  kind: string;
  /** What it says on the right — the component's name. */
  name: string;
  hue?: Hue | "accent";
}

export interface Ghost {
  x: number;
  y: number;
  w: number;
  h: number;
  /** What is being placed, for the tag. */
  label?: string;
}

export interface CanvasOverlayProps {
  boxes: readonly OverlayBox[];
  selected?: readonly string[];
  hovered?: string | null;
  ghost?: Ghost | null;
  className?: string;
}

/** Below this the canvas is a map (Design-System.md §8.4's `map` tier) and a tag per node is noise. */
export const TAG_MIN_ZOOM = 0.4;

const frame = (b: { x: number; y: number; w: number; h: number }) => ({ left: b.x, top: b.y, width: b.w, height: b.h });

export function CanvasOverlay({ boxes, selected = [], hovered, ghost, className }: CanvasOverlayProps) {
  const zoom = useCanvasZoom();
  const chosen = new Set(selected);
  // The tag is drawn in canvas space but must read at screen size, so it is scaled back by the viewport's zoom.
  const tagStyle = { transform: `scale(${1 / Math.max(zoom, 0.01)})` };

  return (
    <div className={cx("noo-eoverlay", className)} aria-hidden="true">
      {hovered && !chosen.has(hovered)
        ? boxes.filter((b) => b.id === hovered).map((b) => <div key={`h-${b.id}`} className="noo-ehover" style={frame(b)} />)
        : null}
      {boxes
        .filter((b) => chosen.has(b.id))
        .map((b) => (
          <div key={b.id} className="noo-esel" style={frame(b)}>
            {zoom >= TAG_MIN_ZOOM ? (
              <span className="noo-etag" style={tagStyle} data-hue={b.hue ?? "accent"}>
                <span className="noo-etag__dot" />
                {b.kind}
                <span className="noo-etag__sep">·</span>
                {b.name}
              </span>
            ) : null}
          </div>
        ))}
      {ghost ? (
        <div className="noo-eghost" style={frame(ghost)}>
          {ghost.label && zoom >= TAG_MIN_ZOOM ? (
            <span className="noo-etag noo-etag--ghost" style={tagStyle}>
              {ghost.label}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
