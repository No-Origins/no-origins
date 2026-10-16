import { cloudSkyVolume, cloudLighting, cloudTooth, type CloudField } from "./clouds-v18";

/** Numeric-only worker contract. No renderer, world data or bitmap artwork crosses this boundary. */
export type CloudJob = { id: number; seed: number; wisps: number; origin: [number, number]; billow: [number, number]; scale: [number, number, number]; sun: [number, number, number]; coarse?: boolean };
export type CloudReply = { id: number; origin: [number, number]; density: CloudField; lighting: CloudField; tooth: CloudField };
export function cloudJob(job: CloudJob, cached?: { key: string; field: CloudField }) {
  const key = [job.seed, job.wisps, ...job.origin, ...job.billow, ...job.scale, job.coarse].join(":");
  const field = cached?.key === key ? cached.field : cloudSkyVolume(job.seed, job.wisps, job.origin, job.billow, job.scale, job.coarse ? [64, 40, 64] : [128, 64, 128]);
  const lighting = cloudLighting(field, job.scale, job.sun, job.coarse ? [32, 24, 32] : [64, 40, 64]);
  return { reply: { id: job.id, origin: job.origin, density: field, lighting, tooth: cloudTooth(job.seed) }, cache: { key, field } };
}
