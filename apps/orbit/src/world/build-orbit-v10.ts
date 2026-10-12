import * as THREE from "three/webgpu";
import {
  cameraPosition,
  color,
  float,
  mix,
  positionWorld,
  reflect,
  smoothstep,
  vec3,
} from "three/tsl";

import { buildFluidSky } from "./build-fluid-sky-v10";
import { buildFluidWater } from "./build-fluid-water-v10";

import { grainOf, sunOf } from "./atmosphere-v10";

import type { EnvironmentConfig } from "./environment-v10";

/**
 * What stands round the Orbit (environment version 10, `environment.ts`; his: "The world is a floating space covered with
 * a glossy spherical dome. Clouds above and water below the sphere"): the dome, the clouds over it and the sea it sits
 * in. The visitor is always inside the dome, so it is drawn from inside alone; the sea never comes in.
 *
 * Nothing is lit by a light in the scene: the dome's shine is calculated on its surface. Water has gentle rolling
 * geometry and folded pastel pigments; sky gases flow with wind. Waves, current and sky each have their own clock and uniform controls.
 */

/**
 * The faint fill stays ahead on the left; the main light follows the environment's sun direction.
 */
const FILL = new THREE.Vector3(-0.6, 0.5, -0.62).normalize();

/** The adjustable sun and a faint fill, shared by glass and water. */
const lightsOf = (environment: EnvironmentConfig) => [
  { way: sunOf(environment), strength: 1 },
  { way: FILL, strength: 0.18 },
];

/** The sea's height, in metres: its Level over the sphere's bottom, never over its top. */
export const seaOf = ({ radius, waterLevel }: Pick<EnvironmentConfig, "radius" | "waterLevel">) =>
  -radius + Math.min(waterLevel, radius * 2);

/**
 * The Orbit's surroundings, made from the environment's settings. `flow` moves the sea's waves to a moment (seconds of
 * their own time, the Speed already in it); `flowing` says whether they move at all.
 */
export type BuiltOrbit = {
  object: THREE.Group;
  flow(waterSeconds: number, skySeconds: number, currentSeconds?: number): void;
  set(environment: EnvironmentConfig): void;
  readonly flowing: boolean;
};

export function buildOrbit(environment: EnvironmentConfig): BuiltOrbit {
  const object = new THREE.Group();
  const sea = buildFluidWater(environment);
  const sky = buildFluidSky(environment);
  let current = environment;
  object.add(sky.mesh, sea.mesh, buildDome(environment), buildContours(environment));
  return {
    object,
    flow(waterSeconds, skySeconds, currentSeconds = 0) { sea.clock.value = waterSeconds; sea.currentClock.value = currentSeconds; sky.clock.value = skySeconds; },
    set(next) { current = next; sea.set(next); sky.set(next); },
    get flowing() {
      return current.motion === "flowing" && ((current.waves > 0 && current.waveHeight > 0 && current.waveSpeed > 0) || (current.skyFlow > 0 && current.skySpeed > 0) || (current.waterCurrent > 0 && current.waterCurrentSpeed > 0));
    },
  };
}

/**
 * The dome: a sphere of glass round the world, seen from inside. Over everything behind it, it lays its colour by its
 * Tint, and shines where a light is reflected off it towards the camera: a sharp spot and a soft sheen round it, as
 * bright as the Gloss. Looked at slantwise (near the dome), the glass shows more of itself, as glass does.
 *
 * Its lower half keeps this tint too: opaque deep-water colouring made the camera feel submerged.
 */
function buildDome(environment: EnvironmentConfig): THREE.Mesh {
  const { radius, dome, tint, gloss } = environment;
  const outward = positionWorld.normalize();
  const view = positionWorld.sub(cameraPosition).normalize();
  const mirrored = reflect(view, outward);
  const shine = lightsOf(environment).map(({ way, strength }) => {
    const facing = mirrored.dot(vec3(way.x, way.y, way.z)).max(0);
    return facing.pow(900).mul(1.2).add(facing.pow(8).mul(0.3)).mul(strength);
  })
    .reduce((sum, light) => sum.add(light))
    .mul(gloss);
  const slant = float(1).sub(view.dot(outward).abs()).pow(4).mul(tint * 1.5);
  const shell = mix(color(dome), color(environment.shadow), float(1).sub(smoothstep(-0.8, 0.3, outward.y)).mul(0.2));
  const glass = mix(shell, color(environment.sunlight), shine.min(1)).mul(grainOf(environment));
  const glassOpacity = float(tint).add(slant).add(shine).min(1);

  // The dome remains the dome below the waterline too. Painting its lower half as opaque deep water made the
  // camera feel submerged even though the actual water was outside the sphere.
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: THREE.BackSide });
  material.colorNode = glass;
  material.opacityNode = glassOpacity;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 128, 96), material);
  // Behind everything inside it, it is drawn first of what is seen through.
  mesh.renderOrder = -1;
  return mesh;
}

/** Sparse curved seams make the enclosing sphere readable from inside, without a wireframe over the world. */
function buildContours({ radius, boundary, shadow }: EnvironmentConfig): THREE.Group {
  const group = new THREE.Group();
  if (boundary <= 0) return group;
  const r = radius - 0.12;
  const material = new THREE.LineBasicMaterial({ color: shadow, transparent: true, opacity: boundary * 0.55, depthWrite: false, fog: false });
  const ring = (points: THREE.Vector3[]) => {
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([...points, points[0]]), material);
    group.add(line);
  };
  // Three great circles, with no dense lattice: each is a continuous contour on the dome itself.
  for (let turn = 0; turn < 3; turn++) {
    const angle = turn * Math.PI / 3;
    ring(Array.from({ length: 192 }, (_, i) => {
      const t = i * Math.PI * 2 / 192;
      return new THREE.Vector3(Math.cos(t) * Math.sin(angle) * r, Math.sin(t) * r, Math.cos(t) * Math.cos(angle) * r);
    }));
  }
  ring(Array.from({ length: 192 }, (_, i) => {
    const t = i * Math.PI * 2 / 192;
    return new THREE.Vector3(Math.cos(t) * r, 0, Math.sin(t) * r);
  }));
  return group;
}
