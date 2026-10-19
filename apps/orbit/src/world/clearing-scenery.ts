import { SCREEN_BASE, screenDistance } from "./clearing-screen";
import * as THREE from "three/webgpu";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { mx_noise_float, positionLocal, bumpMap, float, vec3, texture, attribute, mix } from "three/tsl";

// World.md W110: the approved plan, in metres, shared by terrain and travel.
export const ISLAND_RADIUS = 22;
const HILLOCKS = [
  { x: -10.8, z: -12.2, rx: 7.5, rz: 7, height: 6.8 },
  { x: 15, z: -7.8, rx: 5.1, rz: 5.1, height: 3.05 },
  { x: -17, z: -1, rx: 4.8, rz: 4.8, height: 2.85 },
  { x: 15.7, z: 9, rx: 3.7, rz: 3.7, height: 2.2 },
];
function hillRadius(x: number, z: number, hill: typeof HILLOCKS[number]) {
  const dx = (x - hill.x) / hill.rx, dz = (z - hill.z) / hill.rz;
  const angle = Math.atan2(dz, dx);
  return Math.hypot(dx, dz) / (1 + 0.09 * Math.sin(angle * 3 + 0.6) + 0.045 * Math.cos(angle * 5));
}
// Stable world-space value noise: no angular stripes, repeated planting rings or per-frame randomness.
function terrainNoise(x: number, y: number, z = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const smooth = (v: number) => v * v * (3 - 2 * v);
  const fx = smooth(x - ix), fy = smooth(y - iy), fz = smooth(z - iz);
  const hash = (a: number, b: number, c: number) => {
    let n = Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 1442695041);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const lerp = THREE.MathUtils.lerp;
  const plane = (k: number) => lerp(lerp(hash(ix, iy, k), hash(ix + 1, iy, k), fx),
    lerp(hash(ix, iy + 1, k), hash(ix + 1, iy + 1, k), fx), fy);
  return lerp(plane(iz), plane(iz + 1), fz);
}
/** Shared irregular shoreline for the top, underside and Clay's boundary. */
export function islandRadius(angle: number) {
  const x = Math.cos(angle), z = Math.sin(angle);
  return ISLAND_RADIUS + (terrainNoise(x * 3.1 + 11, z * 3.1 - 8) - 0.5) * 2.6
    + (terrainNoise(x * 8.5 - 19, z * 8.5 + 4) - 0.5) * 0.8;
}
const ISLAND_DEPTH = 12.5 * 1.5;
export function meadowHeight(x: number, z: number) {
  // Small sandy rises connect the hills; the gathering remains almost level for podium docking.
  const open = THREE.MathUtils.smoothstep(Math.hypot(x, z - 5), 5, 13);
  let height = open * (terrainNoise(x * 0.21, z * 0.21) * 0.3
    + terrainNoise(x * 0.53 + 18, z * 0.53) * 0.09);
  for (const hill of HILLOCKS) {
    const r2 = hillRadius(x, z, hill) ** 2;
    if (r2 < 1) height += hill.height * (1 - r2) ** 2
      * (0.88 + 0.24 * terrainNoise(x * 0.34, z * 0.34));
    const apron = hillRadius(x, z, hill) / 1.35;
    if (apron < 1) height += 0.24 * (1 - apron * apron) ** 3;
  }
  // Roll the last 1.4 m over a soft shoulder, meeting the side with a vertical tangent.
  const shore = islandRadius(Math.atan2(z, x));
  const roll = THREE.MathUtils.clamp((Math.hypot(x, z) - shore + 1.4) / 1.4, 0, 1);
  const naturalHeight = height - 0.8 * (1 - Math.sqrt(Math.max(0, 1 - roll * roll)));
  // A level sandy bed meets the slab; a broad smooth apron blends back into the hills.
  const blend = THREE.MathUtils.smoothstep(screenDistance(x, z), 0.9, 3.8);
  return THREE.MathUtils.lerp(SCREEN_BASE, naturalHeight, blend);
}
function meadowCoverage(x: number, z: number, y = meadowHeight(x, z)) {
  const warp = terrainNoise(x * 0.19 + 43, z * 0.19) * 3;
  const broad = terrainNoise(x * 0.24 + warp, z * 0.24 - 17, y * 0.17);
  const detail = terrainNoise(x * 0.9, z * 0.9, y * 0.6);
  let hill = 0;
  for (const mound of HILLOCKS) hill = Math.max(hill,
    1 - THREE.MathUtils.smoothstep(hillRadius(x, z, mound), 0.55, 1.18));
  const peripheral = THREE.MathUtils.smoothstep(Math.hypot(x, z), 10, 18);
  // Grass forms islands separated by bare sand and stone, including bare stretches at the shore.
  const patch = THREE.MathUtils.smoothstep(broad * 0.8 + detail * 0.2, 0.43, 0.69);
  const slopePatch = THREE.MathUtils.smoothstep(broad + detail * 0.18, 0.36, 0.67);
  return Math.max(hill * slopePatch * 0.95, peripheral * patch * 0.86)
    * THREE.MathUtils.smoothstep(screenDistance(x, z), 1.1, 3);
}

/** W108: natural detail stays peripheral, on a self-contained floating island. */
export function buildClearingScenery(sand?: THREE.MeshStandardNodeMaterial, meadow?: THREE.Texture) {
  const stoneFootprints: THREE.Vector2[][] = [];
  const stoneHeights: number[] = [];
  const object = new THREE.Group();
  object.name = "island-meadow-and-stones";
  let seed = 841;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const paint = (color: string) => new THREE.MeshStandardNodeMaterial({ color, roughness: 1 });
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, name: string) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name; mesh.castShadow = mesh.receiveShadow = true; object.add(mesh);
    return mesh;
  };
  const stones = ["#b9aa97", "#c4b5a1", "#d0c2ae", "#a89e8c"].map(color => {
    const material = paint(color);
    material.vertexColors = true;
    material.normalNode = bumpMap(mx_noise_float(positionLocal.mul(95)).mul(0.012)
      .add(mx_noise_float(positionLocal.mul(22)).mul(0.018)), float(1));
    return material;
  });
  function stone(x: number, z: number, size: number) {
    if (screenDistance(x, z) < 1.1 + size * 1.8) return;
    if (meadowHeight(x, z) > 0.55 || Math.hypot(x, z) + size > islandRadius(Math.atan2(z, x)) - 1.4) return;
    const geometry = new THREE.IcosahedronGeometry(1, 3);
    const positions = geometry.getAttribute("position");
    const phase = random() * 30;
    const colors: number[] = [];
    const sx = 0.9 + random() * 0.45, sy = 0.62 + random() * 0.35, sz = 0.8 + random() * 0.4;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      // Continuous low-frequency distortion keeps shared vertices together and rounds the silhouette.
      const relief = 1 + Math.sin(x * 4 + phase) * Math.cos(z * 3 - y * 2) * 0.09
        + Math.sin(y * 7 + z * 5 + phase) * 0.035;
      positions.setXYZ(i, x * relief * sx * size, (Math.max(-0.65, y * relief) + 0.53) * sy * size, z * relief * sz * size);
      const mineral = 0.88 + (Math.sin(x * 19 + y * 12 + phase) * Math.sin(z * 15 - y * 7) + 1) * 0.065;
      colors.push(mineral, mineral, mineral * 0.98);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    // His preferred polygon finish: each triangle keeps its own normal and visible light plane.
    geometry.computeVertexNormals();
    const rock = add(geometry, stones[Math.floor(random() * stones.length)], "weathered-stone");
    rock.position.set(x, meadowHeight(x, z) - 0.025, z); rock.rotation.y = random() * Math.PI * 2;
    // Derive each collision footprint from the same deformed, rotated vertices that are drawn.
    const points: THREE.Vector2[] = [];
    const c = Math.cos(rock.rotation.y), s = Math.sin(rock.rotation.y);
    for (let i = 0; i < positions.count; i++) {
      const px = positions.getX(i), pz = positions.getZ(i);
      points.push(new THREE.Vector2(x + c * px + s * pz, z - s * px + c * pz));
    }
    points.sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2) =>
      (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    const half = (points: THREE.Vector2[]) => {
      const hull: THREE.Vector2[] = [];
      for (const point of points) {
        while (hull.length > 1 && cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) hull.pop();
        hull.push(point);
      }
      return hull;
    };
    const lower = half(points), upper = half([...points].reverse());
    stoneFootprints.push([...lower.slice(0, -1), ...upper.slice(0, -1)]);
    geometry.computeBoundingBox(); stoneHeights.push(geometry.boundingBox!.max.y + rock.position.y);
  }

  // One mesh for all tapered, curved grass ribbons, with root-to-tip and blade-to-blade variation.
  const blades: number[] = [], shades: number[] = [];
  const grassColors = ["#739344", "#90a957", "#a1b968", "#b5ba78", "#64853c"].map(c => new THREE.Color(c));
  const meadowBlades = ["#72963e", "#8cae4e", "#a3bd60", "#b7c977", "#638a3c"].map(c => new THREE.Color(c));
  function tuft(x: number, z: number, scale = 1, lush = false, meadow = false) {
    if (screenDistance(x, z) < 1.1 + scale * 0.7) return;
    const count = meadow ? 12 : lush ? 38 : 27;
    for (let blade = 0; blade < count; blade++) {
      const angle = random() * Math.PI * 2;
      const spread = Math.sqrt(random()) * 0.17 * scale;
      const bx = x + Math.cos(angle) * spread, bz = z + Math.sin(angle) * spread;
      const height = (meadow ? 0.13 + random() * 0.28 : 0.16 + random() * 0.42) * scale;
      const lean = (meadow ? 0.07 + random() * 0.2 : 0.12 + random() * 0.3) * scale;
      const width = (meadow ? 0.018 + random() * 0.025 : 0.02 + random() * 0.025) * scale;
      const side = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
      const palette = meadow || meadowHeight(bx, bz) > 0.02 ? meadowBlades : grassColors;
      const color = palette[Math.floor(random() * palette.length)];
      const at = (t: number, edge: number) => new THREE.Vector3(
        bx + Math.cos(angle) * lean * t * t + side.x * width * (1 - t) * edge,
        meadowHeight(bx, bz) + 0.012 + height * Math.sin(t * Math.PI / 2),
        bz + Math.sin(angle) * lean * t * t + side.z * width * (1 - t) * edge,
      );
      const segments = meadow ? 3 : 5;
      for (let segment = 0; segment < segments; segment++) {
        const lo = segment / segments, hi = (segment + 1) / segments;
        for (const [t, edge] of [[lo, -1], [hi, -1], [lo, 1], [lo, 1], [hi, -1], [hi, 1]]) {
          blades.push(...at(t, edge).toArray());
          const shade = color.clone().multiplyScalar(0.8 + t * 0.2);
          shades.push(shade.r, shade.g, shade.b);
        }
      }
    }
  }
  const clusters = [[-13, 2, 0.7], [12, 10, 0.55], [-7, -7, 0.6], [11, -5, 0.55]];
  for (const [x, z, size] of clusters) {
    stone(x, z, size);
    for (let i = 0; i < 12; i++) {
      const angle = random() * Math.PI * 2, distance = 0.7 + random() * 1.6;
      stone(x + Math.cos(angle) * distance, z + Math.sin(angle) * distance, 0.06 + random() * size * 0.27);
    }
    for (let i = 0; i < 16; i++) {
      const angle = random() * Math.PI * 2, distance = 0.6 + random() * 1.5;
      tuft(x + Math.cos(angle) * distance, z + Math.sin(angle) * distance, 0.65 + random() * 0.6);
    }
  }

  // One continuous top surface: sand undulations, four hills and meadow patches share vertices.
  const groundVertices: number[] = [], groundUVs: number[] = [], groundCover: number[] = [], groundIndices: number[] = [];
  const topSegments = 192, topRows = 112;
  for (let row = 0; row <= topRows; row++) for (let col = 0; col <= topSegments; col++) {
    const angle = col / topSegments * Math.PI * 2, radius = row / topRows * islandRadius(angle);
    const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
    // Ground is rotated into XZ by the caller; local Z becomes world height.
    groundVertices.push(x, -z, meadowHeight(x, z));
    groundUVs.push(x, -z); groundCover.push(meadowCoverage(x, z));
    if (row < topRows && col < topSegments) {
      const n = row * (topSegments + 1) + col;
      groundIndices.push(n, n + 1, n + topSegments + 1, n + 1, n + topSegments + 2, n + topSegments + 1);
    }
  }
  const groundGeometry = new THREE.BufferGeometry();
  groundGeometry.setAttribute("position", new THREE.Float32BufferAttribute(groundVertices, 3));
  groundGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(groundUVs, 2));
  groundGeometry.setAttribute("meadowCoverage", new THREE.Float32BufferAttribute(groundCover, 1));
  groundGeometry.setIndex(groundIndices); groundGeometry.computeVertexNormals();
  const groundMaterial = sand ? sand.clone() : paint("#f1deca");
  if (sand?.map && meadow) groundMaterial.colorNode = mix(
    texture(sand.map).rgb.mul(vec3(sand.color.r, sand.color.g, sand.color.b)),
    texture(meadow).rgb.mul(vec3(0.8, 0.88, 0.75)), attribute("meadowCoverage", "float"),
  );

  // A single eroded mineral mass. Broad continuous rock lobes replace the bolted-on boulder rows.
  const shellVertices: number[] = [], shellColors: number[] = [], shellUVs: number[] = [], shellMoss: number[] = [];
  const segments = 112, layers = 36;
  const rockColor = new THREE.Color("#b8aa96");
  // The underside has several offset roots and a broad uneven base, not a radial apex.
  const rockDepth = (x: number, z: number) => {
    const mass = (cx: number, cz: number, width: number, depth: number) =>
      depth * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (width * width));
    return 10.2 + terrainNoise(x * 0.22 + 6, z * 0.22 - 4) * 2.6
      + mass(-8, 4, 6.5, 6.1) + mass(8, -5, 7, 4.8) + mass(7, 10, 4.5, 3.3);
  };
  const shellPoint = (layer: number, col: number) => {
    const angle = (col % segments) / segments * Math.PI * 2, t = layer / layers;
    const nx = Math.cos(angle), nz = Math.sin(angle), shore = islandRadius(angle);
    const lobe = terrainNoise(nx * 4.4 + 13, nz * 4.4 - 7, t * 4.5);
    const fissure = terrainNoise(nx * 9 - 4, nz * 9 + 5, t * 7);
    const ledge = terrainNoise(nx * 3 + 7, nz * 3 - 15);
    const envelope = Math.sin(t * Math.PI) ** 2;
    // Broad shoulders, local shelves and undercuts, then a wide bottom with offset hanging roots.
    const radius = shore * Math.sqrt(Math.max(0, 1 - t * t))
      + envelope * ((lobe - 0.5) * 6.5 + (fissure - 0.5) * 1.2)
      + Math.exp(-(((t - 0.24 - ledge * 0.1) / 0.08) ** 2)) * (ledge - 0.35) * 3.4;
    const x = nx * radius, z = nz * radius;
    const shoulder = meadowHeight(nx * shore, nz * shore) * (1 - t) ** 8;
    const descent = THREE.MathUtils.smoothstep(t, 0, 0.7);
    const y = -Math.min(ISLAND_DEPTH, rockDepth(x, z)) * descent
      + (lobe - 0.5) * envelope * 1.6 + shoulder;
    return new THREE.Vector3(x, y, z);
  };
  for (let layer = 0; layer < layers; layer++) for (let col = 0; col < segments; col++) {
    const a = shellPoint(layer, col), b = shellPoint(layer, col + 1);
    const c = shellPoint(layer + 1, col), d = shellPoint(layer + 1, col + 1);
    for (const point of [a, b, c, b, d, c]) {
      shellVertices.push(...point.toArray());
      const mineral = terrainNoise(point.x * 0.4, point.z * 0.4, point.y * 0.5);
      const color = rockColor.clone().multiplyScalar(0.86 + mineral * 0.23);
      shellColors.push(color.r, color.g, color.b);
      const angle = Math.atan2(point.z, point.x);
      shellUVs.push(angle * ISLAND_RADIUS, -point.y * 1.6);
      const shore = islandRadius(angle);
      const rimX = Math.cos(angle) * shore, rimZ = Math.sin(angle) * shore;
      const continuity = meadowCoverage(rimX, rimZ);
      const crevice = terrainNoise(point.x * 0.34 + 31, point.z * 0.34, point.y * 0.3);
      const recess = 1 - terrainNoise(Math.cos(angle) * 4.4 + 13, Math.sin(angle) * 4.4 - 7,
        THREE.MathUtils.clamp(-point.y / 17, 0, 1) * 4.5);
      const depth = 2 + terrainNoise(rimX * 0.3, rimZ * 0.3) * 7;
      const curtain = continuity * (1 - THREE.MathUtils.smoothstep(-point.y, 0.5, depth));
      const undergrowth = THREE.MathUtils.smoothstep(crevice, 0.57, 0.76)
        * (1 - THREE.MathUtils.smoothstep(-point.y, 6, 11));
      shellMoss.push(Math.max(curtain * (0.35 + recess * 0.65), undergrowth * recess));
    }
  }
  const shellGeometry = new THREE.BufferGeometry();
  shellGeometry.setAttribute("position", new THREE.Float32BufferAttribute(shellVertices, 3));
  shellGeometry.setAttribute("color", new THREE.Float32BufferAttribute(shellColors, 3));
  shellGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(shellUVs, 2));
  shellGeometry.setAttribute("meadowCoverage", new THREE.Float32BufferAttribute(shellMoss, 1));
  shellGeometry.computeVertexNormals();
  // Average shared shoulder vertices; retain the lower rock’s faceted finish.
  const smoothingSource = shellGeometry.clone();
  smoothingSource.deleteAttribute("normal");
  const smoothShell = mergeVertices(smoothingSource, 0.0001);
  smoothShell.computeVertexNormals();
  const smoothFaces = smoothShell.toNonIndexed();
  const faceNormals = shellGeometry.getAttribute("normal"), softNormals = smoothFaces.getAttribute("normal");
  const shellPositions = shellGeometry.getAttribute("position");
  for (let i = 0; i < faceNormals.count; i++) {
    const softness = 0.85 + 0.15 * (1 - THREE.MathUtils.smoothstep(-shellPositions.getY(i), 1.5, 5));
    const normal = new THREE.Vector3().fromBufferAttribute(faceNormals, i)
      .lerp(new THREE.Vector3().fromBufferAttribute(softNormals, i), softness).normalize();
    faceNormals.setXYZ(i, normal.x, normal.y, normal.z);
  }
  smoothingSource.dispose(); smoothShell.dispose(); smoothFaces.dispose();
  const shellPaint = paint("#ffffff"); shellPaint.vertexColors = !meadow;
  shellPaint.normalNode = bumpMap(mx_noise_float(positionLocal.mul(35)).mul(0.025)
    .add(mx_noise_float(positionLocal.mul(3)).mul(0.045)), float(1));
  if (meadow) shellPaint.colorNode = mix(attribute("color", "vec3"),
    texture(meadow).rgb.mul(vec3(0.7, 0.79, 0.57)), attribute("meadowCoverage", "float"));
  add(shellGeometry, shellPaint, "floating-island-rock");

  // Small stones collect only at low hill feet, never on their crowns or upper slopes.
  for (const hill of HILLOCKS) for (let i = 0; i < 12; i++) {
    const angle = random() * Math.PI * 2, r = 0.91 + random() * 0.21;
    stone(hill.x + Math.cos(angle) * hill.rx * r,
      hill.z + Math.sin(angle) * hill.rz * r, 0.08 + random() * 0.25);
  }
  for (let i = 0; i < 110; i++) {
    const angle = random() * Math.PI * 2, r = 11 + random() * 10;
    const x = Math.cos(angle) * r, z = Math.sin(angle) * r;
    if (meadowCoverage(x, z) > 0.55) tuft(x, z, 0.4 + random() * 0.35);
  }

  const grassGeometry = new THREE.BufferGeometry();
  grassGeometry.setAttribute("position", new THREE.Float32BufferAttribute(blades, 3));
  grassGeometry.setAttribute("color", new THREE.Float32BufferAttribute(shades, 3));
  grassGeometry.computeVertexNormals();
  const grassMaterial = paint("#ffffff"); grassMaterial.vertexColors = true; grassMaterial.side = THREE.DoubleSide;
  const grass = add(grassGeometry, grassMaterial, "curved-grass-tufts");
  grass.castShadow = false;
  function touchesStone(hull: THREE.Vector2[], x: number, z: number, clearance: number) {
    let inside = true;
    for (let i = 0; i < hull.length; i++) {
      const a = hull[i], b = hull[(i + 1) % hull.length];
      const dx = b.x - a.x, dz = b.y - a.y;
      if (dx * (z - a.y) - dz * (x - a.x) < 0) inside = false;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.y) * dz) / Math.max(1e-12, dx * dx + dz * dz)));
      if ((x - a.x - t * dx) ** 2 + (z - a.y - t * dz) ** 2 < clearance ** 2) return true;
    }
    return inside;
  }
  return {
    object, groundGeometry, groundMaterial, stoneFootprints, stoneHeights,
    blocksStone(x: number, z: number, clearance: number, feet = -Infinity) {
      return stoneFootprints.some((hull,i) => feet < stoneHeights[i] - 0.001 && touchesStone(hull,x,z,clearance));
    },
    stoneSupport(x: number,z: number,from: number,clearance: number) {
      let top = 0;
      stoneFootprints.forEach((hull,i) => {
        if (stoneHeights[i] <= from + 0.001 && touchesStone(hull,x,z,clearance)) top = Math.max(top,stoneHeights[i]);
      });
      return top;
    },
  };
}
