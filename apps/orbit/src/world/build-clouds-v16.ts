import * as THREE from "three/webgpu";
import { Break, cameraPosition, exp, float, Fn, fwidth, If, interleavedGradientNoise, Loop, max, min, mix, modelWorldMatrix, modelWorldMatrixInverse, positionGeometry, screenCoordinate, smoothstep, texture3D, uniform, varying, vec2, vec3, vec4 } from "three/tsl";
import { sunOf } from "./atmosphere";
import { cloudBankVolume, cloudForms, cloudLighting, type CloudField } from "./clouds-v16";
import type { EnvironmentConfig } from "./environment-v16";
import { fluidTexture } from "./fluid-texture";

export type BuiltClouds = { object: THREE.Group; set(environment: EnvironmentConfig): void; flow(seconds: number): void; readonly flowing: boolean };
const volumeTexture = (field: CloudField) => {
  const map = new THREE.Data3DTexture(field.data, ...field.resolution);
  map.format = THREE.RGBAFormat; map.minFilter = map.magFilter = THREE.LinearFilter;
  map.unpackAlignment = 1; map.needsUpdate = true;
  return map;
};

/** W30: sculpted local volumes with integrated extinction and colour along the ray. No normals, billboard
 * artwork, or post-process blur. Sun/sky optical depth is cached; bounded curl deforms gas and its light together.
 * The light cache approximates scattering under deformation, rather than running a physical fluid/light solver. */
export function buildClouds(environment: EnvironmentConfig): BuiltClouds {
  const object = new THREE.Group(); object.name = "powder-gas-banks";
  const forms = cloudForms(environment);
  if (!forms.length) return { object, set() {}, flow() {}, get flowing() { return false; } };
  let current = environment;
  const velocity = fluidTexture(environment.cloudSeed);
  const clock = uniform(0), flow = uniform(environment.cloudFlow), viscosity = uniform(environment.cloudViscosity);
  const density = uniform(environment.cloudDensity), erosion = uniform(environment.cloudErosion), powder = uniform(environment.cloudPowder);
  const softness = uniform(environment.cloudSoftness), palette = uniform(environment.cloudBlend), edgeWidth = uniform(environment.cloudEdgeWidth);
  const paint = uniform(new THREE.Color(environment.clouds)), pigment = uniform(new THREE.Color(environment.cloudPigment));
  const light = uniform(new THREE.Color(environment.cloudLight)), shadow = uniform(new THREE.Color(environment.cloudShadow));
  const warmth = uniform(environment.cloudWarmth), shade = uniform(environment.cloudShade);
  const pigmentScale = uniform(environment.cloudPigmentScale), grain = uniform(environment.cloudGrain), grainSize = uniform(environment.grainSize);
  const distanceSoftness = uniform(environment.cloudDistanceSoftness), samples = uniform(environment.cloudDetail, "int");
  const skyPaint = uniform(new THREE.Color(environment.sky)), horizonPaint = uniform(new THREE.Color(environment.horizon));
  const time = clock.div(viscosity.mul(2).add(1));
  const vOrigin = varying(vec3(modelWorldMatrixInverse.mul(vec4(cameraPosition, 1))));
  const vDirection = varying(positionGeometry.sub(vOrigin));
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const fields = Array.from({ length: Math.min(3, forms.length) }, (_, i) => cloudBankVolume(environment.cloudSeed + i * 13, forms[i].phase, environment.cloudWisps));
  const maps = fields.map(volumeTexture);
  const caches: { map: THREE.Data3DTexture; index: number }[] = [];
  const lightField = (index: number, config: EnvironmentConfig) => {
    const sun = sunOf(config), turn = forms[index].turn;
    return cloudLighting(fields[index % fields.length], forms[index].scale,
      [Math.cos(turn) * sun.x - Math.sin(turn) * sun.z, sun.y, Math.sin(turn) * sun.x + Math.cos(turn) * sun.z]);
  };
  let disposed = false;
  for (const [index, form] of forms.entries()) {
    const map = maps[index % maps.length], cache = volumeTexture(lightField(index, environment));
    caches.push({ map: cache, index });
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, side: THREE.BackSide, depthWrite: false, fog: false });
    const radiance = Fn(() => {
      const ray = vDirection.normalize().toVar(), inv = ray.reciprocal();
      const a = vec3(-0.5).sub(vOrigin).mul(inv), b = vec3(0.5).sub(vOrigin).mul(inv);
      const near = min(a, b), far = max(a, b);
      const bounds = vec2(max(near.x, max(near.y, near.z)).max(0), min(far.x, min(far.y, far.z))).toVar();
      bounds.x.greaterThanEqual(bounds.y).discard();
      const step = bounds.y.sub(bounds.x).div(samples.toFloat()).toVar();
      const worldStep = vec3(modelWorldMatrix.mul(vec4(ray.mul(step), 0))).length().toVar();
      const travelled = bounds.x.add(interleavedGradientNoise(screenCoordinate).mul(step)).toVar();
      const transmittance = float(1).toVar(), sum = vec3(0).toVar(), anchor = vec3(0).toVar(), weight = float(0).toVar();
      Loop({ start: 0, end: samples, type: "int" }, () => {
        const p = vOrigin.add(ray.mul(travelled)).add(0.5).toVar();
        // Curl transports and rolls the whole gas field, including pigment and lighting, in three dimensions.
        const moving = p.mul(vec3(2.4, 1, 1)).sub(vec3(time.mul(0.045), time.mul(0.012), time.mul(0.023)));
        const curl = texture3D(velocity, moving.fract()).level(float(0)).rgb.mul(2).sub(1);
        const warp = curl.mul(vec3(0.025, 0.045, 0.04)).mul(flow).div(viscosity.add(1));
        const roll = vec3(time.mul(0.12).sin().mul(0.014), p.x.mul(9).sub(time.mul(0.22)).sin().mul(0.025), p.x.mul(6).sub(time.mul(0.18)).cos().mul(0.022)).mul(flow);
        const q = p.add(warp).add(roll).toVar();
        const field = texture3D(map, q.clamp(0, 1)).level(float(0)).toVar();
        If(field.r.greaterThan(0.002), () => {
          const detail = texture3D(velocity, moving.mul(5.5).add(curl.mul(0.12)).fract()).level(float(0)).a;
          const margin = float(1).sub(smoothstep(0.02, 0.25, field.r));
          const eroded = max(0, field.r.sub(detail.sub(0.42).mul(erosion).mul(margin).mul(0.12))).toVar();
          const core = smoothstep(0.003, 0.12, eroded).mul(eroded);
          const d = mix(core, eroded, edgeWidth).mul(density).toVar();
          const tau = texture3D(cache, q.clamp(0, 1)).level(float(0)).rg.mul(128).toVar();
          const direct = exp(tau.x.mul(density).mul(-0.085));
          const bounced = exp(tau.x.mul(density).mul(-0.016)).mul(powder);
          const ambient = exp(tau.y.mul(density).mul(-0.018));
          const illumination = direct.mul(0.85).add(bounced.mul(0.12)).add(ambient.mul(0.1)).min(1).toVar();
          const softLight = mix(illumination, illumination.sqrt(), softness.mul(0.25));
          const recess = float(1).sub(softLight).mul(shade).min(0.85);
          const underpaint = mix(paint, shadow, recess);
          // Pigment is a broad, material-space deposit. Scale changes its period, never the silhouette.
          const tintAt = q.mul(vec3(2.4, 1, 1)).mul(float(120).div(pigmentScale));
          const tint = texture3D(velocity, tintAt.add(0.31).fract()).level(float(0)).a;
          const bloom = smoothstep(0.43, 0.65, tint.mul(0.15).add(field.g.mul(0.85))).mul(palette);
          const body = mix(underpaint, pigment, bloom.mul(float(0.8).sub(recess.mul(0.2))));
          const source = mix(body, light, softLight.mul(warmth).mul(0.3).add(powder.mul(0.04))).mul(float(1).add(field.a.sub(0.5).mul(grain)));
          const world = vec3(modelWorldMatrix.mul(vec4(p.sub(0.5), 1)));
          const fromEye = world.sub(cameraPosition);
          const skyHere = mix(horizonPaint, skyPaint, smoothstep(-0.12, 0.32, fromEye.normalize().y));
          const haze = smoothstep(250, 1100, fromEye.length()).mul(distanceSoftness).mul(0.5);
          const alpha = float(1).sub(exp(d.negate().mul(worldStep).mul(0.12))).toVar();
          const contribution = transmittance.mul(alpha).toVar();
          sum.addAssign(mix(source, skyHere, haze).mul(contribution));
          anchor.addAssign(world.mul(contribution)); weight.addAssign(contribution);
          transmittance.mulAssign(float(1).sub(alpha));
        });
        If(transmittance.lessThan(0.012), () => { Break(); });
        travelled.addAssign(step);
      });
      const grainPosition = anchor.div(weight.max(0.001)).div(grainSize.max(0.02)).mul(0.03);
      const fine = texture3D(velocity, grainPosition.fract()).level(float(0)).a.sub(0.5);
      const resolved = float(1).sub(smoothstep(0.08, 0.35, fwidth(grainPosition).length()));
      return vec4(sum.div(weight.max(0.001)).mul(float(1).add(fine.mul(grain).mul(resolved))), float(1).sub(transmittance));
    })().toVar();
    material.colorNode = radiance.rgb; material.opacityNode = radiance.a;
    material.addEventListener("dispose", () => {
      cache.dispose();
      if (!disposed) { disposed = true; maps.forEach((texture) => texture.dispose()); velocity.dispose(); }
    });
    const bank = new THREE.Mesh(geometry, material);
    bank.position.set(...form.position); bank.scale.set(...form.scale); bank.rotation.y = form.turn;
    bank.name = `powder-gas-bank-${index}`; bank.renderOrder = -2; object.add(bank);
  }
  let lightKey = `${environment.sunHeight}:${environment.sunTurn}`;
  const set = (next: EnvironmentConfig) => {
    current = next; flow.value = next.cloudFlow; viscosity.value = next.cloudViscosity;
    density.value = next.cloudDensity; erosion.value = next.cloudErosion; powder.value = next.cloudPowder;
    softness.value = next.cloudSoftness; palette.value = next.cloudBlend; edgeWidth.value = next.cloudEdgeWidth;
    paint.value.set(next.clouds); pigment.value.set(next.cloudPigment); light.value.set(next.cloudLight); shadow.value.set(next.cloudShadow);
    warmth.value = next.cloudWarmth; shade.value = next.cloudShade; pigmentScale.value = next.cloudPigmentScale;
    grain.value = next.cloudGrain; grainSize.value = next.grainSize; samples.value = next.cloudDetail;
    distanceSoftness.value = next.cloudDistanceSoftness; skyPaint.value.set(next.sky); horizonPaint.value.set(next.horizon);
    const key = `${next.sunHeight}:${next.sunTurn}`;
    if (key !== lightKey) {
      lightKey = key;
      for (const entry of caches) { entry.map.image.data = lightField(entry.index, next).data; entry.map.needsUpdate = true; }
    }
  };
  return { object, set, flow(seconds) { clock.value = seconds; },
    get flowing() { return current.motion === "flowing" && current.cloudCount > 0 && current.cloudFlow > 0 && current.cloudSpeed > 0; } };
}
