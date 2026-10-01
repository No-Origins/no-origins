"use client";

import * as React from "react";
import gsap from "gsap";

import { Agent, type AgentPainter } from "@no-origins/ui/components/agent";
import { useGridMetrics } from "@no-origins/ui/components/grid";
import { actionStill, agentAction, type AgentActionFrame, type AgentActionPlay } from "@no-origins/ui/lib/agent-actions";
import {
  readSphereMotion, sphereBowl, sphereJump, sphereMotionFrom,
  type SphereCell, type SphereMotion, type SphereTrip,
} from "@no-origins/ui/lib/sphere-motion";
import { cn } from "@no-origins/ui/lib/utils";

import type { Family, Values } from "@/content/families";
import { SPHERE_START_VALUES } from "@/content/sphere";
import { useAgentPreview } from "@/components/agent-preview";
import { useHeld, useTrack, type Track } from "@/components/stage";
import { useStudio, type Phase } from "@/components/studio-context";

/**
 * The sphere's stage (Motion.md M17): the agent on the field's own cells, seen from the side, abstract geometry by his
 * spec, painted from the package's `sphereFrame` with the tokens read off the stage (`readSphereMotion`), slowed by the
 * tempo like every family's. It sits on the bottom of its nest's circle, its tail behind the page. **The agent itself is
 * the design system's `Agent`** (`@no-origins/ui/components/agent`, 2026-09-30): this stage keeps the nests, the play,
 * the timeline and the blink clock, and hands it each frame through its painter; Orbit shows the same component still.
 *
 * **An action's stage** (Motion.md M24): it plays the action on the bench (`@no-origins/ui/lib/agent-actions`) on the
 * agent previewed (`agent-preview.tsx`, M23) — its look, the action's values, and the declaration's defaults for the
 * rest. **Live** it sits at the stage's centre (his, 2026-10-01: "the component should always be in the center"),
 * breathing and blinking — the rest, always there — and a click plays the action from where it sits: an action that
 * travels (Jump, Dive) to the cell clicked, staying there after; one that does not (Bounce) in place. A click while it
 * plays is let go. A control moved while it sits takes at once; one moved while it plays takes when it has settled.
 * **On the timeline** a play is the action from the centre — a traveller's path, as its Columns and Rows say, centred on
 * the stage (`sphereJump`) — its phases as long as its controls make them. A dive is drawn moved behind the page, cut to
 * its nest's circle, going out of it the way it travels and into the next from the side it comes from; popping up, cut
 * to the nest's bowl (`sphereBowl`); and not at all while it is under.
 */

/** Far enough out to cut nothing. */
const FAR = 1e5;
const UNCUT = `M ${-FAR} ${-FAR} H ${FAR} V ${FAR} H ${-FAR} Z`;

/** A nest's circle as a path: the page's opening, which a dive goes out of and comes into behind the page. */
const circlePath = ({ x, y, r }: { x: number; y: number; r: number }) =>
  `M ${(x - r).toFixed(2)} ${y.toFixed(2)} a ${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0 a ${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0 Z`;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** What it is doing between plays: the play it is in, since when, and how long it had sat before it. A ref: the ticker moves it. */
type Live = {
  m: SphereMotion;
  play: AgentActionPlay;
  /** When the play started, on `performance.now()`. */
  start: number;
  rested: number;
};

/** Where a play leaves it at `t`: the nest it sits in, and how long it has sat there. */
const sittingAt = (state: Live, t: number) =>
  state.play.total > 0
    ? { cell: state.play.to, rested: Math.max(0, t - state.play.total) }
    : { cell: state.play.to, rested: state.rested + t };

/** Whether a play at `t` is still going. */
const playing = (state: Live, t: number) => state.play.total > 0 && t < state.play.total;

/** The agent its values make, keyed as the tokens are, in real ms (the timeline slows its clock, not its values). */
function motionOf(values: Values): SphereMotion {
  const at = (id: string) => values[`--motion-sphere-${id}`];
  const num = (id: string) => {
    const v = at(id);
    return typeof v === "number" && Number.isFinite(v) ? v : undefined;
  };
  return sphereMotionFrom({ num, ms: num, word: (id) => (typeof at(id) === "string" ? (at(id) as string) : undefined), right: (id) => num(`${id}-right`) });
}

export function ActionStage({ family, cols, rows }: { family: Family; cols: number; rows: number }) {
  const action = agentAction(family.action ?? "");
  const studio = useStudio();
  const preview = useAgentPreview();
  const metrics = useGridMetrics();
  const cell = metrics?.cell ?? 60;
  const gap = metrics?.gap ?? 12;
  const pitch = cell + gap;
  const geometry = React.useMemo(() => ({ cell, gap }), [cell, gap]);
  // Read again when the tuning changes, and when another agent is previewed (M23): its look is on the stage too.
  const tuning = `${JSON.stringify(studio.values(family))}·${JSON.stringify(preview?.values ?? null)}·${studio.tempo}`;
  const held = useHeld(family);

  // The tokens are on the stage by the time a layout effect runs: read them whenever the tuning changes.
  const root = React.useRef<HTMLDivElement>(null);
  const [motion, setMotion] = React.useState<SphereMotion | null>(null);
  React.useLayoutEffect(() => {
    if (root.current) setMotion(readSphereMotion(root.current));
  }, [tuning]);

  // Where it sits live: the stage's centre (his, 2026-10-01: "the component should always be in the center"), the cell
  // left of and over the middle where the stage is an even number of cells, so it stands on one.
  const fit = React.useCallback((c: SphereCell): SphereCell => ({ col: clamp(c.col, 0, cols - 1), row: clamp(c.row, 0, rows - 1) }), [cols, rows]);
  const homeCol = Math.floor((cols - 1) / 2);
  const homeRow = Math.floor((rows - 1) / 2);
  const home = React.useMemo<SphereCell>(() => ({ col: homeCol, row: homeRow }), [homeCol, homeRow]);

  // ── painting ─────────────────────────────────────────────────────────────────────────────────────────────────
  // The nests are the stage's; the agent is the design system's (`Agent`), painted through its ref every frame, inside
  // a dive's cut and shift.
  const nests = React.useRef<(SVGGElement | null)[]>([]);
  const agent = React.useRef<AgentPainter>(null);
  const cutPath = React.useRef<SVGPathElement>(null);
  const behind = React.useRef<SVGGElement>(null);
  const clipId = `dive-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const paint = React.useCallback((af: AgentActionFrame, m: SphereMotion) => {
    af.frame.nests.forEach((n, i) => {
      const g = nests.current[i];
      if (!g) return;
      g.setAttribute("transform", `translate(${n.x} ${n.y})`);
      g.style.opacity = String(n.lit);
    });
    cutPath.current?.setAttribute("d", !af.cut ? UNCUT : af.cut.by === "bowl" ? sphereBowl(af.cut.nest) : circlePath(af.cut.nest));
    const g = behind.current;
    if (g) {
      g.setAttribute("transform", `translate(${af.shift.x.toFixed(2)} ${af.shift.y.toFixed(2)})`);
      g.style.display = af.hidden ? "none" : "";
    }
    if (!af.hidden) agent.current?.paint(af.frame, m);
  }, []);

  // ── live ─────────────────────────────────────────────────────────────────────────────────────────────────────
  const live = React.useRef<Live | null>(null);
  // Whenever the timeline lets go, when it starts and when the stage changes size, it sits at the stage's centre, as a
  // play ends. The tuning at the time is read from a ref, so a moved control does not put it back.
  const latest = React.useRef<SphereMotion | null>(null);
  React.useLayoutEffect(() => {
    latest.current = motion;
  }, [motion]);
  const ready = motion !== null;
  React.useLayoutEffect(() => {
    const m = latest.current;
    if (held || !m) return;
    live.current = { m, play: actionStill(m, geometry, home), start: performance.now(), rested: 0 };
  }, [held, home, geometry, ready]);

  React.useLayoutEffect(() => {
    if (!motion || held) return;
    // Its blinks keep a clock of their own while it is live, whatever it is doing.
    const born = performance.now();
    const draw = () => {
      const state = live.current;
      if (!state) return;
      const now = performance.now();
      let t = now - state.start;
      // A control moved: it takes as soon as it is sitting in a nest, from how long it has sat there.
      if (!playing(state, t) && state.m !== motion) {
        const at = sittingAt(state, t);
        state.play = actionStill(motion, geometry, fit(at.cell), at.rested);
        state.m = motion;
        state.rested = at.rested;
        state.start = now;
        t = 0;
      }
      paint(state.play.at(t, now - born), state.m);
    };
    draw();
    gsap.ticker.add(draw);
    return () => gsap.ticker.remove(draw);
  }, [motion, held, geometry, paint, fit]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = live.current;
    if (held || !motion || !state || !action || event.button !== 0) return;
    const now = performance.now();
    const t = now - state.start;
    // Playing: it finishes what it is doing.
    if (playing(state, t)) return;
    const at = sittingAt(state, t);
    const box = event.currentTarget.getBoundingClientRect();
    const from = fit(at.cell);
    // A traveller goes to the cell clicked; the rest play where it sits.
    const to = action.travels ? fit({ col: Math.floor((event.clientX - box.left) / pitch), row: Math.floor((event.clientY - box.top) / pitch) }) : from;
    state.play = action.play(motion, geometry, { from, to }, at.rested);
    state.m = motion;
    state.start = now;
  };

  // ── the timeline ─────────────────────────────────────────────────────────────────────────────────────────────
  // The action from the centre, in real ms — a traveller's path centred on the stage — its phases as its controls make
  // them, slowed by the tempo. Its timeline is the action alone (his, 2026-10-01: "bounds will only deal with
  // bouncing"): no rest is put after it on a loop, as the other stages put one, so a loop goes again as soon as it has
  // settled.
  const base: Values = { ...SPHERE_START_VALUES, ...studio.values(family), ...preview?.values };
  const baseKey = JSON.stringify(base);
  const { tempo } = studio;
  const build = React.useCallback((): Track | null => {
    if (!action) return null;
    const m = motionOf(JSON.parse(baseKey) as Values);
    const trip: SphereTrip = action.travels ? sphereJump(m, cols, rows) : { from: home, to: home };
    const play = action.play(m, geometry, trip);
    const phases: Phase[] = play.phases.map((p) => ({ label: p.label, ms: p.ms * tempo, note: p.note }));
    return {
      phases,
      paint: (t) => {
        const now = t / tempo;
        paint(play.at(now, now), m);
      },
    };
  }, [action, baseKey, geometry, home, cols, rows, tempo, paint]);
  useTrack(family, build, held);

  return (
    <div ref={root} className={cn("absolute inset-0", held && "pointer-events-none")} onPointerDown={onPointerDown}>
      <svg data-sphere-preview role="img" aria-label="Personal agent" className="absolute inset-0 size-full overflow-visible select-none">
        <defs>
          {/* A dive's cut: the circle of the nest it goes out of or comes into, behind the page; the bowl as it pops up. */}
          <clipPath id={clipId}>
            <path ref={cutPath} d={UNCUT} />
          </clipPath>
        </defs>
        {/* A play's two nests: the active cell's tint in a lime ring (Motion.md M9), giving as it lands. An action in
            place draws the first alone. */}
        {[0, 1].map((i) => (
          <g key={i} ref={(el) => void (nests.current[i] = el)} data-sphere-nest={i ? "to" : "from"} style={{ opacity: 0 }}>
            <circle r={cell / 2 - 0.5} fill="var(--muted)" stroke="var(--lime)" strokeWidth={1} />
          </g>
        ))}
        <g clipPath={`url(#${clipId})`}>
          <g ref={behind} data-sphere-behind>
            <Agent ref={agent} drawings={preview?.drawings} />
          </g>
        </g>
      </svg>
    </div>
  );
}
