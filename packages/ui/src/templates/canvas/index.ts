/**
 * @no-origins/ui/canvas — the canvas, the base layout of No Origins (Design-System.md §8). Needs the optional
 * peer `@xyflow/react` and its `dist/base.css` in the host, imported into `layer(base)`.
 */
export { CanvasShell } from "./CanvasShell";
export type { CanvasShellProps } from "./CanvasShell";
export { BlobNode, BUBBLE_MIN_ZOOM } from "./BlobNode";
export type { BlobNodeData, BlobFlowNode } from "./BlobNode";
export { PanelNode } from "./PanelNode";
export type { PanelNodeData } from "./PanelNode";
export { WidgetNode } from "./WidgetNode";
export type { WidgetNodeData } from "./WidgetNode";
export { MenuNode } from "./MenuNode";
export type { MenuNodeData } from "./MenuNode";
export { RegionNode } from "./RegionNode";
export type { RegionNodeData } from "./RegionNode";
export { CanvasMap } from "./CanvasMap";
export { Threads } from "./Threads";
export { useCanvasNav, CanvasNavProvider } from "./nav";
export type { CanvasNav } from "./nav";
export { useZoomTier, useCanvasMode, tierFor, TIER_TITLES, TIER_FULL } from "./lod";
export type { ZoomTier } from "./lod";
export { sceneToNodes, sceneBoxes, viewCentres, NARROW_QUERY, BLOB_W, BLOB_H } from "./scene";
export type { SceneNode, BlobSceneNode, PanelSceneNode, RegionSceneNode, WidgetSceneNode, MenuSceneNode, MenuSceneItem, SceneFlowNode, MenuFlowNode, PanelFlowNode, RegionFlowNode, WidgetFlowNode, CanvasView, SceneThread, Box } from "./scene";
