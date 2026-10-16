// Mountain version 13, frozen (World.md W90); nothing draws this.
import * as THREE from "three/webgpu";
import { Fn, attribute, bumpMap, float, mix, mx_noise_float, output, positionLocal, positionWorld, reflectVector, smoothstep, step, uniform, vec3, vec4, vertexColor } from "three/tsl";
import { buildBaseFog } from "./build-base-fog";
import { mountainCap, mountainGeometry } from "./build-mountains-mountain-v13";
import { mountainAlgae } from "./build-mountain-algae-v13";
import { mountainNeck } from "./build-mountain-neck-v13";
import { sunOf } from "./atmosphere";
import { mountainOf, type MountainConfig } from "./mountain-jig-v13";
import type { CloudsConfig } from "./clouds";
import type { AtmosphereSettings } from "./environment";

/**
 * A mountain as placed (World.md W73): its asset's id, where it stands, the way it faces (degrees), and its variant's
 * settings; and how far over the world's floor its foot is (W88: moved up or down; none on the floor).
 */
export type PlacedMountain = { id: string; x: number; z: number; y?: number; turn: number; config: MountainConfig };

/** World.md W34, W37, W39, W40, W41, W50, W73: stone monoliths with glass summits emerge from continuous white fog,
 * each where it was placed, facing its way (W73; the ring's seeded layout went with the placing). Only tips stand at
 * the building floor; the lower edge is concealed by the permanent cloud veil (W43). Each mountain's group carries
 * its asset's id, so a click with Select on the Sectors page picks it (W82).
 */
export function buildWorldBase(environment: AtmosphereSettings, clouds: CloudsConfig, placed: readonly PlacedMountain[] = []) {
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
  // W64: physical glass needs radiance as well as a background. The lighting model supplies a direction
  // and roughness for each reflection/diffuse lookup; share the existing procedural sky's pigments.
  const glassEnvironment = Fn((_inputs: unknown[], builder: THREE.NodeBuilder) => {
    const context = builder.context as { getUV(): THREE.Node<"vec3">; getTextureLevel(): THREE.Node<"float"> };
    const direction = vec3(context.getUV());
    const blur = float(context.getTextureLevel());
    const noise = mx_noise_float(direction.mul(float(7).div(blur.mul(4).add(1))));
    const mass = smoothstep(-0.35, 0.1, noise).mul(0.82);
    const base = mix(horizon, sky, smoothstep(-0.1, 0.65, direction.y));
    const paint = mix(cream, rose, mx_noise_float(direction.mul(3)).mul(0.5).add(0.5));
    const highlight = direction.dot(sun).max(0).pow(float(180).div(blur.mul(20).add(1))).mul(float(2).sub(blur));
    return mix(base, paint, mass).add(sunlight.mul(highlight));
  })();
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
  // The mountains as placed (W73): one a placed asset, remade only where its variant's settings change, moved and
  // turned where its place changes; or, on the mountain's page, the one being tuned alone at the world's middle.
  const set = (next: AtmosphereSettings, nextClouds: CloudsConfig, nextPlaced: readonly PlacedMountain[] = []) => {
    const key = JSON.stringify(nextPlaced);
    if (key !== mountainKey) {
      const active = new Set<string>();
      for (const { id, x, y, z, turn, config } of nextPlaced) {
        active.add(id);
        const mountain = mountainOf(config);
        const shapeKey = JSON.stringify(config);
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
          group.name = `mountain ${id}`;
          group.userData.asset = id;
          group.add(mesh, coating, stoneCut, algaeCut, mountainNeck(config, air), mountainCap(mountain, config.cap === "stone" ? surfaces.stone : mirror, config, glassEnvironment, air));
          mesh.castShadow = true; mesh.receiveShadow = true;
          mesh.name = "submerged-mountain";
          built = { key: shapeKey, group };
          builtMountains.set(id, built);
          mountains.add(group);
        }
        built.group.position.set(x, y ?? 0, z);
        built.group.rotation.y = turn * Math.PI / 180;
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
  set(environment, clouds, placed);
  return { object, set, airAt: fog.at, eyeAir: fog.eye, flow(seconds: number, cloudSeconds = seconds) { clock.value = seconds; fog.boundaryFlow(cloudSeconds); } };
}
