"use client";

import type { ReactNode } from "react";

import type { GridBreakpoint } from "@no-origins/ui/components/grid";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { SPACE_STEPS } from "@no-origins/ui/lib/spacing";

import { docCard, docTitle } from "@/components/doc-blocks";
import type { PageContent, SpecimenItem } from "@/content";
import type { DocEntry } from "@/content/sitemap";

/**
 * Tokens → Spacing (Spacing.md): the base's nine steps drawn to scale, the jobs named on them with what each is for and
 * a drawing of it, the corner rule, and the rules behind them.
 */

const CELL: Record<GridBreakpoint, number> = { base: 50, sm: 72, md: 72, lg: 60, xl: 60 };
const rowsFor = (px: number, bp: GridBreakpoint, cell = CELL[bp]) => Math.max(1, Math.ceil((px + 12) / (cell + 12)));

/** A card of drawn things under a label, as tall as `px` says its content is. */
function drawnCard(id: string, label: string, height: (band: number, bp: GridBreakpoint, cell?: number) => number, body: ReactNode): SpecimenItem {
  return {
    id,
    keep: true,
    variant: "none",
    span: (band, bp, cell) => ({ cols: band, rows: rowsFor(height(band, bp, cell), bp, cell) }),
    render: () => (
      <Slot fill="card">
        <div className="flex min-h-0 flex-col gap-stack">
          <Text role="label" tone="muted" as="h2">
            {label}
          </Text>
          {body}
        </div>
      </Slot>
    ),
  };
}

// ── the base ───────────────────────────────────────────────────────────────────────────────────────────────────

const TAILWIND: Record<number, string> = { 0: "0", 2: "0.5", 4: "1", 8: "2", 12: "3", 16: "4", 24: "6", 32: "8", 48: "12" };

function baseItem(): SpecimenItem {
  return drawnCard(
    "base",
    "The base: nine steps",
    () => 66 + 24 + SPACE_STEPS.length * 24,
    <ul className="flex flex-col gap-stack-tight">
      {SPACE_STEPS.map((px) => (
        <li key={px} className="grid grid-cols-[3rem_4rem_minmax(0,1fr)] items-center gap-inline">
          <Text role="mono" as="span">
            {px}px
          </Text>
          <Text role="caption" tone="muted" as="span">
            {`step ${TAILWIND[px]}`}
          </Text>
          <span className="bg-primary h-3 rounded-lg" style={{ width: Math.max(px, 1) }} />
        </li>
      ))}
    </ul>,
  );
}

// ── the jobs ───────────────────────────────────────────────────────────────────────────────────────────────────

type Job = { name: string; value: string; use: string; draw: ReactNode };

/** A box with its padding shown as the muted tint and its content as a hairline box. */
function Padded({ pad, pill }: { pad: string; pill?: boolean }) {
  return (
    <span className={`bg-muted border-border grid shrink-0 rounded-lg border ${pill ? "h-15 w-32" : "size-24"}`} style={{ padding: pad }}>
      <span className="bg-card border-border rounded-sm border" />
    </span>
  );
}

const Bar = ({ w = 40 }: { w?: number }) => <span className="bg-secondary block h-2 rounded-lg" style={{ width: w }} />;

const JOBS: Job[] = [
  { name: "inset", value: "32px, or more", use: "A box's padding: a card, a dialog, a surface slot.", draw: <Padded pad="var(--space-inset)" /> },
  { name: "inset-tight", value: "12px, or more", use: "A dense box: a menu's panel, a list of choices.", draw: <Padded pad="var(--space-inset-tight)" /> },
  { name: "inset-pill", value: "16px, or more", use: "A box one cell tall: a pill.", draw: <Padded pad="var(--space-inset-pill)" pill /> },
  {
    name: "stack",
    value: "8px",
    use: "Between things stacked in a box.",
    draw: (
      <span className="flex flex-col gap-stack">
        <Bar w={56} />
        <Bar />
        <Bar w={48} />
      </span>
    ),
  },
  {
    name: "stack-tight",
    value: "4px",
    use: "A label and what it names.",
    draw: (
      <span className="flex flex-col gap-stack-tight">
        <Bar w={28} />
        <Bar w={56} />
      </span>
    ),
  },
  {
    name: "inline",
    value: "8px",
    use: "Between things side by side in a row.",
    draw: (
      <span className="flex gap-inline">
        <Bar w={24} />
        <Bar w={24} />
        <Bar w={24} />
      </span>
    ),
  },
  {
    name: "inline-tight",
    value: "4px",
    use: "An icon and its word, inside one control.",
    draw: (
      <span className="flex items-center gap-inline-tight">
        <span className="bg-secondary size-2 rounded-lg" />
        <Bar w={40} />
      </span>
    ),
  },
  {
    name: "gutter",
    value: "12px",
    use: "Between boxes on the grid.",
    draw: (
      <span className="flex gap-gutter">
        <span className="border-border size-8 rounded-lg border" />
        <span className="border-border size-8 rounded-lg border" />
      </span>
    ),
  },
];

/** A card of jobs, as many to a row as the band holds (two on a phone), each drawn over its name, value and use. */
function jobsItem(id: string, label: string, jobs: Job[]): SpecimenItem {
  const JOB_W = 150;
  return drawnCard(
    id,
    label,
    (band, bp, cell = CELL[bp]) => {
      const width = band * cell + (band - 1) * 12 - 66;
      const perRow = Math.max(1, Math.floor(width / JOB_W));
      const rows = Math.ceil(jobs.length / perRow);
      return 66 + 24 + rows * (perRow <= 2 ? 212 : 192);
    },
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-inline gap-y-inset">
      {jobs.map((job) => (
        <li key={job.name} className="flex flex-col gap-stack-tight">
          <span className="grid h-24 place-items-start content-center">{job.draw}</span>
          <Text role="mono" as="h3">
            {job.name}
          </Text>
          <Text role="caption" as="span">
            {job.value}
          </Text>
          <Text role="caption" tone="muted">
            {job.use}
          </Text>
        </li>
      ))}
    </ul>,
  );
}

// ── the corner ─────────────────────────────────────────────────────────────────────────────────────────────────

/** A box with a line of text set `pad` from its edges, its corner the grid's radius. */
function CornerBox({ pad, label }: { pad: string; label: string }) {
  return (
    <span className="flex flex-col gap-stack-tight">
      <span className="border-border relative block h-24 w-56 overflow-hidden rounded-lg border" style={{ padding: pad }}>
        <Text role="body" as="span" className="block">
          Text set this far from the edge.
        </Text>
      </span>
      <Text role="caption" tone="muted" as="span">
        {label}
      </Text>
    </span>
  );
}

function cornerItem(): SpecimenItem {
  return drawnCard(
    "corner",
    "A box's padding clears its corner",
    (band, bp, cell = CELL[bp]) => (band * cell + (band - 1) * 12 >= 560 ? 66 + 24 + 40 + 96 + 24 : 66 + 24 + 60 + 2 * 120 + 32),
    <div className="flex flex-col gap-stack">
      <Text role="caption" tone="muted">
        Every corner is half the cell. Text closer to the edge than about a third of that runs under the curve and is cut,
        so each inset is the larger of its step and that.
      </Text>
      <div className="flex flex-wrap gap-inset">
        <CornerBox pad="4px 8px" label="4 and 8px: under the curve" />
        <CornerBox pad="var(--space-inset)" label="The inset job: clear of it" />
      </div>
    </div>,
  );
}

// ── the page ───────────────────────────────────────────────────────────────────────────────────────────────────

export function spacingPage(entry: DocEntry): PageContent {
  const items: SpecimenItem[] = [
    docTitle(entry),
    docCard(
      "what",
      "What it is",
      "Spacing is two layers. The base is nine steps, and no space is anything else. On it, every space is named by its job, and a component asks for the job rather than a number: a card's padding is inset, the room between a heading and its text is stack. The same job is always the same space.",
      [],
    ),
    baseItem(),
    jobsItem("insets", "The jobs: padding", JOBS.slice(0, 3)),
    jobsItem("gaps", "The jobs: gaps", JOBS.slice(3)),
    cornerItem(),
    docCard("rules", "The rules", undefined, [
      "Ask for the job, never a number: p-inset, gap-stack, p-inset-pill. A space with no job yet is a step of the base.",
      "No space off the base: 6, 10, 14 and 20px are not steps.",
      "A box's padding is never closer to its corner than the corner allows; the insets see to it.",
      "Between boxes on the grid the space is the gutter, and a box has no margin. A cell of air between blocks is laid out on the grid.",
      "Inside a box, space things with a gap on their container, not a margin on one of them.",
    ]),
    docCard("using", "Using it", undefined, [
      "In a class: p-inset, p-inset-tight, p-inset-pill, gap-stack, gap-stack-tight, gap-inline, gap-inline-tight, gap-gutter.",
      "On a Slot: inset=\"inset\", \"inset-tight\" or \"inset-pill\", each the same on every side; a surface slot with no inset set takes inset.",
      "In script: SPACE_STEPS, SPACE_ROLES, space(role) for a style, spaceOf(element, role) for its px, from @no-origins/ui/lib/spacing.",
    ]),
    docCard("open", "Open", undefined, [
      "Components and apps still use spaces off the base; they move onto it, and a lint keeps them there.",
      "Whether stack and inline stay the same size.",
    ]),
    docCard("decided", "Decided in", undefined, ["Spacing.md SP1 to SP5; Grid.md §3 (the grid's part of the base), D15 (the gutter is the margin); Slots.md S3."]),
  ];
  return { title: entry.page.title, variant: "card", sections: [{ id: "tokens-spacing", items }] };
}
