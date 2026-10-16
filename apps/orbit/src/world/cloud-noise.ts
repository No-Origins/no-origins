/**
 * The clouds' one noise image (World.md W33): 256 × 256, four channels, each tiling seamlessly, made once in the page
 * from a fixed seed, with its smaller copies (mip levels) averaged here so both backends read the same ones. Nothing
 * here is three.js. `build-clouds.ts` reads it at several rotated scales, so the tile never shows as a repeated cloud.
 *
 * - red: smooth gradient noise, 8 cells and 16 across: the masses.
 * - green: billows, a soft round bump on a random point in each cell, 8 and 16 across: puffs, with no creases.
 * - blue: fine gradient noise, 32 and 64 across: broken edges, wisps and tooth.
 * - alpha: broad gradient noise, 4 across: weather (where the sky is open) and the rose patches.
 */
export const NOISE_SIZE = 256;

export type NoiseLevel = { data: Uint8Array; width: number; height: number };

let made: NoiseLevel[] | null = null;

/** The image and its smaller copies, made the first time they are asked for and kept for the page. */
export function cloudNoise(): NoiseLevel[] {
  made ??= noiseOf(7);
  return made;
}

function noiseOf(seed: number): NoiseLevel[] {
  const random = mulberry(seed);
  const n = NOISE_SIZE;
  const channels = [
    layered([[gradient(8, random), 0.67], [gradient(16, random), 0.33]]),
    layered([[billows(8, random), 0.65], [billows(16, random), 0.35]]),
    layered([[gradient(32, random), 0.6], [gradient(64, random), 0.4]]),
    layered([[gradient(4, random), 1]]),
  ];
  const fields = channels.map((sample) => {
    const field = new Float32Array(n * n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) field[y * n + x] = sample(x / n, y / n);
    return stretched(field);
  });
  const top = new Uint8Array(n * n * 4);
  for (let i = 0; i < n * n; i++) for (let c = 0; c < 4; c++) top[i * 4 + c] = Math.round(fields[c][i] * 255);
  const levels: NoiseLevel[] = [{ data: top, width: n, height: n }];
  // Each smaller copy averages four of the one above; the image tiles, so so does every copy.
  for (let size = n / 2; size >= 1; size /= 2) {
    const above = levels[levels.length - 1].data, wide = size * 2;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) for (let c = 0; c < 4; c++) {
      const at = (dx: number, dy: number) => above[((y * 2 + dy) * wide + x * 2 + dx) * 4 + c];
      data[(y * size + x) * 4 + c] = Math.round((at(0, 0) + at(1, 0) + at(0, 1) + at(1, 1)) / 4);
    }
    levels.push({ data, width: size, height: size });
  }
  return levels;
}

type Sample = (u: number, v: number) => number;

function layered(octaves: [Sample, number][]): Sample {
  return (u, v) => octaves.reduce((sum, [sample, weight]) => sum + sample(u, v) * weight, 0);
}

/** A field spread over 0–1, its lowest and highest a little inside, so every channel uses its whole range. */
function stretched(field: Float32Array): Float32Array {
  let least = Infinity, most = -Infinity;
  for (const value of field) { least = Math.min(least, value); most = Math.max(most, value); }
  // A histogram finds the 0.2% at either end without sorting.
  const bins = new Uint32Array(1024), width = (most - least) / 1023 || 1;
  for (const value of field) bins[Math.round((value - least) / width)]++;
  const at = (share: number) => {
    let count = 0;
    for (let i = 0; i < bins.length; i++) if ((count += bins[i]) >= share * field.length) return least + i * width;
    return most;
  };
  const low = at(0.002), high = at(0.998);
  return field.map((value) => Math.min(1, Math.max(0, (value - low) / (high - low))));
}

/** Gradient noise with `cells` across, wrapping at the image's edge. */
function gradient(cells: number, random: () => number): Sample {
  const angles = Array.from({ length: cells * cells }, () => random() * Math.PI * 2);
  const xs = Float32Array.from(angles, Math.cos), ys = Float32Array.from(angles, Math.sin);
  const dot = (cx: number, cy: number, dx: number, dy: number) => {
    const i = (((cy % cells) + cells) % cells) * cells + (((cx % cells) + cells) % cells);
    return xs[i] * dx + ys[i] * dy;
  };
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  return (u, v) => {
    const x = u * cells, y = v * cells, x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const a = dot(x0, y0, fx, fy), b = dot(x0 + 1, y0, fx - 1, fy);
    const c = dot(x0, y0 + 1, fx, fy - 1), d = dot(x0 + 1, y0 + 1, fx - 1, fy - 1);
    const sx = fade(fx), sy = fade(fy);
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
  };
}

/** Round billows: a soft bump round one random point a cell, summed over the nearest, `cells` across, wrapping. Unlike
 * cellular noise it has no creases between cells, so a billow lit by its slope stays round. */
function billows(cells: number, random: () => number): Sample {
  const xs = new Float32Array(cells * cells), ys = new Float32Array(cells * cells);
  for (let i = 0; i < xs.length; i++) { xs[i] = random(); ys[i] = random(); }
  return (u, v) => {
    const x = u * cells, y = v * cells, cx = Math.floor(x), cy = Math.floor(y);
    let sum = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const px = cx + i, py = cy + j, k = (((py % cells) + cells) % cells) * cells + (((px % cells) + cells) % cells);
      const dx = px + xs[k] - x, dy = py + ys[k] - y;
      sum += Math.exp(-(dx * dx + dy * dy) / 0.29);
    }
    return sum;
  };
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
