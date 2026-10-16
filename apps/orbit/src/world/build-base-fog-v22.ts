import * as THREE from "three/webgpu";
import { cameraPosition, color, exp, float, Fn, hash, Loop, max, min, mix, positionWorld, screenCoordinate, smoothstep, texture3D, vec3, vec4 } from "three/tsl";

/** W37: fog is air with density, never a visible shell. Integrate the same medium up to a mountain
 * face or the distant background, so slopes fade progressively into the gas instead of being cut by a plane.
 */
export function buildBaseFog(
  clock: ReturnType<typeof import("three/tsl").uniform<"float">>,
  strength: ReturnType<typeof import("three/tsl").uniform<"float">>,
  wind: ReturnType<typeof import("three/tsl").uniform<"vec3">>,
) {
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
  const drift = wind.mul(clock).mul(strength).mul(2.8);
  const at = (endpoint: typeof positionWorld) => Fn(() => {
    const delta = endpoint.sub(cameraPosition), distance = delta.length().max(0.001);
    const ray = delta.div(distance);
    // Enter/leave the fog's vertical region. Near-horizontal rays never divide by zero.
    const dy = ray.y.greaterThanEqual(0).select(1, -1).mul(ray.y.abs().max(0.0001));
    const upper = float(10).sub(cameraPosition.y).div(dy);
    const lower = float(-185).sub(cameraPosition.y).div(dy);
    const start = min(upper, lower).max(0);
    const end = min(max(upper, lower), distance).max(start).min(start.add(1100));
    const step = end.sub(start).div(24);
    const transmittance = float(1).toVar(), sum = vec3(0).toVar();
    // Fixed spatial jitter breaks sampling bands without making paused fog flicker.
    const jitter = hash(screenCoordinate.x.add(screenCoordinate.y.mul(4096)));
    Loop(24, ({ i }) => {
      const p = cameraPosition.add(ray.mul(start.add(i.toFloat().add(jitter).mul(step))));
      const q = p.sub(drift);
      const broad = texture3D(map, q.mul(vec3(0.0016, 0.004, 0.0023))).r;
      const fine = texture3D(map, q.mul(vec3(0.0047, 0.007, 0.0059)).add(vec3(0.37, 0.11, 0.73))).r;
      const strands = mix(broad, fine, 0.3);
      const profile = smoothstep(-185, -110, p.y).mul(float(1).sub(smoothstep(-55, 10, p.y)));
      const density = smoothstep(0.18, 0.82, strands).mul(0.034).add(0.004).mul(profile);
      const alpha = float(1).sub(exp(density.mul(step).negate()));
      const paint = mix(color("#e8edf2"), color("#ffffff"), smoothstep(0.2, 0.7, fine));
      sum.addAssign(paint.mul(alpha).mul(transmittance));
      transmittance.mulAssign(float(1).sub(alpha));
    });
    const opacity = float(1).sub(transmittance);
    return vec4(sum.div(opacity.max(0.0001)), opacity);
  })();
  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, fog: false });
  const gas = at(positionWorld);
  material.colorNode = mix(color("#dce4eb"), gas.rgb, gas.a);
  const geometry = new THREE.PlaneGeometry(12000, 12000);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -190;
  mesh.name = "continuous-white-base-fog";
  material.addEventListener("dispose", () => map.dispose());
  return { mesh, at };
}
