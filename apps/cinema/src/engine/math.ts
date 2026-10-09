/** Small, pure helpers the engine and the entries share. Nothing here reads the clock (Cinema-Engine.md E2). */

export const radians = (degrees: number) => (degrees * Math.PI) / 180;
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const smoothstep = (u: number) => u * u * (3 - 2 * u);

export const EASES = ["linear", "ease in", "ease out", "ease in out"] as const;
export type Ease = (typeof EASES)[number];

/** How far through a move, 0 to 1, by the ease it is set to. */
export function ease(kind: string, u: number) {
  const x = clamp(u, 0, 1);
  switch (kind as Ease) {
    case "ease in":
      return x * x * x;
    case "ease out":
      return 1 - (1 - x) ** 3;
    case "ease in out":
      return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
    default:
      return x;
  }
}

/** A number in [0, 1) for a seed and a place: the same seed and place give the same number, everywhere, always. */
export function random(seed: number, x: number, y = 0) {
  let h = Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(x | 0, 0x85ebca6b) ^ Math.imul(y | 0, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Smooth noise in [0, 1): `random` on a lattice, eased between its points, so near places are near in value. */
export function noise(seed: number, x: number, y: number) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = smoothstep(x - x0), fy = smoothstep(y - y0);
  const a = random(seed, x0, y0), b = random(seed, x0 + 1, y0);
  const c = random(seed, x0, y0 + 1), d = random(seed, x0 + 1, y0 + 1);
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
}

/**
 * A lens's field of view, in degrees, for three.js's vertical `fov`. The lens covers the frame's short side as a full
 * frame camera's 24mm covers a landscape frame, so a 35mm lens looks the same wide or vertical.
 */
export function fieldOfView(lens: number, aspect: number) {
  const short = 2 * Math.atan(12 / lens);
  const vertical = aspect >= 1 ? short : 2 * Math.atan(Math.tan(short / 2) / aspect);
  return (vertical * 180) / Math.PI;
}
