import * as THREE from "three/webgpu";
import { mix, positionWorld } from "three/tsl";
import { boundaryPaint } from "./boundary-paint-v29";
import { WORLD_SIZE } from "./orbit";
import type { EnvironmentConfig } from "./environment-v29";
import type { CloudsConfig } from "./clouds";

/** W43: an opaque cloud boundary guarantees there is no view outside, even from right against the wall.
 * The air inside it supplies depth; this shell closes the final line of sight, with no architectural surface.
 */
export function buildWorldWalls(clouds: CloudsConfig, airAt: (p: typeof positionWorld) => THREE.Node<"vec4">, sky = "#bbcedc", environment?: EnvironmentConfig) {
  const paint = boundaryPaint(clouds, sky, environment);
  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, fog: false });
  const air = airAt(positionWorld);
  material.colorNode = mix(paint.at(positionWorld), air.rgb, air.a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(WORLD_SIZE.diameter / 2, WORLD_SIZE.diameter / 2, WORLD_SIZE.height, 192, 1, true), material);
  mesh.position.y = WORLD_SIZE.height / 2;
  mesh.name = "cloud-world-boundary";
  mesh.renderOrder = -1;
  return { mesh, set: paint.set, flow(seconds: number) { paint.clock.value = seconds; } };
}
