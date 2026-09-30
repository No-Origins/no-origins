"use client";

import * as React from "react";
import gsap from "gsap";

import { Agent, type AgentPainter } from "@no-origins/ui/components/agent";
import { useGridMetrics } from "@no-origins/ui/components/grid";
import { AGENT_FACE } from "@no-origins/ui/lib/agent-face";
import { flattenState, stateValuesAt, type MotionState, type PlacedRow, type StateValues } from "@no-origins/ui/lib/motion-states";
import {
  readSphereMotion, sphereCourse, sphereFrame, sphereJump, sphereMotionFrom, spherePhases, sphereStill, sphereTripMs,
  type SphereCell, type SphereCourse, type SphereFrame, type SphereMotion, type SphereTrip,
} from "@no-origins/ui/lib/sphere-motion";
import { cn } from "@no-origins/ui/lib/utils";

import { familyById, type Family } from "@/content/families";
import { useMachine } from "@/components/machine";
import { useHeld, useTrack, type Track } from "@/components/stage";
import { holdPhase, useStudio, type Phase } from "@/components/studio-context";

/**
 * The sphere's stage (Motion.md M17), version 6: a head and a rubbery tail jumping from nest to nest on the field's own
 * cells, seen from the side, abstract geometry by his spec, painted from the package's `sphereFrame` with the tokens
 * read off the stage (`readSphereMotion`), slowed by the tempo like every family's. It sits on the bottom of its nest's
 * circle, its tail behind the page. The body is one outline, head and what of the tail is in front of the page,
 * painted twice: in its dark colour, then its lit side in its paint cut to the outline, which leaves one flat dark band
 * down its far side. The two nests of a jump are lit rings of the muted tint that dip as it lands. **The agent itself is
 * the design system's `Agent`** (`@no-origins/ui/components/agent`, 2026-09-30): this stage keeps the nests, the course,
 * the timeline and the blink clock, and hands it each frame through its painter; the character studio shows the same
 * component still.
 *
 * **On the timeline** a play is its jump — the Jump jig's Columns and Rows, centred on the stage by `sphereJump`, the
 * character sitting in its first nest — then the hold, sitting in the nest it reached, and
 * the jump back, a rest after it on a loop; its parts are the jump's own, crouch · leap · bounce · settle, and a part it
 * goes without is not drawn. **Live** it sits in the jump's first nest, and a click on any cell sends it there from
 * where it is; a click while it is on its way is where it goes next. A click does not change the jump. A control moved
 * while it sits takes at once; one moved while it jumps takes when it has settled.
 */

/** A rest at the end of a play on a loop, in ms, as the other stages have. */
const LOOP_REST = 700;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** What it is doing between plays: the course it is on, since when, and where it goes next. A ref: the ticker moves it. */
type Live = {
  m: SphereMotion;
  course: SphereCourse;
  /** When the course started, on `performance.now()`, and how long it had sat before it (a still course's). */
  start: number;
  rested: number;
  next: SphereCell | null;
};

/** Where a course leaves it at `t`: the nest it sits in, and how long it has sat there. */
const sittingAt = (state: Live, t: number) =>
  state.course.total > 0 && t >= state.course.total
    ? { cell: state.course.trip.to, rested: t - state.course.total }
    : { cell: state.course.trip.from, rested: state.course.total > 0 ? 0 : state.rested + t };

/** A motion, laid out (Motion.md M20): what it plays, in its own time. */
type Motion = { state: MotionState; rows: PlacedRow[] };

/**
 * What a row may ease while a hop is in the air: its face, and how it is turned, which move nothing the hop is made of.
 * The rest of its body is the hop's, read at its start.
 */
const FACE_KEYS = [
  ...AGENT_FACE.flatMap((slot) => [...(slot.style ? [slot.style] : []), ...slot.settings]).map((p) => p.id.replace(/-(\w)/g, (_, c: string) => c.toUpperCase())),
  "right",
  "uploads",
  "rotateX",
  "rotateY",
  "rotateZ",
] as (keyof SphereMotion)[];

/** The agent its values make, keyed as the tokens are, in real ms (the timeline slows its clock, not its values). */
function motionOf(values: StateValues): SphereMotion {
  const at = (id: string) => values[`--motion-sphere-${id}`];
  const num = (id: string) => {
    const v = at(id);
    return typeof v === "number" && Number.isFinite(v) ? v : undefined;
  };
  return sphereMotionFrom({ num, ms: num, word: (id) => (typeof at(id) === "string" ? (at(id) as string) : undefined), right: (id) => num(`${id}-right`) });
}

/** The agent's motions' stage (M20): the sphere's, playing the motion in front on the timeline. */
export function MotionsStage({ family, cols, rows }: { family: Family; cols: number; rows: number }) {
  const { machine, front } = useMachine(family);
  const motion = React.useMemo<Motion>(() => ({ state: front, rows: flattenState(machine.states, front.id) }), [machine.states, front]);
  return <SphereStage family={family} cols={cols} rows={rows} motion={motion} />;
}

export function SphereStage({ family, cols, rows, motion: played }: { family: Family; cols: number; rows: number; motion?: Motion }) {
  const studio = useStudio();
  const metrics = useGridMetrics();
  const cell = metrics?.cell ?? 60;
  const gap = metrics?.gap ?? 12;
  const pitch = cell + gap;
  const geometry = React.useMemo(() => ({ cell, gap }), [cell, gap]);
  const tuning = `${JSON.stringify(studio.values(family))}·${studio.tempo}`;
  const { hold, setHold, loop } = studio;
  const held = useHeld(family);

  // The tokens are on the stage by the time a layout effect runs: read them whenever the tuning changes.
  const root = React.useRef<HTMLDivElement>(null);
  const [motion, setMotion] = React.useState<SphereMotion | null>(null);
  React.useLayoutEffect(() => {
    if (root.current) setMotion(readSphereMotion(root.current));
  }, [tuning]);

  // The jump the timeline plays: its Columns and Rows, centred on the stage and held to it, whatever its size.
  const fit = React.useCallback((c: SphereCell): SphereCell => ({ col: clamp(c.col, 0, cols - 1), row: clamp(c.row, 0, rows - 1) }), [cols, rows]);
  const jump = motion ? sphereJump(motion, cols, rows) : null;
  const [fromCol, fromRow, toCol, toRow] = jump ? [jump.from.col, jump.from.row, jump.to.col, jump.to.row] : [0, 0, 0, 0];
  const trip = React.useMemo<SphereTrip>(
    () => ({ from: { col: fromCol, row: fromRow }, to: { col: toCol, row: toRow } }),
    [fromCol, fromRow, toCol, toRow],
  );

  // ── painting ─────────────────────────────────────────────────────────────────────────────────────────────────
  // The nests are the stage's; the agent is the design system's (`Agent`), painted through its ref every frame.
  const nests = React.useRef<(SVGGElement | null)[]>([]);
  const agent = React.useRef<AgentPainter>(null);

  const paint = React.useCallback((f: SphereFrame, m: SphereMotion) => {
    f.nests.forEach((n, i) => {
      const g = nests.current[i];
      if (!g) return;
      g.setAttribute("transform", `translate(${n.x} ${n.y})`);
      g.style.opacity = String(n.lit);
    });
    agent.current?.paint(f, m);
  }, []);

  // ── live ─────────────────────────────────────────────────────────────────────────────────────────────────────
  const live = React.useRef<Live | null>(null);
  // Whenever the timeline lets go, when it starts and when the jump changes, it sits in the jump's first nest, as a
  // play ends. The tuning at the time is read from a ref, so a moved control does not put it back.
  const latest = React.useRef<SphereMotion | null>(null);
  React.useLayoutEffect(() => {
    latest.current = motion;
  }, [motion]);
  const ready = motion !== null;
  React.useLayoutEffect(() => {
    const m = latest.current;
    if (held || !m) return;
    live.current = { m, course: sphereStill(m, geometry, trip.from), start: performance.now(), rested: 0, next: null };
  }, [held, trip, geometry, ready]);

  React.useLayoutEffect(() => {
    if (!motion || held) return;
    // Its blinks keep a clock of their own while it is live, whatever course it is on.
    const born = performance.now();
    const draw = () => {
      const state = live.current;
      if (!state) return;
      const now = performance.now();
      let t = now - state.start;
      const done = state.course.total === 0 || t >= state.course.total;
      // A control moved: it takes as soon as it is sitting in a nest, from how long it has sat there.
      if (done && state.m !== motion) {
        const at = sittingAt(state, t);
        state.course = sphereStill(motion, geometry, fit(at.cell), at.rested);
        state.m = motion;
        state.rested = at.rested;
        state.start = now;
        t = 0;
      }
      if (state.course.total > 0 && t >= state.course.total && state.next) {
        const at = sittingAt(state, t);
        state.course = sphereCourse(state.m, geometry, { from: at.cell, to: state.next }, at.rested);
        state.start = now;
        state.next = null;
        t = 0;
      }
      paint(sphereFrame(state.course, t, now - born), state.m);
    };
    draw();
    gsap.ticker.add(draw);
    return () => gsap.ticker.remove(draw);
  }, [motion, held, geometry, paint, fit]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = live.current;
    if (held || !motion || !state || event.button !== 0) return;
    const box = event.currentTarget.getBoundingClientRect();
    const to = fit({ col: Math.floor((event.clientX - box.left) / pitch), row: Math.floor((event.clientY - box.top) / pitch) });
    const now = performance.now();
    const t = now - state.start;
    if (state.course.total > 0 && t < state.course.total) {
      state.next = to;
      return;
    }
    const at = sittingAt(state, t);
    state.course = sphereCourse(motion, geometry, { from: fit(at.cell), to }, at.rested);
    state.m = motion;
    state.start = now;
  };

  // ── the timeline ─────────────────────────────────────────────────────────────────────────────────────────────
  // A motion (M20), on the agent as the Agent page has it tuned: every value at the playhead from its rows, eased from
  // where it stands; a Body row setting Columns or Rows a hop from where it sits, at its own speed.
  const machine = family.machine;
  const base = studio.values(familyById(machine?.restFrom ?? family.id) ?? family);
  const baseKey = JSON.stringify(base);
  const { tempo } = studio;
  const buildMotion = React.useCallback((): Track | null => {
    if (!played || !machine) return null;
    const { state, rows: placed } = played;
    const from = JSON.parse(baseKey) as StateValues;
    const at = (t: number) => stateValuesAt(placed, from, t, { origin: state.start, discrete: machine.discrete });
    const hopping = [...placed]
      .sort((a, b) => a.start - b.start)
      .filter((r) => typeof r.values["--motion-sphere-columns"] === "number" || typeof r.values["--motion-sphere-rows"] === "number");
    // Where it sits to start: the path its hops take, centred on the stage — the middle of it when it does not hop.
    let [c, r, lo, hi, top, bottom] = [0, 0, 0, 0, 0, 0];
    for (const row of hopping) {
      c += Math.round(Number(row.values["--motion-sphere-columns"] ?? 0));
      r += Math.round(Number(row.values["--motion-sphere-rows"] ?? 0));
      [lo, hi, top, bottom] = [Math.min(lo, c), Math.max(hi, c), Math.min(top, r), Math.max(bottom, r)];
    }
    const start = fit({ col: Math.floor((cols - 1 - (hi - lo)) / 2) - lo, row: Math.floor((rows - 1 - (bottom - top)) / 2) - top });
    // The hops, in order: each from where the last left it, when its row starts and the last has landed.
    const hops: { at: number; course: SphereCourse; to: SphereCell }[] = [];
    let cell = start;
    let free = state.start;
    for (const row of hopping) {
      const dc = row.values["--motion-sphere-columns"];
      const dr = row.values["--motion-sphere-rows"];
      const when = Math.max(row.start, free);
      if (when >= state.end) break;
      const to = fit({ col: cell.col + (typeof dc === "number" ? Math.round(dc) : 0), row: cell.row + (typeof dr === "number" ? Math.round(dr) : 0) });
      if (to.col === cell.col && to.row === cell.row) continue;
      const m = motionOf({ ...at(when), ...row.values });
      const course = sphereCourse(m, geometry, { from: cell, to }, when - free);
      hops.push({ at: when, course, to });
      free = when + course.total;
      cell = to;
    }
    const span = state.end - state.start;
    const phases: Phase[] = [{ label: state.name, ms: span * tempo, note: "The motion in front, over its window" }];
    if (loop) phases.push({ label: "rest", ms: LOOP_REST });
    return {
      phases,
      paint: (t) => {
        const now = state.start + Math.min(t / tempo, span);
        const values = motionOf(at(now));
        const hop = [...hops].reverse().find((h) => h.at <= now);
        if (hop && now - hop.at < hop.course.total) {
          // In the air, the body is the hop's; the face is the moment's.
          const m = { ...hop.course.m, ...Object.fromEntries(FACE_KEYS.map((k) => [k, values[k]])) } as SphereMotion;
          paint(sphereFrame({ ...hop.course, m }, now - hop.at, now), m);
          return;
        }
        const since = hop ? hop.at + hop.course.total : state.start;
        paint(sphereFrame(sphereStill(values, geometry, hop ? hop.to : start), now - since, now), values);
      },
    };
  }, [played, machine, baseKey, cols, rows, fit, geometry, tempo, loop, paint]);

  const build = React.useCallback((): Track | null => {
    if (played) return buildMotion();
    if (!motion) return null;
    const total = sphereTripMs(motion, geometry, trip);
    const reverse = { from: trip.to, to: trip.from };
    const there = sphereCourse(motion, geometry, trip);
    // Back from where the hold leaves it, sitting in the nest it reached.
    const back = sphereCourse(motion, geometry, reverse, hold);
    // A part it goes without lasts 0 and is not drawn.
    const parts = spherePhases(motion, geometry, trip).filter((p) => p.ms > 0);
    const phases: Phase[] = [...parts, holdPhase(hold, setHold), { label: "back", ms: sphereTripMs(motion, geometry, reverse), note: "The same jump, back" }];
    if (loop) phases.push({ label: "rest", ms: LOOP_REST });
    return {
      phases,
      paint: (t) => paint(t < total + hold ? sphereFrame(there, t) : sphereFrame(back, t - total - hold, t), motion),
    };
  }, [played, buildMotion, motion, geometry, trip, hold, setHold, loop, paint]);
  useTrack(family, build, held);

  return (
    <div ref={root} className={cn("absolute inset-0", held && "pointer-events-none")} onPointerDown={onPointerDown}>
      <svg data-sphere-preview role="img" aria-label="Personal agent" className="absolute inset-0 size-full overflow-visible select-none">
        {/* The jump's two nests: the active cell's tint in a lime ring (Motion.md M9), giving as it lands. */}
        {[0, 1].map((i) => (
          <g key={i} ref={(el) => void (nests.current[i] = el)} data-sphere-nest={i ? "to" : "from"} style={{ opacity: 0 }}>
            <circle r={cell / 2 - 0.5} fill="var(--muted)" stroke="var(--lime)" strokeWidth={1} />
          </g>
        ))}
        <Agent ref={agent} />
      </svg>
    </div>
  );
}
