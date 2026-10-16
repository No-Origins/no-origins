import * as THREE from "three/webgpu";
import { bumpMap, float, mix, mx_noise_float, output, positionWorld, reflectVector, smoothstep, uniform, vec4, vertexColor } from "three/tsl";
import { buildBaseFog } from "./build-base-fog";
import { mountainCap, mountainGeometry } from "./build-mountains-v32";
import { sunOf } from "./atmosphere";
import { mountainsOf } from "./mountains-v32";
import type { CloudsConfig } from "./clouds";
import type { EnvironmentConfig } from "./environment-v34";

/** World.md W34, W37, W39, W40, W41, W50: stone monoliths with reflective summits emerge from continuous white fog.
 * Only tips stand at the building floor; the lower edge is concealed by the permanent cloud veil (W43).
 */
export function buildWorldBase(environment: EnvironmentConfig, clouds: CloudsConfig) {
  const object = new THREE.Group();
  object.name = "world-base-clouds-and-summits";
  const clock = uniform(0);
  const fog = buildBaseFog(clock, environment, clouds);
  object.add(fog.mesh);

  const stone = new THREE.MeshStandardNodeMaterial({ side: THREE.DoubleSide, fog: false, roughness: 1, metalness: 0 });
  // Physical sunlight models broad stone faces; fine mineral grain remains anchored in world space.
  const tooth = mx_noise_float(positionWorld.mul(1.8)).mul(0.025)
    .add(mx_noise_float(positionWorld.mul(0.14)).mul(0.015));
  stone.colorNode = vertexColor().rgb.add(tooth);
  stone.normalNode = bumpMap(mx_noise_float(positionWorld.mul(1.8)).mul(0.12)
    .add(mx_noise_float(positionWorld.mul(0.28)).mul(0.22)), float(0.6));
  const air = fog.at(positionWorld);
  stone.outputNode = vec4(mix(output.rgb, air.rgb, air.a), 1);
  // The material remains owned even when Count is zero and there are no mountain meshes to visit.
  const sky = uniform(new THREE.Color(environment.sky));
  const horizon = uniform(new THREE.Color(environment.horizon));
  const cream = uniform(new THREE.Color(clouds.cream));
  const rose = uniform(new THREE.Color(clouds.rose));
  const sunlight = uniform(new THREE.Color(environment.sunlight));
  const sun = uniform(sunOf(environment));
  // W50: a view-dependent procedural sky reflection, bounded cost on both GPU backends.
  // It reflects sky/cloud pigment and sun direction, not scene objects (no extra render pass).
  const reflected = reflectVector;
  const billow = mx_noise_float(reflected.mul(7).add(clock.mul(0.015)));
  const cloud = smoothstep(-0.35, 0.1, billow).mul(0.82);
  const skyPaint = mix(horizon, sky, smoothstep(-0.1, 0.65, reflected.y));
  const cloudPaint = mix(cream, rose, mx_noise_float(reflected.mul(3)).mul(0.5).add(0.5));
  const reflection = mix(skyPaint, cloudPaint, cloud);
  const glint = reflected.dot(sun).max(0).pow(180).mul(1.8);
  const mirror = new THREE.MeshBasicNodeMaterial({ fog: false });
  mirror.colorNode = reflection.add(sunlight.mul(glint));
  mirror.outputNode = vec4(mix(output.rgb, air.rgb, air.a), 1);
  fog.mesh.material.addEventListener("dispose", () => { stone.dispose(); mirror.dispose(); });
  const mountains = new THREE.Group();
  mountains.name = "mountains";
  object.add(mountains);
  let mountainKey = "";
  const set = (next: EnvironmentConfig, nextClouds: CloudsConfig) => {
    const key = JSON.stringify([next.mountainCount, next.mountainSpacing, next.mountainSeed, next.mountainRoughness]);
    if (key !== mountainKey) {
      mountains.traverse((child) => { if (child instanceof THREE.Mesh) child.geometry.dispose(); });
      mountains.clear();
      for (const mountain of mountainsOf(next)) {
        const mesh = new THREE.Mesh(mountainGeometry(mountain, next.mountainRoughness), stone);
        const group = new THREE.Group();
        group.position.set(mountain.x, 0, mountain.z);
        group.rotation.y = mountain.seed * 0.01;
        group.add(mesh, mountainCap(mountain, mirror));
        mesh.castShadow = true; mesh.receiveShadow = true;
        mesh.name = `submerged-mountain-${mountain.kind}`;
        mountains.add(group);
      }
      mountainKey = key;
    }
    sky.value.set(next.sky); horizon.value.set(next.horizon);
    cream.value.set(nextClouds.cream); rose.value.set(nextClouds.rose);
    sunlight.value.set(next.sunlight); sun.value.copy(sunOf(next));
    fog.set(next, nextClouds);
  };
  set(environment, clouds);
  return { object, set, airAt: fog.at, flow(seconds: number, cloudSeconds = seconds) { clock.value = seconds; fog.boundaryFlow(cloudSeconds); } };
}
