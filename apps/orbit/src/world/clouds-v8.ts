import type { EnvironmentConfig } from "./environment-v8";

export type CloudPuff = { position: [number, number, number]; scale: [number, number, number]; turn: number };

/** A deterministic sculpted sky, at most 60 × 8 puffs. No frame work, assets or volume marching.
 * Each cloud consumes the same random samples even when Puffiness changes; Count preserves the prefix.
 * Above is the clearance below the lowest puff, so taller clouds still stay above the dome.
 */
export function cloudPuffs(config: EnvironmentConfig): CloudPuff[] {
  const { radius, cloudHeight, cloudSize, cloudTallness, cloudPuffiness, cloudSpread, cloudScatter } = config;
  const random = seeded(config.cloudSeed);
  const puffs: CloudPuff[] = [];
  const count = Math.min(60, Math.max(0, Math.round(config.cloudCount)));
  const lobes = 3 + Math.round(Math.min(1, Math.max(0, cloudPuffiness)) * 5);
  for (let i = 0; i < count; i++) {
    // A golden-angle distribution, blended with seeded scatter. Count never participates in placement.
    const angle = i * 2.399963 + (random() - 0.5) * Math.PI * cloudScatter;
    const out = radius * cloudSpread * Math.sqrt(0.08 + random() * 0.92);
    const wide = radius * cloudSize * (0.75 + random() * 0.5);
    const middle = [Math.cos(angle) * out, radius + cloudHeight + wide * cloudTallness, Math.sin(angle) * out];
    for (let j = 0; j < 8; j++) {
      const r = wide * (0.35 + random() * 0.3);
      const x = (random() - 0.5) * wide * 1.6;
      const y = random() * wide * cloudTallness * 0.35;
      const z = (random() - 0.5) * wide * 0.8;
      if (j >= lobes) continue;
      puffs.push({
        position: [middle[0] + x, middle[1] + y, middle[2] + z],
        scale: [r, r * cloudTallness, r],
        turn: angle,
      });
    }
  }
  return puffs;
}

/** Fixed mulberry32 draw: a seed is a design choice, never a different sky each frame. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
