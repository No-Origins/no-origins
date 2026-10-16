import * as THREE from "three/webgpu";

import { GHOST_RING, PICKED_RING } from "./build-ring";
import type { PipeConfig } from "./pipe-v1";
import type { RoadConfig } from "./road-v1";
import { centreOf, directionOf, type Point, type Way } from "./skeleton";

/**
 * Frozen with World.md W93 (`pipe-v1.ts`, `road-v1.ts`: a variant's look, a pipe's gloss and a road's lines); nothing
 * draws it. `build-skeletons.ts` makes version 2's.
 *
 * What makes the pipes and the roads (`pipe.ts`, `road.ts`, `skeleton.ts`, World.md W84): each along one smooth curve
 * through every joint of its skeleton, a centripetal Catmull-Rom (mine: it passes through each joint, never loops or
 * overshoots between two, and two joints are a straight line). A joint is where the underside passes, so a pipe's
 * middle runs its radius over its joints, and a road's top its thickness over them. A joint with a way (W87) is held
 * to it: the curve runs straight along the way for a reach either side of the joint (`LEAD`) before it bends, so a pipe
 * attached to a block's top rises out of it, and one attached to its side comes out level; a pipe's middle there is
 * its radius off the joint across the way (`centreOf`), so a pipe leaving a face upright stands where it was clicked.
 *
 * A pipe is a tube of one radius, closed at both ends; a road a slab of one width and thickness, level from side to side
 * whatever its curve does (a slab turned by the curve's own frame would twist at every change of bend), its edges and
 * its centre line painted on its top a hair over it. Both are a flat colour lit by the world's sun and sky, casting
 * their shadows and taking them, and take the fog as the blocks do: they are built, as the blocks are. Each carries its
 * asset's id, so a click on the Sectors page picks it.
 *
 * Over the one picked, its skeleton (`buildSkeletonOverlay`): the bones, straight from joint to joint, and a ball a
 * joint, the picked one larger and darker, drawn over everything, each ball the same few pixels however far it is.
 */
export type PlacedSkeleton =
  | { id: string; kind: "pipe"; joints: readonly Point[]; ways?: readonly (Way | null)[]; config: PipeConfig }
  | { id: string; kind: "road"; joints: readonly Point[]; ways?: readonly (Way | null)[]; config: RoadConfig };

/** How far either side of a joint with a way the curve keeps to it, in metres (mine): a pipe's four radii, a road's width; never more than two fifths of the way to the next joint. */
const LEAD = { pipe: (config: PipeConfig) => Math.max(1, config.radius * 4), road: (config: RoadConfig) => Math.max(2, config.width) };

/** How far a road's lines stand over its top, in metres, so they never flicker into it. */
const PAINT_OVER = 0.03;
/** A road's samples along its curve are at most this far apart, in metres: its dashes start and stop on them. */
const ROAD_STEP = 0.5;
const UP = new THREE.Vector3(0, 1, 0);

/** The pipes and roads placed in the world, each along its skeleton, of its variant. */
export function buildSkeletons(placed: readonly PlacedSkeleton[]): THREE.Group {
  const group = new THREE.Group();
  group.name = "skeletons";
  // A material a look, shared by every pipe or road of it.
  const materials = new Map<string, THREE.MeshStandardNodeMaterial>();
  const materialOf = (colour: string, gloss: number, paint = false) => {
    const key = `${colour} ${gloss} ${paint}`;
    let made = materials.get(key);
    if (!made) {
      made = new THREE.MeshStandardNodeMaterial({ color: colour, roughness: 1 - gloss * 0.9, metalness: 0 });
      if (paint) {
        made.polygonOffset = true;
        made.polygonOffsetFactor = -2;
        made.polygonOffsetUnits = -2;
      }
      materials.set(key, made);
    }
    return made;
  };
  for (const item of placed) {
    const points = distinct(courseOf(item));
    if (points.length < 2) continue;
    const object = item.kind === "pipe" ? pipeOf(points, item.config, materialOf(item.config.colour, item.config.gloss)) : roadOf(points, item.config, materialOf);
    object.name = `${item.kind} ${item.id}`;
    object.userData.asset = item.id;
    group.add(object);
  }
  return group;
}

/**
 * The points the curve runs through: a pipe's middle at each joint, a road's underside; and either side of a joint
 * with a way, a point along it at its reach, so the curve keeps to the way there.
 */
function courseOf(item: PlacedSkeleton): THREE.Vector3[] {
  const lift = item.kind === "pipe" ? item.config.radius : 0;
  const lead = item.kind === "pipe" ? LEAD.pipe(item.config) : LEAD.road(item.config);
  const ways = item.joints.map((_, i) => item.ways?.[i] ?? null);
  const centres = item.joints.map((joint, i) => new THREE.Vector3(...centreOf(joint, ways[i], lift, item.kind)));
  const points: THREE.Vector3[] = [];
  centres.forEach((centre, i) => {
    const way = ways[i];
    if (!way) return void points.push(centre);
    const along = new THREE.Vector3(...directionOf(way));
    const before = i > 0 ? centre.distanceTo(centres[i - 1]) : Infinity;
    const after = i < centres.length - 1 ? centre.distanceTo(centres[i + 1]) : Infinity;
    const reach = Math.min(lead, Math.min(before, after) * 0.4);
    if (i > 0) points.push(centre.clone().addScaledVector(along, -reach));
    points.push(centre);
    if (i < centres.length - 1) points.push(centre.clone().addScaledVector(along, reach));
  });
  return points;
}

/** The points with any that stand on the one before it left out: a curve needs a way to go between two. */
function distinct(course: readonly THREE.Vector3[]): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (const point of course) if (!points.length || points[points.length - 1].distanceToSquared(point) > 1e-6) points.push(point);
  return points;
}

/** The curve through every point, lifted by `lift` metres. */
export function curveOf(points: readonly THREE.Vector3[], lift = 0): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(points.map((point) => point.clone().setY(point.y + lift)), false, "centripetal");
}

/** A pipe: a tube of its radius along the curve through its middle, a disc closing each end. */
function pipeOf(points: readonly THREE.Vector3[], config: PipeConfig, material: THREE.Material): THREE.Group {
  const pipe = new THREE.Group();
  const curve = curveOf(points);
  const length = curve.getLength();
  const segments = Math.min(1200, Math.max(24, Math.ceil(length / Math.max(0.5, config.radius * 0.6))));
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, config.radius, 28, false), material);
  tube.name = "tube";
  tube.castShadow = true;
  tube.receiveShadow = true;
  pipe.add(tube);
  const front = new THREE.Vector3(0, 0, 1);
  for (const [at, out] of [[0, -1], [1, 1]] as const) {
    const end = new THREE.Mesh(new THREE.CircleGeometry(config.radius, 28), material);
    end.name = at ? "end" : "start";
    end.position.copy(curve.getPointAt(at));
    end.quaternion.setFromUnitVectors(front, curve.getTangentAt(at).multiplyScalar(out).normalize());
    end.castShadow = true;
    pipe.add(end);
  }
  return pipe;
}

/** A point of a road's curve: where it is, which way is its right, level, and how far along it is, in metres. */
type Sample = { point: THREE.Vector3; side: THREE.Vector3; along: number };

/** The curve's samples, evenly along it, each with its level right-hand side (the last one kept where the curve goes straight up). */
function samplesOf(curve: THREE.Curve<THREE.Vector3>): Sample[] {
  const length = curve.getLength();
  const count = Math.min(4000, Math.max(2, Math.ceil(length / ROAD_STEP) + 1));
  const samples: Sample[] = [];
  let side = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < count; i++) {
    const u = i / (count - 1);
    const tangent = curve.getTangentAt(u);
    const level = new THREE.Vector3().crossVectors(tangent, UP);
    if (level.lengthSq() > 1e-6) side = level.normalize();
    samples.push({ point: curve.getPointAt(u), side: side.clone(), along: u * length });
  }
  return samples;
}

/**
 * A road: a slab of its width, from its joints up its thickness, level from side to side; its edges, a strip of the
 * Edge width just inside each side, and its centre line, a strip of the Centre width, dashes of the Dash's length with
 * a gap as long after each (one line where Dash is 0), painted on its top.
 */
function roadOf(points: readonly THREE.Vector3[], config: RoadConfig, materialOf: (colour: string, gloss: number, paint?: boolean) => THREE.Material): THREE.Group {
  const road = new THREE.Group();
  const samples = samplesOf(curveOf(points));
  const half = config.width / 2;
  const top = config.thickness;
  const slab = new THREE.Mesh(slabOf(samples, -half, half, 0, top), materialOf(config.colour, 0.1));
  slab.name = "road";
  slab.castShadow = true;
  slab.receiveShadow = true;
  road.add(slab);
  const painted = (name: string, geometry: THREE.BufferGeometry | null, colour: string) => {
    if (!geometry) return;
    const mesh = new THREE.Mesh(geometry, materialOf(colour, 0.1, true));
    mesh.name = name;
    mesh.receiveShadow = true;
    road.add(mesh);
  };
  const edge = Math.min(config.edgeWidth, half);
  if (edge > 0) {
    painted("left edge", stripOf(samples, -half, -half + edge, top + PAINT_OVER), config.edgeColour);
    painted("right edge", stripOf(samples, half - edge, half, top + PAINT_OVER), config.edgeColour);
  }
  const line = Math.min(config.lineWidth, config.width);
  if (line > 0) {
    const on = config.dash > 0 ? (along: number) => Math.floor(along / config.dash) % 2 === 0 : () => true;
    painted("centre line", stripOf(samples, -line / 2, line / 2, top + PAINT_OVER, on), config.lineColour);
  }
  return road;
}

/** Triangles with a normal each corner, gathered as they are made. */
class Faces {
  readonly positions: number[] = [];
  readonly normals: number[] = [];
  /** A triangle, its corners counter-clockwise seen from where it faces, each with its normal. */
  triangle(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, na: THREE.Vector3, nb = na, nc = na) {
    for (const [point, normal] of [[a, na], [b, nb], [c, nc]] as const) {
      this.positions.push(point.x, point.y, point.z);
      this.normals.push(normal.x, normal.y, normal.z);
    }
  }
  geometry(): THREE.BufferGeometry | null {
    if (!this.positions.length) return null;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(this.normals, 3));
    return geometry;
  }
}

/** A sample's point moved across to its right by `across` metres and up by `up`. */
const at = (sample: Sample, across: number, up: number) => sample.point.clone().addScaledVector(sample.side, across).setY(sample.point.y + up);

/** A slab along the samples, from `left` to `right` across its middle and from `bottom` to `top` over it, closed at both ends. */
function slabOf(samples: readonly Sample[], left: number, right: number, bottom: number, top: number): THREE.BufferGeometry {
  const faces = new Faces();
  const down = UP.clone().negate();
  for (let i = 0; i < samples.length - 1; i++) {
    const [s, n] = [samples[i], samples[i + 1]];
    const [lt, rt, lb, rb] = [at(s, left, top), at(s, right, top), at(s, left, bottom), at(s, right, bottom)];
    const [lt1, rt1, lb1, rb1] = [at(n, left, top), at(n, right, top), at(n, left, bottom), at(n, right, bottom)];
    faces.triangle(lt, rt, lt1, UP);
    faces.triangle(rt, rt1, lt1, UP);
    faces.triangle(lb, lb1, rb, down);
    faces.triangle(rb, lb1, rb1, down);
    const [out, out1] = [s.side, n.side];
    faces.triangle(rb, rb1, rt, out, out1, out);
    faces.triangle(rt, rb1, rt1, out, out1, out1);
    const [into, into1] = [s.side.clone().negate(), n.side.clone().negate()];
    faces.triangle(lb, lt, lb1, into, into, into1);
    faces.triangle(lt, lt1, lb1, into, into1, into1);
  }
  // Its ends, each facing along the way the road goes there.
  const first = samples[0];
  const last = samples[samples.length - 1];
  const back = new THREE.Vector3().crossVectors(first.side, UP).normalize();
  const ahead = new THREE.Vector3().crossVectors(UP, last.side).normalize();
  faces.triangle(at(first, left, bottom), at(first, right, bottom), at(first, left, top), back);
  faces.triangle(at(first, right, bottom), at(first, right, top), at(first, left, top), back);
  faces.triangle(at(last, left, bottom), at(last, left, top), at(last, right, bottom), ahead);
  faces.triangle(at(last, right, bottom), at(last, left, top), at(last, right, top), ahead);
  return faces.geometry() as THREE.BufferGeometry;
}

/** A strip facing up along the samples, from `left` to `right` across, at `y` over them; where `on` says, between two samples. */
function stripOf(samples: readonly Sample[], left: number, right: number, y: number, on: (along: number) => boolean = () => true): THREE.BufferGeometry | null {
  const faces = new Faces();
  for (let i = 0; i < samples.length - 1; i++) {
    const [s, n] = [samples[i], samples[i + 1]];
    if (!on((s.along + n.along) / 2)) continue;
    const [l, r, l1, r1] = [at(s, left, y), at(s, right, y), at(n, left, y), at(n, right, y)];
    faces.triangle(l, r, l1, UP);
    faces.triangle(r, r1, l1, UP);
  }
  return faces.geometry();
}

/**
 * The skeleton drawn over a pipe or a road: its object; how to keep each ball, and the arrow, the same few pixels as the
 * camera moves; and where the arrow's head is now, to take hold of.
 */
export type BuiltOverlay = {
  object: THREE.Group;
  /** Sizes each ball and the arrow for a camera and a view this many pixels tall. */
  scaleFor(camera: THREE.PerspectiveCamera, height: number): void;
  /** Where the arrow's head is, in the world, as last sized; none without an arrow. */
  tip(): THREE.Vector3 | null;
};

/** How long the arrow at the picked joint is on the screen, in pixels, and how wide its head (mine). */
const ARROW_PIXELS = 110;
const HEAD_PIXELS = 18;

/** How wide a joint's ball is on the screen, in pixels across its middle (mine), and the picked one's. */
const JOINT_PIXELS = 14;
const PICKED_PIXELS = 22;

/**
 * A skeleton over what it shapes (mine): its bones, straight from joint to joint, and a ball a joint, lilac, the picked
 * one violet and larger; drawn over everything (no depth), lit by nothing, never fogged, so a joint behind the pipe or
 * the ground is seen and taken hold of. `points` are where the balls stand, in metres. At the picked joint an arrow
 * (W87; his: "An arrow to drag") along the way it runs: violet where its way is set, lilac where the curve decides it;
 * its head is taken hold of to aim it.
 */
export function buildSkeletonOverlay(points: readonly Point[], picked: number | null, arrow: { along: Point; set: boolean } | null = null): BuiltOverlay {
  const group = new THREE.Group();
  group.name = "skeleton";
  const bones = new THREE.BufferGeometry().setFromPoints(points.slice(1).flatMap((point, i) => [new THREE.Vector3(...points[i]), new THREE.Vector3(...point)]));
  const line = new THREE.LineSegments(bones, new THREE.LineBasicMaterial({ color: PICKED_RING, depthTest: false, depthWrite: false, transparent: true, fog: false }));
  line.renderOrder = 10;
  group.add(line);
  const ball = new THREE.SphereGeometry(0.5, 20, 14);
  const paint = (colour: string) => new THREE.MeshBasicMaterial({ color: colour, depthTest: false, depthWrite: false, transparent: true, fog: false });
  const [plain, held] = [paint(GHOST_RING), paint(PICKED_RING)];
  const balls = points.map((point, i) => {
    const mesh = new THREE.Mesh(ball, i === picked ? held : plain);
    mesh.name = `joint ${i}`;
    mesh.position.set(...point);
    mesh.renderOrder = i === picked ? 12 : 11;
    mesh.userData.pixels = i === picked ? PICKED_PIXELS : JOINT_PIXELS;
    group.add(mesh);
    return mesh;
  });
  // The arrow: a shaft from the picked joint along its way, and a cone for its head, both sized each frame.
  const from = picked !== null && arrow ? new THREE.Vector3(...points[picked]) : null;
  const along = arrow ? new THREE.Vector3(...arrow.along).normalize() : null;
  let shaft: THREE.Line | null = null;
  let head: THREE.Mesh | null = null;
  let tip: THREE.Vector3 | null = null;
  if (from && along && arrow) {
    const colour = arrow.set ? PICKED_RING : GHOST_RING;
    shaft = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), along]), new THREE.LineBasicMaterial({ color: colour, depthTest: false, depthWrite: false, transparent: true, fog: false }));
    shaft.name = "arrow";
    shaft.position.copy(from);
    shaft.renderOrder = 13;
    head = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 20), paint(colour));
    head.name = "arrow head";
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), along);
    head.renderOrder = 13;
    group.add(shaft, head);
  }
  return {
    object: group,
    scaleFor(camera, height) {
      // A metre's height on the screen at a distance: the view's height over the frustum's there.
      const across = 2 * Math.tan((camera.fov * Math.PI) / 360) / Math.max(1, height);
      for (const mesh of balls) mesh.scale.setScalar(camera.position.distanceTo(mesh.position) * across * (mesh.userData.pixels as number));
      if (shaft && head && from && along) {
        const metres = camera.position.distanceTo(from) * across;
        shaft.scale.setScalar(metres * ARROW_PIXELS);
        head.scale.setScalar(metres * HEAD_PIXELS);
        tip = from.clone().addScaledVector(along, metres * ARROW_PIXELS);
        head.position.copy(tip);
      }
    },
    tip: () => (tip ? tip.clone().add(group.position) : null),
  };
}
