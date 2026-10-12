import * as THREE from "three/webgpu";

import { cutOf, edgeAt, OPEN, openingAt, rimAt, type Opening, type PortalConfig, type Waves } from "./portal";

/** The dark a portal falls into: `darkness` 1 is all the way to it. */
const DARK = "#14101f";
/**
 * Points round the circle: the same 128 as the ground's cut (`ground.ts`), so the collar and the ground meet edge to
 * edge, with no seam between them.
 */
const SEGMENTS = 128;
/** Rows down the wall, enough for its fall into the dark to read as one smooth shade. */
const ROWS = 48;
/** No waves: at rest the edge is round whatever they were. */
const STILL: Waves = { counts: [0, 0, 0], starts: [0, 0, 0] };

/** A portal made: what is added to the scene, and `pose`, which sets it at a moment of its opening. */
export type BuiltPortal = {
  object: THREE.Group;
  /**
   * Sets the portal `t` ms into its opening (`Infinity`, open and at rest), its edge rippled by that opening's `waves`;
   * whether it has come to rest.
   */
  pose(t: number, waves: Waves): boolean;
};

/**
 * Makes the portal (version 6, `portal.ts`) at the origin, its opening on the ground. Each surface is made once, its
 * points round the edge at the 128 angles, and `pose` moves those points to where the edge is at that moment
 * (`edgeAt`), so the opening plays without making anything anew:
 *
 * - the **rim**, a thin line round the opening's edge, level with the ground;
 * - the **collar**, the ground's own colour, from the rim out to where the ground is cut (`cutOf`), which the opening
 *   never reaches, so the portal never meets the ground while it moves;
 * - the **wall**, from the opening down, falling smoothly into the dark like a shadow, painted a colour a row;
 * - the **bottom**, as dark as the wall ends.
 *
 * Nothing is lit. Every surface is seen from either side, and none is culled by its bounds, which move.
 */
export function buildPortal(config: PortalConfig, ground: THREE.ColorRepresentation): BuiltPortal {
  const { depth, darkness, reach } = config;
  const object = new THREE.Group();
  const angles = Array.from({ length: SEGMENTS + 1 }, (_, i) => (i / SEGMENTS) * Math.PI * 2);
  const flat = (colour: THREE.ColorRepresentation) => new THREE.MeshBasicMaterial({ color: colour, side: THREE.DoubleSide });
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    object.add(mesh);
    return geometry.getAttribute("position") as THREE.BufferAttribute;
  };

  // Where a point stands down the wall (0 the opening, 1 the bottom) sets how far into the dark it is: none above where
  // the dark reaches, then easing in to `darkness`. A shadow never lightens what it falls on, so no channel ends
  // lighter than the wall's own (a black wall stays black where the dark, a violet, is lighter).
  const dark = new THREE.Color(DARK);
  const wallColour = new THREE.Color(config.wall);
  const from = 1 - reach;
  const shadowAt = (down: number) => {
    if (down <= from) return 0;
    const t = from >= 1 ? 1 : (down - from) / (1 - from);
    return darkness * t * t * (3 - 2 * t);
  };
  const fallen = (down: number, into: THREE.Color) => {
    into.copy(wallColour).lerp(dark, shadowAt(down));
    return into.setRGB(Math.min(into.r, wallColour.r), Math.min(into.g, wallColour.g), Math.min(into.b, wallColour.b));
  };

  const rim = add(band(SEGMENTS, 2), flat(config.rim));
  const collar = add(band(SEGMENTS, 2), flat(ground));
  const wallGeometry = band(SEGMENTS, ROWS + 1);
  const colours = new Float32Array((ROWS + 1) * (SEGMENTS + 1) * 3);
  const colour = new THREE.Color();
  for (let row = 0; row <= ROWS; row++) {
    fallen(row / ROWS, colour);
    for (let i = 0; i <= SEGMENTS; i++) colour.toArray(colours, (row * (SEGMENTS + 1) + i) * 3);
  }
  wallGeometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  const wall = add(wallGeometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  const bottom = add(fan(SEGMENTS), flat(fallen(1, new THREE.Color())));

  const cut = cutOf(config);
  const edges = new Float64Array(SEGMENTS + 1);
  /** Writes row `row` of a surface's points round the edge, each `r(i)` from the centre and `y` high. */
  const ring = (position: THREE.BufferAttribute, row: number, y: number, r: (i: number) => number) => {
    for (let i = 0; i <= SEGMENTS; i++) {
      const a = angles[i];
      position.setXYZ(row * (SEGMENTS + 1) + i, r(i) * Math.cos(a), y, -r(i) * Math.sin(a));
    }
  };

  const place = (at: Opening, waves: Waves) => {
    for (let i = 0; i <= SEGMENTS; i++) edges[i] = edgeAt(config, at, waves, angles[i]);
    const width = rimAt(config, at);
    const out = (i: number) => Math.min(cut, edges[i] + width);
    ring(rim, 0, 0, (i) => edges[i]);
    ring(rim, 1, 0, out);
    ring(collar, 0, 0, out);
    ring(collar, 1, 0, () => cut);
    for (let row = 0; row <= ROWS; row++) ring(wall, row, (-depth * row) / ROWS, (i) => edges[i]);
    // The bottom's centre is its first point; its edge follows it.
    bottom.setXYZ(0, 0, -depth, 0);
    for (let i = 0; i <= SEGMENTS; i++) {
      const a = angles[i];
      bottom.setXYZ(1 + i, edges[i] * Math.cos(a), -depth, -edges[i] * Math.sin(a));
    }
    for (const position of [rim, collar, wall, bottom]) position.needsUpdate = true;
  };

  place(OPEN, STILL);
  return {
    object,
    pose(t, waves) {
      const at = openingAt(config, t);
      place(at, waves);
      return at.done;
    },
  };
}

/** A band of `rows` rows of points round a circle, `segments` + 1 each (the last on the first), joined row to row. */
function band(segments: number, rows: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(rows * (segments + 1) * 3), 3));
  const index: number[] = [];
  for (let row = 0; row < rows - 1; row++) {
    for (let i = 0; i < segments; i++) {
      const a = row * (segments + 1) + i;
      const b = a + segments + 1;
      index.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  geometry.setIndex(index);
  return geometry;
}

/** A disc: its centre, then `segments` + 1 points round its edge, each wedge from the centre. */
function fan(segments: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array((segments + 2) * 3), 3));
  const index: number[] = [];
  for (let i = 0; i < segments; i++) index.push(0, 1 + i, 2 + i);
  geometry.setIndex(index);
  return geometry;
}
