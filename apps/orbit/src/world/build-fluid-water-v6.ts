import * as THREE from "three/webgpu";
import { Discard, float, Fn, mix, mx_noise_float, mx_noise_vec3, positionLocal, positionWorld, sin, smoothstep, uniform, vec2, vec3 } from "three/tsl";
import type { EnvironmentConfig } from "./environment-v6";

/** Water has its own form: a finite sheet, low rolling geometry and folded pastel pigment bands.
 * One 64×64 plane, one material, no mirror render or volume simulation. Fragment cuts keep every crest outside
 * the dome. Direction, wave length, contrast, viscosity and pigments are uniforms; speed is its independent clock.
 */
export function buildFluidWater(environment: EnvironmentConfig) {
  const clock = uniform(0);
  const waves = uniform(environment.waves);
  const viscosity = uniform(environment.viscosity);
  const wavelength = uniform(environment.waveLength);
  const contrast = uniform(environment.waterContrast);
  const paint = uniform(new THREE.Color(environment.water));
  const pigment = uniform(new THREE.Color(environment.waterPigment));
  const grain = uniform(environment.grain);
  const grainSize = uniform(environment.grainSize);
  const way = uniform(new THREE.Vector2());
  const radius = environment.radius;
  const reach = radius * environment.waterReach;
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, fog: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(reach * 2, reach * 2, 64, 64), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -radius + Math.min(environment.waterLevel, radius * 2);
  const time = clock.mul(float(1).div(viscosity.mul(4).add(1)));
  // Local Y becomes −world Z after the plane's turn. Geometry moves gently; pigments carry the fluid's detail.
  const local = vec2(positionLocal.x, positionLocal.y.negate());
  const phase = local.dot(way).div(wavelength).mul(Math.PI * 2).sub(time.mul(0.8));
  const crest = sin(phase).add(sin(phase.mul(0.6).add(1.7)).mul(0.35)).mul(waves.mul(0.45));
  material.positionNode = positionLocal.add(vec3(0, 0, crest));
  const here = positionWorld.xz;
  const drift = way.mul(time.mul(0.9));
  const field = here.sub(drift).div(wavelength);
  const warp = mx_noise_vec3(vec3(field.mul(0.7), time.mul(0.06))).xy.mul(viscosity.mul(0.8).add(0.35));
  const folding = field.add(warp);
  const bands = sin(folding.dot(way).mul(Math.PI * 2)).mul(0.7)
    .add(mx_noise_float(folding.mul(1.5)).mul(0.3));
  const blend = smoothstep(-0.7, 0.7, bands).sub(0.5).mul(waves.mul(contrast)).add(0.5);
  const fine = mx_noise_float(positionWorld.div(grainSize));
  const texture = float(1).add(fine.mul(grain));
  material.colorNode = Fn(() => {
    Discard(positionWorld.length().lessThan(radius));
    Discard(here.length().greaterThan(reach));
    return mix(paint, pigment, blend).mul(texture);
  })();
  material.opacityNode = float(1).sub(smoothstep(reach * 0.85, reach, here.length()));
  // Displacement must be included in culling, even at Waves 1.
  mesh.geometry.computeBoundingSphere();
  mesh.geometry.boundingSphere!.radius += 1;
  const set = (next: EnvironmentConfig) => {
    waves.value = next.waves; viscosity.value = next.viscosity; wavelength.value = Math.max(2, next.waveLength);
    contrast.value = next.waterContrast; paint.value.set(next.water); pigment.value.set(next.waterPigment);
    grain.value = next.grain; grainSize.value = Math.max(0.02, next.grainSize);
    const angle = THREE.MathUtils.degToRad(next.waveDirection);
    way.value.set(Math.sin(angle), -Math.cos(angle));
  };
  set(environment);
  return { mesh, clock, set };
}
