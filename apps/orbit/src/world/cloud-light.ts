import * as THREE from "three/webgpu";
import { exp, float, Fn, Loop, smoothstep, uniform } from "three/tsl";
import { sunOf } from "./atmosphere";
import { WORLD_SIZE } from "./orbit";
import type { AtmosphereSettings } from "./environment";

/** W49: single scattering through the cylindrical cloud medium. Distances are metres;
 * extinction is inverse metres. Sun rays exit the outer cloud bank, not an opaque wall.
 * Multiple scattering is approximated by diffuse sky fill; this is not a path tracer.
 */
export function cloudLight(environment: AtmosphereSettings) {
  const sun = uniform(sunOf(environment));
  const sunlight = uniform(new THREE.Color());
  const ambient = uniform(new THREE.Color());
  const extinction = (p: THREE.Node<"vec3">) => smoothstep(WORLD_SIZE.diameter / 2 - 140, WORLD_SIZE.diameter / 2, p.xz.length()).pow(2).mul(0.055);
  const transmission = (p: THREE.Node<"vec3">) => Fn(() => {
    // Positive intersection with the outer cylinder, including the horizon and overhead limits.
    const a = sun.xz.dot(sun.xz).max(0.00001);
    const b = p.xz.dot(sun.xz);
    const c = p.xz.dot(p.xz).sub((WORLD_SIZE.diameter / 2 + 5) ** 2);
    const side = b.negate().add(b.mul(b).sub(a.mul(c)).max(0).sqrt()).div(a);
    const top = float(WORLD_SIZE.height + 40).sub(p.y).div(sun.y.max(0.00001));
    const distance = side.min(top).max(0);
    const step = distance.div(12);
    const depth = float(0).toVar();
    Loop(12, ({ i }) => {
      const q = p.add(sun.mul(i.toFloat().add(0.5).mul(step)));
      depth.addAssign(extinction(q).mul(step));
    });
    return exp(depth.negate());
  })() as THREE.Node<"float">;
  const at = (p: THREE.Node<"vec3">, towardEye: THREE.Node<"vec3">) => {
    // Normalized Henyey–Greenstein phase, relative to isotropic scattering. Mild forward scattering
    // keeps the sunward clouds brighter without painting a glow onto a wall normal.
    const g = 0.25;
    const cosine = sun.dot(towardEye.negate());
    const phase = float(1 - g * g).div(float(1 + g * g).sub(cosine.mul(2 * g)).max(0.001).pow(1.5));
    return ambient.rgb.add(sunlight.rgb.mul(transmission(p)).mul(phase));
  };
  const set = (next: AtmosphereSettings) => {
    sun.value.copy(sunOf(next));
    sunlight.value.set("#ffffff").lerp(new THREE.Color(next.sunlight), next.warmth * 0.35).multiplyScalar(0.6);
    ambient.value.set("#ffffff").lerp(new THREE.Color(next.shadow), next.shade * 0.18).multiplyScalar(0.95 - next.shade * 0.2);
  };
  set(environment);
  return { at, set, extinction };
}
