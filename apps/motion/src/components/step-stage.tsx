"use client";

import * as React from "react";

import { useGridMetrics } from "@no-origins/ui/components/grid";
import { Slider } from "@no-origins/ui/components/slider";
import { GRIP_HELD, GRIP_REST, GRIP_RING, gripAt, gripFrame, paintGrip, readGripMotion } from "@no-origins/ui/lib/grip-motion";
import { springAt } from "@no-origins/ui/lib/spring";
import { markLit, paintMark, readStepMotion, stepPopAt, zoneOf } from "@no-origins/ui/lib/step-motion";
import { cn } from "@no-origins/ui/lib/utils";

import type { Family } from "@/content/families";
import { useHeld, useTrack, type Track } from "@/components/stage";
import { holdPhase, useStudio, type Phase } from "@/components/studio-context";

/** The steps' specimen: his example first, a range, and marks sparser than the steps. */
const SLIDERS = [
  { label: "1 to 5", min: 1, max: 5, step: 1, marks: true, value: [2] },
  { label: "0 to 10, a range", min: 0, max: 10, step: 1, marks: true, value: [3, 7] },
  { label: "0 to 20, marked every 5", min: 0, max: 20, step: 1, marks: 5, value: [10] },
] as const;

/** How long the timeline's hand takes to drag a head two steps out and back, ms before the tempo. */
const STEP_DRAG = 1600;
/** How many steps the hand drags it. */
const REACH = 2;
/** A rest at the end of a play on a loop, ms. */
const REST = 700;
/** How often the play is stepped as a hand would move, ms: the zone, the snap and the follow, one step at a time. */
const SIM = 8;

/**
 * The steps' stage (Motion.md M21, version 1): the system's own `Slider` with `marks`, three of them, one a row on the
 * field's rows with a free row between where the stage has them — his example, 1 to 5; a range, 0 to 10; and 0 to 20
 * marked every 5, where the value steps by 1 and only a mark ticks. Live they are pressed and dragged by hand, or
 * stepped with the keys, and play the grip with them at its own values (the family borrows it). On the timeline a play
 * is the grip's detach, the hand dragging the first head of each two steps out and back from where it is, the way
 * there is room — the lime flowing after it,
 * the head snapping under each mark whose zone the cursor comes into, ticking it and kicking in the cursor — holding and
 * merging, stepped from the start by the slider's own rules and painted from the package's frames (`zoneOf`,
 * `gripFrame`, `markLit`, `stepPopAt`), with the cursor drawn over the hand as a ring. While the timeline holds it, the sliders take
 * no pointer.
 */
export function StepStage({ family, cols, rows }: { family: Family; cols: number; rows: number }) {
  const studio = useStudio();
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const pitch = cell + gap;
  const across = Math.max(2, Math.min(8, cols - (cols > 8 ? 2 : 0)));
  const down = Math.max(1, Math.min(SLIDERS.length, rows));
  // A free row between the sliders where the stage has them, so the marks have air.
  const every = down * 2 - 1 <= rows ? 2 : 1;
  const tall = (down - 1) * every + 1;
  const tuning = `${JSON.stringify(studio.values(family))}·${studio.tempo}`;
  const { hold, setHold, loop } = studio;
  const held = useHeld(family);
  const block = React.useRef<HTMLDivElement>(null);
  const rings = React.useRef<(HTMLDivElement | null)[]>([]);

  const parts = React.useCallback(
    () =>
      [...(block.current?.querySelectorAll<HTMLElement>('[data-slot="slider"]') ?? [])].flatMap((s, i) => {
        const track = s.querySelector<HTMLElement>('[data-slot="slider-track"]');
        const head = s.querySelector<HTMLElement>('[data-slot="slider-thumb"]');
        const marks = [...s.querySelectorAll<HTMLElement>('[data-slot="slider-mark"]')];
        const spec = SLIDERS[i];
        return track && head && spec ? [{ track, head, marks, spec }] : [];
      }),
    [],
  );
  // When the timeline lets go, the sliders are their own again.
  React.useEffect(() => {
    if (held) return;
    parts().forEach(({ track, head, marks }) => {
      paintGrip(track, head, 0, null);
      marks.forEach((mark) => paintMark(mark, null));
    });
    rings.current.forEach((r) => void (r && (r.style.opacity = "0")));
  }, [held, parts, down]);

  const build = React.useCallback((): Track | null => {
    const el = block.current;
    if (!el) return null;
    const grip = readGripMotion(el);
    const steps = readStepMotion(el);
    const first = parts()[0]?.track;
    const style = first ? getComputedStyle(first) : null;
    const bar = parseFloat(style?.getPropertyValue("--slider-bar") ?? "") || 24;
    const shape = { bar, gap: parseFloat(style?.getPropertyValue("--slider-gap") ?? "") || 0, size: Math.min(GRIP_RING - 4, grip.size) };
    const drag = STEP_DRAG * studio.tempo;
    const settle = steps.popIn + steps.settle.response * 1.5;
    const merge = Math.max(grip.out, grip.follow.response * 1.2, settle);
    const phases: Phase[] = [
      { label: "detach", ms: grip.in },
      { label: "drag", ms: drag },
      holdPhase(hold, setHold),
      { label: "merge", ms: merge },
    ];
    if (loop) phases.push({ label: "rest", ms: REST });
    const letGo = grip.in + drag + hold;
    // The hand, in steps from where the head rests: out two and back.
    const hand = (t: number) => (t <= grip.in || t >= grip.in + drag ? 0 : REACH * Math.sin((Math.PI * (t - grip.in)) / drag));
    const state = (t: number) => (t < letGo ? (t < grip.in ? gripAt(grip, GRIP_REST, true, t) : GRIP_HELD) : gripAt(grip, GRIP_HELD, false, t - letGo));
    return {
      phases,
      paint: (t) => {
        const s = state(t);
        const origin = el.getBoundingClientRect();
        parts().forEach(({ track, head, marks, spec }, i) => {
          const box = track.getBoundingClientRect();
          const css = getComputedStyle(track);
          const knob = parseFloat(css.getPropertyValue("--slider-head")) || bar;
          const size = parseFloat(css.getPropertyValue("--slider-mark")) || 6;
          const span = spec.max - spec.min;
          const travel = box.width - knob;
          const stepPx = (travel * spec.step) / span;
          const place = (v: number) => ((v - spec.min) / span) * travel + knob / 2;
          // From where the heads are now — a hand may have moved them — the way there is room for the drag.
          const [v0 = spec.value[0], other] = [...track.parentElement!.querySelectorAll('[data-slot="slider-thumb"]')].map((h) => Number(h.getAttribute("aria-valuenow")));
          const room = (d: number) => v0 + d * REACH * spec.step <= (other ?? spec.max) && v0 + d * REACH * spec.step >= spec.min;
          const dir = room(1) ? 1 : -1;
          const every = spec.marks === true ? spec.step : spec.marks;
          const values = Array.from({ length: Math.floor(span / every + 1e-9) + 1 }, (_, k) => spec.min + k * every);
          const onMark = (v: number) => values.indexOf(v);
          const places = values.map(place);
          // The play as the hand would play it, stepped from the start: the cursor, the zone it is in, the value, each
          // tick, the head's snap and the body's follow — the slider's own rules (`zoneOf`, the snap and follow springs).
          let zoned: number | null = onMark(v0) >= 0 ? onMark(v0) : null;
          let value = v0;
          let pull = { x: 0, v: 0 };
          let body = { x: 0, v: 0 };
          const ticks: { t: number; mark: number }[] = [];
          for (let u = 0; u < t; u += SIM) {
            const dt = Math.min(SIM, t - u);
            const cursor = dir * hand(u) * stepPx;
            const now = state(u);
            if (u < letGo && steps.zone > 0) {
              const inside = zoneOf(place(v0) + cursor, places, steps.zone);
              if (inside !== zoned) {
                zoned = inside;
                if (inside !== null) {
                  ticks.push({ t: u, mark: inside });
                  value = values[inside]!;
                }
              }
              const pointed = v0 + dir * Math.round(hand(u)) * spec.step;
              if (inside === null && onMark(pointed) < 0) value = pointed;
            } else {
              // No zone: the value is the pointer's, and landing on a mark is the tick.
              const pointed = u < letGo ? v0 + dir * Math.round(hand(u)) * spec.step : value;
              if (pointed !== value && onMark(pointed) >= 0) ticks.push({ t: u, mark: onMark(pointed) });
              value = pointed;
              zoned = null;
            }
            const aim = zoned !== null && u < letGo ? places[zoned]! - (place(v0) + cursor) : 0;
            pull = springAt(pull, aim, dt, { response: steps.snap, bounce: 0 });
            body = springAt(body, (cursor + pull.x) * now.head, dt, grip.follow);
          }
          const x = dir * hand(t) * stepPx + pull.x;
          const flow = { x: body.x, v: body.v };
          // The last tick, and the head's kick with it, stopped at the ring's inside.
          const kicked = ticks.at(-1);
          const frame = gripFrame(s, shape, { x, y: 0, along: x }, grip, flow);
          const kick = kicked ? stepPopAt(steps, t - kicked.t, steps.kick) : 1;
          paintGrip(track, head, 0, { ...frame, scale: Math.min(Math.max(frame.scale, (GRIP_RING - 4) / bar), frame.scale * kick) });
          // The lime: from the bar's start (or the range's other head) to where the body meets; and where the value is.
          const moving = place(v0) + flow.x;
          const [from, to] = other !== undefined ? [moving, place(other)] : [-Infinity, moving];
          const [low, high] = other !== undefined ? [Math.min(value, other), Math.max(value, other)] : [-Infinity, value];
          marks.forEach((mark, k) => {
            const v = values[k]!;
            // The last tick on this mark, if the play has passed one.
            const tick = ticks.filter((p) => p.mark === k).at(-1);
            const lit = v >= low && v <= high ? 1 : markLit(places[k]!, size, from, to);
            paintMark(mark, { lit, scale: tick ? stepPopAt(steps, t - tick.t) : 1 });
          });
          const ring = rings.current[i];
          if (!ring) return;
          const slot = (head.parentElement ?? head).getBoundingClientRect();
          ring.style.left = `${slot.left + slot.width / 2 + dir * hand(t) * stepPx - origin.left}px`;
          ring.style.top = `${slot.top + slot.height / 2 - origin.top}px`;
          ring.style.opacity = "1";
        });
      },
    };
    // `tuning` says when to read the motion off the block again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuning, hold, setHold, loop, parts, down, pitch]);
  useTrack(family, build, held);

  const offCol = Math.floor((cols - across) / 2);
  const offRow = Math.floor((rows - tall) / 2);

  return (
    <div
      ref={block}
      data-block
      className={cn("absolute", held && "pointer-events-none")}
      style={{ left: offCol * pitch, top: offRow * pitch, width: across * pitch - gap, height: tall * pitch - gap }}
    >
      {SLIDERS.slice(0, down).map((spec, i) => (
        <div key={spec.label} className="absolute inset-x-0 flex items-center" style={{ top: i * every * pitch, height: cell }}>
          {/* The marks' room is at the top of the slider's box: lift it by half of it, so the bar is on the row's middle. */}
          <Slider
            defaultValue={[...spec.value]}
            min={spec.min}
            max={spec.max}
            step={spec.step}
            marks={spec.marks}
            aria-label={spec.label}
            className="-translate-y-[calc((var(--slider-lift)+var(--slider-mark))/2)]"
          />
        </div>
      ))}
      {/* The cursor on the timeline: the grid's pointer, a 24px ring with a 2px violet line (Grid.md D34, D43). */}
      {SLIDERS.slice(0, down).map((spec, i) => (
        <div
          key={`ring-${spec.label}`}
          ref={(r) => void (rings.current[i] = r)}
          aria-hidden
          className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-secondary"
          style={{ opacity: 0 }}
        />
      ))}
    </div>
  );
}
