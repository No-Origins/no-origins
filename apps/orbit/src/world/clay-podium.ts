import * as THREE from "three/webgpu";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { HumanPose } from "@no-origins/ui/lib/human-motion";
import type { BuiltHuman } from "./build-human";

/** The reference's thin tabletop, broad central pedestal and stepped foot. */
export function buildClayPodium(human: BuiltHuman, center: { x: number; z: number }) {
  const object = new THREE.Group();
  object.name = "clay-podium";
  human.pose({}, 0);
  const arm = human.bones.leftArm.getWorldPosition(new THREE.Vector3());
  const hand = human.bones.leftHand.getWorldPosition(new THREE.Vector3());
  const reach = hand.distanceTo(arm);
  const pitch = THREE.MathUtils.degToRad(48);
  // Clay has continuous paddle arms. Their rounded ends are its hands; keep the existing silhouette.
  const top = arm.y - reach * Math.cos(pitch) - human.object.position.y - 0.07;
  const forward = reach * Math.sin(pitch);
  object.position.set(center.x, 0, center.z - forward - 0.3);
  const metal = new THREE.MeshPhysicalNodeMaterial({ color: "#c7c7ce", metalness: 0.72, roughness: 0.28 });
  const edge = new THREE.MeshPhysicalNodeMaterial({ color: "#f0e8dd", metalness: 0.55, roughness: 0.3 });
  function part(width: number, height: number, depth: number, y: number, material: THREE.Material) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 3, Math.min(0.025, height / 4)), material);
    mesh.position.y = y; mesh.castShadow = mesh.receiveShadow = true; object.add(mesh);
  }
  part(2.45, 0.08, 1.05, 0.04, edge);
  part(2.1, 0.08, 0.85, 0.12, metal);
  part(1.25, top - 0.23, 0.46, 0.16 + (top - 0.23) / 2, metal);
  part(3.3, 0.1, 0.85, top - 0.05, edge);
  const pose: HumanPose = { leftArm: [-48, 0, 0], rightArm: [-48, 0, 0] };
  return { object, top, pose, footprint: (x: number, z: number) => Math.abs(x - center.x) < 1.65 && Math.abs(z - object.position.z) < 0.65 };
}
