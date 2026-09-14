/**
 * Round 2's geometry — a family of lines that crosses the whole cell, varies, and never meets.
 *
 * Local to the studio on purpose (Patterns.md §8): candidates may improvise, and only a winner is promoted
 * into `primitives.ts` with a name and a stated guarantee. Everything here is deterministic.
 *
 * Two ways to be non-parallel and still never cross, and every family below uses one of them:
 *
 *   ORDERED — the curves are graphs of an ordered family. If curve i sits strictly below curve i+1 at *every*
 *   parameter value, no pair can meet, however differently the two of them bend. Spacing is free to vary.
 *
 *   LEVEL SETS — the curves are the contours of one smooth field. Two contours at different heights cannot cross,
 *   because a point cannot hold two values. This is a proof rather than a construction, so the field can be as
 *   irregular as we like and the lines still never touch — and they run off the frame wherever the field does.
 */
import { ill, illo, illoLines, poly, type Drawn, type Family, type Pt } from "@no-origins/ui";

/**
 * THE GENERATOR LIVES IN THE PACKAGE NOW (2026-09-11). `illo` was promoted to
 * `packages/ui/src/illustrations/generator.ts` when v1 was frozen, so the studio draws with exactly the same
 * function the site does — a setting found in a batch is a setting that ships, with no second copy to drift.
 *
 * Re-exported here so every round below still imports from one place.
 */
export { illo, illoLines, poly };
export type { Family, Drawn, Pt };

const { mulberry32, polar, SIZE } = ill;
export { SIZE };
const TAU = Math.PI * 2;

/**
 * A seeded sum of soft bumps — the irregularity that stops a family being parallel.
 *
 * `within` keeps the bumps out of a corner. A field is only as quiet as its flattest part, and the part that has
 * to stay quiet is wherever the text sits: perturbing the field there is what pushes a contour under a word.
 */
export function bumps(count: number, seed: number, strength = 26, within = { x0: 20, y0: 20, x1: SIZE - 20, y1: SIZE - 20 }) {
  const rnd = mulberry32(seed);
  const list = Array.from({ length: count }, () => ({
    x: within.x0 + rnd() * (within.x1 - within.x0),
    y: within.y0 + rnd() * (within.y1 - within.y0),
    s: 34 + rnd() * 54,
    w: (rnd() < 0.4 ? -1 : 1) * strength * (0.6 + rnd() * 0.7),
  }));
  return (x: number, y: number) =>
    list.reduce((acc, b) => acc + b.w * Math.exp(-((x - b.x) ** 2 + (y - b.y) ** 2) / (2 * b.s * b.s)), 0);
}

/** Distance from a point — the base field whose contours sweep out of a corner. */
export const from = (cx: number, cy: number) => (x: number, y: number) => Math.hypot(x - cx, y - cy);

/**
 * A flat spot the contours have to go around: a summit tall enough to lift a region clear of every level.
 *
 * This is how a field crosses a cell that has words in it. Not a fade — the lines are at full strength right up
 * to the plateau's skirt and simply do not enter it, the way a contour map behaves around high ground.
 */
export const plateau = (cx: number, cy: number, rx: number, ry: number, height: number, flat = 1.4) =>
  (x: number, y: number) =>
    height * Math.exp(-1 * ((((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2) ** flat));
// `flat` is the trade the skirt makes: 1 is a mound whose contours spread over a wide clearing, 2 a mesa whose
// contours pile up at its edge. Too steep and the lines bunch tighter than a stroke — 3C's first draft came
// within 1.2px of itself that way. The rise has to span a few level-spacings.

/** Adds fields together — a terrain is a sum of reasons. */
export const sum = (...fs: Array<(x: number, y: number) => number>) => (x: number, y: number) =>
  fs.reduce((acc, f) => acc + f(x, y), 0);

/**
 * Marching squares: the contours of `f` at each level, as polylines.
 *
 * Never crossing, by the level-set argument above — no clearance check is needed, only enough resolution that
 * two levels are not drawn on top of each other, which is a matter of spacing the levels.
 */
export function contours(f: (x: number, y: number) => number, levels: number[], res = 64, size = SIZE): string[][] {
  const step = size / res;
  const grid: number[][] = [];
  for (let j = 0; j <= res; j++) {
    grid[j] = [];
    for (let i = 0; i <= res; i++) grid[j]![i] = f(i * step, j * step);
  }
  return levels.map((level) => {
    const segs: [Pt, Pt][] = [];
    const at = (i: number, j: number): Pt => [i * step, j * step];
    const cut = (a: Pt, va: number, b: Pt, vb: number): Pt => {
      const t = (level - va) / (vb - va);
      return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    };
    for (let j = 0; j < res; j++)
      for (let i = 0; i < res; i++) {
        const p: Pt[] = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)];
        const v = [grid[j]![i]!, grid[j]![i + 1]!, grid[j + 1]![i + 1]!, grid[j + 1]![i]!];
        let idx = 0;
        for (let k = 0; k < 4; k++) if (v[k]! >= level) idx |= 1 << k;
        if (idx === 0 || idx === 15) continue;
        const e: Array<Pt | null> = [];
        for (let k = 0; k < 4; k++) {
          const a = k, b = (k + 1) % 4;
          e.push(v[a]! >= level !== v[b]! >= level ? cut(p[a]!, v[a]!, p[b]!, v[b]!) : null);
        }
        const link = (x: number, y: number) => { if (e[x] && e[y]) segs.push([e[x]!, e[y]!]); };
        const centre = (v[0]! + v[1]! + v[2]! + v[3]!) / 4 >= level;
        switch (idx) {
          case 1: case 14: link(3, 0); break;
          case 2: case 13: link(0, 1); break;
          case 3: case 12: link(3, 1); break;
          case 4: case 11: link(1, 2); break;
          case 6: case 9:  link(0, 2); break;
          case 7: case 8:  link(3, 2); break;
          case 5:  centre ? (link(0, 1), link(2, 3)) : (link(3, 0), link(1, 2)); break;
          case 10: centre ? (link(3, 0), link(1, 2)) : (link(0, 1), link(2, 3)); break;
        }
      }
    return stitch(segs);
  });
}

/** Chains the loose segments of one level into as few polylines as possible. */
function stitch(segs: Array<[Pt, Pt]>): string[] {
  const key = (p: Pt) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  const ends = new Map<string, number[]>();
  segs.forEach(([a, b], i) => {
    for (const k of [key(a), key(b)]) (ends.get(k) ?? ends.set(k, []).get(k)!).push(i);
  });
  const used = new Set<number>();
  const out: string[] = [];
  const grow = (line: Pt[], from: Pt) => {
    for (;;) {
      const next = (ends.get(key(from)) ?? []).find((i) => !used.has(i));
      if (next === undefined) return;
      used.add(next);
      const [a, b] = segs[next]!;
      from = key(a) === key(from) ? b : a;
      line.push(from);
    }
  };
  for (let i = 0; i < segs.length; i++) {
    if (used.has(i)) continue;
    used.add(i);
    const [a, b] = segs[i]!;
    const line: Pt[] = [a, b];
    grow(line, b);
    line.reverse();
    grow(line, line[line.length - 1]!);
    if (line.length > 2) out.push(poly(line));
  }
  return out;
}

/** Like `bumps`, but the widths are given rather than random — the difference between two terrains' character. */
export function grain(
  count: number, seed: number, strength: number, sigma: [number, number],
  within = { x0: 8, y0: 8, x1: SIZE - 8, y1: SIZE - 8 },
) {
  const rnd = mulberry32(seed);
  const list = Array.from({ length: count }, () => ({
    x: within.x0 + rnd() * (within.x1 - within.x0),
    y: within.y0 + rnd() * (within.y1 - within.y0),
    s: sigma[0] + rnd() * (sigma[1] - sigma[0]),
    w: (rnd() < 0.45 ? -1 : 1) * strength * (0.55 + rnd() * 0.8),
  }));
  return (x: number, y: number) =>
    list.reduce((acc, b) => acc + b.w * Math.exp(-((x - b.x) ** 2 + (y - b.y) ** 2) / (2 * b.s * b.s)), 0);
}

/**
 * Smooth value noise on a seeded lattice, interpolated with the quintic smootherstep so the field is C² and the
 * contours through it have no facets. `cells` sets how big the features are: fewer cells, bigger features.
 */
export function noise2(seed: number, cells: number, size = SIZE) {
  const rnd = mulberry32(seed);
  const g: number[][] = Array.from({ length: cells + 2 }, () => Array.from({ length: cells + 2 }, () => rnd() * 2 - 1));
  const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x: number, y: number) => {
    const u = (x / size) * cells, v = (y / size) * cells;
    const i = Math.max(0, Math.min(cells, Math.floor(u)));
    const j = Math.max(0, Math.min(cells, Math.floor(v)));
    const sx = ease(Math.min(1, Math.max(0, u - i)));
    const sy = ease(Math.min(1, Math.max(0, v - j)));
    const a = g[j]![i]! * (1 - sx) + g[j]![i + 1]! * sx;
    const b = g[j + 1]![i]! * (1 - sx) + g[j + 1]![i + 1]! * sx;
    return a * (1 - sy) + b * sy;
  };
}

/**
 * THE GENERATOR (Patterns.md §8). One function, five parameters, every illustration on the platform.
 *
 * The picture is the contour lines of a plane tilted along `flow`, drawn in a space that has been WARPED by
 * smooth noise. Warping the domain rather than adding to the height is what gives the lines their turning: they
 * meander, double back and pinch, and because they are still the level sets of one single-valued field they
 * still cannot cross. Nothing else in the grammar can do that.
 *
 *   seed   which picture. The only parameter that is not a design decision.
 *   flow   degrees. The direction the lines travel across the card.
 *   scale  how CLOSE. 1 is a middle distance; 2 doubles the size of every feature, as if stepping nearer.
 *   turn   0–1. How far the lines wander from the straight sweep — the angles in the curve.
 *   lines  how many cross the card.
 *   words  the text boxes to keep clear, handled by `clearLevels` — the field is not altered, the levels are.
 */
export interface Illo {
  seed: number;
  flow: number;
  scale: number;
  turn: number;
  lines: number;
  words?: Array<[number, number, number, number]>;
  res?: number;
}

/** Centre to centre, in viewBox units, at the size a loud cell renders one. Below this two lines read as one. */
const MIN_SPACING = 4.4;

/**
 * THE GENERATOR, round 6 (Patterns.md §6.0). Kept beside `warpField`, which round 5 used and which is what
 * the studio's record of round 5 still draws.
 *
 * Round 5 warped the space to make the lines turn, and turning is what it gave: "too many lines, too close to
 * each other, too chaotic, too congested". A warped plane has no reason to space its contours evenly — where the
 * field steepens the lines crowd — so density and calm were fighting the mechanism, not the settings.
 *
 * This one is built the other way round, from the spacing outwards. The field is the (first-order) DISTANCE from
 * one smooth curve: `(v − g(u)) / √(1 + g′(u)²)`. A distance field has a gradient of one almost everywhere, so
 * its contours are offsets of that curve at a spacing you choose in the picture's own units — `breath`. Even
 * spacing and breathing space stop being things to check and become what the field is made of.
 *
 *   seed    which picture
 *   flow    degrees; the direction the family travels
 *   scale   how close: the wavelength of the source curve, 1 ≈ one bend across the card
 *   wander  0–1; how far the source curve departs from straight — the only source of shape
 *   breath  viewBox units BETWEEN lines. The line count is an outcome of this, not an input
 *   taper   0–1; lets the spacing widen across the card instead of holding exactly even
 *
 * Two seeded sine components give the curve its "little randomness": same family every time, never the same
 * curve twice. The count is what fits — asking for breathing space and asking for n lines are the same question,
 * and this way round it is answered in the units that matter.
 */
export interface Wave {
  seed: number;
  flow: number;
  scale: number;
  wander: number;
  breath: number;
  /** How many sine components make the source curve. 2 is one bend and a lean; 4 is a coastline. */
  waves?: number;
  taper?: number;
  words?: Array<[number, number, number, number]>;
  res?: number;
}

export function waveField({ seed, flow, scale, wander, breath, waves = 2, taper = 0, words = [], res = 170 }: Wave): string[][] {
  const rnd = mulberry32(seed);
  const rad = (flow / 360) * TAU;
  const cos = Math.cos(rad), sin = Math.sin(rad);

  /**
   * The source curve: `waves` sine components, each roughly twice the frequency and under half the amplitude of
   * the one before. Few enough octaves to stay smooth, enough of them that a line has somewhere to go.
   */
  const base = TAU / (SIZE * scale * (0.9 + rnd() * 0.4));
  const comps = Array.from({ length: Math.max(1, waves) }, (_, k) => ({
    w: base * (k === 0 ? 1 : (1.75 + rnd() * 0.5) ** k),
    a: wander * SIZE * 0.2 * (0.8 + rnd() * 0.4) * (k === 0 ? 1 : (0.44 + rnd() * 0.12) ** k),
    p: rnd() * TAU,
  }));

  /**
   * Offsets of a curve develop a cusp once they are further out than the curve's own radius of curvature, and a
   * cusp is the opposite of smooth. The reach is roughly half the cell, so hold the total curvature under that
   * and ease every component together until it is — which is why asking for more waves gives shallower ones
   * rather than sharper ones. Same parameters, same answer, always.
   */
  const reach = SIZE * 0.55;
  const bend = () => comps.reduce((sum, c) => sum + c.a * c.w * c.w, 0);
  for (let i = 0; i < 16 && bend() * reach > 0.8; i++) for (const c of comps) c.a *= 0.85;

  const g = (u: number) => comps.reduce((sum, c) => sum + c.a * Math.sin(c.w * u + c.p), 0);
  const gp = (u: number) => comps.reduce((sum, c) => sum + c.a * c.w * Math.cos(c.w * u + c.p), 0);
  const field = (x: number, y: number) => {
    const u = x * cos + y * sin;
    const v = -x * sin + y * cos;
    const d = (v - g(u)) / Math.hypot(1, gp(u));
    return taper ? d / (1 + taper * (u / SIZE)) : d;                // spacing widens along the flow
  };

  // every `breath` units, skipping any level that would cross a word (principle 7)
  const forbidden = words.map(([x0, y0, x1, y1]) => {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 12; i++)
      for (let j = 0; j <= 12; j++) {
        const value = field(x0 - 7 + (i / 12) * (x1 - x0 + 14), y0 - 7 + (j / 12) * (y1 - y0 + 14));
        lo = Math.min(lo, value); hi = Math.max(hi, value);
      }
    return [lo, hi] as [number, number];
  });
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= 48; i++)
    for (let j = 0; j <= 48; j++) {
      const value = field((i / 48) * SIZE, (j / 48) * SIZE);
      lo = Math.min(lo, value); hi = Math.max(hi, value);
    }
  const levels: number[] = [];
  for (let v = Math.ceil(lo / breath) * breath; v < hi; v += breath) {
    if (!forbidden.some(([a, b]) => v > a && v < b)) levels.push(v);
  }
  return contours(field, levels, res);
}

export function warpField({ seed, flow, scale, turn, lines, words = [], res = 150 }: Illo): string[][] {
  const cells = Math.max(2, Math.round(6 / scale));
  const step = SIZE / cells;
  const nx = noise2(seed * 2 + 1, cells);
  const ny = noise2(seed * 2 + 2, cells);
  const fx = noise2(seed * 2 + 5, cells * 2);                    // a second octave: finer angles, same smoothness
  const fy = noise2(seed * 2 + 6, cells * 2);
  const rad = (flow / 360) * Math.PI * 2;
  const dx = Math.cos(rad), dy = Math.sin(rad);
  const make = (a: number) => (x: number, y: number) => {
    const wx = x + a * (nx(x, y) + fx(x, y) * 0.4);
    const wy = y + a * (ny(x, y) + fy(x, y) * 0.4);
    return wx * dx + wy * dy;
  };

  /**
   * `turn` and `lines` pull against each other, and the generator settles it rather than the person calling it.
   *
   * Contour spacing is (gap between levels) ÷ (steepness of the field). Warping the space makes the field steep
   * in places, so past a certain warp the lines touch — at eighteen lines and turn 0.95 they overlapped by 1.5px.
   * So: measure the steepest point, and if the tightest spacing that implies is under MIN_SPACING, ease the warp
   * and measure again. What comes out is as much turn as this many lines can carry, which is an honest answer to
   * asking for both. Nothing here is random: the same parameters always settle at the same warp.
   */
  let a = turn * step * 0.95;
  for (let i = 0; i < 14; i++) {
    const field = make(a);
    const levels = clearLevels(field, words, lines);
    let gap = Infinity;
    for (let k = 1; k < levels.length; k++) gap = Math.min(gap, levels[k]! - levels[k - 1]!);
    let steep = 0;
    const n = 56;
    for (let j = 0; j <= n; j++)
      for (let i2 = 0; i2 <= n; i2++) {
        const x = (i2 / n) * SIZE, y = (j / n) * SIZE;
        steep = Math.max(steep, Math.hypot((field(x + 1, y) - field(x - 1, y)) / 2, (field(x, y + 1) - field(x, y - 1)) / 2));
      }
    if (!Number.isFinite(gap) || steep === 0 || gap / steep >= MIN_SPACING || a < 0.5) {
      return contours(field, levels, res);
    }
    a *= 0.82;
  }
  const field = make(a);
  return contours(field, clearLevels(field, words, lines), res);
}

/**
 * Levels that miss the words — the answer to "how does a field cross a cell that has text in it".
 *
 * Two wrong turns first, both worth keeping written down. A SUMMIT under the text has to be tall enough to lift
 * it clear of every level, which makes its skirt steep enough to pile the contours against it (probe11 measured
 * lines overlapping by 1.7px). A flat PLAIN held between two levels fixes the height but not the edge: wherever
 * the field is forced away from the terrain it has to come back, and coming back crosses levels in a narrow band.
 * Any region that departs from the ground makes its own gradient.
 *
 * So leave the ground alone and move the LEVELS. A contour at height v cannot enter a region whose values never
 * reach v — so sample the field over each block of text, forbid those value ranges, and space the levels through
 * whatever is left. No line can touch a word, by construction, and nothing is bent out of shape to manage it:
 * the lines run above, below and between the words at their own natural spacing.
 */
export function clearLevels(
  f: (x: number, y: number) => number,
  boxes: Array<[number, number, number, number]>,
  count: number,
  { size = SIZE, res = 56, pad = 7, inset = 0.12 } = {},
) {
  const range = (x0: number, y0: number, x1: number, y1: number, n: number): [number, number] => {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= n; i++)
      for (let j = 0; j <= n; j++) {
        const v = f(x0 + (i / n) * (x1 - x0), y0 + (j / n) * (y1 - y0));
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    return [lo, hi];
  };
  const forbidden = boxes
    .map(([x0, y0, x1, y1]) => range(x0 - pad, y0 - pad, x1 + pad, y1 + pad, 14))
    .sort((a, b) => a[0] - b[0])
    .reduce<Array<[number, number]>>((acc, r) => {
      const last = acc[acc.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else acc.push([r[0], r[1]]);
      return acc;
    }, []);
  const [lo, hi] = range(0, 0, size, size, res);
  const free: Array<[number, number]> = [];
  let cur = lo;
  for (const [a, b] of forbidden) {
    if (a > cur) free.push([cur, Math.min(a, hi)]);
    cur = Math.max(cur, b);
  }
  if (cur < hi) free.push([cur, hi]);
  const usable = free
    .map(([a, b]) => [a + (b - a) * inset, b - (b - a) * inset] as [number, number])
    .filter(([a, b]) => b > a);
  const total = usable.reduce((acc, [a, b]) => acc + (b - a), 0);
  const out: number[] = [];
  for (let k = 0; k < count; k++) {
    let t = ((k + 0.5) / count) * total;
    for (const [a, b] of usable) {
      if (t <= b - a) { out.push(a + t); break; }
      t -= b - a;
    }
  }
  return out;
}

/**
 * The parting (round 3): a terrain over the whole cell, its lines running above, below and between the words.
 * No quiet corner — the field goes everywhere, and the level choice is what keeps it off the text.
 */
export function parting({
  tilt = [0.35, 0.75] as [number, number],
  seed = 12,
  count = 5,
  strength = 20,
  sigma = [34, 76] as [number, number],
  words = [] as Array<[number, number, number, number]>,
  lines = 4,
  res = 76,
}) {
  const terrain = sum((x, y) => tilt[0] * x + tilt[1] * y, grain(count, seed, strength, sigma));
  return contours(terrain, clearLevels(terrain, words, lines), res);
}

/**
 * k curves running across the cell as ordered graphs: same kind of curve, different amplitude, frequency and
 * phase, so they converge and separate. Ordered because each one is placed a full amplitude clear of the last.
 */
export function sheaf(k: number, { seed = 3, top = 26, clearance = 20, bleed = 30, size = SIZE } = {}): string[] {
  const rnd = mulberry32(seed);
  const parts = Array.from({ length: k }, () => ({ a: 10 + rnd() * 22, f: 0.7 + rnd() * 1.1, p: rnd() * TAU }));
  let base = top;
  return parts.map((c, i) => {
    base += i === 0 ? c.a : parts[i - 1]!.a + c.a + clearance;
    const line: Pt[] = [];
    for (let s = 0; s <= 60; s++) {
      const t = s / 60;
      const x = -bleed + t * (size + 2 * bleed);
      line.push([x, base + Math.sin(t * TAU * c.f + c.p) * c.a]);
    }
    return poly(line);
  });
}

/**
 * k curves leaving one origin off the frame, each bending and wobbling by a different amount.
 *
 * Ordered — and the ordering has to be argued in the right coordinate, or it is not an argument. Each curve is a
 * function of RADIUS from the shared origin, θᵢ(u), so two curves can be compared at the same distance out. Their
 * angles are `gap` apart at the origin; the bend is monotone in i, so it only ever widens that; and each wobble is
 * capped at 0.3 · gap, so the pair can close by at most 0.6 · gap. The order can never invert. A first draft gave
 * every curve its own bend from a seed, and the fourth line overtook the third — probe11 caught it.
 */
export function fan(
  k: number,
  { cx = -30, cy = 280, from = -74, spread = 62, reach = 420, near = 110, seed = 8, bend = 34, wobble = 0.3 } = {},
): string[] {
  const rnd = mulberry32(seed);
  const gap = spread / (k - 1);
  const parts = Array.from({ length: k }, () => ({
    w: (rnd() * 2 - 1) * gap * wobble,
    f: 1 + rnd() * 1.6,
    p: rnd() * TAU,
    far: reach * (0.82 + rnd() * 0.32),                             // a different edge each: radial, so it cannot reorder
  }));
  return parts.map((c, i) => {
    const a0 = from + gap * i;
    const b = (bend * i) / (k - 1);
    const line: Pt[] = [];
    for (let s = 0; s <= 60; s++) {
      const u = near + (s / 60) * (c.far - near);                   // parameterised by radius, not by t
      // …and started well out from the origin: four curves that all begin at the same point begin by touching,
      // which probe11 counts even where the frame hides it. At `near` the 21° gap is already 40 units wide.
      const n = u / reach;
      line.push(polar(cx, cy, u, a0 + b * n * n + c.w * Math.sin(n * TAU * c.f + c.p) * n));
    }
    return poly(line);
  });
}

/** k nested rings, each wobbling on its own, cropped by the frame. Ordered by radius at every angle. */
export function rings(k: number, { cx = 128, cy = 118, r0 = 42, gap = 34, seed = 5 } = {}): string[] {
  const rnd = mulberry32(seed);
  return Array.from({ length: k }, (_, i) => {
    const amp = 5 + rnd() * 9;                                      // < gap/2, so the order can never invert
    const f = 2 + Math.floor(rnd() * 3);
    const p = rnd() * TAU;
    const r = r0 + i * gap;
    const line: Pt[] = [];
    for (let s = 0; s <= 120; s++) {
      const a = (s / 120) * 360;
      line.push(polar(cx, cy, r + Math.sin((a / 360) * TAU * f + p) * amp, a));
    }
    return poly(line);
  });
}

/**
 * THE GENERATOR, round 8. Kept because the studio's record of round 8 should still draw what round 8 showed;
 * round 9 replaced it with `illo` below. `waveField` above is what rounds 6 and 7 drew.
 *
 * Two things were wrong in round 7, and they were the same thing. The curves were sharp where they should have
 * been smooth, and their bends were too small an angle — and both came from insisting the lines be exactly
 * equidistant. Equidistance is what an offset family gives, and an offset family cannot be tighter than the reach
 * of its own outermost line: bend the source curve past that and the offsets cusp. So the generator kept easing
 * the curve until it fitted, which left a shallow wave whose only visible feature was its tightest part.
 *
 * So spacing evenness became a dial rather than a law. At `even` = 1 the field is the distance from the curve and
 * the spacing is exactly equal; at `even` = 0 the lines are the curve TRANSLATED, which has no curvature limit at
 * all. And `swing` made the bend angle a parameter in its own right, in degrees, instead of an amplitude guessed
 * at through a wavelength. Both of those survive into round 9. What did not survive is the thing they share: at
 * either end of the dial, every line in the picture is the SAME CURVE — offset, or shifted. See `illo`.
 */
export interface Curve extends Omit<Wave, "wander"> {
  swing: number;
  even?: number;
}

export function offsetField({ seed, flow, scale, swing, breath, waves = 2, even = 1, taper = 0, words = [], res = 170 }: Curve): string[][] {
  const rnd = mulberry32(seed);
  const rad = (flow / 360) * TAU;
  const cos = Math.cos(rad), sin = Math.sin(rad);

  // components at rising frequency and falling weight, then scaled together so the steepest slope IS tan(swing)
  const base = TAU / (SIZE * scale * (0.9 + rnd() * 0.4));
  const comps = Array.from({ length: Math.max(1, waves) }, (_, k) => ({
    w: base * (k === 0 ? 1 : (1.75 + rnd() * 0.5) ** k),
    r: k === 0 ? 1 : (0.44 + rnd() * 0.12) ** k,
    p: rnd() * TAU,
  }));
  const slope = comps.reduce((sum, c) => sum + c.r * c.w, 0);
  let k = Math.tan((Math.min(72, Math.max(0, swing)) / 180) * Math.PI) / slope;

  // a curvature limit only where the spacing is held even; at even = 0 there is nothing to cusp
  const reach = SIZE * 0.55 * even;
  const bend = () => comps.reduce((sum, c) => sum + k * c.r * c.w * c.w, 0);
  for (let i = 0; i < 16 && bend() * reach > 0.8; i++) k *= 0.85;

  const g = (u: number) => comps.reduce((sum, c) => sum + k * c.r * Math.sin(c.w * u + c.p), 0);
  const gp = (u: number) => comps.reduce((sum, c) => sum + k * c.r * c.w * Math.cos(c.w * u + c.p), 0);
  const field = (x: number, y: number) => {
    const u = x * cos + y * sin;
    const v = -x * sin + y * cos;
    const d = even ? (v - g(u)) / Math.hypot(1, gp(u)) ** even : v - g(u);
    return taper ? d / (1 + taper * (u / SIZE)) : d;
  };

  const forbidden = words.map(([x0, y0, x1, y1]) => {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 12; i++)
      for (let j = 0; j <= 12; j++) {
        const value = field(x0 - 7 + (i / 12) * (x1 - x0 + 14), y0 - 7 + (j / 12) * (y1 - y0 + 14));
        lo = Math.min(lo, value); hi = Math.max(hi, value);
      }
    return [lo, hi] as [number, number];
  });
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= 48; i++)
    for (let j = 0; j <= 48; j++) {
      const value = field((i / 48) * SIZE, (j / 48) * SIZE);
      lo = Math.min(lo, value); hi = Math.max(hi, value);
    }
  const levels: number[] = [];
  for (let v = Math.ceil(lo / breath) * breath; v < hi; v += breath) {
    if (!forbidden.some(([a, b]) => v > a && v < b)) levels.push(v);
  }
  return contours(field, levels, res);
}

/* ------------------------------------------------------------------------------------------------------------ */

/*
 * Everything above this line is RETIRED, and kept on purpose (Patterns.md §8).
 *
 * `warpField` is what round 5 drew, `waveField` rounds 6 and 7, `offsetField` round 8, and `contours`, `sheaf`,
 * `fan`, `rings` and `parting` are round 2's and 3's geometry. None of it ships. It stays because the log's job
 * is to show what each round actually showed, and a record that redraws itself with today's generator is not a
 * record. The one function that does ship is `illo`, imported from the package at the top of this file.
 */
