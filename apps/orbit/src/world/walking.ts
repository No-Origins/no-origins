import type { Crossing } from "./grove";

/**
 * How the figure stands on what is built as it walks (World.md W101; his: "I took the character on to the pipe, I
 * thought the character fits into it and it must fall"). Nothing here is three.js.
 *
 * *Mine, the numbers:* it steps up onto anything at most half a metre over its feet (`STEP_UP`), and anything taller
 * stops it; with nothing under its feet it falls, at the Earth's 9.8 m/s² (`GRAVITY`), never faster than 50 m/s
 * (`FALL_MOST`), and lands on the first thing under it; the world's floor (0 m) is under everything. A pipe's wall
 * keeps it half a metre off (`BODY`), inside or out; it goes in and out at an open end alone.
 */
export const STEP_UP = 0.5;
export const GRAVITY = 9.8;
export const FALL_MOST = 50;
export const BODY = 0.5;
/** Two crossings this close, in metres, are one surface met from both sides. */
const TIE = 1e-4;

/**
 * Where the figure stands in a column with its feet at `feet` (W101): on the highest top at most a step over its feet,
 * else the world's floor; or nowhere (`null`) where something solid stands there past the step (the nearest surface
 * over the step faces up: it is inside a block, a mountain or a pipe's wall), which is a wall it cannot walk into.
 */
export function groundUnder(crossings: readonly Crossing[], feet: number): number | null {
  const knee = feet + STEP_UP;
  // A thin shell met from both sides (a pipe's wall and its lining) crosses twice at one height: over the figure, the
  // side facing down is the one it is under.
  let over: Crossing | null = null;
  for (const crossing of crossings) {
    if (crossing.y <= knee) continue;
    if (!over || crossing.y < over.y - TIE || (Math.abs(crossing.y - over.y) <= TIE && !crossing.up)) over = crossing;
  }
  if (over?.up) return null;
  let ground = 0;
  for (const crossing of crossings) if (crossing.up && crossing.y <= knee && crossing.y > ground) ground = crossing.y;
  return ground;
}

/** The figure's feet a frame on as it falls: `speed` and the feet in metres a second and metres, over `dt` ms, onto `ground`. */
export function fallen(feet: number, speed: number, ground: number, dt: number): { feet: number; speed: number } {
  const next = Math.min(FALL_MOST, speed + (GRAVITY * dt) / 1000);
  const to = feet - (next * dt) / 1000;
  return to <= ground ? { feet: ground, speed: 0 } : { feet: to, speed: next };
}

type Point = readonly [number, number, number];

/** A pipe as the figure meets it: the points its rings stand at from its start to its end, its radius, and which ends are open. */
export type PipeBody = { points: readonly Point[]; radius: number; startOpen: boolean; endOpen: boolean };

/**
 * Where a point is against a pipe: how far it is off the pipe's line, and whether it is past its start or its end
 * (along the line beyond a flat end), from the nearest length of the pipe.
 */
function against(pipe: PipeBody, point: Point): { off: number; past: "start" | "end" | null } {
  let best = { off: Infinity, past: null as "start" | "end" | null };
  const last = pipe.points.length - 1;
  for (let i = 0; i < last; i++) {
    const a = pipe.points[i];
    const b = pipe.points[i + 1];
    const along = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const reach = Math.max(1e-8, along[0] ** 2 + along[1] ** 2 + along[2] ** 2);
    const t = ((point[0] - a[0]) * along[0] + (point[1] - a[1]) * along[1] + (point[2] - a[2]) * along[2]) / reach;
    const c = Math.min(1, Math.max(0, t));
    const off = Math.hypot(point[0] - a[0] - along[0] * c, point[1] - a[1] - along[1] * c, point[2] - a[2] - along[2] * c);
    if (off < best.off) best = { off, past: i === 0 && t < 0 ? "start" : i === last - 1 && t > 1 ? "end" : null };
  }
  return best;
}

/**
 * Whether a step from one point to another goes through a pipe's wall (W101): inside a pipe, it may not come within
 * `BODY` of the wall, nor leave by a closed end; outside, it may not come within `BODY` of the wall, nor come in by a
 * closed end; past an open end it goes in and out freely. A step that keeps its distance or moves away is never held.
 */
export function throughPipeWall(pipes: readonly PipeBody[], from: Point, to: Point): boolean {
  for (const pipe of pipes) {
    const was = against(pipe, from);
    const now = against(pipe, to);
    const wasIn = !was.past && was.off < pipe.radius;
    const nowIn = !now.past && now.off < pipe.radius;
    const open = (past: "start" | "end" | null) => (past === "start" ? pipe.startOpen : past === "end" ? pipe.endOpen : true);
    if (wasIn) {
      if (now.past && now.off < pipe.radius && !open(now.past)) return true;
      if (!now.past && now.off > Math.max(pipe.radius - BODY, was.off)) return true;
    } else if (nowIn || (!now.past && now.off < pipe.radius + BODY)) {
      // Coming in by an end (from past it, within its round) is through the end: open, it goes in.
      if (was.past && was.off < pipe.radius) {
        if (!open(was.past)) return true;
      } else if (now.off < Math.min(pipe.radius + BODY, was.off)) return true;
    }
  }
  return false;
}
