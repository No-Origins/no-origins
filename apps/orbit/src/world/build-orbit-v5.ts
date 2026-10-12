import * as THREE from "three/webgpu";
import {
  cameraPosition,
  color,
  Discard,
  float,
  Fn,
  mix,
  mx_noise_float,
  positionWorld,
  reflect,
  smoothstep,
  uniform,
  vec3,
} from "three/tsl";

import { grainOf, sunOf } from "./atmosphere-v5";

import type { EnvironmentConfig } from "./environment-v5";

/**
 * What stands round the Orbit (environment version 5, `environment.ts`; his: "The world is a floating space covered with
 * a glossy spherical dome. Clouds above and water below the sphere"): the dome, the clouds over it and the sea it sits
 * in. The visitor is always inside the dome, so it is drawn from inside alone; the sea never comes in.
 *
 * Nothing is lit by a light in the scene (mine): the dome's shine and the sea's glints are two lights' reflections worked
 * out on the surface, the clouds take warm light and cool shade from the adjustable sun, and the sea is a matte pastel layer, bounded in reach.
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
export type BuiltOrbit = { object: THREE.Group; flow(seconds: number): void; flowing: boolean };

export function buildOrbit(environment: EnvironmentConfig): BuiltOrbit {
  const object = new THREE.Group();
  const sea = buildSea(environment);
  object.add(buildSky(environment), sea.mesh, buildDome(environment), buildContours(environment));
  return {
    object,
    flow: (seconds) => {
      sea.clock.value = seconds;
    },
    flowing: environment.waves > 0 && environment.waveSpeed > 0,
  };
}

/** A painted sky beyond the dome: cool overhead, peach at the horizon, with a low sun. No image download. */
function buildSky(environment: EnvironmentConfig): THREE.Mesh {
  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false, fog: false });
  const direction = positionWorld.normalize();
  const sun = sunOf(environment);
  const facing = direction.dot(vec3(sun.x, sun.y, sun.z));
  const sky = mix(color(environment.horizon), color(environment.sky), smoothstep(-0.08, 0.65, direction.y));
  const sunset = facing.max(0).pow(8).mul(environment.warmth * 0.35);
  const disc = smoothstep(Math.cos(0.025), Math.cos(0.022), facing);
  material.colorNode = mix(mix(sky, color(environment.sunlight), sunset), color("#fff4d7"), disc);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(environment.radius * 38, 48, 32), material);
  mesh.renderOrder = -3;
  return mesh;
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
  const slant = float(1).sub(view.dot(outward).abs()).pow(4).mul(0.5);
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

/** Pastel water below the dome, a finite disc with slow, broad ripples and mineral grain.
 * Viscosity is an art control for damping and ripple breadth, not a fluid simulation. No reflected scene or glints.
 */
function buildSea(environment: EnvironmentConfig) {
  const { radius, water, waves, viscosity, waterReach } = environment;
  const seaY = seaOf(environment);
  const clock = uniform(0);
  const reach = radius * waterReach;
  const round = Math.sqrt(Math.max(0, radius * radius - seaY * seaY));
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, fog: false });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(reach, 128), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = seaY;
  const here = positionWorld.xz;
  const damping = 1 / (1 + viscosity * 8);
  const broad = mx_noise_float(vec3(here.mul(0.025 + (1 - viscosity) * 0.04), clock.mul(0.18 * damping)));
  const fine = mx_noise_float(vec3(here.mul(0.15), clock.mul(0.4 * damping)));
  const ripple = broad.mul(0.8).add(fine.mul((1 - viscosity) * 0.2));
  const body = mix(color(water), color(environment.horizon), ripple.mul(waves * 0.3).add(0.35));
  material.colorNode = Fn(() => {
    Discard(here.length().lessThan(round));
    return body.mul(grainOf(environment));
  })();
  // A gently fading finite edge; the sea never replaces the sky all the way to infinity.
  material.opacityNode = float(1).sub(smoothstep(reach * 0.85, reach, here.length()));
  return { mesh, clock };
}
