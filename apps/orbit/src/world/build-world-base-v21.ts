import * as THREE from "three/webgpu";
import { cameraPosition, color, float, mix, mx_noise_float, normalWorld, positionGeometry, positionLocal, positionWorld, smoothstep, uniform, vec3 } from "three/tsl";
import { sunOf } from "./atmosphere";
import type { EnvironmentConfig } from "./environment-v21";

/** World.md W34, W35: the base is white flowing clouds; only the tips of the huge mountains emerge.
 * Mountains extend below the world, leaving its building floor at y=0. Overlapping cumulus banks intersect their
 * slopes in world space; rounded crowns and stepped white/blue shading follow his illustrated reference.
 */
export function buildWorldBase(environment: EnvironmentConfig) {
  const object = new THREE.Group();
  object.name = "world-base-clouds-and-summits";
  const clock = uniform(0), strength = uniform(environment.cloudFlow);
  const wind = uniform(new THREE.Vector3());
  const sun = uniform(sunOf(environment));
  const rockLight = uniform(new THREE.Color("#c4ddea"));
  const rockShade = uniform(new THREE.Color("#6495b7"));
  // W35: actual overlapping lobes give the base scalloped silhouettes and self-occluding crowns.
  // Instanced tiles share one lobe geometry; the opaque bed is hidden underneath them.
  const bedMaterial = new THREE.MeshBasicNodeMaterial({ color: "#d7e9f3", fog: false });
  const bedGeometry = new THREE.PlaneGeometry(10000, 10000);
  bedGeometry.rotateX(-Math.PI / 2);
  const bed = new THREE.Mesh(bedGeometry, bedMaterial);
  bed.position.y = -62;
  bed.name = "deep-cloud-fill";
  object.add(bed);

  const cloudMaterial = new THREE.MeshBasicNodeMaterial({ fog: false });
  const lightDirection = uniform(new THREE.Vector3(-0.8, 0.38, 0.45).normalize());
  const lit = normalWorld.dot(lightDirection);
  const mottling = mx_noise_float(positionWorld.mul(0.17)).mul(0.07);
  const tone = lit.add(mottling);
  const shadow = color("#91bad6"), middle = color("#cce5f1"), white = color("#fffef9");
  const shaded = mix(shadow, middle, smoothstep(-0.18, -0.04, tone));
  const highlighted = mix(shaded, white, smoothstep(0.5, 0.62, tone));
  const haze = smoothstep(500, 2200, positionWorld.sub(cameraPosition).length());
  cloudMaterial.colorNode = mix(highlighted, color("#f1f6f7"), haze);
  // Tiny shape changes keep the crowns breathing while the banks travel along the wind.
  const breathing = positionGeometry.y.mul(2.3).add(clock.mul(0.35)).sin().mul(strength).mul(0.028);
  cloudMaterial.positionNode = positionLocal.add(vec3(0, breathing.mul(18), 0));
  const lobes: { x: number; y: number; z: number; sx: number; sy: number; sz: number }[] = [];
  let seed = 73419;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  // Near banks have several scales of rounded lobes, with smaller crowns joined to the broad body.
  for (let z = -1050; z <= 1050; z += 90) {
    for (let x = -1050; x <= 1050; x += 90) {
      const bx = x + (random() - 0.5) * 36, bz = z + (random() - 0.5) * 36;
      const size = 0.75 + random() * 0.65;
      const top = -9 - random() * 10;
      lobes.push({ x: bx, y: top - 32 * size, z: bz, sx: 62 * size, sy: 22 * size, sz: 55 * size });
      for (let lobe = 0; lobe < 11; lobe++) {
        const angle = random() * Math.PI * 2, reach = 12 + random() * 38;
        const radius = (8 + random() * 16) * size;
        lobes.push({ x: bx + Math.cos(angle) * reach * size, y: top - radius - random() * 12,
          z: bz + Math.sin(angle) * reach * size, sx: radius, sy: radius * (0.85 + random() * 0.25), sz: radius * (0.8 + random() * 0.35) });
      }
    }
  }
  const cloudGeometry = new THREE.SphereGeometry(1, 28, 20);
  const cloudPositions = cloudGeometry.getAttribute("position");
  for (let i = 0; i < cloudPositions.count; i++) {
    const x = cloudPositions.getX(i), y = cloudPositions.getY(i), z = cloudPositions.getZ(i);
    const scallop = 1 + 0.035 * Math.sin(x * 6 + z * 3) * Math.cos(y * 5 - z * 3)
      + 0.012 * Math.cos(z * 9 + x * 5) * Math.sin(y * 8 + x * 4);
    cloudPositions.setXYZ(i, x * scallop, y * scallop, z * scallop);
  }
  cloudGeometry.computeVertexNormals();
  const banks = new THREE.Group();
  banks.name = "scalloped-cumulus-banks";
  const tiles = new Map<string, typeof lobes>();
  for (const lobe of lobes) {
    const key = `${Math.floor(lobe.x / 300)}:${Math.floor(lobe.z / 300)}`;
    const tile = tiles.get(key) ?? [];
    tile.push(lobe);
    tiles.set(key, tile);
  }
  const transform = new THREE.Object3D();
  for (const tile of tiles.values()) {
    const mesh = new THREE.InstancedMesh(cloudGeometry, cloudMaterial, tile.length);
    tile.forEach((lobe, index) => {
      transform.position.set(lobe.x, lobe.y, lobe.z);
      transform.scale.set(lobe.sx, lobe.sy, lobe.sz);
      transform.rotation.y = index * 2.39996;
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    banks.add(mesh);
  }
  object.add(banks);
  let released = false;
  cloudMaterial.addEventListener("dispose", () => {
    if (released) return;
    released = true;
    for (const mesh of banks.children) (mesh as THREE.InstancedMesh).dispose();
  });

  // Broad submerged massifs with crooked ridgelines, secondary summits and chipped faces, never cones.
  const peaks = [
    [-35, -280, 12, 125], [-105, -160, 8, 125], [95, -230, 14, 155], [280, -360, 20, 190],
    [-340, -380, 18, 175], [-210, 160, 12, 145], [230, 210, 16, 170],
    [440, -80, 22, 185], [-460, 20, 24, 195], [10, -590, 28, 220],
    [510, 480, 30, 225], [-520, 510, 28, 210],
  ];
  const stone = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, fog: false });
  const facing = normalWorld.dot(sun).mul(0.5).add(0.5);
  const mineral = mx_noise_float(positionWorld.mul(0.36)).mul(0.045);
  const rock = mix(rockShade, rockLight, smoothstep(0.15, 0.85, facing)).add(mineral);
  const buried = float(1).sub(smoothstep(-20, 9, positionWorld.y));
  const distance = smoothstep(250, 1300, positionWorld.sub(cameraPosition).length()).mul(0.75);
  stone.colorNode = mix(rock, color("#f2f2f6"), buried.mul(0.65).max(distance));
  for (const [x, z, height, radius] of peaks) {
    const geometry = new THREE.PlaneGeometry(radius * 2, radius * 2, 56, 56);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.getAttribute("position");
    for (let i = 0; i < positions.count; i++) {
      const px = positions.getX(i), pz = positions.getZ(i);
      const angle = Math.atan2(pz, px);
      const r = Math.hypot(px * 1.05, pz * 0.86) / radius;
      const ridge = 1 + Math.sin(angle * 5 + x) * 0.15 + Math.sin(angle * 9 + z) * 0.08;
      const main = Math.max(0, 1 - r / ridge);
      const spur = Math.max(0, 1 - Math.hypot(px - radius * 0.32, pz + radius * 0.18) / (radius * 0.6));
      const mass = Math.max(Math.pow(main, 1.65), Math.pow(spur, 1.8) * 0.95);
      const chips = (Math.sin(px * 0.19 + pz * 0.13) + Math.sin(px * 0.37 - pz * 0.23)) * 2.4 * main;
      positions.setY(i, -180 + (height + 180) * mass + chips);
    }
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, stone);
    mesh.position.set(x, 0, z);
    mesh.name = "submerged-mountain-summit";
    object.add(mesh);
  }
  const set = (next: EnvironmentConfig) => {
    strength.value = next.cloudFlow;
    const angle = THREE.MathUtils.degToRad(next.skyWind);
    wind.value.set(Math.sin(angle), 0, -Math.cos(angle));
    sun.value.copy(sunOf(next));
  };
  set(environment);
  return { object, set, flow(seconds: number) {
    clock.value = seconds;
    // Bounded drift avoids a wrap seam or an ever-emptying edge; the cloud field extends beyond the world.
    const travel = Math.sin(seconds * 0.015) * 65 * strength.value;
    banks.position.copy(wind.value).multiplyScalar(travel);
  } };
}
