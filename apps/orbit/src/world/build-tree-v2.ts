// Trees version 2, frozen (World.md W72); nothing draws this.
import * as THREE from "three/webgpu";
import { mix, output, positionWorld, vec4 } from "three/tsl";

import type { MountainFoot } from "./mountains";
import { ENTRY, treesOf, trunkAt, type Tree, type TreesConfig } from "./tree-v2";

/**
 * What makes the trees (`tree.ts`, World.md W67, W68, W71): each a trunk, a tube of one radius straight up to where its
 * bend starts and along one continuous arc from there, capped at its tip, and its light, a closed tube wider than the
 * trunk, its top and bottom covered (his, World.md W67), aligned on the trunk's tangent at the tip, the trunk entering
 * it through its bottom (`ENTRY`). The trunk is a flat colour lit by
 * the world's sun and sky, casting its shadow (W49); the light emits its colour, one of the four each tree draws
 * (W71), lit by nothing, and carries a point light of that colour that falls on what stands within its Reach. Both
 * take the base gas (`airAt`, the world base's fog) as the mountains do, so a tree's foot stands in it and its light
 * rises clear of it.
 *
 * Every tree stands on the world's floor at y 0, its base in the gas, placed round the mountains' feet (`feet`); the
 * grove is one group, a group a tree. Version 1's builder, for trees a few metres tall, is frozen (`build-tree-v1.ts`).
 *
 * The point lights are a pool (mine, W71): a point light a tree cost a frame about 95 ms here at forty trees as at two
 * hundred, and 21 ms with none, so the grove keeps `LIT_TREES` point lights and carries them, each frame, to the trees
 * nearest the camera (`near`), in their colours; every tree lights what stands near it when the visitor is near it,
 * and a far tree's light is its tube alone.
 */
export type BuiltTrees = { object: THREE.Group; /** Carry the point lights to the trees nearest this point (the camera's). */ near(at: THREE.Vector3): void };

/** How many trees light what stands near them at once (mine): the point lights the grove carries to the nearest trees. */
export const LIT_TREES = 12;

export function buildTrees(config: TreesConfig, feet: readonly MountainFoot[] = [], airAt?: (p: typeof positionWorld) => THREE.Node<"vec4">): BuiltTrees {
  const grove = new THREE.Group();
  grove.name = "trees";
  const air = airAt?.(positionWorld);
  const trunk = new THREE.MeshStandardNodeMaterial({ color: config.trunkColour, roughness: 0.55, metalness: 0, fog: !airAt });
  if (air) trunk.outputNode = vec4(mix(output.rgb, air.rgb, air.a), 1);
  // The lights: a material a colour, shared by every tree of that colour. A light is closed, so only its outside is
  // ever seen: one side.
  const lights = new Map<string, THREE.MeshBasicNodeMaterial>();
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
  // Where each tree's light is, in the world, and its colour: what the pool's point lights are carried to.
  const lamps: { at: THREE.Vector3; colour: string }[] = [];
  for (const tree of treesOf(config, feet)) {
    const object = new THREE.Group();
    object.name = `tree ${tree.seed}`;
    object.position.set(tree.x, 0, tree.z);
    object.rotation.y = -(tree.lean * Math.PI) / 180;

    // The trunk: straight, then the arc to the tip, one radius all the way, open at its base (in the gas) and capped at the tip.
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
    // `ENTRY` of its length; a point light at its middle.
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(config.lightRadius, config.lightRadius, config.lightLength, 32, 1, false), lightOf(tree.colour));
    glow.name = "light";
    glow.castShadow = true;
    glow.position.copy(point).addScaledVector(tangent, config.lightLength * (0.5 - ENTRY));
    glow.quaternion.setFromUnitVectors(up, tangent);
    object.add(stem, cap, glow);
    if (config.lightReach > 0 && config.lightBrightness > 0) lamps.push({ at: glow.position.clone().applyAxisAngle(up, object.rotation.y).add(object.position), colour: tree.colour });
    grove.add(object);
  }
  // The pool: as many point lights as trees light at once, or as there are lit trees; none casts a shadow of its own.
  const pool = Array.from({ length: Math.min(LIT_TREES, lamps.length) }, () => {
    const lamp = new THREE.PointLight("#ffffff", config.lightBrightness, config.lightReach, 2);
    lamp.name = "light's light";
    lamp.castShadow = false;
    grove.add(lamp);
    return lamp;
  });
  trunk.addEventListener("dispose", () => pool.forEach((lamp) => lamp.dispose()));
  let lastAt = "";
  const near = (at: THREE.Vector3) => {
    if (!pool.length) return;
    // The camera where it was last frame carries nothing.
    const key = `${at.x.toFixed(1)},${at.y.toFixed(1)},${at.z.toFixed(1)}`;
    if (key === lastAt) return;
    lastAt = key;
    const nearest = lamps.map((lamp) => ({ lamp, away: lamp.at.distanceToSquared(at) })).sort((a, b) => a.away - b.away);
    pool.forEach((light, index) => {
      light.position.copy(nearest[index].lamp.at);
      light.color.set(nearest[index].lamp.colour);
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
