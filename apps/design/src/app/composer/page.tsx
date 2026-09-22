"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowLeftToLineIcon,
  ArrowRightToLineIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  CornerLeftUpIcon,
  FilePlusIcon,
  FileXIcon,
  MinusIcon,
  PlusIcon,
  Redo2Icon,
  RotateCcwIcon,
  RotateCwIcon,
  Trash2Icon,
  Undo2Icon,
  UnlinkIcon,
} from "lucide-react";

import { cn } from "@no-origins/ui/lib/utils";
import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@no-origins/ui/components/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@no-origins/ui/components/dialog";
import { Input } from "@no-origins/ui/components/input";
import { Label } from "@no-origins/ui/components/label";
import { NativeSelect, NativeSelectOption } from "@no-origins/ui/components/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@no-origins/ui/components/popover";
import { Separator } from "@no-origins/ui/components/separator";
import { Switch } from "@no-origins/ui/components/switch";
import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@no-origins/ui/components/tooltip";
import {
  BREAKPOINT_ORDER,
  DEFAULT_GRID_CONFIG,
  GRID_SPACING,
  GridItem,
  MAX_CELL,
  MIN_CELL,
  specFor,
  type GridBreakpoint,
  type GridConfig,
  type GridMetrics,
} from "@no-origins/ui/components/grid";
import { GridFrame, referenceBox, referenceShape, type GridFrameSize } from "@no-origins/ui/components/grid-frame";
import { defaultProps, REGISTRY, registryEntry, type RegistryEntry } from "@no-origins/ui/components/registry";
import { defaultInset, isSlotItem, SLOT_ALIGNS, SLOT_FILLS, Slot, SlotContent } from "@no-origins/ui/components/slot";
import {
  addPage,
  configCode,
  countOverlaps,
  findFreeRect,
  layoutCode,
  moveItemToPage,
  pagerCells,
  rectIsValid,
  removePage,
  resolvePages,
  narrowestAuthored,
  resolveSubSlots,
  withAuthored,
  withoutAuthored,
  type GridLayout,
  type GridLayoutItem,
  type GridPage,
  type GridRect,
  type GridShape,
  type ResolvedPages,
  type SlotAlign,
  type SlotFill,
  type SlotInset,
} from "@no-origins/ui/lib/grid-layout";
import { GridEditor, useHistory } from "@no-origins/ui/components/grid-editor";

import { NAV_HEIGHT, renderSpecimen } from "@/components/specimen";
import { findItem, PAGES, type PageContent } from "@/content";
import { arrange } from "@/lib/arrange";

/**
 * The composer (Grid.md §8, Slots.md §4) — where a page is designed. Opened from any page's Compose button with
 * `?from=<route>`, it loads that page's content, lets you arrange SLOTS per breakpoint in the frame (D18), drop
 * components from the registry into them (D19, S1), set a slot's tokens and its component's props (S3, S4), enter a
 * slot to lay out its sub-slots on its own cells (S2), set a slot's span for every breakpoint, and export the result
 * as two copy blocks (D20): the layout, which gets pasted to the agent and onto the page, and the config.
 *
 * It was `/grid` until 2026-09-21 (D16). Everything that page had is still here.
 */

const STORAGE_PREFIX = "no-origins:composer:v2:";
const CELL_STEP = 2;

/** Nothing authored anywhere: the first edit authors the breakpoint it is made on, and the rest derive (D22). */
const EMPTY: GridLayout = { authored: {} };

/** What the palette offers: a component from the registry, or an empty slot in one of the fills (Slots.md §4). */
type PaletteEntry = { key: string; name: string; group: string; span: { colSpan: number; rowSpan: number }; entry?: RegistryEntry; fill?: SlotFill };

const PALETTE: PaletteEntry[] = [
  ...SLOT_FILLS.map<PaletteEntry>((fill) => ({ key: `slot:${fill}`, name: `${fill} slot`, group: "Slots", span: { colSpan: 2, rowSpan: 2 }, fill })),
  ...REGISTRY.map<PaletteEntry>((entry) => ({ key: entry.kind, name: entry.name, group: entry.group === "atom" ? "Atoms" : "Molecules", span: entry.span, entry })),
];
const PALETTE_GROUPS = ["Slots", "Atoms", "Molecules"];

type Saved = { layout: GridLayout; config: GridConfig; frame: GridFrameSize | null };

const isConfig = (value: unknown): value is GridConfig =>
  !!value &&
  typeof value === "object" &&
  Object.values(value as Record<string, unknown>).every(
    (row) => !!row && typeof row === "object" && typeof (row as GridConfig["base"])?.cell === "number" && typeof (row as GridConfig["base"])?.gap === "number",
  );

const translate = (item: GridLayoutItem, dc: number, dr: number): GridLayoutItem => ({ ...item, col: item.col + dc, row: item.row + dr });

/** The cells outside a rect on a field, as up to four strips — what a drag inside a slot may not cross. */
function outside(rect: GridRect, cols: number, rows: number): GridRect[] {
  const strips: GridRect[] = [];
  if (rect.row > 1) strips.push({ col: 1, row: 1, colSpan: cols, rowSpan: rect.row - 1 });
  const below = rect.row + rect.rowSpan;
  if (below <= rows) strips.push({ col: 1, row: below, colSpan: cols, rowSpan: rows - below + 1 });
  if (rect.col > 1) strips.push({ col: 1, row: rect.row, colSpan: rect.col - 1, rowSpan: rect.rowSpan });
  const right = rect.col + rect.colSpan;
  if (right <= cols) strips.push({ col: right, row: rect.row, colSpan: cols - right + 1, rowSpan: rect.rowSpan });
  return strips;
}

export default function ComposerPage() {
  return (
    <React.Suspense fallback={null}>
      <Composer />
    </React.Suspense>
  );
}

function Composer() {
  const params = useSearchParams();
  const from = params.get("from") ?? "";
  const source = PAGES[from];

  const [content, setContent] = React.useState<PageContent | null>(null);
  React.useEffect(() => {
    let live = true;
    if (!source) setContent(null);
    else source.load().then((loaded) => live && setContent(loaded));
    return () => {
      live = false;
    };
  }, [source]);

  const history = useHistory<GridLayout>(EMPTY);
  const layout = history.value;

  const [page, setPage] = React.useState(0);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [config, setConfig] = React.useState<GridConfig>(DEFAULT_GRID_CONFIG);
  const [overlay, setOverlay] = React.useState(true);
  const [rulers, setRulers] = React.useState(true);
  const [frame, setFrame] = React.useState<GridFrameSize | null>(null);
  const [scale, setScale] = React.useState(1);
  const [metrics, setMetrics] = React.useState<GridMetrics | null>(null);
  const [resolved, setResolved] = React.useState<ResolvedPages | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  /** The slot being edited inside, as a path of ids from the page down (Slots.md §4). Empty: the page itself. */
  const [path, setPath] = React.useState<string[]>([]);

  const storageKey = STORAGE_PREFIX + (from || "scratch");

  const seeded = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!metrics || seeded.current === storageKey) return;
    if (source && !content) return;
    seeded.current = storageKey;
    let restored = false;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Saved>;
        if (saved.layout?.authored) {
          history.reset(saved.layout);
          restored = true;
        }
        if (isConfig(saved.config)) setConfig(saved.config);
        if (saved.frame && saved.frame.width > 0 && saved.frame.height > 0) setFrame(saved.frame);
        else if (saved.frame === null) setFrame(null);
        else if (source) setFrame(referenceBox("xl", NAV_HEIGHT));
      } else if (source) {
        // Authoring is per breakpoint on its reference field (D18): a page opens in the xl frame, not on whatever
        // monitor this is — fit on a 2548px screen authored xl on 34 × 16 and the reference frame had to repack it.
        setFrame(referenceBox("xl", NAV_HEIGHT));
      }
    } catch {
      /* storage can throw in a private window; the page's own layout stands */
    }
    if (!restored) history.reset(seedFrom(content, metrics));
    setPage(0);
    setSelected(null);
    setPath([]);
    setLoaded(true);
  }, [metrics, content, source, storageKey, history]);

  React.useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ layout, config, frame } satisfies Saved));
    } catch {
      /* the arrangement simply will not survive a reload */
    }
  }, [layout, config, frame, loaded, storageKey]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      if (event.shiftKey) history.redo();
      else history.undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [history.undo, history.redo]);

  const bp = metrics?.bp ?? "xl";
  const topResolved = React.useMemo(() => (metrics ? resolvePages(layout, metrics) : null), [layout, metrics]);
  const pages = topResolved?.pages ?? [];
  const count = pages.length || 1;
  const current = Math.min(page, count - 1);
  const pageItems = pages[current]?.items ?? [];

  // ── the level: the page, or the slot entered (Slots.md §4) ─────────────────────────────────────────────────
  /**
   * Walk the path from the page down. Each step resolves the slot's children on the slot's own cells at this
   * breakpoint, and accumulates the slot's origin so the level's items can be drawn on the page's field.
   */
  const level = React.useMemo(() => {
    if (!metrics) return null;
    let items = pageItems;
    let origin = { col: 1, row: 1 };
    let shape: GridShape = { cols: metrics.cols, rows: metrics.rows };
    const crumbs: { id: string; label: string }[] = [];
    for (const id of path) {
      const target = items.find((item) => item.id === id);
      if (!target) break;
      origin = { col: origin.col + target.col - 1, row: origin.row + target.row - 1 };
      shape = { cols: target.colSpan, rows: target.rowSpan };
      items = resolveSubSlots(target.children, target, metrics);
      crumbs.push({ id, label: target.label ?? target.component?.kind ?? target.id });
    }
    const rect: GridRect = { col: origin.col, row: origin.row, colSpan: shape.cols, rowSpan: shape.rows };
    return { items, origin, shape, rect, crumbs, scoped: crumbs.length > 0 };
  }, [metrics, pageItems, path]);

  const items = level?.items ?? [];
  const scoped = level?.scoped ?? false;

  /** Write the current level's items (relative to the level) into the layout. */
  const commitItems = React.useCallback(
    (nextItems: GridLayoutItem[]) => {
      if (!metrics || !level) return;
      if (!scoped) {
        history.set(withAuthored(layout, bp, pages.map((p, i) => (i === current ? { ...p, items: nextItems } : p)), metrics));
        return;
      }
      // Rebuild along the path: each ancestor's children get re-authored on its own span at this breakpoint.
      const rebuild = (levelItems: GridLayoutItem[], depth: number): GridLayoutItem[] => {
        const id = path[depth]!;
        return levelItems.map((item) => {
          if (item.id !== id) return item;
          const inner = resolveSubSlots(item.children, item, metrics);
          const nextInner = depth === path.length - 1 ? nextItems : rebuild(inner, depth + 1);
          const children = withAuthored(item.children ?? { authored: {} }, bp, [{ id: "page-1", items: nextInner }], { cols: item.colSpan, rows: item.rowSpan });
          return { ...item, children };
        });
      };
      history.set(withAuthored(layout, bp, pages.map((p, i) => (i === current ? { ...p, items: rebuild(p.items, 0) } : p)), metrics));
    },
    [metrics, level, scoped, layout, bp, pages, current, history, path],
  );

  /** What the editor edits: the page, or the level's items placed on the page's field at the level's origin. */
  const editorLayout = React.useMemo<GridLayout>(() => {
    if (!scoped || !metrics || !level) return layout;
    const placed = items.map((item) => translate(item, level.origin.col - 1, level.origin.row - 1));
    return { authored: { [bp]: [{ id: "scope", items: placed }] }, shapes: { [bp]: { cols: metrics.cols, rows: metrics.rows } } };
  }, [scoped, metrics, level, layout, items, bp]);

  const onEditorChange = (next: GridLayout) => {
    if (!scoped || !level) {
      history.set(next);
      return;
    }
    const placed = next.authored[bp]?.[0]?.items ?? [];
    commitItems(placed.map((item) => translate(item, 1 - level.origin.col, 1 - level.origin.row)));
  };

  const reservedOutside = React.useMemo(() => (scoped && metrics && level ? outside(level.rect, metrics.cols, metrics.rows) : []), [scoped, metrics, level]);
  /** The level's reserved cells, relative to the level: the pager's on the page, none inside a slot. */
  const levelReserved = scoped || !metrics ? [] : pagerCells(current, count, metrics.cols, metrics.rows);

  // Mobile-first (D22): the narrowest authored breakpoint is the layout's source; the rest derive from it upward.
  const narrowest = narrowestAuthored(layout);
  const hasOwn = !!layout.authored[bp];
  const isSource = hasOwn && bp === narrowest;
  const repacked = !!topResolved && topResolved.mode === "packed";
  const centred = !!topResolved && topResolved.mode === "centred";

  // ── adding, removing, moving ────────────────────────────────────────────────────────────────────────────────
  const makeItem = (entry: PaletteEntry, rect: GridRect): GridLayoutItem => ({
    id: `${entry.key.replace(/[^a-z0-9]+/gi, "-")}-${Date.now().toString(36)}`,
    ...rect,
    label: entry.name,
    slot: { fill: entry.fill ?? "transparent" },
    component: entry.entry ? { kind: entry.entry.kind, props: defaultProps(entry.entry) } : undefined,
  });

  /** A component dropped on a slot goes INTO it (S1); an empty slot dropped on a slot becomes a sub-slot of it. */
  const addEntry = (entry: PaletteEntry, at?: GridRect) => {
    if (!metrics || !level) return;
    const hit = at ? items.find((item) => item.col <= at.col && at.col < item.col + item.colSpan && item.row <= at.row && at.row < item.row + item.rowSpan) : null;
    if (hit) {
      if (!canTake(hit)) return;
      if (entry.entry && !hit.children) {
        commitItems(items.map((item) => (item.id === hit.id ? { ...item, label: entry.name, component: { kind: entry.entry!.kind, props: defaultProps(entry.entry!) } } : item)));
        setSelected(hit.id);
        return;
      }
      // Into the slot as a child, at the cell relative to it.
      const inner = resolveSubSlots(hit.children, hit, metrics);
      const rel: GridRect = { col: at!.col - hit.col + 1, row: at!.row - hit.row + 1, colSpan: Math.min(entry.span.colSpan, hit.colSpan), rowSpan: Math.min(entry.span.rowSpan, hit.rowSpan) };
      const rect = rectIsValid(rel, inner, hit.colSpan, hit.rowSpan) ? rel : findFreeRect(inner, hit.colSpan, hit.rowSpan, rel.colSpan, rel.rowSpan) ?? findFreeRect(inner, hit.colSpan, hit.rowSpan, 1, 1);
      if (!rect) return;
      const child = makeItem(entry, rect);
      const children = withAuthored(hit.children ?? { authored: {} }, bp, [{ id: "page-1", items: [...inner, child] }], { cols: hit.colSpan, rows: hit.rowSpan });
      commitItems(items.map((item) => (item.id === hit.id ? { ...item, component: undefined, children } : item)));
      setSelected(hit.id);
      return;
    }
    const shape = level.shape;
    const rect =
      (at && rectIsValid({ ...at, colSpan: entry.span.colSpan, rowSpan: entry.span.rowSpan }, items, shape.cols, shape.rows, levelReserved) ? { ...at, colSpan: entry.span.colSpan, rowSpan: entry.span.rowSpan } : null) ??
      findFreeRect(items, shape.cols, shape.rows, entry.span.colSpan, entry.span.rowSpan, levelReserved) ??
      findFreeRect(items, shape.cols, shape.rows, 1, 1, levelReserved);
    if (!rect) return;
    const item = makeItem(entry, rect);
    commitItems([...items, item]);
    setSelected(item.id);
  };

  /** What can take a drop: a slot (not one of the page's specimen boxes) that holds no component. */
  const canTake = (target: GridLayoutItem) => isSlotItem(target) && !target.component;

  /** A box dragged onto a slot goes INTO it as a sub-slot, at the cell it was dropped on (Slots.md §4). */
  const dropInto = (itemId: string, targetId: string, cell: { col: number; row: number }) => {
    if (!metrics) return false;
    const moving = items.find((item) => item.id === itemId);
    const target = items.find((item) => item.id === targetId);
    if (!moving || !target || !canTake(target) || !isSlotItem(moving)) return false;
    const inner = resolveSubSlots(target.children, target, metrics);
    const wanted: GridRect = { ...cell, colSpan: Math.min(moving.colSpan, target.colSpan), rowSpan: Math.min(moving.rowSpan, target.rowSpan) };
    const rect = rectIsValid(wanted, inner, target.colSpan, target.rowSpan) ? wanted : findFreeRect(inner, target.colSpan, target.rowSpan, wanted.colSpan, wanted.rowSpan) ?? findFreeRect(inner, target.colSpan, target.rowSpan, 1, 1);
    if (!rect) return false;
    const children = withAuthored(target.children ?? { authored: {} }, bp, [{ id: "page-1", items: [...inner, { ...moving, ...rect }] }], { cols: target.colSpan, rows: target.rowSpan });
    commitItems(items.filter((item) => item.id !== itemId).map((item) => (item.id === targetId ? { ...item, component: undefined, children } : item)));
    setSelected(targetId);
    return true;
  };

  const removeSelected = () => {
    if (!selected) return;
    commitItems(items.filter((item) => item.id !== selected));
    setSelected(null);
  };

  const commitPages = (next: GridPage[]) => {
    if (!metrics) return;
    history.set(withAuthored(layout, bp, next, metrics));
  };
  const onAddPage = () => {
    if (!metrics) return;
    commitPages(addPage(pages, metrics.cols, metrics.rows));
    setPage(count);
  };
  const onRemovePage = () => {
    if (!metrics || count <= 1) return;
    commitPages(removePage(pages, current, metrics.cols, metrics.rows));
    setPage(Math.max(0, current - 1));
    setSelected(null);
  };
  const sendSelected = (delta: -1 | 1) => {
    if (!metrics || !selected) return;
    const next = moveItemToPage(pages, selected, current, current + delta, metrics.cols, metrics.rows);
    if (!next) return;
    commitPages(next);
    setPage(current + delta);
  };
  const resetToPage = () => {
    if (!metrics) return;
    history.set(seedFrom(content, metrics));
    setPage(0);
    setSelected(null);
    setPath([]);
  };

  const setCell = (key: GridBreakpoint, dir: 1 | -1) => {
    setConfig((previous) => {
      const spec = specFor(previous, key);
      return { ...previous, [key]: { cell: Math.max(MIN_CELL, Math.min(MAX_CELL, spec.cell + dir * CELL_STEP)), gap: spec.gap } };
    });
  };
  const setGap = (key: GridBreakpoint, dir: 1 | -1) => {
    setConfig((previous) => {
      const spec = specFor(previous, key);
      const nearest = GRID_SPACING.reduce((best, step) => (Math.abs(step - spec.gap) < Math.abs(best - spec.gap) ? step : best));
      const index = Math.max(0, Math.min(GRID_SPACING.length - 1, GRID_SPACING.indexOf(nearest) + dir));
      return { ...previous, [key]: { cell: spec.cell, gap: GRID_SPACING[index]! } };
    });
  };

  // ── the selected slot: tokens, props, span ─────────────────────────────────────────────────────────────────
  const selectedItem = items.find((item) => item.id === selected) ?? null;
  const updateSelected = (change: (item: GridLayoutItem) => GridLayoutItem) => {
    if (!selected) return;
    commitItems(items.map((item) => (item.id === selected ? change(item) : item)));
  };
  const setSlotToken = (patch: Partial<NonNullable<GridLayoutItem["slot"]>>) => updateSelected((item) => ({ ...item, slot: { ...item.slot, ...patch } }));
  const setProp = (key: string, value: unknown) =>
    updateSelected((item) => (item.component ? { ...item, component: { ...item.component, props: { ...item.component.props, [key]: value } } } : item));
  const clearSelected = () => updateSelected((item) => ({ ...item, component: undefined, children: undefined, label: undefined }));

  /** The field a breakpoint is authored on for the PAGE: the one on show, else its reference field (D18). */
  const shapeOf = (key: GridBreakpoint) => (metrics && key === bp ? { cols: metrics.cols, rows: metrics.rows } : referenceShape(key, config, NAV_HEIGHT));
  const spanAt = (key: GridBreakpoint, id: string) => {
    const shape = shapeOf(key);
    const spec = specFor(config, key);
    for (const p of resolvePages(layout, { bp: key, cell: spec.cell, gap: spec.gap, ...shape }).pages) {
      const item = p.items.find((candidate) => candidate.id === id);
      if (item) return { colSpan: item.colSpan, rowSpan: item.rowSpan };
    }
    return null;
  };
  const setSpan = (key: GridBreakpoint, axis: "colSpan" | "rowSpan", delta: number) => {
    if (!selected) return;
    const shape = shapeOf(key);
    const spec = specFor(config, key);
    const at = resolvePages(layout, { bp: key, cell: spec.cell, gap: spec.gap, ...shape });
    const next = at.pages.map((p, index) => {
      const item = p.items.find((candidate) => candidate.id === selected);
      if (!item) return p;
      const others = p.items.filter((candidate) => candidate.id !== selected);
      const reserved = pagerCells(index, at.pages.length, shape.cols, shape.rows);
      const wanted: GridRect = { ...item, [axis]: Math.max(1, Math.min(axis === "colSpan" ? shape.cols : shape.rows, item[axis] + delta)) };
      const rect = rectIsValid(wanted, others, shape.cols, shape.rows, reserved) ? wanted : findFreeRect(others, shape.cols, shape.rows, wanted.colSpan, wanted.rowSpan, reserved);
      if (!rect) return p;
      return { ...p, items: p.items.map((candidate) => (candidate.id === selected ? { ...candidate, ...rect } : candidate)) };
    });
    history.set(withAuthored(layout, key, next, shape));
  };

  // ── the palette drag (D19) ─────────────────────────────────────────────────────────────────────────────────
  type Placing = { entry: PaletteEntry; x: number; y: number; moved: boolean; cell: { col: number; row: number } | null; rect: GridRect | null; valid: boolean };
  const [placing, setPlacing] = React.useState<Placing | null>(null);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [slotOpen, setSlotOpen] = React.useState(false);

  // ── going in and out of a slot (Slots.md §4): double-click in, Escape or a double-click outside up ───────────
  const enter = (id: string) => {
    const item = items.find((candidate) => candidate.id === id);
    if (!item) return;
    if (item.component) {
      setSelected(id);
      setSlotOpen(true); // nothing to enter: double-click opens its props
      return;
    }
    setPath([...path, id]);
    setSelected(null);
  };
  const up = () => {
    setPath(path.slice(0, -1));
    setSelected(path[path.length - 1] ?? null);
  };
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      if (document.querySelector('[data-slot="popover-content"], [role="dialog"]')) return; // a popover owns Escape
      if (selected) setSelected(null);
      else if (path.length) up();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  /** The cell under a screen point, relative to the LEVEL, or null off the level. Reads the field's box from the DOM. */
  const cellAt = (x: number, y: number) => {
    if (!metrics || !level) return null;
    const tracks = document.querySelector<HTMLElement>('[data-slot="grid-tracks"]');
    if (!tracks) return null;
    const box = tracks.getBoundingClientRect();
    const step = (metrics.cell + metrics.gap) * metrics.scale;
    const col = Math.floor((x - box.left) / step) + 1 - (level.origin.col - 1);
    const row = Math.floor((y - box.top) / step) + 1 - (level.origin.row - 1);
    if (col < 1 || row < 1 || col > level.shape.cols || row > level.shape.rows) return null;
    return { col, row };
  };
  const beginPlace = (event: React.PointerEvent, entry: PaletteEntry) => {
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    setPlacing({ entry, x: event.clientX, y: event.clientY, moved: false, cell: null, rect: null, valid: false });
  };
  const movePlace = (event: React.PointerEvent) => {
    if (!placing || !metrics || !level) return;
    const moved = placing.moved || Math.hypot(event.clientX - placing.x, event.clientY - placing.y) > 4;
    const cell = cellAt(event.clientX, event.clientY);
    const over = cell ? items.find((item) => item.col <= cell.col && cell.col < item.col + item.colSpan && item.row <= cell.row && cell.row < item.row + item.rowSpan) : null;
    // Over a slot: the whole slot lights up (the drop goes into it). Over empty cells: the ghost is the new slot.
    const rect = over
      ? { col: over.col, row: over.row, colSpan: over.colSpan, rowSpan: over.rowSpan }
      : cell
        ? { ...cell, colSpan: placing.entry.span.colSpan, rowSpan: placing.entry.span.rowSpan }
        : null;
    const valid = !!rect && (over ? canTake(over) : rectIsValid(rect, items, level.shape.cols, level.shape.rows, levelReserved));
    setPlacing({ ...placing, moved, cell, rect, valid });
  };
  const endPlace = () => {
    if (!placing) return;
    if (!placing.moved) addEntry(placing.entry);
    else if (placing.cell && placing.valid) addEntry(placing.entry, { ...placing.cell, colSpan: placing.entry.span.colSpan, rowSpan: placing.entry.span.rowSpan });
    setPlacing(null);
    setPaletteOpen(false);
  };

  const overlaps = countOverlaps(items);
  const pageTitle = source?.title ?? null;

  /** What a page-level item shows: the page's own specimen, a slot's content, or the editor's tile. */
  const drawItem = (item: GridLayoutItem, topLevel: boolean) => {
    const specimen = topLevel && content && !isSlotItem(item) ? findItem(content, item.id) : undefined;
    if (specimen && content) return renderSpecimen(content, specimen, item);
    if (isSlotItem(item)) return <SlotContent item={item} />;
    return (
      <Slot fill="card" inset={8} className="place-items-center text-center">
        <span className="text-xs font-semibold tracking-wide uppercase">{item.label ?? item.id}</span>
      </Slot>
    );
  };

  /** A placed item in the editor. */
  const renderItem = (item: GridLayoutItem, state: { selected: boolean }) => {
    // The content must not swallow the editor's drag: the wrapper takes the pointer, the content is inert under it.
    // With something selected, everything else dims so the eye stays where the work is (Slots.md §4).
    return (
      <div className={cn("relative h-full w-full transition-opacity", state.selected && "ring-foreground ring-2", selected && !state.selected && "opacity-60")}>
        <div className="pointer-events-none h-full w-full">{drawItem(item, !scoped)}</div>
      </div>
    );
  };

  const selectedEntry = selectedItem?.component ? registryEntry(selectedItem.component.kind) : undefined;


  const selectedFill = selectedItem?.slot?.fill ?? "transparent";

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      {/* ── the toolbar ─────────────────────────────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b px-4 py-2 md:flex-wrap md:overflow-visible">
        {pageTitle ? (
          <Button asChild size="sm" variant="ghost">
            <Link href={from}>
              <ArrowLeftIcon data-icon="inline-start" /> {pageTitle}
            </Link>
          </Button>
        ) : (
          <span className="text-muted-foreground shrink-0 px-2 font-mono text-xs">scratch</span>
        )}

        <Separator orientation="vertical" className="h-6" />

        {/* the palette (D19, S1): slots, atoms, molecules — drag onto cells or onto a slot, or click */}
        <Popover open={paletteOpen} onOpenChange={setPaletteOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline">
              <PlusIcon data-icon="inline-start" /> Add
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-0">
            <Command>
              <CommandInput placeholder="Slots, atoms and molecules…" />
              <CommandList className="max-h-80">
                <CommandEmpty>Nothing by that name.</CommandEmpty>
                {PALETTE_GROUPS.map((group) => (
                  <CommandGroup key={group} heading={group}>
                    {PALETTE.filter((entry) => entry.group === group).map((entry) => (
                      <CommandItem key={entry.key} value={`${entry.key} ${entry.name}`} className="p-0" onSelect={() => {}}>
                        {/* The drag lives on an inner element: the command list sets its own onPointerMove on the item
                            (for its highlight) and would override ours. */}
                        <span
                          className="flex w-full cursor-grab touch-none items-center gap-2 px-2 py-1.5 select-none active:cursor-grabbing"
                          onPointerDown={(event) => beginPlace(event, entry)}
                          onPointerMove={movePlace}
                          onPointerUp={endPlace}
                          onPointerCancel={() => setPlacing(null)}
                        >
                          <span className="flex-1 truncate">{entry.name}</span>
                          <span className="text-muted-foreground font-mono text-[10px]">
                            {entry.span.colSpan}×{entry.span.rowSpan}
                          </span>
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Tip label="Delete — or press Delete">
          <Button size="icon-sm" variant="outline" onClick={removeSelected} disabled={!selected} aria-label="Delete the selected slot">
            <Trash2Icon />
          </Button>
        </Tip>

        {/* the slot inspector (S3, S4): fill, inset, alignment, the component's props, enter, clear */}
        <Popover open={slotOpen} onOpenChange={setSlotOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" disabled={!selectedItem}>
              Slot
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[26rem] space-y-3">
            <p className="text-xs">
              <span className="font-semibold">{selectedItem?.label ?? selectedItem?.id}</span>
              <span className="text-muted-foreground">
                {" "}
                · {selectedItem?.children ? "sub-slots" : selectedEntry ? `${selectedEntry.name} — its props are below the tokens` : "empty — drop a component on it, or Enter to lay out sub-slots"}
              </span>
            </p>
            <Stack label="Fill">
              <ToggleGroup type="single" size="sm" variant="outline" className="grid w-full grid-cols-4" value={selectedFill} onValueChange={(v) => v && setSlotToken({ fill: v as SlotFill })}>
                {SLOT_FILLS.map((fill) => (
                  <ToggleGroupItem key={fill} value={fill} className="px-1 font-mono text-[10px] tracking-normal">
                    {fill}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Stack>
            {!selectedItem?.children ? (
              <>
                <Row label="Inset">
                  <Stepper
                    label="inset"
                    value={selectedItem?.slot?.inset ?? defaultInset(selectedFill)}
                    onChange={(d) => {
                      const now = selectedItem?.slot?.inset ?? defaultInset(selectedFill);
                      const index = Math.max(0, Math.min(GRID_SPACING.length - 1, GRID_SPACING.indexOf(now as SlotInset) + d));
                      setSlotToken({ inset: GRID_SPACING[index] as SlotInset });
                    }}
                  />
                </Row>
                <Stack label="Align X">
                  <ToggleGroup type="single" size="sm" variant="outline" className="grid w-full grid-cols-4" value={selectedItem?.slot?.alignX ?? "stretch"} onValueChange={(v) => v && setSlotToken({ alignX: v as SlotAlign })}>
                    {SLOT_ALIGNS.map((a) => (
                      <ToggleGroupItem key={a} value={a} className="px-1 font-mono text-[10px] tracking-normal">
                        {a}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Stack>
                <Stack label="Align Y">
                  <ToggleGroup type="single" size="sm" variant="outline" className="grid w-full grid-cols-4" value={selectedItem?.slot?.alignY ?? "stretch"} onValueChange={(v) => v && setSlotToken({ alignY: v as SlotAlign })}>
                    {SLOT_ALIGNS.map((a) => (
                      <ToggleGroupItem key={a} value={a} className="px-1 font-mono text-[10px] tracking-normal">
                        {a}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Stack>
              </>
            ) : (
              <p className="text-muted-foreground text-xs">A slot with sub-slots has no inset or alignment (Slots.md S2): its children sit on its cells.</p>
            )}
            {!selectedItem?.children ? (
              <>
                <Separator />
                <Row label="Component" htmlFor="slot-component">
                  <NativeSelect
                    id="slot-component"
                    value={selectedItem?.component?.kind ?? ""}
                    onChange={(event) => {
                      const entry = registryEntry(event.target.value);
                      updateSelected((item) => (entry ? { ...item, label: entry.name, component: { kind: entry.kind, props: defaultProps(entry) } } : { ...item, component: undefined }));
                    }}
                    className="h-7 text-xs"
                  >
                    <NativeSelectOption value="">— none —</NativeSelectOption>
                    {(["atom", "molecule"] as const).map((group) => (
                      <optgroup key={group} label={group === "atom" ? "Atoms" : "Molecules"}>
                        {REGISTRY.filter((entry) => entry.group === group).map((entry) => (
                          <NativeSelectOption key={entry.kind} value={entry.kind}>
                            {entry.name}
                          </NativeSelectOption>
                        ))}
                      </optgroup>
                    ))}
                  </NativeSelect>
                </Row>
              </>
            ) : null}
            {selectedEntry && selectedEntry.props.length ? (
              <>
                <div className="space-y-2">
                  {selectedEntry.props.map((field) => {
                    const value = selectedItem?.component?.props?.[field.key] ?? field.default;
                    const id = `prop-${field.key}`;
                    return (
                      <Row key={field.key} label={field.label} htmlFor={id}>
                        {field.kind === "text" ? (
                          <Input id={id} value={String(value ?? "")} onChange={(event) => setProp(field.key, event.target.value)} className="h-7 text-xs" />
                        ) : field.kind === "select" ? (
                          <NativeSelect id={id} value={String(value)} onChange={(event) => setProp(field.key, event.target.value)} className="h-7 text-xs">
                            {field.options.map((option) => (
                              <NativeSelectOption key={option} value={option}>
                                {option}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        ) : (
                          <Switch id={id} checked={Boolean(value)} onCheckedChange={(checked) => setProp(field.key, checked)} />
                        )}
                      </Row>
                    );
                  })}
                </div>
              </>
            ) : null}
            <Separator />
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={!selectedItem || !!selectedItem.component}
                onClick={() => {
                  if (!selected) return;
                  setSlotOpen(false);
                  enter(selected);
                }}
              >
                <ChevronRightIcon data-icon="inline-start" /> Enter
              </Button>
              <Button size="xs" variant="ghost" onClick={clearSelected} disabled={!selectedItem || (!selectedItem.component && !selectedItem.children)}>
                Clear
              </Button>
              <span className="text-muted-foreground ms-auto font-mono text-[10px]">
                {selectedItem ? `${selectedItem.colSpan}×${selectedItem.rowSpan} at ${selectedItem.col},${selectedItem.row}` : ""}
              </span>
            </div>
          </PopoverContent>
        </Popover>

        {/* the span inspector (D18) — on the page; inside a slot the handles do it, on this breakpoint */}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" disabled={!selectedItem || scoped}>
              Span
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[22rem]">
            <p className="text-muted-foreground mb-3 text-xs">
              <span className="text-foreground font-semibold">{selectedItem?.label ?? selectedItem?.id}</span> — its size in cells at each breakpoint. Setting
              one authors that breakpoint on its reference field (Grid.md D18). The row on show is highlighted.
            </p>
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-2 px-2 text-[10px] uppercase tracking-wider">
                <span className="w-10 shrink-0" />
                <span className="w-[5.5rem] shrink-0 text-center">cols</span>
                <span className="w-[5.5rem] shrink-0 text-center">rows</span>
                <span className="flex-1 text-end">field</span>
              </div>
              {BREAKPOINT_ORDER.map((key) => {
                const span = selected ? spanAt(key, selected) : null;
                const shape = shapeOf(key);
                return (
                  <div key={key} className={cn("flex items-center gap-2 px-2 py-1 text-sm", bp === key && "bg-muted font-semibold")}>
                    <span className="w-10 shrink-0 font-mono text-xs uppercase">{key}</span>
                    <Stepper label="columns" value={span?.colSpan ?? 0} onChange={(d) => setSpan(key, "colSpan", d)} />
                    <Stepper label="rows" value={span?.rowSpan ?? 0} onChange={(d) => setSpan(key, "rowSpan", d)} />
                    <span className="text-muted-foreground flex-1 text-end font-mono text-[10px]">
                      {shape.cols}×{shape.rows}
                    </span>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
        <Tip label="Send to the previous page">
          <Button size="icon-sm" variant="ghost" onClick={() => sendSelected(-1)} disabled={scoped || !selected || current === 0} aria-label="Send to previous page">
            <ArrowLeftToLineIcon />
          </Button>
        </Tip>
        <Tip label="Send to the next page">
          <Button size="icon-sm" variant="ghost" onClick={() => sendSelected(1)} disabled={scoped || !selected || current >= count - 1} aria-label="Send to next page">
            <ArrowRightToLineIcon />
          </Button>
        </Tip>

        <Separator orientation="vertical" className="h-6" />

        <Button size="icon-sm" variant="ghost" onClick={history.undo} disabled={!history.canUndo} aria-label="Undo">
          <Undo2Icon />
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={history.redo} disabled={!history.canRedo} aria-label="Redo">
          <Redo2Icon />
        </Button>
        <Tip label={pageTitle ? `Start again from ${pageTitle} as it is` : "Clear the field"}>
          <Button size="icon-sm" variant="ghost" onClick={resetToPage} aria-label="Reset the layout">
            <RotateCcwIcon />
          </Button>
        </Tip>

        <Separator orientation="vertical" className="h-6" />

        {/* turning the page: the toolbar's ‹ ›, the pager's ↑ ↓ on the field (D27), and ← → with nothing selected */}
        <Tip label="Previous page — or ← with nothing selected">
          <Button size="icon-sm" variant="ghost" onClick={() => setPage(Math.max(0, current - 1))} disabled={scoped || current === 0} aria-label="Previous page">
            <ChevronLeftIcon />
          </Button>
        </Tip>
        <span className="shrink-0 font-mono text-xs">
          page {current + 1} / {count}
        </span>
        <Tip label="Next page — or → with nothing selected">
          <Button size="icon-sm" variant="ghost" onClick={() => setPage(Math.min(count - 1, current + 1))} disabled={scoped || current >= count - 1} aria-label="Next page">
            <ChevronRightIcon />
          </Button>
        </Tip>
        <Tip label="Add a page after this one">
          <Button size="icon-sm" variant="ghost" onClick={onAddPage} disabled={scoped} aria-label="Add a page">
            <FilePlusIcon />
          </Button>
        </Tip>
        <Tip label="Remove this page and its boxes">
          <Button size="icon-sm" variant="ghost" onClick={onRemovePage} disabled={scoped || count <= 1} aria-label="Remove this page">
            <FileXIcon />
          </Button>
        </Tip>

        <Separator orientation="vertical" className="h-6" />

        <Tip label={frame ? `A ${frame.width} × ${frame.height} frame, which resolves to ${bp}. Press a breakpoint to snap to its reference box; fit takes the room.` : "The grid on the room itself. Press a breakpoint to preview it in a frame of its reference box."}>
          <ToggleGroup type="single" value={frame ? bp : "fit"} variant="outline" size="sm">
            <ToggleGroupItem value="fit" className="font-mono" onClick={() => setFrame(null)}>
              fit
            </ToggleGroupItem>
            {BREAKPOINT_ORDER.map((key) => (
              <ToggleGroupItem key={key} value={key} className="font-mono" onClick={() => setFrame(referenceBox(key, NAV_HEIGHT))}>
                {key}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Tip>
        <Tip label="Rotate the frame — swap its width and height">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Rotate the frame"
            disabled={!metrics}
            onClick={() => {
              const w = frame?.width ?? Math.round(metrics?.boxW ?? 0);
              const h = frame?.height ?? Math.round(metrics?.boxH ?? 0);
              if (w > 0 && h > 0) setFrame({ width: h, height: w });
            }}
          >
            <RotateCwIcon />
          </Button>
        </Tip>

        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline">
              Cell
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[20rem]">
            <p className="text-muted-foreground mb-3 text-xs">
              One row per breakpoint, two numbers (Grid.md D15): the cell in px, and the gutter along the spacing scale, {GRID_SPACING.join(" · ")}. The
              counts follow the box (D12). The row in use is highlighted.
            </p>
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-2 px-2 text-[10px] uppercase tracking-wider">
                <span className="w-10 shrink-0" />
                {["cell", "gap"].map((h) => (
                  <span key={h} className="w-[5.5rem] shrink-0 text-center">
                    {h}
                  </span>
                ))}
              </div>
              {BREAKPOINT_ORDER.map((key) => {
                const spec = specFor(config, key);
                return (
                  <div key={key} className={cn("flex items-center gap-2 px-2 py-1 text-sm", bp === key && "bg-muted font-semibold")}>
                    <span className="w-10 shrink-0 font-mono text-xs uppercase">{key}</span>
                    <Stepper label="cell" value={spec.cell} onChange={(d) => setCell(key, d > 0 ? 1 : -1)} />
                    <Stepper label="gap" value={spec.gap} onChange={(d) => setGap(key, d > 0 ? 1 : -1)} />
                  </div>
                );
              })}
            </div>
            <Button size="xs" variant="ghost" className="mt-3" onClick={() => setConfig(DEFAULT_GRID_CONFIG)}>
              Reset
            </Button>
          </PopoverContent>
        </Popover>

        <div className="flex shrink-0 items-center gap-2">
          <Switch id="overlay" checked={overlay} onCheckedChange={setOverlay} />
          <Label htmlFor="overlay" className="text-xs">Cells</Label>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Switch id="rulers" checked={rulers} onCheckedChange={setRulers} />
          <Label htmlFor="rulers" className="text-xs">Rulers</Label>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">Export</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{pageTitle ? `${pageTitle}, as arranged` : "The layout"}</DialogTitle>
              <DialogDescription>
                Authored at {Object.keys(layout.authored).join(", ")}; everything else derives. Copy the layout and hand it to the agent to put on{" "}
                {pageTitle ? `the ${pageTitle} page` : "a page"}; the config is the grid it was made on.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <CodeBlock title="GridLayout" code={layoutCode(layout)} />
              <CodeBlock title="GridConfig" code={configCode(config)} />
            </div>
          </DialogContent>
        </Dialog>

        <div className="ms-auto flex shrink-0 items-center gap-2">
          {topResolved ? (
            <Badge variant={isSource ? "default" : hasOwn ? "secondary" : "outline"} className="font-mono">
              {bp}
              {isSource ? " · source" : hasOwn ? " · authored" : ` · derived from ${topResolved.source}`}
              {repacked ? ` · packed from ${topResolved.sourceShape.cols}×${topResolved.sourceShape.rows}` : centred ? ` · centred from ${topResolved.sourceShape.cols}×${topResolved.sourceShape.rows}` : ""}
            </Badge>
          ) : null}
          {hasOwn && !isSource ? (
            <Tip label={`Drop ${bp}'s own pages and derive again`}>
              <Button size="icon-sm" variant="ghost" onClick={() => history.set(withoutAuthored(layout, bp))} aria-label="Derive again">
                <UnlinkIcon />
              </Button>
            </Tip>
          ) : null}
          {overlaps > 0 ? (
            <span className="border-destructive text-destructive border px-2 py-1 font-mono text-[11px]">
              {overlaps} overlap{overlaps === 1 ? "" : "s"}
            </span>
          ) : null}
          <p className="text-muted-foreground font-mono text-[11px]">
            {metrics
              ? `${metrics.cols}×${metrics.rows} · cell ${metrics.cell} · gap ${metrics.gap} · margin ${Math.round((metrics.boxW - metrics.gridW) / 2)}×${Math.round((metrics.boxH - metrics.gridH) / 2)} · box ${Math.round(metrics.boxW)}×${Math.round(metrics.boxH)}${scale < 1 ? ` · ×${scale.toFixed(2)}` : ""}`
              : "measuring…"}
          </p>
        </div>
      </div>

      {/* ── inside a slot: the crumb (Slots.md §4) ─────────────────────────────────────────────────────────── */}
      {scoped && level ? (
        <div className="text-muted-foreground flex shrink-0 items-center gap-1 px-4 py-0.5 font-mono text-[11px]">
          <Button size="xs" variant="ghost" onClick={up}>
            <CornerLeftUpIcon data-icon="inline-start" /> Up
          </Button>
          <Button size="xs" variant="ghost" onClick={() => { setPath([]); setSelected(null); }}>
            {pageTitle ?? "page"}
          </Button>
          {level.crumbs.map((crumb, i) => (
            <React.Fragment key={crumb.id}>
              <ChevronRightIcon className="text-muted-foreground size-3" />
              <Button size="xs" variant={i === level.crumbs.length - 1 ? "secondary" : "ghost"} onClick={() => { setPath(path.slice(0, i + 1)); setSelected(null); }}>
                {crumb.label}
              </Button>
            </React.Fragment>
          ))}
          <span className="ms-auto">
            {level.shape.cols}×{level.shape.rows} cells — the slot's own field · Esc or double-click outside to go up
          </span>
        </div>
      ) : null}

      {/* ── the grid, in its frame ──────────────────────────────────────────────────────────────────────── */}
      <div
        className={cn("min-h-0 flex-1 overflow-hidden", frame && "p-4")}
        onDoubleClick={(event) => {
          // A double-click on the dimmed field outside the slot goes up (Slots.md §4); a box's own double-click stops here.
          if (scoped && !(event.target as HTMLElement).closest('[data-slot="grid-item"]')) up();
        }}
      >
        <GridFrame size={frame} onSizeChange={setFrame} onScaleChange={setScale} label={frame ? <FrameLabel frame={frame} bp={bp} /> : undefined}>
          <GridEditor
            layout={editorLayout}
            onLayoutChange={onEditorChange}
            page={scoped ? 0 : current}
            onPageChange={setPage}
            selected={selected}
            onSelectedChange={setSelected}
            config={config}
            overlay={overlay}
            rulers={rulers}
            pager={!scoped}
            reserved={reservedOutside}
            onDropInto={dropInto}
            onItemDoubleClick={enter}
            canDropInto={(id) => {
              const target = items.find((item) => item.id === id);
              return !!target && canTake(target);
            }}
            onMetrics={setMetrics}
            onResolved={scoped ? undefined : setResolved}
            renderItem={renderItem}
            className="h-full"
          >
            {/* Inside a slot: the rest of the page, dimmed and inert, so the slot's cells read as the field. */}
            {scoped && level
              ? pageItems.filter((item) => item.id !== path[0]).map((item) => (
                  <GridItem key={`ctx-${item.id}`} col={item.col} row={item.row} colSpan={item.colSpan} rowSpan={item.rowSpan} aria-hidden className="pointer-events-none opacity-25">
                    {drawItem(item, true)}
                  </GridItem>
                ))
              : null}
            {scoped && level ? (
              <GridItem col={level.rect.col} row={level.rect.row} colSpan={level.rect.colSpan} rowSpan={level.rect.rowSpan} aria-hidden className="border-foreground/40 pointer-events-none -m-1 border-2 border-dashed" />
            ) : null}
            {placing?.rect && level ? (
              <GridItem
                col={placing.rect.col + level.origin.col - 1}
                row={placing.rect.row + level.origin.row - 1}
                colSpan={placing.rect.colSpan}
                rowSpan={placing.rect.rowSpan}
                aria-hidden
                className={cn("pointer-events-none z-10 border-2 border-dashed", placing.valid ? "border-foreground bg-foreground/5" : "border-destructive bg-destructive/10")}
              />
            ) : null}
          </GridEditor>
        </GridFrame>
      </div>
    </div>
  );
}

/**
 * The page as it is, arranged onto the field on show the way the page itself arranges it (Portfolio.md P2,
 * `src/lib/arrange.ts`) — or its authored layout if the composer has been over it.
 */
function seedFrom(content: PageContent | null, metrics: GridMetrics): GridLayout {
  if (!content) return EMPTY;
  if (content.layout) return content.layout;
  const field = { bp: metrics.bp, cols: metrics.cols, rows: metrics.rows };
  return { shapes: { [metrics.bp]: { cols: metrics.cols, rows: metrics.rows } }, authored: { [metrics.bp]: arrange(content, field) } };
}

function FrameLabel({ frame, bp }: { frame: GridFrameSize; bp: GridBreakpoint }) {
  const reference = BREAKPOINT_ORDER.find((key) => {
    const box = referenceBox(key, NAV_HEIGHT);
    return box.width === frame.width && box.height === frame.height;
  });
  return (
    <>
      {frame.width} × {frame.height} · {bp}
      {reference ? ` · ${reference} reference, under the nav` : ""}
    </>
  );
}

/** A label above a full-width control — for the toggle rows, whose four options want the whole width. */
function Stack({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</p>
      {children}
    </div>
  );
}

function Row({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Label htmlFor={htmlFor} className="text-muted-foreground w-24 shrink-0 truncate pt-1.5 text-[10px] uppercase tracking-wider" title={label}>
        {label}
      </Label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Tip({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (delta: number) => void }) {
  return (
    <span className="flex w-[5.5rem] shrink-0 items-center gap-1">
      <Button size="icon-xs" variant="ghost" onClick={() => onChange(-1)} aria-label={`One fewer ${label}`}>
        <MinusIcon />
      </Button>
      <span className="w-8 text-center font-mono text-xs" aria-label={`${value} ${label}`}>
        {value}
      </span>
      <Button size="icon-xs" variant="ghost" onClick={() => onChange(1)} aria-label={`One more ${label}`}>
        <PlusIcon />
      </Button>
    </span>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="relative">
      <p className="text-muted-foreground mb-1 font-mono text-[10px] uppercase tracking-wider">{title}</p>
      <pre className="bg-muted max-h-64 overflow-auto p-3 font-mono text-xs">{code}</pre>
      <Button
        size="xs"
        variant="outline"
        className="absolute top-6 right-2"
        onClick={() => {
          navigator.clipboard?.writeText(code);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        }}
      >
        <CopyIcon /> {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
