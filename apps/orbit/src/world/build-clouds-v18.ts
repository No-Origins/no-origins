import * as THREE from "three/webgpu";
import { Break, cameraPosition, cameraViewMatrix, cameraNear, cameraFar, exp, float, Fn, fwidth, If, hash, Loop, Var, max, min, mix, modelWorldMatrix, modelWorldMatrixInverse, positionGeometry, screenCoordinate, smoothstep, struct, texture3D, uniform, varying, vec2, vec3, vec4, viewZToPerspectiveDepth } from "three/tsl";
import { sunOf } from "./atmosphere";
import { cloudJob, type CloudJob, type CloudReply } from "./cloud-job-v18";
import type { CloudField } from "./clouds-v18";
import type { EnvironmentConfig } from "./environment-v18";

export type BuiltClouds = {
  object: THREE.Group; set(environment: EnvironmentConfig): void; flow(seconds: number): void;
  place(eye: THREE.Vector3): void; quality(fraction: number): void;
  readonly flowing: boolean; readonly ready: boolean; readonly revision: number; readonly covered: boolean; readonly fieldWidth: number;
};
const emptyVolume = () => {
  const map = new THREE.Data3DTexture(new Uint8Array(4), 1, 1, 1);
  map.format = THREE.RGBAFormat; map.minFilter = map.magFilter = THREE.LinearFilter; map.unpackAlignment = 1; map.needsUpdate = true;
  return map;
};
const replaceVolume = (map: THREE.Data3DTexture, field: CloudField) => {
  map.dispose(); map.image = { data: field.data, width: field.resolution[0], height: field.resolution[1], depth: field.resolution[2] }; map.needsUpdate = true;
};

/** W32: one irregular sky layer, bounded in view distance but anchored in world coordinates.
 * Coverage modulates the generated density rather than spawning cloud objects. Numeric fields are prepared in a
 * worker. An inexpensive analytic curl moves the gas; three 3D taps supply density/pigment/weather, material tooth and cached optical depth.
 */
export function buildClouds(environment: EnvironmentConfig, changed: () => void = () => {}): BuiltClouds {
  const object = new THREE.Group(); object.name = "cloud-sky-layer";
  let current = environment, ready = false, disposed = false, revision = 0, quality = 1;
  const map = emptyVolume(), lighting = emptyVolume(), toothMap = emptyVolume();
  toothMap.wrapS = toothMap.wrapT = toothMap.wrapR = THREE.RepeatWrapping;
  const fieldOrigin = uniform(new THREE.Vector2());
  const fieldSpan = 2048;
  let desiredOrigin: [number, number] = [0, 0];
  const eyeAt = new THREE.Vector2();
  const clock = uniform(0), flow = uniform(environment.cloudFlow), viscosity = uniform(environment.cloudViscosity);
  const density = uniform(environment.cloudDensity), erosion = uniform(environment.cloudErosion), powder = uniform(environment.cloudPowder);
  const coverage = uniform(environment.cloudCoverage), softness = uniform(environment.cloudSoftness), palette = uniform(environment.cloudBlend), edgeWidth = uniform(environment.cloudEdgeWidth);
  const paint = uniform(new THREE.Color(environment.clouds)), pigment = uniform(new THREE.Color(environment.cloudPigment));
  const light = uniform(new THREE.Color(environment.cloudLight)), shadow = uniform(new THREE.Color(environment.cloudShadow));
  const warmth = uniform(environment.cloudWarmth), shade = uniform(environment.cloudShade), grain = uniform(environment.cloudGrain);
  const grainSize = uniform(environment.grainSize);
  const pigmentScale = uniform(environment.cloudPigmentScale), billowScale = uniform(new THREE.Vector3()), turn = uniform(0);
  const distanceSoftness = uniform(environment.cloudDistanceSoftness), samples = uniform(48, "int");
  const skyPaint = uniform(new THREE.Color(environment.sky)), horizonPaint = uniform(new THREE.Color(environment.horizon));
  const time = clock.div(viscosity.mul(2).add(1));
  const vOrigin = varying(vec3(modelWorldMatrixInverse.mul(vec4(cameraPosition, 1))));
  const vDirection = varying(positionGeometry.sub(vOrigin));
  const Result = struct({ colour: "vec4", rayDepth: "float" });
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, side: THREE.BackSide, depthWrite: true, fog: false });
  const radiance = Var(Fn(() => {
    const ray = vDirection.normalize().toVar(), inv = ray.reciprocal();
    const a = vec3(-0.5).sub(vOrigin).mul(inv), b = vec3(0.5).sub(vOrigin).mul(inv);
    const near = min(a, b), far = max(a, b);
    const bounds = vec2(max(near.x, max(near.y, near.z)).max(0), min(far.x, min(far.y, far.z))).toVar();
    const worldRay = vec3(modelWorldMatrix.mul(vec4(ray, 0))).length();
    bounds.y.assign(min(bounds.y, bounds.x.add(float(650).div(worldRay))));
    bounds.x.greaterThanEqual(bounds.y).discard();
    const step = bounds.y.sub(bounds.x).div(samples.toFloat()).toVar();
    const worldStep = vec3(modelWorldMatrix.mul(vec4(ray.mul(step), 0))).length().toVar();
    const travelled = bounds.x.add(hash(screenCoordinate.x.add(screenCoordinate.y.mul(4096))).mul(step)).toVar();
    const transmittance = float(1).toVar(), sum = vec3(0).toVar(), anchor = vec3(0).toVar(), weight = float(0).toVar();
    Loop({ start: 0, end: samples, type: "int" }, () => {
      const p = vOrigin.add(ray.mul(travelled)).add(0.5).toVar();
      const world = vec3(modelWorldMatrix.mul(vec4(p.sub(0.5), 1))).toVar();
      const rotated = vec2(world.x.mul(turn.cos()).sub(world.z.mul(turn.sin())), world.x.mul(turn.sin()).add(world.z.mul(turn.cos())));
      const phase = world.div(80).add(vec3(time.mul(0.1), time.mul(0.08), time.mul(0.07)));
      const s = phase.sin(), c = phase.cos();
      const curl = vec3(s.x.mul(s.y).add(c.z.mul(c.x)), s.y.mul(s.z).add(c.x.mul(c.y)), s.z.mul(s.x).add(c.y.mul(c.z))).mul(-0.5);
      const warp = curl.mul(flow).div(viscosity.add(1)).mul(vec3(billowScale.x.div(fieldSpan).mul(0.04), 0.045, billowScale.z.div(fieldSpan).mul(0.04)));
      const q = vec3(rotated.x.sub(fieldOrigin.x).div(fieldSpan).add(0.5), p.y, rotated.y.sub(fieldOrigin.y).div(fieldSpan).add(0.5)).add(warp).toVar();
      const uvw = q.clamp(0, 1);
      const field = texture3D(map, uvw).level(float(0)).toVar();
      const overcast = smoothstep(0.8, 1, coverage).mul(0.055).mul(smoothstep(0.05, 0.45, p.y)).mul(float(1).sub(smoothstep(0.5, 0.95, p.y)));
      const gas = field.r.add(overcast);
      If(gas.greaterThan(0.003), () => {
        const threshold = float(0.9).sub(coverage.mul(0.8));
        const cover = smoothstep(threshold.sub(0.12), threshold.add(0.12), field.b);
        const fine = texture3D(toothMap, vec3(world.x.mul(0.023).add(world.z.mul(0.014)), world.y.mul(0.047), world.z.mul(0.031).sub(world.x.mul(0.008)))).level(float(0)).r;
        const margin = float(1).sub(smoothstep(0.06, 0.3, field.r));
        const eroded = max(0, gas.sub(fine.sub(0.4).mul(erosion).mul(margin).mul(0.65)));
        const d = mix(smoothstep(0.003, 0.12, eroded).mul(eroded), eroded, edgeWidth).mul(density).mul(cover).toVar();
        const tau = texture3D(lighting, uvw).level(float(0)).rg.mul(128);
        const direct = exp(tau.x.mul(density).mul(-0.085));
        const bounced = exp(tau.x.mul(density).mul(-0.016)).mul(powder);
        const ambient = exp(tau.y.mul(density).mul(-0.018));
        const illumination = direct.mul(0.85).add(bounced.mul(0.12)).add(ambient.mul(0.1)).min(1);
        const lit = mix(illumination, illumination.sqrt(), softness.mul(0.25));
        const recess = float(1).sub(lit).mul(shade).min(0.85);
        const bloom = smoothstep(0.58, 0.82, field.g.add(q.x.mul(float(120).div(pigmentScale)).sin().mul(0.025))).mul(palette).mul(0.65);
        const body = mix(mix(paint, shadow, recess), pigment, bloom.mul(float(0.8).sub(recess.mul(0.2))));
        const source = mix(body, light, lit.mul(warmth).mul(0.3).add(powder.mul(0.04))).mul(float(1).add(fine.sub(0.5).mul(grain)));
        const fromEye = world.sub(cameraPosition);
        const skyHere = mix(horizonPaint, skyPaint, smoothstep(-0.12, 0.32, fromEye.normalize().y));
        const haze = smoothstep(180, 900, fromEye.length()).mul(distanceSoftness).mul(0.75);
        const alpha = float(1).sub(exp(d.negate().mul(worldStep).mul(0.12))).toVar();
        const contribution = transmittance.mul(alpha).toVar();
        sum.addAssign(mix(source, skyHere, haze).mul(contribution)); anchor.addAssign(world.mul(contribution)); weight.addAssign(contribution);
        transmittance.mulAssign(float(1).sub(alpha));
      });
      If(transmittance.lessThan(0.015), () => { Break(); });
      travelled.addAssign(step);
    });
    const position = anchor.div(weight.max(0.001));
    const viewZ = vec4(cameraViewMatrix.mul(vec4(position, 1))).z;
    const rayDepth = mix(float(1), viewZToPerspectiveDepth(viewZ, cameraNear, cameraFar), smoothstep(0.0001, 0.001, weight));
    const grainAt = position.div(grainSize.max(0.02));
    const tooth = hash(grainAt.x.floor().add(grainAt.y.floor().mul(131)).add(grainAt.z.floor().mul(719))).sub(0.5);
    const resolved = float(1).sub(smoothstep(0.5, 1.5, fwidth(grainAt).length()));
    return Result(vec4(sum.div(weight.max(0.001)).mul(float(1).add(tooth.mul(grain).mul(resolved))), float(1).sub(transmittance)), rayDepth);
  })());
  // Three's struct declarations omit member types; Result above fixes their exact shader layout.
  const colour = radiance.get("colour") as unknown as ReturnType<typeof vec4>;
  const rayDepth = radiance.get("rayDepth") as unknown as ReturnType<typeof float>;
  material.colorNode = colour.rgb; material.opacityNode = colour.a; material.depthNode = rayDepth;
  const layer = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  layer.name = "continuous-cloud-volume"; layer.layers.set(1); layer.renderOrder = -2; object.add(layer);
  let worker: Worker | null = null, inFlight = false, serial = 0, wanted: CloudJob | null = null, jobKey = "";
  const apply = (reply: CloudReply) => {
    inFlight = false;
    if (disposed) return;
    if (reply.id === wanted?.id) { replaceVolume(map, reply.density); replaceVolume(lighting, reply.lighting); replaceVolume(toothMap, reply.tooth); fieldOrigin.value.set(...reply.origin); ready = true; revision++; changed(); }
    else send();
  };
  const fallback = () => {
    worker?.terminate(); worker = null; inFlight = false;
    if (wanted) setTimeout(() => { if (!disposed && wanted) apply(cloudJob({ ...wanted, coarse: true }).reply); }, 0);
  };
  const send = () => {
    if (inFlight || !wanted || disposed) return;
    inFlight = true;
    if (worker) worker.postMessage(wanted);
    else setTimeout(() => { if (!disposed && wanted) apply(cloudJob({ ...wanted, coarse: true }).reply); }, 0);
  };
  try { worker = new Worker(new URL("./cloud-worker-v18.ts", import.meta.url), { type: "module" }); worker.onmessage = (event: MessageEvent<CloudReply>) => apply(event.data); worker.onerror = (event) => { event.preventDefault(); fallback(); }; }
  catch { fallback(); }
  const prepare = () => {
    const next = current, a = turn.value;
    const x = eyeAt.x * Math.cos(a) - eyeAt.y * Math.sin(a), z = eyeAt.x * Math.sin(a) + eyeAt.y * Math.cos(a);
    if (Math.max(Math.abs(x - desiredOrigin[0]), Math.abs(z - desiredOrigin[1])) > 256) {
      desiredOrigin = [Math.round(x / 256) * 256, Math.round(z / 256) * 256];
    }
    const key = [next.cloudSeed, next.cloudWisps, ...billowScale.value.toArray(), ...desiredOrigin, next.skyWind, next.sunHeight, next.sunTurn].join(":");
    if (key !== jobKey && next.cloudCoverage > 0) {
      jobKey = key; const sun = sunOf(next);
      wanted = { id: ++serial, seed: next.cloudSeed, wisps: next.cloudWisps, origin: desiredOrigin,
        billow: [billowScale.value.x, billowScale.value.z], scale: [fieldSpan, billowScale.value.y, fieldSpan],
        sun: [Math.cos(a) * sun.x - Math.sin(a) * sun.z, sun.y, Math.sin(a) * sun.x + Math.cos(a) * sun.z] }; send();
    }
  };
  let stateKey = "";
  const set = (next: EnvironmentConfig) => {
    const state = JSON.stringify(next); if (state === stateKey) return; stateKey = state;
    current = next; revision++;
    const height = next.cloudSize * next.cloudTallness * 1.6;
    layer.scale.set(1800, height, 1800); layer.position.y = next.cloudHeight + height / 2;
    billowScale.value.set(next.cloudSize * next.cloudStretch, height, next.cloudSize * 1.3); turn.value = (45 - next.skyWind) * Math.PI / 180;
    flow.value = next.cloudFlow; viscosity.value = next.cloudViscosity; coverage.value = next.cloudCoverage;
    density.value = next.cloudDensity; erosion.value = next.cloudErosion; powder.value = next.cloudPowder;
    softness.value = next.cloudSoftness; palette.value = next.cloudBlend; edgeWidth.value = next.cloudEdgeWidth;
    paint.value.set(next.clouds); pigment.value.set(next.cloudPigment); light.value.set(next.cloudLight); shadow.value.set(next.cloudShadow);
    warmth.value = next.cloudWarmth; shade.value = next.cloudShade; pigmentScale.value = next.cloudPigmentScale; grain.value = next.cloudGrain; grainSize.value = next.grainSize;
    samples.value = Math.round(Math.max(16, Math.min(48, next.cloudDetail) * quality));
    distanceSoftness.value = next.cloudDistanceSoftness; skyPaint.value.set(next.sky); horizonPaint.value.set(next.horizon);
    prepare();
  };
  material.addEventListener("dispose", () => { if (disposed) return; disposed = true; worker?.terminate(); map.dispose(); lighting.dispose(); toothMap.dispose(); });
  set(environment);
  return { object, set, flow(seconds) { clock.value = seconds; },
    place(eye) { layer.position.x = eye.x; layer.position.z = eye.z; eyeAt.set(eye.x, eye.z); prepare(); },
    quality(fraction) { const q = THREE.MathUtils.clamp(fraction, 0.35, 1); if (q !== quality) { quality = q; samples.value = Math.max(16, Math.round(Math.min(48, current.cloudDetail) * quality)); revision++; } },
    get ready() { return ready; }, get fieldWidth() { return map.image.width; }, get revision() { return revision; }, get covered() { return current.cloudCoverage > 0; },
    get flowing() { return ready && current.motion === "flowing" && current.cloudCoverage > 0 && current.cloudFlow > 0 && current.cloudSpeed > 0; } };
}
