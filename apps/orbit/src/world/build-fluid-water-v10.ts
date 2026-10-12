import * as THREE from "three/webgpu";
import type { Node } from "three/webgpu";
import { cameraPosition, cos, Discard, float, Fn, fwidth, mix, positionLocal, positionWorld, reflect, sin, smoothstep, texture3D, uniform, vec2, vec3 } from "three/tsl";
import { sunOf } from "./atmosphere-v10";
import type { EnvironmentConfig } from "./environment-v10";
import { fluidTexture } from "./fluid-texture";

/** W22: irregular rounded swells, soft analytic sky reflection and separately transported pastel pigment.
 * One finite adaptive sheet; no contour pattern, screen blur or extra reflection scene. */
export function buildFluidWater(environment: EnvironmentConfig) {
  const clock = uniform(0), currentClock = uniform(0), waves = uniform(environment.waves), height = uniform(environment.waveHeight);
  const crossing = uniform(environment.crossWaves), softness = uniform(environment.waterSoftness), viscosity = uniform(environment.viscosity);
  const wavelength = uniform(environment.waveLength), contrast = uniform(environment.waterContrast);
  const paint = uniform(new THREE.Color(environment.water)), pigment = uniform(new THREE.Color(environment.waterPigment));
  const hazeColour = uniform(new THREE.Color(environment.waterHazeColour)), haze = uniform(environment.waterHaze), mistSize = uniform(environment.waterMistSize);
  const sky = uniform(new THREE.Color(environment.sky)), horizon = uniform(new THREE.Color(environment.horizon)), light = uniform(new THREE.Color(environment.sunlight));
  const reflection = uniform(environment.waterReflection), current = uniform(environment.waterCurrent);
  const grain = uniform(environment.waterGrain), grainSize = uniform(environment.grainSize), sun = uniform(sunOf(environment)), way = uniform(new THREE.Vector2());
  const noise = fluidTexture(19);
  const radius = environment.radius, reach = radius * environment.waterReach;
  const seaY = -radius + Math.min(environment.waterLevel, radius * 2);
  const segments = Math.min(192, Math.max(64, Math.ceil(reach * 24 / Math.max(2, environment.waveLength))));
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, fog: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(reach * 2, reach * 2, segments, segments), material);
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = seaY; mesh.name = "powder-pastel-water";
  const time = clock.div(viscosity.mul(1.5).add(1));
  const length = wavelength.mul(softness.mul(0.35).add(1)).mul(viscosity.mul(0.2).add(1));
  const amplitude = waves.mul(height);
  const across = vec2(way.y.negate(), way.x);
  const textureAt = (p: Node<"vec2">) => texture3D(noise, vec3(p.x.div(length.mul(5)), p.y.div(length.mul(5)), 0.37).fract()).level(float(0)).a;
  // Nonparallel, unequal wavelengths and a broad spatial phase warp remove the repeating ruled-wave look.
  const modes = [[0, 1, 1, 0.8, 0.4], [0.92, 0.61, 0.55, 0.51, 2.3], [-0.64, 1.31, 0.3, 0.93, 5.7], [1.8, 2.13, 0.16, 1.17, 1.1], [-1.3, 0.37, 0.28, 0.37, 4.2]];
  const fields = (p: Node<"vec2">) => {
    const warp = textureAt(p).sub(0.5).mul(2.4);
    const weights = modes.map(([, frequency, weight], i) => {
      const strength = i === 0 ? float(weight) : crossing.mul(weight).mul(float(1).sub(softness.mul(0.45))).div(viscosity.mul(frequency * 0.35).add(1));
      // Fade waves the bounded mesh cannot sample, rather than folding them into aliased triangles.
      return strength.mul(smoothstep(reach * 4 / segments, reach * 10 / segments, length.div(frequency)));
    });
    const total = weights.reduce((a, b) => a.add(b)).max(0.001);
    const phases = modes.map(([angle, frequency, , speed, phase]) => p.dot(way.mul(Math.cos(angle)).add(across.mul(Math.sin(angle))))
      .div(length).mul(Math.PI * 2 * frequency).add(warp.mul(frequency * 0.35)).sub(time.mul(speed)).add(phase));
    return { warp, weights, total, phases };
  };
  const local = vec2(positionLocal.x, positionLocal.y.negate());
  const shape = fields(local);
  const elevation = shape.phases.map((p, i) => sin(p).mul(shape.weights[i])).reduce((a, b) => a.add(b)).div(shape.total).mul(amplitude);
  material.positionNode = positionLocal.add(vec3(0, 0, elevation));
  const here = positionWorld.xz, field = fields(here);
  const epsilon = 0.25;
  const gradient = vec2(textureAt(here.add(vec2(epsilon, 0))).sub(textureAt(here.sub(vec2(epsilon, 0)))),
    textureAt(here.add(vec2(0, epsilon))).sub(textureAt(here.sub(vec2(0, epsilon)))))
    .mul(2.4 / (2 * epsilon));
  const slope = field.phases.map((p, i) => {
    const [angle, frequency] = modes[i];
    const direction = way.mul(Math.cos(angle)).add(across.mul(Math.sin(angle)));
    return direction.mul(Math.PI * 2 * frequency).div(length).add(gradient.mul(frequency * 0.35)).mul(cos(p)).mul(field.weights[i]);
  }).reduce((a, b) => a.add(b)).mul(amplitude).div(field.total);
  const normal = vec3(slope.x.negate(), 1, slope.y.negate()).normalize();
  const drift = currentClock.div(viscosity.mul(2).add(1));
  const moving = vec3(here.x.div(mistSize), here.y.div(mistSize), 0.4).sub(vec3(way.x, way.y, 0).mul(drift.mul(0.025))).toVar();
  const curl = texture3D(noise, moving.mul(0.35).fract()).level(float(0)).rg.mul(2).sub(1);
  const tintAt = moving.add(vec3(curl.mul(current).mul(0.3).div(viscosity.mul(2).add(1)), 0));
  const pigmentField = texture3D(noise, tintAt.mul(0.22).fract()).level(float(0)).a;
  const blend = smoothstep(0.38, 0.7, pigmentField).mul(contrast).add(0.04);
  const body = mix(paint, pigment, blend).mul(normal.dot(sun).max(0).mul(0.15).add(0.85));
  const view = cameraPosition.sub(positionWorld).normalize();
  const reflected = reflect(view.negate(), normal);
  const softSky = mix(horizon, sky, smoothstep(-0.1, 0.8, reflected.y));
  const reflectedCloud = mix(softSky, hazeColour, 0.35);
  const sheen = reflected.dot(sun).max(0).pow(5).mul(reflection).mul(0.45);
  const fresnel = float(1).sub(view.dot(normal).abs()).pow(2).mul(0.35).add(0.15).mul(reflection);
  const surface = mix(mix(body, reflectedCloud, fresnel), light, sheen);
  const far = smoothstep(radius * 0.8, reach, cameraPosition.sub(positionWorld).length());
  const veil = far.mul(0.65).add(0.1).mul(haze);
  const grainAt = positionWorld.div(grainSize.max(0.02)).mul(0.03);
  const fine = texture3D(noise, grainAt.fract()).level(float(0)).a.sub(0.5);
  const resolved = float(1).sub(smoothstep(0.3, 1.5, fwidth(grainAt).length()));
  material.colorNode = Fn(() => {
    Discard(positionWorld.length().lessThan(radius));
    Discard(here.length().greaterThan(reach));
    return mix(surface, hazeColour, veil).mul(float(1).add(fine.mul(grain).mul(resolved)));
  })();
  material.opacityNode = float(1).sub(smoothstep(reach * 0.92, reach, here.length()));
  material.addEventListener("dispose", () => noise.dispose());
  mesh.geometry.computeBoundingSphere(); mesh.geometry.boundingSphere!.radius += 8;
  const set = (next: EnvironmentConfig) => {
    waves.value = next.waves; height.value = next.waveHeight; crossing.value = next.crossWaves;
    softness.value = next.waterSoftness; viscosity.value = next.viscosity; wavelength.value = next.waveLength;
    paint.value.set(next.water); pigment.value.set(next.waterPigment); contrast.value = next.waterContrast;
    hazeColour.value.set(next.waterHazeColour); haze.value = next.waterHaze; mistSize.value = next.waterMistSize;
    sky.value.set(next.sky); horizon.value.set(next.horizon); light.value.set(next.sunlight);
    reflection.value = next.waterReflection; current.value = next.waterCurrent; grain.value = next.waterGrain;
    grainSize.value = next.grainSize; sun.value.copy(sunOf(next));
    const turn = THREE.MathUtils.degToRad(next.waveDirection); way.value.set(Math.sin(turn), -Math.cos(turn));
  };
  set(environment);
  return { mesh, clock, currentClock, set };
}
