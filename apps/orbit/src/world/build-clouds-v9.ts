import * as THREE from "three/webgpu";
import { attribute, cos, float, instanceIndex, mix, mx_noise_float, normalWorld, positionGeometry, positionLocal, positionWorld, sin, smoothstep, uniform, vec3 } from "three/tsl";

import { sunOf } from "./atmosphere-v9";
import { cloudForms } from "./clouds-v9";
import type { EnvironmentConfig } from "./environment-v9";

export type BuiltClouds = {
  object: THREE.InstancedMesh;
  set(environment: EnvironmentConfig): void;
  flow(seconds: number): void;
  readonly flowing: boolean;
};

/** Environment v9: a single connected liquid lens per cloud, wind-stretched, twisted and folded on the GPU.
 * One instanced draw of a shared smooth surface; no sphere clusters, volume marching or reflection pass.
 * Material controls and deformation are uniforms. The engine supplies an independent cloud clock.
 */
export function buildClouds(environment: EnvironmentConfig): BuiltClouds {
  const forms = cloudForms(environment);
  let current = environment;
  const material = new THREE.MeshBasicNodeMaterial();
  const clock = uniform(0);
  const flow = uniform(environment.cloudFlow);
  const viscosity = uniform(environment.cloudViscosity);
  const time = clock.div(viscosity.mul(5).add(1));
  const phase = time.mul(0.4).add(instanceIndex.toFloat().mul(0.731));
  const p = positionGeometry;
  const twist = sin(p.x.mul(2.1).add(phase)).mul(flow.mul(0.75));
  const bend = sin(p.x.mul(3.4).add(phase)).mul(flow.mul(0.3))
    .add(sin(p.z.mul(2.2).sub(phase.mul(0.7))).mul(flow.mul(0.15)));
  const taper = sin(p.x.mul(4).sub(phase)).mul(flow.mul(0.18)).add(0.82);
  const y = p.y.mul(cos(twist)).sub(p.z.mul(sin(twist))).mul(taper).add(bend);
  const z = p.y.mul(sin(twist)).add(p.z.mul(cos(twist))).mul(taper)
    .add(sin(p.x.mul(2.4).add(phase.mul(0.5))).mul(flow.mul(0.35)));
  // Instancing has already placed positionLocal. Deform the original geometry, then carry only the delta through
  // this instance's scale/rotation; warping placed coordinates would drag high clouds down through the world.
  const scale = attribute("cloudScale", "vec3");
  const angle = attribute("cloudTurn", "float");
  const dy = y.sub(p.y).mul(scale.y);
  const dz = z.sub(p.z).mul(scale.z);
  material.positionNode = positionLocal.add(vec3(dz.mul(sin(angle)), dy, dz.mul(cos(angle))));

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
  const pigment = mx_noise_float(positionWorld.div(environment.radius * 0.25).add(vec3(time.mul(0.04), 0, 0)))
    .mul(0.5).add(0.5).mul(flow.mul(0.2));
  material.colorNode = mix(cloud, light, facing.max(0).mul(warmth).add(pigment).min(1)).mul(texture);
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 40, 16), material, Math.max(1, forms.length));
  const matrix = new THREE.Matrix4();
  const at = new THREE.Vector3();
  const size = new THREE.Vector3();
  const turn = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  forms.forEach((form, i) => {
    at.set(...form.position);
    size.set(...form.scale);
    turn.setFromAxisAngle(up, form.turn);
    mesh.setMatrixAt(i, matrix.compose(at, turn, size));
  });
  mesh.geometry.setAttribute("cloudScale", new THREE.InstancedBufferAttribute(new Float32Array(forms.flatMap((form) => form.scale)), 3));
  mesh.geometry.setAttribute("cloudTurn", new THREE.InstancedBufferAttribute(new Float32Array(forms.map((form) => form.turn)), 1));
  mesh.count = forms.length;
  mesh.instanceMatrix.needsUpdate = true;
  // Bounds include every possible shader fold, so wind never makes a visible form disappear through culling.
  mesh.geometry.computeBoundingSphere();
  mesh.geometry.boundingSphere!.radius = 2.5;
  mesh.computeBoundingSphere();
  mesh.name = "liquid-clouds";
  return {
    object: mesh,
    flow(seconds) { clock.value = seconds; },
    get flowing() { return current.cloudCount > 0 && current.cloudFlow > 0 && current.cloudSpeed > 0; },
    set(next) {
      current = next;
      flow.value = next.cloudFlow;
      viscosity.value = next.cloudViscosity;
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
