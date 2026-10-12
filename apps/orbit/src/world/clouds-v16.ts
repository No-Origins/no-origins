import type { EnvironmentConfig } from "./environment-v16";

export const CLOUD_SCALE = 120;
export type CloudForm = { position: [number, number, number]; scale: [number, number, number]; turn: number; phase: number };
export type CloudField = { data: Uint8Array; resolution: readonly [number, number, number] };
const smooth = (lo: number, hi: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
};

/** W30: start with one bank north of the start. Count preserves its prefix; navigation bounds do not scale the art. */
export function cloudForms(config: EnvironmentConfig): CloudForm[] {
  let seed = config.cloudSeed >>> 0;
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: Math.min(60, Math.max(0, Math.round(config.cloudCount))) }, (_, i) => {
    const angle = -Math.PI / 2 + i * 2.399963 + (i ? (random() - 0.5) * config.cloudScatter : 0);
    const out = CLOUD_SCALE * config.cloudSpread * (0.65 + random() * 0.35);
    const wide = config.cloudSize * (i ? 0.8 + random() * 0.4 : 1);
    const height = wide * config.cloudTallness * 1.6;
    return { position: [Math.cos(angle) * out - (i == 0 ? out * 0.6 : 0), config.cloudHeight + height / 2 + (i % 3) * height * 0.3, Math.sin(angle) * out],
      scale: [wide * config.cloudStretch, height, wide * 1.3],
      turn: (45 - config.skyWind) * Math.PI / 180 + (random() - 0.5) * config.cloudScatter,
      phase: random() * Math.PI * 2 };
  });
}

/** Sculpted gas, not a colour image. R density, G broad pigment, B medium pigment, A tooth.
 * Connected unequal lobes, 3D displacement and four erosion scales avoid the v14 ribbon cross-section.
 * All six borders are empty. */
export function cloudBankVolume(seed: number, phase: number, wisps: number, resolution: readonly [number, number, number] = [160, 96, 96]): CloudField {
  const [width, height, depth] = resolution;
  const data = new Uint8Array(width * height * depth * 4);
  const hash = (x: number, y: number, z: number) => {
    let n = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791) ^ seed;
    n = Math.imul(n ^ (n >>> 16), 2246822507);
    return ((n ^ (n >>> 13)) >>> 0) / 4294967295;
  };
  const noise = (x: number, y: number, z: number) => {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const sx = smooth(0, 1, x - ix), sy = smooth(0, 1, y - iy), sz = smooth(0, 1, z - iz);
    let v = 0;
    for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      v += hash(ix + dx, iy + dy, iz + dz) * (dx ? sx : 1 - sx) * (dy ? sy : 1 - sy) * (dz ? sz : 1 - sz);
    }
    return v;
  };
  const join = (a: number, b: number, radius: number) => {
    const h = Math.max(0, radius - Math.abs(a - b)) / radius;
    return Math.min(a, b) - h * h * radius * 0.25;
  };
  const lobes = Array.from({ length: 7 }, (_, i) => ({
    x: (i - 3) * 0.22, y: Math.sin(i * 1.35 + phase) * 0.15 + 0.07,
    z: Math.sin(i * 1.7 + phase) * 0.18,
    rx: 0.23 + hash(i, 1, 0) * 0.05, ry: 0.25 + hash(i, 2, 0) * 0.17, rz: 0.32 + hash(i, 3, 0) * 0.13,
  }));
  for (let z = 1; z < depth - 1; z++) for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const u = (x + 0.5) / width * 2 - 1, v = (y + 0.5) / height * 2 - 1, w = (z + 0.5) / depth * 2 - 1;
    if (Math.abs(u) > 0.96 || Math.abs(v) > 0.85 || Math.abs(w) > 0.8) continue;
    const broad = noise(u * 4 + 17, v * 2 + 11, w * 2 + 23);
    const warpY = noise(u * 6 + 7, v * 3 + 2, w * 3 + 6) - 0.5;
    const warpZ = noise(u * 6 + 31, v * 3 + 9, w * 3 + 16) - 0.5;
    const py = v + warpY * 0.22, pz = w + warpZ * 0.22;
    let distance = 2;
    for (const lobe of lobes) {
      const r = Math.sqrt(((u - lobe.x) / lobe.rx) ** 2 + ((py - lobe.y) / lobe.ry) ** 2 + ((pz - lobe.z) / lobe.rz) ** 2);
      distance = join(distance, (r - 1) * Math.min(lobe.rx, lobe.ry, lobe.rz), 0.09);
    }
    if (distance > 0.2 && (v > -0.05 || v < -0.6)) continue;
    const medium = noise(u * 15 + 5, py * 7 + 3, pz * 7 + 7);
    const fine = noise(u * 33 + 23, py * 16 + 12, pz * 16 + 9);
    const tooth = noise(u * 67 + 2, py * 32 + 1, pz * 32 + 19);
    const eroded = distance + (0.5 - broad) * 0.16 + (0.5 - medium) * 0.26 + (0.5 - fine) * 0.115 + (0.5 - tooth) * 0.045;
    const body = (1 - smooth(-0.012, 0.027, eroded)) * smooth(0.22, 0.68, medium * 0.7 + fine * 0.3);
    const shell = (1 - smooth(0.04, 0.12, eroded)) * wisps * 0.025;
    const wakeY = -0.3 + Math.sin(u * 7 + phase) * 0.1 + warpY * 0.2;
    const wake = Math.sqrt((u / 0.92) ** 4 + ((v - wakeY) / 0.12) ** 2 + ((w - Math.sin(u * 4 + phase) * 0.2) / 0.43) ** 2);
    const trail = (1 - smooth(0.55, 1.05, wake + (0.5 - medium) * 1.5 + (0.5 - fine) * 0.65)) * wisps * 0.09;
    const border = smooth(0.97, 0.88, Math.abs(u)) * smooth(0.9, 0.78, Math.abs(v)) * smooth(0.84, 0.73, Math.abs(w));
    const i = ((z * height + y) * width + x) * 4;
    data[i] = Math.round(Math.min(1, body + shell + trail) * border * 255);
    data[i + 1] = Math.round(noise(u * 4 + 43, py * 2.5 + 7, pz * 0.45 + 5) * 255); data[i + 2] = Math.round(medium * 255); data[i + 3] = Math.round(tooth * 255);
  }
  return { data, resolution };
}

/** Trilinear density; outside is empty rather than clamped to an edge. */
export function densityAt(field: CloudField, x: number, y: number, z: number): number {
  if (x <= 0 || x >= 1 || y <= 0 || y >= 1 || z <= 0 || z >= 1) return 0;
  const [w, h, d] = field.resolution;
  const px = x * w - 0.5, py = y * h - 0.5, pz = z * d - 0.5;
  const ix = Math.max(0, Math.floor(px)), iy = Math.max(0, Math.floor(py)), iz = Math.max(0, Math.floor(pz));
  const sx = Math.max(0, px - ix), sy = Math.max(0, py - iy), sz = Math.max(0, pz - iz);
  let value = 0;
  for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
    const i = ((Math.min(d - 1, iz + dz) * h + Math.min(h - 1, iy + dy)) * w + Math.min(w - 1, ix + dx)) * 4;
    value += field.data[i] / 255 * (dx ? sx : 1 - sx) * (dy ? sy : 1 - sy) * (dz ? sz : 1 - sz);
  }
  return value;
}

/** W30: cache integrated optical depth toward the sun and open sky when light changes.
 * R/G: metres of density / 128. B: local occupancy for diagnostics. The shader integrates scattered colour
 * at every view sample; this numeric cache is not a painted cloud asset. */
export function cloudLighting(field: CloudField, scale: readonly number[], localSun: readonly number[], resolution: readonly [number, number, number] = [112, 64, 64]): CloudField {
  const [w, h, d] = resolution, data = new Uint8Array(w * h * d * 4);
  const ray = (x: number, y: number, z: number, direction: readonly number[]) => {
    let tau = 0, previous = 0;
    for (const distance of [2, 5, 9, 15, 23, 34, 49, 70, 100, 140, 195, 270]) {
      const mid = (previous + distance) / 2;
      tau += densityAt(field, x + direction[0] * mid / scale[0], y + direction[1] * mid / scale[1], z + direction[2] * mid / scale[2]) * (distance - previous);
      previous = distance;
    }
    return tau;
  };
  for (let z = 0; z < d; z++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = (x + 0.5) / w, v = (y + 0.5) / h, s = (z + 0.5) / d;
    const density = densityAt(field, u, v, s);
    if (density < 0.002) continue;
    const i = ((z * h + y) * w + x) * 4;
    data[i] = Math.round(Math.min(1, ray(u, v, s, localSun) / 128) * 255);
    data[i + 1] = Math.round(Math.min(1, ray(u, v, s, [0, 1, 0]) / 128) * 255);
    data[i + 2] = Math.round(density * 255); data[i + 3] = 255;
  }
  return { data, resolution };
}
