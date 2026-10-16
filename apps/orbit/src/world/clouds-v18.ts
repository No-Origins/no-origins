export const CLOUD_SCALE = 120;
export type CloudField = { data: Uint8Array; resolution: readonly [number, number, number] };
/** Small numeric material texture. Repetition is confined to metre-scale tooth, never whole-cloud shape. */
export function cloudTooth(seed: number): CloudField {
  const data = new Uint8Array(32 * 32 * 32 * 4);
  for (let i = 0; i < data.length; i += 4) {
    let n = Math.imul((i / 4) ^ seed, 2246822507); n = Math.imul(n ^ (n >>> 16), 3266489909);
    data[i] = ((n ^ (n >>> 13)) >>> 0) % 256;
  }
  return { data, resolution: [32, 32, 32] };
}
const smooth = (lo: number, hi: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
};

/** W32: a moving window of a deterministic world-space density field, never a repeated bank.
 * R density, G broad pigment, B weather coverage, A erosion/tooth. Domain-warped noise makes formations with
 * unequal shape and spacing. Neighbouring windows evaluate the same world coordinates, including their margins. */
export function cloudSkyVolume(seed: number, wisps: number, origin: readonly [number, number], billow: readonly [number, number], scale: readonly [number, number, number], resolution: readonly [number, number, number] = [128, 64, 128]): CloudField {
  const [width, height, depth] = resolution;
  const data = new Uint8Array(width * height * depth * 4);
  const hash = (x: number, y: number, z: number) => {
    let n = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791) ^ seed;
    n = Math.imul(n ^ (n >>> 16), 2246822507);
    return ((n ^ (n >>> 13)) >>> 0) / 4294967295;
  };
  const noise = (x: number, y: number, z: number) => {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const sx = smooth(0, 1, x - ix), sy = smooth(0, 1, y - iy), sz = smooth(0, 1, z - iz);
    let v = 0;
    for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      v += hash(ix + dx, iy + dy, iz + dz) * (dx ? sx : 1 - sx) * (dy ? sy : 1 - sy) * (dz ? sz : 1 - sz);
    }
    return v;
  };
  const cell = Math.sqrt(billow[0] * billow[1]);
  // Feature points shape a continuous cellular density field; they are not scene objects or a cloud count.
  const features = new Map<string, { x: number; z: number; y: number; rx: number; rz: number; ry: number; turn: number }>();
  const feature = (x: number, z: number) => {
    const key = `${x}:${z}`; let f = features.get(key);
    if (!f) {
      f = { x: (x + 0.08 + hash(x, 1, z) * 0.84) * cell, z: (z + 0.08 + hash(x, 2, z) * 0.84) * cell,
        y: 0.38 + hash(x, 3, z) * 0.28, rx: billow[0] * (0.32 + hash(x, 4, z) * 0.38),
        rz: billow[1] * (0.42 + hash(x, 5, z) * 0.43), ry: 0.21 + hash(x, 6, z) * 0.20,
        turn: (hash(x, 7, z) - 0.5) * 1.4 };
      features.set(key, f);
    }
    return f;
  };
  // These column values do not depend on altitude; prepare them once, rather than per voxel.
  for (let z = 0; z < depth; z++) for (let x = 0; x < width; x++) {
    const wx = origin[0] + ((x + 0.5) / width - 0.5) * scale[0];
    const wz = origin[1] + ((z + 0.5) / depth - 0.5) * scale[2];
    const driftX = (noise(wx / 310 + 17, 2, wz / 310 + 31) - 0.5) * 240;
    const driftZ = (noise(wx / 270 + 43, 7, wz / 270 + 11) - 0.5) * 210;
    const nx = (wx + driftX) / billow[0], nz = (wz + driftZ) / billow[1];
    const broad = noise(wx / 570 + 23, 13, wz / 570 + 41);
    const weather = broad * 0.7 + noise((wx + driftX) / 230 + 5, 17, (wz + driftZ) / 230 + 19) * 0.3;
    const cx = Math.floor(wx / cell), cz = Math.floor(wz / cell);
    const nearby = [];
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const f = feature(cx + dx, cz + dz), a = Math.cos(f.turn), b = Math.sin(f.turn);
      const px = wx + driftX * 0.22 - f.x, pz = wz + driftZ * 0.22 - f.z;
      const horizontal = ((px * a - pz * b) / f.rx) ** 2 + ((px * b + pz * a) / f.rz) ** 2;
      if (horizontal < 2.5) nearby.push({ horizontal, y: f.y, ry: f.ry });
    }
    const pigment = noise(wx / 170 + 43, 31, wz / 210 + 5);
    for (let y = 0; y < height; y++) {
      const altitude = (y + 0.5) / height;
      const envelope = smooth(0.025, 0.12, altitude) * (1 - smooth(0.87, 0.98, altitude));
      const i = ((z * height + y) * width + x) * 4;
      data[i + 1] = Math.round(pigment * 255); data[i + 2] = Math.round(weather * 255);
      if (!envelope) continue;
      const py = altitude * 2.9 + (broad - 0.5) * 0.55;
      const body = noise(nx, py, nz);
      const billows = noise(nx * 2.07 + 17, py * 2.13 + 7, nz * 2.03 + 23);
      const edge = noise(nx * 4.19 + 31, py * 4.03 + 11, nz * 4.11 + 43);
      let distance = 10;
      for (const f of nearby) distance = Math.min(distance, Math.sqrt(f.horizontal + ((altitude - f.y + (body - 0.5) * 0.15) / f.ry) ** 2) - 1);
      const broken = distance + (0.5 - body) * 0.22 + (0.5 - billows) * 0.36 + (0.5 - edge) * 0.14;
      const gas = (1 - smooth(-0.05, 0.08, broken)) * smooth(0.22, 0.62, billows * 0.7 + edge * 0.3);
      const veil = (1 - smooth(0.03, 0.20, broken)) * wisps * 0.012;
      data[i] = Math.round(Math.min(1, gas * 0.85 + veil) * envelope * 255);
      data[i + 3] = Math.round(edge * 255);
    }
  }
  return { data, resolution };
}

/** Trilinear density; outside is empty rather than clamped to an edge. */
export function densityAt(field: CloudField, x: number, y: number, z: number): number {
  if (x <= 0 || x >= 1 || y <= 0 || y >= 1 || z <= 0 || z >= 1) return 0;
  const [w, h, d] = field.resolution;
  const px = x * w - 0.5, py = y * h - 0.5, pz = z * d - 0.5;
  const ix = Math.max(0, Math.floor(px)), iy = Math.max(0, Math.floor(py)), iz = Math.max(0, Math.floor(pz));
  const sx = Math.max(0, px - ix), sy = Math.max(0, py - iy), sz = Math.max(0, pz - iz);
  let value = 0;
  for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
    const i = ((Math.min(d - 1, iz + dz) * h + Math.min(h - 1, iy + dy)) * w + Math.min(w - 1, ix + dx)) * 4;
    value += field.data[i] / 255 * (dx ? sx : 1 - sx) * (dy ? sy : 1 - sy) * (dz ? sz : 1 - sz);
  }
  return value;
}

/** W31: cache integrated optical depth toward the sun and open sky when light changes.
 * R/G: metres of density / 128. B: local occupancy for diagnostics. The shader integrates scattered colour
 * at every view sample; this numeric cache is not a painted cloud asset. */
export function cloudLighting(field: CloudField, scale: readonly number[], localSun: readonly number[], resolution: readonly [number, number, number] = [112, 64, 64]): CloudField {
  const [w, h, d] = resolution, data = new Uint8Array(w * h * d * 4);
  const ray = (x: number, y: number, z: number, direction: readonly number[]) => {
    let tau = 0, previous = 0;
    for (const distance of [2, 5, 9, 15, 23, 34, 49, 70, 100, 140, 195, 270]) {
      const mid = (previous + distance) / 2;
      tau += densityAt(field, x + direction[0] * mid / scale[0], y + direction[1] * mid / scale[1], z + direction[2] * mid / scale[2]) * (distance - previous);
      previous = distance;
    }
    return tau;
  };
  for (let z = 0; z < d; z++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = (x + 0.5) / w, v = (y + 0.5) / h, s = (z + 0.5) / d;
    const density = densityAt(field, u, v, s);
    if (density < 0.002) continue;
    const i = ((z * h + y) * w + x) * 4;
    data[i] = Math.round(Math.min(1, ray(u, v, s, localSun) / 128) * 255);
    data[i + 1] = Math.round(Math.min(1, ray(u, v, s, [0, 1, 0]) / 128) * 255);
    data[i + 2] = Math.round(density * 255); data[i + 3] = 255;
  }
  return { data, resolution };
}
