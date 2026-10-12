import * as THREE from "three/webgpu";

import { buildFluidSky } from "./build-fluid-sky";
import type { EnvironmentConfig } from "./environment";

/**
 * Environment v11: the open sky (World.md W23). There is no ground plane any more (his, W24: "Let's remove the plane"):
 * the land is what is built, the environment's blocks and the sector's (`sector.ts`). Ponds are a later element.
 */
export type BuiltOrbit = {
  object: THREE.Group;
  flow(skySeconds: number): void;
  set(environment: EnvironmentConfig): void;
  readonly flowing: boolean;
};

export function buildOrbit(environment: EnvironmentConfig): BuiltOrbit {
  const object = new THREE.Group();
  object.name = "open-world";
  const sky = buildFluidSky(environment);
  object.add(sky.mesh);
  let current = environment;
  return {
    object,
    flow(seconds) { sky.clock.value = seconds; },
    set(next) { current = next; sky.set(next); },
    get flowing() { return current.motion === "flowing" && current.skyFlow > 0 && current.skySpeed > 0; },
  };
}
