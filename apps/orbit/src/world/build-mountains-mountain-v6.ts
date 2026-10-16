import * as THREE from "three/webgpu";
import { mountainStart, type MountainConfig } from "./mountain-jig-v6";
import { bodyRing, headProfile } from "./mountain-profile-v6";
import { mountainNoise } from "./mountain-noise";
import type { Mountain } from "./mountains";

/** World.md W57: curved circular body, inclined neck, connector, and a separate solid head. */
export function mountainGeometry(mountain: Mountain, config = mountainStart(mountain)) {
  const { seed } = mountain;
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
    const ring = bodyRing(config, t);
    for (let side = 0; side <= sides; side++) {
      const angle = side / sides * Math.PI * 2;
      const cx = Math.cos(angle), cz = Math.sin(angle);
      const x = cx * ring.radius;
      const z = cz * ring.radius + ring.centre;
      const y = ring.y - cz * ring.rise;
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
  // The world floor cuts the body off: leave the bottom ring open; close only the inclined neck.
  for (const row of [rows]) {
    const ring = bodyRing(config, row / rows), centreIndex = points.length / 3;
    const paint = stone;
    points.push(0, ring.y, ring.centre); pigments.push(paint.r, paint.g, paint.b);
    for (let side = 0; side <= sides; side++) {
      const i = (row * (sides + 1) + side) * 3;
      points.push(points[i], points[i + 1], points[i + 2]); pigments.push(paint.r, paint.g, paint.b);
      if (side < sides) {
        const a = centreIndex + side + 1, b = a + 1;
        indices.push(centreIndex, b, a);
      }
    }
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

/** W57: the whole head receives the glass/mirror material; there is no separate slab. */
export function mountainCap(mountain: Mountain, material: THREE.Material, config: MountainConfig = mountainStart(mountain), stoneMaterial: THREE.Material = material) {
  const head = headProfile(config), object = new THREE.Group();
  object.name = "mountain-head-and-connector";
  // Extrude the drawn four-sided head: planar glass faces keep the reflections coherent.
  const outline = new THREE.Shape();
  outline.moveTo(head.centre - head.radius, head.baseY + head.rise);
  outline.lineTo(head.centre + head.radius, head.baseY - head.rise);
  outline.lineTo(head.topCentre + head.topRadius, head.topY);
  outline.lineTo(head.topCentre - head.topRadius, head.topY);
  outline.closePath();
  const geometry = new THREE.ExtrudeGeometry(outline, { depth: head.topRadius * 2, bevelEnabled: false, steps: 1 });
  const positions = geometry.getAttribute("position");
  for (let i = 0; i < positions.count; i++) {
    const z = positions.getX(i), x = positions.getZ(i) - head.topRadius;
    positions.setX(i, -x); positions.setZ(i, z);
  }
  geometry.computeVertexNormals();
  const slope = head.rise / head.radius;
  const colour = new THREE.Color(config.stone);
  const paintStone = (g: THREE.BufferGeometry) => g.setAttribute("color", new THREE.Float32BufferAttribute(Array.from({ length: g.getAttribute("position").count }, () => [colour.r, colour.g, colour.b]).flat(), 3));
  paintStone(geometry);
  const solid = new THREE.Mesh(geometry, material);
  solid.name = config.cap === "mirror" ? "glass-mountain-head" : "stone-mountain-head"; solid.castShadow = true; solid.receiveShadow = true;
  object.add(solid);
  if (config.headGap > 0) {
    const angle = Math.atan(slope), height = config.headGap * Math.cos(angle) * 0.8;
    const stem = new THREE.Mesh(new THREE.BoxGeometry(config.diameter * 0.095, height, config.diameter * 0.095), stoneMaterial);
    paintStone(stem.geometry);
    stem.rotation.x = angle;
    stem.position.set(0, config.height + height * Math.cos(angle) / 2, head.neck.centre + height * Math.sin(angle) / 2);
    stem.name = "neck-connector"; stem.castShadow = true;
    object.add(stem);
  }
  return object;
}
