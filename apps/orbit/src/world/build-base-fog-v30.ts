import * as THREE from "three/webgpu";
import { boundaryPaint } from "./boundary-paint-v30";
import type { CloudsConfig } from "./clouds";
import { WORLD_SIZE } from "./orbit";
import type { EnvironmentConfig } from "./environment-v30";
import { cameraPosition, color, exp, float, Fn, hash, Loop, mix, positionWorld, screenCoordinate, smoothstep, texture, texture3D, uniform, vec3, vec4 } from "three/tsl";

/** W37, W40: fog is air with density, never a visible shell. Integrate the same medium up to a mountain
 * face or the distant background, so slopes fade progressively into the gas instead of being cut by a plane.
 */
export function buildBaseFog(
  clock: ReturnType<typeof import("three/tsl").uniform<"float">>,
  environment: EnvironmentConfig,
  clouds: CloudsConfig,
) {
  const boundary = boundaryPaint(clouds, environment.sky, environment);
  // Small numeric noise volume, filtered in hardware. Multiple incommensurate taps hide its tile.
  const size = 48, data = new Uint8Array(size ** 3);
  let seed = 39271;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const coarse = new Float32Array(8 ** 3);
  for (let i = 0; i < coarse.length; i++) coarse[i] = random();
  const sample = (x: number, y: number, z: number) => coarse[((z + 8) % 8) * 64 + ((y + 8) % 8) * 8 + ((x + 8) % 8)];
  const ease = (v: number) => v * v * (3 - 2 * v);
  for (let z = 0; z < size; z++) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const px = x / 6, py = y / 6, pz = z / 6;
    const ix = Math.floor(px), iy = Math.floor(py), iz = Math.floor(pz);
    const fx = ease(px - ix), fy = ease(py - iy), fz = ease(pz - iz);
    let value = 0;
    for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      value += sample(ix + dx, iy + dy, iz + dz) * (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy) * (dz ? fz : 1 - fz);
    }
    data[(z * size + y) * size + x] = Math.round(value * 255);
  }
  const map = new THREE.Data3DTexture(data, size, size, size);
  map.format = THREE.RedFormat;
  map.minFilter = map.magFilter = THREE.LinearFilter;
  map.wrapS = map.wrapT = map.wrapR = THREE.RepeatWrapping;
  map.unpackAlignment = 1;
  map.needsUpdate = true;
  // W40: a non-repeating weather field sets gaps, local altitude and thickness independently.
  // Hashing integer coordinates instead of wrapping a small lattice avoids repeating complete fog banks.
  const weatherSize = 256, weatherData = new Uint8Array(weatherSize * weatherSize * 4);
  const hash2 = (x: number, z: number, salt: number) => {
    let h = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ salt;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x: number, z: number, span: number, salt: number) => {
    const px = x / span, pz = z / span, ix = Math.floor(px), iz = Math.floor(pz);
    const fx = ease(px - ix), fz = ease(pz - iz);
    return (hash2(ix, iz, salt) * (1 - fx) + hash2(ix + 1, iz, salt) * fx) * (1 - fz)
      + (hash2(ix, iz + 1, salt) * (1 - fx) + hash2(ix + 1, iz + 1, salt) * fx) * fz;
  };
  for (let z = 0; z < weatherSize; z++) for (let x = 0; x < weatherSize; x++) {
    const wx = (x / (weatherSize - 1) - 0.5) * 12000, wz = (z / (weatherSize - 1) - 0.5) * 12000;
    const warpX = (noise(wx, wz, 480, 39) - 0.5) * 280;
    const warpZ = (noise(wx, wz, 550, 67) - 0.5) * 280;
    const coverage = noise(wx + warpX, wz + warpZ, 190, 117) * 0.65 + noise(wx, wz, 730, 213) * 0.35;
    const altitude = noise(wx, wz, 340, 791) * 0.7 + noise(wx, wz, 990, 381) * 0.3;
    const thickness = noise(wx, wz, 230, 938);
    const i = (z * weatherSize + x) * 4;
    weatherData[i] = Math.round(coverage * 255);
    weatherData[i + 1] = Math.round(altitude * 255);
    weatherData[i + 2] = Math.round(thickness * 255);
    weatherData[i + 3] = 255;
  }
  const weather = new THREE.DataTexture(weatherData, weatherSize, weatherSize, THREE.RGBAFormat);
  weather.minFilter = weather.magFilter = THREE.LinearFilter;
  weather.needsUpdate = true;
  const densityAmount = uniform(environment.baseCloudDensity), coverageAmount = uniform(environment.baseCloudCoverage);
  const height = uniform(environment.baseCloudHeight), variation = uniform(environment.baseCloudVariation);
  const thickness = uniform(environment.baseCloudThickness), scale = uniform(environment.baseCloudScale);
  const wind = uniform(new THREE.Vector3());
  const drift = wind.mul(clock).mul(3.5);
  const at = (endpoint: typeof positionWorld) => Fn(() => {
    const wallPaint = boundary.wallAt(endpoint).toVar();
    const delta = endpoint.sub(cameraPosition), distance = delta.length().max(0.001);
    const ray = delta.div(distance);
    // Every endpoint is within the closed cylinder; integrate air only inside the world.
    const start = float(0);
    const end = distance.min(1600);
    const step = end.sub(start).div(24);
    const transmittance = float(1).toVar(), sum = vec3(0).toVar();
    // Fixed spatial jitter breaks sampling bands without making paused fog flicker.
    const jitter = hash(screenCoordinate.x.add(screenCoordinate.y.mul(4096)));
    Loop(24, ({ i }) => {
      const p = cameraPosition.add(ray.mul(start.add(i.toFloat().add(jitter).mul(step))));
      const q = p.sub(drift);
      const bank = texture(weather, q.xz.mul(float(130).div(scale)).div(12000).add(0.5)).toVar();
      const centre = height.add(bank.g.sub(0.5).mul(variation).mul(3));
      const width = thickness.mul(mix(0.65, 1.35, bank.b));
      const profile = exp(p.y.sub(centre).div(width.mul(0.45)).pow(2).negate().mul(2));
      const fineQ = vec3(q.x.mul(0.83).add(q.z.mul(0.57)), q.y, q.z.mul(0.83).sub(q.x.mul(0.57)));
      const fine = texture3D(map, fineQ.mul(vec3(0.0047, 0.007, 0.0059)).add(vec3(0.37, 0.11, 0.73))).r;
      const threshold = float(0.85).sub(coverageAmount.mul(0.65));
      const cover = smoothstep(threshold.sub(0.14), threshold.add(0.14), bank.r)
        .mul(smoothstep(0, 0.1, coverageAmount));
      const lower = densityAmount.mul(0.025).mul(cover).mul(profile).mul(mix(0.45, 1.25, fine));
      // A permanent thin floor veil conceals tip cut edges; wall fog fills the entire vertical boundary.
      const wall = smoothstep(WORLD_SIZE.diameter / 2 - 140, WORLD_SIZE.diameter / 2, p.xz.length()).pow(2).mul(0.055);
      const density = lower.add(wall);
      const alpha = float(1).sub(exp(density.mul(step).negate()));
      const white = mix(color("#e8edf2"), color("#ffffff"), smoothstep(0.2, 0.7, fine));
      const paint = mix(white, wallPaint, wall.div(density.max(0.0001)));
      sum.addAssign(paint.mul(alpha).mul(transmittance));
      transmittance.mulAssign(float(1).sub(alpha));
    });
    // Integrate the thin floor veil analytically: 24 jittered samples undersample it on upward rays,
    // which otherwise makes a calm wall's shade sparkle between bright and dark pixels.
    const startDensity = exp(cameraPosition.y.max(0).div(8).negate());
    const endDensity = exp(endpoint.y.max(0).div(8).negate());
    const dy = ray.y.greaterThanEqual(0).select(1, -1).mul(ray.y.abs().max(0.0001));
    const floorDepth = ray.y.abs().greaterThan(0.0001).select(startDensity.sub(endDensity).mul(8).div(dy), startDensity.mul(distance)).max(0).mul(0.055);
    const floorAlpha = float(1).sub(exp(floorDepth.negate()));
    const opacity = float(1).sub(transmittance.mul(float(1).sub(floorAlpha)));
    const scattered = mix(sum, color("#f5f7fa"), floorAlpha);
    return vec4(scattered.div(opacity.max(0.0001)), opacity);
  })();
  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, fog: false });
  const gas = at(positionWorld);
  material.colorNode = mix(color("#f5f7fa"), gas.rgb, gas.a);
  const geometry = new THREE.CircleGeometry(WORLD_SIZE.diameter / 2, 192);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 0;
  mesh.name = "continuous-white-base-fog";
  material.addEventListener("dispose", () => { map.dispose(); weather.dispose(); });
  const set = (next: EnvironmentConfig, nextClouds: CloudsConfig) => {
    boundary.set(nextClouds, next.sky, next);
    densityAmount.value = next.baseCloudDensity; coverageAmount.value = next.baseCloudCoverage;
    height.value = next.baseCloudHeight; variation.value = next.baseCloudVariation;
    thickness.value = next.baseCloudThickness; scale.value = next.baseCloudScale;
    const angle = THREE.MathUtils.degToRad(next.baseCloudWind);
    wind.value.set(Math.sin(angle), 0, -Math.cos(angle));
  };
  set(environment, clouds);
  return { mesh, at, set, boundaryFlow(seconds: number) { boundary.clock.value = seconds; } };
}
