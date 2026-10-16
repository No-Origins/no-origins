import * as THREE from "three/webgpu";
import { mix, positionWorld } from "three/tsl";

import { buildFluidSky } from "./build-fluid-sky-v27";
import { buildWorldBase } from "./build-world-base-v27";
import { buildWorldWalls } from "./build-world-walls-v27";
import type { CloudsConfig } from "./clouds-v1";
import type { EnvironmentConfig } from "./environment-v27";

/**
 * Environment v27: the open sky (World.md W33) over white clouds and mountain tips at the base (W34, W37, W40, W39).
 * The base is scenery beneath the building floor, separate from the sector's land.
 */
export type BuiltOrbit = {
  object: THREE.Group;
  flow(skySeconds: number, cloudSeconds?: number, baseSeconds?: number): void;
  set(environment: EnvironmentConfig, clouds: CloudsConfig): void;
  readonly flowing: boolean;
};

export function buildOrbit(environment: EnvironmentConfig, clouds: CloudsConfig): BuiltOrbit {
  const object = new THREE.Group();
  object.name = "open-world";
  const sky = buildFluidSky(environment);
  const base = buildWorldBase(environment, clouds);
  const air = base.airAt(positionWorld);
  // buildFluidSky supplies RGB; Three's material type also permits scalar and RGBA nodes.
  sky.mesh.material.colorNode = mix(sky.mesh.material.colorNode as typeof positionWorld, air.rgb, air.a);
  const walls = buildWorldWalls(clouds, base.airAt);
  object.add(sky.mesh, base.object, walls.mesh);
  let current = environment;
  return {
    object,
    flow(seconds, cloudSeconds = 0, baseSeconds = cloudSeconds) { sky.clock.value = seconds; base.flow(baseSeconds, cloudSeconds); walls.flow(cloudSeconds); },
    set(next, clouds) { current = next; sky.set(next); base.set(next, clouds); walls.set(clouds); },
    get flowing() { return current.motion === "flowing" && ((current.skyFlow > 0 && current.skySpeed > 0) || (current.baseCloudDensity > 0 && current.baseCloudCoverage > 0 && current.baseCloudSpeed > 0)); },
  };
}
