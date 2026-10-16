import { cloudBankVolume, cloudLighting, type CloudField } from "./clouds-v17";

/** Numeric-only worker contract. No renderer, world data or bitmap artwork crosses this boundary. */
export type CloudJob = { id: number; seed: number; wisps: number; scale: [number, number, number]; sun: [number, number, number]; coarse?: boolean };
export type CloudReply = { id: number; density: CloudField; lighting: CloudField };
export function cloudJob(job: CloudJob, cached?: { key: string; field: CloudField }) {
  const key = `${job.seed}:${job.wisps}:${job.coarse}`;
  const field = cached?.key === key ? cached.field : cloudBankVolume(job.seed, 1.7, job.wisps, job.coarse ? [64, 40, 40] : [128, 80, 80]);
  const lighting = cloudLighting(field, job.scale, job.sun, job.coarse ? [32, 24, 24] : [64, 40, 40]);
  return { reply: { id: job.id, density: field, lighting }, cache: { key, field } };
}
