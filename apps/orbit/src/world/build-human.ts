import * as THREE from "three/webgpu";
import { bumpMap, color, float, Fn, mix, modelViewMatrix, mx_noise_float, normalize, normalView, positionGeometry, reflectVector, smoothstep as smoothstepNode, vec4 } from "three/tsl";
import { edgeTable, triTable } from "three/addons/objects/MarchingCubes.js";
import { HUMAN_JOINTS, type HumanPose, type JointId } from "@no-origins/ui/lib/human-motion";

import { boosting, lookOf, SKULL, TOE, UNIT, type Cut, type Head, type HumanConfig, type Look, type Part, type Piece } from "./human";
import { clayGrain, clayPaint, claySkin, fairClayWeights } from "./clay-skin";
import { buildHumanFlight } from "./build-human-flight";
import { readClayFlightMotion, type ClayFlightFrame } from "./human-flight";

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
 * Version 9 (World.md W104, W107) builds two forms: the Suit, as version 5 did (`build-human-v5.ts`, frozen), and the Clay,
 * his turnaround's figure, whose pieces are lofts (a soft column whose front and side outlines are the turnaround's,
 * row by row), one connected skin bound with its arms open. Rotation-preserving deformation and local fairing
 * keep posed shoulders and hips smooth; its head is a piece of its own on the head bone, held in a group at
 * its middle, where the visitor's eye is. Clay's hover, jet boost and glide effects follow its posed feet and hips.
 */
export type BuiltHuman = {
  object: THREE.Group;
  bones: Record<JointId, THREE.Bone>;
  skeleton: THREE.Skeleton;
  /** Poses every joint (degrees, the rig's) and lifts the hips by `lift` rig units: a stride's bounce. */
  pose(pose: HumanPose, lift: number): void;
  /** Clay's airborne effects follow the posed soles and hips. Null clears them. */
  flight(frame: ClayFlightFrame | null): void;
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
  const material = look?.eye
    ? new THREE.MeshPhysicalNodeMaterial({ color: config.colour, roughness: 1, metalness: 0, vertexColors: true, sheen: 0.16, sheenColor: "#fff0de", sheenRoughness: 1, specularIntensity: 0.18 })
    : new THREE.MeshStandardNodeMaterial({ color: config.colour, roughness: 1, metalness: 0, vertexColors: true });
  // The reflection the metal and the glass wear: the sky above, the ground's grey below.
  const sky = Fn(() => mix(color(SKY.low), color(SKY.high), smoothstepNode(float(-0.2), float(0.7), reflectVector.y)))();
  const black = new THREE.MeshStandardNodeMaterial({ color: BOOSTER.colour, roughness: BOOSTER.roughness, metalness: 0, side: THREE.DoubleSide });
  // Fine, still relief gives the matte cream a dry clay finish. The rest-position coordinates travel with the skin;
  // this changes only the surface normal, never its paint or the world's light.
  if (look?.eye) {
    // The Clay's grain (W102): the picture's clay has a fine, dry grain, a few millimetres across. Its normal is tilted
    // by noise anchored to the skin (two scales, a fine one over a coarser one), so the grain catches the light as the
    // picture's does and never moves over the surface. (The bump below is the Suit's as it was, and draws nothing:
    // a procedural height has no texture to take its slope from.)
    const grain = clayGrain(positionGeometry, config.clayProfile === "vr-v1");
    // Taken into the view as a direction, its length kept (a normal's transform would make every tilt a full one).
    material.normalNode = normalize(normalView.add(modelViewMatrix.mul(vec4(grain, 0)).xyz));
    // Restrained fibre-scale variation in the paint survives diffuse light, where a normal-only grain disappeared.
    material.colorNode = clayPaint(config.colour, positionGeometry, config.clayProfile === "vr-v1");
  } else if (look) {
    material.normalNode = bumpMap(
      mx_noise_float(positionGeometry.mul(180)).mul(0.0007)
        .add(mx_noise_float(positionGeometry.mul(420).add(17)).mul(0.00035)),
      float(1),
    );
  }

  // The bones, each where its joint is, from its parent's: the rig's units scaled to the figure's height.
  const bones = {} as Record<JointId, THREE.Bone>;
  const at = new Map(HUMAN_JOINTS.map((joint) => [joint.id, new THREE.Vector3(...joint.at).multiplyScalar(UNIT)]));
  if (look?.bones) {
    // The Clay (World.md W102) stands the bones where its pieces turn: its shoulders, the arms' and the legs' pivots
    // inside the trunk (a limb's top is a cap round its pivot, so a swing turns it in place), its neck's base and the
    // head's foot on the neck; the rest stand as the rig declares them.
    for (const [id, point] of Object.entries(look.bones) as [JointId, readonly [number, number, number]][]) at.get(id)!.set(point[0], point[1], point[2]);
  } else if (look?.arms) {
    const arms = look.arms;
    // The sketch's arms hang farther out and lower than the anatomical rig's, and are shorter and fuller. The arm's
    // pivot is its dome's centre, so a swing turns the dome in place and the arm about it; its elbow is where the
    // look swells, so the bend is in the swell; its hand is the arm's end. Skeleton keeps the rig as declared.
    const half = config.body / 200;
    for (const side of [-1, 1] as const) {
      const prefix = side === 1 ? "left" : "right";
      const arm = arms[prefix];
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
  // Mesh with the arms open so only their roots meet the chest. The inverses retain this bind pose (W104).
  for (const [id, angles] of Object.entries(look?.bindPose ?? {}) as [JointId, readonly [number, number, number]][]) {
    bones[id].rotation.set(...angles.map(THREE.MathUtils.degToRad) as [number, number, number]);
  }
  // The skeleton takes its rest pose from the bones as they stand now: they must stand before it is made.
  object.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(HUMAN_JOINTS.map((joint) => bones[joint.id]));
  const index = new Map(HUMAN_JOINTS.map((joint, i) => [joint.id, i]));
  const skinUpdates: (() => void)[] = [];

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
        const bone = bones[piece.bone];
        if (look.eye && piece.bone === "head") {
          // The Clay's head (W102): held in a group at its middle, named as the Suit's ball is, so the visitor's eye
          // sits there (`helmetEye` in the engine) and Looks at cursor turns it (`cursorGaze`).
          const [ex, ey, ez] = look.eye;
          geometry.translate(-ex, -ey, -ez);
          const head = new THREE.Group();
          head.name = "head";
          head.position.set(ex - origin.x, ey - origin.y, ez - origin.z);
          head.add(mesh(new THREE.Mesh(geometry, material), `${piece.name} surface`));
          bone.add(head);
          continue;
        }
        geometry.translate(-origin.x, -origin.y, -origin.z);
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
        // A part kept to its side shares no skin with one on the other side (`side`): the nearest part's side rules.
        const nearestSide = piece.parts[distances.indexOf(nearest)]!.side;
        const influence = new Map<JointId, number>();
        for (let j = 0; j < piece.parts.length; j++) {
          const side = piece.parts[j]!.side;
          if (side !== undefined && nearestSide !== undefined && side !== nearestSide) continue;
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
      if (look.skinning === "dual-quaternion") {
        const neighbours = fairClayWeights(geometry);
        const skin = claySkin(material as THREE.MeshPhysicalNodeMaterial, skeleton, object, geometry, neighbours, {
          arm: Math.max(config.clayArmWidth, config.clayArmDepth) / 100 * 1.05,
          hip: Math.max(config.clayLegWidth, config.clayLegDepth) / 100 * 0.85,
          knee: Math.max(config.clayLegWidth, config.clayLegDepth) / 100 * 0.55,
        }, config.clayProfile === "vr-v1");
        skinUpdates.push(skin.update);
        const made = mesh(new THREE.Mesh(geometry, skin.material), piece.name);
        object.add(made);
        continue;
      }
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
    // Shows: Head draws the head alone: the Suit's ball and visor, or the Clay's head piece.
    pieces(config.shows === "head" ? { ...look, pieces: look.pieces.filter((piece) => piece.bone === "head") } : look);
    if (look.head) {
      // The Suit's head rides the head bone: its ball's centre is the look's, from the joint.
      const head = headOf(look.head, config, material, sky, mesh);
      head.position.set(0, look.head.centre[1] - at.get("head")!.y, 0);
      bones.head.add(head);
    }
  }
  if (look?.bindPose) for (const bone of Object.values(bones)) bone.rotation.set(0, 0, 0);
  object.updateMatrixWorld(true);
  for (const update of skinUpdates) update();
  const flight = config.form === "clay" && (config.shows === "look" || config.shows === "boost")
    ? buildHumanFlight(object, bones, readClayFlightMotion(document.documentElement).jetLength) : null;

  const hips = bones.hips.position.y;
  return {
    object,
    bones,
    skeleton,
    flight(frame) { flight?.update(frame); },
    pose(pose, lift) {
      for (const { id } of HUMAN_JOINTS) {
        const [x, y, z] = pose[id] ?? [0, 0, 0];
        const restSpread = config.clayProfile === "vr-v1" ? (id === "leftArm" ? 14 : id === "rightArm" ? -14 : 0) : 0;
        bones[id].rotation.set(THREE.MathUtils.degToRad(x), THREE.MathUtils.degToRad(y), THREE.MathUtils.degToRad(z + restSpread));
      }
      bones.hips.position.y = hips + lift * UNIT;
      object.updateMatrixWorld(true);
      for (const update of skinUpdates) update();
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
  | { kind: "turned"; part: Part; source: Shape; x: number; y: number; cos: number; sin: number; bounds: [number, number, number, number]; zHalf: number }
  | { kind: "fork"; part: Part; upper: Extract<Shape, { kind: "loft" }>; lower: readonly [Extract<Shape, { kind: "loft" }>, Extract<Shape, { kind: "loft" }>]; merge: readonly [number, number]; bounds: [number, number, number, number]; zHalf: number }
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
  | { kind: "ball"; part: Part; x: number; y: number; radius: number; bounds: [number, number, number, number]; zHalf: number }
  | {
      kind: "loft";
      part: Part;
      /**
       * The rows resampled every `step` metres up from `y0`, `count` of them: each section's middle (`cx`, `cz`), its
       * half-extents across and through (`ax`, `bz`), and how steeply its outline leans there (`slope`), which turns
       * the section's distance into the surface's.
       */
      y0: number;
      step: number;
      count: number;
      cx: Float64Array;
      cz: Float64Array;
      ax: Float64Array;
      bz: Float64Array;
      slope: Float64Array;
      /** The section's exponent at each row: the loft's own, or the row's where it gives one. */
      n: Float64Array;
      /** The side of the section toward the figure's middle, squared to `innerN` there (`LoftPart`), or none. */
      inner: -1 | 1 | 0;
      innerN: number;
      innerFade: readonly [number, number] | null;
      /** How round the edge of its flat bottom is, in metres (`LoftPart`'s `roundBottom`), or none. */
      roundBottom: number;
      bounds: [number, number, number, number];
      zHalf: number;
    }
  | { kind: "revolved"; part: Part; x: number; y: number; z: number; rx: number; r: number; n: number; bounds: [number, number, number, number]; zHalf: number };

/** How finely a loft's rows are resampled up the figure, in metres. */
const LOFT_STEP = 0.004;
/** The most a loft's outline may lean, as a slope, where its distance is corrected for it (`loftDistance`). */
const SLOPE_MOST = 3;

/**
 * A convex outline's edges drawn in by its round, five numbers an edge (start, direction, and the direction's inverse
 * length squared): each corner moves in along the bisector of its edges' inward normals, so that the drawn-in polygon
 * put back out by the round is exactly the rounded outline, and its distance is exact everywhere. Turned
 * counter-clockwise first, whichever way it was given.
 */
function outlineSegments(given: readonly (readonly [number, number])[], round: number): Float64Array {
  const area = given.reduce((sum, [x, y], i) => {
    const [nx, ny] = given[(i + 1) % given.length]!;
    return sum + x * ny - nx * y;
  }, 0);
  const polygon = area < 0 ? [...given].reverse() : given;
  const n = polygon.length;
  const normals = polygon.map(([x, y], i) => {
    const [nx, ny] = polygon[(i + 1) % n]!;
    const length = Math.hypot(nx - x, ny - y) || 1;
    return [-(ny - y) / length, (nx - x) / length] as const;
  });
  const inset = polygon.map(([x, y], i) => {
    const [ax, ay] = normals[(i + n - 1) % n]!;
    const [bx, by] = normals[i]!;
    const scale = round / (1 + ax * bx + ay * by);
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
  return segments;
}

/**
 * A smooth curve through a loft's rows, one value against height (monotone cubic, Fritsch and Carlson): it passes
 * through every row and never overshoots between two, so an outline drawn row by row stays as it was measured; past
 * the first and the last row it holds their values.
 */
function smoothCurve(xs: readonly number[], ys: readonly number[]): (x: number) => number {
  const n = xs.length;
  if (n < 2) return () => ys[0] ?? 0;
  const delta = Array.from({ length: n - 1 }, (_, k) => (ys[k + 1]! - ys[k]!) / (xs[k + 1]! - xs[k]! || 1e-9));
  const m = Array.from({ length: n }, (_, k) => (k === 0 ? delta[0]! : k === n - 1 ? delta[n - 2]! : delta[k - 1]! * delta[k]! <= 0 ? 0 : (delta[k - 1]! + delta[k]!) / 2));
  for (let k = 0; k < n - 1; k++) {
    if (delta[k] === 0) {
      m[k] = 0;
      m[k + 1] = 0;
      continue;
    }
    const a = m[k]! / delta[k]!;
    const b = m[k + 1]! / delta[k]!;
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[k] = t * a * delta[k]!;
      m[k + 1] = t * b * delta[k]!;
    }
  }
  return (x) => {
    if (x <= xs[0]!) return ys[0]!;
    if (x >= xs[n - 1]!) return ys[n - 1]!;
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (xs[mid]! > x) hi = mid;
      else lo = mid;
    }
    const h = xs[hi]! - xs[lo]!;
    const t = (x - xs[lo]!) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[lo]! + (t3 - 2 * t2 + t) * h * m[lo]! + (-2 * t3 + 3 * t2) * ys[hi]! + (t3 - t2) * h * m[hi]!;
  };
}

function prepare(part: Part): Shape {
  if (part.kind === "turned") {
    const source = prepare(part.source);
    const [x, y] = part.pivot;
    const angle = part.angle * Math.PI / 180;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const corners = [source.bounds[0], source.bounds[1]].flatMap((px) => [source.bounds[2], source.bounds[3]].map((py) =>
      [x + (px - x) * cos - (py - y) * sin, y + (px - x) * sin + (py - y) * cos]));
    return { kind: "turned", part, source, x, y, cos, sin,
      bounds: [Math.min(...corners.map((p) => p[0]!)), Math.max(...corners.map((p) => p[0]!)), Math.min(...corners.map((p) => p[1]!)), Math.max(...corners.map((p) => p[1]!))], zHalf: source.zHalf };
  }
  if (part.kind === "fork") {
    const upper = prepare(part.upper) as Extract<Shape, { kind: "loft" }>;
    const lower = part.lower.map((leg) => prepare(leg)) as [Extract<Shape, { kind: "loft" }>, Extract<Shape, { kind: "loft" }>];
    const all = [upper, ...lower];
    return { kind: "fork", part, upper, lower, merge: part.merge,
      bounds: [Math.min(...all.map((s) => s.bounds[0])), Math.max(...all.map((s) => s.bounds[1])), Math.min(...all.map((s) => s.bounds[2])), Math.max(...all.map((s) => s.bounds[3]))],
      zHalf: Math.max(...all.map((s) => s.zHalf)) };
  }
  if (part.kind === "loft") {
    const rows = [...part.rows].sort((a, b) => a[0] - b[0]);
    const ys = rows.map((row) => row[0]);
    const y0 = ys[0]!;
    const y1 = ys[ys.length - 1]!;
    const count = Math.max(2, Math.ceil((y1 - y0) / LOFT_STEP) + 1);
    const step = (y1 - y0) / (count - 1) || LOFT_STEP;
    const [x0, x1, z0, z1] = ([1, 2, 3, 4] as const).map((c) => {
      const curve = smoothCurve(ys, rows.map((row) => row[c]));
      return Float64Array.from({ length: count }, (_, i) => curve(y0 + i * step));
    }) as [Float64Array, Float64Array, Float64Array, Float64Array];
    // A row's own exponent where it gives one (the Clay's head, W102), else the loft's.
    const exponent = smoothCurve(ys, rows.map((row) => (row.length > 5 ? row[5]! : part.n)));
    const n = Float64Array.from({ length: count }, (_, i) => exponent(y0 + i * step));
    const cx = new Float64Array(count);
    const cz = new Float64Array(count);
    const ax = new Float64Array(count);
    const bz = new Float64Array(count);
    const slope = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      cx[i] = (x0[i]! + x1[i]!) / 2;
      cz[i] = (z0[i]! + z1[i]!) / 2;
      ax[i] = Math.max(0, (x1[i]! - x0[i]!) / 2);
      bz[i] = Math.max(0, (z1[i]! - z0[i]!) / 2);
      const before = Math.max(0, i - 1);
      const after = Math.min(count - 1, i + 1);
      const run = (after - before) * step || step;
      // Held to `SLOPE_MOST`: where a loft closes, its outline turns flat and its slope grows without end, and a
      // distance shrunk by it would flatten the field there (a pinched point, a dimpled sole); the surface is where the
      // section's own distance is nought, whatever the slope.
      slope[i] = Math.min(SLOPE_MOST, Math.max(...[x0, x1, z0, z1].map((v) => Math.abs(v[after]! - v[before]!) / run)));
    }
    return {
      kind: "loft",
      part,
      y0,
      step,
      count,
      cx,
      cz,
      ax,
      bz,
      slope,
      n,
      inner: part.inner ?? 0,
      innerN: part.innerN ?? part.n,
      innerFade: part.innerFade ?? null,
      roundBottom: part.roundBottom ?? 0,
      bounds: [Math.min(...x0), Math.max(...x1), y0, y1],
      zHalf: Math.max(...[...z0, ...z1].map(Math.abs)),
    };
  }
  if (part.kind === "revolved") {
    const [x, y, z] = part.at;
    return { kind: "revolved", part, x, y, z, rx: part.rx, r: part.r, n: part.n, bounds: [x - part.rx, x + part.rx, y - part.r, y + part.r], zHalf: Math.abs(z) + part.r };
  }
  if (part.kind === "slab") {
    const xs = part.polygon.map(([x]) => x);
    const ys = part.polygon.map(([, y]) => y);
    const bounds: [number, number, number, number] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const bevel = Math.max(0, Math.min(part.edge, part.depth * 0.49));
    const segments = outlineSegments(part.polygon, part.round);
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
  return outlineDistance(shape.segments, shape.round, x, y);
}

/** Signed distance to a rounded outline in its plane, from its drawn-in edges (`outlineSegments`) and its round: negative inside. */
function outlineDistance(segments: Float64Array, round: number, x: number, y: number): number {
  let squared = Infinity;
  let inside = false;
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
  return Math.sqrt(squared) * (inside ? -1 : 1) - round;
}

/**
 * The distance across a superellipse section (exponent `n`: 2 an ellipse, more a rounded rectangle) of half-extents
 * `a` and `b`, from a point `dx`, `dz` off its middle: to first order, the ratio's excess over its gradient, exact on
 * the section's axes and close everywhere near its outline, which is all the meshing asks of it.
 */
function sectionDistance(dx: number, dz: number, a: number, b: number, n: number): number {
  const ha = Math.max(a, 1e-5);
  const hb = Math.max(b, 1e-5);
  const u = Math.abs(dx) / ha;
  const v = Math.abs(dz) / hb;
  if (u === 0 && v === 0) return -Math.min(ha, hb);
  const un = u ** n;
  const vn = v ** n;
  const r = (un + vn) ** (1 / n);
  const k = r ** (1 - n);
  const gx = u > 0 ? (k * un) / (u * ha) : 0;
  const gz = v > 0 ? (k * vn) / (v * hb) : 0;
  return (r - 1) / Math.hypot(gx, gz);
}

/**
 * A loft's distance: its section's at the point's height, leaned by its outline's slope there; below its first row
 * and above its last it is capped flat, a closed row (no width) closing it to a point.
 */
function loftDistance(shape: Extract<Shape, { kind: "loft" }>, x: number, y: number, z: number): number {
  const last = shape.count - 1;
  const t = (y - shape.y0) / shape.step;
  const held = Math.min(last, Math.max(0, t));
  const i = Math.min(last - 1, Math.floor(held));
  const f = held - i;
  const at = (values: Float64Array) => values[i]! + (values[i + 1]! - values[i]!) * f;
  const slope = at(shape.slope);
  const dx = x - at(shape.cx);
  // On its inner side a section may be squarer (an arm pressed flat against the body): the two halves meet where the
  // section is widest through, with no edge, since there both run straight across.
  const own = at(shape.n);
  const fade = shape.innerFade ? 1 - smoothstep(y, shape.innerFade[0], shape.innerFade[1]) : 1;
  const n = shape.inner !== 0 && Math.sign(dx) === shape.inner ? own + (shape.innerN - own) * fade : own;
  const across = sectionDistance(dx, z - at(shape.cz), at(shape.ax), at(shape.bz), n) / Math.sqrt(1 + slope * slope);
  // A rounded bottom (a sole): the section drawn in by the round and the bottom raised by it, the corner between them
  // a quarter round, as a rounded cylinder's is.
  if (shape.roundBottom > 0 && t * shape.step < shape.roundBottom) {
    const round = shape.roundBottom;
    const a = across + round;
    const b = shape.y0 + round - y;
    return Math.hypot(Math.max(a, 0), Math.max(b, 0)) + Math.min(Math.max(a, b), 0) - round;
  }
  const beyond = t < 0 ? -t * shape.step : t > last ? (t - last) * shape.step : 0;
  if (beyond === 0) return across;
  return across <= 0 ? beyond : Math.hypot(across, beyond);
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

const distanceAt = (shape: Shape, x: number, y: number, z: number): number =>
  shape.kind === "turned"
    ? distanceAt(shape.source, shape.x + (x - shape.x) * shape.cos + (y - shape.y) * shape.sin, shape.y - (x - shape.x) * shape.sin + (y - shape.y) * shape.cos, z)
    : shape.kind === "fork"
    ? forkDistance(shape, x, y, z)
    : shape.kind === "slab"
    ? roundedDistance(planarDistance(shape, x, y), z, shape.halfDepth, shape.bevel, domeAt(shape, x, y))
    : shape.kind === "bar"
      ? barDistance(shape, x, y, z)
      : shape.kind === "ball"
        ? ballDistance(shape, x, y, z)
        : shape.kind === "revolved"
          ? revolvedDistance(shape, x, y, z)
          : loftDistance(shape, x, y, z);

/** Morph sections instead of uniting capped volumes: no horizontal ledge or crease can form at the hips. */
function forkDistance(shape: Extract<Shape, { kind: "fork" }>, x: number, y: number, z: number): number {
  if (y >= shape.merge[1]) return loftDistance(shape.upper, x, y, z);
  const [left, right] = shape.lower;
  const lower = Math.min(loftDistance(left, x, Math.min(y, left.bounds[3]), z), loftDistance(right, x, Math.min(y, right.bounds[3]), z));
  if (y <= shape.merge[0]) return lower;
  const upper = loftDistance(shape.upper, x, y, z);
  const share = smoothstep(y, shape.merge[0], shape.merge[1]);
  return lower + (upper - lower) * share;
}

/**
 * A body turned about the line across the figure through its middle: its distance is its section's, measured across
 * (x) and round that line (the distance from it), so it is the same at every turn about the line.
 */
function revolvedDistance(shape: Extract<Shape, { kind: "revolved" }>, x: number, y: number, z: number): number {
  return sectionDistance(x - shape.x, Math.hypot(y - shape.y, z - shape.z), shape.rx, shape.r, shape.n);
}

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
  // The deforming body retains a centimetre-scale grid within the animation budget; the head keeps its finer outline.
  const detail = piece.finish === "soft" ? (piece.name === "trunk" ? 1.05 : 0.85) : 1;
  const grow = detail * Math.max(1, Math.cbrt(((max.x - min.x) / (STEP_ACROSS * detail)) * ((max.y - min.y) / (STEP_UP * detail)) * ((max.z - min.z) / (STEP_THROUGH * detail)) / (SAMPLE_BUDGET / detail)));
  const nx = Math.ceil((max.x - min.x) / (STEP_ACROSS * grow)) + 1;
  const ny = Math.ceil((max.y - min.y) / (STEP_UP * grow)) + 1;
  const nz = Math.ceil((max.z - min.z) / (STEP_THROUGH * grow)) + 1;
  const step = new THREE.Vector3((max.x - min.x) / (nx - 1), (max.y - min.y) / (ny - 1), (max.z - min.z) / (nz - 1));

  // The piece's parts blend over its blend. In the trunk, two parts meeting are a crease, except round each arm's
  // dome, where the shoulder's slope, the body's corner and the dome flow into one shoulder, and no lower, so the
  // groove under it stays open.
  const domes = shapes.filter((shape): shape is Extract<Shape, { kind: "ball" }> => shape.kind === "ball" && shape.part.name.endsWith("arm dome") && !piece.bone);
  const blendAt = (x: number, y: number) => {
    let blend = piece.blendAt?.(x, y) ?? piece.blend;
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
            : distanceAt(shape, x, y, z);
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
  if (piece.finish === "soft") softenSurface(geometry);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Two shrink/expand passes remove grid-scale pinches at contact creases without shrinking the silhouette. Averaged
 * mesh normals then shade that same fair surface; a traced pixel's slope no longer paints a stripe across a limb.
 */
function softenSurface(geometry: THREE.BufferGeometry): void {
  const points = geometry.getAttribute("position");
  const indices = geometry.index!;
  const neighbours = Array.from({ length: points.count }, () => new Set<number>());
  for (let i = 0; i < indices.count; i += 3) {
    const a = indices.getX(i), b = indices.getX(i + 1), c = indices.getX(i + 2);
    neighbours[a]!.add(b).add(c); neighbours[b]!.add(a).add(c); neighbours[c]!.add(a).add(b);
  }
  const next = new Float32Array(points.count * 3);
  for (const amount of [0.4, -0.42, 0.4, -0.42]) {
    for (let i = 0; i < points.count; i++) {
      const near = neighbours[i]!;
      let x = 0, y = 0, z = 0;
      for (const j of near) { x += points.getX(j); y += points.getY(j); z += points.getZ(j); }
      const count = near.size || 1;
      next[i * 3] = points.getX(i) + amount * (x / count - points.getX(i));
      next[i * 3 + 1] = points.getY(i) < 0.012 ? points.getY(i) : points.getY(i) + amount * (y / count - points.getY(i));
      next[i * 3 + 2] = points.getZ(i) + amount * (z / count - points.getZ(i));
    }
    (points.array as Float32Array).set(next);
  }
  geometry.computeVertexNormals();
}
