import * as THREE from "three/webgpu";
import { bumpMap, float, mx_noise_float, positionGeometry } from "three/tsl";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { HUMAN_JOINTS, type HumanPose, type JointId } from "@no-origins/ui/lib/human-motion";

import { HUMAN_HEIGHT, lookOf, outlinePoints, SKULL, TOE, UNIT, type HumanConfig, type Slab } from "./human-v4";

/**
 * What makes the human (`human.ts`, World.md W51, W65): a real bone hierarchy from the design system's human rig
 * (`HUMAN_JOINTS`), each bone standing at its joint, scaled to the figure's height, and his look hung on it: each slab
 * the look names (`lookOf`) cut out of its outline to its thickness, every edge rounded, and skinned to the bones that
 * carry it, as the rig's own clothes were (`hiddenstack-rig.ts`), so the walk and the run move it. Version 4 rounds the
 * joined volumes continuously across their softly domed faces, with exact field normals and a separate rounded
 * polygon head. All one flat colour, with fine
 * relief anchored to the skin, lit by the world's sun and sky and casting its shadow (W49). Shows: Skeleton
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
  const parts = config.shows === "look" ? lookOf(config) : [];
  const material = new THREE.MeshStandardNodeMaterial({ color: config.colour, roughness: 1, metalness: 0 });
  // Fine, still relief gives the matte cream the reference's dry ceramic finish. The rest-position coordinates
  // travel with the skin; this changes only the surface normal, never its paint or the world's illumination.
  if (config.shows === "look") {
    material.normalNode = bumpMap(
      mx_noise_float(positionGeometry.mul(180)).mul(0.00016)
        .add(mx_noise_float(positionGeometry.mul(65).add(17)).mul(0.00012)),
      float(1),
    );
  }

  // The bones, each where its joint is, from its parent's: the rig's units scaled to the figure's height.
  const bones = {} as Record<JointId, THREE.Bone>;
  const at = new Map(HUMAN_JOINTS.map((joint) => [joint.id, new THREE.Vector3(...joint.at).multiplyScalar(UNIT)]));
  if (config.shows === "look") {
    // The sketch's arms sit farther out and lower than the anatomical rig's. Fit their bind pivots to the volume
    // so a swing turns the shoulder itself, instead of stretching a long web from an invisible inner/high pivot.
    // Skeleton keeps the original rig; look retains its hierarchy and angle poses.
    const half = config.body / 200;
    const arm = config.arm / 100;
    for (const side of [-1, 1] as const) {
      const prefix = side === 1 ? "left" : "right";
      const armTop = Math.max(...parts.find((part) => part.name === `${prefix} arm`)!.outline.map(([, y]) => y));
      const fitted = new THREE.Vector3(side * (half + arm * 0.4), armTop - 0.11, 0);
      const shift = fitted.clone().sub(at.get(`${prefix}Arm`)!);
      at.get(`${prefix}Shoulder`)!.set(side * half * 0.7, armTop - 0.03, 0);
      at.get(`${prefix}Arm`)!.copy(fitted);
      at.get(`${prefix}Elbow`)!.add(shift);
      at.get(`${prefix}Hand`)!.add(shift);
    }
  }
  for (const joint of HUMAN_JOINTS) {
    const bone = new THREE.Bone();
    bone.name = joint.id;
    bone.position.copy(at.get(joint.id)!);
    if (joint.parent) bone.position.sub(at.get(joint.parent)!);
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

  /** One sculpted surface: shoulders and hips are actual joins, with their skin influences blended across them. */
  const surface = (parts: Slab[], name: string) => {
    const shapes = parts.map(distanceShape);
    const geometry = sculptedGeometry(shapes, material);
    // Interpolation can put a sampled flat a fraction of a millimetre inside its intended extent. The sole and
    // crown remain exact, so the generated skin is still eight feet tall, whatever its tunable proportions.
    const extent = geometry.boundingBox!;
    geometry.translate(0, name === "head" ? HUMAN_HEIGHT - extent.max.y : -extent.min.y, 0);
    const positions = geometry.getAttribute("position");
    const armTops = shapes.filter((shape) => shape.part.name.endsWith("arm")).map((shape) => shape.bounds[3]);
    const shoulderTop = armTops.length ? Math.max(...armTops) : Infinity;
    const crotch = shapes.find((shape) => shape.part.name === "body")?.bounds[2] ?? Infinity;
    const joints: number[] = [];
    const weights: number[] = [];
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const distances = shapes.map((shape) => distanceAt(shape, x, y, z));
      const nearest = Math.min(...distances);
      const nearestPart = distances.indexOf(nearest);
      const onArm = parts[nearestPart]!.name.endsWith("arm");
      const onLeg = parts[nearestPart]!.name.endsWith("leg");
      const shoulderBlend = THREE.MathUtils.smoothstep(y, shoulderTop - 0.35, shoulderTop - 0.26);
      const hipBlend = THREE.MathUtils.smoothstep(y, crotch - 0.14, crotch - 0.03);
      const influence = new Map<JointId, number>();
      for (let j = 0; j < parts.length; j++) {
        // A compact blend carries the shoulder/hip join together as limbs swing, without pulling an arm's end
        // towards the torso. All points on the one surface use the same rule, so the join cannot separate.
        let share = Math.max(0, 1 - (distances[j]! - nearest) / 0.12) ** 2;
        // The long armpit cleft is air, even when its two sides are close. Arm and torso share bones only where
        // they physically join at the shoulder; mixing across the lower cleft would stretch a cape as arms swing.
        if ((onArm && j !== nearestPart) || (!onArm && parts[j]!.name.endsWith("arm"))) share *= shoulderBlend;
        // Likewise, proximity across the leg gap is not a joint. Lower legs keep their own hip/knee pair; only
        // the continuous upper join mixes them with the torso and the other hip.
        if ((onLeg && j !== nearestPart) || (!onLeg && parts[j]!.name.endsWith("leg"))) share *= hipBlend;
        if (share === 0) continue;
        const [a, b, amount] = parts[j]!.carried(x, y);
        influence.set(a, (influence.get(a) ?? 0) + amount * share);
        influence.set(b, (influence.get(b) ?? 0) + (1 - amount) * share);
      }
      const strongest = [...influence].sort((a, b) => b[1] - a[1]).slice(0, 4);
      const total = strongest.reduce((sum, [, weight]) => sum + weight, 0);
      for (let j = 0; j < 4; j++) {
        const carried = strongest[j];
        joints.push(carried ? index.get(carried[0])! : 0);
        weights.push(carried ? carried[1] / total : 0);
      }
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
  else {
    surface(parts.filter((part) => part.name !== "head"), "body");
    surface(parts.filter((part) => part.name === "head"), "head");
  }
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

type DistanceShape = {
  part: Slab;
  segments: Float64Array;
  bevel: number;
  bounds: [number, number, number, number];
  centre: [number, number];
  inverseRadius: [number, number];
  fullness: number;
};

/** Prepares the rounded silhouette once; the field's front/back round stays inside its outer extent. */
function distanceShape(part: Slab): DistanceShape {
  const points = outlinePoints(part.outline, 20);
  const bounds: DistanceShape["bounds"] = [
    Math.min(...points.map(([x]) => x)), Math.max(...points.map(([x]) => x)),
    Math.min(...points.map(([, y]) => y)), Math.max(...points.map(([, y]) => y)),
  ];
  const bevel = Math.max(0, Math.min(part.edge, part.depth * 0.49));
  const segments = new Float64Array(points.length * 5);
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i]!;
    const [bx, by] = points[(i + 1) % points.length]!;
    const ex = bx - ax;
    const ey = by - ay;
    segments.set([ax, ay, ex, ey, 1 / (ex * ex + ey * ey || 1)], i * 5);
  }
  return {
    part,
    segments,
    bevel,
    bounds,
    centre: [(bounds[0] + bounds[1]) / 2, (bounds[2] + bounds[3]) / 2],
    inverseRadius: [2 / (bounds[1] - bounds[0]), 2 / (bounds[3] - bounds[2])],
    // The broad faces round into their edges without inflating beyond the requested depth. At thin settings the
    // rounded extrusion is already almost a capsule, leaving little flat face to dome.
    fullness: Math.min(part.fullness ?? 0, (part.depth / 2 - bevel) * 0.45),
  };
}

/** Signed distance to a rounded polygon, including its armpit cleft: negative inside. */
function planarDistance(shape: DistanceShape, x: number, y: number): number {
  // Far beyond this part's box only the sign matters to the surface/skin blend. Its box distance is a positive
  // lower bound, so empty columns need no polygon scan; close columns retain the exact rounded silhouette.
  const outsideX = Math.max(shape.bounds[0] - x, 0, x - shape.bounds[1]);
  const outsideY = Math.max(shape.bounds[2] - y, 0, y - shape.bounds[3]);
  const outside = outsideX * outsideX + outsideY * outsideY;
  if (outside > 0.15 * 0.15) return Math.sqrt(outside);
  let squared = Infinity;
  let inside = false;
  const segments = shape.segments;
  for (let i = 0; i < segments.length; i += 5) {
    const ax = segments[i]!;
    const ay = segments[i + 1]!;
    const ex = segments[i + 2]!;
    const ey = segments[i + 3]!;
    const px = x - ax;
    const py = y - ay;
    if ((ay > y) !== (ay + ey > y) && x < ax + (ex * py) / ey) inside = !inside;
    const amount = Math.max(0, Math.min(1, (px * ex + py * ey) * segments[i + 4]!));
    const dx = px - amount * ex;
    const dy = py - amount * ey;
    squared = Math.min(squared, dx * dx + dy * dy);
  }
  return Math.sqrt(squared) * (inside ? -1 : 1);
}

/** A rounded extrusion's exact distance, rounding inward so the jig's silhouette/depth are its actual extents. */
function roundedDistance(shape: DistanceShape, planar: number, z: number, dome: number): number {
  const across = planar + shape.bevel;
  const through = Math.abs(z) - shape.part.depth / 2 + shape.bevel + dome;
  return Math.hypot(Math.max(across, 0), Math.max(through, 0))
    + Math.min(Math.max(across, through), 0) - shape.bevel;
}

function domeAt(shape: DistanceShape, x: number, y: number): number {
  const across = (x - shape.centre[0]) * shape.inverseRadius[0];
  const up = (y - shape.centre[1]) * shape.inverseRadius[1];
  return shape.fullness * Math.min(2, across * across + up * up);
}

const distanceAt = (shape: DistanceShape, x: number, y: number, z: number) => roundedDistance(shape, planarDistance(shape, x, y), z, domeAt(shape, x, y));

/** A small rounded union removes assembly seams while preserving the sketch's long flat faces and narrow clefts. */
function joinedDistance(a: number, b: number, radius: number): number {
  const overlap = Math.max(radius - Math.abs(a - b), 0) / radius;
  return Math.min(a, b) - overlap * overlap * radius * 0.25;
}

/**
 * Samples one bounded field only when the configuration changes. Planar distances are cached per column; the
 * field's nonuniform bounds devote its samples to the figure rather than an empty cube. Only bones move per frame.
 */
function sculptedGeometry(shapes: DistanceShape[], material: THREE.Material): THREE.BufferGeometry {
  const resolution = shapes.length === 1 ? 56 : 80;
  const padding = 0.12;
  const min = new THREE.Vector3(
    Math.min(...shapes.map((shape) => shape.bounds[0])) - padding,
    Math.min(...shapes.map((shape) => shape.bounds[2])) - padding,
    -Math.max(...shapes.map((shape) => shape.part.depth)) / 2 - padding,
  );
  const max = new THREE.Vector3(
    Math.max(...shapes.map((shape) => shape.bounds[1])) + padding,
    Math.max(...shapes.map((shape) => shape.bounds[3])) + padding,
    Math.max(...shapes.map((shape) => shape.part.depth)) / 2 + padding,
  );
  const centre = min.clone().add(max).multiplyScalar(0.5);
  const scale = max.clone().sub(min).multiplyScalar(0.5);
  const step = max.clone().sub(min).divideScalar(resolution);
  const cubes = new MarchingCubes(resolution, material, false, false, 120000);
  cubes.isolation = 0;
  const plane = shapes.map(() => new Float32Array(resolution * resolution));
  const domes = shapes.map(() => new Float32Array(resolution * resolution));
  const arms = shapes.filter((shape) => shape.part.name.endsWith("arm"));
  const shoulderTop = arms.length ? Math.max(...arms.map((shape) => shape.bounds[3])) : Infinity;
  const shoulderRound = Math.max(0.025, Math.min(0.18, Math.max(...shapes.map((shape) => shape.bevel)) * 1.1));
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      for (let i = 0; i < shapes.length; i++) {
        const across = min.x + x * step.x;
        const up = min.y + y * step.y;
        plane[i]![y * resolution + x] = planarDistance(shapes[i]!, across, up);
        domes[i]![y * resolution + x] = domeAt(shapes[i]!, across, up);
      }
    }
  }
  for (let z = 0; z < resolution; z++) {
    const through = min.z + z * step.z;
    for (let y = 0; y < resolution; y++) {
      const height = min.y + y * step.y;
      const atShoulder = THREE.MathUtils.smoothstep(height, shoulderTop - 0.38, shoulderTop - 0.16);
      // The shoulder needs a broader union to flow from neck into arm. The narrow lower union retains the
      // armpit and leg clefts; its radius never reaches the space between the default five-centimetre leg gap.
      const radius = THREE.MathUtils.lerp(0.025, shoulderRound, atShoulder);
      for (let x = 0; x < resolution; x++) {
        const at = y * resolution + x;
        let distance = roundedDistance(shapes[0]!, plane[0]![at]!, through, domes[0]![at]!);
        for (let i = 1; i < shapes.length; i++) distance = joinedDistance(distance, roundedDistance(shapes[i]!, plane[i]![at]!, through, domes[i]![at]!), radius);
        cubes.field[z * resolution * resolution + at] = -distance;
      }
    }
  }
  cubes.update();
  const source = cubes.geometry;
  const count = source.drawRange.count;
  const sourcePositions = source.getAttribute("position");
  const sourceNormals = source.getAttribute("normal");
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const normal = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    positions[i * 3] = sourcePositions.getX(i) * scale.x + centre.x;
    positions[i * 3 + 1] = sourcePositions.getY(i) * scale.y + centre.y;
    positions[i * 3 + 2] = sourcePositions.getZ(i) * scale.z + centre.z;
    // MarchingCubes normals come from the field's gradient. Undo the nonuniform field scale before normalising,
    // retaining its smooth gradient rather than making the tiny triangulation visible on the rounded edges.
    normal.set(sourceNormals.getX(i) / scale.x, sourceNormals.getY(i) / scale.y, sourceNormals.getZ(i) / scale.z).normalize();
    normals[i * 3] = normal.x;
    normals[i * 3 + 1] = normal.y;
    normals[i * 3 + 2] = normal.z;
  }
  const raw = new THREE.BufferGeometry();
  raw.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  raw.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  const geometry = mergeVertices(raw);
  const exactDistance = (x: number, y: number, z: number) => {
    const atShoulder = THREE.MathUtils.smoothstep(y, shoulderTop - 0.38, shoulderTop - 0.16);
    const radius = THREE.MathUtils.lerp(0.025, shoulderRound, atShoulder);
    let distance = distanceAt(shapes[0]!, x, y, z);
    for (let i = 1; i < shapes.length; i++) distance = joinedDistance(distance, distanceAt(shapes[i]!, x, y, z), radius);
    return distance;
  };
  const surfacePoints = geometry.getAttribute("position");
  const surfaceNormals = geometry.getAttribute("normal");
  const epsilon = 0.006;
  const point = new THREE.Vector3();
  for (let i = 0; i < surfacePoints.count; i++) {
    point.fromBufferAttribute(surfacePoints, i);
    normal.fromBufferAttribute(surfaceNormals, i);
    // The field only supplies connectivity. Project the samples back onto the actual continuous volume, then
    // take its gradient here rather than interpolating normals from a coarse, nonuniform grid.
    point.addScaledVector(normal, -exactDistance(point.x, point.y, point.z));
    const x = point.x;
    const y = point.y;
    const z = point.z;
    normal.set(
      (exactDistance(x + epsilon, y, z) - exactDistance(x - epsilon, y, z)) / (2 * epsilon),
      (exactDistance(x, y + epsilon, z) - exactDistance(x, y - epsilon, z)) / (2 * epsilon),
      (exactDistance(x, y, z + epsilon) - exactDistance(x, y, z - epsilon)) / (2 * epsilon),
    );
    const length = normal.length();
    normal.multiplyScalar(1 / Math.max(length, 1e-9));
    point.addScaledVector(normal, -exactDistance(x, y, z) / Math.max(length, 0.1));
    surfacePoints.setXYZ(i, point.x, point.y, point.z);
    surfaceNormals.setXYZ(i, normal.x, normal.y, normal.z);
  }
  // A zero crossing exactly on a grid vertex can emit a collapsed triangle. Remove those after welding so the
  // closed skin has no repeated edges at its symmetry planes.
  const sourceIndex = geometry.getIndex()!;
  const triangles: number[] = [];
  for (let i = 0; i < sourceIndex.count; i += 3) {
    const a = sourceIndex.getX(i);
    const b = sourceIndex.getX(i + 1);
    const c = sourceIndex.getX(i + 2);
    if (a !== b && b !== c && c !== a) triangles.push(a, b, c);
  }
  geometry.setIndex(triangles);
  raw.dispose();
  source.dispose();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
