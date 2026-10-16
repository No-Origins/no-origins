import * as THREE from "three/webgpu";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { HUMAN_JOINTS, type HumanPose, type JointId } from "@no-origins/ui/lib/human-motion";

import { lookOf, outlinePoints, SKULL, TOE, UNIT, type HumanConfig, type Slab } from "./human-v2";

/**
 * What makes the human (`human.ts`, World.md W51, W65): a real bone hierarchy from the design system's human rig
 * (`HUMAN_JOINTS`), each bone standing at its joint, scaled to the figure's height, and his look hung on it: each slab
 * the look names (`lookOf`) cut out of its outline to its thickness, every edge rounded, and skinned to the bones that
 * carry it, as the rig's own clothes were (`hiddenstack-rig.ts`), so the walk and the run move it. All one flat colour
 * (the root CLAUDE.md: no gradients), lit by the world's sun and sky and casting its shadow (W49). Shows: Skeleton
 * draws the bones instead (version 1's rods and balls, `build-human-v1.ts`), to see what the look hangs on.
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

/** The skeleton's thickness, in metres: version 1's start, bones 5 cm and joints 8 cm. */
const BONE = 0.025;
const JOINT = 0.04;

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
  // The skeleton takes its rest pose from the bones as they stand now: they must stand before it is made.
  object.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(HUMAN_JOINTS.map((joint) => bones[joint.id]));
  const index = new Map(HUMAN_JOINTS.map((joint, i) => [joint.id, i]));

  const mesh = <M extends THREE.Mesh>(made: M, name: string): M => {
    made.name = name;
    made.castShadow = true;
    made.receiveShadow = true;
    // A part at rest may stand outside its box once posed: this one figure is never worth culling.
    made.frustumCulled = false;
    return made;
  };

  /**
   * A slab of the look: its outline, corners rounded, extruded to its thickness and bevelled by its edge inward from
   * the outline (`bevelOffset`), so the outline is the slab's outer extent; its vertices merged and its normals
   * smoothed, so the round edge reads round; and each vertex carried by the bones the look names for it.
   */
  const slab = ({ name, outline, depth, edge, carried }: Slab) => {
    const shape = new THREE.Shape(outlinePoints(outline).map(([x, y]) => new THREE.Vector2(x, y)));
    const bevel = Math.max(0, Math.min(edge, depth * 0.49));
    const extruded = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: depth - 2 * bevel,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelOffset: -bevel,
      bevelSegments: 5,
    });
    extruded.translate(0, 0, -(depth / 2 - bevel));
    extruded.deleteAttribute("normal");
    extruded.deleteAttribute("uv");
    const geometry = mergeVertices(extruded);
    extruded.dispose();
    geometry.computeVertexNormals();
    const positions = geometry.getAttribute("position");
    const joints: number[] = [];
    const weights: number[] = [];
    for (let i = 0; i < positions.count; i++) {
      const [a, b, amount] = carried(positions.getX(i), positions.getY(i));
      joints.push(index.get(a)!, index.get(b)!, 0, 0);
      weights.push(amount, 1 - amount, 0, 0);
    }
    geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(joints, 4));
    geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
    const made = mesh(new THREE.SkinnedMesh(geometry, material), name);
    object.add(made);
    made.bind(skeleton, new THREE.Matrix4());
    return made;
  };

  /** Version 1's skeleton: a rod from every joint to its parent's, a ball at every joint, an egg for the skull, the feet. */
  const drawSkeleton = () => {
    const ball = new THREE.SphereGeometry(1, 20, 14);
    const up = new THREE.Vector3(0, 1, 0);
    const rod = (parent: THREE.Object3D, to: THREE.Vector3, name: string) => {
      const length = to.length();
      if (length < 1e-6) return;
      const made = mesh(new THREE.Mesh(new THREE.CapsuleGeometry(BONE, length, 4, 12), material), name);
      made.position.copy(to).multiplyScalar(0.5);
      made.quaternion.setFromUnitVectors(up, to.clone().normalize());
      parent.add(made);
    };
    const dot = (parent: THREE.Object3D, at: THREE.Vector3, radius: number, name: string) => {
      const made = mesh(new THREE.Mesh(ball, material), name);
      made.position.copy(at);
      made.scale.setScalar(radius);
      parent.add(made);
    };
    for (const joint of HUMAN_JOINTS) {
      const bone = bones[joint.id];
      dot(bone, new THREE.Vector3(), JOINT, `${joint.id} joint`);
      if (joint.parent) rod(bones[joint.parent], bone.position, `${joint.parent} to ${joint.id}`);
      if (joint.id.endsWith("Foot")) {
        const toe = new THREE.Vector3(TOE[0], TOE[1], TOE[2]).multiplyScalar(UNIT);
        rod(bone, toe, `${joint.id} sole`);
        dot(bone, toe, BONE, `${joint.id} toe`);
      }
    }
    const skull = mesh(new THREE.Mesh(ball, material), "skull");
    skull.position.set(0, SKULL.above * UNIT, 0);
    skull.scale.set(SKULL.radii[0] * UNIT, SKULL.radii[1] * UNIT, SKULL.radii[2] * UNIT);
    bones.head.add(skull);
  };

  if (config.shows === "skeleton") drawSkeleton();
  else for (const part of lookOf(config)) slab(part);
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
      object.updateMatrixWorld(true);
    },
  };
}
