import * as THREE from "three/webgpu";

import { buildFluidSky } from "./build-fluid-sky-v21";
import { buildWorldBase } from "./build-world-base-v21";
import type { EnvironmentConfig } from "./environment-v21";

/**
 * Environment v21: the open sky (World.md W33) over white clouds and mountain tips at the base (W34, W35).
 * The base is scenery beneath the building floor, separate from the sector's land.
 */
export type BuiltOrbit = {
  object: THREE.Group;
  flow(skySeconds: number, cloudSeconds?: number): void;
  set(environment: EnvironmentConfig): void;
  readonly flowing: boolean;
};

export function buildOrbit(environment: EnvironmentConfig): BuiltOrbit {
  const object = new THREE.Group();
  object.name = "open-world";
  const sky = buildFluidSky(environment);
  const base = buildWorldBase(environment);
  object.add(sky.mesh, base.object);
  let current = environment;
  return {
    object,
    flow(seconds, cloudSeconds = 0) { sky.clock.value = seconds; base.flow(cloudSeconds); },
    set(next) { current = next; sky.set(next); base.set(next); },
    get flowing() { return current.motion === "flowing" && ((current.skyFlow > 0 && current.skySpeed > 0) || (current.cloudFlow > 0 && current.cloudSpeed > 0)); },
  };
}
