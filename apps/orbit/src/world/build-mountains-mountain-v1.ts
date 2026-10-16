import * as THREE from "three/webgpu";
import { mountainStart, type MountainConfig } from "./mountain-jig-v1";
import type { Mountain } from "./mountains";

/** World.md W50: tapered stone monoliths, a planar slanted summit and moss in the lower fissures. */
export const CAP_SLOPE = 0.6;
export function mountainGeometry(mountain: Mountain, roughness = 0, config = mountainStart(mountain)) {
  const { seed } = mountain;
  const { height: top, width, depth } = config;
  const slope = Math.tan(config.tilt * Math.PI / 180);
  roughness = config.roughness + roughness * (1 - config.roughness);
  const rows = 64, sides = 128;
  const points: number[] = [], pigments: number[] = [], indices: number[] = [];
  const stone = new THREE.Color(config.stone), pale = new THREE.Color(config.stone).lerp(new THREE.Color("#eee3cf"), 0.3);
  const moss = new THREE.Color(config.mossColour), fern = new THREE.Color(config.mossColour).lerp(new THREE.Color("#b5c08a"), 0.3);
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    for (let side = 0; side <= sides; side++) {
      const angle = side / sides * Math.PI * 2;
      const cx = Math.cos(angle), cz = Math.sin(angle);
      // A rounded rectangle has broad rock faces and curved shoulders, rather than a cone.
      const square = Math.pow(Math.abs(cx) ** config.roundness + Math.abs(cz) ** config.roundness, -1 / config.roundness);
      const taper = 1 + (1 - t) ** 1.7 * config.taper;
      const flute = Math.sin(angle * 17 + seed + t * 0.5) * 0.018
        + Math.sin(angle * 37 - seed + t * 2) * 0.009;
      // Relief disappears at the summit so the stone meets the mirror without a ragged gap.
      const erosion = flute * (0.4 + roughness * 2) * Math.sin(Math.PI * t);
      const x = cx * square * width / 2 * (taper + erosion);
      const z = cz * square * depth / 2 * (taper + erosion);
      const y = t * (top + z * slope);
      points.push(x, y, z);
      const mineral = Math.sin(angle * 43 + seed + t * 53) * Math.sin(t * 107 + angle * 11);
      const paint = stone.clone().lerp(pale, 0.25 + mineral * 0.12);
      const growth = Math.max(0, Math.min(1, (config.moss - t + Math.sin(angle * 9 + seed + t * 12) * 0.12) * 3));
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
  return geometry;
}

/** The cap is a thin solid plate with its top exactly on the stone's inclined summit plane. */
export function mountainCap(mountain: Mountain, material: THREE.Material, config: MountainConfig = mountainStart(mountain)) {
  const { height: top, thickness } = config;
  const angle = config.tilt * Math.PI / 180;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(config.width * (1 + config.overhang), thickness, config.depth * (1 + config.overhang) / Math.cos(angle)), material);
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
