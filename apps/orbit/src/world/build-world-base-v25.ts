import * as THREE from "three/webgpu";
import { cameraPosition, color, float, mix, mx_noise_float, normalWorld, positionWorld, smoothstep, uniform, vertexColor } from "three/tsl";
import { buildBaseFog } from "./build-base-fog";
import { sunOf } from "./atmosphere";
import { mountainGeometry } from "./build-mountains-v25";
import { mountainsOf } from "./mountains-v32";
import type { CloudsConfig } from "./clouds";
import type { EnvironmentConfig } from "./environment-v25";

/** World.md W34, W37, W39, W40, W41: varied pastel mountain tips emerge from continuous white fog.
 * Only tips stand at the building floor; the lower edge is concealed by the permanent cloud veil (W43).
 */
export function buildWorldBase(environment: EnvironmentConfig, clouds: CloudsConfig) {
  const object = new THREE.Group();
  object.name = "world-base-clouds-and-summits";
  const clock = uniform(0);
  const sun = uniform(sunOf(environment));
  const sunlight = uniform(new THREE.Color(environment.sunlight));
  const shadow = uniform(new THREE.Color(environment.shadow));
  const warmth = uniform(environment.warmth), shade = uniform(environment.shade);
  const fog = buildBaseFog(clock, environment, clouds);
  object.add(fog.mesh);

  const stone = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, fog: false });
  // Dry pigment with restrained stepped shade and two scales of anchored paper tooth; no gloss.
  const facing = normalWorld.dot(sun).mul(0.5).add(0.5);
  const light = smoothstep(0.12, 0.88, facing).mul(4).floor().div(4);
  const pigment = vertexColor().rgb;
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
  // The material remains owned even when Count is zero and there are no mountain meshes to visit.
  fog.mesh.material.addEventListener("dispose", () => stone.dispose());
  const mountains = new THREE.Group();
  mountains.name = "mountains";
  object.add(mountains);
  let mountainKey = "";
  const set = (next: EnvironmentConfig, nextClouds: CloudsConfig) => {
    const key = JSON.stringify([next.mountainCount, next.mountainSpacing, next.mountainSeed, next.mountainRoughness]);
    if (key !== mountainKey) {
      for (const mesh of mountains.children) (mesh as THREE.Mesh).geometry.dispose();
      mountains.clear();
      for (const mountain of mountainsOf(next)) {
        const mesh = new THREE.Mesh(mountainGeometry(mountain, next.mountainRoughness), stone);
        mesh.position.set(mountain.x, 0, mountain.z);
        mesh.name = `submerged-mountain-${mountain.kind}`;
        mountains.add(mesh);
      }
      mountainKey = key;
    }
    fog.set(next, nextClouds);
    sun.value.copy(sunOf(next));
    sunlight.value.set(next.sunlight);
    shadow.value.set(next.shadow);
    warmth.value = next.warmth;
    shade.value = next.shade;
  };
  set(environment, clouds);
  return { object, set, airAt: fog.at, flow(seconds: number, cloudSeconds = seconds) { clock.value = seconds; fog.boundaryFlow(cloudSeconds); } };
}
