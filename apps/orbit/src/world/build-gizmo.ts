import * as THREE from "three/webgpu";

/**
 * The move gizmo (World.md W88; his: "I should be able to move anything in any direction … options like blender"):
 * three arrows from the middle of what is picked on the Sectors page, one an axis of the world, each in its own colour,
 * X east–west, Y up–down and Z north–south, as the card names them (the colours of a world whose Y is up: X red, Y
 * green, Z blue). A drag on an arrow moves what is picked along that axis alone. While a move keeps to an axis, a long
 * line along it through the middle shows which. Drawn over everything, lit by nothing, never fogged, each arrow the
 * same few pixels however far it is, so it is always there to take hold of.
 */
export type Axis = "x" | "y" | "z";
export const AXES: readonly Axis[] = ["x", "y", "z"];

/** Each axis's way in metres' axes, and its colour: the world's Raspberry, Fern and Ocean. */
export const AXIS_WAY: Record<Axis, readonly [number, number, number]> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
const AXIS_COLOUR: Record<Axis, string> = { x: "#c86b7e", y: "#6f8f63", z: "#4f7fa3" };

/** How long each arrow is on the screen, and how wide its head, in pixels (mine). */
export const GIZMO_PIXELS = 64;
const HEAD_PIXELS = 14;
/** How far the line of the axis kept to reaches either way, in metres. */
const LINE_REACH = 2000;

export type BuiltGizmo = {
  object: THREE.Group;
  /** Sizes the arrows for a camera and a view this many pixels tall. */
  scaleFor(camera: THREE.PerspectiveCamera, height: number): void;
  /** Where each arrow's head is in the world, as last sized. */
  heads(): Partial<Record<Axis, THREE.Vector3>>;
  /** Moves the gizmo with what it moves, while a move previews. */
  moveBy(by: THREE.Vector3): void;
};

/** The gizmo at a point of the world, an arrow each of `axes`; with `kept`, the line of the axis a move keeps to. */
export function buildGizmo(at: THREE.Vector3, kept: Axis | null = null, axes: readonly Axis[] = AXES): BuiltGizmo {
  const group = new THREE.Group();
  group.name = "gizmo";
  group.position.copy(at);
  const paint = (colour: string) => ({ color: colour, depthTest: false, depthWrite: false, transparent: true, fog: false });
  const arrows = axes.map((axis) => {
    const way = new THREE.Vector3(...AXIS_WAY[axis]);
    const shaft = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), way]), new THREE.LineBasicMaterial(paint(AXIS_COLOUR[axis])));
    shaft.name = `${axis} shaft`;
    shaft.renderOrder = 14;
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 20), new THREE.MeshBasicMaterial(paint(AXIS_COLOUR[axis])));
    head.name = `${axis} head`;
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), way);
    head.renderOrder = 15;
    group.add(shaft, head);
    return { axis, way, shaft, head };
  });
  if (kept) {
    const way = new THREE.Vector3(...AXIS_WAY[kept]);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([way.clone().multiplyScalar(-LINE_REACH), way.clone().multiplyScalar(LINE_REACH)]), new THREE.LineBasicMaterial(paint(AXIS_COLOUR[kept])));
    line.name = `${kept} line`;
    line.renderOrder = 13;
    group.add(line);
  }
  let size = 1;
  return {
    object: group,
    scaleFor(camera, height) {
      const across = 2 * Math.tan((camera.fov * Math.PI) / 360) / Math.max(1, height);
      size = camera.position.distanceTo(group.position) * across;
      for (const { way, shaft, head } of arrows) {
        shaft.scale.setScalar(size * GIZMO_PIXELS);
        head.scale.setScalar(size * HEAD_PIXELS);
        head.position.copy(way).multiplyScalar(size * GIZMO_PIXELS);
      }
    },
    heads: () => Object.fromEntries(arrows.map(({ axis, way }) => [axis, group.position.clone().addScaledVector(way, size * GIZMO_PIXELS)])) as Partial<Record<Axis, THREE.Vector3>>,
    moveBy(by) {
      group.position.copy(at).add(by);
    },
  };
}
