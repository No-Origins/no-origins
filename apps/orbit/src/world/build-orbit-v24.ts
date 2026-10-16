import * as THREE from "three/webgpu";
import { mix, positionWorld } from "three/tsl";

import { buildFluidSky } from "./build-fluid-sky-v24";
import { buildWorldBase } from "./build-world-base-v24";
import type { EnvironmentConfig } from "./environment-v24";

/**
 * Environment v24: the open sky (World.md W33) over white clouds and mountain tips at the base (W34, W37, W40, W39).
 * The base is scenery beneath the building floor, separate from the sector's land.
 */
export type BuiltOrbit = {
  object: THREE.Group;
  flow(skySeconds: number, cloudSeconds?: number, baseSeconds?: number): void;
  set(environment: EnvironmentConfig): void;
  readonly flowing: boolean;
};

export function buildOrbit(environment: EnvironmentConfig): BuiltOrbit {
  const object = new THREE.Group();
  object.name = "open-world";
  const sky = buildFluidSky(environment);
  const base = buildWorldBase(environment);
  const air = base.airAt(positionWorld);
  // buildFluidSky supplies RGB; Three's material type also permits scalar and RGBA nodes.
  sky.mesh.material.colorNode = mix(sky.mesh.material.colorNode as typeof positionWorld, air.rgb, air.a);
  object.add(sky.mesh, base.object);
  let current = environment;
  return {
    object,
    flow(seconds, cloudSeconds = 0, baseSeconds = cloudSeconds) { sky.clock.value = seconds; base.flow(baseSeconds); },
    set(next) { current = next; sky.set(next); base.set(next); },
    get flowing() { return current.motion === "flowing" && ((current.skyFlow > 0 && current.skySpeed > 0) || (current.baseCloudDensity > 0 && current.baseCloudCoverage > 0 && current.baseCloudSpeed > 0)); },
  };
}
