import * as THREE from "three/webgpu";
import { mix, positionWorld } from "three/tsl";

import { sunOf } from "./atmosphere";
import { buildFluidSky } from "./build-fluid-sky";
import { buildWorldBase } from "./build-world-base-v31";
import { buildWorldWalls } from "./build-world-walls";
import type { CloudsConfig } from "./clouds";
import type { EnvironmentConfig } from "./environment-v34";

/**
 * Environment v31: the open sky (World.md W33) over white clouds and mountain tips at the base (W34, W37, W40, W39).
 * The base is scenery beneath the building floor, separate from the sector's land.
 */
export type BuiltOrbit = {
  object: THREE.Group;
  flow(skySeconds: number, cloudSeconds?: number, baseSeconds?: number): void;
  set(environment: EnvironmentConfig, clouds: CloudsConfig): void;
  airAt(p: typeof positionWorld): THREE.Node<"vec4">;
  readonly flowing: boolean;
};

export function buildOrbit(environment: EnvironmentConfig, clouds: CloudsConfig): BuiltOrbit {
  const object = new THREE.Group();
  object.name = "open-world";
  const sun = new THREE.DirectionalLight("#ffffff", 2);
  sun.name = "world-sun";
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -520;
  sun.shadow.camera.right = sun.shadow.camera.top = 520;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 3000;
  sun.shadow.normalBias = 0.2;
  const fill = new THREE.HemisphereLight("#e6edf6", "#f5f7fa", 1.5);
  fill.name = "diffuse-sky-light";
  const setSun = (next: EnvironmentConfig) => {
    sun.position.copy(sunOf(next).multiplyScalar(1600));
    sun.color.set("#ffffff").lerp(new THREE.Color(next.sunlight), next.warmth * 0.35);
    fill.color.set("#e6edf6").lerp(new THREE.Color(next.shadow), next.shade * 0.18);
    fill.intensity = 2 - next.shade * 0.8;
  };
  setSun(environment);
  object.add(sun, sun.target, fill);
  const sky = buildFluidSky(environment);
  const base = buildWorldBase(environment, clouds);
  const air = base.airAt(positionWorld);
  // buildFluidSky supplies RGB; Three's material type also permits scalar and RGBA nodes.
  sky.mesh.material.colorNode = mix(sky.mesh.material.colorNode as typeof positionWorld, air.rgb, air.a);
  const walls = buildWorldWalls(clouds, base.airAt, environment.sky);
  object.add(sky.mesh, base.object, walls.mesh);
  let current = environment;
  return {
    object,
    airAt: base.airAt,
    flow(seconds, cloudSeconds = 0, baseSeconds = cloudSeconds) { sky.clock.value = seconds; base.flow(baseSeconds, cloudSeconds); walls.flow(cloudSeconds); },
    set(next, clouds) { current = next; setSun(next); sky.set(next); base.set(next, clouds); walls.set(clouds, next.sky); },
    get flowing() { return current.motion === "flowing" && ((current.skyFlow > 0 && current.skySpeed > 0) || (current.baseCloudDensity > 0 && current.baseCloudCoverage > 0 && current.baseCloudSpeed > 0)); },
  };
}
