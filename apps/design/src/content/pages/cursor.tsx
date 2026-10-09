"use client";

import type { ReactNode } from "react";

import type { GridBreakpoint } from "@no-origins/ui/components/grid";
import { Liquid } from "@no-origins/ui/components/liquid";
import { ScrollArea } from "@no-origins/ui/components/scroll-area";
import { Slider } from "@no-origins/ui/components/slider";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";

import { docCard, docTitle } from "@/components/doc-blocks";
import type { PageContent, Span, SpecimenItem } from "@/content";
import type { DocEntry } from "@/content/sitemap";

/**
 * Foundations → Cursor: the pointer, the violet ring, and what it tells (Grid.md D34, D40, D43, D52; Motion.md M16,
 * M26). The page's own grid has the ring, so every state it names can be tried on it: the lit cell under the pointer, a
 * press, the slider's head held, and the scrolling list's liquid.
 */

/** A phone's cell is counted at 50px (its width gives about 54), a tablet's at 72, a pointer field's at 60. */
const CELL: Record<GridBreakpoint, number> = { base: 50, sm: 72, md: 72, lg: 60, xl: 60 };
const widthOf = (band: number, bp: GridBreakpoint, cell = CELL[bp]) => band * cell + (band - 1) * 12;
const rowsFor = (px: number, bp: GridBreakpoint, cell = CELL[bp]) => Math.max(1, Math.ceil((px + 12) / (cell + 12)));

// ── the states, drawn ──────────────────────────────────────────────────────────────────────────────────────────

/** The ring as the system draws it: 24px, a 2px violet line (`--secondary`, the cursor's `--violet`), on nothing. */
function Ring({ filled, size = 24, children }: { filled?: boolean; size?: number; children?: ReactNode }) {
  return (
    <span
      className={`border-secondary relative inline-block shrink-0 rounded-full ${filled ? "bg-secondary" : ""}`}
      style={{ width: size, height: size, borderWidth: (size / 24) * 2 }}
    >
      {children}
    </span>
  );
}

/** Liquid in the ring's glass, at `level`, as the cursor holds it. */
function RingLiquid({ level, size = 24 }: { level: number; size?: number }) {
  return (
    <Ring size={size}>
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <Liquid
          level={level}
          label={`${Math.round(level * 100)}% full`}
          className="border-0 bg-transparent"
          style={{ "--motion-liquid-wave": 0.14 } as React.CSSProperties}
        />
      </span>
    </Ring>
  );
}

type State = { name: string; when: string; draw: ReactNode };

const STATES: State[] = [
  { name: "At rest", when: "A hollow ring, wherever the pointer is on the field.", draw: <Ring /> },
  {
    name: "Over a cell",
    when: "The cell under it lights its dashes violet, inside the cell's circle only, and fades back as it leaves.",
    draw: (
      <span className="border-secondary grid size-12 place-items-center rounded-full border border-dashed">
        <Ring />
      </span>
    ),
  },
  { name: "Pressed", when: "Filled violet while a button is held, anywhere on the field.", draw: <Ring filled /> },
  {
    name: "Holding a slider",
    when: "The slider's head leaves the bar and sits in the ring until it is let go.",
    draw: (
      <Ring>
        <span className="bg-primary absolute inset-1 rounded-full" />
      </Ring>
    ),
  },
  { name: "Over a box that scrolls", when: "Liquid at how far it is scrolled: a little at the top, full at the end.", draw: <RingLiquid level={0.3} /> },
  { name: "Scrolling", when: "Twice the size while it scrolls, easing back when the scrolling stops.", draw: <RingLiquid level={0.6} size={48} /> },
];

/** The six states side by side, each drawn over its name and when it shows; as many to a row as the band holds. */
function statesItem(): SpecimenItem {
  const STATE_W = 140;
  return {
    id: "states",
    keep: true,
    span: (band, bp, cell) => {
      const perRow = Math.max(1, Math.floor((widthOf(band, bp, cell) - 66) / STATE_W));
      const rows = Math.ceil(STATES.length / perRow);
      return { cols: band, rows: rowsFor(66 + 24 + rows * 150, bp, cell) } satisfies Span;
    },
    variant: "none",
    render: () => (
      <Slot fill="card">
        <div className="flex min-h-0 flex-col gap-stack">
          <Text role="label" tone="muted" as="h2">
            Its states
          </Text>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-x-inline gap-y-stack">
            {STATES.map((state) => (
              <li key={state.name} className="flex flex-col gap-2">
                <span className="grid h-14 place-items-start content-center">{state.draw}</span>
                <Text role="body" as="h3">
                  {state.name}
                </Text>
                <Text role="caption" tone="muted">
                  {state.when}
                </Text>
              </li>
            ))}
          </ul>
        </div>
      </Slot>
    ),
  };
}

// ── try it ─────────────────────────────────────────────────────────────────────────────────────────────────────

const ROWS = Array.from({ length: 24 }, (_, i) => `Row ${i + 1}`);

/** Live: a list that scrolls, a slider to hold, and the field itself to press and to cross. */
function tryItem(): SpecimenItem {
  return {
    id: "try",
    keep: true,
    span: (band, bp, cell) => ({ cols: band, rows: rowsFor(widthOf(band, bp, cell) >= 560 ? 248 : 388, bp, cell) }),
    variant: "none",
    render: () => (
      <Slot fill="card">
        <div className="flex min-h-0 flex-col gap-stack">
          <Text role="label" tone="muted" as="h2">
            Try it
          </Text>
          <div className="flex min-h-0 flex-wrap gap-x-6 gap-y-4">
            <div className="flex w-56 flex-col gap-1.5">
              <Text role="caption" tone="muted">
                Move into the list, then scroll it.
              </Text>
              <ScrollArea className="h-32 rounded-lg border" aria-label="A list that scrolls">
                <ul className="px-4 py-2">
                  {ROWS.map((row) => (
                    <li key={row} className="py-1">
                      <Text role="body" as="span">
                        {row}
                      </Text>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
            <div className="flex min-w-0 flex-1 basis-56 flex-col gap-4">
              <div className="flex flex-col gap-3">
                <Text role="caption" tone="muted">
                  Hold the slider&apos;s head and drag it.
                </Text>
                <Slider defaultValue={[40]} max={100} step={1} className="w-full max-w-72" aria-label="A slider to hold" />
              </div>
              <Text role="caption" tone="muted">
                Press anywhere on the field and the ring fills. Cross the field and each cell lights under it.
              </Text>
            </div>
          </div>
        </div>
      </Slot>
    ),
  };
}

// ── the page ───────────────────────────────────────────────────────────────────────────────────────────────────

export function cursorPage(entry: DocEntry): PageContent {
  const items: SpecimenItem[] = [
    docTitle(entry),
    docCard(
      "what",
      "What it is",
      "The pointer is a violet ring, 24px across, drawn on every grid that turns it on. It shows where the hand is: the cell under it lights. It shows what the hand is doing: a press fills it, and a slider's head sits in it while held. And it shows what a box can do: over a box that scrolls, it holds liquid at how far the box is scrolled.",
      [],
    ),
    statesItem(),
    tryItem(),
    docCard("rules", "The rules", undefined, [
      "The ring is the system's cursor, drawn from an image. Never draw it as an element that follows the pointer: that trails the hand and makes the page redraw on every move.",
      "One colour: the ring, its fill when pressed and the lit cell are all violet (--violet, #9262f3 in the image). Change the token and the image together.",
      "It lights a cell only inside the cell's circle. The gutter and a square cell's corners light nothing.",
      "No glow round it, ever.",
      "A box that scrolls has no scrollbar: the ring shows how far, and nothing else scrolls (the page never does).",
      "It is for a mouse or a pen. A phone keeps its own pointer, and a touch on a touch screen with a mouse is ignored.",
      "Inside a grid with the ring, never set a cursor of your own on an element: the ring is the pointer over buttons and links too.",
    ]),
    docCard("touch", "Without a mouse", undefined, [
      "Touch and keyboard: no ring. A box that scrolls shows its liquid in a ring of its own at its top corner while it scrolls, and it fades a second after.",
      "Reduced motion: the lit cell does not fade, and the liquid does not rise, flow or grow: it is a flat level.",
    ]),
    docCard("where", "Where it is on", undefined, [
      "On: the portfolio, this site, the status page, the motion studio, Orbit and Home.",
      "Off: the admin and the login app (their grids do not turn it on), and engineering (not on a grid yet).",
    ]),
    docCard("using", "Using it", undefined, [
      "Turn it on for a field with cursor on Grid or GridPages. Every element on that field wears the ring.",
      "For a box whose content can outgrow it, use ScrollArea: it scrolls inside its box, and the cursor shows how far.",
      "A page can keep the lit cell off while it shows something over the field, with data-cursor-still on the grid (the motion studio's focus pages).",
      "The scroll's liquid moves by the --motion-scroll-* tokens (Tokens → Motion); the lit cell fades over 500ms.",
    ]),
    docCard("open", "Open", undefined, [
      "Whether every app's grid turns the ring on, the admin and the login app included.",
      "The liquid's colour: lime, in the violet ring.",
      "Where the liquid shows for a finger.",
      "The scroll's numbers are a first version: its size when grown, how long it takes, and how long it stays.",
    ]),
    docCard("decided", "Decided in", undefined, [
      "Grid.md D34 (the ring and the lit cell), D40 (a cell is a circle), D43 (violet), D52 (a box may scroll; the cursor shows how far).",
      "Motion.md M16 (a slider's head in the ring), M26 (the scroll's liquid).",
    ]),
  ];
  return { title: entry.page.title, variant: "card", sections: [{ id: "foundations-cursor", items }] };
}
