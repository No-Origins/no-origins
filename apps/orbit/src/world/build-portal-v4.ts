import * as THREE from "three/webgpu";

import type { HoleConfig } from "./portal-v4";

/** The dark a hole falls into: `darkness` 1 is all the way to it. */
const DARK = "#14101f";
/**
 * Points round the circle: the same 128 as the ground's cut (`ground.ts`), so the rim, the wall and the ground meet
 * edge to edge, with no seam between them.
 */
const SEGMENTS = 128;
/** Rows down the wall, enough for its fall into the dark to read as one smooth shade. */
const ROWS = 48;

/**
 * FROZEN with version 4 (`portal-v4.ts`); the portal, version 5, is `build-portal.ts`.
 *
 * Makes the hole (version 4, `portal-v4.ts`) at the origin, its opening on the ground: the rim, a thin line round the
 * opening's edge, level with the ground; the wall inside, from the opening down to the bottom, falling smoothly into the
 * dark like a shadow; and the bottom. Nothing is lit: the wall's shade is painted on it, a colour a row. The ground is
 * cut out to the rim's outer edge (`openingOf`, `ground.ts`), so the rim fills that ring and lies on nothing.
 */
export function buildHole(config: HoleConfig): THREE.Group {
  const { radius, depth, rimWidth, darkness, reach } = config;
  const hole = new THREE.Group();
  const dark = new THREE.Color(DARK);

  // The rim, the ring between the opening and where the ground is cut.
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(radius, radius + rimWidth, SEGMENTS).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: config.rim }),
  );
  hole.add(rim);

  // Where a point stands down the wall (0 the opening, 1 the bottom) sets how far into the dark it is: none above where
  // the dark reaches, then easing in to `darkness`.
  const from = 1 - reach;
  const shadowAt = (down: number) => {
    if (down <= from) return 0;
    const t = from >= 1 ? 1 : (down - from) / (1 - from);
    return darkness * t * t * (3 - 2 * t);
  };
  // The wall's colour at a point: its own, taken toward the dark. A shadow never lightens what it falls on, so no
  // channel ends lighter than the wall's own (a black wall stays black where the dark, a violet, is lighter).
  const wallColour = new THREE.Color(config.wall);
  const fallen = (down: number, into: THREE.Color) => {
    into.copy(wallColour).lerp(dark, shadowAt(down));
    return into.setRGB(Math.min(into.r, wallColour.r), Math.min(into.g, wallColour.g), Math.min(into.b, wallColour.b));
  };

  // The wall, seen from inside.
  const wallGeometry = new THREE.CylinderGeometry(radius, radius, depth, SEGMENTS, ROWS, true);
  const position = wallGeometry.getAttribute("position");
  const colours = new Float32Array(position.count * 3);
  const colour = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    fallen((depth / 2 - position.getY(i)) / depth, colour).toArray(colours, i * 3);
  }
  wallGeometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  const wall = new THREE.Mesh(wallGeometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }));
  wall.position.y = -depth / 2;
  hole.add(wall);

  // The bottom, as dark as the wall ends.
  const bottom = new THREE.Mesh(
    new THREE.CircleGeometry(radius, SEGMENTS).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: fallen(1, new THREE.Color()) }),
  );
  bottom.position.y = -depth;
  hole.add(bottom);

  return hole;
}
