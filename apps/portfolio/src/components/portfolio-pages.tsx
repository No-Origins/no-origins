"use client";

import * as React from "react";

import { countFor, DEFAULT_GRID_CONFIG, Grid, GRID_REFERENCE_BOX, GridItem, specFor } from "@no-origins/ui/components/grid";
import { useReadingFocus } from "@no-origins/ui/hooks/use-reading-focus";
import type { GridLayoutItem } from "@no-origins/ui/lib/grid-layout";

import type { PortfolioField, PortfolioPage } from "@/content";
import { arrange } from "@/lib/arrange";

/**
 * How much of its colour a box keeps, mixed into the page, before it is active (Portfolio.md P16). Mine, his to change.
 */
const INACTIVE = 0.4;

/**
 * The tokens an inactive box mixes into the page: its text, its lines, the accents and their inks, and the hover's
 * lime. Mixed, never see-through, because a faded card would show the field's dashes through it. The card and the page
 * are left alone, so a box stays a box. Its images fade over their own card (`--box-keep`).
 */
const FADED = [
  "foreground", "card-foreground", "muted-foreground", "faint-foreground", "accent-foreground", "border", "input",
  "lime", "lime-foreground", "violet", "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "accent",
] as const;

/** The page's own value of each, carried on the box round the grid, because a token cannot be mixed from itself. */
const PAGE_TOKENS = Object.fromEntries(FADED.map((token) => [`--page-${token}`, `var(--${token})`])) as React.CSSProperties;

/**
 * A box's tokens: each mixed from the page's by `--box-keep`, which is INACTIVE of it before the box is active and all
 * of it after, following `--box-active` (0 or 1) as the wake's front crosses the box (`wakeFront`).
 */
const BOX_TOKENS = {
  "--box-keep": `calc(${INACTIVE} + ${1 - INACTIVE} * var(--box-active))`,
  ...Object.fromEntries(FADED.map((token) => [`--${token}`, `color-mix(in oklch, var(--page-${token}) calc(var(--box-keep) * 100%), var(--background))`])),
};

/**
 * `--box-active` as a number, so the browser eases it and every colour mixed from it follows: a box becoming active
 * is a transition, not a jump. Where it cannot be registered, the switch happens at once.
 */
function registerActive() {
  try {
    CSS.registerProperty({ name: "--box-active", syntax: "<number>", inherits: false, initialValue: "1" });
  } catch {
    // Registered already (a hot reload), or not supported.
  }
}

/**
 * How long the wake's front takes to go from the avatar to the page's farthest corner, in ms (P16). Mine, his to
 * change: the portfolio's own motion, like the HEY!'s (Motion.md §2), not a component's, so it is not a system token.
 */
const WAKE_MS = 1200;

/** When the front reaches a box and how long it takes to cross it, in ms. */
type WakeTiming = { delay: number; duration: number };

/**
 * The wake's front (P16, his, 2026-09-27: "the activation is smooth and starts from the avatar"): a circle growing
 * from the avatar's centre at an even pace, over the whole page in WAKE_MS. A box starts to brighten when the front
 * reaches its nearest point and is fully active when the front has passed its farthest, evenly in between, so every
 * box the front is over is part way at once and the wake has no steps. Read off the boxes where the grid put them,
 * as soon as they are on the field; with no avatar on the field it starts at the field's top-left corner.
 */
function wakeFront(grid: HTMLElement): Map<string, WakeTiming> {
  const tracks = grid.querySelector<HTMLElement>('[data-slot="grid-tracks"]');
  if (!tracks) return new Map();
  const field = tracks.getBoundingClientRect();
  const avatar = tracks.querySelector('[data-slot="avatar"]')?.getBoundingClientRect();
  const x = avatar ? avatar.left + avatar.width / 2 : field.left;
  const y = avatar ? avatar.top + avatar.height / 2 : field.top;
  const reach = [...tracks.querySelectorAll<HTMLElement>(':scope > [data-slot="grid-item"][data-box]')].map((box) => {
    const r = box.getBoundingClientRect();
    return {
      id: box.dataset.box!,
      near: Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom)),
      far: Math.hypot(Math.max(x - r.left, r.right - x), Math.max(y - r.top, r.bottom - y)),
    };
  });
  const farthest = Math.max(1, ...reach.map((box) => box.far));
  return new Map(reach.map(({ id, near, far }) => [id, { delay: (near / farthest) * WAKE_MS, duration: ((far - near) / farthest) * WAKE_MS }]));
}

/** The field assumed before the grid has measured itself: the xl reference box, bare — the portfolio has no chrome above the grid. */
const XL = GRID_REFERENCE_BOX.xl;
const XL_SPEC = specFor(DEFAULT_GRID_CONFIG, "xl");
const FIRST_FIELD: PortfolioField = {
  bp: "xl",
  cols: countFor(XL.width, XL_SPEC.cell, XL_SPEC.gap),
  rows: countFor(XL.height, XL_SPEC.cell, XL_SPEC.gap),
};

/**
 * The portfolio on the grid, ONE page (Portfolio.md P15, his, 2026-09-27: "We don't need multiple pages in portfolio
 * now. Remove pagination navbar"): a `Grid`, not a `GridPages`, so there is no pager's bar, no turn and nothing to
 * turn it — the scroll and a finger do nothing, and the arrow keys only ever moved focus (Grid.md D45). The grid is the
 * viewport (Grid.md D3, D11) and nothing here scrolls. The page is arranged on the field the grid reports, so every
 * coordinate is honoured as written: the first screen as it was, and the pieces of the pages that went in the room it
 * leaves (`arrange`). It opens with the grid's intro (Grid.md D50, P23, his, 2026-09-30): the agent stands in the
 * avatar's ring (`data-intro-agent`, profile-card.tsx), breathes, hops in place, and the field wakes ring by ring from
 * it; then it fades away and the page comes in. The pointer is the grid's violet ring, and the cell under it lights
 * (D34, D43).
 *
 * **The page wakes from the avatar** (P16, amended — his, 2026-09-27: "once all the components render, lets
 * everything get activated", and then "the activation is smooth and starts from the avatar"): every box comes onto
 * the field inactive, faded into the page, and as the intro's agent gives way to the page a front grows from the
 * avatar's centre over it, each box brightening as it crosses it (`wakeFront`). They stay active: the pointer and the
 * focus change nothing in that.
 */
export function PortfolioPages({ page }: { page: PortfolioPage }) {
  const [field, setField] = React.useState<PortfolioField | null>(null);
  // Where the field sits in the grid's box, for what is drawn behind it (the tagline, P4): the grid centres the field
  // and leaves the rest as margin (Grid.md D14).
  const [frame, setFrame] = React.useState<Frame | null>(null);
  const arranged = React.useMemo(() => arrange(page, field ?? FIRST_FIELD), [page, field]);
  const items = React.useMemo(() => new Map(page.sections.flatMap((s) => s.items).map((item) => [item.id, item])), [page]);
  const backdrop = arranged.backdrop;
  // Tab and the arrows move focus in reading order (Grid.md D45), over the backdrop's handle as well as the grid: it
  // comes first in the document and last on the screen.
  const scope = React.useRef<HTMLDivElement>(null);
  useReadingFocus(scope);
  // The grid's intro (Grid.md D50), as its root carries it: "agent" while the agent plays and the page is held back,
  // "reveal" as the page comes in, over `--grid-intro-reveal`. The tagline behind the grid is held with the boxes, so it
  // carries the same. Assumed held until the grid says otherwise, so it never shows a frame early.
  const grid = React.useRef<HTMLDivElement>(null);
  const [intro, setIntro] = React.useState<{ phase: string | null; reveal: string }>({ phase: "agent", reveal: "" });
  React.useLayoutEffect(() => {
    const el = grid.current;
    if (!el) return;
    const read = () => setIntro({ phase: el.getAttribute("data-intro"), reveal: el.style.getPropertyValue("--grid-intro-reveal") });
    read();
    const watch = new MutationObserver(read);
    watch.observe(el, { attributes: true, attributeFilter: ["data-intro"] });
    return () => watch.disconnect();
  }, []);
  // Awake (P16) once the boxes are on the measured field and the agent has given way to them: they have been laid out
  // inactive — `wakeFront` reads them where the grid put them — and the front sets off as they come in. Each box's
  // timing comes in the same render as its `--box-active`, so the front is what the transition runs on. Under reduced
  // motion there is no intro, and the switch is instant.
  const [wake, setWake] = React.useState<Map<string, WakeTiming> | null>(null);
  React.useLayoutEffect(() => {
    const el = grid.current;
    if (field && !wake && el && intro.phase !== "agent") setWake(wakeFront(el));
  }, [field, wake, intro.phase]);
  React.useEffect(registerActive, []);

  return (
    <div ref={scope} className="relative" style={PAGE_TOKENS}>
      {/* Before the grid, so the field's dashes and its boxes are drawn over it. Nothing in it takes the pointer but
          what asks for it (the tagline's handle). It carries the field's cell and gutter, so what it holds can be laid
          out on the cells it covers. */}
      {backdrop && frame ? (
        <div
          className="pointer-events-none absolute"
          data-intro-held={intro.phase ?? undefined}
          style={
            {
              ...place(backdrop, frame),
              "--grid-intro-reveal": intro.reveal || undefined,
              "--grid-cell": `${frame.cell}px`,
              "--grid-gap": `${frame.gap}px`,
            } as React.CSSProperties
          }
        >
          {items.get(backdrop.id)?.render(backdrop)}
        </div>
      ) : null}
      <Grid
        ref={grid}
        overlay
        intro
        cursor
        onMetrics={(m) => {
          setField((prev) => (prev && prev.cols === m.cols && prev.rows === m.rows && prev.bp === m.bp ? prev : { cols: m.cols, rows: m.rows, bp: m.bp }));
          setFrame((prev) =>
            prev && prev.boxW === m.boxW && prev.boxH === m.boxH && prev.gridW === m.gridW && prev.gridH === m.gridH && prev.cell === m.cell && prev.gap === m.gap
              ? prev
              : { boxW: m.boxW, boxH: m.boxH, gridW: m.gridW, gridH: m.gridH, cell: m.cell, gap: m.gap },
          );
        }}
      >
        {/* Only once the grid has measured: the first field is a guess, and a box placed on it would flash in the wrong
            cells for a frame (GridPages waited the same way). */}
        {field
          ? arranged.items.map((placed) => {
              // The front's crossing of this box (`wakeFront`); none for a box that came after the wake, already active.
              const timing = wake?.get(placed.id);
              return (
                <GridItem
                  key={placed.id}
                  col={placed.col}
                  row={placed.row}
                  colSpan={placed.colSpan}
                  rowSpan={placed.rowSpan}
                  data-box={placed.id}
                  className="relative select-none [transition-property:--box-active] [transition-timing-function:linear] motion-reduce:[transition:none] [&_img]:opacity-(--box-keep)"
                  style={
                    {
                      ...BOX_TOKENS,
                      "--box-active": wake ? "1" : "0",
                      ...(timing ? { transitionDelay: `${timing.delay}ms`, transitionDuration: `${timing.duration}ms` } : null),
                    } as React.CSSProperties
                  }
                >
                  {items.get(placed.id)?.render(placed)}
                </GridItem>
              );
            })
          : null}
      </Grid>
    </div>
  );
}

/** The grid's box and field in px, and its cell and gutter. */
type Frame = { boxW: number; boxH: number; gridW: number; gridH: number; cell: number; gap: number };

/** A rect of cells on the field, in px from the grid's box: the field is centred in it (Grid.md D14). */
function place(rect: GridLayoutItem, { boxW, boxH, gridW, gridH, cell, gap }: Frame): React.CSSProperties {
  const pitch = cell + gap;
  return {
    left: (boxW - gridW) / 2 + (rect.col - 1) * pitch,
    top: (boxH - gridH) / 2 + (rect.row - 1) * pitch,
    width: rect.colSpan * pitch - gap,
    height: rect.rowSpan * pitch - gap,
  };
}
