import * as THREE from "three/webgpu";
import { Break, cameraPosition, dot, float, Fn, fwidth, hash, If, log2, Loop, mix, positionWorld, screenCoordinate, smoothstep, texture, uniform, Var, vec2, vec3, vec4 } from "three/tsl";
import { sunOf } from "./atmosphere";
import { cloudNoise, NOISE_SIZE } from "./cloud-noise";
import type { EnvironmentConfig } from "./environment-v20";

/**
 * FROZEN: the ceiling as he saw it in Environment version 22, softer and pastel (World.md W36), before its art became
 * his controls (W38, `clouds.ts`). Nothing draws it.
 */
export const CLOUD_ART = {
  /** How far the masses rise above the ceiling at their cores, in metres. */
  thickness: 240,
  /** Lit, middle and shaded paint: pale, all high in value, so shade is a change of colour, never a darkening. */
  cream: "#fff6e8",
  rose: "#f7cdd8",
  sage: "#cdd4c3",
  /** Metres the clouds drift along the Sky's Wind for each second of their clock (`cloudSpeed`, 0.45×): 4.5 m a second. */
  drift: 10,
  /** Metres over which far clouds mix into the sky's colour, so the layer dissolves into the horizon's haze. */
  haze: 9000,
  /** The share of the sky's colour washed into every cloud, however near: what keeps the paint pastel. */
  wash: 0.1,
  /** How wide a mass's edge feathers, in the outline's own units (tens of metres at a billow, a hundred or two along a
   * broad margin), broken up by fine noise like a dry brush. */
  feather: 0.08,
  /** Steps of the climb through the layer, before four more refine the first mass met; they start fine near the
   * ceiling, where a mass's wall is met, and grow. */
  steps: 12,
} as const;

export type BuiltClouds = {
  object: THREE.Mesh;
  set(environment: EnvironmentConfig): void;
  /** The clouds' own clock, in seconds: they drift with the wind and their billows roll. */
  flow(seconds: number): void;
  readonly flowing: boolean;
};

/**
 * The clouds are the world's ceiling (World.md W33, his: "place the cloud layer at the ceiling"), drawn as option B, a
 * ceiling and not a volume. Each pixel of the sky finds where its line of sight meets the layer, whose underside is at
 * `ceiling` (the world's height) and which reaches past the world's sides to the horizon, and reads the cloud there from
 * one small noise image (`cloud-noise.ts`) at several rotated scales: no grid of gas, so an edge is drawn as drawn, at any
 * resolution, and feathers only as far as the art says (W36). The masses rise from the ceiling, tallest at their cores; where a line of sight misses one at the
 * ceiling it climbs through the layer and meets the side of a mass further on, so near masses overlap far ones.
 *
 * It is painted, not lit: pale cream where lit, pale rose in the middle tones, a pale sage in shade, every blend wide;
 * an underside's thin margins glow and its thick cores shade, each billow a soft puff; a side is lit by the sun and
 * brightens up the mass. A wash of the sky's colour lies over every cloud, more with distance, until the far layer
 * dissolves into the horizon. Every camera stays under the ceiling and everything built is under it (W29), so the clouds are
 * drawn as the sky is, behind everything, at the world's resolution.
 */
export function buildClouds(environment: EnvironmentConfig, ceiling: number): BuiltClouds {
  const levels = cloudNoise();
  const noise = new THREE.DataTexture(levels[0].data, NOISE_SIZE, NOISE_SIZE, THREE.RGBAFormat, THREE.UnsignedByteType);
  noise.mipmaps = levels;
  noise.generateMipmaps = false;
  noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
  noise.magFilter = THREE.LinearFilter;
  noise.minFilter = THREE.LinearMipmapLinearFilter;
  noise.needsUpdate = true;

  let current = environment;
  let clockAt: number | null = null;
  const base = uniform(ceiling), thickness = uniform(CLOUD_ART.thickness);
  /** How far the clouds have drifted, in metres, and the billows' own slower roll across the wind. */
  const offset = uniform(new THREE.Vector2()), roll = uniform(0);
  const wind = uniform(new THREE.Vector2(0, -1));
  const sun = uniform(sunOf(environment));
  const skyPaint = uniform(new THREE.Color(environment.sky)), horizonPaint = uniform(new THREE.Color(environment.horizon));
  const cream = uniform(new THREE.Color(CLOUD_ART.cream)), rose = uniform(new THREE.Color(CLOUD_ART.rose)), sage = uniform(new THREE.Color(CLOUD_ART.sage));

  type V2 = THREE.Node<"vec2">;
  type F = THREE.Node<"float">;
  /** The noise at a point of the ceiling (metres), its image `tile` metres wide, turned by `angle`; read from the copy
   * whose texels match `footprint`, the metres one pixel covers there, so far clouds never shimmer. */
  const sample = (p: V2, tile: number, angle: number, footprint: F) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    const uv = vec2(p.x.mul(c).sub(p.y.mul(s)), p.x.mul(s).add(p.y.mul(c))).div(tile);
    return texture(noise, uv).level(log2(footprint.mul(NOISE_SIZE / tile).max(0.0001)).max(0));
  };
  /** Across the wind: a point's distance to the side of the line the wind blows along. */
  const across = (p: V2) => p.x.mul(wind.y).sub(p.y.mul(wind.x));
  /**
   * The cloud at a point of the ceiling. `h` is how thick it is there, from the broad masses alone, so a mass rises
   * smoothly and never in spikes; `outline` is where it ends at the ceiling (against `cover`), its margin scalloped by
   * the billows and broken by finer noise; `top` is how high it rises, its crown lumpy with the billows; `fine` is the
   * smaller billows nested in the big ones, for the paint alone. `distance` is along the line of sight; `pixel` the
   * radians a pixel spans, so the noise is read at the pixel's footprint.
   */
  const shape = (p: V2, distance: F, pixel: F, cover: F) => {
    const footprint = distance.mul(pixel);
    const q = p.sub(offset);
    const stretched = vec2(dot(q, wind).div(1.6), across(q));
    const rolled = q.add(vec2(wind.y.negate(), wind.x).mul(roll));
    const broad = sample(stretched, 8000, 0, footprint).r.mul(0.68).add(sample(stretched, 3200, 1.1, footprint).r.mul(0.32));
    const billow = sample(rolled, 2600, 2.3, footprint).g.sub(0.5);
    const fine = sample(rolled, 900, 4.1, footprint).g.sub(0.5);
    const h = smoothstep(cover.sub(0.05), cover.add(0.22), broad);
    const margin = float(1).sub(h);
    const outline = broad.add(billow.mul(0.4).mul(margin.mul(0.7).add(0.3))).add(fine.mul(0.08).mul(margin));
    // Far masses flatten into thin sheets, as a distant layer is seen: streaks toward the horizon, never a fence of sides.
    const flatten = float(1).sub(smoothstep(1500, 7000, distance).mul(0.95));
    // A mass ends in a wall at least a quarter its height, never a sliver a line of sight could pass through unseen.
    const top = base.add(thickness.mul(h.pow(0.7).mul(billow.mul(0.5).add(1)).max(0.25)).mul(flatten));
    return { outline, h, billow, fine, top };
  };

  const paint = Fn(() => {
    const toward = positionWorld.sub(cameraPosition).normalize().toVar();
    // Radians a pixel spans, widened toward the horizon, where the ceiling is seen edge-on, so its noise is read softer there.
    const pixel = fwidth(toward).length().max(0.00001).div(toward.y.max(0.02).sqrt()).toVar();
    const eye = cameraPosition;
    const visible = toward.y.greaterThan(0.004);
    const rising = toward.y.max(0.004);
    const t0 = base.sub(eye.y).max(0).div(rising).toVar();
    const span = thickness.div(rising).min(9000).toVar();
    const entry = eye.xz.add(toward.xz.mul(t0)).toVar();
    // Weather opens or fills the sky by region; read once where the line of sight meets the ceiling.
    const weather = sample(entry.sub(offset), 24000, 0.4, t0.mul(pixel)).a;
    const cover = mix(0.56, 0.42, smoothstep(0.25, 0.75, weather)).toVar();
    const first = shape(entry, t0, pixel, cover);
    const firstOutline = first.outline.toVar();
    const edge = fwidth(firstOutline).max(0.0001).toVar();

    // The underside is met where the line of sight reaches the ceiling inside a mass's outline. Its edge feathers over
    // `feather` (never under a pixel and a half), broken up by fine noise like a dry brush, so no edge is a hard line;
    // anywhere else, and through that feather, the line of sight climbs to find a mass further on.
    const brush = sample(entry.sub(offset), 420, 1.9, t0.mul(pixel)).b.sub(0.5).mul(0.05);
    const onBase = visible.and(firstOutline.add(brush).greaterThan(cover)).select(float(1), float(0)).toVar();
    const baseAlpha = onBase.mul(smoothstep(0, edge.mul(1.5).max(CLOUD_ART.feather), firstOutline.add(brush).sub(cover))).toVar();
    const found = float(0).toVar(), t = t0.toVar();
    If(visible.and(baseAlpha.lessThan(0.98)), () => {
      const along = t0.toVar(), before = t0.toVar();
      Loop({ start: 0, end: CLOUD_ART.steps, type: "int" }, ({ i }) => {
        before.assign(along);
        along.assign(t0.add(span.mul(float(i).add(1).div(CLOUD_ART.steps).pow(1.6))));
        const here = shape(eye.xz.add(toward.xz.mul(along)), along, pixel, cover);
        If(here.outline.greaterThan(cover).and(eye.y.add(toward.y.mul(along)).lessThan(here.top)), () => {
          found.assign(1);
          Break();
        });
      });
      If(found.greaterThan(0.5).and(onBase.lessThan(0.5)), () => {
        const low = before.toVar(), high = along.toVar();
        Loop({ start: 0, end: 4, type: "int" }, () => {
          const middle = low.add(high).mul(0.5).toVar();
          const here = shape(eye.xz.add(toward.xz.mul(middle)), middle, pixel, cover);
          If(here.outline.greaterThan(cover).and(eye.y.add(toward.y.mul(middle)).lessThan(here.top)), () => {
            high.assign(middle);
          }).Else(() => {
            low.assign(middle);
          });
        });
        t.assign(high);
      });
    });

    // The paint where the line of sight met a mass.
    const point = eye.add(toward.mul(t)).toVar();
    const footprint = t.mul(pixel).toVar();
    const here = shape(point.xz, t, pixel, cover);
    const h = here.h.toVar(), crown = here.top.toVar();
    const reach = footprint.mul(2).max(40);
    const towardX = shape(point.xz.add(vec2(reach, 0)), t, pixel, cover).top, towardZ = shape(point.xz.add(vec2(0, reach)), t, pixel, cover).top;
    const normal = vec3(crown.sub(towardX).div(reach), 1, crown.sub(towardZ).div(reach)).normalize();
    const up = point.y.sub(base).div(crown.sub(base).max(1)).clamp(0, 1);
    // Each billow is a soft puff, a little lighter on the side toward the sun and in its belly, a little more shaded in
    // the recess between puffs; the finer billows nested in it the same, fainter. Nothing here is a hard step.
    const sunward = vec2(sun.x, sun.z).div(vec2(sun.x, sun.z).length().max(0.001));
    const lobe = here.billow.sub(shape(point.xz.add(sunward.mul(reach)), t, pixel, cover).billow).mul(float(90).div(reach)).clamp(-0.1, 0.1);
    const puffs = here.billow.mul(0.18).add(here.fine.mul(0.1)).add(lobe);
    const side = dot(normal, sun).mul(0.5).add(0.5).mul(0.35).add(up.mul(0.25)).add(0.4).add(puffs.mul(0.6));
    const under = mix(0.95, 0.55, smoothstep(0.3, 1, h)).add(puffs);
    const glow = dot(toward, sun).max(0).pow(5).mul(float(1).sub(h)).mul(0.3);
    // A side's foot is as bright as the margin it rises from, darkening up the side: never a darker rim round a mass.
    const light = mix(mix(0.95, side, smoothstep(0, 0.5, up)), under, onBase).add(glow).clamp(0, 1).toVar();
    const drifted = point.xz.sub(offset);
    const patch = smoothstep(0.4, 0.8, sample(drifted, 7000, 2.9, footprint).a);
    // Sage is the shade alone; the middle tones run cream to rose by patch, so they never muddy; every blend is wide.
    const middleTone = mix(cream, rose, patch.mul(0.9));
    const body = mix(mix(sage, middleTone, smoothstep(0.05, 0.6, light)), cream, smoothstep(0.55, 0.95, light));
    const tooth = sample(drifted, 60, 0.8, footprint).b.sub(0.5).mul(0.035).add(1);
    const sky = mix(horizonPaint, skyPaint, smoothstep(-0.12, 0.32, toward.y)).toVar();
    // The sky's colour washed into every cloud, more with distance, until the far layer dissolves into the horizon.
    const hazeAt = (distance: F) => float(1).sub(distance.div(-CLOUD_ART.haze).exp()).mul(0.92 - CLOUD_ART.wash).add(CLOUD_ART.wash);
    const cloud = mix(body.mul(tooth), sky, hazeAt(t));
    // A wall met beyond the feather wears the same feather, by how far inside the outline the line of sight enters it,
    // and fades where the mass is thin and along its crown (grazing the crown is nothing, forty metres under it whole);
    // so a feathered underside edge with its own wall rising behind it feathers on, and no seam of sky shows there.
    const wallBrush = sample(point.xz.sub(offset), 420, 1.9, footprint).b.sub(0.5).mul(0.05);
    const wall = found.mul(smoothstep(0, CLOUD_ART.feather, here.outline.add(wallBrush).sub(cover))).mul(smoothstep(0, 0.35, h)).mul(smoothstep(0, 40, crown.sub(point.y)));
    const alpha = mix(wall, baseAlpha.max(wall), onBase).mul(mix(0.85, 1, smoothstep(0, 0.3, h)));

    // Pale wisps feathered along the wind, just outside a mass's margin at the ceiling, in front of what lies beyond.
    const flat = entry.sub(offset);
    const streak = sample(vec2(dot(flat, wind).div(6), across(flat)), 2600, 0, t0.mul(pixel)).b;
    const margin = smoothstep(cover.sub(0.14), cover.sub(0.02), firstOutline).mul(float(1).sub(smoothstep(cover.sub(0.02), cover, firstOutline)));
    const wisp = margin.mul(smoothstep(0.45, 0.85, streak)).mul(0.45).mul(float(1).sub(onBase)).toVar();
    const wispPaint = mix(mix(cream, rose, 0.35), sky, hazeAt(t0));

    const opacity = wisp.add(alpha.mul(float(1).sub(wisp))).toVar();
    const colour = wispPaint.mul(wisp).add(cloud.mul(alpha).mul(float(1).sub(wisp))).div(opacity.max(0.0001));
    // Dither keeps the soft gradients from banding; the layer fades out at the horizon line itself.
    const dither = hash(screenCoordinate.x.add(screenCoordinate.y.mul(4096)).add(0.5)).sub(0.5).mul(1.5 / 255);
    return vec4(colour.add(dither), opacity.mul(smoothstep(0.004, 0.03, toward.y)));
  });

  // One evaluation for both colour and opacity; three's struct-free Var loses the vec4's type.
  const result = Var(paint()) as unknown as THREE.Node<"vec4"> & { xyz: THREE.Node<"vec3">; w: F };
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, side: THREE.BackSide, depthWrite: false, fog: false });
  material.colorNode = result.xyz;
  material.opacityNode = result.w;
  material.addEventListener("dispose", () => noise.dispose());
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(9000, 32, 16), material);
  mesh.name = "cloud-ceiling";
  mesh.frustumCulled = false;
  mesh.renderOrder = -2;

  const set = (next: EnvironmentConfig) => {
    current = next;
    sun.value.copy(sunOf(next));
    skyPaint.value.set(next.sky);
    horizonPaint.value.set(next.horizon);
    const angle = THREE.MathUtils.degToRad(next.skyWind);
    wind.value.set(Math.sin(angle), -Math.cos(angle));
  };
  set(environment);
  return {
    object: mesh,
    set,
    flow(seconds) {
      // The drift follows the wind as it is now, so turning the wind turns the drift and never jumps the clouds.
      if (clockAt === null) offset.value.copy(wind.value).multiplyScalar(seconds * CLOUD_ART.drift);
      else offset.value.addScaledVector(wind.value, (seconds - clockAt) * CLOUD_ART.drift);
      clockAt = seconds;
      roll.value = seconds * 0.6;
    },
    get flowing() { return current.motion === "flowing" && current.cloudFlow > 0 && current.cloudSpeed > 0; },
  };
}
