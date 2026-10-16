import * as THREE from "three/webgpu";

import type { Solid } from "./hierarchy";

/**
 * The Clay's four-metre inspection block (World.md W103). The world's painted blocks cannot receive shadows; this
 * physically lit copy lets the soles make contact and the soft character cast a shadow at its own scale.
 */
export function buildHumanStand(stand: Solid): THREE.Group {
  const object = new THREE.Group();
  const geometry = new THREE.BoxGeometry(...stand.half.map((half) => half * 2) as [number, number, number]);
  const material = new THREE.MeshStandardNodeMaterial({ color: stand.colour, roughness: 1, metalness: 0 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "human inspection block";
  mesh.position.set(...stand.centre);
  mesh.receiveShadow = true;
  object.add(mesh);
  return object;
}
