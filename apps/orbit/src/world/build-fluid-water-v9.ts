import * as THREE from "three/webgpu";
import { cameraPosition, cos, Discard, float, Fn, fwidth, mix, mx_noise_float, positionLocal, positionWorld, sin, smoothstep, uniform, vec2, vec3 } from "three/tsl";
import { sunOf } from "./atmosphere-v9";
import type { EnvironmentConfig } from "./environment-v9";

/** Dreamy water, Environment v8: broad crossed swells, blue troughs, pink crests and fine pastel contour threads.
 * One adaptive 64–192-square sheet, one material. Threads are an antialiased shader pattern, not line objects.
 * Every crest is clipped out of the dome; the edge remains finite. Artistic controls update uniforms, while
 * Wavelength rebuilds the sheet's sampling density to keep broad swells smooth within the triangle budget.
 */
export function buildFluidWater(environment: EnvironmentConfig) {
  const clock = uniform(0);
  const waves = uniform(environment.waves);
  const height = uniform(environment.waveHeight);
  const crossing = uniform(environment.crossWaves);
  const softness = uniform(environment.waterSoftness);
  const haze = uniform(environment.waterHaze);
  const hazeColour = uniform(new THREE.Color(environment.waterHazeColour));
  const mistSize = uniform(environment.waterMistSize);
  const viscosity = uniform(environment.viscosity);
  const wavelength = uniform(environment.waveLength);
  const contrast = uniform(environment.waterContrast);
  const paint = uniform(new THREE.Color(environment.water));
  const pigment = uniform(new THREE.Color(environment.waterPigment));
  const threadPaint = uniform(new THREE.Color(environment.threadColour));
  const threads = uniform(environment.waterThreads);
  const density = uniform(environment.threadDensity);
  const width = uniform(environment.threadWidth);
  const grain = uniform(environment.waterGrain);
  const grainSize = uniform(environment.grainSize);
  const sun = uniform(sunOf(environment));
  const way = uniform(new THREE.Vector2());
  const radius = environment.radius;
  const reach = radius * environment.waterReach;
  const seaY = -radius + Math.min(environment.waterLevel, radius * 2);
  const segments = Math.min(192, Math.max(64, Math.ceil(reach * 24 / Math.max(2, environment.waveLength))));
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, fog: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(reach * 2, reach * 2, segments, segments), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = seaY;
  const time = clock.mul(float(1).div(viscosity.mul(4).add(1)));
  const length = wavelength.mul(softness.mul(0.65).add(1));
  const crossed = crossing.mul(float(1).sub(softness.mul(0.6)));
  const thirdWeight = float(0.22).mul(float(1).sub(softness.mul(0.7)));
  const normalise = crossed.add(thirdWeight).add(1);
  const local = vec2(positionLocal.x, positionLocal.y.negate());
  const across = vec2(way.y.negate(), way.x);
  const phase = local.dot(way).div(length).mul(Math.PI * 2).sub(time.mul(0.8));
  const second = local.dot(across).div(length.mul(0.8)).mul(Math.PI * 2).sub(time.mul(0.55)).add(1.7);
  const third = phase.mul(0.47).add(second.mul(0.35)).add(2.4);
  const amplitude = waves.mul(height);
  const crest = sin(phase).add(sin(second).mul(crossed)).add(sin(third).mul(thirdWeight))
    .div(normalise).mul(amplitude);
  material.positionNode = positionLocal.add(vec3(0, 0, crest));
  const here = positionWorld.xz;
  const level = positionWorld.y.sub(seaY).div(amplitude.max(0.001));
  // Analytic slopes keep the lighting smooth between vertices, rather than colouring each triangle as a facet.
  const p = here.dot(way).div(length).mul(Math.PI * 2).sub(time.mul(0.8));
  const q = here.dot(across).div(length.mul(0.8)).mul(Math.PI * 2).sub(time.mul(0.55)).add(1.7);
  const r = p.mul(0.47).add(q.mul(0.35)).add(2.4);
  const alongSlope = cos(p).add(cos(r).mul(thirdWeight.mul(0.47))).mul(Math.PI * 2).div(length);
  const acrossSlope = cos(q).mul(crossed).add(cos(r).mul(thirdWeight.mul(0.35)))
    .mul(Math.PI * 2).div(length.mul(0.8));
  const slope = way.mul(alongSlope).add(across.mul(acrossSlope)).mul(amplitude).div(normalise);
  const normal = vec3(slope.x.negate(), 1, slope.y.negate()).normalize();
  const lit = normal.dot(sun).abs();
  const blend = smoothstep(softness.mul(-0.7).sub(0.75), softness.mul(0.7).add(0.65), level)
    .sub(0.5).mul(contrast).add(0.5);
  const body = mix(paint, pigment, blend).mul(lit.mul(0.2).add(0.8));

  // Ruled threads curve gently in the surface's coordinates; the displaced sheet carries them over every swell.
  const field = here.div(length);
  const bending = sin(field.dot(across).mul(3).add(time.mul(0.12))).mul(0.1)
    .add(mx_noise_float(field.mul(0.8)).mul(0.08));
  const threadAt = field.dot(way).add(bending).mul(density);
  const distance = threadAt.fract().sub(0.5).abs();
  const aa = fwidth(threadAt).max(0.001);
  const line = float(1).sub(smoothstep(width.mul(0.5), width.mul(0.5).add(aa), distance));
  // Threads fade out as they become smaller than a pixel, keeping the horizon from shimmering.
  const resolved = float(1).sub(smoothstep(0.35, 1, aa));
  const threadColour = mix(threadPaint, pigment, blend.mul(0.45));
  const fine = mx_noise_float(positionWorld.div(grainSize));
  const texture = float(1).add(fine.mul(grain.mul(0.5)));
  // Atmospheric colour scatter, rather than screen blur: broad translucent-looking pigment veils in the water.
  const mistAt = vec3(here.div(mistSize).sub(way.mul(time.mul(0.025))), time.mul(0.015));
  const mist = mx_noise_float(mistAt).mul(0.5).add(0.5);
  const far = smoothstep(radius * 0.6, radius * 3, cameraPosition.sub(positionWorld).length());
  const veil = far.mul(0.55).add(mist.mul(0.25)).add(softness.mul(0.1)).mul(haze).min(0.8);
  material.colorNode = Fn(() => {
    Discard(positionWorld.length().lessThan(radius));
    Discard(here.length().greaterThan(reach));
    const surface = mix(body, threadColour, line.mul(resolved).mul(threads)).mul(texture);
    return mix(surface, hazeColour, veil);
  })();
  material.opacityNode = float(1).sub(smoothstep(reach * 0.85, reach, here.length()));
  mesh.geometry.computeBoundingSphere();
  mesh.geometry.boundingSphere!.radius += 8;
  const set = (next: EnvironmentConfig) => {
    waves.value = next.waves; height.value = next.waveHeight; crossing.value = next.crossWaves;
    softness.value = next.waterSoftness; haze.value = next.waterHaze;
    hazeColour.value.set(next.waterHazeColour); mistSize.value = Math.max(4, next.waterMistSize);
    viscosity.value = next.viscosity; wavelength.value = Math.max(2, next.waveLength);
    contrast.value = next.waterContrast; paint.value.set(next.water); pigment.value.set(next.waterPigment);
    threadPaint.value.set(next.threadColour); threads.value = next.waterThreads;
    density.value = next.threadDensity; width.value = next.threadWidth;
    sun.value.copy(sunOf(next)); grain.value = next.waterGrain; grainSize.value = Math.max(0.02, next.grainSize);
    const angle = THREE.MathUtils.degToRad(next.waveDirection);
    way.value.set(Math.sin(angle), -Math.cos(angle));
  };
  set(environment);
  return { mesh, clock, set };
}
