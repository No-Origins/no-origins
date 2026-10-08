"use client";

import * as React from "react";

import { Agent, type AgentPainter } from "@no-origins/ui/components/agent";
import { sphereMotionOf } from "@no-origins/ui/lib/agent-body";
import { sphereFrame, sphereStill } from "@no-origins/ui/lib/sphere-motion";

import { useCharacter } from "@/components/character-context";
import { coveredCells, stageDiameter } from "@/lib/stage";

/**
 * The agent's cell (Orbit.md C2, C3): one cell of the field grown to a radius of three, and the agent sitting
 * in it.
 *
 * **The cell is a nest.** It is drawn the way the sphere's nests are on the motion studio's stage (Motion.md M17), which
 * is movement's active cell (M9): the muted tint in a lime hairline. Only its size is new.
 *
 * **It takes the place of the cells it overlaps, and only those** (his, the same day: "it should be part of the grid.
 * So the cells under it should not be visible … the bigger circle is taking up the space within the grid", then "the
 * corners circles for which there is no effect from the circle. I need them back"): each cell of the field its circle
 * meets (`coveredCells`) is painted out in the page's colour, a pixel past its ring, under the circle, so none of them
 * shows cut at the circle's edge; the corner cells it misses are left on the field whole.
 *
 * **The agent is the design system's `Agent`** (`@no-origins/ui/components/agent`), the one the motion studio's stage
 * paints, given one still frame of the package's model (`@no-origins/ui/lib/sphere-motion`) made from the character's
 * look as it stands (`sphereMotionOf`, `@no-origins/ui/lib/agent-body`): its draft, every setting round the cell moving
 * it (C6). Its size is a share of its nest, as it always was, and the nest is this cell.
 *
 * **It plays its rest**: the rest state of its motion. It sits on the bottom of its nest, its tail behind the page, breathing — its Breath and Breath depth
 * spreading it a little and back — and blinking on its own clock, its Blink every and Blink: a still course of the
 * model (`sphereStill`), a frame of it (`sphereFrame`) painted through the `Agent`'s painter on every animation frame,
 * as the motion studio's stage paints it live. It never jumps here. Its clock starts at 0 when the cell mounts, so its
 * first blink lands a Blink every in, as on the motion studio's stage, and runs on when the look changes, so a setting
 * moved mid-breath does not start the breath again. Under reduced motion it shows its first frame and stays there: here
 * the rest is what it looks like while nothing plays, not the thing being designed (agreed with the motion studio's
 * session, whose stage, where motion is designed, plays always).
 */
export function AgentCell({ span, cell, gap }: { span: number; cell: number; gap: number }) {
  const { look, drawingData } = useCharacter();
  const size = stageDiameter(span, cell, gap);
  const covered = React.useMemo(() => coveredCells(span, cell, gap), [span, cell, gap]);
  const motion = React.useMemo(() => sphereMotionOf(look), [look]);
  // A nest the size of the circle: its floor is the circle's bottom, and the agent a share of it across.
  const course = React.useMemo(() => sphereStill(motion, { cell: size, gap: 0 }, { col: 0, row: 0 }), [motion, size]);
  const agent = React.useRef<AgentPainter>(null);
  const born = React.useRef<number | null>(null);
  // Every frame from the one clock — the first at once, as the page or a changed look is laid out, so a setting moved
  // mid-breath is drawn where the breath is, never from its start.
  React.useLayoutEffect(() => {
    let raf = 0;
    const paint = (now: number) => {
      born.current ??= now;
      // One clock for its breath and its blinks, since it sat down.
      const t = now - born.current;
      agent.current?.paint(sphereFrame(course, t, t), motion);
    };
    const tick = (now: number) => {
      paint(now);
      raf = requestAnimationFrame(tick);
    };
    paint(performance.now());
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [course, motion]);
  const r = size / 2;

  return (
    <div data-agent-cell className="relative size-full">
      <svg role="img" aria-label="The agent, resting in its cell" viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 size-full select-none">
        <g data-agent-covered fill="var(--background)">
          {covered.map((c) => <circle key={`${c.x}-${c.y}`} cx={c.x} cy={c.y} r={cell / 2 + 1} />)}
        </g>
        <circle data-agent-nest cx={r} cy={r} r={r - 0.5} fill="var(--muted)" stroke="var(--lime)" strokeWidth={1} />
        <Agent ref={agent} drawings={drawingData} />
      </svg>
    </div>
  );
}
