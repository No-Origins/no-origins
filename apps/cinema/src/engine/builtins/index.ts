import * as THREE from "three";

import { bool, num, str } from "../controls.ts";
import { EASES, ease, lerp, noise, radians } from "../math.ts";
import type { CameraEntry, CameraPose, CastEntry, Entry, LightEntry, Values, Vec3, World } from "../types.ts";

/**
 * The stand-ins (Cinema-Engine.md E5, E8): a placeholder figure, two plain camera moves and a plain light, so a shot can
 * be made before he has described his own. Tools, not his ideas, so they are public; he replaces them as he describes
 * his. Each is version 1.
 */

/** The placeholder figure: a plain capsule with a small block on its front, so which way it faces reads. */
const standIn: CastEntry = {
  kind: "cast",
  id: "stand-in",
  label: "Stand-in",
  version: 1,
  description: "A placeholder figure where a cast member will stand: a capsule, a mark on its front.",
  controls: [
    { kind: "number", id: "height", label: "Height", min: 0.3, max: 4, step: 0.05, unit: "m", default: 1.2 },
    { kind: "colour", id: "colour", label: "Colour", default: "#a8a29e" },
  ],
  build(values) {
    const height = num(values, "height");
    const radius = height * 0.22;
    const material = new THREE.MeshStandardMaterial({ color: str(values, "colour"), roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(radius, height - 2 * radius, 8, 24), material);
    body.position.y = height / 2;
    const mark = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.8, radius * 0.35, radius * 0.5), material);
    mark.position.set(0, height * 0.72, radius * 0.95);
    const figure = new THREE.Group();
    figure.add(body, mark);
    figure.traverse((part) => {
      part.castShadow = true;
      part.receiveShadow = true;
    });
    return {
      object: figure,
      dispose: () => {
        body.geometry.dispose();
        mark.geometry.dispose();
        material.dispose();
      },
    };
  },
};

/** The world's focus, lifted. */
const aim = (world: World, lift: number): Vec3 => [world.focus[0], world.focus[1] + lift, world.focus[2]];
/** A distance that takes in the whole world when it is set to 0. */
const reach = (world: World, distance: number) => (distance > 0 ? distance : world.radius * 1.9);

const moveControls = [
  { kind: "number", id: "lens", label: "Lens", min: 12, max: 200, step: 1, unit: "mm", default: 35 },
  { kind: "choice", id: "ease", label: "Ease", options: EASES, default: "ease in out" },
  { kind: "number", id: "lift", label: "Aim lift", min: -50, max: 50, step: 0.1, unit: "m", default: 0, help: "Aim above (or below) the world's focus." },
] as const;

/** A camera that circles the world's focus at a height, from one bearing to another. */
const orbit: CameraEntry = {
  kind: "camera",
  id: "orbit",
  label: "Orbit",
  version: 1,
  description: "Circles the world's focus at a height, from one bearing to another.",
  controls: [
    { kind: "number", id: "distance", label: "Distance", min: 0, max: 500, step: 0.5, unit: "m", default: 0, help: "0 takes in the whole world." },
    { kind: "number", id: "height", label: "Height", min: -20, max: 300, step: 0.5, unit: "m", default: 8 },
    { kind: "angle", id: "from", label: "From", min: -720, max: 720, step: 1, default: -30 },
    { kind: "angle", id: "to", label: "To", min: -720, max: 720, step: 1, default: 30 },
    ...moveControls,
  ],
  pose(values: Values, u: number, world: World): CameraPose {
    const target = aim(world, num(values, "lift"));
    const bearing = radians(lerp(num(values, "from"), num(values, "to"), ease(str(values, "ease"), u)));
    const distance = reach(world, num(values, "distance"));
    return {
      position: [target[0] + Math.sin(bearing) * distance, world.focus[1] + num(values, "height"), target[2] + Math.cos(bearing) * distance],
      target,
      lens: num(values, "lens"),
    };
  },
};

/** A camera that moves straight in toward the world's focus (or out from it) along one bearing. */
const push: CameraEntry = {
  kind: "camera",
  id: "push",
  label: "Push",
  version: 1,
  description: "Moves straight in toward the world's focus, or out from it, along one bearing and elevation.",
  controls: [
    { kind: "angle", id: "bearing", label: "Bearing", min: -180, max: 180, step: 1, default: 0 },
    { kind: "angle", id: "elevation", label: "Elevation", min: -30, max: 89, step: 1, default: 15 },
    { kind: "number", id: "from", label: "From", min: 0, max: 500, step: 0.5, unit: "m", default: 0, help: "0 takes in the whole world." },
    { kind: "number", id: "to", label: "To", min: 0.5, max: 500, step: 0.5, unit: "m", default: 10 },
    ...moveControls,
  ],
  pose(values, u, world) {
    const target = aim(world, num(values, "lift"));
    const distance = lerp(reach(world, num(values, "from")), num(values, "to"), ease(str(values, "ease"), u));
    const bearing = radians(num(values, "bearing"));
    const elevation = radians(num(values, "elevation"));
    const across = Math.cos(elevation) * distance;
    return {
      position: [target[0] + Math.sin(bearing) * across, target[1] + Math.sin(elevation) * distance, target[2] + Math.cos(bearing) * across],
      target,
      lens: num(values, "lens"),
    };
  },
};

/**
 * A camera that goes from one place to another, turning from one aim to another, in world metres: the general move an
 * agent builds a path from, one Move after another on the camera's track. Its way may bow sideways into a curve (Bend),
 * its lens may change (a zoom), and a hand may hold it (Shake, on the shot's own clock).
 */
const move: CameraEntry = {
  kind: "camera",
  id: "move",
  label: "Move",
  version: 1,
  description: "Goes from one place to another, turning from one aim to another (world metres); chain Moves for any path.",
  controls: [
    { kind: "number", id: "from-x", label: "From x", group: "From", min: -1000, max: 1000, step: 0.1, unit: "m", default: 0 },
    { kind: "number", id: "from-y", label: "From y", group: "From", min: -50, max: 1000, step: 0.1, unit: "m", default: 12 },
    { kind: "number", id: "from-z", label: "From z", group: "From", min: -1000, max: 1000, step: 0.1, unit: "m", default: 60 },
    { kind: "number", id: "aim-from-x", label: "Aim x", group: "From", min: -1000, max: 1000, step: 0.1, unit: "m", default: 0 },
    { kind: "number", id: "aim-from-y", label: "Aim y", group: "From", min: -50, max: 1000, step: 0.1, unit: "m", default: 6 },
    { kind: "number", id: "aim-from-z", label: "Aim z", group: "From", min: -1000, max: 1000, step: 0.1, unit: "m", default: 0 },
    { kind: "number", id: "lens-from", label: "Lens", group: "From", min: 12, max: 300, step: 1, unit: "mm", default: 35 },
    { kind: "number", id: "to-x", label: "To x", group: "To", min: -1000, max: 1000, step: 0.1, unit: "m", default: 0 },
    { kind: "number", id: "to-y", label: "To y", group: "To", min: -50, max: 1000, step: 0.1, unit: "m", default: 12 },
    { kind: "number", id: "to-z", label: "To z", group: "To", min: -1000, max: 1000, step: 0.1, unit: "m", default: 40 },
    { kind: "number", id: "aim-to-x", label: "Aim x", group: "To", min: -1000, max: 1000, step: 0.1, unit: "m", default: 0 },
    { kind: "number", id: "aim-to-y", label: "Aim y", group: "To", min: -50, max: 1000, step: 0.1, unit: "m", default: 6 },
    { kind: "number", id: "aim-to-z", label: "Aim z", group: "To", min: -1000, max: 1000, step: 0.1, unit: "m", default: 0 },
    { kind: "number", id: "lens-to", label: "Lens", group: "To", min: 12, max: 300, step: 1, unit: "mm", default: 35 },
    { kind: "choice", id: "ease", label: "Ease", group: "Way", options: EASES, default: "ease in out" },
    { kind: "number", id: "bend", label: "Bend", group: "Way", min: -500, max: 500, step: 0.5, unit: "m", default: 0, help: "How far the way bows to the side, at its middle: a curve instead of a line." },
    { kind: "number", id: "shake", label: "Shake", group: "Way", min: 0, max: 2, step: 0.01, unit: "m", default: 0, help: "A hand holding the camera." },
    { kind: "number", id: "shake-speed", label: "Shake speed", group: "Way", min: 0.1, max: 6, step: 0.1, unit: "a s", default: 1 },
  ],
  pose(values, u, _world, t) {
    const e = ease(str(values, "ease"), u);
    const from: Vec3 = [num(values, "from-x"), num(values, "from-y"), num(values, "from-z")];
    const to: Vec3 = [num(values, "to-x"), num(values, "to-y"), num(values, "to-z")];
    const position = from.map((a, i) => lerp(a, to[i]!, e)) as Vec3;
    // The bend bows the way sideways, most at its middle, at right angles to it on the ground.
    const across = [to[2] - from[2], -(to[0] - from[0])];
    const reachAcross = Math.hypot(across[0]!, across[1]!) || 1;
    const bow = num(values, "bend") * Math.sin(Math.PI * e);
    position[0] += (across[0]! / reachAcross) * bow;
    position[2] += (across[1]! / reachAcross) * bow;
    const target = [0, 1, 2].map((i) => lerp(num(values, `aim-from-${"xyz"[i]}`), num(values, `aim-to-${"xyz"[i]}`), e)) as Vec3;
    const shake = num(values, "shake");
    if (shake > 0) {
      const at = t * num(values, "shake-speed");
      for (let i = 0; i < 3; i++) position[i] += (noise(17 + i, at, i * 7.3) - 0.5) * 2 * shake;
      for (let i = 0; i < 3; i++) target[i] += (noise(31 + i, at, i * 5.1) - 0.5) * 2 * shake * 0.6;
    }
    return { position, target, lens: lerp(num(values, "lens-from"), num(values, "lens-to"), e) };
  },
};

/** How many points a Path may pass through. */
const PATH_POINTS = 6;

/**
 * A point on a centripetal Catmull–Rom curve through p1 and p2 (p0 and p3 the points either side): a curve that passes
 * through every point, never loops or overshoots between close ones, and has no corner at a point.
 */
function curve(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
  const gap = (a: Vec3, b: Vec3) => Math.max(1e-4, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])));
  const t1 = gap(p0, p1), t2 = t1 + gap(p1, p2), t3 = t2 + gap(p2, p3);
  const at = t1 + (t2 - t1) * t;
  const mix = (a: Vec3, b: Vec3, ta: number, tb: number) => a.map((v, i) => ((tb - at) * v + (at - ta) * b[i]!) / (tb - ta)) as Vec3;
  const a1 = mix(p0, p1, 0, t1), a2 = mix(p1, p2, t1, t2), a3 = mix(p2, p3, t2, t3);
  return mix(mix(a1, a2, 0, t2), mix(a2, a3, t1, t3), t1, t2);
}

/** A curve through all the points: where it is at segment `i` (0 to points − 2), `t` (0 to 1) through it. */
function through(points: Vec3[], i: number, t: number): Vec3 {
  const at = (k: number): Vec3 => {
    if (k < 0) return points[0]!.map((v, j) => 2 * v - points[1]![j]!) as Vec3;
    if (k >= points.length) return points.at(-1)!.map((v, j) => 2 * v - points.at(-2)![j]!) as Vec3;
    return points[k]!;
  };
  return curve(at(i - 1), at(i), at(i + 1), at(i + 2), t);
}

const pointControls = Array.from({ length: PATH_POINTS }, (_, n) => {
  const i = n + 1;
  const group = `Point ${i}`;
  const lead = [[0, 3, 120], [0, 3, 50], [0, 10, 25], [0, 18, 12], [0, 18, 6], [0, 18, 3]][n]!;
  return [
    { kind: "number", id: `p${i}-x`, label: "x", group, min: -1000, max: 1000, step: 0.1, unit: "m", default: lead[0]! },
    { kind: "number", id: `p${i}-y`, label: "y", group, min: -50, max: 1000, step: 0.1, unit: "m", default: lead[1]! },
    { kind: "number", id: `p${i}-z`, label: "z", group, min: -1000, max: 1000, step: 0.1, unit: "m", default: lead[2]! },
    { kind: "number", id: `aim${i}-x`, label: "Aim x", group, min: -1000, max: 1000, step: 0.1, unit: "m", default: 0 },
    { kind: "number", id: `aim${i}-y`, label: "Aim y", group, min: -50, max: 1000, step: 0.1, unit: "m", default: 8 },
    { kind: "number", id: `aim${i}-z`, label: "Aim z", group, min: -1000, max: 1000, step: 0.1, unit: "m", default: 0 },
    { kind: "number", id: `lens${i}`, label: "Lens", group, min: 10, max: 300, step: 1, unit: "mm", default: 28 },
  ] as const;
}).flat();

/**
 * A camera that passes through points, 2 to 6, on one smooth curve (his note on the first camera shot: "the motion is
 * not smooth and continuous"): each point a place, an aim and a lens, the camera never stopping at one, its pace one
 * ease over the whole way. "Even speed" keeps the pace the same along the curve however far apart the points are;
 * "even points" gives each stretch between points the same time. The lens and the aim turn smoothly from point to
 * point, so a lens widening as it nears the last point is a zoom out while it arrives.
 */
const pathV1: CameraEntry = {
  kind: "camera",
  id: "path",
  label: "Path",
  version: 1,
  description: "Passes through 2 to 6 points on one smooth curve, each with an aim and a lens, never stopping between them.",
  controls: [
    { kind: "number", id: "points", label: "Points", group: "Way", min: 2, max: PATH_POINTS, step: 1, default: 4, help: "How many of the points it passes through, from Point 1." },
    { kind: "choice", id: "ease", label: "Ease", group: "Way", options: EASES, default: "ease in out", help: "One ease for the whole way: it gathers speed once and slows once." },
    { kind: "choice", id: "timing", label: "Timing", group: "Way", options: ["even speed", "even points"], default: "even speed" },
    ...pointControls,
  ],
  pose(values, u) {
    const count = Math.round(num(values, "points"));
    const read = (prefix: string) => Array.from({ length: count }, (_, n) => [0, 1, 2].map((k) => num(values, `${prefix}${n + 1}-${"xyz"[k]}`)) as Vec3);
    const places = read("p");
    const aims = read("aim");
    const lenses = Array.from({ length: count }, (_, n) => num(values, `lens${n + 1}`));
    const e = ease(str(values, "ease"), u);
    let segment: number, t: number;
    if (str(values, "timing") === "even points") {
      const along = e * (count - 1);
      segment = Math.min(count - 2, Math.floor(along));
      t = along - segment;
    } else {
      // Even speed: the distance along the curve is what the ease shares out.
      const steps = 48;
      const lengths: number[] = [0];
      let last = places[0]!;
      for (let i = 0; i < count - 1; i++)
        for (let k = 1; k <= steps; k++) {
          const next = through(places, i, k / steps);
          lengths.push(lengths.at(-1)! + Math.hypot(next[0] - last[0], next[1] - last[1], next[2] - last[2]));
          last = next;
        }
      const goal = e * lengths.at(-1)!;
      let at = lengths.findIndex((l) => l >= goal);
      if (at <= 0) at = 1;
      const within = (goal - lengths[at - 1]!) / Math.max(1e-6, lengths[at]! - lengths[at - 1]!);
      const sample = at - 1 + Math.min(1, Math.max(0, within));
      segment = Math.min(count - 2, Math.floor(sample / steps));
      t = sample / steps - segment;
    }
    const smooth = t * t * (3 - 2 * t);
    return {
      position: through(places, segment, t),
      target: through(aims, segment, t),
      lens: lerp(lenses[segment]!, lenses[segment + 1]!, smooth),
    };
  },
};

/** Each point's Look ahead (version 2): 0 looks at the point's aim, 1 along the way the camera is going. */
const aheadControls = Array.from({ length: PATH_POINTS }, (_, n) => ({
  kind: "number", id: `ahead${n + 1}`, label: "Look ahead", group: `Point ${n + 1}`, min: 0, max: 1, step: 0.01, default: 0,
  help: "0 looks at this point's aim; 1 looks where the camera is going, so climbing a slope it tilts with the slope.",
}) as const);

/**
 * Path, version 2 (his note on the second camera shot: "while moving up the mountain, the camera angle should also
 * follow the inclination of the mountain"): each point may look ahead, along the way the camera is going, instead of
 * at its aim, and anything between; climbing the face of a mountain on a path laid along it, the camera tilts with the
 * slope. Look ahead turns smoothly from point to point, as the lens does. Version 1, without it, is kept for the shots
 * made with it.
 */
const path: CameraEntry = {
  ...pathV1,
  version: 2,
  description: "Passes through 2 to 6 points on one smooth curve, each with an aim, a lens and how far it looks ahead along the way.",
  controls: [...pathV1.controls, ...aheadControls],
  pose(values, u, world, t) {
    const at = pathV1.pose(values, u, world, t);
    // Where it is going: a little further along the curve.
    const ahead = pathV1.pose(values, Math.min(1, u + 0.004), world, t).position;
    const back = pathV1.pose(values, Math.max(0, u - 0.004), world, t).position;
    const way = [ahead[0] - back[0], ahead[1] - back[1], ahead[2] - back[2]];
    const length = Math.hypot(way[0]!, way[1]!, way[2]!);
    if (length < 1e-6) return at;
    // How much this moment looks ahead: the points' values, turned smoothly from one to the next as the lens is.
    const count = Math.round(num(values, "points"));
    const aheads = Array.from({ length: count }, (_, n) => num(values, `ahead${n + 1}`));
    const near = nearestStretch(values, count, at.position);
    const smooth = near.t * near.t * (3 - 2 * near.t);
    const share = lerp(aheads[near.i]!, aheads[Math.min(count - 1, near.i + 1)]!, smooth);
    const reach = Math.hypot(at.target[0] - at.position[0], at.target[1] - at.position[1], at.target[2] - at.position[2]) || 10;
    const forward: Vec3 = [at.position[0] + (way[0]! / length) * reach, at.position[1] + (way[1]! / length) * reach, at.position[2] + (way[2]! / length) * reach];
    return { ...at, target: [0, 1, 2].map((k) => lerp(at.target[k]!, forward[k]!, share)) as Vec3 };
  },
};

/** Which stretch between points a place on the path is in, and how far through it (by the nearest of its samples). */
function nearestStretch(values: Values, count: number, place: Vec3) {
  const places = Array.from({ length: count }, (_, n) => [0, 1, 2].map((k) => num(values, `p${n + 1}-${"xyz"[k]}`)) as Vec3);
  let best = { i: 0, t: 0, d: Infinity };
  for (let i = 0; i < count - 1; i++)
    for (let k = 0; k <= 32; k++) {
      const p = through(places, i, k / 32);
      const d = Math.hypot(p[0] - place[0], p[1] - place[1], p[2] - place[2]);
      if (d < best.d) best = { i, t: k / 32, d };
    }
  return best;
}

/** One sun and the sky's light: a direction, a colour, a strength, and its shadows. */
const sun: LightEntry = {
  kind: "light",
  id: "sun",
  label: "Sun",
  version: 1,
  description: "One sun from a bearing and an elevation, with the sky's light filling the shadows.",
  controls: [
    { kind: "angle", id: "bearing", label: "Bearing", min: -180, max: 180, step: 1, default: -40 },
    { kind: "angle", id: "elevation", label: "Elevation", min: 1, max: 90, step: 1, default: 35 },
    { kind: "number", id: "strength", label: "Strength", min: 0, max: 20, step: 0.1, default: 3 },
    { kind: "colour", id: "colour", label: "Colour", default: "#fff1dc" },
    { kind: "number", id: "sky", label: "Sky light", min: 0, max: 5, step: 0.05, default: 1.4 },
    { kind: "colour", id: "sky-colour", label: "Sky colour", default: "#d6e4ff" },
    { kind: "colour", id: "ground-colour", label: "Ground colour", default: "#5a4a3c" },
    { kind: "switch", id: "shadows", label: "Shadows", default: true },
  ],
  build(values, world) {
    const group = new THREE.Group();
    const light = new THREE.DirectionalLight(str(values, "colour"), num(values, "strength"));
    const bearing = radians(num(values, "bearing"));
    const elevation = radians(num(values, "elevation"));
    const far = world.radius * 2.5;
    light.position.set(
      world.focus[0] + Math.sin(bearing) * Math.cos(elevation) * far,
      world.focus[1] + Math.sin(elevation) * far,
      world.focus[2] + Math.cos(bearing) * Math.cos(elevation) * far,
    );
    light.target.position.set(...world.focus);
    if (bool(values, "shadows")) {
      light.castShadow = true;
      light.shadow.mapSize.set(4096, 4096);
      const box = light.shadow.camera;
      box.left = box.bottom = -world.radius * 1.2;
      box.right = box.top = world.radius * 1.2;
      box.near = 0.5;
      box.far = far * 2;
      light.shadow.bias = -0.0004;
      light.shadow.normalBias = 0.02;
    }
    const sky = new THREE.HemisphereLight(str(values, "sky-colour"), str(values, "ground-colour"), num(values, "sky"));
    group.add(light, light.target, sky);
    return { object: group, dispose: () => light.shadow.map?.dispose() };
  },
};

export const STAND_INS: readonly Entry[] = [standIn, orbit, push, move, pathV1, path, sun];
