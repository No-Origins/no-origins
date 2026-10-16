import * as THREE from "three/webgpu";
import { attribute, Break, bool, clamp, dot, float, Fn, frontFacing, If, int, Loop, positionWorld, select, uniform, uniformArray } from "three/tsl";

import { grainOf, sunOf } from "./atmosphere";
import { GHOST_RING, PICKED_RING } from "./build-ring";
import { INSIDE_SHADE, type PipeCut } from "./build-skeletons";
import type { EnvironmentConfig } from "./environment";
import type { Solid } from "./hierarchy";

/**
 * The blocks (World.md W4, W24, W25, W93), version 5: a sector's, each its own size, turned its own way, in its own
 * colour and texture; and where the pointer would place or pick one. Version 4's, every block on the lattice, made as one
 * solid with a top cut round a portal, is `build-blocks-v4.ts` (frozen).
 *
 * Each face takes peach sunlight or lavender shade from the same sun as the sky and clouds by the way it faces, turned
 * with its block, and a block whose texture is Grain wears the mineral grain anchored in world space (the Sectors card's
 * Grain); a Smooth one is its colour alone. A face another block covers is hidden by the depth, as one inside a stack of
 * blocks is.
 *
 * A block a pipe is subtracted from (W95) is drawn on its own (`buildCutBlock`): nothing of it is drawn inside the pipe,
 * so where the pipe passes through it, it is open onto the pipe, whose own tube is the hole's side; seen from inside,
 * through an opening, its faces are its colours in the inside's darker shade, as a pipe's lining is.
 */

/** Dusk for the builder's ghost alone; visible surfaces use the environment's shadow colour. */
const SHADE = new THREE.Color("#6d6290");

/** What the blocks are made of besides their colours: the grain, the Sectors page's (W81). */
export type Grain = { grain: number; grainSize: number };

/** A box's six faces as its own axes have them: the axis it faces along and which way, and its four corners round its way out. */
const FACES: { axis: 0 | 1 | 2; out: 1 | -1; corners: readonly (readonly [number, number, number])[] }[] = [
  { axis: 1, out: 1, corners: [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]] },
  { axis: 1, out: -1, corners: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
  { axis: 0, out: 1, corners: [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]] },
  { axis: 0, out: -1, corners: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
  { axis: 2, out: 1, corners: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
  { axis: 2, out: -1, corners: [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]] },
];

/** A point of a block, from its own signs on each of its axes (−1 to 1) to the world. */
const pointOf = (solid: Pick<Solid, "centre" | "half" | "axes">, signs: readonly number[]) =>
  [0, 1, 2].map((k) => solid.centre[k] + signs.reduce((sum, sign, i) => sum + sign * solid.half[i] * solid.axes[i][k], 0));

/**
 * Blocks: each face of each block in its block's colour lit by the sun as it faces, the Grain ones' wearing the grain;
 * two meshes, the smooth and the grained.
 */
export function buildBlocks(solids: readonly Solid[], environment: EnvironmentConfig, grain: Grain): THREE.Group {
  const toned = tonedFaces(solids, environment);
  const group = new THREE.Group();
  for (const texture of ["smooth", "grain"] as const) {
    const geometry = toned[texture];
    if (!geometry) continue;
    const material = new THREE.MeshBasicNodeMaterial();
    material.colorNode = colourOf(texture, grain);
    group.add(new THREE.Mesh(geometry, material));
  }
  return group;
}

/** Each face of each block in its block's colour lit by the sun as it faces, the smooth blocks' and the grained, as geometry. */
function tonedFaces(solids: readonly Solid[], environment: EnvironmentConfig): Record<"smooth" | "grain", THREE.BufferGeometry | null> {
  const sun = sunOf(environment);
  const shade = new THREE.Color(environment.shadow);
  const warm = new THREE.Color(environment.sunlight);
  const tone = (colour: string, normal: readonly number[]) => {
    const facing = new THREE.Vector3(normal[0], normal[1], normal[2]).dot(sun);
    return new THREE.Color(colour).lerp(shade, Math.max(0, -facing) * environment.shade).lerp(warm, Math.max(0, facing) * environment.warmth * 0.45);
  };
  const made = { smooth: { positions: [] as number[], shades: [] as number[] }, grain: { positions: [] as number[], shades: [] as number[] } };
  for (const solid of solids) {
    const into = made[solid.texture];
    for (const { axis, out, corners } of FACES) {
      const points = corners.map((signs) => pointOf(solid, signs));
      into.positions.push(...[points[0], points[1], points[2], points[0], points[2], points[3]].flat());
      const shaded = tone(solid.colour, solid.axes[axis].map((n) => n * out));
      for (let i = 0; i < 6; i++) into.shades.push(shaded.r, shaded.g, shaded.b);
    }
  }
  const geometryOf = ({ positions, shades }: { positions: number[]; shades: number[] }) => {
    if (!positions.length) return null;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(shades, 3));
    return geometry;
  };
  return { smooth: geometryOf(made.smooth), grain: geometryOf(made.grain) };
}

/** A block's colour as its texture wears it: its face's tone, the Grain ones' with the grain over it. */
const colourOf = (texture: "smooth" | "grain", grain: Grain) => (texture === "grain" ? attribute("color", "vec3").mul(grainOf(grain)) : attribute("color", "vec3"));

/** The most lengths of pipe a cut block is drawn against (mine): 4 KB of uniforms, inside what WebGL 2 always has. */
const CUT_SEGMENTS = 128;
/** How far past a pipe's flat end a cut still reaches, in metres (mine): a face flush with the end is opened, never torn. */
const FLUSH = 0.01;

/** A length of a pipe that passes through a block: from and to, its radius, and whether its start or end is the pipe's own (flat). */
export type CutSegment = { from: readonly [number, number, number]; to: readonly [number, number, number]; radius: number; flatFrom: boolean; flatTo: boolean };

/** The lengths of the pipes cut out of a block that pass through it (each a capsule, flat at the pipe's ends); at most `CUT_SEGMENTS`, a long run thinned. */
export function cutSegmentsOf(solid: Pick<Solid, "centre" | "half" | "axes">, cuts: readonly PipeCut[]): CutSegment[] {
  // A point in the block's own axes, from its middle.
  const local = (point: readonly number[]) => solid.axes.map((axis) => axis.reduce((sum, a, k) => sum + a * (point[k] - solid.centre[k]), 0));
  const meets = (a: readonly number[], b: readonly number[], radius: number) => {
    const [la, lb] = [local(a), local(b)];
    return [0, 1, 2].every((k) => Math.min(la[k], lb[k]) - radius <= solid.half[k] && Math.max(la[k], lb[k]) + radius >= -solid.half[k]);
  };
  const through = (cut: PipeCut, stride: number) => {
    const last = cut.points.length - 1;
    const segments: CutSegment[] = [];
    for (let i = 0; i < last; i += stride) {
      const j = Math.min(last, i + stride);
      if (meets(cut.points[i], cut.points[j], cut.radius)) segments.push({ from: cut.points[i], to: cut.points[j], radius: cut.radius, flatFrom: i === 0, flatTo: j === last });
    }
    return segments;
  };
  const every = cuts.flatMap((cut) => through(cut, 1));
  if (every.length <= CUT_SEGMENTS) return every;
  const stride = Math.ceil(every.length / CUT_SEGMENTS);
  return cuts.flatMap((cut) => through(cut, stride)).slice(0, CUT_SEGMENTS);
}

/**
 * Whether a point is cut out of a block (W95, W101): inside a length of a pipe that passes through it, and not past a
 * flat end of the pipe; the same test the cut block's `maskNode` makes for each of its pixels, so what the figure walks
 * through is the hole that is drawn.
 */
export function insideCut(segments: readonly CutSegment[], point: readonly [number, number, number]): boolean {
  return segments.some(({ from, to, radius, flatFrom, flatTo }) => {
    const along = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
    const reach = Math.max(1e-8, along[0] ** 2 + along[1] ** 2 + along[2] ** 2);
    const t = ((point[0] - from[0]) * along[0] + (point[1] - from[1]) * along[1] + (point[2] - from[2]) * along[2]) / reach;
    const slack = FLUSH / Math.sqrt(reach);
    if ((flatFrom && t < -slack) || (flatTo && t > 1 + slack)) return false;
    const c = Math.min(1, Math.max(0, t));
    return Math.hypot(point[0] - from[0] - along[0] * c, point[1] - from[1] - along[1] * c, point[2] - from[2] - along[2] * c) < radius;
  });
}

/** A block a pipe is cut out of (W95), and how to tell it where the pipes now pass through it: a change moves no geometry and makes no shader anew. */
export type BuiltCutBlock = { object: THREE.Mesh; cutBy(segments: readonly CutSegment[]): void };

/**
 * A block with pipes subtracted from it (W95, mine): its faces drawn from both sides, the inside's in its colours'
 * darker shade (`INSIDE_SHADE`), and nothing of it drawn inside any length of a pipe that passes through it (`maskNode`).
 */
export function buildCutBlock(solid: Solid, environment: EnvironmentConfig, grain: Grain): BuiltCutBlock {
  const geometry = tonedFaces([solid], environment)[solid.texture] as THREE.BufferGeometry;
  // Each length twice: its start and its radius, then its end and whether its ends are flat (1 its start, 2 its end).
  const values = Array.from({ length: CUT_SEGMENTS * 2 }, () => new THREE.Vector4());
  const lengths = uniformArray<"vec4">(values, "vec4");
  const count = uniform(0, "int");
  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide });
  const colour = colourOf(solid.texture, grain);
  material.colorNode = select(frontFacing, colour, colour.mul(INSIDE_SHADE));
  material.maskNode = Fn(() => {
    const inside = bool(false).toVar();
    Loop({ start: int(0), end: count, type: "int" }, ({ i }) => {
      const a = lengths.element(i.mul(2)).toVar();
      const b = lengths.element(i.mul(2).add(1)).toVar();
      const along = b.xyz.sub(a.xyz).toVar();
      const reach = dot(along, along).max(1e-8).toVar();
      const t = dot(positionWorld.sub(a.xyz), along).div(reach).toVar();
      const slack = float(FLUSH).div(reach.sqrt());
      const past = b.w.equal(1).or(b.w.equal(3)).and(t.lessThan(slack.negate())).or(b.w.greaterThanEqual(2).and(t.greaterThan(slack.add(1))));
      const near = positionWorld.sub(a.xyz.add(along.mul(clamp(t, 0, 1)))).length().lessThan(a.w);
      If(past.not().and(near), () => {
        inside.assign(true);
        Break();
      });
    });
    return inside.not();
  })();
  const object = new THREE.Mesh(geometry, material);
  object.name = `cut ${solid.id}`;
  return {
    object,
    cutBy(segments) {
      const shown = segments.slice(0, CUT_SEGMENTS);
      shown.forEach((segment, i) => {
        values[i * 2].set(segment.from[0], segment.from[1], segment.from[2], segment.radius);
        values[i * 2 + 1].set(segment.to[0], segment.to[1], segment.to[2], (segment.flatFrom ? 1 : 0) + (segment.flatTo ? 2 : 0));
      });
      count.value = shown.length;
    },
  };
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
 * The sectors' rooms on the Sectors page (World.md W81, mine): each drawn by its twelve edges alone, the one picked violet
 * (`PICKED_RING`), the others lilac (`GHOST_RING`), as a block picked and a block to pick are; never fogged, so a room
 * a kilometre off still shows where it stands. A room is in metres, x y z, its least corner and its greatest.
 */
export function buildSectorBounds(rooms: readonly { min: readonly number[]; max: readonly number[]; picked: boolean }[]): THREE.Group {
  const group = new THREE.Group();
  for (const room of rooms) {
    const edges = lines(edgesOf(room.min, room.max, 0), room.picked ? PICKED_RING : GHOST_RING, 1);
    (edges.material as THREE.LineBasicMaterial).fog = false;
    // The picked one's edges over another's where they meet.
    edges.renderOrder = room.picked ? 1 : 0;
    group.add(edges);
  }
  return group;
}

/**
 * Outlines on a sector's floor (World.md W91, mine): a grove's area and its hollow, under the pointer where the next
 * one would be planted (lilac) and round the grove picked (violet), as the sectors' edges are; a little over the floor,
 * never fogged. Each line is points in the world, in metres (x, z), closed, at its height `y`; a point that carries its
 * own height (x, z, y: an outline draped over what stands under it, W96) stands that far over it instead.
 */
export function buildOutlines(outlines: readonly { lines: readonly (readonly [number, number] | readonly [number, number, number])[][]; y: number; picked: boolean }[]): THREE.Group {
  const group = new THREE.Group();
  for (const outline of outlines) {
    const positions: number[] = [];
    const heightOf = (point: readonly number[]) => outline.y + (point[2] ?? 0);
    for (const line of outline.lines) {
      for (let i = 1; i < line.length; i++) positions.push(line[i - 1][0], heightOf(line[i - 1]), line[i - 1][1], line[i][0], heightOf(line[i]), line[i][1]);
    }
    const drawn = lines(positions, outline.picked ? PICKED_RING : GHOST_RING, 1);
    (drawn.material as THREE.LineBasicMaterial).fog = false;
    // After the base gas, which would paint over a line this near the floor, the picked over the rest.
    drawn.renderOrder = outline.picked ? 2 : 1;
    group.add(drawn);
  }
  return group;
}

/**
 * Where the pointer would build (mine): the block it would place, at its size and turned its way, a glass box of Dusk
 * with its edges; with Select, the one it would pick, lilac, as the ring under the pointer when an element is placed is
 * (`GHOST_RING`); and a block picked (`picked`), its edges violet (`PICKED_RING`) and its box barely tinted, so its own
 * colour shows while it is recoloured. Its edges stand off it a hair.
 */
export function buildGhost(solid: Pick<Solid, "centre" | "half" | "axes">, tool: string): THREE.Group {
  const group = new THREE.Group();
  const paint =
    tool === "select" ? { colour: GHOST_RING, fill: 0.12 }
    : tool === "picked" ? { colour: PICKED_RING, fill: 0.08 }
    : { colour: SHADE, fill: 0.18 };
  const out = 0.02;
  const half = solid.half.map((value) => value + out / 2);
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(half[0] * 2, half[1] * 2, half[2] * 2),
    new THREE.MeshBasicMaterial({ color: paint.colour, transparent: true, opacity: paint.fill, depthWrite: false }),
  );
  group.add(mesh, lines(edgesOf([-half[0], -half[1], -half[2]], half, 0), paint.colour, 1));
  // The box stands in its own axes: its middle where the block's is, turned as the block is.
  group.position.set(solid.centre[0], solid.centre[1], solid.centre[2]);
  group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(...solid.axes[0]), new THREE.Vector3(...solid.axes[1]), new THREE.Vector3(...solid.axes[2])));
  return group;
}
