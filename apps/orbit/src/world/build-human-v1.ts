/**
 * Human, version 1, frozen (World.md W51): the skeleton drawn on the rig, before he gave its look (version 2,
 * `build-human.ts`, W65). Nothing draws it.
 */
import * as THREE from "three/webgpu";
import { HUMAN_JOINTS, type HumanPose, type JointId } from "@no-origins/ui/lib/human-motion";

import { SKULL, TOE, UNIT, type HumanConfig } from "./human-v1";

/**
 * What makes the human (`human.ts`, World.md W51): a real bone hierarchy from the design system's human rig
 * (`HUMAN_JOINTS`), each bone standing at its joint, scaled to the figure's height, and, until he gives its look, the
 * skeleton drawn on it: a rod from every joint to its parent's, a ball at every joint, an egg for the skull and a foot
 * from each ankle to its toe, all one flat colour (the root CLAUDE.md: no gradients), lit by the world's sun and sky and
 * casting its shadow (W49). A look given later binds to the same bones (`skeleton`), as the rig's own meshes did.
 *
 * It stands on the ground at its origin, facing the rig's front, +z; the engine turns it to face its way.
 */
export type BuiltHuman = {
  object: THREE.Group;
  bones: Record<JointId, THREE.Bone>;
  skeleton: THREE.Skeleton;
  /** Poses every joint (degrees, the rig's) and lifts the hips by `lift` rig units: a stride's bounce. */
  pose(pose: HumanPose, lift: number): void;
};

export function buildHuman(config: HumanConfig): BuiltHuman {
  const object = new THREE.Group();
  object.name = "human";
  const material = new THREE.MeshStandardNodeMaterial({ color: config.colour, roughness: 1, metalness: 0 });

  // The bones, each where its joint is, from its parent's: the rig's units scaled to the figure's height.
  const bones = {} as Record<JointId, THREE.Bone>;
  const byId = new Map(HUMAN_JOINTS.map((joint) => [joint.id, joint]));
  for (const joint of HUMAN_JOINTS) {
    const bone = new THREE.Bone();
    bone.name = joint.id;
    const from = joint.parent ? byId.get(joint.parent)!.at : [0, 0, 0];
    bone.position.set((joint.at[0] - from[0]) * UNIT, (joint.at[1] - from[1]) * UNIT, (joint.at[2] - from[2]) * UNIT);
    if (joint.parent) bones[joint.parent].add(bone);
    else object.add(bone);
    bones[joint.id] = bone;
  }
  const skeleton = new THREE.Skeleton(HUMAN_JOINTS.map((joint) => bones[joint.id]));

  const ball = new THREE.SphereGeometry(1, 20, 14);
  const boneRadius = config.bone / 200;
  const jointRadius = config.joint / 200;
  const up = new THREE.Vector3(0, 1, 0);
  const mesh = (geometry: THREE.BufferGeometry, name: string) => {
    const made = new THREE.Mesh(geometry, material);
    made.name = name;
    made.castShadow = true;
    made.receiveShadow = true;
    // A bone at rest may stand outside its box once posed: this one figure is never worth culling.
    made.frustumCulled = false;
    return made;
  };
  /** A rod from a bone's origin to `to` (its own units, metres), its caps sunk into the balls at either end. */
  const rod = (parent: THREE.Object3D, to: THREE.Vector3, name: string) => {
    const length = to.length();
    if (length < 1e-6) return;
    const made = mesh(new THREE.CapsuleGeometry(boneRadius, length, 4, 12), name);
    made.position.copy(to).multiplyScalar(0.5);
    made.quaternion.setFromUnitVectors(up, to.clone().normalize());
    parent.add(made);
  };
  const dot = (parent: THREE.Object3D, at: THREE.Vector3, radius: number, name: string) => {
    const made = mesh(ball, name);
    made.position.copy(at);
    made.scale.setScalar(radius);
    parent.add(made);
  };

  for (const joint of HUMAN_JOINTS) {
    const bone = bones[joint.id];
    dot(bone, new THREE.Vector3(), jointRadius, `${joint.id} joint`);
    if (joint.parent) rod(bones[joint.parent], bone.position, `${joint.parent} to ${joint.id}`);
    if (joint.id.endsWith("Foot")) {
      const toe = new THREE.Vector3(TOE[0], TOE[1], TOE[2]).multiplyScalar(UNIT);
      rod(bone, toe, `${joint.id} sole`);
      dot(bone, toe, boneRadius, `${joint.id} toe`);
    }
  }
  // The skull: an egg on the head joint, its crown the figure's height.
  const skull = mesh(ball, "skull");
  skull.position.set(0, SKULL.above * UNIT, 0);
  skull.scale.set(SKULL.radii[0] * UNIT, SKULL.radii[1] * UNIT, SKULL.radii[2] * UNIT);
  bones.head.add(skull);
  object.updateMatrixWorld(true);

  const hips = HUMAN_JOINTS[0]!.at[1] * UNIT;
  return {
    object,
    bones,
    skeleton,
    pose(pose, lift) {
      for (const { id } of HUMAN_JOINTS) {
        const [x, y, z] = pose[id] ?? [0, 0, 0];
        bones[id].rotation.set(THREE.MathUtils.degToRad(x), THREE.MathUtils.degToRad(y), THREE.MathUtils.degToRad(z));
      }
      bones.hips.position.y = hips + lift * UNIT;
    },
  };
}
