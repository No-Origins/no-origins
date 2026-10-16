// Trees version 5, frozen (World.md W90); nothing draws this.
import * as THREE from "three/webgpu";
import { attribute, color, mix, output, positionWorld, vec4 } from "three/tsl";

import { ENTRY, floretsOf, studioTree, trunkAt, type Tree, type TreeConfig } from "./tree-v5";

/**
 * What makes the trees (`tree.ts`, World.md W67, W68, W71, W72, W85, W86): each a trunk, a tube of its tree's radius
 * straight up to where its bend starts and along one continuous arc from there, capped at its tip, and its light in its
 * Shape: a closed tube wider than the trunk, its top and bottom covered (his, World.md W67), aligned on the trunk's
 * tangent at the tip, the trunk entering it through its bottom (`ENTRY`); or an allium's head (W85), its middle at the
 * trunk's tip, a floret a direction of `floretsOf`, each a six-pointed star on a thin stalk from the middle
 * (`floretGeometry`), one `InstancedMesh` a tree, round a core of its Core's radius. The trunk is a flat colour lit by
 * the world's sun and sky, casting its shadow (W49); the light emits its tree's colour (W86), lit by nothing, an
 * allium's stalks and core a flat step deeper than its stars (its Stalk shade). All take the base gas (`airAt`, the
 * world base's fog) as the mountains do, so a tree's foot stands in it and its light rises clear of it.
 *
 * The trees of the world (`buildTrees`) are the ones placed (W73), each an asset of a zone, one of the trees' variants,
 * at its own height and colour (`treeOf`), standing on the world's floor at y 0 where it was placed; one tree alone
 * (`buildStudioTree`) stands at the world's middle on its page (W72). Each tree's group carries its asset's id, so a
 * click on the Sectors page picks it, an allium's florets with it. Version 4's builder, a radius a variant, is frozen
 * (`build-tree-v4.ts`); version 3's, the tube alone, before it (`build-tree-v3.ts`); and version 2's, the grove with the
 * trees' page, before that (`build-tree-v2.ts`).
 *
 * The point lights are a pool (mine, W71): a point light a tree cost a frame about 95 ms here at forty trees as at two
 * hundred, and 21 ms with none, so the grove keeps `LIT_TREES` point lights and carries them, each frame, to the trees
 * nearest the camera (`near`), in their colours, from a tube's middle or an allium's head's; every tree lights what
 * stands near it when the visitor is near it, and a far tree's light is its shape alone.
 */
export type BuiltTrees = { object: THREE.Group; /** Carry the point lights to the trees nearest this point (the camera's). */ near(at: THREE.Vector3): void };

/** How many trees light what stands near them at once (mine): the point lights the grove carries to the nearest trees. */
export const LIT_TREES = 12;

type Air = (p: typeof positionWorld) => THREE.Node<"vec4">;

/** A tree as placed (W73): its asset's id, the tree its seed draws where it stands, and its variant's settings. */
export type PlacedTree = { id: string; tree: Tree; config: TreeConfig; /** How far over the world's floor its foot is (W88: moved up or down; none on the floor). */ y?: number };

/** The trees placed in the world, each where it stands, of its variant. */
export function buildTrees(trees: readonly PlacedTree[], airAt?: Air): BuiltTrees {
  return build(trees, airAt);
}

/** One tree alone at the world's middle, on its page (W72). */
export function buildStudioTree(config: TreeConfig, airAt?: Air): BuiltTrees {
  return build([{ id: "studio", tree: studioTree(config), config }], airAt);
}

function build(placed: readonly PlacedTree[], airAt?: Air): BuiltTrees {
  const grove = new THREE.Group();
  grove.name = "trees";
  const air = airAt?.(positionWorld);
  // A material a trunk colour and a material a light colour, shared by every tree of that colour. A light is closed,
  // so only its outside is ever seen: one side.
  const trunks = new Map<string, THREE.MeshStandardNodeMaterial>();
  const lights = new Map<string, THREE.MeshBasicNodeMaterial>();
  const trunkOf = (colour: string) => {
    let trunk = trunks.get(colour);
    if (!trunk) {
      trunk = new THREE.MeshStandardNodeMaterial({ color: colour, roughness: 0.55, metalness: 0, fog: !airAt });
      if (air) trunk.outputNode = vec4(mix(output.rgb, air.rgb, air.a), 1);
      trunks.set(colour, trunk);
    }
    return trunk;
  };
  const lightOf = (colour: string) => {
    let light = lights.get(colour);
    if (!light) {
      light = new THREE.MeshBasicNodeMaterial({ color: colour, fog: !airAt });
      if (air) light.outputNode = vec4(mix(output.rgb, air.rgb, air.a), 1);
      lights.set(colour, light);
    }
    return light;
  };
  // An allium's florets are open stars emitting the light's colour, seen from either side; their stalks, and the core
  // they start from, are a step deeper, the light's colour mixed its Stalk shade of the way to the trunk's, so each star
  // stands out on the ball (mine, W85; his to tune, W86). A floret's material a light and trunk colour and shade, both
  // sides, its stalk marked `deep`; and a head's floret, stalk and star, and its core, made once for every tree of the
  // same head, with where each floret points.
  const deepOf = (colour: string, trunk: string, shade: number) => `#${new THREE.Color(colour).lerp(new THREE.Color(trunk), shade).getHexString()}`;
  const florets = new Map<string, THREE.MeshBasicNodeMaterial>();
  const floretOf = (colour: string, trunk: string, shade: number) => {
    const key = `${colour} ${trunk} ${shade}`;
    let floret = florets.get(key);
    if (!floret) {
      floret = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, fog: !airAt });
      floret.colorNode = mix(color(new THREE.Color(colour)), color(new THREE.Color(deepOf(colour, trunk, shade))), attribute<"float">("deep", "float"));
      if (air) floret.outputNode = vec4(mix(output.rgb, air.rgb, air.a), 1);
      florets.set(key, floret);
    }
    return floret;
  };
  const heads = new Map<string, { geometry: THREE.BufferGeometry; turns: THREE.Matrix4[]; core: THREE.BufferGeometry | null }>();
  const headOf = (config: TreeConfig, trunk: number) => {
    const key = [config.headRadius, config.florets, config.floretSize, config.core, trunk].join(" ");
    let head = heads.get(key);
    if (!head) {
      const opening = (trunk + config.floretSize / 2) / config.headRadius;
      const turns = floretsOf(config.florets, opening).map(([x, y, z], index) => new THREE.Matrix4().makeRotationFromQuaternion(
        new THREE.Quaternion().setFromUnitVectors(up, new THREE.Vector3(x, y, z)).multiply(new THREE.Quaternion().setFromAxisAngle(up, index * TWIST)),
      ));
      const core = config.core > 0 ? new THREE.IcosahedronGeometry(config.headRadius * config.core, 3) : null;
      head = { geometry: floretGeometry(config.headRadius, config.floretSize), turns, core };
      heads.set(key, head);
    }
    return head;
  };
  const allium: THREE.InstancedMesh[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const front = new THREE.Vector3(0, 0, 1);
  // Where each tree's light is, in the world, its colour and its reach: what the pool's point lights are carried to.
  const lamps: { at: THREE.Vector3; colour: string; brightness: number; reach: number }[] = [];
  for (const placedTree of placed) {
    const { id, tree, config } = placedTree;
    const object = new THREE.Group();
    object.name = `tree ${id}`;
    object.userData.asset = id;
    object.position.set(tree.x, placedTree.y ?? 0, tree.z);
    object.rotation.y = -(tree.lean * Math.PI) / 180;

    // The trunk: straight, then the arc to the tip, one radius all the way, open at its base (in the gas) and capped at the tip.
    const trunk = trunkOf(config.trunkColour);
    const radius = tree.radius;
    const stem = new THREE.Mesh(new THREE.TubeGeometry(new Arc(tree), 96, radius, 24, false), trunk);
    stem.name = "trunk";
    stem.castShadow = true;
    stem.receiveShadow = true;
    const tip = trunkAt(tree, tree.length);
    const point = new THREE.Vector3(...tip.point);
    const tangent = new THREE.Vector3(...tip.tangent).normalize();
    const cap = new THREE.Mesh(new THREE.CircleGeometry(radius, 24), trunk);
    cap.name = "trunk tip";
    cap.position.copy(point);
    cap.quaternion.setFromUnitVectors(front, tangent);
    cap.castShadow = true;

    let glow: THREE.Mesh;
    if (config.lightShape === "allium") {
      // An allium's head (W85): its middle at the trunk's tip, as a scape ends where its stalks start, the trunk coming
      // up into it from below; its florets on the tangent, the ball turned about it by the tree's seed, so no two
      // trees' stars line up.
      const { geometry, turns, core } = headOf(config, radius);
      const head = new THREE.InstancedMesh(geometry, floretOf(tree.colour, config.trunkColour, config.stalkShade), turns.length);
      turns.forEach((turn, index) => head.setMatrixAt(index, turn));
      head.position.copy(point);
      head.quaternion.setFromUnitVectors(up, tangent).multiply(new THREE.Quaternion().setFromAxisAngle(up, tree.seed * TWIST));
      allium.push(head);
      if (core) {
        const middle = new THREE.Mesh(core, lightOf(deepOf(tree.colour, config.trunkColour, config.stalkShade)));
        middle.name = "light's core";
        middle.position.copy(point);
        middle.castShadow = true;
        object.add(middle);
      }
      glow = head;
    } else {
      // The light: a closed tube on the tangent, its top and bottom covered (his), the trunk entering it through the bottom
      // by `ENTRY` of its length.
      glow = new THREE.Mesh(new THREE.CylinderGeometry(config.lightRadius, config.lightRadius, config.lightLength, 32, 1, false), lightOf(tree.colour));
      glow.position.copy(point).addScaledVector(tangent, config.lightLength * (0.5 - ENTRY));
      glow.quaternion.setFromUnitVectors(up, tangent);
    }
    glow.name = "light";
    glow.castShadow = true;
    object.add(stem, cap, glow);
    if (config.lightReach > 0 && config.lightBrightness > 0) lamps.push({ at: glow.position.clone().applyAxisAngle(up, object.rotation.y).add(object.position), colour: tree.colour, brightness: config.lightBrightness, reach: config.lightReach });
    grove.add(object);
  }
  // The pool: as many point lights as trees light at once, or as there are lit trees; none casts a shadow of its own.
  const pool = Array.from({ length: Math.min(LIT_TREES, lamps.length) }, () => {
    const lamp = new THREE.PointLight("#ffffff", 0, 1, 2);
    lamp.name = "light's light";
    lamp.castShadow = false;
    grove.add(lamp);
    return lamp;
  });
  const first = trunks.values().next().value;
  first?.addEventListener("dispose", () => {
    pool.forEach((lamp) => lamp.dispose());
    allium.forEach((head) => head.dispose());
  });
  let lastAt = "";
  const near = (at: THREE.Vector3) => {
    if (!pool.length) return;
    // The camera where it was last frame carries nothing.
    const key = `${at.x.toFixed(1)},${at.y.toFixed(1)},${at.z.toFixed(1)}`;
    if (key === lastAt) return;
    lastAt = key;
    const nearest = lamps.map((lamp) => ({ lamp, away: lamp.at.distanceToSquared(at) })).sort((a, b) => a.away - b.away);
    pool.forEach((light, index) => {
      const { lamp } = nearest[index];
      light.position.copy(lamp.at);
      light.color.set(lamp.colour);
      light.intensity = lamp.brightness;
      light.distance = lamp.reach;
    });
  };
  near(new THREE.Vector3(0, 0, 0));
  return { object: grove, near };
}

/** How far each floret, and each tree's head, is turned about its own axis from the one before, in radians: the golden angle (mine). */
const TWIST = Math.PI * (3 - Math.sqrt(5));
/** A floret's stalk's width, as a share of the floret's (mine). */
const STALK = 0.04;
/** How far a floret's tepals rise out of its plane, in radians (mine): a shallow cup, so a star seen edge-on still shows its points. */
const CUP = 0.45;
/** A tepal's half-width at its widest, a third of the way out, as a share of its length (mine): a narrow point, as a star's is. */
const TEPAL = 0.3;

/**
 * One floret of an allium's head (W85), pointing up (+y) from the head's middle at the origin: its stalk, a thin
 * three-sided prism, from the middle out to the head's radius, and there its star, six tepals each a narrow diamond from
 * the stalk's end to its point, rising out of the floret's plane by `CUP`, spanning its size from point to point.
 */
function floretGeometry(radius: number, size: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const deep: number[] = [];
  // A corner of a triangle, and whether it is the stalk's (1) or the star's (0).
  const corner = (mark: number, x: number, y: number, z: number) => {
    positions.push(x, y, z);
    deep.push(mark);
  };
  const stalk = (size * STALK) / 2;
  for (let side = 0; side < 3; side++) {
    const [a, b] = [side, side + 1].map((n) => (n / 3) * Math.PI * 2);
    const [ax, az, bx, bz] = [Math.cos(a) * stalk, Math.sin(a) * stalk, Math.cos(b) * stalk, Math.sin(b) * stalk];
    corner(1, ax, 0, az); corner(1, ax, radius, az); corner(1, bx, 0, bz);
    corner(1, bx, 0, bz); corner(1, ax, radius, az); corner(1, bx, radius, bz);
  }
  const length = size / 2;
  for (let tepal = 0; tepal < 6; tepal++) {
    const angle = (tepal / 6) * Math.PI * 2;
    // Out along the tepal, rising by the cup, and across it in the floret's plane.
    const [ox, oy, oz] = [Math.cos(angle) * Math.cos(CUP), Math.sin(CUP), Math.sin(angle) * Math.cos(CUP)];
    const [cx, cz] = [-Math.sin(angle), Math.cos(angle)];
    const at = (out: number, across: number): [number, number, number] => [ox * out + cx * across, radius + oy * out, oz * out + cz * across];
    const [base, left, point, right] = [at(0, 0), at(length / 3, length * TEPAL), at(length, 0), at(length / 3, -length * TEPAL)];
    corner(0, ...base); corner(0, ...left); corner(0, ...point);
    corner(0, ...base); corner(0, ...point); corner(0, ...right);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("deep", new THREE.Float32BufferAttribute(deep, 1));
  geometry.computeVertexNormals();
  return geometry;
}

/** The trunk's curve for three.js: the straight and the arc of `trunkAt`, from the base (0) to the tip (1). */
class Arc extends THREE.Curve<THREE.Vector3> {
  constructor(private readonly tree: Pick<Tree, "bend" | "bendAt" | "length">) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const { point } = trunkAt(this.tree, t * this.tree.length);
    return target.set(point[0], point[1], point[2]);
  }
}
