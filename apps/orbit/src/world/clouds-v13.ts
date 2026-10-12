import type { EnvironmentConfig } from "./environment-v13";

/** Distribution scale, independent of the world's navigation bounds. */
export const CLOUD_SCALE = 120;

export type CloudForm = {
  position: [number, number, number];
  scale: [number, number, number];
  turn: number;
  bend: number;
  phase: number;
};

/** W26: unequal heights and curved wind-aligned banks. The seed preserves the prefix as Count changes. */
export function cloudForms(config: EnvironmentConfig): CloudForm[] {
  let seed = config.cloudSeed >>> 0;
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: Math.min(60, Math.max(0, Math.round(config.cloudCount))) }, (_, i) => {
    const angle = i * 2.399963 + (random() - 0.5) * Math.PI * config.cloudScatter;
    const out = CLOUD_SCALE * config.cloudSpread * (0.4 + random() * 0.6);
    const wide = config.cloudSize * (0.65 + random() * 0.65);
    const tall = wide * config.cloudTallness * (0.55 + random() * 0.25);
    return {
      position: [Math.cos(angle) * out, config.cloudHeight + 16 + tall * (2 + random()), Math.sin(angle) * out],
      scale: [wide * config.cloudStretch, tall, wide],
      turn: Math.PI / 2 - config.skyWind * Math.PI / 180 + (random() - 0.5) * config.cloudScatter,
      bend: (random() - 0.5) * 0.9,
      phase: random() * Math.PI * 2,
    };
  });
}

/** W26: a softly bounded density fringe around broad cores, with unequal lobes along a curved centreline.
 * Thin trails are density, not extra transparent meshes. The empty border covers the bounded shader deformation.
 */
export function cloudVolume(config: EnvironmentConfig, resolution = 128) {
  const forms = cloudForms(config);
  const reach = CLOUD_SCALE * config.cloudSpread + config.cloudSize * config.cloudStretch * 2.6 + 32;
  const bottom = config.cloudHeight;
  const top = bottom + config.cloudSize * config.cloudTallness * 5 + 32;
  const min: [number, number, number] = [-reach, bottom, -reach];
  const size: [number, number, number] = [reach * 2, top - bottom, reach * 2];
  const field = new Float32Array(resolution ** 3);
  const addLobe = (form: CloudForm, offset: number, factor: number, lift: number, strength: number) => {
    const c = Math.cos(form.turn), s = Math.sin(form.turn);
    const rx = form.scale[0] * factor * 0.7, ry = form.scale[1] * factor, rz = form.scale[2] * factor;
    const curve = Math.sin(offset * 2.4 + form.phase) * form.bend * form.scale[2];
    const cx = form.position[0] + offset * form.scale[0] * c + curve * s;
    const cy = form.position[1] + lift * form.scale[1];
    const cz = form.position[2] - offset * form.scale[0] * s + curve * c;
    // Support extends beyond the core; its low-density skirt can be feathered without erasing the core.
    const support = 1.55;
    const ex = (Math.abs(c) * rx + Math.abs(s) * rz) * support;
    const ez = (Math.abs(s) * rx + Math.abs(c) * rz) * support;
    const lo = [cx - ex, cy - ry * support, cz - ez].map((v, a) => Math.max(1, Math.floor((v - min[a]) / size[a] * resolution)));
    const hi = [cx + ex, cy + ry * support, cz + ez].map((v, a) => Math.min(resolution - 2, Math.ceil((v - min[a]) / size[a] * resolution)));
    for (let z = lo[2]; z <= hi[2]; z++) for (let y = lo[1]; y <= hi[1]; y++) for (let x = lo[0]; x <= hi[0]; x++) {
      const wx = min[0] + (x + 0.5) / resolution * size[0] - cx;
      const wy = min[1] + (y + 0.5) / resolution * size[1] - cy;
      const wz = min[2] + (z + 0.5) / resolution * size[2] - cz;
      const q = ((wx * c - wz * s) / rx) ** 2 + (wy / ry) ** 2 + ((wx * s + wz * c) / rz) ** 2;
      if (q >= support * support) continue;
      const skirt = Math.max(0, 1 - q / (support * support));
      const core = Math.pow(Math.max(0, 1 - q), 0.6);
      const halo = Math.exp(-q * 1.6) * skirt * skirt * 0.05;
      const density = Math.min(1, core * 0.85 + halo) * strength;
      const index = (z * resolution + y) * resolution + x;
      field[index] += density * (1 - field[index]);
    }
  };
  for (const form of forms) {
    for (let lobe = 0; lobe < 5; lobe++) {
      const offset = (lobe - 2) * 0.42;
      const factor = (0.62 + Math.sin(form.phase + lobe * 1.7) * 0.14) * (lobe === 0 || lobe === 4 ? 0.72 : 1);
      addLobe(form, offset, factor, Math.sin(form.phase + lobe * 1.2) * 0.4, 0.85);
    }
    if (config.cloudWisps > 0) {
      for (let trail = 0; trail < 3; trail++) {
        addLobe(form, 1.05 + trail * 0.18, 0.3 - trail * 0.055, -0.18, config.cloudWisps * (0.5 - trail * 0.12));
      }
    }
  }
  const hash = (x: number, y: number, z: number) => {
    let n = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791) ^ config.cloudSeed;
    n = Math.imul(n ^ (n >>> 16), 2246822507);
    return ((n ^ (n >>> 13)) >>> 0) / 4294967295;
  };
  const noise = (x: number, y: number, z: number) => {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const smooth = (v: number) => v * v * (3 - 2 * v);
    const sx = smooth(x - ix), sy = smooth(y - iy), sz = smooth(z - iz);
    let sum = 0;
    for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      sum += hash(ix + dx, iy + dy, iz + dz) * (dx ? sx : 1 - sx) * (dy ? sy : 1 - sy) * (dz ? sz : 1 - sz);
    }
    return sum;
  };
  for (let z = 1; z < resolution - 1; z++) for (let y = 1; y < resolution - 1; y++) for (let x = 1; x < resolution - 1; x++) {
    const index = (z * resolution + y) * resolution + x;
    if (field[index] === 0) continue;
    const scale = Math.max(12, config.cloudSize * 0.38);
    const wx = (min[0] + (x + 0.5) / resolution * size[0]) / scale;
    const wy = (min[1] + (y + 0.5) / resolution * size[1]) / scale;
    const wz = (min[2] + (z + 0.5) / resolution * size[2]) / scale;
    const fold = noise(wx, wy, wz) * 0.7 + noise(wx * 0.45 + 17.3, wy * 0.45, wz * 0.45) * 0.3;
    field[index] *= 0.48 + fold * 0.72;
  }
  return { min, size, data: Uint8Array.from(field, (a) => Math.round(a * 255)), resolution };
}
