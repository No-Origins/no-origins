import * as THREE from "three/webgpu";
import { Break, cameraPosition, dot, float, Fn, fwidth, hash, If, log2, Loop, mix, mx_noise_float, positionWorld, screenCoordinate, smoothstep, texture, uniform, Var, vec2, vec3, vec4 } from "three/tsl";
import { boundaryPaint } from "./boundary-paint";
import { WORLD_SIZE } from "./orbit";
import { sunOf } from "./atmosphere";
import { cloudNoise, NOISE_SIZE } from "./cloud-noise";
import type { CloudsConfig } from "./clouds";
import type { EnvironmentConfig } from "./environment";

/** What is not a control: the steps of the climb through the layer, before four more refine the first mass met; they
 * start fine near the ceiling, where a mass's wall is met, and grow. */
const STEPS = 12;

export type BuiltClouds = {
  object: THREE.Mesh;
  set(environment: EnvironmentConfig, clouds: CloudsConfig): void;
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
 * W49: pastel pigment is illuminated by sun transmission through the procedural mass and diffuse sky fill.
 * Twelve light-ray samples measure optical depth; thinner cloud edges transmit more light. A wash of the sky's
 * colour still grows with distance into the horizon. The layer, the edge, the paint and the motion are the clouds' jig's (`clouds.ts`, W38), read as uniforms. Every camera stays under the ceiling and everything built is under it (W29), so the clouds are
 * drawn as the sky is, behind everything, at the world's resolution.
 */
export function buildClouds(environment: EnvironmentConfig, clouds: CloudsConfig, ceiling: number, airAt?: (p: typeof positionWorld) => THREE.Node<"vec4">): BuiltClouds {
  const boundary = boundaryPaint(clouds, environment.sky);
  const levels = cloudNoise();
  const noise = new THREE.DataTexture(levels[0].data, NOISE_SIZE, NOISE_SIZE, THREE.RGBAFormat, THREE.UnsignedByteType);
  noise.mipmaps = levels;
  noise.generateMipmaps = false;
  noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
  noise.magFilter = THREE.LinearFilter;
  noise.minFilter = THREE.LinearMipmapLinearFilter;
  noise.needsUpdate = true;

  let current = environment, art = clouds;
  let clockAt: number | null = null;
  const base = uniform(ceiling), thickness = uniform(clouds.thickness);
  const coverage = uniform(clouds.coverage), masses = uniform(clouds.masses), billows = uniform(clouds.billows), stretch = uniform(clouds.stretch);
  const feather = uniform(clouds.feather), wisps = uniform(clouds.wisps);
  const wash = uniform(clouds.wash), haze = uniform(clouds.haze), glowStrength = uniform(clouds.glow), grain = uniform(clouds.grain);
  /** How far the clouds have drifted, in metres, and the billows' own slower roll across the wind. */
  const offset = uniform(new THREE.Vector2()), roll = uniform(0);
  const wind = uniform(new THREE.Vector2(0, -1));
  const sun = uniform(sunOf(environment));
  const skyPaint = uniform(new THREE.Color(environment.sky)), horizonPaint = uniform(new THREE.Color(environment.horizon));
  const sunColour = uniform(new THREE.Color(environment.sunlight));
  const fillAmount = uniform(0.95 - environment.shade * 0.2);
  const cream = uniform(new THREE.Color(clouds.cream)), rose = uniform(new THREE.Color(clouds.rose)), sage = uniform(new THREE.Color(clouds.sage));

  type V2 = THREE.Node<"vec2">;
  type F = THREE.Node<"float">;
  /** The noise at a point of the ceiling (metres), its image `tile` metres wide, turned by `angle`; read from the copy
   * whose texels match `footprint`, the metres one pixel covers there, so far clouds never shimmer. */
  const sample = (p: V2, tile: number | F, angle: number, footprint: F) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    const uv = vec2(p.x.mul(c).sub(p.y.mul(s)), p.x.mul(s).add(p.y.mul(c))).div(tile);
    return texture(noise, uv).level(log2(footprint.mul(NOISE_SIZE).div(tile).max(0.0001)).max(0));
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
    const stretched = vec2(dot(q, wind).div(stretch), across(q));
    const rolled = q.add(vec2(wind.y.negate(), wind.x).mul(roll));
    const broad = sample(stretched, masses, 0, footprint).r.mul(0.68).add(sample(stretched, masses.mul(0.4), 1.1, footprint).r.mul(0.32));
    const billow = sample(rolled, billows, 2.3, footprint).g.sub(0.5);
    const fine = sample(rolled, billows.mul(0.35), 4.1, footprint).g.sub(0.5);
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
    // Coverage sets how much of the sky the masses fill; weather varies it by region, read once where the line of sight
    // meets the ceiling.
    const weather = sample(entry.sub(offset), 24000, 0.4, t0.mul(pixel)).a;
    const cover = float(0.75).sub(coverage.mul(0.5)).add(mix(0.07, -0.07, smoothstep(0.25, 0.75, weather))).toVar();
    const first = shape(entry, t0, pixel, cover);
    const firstOutline = first.outline.toVar();
    const edge = fwidth(firstOutline).max(0.0001).toVar();

    // The underside is met where the line of sight reaches the ceiling inside a mass's outline. Its edge feathers over
    // `feather` (never under a pixel and a half), broken up by fine noise like a dry brush, so no edge is a hard line;
    // anywhere else, and through that feather, the line of sight climbs to find a mass further on.
    const brush = sample(entry.sub(offset), 420, 1.9, t0.mul(pixel)).b.sub(0.5).mul(0.05);
    const onBase = visible.and(firstOutline.add(brush).greaterThan(cover)).select(float(1), float(0)).toVar();
    const baseAlpha = onBase.mul(smoothstep(0, edge.mul(1.5).max(feather), firstOutline.add(brush).sub(cover))).toVar();
    const found = float(0).toVar(), t = t0.toVar();
    If(visible.and(baseAlpha.lessThan(0.98)), () => {
      const along = t0.toVar(), before = t0.toVar();
      Loop({ start: 0, end: STEPS, type: "int" }, ({ i }) => {
        before.assign(along);
        along.assign(t0.add(span.mul(float(i).add(1).div(STEPS).pow(1.6))));
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
    // W49: trace toward the sun through the actual procedural mass, using Beer–Lambert extinction.
    // This is density shadowing, not a colour selected from the side of a circle.
    const lightDepth = float(0).toVar();
    const lightStep = thickness.div(sun.y.max(0.1)).min(6000).div(12);
    Loop(12, ({ i }) => {
      const q = point.add(sun.mul(i.toFloat().add(0.5).mul(lightStep)));
      const mass = shape(q.xz, t, pixel, cover);
      const occupied = smoothstep(cover, cover.add(feather.max(0.01)), mass.outline)
        .mul(smoothstep(base, base.add(15), q.y))
        .mul(float(1).sub(smoothstep(mass.top.sub(15), mass.top, q.y)));
      lightDepth.addAssign(occupied.mul(0.004).mul(lightStep));
    });
    const transmission = lightDepth.negate().exp();
    const g = 0.25;
    const phase = float(1 - g * g).div(float(1 + g * g).sub(dot(toward, sun).mul(2 * g)).max(0.001).pow(1.5));
    const illumination = vec3(fillAmount).add(sunColour.rgb.mul(transmission).mul(phase).mul(glowStrength).mul(0.6));
    const drifted = point.xz.sub(offset);
    const patch = smoothstep(0.4, 0.8, sample(drifted, 7000, 2.9, footprint).a);
    // Pastel albedo is distinct from illumination; sage remains a restrained pigment in thicker masses.
    const middleTone = mix(cream, rose, patch.mul(0.9));
    const body = mix(middleTone, sage, float(1).sub(transmission).mul(0.08)).mul(illumination);
    const tooth = sample(drifted, 60, 0.8, footprint).b.sub(0.5).mul(grain).add(1);
    const sky = mix(horizonPaint, skyPaint, smoothstep(-0.12, 0.32, toward.y)).toVar();
    // The sky's colour washed into every cloud, more with distance, until the far layer dissolves into the horizon.
    const hazeAt = (distance: F) => float(1).sub(distance.div(haze).negate().exp()).mul(float(0.92).sub(wash)).add(wash);
    const cloud = mix(body.mul(tooth), sky, hazeAt(t));
    // A wall met beyond the feather wears the same feather, by how far inside the outline the line of sight enters it,
    // and fades where the mass is thin and along its crown (grazing the crown is nothing, forty metres under it whole);
    // so a feathered underside edge with its own wall rising behind it feathers on, and no seam of sky shows there.
    const wallBrush = sample(point.xz.sub(offset), 420, 1.9, footprint).b.sub(0.5).mul(0.05);
    const wall = found.mul(smoothstep(0, feather, here.outline.add(wallBrush).sub(cover))).mul(smoothstep(0, 0.35, h)).mul(smoothstep(0, 40, crown.sub(point.y)));
    const alpha = mix(wall, baseAlpha.max(wall), onBase).mul(mix(0.85, 1, smoothstep(0, 0.3, h)));

    // Pale wisps feathered along the wind, just outside a mass's margin at the ceiling, in front of what lies beyond.
    const flat = entry.sub(offset);
    const streak = sample(vec2(dot(flat, wind).div(6), across(flat)), 2600, 0, t0.mul(pixel)).b;
    const margin = smoothstep(cover.sub(0.14), cover.sub(0.02), firstOutline).mul(float(1).sub(smoothstep(cover.sub(0.02), cover, firstOutline)));
    const wisp = margin.mul(smoothstep(0.45, 0.85, streak)).mul(wisps).mul(float(1).sub(onBase)).toVar();
    const wispPaint = mix(mix(cream, rose, 0.35), sky, hazeAt(t0));

    const opacity = wisp.add(alpha.mul(float(1).sub(wisp))).toVar();
    const colour = wispPaint.mul(wisp).add(cloud.mul(alpha).mul(float(1).sub(wisp))).div(opacity.max(0.0001));
    // Dither keeps the soft gradients from banding; the layer fades out at the horizon line itself.
    const dither = hash(screenCoordinate.x.add(screenCoordinate.y.mul(4096)).add(0.5)).sub(0.5).mul(1.5 / 255);
    return vec4(colour.add(dither), opacity.mul(smoothstep(0.004, 0.03, toward.y)));
  });

  // One evaluation for both colour and opacity; three's struct-free Var loses the vec4's type.
  const result = Var(paint()) as unknown as THREE.Node<"vec4"> & { xyz: THREE.Node<"vec3">; w: F };
  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, depthWrite: true, fog: false });
  const skyAt = mix(horizonPaint, skyPaint, smoothstep(-0.12, 0.32, positionWorld.sub(cameraPosition).normalize().y));
  const ceilingPaint = mix(skyAt, result.xyz, result.w);
  // W46: an irregular neutral feather replaces the uniform coloured halo around the ceiling.
  const featherStart = mx_noise_float(positionWorld.mul(0.014)).mul(35).add(WORLD_SIZE.diameter / 2 - 140);
  const rim = smoothstep(featherStart, WORLD_SIZE.diameter / 2, positionWorld.xz.length());
  const cap = mix(ceilingPaint, boundary.at(positionWorld), rim.max(smoothstep(ceiling - 100, ceiling - 20, cameraPosition.y)));
  const air = airAt?.(positionWorld);
  material.colorNode = air ? mix(cap, air.rgb, air.a) : cap;
  material.addEventListener("dispose", () => noise.dispose());
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(WORLD_SIZE.diameter / 2, 192), material);
  mesh.geometry.rotateX(-Math.PI / 2);
  mesh.position.y = ceiling;
  mesh.name = "cloud-ceiling";
  mesh.frustumCulled = false;
  mesh.renderOrder = -2;

  const set = (next: EnvironmentConfig, nextArt: CloudsConfig) => {
    current = next; art = nextArt; boundary.set(nextArt, next.sky);
    sun.value.copy(sunOf(next));
    sunColour.value.set("#ffffff").lerp(new THREE.Color(next.sunlight), next.warmth * 0.35);
    fillAmount.value = 0.95 - next.shade * 0.2;
    skyPaint.value.set(next.sky);
    horizonPaint.value.set(next.horizon);
    const angle = THREE.MathUtils.degToRad(next.skyWind);
    wind.value.set(Math.sin(angle), -Math.cos(angle));
    thickness.value = nextArt.thickness; coverage.value = nextArt.coverage; masses.value = nextArt.masses;
    billows.value = nextArt.billows; stretch.value = nextArt.stretch;
    feather.value = nextArt.feather; wisps.value = nextArt.wisps;
    cream.value.set(nextArt.cream); rose.value.set(nextArt.rose); sage.value.set(nextArt.sage);
    wash.value = nextArt.wash; haze.value = nextArt.haze; glowStrength.value = nextArt.glow; grain.value = nextArt.grain;
  };
  set(environment, clouds);
  return {
    object: mesh,
    set,
    flow(seconds) {
      boundary.clock.value = seconds;
      // The drift follows the wind as it is now, so turning the wind turns the drift and never jumps the clouds.
      if (clockAt === null) offset.value.copy(wind.value).multiplyScalar(seconds * art.drift);
      else offset.value.addScaledVector(wind.value, (seconds - clockAt) * art.drift);
      clockAt = seconds;
      roll.value = seconds * art.roll;
    },
    get flowing() { return current.motion && current.cloudFlow > 0 && current.cloudSpeed > 0; },
  };
}
