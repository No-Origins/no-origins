import * as THREE from "three/webgpu";
import { attribute, Discard, Fn, positionWorld, vec2 } from "three/tsl";

import { grainOf, sunOf } from "./atmosphere";
import type { EnvironmentConfig } from "./environment";
import { metresOf, occupancyOf, type Box } from "./hierarchy";

/**
 * The blocks (World.md W4, W24, W25), version 4: a zone's, made as one solid, each block its own size and colour; and
 * where the pointer would place or take away one. Version 3's, every block one size in a zone's colour, is
 * `build-blocks-sector-v3.ts` (frozen).
 *
 * A face the zone's other blocks cover whole is inside the solid and is never made; one they cover in part is made, and
 * hidden where they cover it by the depth. Each face takes peach sunlight or lavender shade from the same sun as the sky
 * and clouds, with mineral grain anchored in world space. A top is cut where a portal stands on it, out to where its
 * collar starts (`cutOf`), so the collar meets it edge to edge.
 */

/** Dusk for the builder's ghost alone; visible surfaces use the environment's shadow colour. */
const SHADE = new THREE.Color("#6d6290");

type Axis = 0 | 1 | 2;

/**
 * The six faces of a box, in the lattice's axes (x, z, level): which axis it faces along and which way, its four corners
 * (0 the least, 1 the greatest, on each of x, y, z in metres) round its way out, and its way out in metres' axes.
 */
const FACES: { axis: Axis; out: 1 | -1; normal: readonly [number, number, number]; corners: readonly (readonly [number, number, number])[] }[] = [
  { axis: 2, out: 1, normal: [0, 1, 0], corners: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]] },
  { axis: 2, out: -1, normal: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { axis: 0, out: 1, normal: [1, 0, 0], corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
  { axis: 0, out: -1, normal: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { axis: 1, out: 1, normal: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { axis: 1, out: -1, normal: [0, 0, -1], corners: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] },
];

/** A portal's cut in the tops: its middle, the height of the top it is cut into, and how far out it is cut, in metres. */
export type Cut = { x: number; y: number; z: number; radius: number };

/** What the blocks are made of besides their colours: the sector's grain. */
export type Grain = { grain: number; grainSize: number };

/** Whether the steps just beyond a box's face are all filled: the face is inside the solid. */
function covered(box: Box, axis: Axis, out: 1 | -1, taken: Map<string, string>): boolean {
  const beyond = out > 0 ? box.to[axis] : box.from[axis] - 1;
  const [a, b] = ([0, 1, 2] as Axis[]).filter((other) => other !== axis);
  for (let i = box.from[a]; i < box.to[a]; i++) {
    for (let j = box.from[b]; j < box.to[b]; j++) {
      const step = [0, 0, 0];
      step[axis] = beyond;
      step[a] = i;
      step[b] = j;
      if (!taken.has(`${step[0]},${step[1]},${step[2]}`)) return false;
    }
  }
  return true;
}

/**
 * Blocks, as one solid: the tops, cut round each portal, and the sides and undersides, stepped, each face its block's
 * colour lit by the sun. The cut is a circle worked out on the GPU for each point of a top at the cut's height, a hair
 * inside the collar's 128 points round, so the collar always covers its edge.
 */
export function buildBlocks(boxes: readonly Box[], environment: EnvironmentConfig, cuts: readonly Cut[], grain: Grain): THREE.Group {
  const taken = occupancyOf(boxes);
  const tops: number[] = [];
  const topShades: number[] = [];
  const sides: number[] = [];
  const sideShades: number[] = [];
  const sun = sunOf(environment);
  const shade = new THREE.Color(environment.shadow);
  const warm = new THREE.Color(environment.sunlight);
  const tones = new Map<string, THREE.Color>();
  const tone = (colour: string, normal: readonly [number, number, number]) => {
    const key = `${colour} ${normal.join(",")}`;
    let made = tones.get(key);
    if (!made) {
      const facing = new THREE.Vector3(...normal).dot(sun);
      made = new THREE.Color(colour).lerp(shade, Math.max(0, -facing) * environment.shade).lerp(warm, Math.max(0, facing) * environment.warmth * 0.45);
      tones.set(key, made);
    }
    return made;
  };
  for (const box of boxes) {
    const min = metresOf(box.from);
    const max = metresOf(box.to);
    for (const { axis, out, normal, corners } of FACES) {
      if (covered(box, axis, out, taken)) continue;
      const points = corners.map(([a, b, c]) => [a ? max[0] : min[0], b ? max[1] : min[1], c ? max[2] : min[2]]);
      const triangles = [points[0], points[1], points[2], points[0], points[2], points[3]].flat();
      const shaded = tone(box.colour, normal);
      const [positions, shades] = normal[1] === 1 ? [tops, topShades] : [sides, sideShades];
      positions.push(...triangles);
      for (let i = 0; i < 6; i++) shades.push(shaded.r, shaded.g, shaded.b);
    }
  }

  const group = new THREE.Group();
  const geometry = (positions: number[], shades: number[]) => {
    const made = new THREE.BufferGeometry();
    made.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    made.setAttribute("color", new THREE.Float32BufferAttribute(shades, 3));
    return made;
  };

  if (tops.length) {
    const material = new THREE.MeshBasicNodeMaterial();
    material.colorNode = Fn(() => {
      const here = positionWorld;
      for (const cut of cuts) {
        // Inside the round the collar's 128 sides make, by a hair: the collar covers the cut's edge all the way round.
        const near = here.xz.sub(vec2(cut.x, cut.z)).length().lessThan(cut.radius * Math.cos(Math.PI / 128) - 0.002);
        Discard(near.and(here.y.sub(cut.y).abs().lessThan(0.01)));
      }
      return attribute("color", "vec3").mul(grainOf(grain));
    })();
    group.add(new THREE.Mesh(geometry(tops, topShades), material));
  }
  if (sides.length) {
    const material = new THREE.MeshBasicNodeMaterial();
    material.colorNode = attribute("color", "vec3").mul(grainOf(grain));
    group.add(new THREE.Mesh(geometry(sides, sideShades), material));
  }
  return group;
}

/** A box's twelve edges, `out` metres outside it, so they never sink into its faces. */
function edgesOf(min: readonly number[], max: readonly number[], out: number): number[] {
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
 * Where the pointer would build (mine): the block it would place, at its size, a glass box of Dusk with its edges; or
 * the one it would take away, its edges black and its box darkened. Its edges stand off it a hair.
 */
export function buildGhost(box: { from: Box["from"]; to: Box["to"] }, tool: string): THREE.Group {
  const group = new THREE.Group();
  const removing = tool === "remove";
  const min = metresOf(box.from);
  const max = metresOf(box.to);
  const out = 0.02;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(max[0] - min[0] + out, max[1] - min[1] + out, max[2] - min[2] + out),
    new THREE.MeshBasicMaterial({ color: removing ? "#000000" : SHADE, transparent: true, opacity: removing ? 0.22 : 0.18, depthWrite: false }),
  );
  mesh.position.set((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
  group.add(mesh, lines(edgesOf(min, max, out), removing ? "#000000" : SHADE, 1));
  return group;
}
