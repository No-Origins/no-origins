import * as THREE from "three/webgpu";

// One footprint for the curved slab, terrain clearing, planting and Clay's collision.
export const SCREEN_HEIGHT = 16;
export const SCREEN_WIDTH = 27;
export const SCREEN_THICKNESS = 0.18;
export const SCREEN_BASE = 0.12;
export const SCREEN_BACK = -8.5;
export const SCREEN_ARC = Math.PI / 3;
export const SCREEN_RADIUS = SCREEN_WIDTH / SCREEN_ARC;
export const SCREEN_CENTER_Z = SCREEN_BACK + SCREEN_RADIUS;

export function screenDistance(x: number, z: number) {
  const angle = THREE.MathUtils.clamp(Math.atan2(x, SCREEN_CENTER_Z - z), -SCREEN_ARC / 2, SCREEN_ARC / 2);
  return Math.hypot(x - SCREEN_RADIUS * Math.sin(angle), z - SCREEN_CENTER_Z + SCREEN_RADIUS * Math.cos(angle));
}
