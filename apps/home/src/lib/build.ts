import * as THREE from "three";

import { DIRECTION, stairParts, wallLength, wallPieces, type At, type Block, type House, type MaterialId } from "@/lib/house";
import { DOOR_SWING } from "@/lib/tour";

/**
 * The description, built (Home.md H2, H5): every wall, pillar, slab, block and stair a box or an extrusion in one
 * flat colour, with its edges drawn, so the model reads as the drawing it is. Plan x is scene x, the plan's y (down
 * the page) is scene z, and a level is scene y. Each mesh carries the level its element's foot stands on in
 * `userData.base`, so a view can take everything from a level up off (`cut`). A door's leaf hangs in a pivot at its
 * hinge (`DoorLeaf` in its `userData.door`), so the tour can swing it open as the camera comes (H9).
 */

/** A leaf of a door: hinged at the jamb nearer the wall's start (−1) or its end (+1), or sliding along the wall. */
export type DoorLeaf = { id: string; hinge: -1 | 1; width: number; slides: boolean; angle: number; normal: readonly [number, number] };

/**
 * Open a leaf `open` of the way (0 closed, 1 open), swinging it away from the side the camera is on (`side`, which
 * side of the wall's normal); a sliding leaf's second leaf runs back over its first instead.
 */
export function setDoorLeaf(pivot: THREE.Group, open: number, side: 1 | -1) {
  const leaf = pivot.userData.door as DoorLeaf | undefined;
  if (!leaf) return;
  if (leaf.slides) {
    const mesh = pivot.children[0];
    if (mesh && leaf.hinge > 0) mesh.position.x = -leaf.hinge * (leaf.width / 2) - open * (leaf.width - 0.1);
    return;
  }
  pivot.rotation.y = leaf.angle - leaf.hinge * side * open * DOOR_SWING;
}

/** Every door's leaves in a built house, by the door's id. */
export function doorLeaves(group: THREE.Group): Map<string, THREE.Group[]> {
  const doors = new Map<string, THREE.Group[]>();
  group.traverse((object) => {
    const leaf = object.userData.door as DoorLeaf | undefined;
    if (leaf && object instanceof THREE.Group) doors.set(leaf.id, [...(doors.get(leaf.id) ?? []), object]);
  });
  return doors;
}

const EDGE = new THREE.LineBasicMaterial({ color: 0x3a3632, transparent: true, opacity: 0.4 });

export function buildHouse(house: House): THREE.Group {
  const group = new THREE.Group();
  const materials = new Map<MaterialId, THREE.MeshStandardMaterial>();
  for (const material of house.materials) {
    materials.set(material.id, new THREE.MeshStandardMaterial({ color: material.colour, roughness: 0.92, metalness: 0 }));
  }
  const paint = (id: MaterialId) => {
    const material = materials.get(id);
    if (!material) throw new Error(`home: no material "${id}"`);
    return material;
  };
  const add = (id: string, geometry: THREE.BufferGeometry, material: MaterialId, foot: number, parent: THREE.Object3D = group) => {
    const mesh = new THREE.Mesh(geometry, paint(material));
    mesh.name = id;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.base = foot;
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 20), EDGE));
    parent.add(mesh);
    return mesh;
  };
  /** A box `w` along it, `h` tall, `d` through it, its foot's centre at plan (x, y) on `level`, turned `angle` about up. */
  const box = (id: string, material: MaterialId, [w, h, d]: readonly [number, number, number], [x, level, y]: readonly [number, number, number], angle: number, foot: number) => {
    const mesh = add(id, new THREE.BoxGeometry(w, h, d), material, foot);
    mesh.position.set(x, level + h / 2, y);
    mesh.rotation.y = angle;
    return mesh;
  };
  const block = (b: Block) => {
    const [[x0, y0], [x1, y1]] = b.corners;
    box(b.id, b.material, [Math.abs(x1 - x0), b.height, Math.abs(y1 - y0)], [(x0 + x1) / 2, b.base, (y0 + y1) / 2], 0, b.base);
  };
  /** A member from one point of the house to another, sloped or upright: `h` tall and `d` across in section. */
  const member = (id: string, material: MaterialId, a: At, b: At, [h, d]: readonly [number, number], foot: number) => {
    const dx = b[0] - a[0];
    const dh = b[1] - a[1];
    const dy = b[2] - a[2];
    const flat = Math.hypot(dx, dy);
    const geometry = new THREE.BoxGeometry(Math.hypot(flat, dh), h, d);
    // Tilted first, about its own across axis, then turned along the plan, so its tall side stays upright.
    geometry.rotateZ(Math.atan2(dh, flat));
    geometry.rotateY(flat > 1e-6 ? -Math.atan2(dy, dx) : 0);
    const mesh = add(id, geometry, material, foot);
    mesh.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    return mesh;
  };

  for (const pillar of house.pillars) {
    box(pillar.id, pillar.material, [pillar.size[0], pillar.height, pillar.size[1]], [pillar.at[0], pillar.base, pillar.at[1]], 0, pillar.base);
  }

  for (const wall of house.walls) {
    const length = wallLength(wall);
    if (length < 1e-6) continue;
    const ux = (wall.to[0] - wall.from[0]) / length;
    const uy = (wall.to[1] - wall.from[1]) / length;
    // A box runs along its own x; turning it by −atan2 puts that along the wall on the plan.
    const angle = -Math.atan2(uy, ux);
    const along = (s: number): readonly [number, number] => [wall.from[0] + ux * s, wall.from[1] + uy * s];
    wallPieces(wall).forEach((piece, i) => {
      const [x, y] = along((piece.s0 + piece.s1) / 2);
      box(`${wall.id}-${i}`, wall.material, [piece.s1 - piece.s0, piece.height, wall.thickness], [x, piece.base, y], angle, wall.base);
    });
    for (const opening of wall.openings ?? []) {
      if (opening.kind === "door") {
        // A leaf a little short of its opening, closed, in the wall's middle; two leaves meet at the centre. Each hangs
        // in a pivot at its hinge — the jamb nearer the wall's start for one leaf, either jamb for two — turned along
        // the wall, the leaf reaching from the hinge toward the opening's middle; a sliding door's leaves hang the same
        // way, a track apart, and slide instead of swinging (`setDoorLeaf`).
        const leaves = opening.leaves ?? 1;
        const leaf = opening.width / leaves;
        for (let l = 0; l < leaves; l++) {
          const hinge: -1 | 1 = l === 0 ? -1 : 1;
          const centre = opening.at + (l - (leaves - 1) / 2) * leaf;
          const [hx, hy] = along(centre + (hinge * leaf) / 2);
          const pivot = new THREE.Group();
          pivot.name = `${opening.id}-leaf-${l}`;
          pivot.position.set(hx, wall.base, hy);
          pivot.rotation.y = angle;
          pivot.userData.door = { id: opening.id, hinge, width: leaf, slides: !!opening.slides, angle, normal: [-uy, ux] } satisfies DoorLeaf;
          group.add(pivot);
          const height = opening.height - 0.04;
          const mesh = add(`${opening.id}-${l}`, new THREE.BoxGeometry(leaf - 0.06, height, 0.125), "door", wall.base, pivot);
          mesh.position.set((-hinge * leaf) / 2, height / 2, opening.slides ? hinge * 0.07 : 0);
        }
      } else {
        // The frame — two jambs, a head, a sill, a mullion down a wide one — and the opening left open to see through.
        const foot = wall.base + opening.sill;
        const t = Math.min(wall.thickness, 0.25);
        const [x, y] = along(opening.at);
        for (const [side, s] of [["l", opening.at - opening.width / 2 + 0.1], ["r", opening.at + opening.width / 2 - 0.1]] as const) {
          const [jx, jy] = along(s);
          box(`${opening.id}-jamb-${side}`, "frame", [0.2, opening.height, t], [jx, foot, jy], angle, wall.base);
        }
        box(`${opening.id}-head`, "frame", [opening.width, 0.2, t], [x, foot + opening.height - 0.2, y], angle, wall.base);
        box(`${opening.id}-sill`, "frame", [opening.width, 0.2, t], [x, foot, y], angle, wall.base);
        if (opening.width > 4) box(`${opening.id}-mullion`, "frame", [0.15, opening.height, t * 0.8], [x, foot, y], angle, wall.base);
      }
    }
  }

  for (const slab of house.slabs) {
    const shape = new THREE.Shape(slab.outline.map(([x, y]) => new THREE.Vector2(x, y)));
    for (const hole of slab.holes ?? []) shape.holes.push(new THREE.Path(hole.map(([x, y]) => new THREE.Vector2(x, y))));
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: slab.thickness, bevelEnabled: false });
    // Drawn flat on the plan and extruded along z; turned a quarter about x, the plan's y lies along scene z and the
    // thickness hangs under `top`.
    const mesh = add(slab.id, geometry, slab.material, slab.top - slab.thickness);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = slab.top;
  }

  house.blocks.forEach(block);
  for (const stair of house.stairs) stairParts(stair).forEach(block);

  for (const flight of house.flights) {
    const [ux, uy] = DIRECTION[flight.climbs];
    const [vx, vy] = [-uy, ux];
    const angle = -Math.atan2(uy, ux);
    const rise = flight.to - flight.from;
    const n = Math.max(2, Math.ceil(rise / flight.riser));
    const r = rise / n;
    const s = flight.run / n;
    const at = (along: number, across: number, level: number): At =>
      [flight.foot[0] + ux * along + vx * across, level, flight.foot[1] + uy * along + vy * across];
    // Each tread's far edge is the next riser's line; the last riser lands on the floor it reaches.
    for (let i = 1; i < n; i++) {
      const [x, level, y] = at((i + 1) * s - flight.tread / 2, 0, flight.from + i * r);
      box(`${flight.id}-tread-${i}`, flight.material, [flight.tread, 0.125, flight.width], [x, level - 0.125, y], angle, flight.from);
    }
    for (const [side, across] of [["l", flight.width / 2 - 0.1], ["r", -flight.width / 2 + 0.1]] as const) {
      member(`${flight.id}-stringer-${side}`, flight.material, at(0, across, flight.from + 0.1), at(flight.run, across, flight.to + 0.1), [0.6, 0.2], flight.from);
      if (flight.rail > 0) {
        member(`${flight.id}-rail-${side}`, flight.material, at(0, across, flight.from + flight.rail), at(flight.run, across, flight.to + flight.rail), [0.15, 0.15], flight.from);
        for (let j = 0; j <= n; j += 3) {
          const level = flight.from + j * r;
          member(`${flight.id}-post-${side}-${j}`, flight.material, at(j * s, across, level + 0.3), at(j * s, across, level + flight.rail), [0.1, 0.1], flight.from);
        }
      }
    }
  }

  for (const railing of house.railings) {
    const length = wallLength(railing);
    if (length < 1e-6) continue;
    const ux = (railing.to[0] - railing.from[0]) / length;
    const uy = (railing.to[1] - railing.from[1]) / length;
    const at = (along: number, level: number): At => [railing.from[0] + ux * along, level, railing.from[1] + uy * along];
    const top = railing.base + railing.height;
    member(`${railing.id}-top`, railing.material, at(0, top), at(length, top), [0.15, 0.15], railing.base);
    member(`${railing.id}-mid`, railing.material, at(0, railing.base + railing.height / 2), at(length, railing.base + railing.height / 2), [0.1, 0.1], railing.base);
    const posts = Math.max(1, Math.ceil(length / 3));
    for (let j = 0; j <= posts; j++) {
      member(`${railing.id}-post-${j}`, railing.material, at((j * length) / posts, railing.base), at((j * length) / posts, top), [0.1, 0.1], railing.base);
    }
  }

  return group;
}
