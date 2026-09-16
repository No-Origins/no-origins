/**
 * The grammar (Patterns.md §6): pure geometry, no React, no randomness at render. Everything here returns
 * numbers or path data on a 240 × 240 viewBox; Pattern.tsx strokes it with the hue's line colour.
 *
 * Everything in here draws with a LINE, and every primitive owes the same guarantee: within one primitive no two
 * lines ever cross or touch (Patterns.md principle 3). Each function says below how it keeps that promise;
 * `e2e/.mcp/probe11.mjs` measures it on the rendered SVG.
 */
export const SIZE = 240;
const TAU = Math.PI * 2;

/** Deterministic scatter — the same picture on the server and the client (principle 9). */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A point at `deg` degrees and `r` from a centre; 0° is east, −90° is north. */
export function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg / 360) * TAU;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** A smooth open line through samples (Catmull-Rom → cubic Bézier). */
function smooth(pts: Array<[number, number]>): string {
  let d = `M ${round(pts[0]![0])} ${round(pts[0]![1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(p2[0])} ${round(p2[1])}`;
  }
  return d;
}

const round = (n: number) => Math.round(n * 100) / 100;

export interface Capsule {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  angle: number;
}

/**
 * n capsules radiating from a centre — the asterisk, drawn as outlines.
 *
 * No collision: the capsules stop at `r0` instead of meeting in the middle, and their outlines stay apart as long
 * as the arc between two of them at `r0` is wider than one capsule — `2π·r0 / n > thickness`. `clearance()` below
 * reports the slack so a new composition can be checked without rendering it.
 */
export function rosette(
  n: number,
  { cx = 120, cy = 120, r0 = 46, r1 = 112, thickness = 28, rotate = -90 } = {},
): Capsule[] {
  return Array.from({ length: n }, (_, i) => ({
    x: cx - thickness / 2,
    y: cy - r1,
    w: thickness,
    h: r1 - r0,
    rx: thickness / 2,
    angle: rotate + (i * 360) / n,
  }));
}

/** How much room is left between two neighbouring spokes of a rosette, in canvas units. Negative means they touch. */
export function rosetteClearance(n: number, r0: number, thickness: number) {
  return (TAU * r0) / n - thickness;
}

/**
 * k open waves, one behind the other.
 *
 * No collision: every wave is the SAME curve translated straight down by `rise`, so the vertical distance between
 * any two of them is a constant multiple of `rise` and they cannot meet. A wave leaves the frame only on the
 * right — the edge the cell crops (principle 7); its left end is a round cap, drawn on purpose.
 */
export function bands(
  k: number,
  { amplitude = 15, frequency = 1.25, seed = 11, rise = 46, top = 62, width = SIZE, bleed = 14 } = {},
): string[] {
  const rnd = mulberry32(seed);
  const phase = rnd() * TAU;
  const steps = 22;
  const wave: Array<[number, number]> = [];
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const x = t * (width + bleed);
    const y = top + Math.sin(t * TAU * frequency + phase) * amplitude + Math.sin(t * TAU * frequency * 0.5 + phase * 1.7) * amplitude * 0.4;
    wave.push([x, y]);
  }
  return Array.from({ length: k }, (_, i) => smooth(wave.map(([x, y]) => [x, y + i * rise] as [number, number])));
}

/**
 * Round-capped arcs with gaps — the ring, drawn as a line. `segments` are fractions of the circle, clockwise.
 *
 * No collision: one radius holds one run of arcs and the `gap` keeps their caps apart; concentric arcs are safe
 * whenever their radii differ by more than a stroke width.
 */
export function ring(segments: number[], { cx = 120, cy = 120, radius = 84, rotate = -90, gap = 0.05 } = {}): string[] {
  let start = rotate;
  return segments.map((frac) => {
    const sweep = Math.max(0, frac - gap) * 360;
    const a0 = start + (gap / 2) * 360;
    const a1 = a0 + sweep;
    start += frac * 360;
    const [x0, y0] = polar(cx, cy, radius, a0);
    const [x1, y1] = polar(cx, cy, radius, a1);
    const large = sweep > 180 ? 1 : 0;
    return `M ${round(x0)} ${round(y0)} A ${radius} ${radius} 0 ${large} 1 ${round(x1)} ${round(y1)}`;
  });
}

export interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
}

/**
 * n capsule outlines climbing away from the viewer — the stack.
 *
 * No collision: the vertical step `|dy|` is larger than the block `height`, so consecutive outlines never meet.
 * (The old filled version overlapped on purpose; outlines cannot.)
 */
export function stack(n: number, { x = 30, y = 186, width = 150, height = 30, dx = 14, dy = -46 } = {}): Block[] {
  return Array.from({ length: n }, (_, i) => ({ x: x + dx * i, y: y + dy * i, w: width, h: height, rx: height / 2 }));
}

export interface Disc {
  cx: number;
  cy: number;
  r: number;
}

/**
 * A seeded scatter of circle outlines.
 *
 * No collision: a candidate is kept only when its edge is `clearance` units clear of every disc already placed.
 */
export function pebbles(
  count: number,
  { rMin = 16, rMax = 38, seed = 5, clearance = 12, width = SIZE, height = SIZE, inset = 4 } = {},
): Disc[] {
  const rnd = mulberry32(seed);
  const out: Disc[] = [];
  for (let tries = 0; out.length < count && tries < 800; tries++) {
    const r = rMin + rnd() * (rMax - rMin);
    const d = {
      cx: round(inset + r + rnd() * (width - 2 * (r + inset))),
      cy: round(inset + r + rnd() * (height - 2 * (r + inset))),
      r: round(r),
    };
    if (out.every((o) => Math.hypot(o.cx - d.cx, o.cy - d.cy) > o.r + d.r + clearance)) out.push(d);
  }
  return out;
}

/**
 * One line unwinding from a point — an Archimedean spiral.
 *
 * No collision: the gap between consecutive turns is `(r1 − r0) / turns`, so keeping that above a few units keeps
 * the line clear of itself. `spiralPitch()` reports it.
 */
export function spiral({ cx = 120, cy = 120, r0 = 14, r1 = 104, turns = 2.5, rotate = -90, steps = 96 } = {}): string {
  const pts: Array<[number, number]> = [];
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    pts.push(polar(cx, cy, r0 + t * (r1 - r0), rotate + t * turns * 360));
  }
  return smooth(pts);
}

export function spiralPitch(r0: number, r1: number, turns: number) {
  return (r1 - r0) / turns;
}
