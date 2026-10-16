import * as THREE from "three/webgpu";

/**
 * A ring on the floor (World.md W73): where the next element would be placed and how wide it is, under the pointer on
 * the World page, and round the foot of the element picked. Flat, a little over the floor so the gas does not swallow
 * it, lit by nothing.
 */
export function buildRing(x: number, z: number, radius: number, colour: string, y = 0.2): THREE.Mesh {
  const width = Math.max(0.4, radius * 0.06);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(Math.max(0.1, radius - width), radius, 96),
    new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, y, z);
  ring.name = "ring";
  return ring;
}

/** The ghost's paint, where something would be placed: a lilac shade; the picked one's, violet. */
export const GHOST_RING = "#8b82b3";
export const PICKED_RING = "#6d6290";
