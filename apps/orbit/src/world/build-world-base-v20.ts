import * as THREE from "three/webgpu";
import { cameraPosition, color, float, mix, mx_noise_float, normalWorld, positionGeometry, positionWorld, smoothstep, uniform, vec3 } from "three/tsl";
import { sunOf } from "./atmosphere";
import type { EnvironmentConfig } from "./environment-v20";

/** World.md W34: the base is white flowing clouds; only the tips of the huge mountains emerge.
 * Mountains extend below the world, leaving its building floor at y=0. The cloud surfaces intersect their
 * slopes in actual world space: depth testing hides the buried rock, with a thin drifting veil over it.
 */
export function buildWorldBase(environment: EnvironmentConfig) {
  const object = new THREE.Group();
  object.name = "world-base-clouds-and-summits";
  const clock = uniform(0), strength = uniform(environment.cloudFlow);
  const wind = uniform(new THREE.Vector3());
  const sun = uniform(sunOf(environment));
  const rockLight = uniform(new THREE.Color("#e1dce1"));
  const rockShade = uniform(new THREE.Color("#9295ac"));
  const here = positionGeometry.sub(wind.mul(clock).mul(strength).mul(2.8));
  const rolls = mx_noise_float(here.mul(vec3(0.009, 0.009, 0.013)))
    .add(mx_noise_float(here.mul(0.024).add(28)).mul(0.32));

  // A solid billowing bed, then a broken, slightly higher layer which drifts between the summits.
  for (let layer = 0; layer < 2; layer++) {
    const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, fog: false, transparent: layer === 1, depthWrite: layer === 0 });
    material.positionNode = positionGeometry.add(vec3(0, rolls.add(0.55).max(0).pow(2).mul(layer ? 4 : 12), 0));
    const p = positionWorld.sub(wind.mul(clock).mul(strength).mul(2.8));
    const folds = mx_noise_float(p.mul(vec3(0.025, 0.025, 0.04))).mul(0.7)
      .add(mx_noise_float(p.mul(0.065).add(53)).mul(0.3));
    const recess = smoothstep(-0.4, 0.5, folds);
    const white = mix(color("#dce2ec"), color("#ffffff"), recess);
    const haze = smoothstep(400, 1900, positionWorld.sub(cameraPosition).length());
    material.colorNode = mix(white, color("#f3f3f5"), haze);
    if (layer) material.opacityNode = smoothstep(-0.15, 0.45, folds).mul(0.65).mul(float(1).sub(haze));
    const geometry = new THREE.PlaneGeometry(6000, 6000, 240, 240);
    geometry.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = layer ? -7 : -17;
    mesh.name = layer ? "drifting-white-cloud-veils" : "white-cloud-sea";
    mesh.renderOrder = layer ? 2 : 0;
    object.add(mesh);
  }

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
  return { object, set, flow(seconds: number) { clock.value = seconds; } };
}
