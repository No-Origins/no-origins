import * as THREE from "three/webgpu";
import { float, vec3, color, mix, mx_noise_float, smoothstep, uniform } from "three/tsl";
import { sunOf } from "./atmosphere";
import type { EnvironmentConfig } from "./environment-v30";
import type { CloudsConfig } from "./clouds";
import { WORLD_SIZE } from "./orbit";

/** World.md W43: the same paint at the ceiling's rim and on the wall, blended continuously by height. */
export function boundaryPaint(clouds: CloudsConfig, skyColour = "#bbcedc", environment?: EnvironmentConfig) {
  const cream = uniform(new THREE.Color(clouds.cream));
  const rose = uniform(new THREE.Color(clouds.rose));
  const sage = uniform(new THREE.Color(clouds.sage));
  const clock = uniform(0);
  const sky = uniform(new THREE.Color(skyColour));
  const tint = uniform(clouds.wallTint);
  const sun = uniform(environment ? sunOf(environment) : new THREE.Vector3(-1, 0.5, 0).normalize());
  const sunlight = uniform(new THREE.Color(environment?.sunlight ?? "#ffdfbd"));
  const shadow = uniform(new THREE.Color(environment?.shadow ?? "#8b82b3"));
  const shade = uniform(environment?.shade ?? 0.45), warmth = uniform(environment?.warmth ?? 0.45);
  const at = (p: THREE.Node<"vec3">) => {
    const grain = mx_noise_float(p.mul(0.7)).mul(0.006);
    const billow = mx_noise_float(p.mul(0.012).add(clock.mul(0.015))).mul(0.5).add(0.5);
    const upper = mix(mix(sage, cream, 0.75), mix(cream, rose, 0.22), smoothstep(0.15, 0.8, billow));
    // Hermite interpolation has zero slope at both ends, so the lower and upper layers meet without a seam.
    const altitude = smoothstep(0, WORLD_SIZE.height, p.y);
    // W46: cloud pigments stay overhead. A faint sky wash gives the wall neutral atmospheric depth.
    const neutral = mix(color("#f5f7fa"), sky, altitude.mul(0.1));
    const pigment = mix(neutral, upper, altitude.mul(tint));
    return pigment.add(grain);
  };
  // W48: directional paint belongs to the vertical wall, never the ceiling's shared neutral rim.
  const wallAt = (p: THREE.Node<"vec3">) => {
    const pigment = at(p);
    const radial = vec3(p.x, 0, p.z).div(p.xz.length().max(0.001));
    const facing = radial.dot(sun);
    const lowSun = sun.xz.length();
    const wall = smoothstep(WORLD_SIZE.diameter / 2 - 2, WORLD_SIZE.diameter / 2, p.xz.length())
      .mul(smoothstep(0, 60, p.y))
      .mul(float(1).sub(smoothstep(WORLD_SIZE.height - 160, WORLD_SIZE.height, p.y)));
    const cool = mix(pigment, shadow, smoothstep(0, 0.7, facing.negate()).mul(lowSun).mul(shade).mul(0.3).mul(wall));
    return mix(cool, sunlight, smoothstep(0, 0.7, facing).mul(lowSun).mul(warmth).mul(0.08).mul(wall));
  };
  const set = (next: CloudsConfig, skyColour = "#bbcedc", environment?: EnvironmentConfig) => {
    if (environment) { sun.value.copy(sunOf(environment)); sunlight.value.set(environment.sunlight); shadow.value.set(environment.shadow); shade.value = environment.shade; warmth.value = environment.warmth; }
    sky.value.set(skyColour); tint.value = next.wallTint; cream.value.set(next.cream); rose.value.set(next.rose); sage.value.set(next.sage); };
  return { at, wallAt, set, clock };
}
