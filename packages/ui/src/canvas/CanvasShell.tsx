"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode, type RefObject } from "react";
import {
  Background,
  BackgroundVariant,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  useStore,
  type FitViewOptions,
  type NodeChange,
  type NodeMouseHandler,
  type NodeTypes,
} from "@xyflow/react";
import { GroundProvider, type Ground } from "../blob/grid";
import { prefersReducedMotion } from "../blob/behaviour";
import { Button } from "../primitives/Button";
import { Wordmark } from "../wordmark/Wordmark";
import { cx } from "../cx";
import { BlobNode } from "./BlobNode";
import { PanelNode } from "./PanelNode";
import { RegionNode } from "./RegionNode";
import { WidgetNode } from "./WidgetNode";
import { CanvasMap } from "./CanvasMap";
import { Threads } from "./Threads";
import { CanvasModeProvider } from "./lod";
import { CanvasNavProvider } from "./nav";
import { NARROW_QUERY, sceneBoxes, sceneToNodes, viewCentres, type Box, type CanvasView, type SceneFlowNode, type SceneNode, type SceneThread } from "./scene";

/**
 * CanvasShell — the base layout of No Origins (Design-System.md §8), on React Flow. The dot grid is the flow's
 * Background; every blob, panel and region is a node; the chat input, menu, minimap and wordmark are panels fixed
 * to the viewport. Navigation is a viewport move, not a page load (§8.5).
 *
 * The host imports `@xyflow/react/dist/base.css` into `layer(base)` so the package can style over it.
 */
export interface CanvasShellProps {
  /** Every node of this block's canvas, hand-placed and in reading order — DOM order is tab order (§12). */
  scene: SceneNode[];
  /** Named destinations. Given some, the shell renders the view switcher itself and marks where you are. */
  views?: CanvasView[];
  /** Which view the canvas opens at. Defaults to the first. */
  initialView?: string;
  /** Fired when the viewport moves to a view — the host is what knows about URLs (§11.2 rule 1). */
  onViewChange?: (id: string) => void;
  /** The through-line, drawn (§8.1). */
  threads?: SceneThread[];
  /** Clicking (or pressing Enter on) a blob with an `href`. The host routes; the package never imports a router. */
  onOpen?: (href: string, node: SceneNode) => void;
  /** Bottom-centre panel: the ChatInput. */
  chat?: ReactNode;
  /** Bottom-left panel. Replaced by the view switcher when `views` are given. */
  menu?: ReactNode;
  /** Bottom-right panel. Default: the wordmark. */
  brand?: ReactNode;
  /** Top-right panel, beside "Reset view": the theme switch, usually. */
  trailing?: ReactNode;
  resetLabel?: ReactNode;
  menuLabel?: string;
  /** `column` stacks the view switcher: past about five views a row collides with the centred chat input. */
  menuLayout?: "row" | "column";
  minimap?: boolean;
  /** Extra panels or overlays. */
  children?: ReactNode;
  className?: string;
  /** id of the chat input, for the skip link. */
  chatId?: string;
  /** The page's h1, visually hidden: a canvas has no headline, a document still needs one. */
  heading?: ReactNode;
}

const nodeTypes: NodeTypes = { blob: BlobNode, panel: PanelNode, region: RegionNode, widget: WidgetNode };

/** Fit, but never zoom past 1.2: seven blobs in a 1440 viewport otherwise fit at ×1.7 and the grid coarsens too. */
const HOME_FIT: FitViewOptions<SceneFlowNode> = { padding: 0.3, maxZoom: 1.2 };
/** A view frames the head of a region, at reading zoom. */
const VIEW_FIT: FitViewOptions<SceneFlowNode> = { padding: 0.15, maxZoom: 1 };
const SSR_VIEWPORT = { width: 1280, height: 800 };
const MIN_ZOOM = 0.15;
/** Where a region lands: comfortably inside the `full` tier (§8.4). */
const READING_ZOOM = 0.9;
const TOP_MARGIN = 70;   /* the blob's bubble overhangs its box: 40 put it within 13px of the top edge */
const MAX_ZOOM = 2.5;

/**
 * The snap (Design-System.md §8.4). This is where the canvas lives or dies: a snap that fires mid-gesture feels
 * like the app taking the wheel, so it only ever fires on gesture END, and the two thresholds are deliberately
 * far apart. Opening at 0.85 and releasing at 0.55 means nothing can oscillate on the boundary — you have to
 * mean it in both directions.
 */
const SNAP_OPEN = 0.85;
const SNAP_RELEASE = 0.55;
/** Where releasing lands: the browse tier, clear of the release threshold so it cannot re-open itself. */
const MAP_AFTER_RELEASE = 0.45;
/** Room the view switcher needs down the left: a full view is centred, but never underneath it. */
const MENU_INSET = 200;

/**
 * React Flow's server-side fit cannot be scoped: `initialFitViewOptions.nodes` is ignored in 12.11.6, so the
 * provider always fits *every* node — which for a map this wide is 0.23, where the level-of-detail tiers render
 * the panels blank. So the server renders at the identity transform (the origin cluster, life size, top left)
 * and the client lands the requested view on mount. Revisit if a later version honours the option.
 */
/** The bounding box of the nodes a view anchors on. */
function anchorOf(view: CanvasView, boxes: Record<string, Box>) {
  const bs = view.nodeIds.map((n) => boxes[n]).filter((b): b is Box => Boolean(b));
  if (!bs.length) return null;
  const x = Math.min(...bs.map((b) => b.x));
  const y = Math.min(...bs.map((b) => b.y));
  return { x, y, w: Math.max(...bs.map((b) => b.x + b.w)) - x };
}

function fitFor(views: CanvasView[] | undefined, id: string | undefined): FitViewOptions<SceneFlowNode> {
  const view = views?.find((v) => v.id === id) ?? views?.[0];
  if (!view) return HOME_FIT;
  const base = view.id === views?.[0]?.id ? HOME_FIT : VIEW_FIT;
  return { ...base, nodes: view.nodeIds.map((nid) => ({ id: nid })) };
}

/** The grid on screen, from the flow's viewport: what the blobs refract (§3 cue 4). */
function useCanvasGrid(container: RefObject<HTMLDivElement | null>, box: number, line: number, flow: boolean): Ground | null {
  const transform = useStore((s) => s.transform);
  const [origin, setOrigin] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setOrigin((prev) => (prev && prev.left === r.left && prev.top === r.top ? prev : { left: r.left, top: r.top }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [container]);
  return useMemo(() => {
    // In document mode the flow's transform means nothing: let each blob measure the ground itself instead.
    if (flow || !origin) return null;
    const [tx, ty, z] = transform;
    const sb = box * z;
    return { x: origin.left + (tx % sb), y: origin.top + (ty % sb), box: sb, line: line * z, scale: z };
  }, [origin, transform, box, line, flow]);
}

/** Which view the viewport is looking at, so the switcher can mark it. */
function useCurrentView(views: CanvasView[] | undefined, centres: Array<{ id: string; x: number; y: number }>, flow: boolean) {
  const transform = useStore((s) => s.transform);
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);
  return useMemo(() => {
    if (!views?.length || flow) return undefined;
    const [tx, ty, z] = transform;
    const cx = (width / 2 - tx) / z;
    const cy = (height / 2 - ty) / z;
    const d = (c: { x: number; y: number }) => (c.x - cx) ** 2 + (c.y - cy) ** 2;
    let best = centres[0];
    if (!best) return undefined;
    for (const c of centres) if (d(c) < d(best)) best = c;
    return best.id;
  }, [views, centres, transform, width, height, flow]);
}

function CanvasShellInner({
  scene,
  views,
  initialView,
  onViewChange,
  threads,
  onOpen,
  chat,
  menu,
  brand,
  trailing,
  resetLabel = "Reset view",
  menuLabel = "Sections",
  menuLayout = "row",
  minimap = true,
  children,
  className,
  chatId = "chat",
  heading,
  initialNodes,
}: CanvasShellProps & { initialNodes: SceneFlowNode[] }) {
  const container = useRef<HTMLDivElement | null>(null);
  const { fitView, setViewport, getViewport } = useReactFlow<SceneFlowNode>();
  const [grid, setGrid] = useState({ box: 160, line: 1 });
  const [nodes, setNodes] = useState<SceneFlowNode[]>(initialNodes);
  const [moved, setMoved] = useState(false);
  const [flow, setFlow] = useState(false);
  const width = useStore((s) => s.width);

  const height = useStore((st) => st.height);
  const boxes = useMemo(() => sceneBoxes(scene), [scene]);
  const centres = useMemo(() => viewCentres(views ?? [], boxes), [views, boxes]);
  const home = initialView ?? views?.[0]?.id;
  const current = useCurrentView(views, centres, flow);

  /** Which section is open, or null for the map. Focus mode is entirely a function of this (§8.4). */
  const [open, setOpen] = useState<string | null>(null);
  /**
   * A move the CANVAS started, not the visitor. Without this the snap eats itself: clicking a widget at map
   * zoom opens the section, the click's own pointer-up fires `onMoveEnd` while the viewport is still at 0.27,
   * the release threshold sees 0.27 ≤ 0.55 and closes it again — so a click appeared to do nothing at all while
   * Enter worked fine. Only a move the visitor made may open or release anything.
   */
  const selfMove = useRef(0);
  const beginSelfMove = useCallback((duration: number) => { selfMove.current = Date.now() + duration + 120; }, []);
  /** Every section that has a full view, so the shell knows what `open` may legally be. */
  const openable = useMemo(() => new Set(scene.filter((n) => n.kind === "panel" && n.full && n.section).map((n) => n.section!)), [scene]);

  // grid tokens from CSS, so the flow's lines match `.noo-ground` exactly
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const box = parseFloat(cs.getPropertyValue("--grid-box")) || 160;
    const line = parseFloat(cs.getPropertyValue("--grid-line-w")) || 1;
    setGrid((g) => (g.box === box && g.line === line ? g : { box, line }));
  }, []);

  // Document mode (§8.6). The *layout* is a media query in the stylesheet, so it is right on the server too;
  // this only turns off the gestures and pins the zoom tier.
  useEffect(() => {
    const mq = window.matchMedia(NARROW_QUERY);
    const apply = () => setFlow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // bubbles go under their blob in document mode
  useEffect(() => {
    setNodes((ns) => ns.map((n) => (n.type === "blob" ? { ...n, data: { ...n.data, below: flow } } : n)));
  }, [flow]);

  // the host may change what a blob says; positions stay where the visitor left them
  useEffect(() => {
    setNodes((ns) =>
      ns.map((n) => {
        const s = scene.find((x) => x.id === n.id);
        if (!s || s.kind !== "blob" || n.type !== "blob") return n;
        const { kind: _k, id: _i, position: _p, ...data } = s;
        void _k;
        void _i;
        void _p;
        return { ...n, data: { ...data, below: n.data.below, bubbleAlign: n.data.bubbleAlign } };
      }),
    );
  }, [scene]);

  const goTo = useCallback(
    (id: string, notify = true) => {
      if (flow) {
        // document mode: there is no viewport to move, so scroll to the first node the view frames
        const first = views?.find((v) => v.id === id)?.nodeIds[0];
        const el = first ? container.current?.querySelector(`.react-flow__node[data-id="${first}"]`) : null;
        el?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
        if (notify) onViewChange?.(id);
        return;
      }
      const duration = prefersReducedMotion() ? 0 : 400;
      beginSelfMove(duration);
      const view = views?.find((v) => v.id === id);
      const anchor = view && view.frame !== "fit" ? anchorOf(view, boxes) : null;
      if (anchor) {
        // align the column's top-left near the top of the screen, horizontally centred, at reading zoom
        const z = READING_ZOOM;
        void setViewport({ x: (width - anchor.w * z) / 2 - anchor.x * z, y: TOP_MARGIN - anchor.y * z, zoom: z }, { duration });
      } else {
        void fitView({ ...fitFor(views, id), duration });
      }
      setMoved(id !== home);
      if (notify) onViewChange?.(id);
    },
    [fitView, setViewport, views, home, flow, onViewChange, boxes, width, beginSelfMove],
  );

  // Land on the requested view once React Flow can actually move: `setViewport` is a silent no-op until the
  // pan-zoom instance exists, and the anchor maths needs a measured container. One rAF after mount is too early.
  const ready = useStore((s) => Boolean(s.panZoom) && s.width > 0);
  const landed = useRef(false);
  useEffect(() => {
    if (landed.current || flow || !ready) return;
    landed.current = true;
    const id = requestAnimationFrame(() => goTo(home ?? "", false));
    return () => cancelAnimationFrame(id);
  }, [ready, goTo, home, flow]);

  const onNodesChange = useCallback((changes: NodeChange<SceneFlowNode>[]) => setNodes((ns) => applyNodeChanges(changes, ns)), []);

  /**
   * Open a section: put its full view under the viewport at reading zoom. Nothing is unmounted — the widget it
   * came from and every other node stay in the DOM and in the accessibility tree, and only their opacity moves
   * (§8.4, §12). `release` puts the map back with that section under the cursor.
   */
  const openSection = useCallback(
    (id: string) => {
      if (!openable.has(id) || flow) return;
      setOpen(id);
      const full = scene.filter((n) => n.kind === "panel" && n.full && n.section === id);
      if (!full.length) return;
      const x = Math.min(...full.map((n) => n.position.x));
      const y = Math.min(...full.map((n) => n.position.y));
      const w = Math.max(...full.map((n) => n.position.x + (n as { width: number }).width)) - x;
      const z = READING_ZOOM;
      const duration = prefersReducedMotion() ? 0 : 400;
      beginSelfMove(duration);
      // centred, but never behind the view switcher in the bottom-left corner: at 1440 a full view centres with
      // 144px margins and the menu is ~165 wide, so the left column would sit under it
      const left = Math.max((width - w * z) / 2, MENU_INSET);
      void setViewport({ x: left - x * z, y: TOP_MARGIN - y * z, zoom: z }, { duration });
      setMoved(true);
      onViewChange?.(id);
    },
    [openable, flow, scene, setViewport, width, onViewChange, beginSelfMove],
  );

  /**
   * Leave focus mode, back to the map with that section under the cursor (§8.4).
   *
   * It lands at MAP_AFTER_RELEASE, not at reading zoom, and the distinction is the whole hysteresis. Returning
   * at 0.9 puts the viewport straight back over the widget at above the 0.85 open threshold, so the next move
   * re-opens what you just closed — Esc appeared to do nothing. Releasing has to leave you below 0.55.
   */
  const release = useCallback(() => {
    if (!open) return;
    const w = scene.find((n) => n.kind === "widget" && n.view === open);
    setOpen(null);
    if (w && w.kind === "widget") {
      const z = MAP_AFTER_RELEASE;
      const duration = prefersReducedMotion() ? 0 : 400;
      beginSelfMove(duration);
      void setViewport(
        { x: width / 2 - (w.position.x + w.width / 2) * z, y: height / 2 - (w.position.y + w.height / 2) * z, zoom: z },
        { duration },
      );
    }
  }, [open, scene, setViewport, width, height, beginSelfMove]);

  /**
   * The snap, on gesture end only. React Flow fires `onMoveEnd` when a pan or a zoom finishes, which is exactly
   * the "wheel idle / pointer up" the spec asks for — no timer of our own, and nothing fires mid-gesture.
   */
  const onMoveEnd = useCallback(() => {
    if (flow || !views?.length) return;
    if (Date.now() < selfMove.current) return;                 // the canvas moved itself; the visitor did not
    const { x, y, zoom } = getViewport();
    if (open) {
      if (zoom <= SNAP_RELEASE) release();
      return;
    }
    if (zoom < SNAP_OPEN) return;
    // whichever openable section holds the middle of the screen
    const cx2 = (width / 2 - x) / zoom;
    const cy2 = (height / 2 - y) / zoom;
    const hit = scene.find(
      (n) => n.kind === "widget" && n.position.x <= cx2 && cx2 <= n.position.x + n.width && n.position.y <= cy2 && cy2 <= n.position.y + n.height,
    );
    if (hit && hit.kind === "widget" && openable.has(hit.view)) openSection(hit.view);
  }, [flow, views, getViewport, open, release, width, height, scene, openable, openSection]);

  // Esc leaves focus mode. Zooming out works too, but it is the slow way and must never be the only way (§8.4).
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") release(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, release]);

  // one class per node, recomputed only when the open section changes
  const shown = useMemo(
    () =>
      nodes.map((n) => {
        const sec = scene.find((x) => x.id === n.id)?.section;
        const isFull = n.className?.includes("noo-full");
        const state = !open
          ? isFull ? " is-hidden" : ""
          : sec === open
            ? isFull ? " is-open" : " is-source"
            : " is-faded";
        const base = (n.className ?? "").replace(/ is-(open|hidden|faded|source)/g, "");
        return state ? { ...n, className: base + state } : (n.className === base ? n : { ...n, className: base || undefined });
      }),
    [nodes, scene, open],
  );
  const activate = useCallback(
    (id: string) => {
      const s = scene.find((x) => x.id === id);
      if (!s) return;
      if (s.kind === "widget") return openSection(s.view);           // click or Enter is the PRIMARY way in (§8.4)
      if (s.kind !== "blob") return;
      if (s.view) return goTo(s.view);
      if (s.href) onOpen?.(s.href, s);
    },
    [scene, onOpen, goTo, openSection],
  );
  const onNodeClick: NodeMouseHandler<SceneFlowNode> = useCallback((_e, node) => activate(node.id), [activate]);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest?.(".react-flow__node") as HTMLElement | null;
    if (e.key === "Enter" || e.key === " ") {
      const id = el?.getAttribute("data-id");
      if (!id) return;
      e.preventDefault();
      activate(id);
      return;
    }
    // ← / → step between regions: the canvas-native way to read a spine (§8.3)
    if (!views?.length || flow || el) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = views.findIndex((v) => v.id === current);
    const next = views[Math.min(views.length - 1, Math.max(0, (i < 0 ? 0 : i) + (e.key === "ArrowRight" ? 1 : -1)))];
    if (!next) return;
    e.preventDefault();
    goTo(next.id);
  };
  const reset = () => {
    setOpen(null);
    setNodes((ns) => ns.map((n) => ({ ...n, position: scene.find((s) => s.id === n.id)?.position ?? n.position })));
    if (home) goTo(home, false);
    setMoved(false);
  };

  const ground = useCanvasGrid(container, grid.box, grid.line, flow);
  const nav = useMemo(() => ({ goTo: (id: string) => goTo(id), current, open: openSection }), [goTo, current, openSection]);
  const onMenuClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    goTo(id);
  };

  return (
    <div ref={container} className={cx("noo-canvas", open && "noo-canvas--open", className)} onKeyDown={onKeyDown}>
      <a href={`#${chatId}`} className="noo-skip">
        Skip to the chat
      </a>
      {heading ? <h1 className="noo-sr-only">{heading}</h1> : null}
      <CanvasModeProvider value={{ flow }}>
        <CanvasNavProvider value={nav}>
        <GroundProvider value={ground}>
          <ReactFlow<SceneFlowNode>
            nodes={shown}
            onNodesChange={onNodesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onMoveStart={(event) => {
              if (event) setMoved(true);
            }}
            onNodeDragStop={() => setMoved(true)}
            onMoveEnd={onMoveEnd}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            panOnScroll={!flow}
            panOnDrag={!flow}
            zoomOnScroll={false}
            zoomOnPinch={!flow}
            zoomOnDoubleClick={false}
            preventScrolling={!flow}
            nodesDraggable={!flow}
            selectionOnDrag={false}
            nodesConnectable={false}
            elementsSelectable={false}
            nodeDragThreshold={2}
            nodeClickDistance={6}
            attributionPosition="top-left"
          >
            {/* the ground (§8): 160 boxes, the same grid every bento cell snaps into. The stroke colour is CSS. */}
            <Background variant={BackgroundVariant.Lines} gap={grid.box} lineWidth={grid.line} />
            {threads?.length ? <Threads threads={threads} boxes={boxes} /> : null}
            {minimap ? <CanvasMap /> : null}
            {trailing || open || (moved && !flow) ? (
              <Panel position="top-right" className="noo-canvas__panel noo-canvas__panel--tools">
                {open ? (
                  <Button variant="secondary" size="sm" onClick={release}>
                    Back to the map
                  </Button>
                ) : null}
                {moved && !flow && !open ? (
                  <Button variant="secondary" size="sm" onClick={reset}>
                    {resetLabel}
                  </Button>
                ) : null}
                {trailing}
              </Panel>
            ) : null}
            {chat ? (
              <Panel position="bottom-center" className="noo-canvas__panel noo-canvas__panel--chat">
                {chat}
              </Panel>
            ) : null}
            {views?.length ? (
              <Panel position="bottom-left" className="noo-canvas__panel noo-canvas__panel--menu">
                <nav className={cx("glass glass-1 noo-canvas__menu", menuLayout === "column" && "noo-canvas__menu--column")} aria-label={menuLabel}>
                  {views.map((v) =>
                    v.href ? (
                      <a key={v.id} href={v.href} className="noo-nav__link" aria-current={current === v.id ? "true" : undefined} onClick={(e) => onMenuClick(e, v.id)}>
                        {v.label}
                      </a>
                    ) : (
                      <button key={v.id} type="button" className="noo-nav__link" aria-current={current === v.id ? "true" : undefined} onClick={() => goTo(v.id)}>
                        {v.label}
                      </button>
                    ),
                  )}
                </nav>
              </Panel>
            ) : menu ? (
              <Panel position="bottom-left" className="noo-canvas__panel noo-canvas__panel--menu">
                {menu}
              </Panel>
            ) : null}
            <Panel position="bottom-right" className="noo-canvas__panel noo-canvas__panel--brand">
              {brand ?? <Wordmark className="noo-canvas__wordmark" />}
            </Panel>
            {children}
          </ReactFlow>
        </GroundProvider>
        </CanvasNavProvider>
      </CanvasModeProvider>
    </div>
  );
}

export function CanvasShell(props: CanvasShellProps) {
  // Built once: React Flow renders nodes on the server only when the provider is seeded with them, their
  // dimensions, and a viewport size to fit them into. The client re-fits to the real container after mount.
  const [initialNodes] = useState<SceneFlowNode[]>(() => sceneToNodes(props.scene));
  return (
    <ReactFlowProvider
      initialNodes={initialNodes}
      initialWidth={SSR_VIEWPORT.width}
      initialHeight={SSR_VIEWPORT.height}
      initialMinZoom={MIN_ZOOM}
      initialMaxZoom={MAX_ZOOM}
    >
      <CanvasShellInner {...props} initialNodes={initialNodes} />
    </ReactFlowProvider>
  );
}
