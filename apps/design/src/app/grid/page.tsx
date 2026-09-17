"use client";

import * as React from "react";
import {
  ArrowLeftToLineIcon,
  ArrowRightToLineIcon,
  CopyIcon,
  FilePlusIcon,
  FileXIcon,
  MinusIcon,
  PlusIcon,
  Redo2Icon,
  RotateCcwIcon,
  Trash2Icon,
  Undo2Icon,
  UnlinkIcon,
} from "lucide-react";

import { cn } from "@no-origins/ui/lib/utils";
import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@no-origins/ui/components/dialog";
import { Label } from "@no-origins/ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@no-origins/ui/components/popover";
import { Separator } from "@no-origins/ui/components/separator";
import { Switch } from "@no-origins/ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@no-origins/ui/components/tabs";
import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@no-origins/ui/components/tooltip";
import {
  BREAKPOINT_ORDER,
  DEFAULT_GRID_CONFIG,
  tracksFor,
  type GridBreakpoint,
  type GridConfig,
  type GridFit,
  type GridMetrics,
} from "@no-origins/ui/components/grid";
import {
  addPage,
  countOverlaps,
  findFreeRect,
  layoutToJSX,
  moveItemToPage,
  pagerCells,
  removePage,
  widestAuthored,
  withAuthored,
  withoutAuthored,
  type GridLayout,
  type GridLayoutItem,
  type ResolvedPages,
} from "@no-origins/ui/lib/grid-layout";
import { GridEditor, useHistory } from "@no-origins/ui/components/grid-editor";

const STORAGE_KEY = "no-origins:grid-playground:v2";

/**
 * The starting layout, authored on lg's 12 × 6 field, in two pages so the pager and the flip are there to see.
 * Page 1 leaves its bottom-right corner free for ›; page 2 leaves bottom-left free for ‹.
 */
const SEED: GridLayout = {
  authored: {
    lg: [
      {
        id: "page-1",
        items: [
          { id: "hero", label: "Hero", col: 1, row: 1, colSpan: 6, rowSpan: 3 },
          { id: "panel", label: "Panel", col: 7, row: 1, colSpan: 6, rowSpan: 2 },
          { id: "side", label: "Side", col: 7, row: 3, colSpan: 3, rowSpan: 4 },
          { id: "note", label: "Note", col: 10, row: 3, colSpan: 3, rowSpan: 2 },
          { id: "strip", label: "Strip", col: 1, row: 4, colSpan: 6, rowSpan: 3 },
        ],
      },
      {
        id: "page-2",
        items: [
          { id: "gallery", label: "Gallery", col: 1, row: 1, colSpan: 8, rowSpan: 4 },
          { id: "stats", label: "Stats", col: 9, row: 1, colSpan: 4, rowSpan: 3 },
          { id: "quote", label: "Quote", col: 9, row: 4, colSpan: 4, rowSpan: 2 },
        ],
      },
    ],
  },
};

type Saved = { layout: GridLayout; config: GridConfig; fit: GridFit; fill: boolean };

export default function GridPage() {
  const history = useHistory<GridLayout>(SEED);
  const layout = history.value;

  const [page, setPage] = React.useState(0);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [config, setConfig] = React.useState<GridConfig>(DEFAULT_GRID_CONFIG);
  const [fit, setFit] = React.useState<GridFit>("square");
  const [fill, setFill] = React.useState(true);
  const [overlay, setOverlay] = React.useState(true);
  const [rulers, setRulers] = React.useState(true);
  const [forced, setForced] = React.useState<GridBreakpoint | null>(null);
  const [metrics, setMetrics] = React.useState<GridMetrics | null>(null);
  const [resolved, setResolved] = React.useState<ResolvedPages | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  // Restore whatever was last arranged. Wrapped, because storage can throw in a private window.
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Saved>;
        if (saved.layout?.authored) history.reset(saved.layout);
        if (saved.config) setConfig(saved.config);
        if (saved.fit) setFit(saved.fit);
        if (typeof saved.fill === "boolean") setFill(saved.fill);
      }
    } catch {
      /* no saved layout; the seed stands */
    }
    setLoaded(true);
    // Once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ layout, config, fit, fill } satisfies Saved));
    } catch {
      /* nothing to do: the layout simply will not survive a reload */
    }
  }, [layout, config, fit, fill, loaded]);

  // Undo/redo on the usual keys.
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

  const pages = resolved?.pages ?? [];
  const count = pages.length || 1;
  const current = Math.min(page, count - 1);
  const items = pages[current]?.items ?? [];
  const bp = metrics?.bp ?? "lg";
  const source = widestAuthored(layout);
  const isSource = resolved?.authored && bp === source;

  /** Every page operation writes the current breakpoint's pages — which detaches a derived one. */
  const commitPages = (next: typeof pages) => history.set(withAuthored(layout, bp, next));

  const addItem = () => {
    if (!metrics) return;
    const reserved = pagerCells(current, count, metrics.cols, metrics.rows);
    const rect = findFreeRect(items, metrics.cols, metrics.rows, 2, 2, reserved) ?? findFreeRect(items, metrics.cols, metrics.rows, 1, 1, reserved);
    if (!rect) return;
    const id = `box-${Date.now().toString(36)}`;
    commitPages(pages.map((p, i) => (i === current ? { ...p, items: [...p.items, { id, label: "Box", ...rect }] } : p)));
    setSelected(id);
  };

  const removeSelected = () => {
    if (!selected) return;
    commitPages(pages.map((p, i) => (i === current ? { ...p, items: p.items.filter((item) => item.id !== selected) } : p)));
    setSelected(null);
  };

  const onAddPage = () => {
    if (!metrics) return;
    commitPages(addPage(pages, metrics.cols, metrics.rows));
    setPage(count); // the new page
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

  const setTracks = (key: GridBreakpoint, axis: "cols" | "rows", delta: number) => {
    setConfig((previous) => {
      const currentTracks = tracksFor(previous, key);
      const next = { cols: currentTracks.cols, rows: currentTracks.rows, [axis]: Math.max(1, Math.min(24, currentTracks[axis] + delta)) };
      return { ...previous, [key]: next };
    });
  };

  const overlaps = countOverlaps(items);
  const json = JSON.stringify(layout, null, 2);
  const jsx = layoutToJSX(layout, fit, fill);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      {/* ── the toolbar ─────────────────────────────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b px-4 py-2">
        <Tip label="Add a box">
          <Button size="icon-sm" variant="outline" onClick={addItem} aria-label="Add a box">
            <PlusIcon />
          </Button>
        </Tip>
        <Tip label="Delete — or press Delete">
          <Button size="icon-sm" variant="outline" onClick={removeSelected} disabled={!selected} aria-label="Delete the selected box">
            <Trash2Icon />
          </Button>
        </Tip>
        <Tip label="Send to the previous page">
          <Button size="icon-sm" variant="ghost" onClick={() => sendSelected(-1)} disabled={!selected || current === 0} aria-label="Send to previous page">
            <ArrowLeftToLineIcon />
          </Button>
        </Tip>
        <Tip label="Send to the next page">
          <Button size="icon-sm" variant="ghost" onClick={() => sendSelected(1)} disabled={!selected || current >= count - 1} aria-label="Send to next page">
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
        <Tip label="Reset to the seed layout">
          <Button size="icon-sm" variant="ghost" onClick={() => { history.set(SEED); setPage(0); setSelected(null); }} aria-label="Reset the layout">
            <RotateCcwIcon />
          </Button>
        </Tip>

        <Separator orientation="vertical" className="h-6" />

        {/* pages */}
        <span className="shrink-0 font-mono text-xs">
          page {current + 1} / {count}
        </span>
        <Tip label="Add a page after this one">
          <Button size="icon-sm" variant="ghost" onClick={onAddPage} aria-label="Add a page">
            <FilePlusIcon />
          </Button>
        </Tip>
        <Tip label="Remove this page and its boxes">
          <Button size="icon-sm" variant="ghost" onClick={onRemovePage} disabled={count <= 1} aria-label="Remove this page">
            <FileXIcon />
          </Button>
        </Tip>

        <Separator orientation="vertical" className="h-6" />

        {/* the decision this page exists to settle */}
        <ToggleGroup type="single" value={fit} onValueChange={(value) => value && setFit(value as GridFit)} variant="outline" size="sm">
          <ToggleGroupItem value="square">Square</ToggleGroupItem>
          <ToggleGroupItem value="stretch">Stretch</ToggleGroupItem>
        </ToggleGroup>

        {/* preview another breakpoint's field on this screen */}
        <ToggleGroup
          type="single"
          value={forced ?? "auto"}
          onValueChange={(value) => value && setForced(value === "auto" ? null : (value as GridBreakpoint))}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="auto">Auto</ToggleGroupItem>
          {BREAKPOINT_ORDER.filter((key) => config[key]).map((key) => (
            <ToggleGroupItem key={key} value={key} className="font-mono">
              {key}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline">
              Tracks
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80">
            <p className="text-muted-foreground mb-3 text-xs">Columns and rows per breakpoint. The one in use is highlighted.</p>
            <div className="space-y-1">
              {BREAKPOINT_ORDER.map((key) => {
                const tracks = tracksFor(config, key);
                return (
                  <div key={key} className={cn("flex items-center gap-2 px-2 py-1 text-sm", bp === key && "bg-muted font-semibold")}>
                    <span className="w-10 font-mono text-xs uppercase">{key}</span>
                    <Stepper label="cols" value={tracks.cols} onChange={(d) => setTracks(key, "cols", d)} />
                    <Stepper label="rows" value={tracks.rows} onChange={(d) => setTracks(key, "rows", d)} />
                  </div>
                );
              })}
            </div>
            <Button size="xs" variant="ghost" className="mt-3" onClick={() => setConfig(DEFAULT_GRID_CONFIG)}>
              Reset tracks
            </Button>
          </PopoverContent>
        </Popover>

        <div className="flex shrink-0 items-center gap-2">
          <Switch id="fill" checked={fill} onCheckedChange={setFill} />
          <Label htmlFor="fill" className="text-xs">Fill</Label>
        </div>
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
              <DialogTitle>The layout</DialogTitle>
              <DialogDescription>
                Authored at {Object.keys(layout.authored).join(", ")}; everything else derives.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="jsx">
              <TabsList>
                <TabsTrigger value="jsx">JSX</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>
              <TabsContent value="jsx"><CodeBlock code={jsx} /></TabsContent>
              <TabsContent value="json"><CodeBlock code={json} /></TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* where this breakpoint's pages come from */}
        <div className="ms-auto flex shrink-0 items-center gap-2">
          {resolved ? (
            <Badge variant={isSource ? "default" : resolved.authored ? "secondary" : "outline"} className="font-mono">
              {bp}
              {metrics?.transposed ? " · on its side" : ""}
              {isSource ? " · source" : resolved.authored ? " · authored" : ` · derived from ${resolved.source}`}
            </Badge>
          ) : null}
          {resolved?.authored && !isSource ? (
            <Tip label={`Drop ${bp}'s own pages and derive from ${source} again`}>
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
              ? `${metrics.cols}×${metrics.rows} · cell ${Math.round(metrics.cellW)}×${Math.round(metrics.cellH)} · box ${Math.round(metrics.boxW)}×${Math.round(metrics.boxH)}`
              : "measuring…"}
          </p>
        </div>
      </div>

      {/* ── the grid ────────────────────────────────────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <GridEditor
          layout={layout}
          onLayoutChange={history.set}
          page={current}
          onPageChange={setPage}
          selected={selected}
          onSelectedChange={setSelected}
          config={config}
          fit={fit}
          fill={fill}
          overlay={overlay}
          rulers={rulers}
          breakpoint={forced ?? undefined}
          onMetrics={setMetrics}
          onResolved={setResolved}
          className={fill ? "h-full" : undefined}
        />
      </div>
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
    <span className="flex items-center gap-1">
      <Button size="icon-xs" variant="ghost" onClick={() => onChange(-1)} aria-label={`One fewer ${label}`}>
        <MinusIcon />
      </Button>
      <span className="w-12 text-center font-mono text-xs">
        {value} {label}
      </span>
      <Button size="icon-xs" variant="ghost" onClick={() => onChange(1)} aria-label={`One more ${label}`}>
        <PlusIcon />
      </Button>
    </span>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="relative">
      <pre className="bg-muted max-h-80 overflow-auto p-3 font-mono text-xs">{code}</pre>
      <Button
        size="xs"
        variant="outline"
        className="absolute top-2 right-2"
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
