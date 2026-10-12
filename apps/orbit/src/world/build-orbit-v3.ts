import * as THREE from "three/webgpu";
import {
  cameraPosition,
  color,
  Discard,
  dot,
  float,
  Fn,
  max,
  mix,
  mx_noise_vec3,
  normalize,
  normalWorld,
  positionWorld,
  reflect,
  reflector,
  smoothstep,
  step,
  uniform,
  vec3,
} from "three/tsl";

import { grainOf, sunOf } from "./atmosphere-v3";

import type { EnvironmentConfig } from "./environment-v3";

/**
 * What stands round the Orbit (environment version 3, `environment.ts`; his: "The world is a floating space covered with
 * a glossy spherical dome. Clouds above and water below the sphere"): the dome, the clouds over it and the sea it sits
 * in. The visitor is always inside the dome, so it is drawn from inside alone; the sea never comes in.
 *
 * Nothing is lit by a light in the scene (mine): the dome's shine and the sea's glints are two lights' reflections worked
 * out on the surface, the clouds take warm light and cool shade from the adjustable sun, and the sea mirrors the painted sky.
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
  object.add(buildSky(environment), sea.mesh, buildClouds(environment), buildDome(environment));
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
 * Where the sea stands up the outside of the glass, the glass below its line shows the sea from under its surface,
 * deepening the further down, with a thin bright line where the water meets the glass.
 */
function buildDome(environment: EnvironmentConfig): THREE.Mesh {
  const { radius, dome, tint, gloss, water } = environment;
  const seaY = seaOf(environment);
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
  const glass = mix(color(dome), color("#ffffff"), shine.min(1));
  const glassOpacity = float(tint).add(slant).add(shine).min(1);

  // Under the sea's line: the sea seen from under it, its colour falling towards the dark the deeper the glass is.
  const depth = float(seaY).sub(positionWorld.y);
  const under = step(float(0), depth);
  const deep = mix(color(water).mul(0.7), color(water).mul(0.18), smoothstep(0, radius, depth));
  const line = float(1).sub(smoothstep(0, 0.25, depth.abs()));
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: THREE.BackSide });
  material.colorNode = mix(mix(glass, deep, under), color("#ffffff"), line.mul(0.8));
  material.opacityNode = mix(glassOpacity, float(0.94), under).max(line.mul(0.9));
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 128, 96), material);
  // Behind everything inside it, it is drawn first of what is seen through.
  mesh.renderOrder = -1;
  return mesh;
}

/**
 * The clouds: a layer of them over the dome, `cloudHeight` above its top, reaching three times its radius round. Each
 * is a few puffs, squashed flat, placed by a fixed random draw, so the same settings are always the same sky. Lit by
 * nothing; its surface blends towards the adjustable sunlight and shadow colours, with fine fixed grain.
 */
function buildClouds(environment: EnvironmentConfig): THREE.Object3D {
  const { radius, clouds, cloudCount, cloudHeight, shadow, sunlight, warmth, shade } = environment;
  const random = seeded(7);
  const puffs: THREE.Matrix4[] = [];
  const at = new THREE.Vector3();
  const size = new THREE.Vector3();
  const turn = new THREE.Quaternion();
  for (let i = 0; i < Math.round(cloudCount); i++) {
    // Spread over a disc, more of them further out, as a sky is seen.
    const angle = random() * Math.PI * 2;
    const out = radius * (0.15 + 2.85 * Math.sqrt(random()));
    const middle = new THREE.Vector3(Math.cos(angle) * out, radius + cloudHeight + random() * radius * 0.12, Math.sin(angle) * out);
    const wide = radius * (0.12 + random() * 0.14);
    const count = 4 + Math.floor(random() * 5);
    for (let j = 0; j < count; j++) {
      const r = wide * (0.45 + random() * 0.45);
      at.set(middle.x + (random() - 0.5) * wide * 2, middle.y + (random() - 0.3) * r * 0.5, middle.z + (random() - 0.5) * wide * 1.2);
      size.set(r, r * 0.55, r);
      turn.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      puffs.push(new THREE.Matrix4().compose(at, turn, size));
    }
  }
  const material = new THREE.MeshBasicNodeMaterial();
  const sun = sunOf(environment);
  const facing = normalWorld.dot(vec3(sun.x, sun.y, sun.z));
  const cloud = mix(color(clouds), color(shadow), float(1).sub(smoothstep(-0.8, 0.8, facing)).mul(shade));
  material.colorNode = mix(cloud, color(sunlight), facing.max(0).mul(warmth)).mul(grainOf(environment));
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 3), material, Math.max(1, puffs.length));
  puffs.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
  mesh.count = puffs.length;
  mesh.frustumCulled = false;
  return mesh;
}

/**
 * The sea (his: "The water should feel realistic"): a mirror of what is above it (the sphere, the clouds, the sky; a
 * reflection rendered from under its surface, at half the view's resolution), broken by its waves, three sizes of
 * ripple moving on their own time; how much of it mirrors and how much is its own colour turns on how slantwise it is
 * seen (Fresnel: looked down into, its colour, deeper; towards the horizon, the sky); and where the lights' reflections
 * meet the camera off a wave, a glint. It stands at its Level over the sphere's bottom and never inside the sphere,
 * which it is cut round where they meet; the fog takes it towards the horizon.
 */
function buildSea(environment: EnvironmentConfig) {
  const { radius, water, waves } = environment;
  const seaY = seaOf(environment);
  const clock = uniform(0);
  const reach = radius * 40;
  // Where the sea meets the sphere, the round it is cut to, so no water stands inside the glass.
  const round = Math.sqrt(Math.max(0, radius * radius - seaY * seaY));

  const material = new THREE.MeshBasicNodeMaterial();
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(reach, 128), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = seaY;

  // The mirror: what is above the sea, seen from under its surface.
  const mirror = reflector({ resolutionScale: 0.5 });
  mesh.add(mirror.target);

  // The waves: three sizes of ripple, each a field of noise drifting on its own time, tilting the surface.
  const here = positionWorld.xz;
  const swell = mx_noise_vec3(vec3(here.mul(0.045), clock.mul(0.18)));
  const chop = mx_noise_vec3(vec3(here.mul(0.21).add(17.3), clock.mul(0.45)));
  const ripple = mx_noise_vec3(vec3(here.mul(0.9).add(3.1), clock.mul(1.1)));
  const tilt = swell.xy.mul(0.55).add(chop.xy.mul(0.3)).add(ripple.xy.mul(0.15)).mul(waves * 0.6);
  const normal = normalize(vec3(tilt.x, 1, tilt.y));

  const toEye = cameraPosition.sub(positionWorld);
  const eye = normalize(toEye);
  const facing = max(dot(eye, normal), 0);
  const reflectance = float(1).sub(facing).pow(5).mul(0.98).add(0.02);

  // The mirror, broken by the waves, the more the nearer.
  mirror.uvNode = mirror.uvNode!.add(normal.xz.mul(float(0.001).add(float(1).div(toEye.length()))).mul(18));

  const glints = lightsOf(environment).map(({ way, strength }) =>
    max(dot(eye, reflect(vec3(-way.x, -way.y, -way.z), normal)), 0).pow(320).mul(2.2 * strength),
  ).reduce((sum, glint) => sum.add(glint));
  const body = mix(color(water).mul(0.42), color(water).mul(0.85), float(1).sub(facing));

  material.colorNode = Fn(() => {
    Discard(here.length().lessThan(round));
    return mix(body, mirror.rgb, reflectance).add(color(environment.sunlight).mul(glints));
  })();
  return { mesh, clock };
}

/** A fixed random draw, the same each time from the same seed (mulberry32). */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
