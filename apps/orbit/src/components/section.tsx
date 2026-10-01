"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, type LucideIcon } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Card } from "@no-origins/ui/components/card";
import { GridItem, useGridMetrics } from "@no-origins/ui/components/grid";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { cn } from "@no-origins/ui/lib/utils";

import { flow, type FlowPiece, type Room, type StudioBox } from "@/lib/stage";

/**
 * A section of the studio (Orbit.md C7, his, 2026-09-30: *"individual cards of controls for each of that
 * with heading … like we did for projects and case studies or work"*): its heading on a row of its own, and its cards
 * under it, each as many rows as it has lines. The heading is the portfolio's section label, composed here the same
 * way: the section's icon in the secondary colour and its word after it, centred on the whole row, no border — a
 * `background` slot, so the field's lines stop at it. A card's lines stand one a row of the field, the gutter between
 * them, their labels, controls and values in three columns every line of the card shares.
 *
 * **A section folds** (C9, his, 2026-09-30: *"make cards collapsible"*): its heading is the toggle, and a folded section
 * is its heading alone, one row, the sections after it flowing up into the rows its cards gave back.
 */

export type SectionBlock = {
  key: string;
  lines: number;
  /** Whether it may go on in the next column, a line at a time, where it is taller than a column. */
  split: boolean;
  render: (from: number, to: number) => React.ReactNode;
};

export type Section = { id: string; label: string; icon: LucideIcon; blocks: SectionBlock[] };

/** A card of lines, one a row: the block most sections are. */
export function cardBlock(key: string, label: string, lines: React.ReactNode[]): SectionBlock {
  return {
    key,
    lines: lines.length,
    split: true,
    render: (from, to) => <ControlCard label={label} lines={lines.slice(from, to)} />,
  };
}

type Fold = { open: (id: string) => boolean; toggle: (id: string) => void };

const ALL_OPEN: Fold = { open: () => true, toggle: () => {} };
const FoldContext = React.createContext<Fold>(ALL_OPEN);

/**
 * Which sections are folded: the page's, above every room, so a section stays folded when the field changes shape and
 * it moves to another room. Every section starts open, and a fold lasts as long as the page.
 */
export function FoldProvider({ children }: { children: React.ReactNode }) {
  const [folded, setFolded] = React.useState<ReadonlySet<string>>(() => new Set());
  const fold = React.useMemo<Fold>(
    () => ({
      open: (id) => !folded.has(id),
      toggle: (id) =>
        setFolded((all) => {
          const next = new Set(all);
          if (!next.delete(id)) next.add(id);
          return next;
        }),
    }),
    [folded],
  );
  return <FoldContext.Provider value={fold}>{children}</FoldContext.Provider>;
}

export const useFold = () => React.useContext(FoldContext);

/**
 * A section's heading. Given `onToggle`, the whole row is the button that folds its cards and opens them again: a ghost
 * button, so it rests as the heading does and hovers lime, its chevron in the row's last cell — up while the cards are
 * open, down while they are folded, as the system's accordion shows it. `controls` names the cards it folds.
 */
export function SectionLabel({ label, icon: Icon, open = true, onToggle, controls }: {
  label: string;
  icon: LucideIcon;
  open?: boolean;
  onToggle?: () => void;
  controls?: string;
}) {
  const cell = useGridMetrics()?.cell ?? 60;
  if (!onToggle) {
    return (
      <Slot fill="background" inset={12} alignX="center" alignY="center">
        <div className="flex min-w-0 items-center gap-2">
          <Icon aria-hidden className="size-5 shrink-0 text-secondary" />
          <Text as="h2" className="truncate">
            {label}
          </Text>
        </div>
      </Slot>
    );
  }
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <Slot fill="background" inset={0}>
      <Text as="h2" className="size-full">
        <Button
          variant="ghost"
          aria-expanded={open}
          aria-controls={controls || undefined}
          onClick={onToggle}
          // The label's own type, not a button's capitals; and at rest open as folded — a ghost button's open tint is a
          // menu's, and here open is where every section starts.
          className="grid size-full px-0 font-normal tracking-normal normal-case aria-expanded:bg-transparent aria-expanded:hover:bg-primary aria-expanded:hover:text-primary-foreground"
          style={{ gridTemplateColumns: `${cell}px minmax(0, 1fr) ${cell}px` }}
        >
          <span className="col-start-2 flex min-w-0 items-center justify-center gap-2">
            <Icon aria-hidden className="size-5 shrink-0 text-secondary" />
            <Text as="span" className="truncate">
              {label}
            </Text>
          </span>
          <Chevron aria-hidden className="size-4 justify-self-center text-muted-foreground" />
        </Button>
      </Text>
    </Slot>
  );
}

/**
 * A line's three columns (C11, his, 2026-09-30: *"the controls … are all over the place. They are not consistent"*):
 * the label, the control, the value. **In a room every card has the same ones**, so every slider in a room starts and
 * ends where the others do and every value stands in one column: the label's as wide as the room's longest label
 * ("Breath depth"), the value's as wide as its widest number. A card placed on its own — the body under the circle,
 * four cells across — fits its label column to its own labels, since the room's would leave its sliders no room; its
 * value column is the same.
 */
export const LINE_LABEL = "6.25rem";
export const LINE_VALUE = "4rem";

/** Whether the cards here share their room's columns (`Flow`) or fit their own (`PlacedSection`). */
const LinesContext = React.createContext<"room" | "fit">("room");

/** A card whose lines stand on the field's rows, one a row, in the three columns of `LINE_LABEL` and `LINE_VALUE`. */
export function ControlCard({ label, lines }: { label: string; lines: React.ReactNode[] }) {
  const gap = useGridMetrics()?.gap ?? 12;
  const fit = React.useContext(LinesContext) === "fit";
  return (
    <Card aria-label={label} className="size-full gap-0 py-0">
      <div
        className="grid min-h-0 flex-1 items-center gap-x-3 px-5"
        style={{
          gridTemplateColumns: `${fit ? "auto" : LINE_LABEL} minmax(0, 1fr) ${LINE_VALUE}`,
          gridTemplateRows: `repeat(${lines.length}, minmax(0, 1fr))`,
          rowGap: gap,
        }}
      >
        {lines}
      </div>
    </Card>
  );
}

/** One line of a `ControlCard`: its three columns are the card's. */
export function Line({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("col-span-full grid min-w-0 grid-cols-subgrid items-center", className)} {...props} />;
}

/** A card one row tall, its words from its round end: one version. */
export function PillCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return <Card className={cn("size-full min-w-0 flex-row items-center gap-3 px-5 py-0", className)} {...props} />;
}

/**
 * `sections` flowing through `room` (`flow`, `@/lib/stage`), a page at a time, and the room's pager on the field's last
 * row where there is more than one: the page before, where it is, the next. A change that moves the section last
 * pressed to another page — a style picked that brings its settings, which no longer fit where they were, or a section
 * opened that no longer fits where its heading was, or folded so that it fits a page before — turns to that page, so
 * what was changed stays in view. A folded section flows as its heading alone.
 */
export function Flow({ name, room, sections }: { name: string; room: Room; sections: Section[] }) {
  const fold = useFold();
  const pages = flow(
    sections.map((s) => (fold.open(s.id) ? s : { ...s, blocks: [] })),
    room,
  );
  const [page, setPage] = React.useState(0);
  const at = Math.min(page, pages.length - 1);
  const touched = React.useRef<string | null>(null);
  // Which sections each page holds: what the follow below looks at, and all it runs on.
  const holds = pages.map((p) => [...new Set(p.map((q) => q.section))].join(" ")).join("|");
  React.useLayoutEffect(() => {
    const id = touched.current;
    const on = holds.split("|").map((p) => p.split(" "));
    if (!id || on[at]!.includes(id)) return;
    const where = on.findIndex((p) => p.includes(id));
    if (where >= 0) setPage(where);
  }, [holds, at]);
  // A heading pressed that went to another page with its section is drawn anew there: it keeps the focus it had.
  const refocus = React.useRef<string | null>(null);
  React.useLayoutEffect(() => {
    const id = refocus.current;
    const heading = id && document.querySelector<HTMLElement>(`[data-studio-part="${CSS.escape(id)}-label"] button`);
    if (!heading) return;
    refocus.current = null;
    if (document.activeElement !== heading) heading.focus();
  });
  const turn = (to: number) => {
    touched.current = null;
    refocus.current = null;
    setPage(to);
  };
  const byId = new Map(sections.map((s) => [s.id, s]));
  const prefix = React.useId();
  const cardId = (piece: FlowPiece & { kind: "block" }) => `${prefix}-${piece.section}-${piece.key}-${piece.from}`;
  // The cards on this page each heading folds.
  const cards = (id: string) =>
    pages[at]!.flatMap((p) => (p.kind === "block" && p.section === id ? [cardId(p)] : [])).join(" ");
  return (
    <>
      {pages[at]!.map((piece) => {
        const section = byId.get(piece.section)!;
        if (piece.kind === "label") {
          return (
            <GridItem
              key={`${piece.section}-label-${piece.part}`}
              {...piece.box}
              data-studio-part={`${piece.section}-label`}
              onPointerDownCapture={() => (touched.current = piece.section)}
              onFocusCapture={() => (touched.current = piece.section)}
            >
              <SectionLabel
                label={section.label}
                icon={section.icon}
                open={fold.open(section.id)}
                onToggle={() => {
                  if (document.activeElement?.closest(`[data-studio-part="${CSS.escape(section.id)}-label"]`)) refocus.current = section.id;
                  fold.toggle(section.id);
                }}
                controls={cards(section.id)}
              />
            </GridItem>
          );
        }
        const block = section.blocks.find((b) => b.key === piece.key)!;
        return (
          <GridItem
            key={`${piece.section}-${piece.key}-${piece.from}`}
            id={cardId(piece)}
            {...piece.box}
            data-studio-part={piece.section}
            onPointerDownCapture={() => (touched.current = piece.section)}
            onFocusCapture={() => (touched.current = piece.section)}
          >
            <Slot fill="transparent" inset={0}>
              {block.render(piece.from, piece.to)}
            </Slot>
          </GridItem>
        );
      })}
      {pages.length > 1 ? (
        <GridItem {...room.pager} data-studio-part={`${name.toLowerCase()}-pager`}>
          <Pager name={name} page={at} pages={pages.length} onPage={turn} />
        </GridItem>
      ) : null}
    </>
  );
}

/**
 * A section placed rather than flowed — the body under the circle: its heading on `label`, and its first card on
 * `card` while it is open. Folded, the card's rows stand empty: nothing else is placed there.
 */
export function PlacedSection({ section, label, card }: { section: Section; label: StudioBox; card: StudioBox }) {
  const fold = useFold();
  const id = `${React.useId()}-${section.id}`;
  const open = fold.open(section.id);
  const block = section.blocks[0]!;
  return (
    <>
      <GridItem {...label} data-studio-part={`${section.id}-label`}>
        <SectionLabel label={section.label} icon={section.icon} open={open} onToggle={() => fold.toggle(section.id)} controls={open ? id : undefined} />
      </GridItem>
      {open ? (
        <GridItem id={id} {...card} data-studio-part={section.id}>
          <LinesContext.Provider value="fit">
            <Slot fill="transparent" inset={0}>{block.render(0, block.lines)}</Slot>
          </LinesContext.Provider>
        </GridItem>
      ) : null}
    </>
  );
}

function Pager({ name, page, pages, onPage }: { name: string; page: number; pages: number; onPage: (page: number) => void }) {
  const cell = useGridMetrics()?.cell ?? 60;
  const gap = useGridMetrics()?.gap ?? 12;
  return (
    <nav aria-label={`${name}: pages`} className="grid h-full" style={{ gridTemplateColumns: `${cell}px minmax(0, 1fr) ${cell}px`, gap }}>
      <Button variant="outline" size="icon" className="size-full" aria-label={`${name}: the page before`} disabled={page === 0} onClick={() => onPage(page - 1)}>
        <ChevronLeft />
      </Button>
      <PillCard className="justify-center px-3">
        <Text as="span" role="caption" tone="foreground" className="truncate" data-page={page + 1}>
          {name} · {page + 1} of {pages}
        </Text>
      </PillCard>
      <Button variant="outline" size="icon" className="size-full" aria-label={`${name}: the next page`} disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
        <ChevronRight />
      </Button>
    </nav>
  );
}
