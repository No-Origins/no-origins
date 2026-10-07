"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { cn } from "@no-origins/ui/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@no-origins/ui/components/alert";
import { Button } from "@no-origins/ui/components/button";
import { countFor, DEFAULT_GRID_CONFIG, GRID_REFERENCE_BOX, specFor, type Responsive } from "@no-origins/ui/components/grid";
import { GridPages } from "@no-origins/ui/components/grid-pages";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import type { GridLayout, GridLayoutItem } from "@no-origins/ui/lib/grid-layout";

import { arrange, BAND, type AdminField, type Arrangeable, type Span } from "@/lib/arrange";

/**
 * The admin's pages on the grid — the base layout of every app, the admin's included (Admin.md §0.5: "the admin is the
 * grid"). Every route but the home is one of these: a way back in the first cell, a circle; the page's name and a line
 * of what it is beside it; then the page's boxes, packed on the field the page is actually on (`lib/arrange.ts`).
 * Nothing scrolls: a list longer than the room goes on to the next page, turned by the scroll, a swipe, the pager's
 * arrows or the keys, and the way back and the name come with it. Version 1; the screens are his to design.
 */

export type AdminItem = Arrangeable & { render: (placed: GridLayoutItem) => React.ReactNode };
export type Back = { href: string; label: string };

const HOME: Back = { href: "/", label: "Home" };

/** The field assumed before the grid has measured itself: the xl reference box. One frame, at most. */
const XL = GRID_REFERENCE_BOX.xl;
const XL_SPEC = specFor(DEFAULT_GRID_CONFIG, "xl");
const FIRST_FIELD: AdminField = { bp: "xl", cols: countFor(XL.width, XL_SPEC.cell, XL_SPEC.gap), rows: countFor(XL.height, XL_SPEC.cell, XL_SPEC.gap) };

// ── spans ─────────────────────────────────────────────────────────────────────────────────────────────────────
//
// Two kinds of field, by the band (lib/arrange.ts): six columns on a phone and a small tablet, eight and more from `md`
// up. From eight columns a record is one row of the field — a card a cell tall is a pill (Grid.md D39) — with its parts
// in columns; on six they stack, and the record is as many rows as they need. A phone's cell is smaller than a small
// tablet's (Grid.md D33: 51 to 72px), so it may need one more.

/** As wide as the band: `rows` from eight columns up, `narrow` on a small tablet's six, `phone` on a phone's. */
export const band = (rows: number, narrow = rows, phone = narrow): Responsive<Span> => ({
  base: { cols: BAND, rows: phone },
  sm: { cols: BAND, rows: narrow },
  md: { cols: BAND, rows },
});

/** As wide as the band from eight columns up and nowhere else: a list's column names, which stacked records do without. */
export const wideOnly = (rows = 1): Responsive<Span | null> => ({ base: null, md: { cols: BAND, rows } });

// ── a change's refusal ────────────────────────────────────────────────────────────────────────────────────────

const RefusalContext = React.createContext<(message: string | null) => void>(() => {});

/** Show a change's refusal under the page's name, or clear it with `null` (components/outcome.tsx). */
export function useRefuse() {
  return React.useContext(RefusalContext);
}

// ── the page ──────────────────────────────────────────────────────────────────────────────────────────────────

export function AdminPages({ title, line, back = HOME, items }: { title: string; line: string; back?: Back; items: readonly AdminItem[] }) {
  const [field, setField] = React.useState<AdminField | null>(null);
  const [refusal, setRefusal] = React.useState<string | null>(null);

  const all = React.useMemo<AdminItem[]>(() => [
    { id: "back", repeat: true, span: { base: { cols: 1, rows: 1 } }, render: () => <BackCell back={back} /> },
    // The name takes the rest of the band beside the way back; a refusal grows it a row.
    { id: "title", repeat: true, span: { base: { cols: -1, rows: refusal ? 3 : 2 } }, render: () => <PageTitle title={title} line={line} refusal={refusal} /> },
    ...items,
  ], [back, title, line, refusal, items]);

  const layout = React.useMemo<GridLayout>(() => {
    const on = field ?? FIRST_FIELD;
    return { shapes: { [on.bp]: { cols: on.cols, rows: on.rows } }, authored: { [on.bp]: arrange(all, on) } };
  }, [all, field]);

  const byId = React.useMemo(() => new Map(all.map((item) => [item.id, item])), [all]);
  const renderItem = React.useCallback((placed: GridLayoutItem) => byId.get(placed.id)?.render(placed) ?? null, [byId]);

  return (
    <RefusalContext.Provider value={setRefusal}>
      <GridPages
        layout={layout}
        overlay
        className="h-dvh"
        onMetrics={(m) => setField((prev) => (prev && prev.cols === m.cols && prev.rows === m.rows && prev.bp === m.bp ? prev : { bp: m.bp, cols: m.cols, rows: m.rows }))}
        renderItem={renderItem}
      />
    </RefusalContext.Provider>
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

/**
 * The page's name, its first line centred on the way back's cell, and the line of what the page is under it — or, when
 * a change was refused, the database's sentence (outcome.tsx). On the page's background, a mask over the grid's lines.
 */
function PageTitle({ title, line, refusal }: { title: string; line: string; refusal: string | null }) {
  return (
    <Slot fill="background" alignY="start">
      {/* text-3xl's line is 2.25rem: half the rest of the cell above it puts the name on the circle's middle. */}
      <div className="flex min-w-0 flex-col gap-1" style={{ paddingTop: "calc((var(--grid-cell, 60px) - 2.25rem) / 2)" }}>
        <Text role="title" as="h1" className="truncate">{title}</Text>
        {refusal ? (
          <Alert variant="destructive" className="mt-1">
            <AlertTitle>Not done</AlertTitle>
            <AlertDescription className="line-clamp-2">{refusal}</AlertDescription>
          </Alert>
        ) : (
          <Text role="body" tone="muted" className="line-clamp-3">{line}</Text>
        )}
      </div>
    </Slot>
  );
}

// ── the boxes ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * One record of a list: a card, its parts stacked on six columns and, from 600px of the box's own width (eight
 * columns), laid out by `className` — a container-query grid template the list's `ColumnNames` shares, so the columns
 * line up from record to record. `interactive` lights its edge on a hover, for a record that is a link. `fill` is
 * `muted` for a record changed and not saved yet (a role's permissions, Access.md A7).
 */
export function RecordBox({ className, interactive, fill = "card", children }: {
  className?: string;
  interactive?: boolean;
  fill?: "card" | "muted";
  children: React.ReactNode;
}) {
  return (
    <Slot fill={fill} inset={0} className={cn("@container", interactive && "group-hover:border-foreground group-focus-visible:border-foreground transition-colors")}>
      <div className={cn("flex min-w-0 flex-col justify-center gap-2 px-6 py-3 @min-[600px]:grid @min-[600px]:content-center @min-[600px]:items-center @min-[600px]:gap-4 @min-[600px]:py-0", className)}>
        {children}
      </div>
    </Slot>
  );
}

/** A list's column names, over its records, in the same template (`RecordBox`). On the page's background. */
export function ColumnNames({ className, names }: { className: string; names: readonly (string | { name: string; className: string })[] }) {
  return (
    <Slot fill="background" inset={0} alignY="end" className="@container">
      <div className={cn("hidden min-w-0 gap-4 px-6 pb-2 @min-[600px]:grid", className)}>
        {names.map((n) => typeof n === "string" ? (
          <Text key={n} role="label" tone="muted" as="span" className="truncate">{n}</Text>
        ) : (
          <Text key={n.name} role="label" tone="muted" as="span" className={cn("truncate", n.className)}>{n.name}</Text>
        ))}
      </div>
    </Slot>
  );
}

/** A box with a sentence in it, for a list with nothing in it or a page that is not yours. */
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

/** A page whose permission the signed-in person does not hold. */
export function NoAccessPage({ title, line, permission }: { title: string; line: string; permission: string }) {
  const items = React.useMemo<AdminItem[]>(() => [{
    id: "no-access",
    span: band(1, 2, 2),
    render: () => <NoteBox title="Not yours to see">This page needs {permission}, which none of your roles holds.</NoteBox>,
  }], [permission]);
  return <AdminPages title={title} line={line} items={items} />;
}
