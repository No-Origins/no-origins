import * as THREE from "three/webgpu";
import { cameraPosition, float, mix, modelWorldMatrix, mx_noise_float, smoothstep, texture, uniform, uv, vec2, vec3, vec4 } from "three/tsl";
import { cloudForms } from "./clouds-v15";
import type { EnvironmentConfig } from "./environment-v15";

export type BuiltClouds = {
  object: THREE.Group;
  set(environment: EnvironmentConfig): void;
  flow(seconds: number): void;
  readonly flowing: boolean;
};

/** W28: painted cloud elements at world depths. Camera-facing layers preserve the chosen painterly target;
 * a bounded UV flow deforms the billows and gauze. These are art cutouts, not ray-marched volumes.
 */
export function buildClouds(environment: EnvironmentConfig, artwork: readonly THREE.Texture[]): BuiltClouds {
  const forms = cloudForms(environment);
  const object = new THREE.Group();
  object.name = "powder-cloud-banks";
  if (!forms.length) return { object, set() {}, flow() {}, get flowing() { return false; } };
  let current = environment;
  const clock = uniform(0), flow = uniform(environment.cloudFlow), viscosity = uniform(environment.cloudViscosity);
  const density = uniform(environment.cloudDensity), erosion = uniform(environment.cloudErosion), edgeWidth = uniform(environment.cloudEdgeWidth);
  const powder = uniform(environment.cloudPowder), softness = uniform(environment.cloudSoftness), palette = uniform(environment.cloudBlend);
  const paint = uniform(new THREE.Color(environment.clouds)), pigment = uniform(new THREE.Color(environment.cloudPigment));
  const light = uniform(new THREE.Color(environment.cloudLight)), shadow = uniform(new THREE.Color(environment.cloudShadow));
  const warmth = uniform(environment.cloudWarmth), shade = uniform(environment.cloudShade);
  const grain = uniform(environment.cloudGrain), grainSize = uniform(environment.grainSize), pigmentScale = uniform(environment.cloudPigmentScale);
  const distanceSoftness = uniform(environment.cloudDistanceSoftness);
  const skyPaint = uniform(new THREE.Color(environment.sky)), horizonPaint = uniform(new THREE.Color(environment.horizon));
  const time = clock.div(viscosity.mul(4).add(1));
  const world = vec3(modelWorldMatrix.mul(vec4(0, 0, 0, 1)));
  const reference = (hex: string) => { const c = new THREE.Color(hex); return vec3(c.r, c.g, c.b); };
  const creamRef = reference("#fff0d5"), blushRef = reference("#f6b9c9"), sageRef = reference("#b6c5b4");
  const geometry = new THREE.PlaneGeometry(1, 1);
  const makeMaterial = (map: THREE.Texture, flip: boolean, veil: boolean) => {
    const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, fog: false });
    const here = vec2(flip ? float(1).sub(uv().x) : uv().x, uv().y);
    const rolling = vec2(here.y.mul(7).add(here.x.mul(4)).add(time.mul(0.16)).sin(), here.x.mul(9).sub(time.mul(0.2)).sin())
      .mul(vec2(0.005, 0.009)).mul(flow);
    const sample = texture(map, here.add(rolling));
    const pigmentUV = here.sub(0.5).mul(float(120).div(pigmentScale.max(40))).add(0.5).clamp(0.005, 0.995);
    const colourSample = texture(map, pigmentUV.add(rolling));
    const painted = mix(sample.rgb, colourSample.rgb, colourSample.a);
    const blush = smoothstep(0.16, 0.38, painted.r.sub(painted.g));
    const sage = smoothstep(0.015, 0.12, painted.g.sub(painted.r));
    const originalPalette = mix(mix(creamRef, blushRef, blush), sageRef, sage);
    const desiredPalette = mix(mix(paint, pigment, blush.mul(palette)), shadow, sage.mul(shade.div(0.8)).min(1));
    const body = painted.mul(desiredPalette.div(originalPalette.max(0.04)));
    const highlight = float(1).sub(blush).mul(float(1).sub(sage));
    const relit = body.mul(mix(vec3(1), vec3(light.r, light.g, light.b).div(creamRef.max(0.04)), highlight));
    const bloom = mx_noise_float(vec3(here.mul(pigmentScale.div(120)), 7.3)).mul(powder.sub(0.45)).mul(0.06);
    const warmed = relit.mul(float(1).add(highlight.mul(warmth.sub(0.65)).mul(0.1))).add(bloom);
    const fromEye = world.sub(cameraPosition);
    const skyHere = mix(horizonPaint, skyPaint, smoothstep(-0.12, 0.32, fromEye.normalize().y));
    const haze = smoothstep(250, 1100, fromEye.length()).mul(distanceSoftness).mul(0.5);
    const tooth = mx_noise_float(vec3(here.mul(60).div(grainSize.max(0.02)), world.x.mul(0.1))).mul(grain).mul(0.15);
    const powdered = mix(warmed, creamRef, powder.mul(0.18));
    material.colorNode = mix(powdered.mul(float(1).add(tooth)), skyHere, haze);
    const margin = float(1).sub(smoothstep(0.08, 0.65, sample.a));
    const broken = mx_noise_float(vec3(here.mul(80), time.mul(0.06))).add(0.5).max(0).mul(erosion).mul(margin).mul(0.08);
    const alpha = sample.a.sub(broken).max(0).pow(float(1.5).sub(edgeWidth.mul(0.8)).sub(softness.mul(0.08))).mul(density).min(1);
    // A tiny transparent border prevents texture clamping from producing a rectangle at the warp's edge.
    const border = smoothstep(0, 0.012, here.x).mul(smoothstep(1, 0.988, here.x))
      .mul(smoothstep(0, 0.012, here.y)).mul(smoothstep(1, 0.988, here.y));
    material.opacityNode = alpha.mul(border).mul(veil ? environment.cloudWisps : 1);
    material.rotationNode = time.mul(0.05).sin().mul(flow).mul(0.015);
    return material;
  };
  for (const [index, form] of forms.entries()) {
    const bank = new THREE.Mesh(geometry, makeMaterial(artwork[0], index % 2 === 1, false));
    const width = form.scale[0] * 1.65;
    const image = artwork[0].image as { width: number; height: number };
    const aspect = image.width / image.height;
    const height = width / aspect * environment.cloudTallness * 1.75;
    bank.position.set(form.position[0], Math.max(form.position[1], environment.cloudHeight + height / 2), form.position[2]);
    bank.scale.set(width, height, 1);
    bank.name = `powder-cloud-bank-${index}`;
    bank.renderOrder = -2;
    object.add(bank);
    if (environment.cloudWisps > 0) {
      const veil = new THREE.Mesh(geometry, makeMaterial(artwork[1], index % 3 === 0, true));
      veil.position.copy(bank.position).add(new THREE.Vector3(Math.cos(form.turn) * width * 0.28, -width * 0.12, -Math.sin(form.turn) * width * 0.28));
      const veilHeight = width / aspect * 0.62;
      veil.position.y = Math.max(veil.position.y, environment.cloudHeight + veilHeight / 2);
      veil.scale.set(width * 1.1, veilHeight, 1);
      veil.name = `powder-cloud-veil-${index}`;
      veil.renderOrder = -2;
      object.add(veil);
    }
  }
  const set = (next: EnvironmentConfig) => {
    current = next; flow.value = next.cloudFlow; viscosity.value = next.cloudViscosity;
    density.value = next.cloudDensity; erosion.value = next.cloudErosion; edgeWidth.value = next.cloudEdgeWidth;
    powder.value = next.cloudPowder; softness.value = next.cloudSoftness; palette.value = next.cloudBlend;
    paint.value.set(next.clouds); pigment.value.set(next.cloudPigment); light.value.set(next.cloudLight); shadow.value.set(next.cloudShadow);
    warmth.value = next.cloudWarmth; shade.value = next.cloudShade; grain.value = next.cloudGrain; grainSize.value = next.grainSize;
    pigmentScale.value = next.cloudPigmentScale; distanceSoftness.value = next.cloudDistanceSoftness;
    skyPaint.value.set(next.sky); horizonPaint.value.set(next.horizon);
  };
  set(environment);
  return { object, set, flow(seconds) { clock.value = seconds; },
    get flowing() { return current.motion === "flowing" && current.cloudCount > 0 && current.cloudFlow > 0 && current.cloudSpeed > 0; } };
}
