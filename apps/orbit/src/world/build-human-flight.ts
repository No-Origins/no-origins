import * as THREE from "three/webgpu";
import { float, materialOpacity, uv } from "three/tsl";
import type { JointId } from "@no-origins/ui/lib/human-motion";

import type { ClayFlightFrame } from "./human-flight";

let exhaustTexture: THREE.DataTexture | null = null;
/** Soft luminous propulsion is explicitly part of his Clay reference (World.md W107). No hardware is added. */
function exhaustMap(): THREE.DataTexture {
  if (exhaustTexture) return exhaustTexture;
  const size = 64, pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const r = Math.hypot((x + 0.5) / size * 2 - 1, (y + 0.5) / size * 2 - 1);
    const i = (y * size + x) * 4;
    pixels[i] = 255;
    pixels[i + 1] = Math.round(255 - 75 * Math.min(1, r));
    pixels[i + 2] = Math.round(238 - 175 * Math.min(1, r));
    pixels[i + 3] = Math.round(Math.exp(-r * r * 5) * Math.max(0, 1 - r) * 255);
  }
  const map = new THREE.DataTexture(pixels, size, size);
  map.colorSpace = THREE.SRGBColorSpace;
  map.magFilter = map.minFilter = THREE.LinearFilter;
  map.needsUpdate = true;
  exhaustTexture = map;
  return map;
}

/** Feet-following warm plumes, a few embers, and three fine open air ribbons. All are hidden at rest. */
export function buildHumanFlight(root: THREE.Group, bones: Record<JointId, THREE.Bone>, jetLength: number) {
  const object = new THREE.Group();
  object.name = "Clay flight effects";
  object.visible = false;
  object.scale.setScalar(0);
  root.add(object);
  const plane = new THREE.PlaneGeometry(1, 1);
  const plume = new THREE.ConeGeometry(0.065, 1, 24, 1, true);
  plume.rotateZ(Math.PI);
  plume.translate(0, -0.5, 0);
  const feet = (["leftFoot", "rightFoot"] as const).map(id => {
    const puffs = Array.from({ length: 9 }, (_, i) => {
      const material = new THREE.SpriteNodeMaterial({ map: exhaustMap(), color: "#ffe1aa", transparent: true, depthWrite: false, fog: false });
      const puff = new THREE.Mesh(plane, material);
      puff.name = `${id} soft propulsion ${i}`;
      puff.frustumCulled = false;
      puff.raycast = () => {};
      object.add(puff);
      return puff;
    });
    const light = new THREE.PointLight("#ffd598", 0, 2.8, 2);
    // Keep lights in the scene at zero intensity, so takeoff never recompiles the skin's lighting shader.
    light.name = `${id} Clay propulsion light`;
    root.add(light);
    const coreMaterial = new THREE.MeshBasicNodeMaterial({ color: "#ffe2a1", transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
    coreMaterial.opacityNode = materialOpacity.mul(float(1).sub(uv().y).pow(0.7));
    const core = new THREE.Mesh(plume, coreMaterial);
    core.name = `${id} warm jet core`;
    core.raycast = () => {};
    object.add(core);
    return { bone: bones[id], puffs, core, light, position: new THREE.Vector3(), direction: new THREE.Vector3() };
  });
  const sparks = new THREE.InstancedMesh(new THREE.SphereGeometry(0.008, 6, 4), new THREE.MeshBasicNodeMaterial({ color: "#ffd5a1", transparent: true, depthWrite: false, fog: false }), 40);
  sparks.name = "Clay propulsion embers";
  sparks.frustumCulled = false;
  sparks.raycast = () => {};
  sparks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  object.add(sparks);
  const ribbons = Array.from({ length: 3 }, (_, i) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(81 * 3), 3).setUsage(THREE.DynamicDrawUsage));
    const material = new THREE.LineBasicNodeMaterial({ color: "#dfbd8d", transparent: true, depthWrite: false, fog: false, opacity: 0 });
    const line = new THREE.Line(geometry, material);
    line.name = `Clay glide air ribbon ${i}`;
    line.frustumCulled = false;
    line.raycast = () => {};
    object.add(line);
    return line;
  });
  const inverse = new THREE.Matrix4();
  const worldRotation = new THREE.Quaternion();
  const rootRotation = new THREE.Quaternion();
  const dummy = new THREE.Object3D();
  const hips = new THREE.Vector3();
  const update = (frame: ClayFlightFrame | null) => {
    const jets = frame?.jets ?? 0, trails = frame?.trails ?? 0;
    object.visible = jets > 0.001 || trails > 0.001;
    object.scale.setScalar(object.visible ? 1 : 0);
    if (!object.visible || !frame) {
      for (const foot of feet) foot.light.intensity = 0;
      return;
    }
    root.updateWorldMatrix(true, true);
    inverse.copy(root.matrixWorld).invert();
    root.getWorldQuaternion(rootRotation).invert();
    for (const foot of feet) {
      foot.bone.getWorldPosition(foot.position).applyMatrix4(inverse);
      foot.bone.getWorldQuaternion(worldRotation).premultiply(rootRotation);
      foot.direction.set(0, -1, 0).applyQuaternion(worldRotation);
      foot.position.addScaledVector(foot.direction, 0.025);
      for (const [i, puff] of foot.puffs.entries()) {
        const t = i / (foot.puffs.length - 1);
        const pulse = 1 + 0.055 * Math.sin(frame.time / 75 + i * 1.7);
        puff.visible = jets > 0.001;
        puff.position.copy(foot.position).addScaledVector(foot.direction, t * jetLength * jets);
        puff.scale.setScalar((0.19 * (1 - t) + 0.025) * pulse * Math.sqrt(jets));
        puff.material.opacity = jets * (1 - t * 0.7) * 0.8;
      }
      foot.light.position.copy(foot.position).addScaledVector(foot.direction, 0.05);
      foot.light.intensity = jets * 0.12;
      foot.core.visible = jets > 0.001;
      foot.core.position.copy(foot.position);
      foot.core.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), foot.direction);
      foot.core.scale.set(jets, jetLength * jets, jets);
      foot.core.material.opacity = jets * 0.26;
    }
    sparks.visible = jets > 0.001;
    sparks.scale.setScalar(sparks.visible ? 1 : 0);
    (sparks.material as THREE.MeshBasicNodeMaterial).opacity = jets * 0.65;
    for (let i = 0; i < sparks.count; i++) {
      const foot = feet[i % 2]!;
      const seed = (i * 0.61803398875) % 1;
      const age = ((frame.time / 850 + seed) % 1 + 1) % 1;
      const theta = i * 2.39996;
      const spread = (0.015 + age * 0.11) * jets;
      dummy.position.copy(foot.position).addScaledVector(foot.direction, (0.1 + age * jetLength * 1.5) * jets);
      dummy.position.x += Math.cos(theta) * spread;
      dummy.position.z += Math.sin(theta) * spread;
      dummy.scale.setScalar((1 - age) * jets * (0.4 + seed));
      dummy.updateMatrix(); sparks.setMatrixAt(i, dummy.matrix);
    }
    sparks.instanceMatrix.needsUpdate = true;
    bones.hips.getWorldPosition(hips).applyMatrix4(inverse);
    for (const [i, line] of ribbons.entries()) {
      line.visible = trails > 0.001;
      line.scale.setScalar(line.visible ? 1 : 0);
      line.material.opacity = trails * (0.5 - i * 0.08);
      const points = line.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let j = 0; j < points.count; j++) {
        const t = j / (points.count - 1);
        const angle = frame.time / 2100 + i * 2.1 + t * Math.PI * 1.62;
        const radius = 1.02 + i * 0.1 + 0.04 * Math.sin(t * Math.PI);
        points.setXYZ(j,
          hips.x + Math.cos(angle) * radius,
          hips.y - 0.12 + (i - 1) * 0.16 + Math.sin(angle + i) * 0.1 - t * 0.08,
          hips.z + Math.sin(angle) * radius * 0.58,
        );
      }
      points.needsUpdate = true;
    }
  };
  return { object, update };
}
