import * as THREE from "three/webgpu";
import type { ColumnAt, Crossing } from "./grove";

/**
 * Where drawn surfaces cross a column of the world (World.md W96, W99, mine): a mountain's, a pipe's or a road's, each
 * at its height and facing up (a top) or down (an underside), read where a grove's tree stands or its outline lies. A
 * mesh's triangles, in the world, are sorted once into square columns of the floor (`COLUMN`), the first time a point
 * over the mesh is asked about, and kept while the mesh stands as it did; a point then reads its own column's triangles
 * alone, so 500 trees over a mountain cost a few milliseconds. A triangle faces as it is wound, turned for a mesh drawn
 * from its back (a pipe's lining, whose inside is what it bounds); one seen edge-on from above (a wall) crosses no column.
 */

/** How wide a column is, in metres (mine): a few of a mountain's triangles across. */
const COLUMN = 2;

/** A mesh's triangles in the world (`corners`, nine numbers each), whether each faces up, and, by column, the ones over it. */
type Columns = { key: string; corners: Float32Array; up: Uint8Array; columns: Map<number, number[]> };

const sorted = new WeakMap<THREE.Mesh, Columns>();

const columnOf = (x: number, z: number) => (Math.floor(x / COLUMN) + 50_000) * 100_000 + (Math.floor(z / COLUMN) + 50_000);

/** What makes a mesh's columns stale: its geometry, its points moved, or the mesh moved. */
const keyOf = (mesh: THREE.Mesh) => {
  const position = mesh.geometry.getAttribute("position");
  const version = position instanceof THREE.InterleavedBufferAttribute ? position.data.version : position.version;
  return `${mesh.geometry.uuid} ${version} ${mesh.matrixWorld.elements.join(" ")}`;
};

/** Whether a mesh's faces are seen from their back: drawn from it, or mirrored (but not both). */
const backOf = (mesh: THREE.Mesh) => {
  const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  return (material?.side === THREE.BackSide) !== mesh.matrixWorld.determinant() < 0;
};

function columnsOf(mesh: THREE.Mesh): Columns {
  const key = keyOf(mesh);
  const kept = sorted.get(mesh);
  if (kept?.key === key) return kept;
  const position = mesh.geometry.getAttribute("position");
  const index = mesh.geometry.getIndex();
  const count = index ? index.count : position.count;
  const corners = new Float32Array(count * 3);
  const point = new THREE.Vector3();
  for (let k = 0; k < count; k++) {
    point.fromBufferAttribute(position, index ? index.getX(k) : k).applyMatrix4(mesh.matrixWorld);
    corners[k * 3] = point.x;
    corners[k * 3 + 1] = point.y;
    corners[k * 3 + 2] = point.z;
  }
  const back = backOf(mesh);
  const up = new Uint8Array(Math.floor(count / 3));
  const columns = new Map<number, number[]>();
  for (let t = 0; t + 2 < count; t += 3) {
    const o = t * 3;
    const ax = corners[o], az = corners[o + 2], bx = corners[o + 3], bz = corners[o + 5], cx = corners[o + 6], cz = corners[o + 8];
    // The way the triangle faces, up or down: its normal's height, (b − a) × (c − a).
    const facing = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
    if (Math.abs(facing) < 1e-9) continue;
    up[t / 3] = facing > 0 !== back ? 1 : 0;
    for (let i = Math.floor(Math.min(ax, bx, cx) / COLUMN); i <= Math.floor(Math.max(ax, bx, cx) / COLUMN); i++) {
      for (let j = Math.floor(Math.min(az, bz, cz) / COLUMN); j <= Math.floor(Math.max(az, bz, cz) / COLUMN); j++) {
        const at = columnOf(i * COLUMN, j * COLUMN);
        const held = columns.get(at);
        if (held) held.push(o);
        else columns.set(at, [o]);
      }
    }
  }
  const made = { key, corners, up, columns };
  sorted.set(mesh, made);
  return made;
}

/** Where a mesh's triangles cross the column over a point of the floor. */
function crossingsOf({ corners: c, up, columns }: Columns, x: number, z: number, into: Crossing[]) {
  for (const o of columns.get(columnOf(x, z)) ?? []) {
    const ax = c[o], az = c[o + 2], bx = c[o + 3], bz = c[o + 5], cx = c[o + 6], cz = c[o + 8];
    const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
    const u = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d;
    const v = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d;
    const w = 1 - u - v;
    if (u < -1e-6 || v < -1e-6 || w < -1e-6) continue;
    into.push({ y: u * c[o + 1] + v * c[o + 4] + w * c[o + 7], up: up[o / 9] === 1 });
  }
}

/**
 * Where a set of drawn meshes cross each column of the world (W96, W99), their world matrices as they stand now. Two
 * meshes of one geometry standing alike (a mountain's surface and its floor cut) are read once; with `sides`, the figure's
 * (W101), once for each way they face, so a pipe's outside and its lining, and a closed end and its inside, are both met.
 */
export function meshColumnAt(meshes: readonly THREE.Mesh[], { sides = false } = {}): ColumnAt {
  const twins = new Set<string>();
  const over: { mesh: THREE.Mesh; box: THREE.Box3 }[] = [];
  for (const mesh of meshes) {
    const twin = `${mesh.geometry.uuid} ${sides ? backOf(mesh) : ""} ${mesh.matrixWorld.elements.join(" ")}`;
    if (twins.has(twin)) continue;
    twins.add(twin);
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    over.push({ mesh, box: mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld) });
  }
  return (x, z) => {
    const crossings: Crossing[] = [];
    for (const { mesh, box } of over) {
      if (x < box.min.x || x > box.max.x || z < box.min.z || z > box.max.z) continue;
      crossingsOf(columnsOf(mesh), x, z, crossings);
    }
    return crossings;
  };
}
