import * as THREE from "three/webgpu";

/** World.md W39: distinct landforms from his mountain sheet, painted with subdued pastel pigments.
 * A radial height mesh keeps every formation solid from all camera directions, including mesa tops.
 */
type Landform = "alpine" | "ridge" | "crag" | "hills" | "butte" | "mesa";
type Mountain = { kind: Landform; x: number; z: number; top: number; radius: number; seed: number };

export const MOUNTAINS: readonly Mountain[] = [
  { kind: "alpine", x: -35, z: -280, top: 46, radius: 125, seed: 1 },
  { kind: "butte", x: -105, z: -160, top: 32, radius: 95, seed: 2 },
  { kind: "ridge", x: 95, z: -230, top: 38, radius: 155, seed: 3 },
  { kind: "mesa", x: 280, z: -360, top: 40, radius: 190, seed: 4 },
  { kind: "crag", x: -340, z: -380, top: 60, radius: 175, seed: 5 },
  { kind: "hills", x: -210, z: 160, top: 32, radius: 145, seed: 6 },
  { kind: "alpine", x: 230, z: 210, top: 56, radius: 170, seed: 7 },
  { kind: "butte", x: 440, z: -80, top: 46, radius: 145, seed: 8 },
  { kind: "mesa", x: -460, z: 20, top: 44, radius: 195, seed: 9 },
  { kind: "ridge", x: 10, z: -590, top: 64, radius: 220, seed: 10 },
  { kind: "hills", x: 510, z: 480, top: 50, radius: 225, seed: 11 },
  { kind: "crag", x: -520, z: 510, top: 66, radius: 210, seed: 12 },
];

const PAINTS: Record<Landform, readonly [string, string, string]> = {
  alpine: ["#999ab9", "#bec2d5", "#f0ede7"],
  ridge: ["#91afbd", "#b7ccd2", "#dce4df"],
  crag: ["#ad96be", "#c9b5d4", "#e4d6e7"],
  hills: ["#9eae83", "#bcc9a1", "#d5dcbc"],
  butte: ["#c98f83", "#e0b09a", "#efcfb3"],
  mesa: ["#c6a071", "#dfbd88", "#f3dcb4"],
};
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (a: number, b: number, n: number) => { const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t); };

export function mountainGeometry({ kind, top, radius, seed }: Mountain) {
  const rings = 52, sides = 96;
  const points: number[] = [], pigments: number[] = [], indices: number[] = [];
  const [dark, light, highlight] = PAINTS[kind].map((paint) => new THREE.Color(paint));
  const plateau = kind === "mesa" || kind === "butte";
  const add = (r: number, angle: number) => {
    const scallop = Math.sin(angle * 5 + seed) * 0.08 + Math.sin(angle * 9 - seed) * 0.035;
    const stretch = kind === "ridge" ? 1.42 : kind === "butte" ? 0.76 : kind === "mesa" ? 1.18 : 1;
    const x = Math.cos(angle) * r * radius * stretch * (1 + scallop);
    const z = Math.sin(angle) * r * radius / stretch * (1 + scallop);
    const u = x / radius, v = z / radius;
    let mass: number;
    if (plateau) {
      // Broad tablelands versus narrow, steep towers; the flat top survives above the fog.
      const rim = (kind === "mesa" ? 0.68 : 0.39) + scallop * 0.3;
      mass = 1 - ease(rim, rim + (kind === "mesa" ? 0.2 : 0.35), r);
      mass += Math.sin(u * 8 + seed) * Math.cos(v * 7) * 0.012 * mass;
    } else if (kind === "hills") {
      const dome = (cx: number, cz: number, width: number) => Math.pow(Math.max(0, 1 - ((u - cx) ** 2 + (v - cz) ** 2) / width ** 2), 1.5);
      mass = Math.max(dome(-0.27, 0.03, 0.85), dome(0.32, -0.12, 0.66) * 0.93);
    } else {
      const summit = (cx: number, cz: number, width: number, height: number) => Math.pow(Math.max(0, 1 - Math.hypot(u - cx, v - cz) / width), 1.15) * height;
      mass = Math.max(summit(-0.12, 0.04, 1, 1), summit(0.38, -0.18, 0.65, 0.87), summit(-0.4, -0.25, 0.55, kind === "crag" ? 0.91 : 0.72));
      const ridge = Math.abs(Math.sin(angle * (kind === "crag" ? 7 : 5) + seed + r * 1.8));
      mass += ridge * (kind === "crag" ? 0.18 : 0.14) * Math.sin(Math.PI * r) * ease(0, 0.15, r);
    }
    // Eroded flutes run down cliffs, with much gentler relief on the rounded hills.
    const grooves = Math.sin(angle * 23 + seed + r * 3) + Math.sin(angle * 41 - r * 5 + seed);
    const relief = grooves * (plateau ? 2.2 : kind === "hills" ? 0.3 : kind === "crag" ? 4 : 2.8) * Math.sin(Math.PI * r);
    const y = -180 + (top + 180) * mass + relief;
    points.push(x, y, z);
    const deposit = Math.sin(u * 12 + v * 8 + seed) * Math.sin(v * 17 - u * 5) * 0.12;
    const ridgePaint = plateau || kind === "hills" ? 0 : (Math.abs(Math.sin(angle * 5 + seed + r * 1.8)) - 0.5) * 0.48;
    let paint = dark.clone().lerp(light, clamp(0.58 + deposit + mass * 0.12 + ridgePaint));
    if (kind === "mesa") {
      const strata = Math.sin(y * 0.32 + Math.sin(u * 4 + v * 3) * 0.7);
      paint = dark.clone().lerp(highlight, ease(-0.3, 0.5, strata) * 0.76 + 0.12);
    } else if (kind === "alpine") {
      // Snow follows the unequal peaks and broken gullies, rather than a level white cap.
      const snowline = 0.79 + Math.sin(angle * 5 + seed) * 0.065 + Math.sin(u * 27 + v * 19) * 0.025;
      paint.lerp(highlight, ease(snowline - 0.035, snowline + 0.035, mass));
    } else if (plateau) {
      paint.lerp(highlight, ease(0.95, 1.01, mass) * 0.35);
    }
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
  geometry.setAttribute("strata", new THREE.Float32BufferAttribute(new Float32Array(points.length / 3).fill(kind === "mesa" ? 1 : 0), 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
