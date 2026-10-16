import * as THREE from "three/webgpu";
import { attribute, color, mix, output, positionWorld, vec4 } from "three/tsl";

import { ENTRY, floretsOf, SIZES, trunkAt, type Tree, type TreeLook } from "./tree";

/**
 * What makes the trees (`tree.ts`, World.md W67, W68, W85, W93, W98), version 9: each a trunk, a tube of its tree's
 * radius bent from its foot along one continuous arc, capped at its tip, and its flower in its own Shape, one of its
 * look's (W93, W98; his: "Flowers will now be Cube, Cylinder and Allium. They will not have lights. They will just
 * have colors. The sizes of the flower should be derived from size of trunk"): a cube or a closed cylinder on the trunk's tangent at the tip, the trunk
 * entering it through its bottom (`ENTRY`); or an allium's head (W85), its middle at the trunk's tip, a floret a
 * direction of `floretsOf`, each a six-pointed star on a thin stalk from the middle (`floretGeometry`), one
 * `InstancedMesh` a tree, round a core. Every size of the flower is a share of its tree's length (`SIZES`), so one
 * cube, one cylinder and one allium's head are made for every tree and each is scaled to its own.
 *
 * Trunk and flower alike are a flat colour lit by the world's sun and sky, casting their shadows (W49): a flower emits
 * nothing and lights nothing (version 7's point lights went with its light). An allium's stalks and core are a flat step
 * deeper than its stars, half way to the trunk's colour, as W85 drew them. All take the base gas (`airAt`, the world
 * base's fog) as the mountains do, so a tree's foot stands in it. Each tree's group carries its asset's id, a grove's
 * every tree its grove's, so a click on the Sectors page picks it, an allium's florets with it. Version 7's builder, the
 * light, is frozen (`build-tree-v7.ts`).
 */
export type BuiltTrees = { object: THREE.Group };

type Air = (p: typeof positionWorld) => THREE.Node<"vec4">;

/** A tree as placed (W73, W93, W98): its asset's id (its grove's), the tree where it stands (its own flower's shape among them), its look's trunk colour, and how far over the world's floor its foot is. */
export type PlacedTree = { id: string; tree: Tree; look: Pick<TreeLook, "trunkColour">; y?: number };

/** How far each floret, and each tree's head, is turned about its own axis from the one before, in radians: the golden angle (W85). */
const TWIST = Math.PI * (3 - Math.sqrt(5));
/** A floret's stalk's width, as a share of the floret's (W85). */
const STALK = 0.04;
/** How far a floret's tepals rise out of its plane, in radians (W85): a shallow cup, so a star seen edge-on still shows its points. */
const CUP = 0.45;
/** A tepal's half-width at its widest, a third of the way out, as a share of its length (W85): a narrow point, as a star's is. */
const TEPAL = 0.3;

/** The trees placed in the world, each where it stands, in its look. */
export function buildTrees(placed: readonly PlacedTree[], airAt?: Air): BuiltTrees {
  const grove = new THREE.Group();
  grove.name = "trees";
  const air = airAt?.(positionWorld);
  // A material a colour, shared by every trunk and flower of it, lit as the trunk always was.
  const plain = new Map<string, THREE.MeshStandardNodeMaterial>();
  const plainOf = (colour: string) => {
    let made = plain.get(colour);
    if (!made) {
      made = new THREE.MeshStandardNodeMaterial({ color: colour, roughness: 0.55, metalness: 0, fog: !airAt });
      if (air) made.outputNode = vec4(mix(output.rgb, air.rgb, air.a), 1);
      plain.set(colour, made);
    }
    return made;
  };
  // An allium's florets, open stars seen from either side, their stalks (and the core) a step deeper (W85).
  const deepOf = (colour: string, trunk: string) => `#${new THREE.Color(colour).lerp(new THREE.Color(trunk), SIZES.allium.stalkShade).getHexString()}`;
  const florets = new Map<string, THREE.MeshStandardNodeMaterial>();
  const floretOf = (colour: string, trunk: string) => {
    const key = `${colour} ${trunk}`;
    let made = florets.get(key);
    if (!made) {
      made = new THREE.MeshStandardNodeMaterial({ side: THREE.DoubleSide, roughness: 0.55, metalness: 0, fog: !airAt });
      made.colorNode = mix(color(new THREE.Color(colour)), color(new THREE.Color(deepOf(colour, trunk))), attribute<"float">("deep", "float"));
      if (air) made.outputNode = vec4(mix(output.rgb, air.rgb, air.a), 1);
      florets.set(key, made);
    }
    return made;
  };
  // One of each flower for every tree, at a length of one metre, each scaled to its tree (`SIZES`).
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 32, 1, false);
  const allium = SIZES.allium;
  // The opening the trunk comes up through, a share of the head: the trunk's radius and half a floret, both its length's shares.
  const opening = (SIZES.trunk + (allium.head * allium.floret) / 2) / allium.head;
  const turns = floretsOf(allium.florets, opening).map(([x, y, z], index) => new THREE.Matrix4().makeRotationFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(x, y, z)).multiply(new THREE.Quaternion().setFromAxisAngle(UP, index * TWIST)),
  ));
  const floret = floretGeometry(1, allium.floret);
  const core = new THREE.IcosahedronGeometry(allium.core, 3);
  const heads: THREE.InstancedMesh[] = [];

  for (const placedTree of placed) {
    const { id, tree, look } = placedTree;
    const object = new THREE.Group();
    object.name = `tree ${id}`;
    object.userData.asset = id;
    object.position.set(tree.x, placedTree.y ?? 0, tree.z);
    object.rotation.y = -(tree.lean * Math.PI) / 180;

    // The trunk: the arc from its foot to its tip, one radius all the way, open at its base (in the gas) and capped at the tip.
    const trunk = plainOf(look.trunkColour);
    const stem = new THREE.Mesh(new THREE.TubeGeometry(new Arc(tree), 96, tree.radius, 24, false), trunk);
    stem.name = "trunk";
    stem.castShadow = true;
    stem.receiveShadow = true;
    const tip = trunkAt(tree, tree.length);
    const point = new THREE.Vector3(...tip.point);
    const tangent = new THREE.Vector3(...tip.tangent).normalize();
    const cap = new THREE.Mesh(new THREE.CircleGeometry(tree.radius, 24), trunk);
    cap.name = "trunk tip";
    cap.position.copy(point);
    cap.quaternion.setFromUnitVectors(FRONT, tangent);
    cap.castShadow = true;
    object.add(stem, cap);

    // The flower, on the tangent, turned about it by the tree's seed, so no two trees' corners or stars line up.
    const along = new THREE.Quaternion().setFromUnitVectors(UP, tangent).multiply(new THREE.Quaternion().setFromAxisAngle(UP, tree.seed * TWIST));
    const length = tree.length;
    if (tree.flower === "allium") {
      // An allium's head (W85): its middle at the trunk's tip, as a scape ends where its stalks start.
      const head = new THREE.InstancedMesh(floret, floretOf(tree.colour, look.trunkColour), turns.length);
      turns.forEach((turn, index) => head.setMatrixAt(index, turn));
      head.position.copy(point);
      head.quaternion.copy(along);
      head.scale.setScalar(allium.head * length);
      head.name = "flower";
      head.castShadow = true;
      heads.push(head);
      const middle = new THREE.Mesh(core, plainOf(deepOf(tree.colour, look.trunkColour)));
      middle.name = "flower's core";
      middle.position.copy(point);
      middle.scale.setScalar(allium.head * length);
      middle.castShadow = true;
      object.add(head, middle);
    } else {
      // A cube or a closed cylinder (his), the trunk entering it through the bottom by `ENTRY` of its length.
      const size = tree.flower === "cube" ? { across: SIZES.cube * length, long: SIZES.cube * length } : { across: SIZES.cylinder.radius * length, long: SIZES.cylinder.length * length };
      const flower = new THREE.Mesh(tree.flower === "cube" ? cube : cylinder, plainOf(tree.colour));
      flower.name = "flower";
      flower.position.copy(point).addScaledVector(tangent, size.long * (0.5 - ENTRY));
      flower.quaternion.copy(along);
      flower.scale.set(size.across, size.long, size.across);
      flower.castShadow = true;
      flower.receiveShadow = true;
      object.add(flower);
    }
    grove.add(object);
  }
  // The heads' instances go with the grove (the engine disposes every mesh's geometry and material).
  const first = plain.values().next().value;
  first?.addEventListener("dispose", () => heads.forEach((head) => head.dispose()));
  return { object: grove };
}

const UP = new THREE.Vector3(0, 1, 0);
const FRONT = new THREE.Vector3(0, 0, 1);

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
