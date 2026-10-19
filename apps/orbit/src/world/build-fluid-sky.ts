import * as THREE from "three/webgpu";
import { cameraPosition, float, hash, mix, mx_noise_float, mx_noise_vec3, positionWorld, screenCoordinate, smoothstep, uniform, vec3 } from "three/tsl";
import { sunOf } from "./atmosphere";
import type { AtmosphereSettings } from "./environment";

/** Pastel gases on one sky shell. A direction-space field has no UV seam or pole singularity.
 * Two noise scales and one domain warp suggest thick rolling gases without volume marching or texture assets.
 * Time comes from the sky's own speed clock; all artistic controls are uniforms.
 */
export function buildFluidSky(environment: AtmosphereSettings) {
  const clock = uniform(0);
  const paint = uniform(new THREE.Color(environment.sky));
  const pigment = uniform(new THREE.Color(environment.skyPigment));
  const horizon = uniform(new THREE.Color(environment.horizon));
  const light = uniform(new THREE.Color(environment.sunlight));
  const sun = uniform(sunOf(environment));
  const warmth = uniform(environment.warmth);
  const amount = uniform(environment.skyFlow);
  const scale = uniform(environment.skyScale);
  const viscosity = uniform(environment.skyViscosity);
  const turbulence = uniform(environment.skyTurbulence);
  const softness = uniform(environment.skySoftness);
  const wind = uniform(new THREE.Vector3());
  const direction = positionWorld.sub(cameraPosition).normalize();
  const time = clock.mul(float(1).div(viscosity.mul(4).add(1)));
  const drift = wind.mul(time.mul(0.12));
  const here = direction.mul(scale).sub(drift);
  const warp = mx_noise_vec3(here.mul(0.7).add(vec3(0, time.mul(0.06), 0))).mul(turbulence.mul(1.4));
  // High viscosity lengthens the folds along the wind rather than making fast, choppy noise.
  const stretched = here.sub(wind.mul(here.dot(wind)).mul(viscosity.mul(0.45)));
  const density = mx_noise_float(stretched.add(warp)).mul(0.8)
    .add(mx_noise_float(stretched.mul(2.1).add(warp).add(17.3)).mul(0.2));
  const blend = smoothstep(softness.mul(-0.65), softness.mul(0.65), density);
  const base = mix(horizon, paint, smoothstep(-0.12, 0.32, direction.y));
  const gases = mix(base, mix(paint, pigment, blend), amount);
  const facing = direction.dot(sun);
  const sunset = facing.max(0).pow(8).mul(warmth.mul(0.35));
  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false, fog: false });
  // W33: a pixel's worth of dither keeps the blue-to-peach gradient from banding.
  const dither = hash(screenCoordinate.x.add(screenCoordinate.y.mul(4096))).sub(0.5).mul(1.5 / 255);
  // W110: his sunset reference supersedes W28's disc-free sky. The solar disc and
  // atmospheric aureole live in direction space, behind cloud opacity and world geometry.
  const distanceFromSun = float(1).sub(facing.clamp(-1, 1));
  const amberHaze = distanceFromSun.mul(-28).exp().mul(0.6);
  const aureole = distanceFromSun.mul(-550).exp().mul(0.9);
  const disc = smoothstep(Math.cos(THREE.MathUtils.degToRad(1.65)), Math.cos(THREE.MathUtils.degToRad(1.5)), facing);
  const sunSky = mix(gases, light, sunset).add(vec3(1.4, 0.42, 0.035).mul(amberHaze));
  const haloSky = sunSky.add(vec3(2.4, 0.65, 0.035).mul(aureole));
  material.colorNode = mix(haloSky, vec3(2.5, 0.22, 0.008), disc).add(dither);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(10000, 48, 32), material);
  mesh.name = "open-sky-background";
  mesh.renderOrder = -3;
  const set = (next: AtmosphereSettings) => {
    paint.value.set(next.sky); pigment.value.set(next.skyPigment); horizon.value.set(next.horizon);
    light.value.set(next.sunlight); sun.value.copy(sunOf(next)); warmth.value = next.warmth;
    amount.value = next.skyFlow; scale.value = next.skyScale; viscosity.value = next.skyViscosity;
    turbulence.value = next.skyTurbulence; softness.value = Math.max(0.05, next.skySoftness);
    const angle = THREE.MathUtils.degToRad(next.skyWind);
    wind.value.set(Math.sin(angle), 0, -Math.cos(angle));
  };
  set(environment);
  return { mesh, clock, set };
}
