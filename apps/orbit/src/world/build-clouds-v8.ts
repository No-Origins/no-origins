import * as THREE from "three/webgpu";
import { float, mix, mx_noise_float, normalWorld, positionWorld, smoothstep, uniform } from "three/tsl";

import { sunOf } from "./atmosphere-v8";
import { cloudPuffs } from "./clouds-v8";
import type { EnvironmentConfig } from "./environment-v8";

export type BuiltClouds = { object: THREE.InstancedMesh; set(environment: EnvironmentConfig): void };

/** Environment v5 clouds: one opaque instanced draw, one shared 180-triangle puff and one material.
 * Smooth normals round the puffs, with 44% fewer triangles than the old detail-3 geometry (320 per puff).
 * No volume marching, downloaded textures, lights, shadow maps or transparency overdraw. Shading controls write
 * uniforms: they never recreate geometry or recompile shaders. Clouds do no per-frame work.
 */
export function buildClouds(environment: EnvironmentConfig): BuiltClouds {
  const puffs = cloudPuffs(environment);
  const material = new THREE.MeshBasicNodeMaterial();
  const paint = uniform(new THREE.Color(environment.clouds));
  const light = uniform(new THREE.Color(environment.cloudLight));
  const shadow = uniform(new THREE.Color(environment.cloudShadow));
  const sun = uniform(sunOf(environment));
  const warmth = uniform(environment.cloudWarmth);
  const shade = uniform(environment.cloudShade);
  const softness = uniform(Math.max(0.05, environment.cloudSoftness));
  const grain = uniform(environment.cloudGrain);
  const grainSize = uniform(Math.max(0.02, environment.grainSize));
  const facing = normalWorld.dot(sun);
  const cloud = mix(paint, shadow, float(1).sub(smoothstep(softness.negate(), softness, facing)).mul(shade));
  const fine = mx_noise_float(positionWorld.div(grainSize));
  const broad = mx_noise_float(positionWorld.div(grainSize.mul(7)).add(13.7));
  const texture = float(1).add(fine.mul(0.75).add(broad.mul(0.25)).mul(grain));
  material.colorNode = mix(cloud, light, facing.max(0).mul(warmth)).mul(texture);
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), material, Math.max(1, puffs.length));
  const matrix = new THREE.Matrix4();
  const at = new THREE.Vector3();
  const size = new THREE.Vector3();
  const turn = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  puffs.forEach((puff, i) => {
    at.set(...puff.position);
    size.set(...puff.scale);
    turn.setFromAxisAngle(up, puff.turn);
    mesh.setMatrixAt(i, matrix.compose(at, turn, size));
  });
  mesh.count = puffs.length;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.name = "pastel-clouds";
  return {
    object: mesh,
    set(next) {
      paint.value.set(next.clouds);
      light.value.set(next.cloudLight);
      shadow.value.set(next.cloudShadow);
      sun.value.copy(sunOf(next));
      warmth.value = next.cloudWarmth;
      shade.value = next.cloudShade;
      softness.value = Math.max(0.05, next.cloudSoftness);
      grain.value = next.cloudGrain;
      grainSize.value = Math.max(0.02, next.grainSize);
    },
  };
}
