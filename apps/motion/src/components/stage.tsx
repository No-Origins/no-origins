"use client";

import * as React from "react";
import { agentFrame, agentNumber, agentPose, type AgentPose } from "@no-origins/ui/lib/agent-motion";

import { Card, CardContent } from "@no-origins/ui/components/card";
import { GRID_SPACING, useGridMetrics } from "@no-origins/ui/components/grid";
import { PortalContainer } from "@no-origins/ui/components/portal";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { useCellEnter, useCellMotion } from "@no-origins/ui/hooks/use-cell-motion";
import { paintLoadRing, paintLoadSection, useLoadMotion } from "@no-origins/ui/hooks/use-load-motion";
import {
  cellEnterFrame, cellEnterSettled, cellEnterTotal, cellEntries, cellMotionFrame, cellMotionTotal, cellMoves, cellPresence,
  flowSpots, readCellEnter, readCellMotion, settledFrames, stateOf,
  type CellAxis, type CellEnterFrame, type CellFlow, type CellFrame,
} from "@no-origins/ui/lib/cell-motion";
import { findFreeRect, readingOrder, rectIsValid, rectsOverlap, usedBlock, type GridRect } from "@no-origins/ui/lib/grid-layout";
import { loadFrame, loadPlan, loadSettled, loadTotal, readLoadMotion, type LoadBox, type LoadFrame } from "@no-origins/ui/lib/load-motion";
import { cn } from "@no-origins/ui/lib/utils";

import { FAMILIES, type Family, type Token } from "@/content/families";
import { FocusStage } from "@/components/focus-stage";
import { ModeStage } from "@/components/mode-stage";
import { holdPhase, useStudio, type Phase } from "@/components/studio-context";
import { tokenCss } from "@/lib/tokens";

/**
 * The stage (Motion.md M5): the section at the centre of the grid where a motion plays. It is TRANSPARENT — the field's
 * cells show through it (his, 2026-09-27: "we have to see the grid and how these work on grids") — and what plays on
 * it stands on the field's own cells: the stage starts on a cell, so a specimen placed a whole number of pitches in
 * is on the grid. It carries the family's tokens as inline custom properties, slowed by the tempo (M3) — and those of
 * any family it borrows from, at their decided values, slowed the same, so a borrowed motion keeps time with the rest
 * — and it holds its own surfaces through `PortalContainer` (M8) for the families that will have them.
 */
export function Stage({ family, cols, rows }: { family: Family; cols: number; rows: number }) {
  const studio = useStudio();
  const [el, setEl] = React.useState<HTMLDivElement | null>(null);
  const values = studio.values(family);
  const borrowed = (family.borrows ?? []).flatMap((id) => {
    const from = FAMILIES.find((f) => f.id === id);
    const decided = studio.decided?.[id] ?? {};
    return (from?.tokens ?? []).filter((t) => decided[t.name] !== undefined).map((t): [Token, number | string] => [t, decided[t.name]!]);
  });
  const style = Object.fromEntries([
    ...borrowed.map(([t, v]) => [t.name, tokenCss(t, v, studio.tempo)]),
    ...family.tokens.filter((t) => values[t.name] !== undefined).map((t) => [t.name, tokenCss(t, values[t.name]!, studio.tempo)]),
  ]) as React.CSSProperties;

  return (
    <Slot fill="transparent" inset={0}>
      {/* Focus's blur (M13) and focus mode's cloth (M14) must see the field under the stage, as the portfolio's sees the page: paint containment
          makes the stage its backdrop root in Chrome, and the field's dashes would stay sharp. The slot still clips it. */}
      <div ref={setEl} data-stage={family.id} className={cn("relative size-full", family.id === "focus" || family.id === "mode" ? "[contain:layout]" : "[contain:layout_paint]")} style={style}>
        {el ? <PortalContainer container={el}>{STAGES[family.id]({ family, cols, rows })}</PortalContainer> : null}
      </div>
    </Slot>
  );
}

type StageProps = { family: Family; cols: number; rows: number };

/** A rest at the end of a play on a loop, in ms: long enough to see the line at rest before it grows again. */
const REST = 700;

/** One play of a stage's motion on the timeline: its phases, and how to paint the stage at any ms of it. */
export type Track = { phases: Phase[]; paint: (t: number) => void };

/**
 * Whether the timeline holds this stage (Motion.md M6): playing or paused on its play. While it does, the stage's own
 * motion — the hover, the turning loader — stands still and the timeline paints it. It changes a few times a play,
 * so it is the only thing about the transport a stage renders on.
 */
export function useHeld(family: Family) {
  const { transport } = useStudio();
  return React.useSyncExternalStore(
    transport.subscribe,
    () => {
      const state = transport.get();
      return state.family === family.id && state.mode !== "live";
    },
    () => false,
  );
}

/**
 * Put a stage's play on the timeline: publish its phases whenever `build` makes a new one (the jig moved, the block
 * changed) and, while the timeline holds the stage, paint the frame at the playhead on every move of it — straight to
 * the elements, with no render. Called after the stage's motion hook, so its paint is the last word on a frame.
 */
export function useTrack(family: Family, build: () => Track | null, held: boolean) {
  const { transport } = useStudio();
  const track = React.useRef<Track | null>(null);
  React.useLayoutEffect(() => {
    track.current = build();
    if (track.current) transport.load(family.id, track.current.phases);
  }, [build, transport, family.id]);
  React.useLayoutEffect(() => {
    if (!held) return;
    const paint = () => track.current?.paint(transport.get().t);
    paint();
    return transport.subscribe(paint);
  }, [held, transport]);
  React.useEffect(() => () => transport.release(family.id), [transport, family.id]);
}

// ── movement (Motion.md M9) ───────────────────────────────────────────────────────────────────────────────────

/** A ring's border: the system's hairline, and lime as far as the element is the active one. */
const ringColour = (lit: number) => (lit <= 0 ? "var(--border)" : lit >= 1 ? "var(--lime)" : `color-mix(in oklch, var(--lime) ${lit * 100}%, var(--border))`);

/**
 * The movement specimen, his brief (2026-09-27): elements on the field's cells, each a complete ring holding a small
 * lime dot the size of an icon — the portfolio's marks, half the cell less a step of the spacing scale. Only the active
 * element's ring is lime; the rest wear the system's hairline, as the work menu's other cells do. They fill a block,
 * `across` × `down`, along rows or down columns. Hover one and it grows to two cells along the flow; the elements after
 * it move a cell on, and one at a line's end wraps to the next line, into the spare line the block keeps after its last
 * — the field's own dashed cells, which the transparent stage shows. Their rings stay on their cells, lighting the next
 * and going out on the last, and only their dots travel, shrinking into each border and growing out of it.
 *
 * It plays through `useCellMotion`, the package's, as the portfolio's tech column does: the motion is read off the
 * block with `readCellMotion` as each move starts — here the tokens the stage carries, the jig's values slowed by the
 * tempo; there globals.css's (M2, M3) — and each frame of `cellMotionFrame` is written straight to the elements, so
 * nothing renders per frame. On the timeline, a play is the first element growing, holding and going back — a rest
 * after it on a loop — painted from the same frames at the playhead.
 */
function MoveStage({ family, cols, rows }: StageProps) {
  const studio = useStudio();
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const pitch = cell + gap;
  const dotSize = Math.round(cell / 2) - GRID_SPACING[1];
  const axis: CellAxis = studio.optionOf(family, "flow", "row") === "column" ? "column" : "row";
  // The block — the jig's Columns across and Rows down — and its spare line must fit the stage; what does not is trimmed
  // rather than clipped.
  const set = studio.blockOf(family);
  const across = Math.max(1, Math.min(set.columns, cols - (axis === "column" ? 1 : 0)));
  const down = Math.max(1, Math.min(set.rows, rows - (axis === "row" ? 1 : 0)));
  const count = across * down;
  const flow = React.useMemo<CellFlow>(() => ({ axis, line: axis === "row" ? across : down }), [axis, across, down]);
  // The jig's values and the tempo only say when to read again: the numbers are read off the block itself.
  const tuning = `${JSON.stringify(studio.values(family))}·${studio.tempo}`;
  const { hold, setHold, loop } = studio;
  const held = useHeld(family);

  const [active, setActive] = React.useState<number | null>(null);
  const rings = React.useRef<(HTMLDivElement | null)[]>([]);
  const ghosts = React.useRef<(HTMLDivElement | null)[]>([]);
  const dots = React.useRef<(HTMLDivElement | null)[]>([]);
  const block = React.useRef<HTMLDivElement>(null);

  const statesFor = React.useCallback(
    (which: number | null) => flowSpots(count, which, flow.line).map((spot) => stateOf(spot, flow, cell, gap)),
    [count, flow, cell, gap],
  );

  const paint = React.useCallback(
    (next: CellFrame[]) => {
      const place = (el: HTMLDivElement, box: { l: number; t: number; r: number; b: number }) => {
        el.style.left = `${box.l}px`;
        el.style.top = `${box.t}px`;
        el.style.width = `${box.r - box.l}px`;
        el.style.height = `${box.b - box.t}px`;
      };
      next.forEach((f, i) => {
        const ring = rings.current[i];
        const ghost = ghosts.current[i];
        const dot = dots.current[i];
        if (!ring || !ghost || !dot) return;
        place(ring, f);
        ring.style.opacity = String(f.opacity);
        ring.style.borderColor = ringColour(f.lit);
        if (f.ghost) {
          place(ghost, f.ghost);
          ghost.style.opacity = String(f.ghost.opacity);
          ghost.style.borderColor = ringColour(f.ghost.lit);
          ghost.style.visibility = "visible";
        } else ghost.style.visibility = "hidden";
        dot.style.transform = `translate(${f.x - dotSize / 2}px, ${f.y - dotSize / 2}px) scale(${f.scale})`;
      });
    },
    [dotSize],
  );

  // A new block stands still; every change of the active element is a move. The studio plays under reduced motion too:
  // here the motion is what is being looked at.
  const { draw } = useCellMotion({ block, states: statesFor, active, flow, cell, gap, paint, still: held, always: true });

  // The play on the timeline: grow, hold, back, and a loop's rest. Painted through `draw`, so when the timeline lets
  // go, the block moves on from the frame it was left on.
  const build = React.useCallback((): Track | null => {
    const el = block.current;
    if (!el) return null;
    const motion = readCellMotion(el);
    const grow = cellMoves(statesFor(null), statesFor(0), 0);
    const back = cellMoves(statesFor(0), statesFor(null), 0);
    const g = cellMotionTotal(motion, grow);
    const b = cellMotionTotal(motion, back);
    const phases: Phase[] = [{ label: "grow", ms: g }, holdPhase(hold, setHold), { label: "back", ms: b }];
    if (loop) phases.push({ label: "rest", ms: REST });
    return {
      phases,
      paint: (t) => {
        if (t < g) draw(cellMotionFrame(motion, grow, flow, t, cell, gap));
        else if (t < g + hold) draw(settledFrames(statesFor(0)));
        else if (t < g + hold + b) draw(cellMotionFrame(motion, back, flow, t - g - hold, cell, gap));
        else draw(settledFrames(statesFor(null)));
      },
    };
    // `tuning` says when to read the motion off the block again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuning, statesFor, flow, cell, gap, draw, hold, setHold, loop]);
  useTrack(family, build, held);

  // Which element the pointer is on, by the cell it is over and where the elements are going — not by the element
  // under it, which moves: a block pushed under a still pointer must not hand the hover on.
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (held) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    const col = Math.floor(x / pitch);
    const row = Math.floor(y / pitch);
    if (x - col * pitch > cell || y - row * pitch > cell) return;
    const at = axis === "row" ? row * across + col : col * down + row;
    const hit = flowSpots(count, active, flow.line).findIndex((s) => at >= s.at && at < s.at + s.span);
    if (hit >= 0 && hit !== active) setActive(hit);
  };

  // The block keeps one spare line after its last, for what the growth pushes over.
  const blockCols = axis === "row" ? across : across + 1;
  const blockRows = axis === "row" ? down + 1 : down;
  const offCol = Math.floor((cols - blockCols) / 2);
  const offRow = Math.floor((rows - blockRows) / 2);

  return (
    <div
      ref={block}
      data-block
      className="absolute"
      style={{ left: offCol * pitch, top: offRow * pitch, width: blockCols * pitch - gap, height: blockRows * pitch - gap }}
      onPointerMove={onPointerMove}
      onPointerLeave={() => !held && setActive(null)}
    >
      {Array.from({ length: count }, (_, i) => (
        <React.Fragment key={i}>
          <div ref={(el) => void (ghosts.current[i] = el)} aria-hidden className="absolute rounded-lg border" style={{ visibility: "hidden" }} />
          <div ref={(el) => void (rings.current[i] = el)} aria-hidden className="absolute rounded-lg border" />
          <div ref={(el) => void (dots.current[i] = el)} aria-hidden className="absolute top-0 left-0 rounded-lg bg-lime" style={{ width: dotSize, height: dotSize }} />
        </React.Fragment>
      ))}
    </div>
  );
}

// ── loading (Motion.md M10) ───────────────────────────────────────────────────────────────────────────────────

/**
 * The sample page's sections, in reading order, as cells across × down: the first `sections` of them are packed on the
 * stage, first-fit inside the block the jig's Columns and Rows set, and the page is centred. Eight columns — the
 * family's to start with — make a page of a hero pair, a row of three, two columns and a footer, and seven rows hold
 * all eight; a section that finds no room in a smaller block is left out. They are numbered in reading order, which is
 * the order they open in.
 */
const SECTIONS: readonly [number, number][] = [[4, 2], [4, 2], [2, 1], [2, 1], [4, 1], [3, 3], [5, 3], [8, 1]];

/** The page's loading time on the timeline, in real ms: its range and step, as the hold's is (studio-context `HOLD`). */
const LOADING = { min: 500, max: 6000, step: 100 } as const;


/** A random page's largest section, cells across × down. */
const RANDOM_MAX: readonly [number, number] = [4, 3];

/** Numbers from a seed (mulberry32): the same seed, the same page — so a random layout survives a reload. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A random page of `count` sections, from `seed` (his, the same night: "give me option to randomized layouts of
 * cells"): each a random size up to RANDOM_MAX, put at a random free place that shares an edge with a section already
 * down — so it is one page, not scattered boxes — or as a single cell where its size finds none, inside the band.
 */
function randomPage(count: number, band: number, rows: number, seed: number): GridRect[] {
  const random = seeded(seed);
  const placed: GridRect[] = [];
  const touches = (r: GridRect) =>
    placed.some((p) => rectsOverlap({ ...r, col: r.col - 1, colSpan: r.colSpan + 2 }, p) || rectsOverlap({ ...r, row: r.row - 1, rowSpan: r.rowSpan + 2 }, p));
  for (let i = 0; i < count; i++) {
    const w = 1 + Math.floor(random() * Math.min(RANDOM_MAX[0], band));
    const h = 1 + Math.floor(random() * Math.min(RANDOM_MAX[1], rows));
    for (const [across, down] of [[w, h], [1, 1]] as const) {
      const places: GridRect[] = [];
      for (let row = 1; row + down - 1 <= rows; row++) {
        for (let col = 1; col + across - 1 <= band; col++) {
          const rect = { col, row, colSpan: across, rowSpan: down };
          if (rectIsValid(rect, placed, band, rows) && (!placed.length || touches(rect))) places.push(rect);
        }
      }
      const rect = places[Math.floor(random() * places.length)];
      if (rect) {
        placed.push(rect);
        break;
      }
    }
  }
  return placed;
}

/**
 * The stage's page: the sample, or a random one from `seed`, laid in a block `columns` × `down` cells, trimmed to the
 * stage; centred on the stage and in reading order.
 */
function samplePage(count: number, cols: number, rows: number, columns: number, down: number, seed: number | null): GridRect[] {
  const band = Math.max(1, Math.min(cols, columns));
  const height = Math.max(1, Math.min(rows, down));
  const placed: GridRect[] = [];
  if (seed !== null) placed.push(...randomPage(count, band, height, seed));
  else
    for (const [w, h] of SECTIONS.slice(0, count)) {
      const rect = findFreeRect(placed, band, height, Math.min(w, band), Math.min(h, height));
      if (rect) placed.push(rect);
    }
  const used = usedBlock(placed);
  if (!used) return [];
  const dc = Math.floor((cols - used.colSpan) / 2) - (used.col - 1);
  const dr = Math.floor((rows - used.rowSpan) / 2) - (used.row - 1);
  return readingOrder(placed.map((r) => ({ ...r, col: r.col + dc, row: r.row + dr })));
}

/**
 * The loading specimen, his brief (2026-09-27): while the page loads, one cell a section stands at the stage's centre,
 * a lime ring in dashes — the page folded, its rows kept as rows (his note, the same night) — and turns; when it is
 * ready, the cells travel along rows and columns to their sections, never crossing, and each opens into its section —
 * a `Card` on the stage's cells — in reading order. Nothing is loading here: live, the stage is loading, turning for
 * as long as it is left. A play on the timeline loads the page from the start — turning for the page's loading time,
 * its first phase, dragged there — then makes it ready: it expands and holds.
 *
 * Live, it turns through `useLoadMotion`, the package's, which reads the motion off the stage's tokens — the jig's
 * values slowed by the tempo (M2, M3). On the timeline it is painted from the package's own frames (`loadFrame`) at the
 * playhead. The rings are the specimen's geometry,
 * as movement's are; the sections are the system's own cards.
 */
function LoadStage({ family, cols, rows }: StageProps) {
  const studio = useStudio();
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const pitch = cell + gap;
  const sections = studio.optionOf(family, "sections", 6);
  const load = studio.optionOf(family, "load", 2000);
  const layout = studio.optionOf(family, "layout", "sample");
  const seed = studio.optionOf(family, "seed", 1);
  const { columns, rows: down } = studio.blockOf(family);
  const page = React.useMemo(
    () => samplePage(sections, cols, rows, columns, down, layout === "random" ? seed : null),
    [sections, cols, rows, columns, down, layout, seed],
  );
  const targets = React.useMemo<LoadBox[]>(
    () => page.map((r) => ({ l: (r.col - 1) * pitch, t: (r.row - 1) * pitch, r: (r.col - 1 + r.colSpan) * pitch - gap, b: (r.row - 1 + r.rowSpan) * pitch - gap })),
    [page, pitch, gap],
  );
  const block = React.useRef<HTMLDivElement>(null);
  const rings = React.useRef<(SVGSVGElement | null)[]>([]);
  const cards = React.useRef<(HTMLDivElement | null)[]>([]);

  const paint = React.useCallback(
    (frames: LoadFrame[]) => {
      // The package's painters, the ones the grid's intro paints with (Grid.md D48): the ring, and the card inside it.
      frames.forEach((f, j) => {
        paintLoadRing(rings.current[j] ?? null, f, cell);
        const target = targets[j];
        if (target) paintLoadSection(cards.current[j] ?? null, f, target, cell);
      });
    },
    [cell, targets],
  );

  // The jig's values and the tempo only say when to read again: the numbers are read off the block itself.
  const tuning = `${JSON.stringify(studio.values(family))}·${studio.tempo}`;
  const { hold, setHold, tempo, setOption } = studio;
  const held = useHeld(family);
  // Live, the page is always loading: only the timeline makes it ready.
  useLoadMotion({ block, cols, rows, targets, cell, gap, ready: false, paint, tuning, still: held, always: true });

  // The play on the timeline: loading from the start for the page's loading time, then ready — the expansion, which
  // waits for the turn's rest if the motion says so — then the page held.
  const build = React.useCallback((): Track | null => {
    const el = block.current;
    if (!el) return null;
    const loading = load * tempo;
    const plan = loadPlan(readLoadMotion(el), targets, cols, rows, cell, gap, loading);
    const landed = loadTotal(plan);
    return {
      phases: [
        // How long the page takes to be ready is a setting of the play, not motion: dragged on the timeline, slowed by
        // the tempo with the stage.
        { label: "loading", ms: loading, drag: { ...LOADING, scale: tempo, set: (v) => setOption(family, "load", v) } },
        { label: "expand", ms: landed - loading },
        holdPhase(hold, setHold),
      ],
      paint: (t) => paint(t >= landed ? loadSettled(targets) : loadFrame(plan, t)),
    };
    // `tuning` says when to read the motion off the block again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuning, targets, cols, rows, cell, gap, load, tempo, hold, setHold, setOption, family, paint]);
  useTrack(family, build, held);

  return (
    <div ref={block} data-block className="absolute inset-0">
      {page.map((r, j) => (
        <React.Fragment key={j}>
          <Card
            ref={(el) => void (cards.current[j] = el)}
            size="sm"
            className="absolute justify-center shadow-none"
            style={{ left: (r.col - 1) * pitch, top: (r.row - 1) * pitch, width: r.colSpan * pitch - gap, height: r.rowSpan * pitch - gap, opacity: 0 }}
          >
            {/* A section one cell across has room for its number only, centred. */}
            <CardContent className={cn("flex items-baseline gap-2", r.colSpan > 1 ? "justify-between" : "justify-center px-0")}>
              <Text role="label">{String(j + 1).padStart(2, "0")}</Text>
              {r.colSpan > 1 ? (
                <Text role="caption">
                  {r.colSpan} × {r.rowSpan}
                </Text>
              ) : null}
            </CardContent>
          </Card>
          <svg
            ref={(el) => void (rings.current[j] = el)}
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 origin-center overflow-visible"
            style={{ visibility: "hidden" }}
          >
            <rect x={0.5} y={0.5} fill="none" strokeWidth={1} className="stroke-lime" />
          </svg>
        </React.Fragment>
      ))}
    </div>
  );
}

// ── enter and exit (Motion.md M11) ────────────────────────────────────────────────────────────────────────────

/**
 * The enter and exit specimen, movement's first primitive (his, 2026-09-27: "when there is only one cell I would want to
 * play with enter and exit"): one cell's element, movement's ring and lime dot, on the field's own cell. It stands at
 * the stage's centre, gone. Hover it and it enters: its ring lights over the field's dashed ring and its dot floats up
 * into the cell. Leave and it exits. The ring is the system's hairline, as movement's are when not active. The block's
 * Columns and Rows make more of them, entering and exiting in flow order, movement's stagger apart, and the flow says
 * which way `through` passes.
 *
 * It plays through `useCellEnter`, the package's, which reads the motion off the block (`readCellEnter`): the jig's
 * values, slowed by the tempo (M2, M3). On the timeline a play is enter, hold and exit, with a rest after it on a loop,
 * painted from the same frames at the playhead.
 */
function EnterStage({ family, cols, rows }: StageProps) {
  const studio = useStudio();
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const pitch = cell + gap;
  const dotSize = Math.round(cell / 2) - GRID_SPACING[1];
  const axis: CellAxis = studio.optionOf(family, "flow", "row") === "column" ? "column" : "row";
  // Nothing is pushed over, so the block keeps no spare line; it is trimmed to the stage.
  const set = studio.blockOf(family);
  const across = Math.max(1, Math.min(set.columns, cols));
  const down = Math.max(1, Math.min(set.rows, rows));
  const count = across * down;
  const flow = React.useMemo<CellFlow>(() => ({ axis, line: axis === "row" ? across : down }), [axis, across, down]);
  const states = React.useMemo(() => flowSpots(count, null, flow.line).map((spot) => stateOf(spot, flow, cell, gap)), [count, flow, cell, gap]);
  // The jig's values and the tempo only say when to read again: the numbers are read off the block itself.
  const tuning = `${JSON.stringify(studio.values(family))}·${studio.tempo}`;
  const { hold, setHold, loop } = studio;
  const held = useHeld(family);

  const [present, setPresent] = React.useState(false);
  const rings = React.useRef<(HTMLDivElement | null)[]>([]);
  const dots = React.useRef<(HTMLDivElement | null)[]>([]);
  const block = React.useRef<HTMLDivElement>(null);

  const paint = React.useCallback(
    (next: CellEnterFrame[]) => {
      next.forEach((f, i) => {
        const ring = rings.current[i];
        const dot = dots.current[i];
        if (!ring || !dot) return;
        ring.style.left = `${f.l}px`;
        ring.style.top = `${f.t}px`;
        ring.style.width = `${f.r - f.l}px`;
        ring.style.height = `${f.b - f.t}px`;
        ring.style.opacity = String(f.ring);
        dot.style.transform = `translate(${f.x - dotSize / 2}px, ${f.y - dotSize / 2}px) scale(${f.scale})`;
        dot.style.opacity = String(f.opacity);
      });
    },
    [dotSize],
  );

  const { draw } = useCellEnter({ block, states, present, flow, cell, gap, paint, still: held, always: true });

  // The play on the timeline: enter, hold, exit, and a loop's rest. Painted through `draw`, so when the timeline lets
  // go, the block goes on from the frame it was left on.
  const build = React.useCallback((): Track | null => {
    const el = block.current;
    if (!el) return null;
    const motion = readCellEnter(el);
    const enter = cellEntries(cellPresence(count, false), true);
    const exit = cellEntries(cellPresence(count, true), false);
    const e = cellEnterTotal(motion, enter);
    const x = cellEnterTotal(motion, exit);
    const phases: Phase[] = [{ label: "enter", ms: e }, holdPhase(hold, setHold), { label: "exit", ms: x }];
    if (loop) phases.push({ label: "rest", ms: REST });
    return {
      phases,
      paint: (t) => {
        if (t < e) draw(cellEnterFrame(motion, enter, states, flow, t, cell, gap));
        else if (t < e + hold) draw(cellEnterSettled(motion, states, true, flow, cell, gap));
        else if (t < e + hold + x) draw(cellEnterFrame(motion, exit, states, flow, t - e - hold, cell, gap));
        else draw(cellEnterSettled(motion, states, false, flow, cell, gap));
      },
    };
    // `tuning` says when to read the motion off the block again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuning, count, states, flow, cell, gap, draw, hold, setHold, loop]);
  useTrack(family, build, held);

  const offCol = Math.floor((cols - across) / 2);
  const offRow = Math.floor((rows - down) / 2);

  return (
    <div
      ref={block}
      data-block
      className="absolute"
      style={{ left: offCol * pitch, top: offRow * pitch, width: across * pitch - gap, height: down * pitch - gap }}
      onPointerEnter={() => !held && setPresent(true)}
      onPointerLeave={() => !held && setPresent(false)}
    >
      {Array.from({ length: count }, (_, i) => (
        <React.Fragment key={i}>
          <div ref={(el) => void (rings.current[i] = el)} aria-hidden className="absolute rounded-lg border" style={{ opacity: 0 }} />
          <div
            ref={(el) => void (dots.current[i] = el)}
            aria-hidden
            className="absolute top-0 left-0 rounded-lg bg-lime"
            style={{ width: dotSize, height: dotSize, opacity: 0 }}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

/** Abstract character geometry on the motion bench; controls remain system components (Motion.md M12). */
function AgentStage({ family, cols, rows }: StageProps) {
  const studio = useStudio();
  const metrics = useGridMetrics();
  const cell = metrics?.cell ?? 60;
  const gap = metrics?.gap ?? 12;
  const width = cols * (cell + gap) - gap;
  const height = rows * (cell + gap) - gap;
  const centerX = Math.floor((cols - 2) / 2) * (cell + gap) + (2 * cell + gap) / 2;
  const centerY = Math.floor((rows - 1) / 2) * (cell + gap) + cell / 2;
  const tuning = JSON.stringify(studio.values(family));
  const values = React.useMemo(() => JSON.parse(tuning) as Record<string, string | number>, [tuning]);
  const n = (key: string, fallback: number) => agentNumber(values, key, fallback);

  const body = React.useRef<SVGGElement>(null);
  const eyes = React.useRef<SVGGElement>(null);
  const eyeLeft = React.useRef<SVGCircleElement>(null);
  const eyeRight = React.useRef<SVGCircleElement>(null);
  const held = useHeld(family);
  const { tempo, hold, setHold } = studio;
  const duration = n("duration", 700) * tempo;
  const bodyW = 2 * cell + gap;
  const bodyH = cell;
  const returning = n("return", 700) * tempo;
  const delay = n("delay", 0) * tempo;
  const colour = values["--motion-agent-colour"] ?? "violet";
  const fill = colour === "neutral" ? "var(--foreground)" : `var(--${colour})`;
  const ink = colour === "neutral" ? "var(--background)" : colour === "lime" ? "var(--primary-foreground)" : "var(--secondary-foreground)";
  const paint = React.useCallback((pose: AgentPose) => {
    body.current?.setAttribute("transform", `translate(${centerX + pose.x*cell} ${centerY + pose.y*cell}) rotate(${pose.rotate})`);
    const num = (key: string, fallback: number) => agentNumber(values,key,fallback);
    [eyeLeft.current, eyeRight.current].forEach((eye, i) => {
      if (!eye) return;
      const side = i === 0 ? "left" : "right";
      const r = cell*num(`${side}-size`,.16)/2 * (1+(num(`${side}-grow`,1)-1)*pose.q) * (i===0 ? pose.leftBlink : pose.rightBlink);
      const x = cell*(num(`${side}-x`,i===0 ? -.5 : .5)+num(`${side}-dx`,0)*pose.q);
      const y = cell*(num(`${side}-y`,0)+num(`${side}-dy`,0)*pose.q);
      // Keep the complete circle inside the capsule, even at extreme controls.
      const safeR = Math.max(0,Math.min(r,cell/2));
      const safeY = Math.max(-cell/2+safeR,Math.min(cell/2-safeR,y));
      const maxX = (bodyW-cell)/2 + Math.sqrt(Math.max(0,(cell/2-safeR)**2-safeY**2));
      eye.setAttribute("cx", String(Math.max(-maxX,Math.min(maxX,x))));
      eye.setAttribute("cy", String(safeY));
      eye.setAttribute("r", String(safeR));
    });
  }, [centerX, centerY, cell, bodyW, values]);
  const build = React.useCallback(() => ({
    phases: [{label: "delay",ms: delay}, { label: "outward", ms: duration }, holdPhase(hold, setHold), { label: "return", ms: returning }],
    paint: (t: number) => paint(agentFrame(values, t, duration, hold, returning, delay)),
  }), [delay, duration, returning, hold, setHold, paint, values]);
  useTrack(family, build, held);
  React.useLayoutEffect(() => {
    if (!held) paint(agentPose(values, 1));
  }, [held, paint, values]);
  return <div className="absolute inset-0" style={{ width, height }}>
    <svg data-agent-preview role="img" aria-label="Personal agent animation" viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="absolute inset-0">
      <g ref={body} opacity={n("opacity",1)}>
        <rect x={-bodyW / 2} y={-bodyH / 2} width={bodyW} height={bodyH} rx={bodyH / 2} fill={fill} />
        <g ref={eyes} fill={ink}><circle ref={eyeLeft} /><circle ref={eyeRight} /></g>
      </g>
    </svg>
  </div>;
}

const STAGES: Record<Family["id"], (props: StageProps) => React.ReactNode> = {
  agent: (p) => <AgentStage {...p} />,
  move: (p) => <MoveStage {...p} />,
  load: (p) => <LoadStage {...p} />,
  enter: (p) => <EnterStage {...p} />,
  focus: (p) => <FocusStage {...p} />,
  mode: (p) => <ModeStage {...p} />,
};
