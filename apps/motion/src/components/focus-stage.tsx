"use client";

import * as React from "react";
import { ArrowUpRightIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@no-origins/ui/components/avatar";
import { Button } from "@no-origins/ui/components/button";
import { Card } from "@no-origins/ui/components/card";
import { useGridMetrics } from "@no-origins/ui/components/grid";
import { Text } from "@no-origins/ui/components/text";
import { useFocusMotion, type FocusCards, type FocusTarget } from "@no-origins/ui/hooks/use-focus-motion";
import {
  FOCUS_ON, focusPlace, focusReach, focusRings, levelBetween, levelEntering, levelIn, levelLeaving, paintFocus, placeBetween,
  readFocusMotion, type FocusBox, type FocusLevel, type FocusPlace,
} from "@no-origins/ui/lib/focus-motion";
import { findFreeRect, readingOrder, usedBlock, type GridRect } from "@no-origins/ui/lib/grid-layout";
import { cn } from "@no-origins/ui/lib/utils";

import type { Family } from "@/content/families";
import { holdPhase, useStudio, type Phase } from "@/components/studio-context";
import { useHeld, useTrack, type Track } from "@/components/stage";

/**
 * The focus specimen (Motion.md M13): a page like the portfolio's first screen, on the stage's cells — the avatar and the
 * name, a note beside four roles, the address and the résumé, three skills — every piece a system `Card`. Hover one and
 * it is in focus: its border goes violet over the state's time and it stands over the blur, which comes in by the
 * jig's way, least at the card and rising in rings out from it, and goes by its way out once the pointer has been off
 * every card for the hold. The rings are drawn over the page, dashed lime, each with the blur it reaches, so the field
 * the Intensity jig sets can be read on it.
 *
 * It plays through `useFocusMotion`, the package's, as the portfolio's cards do: the motion is read off the stage's
 * tokens — the jig's values, slowed by the tempo (M2, M3). The blur's layers cover the stage and are clipped to it, so
 * the field's own dashes under the stage blur too. On the timeline a play is in on a card, hold, on to the next card,
 * hold, out, painted from the package's own levels at the playhead.
 */

type Kind = "avatar" | "name" | "note" | "role" | "address" | "resume" | "skill";

/** The sample, in reading order, cells across × down; what a smaller block has no room for is left out. */
const SAMPLE: { span: [number, number]; kind: Kind; words?: [string, string?] }[] = [
  { span: [2, 2], kind: "avatar" },
  { span: [6, 2], kind: "name", words: ["Your name", "What you do · where you are"] },
  { span: [4, 4], kind: "note" },
  { span: [4, 1], kind: "role", words: ["Senior engineer", "Studio · 2025 — now"] },
  { span: [4, 1], kind: "role", words: ["Engineer II", "Platform · 2023 — 2025"] },
  { span: [4, 1], kind: "role", words: ["Engineer", "Product · 2022 — 2023"] },
  { span: [4, 1], kind: "role", words: ["Intern", "Agency · 2020 — 2022"] },
  { span: [5, 1], kind: "address", words: ["name@no-origins.com"] },
  { span: [3, 1], kind: "resume" },
  { span: [3, 1], kind: "skill", words: ["Sketching"] },
  { span: [3, 1], kind: "skill", words: ["UI in Figma"] },
  { span: [2, 1], kind: "skill", words: ["Film"] },
];

export const FOCUS_SAMPLE_COUNT = SAMPLE.length;

/** A rest at the end of a play on a loop, in ms, as the other stages have. */
const REST = 700;

const clamp01 = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t);

/** The sample packed in reading order inside the block, trimmed to the stage, and centred on it. */
function samplePage(cols: number, rows: number, columns: number, down: number): { rect: GridRect; i: number }[] {
  const band = Math.max(1, Math.min(cols, columns));
  const height = Math.max(1, Math.min(rows, down));
  const placed: { rect: GridRect; i: number }[] = [];
  SAMPLE.forEach(({ span: [w, h] }, i) => {
    const rect = findFreeRect(placed.map((p) => p.rect), band, height, Math.min(w, band), Math.min(h, height));
    if (rect) placed.push({ rect, i });
  });
  const used = usedBlock(placed.map((p) => p.rect));
  if (!used) return [];
  const dc = Math.floor((cols - used.colSpan) / 2) - (used.col - 1);
  const dr = Math.floor((rows - used.rowSpan) / 2) - (used.row - 1);
  const moved = placed.map((p) => ({ ...p, rect: { ...p.rect, col: p.rect.col + dc, row: p.rect.row + dr } }));
  const order = readingOrder(moved.map((p) => p.rect));
  return order.map((rect) => moved.find((p) => p.rect === rect)!);
}

/** What a piece of the sample shows: the system's own components, as the portfolio's cards are made. */
function Piece({ kind, words, cell }: { kind: Kind; words?: [string, string?]; cell: number }) {
  switch (kind) {
    case "avatar":
      return (
        <Avatar style={{ width: cell * 2 - 24, height: cell * 2 - 24 }}>
          <AvatarFallback>YN</AvatarFallback>
        </Avatar>
      );
    case "name":
      return (
        <div className="flex min-w-0 flex-col gap-1 px-5">
          <Text role="heading" className="truncate">{words?.[0]}</Text>
          <Text role="caption" className="truncate">{words?.[1]}</Text>
        </div>
      );
    case "note":
      return (
        <div className="flex min-w-0 flex-col gap-2 px-5">
          <Text role="caption">A card in focus stands sharp over the page, and everything round it blurs.</Text>
          <Text role="caption">Least next to it, and more in rings out from it, to the far edge.</Text>
          <Text role="caption">Hover another card and the field moves over; leave them all and it goes.</Text>
        </div>
      );
    case "role":
      return (
        <div className="flex min-w-0 flex-col px-5">
          <Text as="span" className="truncate">{words?.[0]}</Text>
          <Text as="span" role="caption" className="truncate">{words?.[1]}</Text>
        </div>
      );
    case "address":
    case "skill":
      return (
        <Text as="span" align="center" className="truncate px-4">
          {words?.[0]}
        </Text>
      );
    case "resume":
      return (
        <Button size="sm" tabIndex={-1}>
          Résumé <ArrowUpRightIcon data-icon="inline-end" />
        </Button>
      );
  }
}

type StageProps = { family: Family; cols: number; rows: number };

export function FocusStage({ family, cols, rows }: StageProps) {
  const studio = useStudio();
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const pitch = cell + gap;
  const { columns, rows: down } = studio.blockOf(family);
  const page = React.useMemo(() => samplePage(cols, rows, columns, down), [cols, rows, columns, down]);
  const boxes = React.useMemo<FocusBox[]>(
    () => page.map(({ rect: r }) => ({ l: (r.col - 1) * pitch, t: (r.row - 1) * pitch, r: (r.col - 1 + r.colSpan) * pitch - gap, b: (r.row - 1 + r.rowSpan) * pitch - gap })),
    [page, pitch, gap],
  );
  const showRings = studio.optionOf(family, "rings", true);
  const startOn = studio.optionOf(family, "card", 3);
  // The jig's values and the tempo only say when to read again: the numbers are read off the stage itself.
  const tuning = `${JSON.stringify(studio.values(family))}·${studio.tempo}`;
  const { hold, setHold, loop } = studio;
  const held = useHeld(family);
  const heldNow = React.useRef(held);
  React.useLayoutEffect(() => {
    heldNow.current = held;
  });

  const surface = React.useRef<HTMLDivElement>(null);
  const cards = React.useRef<(HTMLDivElement | null)[]>([]);

  /** Marks the focused card — its border — and the one over the blur, and says which side of it the rings' labels go. */
  const mark = React.useCallback(
    (focused: number | null, lifted: number | null) => {
      cards.current.forEach((el, j) => {
        if (!el) return;
        el.toggleAttribute("data-focused", j === focused);
        el.toggleAttribute("data-focus-lift", j === lifted);
      });
      const at = lifted ?? focused;
      const box = at === null ? null : boxes[at];
      const s = surface.current;
      // As on the portfolio: while a card is in focus the grid's pointer lights no cell under the blur (Grid.md D34).
      s?.closest('[data-slot="grid"]')?.toggleAttribute("data-cursor-still", at !== null);
      if (box && s) s.style.setProperty("--ring-side", (box.t + box.b) / 2 < s.clientHeight / 2 ? "1" : "-1");
    },
    [boxes],
  );
  // A turn takes the stage off the field with a card still in focus: the grid's pointer lights cells again after it.
  React.useEffect(() => {
    const grid = surface.current?.closest('[data-slot="grid"]');
    return () => grid?.removeAttribute("data-cursor-still");
  }, []);
  const onCards = React.useCallback(
    ({ focused, lifted }: FocusCards) => {
      if (!heldNow.current) mark(focused === null ? null : Number(focused), lifted === null ? null : Number(lifted));
    },
    [mark],
  );

  const [target, setTarget] = React.useState<FocusTarget | null>(null);
  const { motion, layers } = useFocusMotion({ surface, target, pitch, onCards, tuning, still: held, always: true });

  // The play on the timeline: in on a card, hold, on to the next card in reading order, hold, out, and a loop's rest.
  const build = React.useCallback((): Track | null => {
    const el = surface.current;
    if (!el || !boxes.length) return null;
    const mo = readFocusMotion(el);
    const w = mo.front * pitch;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const ia = Math.min(Math.max(0, startOn - 1), boxes.length - 1);
    const ib = boxes.length > 1 ? (ia + 1) % boxes.length : null;
    const a = focusPlace(boxes[ia]!, mo.from);
    const b: FocusPlace | null = ib === null ? null : focusPlace(boxes[ib]!, mo.from);
    const last = b ?? a;
    const entering = levelEntering(mo, w);
    const inA = levelIn(focusReach(a, W, H), w);
    const outFrom = levelIn(focusReach(last, W, H), w);
    const outTo = levelLeaving(mo, outFrom, focusReach(last, W, H), w);
    const glide = b ? (mo.shift === "glide" ? mo.glideMs : 0) : 0;
    const phases: Phase[] = [{ label: "in", ms: mo.inMs }, holdPhase(hold, setHold)];
    if (b) phases.push({ label: "next", ms: glide }, holdPhase(hold, setHold));
    phases.push({ label: "out", ms: mo.outMs });
    if (loop) phases.push({ label: "rest", ms: REST });
    const t1 = mo.inMs;
    const t2 = t1 + hold;
    const t3 = t2 + glide;
    const t4 = t3 + (b ? hold : 0);
    const t5 = t4 + mo.outMs;
    const at = (t: number, from: number, ms: number, ease: (p: number) => number) => (ms > 0 ? ease(clamp01((t - from) / ms)) : 1);
    return {
      phases,
      paint: (t) => {
        let place = a;
        let level: FocusLevel = FOCUS_ON;
        let shown = true;
        let focused: number | null = ia;
        let lifted: number | null = ia;
        if (t < t1) level = levelBetween(entering, inA, at(t, 0, t1, mo.inEase));
        else if (t < t2) level = FOCUS_ON;
        else if (b && ib !== null && t < t3) {
          place = placeBetween(a, b, at(t, t2, glide, mo.glideEase));
          focused = lifted = ib;
        } else if (b && ib !== null && t < t4) {
          place = b;
          focused = lifted = ib;
        } else if (t < t5) {
          place = last;
          level = levelBetween(outFrom, outTo, at(t, t4, mo.outMs, mo.outEase));
          focused = null;
          lifted = ib ?? ia;
        } else {
          place = last;
          shown = false;
          focused = lifted = null;
        }
        paintFocus(el, place, level, shown);
        mark(focused, lifted);
      },
    };
    // `tuning` says when to read the motion off the stage again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuning, boxes, pitch, startOn, hold, setHold, loop, mark]);
  useTrack(family, build, held);

  // The card under the pointer, a mouse's or a pen's; off every card the focus holds, then goes (the hook's).
  const onPointerOver = (event: React.PointerEvent<HTMLDivElement>) => {
    if (held || event.pointerType === "touch") return;
    const el = (event.target as Element).closest<HTMLElement>("[data-focus-card]");
    const j = el ? Number(el.dataset.focusCard) : -1;
    const box = boxes[j];
    setTarget((prev) => (box ? (prev?.key === String(j) ? prev : { key: String(j), box }) : null));
  };

  const rings = motion ? focusRings(motion, pitch).filter((r) => r.to !== null) : [];

  return (
    <div data-block className="absolute inset-0" onPointerOver={onPointerOver} onPointerLeave={() => !held && setTarget(null)}>
      {page.map(({ rect: r, i }, j) => {
        const piece = SAMPLE[i]!;
        return (
          <Card
            key={i}
            ref={(el) => void (cards.current[j] = el)}
            data-focus-card={j}
            size="sm"
            className={cn(
              "absolute justify-center gap-0 py-0 shadow-none transition-[border-color] data-focused:border-secondary data-focus-lift:z-12",
              piece.kind === "avatar" || piece.kind === "resume" ? "items-center" : "",
            )}
            style={{ left: (r.col - 1) * pitch, top: (r.row - 1) * pitch, width: r.colSpan * pitch - gap, height: r.rowSpan * pitch - gap }}
          >
            <Piece kind={piece.kind} words={piece.words} cell={cell} />
          </Card>
        );
      })}
      {/* The blur's layers, over the page and under the card in focus, and over them the rings, sharp. Nothing round
          the layers may carry an opacity, a filter or a mask (focus-motion.ts): the surface only shows or hides. */}
      <div ref={surface} aria-hidden data-focus-surface className="pointer-events-none absolute inset-0 z-10" style={{ visibility: "hidden" }}>
        {layers.map((style, k) => (
          <div key={k} className="absolute inset-0" style={style} />
        ))}
        {showRings ? (
          <>
            <svg className="absolute inset-0 size-full overflow-visible">
              {rings.map((ring, k) => (
                <circle
                  key={k}
                  className="fill-none stroke-lime"
                  strokeWidth={1}
                  strokeDasharray="3 5"
                  style={{ cx: "var(--focus-x)", cy: "var(--focus-y)", r: `calc(var(--focus-r0) + ${ring.to}px)` } as React.CSSProperties}
                />
              ))}
            </svg>
            {rings.map((ring, k) => (
              <Text
                key={k}
                as="span"
                role="mono"
                tone="lime"
                className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-background px-1"
                style={{ left: "var(--focus-x)", top: `calc(var(--focus-y) + var(--ring-side, 1) * (var(--focus-r0) + ${ring.to}px))` }}
              >
                {ring.level.toFixed(1)}px
              </Text>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
