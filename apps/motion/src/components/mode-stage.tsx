"use client";

import * as React from "react";
import { ArrowUpRightIcon, BriefcaseIcon, FocusIcon, LayersIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@no-origins/ui/components/avatar";
import { Button } from "@no-origins/ui/components/button";
import { Card } from "@no-origins/ui/components/card";
import { useGridMetrics } from "@no-origins/ui/components/grid";
import { Text } from "@no-origins/ui/components/text";
import { Toggle } from "@no-origins/ui/components/toggle";
import { useCellMotion } from "@no-origins/ui/hooks/use-cell-motion";
import { useModeMotion, type ModeFrame, type ModeFrames, type ModeTarget } from "@no-origins/ui/hooks/use-mode-motion";
import {
  cellMotionFrame, cellMoves, flowSpots, readCellMotion, settledFrames, stateOf, type CellFlow, type CellFrame,
} from "@no-origins/ui/lib/cell-motion";
import type { FocusBox } from "@no-origins/ui/lib/focus-motion";
import {
  MODE_NO_SHAPE, modeOffAt, modeOffMs, modeOnAt, modeOnMs, modePanel, modeRingEdges, modeRings, modeShape, modeSwitchMs, paintMode,
  paintModePanel, readModeMotion, type ModePanelParts,
} from "@no-origins/ui/lib/mode-motion";
import { cn } from "@no-origins/ui/lib/utils";

import type { Family } from "@/content/families";
import { holdPhase, useStudio, type Phase } from "@/components/studio-context";
import { useHeld, useTrack, type Track } from "@/components/stage";

/**
 * The focus-mode specimen (Motion.md M14): the portfolio's first screen as three verticals on the stage's cells — the
 * profile (the avatar, the name, a note, the address, the résumé), the work (a label and the roles) and the projects (a
 * label and their cards) — every piece a system `Card`, each vertical three columns wide with two between them (his,
 * 2026-09-29). Focus, a `Toggle` on the
 * bottom-right cell, turns the mode on: a panel rises out of the page over the vertical in focus (the first vertical,
 * as reading starts there), its whole line there from the start (his, 2026-09-29: "without that border animation"),
 * the cloth comes from its edges, and the verticals' cells come up at the bottom centre, one a vertical, the one in
 * focus grown to two with its title (the numbered pager's shape, Grid.md D47, and its movement). Press a cell, or any
 * card of another vertical, and the one left plays its steps backward — the cloth goes, the panel sinks back into the
 * page — as that one comes into focus, both at once (his, 2026-09-29: "Instead of sliding the focus container, we
 * should just unfocus while refocusing on the next one"): every vertical has a panel and a cloth of its own. Press
 * Focus again and it goes.
 *
 * It plays through `useModeMotion`, the package's: the motion is read off the stage's tokens — the jig's values,
 * slowed by the tempo (M2, M3). The cloths' layers cover the stage and are clipped to it, so the field's own dashes
 * under the stage blur too; the stage has no paint containment for this family (stage.tsx). On the timeline a play is
 * on, hold, a switch to the next vertical, hold, a switch to the third, hold, off, painted from the package's own
 * `modeOnAt` and `modeOffAt` at the playhead — a switch is both at once, the one left off and the next on.
 */

type Kind = "avatar" | "name" | "note" | "address" | "resume" | "label" | "role" | "project";
type Piece = { kind: Kind; words?: [string, string?]; icon?: React.ReactNode; h: number | "rest" };

/** The three verticals, each a stack of pieces down its cells; what a smaller block has no room for is left out. */
const VERTICALS: { title: string; pieces: Piece[] }[] = [
  {
    title: "Profile",
    pieces: [
      { kind: "avatar", h: 2 },
      { kind: "name", words: ["Your name", "What you do"], h: 1 },
      { kind: "note", h: "rest" },
      { kind: "address", words: ["name@no-origins.com"], h: 1 },
      { kind: "resume", h: 1 },
    ],
  },
  {
    title: "Work",
    pieces: [
      { kind: "label", words: ["Work"], icon: <BriefcaseIcon />, h: 1 },
      { kind: "role", words: ["Senior engineer", "Studio · 2025 —"], h: 1 },
      { kind: "role", words: ["Engineer II", "Platform · 2023"], h: 1 },
      { kind: "role", words: ["Engineer", "Product · 2022"], h: 1 },
      { kind: "role", words: ["Intern", "Agency · 2020"], h: 1 },
      { kind: "role", words: ["Freelance", "Clients · 2019"], h: 1 },
      { kind: "role", words: ["Student", "University · 2016"], h: 1 },
    ],
  },
  {
    title: "Projects",
    pieces: [
      { kind: "label", words: ["Projects"], icon: <LayersIcon />, h: 1 },
      { kind: "project", words: ["Motion studio", "Jigs for the system"], h: 2 },
      { kind: "project", words: ["The grid", "Cells that decide"], h: 2 },
      { kind: "project", words: ["Agents", "A harness on the BEAM"], h: 2 },
    ],
  },
];

/** A rest at the end of a play on a loop, in ms, as the other stages have. */
const REST = 700;

type Placed = { v: number; piece: Piece; col: number; row: number; w: number; h: number };
type ModePage = { placed: Placed[]; bar: { col: number; row: number }; toggle: { col: number; row: number } };

/** Each vertical's width and the air between two, in columns (his, 2026-09-29: "focus mode should have 2 columns
 *  between gap between one vertical and each vertical should have 3 columns"). */
const VERTICAL = 3;
const AIR = 2;

/**
 * The page on the stage, in its cells, 0-based: the block — the jig's Columns and Rows, trimmed to the stage — centred,
 * three verticals in it three columns wide with two columns of air between them, and a row of room over and under
 * them. What the block has past the verticals is margin, split either side, so the panel's margin and its lift stay on
 * the stage, which clips like every slot: a column each side at the default fifteen. A block narrower than their
 * thirteen keeps the verticals at three and gives up the air first; one narrower than nine narrows the verticals. The
 * switcher's four cells (three, one grown) are at the centre of the STAGE's bottom row, and Focus on that row under
 * the block's last column: never right under the verticals where the stage has room below them (his, 2026-09-28:
 * "move the one, two, three options to the bottom row. It's obstructing the view").
 */
function modePage(cols: number, rows: number, columns: number, down: number): ModePage {
  const across = Math.max(1, Math.min(cols, columns));
  const tall = Math.max(3, Math.min(rows, down));
  const offC = Math.floor((cols - across) / 2);
  const offR = Math.floor((rows - tall) / 2);
  const v = across >= 3 * VERTICAL ? VERTICAL : Math.max(1, Math.floor(across / 3));
  const air = Math.max(0, Math.min(AIR, Math.floor((across - 3 * v) / 2)));
  const start = offC + Math.floor((across - (3 * v + 2 * air)) / 2);
  const top = offR + 1;
  const height = Math.max(1, tall - 2);
  const placed: Placed[] = [];
  VERTICALS.forEach(({ pieces }, k) => {
    const size = (p: Piece) => (p.h === "rest" ? 0 : Math.min(p.h, v >= 2 ? p.h : 1));
    const fixed = pieces.reduce((sum, p) => sum + size(p), 0);
    let row = top;
    for (const piece of pieces) {
      const h = piece.h === "rest" ? height - fixed : size(piece);
      // The note needs two rows; a one-row remainder clips its two paragraphs.
      if (piece.kind === "note" && (h < 2 || v < 2)) continue;
      if (h <= 0 || row + h > top + height) continue;
      placed.push({ v: k, piece, col: start + k * (v + air), row, w: v, h });
      row += h;
    }
  });
  const barRow = rows - 1;
  const toggleCol = offC + across - 1;
  const barCol = Math.max(offC, Math.min(offC + Math.floor((across - 4) / 2), toggleCol - 4));
  return { placed, bar: { col: barCol, row: barRow }, toggle: { col: toggleCol, row: barRow } };
}

/** What a piece shows: the system's own components, as the portfolio's cards are made. */
function PieceBody({ piece, side }: { piece: Piece; side: number }) {
  const { kind, words, icon } = piece;
  switch (kind) {
    case "avatar":
      return (
        <Avatar style={{ width: side - 24, height: side - 24 }}>
          <AvatarFallback>YN</AvatarFallback>
        </Avatar>
      );
    case "note":
      return (
        <div className="flex min-w-0 flex-col gap-2 px-4">
          <Text role="caption">Seven seconds to judge the page.</Text>
          <Text role="caption">Focus mode takes one vertical at a time.</Text>
        </div>
      );
    case "resume":
      return (
        <Button size="sm" tabIndex={-1}>
          Résumé <ArrowUpRightIcon data-icon="inline-end" />
        </Button>
      );
    case "label":
      return (
        <div className="flex min-w-0 items-center justify-center gap-2 px-4 [&_svg]:size-4">
          {icon}
          <Text as="span" role="label" className="truncate">{words?.[0]}</Text>
        </div>
      );
    case "address":
      return (
        <Text as="span" role="caption" align="center" className="truncate px-3">
          {words?.[0]}
        </Text>
      );
    default:
      return (
        <div className="flex min-w-0 flex-col px-4">
          <Text as="span" role={kind === "project" ? "heading" : "body"} className="truncate">{words?.[0]}</Text>
          <Text as="span" role="caption" className="truncate">{words?.[1]}</Text>
        </div>
      );
  }
}

type StageProps = { family: Family; cols: number; rows: number };

/** `to` as far as a cell is the one grown, over `from`: mixed, never translucent (grid-pager.tsx). */
const towards = (to: string, from: string, lit: number) =>
  lit <= 0 ? from : lit >= 1 ? to : `color-mix(in oklch, ${to} ${lit * 100}%, ${from})`;

const clamp01 = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t);

export function ModeStage({ family, cols, rows }: StageProps) {
  const studio = useStudio();
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const pitch = cell + gap;
  const radius = cell / 2;
  const { columns, rows: down } = studio.blockOf(family);
  const page = React.useMemo(() => modePage(cols, rows, columns, down), [cols, rows, columns, down]);
  const px = React.useCallback(
    (col: number, row: number, w: number, h: number): FocusBox => ({ l: col * pitch, t: row * pitch, r: (col + w) * pitch - gap, b: (row + h) * pitch - gap }),
    [pitch, gap],
  );
  // Each vertical's box: round its pieces.
  const verticals = React.useMemo(
    () =>
      VERTICALS.map((_, k) => {
        const boxes = page.placed.filter((p) => p.v === k).map((p) => px(p.col, p.row, p.w, p.h));
        if (!boxes.length) return null;
        return { l: Math.min(...boxes.map((b) => b.l)), t: Math.min(...boxes.map((b) => b.t)), r: Math.max(...boxes.map((b) => b.r)), b: Math.max(...boxes.map((b) => b.b)) };
      }),
    [page, px],
  );
  const showRings = studio.optionOf(family, "rings", false);
  const startOn = studio.optionOf(family, "vertical", 1);
  // The jig's values and the tempo only say when to read again: the numbers are read off the stage itself.
  const tuning = `${JSON.stringify(studio.values(family))}·${studio.tempo}`;
  const { hold, setHold, loop } = studio;
  const held = useHeld(family);

  const [on, setOn] = React.useState(false);
  const [active, setActive] = React.useState(0);

  const surface = React.useRef<HTMLDivElement>(null);
  // One cloth and one panel a vertical, by its key: the panel's SVG, its line, its shadow and the shadow's blur and
  // cut-out (`paintModePanel`).
  const cloths = React.useRef(new Map<string, HTMLDivElement | null>());
  const panels = React.useRef(new Map<string, ModePanelParts>());
  const partsOf = (key: string) => {
    let parts = panels.current.get(key);
    if (!parts) panels.current.set(key, (parts = { panel: null, line: null, shadow: null, blur: null, cut: null }));
    return parts;
  };
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const groups = React.useRef<(HTMLDivElement | null)[]>([]);
  const bar = React.useRef<HTMLDivElement>(null);

  // ── the switcher: the verticals' cells, the one in focus grown to two with its title, playing movement ──────────
  const switcher = React.useRef<HTMLDivElement>(null);
  const rings = React.useRef<(HTMLButtonElement | null)[]>([]);
  const numbers = React.useRef<(HTMLElement | null)[]>([]);
  const titles = React.useRef<(HTMLElement | null)[]>([]);
  const flow = React.useMemo<CellFlow>(() => ({ axis: "row", line: VERTICALS.length + 1 }), []);
  const statesFor = React.useCallback(
    (which: number | null) => flowSpots(VERTICALS.length, which, flow.line).map((spot) => stateOf(spot, flow, cell, gap)),
    [flow, cell, gap],
  );
  const paintCells = React.useCallback((frames: CellFrame[]) => {
    frames.forEach((f, i) => {
      const ring = rings.current[i];
      const number = numbers.current[i];
      const title = titles.current[i];
      if (!ring || !number || !title) return;
      ring.style.left = `${f.l}px`;
      ring.style.top = `${f.t}px`;
      ring.style.width = `${f.r - f.l}px`;
      ring.style.height = `${f.b - f.t}px`;
      ring.style.setProperty("--cell-fill", towards("var(--primary)", "var(--card)", f.lit));
      ring.style.setProperty("--cell-line", towards("var(--primary)", "var(--border)", f.lit));
      number.style.transform = `translate(${f.x}px, ${f.y}px) translate(-50%, -50%) scale(${f.scale})`;
      number.style.color = towards("var(--primary-foreground)", "var(--foreground)", f.lit);
      title.style.opacity = String(f.lit);
      title.style.transform = `translateX(${f.x - f.l + 10}px)`;
    });
  }, []);
  const { draw: drawCells } = useCellMotion({ block: switcher, states: statesFor, active, flow, cell, gap, paint: paintCells, still: held, always: true });

  // ── what the mode moves that is the stage's own: the panels, the verticals under them, the bar ──────────────
  const paintFrame = React.useCallback(
    ({ frames, lifted }: ModeFrames) => {
      let out = 0;
      for (const f of frames) {
        // A panel shows while it is off the page, and the cells come up as the panel in focus rises.
        const up = f.shown ? f.p : 0;
        const parts = panels.current.get(f.key);
        if (parts) paintModePanel(parts, f.shape, up > 0 ? 1 : 0);
        const cloth = cloths.current.get(f.key);
        if (cloth && f.shown) cloth.style.setProperty("--ring-side", (f.panel.l + f.panel.r) / 2 < cloth.clientWidth / 2 ? "1" : "-1");
        out = Math.max(out, up);
      }
      // The verticals never move: only the panels come out, and what each holds keeps its level and its size (his,
      // 2026-09-28). The vertical in focus stands over the cloths once its cloth is the only one out; the one left is
      // under them again at once, its own cloth's hole keeping it sharp while the next one's comes over it.
      groups.current.forEach((el, k) => {
        el?.toggleAttribute("data-mode-lift", String(k) === lifted);
      });
      const b = bar.current;
      if (b) b.style.opacity = String(clamp01(out));
    },
    [],
  );

  const target = React.useMemo<ModeTarget | null>(() => {
    const box = verticals[active];
    return box ? { key: String(active), box } : null;
  }, [verticals, active]);
  const { motion, layers } = useModeMotion({ surface, cloths, on, target, pitch, radius, paint: paintFrame, tuning, still: held, always: true });

  // As on the portfolio's focus: while the mode is on, the grid's pointer lights no cell under the cloth (Grid.md D34).
  React.useEffect(() => {
    const grid = surface.current?.closest('[data-slot="grid"]');
    grid?.toggleAttribute("data-cursor-still", on || held);
    return () => grid?.removeAttribute("data-cursor-still");
  }, [on, held]);

  // The play on the timeline: on over the vertical it starts on, hold, a switch to the next — the one left going off and
  // the next coming on, from the same moment — hold, a switch to the third, hold, off, and a loop's rest.
  const build = React.useCallback((): Track | null => {
    const el = surface.current;
    const order = [0, 1, 2].map((k) => (Math.max(0, startOn - 1) + k) % VERTICALS.length);
    const boxes = order.map((k) => verticals[k]);
    if (!el || boxes.some((b) => !b)) return null;
    const mo = readModeMotion(el);
    const [a, b, c] = boxes as FocusBox[];
    const onMs = modeOnMs(mo);
    const offMs = modeOffMs(mo);
    const swap = modeSwitchMs(mo);
    const phases: Phase[] = [
      { label: "on", ms: onMs },
      holdPhase(hold, setHold),
      { label: "switch", ms: swap },
      holdPhase(hold, setHold),
      { label: "switch", ms: swap },
      holdPhase(hold, setHold),
      { label: "off", ms: offMs },
    ];
    if (loop) phases.push({ label: "rest", ms: REST });
    const t1 = onMs;
    const t2 = t1 + hold;
    const t3 = t2 + swap;
    const t4 = t3 + hold;
    const t5 = t4 + swap;
    const t6 = t5 + hold;
    const t7 = t6 + offMs;
    const keys = order.map(String);
    const block = switcher.current;
    const cells = block ? readCellMotion(block) : null;
    return {
      phases,
      paint: (t) => {
        /** A vertical's panel and cloth at a moment: its box, its rise and its cloth, and whether it is the one in focus. */
        const at = (key: string, box: FocusBox, p: number, cloth: number, on: boolean): ModeFrame => {
          const round = modePanel(box, mo);
          return { key, panel: round, p, shape: modeShape(mo, { panel: round, p }, radius), c: cloth, on, shown: p > 0 || cloth > 0 };
        };
        const coming = (key: string, box: FocusBox, u: number) => {
          const f = modeOnAt(mo, u);
          return at(key, box, f.p, f.c, true);
        };
        // Going is its way in backward: the cloth goes, then the panel sinks back into the page.
        const going = (key: string, box: FocusBox, u: number) => {
          const f = modeOffAt(mo, u);
          return at(key, box, f.p, f.c, false);
        };
        const up = (key: string, box: FocusBox) => at(key, box, 1, 1, true);
        const playing: ModeFrame[] =
          t <= 0 ? []
          : t < t1 ? [coming(keys[0]!, a, t)]
          : t < t2 ? [up(keys[0]!, a)]
          : t < t3 ? [going(keys[0]!, a, t - t2), coming(keys[1]!, b, t - t2)]
          : t < t4 ? [up(keys[1]!, b)]
          : t < t5 ? [going(keys[1]!, b, t - t4), coming(keys[2]!, c, t - t4)]
          : t < t6 ? [up(keys[2]!, c)]
          : t < t7 ? [going(keys[2]!, c, t - t6)]
          : [];
        const frames = [...cloths.current.keys()].map(
          (key) => playing.find((f) => f.key === key) ?? { key, panel: MODE_NO_SHAPE.hole, p: 0, shape: MODE_NO_SHAPE, c: 0, on: false, shown: false },
        );
        for (const f of frames) {
          const cloth = cloths.current.get(f.key);
          if (cloth) paintMode(cloth, mo, { hole: f.shape.hole, c: f.shown ? f.c : 0 }, radius);
        }
        const shown = frames.filter((f) => f.shown);
        paintFrame({ frames, lifted: shown.length === 1 ? shown[0]!.key : null });
        // The cells move as the switch sets off, by movement, from the vertical left to the next.
        const move = t >= t2 && t < t3 ? ([0, 1, t - t2] as const) : t >= t4 && t < t5 ? ([1, 2, t - t4] as const) : null;
        if (move && cells) drawCells(cellMotionFrame(cells, cellMoves(statesFor(order[move[0]]!), statesFor(order[move[1]]!), order[move[1]]!), flow, move[2], cell, gap));
        else {
          const now = t < t3 ? 0 : t < t5 ? 1 : 2;
          drawCells(settledFrames(statesFor(order[now]!)));
        }
      },
    };
    // `tuning` says when to read the motion off the stage again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuning, verticals, startOn, hold, setHold, loop, paintFrame, radius, drawCells, statesFor, flow, cell, gap]);
  useTrack(family, build, held);

  // A card of another vertical, pressed while the mode is on, takes the focus there.
  const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!on || held) return;
    const el = (event.target as Element).closest<HTMLElement>("[data-mode-vertical]");
    if (el) setActive(Number(el.dataset.modeVertical));
  };

  const rest = statesFor(active);
  // Each ring's edges on the four sides of the hole, fitted to the stage as the cloth is.
  const ringEdges = motion ? modeRings(motion, pitch).flatMap((r) => (r.share ? [{ level: r.level, ...modeRingEdges(motion, pitch, r.share[1]) }] : [])) : [];

  return (
    <div data-block className="absolute inset-0" onClick={onClick}>
      {VERTICALS.map((vertical, k) => (
        <div
          key={k}
          ref={(el) => void (groups.current[k] = el)}
          data-mode-vertical={k}
          className="pointer-events-none absolute inset-0 data-mode-lift:z-12"
        >
          {page.placed
            .filter((p) => p.v === k)
            .map((p, j) => (
              <Card
                key={j}
                size="sm"
                aria-label={j === 0 ? vertical.title : undefined}
                className={cn(
                  "pointer-events-auto absolute justify-center gap-0 py-0 shadow-none",
                  p.piece.kind === "avatar" || p.piece.kind === "resume" ? "items-center" : "",
                )}
                style={{ left: p.col * pitch, top: p.row * pitch, width: p.w * pitch - gap, height: p.h * pitch - gap }}
              >
                <PieceBody piece={p.piece} side={Math.min(p.w, p.h) * pitch - gap} />
              </Card>
            ))}
        </div>
      ))}

      {/* The cloths, one a vertical, over the page and under the vertical in focus, the next over the one before; over
          each its rings, sharp. Nothing round the layers may carry an opacity, a filter or a mask (mode-motion.ts): a
          cloth only shows or hides, and what holds them neither. */}
      <div ref={surface} aria-hidden data-mode-surface className="pointer-events-none absolute inset-0 z-10">
        {VERTICALS.map((_, k) => (
          <div key={k} ref={(el) => void cloths.current.set(String(k), el)} data-mode-cloth={k} className="absolute inset-0" style={{ visibility: "hidden" }}>
            {layers.map((style, i) => (
              <div key={i} className="absolute inset-0" style={style} />
            ))}
            {showRings ? (
              <>
                <svg className="absolute inset-0 size-full overflow-visible">
                  {ringEdges.map((ring, i) => (
                    <rect
                      key={i}
                      className="fill-none stroke-lime"
                      strokeWidth={1}
                      strokeDasharray="3 5"
                      style={{
                        x: ring.l,
                        y: ring.t,
                        width: `calc(${ring.r} - ${ring.l})`,
                        height: `calc(${ring.b} - ${ring.t})`,
                        rx: `${radius}px`,
                      } as React.CSSProperties}
                    />
                  ))}
                </svg>
                {ringEdges.map((ring, i) => (
                  <Text
                    key={i}
                    as="span"
                    role="mono"
                    tone="lime"
                    className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-background px-1"
                    style={{
                      left: `calc((${ring.l} + ${ring.r}) / 2 + var(--ring-side, 1) * (${ring.r} - ${ring.l}) / 2)`,
                      top: `calc((var(--mode-t) + var(--mode-b)) / 2)`,
                    }}
                  >
                    {ring.level.toFixed(1)}px
                  </Text>
                ))}
              </>
            ) : null}
          </div>
        ))}
      </div>

      {/* The panels, one a vertical: each a see-through frame in the secondary colour, lifted, over everything on the
          page — the cloths and the vertical it holds too — and under the bar. A shadow is cut out where its panel is,
          so nothing under it is darkened. */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 z-13 size-full overflow-visible">
        {VERTICALS.map((_, k) => {
          const key = String(k);
          return (
            <React.Fragment key={k}>
              <defs>
                <filter id={`${uid}-${k}-blur`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur ref={(el) => void (partsOf(key).blur = el)} stdDeviation="0" />
                </filter>
                <mask id={`${uid}-${k}-cut`} maskUnits="userSpaceOnUse" x="-4000" y="-4000" width="8000" height="8000">
                  <rect x="-4000" y="-4000" width="8000" height="8000" fill="white" />
                  <path ref={(el) => void (partsOf(key).cut = el)} fill="black" />
                </mask>
              </defs>
              {/* The panel's colour, the secondary: its line fills with it and its shadow is mixed from it. */}
              <g ref={(el) => void (partsOf(key).panel = el)} className="text-secondary" opacity={0}>
                <path ref={(el) => void (partsOf(key).shadow = el)} mask={`url(#${uid}-${k}-cut)`} filter={`url(#${uid}-${k}-blur)`} />
                {/* Its line, all the way round: a band filled inside the outline, fine on the page and the Border
                    token's wide once up, drawn each frame (`paintModePanel`). */}
                <path ref={(el) => void (partsOf(key).line = el)} className="fill-current stroke-none" fillRule="evenodd" />
              </g>
            </React.Fragment>
          );
        })}
      </svg>

      {/* The bar: the verticals' cells at the bottom centre, the vertical in focus grown to two with its title. */}
      <div
        ref={bar}
        className={cn("absolute z-20", on ? "" : "pointer-events-none")}
        style={{ left: page.bar.col * pitch, top: page.bar.row * pitch, width: 4 * pitch - gap, height: cell, opacity: 0 }}
      >
        <div ref={switcher} role="group" aria-label="Verticals" className="relative size-full">
          {rest.map((at, i) => (
            <Button
              key={i}
              ref={(el) => void (rings.current[i] = el)}
              variant="outline"
              aria-label={`${i + 1}: ${VERTICALS[i]!.title}`}
              aria-current={i === active ? "true" : undefined}
              tabIndex={on ? 0 : -1}
              onClick={(event) => {
                event.stopPropagation();
                if (!held) setActive(i);
              }}
              // The motion writes the box, the fill and the line every frame, so nothing here may transition them.
              className="absolute h-auto min-w-0 overflow-hidden border-(--cell-line) bg-(--cell-fill) p-0 font-normal tracking-normal normal-case transition-none hover:bg-(--cell-fill)"
              style={{
                left: at.l, top: at.t, width: at.r - at.l, height: at.b - at.t,
                "--cell-fill": towards("var(--primary)", "var(--card)", at.lit),
                "--cell-line": towards("var(--primary)", "var(--border)", at.lit),
              } as React.CSSProperties}
            >
              <span
                ref={(el) => void (titles.current[i] = el)}
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center"
                style={{ opacity: at.lit, transform: `translateX(${at.x - at.l + 10}px)` }}
              >
                <Text as="span" className="truncate whitespace-nowrap text-primary-foreground">{VERTICALS[i]!.title}</Text>
              </span>
            </Button>
          ))}
          {rest.map((at, i) => (
            <Text
              key={`n-${i}`}
              as="span"
              ref={(el: HTMLElement | null) => void (numbers.current[i] = el)}
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 font-semibold whitespace-nowrap tabular-nums"
              style={{ transform: `translate(${at.x}px, ${at.y}px) translate(-50%, -50%)`, color: towards("var(--primary-foreground)", "var(--foreground)", at.lit) }}
            >
              {i + 1}
            </Text>
          ))}
        </div>
      </div>

      {/* Focus, on the bottom-right cell: never under the cloth. */}
      <Toggle
        variant="outline"
        pressed={on}
        onPressedChange={(next) => !held && setOn(next)}
        aria-label="Focus mode"
        className="absolute z-20 min-w-0 bg-card p-0 aria-pressed:border-secondary aria-pressed:bg-secondary aria-pressed:text-secondary-foreground [&_svg:not([class*='size-'])]:size-5"
        style={{ left: page.toggle.col * pitch, top: page.toggle.row * pitch, width: cell, height: cell }}
      >
        <FocusIcon />
      </Toggle>
    </div>
  );
}
