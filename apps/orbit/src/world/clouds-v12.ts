import type { EnvironmentConfig } from "./environment-v12";

/** Distribution and noise scale, independent of the ground plane dimensions. */
export const CLOUD_SCALE = 120;

export type CloudForm = { position: [number, number, number]; scale: [number, number, number]; turn: number };

/** Fixed seed preserves the prefix as Count changes. All banks stand above the plane. */
export function cloudForms(config: EnvironmentConfig): CloudForm[] {
  let seed = config.cloudSeed >>> 0;
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: Math.min(60, Math.max(0, Math.round(config.cloudCount))) }, (_, i) => {
    const angle = i * 2.399963 + (random() - 0.5) * Math.PI * config.cloudScatter;
    const out = CLOUD_SCALE * config.cloudSpread * (0.55 + random() * 0.45);
    const wide = config.cloudSize * (0.75 + random() * 0.5);
    const tall = wide * config.cloudTallness * 0.8;
    return {
      position: [Math.cos(angle) * out, config.cloudHeight + tall * 1.5, Math.sin(angle) * out],
      scale: [wide * config.cloudStretch, tall, wide],
      turn: Math.PI / 2 - config.skyWind * Math.PI / 180 + (random() - 0.5) * config.cloudScatter,
    };
  });
}

/** Smoothly united unequal lobes, baked into one bounded density field with no internal mesh seams. */
export function cloudVolume(config: EnvironmentConfig, resolution = 96) {
  const forms = cloudForms(config);
  const reach = CLOUD_SCALE * config.cloudSpread + config.cloudSize * config.cloudStretch * 1.8;
  const bottom = config.cloudHeight;
  const top = bottom + config.cloudSize * config.cloudTallness * 4.8 + 8;
  const min: [number, number, number] = [-reach, bottom, -reach];
  const size: [number, number, number] = [reach * 2, top - bottom, reach * 2];
  const field = new Float32Array(resolution ** 3);
  for (const form of forms) {
    const c = Math.cos(form.turn), s = Math.sin(form.turn);
    for (const [offset, factor, lift] of [[0, 1, 0], [-0.58, 0.7, 0.18], [0.6, 0.62, -0.12]]) {
      const rx = form.scale[0] * factor, ry = form.scale[1] * factor, rz = form.scale[2] * factor;
      const cx = form.position[0] + offset * form.scale[0] * c, cy = form.position[1] + lift * form.scale[1], cz = form.position[2] - offset * form.scale[0] * s;
      const ex = Math.abs(c) * rx + Math.abs(s) * rz, ez = Math.abs(s) * rx + Math.abs(c) * rz;
      const lo = [cx - ex, cy - ry, cz - ez].map((v, a) => Math.max(1, Math.floor((v - min[a]) / size[a] * resolution)));
      const hi = [cx + ex, cy + ry, cz + ez].map((v, a) => Math.min(resolution - 2, Math.ceil((v - min[a]) / size[a] * resolution)));
      for (let z = lo[2]; z <= hi[2]; z++) for (let y = lo[1]; y <= hi[1]; y++) for (let x = lo[0]; x <= hi[0]; x++) {
        const wx = min[0] + (x + 0.5) / resolution * size[0] - cx, wy = min[1] + (y + 0.5) / resolution * size[1] - cy, wz = min[2] + (z + 0.5) / resolution * size[2] - cz;
        const q = ((wx * c - wz * s) / rx) ** 2 + (wy / ry) ** 2 + ((wx * s + wz * c) / rz) ** 2;
        if (q >= 1) continue;
        const i = (z * resolution + y) * resolution + x;
        field[i] += Math.sqrt(1 - q) * (1 - field[i]);
      }
    }
  }
  return { min, size, data: Uint8Array.from(field, (a) => Math.round(a * 255)), resolution };
}
