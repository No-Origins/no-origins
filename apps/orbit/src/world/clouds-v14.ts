import type { EnvironmentConfig } from "./environment-v14";

/** Distribution scale, independent of the world's navigation bounds. */
export const CLOUD_SCALE = 120;

export type CloudForm = {
  position: [number, number, number];
  scale: [number, number, number];
  turn: number;
  bend: number;
  phase: number;
};

/** W27: unequal heights and curved wind-aligned banks. The seed preserves the prefix as Count changes. */
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

/** W27: one bank's local field. Continuous twisted cross-sections make rolling folds rather than puff unions.
 * Local allocation keeps the folds resolved even when the banks are spread hundreds of metres apart.
 */
export function cloudBankVolume(seed: number, phase: number, bend: number, wisps: number, resolution = [128, 80, 80] as const) {
  const [width, height, depth] = resolution;
  const data = new Uint8Array(width * height * depth);
  const smooth = (lo: number, hi: number, value: number) => {
    const t = Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
    return t * t * (3 - 2 * t);
  };
  const seedPhase = (seed % 97) * 0.037;
  const hash = (x: number, y: number, z: number) => {
    let n = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791) ^ seed;
    n = Math.imul(n ^ (n >>> 16), 2246822507);
    return ((n ^ (n >>> 13)) >>> 0) / 4294967295;
  };
  const noise = (x: number, y: number, z: number) => {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const sx = smooth(0, 1, x - ix), sy = smooth(0, 1, y - iy), sz = smooth(0, 1, z - iz);
    let value = 0;
    for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      value += hash(ix + dx, iy + dy, iz + dz) * (dx ? sx : 1 - sx) * (dy ? sy : 1 - sy) * (dz ? sz : 1 - sz);
    }
    return value;
  };
  for (let z = 1; z < depth - 1; z++) for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const u = (x + 0.5) / width * 2 - 1;
    const py = (y + 0.5) / height * 2 - 1;
    const pz = (z + 0.5) / depth * 2 - 1;
    const taper = Math.sqrt(Math.max(0, 1 - (u / 0.94) ** 4));
    if (taper <= 0) continue;
    const cy = Math.sin(u * 4.8 + phase) * 0.2 + Math.sin(u * 9.4 + seedPhase) * 0.055;
    const cz = Math.sin(u * 2.8 + phase) * (0.08 + Math.abs(bend) * 0.2);
    const twist = u * 1.4 + Math.sin(u * 3.2 + phase) * 0.55;
    const dy = py - cy, dz = pz - cz;
    const v = dy * Math.cos(twist) - dz * Math.sin(twist);
    const w = dy * Math.sin(twist) + dz * Math.cos(twist);
    const wide = (0.42 + Math.sin(u * 5 + phase) * 0.055) * taper;
    const tall = (0.3 + Math.sin(u * 7.3 + phase) * 0.09 + Math.sin(u * 13.1 + seedPhase) * 0.035) * taper;
    // Smooth cross-section corrugation creates connected rolling crests and undercuts along the wind.
    const folded = v + Math.sin(w * 9 + u * 4.2 + phase) * 0.09 * taper;
    const radial = Math.sqrt((folded / tall) ** 2 + (w / wide) ** 2);
    const ridge = Math.sin(u * 9 + w * 12 + phase) * 0.06 + Math.sin(w * 17 - u * 4 + seedPhase) * 0.025;
    if (radial > 1.7) continue;
    // Irregular crest sizes and finer fraying remain subordinate to the continuous roll.
    const billow = noise(u * 9 + 11, v * 6 + 17, w * 6 + 23) - 0.5;
    const fibres = noise(u * 23 + 5, v * 18 + 3, w * 18 + 7) - 0.5;
    const surface = radial + ridge + billow * 0.8 + fibres * 0.3;
    const core = (1 - smooth(0.58, 1.05, surface)) * (0.65 + (1 - smooth(0, 0.7, surface)) * 0.35);
    const fringe = (1 - smooth(0.95, 1.25, surface)) * 0.05;
    const trailY = dy + 0.23 - Math.sin(u * 6 + phase) * 0.14 + Math.sin(dz * 7 + u * 8) * 0.04;
    const trail = Math.sqrt((trailY / (0.065 * taper)) ** 2 + ((dz - Math.sin(u * 5 + phase) * 0.18) / (0.54 * taper)) ** 2);
    const veil = (1 - smooth(0.3, 1.15, trail + fibres * 1.2)) * wisps * 0.16;
    data[(z * height + y) * width + x] = Math.round(Math.min(1, core + fringe + veil) * 255);
  }
  return { data, resolution };
}
