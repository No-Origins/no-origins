import * as THREE from "three/webgpu";
import { mountainStart } from "./mountain-jig-v8";
import { mountainNoise } from "./mountain-noise";
import { bodyRing } from "./mountain-profile-v8";
import type { Mountain } from "./mountains";

/** W59: a separate raised coating with a sharp, balanced, irregular upper edge. */
export function mountainAlgae(mountain: Mountain, config = mountainStart(mountain)) {
  const rows = 32, sides = 128;
  const edge = Array.from({ length: sides }, (_, side) => {
    const angle = side / sides * Math.PI * 2;
    return mountainNoise(Math.cos(angle) * 2.4, 0, Math.sin(angle) * 2.4, mountain.seed)
      + mountainNoise(Math.cos(angle) * 4.8, 3, Math.sin(angle) * 4.8, mountain.seed + 31) * 0.25;
  });
  const mean = edge.reduce((a, b) => a + b, 0) / sides;
  const span = Math.max(0.01, ...edge.map((n) => Math.abs(n - mean)));
  const line = edge.map((n) => 0.5 + (n - mean) / span * 0.13);
  const points: number[] = [], colours: number[] = [], indices: number[] = [];
  const algae = new THREE.Color(config.mossColour);
  for (let row = 0; row <= rows + 1; row++) for (let side = 0; side <= sides; side++) {
    const t = Math.min(row, rows) / rows * line[side % sides];
    const angle = side / sides * Math.PI * 2, cx = Math.cos(angle), cz = Math.sin(angle);
    const ring = bodyRing(config, t), y = ring.y - cz * ring.rise;
    const grain = mountainNoise(cx * ring.radius * 0.3, y * 0.3, cz * ring.radius * 0.3, mountain.seed + 81);
    // The final ring returns to the stone, closing the small raised lip along the upper contour.
    const coat = row > rows ? 0 : 0.24 + grain * 0.08;
    points.push(cx * (ring.radius + coat), y, cz * (ring.radius + coat) + ring.centre);
    const colour = algae.clone().multiplyScalar(0.9 + grain * 0.16);
    colours.push(colour.r, colour.g, colour.b);
  }
  // Continue below the floor, open-ended, exactly as the stone wall does.
  const continuation = points.length / 3;
  for (let side = 0; side <= sides; side++) {
    const i = side * 3;
    points.push(points[i], -config.height * 0.4, points[i + 2]);
    colours.push(colours[i], colours[i + 1], colours[i + 2]);
    if (side < sides) indices.push(continuation + side, side, continuation + side + 1, continuation + side + 1, side, side + 1);
  }
  for (let row = 0; row <= rows; row++) for (let side = 0; side < sides; side++) {
    const a = row * (sides + 1) + side, b = a + 1, c = a + sides + 1, d = c + 1;
    indices.push(a, c, b, b, c, d);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const normals = geometry.getAttribute("normal");
  for (let row = 0; row <= rows + 1; row++) {
    const a = row * (sides + 1), b = a + sides;
    const normal = new THREE.Vector3().fromBufferAttribute(normals, a).add(new THREE.Vector3().fromBufferAttribute(normals, b)).normalize();
    normals.setXYZ(a, normal.x, normal.y, normal.z); normals.setXYZ(b, normal.x, normal.y, normal.z);
  }
  return geometry;
}
