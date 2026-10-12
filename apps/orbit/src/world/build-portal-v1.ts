import * as THREE from "three/webgpu";

import type { HoleConfig } from "./portal-v1";

/** Darkest the wall's last step can go: `shade` 1 mixes all the way to this. */
const SHADE_DARK = "#2a2340";
/** How tall the band of light is, in metres. */
const GLOW_HEIGHT = 0.04;
/** Round enough at the size a hole is seen. */
const SEGMENTS = 64;

/**
 * FROZEN with version 1 (`portal-v1.ts`); version 2 is `build-portal.ts`.
 *
 * Makes the hole (version 1, `portal-v1.ts`) at the origin, its opening on the ground: the rim on top, the wall inside from
 * the rim's top down to the bottom, in `steps` bands each a step darker, and the band of light. Every surface is one
 * flat colour, lit by nothing: depth is the steps of shade. The ground's opening is cut by the ground (`ground.ts`),
 * at `radius`.
 */
export function buildHole(config: HoleConfig): THREE.Group {
  const { radius, depth, rimWidth, rimHeight, steps, shade } = config;
  const hole = new THREE.Group();
  const flat = (colour: THREE.ColorRepresentation, side: THREE.Side = THREE.FrontSide) =>
    new THREE.MeshBasicMaterial({ color: colour, side });

  // The rim: a flat ring a little over the ground, and its outer side a step darker so the lip reads.
  if (rimWidth > 0) {
    const top = new THREE.Mesh(new THREE.RingGeometry(radius, radius + rimWidth, SEGMENTS).rotateX(-Math.PI / 2), flat(config.rim));
    top.position.y = rimHeight + 0.002;
    hole.add(top);
    if (rimHeight > 0) {
      const side = new THREE.Mesh(
        new THREE.CylinderGeometry(radius + rimWidth, radius + rimWidth, rimHeight, SEGMENTS, 1, true),
        flat(new THREE.Color(config.rim).lerp(new THREE.Color(SHADE_DARK), 0.12)),
      );
      side.position.y = rimHeight / 2;
      hole.add(side);
    }
  }

  // The wall, seen from inside, from the rim's top to the bottom: band 0 the wall's colour, the last `shade` of the way
  // to the darkest.
  const wallTop = rimHeight;
  const band = (wallTop + depth) / steps;
  const shadeOf = (i: number) => new THREE.Color(config.wall).lerp(new THREE.Color(SHADE_DARK), steps === 1 ? 0 : (shade * i) / (steps - 1));
  for (let i = 0; i < steps; i++) {
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, band, SEGMENTS, 1, true), flat(shadeOf(i), THREE.BackSide));
    wall.position.y = wallTop - band * (i + 0.5);
    hole.add(wall);
  }

  // The bottom, the darkest step.
  const bottom = new THREE.Mesh(
    new THREE.CircleGeometry(radius, SEGMENTS).rotateX(-Math.PI / 2),
    flat(new THREE.Color(config.wall).lerp(new THREE.Color(SHADE_DARK), shade)),
  );
  bottom.position.y = -depth;
  hole.add(bottom);

  // The band of light, a hair inside the wall so it is drawn over it.
  if (config.glow) {
    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(radius - 0.003, radius - 0.003, GLOW_HEIGHT, SEGMENTS, 1, true),
      flat(config.glowColour, THREE.BackSide),
    );
    const at = wallTop - config.glowAt * (wallTop + depth);
    glow.position.y = Math.min(wallTop - GLOW_HEIGHT / 2, Math.max(-depth + GLOW_HEIGHT / 2, at));
    hole.add(glow);
  }

  return hole;
}
