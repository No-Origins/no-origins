// Trees version 3, frozen (World.md W85); nothing draws this.
import * as THREE from "three/webgpu";
import { mix, output, positionWorld, vec4 } from "three/tsl";

import { ENTRY, studioTree, trunkAt, type Tree, type TreeConfig } from "./tree-v3";

/**
 * What makes the trees (`tree.ts`, World.md W67, W68, W71, W72): each a trunk, a tube of one radius straight up to
 * where its bend starts and along one continuous arc from there, capped at its tip, and its light, a closed tube wider
 * than the trunk, its top and bottom covered (his, World.md W67), aligned on the trunk's tangent at the tip, the trunk
 * entering it through its bottom (`ENTRY`). The trunk is a flat colour lit by the world's sun and sky, casting its
 * shadow (W49); the light emits its colour, one of the four its variant draws (W71), lit by nothing. Both take the base
 * gas (`airAt`, the world base's fog) as the mountains do, so a tree's foot stands in it and its light rises clear of
 * it.
 *
 * The trees of the world (`buildTrees`) are the ones placed (W73), each an asset of a zone, one of the trees' variants,
 * drawn by its seed, standing on the world's floor at y 0 where it was placed; one tree alone (`buildStudioTree`)
 * stands at the world's middle on its page (W72). Each tree's group carries its asset's id, so a click on the World
 * page picks it. Version 2's builder, the grove with the trees' page, is frozen (`build-tree-v2.ts`).
 *
 * The point lights are a pool (mine, W71): a point light a tree cost a frame about 95 ms here at forty trees as at two
 * hundred, and 21 ms with none, so the grove keeps `LIT_TREES` point lights and carries them, each frame, to the trees
 * nearest the camera (`near`), in their colours; every tree lights what stands near it when the visitor is near it,
 * and a far tree's light is its tube alone.
 */
export type BuiltTrees = { object: THREE.Group; /** Carry the point lights to the trees nearest this point (the camera's). */ near(at: THREE.Vector3): void };

/** How many trees light what stands near them at once (mine): the point lights the grove carries to the nearest trees. */
export const LIT_TREES = 12;

type Air = (p: typeof positionWorld) => THREE.Node<"vec4">;

/** A tree as placed (W73): its asset's id, the tree its seed draws where it stands, and its variant's settings. */
export type PlacedTree = { id: string; tree: Tree; config: TreeConfig };

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
  const up = new THREE.Vector3(0, 1, 0);
  const front = new THREE.Vector3(0, 0, 1);
  // Where each tree's light is, in the world, its colour and its reach: what the pool's point lights are carried to.
  const lamps: { at: THREE.Vector3; colour: string; brightness: number; reach: number }[] = [];
  for (const { id, tree, config } of placed) {
    const object = new THREE.Group();
    object.name = `tree ${id}`;
    object.userData.asset = id;
    object.position.set(tree.x, 0, tree.z);
    object.rotation.y = -(tree.lean * Math.PI) / 180;

    // The trunk: straight, then the arc to the tip, one radius all the way, open at its base (in the gas) and capped at the tip.
    const trunk = trunkOf(config.trunkColour);
    const radius = config.trunkRadius;
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

    // The light: a closed tube on the tangent, its top and bottom covered (his), the trunk entering it through the bottom by
    // `ENTRY` of its length.
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(config.lightRadius, config.lightRadius, config.lightLength, 32, 1, false), lightOf(tree.colour));
    glow.name = "light";
    glow.castShadow = true;
    glow.position.copy(point).addScaledVector(tangent, config.lightLength * (0.5 - ENTRY));
    glow.quaternion.setFromUnitVectors(up, tangent);
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
  first?.addEventListener("dispose", () => pool.forEach((lamp) => lamp.dispose()));
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
