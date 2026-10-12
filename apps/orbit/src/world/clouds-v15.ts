import type { EnvironmentConfig } from "./environment-v15";

/** Distribution scale, independent of the world's navigation bounds. */
export const CLOUD_SCALE = 120;

export type CloudForm = {
  position: [number, number, number];
  scale: [number, number, number];
  turn: number;
  bend: number;
  phase: number;
};

/** W28: unequal heights and curved wind-aligned banks. The seed preserves the prefix as Count changes. */
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
      position: [Math.cos(angle) * out, config.cloudHeight + 16 + tall * ((i % 3 === 1 ? 1.45 : 2) + random()), Math.sin(angle) * out],
      scale: [wide * config.cloudStretch, tall, wide],
      turn: Math.PI / 2 - config.skyWind * Math.PI / 180 + (random() - 0.5) * config.cloudScatter,
      bend: (random() - 0.5) * 0.9,
      phase: random() * Math.PI * 2,
    };
  });
}

