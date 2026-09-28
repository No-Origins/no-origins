"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from "react";
import {
  siApollographql, siElixir, siExpress, siFlutter, siGooglecloud, siGraphql, siJavascript, siLangchain, siLanggraph,
  siMongodb, siNestjs, siNextdotjs, siNodedotjs, siOllama, siPostgresql, siProsemirror, siPython, siReact, siRedux,
  siRust, siShadcnui, siTailwindcss, siTypescript, type SimpleIcon,
} from "simple-icons";

import { GRID_SPACING, useGridMetrics } from "@no-origins/ui/components/grid";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { Toggle } from "@no-origins/ui/components/toggle";
import { useCellMotion } from "@no-origins/ui/hooks/use-cell-motion";
import { flowSpots, stateOf, type CellFlow, type CellFrame } from "@no-origins/ui/lib/cell-motion";

import { SectionCell, type SectionLabel } from "@/components/cards";
import { ICON_GAP } from "@/components/profile-card";
import { ACTIVE_FILL } from "@/components/profile-work";

/**
 * What I work with, as marks, in the order `STACK` in `resume.ts` has them: the languages, then the full stack, then
 * the LLM tools, each with the name the résumé gives it (Tailwind, Postgres, GCP), which is what the active mark
 * spells out. Only what simple-icons (CC0) draws — 23 of the 35. There is no mark there for Zustand, Jotai, gRPC,
 * Tiptap, Auth.js, AWS, AWS CDK, IBM, AutoGen, Atomic Agents or OpenAI, and SQL is not MySQL's; they come in as he
 * gives their marks.
 */
const TECH = (
  [
    [siJavascript, "JavaScript"], [siTypescript, "TypeScript"], [siPython, "Python"], [siElixir, "Elixir"], [siRust, "Rust"],
    [siReact, "React"], [siNextdotjs, "Next.js"], [siTailwindcss, "Tailwind"], [siShadcnui, "shadcn"], [siRedux, "Redux"],
    [siNodedotjs, "Node.js"], [siExpress, "Express"], [siNestjs, "NestJS"], [siGraphql, "GraphQL"], [siApollographql, "Apollo"],
    [siProsemirror, "ProseMirror"], [siMongodb, "MongoDB"], [siPostgresql, "Postgres"], [siGooglecloud, "GCP"], [siFlutter, "Flutter"],
    [siLangchain, "LangChain"], [siLanggraph, "LangGraph"], [siOllama, "Ollama"],
  ] as [SimpleIcon, string][]
).map(([icon, name]) => ({ icon, name, brand: brand(icon.hex) }));

/** A brand colour dark enough to vanish on the dark theme (Next.js, Express, Rust, shadcn, Ollama are black) is not used. */
function brand(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.2 ? `#${hex}` : undefined;
}

/** The air after an active mark's name, inside the pill's round end: a step of the spacing scale, as the work's. */
const PAD = GRID_SPACING[3];

/**
 * The tech column, left of the first screen's centre (Portfolio.md P4, amended 2026-09-26, his: "there will be left
 * side section where each cell will be filled with logos of the tools, languages, any tech that I use or used"). One
 * mark on each cell of the column, straight on the field, no tile — the way the company marks stood on the Work screen
 * — in reading order, at the company marks' size (half the cell less a step of the spacing scale), all the text's
 * colour, so the column reads quiet beside the profile. Cells past the last mark are the field's own. Beside the centre
 * it is five cells wide, as the work is, and as tall as the centre; on a narrower field it goes under the centre and
 * the work, as wide as the centre.
 *
 * **Hovered or selected, a mark grows to spell out its name, and the marks after it move on** (his, 2026-09-27: "use
 * this motion in the technical stack vertical. Whenever I hover/select a logo, it should expand to name the library or
 * tool"). That motion is movement (Motion.md M9), his pick in the motion studio, played by the package's
 * `useCellMotion` on the tokens in globals.css: the marks flow along the rows, the active one takes as many whole cells
 * as its mark and name need, and one pushed past a row's end goes out of it and comes in at the start of the next.
 * Only the marks travel. The active mark's pill is ringed in lime over the work's lime wash (`ACTIVE_FILL`), its name
 * lime on dark and the ink on light, its mark in its brand's colour (his pick, when it was a hover); the rest have no
 * ring, as before. Hover is read from the cell under the pointer, never the mark, which moves (the studio's rule); it
 * lets go when the pointer leaves the column. A click or a tap selects a mark — it stays grown with the pointer gone —
 * and pressing it again lets it go. Every mark is a stop, in reading order (Grid.md D45), and Space or Enter selects
 * it as a click does; focus alone does not grow it, since the marks it pushed on would move under the keys — the one
 * pushed to the next row came back to a row Tab had passed, and was skipped.
 *
 * The column keeps a spare row under its marks for what a grown one pushes over (`TECH` in site.tsx); where it has
 * none, it shows only as many marks as fit with any one grown, rather than cut one off (P5).
 *
 * A `lead` takes the first row, centred on it, and the marks flow on from the row under it — the section's label, its
 * icon and its word (his, 2026-09-27: "make them part of the top first cell within their section", then "expand them
 * to also show the label of the section name", then "move all the cards or boxes that are in the row of the label …
 * to the next row"). Nothing flows into its row. With one row, the label goes and the marks keep it (P5).
 */
/**
 * The most rows the column uses beside the block, `cols` wide: its label's, its marks' at rest, and one for what a
 * grown mark pushes over, which is the air under it (his, 2026-09-28: "there are three rows empty between technical
 * skills and art skills. Reduce it to one"; `growMost`).
 */
export const techRowsMost = (cols: number) => 1 + Math.ceil(TECH.length / Math.max(1, cols)) + 1;

export function ProfileTech({ cols, rows, lead }: { cols: number; rows: number; lead?: SectionLabel }) {
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const pitch = cell + gap;
  const mark = Math.round(cell / 2) - GRID_SPACING[1];

  const block = useRef<HTMLDivElement>(null);
  const rings = useRef<(HTMLButtonElement | null)[]>([]);
  const ghosts = useRef<(HTMLDivElement | null)[]>([]);
  const dots = useRef<(SVGSVGElement | null)[]>([]);
  const names = useRef<(HTMLSpanElement | null)[]>([]);

  const grows = useNameCells(block, { cell, gap, mark, cols });
  const grow = useCallback((i: number | null) => (i === null ? 1 : (grows[i] ?? 2)), [grows]);
  // The label's row, as cells the flow skips; the label is the whole row.
  const labelled = !!lead && rows > 1;
  const skip = labelled ? cols : 0;
  const count = useMemo(() => fitting(TECH.length, cols, cols * rows, grow, skip), [cols, rows, grow, skip]);
  const flow = useMemo<CellFlow>(() => ({ axis: "row", line: cols }), [cols]);
  // The marks' spots with `which` grown, after the lead's row: the lead flows first, cells that never grow.
  const spotsFor = useCallback(
    (which: number | null) => flowSpots(count + skip, which === null ? null : which + skip, cols, grow(which)).slice(skip),
    [count, skip, cols, grow],
  );
  const statesFor = useCallback((which: number | null) => spotsFor(which).map((spot) => stateOf(spot, flow, cell, gap)), [spotsFor, flow, cell, gap]);

  // The pointer's mark (mouse and pen), else the one pressed.
  const [hover, setHover] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const chosen = hover ?? picked;
  const active = chosen !== null && chosen < count ? chosen : null;

  const paint = useCallback(
    (frames: CellFrame[]) => {
      frames.forEach((f, i) => {
        const ring = rings.current[i];
        const ghost = ghosts.current[i];
        const dot = dots.current[i];
        const name = names.current[i];
        if (!ring || !ghost || !dot || !name) return;
        place(ring, f);
        ring.style.opacity = String(f.opacity);
        // Through a custom property, so the Toggle's own focus border (`focus-visible:border-ring`) still wins over it.
        ring.style.setProperty("--mark-ring", over("var(--lime)", f.lit));
        ring.style.backgroundColor = over(ACTIVE_FILL, f.lit);
        if (f.ghost) {
          place(ghost, f.ghost);
          ghost.style.opacity = String(f.ghost.opacity);
          ghost.style.borderColor = over("var(--lime)", f.ghost.lit);
          ghost.style.backgroundColor = over(ACTIVE_FILL, f.ghost.lit);
          ghost.style.visibility = "visible";
        } else ghost.style.visibility = "hidden";
        dot.style.transform = `translate(${f.x - mark / 2}px, ${f.y - mark / 2}px) scale(${f.scale})`;
        // Faded into the page with the rest of the column while its box is inactive (Portfolio.md P16), which the
        // tokens cannot do for a brand's own colour.
        const tint = TECH[i].brand && `color-mix(in oklch, ${TECH[i].brand} calc(var(--box-keep, 1) * 100%), var(--background))`;
        dot.style.color = !tint || f.lit <= 0 ? "" : f.lit >= 1 ? tint : `color-mix(in oklch, ${tint} ${f.lit * 100}%, var(--foreground))`;
        // The name rides a step after its mark, inside the ring (less its pixel of border), which clips it as it grows.
        name.style.opacity = String(f.lit);
        name.style.transform = `translateX(${f.x - f.l - 1 + mark / 2 + ICON_GAP}px)`;
      });
    },
    [mark],
  );

  useCellMotion({ block, states: statesFor, active, flow, cell, gap, paint });

  // Which mark the pointer is on, by the cell it is over and where the marks are going — not by the mark under it,
  // which moves: a row pushed under a still pointer must not hand the hover on. A hole a grown mark left, or the
  // gutter, keeps the hover it had.
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    const col = Math.floor(x / pitch);
    const row = Math.floor(y / pitch);
    if (col >= cols || x - col * pitch > cell || y - row * pitch > cell) return;
    const at = row * cols + col;
    const hit = spotsFor(active).findIndex((s) => at >= s.at && at < s.at + s.span);
    if (hit >= 0 && hit !== hover) setHover(hit);
  };

  // Where each mark stands at rest, for the first frame; the motion writes over it from then on.
  const rest = statesFor(null);

  return (
    <Slot fill="transparent">
      <div
        ref={block}
        role="group"
        aria-label="What I work with"
        className="relative size-full"
        onPointerMove={onPointerMove}
        onPointerLeave={(event) => event.pointerType !== "touch" && setHover(null)}
      >
        {lead && labelled ? (
          <div className="absolute top-0 left-0" style={{ width: cols * pitch - gap, height: cell }}>
            <SectionCell label={lead.label} icon={lead.icon} />
          </div>
        ) : null}
        {TECH.slice(0, count).map((tech, i) => (
          <div
            key={`ghost-${tech.name}`}
            ref={(el) => void (ghosts.current[i] = el)}
            aria-hidden
            className="pointer-events-none absolute rounded-lg border"
            style={{ visibility: "hidden" }}
          />
        ))}
        {TECH.slice(0, count).map((tech, i) => (
          <Toggle
            key={tech.name}
            ref={(el) => void (rings.current[i] = el)}
            // A mark is its toggle and its mark's drawing, one loader ring (Grid.md D48).
            data-load-box={tech.name}
            aria-label={tech.name}
            pressed={picked === i}
            onPressedChange={(on) => setPicked(on ? i : null)}
            // The motion writes the box, the ring and the fill every frame, so nothing here may transition them.
            className="absolute h-auto min-w-0 overflow-hidden border border-(--mark-ring) p-0 font-normal tracking-normal normal-case transition-none focus-visible:border-ring"
            style={{ ...boxOf(rest[i]), "--mark-ring": "transparent", backgroundColor: "transparent" } as CSSProperties}
          >
            <span
              ref={(el) => void (names.current[i] = el)}
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center"
              style={{ opacity: 0 }}
            >
              <Text as="span" data-name className="whitespace-nowrap text-foreground dark:text-lime">
                {tech.name}
              </Text>
            </span>
          </Toggle>
        ))}
        {TECH.slice(0, count).map((tech, i) => (
          <svg
            key={`mark-${tech.name}`}
            ref={(el) => void (dots.current[i] = el)}
            data-load-box={tech.name}
            aria-hidden
            viewBox="0 0 24 24"
            className="pointer-events-none absolute top-0 left-0 fill-current text-foreground"
            style={{ width: mark, height: mark, transform: `translate(${rest[i].x - mark / 2}px, ${rest[i].y - mark / 2}px)` }}
          >
            <path d={tech.icon.path} />
          </svg>
        ))}
      </div>
    </Slot>
  );
}

type Box = { l: number; t: number; r: number; b: number };
const boxOf = (box: Box) => ({ left: box.l, top: box.t, width: box.r - box.l, height: box.b - box.t });

function place(el: HTMLElement, box: Box) {
  el.style.left = `${box.l}px`;
  el.style.top = `${box.t}px`;
  el.style.width = `${box.r - box.l}px`;
  el.style.height = `${box.b - box.t}px`;
}

/** `colour` as far as a mark is the active one, over nothing: a ring or a fill that comes in with it. */
const over = (colour: string, lit: number) =>
  lit <= 0 ? "transparent" : lit >= 1 ? colour : `color-mix(in oklch, ${colour} ${lit * 100}%, transparent)`;

/**
 * How many of `total` marks `cells` cells hold, `cols` to a row, after `skip` cells for the lead, with any one of them
 * grown by `grow`: all of them wherever the column keeps its spare row.
 */
function fitting(total: number, cols: number, cells: number, grow: (i: number) => number, skip: number) {
  for (let n = Math.min(total, cells - skip); n > 0; n--) {
    let fits = true;
    for (let i = 0; fits && i < n; i++) {
      const end = flowSpots(n + skip, i + skip, cols, grow(i)).at(-1)!;
      fits = end.at + end.span <= cells;
    }
    if (fits) return n;
  }
  return 0;
}

/**
 * How many cells each mark takes grown: its mark on the first cell's centre, a step of the spacing scale, its name in
 * the column's own font and the pill's air, in whole cells — two at least, and never more than a row. Measured again
 * when the fonts arrive, since they change how wide a name is.
 */
function useNameCells(block: RefObject<HTMLElement | null>, { cell, gap, mark, cols }: { cell: number; gap: number; mark: number; cols: number }) {
  const [grows, setGrows] = useState<number[]>([]);
  useLayoutEffect(() => {
    const el = block.current;
    const ctx = document.createElement("canvas").getContext("2d");
    if (!el || !ctx) return;
    let live = true;
    const measure = () => {
      const sample = el.querySelector<HTMLElement>("[data-name]");
      if (!live || !sample) return;
      const font = getComputedStyle(sample);
      ctx.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
      const next = TECH.map(({ name }) => {
        const need = cell / 2 + mark / 2 + ICON_GAP + Math.ceil(ctx.measureText(name).width) + PAD;
        return Math.max(2, Math.min(cols, Math.ceil((need + gap) / (cell + gap))));
      });
      setGrows((was) => (was.length === next.length && was.every((n, i) => n === next[i]) ? was : next));
    };
    measure();
    void document.fonts.ready.then(measure);
    return () => {
      live = false;
    };
  }, [block, cell, gap, mark, cols]);
  return grows;
}
