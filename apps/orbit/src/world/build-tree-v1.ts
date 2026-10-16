/** Trees version 1's builder, frozen beside version 2 (`build-tree.ts`, World.md W68). Nothing draws this. */
import * as THREE from "three/webgpu";
import { mix, output, positionWorld, vec4 } from "three/tsl";

import { ENTRY, treesOf, trunkAt, type Tree, type TreesConfig } from "./tree-v1";

/**
 * What makes the trees (`tree.ts`, World.md W67): each a trunk, a tube of one radius along one continuous arc, capped
 * at its tip, and its light, an open tube wider than the trunk, aligned on the trunk's tangent at the tip, the trunk
 * entering it (`ENTRY`). The trunk is a flat colour lit by the world's sun and sky, casting its shadow (W49); the light
 * emits its colour, lit by nothing, and carries a point light that falls on what stands within its Reach. Both take the
 * base gas (`airAt`, the world base's fog) as the mountains do, so a far tree fades into it rather than cutting it.
 *
 * Every tree stands on the world's floor at y 0, its base in the gas; the grove is one group, a group a tree.
 */
export function buildTrees(config: TreesConfig, airAt?: (p: typeof positionWorld) => THREE.Node<"vec4">): THREE.Group {
  const grove = new THREE.Group();
  grove.name = "trees";
  const trunk = new THREE.MeshStandardNodeMaterial({ color: config.trunkColour, roughness: 0.55, metalness: 0, fog: !airAt });
  const light = new THREE.MeshBasicNodeMaterial({ color: config.lightColour, side: THREE.DoubleSide, fog: !airAt });
  if (airAt) {
    const air = airAt(positionWorld);
    trunk.outputNode = vec4(mix(output.rgb, air.rgb, air.a), 1);
    light.outputNode = vec4(mix(output.rgb, air.rgb, air.a), 1);
  }
  const up = new THREE.Vector3(0, 1, 0);
  const front = new THREE.Vector3(0, 0, 1);
  for (const tree of treesOf(config)) {
    const object = new THREE.Group();
    object.name = `tree ${tree.seed}`;
    object.position.set(tree.x, 0, tree.z);
    object.rotation.y = -(tree.lean * Math.PI) / 180;

    // The trunk: the arc from the base to the tip, one radius all the way, open at its base (in the gas) and capped at the tip.
    const radius = config.trunkRadius / 100;
    const stem = new THREE.Mesh(new THREE.TubeGeometry(new Arc(tree), 48, radius, 16, false), trunk);
    stem.name = "trunk";
    stem.castShadow = true;
    stem.receiveShadow = true;
    const tip = trunkAt(tree, tree.length);
    const point = new THREE.Vector3(...tip.point);
    const tangent = new THREE.Vector3(...tip.tangent).normalize();
    const cap = new THREE.Mesh(new THREE.CircleGeometry(radius, 16), trunk);
    cap.name = "trunk tip";
    cap.position.copy(point);
    cap.quaternion.setFromUnitVectors(front, tangent);
    cap.castShadow = true;

    // The light: an open tube on the tangent, the trunk entering it by `ENTRY` of its length; a point light at its middle.
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(config.lightRadius / 100, config.lightRadius / 100, config.lightLength, 24, 1, true), light);
    glow.name = "light";
    glow.castShadow = true;
    glow.position.copy(point).addScaledVector(tangent, config.lightLength * (0.5 - ENTRY));
    glow.quaternion.setFromUnitVectors(up, tangent);
    object.add(stem, cap, glow);
    if (config.lightReach > 0 && config.lightBrightness > 0) {
      const lamp = new THREE.PointLight(config.lightColour, config.lightBrightness, config.lightReach, 2);
      lamp.name = "light's light";
      lamp.position.copy(glow.position);
      // The grove's lights share the main pass; none casts a shadow of its own.
      lamp.castShadow = false;
      glow.geometry.addEventListener("dispose", () => lamp.dispose());
      object.add(lamp);
    }
    grove.add(object);
  }
  return grove;
}

/** The trunk's curve for three.js: the arc of `trunkAt`, from the base (0) to the tip (1). */
class Arc extends THREE.Curve<THREE.Vector3> {
  constructor(private readonly tree: Pick<Tree, "bend" | "length">) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const { point } = trunkAt(this.tree, t * this.tree.length);
    return target.set(point[0], point[1], point[2]);
  }
}
