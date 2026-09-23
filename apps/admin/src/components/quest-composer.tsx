"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowLeftToLineIcon,
  ArrowRightToLineIcon,
  FilePlusIcon,
  FileXIcon,
  Redo2Icon,
  Trash2Icon,
  Undo2Icon,
} from "lucide-react";

import { cn } from "@no-origins/ui/lib/utils";
import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Separator } from "@no-origins/ui/components/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@no-origins/ui/components/tooltip";
import {
  addPage,
  findFreeRect,
  moveItemToPage,
  pagerCells,
  removePage,
  narrowestAuthored,
  withAuthored,
} from "@no-origins/ui/lib/grid-layout";
import type { GridLayout, GridPage, ResolvedPages } from "@no-origins/ui/lib/grid-layout";
import type { GridMetrics } from "@no-origins/ui/components/grid";
import { GridEditor, useHistory } from "@no-origins/ui/components/grid-editor";

import { saveQuestLayout } from "@/app/quests/actions";
import type { Quest } from "@/lib/quests";

/**
 * The compose dashboard (Admin.md §0.5): a quest laid out on the real `GridEditor`, saved back to `quests.layout`
 * on the `rev` it was loaded at. The palette is a **stub** — placeholder molecules you place onto the grid so the
 * gesture is real end to end; the actual components come with the molecule work, which is deferred. Everything
 * visible is composed from `@no-origins/ui`.
 */

const EMPTY: GridLayout = { authored: { lg: [{ id: "page-1", items: [] }] } };

// The stub palette. A molecule is a name and a default box size; placing one adds a labelled box to the grid, which
// then moves, resizes and deletes like any other. Real molecules replace the placeholder tile later.
const PALETTE: { kind: string; label: string; colSpan: number; rowSpan: number }[] = [
  { kind: "heading", label: "Heading", colSpan: 6, rowSpan: 1 },
  { kind: "text", label: "Text", colSpan: 4, rowSpan: 2 },
  { kind: "image", label: "Image", colSpan: 4, rowSpan: 3 },
  { kind: "blob", label: "Blob", colSpan: 2, rowSpan: 2 },
  { kind: "pattern", label: "Pattern", colSpan: 3, rowSpan: 3 },
  { kind: "card", label: "Card", colSpan: 4, rowSpan: 3 },
];

type SaveState = "idle" | "saving" | "saved" | "conflict" | "error";

export function QuestComposer({ quest }: { quest: Quest }) {
  const history = useHistory<GridLayout>(quest.layout ?? EMPTY);
  const layout = history.value;

  const [page, setPage] = React.useState(0);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [metrics, setMetrics] = React.useState<GridMetrics | null>(null);
  const [resolved, setResolved] = React.useState<ResolvedPages | null>(null);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");

  const revRef = React.useRef(quest.rev);
  const [saved, setSaved] = React.useState(() => JSON.stringify(quest.layout ?? EMPTY));
  const seq = React.useRef(0);

  const dirty = JSON.stringify(layout) !== saved;

  const pages = resolved?.pages ?? [];
  const count = pages.length || 1;
  const current = Math.min(page, count - 1);
  const items = pages[current]?.items ?? [];
  const bp = metrics?.bp ?? "lg";
  const source = narrowestAuthored(layout); // mobile-first (Grid.md D22): the narrowest authored breakpoint is the truth
  const hasOwn = !!layout.authored[bp];
  const isSource = hasOwn && bp === source;
  // Own pages written on another shape — the same breakpoint at another width (Grid.md D12) — are packed, not authored.
  const repacked = !!resolved && hasOwn && !resolved.authored;

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

  const commitPages = (next: GridPage[]) => {
    if (!metrics) return;
    history.set(withAuthored(layout, bp, next, metrics));
  };

  const addMolecule = (molecule: (typeof PALETTE)[number]) => {
    if (!metrics) return;
    const reserved = pagerCells(current, count, metrics.cols, metrics.rows, metrics.pager);
    const rect =
      findFreeRect(items, metrics.cols, metrics.rows, molecule.colSpan, molecule.rowSpan, reserved) ??
      findFreeRect(items, metrics.cols, metrics.rows, 1, 1, reserved);
    if (!rect) return;
    const id = `${molecule.kind}-${(seq.current++).toString(36)}-${current}`;
    commitPages(
      pages.map((p, i) => (i === current ? { ...p, items: [...p.items, { id, label: molecule.label, ...rect }] } : p)),
    );
    setSelected(id);
  };

  const removeSelected = () => {
    if (!selected) return;
    commitPages(pages.map((p, i) => (i === current ? { ...p, items: p.items.filter((it) => it.id !== selected) } : p)));
    setSelected(null);
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

  const save = async () => {
    setSaveState("saving");
    const result = await saveQuestLayout(quest.slug, layout, revRef.current);
    if (result.ok) {
      revRef.current = result.rev;
      setSaved(JSON.stringify(layout));
      setSaveState("saved");
    } else if (result.conflict) {
      setSaveState("conflict");
    } else {
      setSaveState("error");
    }
  };

  return (
    <div className="flex h-dvh flex-col">
      {/* ── header ─────────────────────────────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-2">
        <Tip label="Back to quests">
          <Button asChild size="icon-sm" variant="ghost" aria-label="Back to quests">
            <Link href="/quests">
              <ArrowLeftIcon />
            </Link>
          </Button>
        </Tip>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">{quest.name}</h1>
          {quest.subdomain ? <p className="text-muted-foreground truncate font-mono text-[11px]">{quest.subdomain}</p> : null}
        </div>
        <Badge variant="outline" className="font-mono text-[10px] tracking-wide uppercase">
          {quest.status}
        </Badge>

        <div className="ms-auto flex items-center gap-3">
          <SaveIndicator state={saveState} dirty={dirty} />
          <Button size="sm" onClick={save} disabled={saveState === "saving" || (!dirty && saveState !== "conflict")}>
            {saveState === "saving" ? "Saving…" : "Save"}
          </Button>
        </div>
      </header>

      {/* ── toolbar: the stub palette + the grid tools ─────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b px-4 py-2">
        <span className="text-muted-foreground shrink-0 font-mono text-[11px] tracking-wide uppercase">Place</span>
        {PALETTE.map((molecule) => (
          <Tip key={molecule.kind} label={`Place a ${molecule.label} (${molecule.colSpan}×${molecule.rowSpan})`}>
            <Button size="sm" variant="outline" onClick={() => addMolecule(molecule)} disabled={!metrics}>
              {molecule.label}
            </Button>
          </Tip>
        ))}

        <Separator orientation="vertical" className="h-6" />

        <Tip label="Delete — or press Delete">
          <Button size="icon-sm" variant="ghost" onClick={removeSelected} disabled={!selected} aria-label="Delete the selected box">
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

        <Separator orientation="vertical" className="h-6" />

        <span className="text-muted-foreground shrink-0 font-mono text-xs">page {current + 1} / {count}</span>
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

        <div className="ms-auto flex shrink-0 items-center gap-2">
          {resolved ? (
            <Badge variant={isSource ? "default" : hasOwn ? "secondary" : "outline"} className="font-mono">
              {bp}
              {isSource ? " · source" : hasOwn ? " · authored" : ` · derived from ${resolved.source}`}
              {repacked ? ` · packed from ${resolved.sourceShape.cols}×${resolved.sourceShape.rows}` : ""}
            </Badge>
          ) : null}
        </div>
      </div>

      {/* ── the grid ───────────────────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <GridEditor
          layout={layout}
          onLayoutChange={history.set}
          page={current}
          onPageChange={setPage}
          selected={selected}
          onSelectedChange={setSelected}
          overlay
          onMetrics={setMetrics}
          onResolved={setResolved}
          className="h-full"
          renderItem={(item, state) => (
            <div
              className={cn(
                "bg-card flex h-full w-full flex-col justify-between border p-3 transition-colors",
                state.selected ? "border-foreground ring-ring/40 ring-2" : "border-border",
              )}
            >
              <span className="text-xs font-semibold tracking-wide uppercase">{item.label ?? item.id}</span>
              <span className="text-muted-foreground font-mono text-[10px]">
                {item.colSpan}×{item.rowSpan}
              </span>
            </div>
          )}
        />
      </div>
    </div>
  );
}

function SaveIndicator({ state, dirty }: { state: SaveState; dirty: boolean }) {
  const [label, tone] =
    state === "saving"
      ? (["Saving…", "text-muted-foreground"] as const)
      : state === "conflict"
        ? (["Saved elsewhere — reload", "text-destructive"] as const)
        : state === "error"
          ? (["Couldn't save", "text-destructive"] as const)
          : dirty
            ? (["Unsaved changes", "text-muted-foreground"] as const)
            : state === "saved"
              ? (["Saved", "text-muted-foreground"] as const)
              : (["", ""] as const);
  if (!label) return null;
  return <span className={cn("font-mono text-[11px]", tone)}>{label}</span>;
}

function Tip({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
