/** W53: seeded continuous mineral noise, sampled in surface space rather than repeating angular stripes. */
const blend = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export function mountainNoise(x: number, y: number, z: number, seed: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const u = blend(x - ix), v = blend(y - iy), w = blend(z - iz);
  const hash = (dx: number, dy: number, dz: number) => {
    let n = Math.imul(ix + dx, 374761393) ^ Math.imul(iy + dy, 668265263) ^ Math.imul(iz + dz, 2147483647) ^ Math.imul(seed, 1274126177);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295 * 2 - 1;
  };
  return lerp(
    lerp(lerp(hash(0, 0, 0), hash(1, 0, 0), u), lerp(hash(0, 1, 0), hash(1, 1, 0), u), v),
    lerp(lerp(hash(0, 0, 1), hash(1, 0, 1), u), lerp(hash(0, 1, 1), hash(1, 1, 1), u), v), w,
  );
}
