import type { MountainConfig } from "./mountain-jig";
import { mountainNoise } from "./mountain-noise";

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
  const baseY = c.height + c.neckLength - (centre - neck.centre) * slope - 0.02;
  const rise = radius * slope;
  const height = Math.max(c.headHeight, 2 * rise + 0.1);
  const connector = connectorProfile(c);
  return { radius, topRadius, depth: c.headDepthMetres / 2, centre, baseY, rise, topY: Math.max(baseY - rise + height, connector.tipY + connector.bulbRadius + 0.1),
    topCentre: neck.centre + neck.radius * 94 / 106, neck };
}
/** W62: the stem enters both volumes; its bulb sits just inside the glass underside. */
export function connectorProfile(c: MountainConfig) {
  const neck = bodyRing(c, 1), radius = c.neckDiameter / 2;
  const baseY = c.height - radius * neck.rise / neck.radius - 0.2;
  const glassY = c.height + c.neckLength - 0.02;
  const bulbRadius = c.lightSize / 2;
  const tipY = glassY + Math.max(bulbRadius * 0.75, radius * neck.rise / neck.radius + 0.2);
  return { centre: neck.centre, radius, baseY, tipY, bulbRadius };
}
export function mountainExtent(c: MountainConfig) {
  const head = headProfile(c);
  const connector = connectorProfile(c);
  let radius = Math.max(Math.hypot(head.depth, Math.abs(head.centre) + head.radius), Math.hypot(head.depth, Math.abs(head.topCentre) + head.topRadius));
  for (let i = 0; i <= 64; i++) {
    const ring = bodyRing(c, i / 64);
    radius = Math.max(radius, Math.abs(ring.centre) + ring.radius + c.algaeThickness * 1.2);
  }
  radius = Math.max(radius, Math.abs(connector.centre) + Math.max(connector.radius, connector.bulbRadius));
  return { radius, height: Math.max(head.topY, c.height + head.neck.rise, connector.tipY + connector.bulbRadius) };
}

/**
 * W62: the algae's seeded brush line, a share of the body's height a side (128 sides): its coverage, contour scale
 * and asymmetry drawn from the pattern seed and widened by Variation, with broken marks and flecks along it. Its crest
 * is where version 13 drew the algae's top.
 */
export function algaeLine(patternSeed: number, variation: number) {
  const seed = Math.round(patternSeed), sides = 128;
  const draw = (offset: number) => (mountainNoise(offset, 7, 19, seed) + 1) / 2;
  const level = 0.46 + (draw(1) - 0.5) * 0.22 * variation;
  const amplitude = 0.04 + draw(2) * 0.16 * variation;
  const scale = 1.5 + draw(3) * 3.5, phase = draw(4) * Math.PI * 2;
  return Array.from({ length: sides }, (_, side) => {
    const angle = side / sides * Math.PI * 2 + phase, x = Math.cos(angle), z = Math.sin(angle);
    const broad = mountainNoise(x * scale, 0, z * scale, seed);
    const broken = mountainNoise(x * scale * 3, 3, z * scale * 3, seed + 31);
    const flecks = mountainNoise(x * 28, 5, z * 28, seed + 91);
    return Math.max(0.24, Math.min(0.73, level + broad * amplitude + broken * amplitude * 0.4 + flecks * 0.018 * variation));
  });
}
/** W70: the line's crest, each mountain's starting Reach, so the control changed nothing he had seen. */
export const algaeCrest = (patternSeed: number, variation: number) => Math.max(...algaeLine(patternSeed, variation));
/** W70: the line scaled so its crest stands at Reach, the share of the body, floor (0) to neck (1), the algae climbs to. */
export function algaeContour(c: Pick<MountainConfig, "algaeSeed" | "algaeVariation" | "algaeReach">) {
  const line = algaeLine(c.algaeSeed, c.algaeVariation), crest = Math.max(...line);
  return line.map((t) => t * c.algaeReach / crest);
}
