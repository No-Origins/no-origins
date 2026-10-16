import * as THREE from "three/webgpu";
import { mountainStart, type MountainConfig } from "./mountain-jig-v3";
import { mountainNoise } from "./mountain-noise";
import type { Mountain } from "./mountains";

/** World.md W54: circular mountains at every level, with Taper 0–10 and organically rising/falling moss. */
/** Keep the tilted summit above the floor, including the shortest/widest permitted mountains. */
export const summitSlope = (config: MountainConfig) => Math.min(Math.tan(config.tilt * Math.PI / 180), config.height * 0.9 / (config.diameter / 2));
export function mountainGeometry(mountain: Mountain, config = mountainStart(mountain)) {
  const { seed } = mountain;
  const { height: top, diameter } = config;
  const slope = summitSlope(config);
  const rows = 64, sides = 128;
  const points: number[] = [], pigments: number[] = [], indices: number[] = [];
  const stone = new THREE.Color(config.stone), pale = new THREE.Color(config.stone).lerp(new THREE.Color("#eee3cf"), 0.3);
  const moss = new THREE.Color(config.mossColour), fern = new THREE.Color(config.mossColour).lerp(new THREE.Color("#b5c08a"), 0.3);
  // A seamless circular noise field gives broad rises and dips of similar weight, with no repeated wave.
  const edge = Array.from({ length: sides }, (_, side) => {
    const angle = side / sides * Math.PI * 2;
    return mountainNoise(Math.cos(angle) * 2.4, 0, Math.sin(angle) * 2.4, seed)
      + mountainNoise(Math.cos(angle) * 4.8, 3, Math.sin(angle) * 4.8, seed + 31) * 0.25;
  });
  const mean = edge.reduce((a, b) => a + b, 0) / sides;
  const span = Math.max(0.01, ...edge.map((value) => Math.abs(value - mean)));
  const mossLine = edge.map((value) => 0.5 + (value - mean) / span * 0.13);
  const ease = (low: number, high: number, n: number) => {
    const t = Math.max(0, Math.min(1, (n - low) / (high - low)));
    return t * t * (3 - 2 * t);
  };
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    for (let side = 0; side <= sides; side++) {
      const angle = side / sides * Math.PI * 2;
      const cx = Math.cos(angle), cz = Math.sin(angle);
      const radius = diameter / 2;
      const taper = 1 + (1 - t) ** 1.7 * config.taper;
      const x = cx * radius * taper;
      const z = cz * radius * taper;
      // The tilt comes from the summit's radius, so a very wide foot cannot pull a side below the floor.
      const y = t * (top + cz * radius * slope);
      points.push(x, y, z);
      const mineral = mountainNoise(x * 0.16, y * 0.16, z * 0.16, seed + 19);
      const paint = stone.clone().lerp(pale, 0.25 + mineral * 0.12);
      const line = mossLine[side % sides];
      const growth = 1 - ease(line - 0.1, line + 0.04, t);
      paint.lerp(moss.clone().lerp(fern, mineral * 0.3 + 0.4), growth);
      pigments.push(paint.r, paint.g, paint.b);
    }
  }
  for (let row = 0; row < rows; row++) for (let side = 0; side < sides; side++) {
    const a = row * (sides + 1) + side, b = a + 1, c = a + sides + 1, d = c + 1;
    indices.push(a, c, b, b, c, d);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(pigments, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // Both sides of the duplicated seam receive the same normal, so a light never draws a vertical join.
  const normals = geometry.getAttribute("normal");
  for (let row = 0; row <= rows; row++) {
    const first = row * (sides + 1), last = first + sides;
    const normal = new THREE.Vector3().fromBufferAttribute(normals, first)
      .add(new THREE.Vector3().fromBufferAttribute(normals, last)).normalize();
    normals.setXYZ(first, normal.x, normal.y, normal.z);
    normals.setXYZ(last, normal.x, normal.y, normal.z);
  }
  return geometry;
}

/** The cap is a thin solid plate with its top exactly on the stone's inclined summit plane. */
export function mountainCap(mountain: Mountain, material: THREE.Material, config: MountainConfig = mountainStart(mountain)) {
  const { height: top, thickness } = config;
  const angle = Math.atan(summitSlope(config));
  const cap = new THREE.Mesh(new THREE.BoxGeometry(config.diameter * (1 + config.overhang), thickness, config.diameter * (1 + config.overhang) / Math.cos(angle)), material);
  cap.rotation.x = -angle;
  cap.position.set(0, top + thickness / (2 * Math.cos(angle)), 0);
  cap.name = "slanted-reflective-summit";
  cap.castShadow = true;
  if (config.cap === "stone") {
    const count = cap.geometry.attributes.position!.count;
    const colour = new THREE.Color(config.stone);
    cap.geometry.setAttribute("color", new THREE.Float32BufferAttribute(Array.from({ length: count }, () => [colour.r, colour.g, colour.b]).flat(), 3));
  }
  return cap;
}
