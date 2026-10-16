import * as THREE from "three/webgpu";
import { mix, mx_noise_float, output, positionWorld, uniform, vec4, vertexColor } from "three/tsl";
import { buildBaseFog } from "./build-base-fog";
import { mountainGeometry } from "./build-mountains-v31";
import { mountainsOf } from "./mountains-v31";
import type { CloudsConfig } from "./clouds";
import type { EnvironmentConfig } from "./environment-v34";

/** World.md W34, W37, W39, W40, W41: varied pastel mountain tips emerge from continuous white fog.
 * Only tips stand at the building floor; the lower edge is concealed by the permanent cloud veil (W43).
 */
export function buildWorldBase(environment: EnvironmentConfig, clouds: CloudsConfig) {
  const object = new THREE.Group();
  object.name = "world-base-clouds-and-summits";
  const clock = uniform(0);
  const fog = buildBaseFog(clock, environment, clouds);
  object.add(fog.mesh);

  const stone = new THREE.MeshStandardNodeMaterial({ side: THREE.DoubleSide, fog: false, roughness: 1, metalness: 0 });
  // Pigment stays pastel; Three's physical material computes diffuse sunlight from the actual normals.
  const tooth = mx_noise_float(positionWorld.mul(1.8)).mul(0.009)
    .add(mx_noise_float(positionWorld.mul(0.14)).mul(0.006));
  stone.colorNode = vertexColor().rgb.add(tooth);
  const air = fog.at(positionWorld);
  stone.outputNode = vec4(mix(output.rgb, air.rgb, air.a), 1);
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
        mesh.castShadow = true; mesh.receiveShadow = true;
        mesh.name = `submerged-mountain-${mountain.kind}`;
        mountains.add(mesh);
      }
      mountainKey = key;
    }
    fog.set(next, nextClouds);
  };
  set(environment, clouds);
  return { object, set, airAt: fog.at, flow(seconds: number, cloudSeconds = seconds) { clock.value = seconds; fog.boundaryFlow(cloudSeconds); } };
}
