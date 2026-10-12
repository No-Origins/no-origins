import * as THREE from "three/webgpu";

/** Periodic potential field. RGB is its curl velocity, A its scalar pigment. Generated once, never per frame. */
export function fluidTexture(seed = 7) {
  const side = 32, count = side ** 3;
  const potential = new Float32Array(count * 3);
  const index = (x: number, y: number, z: number) => ((z + side) % side * side + (y + side) % side) * side + (x + side) % side;
  const hash = (x: number, y: number, z: number, cells: number, channel: number) => {
    let n = Math.imul(x % cells, 73856093) ^ Math.imul(y % cells, 19349663) ^ Math.imul(z % cells, 83492791) ^ Math.imul(seed + channel * 31, 2654435761);
    n = Math.imul(n ^ (n >>> 16), 2246822507);
    return ((n ^ (n >>> 13)) >>> 0) / 4294967295;
  };
  const noise = (x: number, y: number, z: number, cells: number, channel: number) => {
    const px = x / side * cells, py = y / side * cells, pz = z / side * cells;
    const ix = Math.floor(px), iy = Math.floor(py), iz = Math.floor(pz);
    const smooth = (a: number) => a * a * (3 - 2 * a);
    const sx = smooth(px - ix), sy = smooth(py - iy), sz = smooth(pz - iz);
    let sum = 0;
    for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      sum += hash(ix + dx, iy + dy, iz + dz, cells, channel) * (dx ? sx : 1 - sx) * (dy ? sy : 1 - sy) * (dz ? sz : 1 - sz);
    }
    return sum;
  };
  for (let z = 0; z < side; z++) for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const i = index(x, y, z);
    for (let c = 0; c < 3; c++) potential[i * 3 + c] = noise(x, y, z, 4, c) * 0.75 + noise(x, y, z, 8, c) * 0.25;
  }
  const curl = new Float32Array(count * 3);
  let magnitude = 0.001;
  for (let z = 0; z < side; z++) for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const i = index(x, y, z);
    const d = (c: number, axis: number) => {
      const step = [0, 0, 0]; step[axis] = 1;
      return potential[index(x + step[0], y + step[1], z + step[2]) * 3 + c] - potential[index(x - step[0], y - step[1], z - step[2]) * 3 + c];
    };
    [d(2, 1) - d(1, 2), d(0, 2) - d(2, 0), d(1, 0) - d(0, 1)].forEach((a, c) => {
      curl[i * 3 + c] = a; magnitude = Math.max(magnitude, Math.abs(a));
    });
  }
  const data = new Uint8Array(count * 4);
  for (let i = 0; i < count; i++) {
    for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.round((curl[i * 3 + c] / magnitude * 0.5 + 0.5) * 255);
    data[i * 4 + 3] = Math.round(potential[i * 3] * 255);
  }
  const texture = new THREE.Data3DTexture(data, side, side, side);
  texture.format = THREE.RGBAFormat;
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = texture.wrapR = THREE.RepeatWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}
