"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { cn } from "@no-origins/ui/lib/utils";
import { Button } from "@no-origins/ui/components/button";
import { countFor, DEFAULT_GRID_CONFIG, GRID_REFERENCE_BOX, specFor, type Responsive } from "@no-origins/ui/components/grid";
import { GridPages } from "@no-origins/ui/components/grid-pages";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import type { GridLayout, GridLayoutItem } from "@no-origins/ui/lib/grid-layout";

import { arrange, BAND, type Arrangeable, type AuthField, type Span } from "@/lib/arrange";

/**
 * The login's pages on the grid — the base layout of every app (apps/admin/CLAUDE.md, "Every page is on the grid") — a
 * copy of the admin's `AdminPages`: the page's name and a line of what it is, a way back in the first cell before them
 * where there is one, then the page's boxes, packed on the field the page is on (`lib/arrange.ts`). Nothing scrolls: a
 * list longer than the room goes on to the next page, and the name comes with it. Version 1; the screens are his to
 * design. The cards that sign in and make an account are not these: each is one card on its own grid (`card-screen`).
 */

export type AuthItem = Arrangeable & { render: (placed: GridLayoutItem) => React.ReactNode };
export type Back = { href: string; label: string };

/** The field assumed before the grid has measured itself: the xl reference box. One frame, at most. */
const XL = GRID_REFERENCE_BOX.xl;
const XL_SPEC = specFor(DEFAULT_GRID_CONFIG, "xl");
const FIRST_FIELD: AuthField = { bp: "xl", cols: countFor(XL.width, XL_SPEC.cell, XL_SPEC.gap), rows: countFor(XL.height, XL_SPEC.cell, XL_SPEC.gap) };

/** As wide as the band: `rows` from eight columns up, `narrow` on a small tablet's six, `phone` on a phone's. */
export const band = (rows: number, narrow = rows, phone = narrow): Responsive<Span> => ({
  base: { cols: BAND, rows: phone },
  sm: { cols: BAND, rows: narrow },
  md: { cols: BAND, rows },
});

// ── the page ──────────────────────────────────────────────────────────────────────────────────────────────────

export function AuthPages({ title, line, back, items }: { title: string; line: string; back?: Back; items: readonly AuthItem[] }) {
  const [field, setField] = React.useState<AuthField | null>(null);

  const all = React.useMemo<AuthItem[]>(() => [
    ...(back ? [{ id: "back", repeat: true, span: { base: { cols: 1, rows: 1 } }, render: () => <BackCell back={back} /> }] : []),
    // The name takes the rest of the band beside the way back, or all of it.
    { id: "title", repeat: true, span: { base: { cols: back ? -1 : BAND, rows: 2 } }, render: () => <PageTitle title={title} line={line} /> },
    ...items,
  ], [back, title, line, items]);

  const layout = React.useMemo<GridLayout>(() => {
    const on = field ?? FIRST_FIELD;
    return { shapes: { [on.bp]: { cols: on.cols, rows: on.rows } }, authored: { [on.bp]: arrange(all, on) } };
  }, [all, field]);

  const byId = React.useMemo(() => new Map(all.map((item) => [item.id, item])), [all]);
  const renderItem = React.useCallback((placed: GridLayoutItem) => byId.get(placed.id)?.render(placed) ?? null, [byId]);

  return (
    <GridPages
      layout={layout}
      overlay
      className="h-dvh"
      onMetrics={(m) => setField((prev) => (prev && prev.cols === m.cols && prev.rows === m.rows && prev.bp === m.bp ? prev : { bp: m.bp, cols: m.cols, rows: m.rows }))}
      renderItem={renderItem}
    />
  );
}

/** The way back: one cell, so a circle (Grid.md D39), as the pager's arrows are. */
function BackCell({ back }: { back: Back }) {
  return (
    <Button asChild variant="outline" size="icon" className="size-full">
      <Link href={back.href} aria-label={back.label} title={back.label}>
        <ArrowLeftIcon />
      </Link>
    </Button>
  );
}

/** The page's name, its first line centred on a cell's middle, and the line of what the page is. */
function PageTitle({ title, line }: { title: string; line: string }) {
  return (
    <Slot fill="background" alignY="start">
      {/* text-3xl's line is 2.25rem: half the rest of the cell above it puts the name on the cell's middle. */}
      <div className="flex min-w-0 flex-col gap-1" style={{ paddingTop: "calc((var(--grid-cell, 60px) - 2.25rem) / 2)" }}>
        <Text role="title" as="h1" className="truncate">{title}</Text>
        <Text role="body" tone="muted" className="line-clamp-3">{line}</Text>
      </div>
    </Slot>
  );
}

// ── the boxes ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * One record: a card, its parts stacked on six columns and, from 600px of the box's own width (eight columns), laid
 * out by `className` — a container-query grid template. As the admin's.
 */
export function RecordBox({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Slot fill="card" inset={0} className="@container">
      <div className={cn("flex min-w-0 flex-col justify-center gap-2 px-6 py-3 @min-[600px]:grid @min-[600px]:content-center @min-[600px]:items-center @min-[600px]:gap-4 @min-[600px]:py-0", className)}>
        {children}
      </div>
    </Slot>
  );
}

/** A box with a sentence in it. */
export function NoteBox({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <Slot fill="card" inset={0} className="@container">
      <div className="flex min-w-0 flex-col justify-center gap-0.5 px-6 py-3">
        {title ? <Text role="body" as="span">{title}</Text> : null}
        <Text role="caption" as="span" className="line-clamp-3">{children}</Text>
      </div>
    </Slot>
  );
}
