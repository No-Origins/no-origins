import * as THREE from "three/webgpu";

import type { Mountain } from "./mountains";

/** World.md W41, W43, W44: different silhouettes, one grass-green pigment and white cap; roughness controls erosion. */
const clamp = (n: number) => Math.max(0, Math.min(1, n));
// A short smooth union rounds the saddle between summits instead of leaving a sharp join.
const join = (a: number, b: number) => { const h = Math.max(0, 0.09 - Math.abs(a - b)) / 0.09; return Math.max(a, b) + h * h * 0.09 * 0.25 * clamp((a + b) / 0.09); };
const ease = (a: number, b: number, n: number) => { const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t); };

export function mountainGeometry({ kind, top, radius, seed }: Mountain, roughness = 0) {
  const rings = 64, sides = 96;
  const points: number[] = [], pigments: number[] = [], indices: number[] = [];
  const [dark, light, highlight] = ["#91b86f", "#c6dbae", "#faf7f4"].map((paint) => new THREE.Color(paint));
  const plateau = kind === "mesa" || kind === "butte";
  const add = (r: number, angle: number) => {
    const scallop = (Math.sin(angle * 5 + seed) * 0.08 + Math.sin(angle * 9 - seed) * 0.035) * roughness;
    const stretch = kind === "ridge" ? 1.42 : kind === "butte" ? 0.76 : kind === "mesa" ? 1.18 : 1;
    const x = Math.cos(angle) * r * radius * stretch * (1 + scallop);
    const z = Math.sin(angle) * r * radius / stretch * (1 + scallop);
    const u = x / radius, v = z / radius;
    let mass: number;
    if (plateau) {
      // Broad tablelands versus narrow, steep towers; the flat top survives above the fog.
      const rim = (kind === "mesa" ? 0.68 : 0.39) + scallop * 0.3;
      mass = 1 - ease(rim, rim + (kind === "mesa" ? 0.2 : 0.35), r);
      mass += Math.sin(u * 8 + seed) * Math.cos(v * 7) * 0.012 * mass * roughness;
    } else if (kind === "hills") {
      const dome = (cx: number, cz: number, width: number) => Math.pow(Math.max(0, 1 - ((u - cx) ** 2 + (v - cz) ** 2) / width ** 2), 1.5);
      mass = join(dome(-0.27, 0.03, 0.85), dome(0.32, -0.12, 0.66) * 0.93);
    } else {
      const summit = (cx: number, cz: number, width: number, height: number) => (1 - ease(0, 1, Math.hypot(u - cx, v - cz) / width)) * height;
      mass = join(join(summit(-0.12, 0.04, 1, 1), summit(0.38, -0.18, 0.65, 0.87)), summit(-0.4, -0.25, 0.55, kind === "crag" ? 0.91 : 0.72));
      const ridge = Math.abs(Math.sin(angle * (kind === "crag" ? 7 : 5) + seed + r * 1.8));
      mass += ridge * (kind === "crag" ? 0.18 : 0.14) * Math.sin(Math.PI * r) * ease(0, 0.15, r) * roughness;
    }
    // Eroded flutes run down cliffs, with much gentler relief on the rounded hills.
    const grooves = Math.sin(angle * 23 + seed + r * 3) + Math.sin(angle * 41 - r * 5 + seed);
    const relief = grooves * (plateau ? 2.2 : kind === "hills" ? 0.3 : kind === "crag" ? 4 : 2.8) * Math.sin(Math.PI * r) * roughness;
    const y = Math.max(0, top * mass + relief * mass);
    points.push(x, y, z);
    // One material treatment on every landform, including flat tablelands and rounded hills.
    const paint = dark.clone().lerp(light, ease(0.08, 0.7, mass) * 0.4);
    // His requested pastel gradient spans most of the tip, rather than a narrow snow-cap band.
    const snowline = Math.sin(angle * 5 + seed) * 0.02 * roughness;
    paint.lerp(highlight, ease(0.48 + snowline, 0.98 + snowline, mass));
    pigments.push(paint.r, paint.g, paint.b);
  };
  add(0, 0);
  for (let ring = 1; ring <= rings; ring++) for (let side = 0; side < sides; side++) add(ring / rings, side / sides * Math.PI * 2);
  for (let side = 0; side < sides; side++) indices.push(0, 1 + (side + 1) % sides, 1 + side);
  for (let ring = 1; ring < rings; ring++) for (let side = 0; side < sides; side++) {
    const a = 1 + (ring - 1) * sides + side, b = 1 + (ring - 1) * sides + (side + 1) % sides;
    const c = a + sides, d = b + sides;
    indices.push(a, b, c, b, d, c);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(pigments, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
