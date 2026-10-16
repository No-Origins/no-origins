import type { MountainConfig } from "./mountain-jig-v7";

type Point = [number, number];
const bezier = (a: Point, b: Point, c: Point, d: Point, t: number): Point => a.map((v, i) => (1 - t) ** 3 * v + 3 * (1 - t) ** 2 * t * b[i] + 3 * (1 - t) * t ** 2 * c[i] + t ** 3 * d[i]) as Point;
/** W56: the complete side drawing, with its narrow sloping neck and curved shoulders. */
export const mountainLean = (c: MountainConfig) => c.height * Math.tan(c.lean * Math.PI / 180);
export function bodyRing(c: MountainConfig, t: number) {
  const q = 1 - t;
  const left = q < 0.2
    ? bezier([676, 403], [660, 431], [610, 444], [560, 474], q / 0.2)
    : bezier([560, 474], [390, 575], [338, 722], [300, 981], (q - 0.2) / 0.8);
  const right = q < 0.2
    ? bezier([782, 464], [782, 504], [811, 533], [845, 570], q / 0.2)
    : bezier([845, 570], [980, 716], [1019, 852], [1038, 981], (q - 0.2) / 0.8);
  const radius = c.diameter / 2 * (1 + ((right[0] - left[0]) / 106 - 1) * c.taper / (738 / 106 - 1));
  const centre = ((left[0] + right[0]) / 2 - 669) / 60 * mountainLean(c);
  const y = (981 - (left[1] + right[1]) / 2) / 547.5 * c.height;
  const slope = Math.tan(c.neckTilt * Math.PI / 180);
  const rise = (right[1] - left[1]) / 61 * c.diameter / 2 * slope;
  return { radius, centre, y, rise: Math.min(rise, c.height * 0.45 * t) };
}
export function headProfile(c: MountainConfig) {
  const neck = bodyRing(c, 1), slope = neck.rise / neck.radius;
  const radius = neck.radius * 141 / 106 * (1 + c.overhang);
  const topRadius = neck.radius * 110 / 106 * (1 + c.overhang);
  const centre = neck.centre + neck.radius * 17 / 106;
  const baseY = c.height - (centre - neck.centre) * slope - 0.02;
  const rise = radius * slope;
  const height = Math.max(c.headHeight, 2 * rise + 0.1);
  return { radius, topRadius, depth: c.diameter * c.headDepth / 2, centre, baseY, rise, topY: baseY - rise + height,
    topCentre: neck.centre + neck.radius * 94 / 106, neck };
}
export function mountainExtent(c: MountainConfig) {
  const head = headProfile(c);
  let radius = Math.max(Math.hypot(head.depth, Math.abs(head.centre) + head.radius), Math.hypot(head.depth, Math.abs(head.topCentre) + head.topRadius));
  for (let i = 0; i <= 64; i++) {
    const ring = bodyRing(c, i / 64);
    radius = Math.max(radius, Math.abs(ring.centre) + ring.radius);
  }
  return { radius, height: Math.max(head.topY, c.height + head.neck.rise) };
}
