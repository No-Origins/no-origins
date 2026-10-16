import * as THREE from "three/webgpu";
import { attribute, bumpMap, float, mix, mx_noise_float, output, positionLocal, positionWorld, reflectVector, smoothstep, step, uniform, vec3, vec4, vertexColor } from "three/tsl";
import { buildBaseFog } from "./build-base-fog";
import { mountainCap, mountainGeometry } from "./build-mountains-mountain-v12";
import { mountainAlgae } from "./build-mountain-algae-v12";
import { mountainNeck } from "./build-mountain-neck-v12";
import { sunOf } from "./atmosphere";
import { mountainId, mountainStart, type MountainConfig, type MountainEdits } from "./mountain-jig-v12";
import { mountainFits } from "./mountain-fit-v12";
import { mountainsOf, mountainTurn } from "./mountains";
import type { CloudsConfig } from "./clouds";
import type { EnvironmentConfig } from "./environment-v34";

/** World.md W34, W37, W39, W40, W41, W50: stone monoliths with reflective summits emerge from continuous white fog.
 * Only tips stand at the building floor; the lower edge is concealed by the permanent cloud veil (W43).
 */
export function buildWorldBase(environment: EnvironmentConfig, clouds: CloudsConfig, edits: MountainEdits = {}) {
  const object = new THREE.Group();
  object.name = "world-base-clouds-and-summits";
  const clock = uniform(0);
  const fog = buildBaseFog(clock, environment, clouds);
  object.add(fog.mesh);

  const stone = new THREE.MeshStandardNodeMaterial({ side: THREE.FrontSide, fog: false, roughness: 1, metalness: 0, alphaTest: 0.999 });
  // Physical sunlight models broad stone faces; fine mineral grain remains anchored in world space.
  const tooth = mx_noise_float(positionWorld.mul(1.8)).mul(0.025)
    .add(mx_noise_float(positionWorld.mul(0.14)).mul(0.015));
  stone.colorNode = vertexColor().rgb.add(tooth);
  stone.normalNode = bumpMap(mx_noise_float(positionWorld.mul(1.8)).mul(0.12)
    .add(mx_noise_float(positionWorld.mul(0.28)).mul(0.22)), float(0.6));
  const air = fog.at(positionWorld);
  // W59: opaque upper surfaces retain depth/refraction; a separate lower band blends into the actual background.
  const floorVisibility = smoothstep(0, 30, positionWorld.y);
  stone.opacityNode = floorVisibility;
  stone.alphaTestNode = float(0.999);
  stone.outputNode = vec4(mix(output.rgb, air.rgb, air.a), 1);
  const algae = new THREE.MeshStandardNodeMaterial({ side: THREE.FrontSide, fog: false, roughness: 1, metalness: 0, alphaTest: 0.999 });
  algae.colorNode = vertexColor().rgb;
  algae.normalNode = bumpMap(mx_noise_float(positionWorld.mul(4)).mul(0.06), float(0.5));
  algae.opacityNode = floorVisibility;
  algae.alphaTestNode = float(0.999);
  algae.outputNode = vec4(mix(output.rgb, air.rgb, air.a), 1);
  const surfacesFor = (config: MountainConfig) => {
    const surface = stone.clone(), coating = algae.clone();
    surface.roughness = config.stoneRoughness;
    const scale = config.stoneScale;
    const detail = config.stoneTexture === "smooth" ? 0 : config.stoneDetail;
    const grain = config.stoneTexture === "sandstone"
      ? mx_noise_float(positionWorld.mul(vec3(0.18 * scale, 2.8 * scale, 0.18 * scale)))
      : mx_noise_float(positionWorld.mul((config.stoneTexture === "basalt" ? 0.35 : 1.8) * scale));
    surface.colorNode = vertexColor().rgb.add(grain.mul(detail * 0.05));
    surface.normalNode = bumpMap(grain.mul(detail * 0.35), float(0.6));
    // W62: local-space, seeded chalk grain breaks the fringe into pigment flecks, revealing stone between them.
    const brushSpace = positionLocal.mul(config.algaeScale).add(vec3(config.algaeSeed * 0.17, 0, config.algaeSeed * 0.31));
    const dust = mx_noise_float(brushSpace.mul(7));
    const clumps = mx_noise_float(brushSpace.mul(1.4));
    const threshold = dust.mul(0.3).add(clumps.mul(0.16)).add(0.5).clamp(0.04, 0.96);
    const brushCoverage = step(threshold, attribute("algaeCoverage", "float"));
    coating.colorNode = vertexColor().rgb.add(dust.mul(0.03 * config.algaePastel));
    coating.normalNode = bumpMap(dust.mul(0.09).add(clumps.mul(0.035)), float(0.5));
    coating.opacityNode = floorVisibility.mul(brushCoverage);
    const cutVisibility = floorVisibility.mul(float(1).sub(step(30, positionWorld.y)));
    const fade = (material: THREE.MeshStandardNodeMaterial, coverage: typeof brushCoverage = float(1)) => {
      const lower = material.clone(); lower.transparent = true; lower.depthWrite = false; lower.alphaTest = 0.001;
      lower.alphaTestNode = float(0.001);
      const visibility = cutVisibility.mul(coverage);
      lower.opacityNode = visibility;
      lower.outputNode = vec4(mix(output.rgb, air.rgb, air.a), visibility);
      return lower;
    };
    return { stone: surface, algae: coating, stoneCut: fade(surface), algaeCut: fade(coating, brushCoverage) };
  };
  // The material remains owned even when Count is zero and there are no mountain meshes to visit.
  const sky = uniform(new THREE.Color(environment.sky));
  const horizon = uniform(new THREE.Color(environment.horizon));
  const cream = uniform(new THREE.Color(clouds.cream));
  const rose = uniform(new THREE.Color(clouds.rose));
  const sunlight = uniform(new THREE.Color(environment.sunlight));
  const sun = uniform(sunOf(environment));
  // W50: a view-dependent procedural sky reflection, bounded cost on both GPU backends.
  // It reflects sky/cloud pigment and sun direction, not scene objects (no extra render pass).
  const reflected = reflectVector;
  const billow = mx_noise_float(reflected.mul(7).add(clock.mul(0.015)));
  const cloud = smoothstep(-0.35, 0.1, billow).mul(0.82);
  const skyPaint = mix(horizon, sky, smoothstep(-0.1, 0.65, reflected.y));
  const cloudPaint = mix(cream, rose, mx_noise_float(reflected.mul(3)).mul(0.5).add(0.5));
  const reflection = mix(skyPaint, cloudPaint, cloud);
  const glint = reflected.dot(sun).max(0).pow(180).mul(1.8);
  const mirror = new THREE.MeshBasicNodeMaterial({ fog: false });
  mirror.colorNode = reflection.add(sunlight.mul(glint));
  mirror.outputNode = vec4(mix(output.rgb, air.rgb, air.a), 1);
  fog.mesh.material.addEventListener("dispose", () => { stone.dispose(); algae.dispose(); mirror.dispose(); });
  const mountains = new THREE.Group();
  mountains.name = "mountains";
  object.add(mountains);
  let mountainKey = "";
  const builtMountains = new Map<string, { key: string; group: THREE.Group }>();
  const disposeGeometry = (group: THREE.Group) => {
    const geometries = new Set<THREE.BufferGeometry>();
    group.traverse((child) => { if (child instanceof THREE.Mesh) geometries.add(child.geometry); });
    geometries.forEach((geometry) => geometry.dispose());
  };
  const set = (next: EnvironmentConfig, nextClouds: CloudsConfig, nextEdits: MountainEdits = {}) => {
    const key = JSON.stringify([next.mountainCount, next.mountainSpacing, next.mountainSeed, nextEdits]);
    if (key !== mountainKey) {

      const layout = mountainsOf(next);
      const configs = layout.map((m, i) => nextEdits[mountainId(next.mountainSeed, i)] ?? mountainStart(m));
      const active = new Set<string>();
      const fits = mountainFits(layout, configs, next.mountainSpacing);
      for (const [index, mountain] of layout.entries()) {
        const id = mountainId(next.mountainSeed, index);
        const config = configs[index];
        active.add(id);
        const shapeKey = JSON.stringify([mountain, config]);
        let built = builtMountains.get(id);
        if (built?.key !== shapeKey) {
          if (built) { disposeGeometry(built.group); mountains.remove(built.group); }
          const surfaces = surfacesFor(config);
          const geometry = mountainGeometry(mountain, config);
          geometry.addEventListener("dispose", () => Object.values(surfaces).forEach((material) => material.dispose()));
          const mesh = new THREE.Mesh(geometry, surfaces.stone);
          const coating = new THREE.Mesh(mountainAlgae(mountain, config), surfaces.algae);
          coating.name = "mountain-algae-layer"; coating.receiveShadow = true;
          const stoneCut = new THREE.Mesh(geometry, surfaces.stoneCut);
          const algaeCut = new THREE.Mesh(coating.geometry, surfaces.algaeCut);
          stoneCut.name = "mountain-floor-transition"; algaeCut.name = "algae-floor-transition";
          // Draw the lower coating after its stone; differing bounds must not sort the coating behind the body.
          stoneCut.renderOrder = 1; algaeCut.renderOrder = 2;
          const group = new THREE.Group();
          group.position.set(mountain.x, 0, mountain.z);
          group.rotation.y = mountainTurn(mountain) * Math.PI / 180;
          group.name = id;
          group.add(mesh, coating, stoneCut, algaeCut, mountainNeck(config), mountainCap(mountain, config.cap === "stone" ? surfaces.stone : mirror, config));
          mesh.castShadow = true; mesh.receiveShadow = true;
          mesh.name = `submerged-mountain-${mountain.kind}`;
          built = { key: shapeKey, group };
          builtMountains.set(id, built);
          mountains.add(group);
        }
        const group = built.group;
        // Wide or strongly tapered edits stay inside W43's boundary; never move their seeded centre.
        const fit = fits[index].scale;
        group.scale.set(fit, 1, fit);
      }
      for (const [id, built] of builtMountains) if (!active.has(id)) {
        disposeGeometry(built.group); mountains.remove(built.group); builtMountains.delete(id);
      }
      mountainKey = key;
    }
    sky.value.set(next.sky); horizon.value.set(next.horizon);
    cream.value.set(nextClouds.cream); rose.value.set(nextClouds.rose);
    sunlight.value.set(next.sunlight); sun.value.copy(sunOf(next));
    fog.set(next, nextClouds);
  };
  set(environment, clouds, edits);
  return { object, set, airAt: fog.at, flow(seconds: number, cloudSeconds = seconds) { clock.value = seconds; fog.boundaryFlow(cloudSeconds); } };
}
