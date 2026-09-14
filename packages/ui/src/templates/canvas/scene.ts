import type { Node } from "@xyflow/react";
import type { BlobFlowNode, BlobNodeData } from "./BlobNode";
import type { PanelNodeData } from "./PanelNode";
import type { RegionNodeData } from "./RegionNode";
import type { WidgetNodeData } from "./WidgetNode";

/**
 * The scene (Design-System.md §8.2–8.3) — every node of a block's canvas, hand-placed. Heights included, so the
 * server renders the map exactly where the client keeps it and nothing reflows on hydration.
 */
export interface SceneNodeBase {
  id: string;
  position: { x: number; y: number };
  /**
   * Which section this node belongs to (§8.4). Everything a section owns carries the same tag, and that is the
   * whole of how focus mode works: open one section and every node whose tag is not it fades out. A node with no
   * tag — the centre blob, Me — is always present.
   */
  section?: string;
}
export interface BlobSceneNode extends SceneNodeBase, BlobNodeData {
  kind: "blob";
}
export interface PanelSceneNode extends SceneNodeBase, PanelNodeData {
  kind: "panel";
  width: number;
  height: number;
  /** Part of a section's full view: present in the DOM always, visible only while that section is open. */
  full?: boolean;
}
export interface RegionSceneNode extends SceneNodeBase, RegionNodeData {
  kind: "region";
  width: number;
  height: number;
}
/**
 * A widget: the section as the map shows it. `full` marks a panel as belonging to the section's full view, which
 * is hidden until that section is open — the two layouts of §8.4, both always in the DOM.
 */
export interface WidgetSceneNode extends SceneNodeBase, WidgetNodeData {
  kind: "widget";
  width: number;
  height: number;
}
/**
 * A menu (Atomic.md D9): the view switcher as a placed node. It anchors to a corner of the VIEWPORT, not to a
 * point in canvas space — a menu that pans away is not navigation — and `position` is its inset from that corner
 * in px, so the editor places it like anything else. Items name a `view` (a pan) or an `href` (a page).
 */
export interface MenuSceneItem {
  label: string;
  view?: string;
  href?: string;
  /** An icon name from `@no-origins/ui/icons`; the shell's `renderIcon` turns it into a glyph. */
  icon?: string;
}
export interface MenuSceneNode extends SceneNodeBase {
  kind: "menu";
  anchor?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  /** Names the menu for assistive tech — "Sections". */
  label?: string;
  items: MenuSceneItem[];
}
export type SceneNode = BlobSceneNode | PanelSceneNode | RegionSceneNode | WidgetSceneNode | MenuSceneNode;

export type PanelFlowNode = Node<PanelNodeData, "panel">;
export type RegionFlowNode = Node<RegionNodeData, "region">;
export type WidgetFlowNode = Node<WidgetNodeData, "widget">;
export type SceneFlowNode = BlobFlowNode | PanelFlowNode | RegionFlowNode | WidgetFlowNode;

/**
 * A named destination. `frame: "top"` (the default) puts the anchor node's top-left near the top of the screen at
 * reading zoom and leaves the column to be scrolled — fitting a whole column lands at 0.3, far below reading size,
 * and fitting only its head leaves the content below the fold. `"fit"` fits the anchors, for a cluster.
 */
export interface CanvasView {
  id: string;
  label: string;
  /** The nodes this view anchors on. */
  nodeIds: string[];
  frame?: "fit" | "top";
  /** Rendered as a real link so the menu is crawlable; the click is intercepted and pans instead. */
  href?: string;
}

/** The through-line, drawn: a dotted thread from one node to another (§8.1). */
export type SceneThread = { from: string; to: string };

export const BLOB_W = 72;
export const BLOB_H = 48;

/** The breakpoint below which the canvas reads as a document (§8.6). Must match the stylesheet's media query. */
export const NARROW_QUERY = "(max-width: 899.98px)";

export function sceneToNodes(scene: SceneNode[]): SceneFlowNode[] {
  return scene.filter((s): s is Exclude<SceneNode, MenuSceneNode> => s.kind !== "menu").map((s) => {
    if (s.kind === "widget") {
      const { kind, id, position, width, height, section, ...data } = s;
      void kind;
      return {
        id,
        type: "widget",
        position,
        width,
        height,
        data,
        draggable: false,
        selectable: false,
        focusable: true,
        zIndex: 1,
        ariaRole: "button",
        ariaLabel: `${data.label}. Open.`,
        className: section ? `noo-of-${section}` : undefined,
      } satisfies WidgetFlowNode;
    }
    if (s.kind === "region") {
      const { kind, id, position, width, height, section, ...data } = s;
      void kind;
      void section;
      return { id, type: "region", position, width, height, data, draggable: false, selectable: false, focusable: false, zIndex: 0, ariaRole: "presentation" } satisfies RegionFlowNode;
    }
    if (s.kind === "panel") {
      const { kind, id, position, width, height, section, full, ...data } = s;
      void kind;
      return {
        id,
        type: "panel",
        position,
        width,
        height,
        data,
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: full ? 3 : 1,                                  // a full view sits over the ring it covers
        ariaRole: "group",
        ariaLabel: data.label,
        className: [full ? "noo-full" : null, section ? `noo-of-${section}` : null].filter(Boolean).join(" ") || undefined,
      } satisfies PanelFlowNode;
    }
    const { kind, id, position, section, ...data } = s;
    void kind;
    void section;
    const opens = Boolean(data.href || data.view);
    return {
      id,
      type: "blob",
      position,
      width: BLOB_W,
      height: BLOB_H,
      data,
      draggable: true,
      focusable: true,
      zIndex: 2,
      ariaLabel: opens ? `${data.label}. Open.` : data.label,
      ariaRole: opens ? "button" : "img",
    } satisfies BlobFlowNode;
  });
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Every node's box in flow coordinates — for the threads and for working out which view the viewport is in. */
export function sceneBoxes(scene: SceneNode[]): Record<string, Box> {
  const out: Record<string, Box> = {};
  for (const s of scene) {
    if (s.kind === "menu") continue;                                            // viewport-anchored: it has no box in flow space
    const w = s.kind === "blob" ? BLOB_W : s.width;
    const h = s.kind === "blob" ? BLOB_H : s.height;
    out[s.id] = { x: s.position.x, y: s.position.y, w, h };
  }
  return out;
}

/**
 * The centre of the nodes a view frames, so the menu can mark where you are. Both axes: on a ring (§8.3) two
 * sections can share an x — Work and Projects do — and an x-only match marks the wrong one.
 */
export function viewCentres(views: CanvasView[], boxes: Record<string, Box>): Array<{ id: string; x: number; y: number }> {
  return views.map((v) => {
    const bs = v.nodeIds.map((id) => boxes[id]).filter((b): b is Box => Boolean(b));
    if (!bs.length) return { id: v.id, x: 0, y: 0 };
    const x1 = Math.min(...bs.map((b) => b.x));
    const x2 = Math.max(...bs.map((b) => b.x + b.w));
    const y1 = Math.min(...bs.map((b) => b.y));
    const y2 = Math.max(...bs.map((b) => b.y + b.h));
    return { id: v.id, x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
  });
}
