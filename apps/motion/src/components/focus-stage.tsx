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
  FOCUS_ON, focusRings, levelBetween, levelEntering, levelLeaving, paintFocus, placeBetween, readFocusMotion,
  type FocusBox, type FocusLevel,
} from "@no-origins/ui/lib/focus-motion";
import { findFreeRect, readingOrder, usedBlock, type GridRect } from "@no-origins/ui/lib/grid-layout";
import { cn } from "@no-origins/ui/lib/utils";

import type { Family } from "@/content/families";
import { holdPhase, useStudio, type Phase } from "@/components/studio-context";
import { useHeld, useTrack, type Track } from "@/components/stage";

/**
 * The focus specimen (Motion.md M13): a page like the portfolio's first screen, on the stage's cells — the avatar and the
 * name, a note beside four roles, the address and the résumé, three skills — every piece a system `Card`. Hover one and
 * it is in focus: its border goes violet over the state's time and it lifts over the cloth, which comes by the jig's
 * way — drawn out from under it to every corner of the screen — least at the card and thicker out from it, and goes by
 * its way out once the pointer has been off every card for the hold. The rings are drawn over the page, dashed lime,
 * each with the blur it reaches, so the field the Intensity jig sets can be read on it.
 *
 * It plays through `useFocusMotion`, the package's, as the portfolio's cards do: the motion is read off the stage's
 * tokens — the jig's values, slowed by the tempo (M2, M3). **The cloth covers its container, and here that is the
 * stage** (his: "I meant the container, whatever the container we are putting it in"), as the portfolio's is the
 * screen: its edges are drawn out to the stage's corners, and the jigs round it stay sharp. The stage's slot clips it,
 * and the field's dashes under the stage blur with the cards. On the timeline a play is in on a card, hold, on to the
 * next card, hold, out, painted from the package's own levels at the playhead.
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
  // Each card's box on the stage, which is the cloth's surface.
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

  /** Marks the focused card — its border — and the one over the cloth, and says which side of it the rings' labels go. */
  const mark = React.useCallback(
    (focused: number | null, lifted: number | null) => {
      cards.current.forEach((el, j) => {
        if (!el) return;
        el.toggleAttribute("data-focused", j === focused);
        el.toggleAttribute("data-focus-lift", j === lifted);
      });
      const j = lifted ?? focused;
      const box = j === null ? null : boxes[j];
      const s = surface.current;
      // As on the portfolio: while a card is in focus the grid's pointer lights no cell under the cloth (Grid.md D34).
      s?.closest('[data-slot="grid"]')?.toggleAttribute("data-cursor-still", j !== null);
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
  // The card lifts as the cloth comes, drops as it glides, lifts again once it has arrived, and goes down with it.
  const build = React.useCallback((): Track | null => {
    const el = surface.current;
    if (!el || !boxes.length) return null;
    const mo = readFocusMotion(el);
    const ia = Math.min(Math.max(0, startOn - 1), boxes.length - 1);
    const ib = boxes.length > 1 ? (ia + 1) % boxes.length : null;
    const glide = ib !== null ? (mo.shift === "glide" ? mo.glideMs : 0) : 0;
    const phases: Phase[] = [{ label: "in", ms: mo.inMs }, holdPhase(hold, setHold)];
    if (ib !== null) phases.push({ label: "next", ms: glide }, holdPhase(hold, setHold));
    phases.push({ label: "out", ms: mo.outMs });
    if (loop) phases.push({ label: "rest", ms: REST });
    const t1 = mo.inMs;
    const t2 = t1 + hold;
    const t3 = t2 + glide;
    const t4 = t3 + (ib !== null ? hold : 0);
    const t5 = t4 + mo.outMs;
    const entering = levelEntering(mo);
    const leaving = levelLeaving(mo, FOCUS_ON);
    const eased = (t: number, from: number, ms: number, ease: (p: number) => number) => (ms > 0 ? ease(clamp01((t - from) / ms)) : t >= from ? 1 : 0);
    /** How far the card is lifted `t` ms into the play, since it was lifted at `since`. */
    const lifting = (t: number, since: number) => eased(t, since, mo.liftMs, mo.liftEase);
    const upAtOut = lifting(t4, ib !== null ? t3 : 0);
    return {
      phases,
      paint: (t) => {
        const a = boxes[ia]!;
        const b = ib === null ? null : boxes[ib]!;
        let box = a;
        let level: FocusLevel = FOCUS_ON;
        let lift = lifting(t, 0);
        let shown = true;
        let focused: number | null = ia;
        let lifted: number | null = ia;
        if (t < t1) level = levelBetween(entering, FOCUS_ON, eased(t, 0, t1, mo.inEase));
        else if (t < t2) level = FOCUS_ON;
        else if (b && ib !== null && t < t3) {
          box = placeBetween(a, b, eased(t, t2, glide, mo.glideEase));
          lift = 0;
          focused = ib;
          lifted = null;
        } else if (b && ib !== null && t < t4) {
          box = b;
          lift = lifting(t, t3);
          focused = lifted = ib;
        } else if (t < t5) {
          box = b ?? a;
          const p = eased(t, t4, mo.outMs, mo.outEase);
          level = levelBetween(FOCUS_ON, leaving, p);
          lift = upAtOut * (1 - p);
          focused = null;
          lifted = ib ?? ia;
        } else {
          box = b ?? a;
          shown = false;
          lift = 0;
          focused = lifted = null;
        }
        paintFocus(el, mo, { box, level, lift, shown }, pitch);
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
  const square = motion?.from === "edges";

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
      {/* The cloth's layers, over the stage and under the card in focus, and over them the rings, sharp. Nothing round
          the layers may carry an opacity, a filter, a mask or paint containment (focus-motion.ts, stage.tsx): the
          surface only shows or hides. */}
      <div ref={surface} aria-hidden data-focus-surface className="pointer-events-none absolute inset-0 z-10" style={{ visibility: "hidden" }}>
        {layers.map((style, k) => (
          <div key={k} className="absolute inset-0" style={style} />
        ))}
        {showRings ? (
          <>
            {/* Measured from the card's edges a ring is square-cornered, as its mask is; from a circle, a circle. */}
            <svg className="absolute inset-0 size-full overflow-visible">
              {rings.map((ring, k) =>
                square ? (
                  <rect
                    key={k}
                    className="fill-none stroke-lime"
                    strokeWidth={1}
                    strokeDasharray="3 5"
                    style={
                      {
                        x: `calc(var(--focus-l) - ${ring.to}px)`,
                        y: `calc(var(--focus-t) - ${ring.to}px)`,
                        width: `calc(var(--focus-r) - var(--focus-l) + ${2 * ring.to!}px)`,
                        height: `calc(var(--focus-b) - var(--focus-t) + ${2 * ring.to!}px)`,
                      } as React.CSSProperties
                    }
                  />
                ) : (
                  <circle
                    key={k}
                    className="fill-none stroke-lime"
                    strokeWidth={1}
                    strokeDasharray="3 5"
                    style={{ cx: "var(--focus-x)", cy: "var(--focus-y)", r: `calc(var(--focus-r0) + ${ring.to}px)` } as React.CSSProperties}
                  />
                ),
              )}
            </svg>
            {rings.map((ring, k) => (
              <Text
                key={k}
                as="span"
                role="mono"
                tone="lime"
                className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-background px-1"
                style={{
                  left: "var(--focus-x)",
                  top: square
                    ? `calc(var(--focus-y) + var(--ring-side, 1) * ((var(--focus-b) - var(--focus-t)) / 2 + ${ring.to}px))`
                    : `calc(var(--focus-y) + var(--ring-side, 1) * (var(--focus-r0) + ${ring.to}px))`,
                }}
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
