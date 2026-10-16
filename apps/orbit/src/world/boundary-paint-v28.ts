import * as THREE from "three/webgpu";
import { color, mix, mx_noise_float, smoothstep, uniform } from "three/tsl";
import type { CloudsConfig } from "./clouds";
import { WORLD_SIZE } from "./orbit";

/** World.md W43: the same paint at the ceiling's rim and on the wall, blended continuously by height. */
export function boundaryPaint(clouds: CloudsConfig, skyColour = "#bbcedc") {
  const cream = uniform(new THREE.Color(clouds.cream));
  const rose = uniform(new THREE.Color(clouds.rose));
  const sage = uniform(new THREE.Color(clouds.sage));
  const clock = uniform(0);
  const sky = uniform(new THREE.Color(skyColour));
  const tint = uniform(clouds.wallTint);
  const at = (p: THREE.Node<"vec3">) => {
    const grain = mx_noise_float(p.mul(0.7)).mul(0.006);
    const billow = mx_noise_float(p.mul(0.012).add(clock.mul(0.015))).mul(0.5).add(0.5);
    const upper = mix(mix(sage, cream, 0.75), mix(cream, rose, 0.22), smoothstep(0.15, 0.8, billow));
    // Hermite interpolation has zero slope at both ends, so the lower and upper layers meet without a seam.
    const altitude = smoothstep(0, WORLD_SIZE.height, p.y);
    // W46: cloud pigments stay overhead. A faint sky wash gives the wall neutral atmospheric depth.
    const neutral = mix(color("#f5f7fa"), sky, altitude.mul(0.1));
    return mix(neutral, upper, altitude.mul(tint)).add(grain);
  };
  const set = (next: CloudsConfig, skyColour = "#bbcedc") => { sky.value.set(skyColour); tint.value = next.wallTint; cream.value.set(next.cream); rose.value.set(next.rose); sage.value.set(next.sage); };
  return { at, set, clock };
}
