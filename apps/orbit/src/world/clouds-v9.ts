import type { EnvironmentConfig } from "./environment-v9";

export type CloudForm = { position: [number, number, number]; scale: [number, number, number]; turn: number };

/** One connected liquid form per cloud. Fixed placement preserves the prefix as Count changes.
 * Clearance covers the maximum shader deformation, so even the lowest fold stays above the dome.
 */
export function cloudForms(config: EnvironmentConfig): CloudForm[] {
  let seed = config.cloudSeed >>> 0;
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: Math.min(60, Math.max(0, Math.round(config.cloudCount))) }, (_, i) => {
    const angle = i * 2.399963 + (random() - 0.5) * Math.PI * config.cloudScatter;
    const out = config.radius * config.cloudSpread * Math.sqrt(0.08 + random() * 0.92);
    const wide = config.radius * config.cloudSize * (0.75 + random() * 0.5);
    const tall = wide * config.cloudTallness * 0.35;
    return {
      position: [Math.cos(angle) * out, config.radius + config.cloudHeight + tall * 3, Math.sin(angle) * out],
      scale: [wide * config.cloudStretch, tall, wide * 0.65],
      turn: Math.PI / 2 - config.skyWind * Math.PI / 180 + (random() - 0.5) * 0.4 * config.cloudScatter,
    };
  });
}
