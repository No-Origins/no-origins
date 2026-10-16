import * as THREE from "three/webgpu";
import { attribute, cameraPosition, color, float, mix, mx_noise_float, normalWorld, positionWorld, smoothstep, uniform, vertexColor } from "three/tsl";
import { buildBaseFog } from "./build-base-fog-v23";
import { sunOf } from "./atmosphere";
import { MOUNTAINS, mountainGeometry } from "./build-mountains-v23";
import type { EnvironmentConfig } from "./environment-v23";

/** World.md W34, W37, W39, W40: varied pastel mountain tips emerge from continuous white fog.
 * The formations extend below the building floor, their lower slopes veiled by the same air as the sky.
 */
export function buildWorldBase(environment: EnvironmentConfig) {
  const object = new THREE.Group();
  object.name = "world-base-clouds-and-summits";
  const clock = uniform(0);
  const sun = uniform(sunOf(environment));
  const sunlight = uniform(new THREE.Color(environment.sunlight));
  const shadow = uniform(new THREE.Color(environment.shadow));
  const warmth = uniform(environment.warmth), shade = uniform(environment.shade);
  const fog = buildBaseFog(clock, environment);
  object.add(fog.mesh);

  const stone = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, fog: false });
  // Dry pigment with restrained stepped shade and two scales of anchored paper tooth; no gloss.
  const facing = normalWorld.dot(sun).mul(0.5).add(0.5);
  const light = smoothstep(0.12, 0.88, facing).mul(4).floor().div(4);
  // Strata are evaluated on the face, so steep cliffs never alias bands between mesh rings.
  const layers = positionWorld.y.mul(0.32).add(mx_noise_float(positionWorld.mul(0.035)).mul(0.8)).sin();
  const ochre = mix(color("#c6a071"), color("#efdab7"), smoothstep(-0.2, 0.5, layers).mul(0.7).add(0.15));
  const pigment = mix(vertexColor().rgb, ochre, attribute("strata", "float"));
  const cool = mix(pigment, shadow, shade.mul(0.26));
  const warm = mix(pigment, sunlight, warmth.mul(0.22));
  const tooth = mx_noise_float(positionWorld.mul(1.8)).mul(0.024)
    .add(mx_noise_float(positionWorld.mul(0.14)).mul(0.016));
  const rock = mix(cool, warm, light).add(tooth);
  const buried = float(1).sub(smoothstep(-20, 9, positionWorld.y));
  const distance = smoothstep(250, 1300, positionWorld.sub(cameraPosition).length()).mul(0.75);
  const surface = mix(rock, color("#f2f2f6"), buried.mul(0.35).max(distance));
  const air = fog.at(positionWorld);
  stone.colorNode = mix(surface, air.rgb, air.a);
  for (const mountain of MOUNTAINS) {
    const mesh = new THREE.Mesh(mountainGeometry(mountain), stone);
    mesh.position.set(mountain.x, 0, mountain.z);
    mesh.name = `submerged-mountain-${mountain.kind}`;
    object.add(mesh);
  }
  const set = (next: EnvironmentConfig) => {
    fog.set(next);
    sun.value.copy(sunOf(next));
    sunlight.value.set(next.sunlight);
    shadow.value.set(next.shadow);
    warmth.value = next.warmth;
    shade.value = next.shade;
  };
  set(environment);
  return { object, set, airAt: fog.at, flow(seconds: number) { clock.value = seconds; } };
}
