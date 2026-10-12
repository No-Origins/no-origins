import * as THREE from "three/webgpu";

import type { HoleConfig } from "./portal-v3";

/** The dark a hole falls into: `darkness` 1 is all the way to it. */
const DARK = "#14101f";
/** Round enough at the size a hole is seen. */
const SEGMENTS = 64;
/** Rows down the wall, enough for its fall into the dark to read as one smooth shade. */
const ROWS = 48;

/**
 * FROZEN with version 3 (`portal-v3.ts`); version 4 is `build-portal.ts`.
 *
 * Makes the hole (version 3, `portal-v3.ts`) at the origin, its opening on the ground: the wall inside, from the opening down
 * to the bottom, falling smoothly into the dark like a shadow, and the bottom. Nothing is lit: the wall's shade is
 * painted on it, a colour a row. The ground's opening is cut by the ground (`ground.ts`), at `radius`.
 */
export function buildHole(config: HoleConfig): THREE.Group {
  const { radius, depth, darkness, reach } = config;
  const hole = new THREE.Group();
  const dark = new THREE.Color(DARK);

  // Where a point stands down the wall (0 the opening, 1 the bottom) sets how far into the dark it is: none above where
  // the dark reaches, then easing in to `darkness`.
  const from = 1 - reach;
  const shadowAt = (down: number) => {
    if (down <= from) return 0;
    const t = from >= 1 ? 1 : (down - from) / (1 - from);
    return darkness * t * t * (3 - 2 * t);
  };

  // The wall, seen from inside.
  const wallGeometry = new THREE.CylinderGeometry(radius, radius, depth, SEGMENTS, ROWS, true);
  const position = wallGeometry.getAttribute("position");
  const colours = new Float32Array(position.count * 3);
  const wallColour = new THREE.Color(config.wall);
  const colour = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const down = (depth / 2 - position.getY(i)) / depth;
    colour.copy(wallColour).lerp(dark, shadowAt(down)).toArray(colours, i * 3);
  }
  wallGeometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  const wall = new THREE.Mesh(wallGeometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }));
  wall.position.y = -depth / 2;
  hole.add(wall);

  // The bottom, as dark as the wall ends.
  const bottom = new THREE.Mesh(
    new THREE.CircleGeometry(radius, SEGMENTS).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: wallColour.clone().lerp(dark, shadowAt(1)) }),
  );
  bottom.position.y = -depth;
  hole.add(bottom);

  return hole;
}
