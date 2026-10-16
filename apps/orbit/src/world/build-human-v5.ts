import * as THREE from "three/webgpu";
import { bumpMap, color, float, Fn, mix, mx_noise_float, positionGeometry, reflectVector, smoothstep as smoothstepNode } from "three/tsl";
import { edgeTable, triTable } from "three/addons/objects/MarchingCubes.js";
import { HUMAN_JOINTS, type HumanPose, type JointId } from "@no-origins/ui/lib/human-motion";

import { boosting, lookOf, SKULL, TOE, UNIT, type Cut, type Head, type HumanConfig, type Look, type Part, type Piece } from "./human-v5";

/**
 * What makes the human (`human.ts`, World.md W51, W65, W66, W69): a real bone hierarchy from the design system's human
 * rig (`HUMAN_JOINTS`), each bone standing at its joint, scaled to the figure's height, and his look hung on it. Each
 * part the look names (`lookOf`) has an exact distance of its own kind (a slab cut out thick and rounded, a round bar,
 * a ball); a limb's parts are blended into each other smoothly, so a joint's swell is a swell, and the limbs and the
 * trunk are joined by a small fillet into one field, the ground cutting the feet flat, sampled on a grid stepped finer
 * through the figure than across it and meshed by marching cubes. Every vertex is then put back on the exact surface
 * and takes the field's gradient as its normal, so the facets of the grid never show. The surface is skinned to the
 * bones that carry each part, as the rig's own clothes were (`hiddenstack-rig.ts`), blending through the shoulders,
 * elbows, hips and knees, so the walk and the run move and bend it. The head is a ball on the head bone: a hollow
 * shell with a round opening on its front, a metal rim set into it and a glass lens doming out of it, his picture.
 * All one flat colour, with fine relief anchored to the skin, lit by the world's sun and sky and casting its shadow.
 * Shows: Skeleton draws the bones instead (version 1's rods and balls, `build-human-v1.ts`), to see what the look
 * hangs on.
 *
 * It stands on the ground at its origin, facing the rig's front, +z; the engine turns it to face its way.
 *
 * Frozen (World.md W102): version 5's builder, beside `human-v5.ts`; version 6 (`build-human.ts`) builds this look as
 * its Suit, and nothing draws this file.
 */
export type BuiltHuman = {
  object: THREE.Group;
  bones: Record<JointId, THREE.Bone>;
  skeleton: THREE.Skeleton;
  /** Poses every joint (degrees, the rig's) and lifts the hips by `lift` rig units: a stride's bounce. */
  pose(pose: HumanPose, lift: number): void;
};

/** The skeleton's thickness, in metres: version 1's start, bones 5 cm and joints 8 cm. */
const BONE = 0.025;
const JOINT = 0.04;

/**
 * The field's sample steps, in metres: across and up the figure, and through it. Through it the rounds are tight (the
 * arms', the body's edge), so it is stepped finer there; the other two carry the silhouette and are stepped as fine
 * as the build's budget allows. Past the budget of samples, every step grows alike, so the sliders' farthest settings
 * build in the same time as his.
 */
const STEP_ACROSS = 0.015;
const STEP_UP = 0.017;
const STEP_THROUGH = 0.014;
const SAMPLE_BUDGET = 1_200_000;
/** Air round the parts in the field, in metres, so the surface never meets the grid's edge. */
const PADDING = 0.05;
/** How far, in metres, two parts' distances may differ for a vertex of the trunk to be carried by both, so a join moves as one. */
const SHARE_REACH = 0.12;
/** The head's dish behind the lens, as a share of the opening's radius deep, and how dark it is, seen through the glass. */
const DISH = 0.45;
const INSIDE = "#5f6268";
/** How far, in metres, beyond a part's own extent its distance can still shape the surface: the widest fillet or blend, and a little. */
const REACH_AIR = 0.05;
/** How dark the inside of a booster's hole is, as a share of the figure's colour: near the rim's black. */
const HOLE_SHADE = 0.12;
/** How deep a booster's hole goes into the limb from its cut, as a multiple of the hole's radius, and the rim's matte black. */
const HOLE_BORE = 2;
const BOOSTER = { colour: "#141414", roughness: 0.95 };
/** How far a booster's rim is set into the limb above the cut, in metres, so it is anchored and its inner corners are hidden. */
const RIM_SEAT = 0.02;
/** The torch: how far its light reaches, in metres, and the brightness at which the visor's rim glows its full colour. */
const TORCH_REACH = 60;
const TORCH_GLOW = 300;
/** How far ahead of the lens the torch's light is thrown from, in metres, so the glass is never lit by its own torch. */
const TORCH_AHEAD = 0.05;
/** The boost: how far a foot's light reaches, in metres. */
const BOOST_REACH = 20;
/** The rims' metal and the lens's glass, their reflection a plain sky: grey at the ground, bright above. */
const RIM = { colour: "#cfc2a8", roughness: 0.2 };
const LENS = { tint: "#e4e8ec", roughness: 0.04, clarity: 0.92, ior: 1.5 };
const SKY = { low: "#9da2a9", high: "#ffffff" };

const smoothstep = (x: number, from: number, to: number) => {
  const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

export function buildHuman(config: HumanConfig): BuiltHuman {
  const object = new THREE.Group();
  object.name = "human";
  const look = config.shows === "skeleton" ? null : lookOf(config);
  // The skin's colour is the figure's; a vertex inside a booster's hole darkens it (`color`), so the holes read deep.
  const material = new THREE.MeshStandardNodeMaterial({ color: config.colour, roughness: 1, metalness: 0, vertexColors: true });
  // The reflection the metal and the glass wear: the sky above, the ground's grey below.
  const sky = Fn(() => mix(color(SKY.low), color(SKY.high), smoothstepNode(float(-0.2), float(0.7), reflectVector.y)))();
  const black = new THREE.MeshStandardNodeMaterial({ color: BOOSTER.colour, roughness: BOOSTER.roughness, metalness: 0, side: THREE.DoubleSide });
  // Fine, still relief gives the matte cream a dry clay finish. The rest-position coordinates travel with the skin;
  // this changes only the surface normal, never its paint or the world's light.
  if (look) {
    material.normalNode = bumpMap(
      mx_noise_float(positionGeometry.mul(180)).mul(0.0007)
        .add(mx_noise_float(positionGeometry.mul(420).add(17)).mul(0.00035)),
      float(1),
    );
  }

  // The bones, each where its joint is, from its parent's: the rig's units scaled to the figure's height.
  const bones = {} as Record<JointId, THREE.Bone>;
  const at = new Map(HUMAN_JOINTS.map((joint) => [joint.id, new THREE.Vector3(...joint.at).multiplyScalar(UNIT)]));
  if (look) {
    // The sketch's arms hang farther out and lower than the anatomical rig's, and are shorter and fuller. The arm's
    // pivot is its dome's centre, so a swing turns the dome in place and the arm about it; its elbow is where the
    // look swells, so the bend is in the swell; its hand is the arm's end. Skeleton keeps the rig as declared.
    const half = config.body / 200;
    for (const side of [-1, 1] as const) {
      const prefix = side === 1 ? "left" : "right";
      const arm = look.arms[prefix];
      at.get(`${prefix}Shoulder`)!.set(side * half * 0.7, arm.dome[1] + arm.radius / 2, 0);
      at.get(`${prefix}Arm`)!.set(arm.dome[0], arm.dome[1], 0);
      at.get(`${prefix}Elbow`)!.set(arm.elbow[0], arm.elbow[1], 0);
      at.get(`${prefix}Hand`)!.set(arm.end[0], arm.end[1], 0);
    }
  }
  for (const joint of HUMAN_JOINTS) {
    const bone = new THREE.Bone();
    bone.name = joint.id;
    bone.position.copy(at.get(joint.id)!);
    if (joint.parent) bone.position.sub(at.get(joint.parent)!);
    if (joint.parent) bones[joint.parent].add(bone);
    else object.add(bone);
    bones[joint.id] = bone;
  }
  // The skeleton takes its rest pose from the bones as they stand now: they must stand before it is made.
  object.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(HUMAN_JOINTS.map((joint) => bones[joint.id]));
  const index = new Map(HUMAN_JOINTS.map((joint, i) => [joint.id, i]));

  const mesh = <M extends THREE.Mesh>(made: M, name: string): M => {
    made.name = name;
    made.castShadow = true;
    made.receiveShadow = true;
    // A part at rest may stand outside its box once posed: this one figure is never worth culling.
    made.frustumCulled = false;
    return made;
  };

  /**
   * The pieces: each a closed surface of its own, a limb's on its bone, following it whole (a joint's ball turning about
   * its own centre keeps its shape, and pieces overlap rather than join, so no bend opens a seam); the trunk's skinned
   * to the chest, the spine and the hips by height, its influences blended where its parts meet.
   */
  const pieces = (look: Look) => {
    const boosts = boosting(config);
    const jet = boosts ? new THREE.MeshBasicNodeMaterial({ color: config.boostColour, side: THREE.DoubleSide }) : null;
    for (const piece of look.pieces) {
      const shapes = piece.parts.map(prepare);
      const geometry = sculptedGeometry(shapes, piece);
      if (piece.bone) {
        // The grid can put a sampled cut a fraction of a millimetre off its plane; the cut is exact.
        if (piece.cut) geometry.translate(0, piece.cut.y - geometry.boundingBox!.min.y, 0);
        const origin = at.get(piece.bone)!;
        geometry.translate(-origin.x, -origin.y, -origin.z);
        const bone = bones[piece.bone];
        bone.add(mesh(new THREE.Mesh(geometry, material), piece.name));
        // The booster's rim: a matte black ring round the hole, seated in the limb above the cut and standing out of
        // it by the Extrude, its corners rounded by the Curve; a foot stands on it.
        if (piece.cut && piece.cut.rim > 0) {
          const { hole, rim, extrude, curve } = piece.cut;
          const ring = mesh(new THREE.Mesh(new THREE.LatheGeometry(rimProfile(hole, hole + rim, -extrude, RIM_SEAT, curve).map(([r, y]) => new THREE.Vector2(r, y)), 64), black), `${piece.name} rim`);
          ring.position.set(piece.cut.x - origin.x, piece.cut.y - origin.y, -origin.z);
          bone.add(ring);
        }
        // The boost: from a foot's nozzle alone, a jet of one flat colour narrowing away from it, and its light.
        if (jet && piece.cut && piece.bone.endsWith("Knee")) {
          const { hole, rim, extrude } = piece.cut;
          const mouth = piece.cut.y - extrude;
          const flame = new THREE.Mesh(new THREE.ConeGeometry(hole + rim, config.boostLength, 32, 1, true), jet);
          flame.name = `${piece.name} boost`;
          flame.rotation.x = Math.PI;
          flame.position.set(piece.cut.x - origin.x, mouth - config.boostLength / 2 - origin.y, -origin.z);
          flame.frustumCulled = false;
          bone.add(flame);
          const glow = new THREE.PointLight(config.boostColour, config.boostBrightness, BOOST_REACH, 2);
          glow.name = `${piece.name} boost light`;
          glow.position.set(piece.cut.x - origin.x, mouth - 0.05 - origin.y, -origin.z);
          bone.add(glow);
        }
        continue;
      }
      const positions = geometry.getAttribute("position");
      const joints: number[] = [];
      const weights: number[] = [];
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        const distances = shapes.map((shape) => distanceAt(shape, x, y, z));
        const nearest = Math.min(...distances);
        const influence = new Map<JointId, number>();
        for (let j = 0; j < piece.parts.length; j++) {
          // A compact blend carries a join together as the trunk twists and sways; every point uses the same rule.
          const share = Math.max(0, 1 - (distances[j]! - nearest) / SHARE_REACH) ** 2;
          if (share === 0) continue;
          const [a, b, amount] = piece.parts[j]!.carried(x, y);
          influence.set(a, (influence.get(a) ?? 0) + amount * share);
          influence.set(b, (influence.get(b) ?? 0) + (1 - amount) * share);
        }
        const strongest = [...influence].sort((a, b) => b[1] - a[1]).slice(0, 4);
        const total = strongest.reduce((sum, [, weight]) => sum + weight, 0);
        for (let j = 0; j < 4; j++) {
          const carried = strongest[j];
          joints.push(carried ? index.get(carried[0])! : 0);
          weights.push(carried ? carried[1] / total : 0);
        }
      }
      geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(joints, 4));
      geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
      const made = mesh(new THREE.SkinnedMesh(geometry, material), piece.name);
      object.add(made);
      made.bind(skeleton, new THREE.Matrix4());
    }
  };

  /** Version 1's skeleton: a rod from every joint to its parent's, a ball at every joint, an egg for the skull, the feet. */
  const drawSkeleton = () => {
    const ball = new THREE.SphereGeometry(1, 20, 14);
    const up = new THREE.Vector3(0, 1, 0);
    const rod = (parent: THREE.Object3D, to: THREE.Vector3, name: string) => {
      const length = to.length();
      if (length < 1e-6) return;
      const made = mesh(new THREE.Mesh(new THREE.CapsuleGeometry(BONE, length, 4, 12), material), name);
      made.position.copy(to).multiplyScalar(0.5);
      made.quaternion.setFromUnitVectors(up, to.clone().normalize());
      parent.add(made);
    };
    const dot = (parent: THREE.Object3D, at: THREE.Vector3, radius: number, name: string) => {
      const made = mesh(new THREE.Mesh(ball, material), name);
      made.position.copy(at);
      made.scale.setScalar(radius);
      parent.add(made);
    };
    for (const joint of HUMAN_JOINTS) {
      const bone = bones[joint.id];
      dot(bone, new THREE.Vector3(), JOINT, `${joint.id} joint`);
      if (joint.parent) rod(bones[joint.parent], bone.position, `${joint.parent} to ${joint.id}`);
      if (joint.id.endsWith("Foot")) {
        const toe = new THREE.Vector3(TOE[0], TOE[1], TOE[2]).multiplyScalar(UNIT);
        rod(bone, toe, `${joint.id} sole`);
        dot(bone, toe, BONE, `${joint.id} toe`);
      }
    }
    const skull = mesh(new THREE.Mesh(ball, material), "skull");
    skull.position.set(0, SKULL.above * UNIT, 0);
    skull.scale.set(SKULL.radii[0] * UNIT, SKULL.radii[1] * UNIT, SKULL.radii[2] * UNIT);
    bones.head.add(skull);
  };

  if (!look) drawSkeleton();
  else {
    if (config.shows !== "head") pieces(look);
    // The head rides the head bone: its ball's centre is the look's, from the joint.
    const head = headOf(look.head, config, material, sky, mesh);
    head.position.set(0, look.head.centre[1] - at.get("head")!.y, 0);
    bones.head.add(head);
  }
  object.updateMatrixWorld(true);

  const hips = HUMAN_JOINTS[0]!.at[1] * UNIT;
  return {
    object,
    bones,
    skeleton,
    pose(pose, lift) {
      for (const { id } of HUMAN_JOINTS) {
        const [x, y, z] = pose[id] ?? [0, 0, 0];
        bones[id].rotation.set(THREE.MathUtils.degToRad(x), THREE.MathUtils.degToRad(y), THREE.MathUtils.degToRad(z));
      }
      bones.hips.position.y = hips + lift * UNIT;
      object.updateMatrixWorld(true);
    },
  };
}

/**
 * The head: a ball turned on the axis of its visor, facing the rig's front. Its shell is hollow with a round opening,
 * so the lens shows a dark inside, as his picture's does; the rim is a flattened ring set into the opening; the lens
 * is a cap of a wider sphere, resting on the rim and doming out by the Bulge. The rim's metal and the lens's glass
 * reflect a plain sky, since the world's reflections are painted, not rendered (W50).
 */
function headOf(head: Head, config: HumanConfig, skin: THREE.Material, sky: THREE.Node, mesh: <M extends THREE.Mesh>(made: M, name: string) => M): THREE.Group {
  const group = new THREE.Group();
  group.name = "head";
  const R = head.radius;
  const { radius: lens, plane, bulge, rim } = head.visor;
  const opening = lens + rim;
  // A profile is turned about the lathe's up, which is then laid along the front: (across, along) pairs.
  const turned = (profile: [number, number][], material: THREE.Material, name: string, shadow = true) => {
    const geometry = new THREE.LatheGeometry(profile.map(([r, a]) => new THREE.Vector2(r, a)), 96);
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(geometry.getAttribute("position").count * 3).fill(1), 3));
    const made = mesh(new THREE.Mesh(geometry, material), name);
    made.rotation.x = Math.PI / 2;
    made.castShadow = shadow;
    return made;
  };
  const arc = (radius: number, from: number, to: number, steps: number): [number, number][] =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const angle = from + ((to - from) * i) / steps;
      return [radius * Math.sin(angle), -radius * Math.cos(angle)];
    });
  // The shell: the ball from its back pole round to the opening's edge, which sits on the rim's plane, set in, and a
  // flat lip in to the rim. Behind the lens is a dark dish, a cap of a wide sphere, so the glass shows a hollow and
  // never the neck inside the ball; its face is its outside alone, so the visitor's eye at the ball's centre looks
  // out through it unseen.
  const edge = Math.acos(-Math.min(1, Math.max(-1, plane / R)));
  const outer = arc(R, 0, edge, 48);
  outer.push([opening + rim * 0.5, plane]);
  group.add(turned(outer, skin, "head shell"));
  // The shell's inside (World.md W79; his: "I should also be able to see the body around the rim in the head"): the
  // same surface seen from within, in its own material, so the eye at the ball's centre sees the head round the visor.
  // The visor is set into the ball by its Inset, so the ball ends a little outside the rim; from within, its lip runs
  // in from the ball's edge to under the rim, closing that ring. From outside it is always behind the shell. It
  // neither casts nor takes a shadow (inside a closed ball it would be all shade); the engine shows it in the helmet
  // alone and gives it the Camera's Visor view colour and light.
  const inner: [number, number][] = [...arc(R, 0, edge, 48), [Math.max(0, opening - rim * 0.25), plane]];
  const lining = turned(inner, new THREE.MeshStandardNodeMaterial({ color: "#ffffff", roughness: 1, metalness: 0, side: THREE.BackSide }), "head lining", false);
  lining.receiveShadow = false;
  lining.visible = false;
  group.add(lining);
  const insideMaterial = new THREE.MeshStandardNodeMaterial({ color: INSIDE, roughness: 0.9, metalness: 0, side: THREE.FrontSide });
  const dishRim = opening - rim * 0.5;
  const dishDepth = Math.max(0.01, opening * DISH);
  const dishRadius = (dishRim * dishRim + dishDepth * dishDepth) / (2 * dishDepth);
  const dishSpread = Math.asin(Math.min(1, dishRim / dishRadius));
  const dish: [number, number][] = Array.from({ length: 25 }, (_, i) => {
    const angle = (dishSpread * i) / 24;
    return [dishRadius * Math.sin(angle), plane - dishDepth + dishRadius - dishRadius * Math.cos(angle)];
  });
  group.add(turned(dish.reverse(), insideMaterial, "head inside", false));
  // The rim: a flattened ring in the opening, its section a stadium, standing a little proud of the shell. It is the
  // torch (his): lit, it glows the torch's colour, and a spot of that colour is thrown ahead from the visor's plane.
  const lit = config.torch === "on" && config.torchBrightness > 0;
  const metal = new THREE.MeshStandardNodeMaterial({
    color: RIM.colour, roughness: RIM.roughness, metalness: 1,
    emissive: lit ? config.torchColour : "#000000", emissiveIntensity: lit ? Math.min(3, config.torchBrightness / TORCH_GLOW) : 0,
  });
  metal.envNode = sky;
  if (rim > 0) {
    const ring: [number, number][] = [];
    const half = rim * 0.35;
    for (let i = 0; i <= 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      ring.push([lens + rim / 2 + (rim / 2) * Math.cos(angle), plane + half * Math.sin(angle)]);
    }
    group.add(turned(ring, metal, "visor rim"));
  }
  if (lit) {
    const torch = new THREE.SpotLight(config.torchColour, config.torchBrightness, TORCH_REACH, (config.torchSpread / 2) * (Math.PI / 180), 0.5, 2);
    torch.name = "torch";
    torch.position.set(0, 0, plane + Math.max(bulge, 0.004) + TORCH_AHEAD);
    torch.target.position.set(0, 0, plane + 2);
    group.add(torch, torch.target);
  }
  // The lens: a cap of the sphere through the rim's inner edge and the bulge's apex; flat, a disc.
  const apex = plane + Math.max(bulge, 0.004);
  const capRadius = (lens * lens + (apex - plane) ** 2) / (2 * (apex - plane));
  const capCentre = apex - capRadius;
  const spread = Math.asin(Math.min(1, lens / capRadius));
  const cap: [number, number][] = Array.from({ length: 33 }, (_, i) => {
    const angle = (spread * i) / 32;
    return [capRadius * Math.sin(angle), capCentre + capRadius * Math.cos(angle)];
  });
  cap.reverse();
  // Its outside face alone, as the dish's, so the visitor's eye at the ball's centre sees the world with nothing drawn
  // between (World.md W69, his: the view should be clear). The world's glass is drawn by sampling the picture behind
  // it, which lifts it toward the sky it reflects, tints it, blurs it (the sample is bicubic, soft even at full size)
  // and refracts it, and no setting of the glass makes that sample the picture itself.
  const glass = new THREE.MeshPhysicalNodeMaterial({ color: LENS.tint, roughness: LENS.roughness, metalness: 0, transmission: LENS.clarity, ior: LENS.ior, thickness: 0.05, attenuationColor: LENS.tint, attenuationDistance: 2 });
  glass.envNode = sky;
  glass.envMapIntensity = 1.5;
  group.add(turned(cap, glass, "visor lens", false));
  return group;
}

/** A part prepared for its distance: its extent across and up (`bounds`) and through (`zHalf`), and its numbers laid out. */
type Shape =
  | {
      kind: "slab";
      part: Part;
      /** The polygon's edges drawn in by its round (so the round can be put back exactly), five numbers an edge. */
      segments: Float64Array;
      round: number;
      halfDepth: number;
      bevel: number;
      centre: [number, number];
      inverseRadius: [number, number];
      fullness: number;
      bounds: [number, number, number, number];
      zHalf: number;
    }
  | { kind: "bar"; part: Part; ax: number; ay: number; bx: number; by: number; r1: number; r2: number; bounds: [number, number, number, number]; zHalf: number }
  | { kind: "ball"; part: Part; x: number; y: number; radius: number; bounds: [number, number, number, number]; zHalf: number };

function prepare(part: Part): Shape {
  if (part.kind === "slab") {
    const n = part.polygon.length;
    const xs = part.polygon.map(([x]) => x);
    const ys = part.polygon.map(([, y]) => y);
    const bounds: [number, number, number, number] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const bevel = Math.max(0, Math.min(part.edge, part.depth * 0.49));
    // Each corner moves in along the bisector of its edges' inward normals, so that the drawn-in polygon put back
    // out by the round is exactly the rounded outline, and its distance is exact everywhere.
    const normals = part.polygon.map(([x, y], i) => {
      const [nx, ny] = part.polygon[(i + 1) % n]!;
      const length = Math.hypot(nx - x, ny - y) || 1;
      return [-(ny - y) / length, (nx - x) / length] as const;
    });
    const inset = part.polygon.map(([x, y], i) => {
      const [ax, ay] = normals[(i + n - 1) % n]!;
      const [bx, by] = normals[i]!;
      const scale = part.round / (1 + ax * bx + ay * by);
      return [x + (ax + bx) * scale, y + (ay + by) * scale] as const;
    });
    const segments = new Float64Array(n * 5);
    for (let i = 0; i < n; i++) {
      const [ax, ay] = inset[i]!;
      const [bx, by] = inset[(i + 1) % n]!;
      const ex = bx - ax;
      const ey = by - ay;
      segments.set([ax, ay, ex, ey, 1 / (ex * ex + ey * ey || 1)], i * 5);
    }
    return {
      kind: "slab",
      part,
      segments,
      round: part.round,
      halfDepth: part.depth / 2,
      bevel,
      centre: [(bounds[0] + bounds[1]) / 2, (bounds[2] + bounds[3]) / 2],
      inverseRadius: [2 / (bounds[1] - bounds[0]), 2 / (bounds[3] - bounds[2])],
      // The faces dome into their edges without swelling past the part's depth; a thin part has little flat to dome.
      fullness: Math.min(part.dome, (part.depth / 2 - bevel) * 0.45 + part.dome * 0.5),
      bounds,
      zHalf: part.depth / 2,
    };
  }
  if (part.kind === "bar") {
    const [r1, r2] = part.radii;
    const [ax, ay] = part.from;
    const [bx, by] = part.to;
    return {
      kind: "bar",
      part,
      ax,
      ay,
      bx,
      by,
      r1,
      r2,
      bounds: [Math.min(ax - r1, bx - r2), Math.max(ax + r1, bx + r2), Math.min(ay - r1, by - r2), Math.max(ay + r1, by + r2)],
      zHalf: Math.max(r1, r2),
    };
  }
  const [x, y] = part.at;
  return { kind: "ball", part, x, y, radius: part.radius, bounds: [x - part.radius, x + part.radius, y - part.radius, y + part.radius], zHalf: part.radius };
}

/** Signed distance to a slab's drawn-in polygon in the front plane: negative inside. */
function planarDistance(shape: Extract<Shape, { kind: "slab" }>, x: number, y: number): number {
  let squared = Infinity;
  let inside = false;
  const segments = shape.segments;
  for (let i = 0; i < segments.length; i += 5) {
    const ax = segments[i]!;
    const ay = segments[i + 1]!;
    const ex = segments[i + 2]!;
    const ey = segments[i + 3]!;
    const px = x - ax;
    const py = y - ay;
    if ((ay > y) !== (ay + ey > y) && x < ax + (ex * py) / ey) inside = !inside;
    const amount = Math.max(0, Math.min(1, (px * ex + py * ey) * segments[i + 4]!));
    const dx = px - amount * ex;
    const dy = py - amount * ey;
    squared = Math.min(squared, dx * dx + dy * dy);
  }
  return Math.sqrt(squared) * (inside ? -1 : 1) - shape.round;
}

/** A cut-out's exact distance: the rounded box of its planar distance and its depth, rounding inward so the silhouette and the depth are its actual extents. */
function roundedDistance(planar: number, z: number, halfDepth: number, bevel: number, dome: number): number {
  const across = planar + bevel;
  const through = Math.abs(z) - halfDepth + bevel + dome;
  return Math.hypot(Math.max(across, 0), Math.max(through, 0)) + Math.min(Math.max(across, through), 0) - bevel;
}

function domeAt(shape: Extract<Shape, { kind: "slab" }>, x: number, y: number): number {
  const across = (x - shape.centre[0]) * shape.inverseRadius[0];
  const up = (y - shape.centre[1]) * shape.inverseRadius[1];
  return shape.fullness * Math.min(2, across * across + up * up);
}

/** Exact distance to a round bar between two balls in the front plane, its radius changing evenly between theirs. */
function barDistance(shape: Extract<Shape, { kind: "bar" }>, x: number, y: number, z: number): number {
  const bax = shape.bx - shape.ax;
  const bay = shape.by - shape.ay;
  const l2 = bax * bax + bay * bay;
  const rr = shape.r1 - shape.r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const pax = x - shape.ax;
  const pay = y - shape.ay;
  const along = pax * bax + pay * bay;
  const past = along - l2;
  const vx = pax * l2 - bax * along;
  const vy = pay * l2 - bay * along;
  const vz = z * l2;
  const x2 = vx * vx + vy * vy + vz * vz;
  const y2 = along * along * l2;
  const z2 = past * past * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(past) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - shape.r2;
  if (Math.sign(along) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - shape.r1;
  return (Math.sqrt(x2 * a2 * il2) + along * rr) * il2 - shape.r1;
}

const ballDistance = (shape: Extract<Shape, { kind: "ball" }>, x: number, y: number, z: number) => Math.hypot(x - shape.x, y - shape.y, z) - shape.radius;

const distanceAt = (shape: Shape, x: number, y: number, z: number) =>
  shape.kind === "slab"
    ? roundedDistance(planarDistance(shape, x, y), z, shape.halfDepth, shape.bevel, domeAt(shape, x, y))
    : shape.kind === "bar"
      ? barDistance(shape, x, y, z)
      : ballDistance(shape, x, y, z);

/** A rounded union: two volumes meet in a fillet of this radius; none, and they simply meet. */
function joinedDistance(a: number, b: number, radius: number): number {
  if (radius <= 0 || a === Infinity || b === Infinity) return Math.min(a, b);
  const overlap = Math.max(radius - Math.abs(a - b), 0) / radius;
  return Math.min(a, b) - overlap * overlap * radius * 0.25;
}

/** A rounded intersection: what is left of `a` above the cut `b`, the cut's edge rounded by this radius. */
function cutDistance(a: number, b: number, radius: number): number {
  if (radius <= 0) return Math.max(a, b);
  const h = Math.min(1, Math.max(0, 0.5 - (0.5 * (b - a)) / radius));
  return b + (a - b) * h + radius * h * (1 - h);
}

/** The hole of a booster: a round shaft up into the limb from the cut, open a little below it so the cut opens cleanly; negative inside. */
function holeDistance(cut: Cut, x: number, y: number, z: number): number {
  const depth = cut.hole * HOLE_BORE;
  const across = Math.hypot(x - cut.x, z) - cut.hole;
  const along = Math.abs(y - (cut.y + depth / 2 - HOLE_OPEN / 2)) - (depth + HOLE_OPEN) / 2;
  return Math.hypot(Math.max(across, 0), Math.max(along, 0)) + Math.min(Math.max(across, along), 0);
}
/** How far a hole opens below its cut, in metres. */
const HOLE_OPEN = 0.03;

/**
 * A rim's section, turned about the hole's axis: a rectangle from the hole's radius `r0` out to `r1`, from `y0` (out
 * of the cut) up to `y1` (seated in the limb), its corners rounded by `curve`: none, a square edge. Round it from the
 * top of the inner wall, down, out along the end, up the outer wall and back.
 */
function rimProfile(r0: number, r1: number, y0: number, y1: number, curve: number): [number, number][] {
  const c = Math.min(curve, (r1 - r0) / 2, (y1 - y0) / 2);
  const arc = (cx: number, cy: number, from: number, to: number): [number, number][] =>
    Array.from({ length: c > 0 ? 7 : 1 }, (_, i) => {
      const angle = c > 0 ? from + ((to - from) * i) / 6 : from;
      return [cx + c * Math.cos(angle), cy + c * Math.sin(angle)];
    });
  const profile = [
    ...arc(r0 + c, y1 - c, Math.PI / 2, Math.PI),
    ...arc(r0 + c, y0 + c, Math.PI, Math.PI * 1.5),
    ...arc(r1 - c, y0 + c, Math.PI * 1.5, Math.PI * 2),
    ...arc(r1 - c, y1 - c, 0, Math.PI / 2),
  ];
  return [...profile, profile[0]!];
}

/** A piece ending in a booster: cut flat, its edge rounded, and its hole taken out. */
function boosted(distance: number, cut: Cut | undefined, x: number, y: number, z: number): number {
  if (!cut) return distance;
  return Math.max(cutDistance(distance, cut.y - y, cut.edge), -holeDistance(cut, x, y, z));
}

/** A cube's corners and its edges, in the marching cubes tables' order (Bourke's, as three.js's `MarchingCubes`). */
const CORNER = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] as const;
const EDGE = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]] as const;

/**
 * Samples one piece's bounded field only when the configuration changes, stepped per axis, and meshes it: the field's
 * zero crossing on each grid edge is a vertex shared by the cells round it, so the skin is closed and welded as it is
 * made. The vertices are then put back on the exact surface with its gradient as their normal.
 */
function sculptedGeometry(shapes: Shape[], piece: Piece): THREE.BufferGeometry {
  const min = new THREE.Vector3(
    Math.min(...shapes.map((shape) => shape.bounds[0])) - PADDING,
    Math.min(piece.cut ? piece.cut.y : Infinity, ...shapes.map((shape) => shape.bounds[2])) - PADDING,
    -Math.max(...shapes.map((shape) => shape.zHalf)) - PADDING,
  );
  const max = new THREE.Vector3(
    Math.max(...shapes.map((shape) => shape.bounds[1])) + PADDING,
    Math.max(...shapes.map((shape) => shape.bounds[3])) + PADDING,
    Math.max(...shapes.map((shape) => shape.zHalf)) + PADDING,
  );
  const grow = Math.max(1, Math.cbrt(((max.x - min.x) / STEP_ACROSS) * ((max.y - min.y) / STEP_UP) * ((max.z - min.z) / STEP_THROUGH) / SAMPLE_BUDGET));
  const nx = Math.ceil((max.x - min.x) / (STEP_ACROSS * grow)) + 1;
  const ny = Math.ceil((max.y - min.y) / (STEP_UP * grow)) + 1;
  const nz = Math.ceil((max.z - min.z) / (STEP_THROUGH * grow)) + 1;
  const step = new THREE.Vector3((max.x - min.x) / (nx - 1), (max.y - min.y) / (ny - 1), (max.z - min.z) / (nz - 1));

  // The piece's parts blend over its blend. In the trunk, two parts meeting are a crease, except round each arm's
  // dome, where the shoulder's slope, the body's corner and the dome flow into one shoulder, and no lower, so the
  // groove under it stays open.
  const domes = shapes.filter((shape): shape is Extract<Shape, { kind: "ball" }> => shape.kind === "ball" && shape.part.name.endsWith("arm dome") && !piece.bone);
  const blendAt = (x: number, y: number) => {
    let blend = piece.blend;
    for (const dome of domes) {
      const away = Math.hypot(x - dome.x, y - dome.y);
      blend = Math.max(blend, THREE.MathUtils.lerp(piece.blend, dome.radius / 2, smoothstep(away, 1.4 * dome.radius, 0.8 * dome.radius)));
    }
    return blend;
  };
  const cut = (distance: number, x: number, y: number, z: number) => boosted(distance, piece.cut, x, y, z);
  // Only the parts within reach of a column shape its samples: a far part's distance can only be the larger, so it is
  // left out, which is what makes a figure of many parts affordable.
  const reach = Math.max(piece.blend, ...domes.map((dome) => dome.radius / 2)) + REACH_AIR;
  const near = new Uint8Array(nx * ny * shapes.length);
  const nearAt = (x: number, y: number) => {
    const i = Math.min(nx - 1, Math.max(0, Math.round((x - min.x) / step.x)));
    const j = Math.min(ny - 1, Math.max(0, Math.round((y - min.y) / step.y)));
    return (j * nx + i) * shapes.length;
  };
  const exactDistance = (x: number, y: number, z: number) => {
    const at = nearAt(x, y);
    const blend = blendAt(x, y);
    let distance = Infinity;
    for (let s = 0; s < shapes.length; s++) {
      if (!near[at + s]) continue;
      distance = joinedDistance(distance, distanceAt(shapes[s]!, x, y, z), blend);
    }
    return cut(distance, x, y, z);
  };

  // The slabs' planar distances and domes, and the blend, depend only on the column: cached once a column, not once
  // a sample.
  const slabs = shapes.map((shape) => (shape.kind === "slab" ? shape : null));
  const planar = slabs.map((shape) => (shape ? new Float32Array(nx * ny) : null));
  const domed = slabs.map((shape) => (shape ? new Float32Array(nx * ny) : null));
  const blends = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    const y = min.y + j * step.y;
    for (let i = 0; i < nx; i++) {
      const x = min.x + i * step.x;
      blends[j * nx + i] = blendAt(x, y);
      for (let s = 0; s < shapes.length; s++) {
        const bounds = shapes[s]!.bounds;
        near[(j * nx + i) * shapes.length + s] = x >= bounds[0] - reach && x <= bounds[1] + reach && y >= bounds[2] - reach && y <= bounds[3] + reach ? 1 : 0;
        const slab = slabs[s];
        if (!slab) continue;
        planar[s]![j * nx + i] = planarDistance(slab, x, y);
        domed[s]![j * nx + i] = domeAt(slab, x, y);
      }
    }
  }
  const field = new Float32Array(nx * ny * nz);
  for (let k = 0; k < nz; k++) {
    const z = min.z + k * step.z;
    for (let j = 0; j < ny; j++) {
      const y = min.y + j * step.y;
      for (let i = 0; i < nx; i++) {
        const x = min.x + i * step.x;
        const column = j * nx + i;
        const at = column * shapes.length;
        const blend = blends[column]!;
        let distance = Infinity;
        for (let s = 0; s < shapes.length; s++) {
          if (!near[at + s]) continue;
          const shape = shapes[s]!;
          const part = shape.kind === "slab"
            ? roundedDistance(planar[s]![column]!, z, shape.halfDepth, shape.bevel, domed[s]![column]!)
            : shape.kind === "bar"
              ? barDistance(shape, x, y, z)
              : ballDistance(shape, x, y, z);
          distance = joinedDistance(distance, part, blend);
        }
        field[(k * ny + j) * nx + i] = cut(distance, x, y, z);
      }
    }
  }

  // Marching cubes over the field, a vertex a crossed grid edge, remembered by the edge so neighbouring cells share it.
  const positions: number[] = [];
  const triangles: number[] = [];
  const cache = [new Int32Array(nx * ny * nz).fill(-1), new Int32Array(nx * ny * nz).fill(-1), new Int32Array(nx * ny * nz).fill(-1)];
  const vertexOn = (axis: number, i: number, j: number, k: number) => {
    const at = (k * ny + j) * nx + i;
    const known = cache[axis]![at]!;
    if (known >= 0) return known;
    const next = axis === 0 ? at + 1 : axis === 1 ? at + nx : at + nx * ny;
    const a = field[at]!;
    const b = field[next]!;
    const t = a / (a - b);
    positions.push(min.x + (i + (axis === 0 ? t : 0)) * step.x, min.y + (j + (axis === 1 ? t : 0)) * step.y, min.z + (k + (axis === 2 ? t : 0)) * step.z);
    const made = positions.length / 3 - 1;
    cache[axis]![at] = made;
    return made;
  };
  const edgeVertex = new Int32Array(12);
  for (let k = 0; k < nz - 1; k++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        let cube = 0;
        for (let c = 0; c < 8; c++) {
          const [dx, dy, dz] = CORNER[c]!;
          if (field[((k + dz) * ny + j + dy) * nx + i + dx]! > 0) cube |= 1 << c;
        }
        const edges = edgeTable[cube]!;
        if (edges === 0) continue;
        for (let e = 0; e < 12; e++) {
          if (!(edges & (1 << e))) continue;
          const [from, to] = EDGE[e]!;
          const [ax, ay, az] = CORNER[from]!;
          const [bx, by, bz] = CORNER[to]!;
          // The edge runs along the one axis its two corners differ in, from the lower corner.
          const axis = ax !== bx ? 0 : ay !== by ? 1 : 2;
          edgeVertex[e] = vertexOn(axis, i + Math.min(ax, bx), j + Math.min(ay, by), k + Math.min(az, bz));
        }
        for (let t = cube * 16; triTable[t]! !== -1; t += 3) {
          const a = edgeVertex[triTable[t]!]!;
          const b = edgeVertex[triTable[t + 1]!]!;
          const c = edgeVertex[triTable[t + 2]!]!;
          // A crossing exactly on a grid point gives a collapsed triangle: left out, so no edge is repeated.
          if (a !== b && b !== c && c !== a) triangles.push(a, b, c);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  const surfacePoints = new THREE.BufferAttribute(new Float32Array(positions), 3);
  const surfaceNormals = new THREE.BufferAttribute(new Float32Array(positions.length), 3);
  const epsilon = 0.004;
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  for (let i = 0; i < surfacePoints.count; i++) {
    point.fromBufferAttribute(surfacePoints, i);
    // The grid only supplies connectivity. The gradient here is the exact surface's; the point is put back onto it
    // along the gradient, twice, since the first step from an interpolated crossing is only nearly there.
    for (let pass = 0; pass < 2; pass++) {
      const x = point.x;
      const y = point.y;
      const z = point.z;
      normal.set(
        (exactDistance(x + epsilon, y, z) - exactDistance(x - epsilon, y, z)) / (2 * epsilon),
        (exactDistance(x, y + epsilon, z) - exactDistance(x, y - epsilon, z)) / (2 * epsilon),
        (exactDistance(x, y, z + epsilon) - exactDistance(x, y, z - epsilon)) / (2 * epsilon),
      );
      const length = normal.length();
      normal.multiplyScalar(1 / Math.max(length, 1e-9));
      point.addScaledVector(normal, -exactDistance(x, y, z) / Math.max(length, 0.5));
    }
    surfacePoints.setXYZ(i, point.x, point.y, point.z);
    surfaceNormals.setXYZ(i, normal.x, normal.y, normal.z);
  }
  // The tables' winding is for a field that grows inward; this one is a distance, so each triangle faces its normals.
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let t = 0; t < triangles.length; t += 3) {
    a.fromBufferAttribute(surfacePoints, triangles[t]!);
    b.fromBufferAttribute(surfacePoints, triangles[t + 1]!).sub(a);
    c.fromBufferAttribute(surfacePoints, triangles[t + 2]!).sub(a);
    normal.fromBufferAttribute(surfaceNormals, triangles[t]!);
    if (b.cross(c).dot(normal) < 0) {
      const swap = triangles[t + 1]!;
      triangles[t + 1] = triangles[t + 2]!;
      triangles[t + 2] = swap;
    }
  }
  // A vertex that lies on the hole's wall or floor is inside it: the skin there is darkened.
  const colours = new Float32Array(positions.length).fill(1);
  if (piece.cut) {
    for (let i = 0; i < surfacePoints.count; i++) {
      if (holeDistance(piece.cut, surfacePoints.getX(i), surfacePoints.getY(i), surfacePoints.getZ(i)) < 0.002) colours.fill(HOLE_SHADE, i * 3, i * 3 + 3);
    }
  }
  geometry.setAttribute("position", surfacePoints);
  geometry.setAttribute("normal", surfaceNormals);
  geometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  geometry.setIndex(triangles);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
