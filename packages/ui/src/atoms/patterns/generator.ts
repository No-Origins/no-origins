import { SIZE, mulberry32 } from "./primitives";

/**
 * THE GENERATOR — v1, frozen 2026-09-11 (Patterns.md §6.0 and §6.0a).
 *
 * One function draws every illustration on the platform. That is the whole argument for it: six primitives freely
 * composed give six ways to be inconsistent, and one function with parameters cannot be inconsistent because there
 * is only one of it. Consistency stops being something a person maintains and becomes a property of the code.
 *
 * A picture is a FAMILY of curves, not one curve repeated. Each line has its own amplitude, its own phase and its
 * own distance from the one before. Every line is a graph over `u`, the card rotated to `flow`, with `v` across it:
 *
 *     Φ(u, s) = (s − mid)·M(u) + mid + A(s)·Σ rₖ sin(wₖu + pₖ + φ(s))
 *
 * and if ∂Φ/∂s > 0 everywhere then line `s` sits strictly below line `s′ > s` at EVERY point along the flow, so no
 * two can meet however differently they bend. That is principle 3's *ordered* guarantee, and it is deliberately the
 * weaker of the two on offer: level sets (contours of one field) cannot cross either, but they buy that by making
 * every line the same curve — which is exactly what was rejected in round 8. Being weaker is what buys the freedom.
 *
 * Being LOCAL is what makes it measurable. The same sampling that checks the condition returns the true gap between
 * each neighbouring pair, so the generator settles its own clearance rather than asserting it: if the tightest pair
 * is closer than MIN_GAP it eases `drift`, `spread` and `tempo` together and measures again. Nothing is random —
 * the same parameters always settle the same way, on the server and on the client.
 *
 * Eleven studio rounds are behind every number here; the log is Patterns.md §9, and the retired mechanisms
 * (`warpField`, `waveField`, `offsetField`) stayed in the studio so that record still draws what it showed.
 */

export type Pt = [number, number];

const TAU = Math.PI * 2;

/** A polyline, not a smoothed curve: smoothing can overshoot, and an overshoot could cross the next line. */
export const poly = (pts: Pt[]): string =>
  pts.map(([x, y], i) => `${i ? "L" : "M"} ${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`).join(" ");

/**
 * Every variable the picture has. Twelve numbers and the text to keep clear — v1's frozen vocabulary.
 *
 * The three DEVICES (`curl`, `tempo`, `pinch`) change what kind of family it is; the three DIALS (`drift`,
 * `spread`, `taper`) change its degree. Round 10 found the difference matters: dials stack, devices do not. One
 * device carried alone, or two at about half, is the working limit — every device near the top was rejected.
 */
export interface Family {
  /** Which picture. The only parameter that is not a design decision. */
  seed: number;
  /**
   * Degrees; the direction the family travels. NOT a free choice — it decides how much of the card the words
   * cost, and for a cell with a long caption that is most of it. Measure before choosing: `e2e/.mcp/flow.mjs`.
   */
  flow: number;
  /** Wavelength — how CLOSE the card stands. 1 is about one bend across the card. */
  scale: number;
  /** Degrees. The greatest angle the middle line departs from its flow — the openness of the bend. */
  swing: number;
  /** Units BETWEEN lines. The line count is an outcome of this, not an input. */
  breath: number;
  /** How many sine components make the shared curve — how varied each undulation is. Default 2. */
  waves?: number;
  /** 0–1. How much each line's curve differs from its neighbour's: amplitude and phase advance across the family. */
  drift?: number;
  /** 0–1. How unequal the gaps are — a slow swell along the family, never two tight gaps together. */
  spread?: number;
  /** 0–1. The family fans: gaps scale along the flow, so the lines open out one way and gather the other. */
  taper?: number;
  /** 0–1. The family sweeps around a centre far off the frame. Offsets become radii, so crossing is impossible. */
  curl?: number;
  /** 0–1. The wavelength differs from line to line — long and calm at one edge, short and quick at the other. */
  tempo?: number;
  /** −1–1. The spacing bows: a waist mid-travel and a flare at both ends (−), or the reverse (+). */
  pinch?: number;
  /**
   * REJECTED in round 11 — do not use in the library. Breaks a line where it meets a word instead of not drawing
   * that line at all, which frees `flow` completely and puts line ENDS inside the frame. It is kept only so the
   * studio's record of round 11 still draws what round 11 showed. Principle 7 stands: a field leaves through the
   * edges of the frame.
   */
  interrupt?: boolean;
  /** The text boxes to keep clear, as [x0, y0, x1, y1] in viewBox units (principle 7). Measure, never guess. */
  words?: Array<[number, number, number, number]>;
  /** Samples along the flow. 200 is smooth at every size we render; lower it only for a thumbnail sweep. */
  res?: number;
}

/** One line as the generator knows it: its height in the family, every sample, and the parts on the card. */
export interface Drawn { s: number; pts: Pt[]; runs: Pt[][] }

/** Centre to centre, in viewBox units. Below this two lines start to read as one thick one at the overview size. */
const MIN_GAP = 9;
/** Clear space kept around every word, in viewBox units — comfortably past the 8px `probe10` asks for. */
const PAD = 7;
/** How far along a line the break runs when a line is interrupted at a word, so the two ends read as a gap. */
const GAP_AT_WORD = 13;
/** Shorter than this and a fragment is debris rather than a line. */
const MIN_RUN = 24;
/** Interrupting only: how much of a line has to survive the words for it to still be worth calling a line. */
const KEEP_FRACTION = 0.55;

export function illoLines({
  seed, flow, scale, swing, breath, waves = 2, drift = 0.5, spread = 0.5, taper = 0,
  curl = 0, tempo = 0, pinch = 0, interrupt = false, words = [], res = 200,
}: Family): { lines: Drawn[]; gap: number; breath: number } {
  const rnd = mulberry32(seed);
  const rad = (flow / 360) * TAU;
  const cos = Math.cos(rad), sin = Math.sin(rad);

  // the card, in the family's own coordinates: u along the flow, v across it
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  for (const [x, y] of [[0, 0], [SIZE, 0], [SIZE, SIZE], [0, SIZE]] as Pt[]) {
    const u = x * cos + y * sin, v = -x * sin + y * cos;
    u0 = Math.min(u0, u); u1 = Math.max(u1, u);
    v0 = Math.min(v0, v); v1 = Math.max(v1, v);
  }
  const bleed = SIZE * 0.08;                                        // every line leaves the frame (principle 7)
  u0 -= bleed; u1 += bleed;
  const mid = (v0 + v1) / 2;
  const half = Math.max(1, (v1 - v0) / 2);

  // the shared kind of curve — what makes them a family rather than five unrelated drawings
  const base = TAU / (SIZE * scale * (0.9 + rnd() * 0.4));
  const comps = Array.from({ length: Math.max(1, waves) }, (_, k) => ({
    w: base * (k === 0 ? 1 : (1.75 + rnd() * 0.5) ** k),
    r: k === 0 ? 1 : (0.44 + rnd() * 0.12) ** k,
    p: rnd() * TAU,
  }));
  const weight = comps.reduce((s, c) => s + c.r, 0);
  const steep = comps.reduce((s, c) => s + c.r * c.w, 0);
  const amp = Math.tan((Math.min(72, Math.max(0, swing)) / 180) * Math.PI) / steep;   // the middle line swings `swing`
  const psi = rnd() * TAU;
  const jitter = Array.from({ length: 48 }, () => rnd() * 2 - 1);

  const taperK = Math.min(0.9, Math.max(0, taper));
  const pinchK = Math.max(-0.9, Math.min(0.9, pinch)) * (1 - taperK / 2);   // together they must keep M positive
  const curlK = Math.max(0, Math.min(1, curl));
  const uc = (u0 + u1) / 2;

  /**
   * How the gap scales along the travel. `taper` ramps it (the family opens one way), `pinch` bows it (the family
   * squeezes through the middle and flares at both ends, or the reverse). Both only ever multiply the spacing, so
   * whatever they do the order is untouched — M > 0 is the whole condition.
   */
  const M = (u: number) => {
    const t = (u - u0) / (u1 - u0);
    return 1 + taperK * (t - 0.5) - pinchK * 0.5 * Math.cos(TAU * t);
  };

  /**
   * Where a point at (travel u, offset off) actually lands (round 10).
   *
   * Straight, the spine is the line v = mid and offsets go across it. CURLED, the spine is an arc of radius R
   * tangent to that same line, and `off` becomes RADIUS from a centre far off the frame — so the family sweeps
   * instead of travelling. Ordering survives untouched, and in the strongest form we have: two circles of
   * different radius about one centre cannot meet, whatever they are doing. As R grows the arc straightens back
   * into the line, which is why curl 0 is exactly round 9 rather than nearly it.
   */
  const tx = cos, ty = sin;                                          // the flow direction
  const nx = -sin, ny = cos;                                         // across it, the direction offsets go
  const px = mid * nx, py = mid * ny;                                // the spine at u = 0
  const R = curlK ? (SIZE * 1.4) / curlK : 0;
  const place = curlK
    ? (u: number, off: number): Pt => {
        const th = (u - uc) / R;
        const r = R + off;
        const c = Math.cos(th), sn = Math.sin(th);
        return [
          px - R * nx + uc * tx + r * (c * nx + sn * tx),
          py - R * ny + uc * ty + r * (c * ny + sn * ty),
        ];
      }
    : (u: number, off: number): Pt => [px + u * tx + off * nx, py + u * ty + off * ny];

  /** How far past the card a line's offset can sit and still show — the wave carries it back into frame. */
  const span = (D: number) => half / Math.max(0.2, 1 - (taperK + Math.abs(pinchK)) / 2) + amp * (1 + 0.6 * D) * weight + breath;

  const reach = (u1 - u0) * (1 + curlK * 0.35);
  const N = Math.max(40, Math.round(res * (1 + curlK * 0.4)));
  const us = Array.from({ length: N + 1 }, (_, i) => uc - reach / 2 + (i / N) * reach);

  const build = (ease: number) => {
    const D = drift * ease, S = spread * ease, T = tempo * ease;

    /**
     * One line's offset from the spine. Three things make it its own curve rather than a copy of its neighbour's:
     * `drift` scales the amplitude and advances the phase, and `tempo` stretches the WAVELENGTH — so one edge of
     * the family runs long and calm while the other runs short and quick. Tempo is measured from the middle of
     * the travel so the lines agree there and disagree more the further out they go.
     */
    const off = (u: number, s: number) => {
      const t = (s - mid) / half;
      const a = amp * (1 + 0.6 * D * t);
      const ph = 2.2 * D * t;
      const k = 1 + T * t;
      // the wavelength stretches about uc: at k = 1 this is exactly round 9's argument, c.w · u + p + phase
      return (s - mid) * M(u) + a * comps.reduce((acc, c) => acc + c.r * Math.sin(c.w * (uc + k * (u - uc)) + c.p + ph), 0);
    };

    /** One line: where it goes, the parts of it that are on the card, and whether it meets a word. */
    const curve = (s: number) => {
      const pts = us.map((u) => place(u, off(u, s)));
      const runs: Pt[][] = [];
      let run: Pt[] = [];
      let seen = false, hits = false;
      const on: boolean[] = [];
      const under: boolean[] = [];
      for (let i = 0; i <= N; i++) {
        const [x, y] = pts[i]!;
        const inside = x >= -bleed && x <= SIZE + bleed && y >= -bleed && y <= SIZE + bleed;
        const word = words.some(([a, b, c, d]) => x >= a - PAD && x <= c + PAD && y >= b - PAD && y <= d + PAD);
        on.push(inside);
        under.push(word);
        if (inside) seen = true;
        if (inside && word) hits = true;
      }
      /**
       * A LABEL GAP, not a nick. Stopping exactly at the padded box leaves two stubs a hair apart wherever a line
       * only grazes a corner — probe11 measured 1.6px between two halves of one line that way. So the break is
       * widened along the line until the two ends are a real gap apart, which is what a contour map does when it
       * runs a label through a contour.
       */
      const grow = interrupt ? Math.max(1, Math.round(GAP_AT_WORD / (reach / N))) : 0;
      const cut = under.map((w, i) => {
        if (!interrupt) return false;
        for (let k = Math.max(0, i - grow); k <= Math.min(N, i + grow); k++) if (under[k]) return true;
        return false;
      });
      for (let i = 0; i <= N; i++) {
        if (on[i] && !cut[i]) run.push(pts[i]!);
        else if (run.length) {
          if (run.length > 1) runs.push(run);
          run = [];
        }
      }
      if (run.length > 1) runs.push(run);
      // a dash beside a letter is debris, not a line
      const len = (r: Pt[]) => r.reduce((acc, q, k) => acc + (k ? Math.hypot(q[0] - r[k - 1]![0], q[1] - r[k - 1]![1]) : 0), 0);
      const long = runs.filter((r) => len(r) >= MIN_RUN);

      /**
       * Interrupting is not the same as dashing. A line that merely CLIPS a word should be drawn with a gap in
       * it; a line that would spend most of its length under the type is not a line with a gap, it is a handful
       * of stubs, and a card full of stubs reads as hatching rather than as a field. So a height still has to
       * survive mostly intact to be drawn at all — the first attempt drew every height and the cards came out
       * as diagonal scratches.
       */
      let onCard = 0;
      for (let i = 1; i <= N; i++) if (on[i] && on[i - 1]) onCard += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
      const drawn = long.reduce((acc, r) => acc + len(r), 0);
      const mostly = onCard > 0 && drawn / onCard >= KEEP_FRACTION;
      if (interrupt) return { s, pts, on, runs: mostly ? long : [], seen, hits: false };
      return { s, pts, on, runs: long, seen, hits };
    };

    /**
     * The words do not take a line away, they take a BAND of offsets away — so find the band and lay the rhythm
     * through what is left, rather than laying it across the whole card and deleting whatever lands badly.
     * Deleting leaves a hole the size of the band; filling the free measure leaves a hole the size of the words.
     */
    const lo = mid - span(D), hi = mid + span(D);
    const fine = Math.max(0.8, breath / 10);
    const blocked: Array<[number, number]> = [];
    for (let s = lo; !interrupt && s <= hi; s += fine) {
      if (!curve(s).hits) continue;
      const last = blocked[blocked.length - 1];
      if (last && s - fine <= last[1]) last[1] = s + fine;
      else blocked.push([s - fine, s + fine]);
    }
    const free: Array<[number, number]> = [];
    let cur = lo;
    for (const [a, b] of blocked) {
      if (a > cur) free.push([cur, a]);
      cur = Math.max(cur, b);
    }
    if (cur < hi) free.push([cur, hi]);

    const heights: number[] = [];
    let i = 0;
    for (const [a, b] of free) {
      const inset = Math.min(0.12 * breath, 0.2 * (b - a));
      for (let s = a + inset; s <= b - inset; ) {
        heights.push(s);
        s += breath * (1 + S * (0.34 * Math.sin(i * 0.85 + psi) + 0.21 * jitter[i % jitter.length]!));
        i++;
      }
    }

    const kept = heights.map(curve).filter((c) => c.seen && !c.hits && c.runs.length);

    /**
     * The promise, measured. Ordering is what makes crossing impossible; this is the separate question of whether
     * two lines are far enough apart to read as two. Measured as a true distance between the drawn points, in a
     * window either side of each sample, which is what `probe11` does on the rendered SVG — so the generator and
     * the probe are asking the same question rather than two related ones.
     */
    let gap = Infinity;
    for (let k = 1; k < kept.length; k++) {
      const a = kept[k - 1]!, b = kept[k]!;
      for (let j = 0; j <= N; j++) {
        if (!a.on[j]) continue;
        const [ax, ay] = a.pts[j]!;
        for (let m = Math.max(0, j - 8); m <= Math.min(N, j + 8); m++) {
          const [bx, by] = b.pts[m]!;
          gap = Math.min(gap, Math.hypot(bx - ax, by - ay));
        }
      }
    }
    return { lines: kept.map((c) => ({ s: c.s, pts: c.pts, runs: c.runs })), gap };
  };

  let out = build(1);
  for (let i = 0; i < 14 && out.gap < MIN_GAP; i++) out = build(0.85 ** (i + 1));
  return { ...out, breath };
}

/**
 * The paths, which is all a picture needs: one array per line, each holding the parts of it that are on the card.
 * `illoLines` above is for anything that has to know where the lines actually ARE.
 */
export function illo(opts: Family): string[][] {
  return illoLines(opts).lines.map((l) => l.runs.map(poly));
}
