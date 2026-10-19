import * as THREE from "three/webgpu";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";

/** World.md W111: a builder that casts many rays at one large mesh (Clay's straps, the
 * companions' relief) indexes it first. The hits are the same, found without testing every
 * triangle, so building no longer freezes the loading reveals for seconds. Release it before
 * the geometry deforms: the index answers only for the shape it was built from.
 */
export function indexForRays(mesh: THREE.Mesh) {
  const geometry = mesh.geometry;
  const raycast = mesh.raycast;
  // Indirect: the geometry's own index, and so the face numbers a hit reports, stay untouched.
  geometry.boundsTree = new MeshBVH(geometry, { indirect: true });
  mesh.raycast = acceleratedRaycast;
  return () => { mesh.raycast = raycast; geometry.boundsTree = undefined; };
}
