import * as THREE from "three";

import { num, str } from "../../engine/controls.ts";
import type { EnvironmentEntry } from "../../engine/types.ts";

/**
 * A made-up environment for the sample (Cinema-Engine.md E5): a plain round floor under a plain sky. It is what CI and
 * a fresh clone draw in place of his private library, and nothing of his.
 */
export const plain: EnvironmentEntry = {
  kind: "environment",
  id: "plain",
  label: "Plain",
  version: 1,
  description: "The sample's world: a plain round floor under a plain sky.",
  controls: [
    { kind: "number", id: "size", label: "Size", min: 2, max: 200, step: 1, unit: "m", default: 16 },
    { kind: "colour", id: "colour", label: "Floor", default: "#d6d3d1" },
    { kind: "colour", id: "sky", label: "Sky", default: "#e7e5e4" },
    { kind: "number", id: "haze", label: "Haze", min: 0, max: 0.1, step: 0.001, default: 0 },
  ],
  build(values) {
    const size = num(values, "size");
    const geometry = new THREE.CircleGeometry(size, 96);
    const material = new THREE.MeshStandardMaterial({ color: str(values, "colour"), roughness: 0.95 });
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    return {
      object: floor,
      world: { focus: [0, 1, 0], radius: size, heightAt: () => 0, sky: str(values, "sky"), haze: num(values, "haze") },
      dispose: () => {
        geometry.dispose();
        material.dispose();
      },
    };
  },
};
