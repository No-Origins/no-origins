import * as THREE from "three/webgpu";
import { mix, positionWorld } from "three/tsl";

import { sunOf } from "./atmosphere";
import { buildFluidSky } from "./build-fluid-sky";
import { buildWorldBase, type PlacedMountain } from "./build-world-base";
import { buildWorldWalls } from "./build-world-walls";
import type { CloudsConfig } from "./clouds";
import type { AtmosphereSettings, EnvironmentConfig } from "./environment";

/**
 * Environment v32: the open sky (World.md W33) over white clouds and mountain tips at the base (W34, W37, W40, W39).
 * The base is scenery beneath the building floor, separate from the sector's land.
 */
export type BuiltOrbit = {
  object: THREE.Group;
  flow(skySeconds: number, cloudSeconds?: number, baseSeconds?: number): void;
  set(environment: EnvironmentConfig, clouds: CloudsConfig, mountains?: readonly PlacedMountain[]): void;
  /** The Clay's inspection light and metre-scale shadows, on its own builder page alone (World.md W103). */
  inspectHuman(on: boolean): void;
  airAt(p: typeof positionWorld): THREE.Node<"vec4">;
  /** The air as the eye in the helmet sees it (World.md W78): clear for `clear` metres round it, `haze` (0 to 1) past that. */
  eyeAir(clear: number, haze: number): void;
  readonly flowing: boolean;
};

export function buildOrbit(environment: EnvironmentConfig, clouds: CloudsConfig, mountains: readonly PlacedMountain[] = []): BuiltOrbit {
  const object = new THREE.Group();
  object.name = "open-world";
  const sun = new THREE.DirectionalLight("#ffffff", 2);
  sun.name = "world-sun";
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -520;
  sun.shadow.camera.right = sun.shadow.camera.top = 520;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 3000;
  // W53: kilometre-wide shadow texels need clearance on steep smooth cliffs to avoid repeated self-shadow bands.
  sun.shadow.normalBias = 0.75;
  sun.shadow.bias = -0.0003;
  const fill = new THREE.HemisphereLight("#e6edf6", "#f5f7fa", 1.5);
  fill.name = "diffuse-sky-light";
  let inspectingHuman = false;
  const setSun = (next: AtmosphereSettings) => {
    const span = inspectingHuman ? 3.5 : 520;
    sun.shadow.camera.left = sun.shadow.camera.bottom = -span;
    sun.shadow.camera.right = sun.shadow.camera.top = span;
    sun.shadow.camera.near = inspectingHuman ? 0.1 : 1;
    sun.shadow.camera.far = inspectingHuman ? 30 : 3000;
    sun.shadow.normalBias = inspectingHuman ? 0.003 : 0.75;
    sun.shadow.bias = inspectingHuman ? -0.000015 : -0.0003;
    sun.shadow.radius = inspectingHuman ? 5 : 1;
    sun.shadow.camera.updateProjectionMatrix();
    if (inspectingHuman) {
      // Kilometre-wide shadow texels cannot describe a human's contact creases or its feet on a four-metre block.
      // A broad warm fill and a front-left key let the actual fabric and rounded forms be judged against the sheet.
      sun.position.set(-3, 6, 5);
      sun.target.position.set(0, 1.2, 0);
      sun.color.set("#fff4eb"); sun.intensity = 1.6;
      fill.color.set("#fbf8f5"); fill.groundColor.set("#d9d2cf"); fill.intensity = 2.4;
      return;
    }
    sun.target.position.set(0, 0, 0);
    sun.intensity = 2;
    fill.groundColor.set("#f5f7fa");
    sun.position.copy(sunOf(next).multiplyScalar(1600));
    sun.color.set("#ffffff").lerp(new THREE.Color(next.sunlight), next.warmth * 0.35);
    fill.color.set("#e6edf6").lerp(new THREE.Color(next.shadow), next.shade * 0.18);
    fill.intensity = 2 - next.shade * 0.8;
  };
  setSun(environment);
  object.add(sun, sun.target, fill);
  const sky = buildFluidSky(environment);
  const base = buildWorldBase(environment, clouds, mountains);
  const air = base.airAt(positionWorld);
  // buildFluidSky supplies RGB; Three's material type also permits scalar and RGBA nodes.
  sky.mesh.material.colorNode = mix(sky.mesh.material.colorNode as typeof positionWorld, air.rgb, air.a);
  const walls = buildWorldWalls(clouds, base.airAt, environment.sky);
  object.add(sky.mesh, base.object, walls.mesh);
  let current = environment;
  return {
    object,
    airAt: base.airAt,
    eyeAir: base.eyeAir,
    flow(seconds, cloudSeconds = 0, baseSeconds = cloudSeconds) { sky.clock.value = seconds; base.flow(baseSeconds, cloudSeconds); walls.flow(cloudSeconds); },
    set(next, clouds, mountains) { current = next; setSun(next); sky.set(next); base.set(next, clouds, mountains); walls.set(clouds, next.sky); },
    inspectHuman(on) { if (on === inspectingHuman) return; inspectingHuman = on; setSun(current); },
    get flowing() { return current.motion && ((current.skyFlow > 0 && current.skySpeed > 0) || (current.baseCloudDensity > 0 && current.baseCloudCoverage > 0 && current.baseCloudSpeed > 0)); },
  };
}
