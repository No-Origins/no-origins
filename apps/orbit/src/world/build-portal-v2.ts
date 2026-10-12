import * as THREE from "three/webgpu";

import type { HoleConfig } from "./portal-v2";

/** The dark a hole falls into: `darkness` 1 is all the way to it. */
const DARK = "#14101f";
/** How tall the band of light is, in metres. */
const GLOW_HEIGHT = 0.04;
/** Round enough at the size a hole is seen. */
const SEGMENTS = 64;
/** Rows down the wall, enough for its fall into the dark to read as one smooth shade. */
const ROWS = 48;

/**
 * FROZEN with version 2 (`portal-v2.ts`); version 3 is `build-portal.ts`.
 *
 * Makes the hole (version 2, `portal-v2.ts`) at the origin, its opening on the ground: the rim on top, the wall inside from
 * the rim's top down to the bottom, falling smoothly into the dark like a shadow, and the band of light. Every surface
 * is lit by nothing: the wall's shade is painted on it, a colour a row. The ground's opening is cut by the ground
 * (`ground.ts`), at `radius`.
 */
export function buildHole(config: HoleConfig): THREE.Group {
  const { radius, depth, rimWidth, rimHeight, darkness, reach } = config;
  const hole = new THREE.Group();
  const flat = (colour: THREE.ColorRepresentation, side: THREE.Side = THREE.FrontSide) =>
    new THREE.MeshBasicMaterial({ color: colour, side });
  const dark = new THREE.Color(DARK);

  // The rim: a flat ring a little over the ground, and its outer side a little darker so the lip reads.
  if (rimWidth > 0) {
    const top = new THREE.Mesh(new THREE.RingGeometry(radius, radius + rimWidth, SEGMENTS).rotateX(-Math.PI / 2), flat(config.rim));
    top.position.y = rimHeight + 0.002;
    hole.add(top);
    if (rimHeight > 0) {
      const side = new THREE.Mesh(
        new THREE.CylinderGeometry(radius + rimWidth, radius + rimWidth, rimHeight, SEGMENTS, 1, true),
        flat(new THREE.Color(config.rim).lerp(dark, 0.12)),
      );
      side.position.y = rimHeight / 2;
      hole.add(side);
    }
  }

  // The wall, seen from inside, from the rim's top to the bottom. Where it stands down the wall (0 the rim, 1 the
  // bottom) sets how far into the dark it is: none above where the dark reaches, then easing in to `darkness`.
  const height = rimHeight + depth;
  const from = 1 - reach;
  const shadowAt = (down: number) => {
    if (down <= from) return 0;
    const t = from >= 1 ? 1 : (down - from) / (1 - from);
    return darkness * t * t * (3 - 2 * t);
  };
  const wallGeometry = new THREE.CylinderGeometry(radius, radius, height, SEGMENTS, ROWS, true);
  const position = wallGeometry.getAttribute("position");
  const colours = new Float32Array(position.count * 3);
  const wallColour = new THREE.Color(config.wall);
  const colour = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const down = (height / 2 - position.getY(i)) / height;
    colour.copy(wallColour).lerp(dark, shadowAt(down)).toArray(colours, i * 3);
  }
  wallGeometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  const wall = new THREE.Mesh(wallGeometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }));
  wall.position.y = rimHeight - height / 2;
  hole.add(wall);

  // The bottom, as dark as the wall ends.
  const bottom = new THREE.Mesh(
    new THREE.CircleGeometry(radius, SEGMENTS).rotateX(-Math.PI / 2),
    flat(wallColour.clone().lerp(dark, shadowAt(1))),
  );
  bottom.position.y = -depth;
  hole.add(bottom);

  // The band of light, a hair inside the wall so it is drawn over it.
  if (config.glow) {
    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(radius - 0.003, radius - 0.003, GLOW_HEIGHT, SEGMENTS, 1, true),
      flat(config.glowColour, THREE.BackSide),
    );
    const at = rimHeight - config.glowAt * height;
    glow.position.y = Math.min(rimHeight - GLOW_HEIGHT / 2, Math.max(-depth + GLOW_HEIGHT / 2, at));
    hole.add(glow);
  }

  return hole;
}
