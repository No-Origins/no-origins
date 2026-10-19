import * as THREE from "three/webgpu";
import { attribute, color, modelViewMatrix, mx_noise_float, mx_noise_vec3, normalize, normalView, positionGeometry, vec4 } from "three/tsl";

/** Fine anchored relief shared by the Clay's rigid head and deforming skin. */
export const clayGrain = (position: THREE.Node<"vec3"> = positionGeometry, sculpted = false) => {
  const fine = mx_noise_vec3(position.mul(310)).mul(sculpted ? 0.035 : 0.065)
    .add(mx_noise_vec3(position.mul(105).add(17)).mul(sculpted ? 0.018 : 0.025));
  return sculpted ? fine.add(mx_noise_vec3(position.mul(13)).mul(0.045)) : fine;
};

/** Warm pigment and broader pressed-clay marks on the approved VR maquette, anchored through every pose. */
export const clayPaint = (paint: THREE.ColorRepresentation, position: THREE.Node<"vec3"> = positionGeometry, sculpted = false) =>
  color(new THREE.Color(paint)).mul(mx_noise_float(position.mul(sculpted ? 13 : 4.5)).mul(sculpted ? 0.055 : 0.045).add(0.985))
    .mul(mx_noise_float(position.mul(510)).mul(sculpted ? 0.018 : 0.035).add(0.985));

/** Fair influences along the connected surface, keeping close but unconnected arms independent (World.md W104). */
export function fairClayWeights(geometry: THREE.BufferGeometry): number[][] {
  const joints = geometry.getAttribute("skinIndex") as THREE.BufferAttribute;
  const weights = geometry.getAttribute("skinWeight") as THREE.BufferAttribute;
  const used = [...new Set(Array.from(joints.array).filter((_, i) => weights.array[i]! > 0))];
  const lookup = new Map(used.map((bone, i) => [bone, i]));
  const width = used.length, count = joints.count;
  let values = new Float32Array(count * width), next = new Float32Array(values.length);
  const connected = Array.from({ length: count }, () => new Set<number>());
  const triangles = geometry.index!;
  for (let i = 0; i < triangles.count; i += 3) {
    const a = triangles.getX(i), b = triangles.getX(i + 1), c = triangles.getX(i + 2);
    connected[a]!.add(b).add(c);
    connected[b]!.add(a).add(c);
    connected[c]!.add(a).add(b);
  }
  const neighbours = connected.map(near => [...near]);
  for (let i = 0; i < count; i++) for (let k = 0; k < 4; k++) {
    const weight = weights.array[i * 4 + k]!;
    if (weight) values[i * width + lookup.get(joints.array[i * 4 + k]!)!]! += weight;
  }
  for (let pass = 0; pass < 32; pass++) {
    for (let i = 0; i < count; i++) {
      const near = neighbours[i]!, divisor = Math.max(1, near.length);
      for (let k = 0; k < width; k++) {
        let sum = 0;
        for (const j of near) sum += values[j * width + k]!;
        next[i * width + k] = values[i * width + k]! * 0.5 + sum / divisor * 0.5;
      }
    }
    [values, next] = [next, values];
  }
  for (let i = 0; i < count; i++) {
    const strongest = used.map((bone, k) => [bone, values[i * width + k]!] as const).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const total = strongest.reduce((sum, [, weight]) => sum + weight, 0);
    for (let k = 0; k < 4; k++) {
      joints.array[i * 4 + k] = strongest[k]?.[0] ?? 0;
      weights.array[i * 4 + k] = (strongest[k]?.[1] ?? 0) / total;
    }
  }
  return neighbours;
}

/**
 * Dual-quaternion deformation preserves round sections through large turns (World.md W104). Fair each joint
 * locally and recompute normals on the posed mesh, so its shading, shadows, bounds and picking all see the same
 * surface. Rest positions anchor the cloth grain. Repeated unchanged poses cost no surface work.
 */
export function claySkin(
  source: THREE.MeshPhysicalNodeMaterial,
  skeleton: THREE.Skeleton,
  root: THREE.Group,
  geometry: THREE.BufferGeometry,
  neighbours: number[][],
  radii: { arm: number; hip: number; knee: number },
  sculpted = false,
) {
  const material = source.clone();
  const points = geometry.getAttribute("position") as THREE.BufferAttribute;
  const rest = new Float32Array(points.array);
  geometry.setAttribute("clayRest", new THREE.BufferAttribute(rest, 3));
  points.setUsage(THREE.DynamicDrawUsage);
  (geometry.getAttribute("normal") as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
  const anchored = attribute("clayRest", "vec3");
  material.normalNode = normalize(normalView.add(modelViewMatrix.mul(vec4(clayGrain(anchored, sculpted), 0)).xyz));
  material.colorNode = clayPaint(source.color, anchored, sculpted);

  const indices = geometry.getAttribute("skinIndex").array;
  const weights = geometry.getAttribute("skinWeight").array;
  const reals = skeleton.bones.map(() => new THREE.Quaternion());
  const duals = skeleton.bones.map(() => new THREE.Vector4());
  const inverseRoot = new THREE.Matrix4();
  const transform = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const smoothing: { index: number; amount: number }[] = [];
  const pivots = skeleton.bones.filter(b => /Arm$|Hip$|Knee$/.test(b.name)).map(b => ({
    position: b.getWorldPosition(new THREE.Vector3()), radius: b.name.endsWith("Arm") ? radii.arm : b.name.endsWith("Knee") ? radii.knee : radii.hip,
  }));
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i), y = points.getY(i), z = points.getZ(i);
    let amount = 0;
    for (const pivot of pivots) {
      const distance = Math.hypot(x - pivot.position.x, y - pivot.position.y, z - pivot.position.z);
      const t = y < 0.05 ? 0 : Math.max(0, Math.min(1, (pivot.radius - distance) / (pivot.radius / 2)));
      amount = Math.max(amount, t * t * (3 - 2 * t));
    }
    if (amount > 0) smoothing.push({ index: i, amount });
  }
  const next = new Float32Array(rest.length);
  const last = new Float64Array(skeleton.bones.length * 7).fill(NaN);
  const update = () => {
    let changed = false;
    for (let i = 0; i < skeleton.bones.length; i++) {
      const bone = skeleton.bones[i]!;
      const values = [...bone.position, ...bone.quaternion];
      for (let k = 0; k < 7; k++) {
        if (last[i * 7 + k] !== values[k]) changed = true;
        last[i * 7 + k] = values[k]!;
      }
    }
    if (!changed) return;
    inverseRoot.copy(root.matrixWorld).invert();
    for (let i = 0; i < skeleton.bones.length; i++) {
      transform.multiplyMatrices(inverseRoot, skeleton.bones[i]!.matrixWorld).multiply(skeleton.boneInverses[i]!);
      const q = reals[i]!;
      transform.decompose(position, q, scale);
      const { x, y, z, w } = q;
      const { x: tx, y: ty, z: tz } = position;
      // The dual component is half the translation quaternion multiplied by the rotation.
      duals[i]!.set(
        (tx * w + ty * z - tz * y) / 2,
        (-tx * z + ty * w + tz * x) / 2,
        (tx * y - ty * x + tz * w) / 2,
        -(tx * x + ty * y + tz * z) / 2,
      );
    }
    for (let i = 0; i < points.count; i++) {
      let qx = 0, qy = 0, qz = 0, qw = 0, dx = 0, dy = 0, dz = 0, dw = 0;
      const ref = reals[indices[i * 4]!]!;
      for (let j = 0; j < 4; j++) {
        const k = i * 4 + j, weight = weights[k]!;
        if (!weight) continue;
        const q = reals[indices[k]!]!, d = duals[indices[k]!]!;
        // Equivalent rotations must occupy the same quaternion hemisphere before blending.
        const share = weight * (q.dot(ref) < 0 ? -1 : 1);
        qx += q.x * share; qy += q.y * share; qz += q.z * share; qw += q.w * share;
        dx += d.x * share; dy += d.y * share; dz += d.z * share; dw += d.w * share;
      }
      const length = Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw);
      qx /= length; qy /= length; qz /= length; qw /= length;
      dx /= length; dy /= length; dz /= length; dw /= length;
      const x = rest[i * 3]!, y = rest[i * 3 + 1]!, z = rest[i * 3 + 2]!;
      const cx = qy * z - qz * y, cy = qz * x - qx * z, cz = qx * y - qy * x;
      points.setXYZ(i,
        x + 2 * (qw * cx + qy * cz - qz * cy) + 2 * (qw * dx - qx * dw + qy * dz - qz * dy),
        y + 2 * (qw * cy + qz * cx - qx * cz) + 2 * (qw * dy - qy * dw + qz * dx - qx * dz),
        z + 2 * (qw * cz + qx * cy - qy * cx) + 2 * (qw * dz - qz * dw + qx * dy - qy * dx),
      );
    }
    // Finite joint neighbourhoods remove the pose's pinches without changing the torso or limb ends.
    // Always start with the bind positions above: repeated poses cannot shrink or drift the mesh.
    for (let pass = 0; pass < 8; pass++) {
      for (const { index: i, amount } of smoothing) {
        const near = neighbours[i]!;
        let x = 0, y = 0, z = 0;
        for (const j of near) { x += points.getX(j); y += points.getY(j); z += points.getZ(j); }
        const count = near.length || 1, share = amount * 0.6;
        next[i * 3] = points.getX(i) * (1 - share) + x / count * share;
        next[i * 3 + 1] = points.getY(i) * (1 - share) + y / count * share;
        next[i * 3 + 2] = points.getZ(i) * (1 - share) + z / count * share;
      }
      for (const { index: i } of smoothing) points.setXYZ(i, next[i * 3]!, next[i * 3 + 1]!, next[i * 3 + 2]!);
    }
    points.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    // A conservative sphere from the updated box avoids a second vertex scan and still keeps picking correct.
    geometry.boundingBox!.getBoundingSphere(geometry.boundingSphere ??= new THREE.Sphere());
  };
  return { material, update };
}
