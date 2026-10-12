import * as THREE from "three/webgpu";
import { float, mx_noise_float, positionWorld } from "three/tsl";

import type { EnvironmentConfig } from "./environment-v8";

/** One sun shared by the sky, cloud tones, land facets and sea reflections. Turn 0 looks down the world's −Z axis. */
export function sunOf({ sunHeight, sunTurn }: EnvironmentConfig) {
  const height = THREE.MathUtils.degToRad(sunHeight);
  const turn = THREE.MathUtils.degToRad(sunTurn);
  return new THREE.Vector3(Math.sin(turn) * Math.cos(height), Math.sin(height), -Math.cos(turn) * Math.cos(height));
}

/** Mineral grain anchored in world space, never to the screen or a clock. Two scales keep it from reading as stripes. */
export function grainOf({ grain, grainSize }: EnvironmentConfig) {
  const size = Math.max(0.02, grainSize);
  const fine = mx_noise_float(positionWorld.div(size));
  const broad = mx_noise_float(positionWorld.div(size * 7).add(13.7));
  return float(1).add(fine.mul(0.75).add(broad.mul(0.25)).mul(grain));
}
