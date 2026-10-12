import * as THREE from "three/webgpu";
import { Break, cameraPosition, exp, float, Fn, fwidth, If, interleavedGradientNoise, Loop, max, min, mix, modelWorldMatrixInverse, positionGeometry, screenCoordinate, smoothstep, texture3D, uniform, varying, vec2, vec3, vec4 } from "three/tsl";
import { sunOf } from "./atmosphere";
import { CLOUD_SCALE, cloudVolume } from "./clouds-v13";
import type { EnvironmentConfig } from "./environment-v13";
import { fluidTexture } from "./fluid-texture";

export type BuiltClouds = {
  object: THREE.Mesh;
  set(environment: EnvironmentConfig): void;
  flow(seconds: number): void;
  readonly flowing: boolean;
};

/** W26: feathered density, edge-only erosion, broad pigment and softly absorbed light in one cloud volume.
 * Bounded curl deformation and derivative-filtered grain keep the resting and moving finish quiet.
 */
export function buildClouds(environment: EnvironmentConfig): BuiltClouds {
  const field = cloudVolume(environment);
  const volume = new THREE.Data3DTexture(field.data, field.resolution, field.resolution, field.resolution);
  volume.format = THREE.RedFormat;
  volume.minFilter = volume.magFilter = THREE.LinearFilter;
  volume.unpackAlignment = 1; volume.needsUpdate = true;
  const velocity = fluidTexture(environment.cloudSeed);
  const extent = vec3(...field.size), origin = vec3(...field.min);
  let current = environment;
  const clock = uniform(0), flow = uniform(environment.cloudFlow), viscosity = uniform(environment.cloudViscosity);
  const density = uniform(environment.cloudDensity), erosion = uniform(environment.cloudErosion), powder = uniform(environment.cloudPowder);
  const softness = uniform(environment.cloudSoftness), palette = uniform(environment.cloudBlend);
  const paint = uniform(new THREE.Color(environment.clouds)), pigment = uniform(new THREE.Color(environment.cloudPigment));
  const light = uniform(new THREE.Color(environment.cloudLight)), shadow = uniform(new THREE.Color(environment.cloudShadow));
  const sun = uniform(sunOf(environment)), warmth = uniform(environment.cloudWarmth), shade = uniform(environment.cloudShade);
  const grain = uniform(environment.cloudGrain), grainSize = uniform(environment.grainSize), wind = uniform(new THREE.Vector3());
  const samples = uniform(environment.cloudDetail, "int");
  const edgeWidth = uniform(environment.cloudEdgeWidth), pigmentScale = uniform(environment.cloudPigmentScale);
  const distanceSoftness = uniform(environment.cloudDistanceSoftness);
  const skyPaint = uniform(new THREE.Color(environment.sky)), horizonPaint = uniform(new THREE.Color(environment.horizon));
  const time = clock.div(viscosity.mul(2).add(1));
  const vOrigin = varying(vec3(modelWorldMatrixInverse.mul(vec4(cameraPosition, 1))));
  const vDirection = varying(positionGeometry.sub(vOrigin));
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, side: THREE.BackSide, depthWrite: false, fog: false });
  const radiance = Fn(() => {
    const ray = vDirection.normalize().toVar(), inv = ray.reciprocal();
    const a = vec3(-0.5).sub(vOrigin).mul(inv), b = vec3(0.5).sub(vOrigin).mul(inv);
    const near = min(a, b), far = max(a, b);
    const bounds = vec2(max(near.x, max(near.y, near.z)).max(0), min(far.x, min(far.y, far.z))).toVar();
    bounds.x.greaterThanEqual(bounds.y).discard();
    const step = bounds.y.sub(bounds.x).div(samples.toFloat()).toVar();
    const worldStep = ray.mul(extent).length().mul(step).toVar();
    const travelled = bounds.x.add(interleavedGradientNoise(screenCoordinate).sub(0.5).mul(0.3).add(0.5).mul(step)).toVar();
    const transmittance = float(1).toVar(), sum = vec3(0).toVar(), anchor = vec3(0).toVar(), weight = float(0).toVar();
    Loop({ start: 0, end: samples, type: "int" }, () => {
      const p = vOrigin.add(ray.mul(travelled)).add(0.5).toVar();
      const world = p.mul(extent).add(origin);
      const moving = world.div(CLOUD_SCALE * 1.5).sub(wind.mul(time.mul(0.035))).toVar();
      const swirl = texture3D(velocity, moving.fract()).level(float(0)).rgb.mul(2).sub(1);
      // Viscosity resists deformation as well as slowing transport, preserving broad folds.
      const warp = swirl.mul(vec3(12, 7, 12)).mul(flow).div(viscosity.mul(1.8).add(1)).div(extent);
      // Transport is bounded: long-running clouds cannot slide out of their finite volume.
      const drift = wind.mul(time.mul(0.06).sin().mul(10)).mul(flow).div(extent);
      const q = p.sub(drift).add(warp).toVar();
      const broad = texture3D(volume, q.clamp(0, 1)).level(float(0)).r.toVar();
      If(broad.greaterThan(0.004), () => {
        const detail = texture3D(velocity, moving.mul(3.7).add(swirl.mul(0.15)).fract()).level(float(0)).a.toVar();
        const margin = float(1).sub(smoothstep(0.08, 0.4, broad));
        const eroded = max(0, broad.sub(detail.sub(0.45).mul(erosion).mul(margin).mul(0.18))).toVar();
        const core = smoothstep(0.006, 0.16, eroded).mul(eroded);
        const fringe = eroded.mul(0.18).add(core.mul(0.82));
        const d = mix(core, fringe, edgeWidth).mul(density).toVar();
        // Two broad taps toward the sun approximate absorption through the bank, rather than tracing every ridge.
        const towardsSun = sun.mul(18).div(extent);
        const nearLight = texture3D(volume, q.add(towardsSun).clamp(0, 1)).level(float(0)).r;
        const farLight = texture3D(volume, q.add(towardsSun.mul(2.5)).clamp(0, 1)).level(float(0)).r;
        const absorbed = exp(nearLight.mul(3).add(farLight.mul(1.8)).mul(density).negate());
        // World-space density gradient gives broad folds a readable surface direction without hard mesh edges.
        const gradientStep = vec3(8).div(extent);
        const dx = broad.sub(texture3D(volume, q.add(vec3(gradientStep.x, 0, 0)).clamp(0, 1)).level(float(0)).r);
        const dy = broad.sub(texture3D(volume, q.add(vec3(0, gradientStep.y, 0)).clamp(0, 1)).level(float(0)).r);
        const dz = broad.sub(texture3D(volume, q.add(vec3(0, 0, gradientStep.z)).clamp(0, 1)).level(float(0)).r);
        const gradient = vec3(dx, dy, dz).toVar();
        const normal = gradient.div(gradient.length().max(0.001));
        const directional = smoothstep(-0.7, 0.9, normal.dot(sun));
        const facing = mix(directional, absorbed, 0.2).toVar();
        const tintPosition = world.div(pigmentScale.max(40)).mul(0.6).add(swirl.mul(0.025));
        const tint = texture3D(velocity, tintPosition.add(0.31).fract()).level(float(0)).a;
        const mottling = texture3D(velocity, tintPosition.mul(2.6).add(0.57).fract()).level(float(0)).a;
        const colourField = tint.mul(0.85).add(mottling.mul(0.15));
        const body = mix(paint, pigment, smoothstep(0.35, 0.65, colourField).mul(palette));
        const shaded = mix(body, shadow, float(1).sub(facing).mul(shade).mul(0.85));
        const softLight = mix(facing, facing.sqrt(), softness);
        const scattering = mix(shaded, light, softLight.mul(warmth).add(powder.mul(0.16)).min(0.8));
        const fromEye = world.sub(cameraPosition);
        const skyHere = mix(horizonPaint, skyPaint, smoothstep(-0.12, 0.32, fromEye.normalize().y));
        const haze = smoothstep(150, 1100, fromEye.length()).mul(distanceSoftness).mul(0.65);
        const scattered = mix(scattering, skyHere, haze);
        const alpha = float(1).sub(exp(d.negate().mul(worldStep).mul(0.045))).toVar();
        const contribution = transmittance.mul(alpha).toVar();
        sum.addAssign(scattered.mul(contribution)); anchor.addAssign(world.mul(contribution)); weight.addAssign(contribution);
        transmittance.mulAssign(float(1).sub(alpha));
      });
      If(transmittance.lessThan(0.015), () => { Break(); });
      travelled.addAssign(step);
    });
    const grainPosition = anchor.div(weight.max(0.001)).div(grainSize.max(0.02)).mul(0.03);
    const fine = texture3D(velocity, grainPosition.fract()).level(float(0)).a.sub(0.5);
    // Fine material detail fades when its projected period is unresolved; sampling jitter stays independent.
    const resolved = float(1).sub(smoothstep(0.08, 0.35, fwidth(grainPosition).length()));
    return vec4(sum.div(weight.max(0.001)).mul(float(1).add(fine.mul(grain).mul(resolved))), float(1).sub(transmittance));
  })().toVar();
  material.colorNode = radiance.rgb;
  material.opacityNode = radiance.a;
  material.addEventListener("dispose", () => { volume.dispose(); velocity.dispose(); });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  mesh.scale.set(...field.size);
  const centre = field.min.map((v, i) => v + field.size[i] / 2) as [number, number, number];
  mesh.position.set(...centre); mesh.renderOrder = -2; mesh.name = "powder-cloud-volume";
  const set = (next: EnvironmentConfig) => {
    current = next; flow.value = next.cloudFlow; viscosity.value = next.cloudViscosity;
    density.value = next.cloudDensity; erosion.value = next.cloudErosion; powder.value = next.cloudPowder;
    softness.value = next.cloudSoftness; palette.value = next.cloudBlend;
    paint.value.set(next.clouds); pigment.value.set(next.cloudPigment); light.value.set(next.cloudLight); shadow.value.set(next.cloudShadow);
    sun.value.copy(sunOf(next)); warmth.value = next.cloudWarmth; shade.value = next.cloudShade;
    edgeWidth.value = next.cloudEdgeWidth; pigmentScale.value = next.cloudPigmentScale;
    distanceSoftness.value = next.cloudDistanceSoftness; skyPaint.value.set(next.sky); horizonPaint.value.set(next.horizon);
    grain.value = next.cloudGrain; grainSize.value = next.grainSize; samples.value = next.cloudDetail;
    const turn = THREE.MathUtils.degToRad(next.skyWind); wind.value.set(Math.sin(turn), 0, -Math.cos(turn));
  };
  set(environment);
  return { object: mesh, set, flow(seconds) { clock.value = seconds; },
    get flowing() { return current.motion === "flowing" && current.cloudCount > 0 && current.cloudFlow > 0 && current.cloudSpeed > 0; } };
}
