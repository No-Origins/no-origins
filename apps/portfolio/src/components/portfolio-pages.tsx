"use client";

import * as React from "react";

import { countFor, DEFAULT_GRID_CONFIG, Grid, GRID_REFERENCE_BOX, GridItem, specFor } from "@no-origins/ui/components/grid";
import { useReadingFocus } from "@no-origins/ui/hooks/use-reading-focus";
import { useFocusMotion, type FocusCards, type FocusTarget } from "@no-origins/ui/hooks/use-focus-motion";
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
 * once the load is over; with no avatar on the field it starts at the field's top-left corner.
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

/**
 * The card in focus (P18) wears `data-focused`: its border goes to the secondary colour, the violet, over the state's
 * time (a `transition-*` with no duration is `--motion-state`). It wears `data-focus-lift` while it stands over the
 * blur's layers, which are z-10 over the page and under the grid's theme flip (z-20), and keeps it until the blur has
 * gone, so it is never blurred itself. Every card on the field carries the transition, so its border goes back the
 * same way.
 */
const FOCUS_CARDS =
  "[&_[data-slot=grid-tracks]_[data-slot=card]]:transition-[border-color] [&_[data-slot=grid-tracks]_[data-slot=card]]:motion-reduce:transition-none [&_[data-focus-lift]]:relative [&_[data-focus-lift]]:z-11 [&_[data-focused]]:border-secondary";

/**
 * The card under the pointer (P18, his, 2026-09-28: "When a cursor is on a card, the card border should transition to
 * secondary color … everything on the page should blur out"): the innermost `Card` on the field the pointer is over, a
 * mouse's or a pen's, never a finger's, once the page is awake. **The blur is the system's focus motion** (Motion.md
 * M13, his, the same day: "I want the blurring to start from the card with less intensity and then increase the
 * intensity in a circular fashion from the card"), played on the screen by `useFocusMotion`: least at the card and
 * rising in rings out from it, coming in as a ripple from the card, holding across a gutter, gliding to the next card
 * and fading when the pointer has left them all — by his tokens in globals.css (the same evening, round 1's Tide,
 * tuned, picked in the motion studio), none of them copied here. The cards are marked on themselves, not in React state, because every card on the page is
 * drawn by another component; the hook says which is focused and which stands over the blur. It starts with the card
 * the pointer is already resting on, and lets go when the field changes, since the arrangement may put other cards
 * under the pointer.
 */
function CardFocus({ grid, on, field, pitch }: { grid: React.RefObject<HTMLDivElement | null>; on: boolean; field: PortfolioField | null; pitch: number }) {
  const surface = React.useRef<HTMLDivElement>(null);
  const [target, setTarget] = React.useState<FocusTarget | null>(null);
  // Every piece the pointer has been on — a card, or a group's cards — by a key of its own, while it is on the page.
  const pieces = React.useRef(new Map<string, HTMLElement[]>());
  const keys = React.useRef(new WeakMap<Element, string>());
  const seq = React.useRef(0);
  const onCards = React.useCallback(
    ({ focused, lifted }: FocusCards) => {
      for (const [key, cards] of pieces.current) {
        for (const el of cards) {
          el.toggleAttribute("data-focused", key === focused);
          el.toggleAttribute("data-focus-lift", key === lifted);
        }
        if (key !== focused && key !== lifted && !cards.some((el) => el.isConnected)) pieces.current.delete(key);
      }
      // While a card is in focus the pointer lights no cell (Grid.md D34): under the blur a lit cell is a violet smear,
      // and every frame of its fade redraws all the blur's layers — the flicker he saw moving between cards.
      grid.current?.toggleAttribute("data-cursor-still", focused !== null || lifted !== null);
    },
    [grid],
  );
  const { layers } = useFocusMotion({ surface, target, pitch, onCards });

  React.useEffect(() => {
    const el = grid.current;
    if (!el || !on) return;
    /**
     * The piece under the pointer: **a component made of several cards is one** (his, 2026-09-28: "Radis and the title
     * are the same component … the blur should act accordingly") — the nearest `data-focus-group` round the pointer,
     * a work row's mark and pill, the profile's avatar and name, is in focus whole, the gap between its cards included;
     * otherwise the card the pointer is on. Its box is the one round its cards, on the screen, which the layers cover.
     */
    const pieceAt = (at: EventTarget | null): FocusTarget | null => {
      if (!(at instanceof Element)) return null;
      const group = at.closest<HTMLElement>('[data-slot="grid-tracks"] [data-focus-group]');
      const card = at.closest<HTMLElement>('[data-slot="grid-tracks"] [data-slot="card"]');
      const owner = group ?? card;
      if (!owner) return null;
      const cards = group ? [...group.querySelectorAll<HTMLElement>('[data-slot="card"]')] : [card!];
      if (!cards.length) return null;
      let key = keys.current.get(owner);
      if (!key) {
        key = String(seq.current++);
        keys.current.set(owner, key);
      }
      pieces.current.set(key, cards);
      const rects = cards.map((c) => c.getBoundingClientRect());
      return {
        key,
        box: {
          l: Math.min(...rects.map((r) => r.left)),
          t: Math.min(...rects.map((r) => r.top)),
          r: Math.max(...rects.map((r) => r.right)),
          b: Math.max(...rects.map((r) => r.bottom)),
        },
      };
    };
    const aim = (at: EventTarget | null) => {
      const next = pieceAt(at);
      setTarget((prev) => (next && prev?.key === next.key ? prev : next));
    };
    const over = (e: PointerEvent) => {
      if (e.pointerType !== "touch") aim(e.target);
    };
    const leave = () => setTarget(null);
    if (window.matchMedia("(hover: hover)").matches) aim([...el.querySelectorAll(":hover")].pop() ?? null);
    el.addEventListener("pointerover", over);
    el.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      el.removeEventListener("pointerover", over);
      el.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      setTarget(null);
    };
  }, [grid, on, field]);

  // The blur's surface: over the whole screen and under the card, which stands over it. It only shows and hides: an
  // opacity, a filter or a mask on it would make it the layers' backdrop root, and they would blur nothing. Its own
  // component, so a change of focus renders this and not the page.
  return (
    <div ref={surface} aria-hidden className="pointer-events-none fixed inset-0 z-10" style={{ visibility: "hidden" }}>
      {layers.map((style, i) => (
        <div key={i} className="absolute inset-0" style={style} />
      ))}
    </div>
  );
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
 * leaves (`arrange`). It opens with the grid's intro (Grid.md D31): the grid draws itself in, and the page comes up
 * once it has loaded. The pointer is the grid's violet ring, and the cell under it lights (D34, D43).
 *
 * **The page wakes from the avatar** (P16, amended — his, 2026-09-27: "once all the components render, lets
 * everything get activated", and then "the activation is smooth and starts from the avatar"): every box stands
 * inactive, faded into the page, until the grid's load is over, and then a front grows from the avatar's centre over
 * the page and each box brightens as it crosses it (`wakeFront`). They stay active: the pointer and the focus change
 * nothing in that.
 *
 * **The card under the pointer is in focus** (P18, his, 2026-09-28): once the page is awake, its border goes violet
 * and everything else on the screen blurs, least at the card and more in rings out from it (`CardFocus`, Motion.md
 * M13).
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
  // Awake (P16) once the boxes are on the measured field and the grid is loading nothing: the intro's loader has
  // opened the last of them (Grid.md D48, `data-loading` comes off the grid), or there was no intro to play — reduced
  // motion, where a layout effect has them active before their first paint rather than a frame faded. Each box's
  // timing comes in the same render as its `--box-active`, so the front is what the transition runs on.
  const grid = React.useRef<HTMLDivElement>(null);
  const [wake, setWake] = React.useState<Map<string, WakeTiming> | null>(null);
  React.useLayoutEffect(() => {
    const el = grid.current;
    if (!field || wake || !el) return;
    const loaded = () => {
      if (!el.hasAttribute("data-loading")) setWake(wakeFront(el));
    };
    loaded();
    const watch = new MutationObserver(loaded);
    watch.observe(el, { attributes: true, attributeFilter: ["data-loading"] });
    return () => watch.disconnect();
  }, [field, wake]);
  React.useEffect(registerActive, []);

  return (
    <div ref={scope} className={`relative ${FOCUS_CARDS}`} style={PAGE_TOKENS}>
      {/* Before the grid, so the field's dashes and its boxes are drawn over it. Nothing in it takes the pointer but
          what asks for it (the tagline's handle). It carries the field's cell and gutter, so what it holds can be laid
          out on the cells it covers. */}
      {backdrop && frame ? (
        <div
          className="pointer-events-none absolute"
          style={
            {
              ...place(backdrop, frame),
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
      {/* The blur round the card in focus (P18, Motion.md M13). */}
      <CardFocus grid={grid} on={!!wake} field={field} pitch={frame ? frame.cell + frame.gap : 72} />
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
