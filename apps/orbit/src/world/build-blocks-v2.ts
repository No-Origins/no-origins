import * as THREE from "three/webgpu";
import { color, Discard, Fn, positionWorld, vec2 } from "three/tsl";

import { boundsOf, keyOf, slotsAt, BLOCK, type Block } from "./orbit";

/**
 * The blocks (environment version 2, `orbit.ts`): every block standing, made as one solid, and what the builder's page
 * draws to build with, the level's slots, the blocks' edges and where the pointer would place or take away one.
 *
 * A face two blocks share is inside the solid and is never made. Nothing is lit (mine): a top is the blocks' colour, a
 * side a step towards Dusk as it turns from the light, low behind the visitor's right, and an underside the deepest step.
 * A top is cut where a portal stands on it, out to where the ground was cut for it (`cutOf`), so the portal's collar
 * meets it edge to edge.
 */

/** The colour the blocks' sides step towards, and how far each face does (mine): Dusk, from his mock. */
const SHADE = new THREE.Color("#6d6290");
const STEPS: Record<string, number> = { "1,0,0": 0.14, "-1,0,0": 0.26, "0,0,1": 0.08, "0,0,-1": 0.3, "0,-1,0": 0.42 };

/** The six faces of a box, each the way out and its four corners (0 the least, 1 the greatest, on each axis) round it. */
const FACES: { normal: readonly [number, number, number]; corners: readonly (readonly [number, number, number])[] }[] = [
  { normal: [0, 1, 0], corners: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]] },
  { normal: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { normal: [1, 0, 0], corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
  { normal: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { normal: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { normal: [0, 0, -1], corners: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] },
];

/** A portal's cut in the tops: its middle on the ground (y 0) and how far out the top is cut, in metres. */
export type Cut = { x: number; z: number; radius: number };

/**
 * The blocks, as one solid: the tops, cut round each portal, and the sides and undersides, stepped. The cut is a circle
 * worked out on the GPU for each point of a top at the ground's height, a hair inside the collar's 128 points round, so
 * the collar always covers its edge.
 */
export function buildBlocks(blocks: readonly Block[], ground: THREE.ColorRepresentation, cuts: readonly Cut[]): THREE.Group {
  const taken = new Set(blocks.map(keyOf));
  const tops: number[] = [];
  const sides: number[] = [];
  const shades: number[] = [];
  const base = new THREE.Color(ground);
  const shaded = new THREE.Color();
  for (const block of blocks) {
    const { min, max } = boundsOf(block);
    for (const { normal, corners } of FACES) {
      const [column, row, level] = block;
      if (taken.has(keyOf([column + normal[0], row + normal[2], level + normal[1]]))) continue;
      const points = corners.map(([a, b, c]) => [a ? max[0] : min[0], b ? max[1] : min[1], c ? max[2] : min[2]]);
      const triangles = [points[0], points[1], points[2], points[0], points[2], points[3]].flat();
      if (normal[1] === 1) {
        tops.push(...triangles);
        continue;
      }
      sides.push(...triangles);
      shaded.copy(base).lerp(SHADE, STEPS[normal.join(",")] ?? 0);
      for (let i = 0; i < 6; i++) shades.push(shaded.r, shaded.g, shaded.b);
    }
  }

  const group = new THREE.Group();
  const geometry = (positions: number[]) => {
    const made = new THREE.BufferGeometry();
    made.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return made;
  };

  const topMaterial = new THREE.MeshBasicNodeMaterial();
  topMaterial.colorNode = Fn(() => {
    const here = positionWorld;
    for (const cut of cuts) {
      // Inside the round the collar's 128 sides make, by a hair: the collar covers the cut's edge all the way round.
      const near = here.xz.sub(vec2(cut.x, cut.z)).length().lessThan(cut.radius * Math.cos(Math.PI / 128) - 0.002);
      Discard(near.and(here.y.abs().lessThan(0.01)));
    }
    return color(base);
  })();
  if (tops.length) group.add(new THREE.Mesh(geometry(tops), topMaterial));

  if (sides.length) {
    const made = geometry(sides);
    made.setAttribute("color", new THREE.Float32BufferAttribute(shades, 3));
    group.add(new THREE.Mesh(made, new THREE.MeshBasicMaterial({ vertexColors: true })));
  }
  return group;
}

/** A box's twelve edges, `out` metres outside it, so they never sink into its faces. */
function edgesOf(block: Block, out: number): number[] {
  const { min, max } = boundsOf(block);
  const lo = min.map((v) => v - out);
  const hi = max.map((v) => v + out);
  const corner = ([a, b, c]: readonly number[]) => [a ? hi[0] : lo[0], b ? hi[1] : lo[1], c ? hi[2] : lo[2]];
  const lines: number[] = [];
  for (const [a, b] of [
    [[0, 0, 0], [1, 0, 0]], [[0, 0, 1], [1, 0, 1]], [[0, 1, 0], [1, 1, 0]], [[0, 1, 1], [1, 1, 1]],
    [[0, 0, 0], [0, 1, 0]], [[1, 0, 0], [1, 1, 0]], [[0, 0, 1], [0, 1, 1]], [[1, 0, 1], [1, 1, 1]],
    [[0, 0, 0], [0, 0, 1]], [[1, 0, 0], [1, 0, 1]], [[0, 1, 0], [0, 1, 1]], [[1, 1, 0], [1, 1, 1]],
  ]) {
    lines.push(...corner(a), ...corner(b));
  }
  return lines;
}

const lines = (positions: number[], colour: THREE.ColorRepresentation, opacity: number) => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color: colour, transparent: opacity < 1, opacity, depthWrite: false });
  return new THREE.LineSegments(geometry, material);
};

/**
 * What the builder's page draws to build with (mine): every block's edges, so each unit reads on its own; and the
 * level's slots, the squares of its floor a block may be placed on, all inside the sphere. Dusk, faint.
 */
export function buildLattice(blocks: readonly Block[], level: number, radius: number): THREE.Group {
  const group = new THREE.Group();
  const edges = blocks.flatMap((block) => edgesOf(block, 0.02));
  if (edges.length) group.add(lines(edges, SHADE, 0.55));
  const floor = level * BLOCK.height + 0.02;
  const slots = slotsAt(level, radius).flatMap((slot) => {
    const { min, max } = boundsOf(slot);
    const square = [
      [min[0], floor, min[2]], [max[0], floor, min[2]],
      [max[0], floor, min[2]], [max[0], floor, max[2]],
      [max[0], floor, max[2]], [min[0], floor, max[2]],
      [min[0], floor, max[2]], [min[0], floor, min[2]],
    ];
    return square.flat();
  });
  if (slots.length) group.add(lines(slots, SHADE, 0.2));
  return group;
}

/**
 * Where the pointer would build (mine): the block it would place, a glass box of Dusk with its edges; or the block it
 * would take away, its edges black and its box darkened.
 */
export function buildGhost(block: Block, tool: string): THREE.Group {
  const group = new THREE.Group();
  const removing = tool === "remove";
  const { min, max } = boundsOf(block);
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(max[0] - min[0] + 0.04, max[1] - min[1] + 0.04, max[2] - min[2] + 0.04),
    new THREE.MeshBasicMaterial({ color: removing ? "#000000" : SHADE, transparent: true, opacity: removing ? 0.22 : 0.18, depthWrite: false }),
  );
  box.position.set((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
  group.add(box, lines(edgesOf(block, 0.04), removing ? "#000000" : SHADE, 1));
  return group;
}
