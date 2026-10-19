import * as THREE from "three/webgpu";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { Fn, normalView, normalize, vec3, sin, positionGeometry, mx_noise_float, mix, color } from "three/tsl";
import type { BuiltHuman } from "./build-human";
import { HUMAN_HEIGHT, clayHeightOf, type HumanConfig } from "./human";

/** World.md W108: the compact chamfered shell in references/clay-backpack-v2.png. */
export function buildClayBag(human: BuiltHuman, config: HumanConfig) {
  const object = new THREE.Group();
  object.name = "Clay's bag";
  const shell = new THREE.MeshStandardNodeMaterial({ color: "#a63b29", roughness: 0.72, flatShading: true });
  const webbing = new THREE.MeshStandardNodeMaterial({ color: "#a83b2c", roughness: 0.94, side: THREE.DoubleSide });
  const edging = new THREE.MeshStandardNodeMaterial({ color: "#68291f", roughness: 0.84 });
  const back = new THREE.MeshStandardNodeMaterial({ color: "#813124", roughness: 0.94 });
  const dark = new THREE.MeshStandardNodeMaterial({ color: "#392822", roughness: 0.8 });
  // The reference reads as broad coated-red planes. Keep the grain below the facet shading.
  const grain = mx_noise_float(positionGeometry.mul(1900));
  shell.normalNode = normalize(normalView.add(vec3(grain.mul(0.014), grain.mul(0.01), 0)));
  shell.colorNode = mix(color("#a23828"), color("#ab3e2c"), grain.mul(0.5).add(0.5));
  webbing.normalNode = Fn(() => normalize(normalView.add(vec3(
    sin(positionGeometry.y.mul(2300)).mul(0.055),
    sin(positionGeometry.x.mul(3600)).mul(0.03), 0,
  ))))();
  const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, name: string) => {
    const part = new THREE.Mesh(geometry, material);
    part.name = name;
    part.castShadow = part.receiveShadow = true;
    object.add(part);
    return part;
  };

  // Fit in metres to the retained character. The approved pack runs from the shoulders to above the hips.
  human.object.updateMatrixWorld(true);
  const chest = human.object.worldToLocal(human.bones.chest.getWorldPosition(new THREE.Vector3()));
  const shoulderTop = clayHeightOf(config) - (config.clayHeadHeight + config.clayNeckHeight) / 100;
  const height = Math.min(0.77 * clayHeightOf(config) / HUMAN_HEIGHT, (shoulderTop - config.clayLegLength / 100) * 0.77);
  const shoulderWidth = config.clayBody / 100 * 1.12;
  const width = shoulderWidth * 0.9; // His requested 10% narrower shell; shoulder fit stays body-sized.
  const bodyBack = -config.clayBodyDepth / 200;
  const top = shoulderTop - 0.025;
  const center = top - height / 2;
  object.position.y = center - chest.y;
  const point = (x: number, y: number, z: number) => new THREE.Vector3(x * width, y * height, bodyBack + z);
  const panel = (points: THREE.Vector3[], material: THREE.Material, name: string) => {
    const vertices: number[] = [];
    for (let i = 1; i < points.length - 1; i++) {
      vertices.push(...points[0].toArray(), ...points[i].toArray(), ...points[i + 1].toArray());
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    return mesh(geometry, material, name);
  };

  // A closed octagonal volume, with small rounded corners in its silhouette. The broad centre and eight
  // surrounding facets are real planes, not lines drawn over a rounded box. Keep his narrower shell bounds.
  const outline = [
    [-0.31, 0.5], [0.31, 0.5], [0.485, 0.32], [0.5, -0.30],
    [0.33, -0.5], [-0.33, -0.5], [-0.5, -0.30], [-0.485, 0.32],
  ];
  const faceOutline = [
    [-0.255, 0.265], [0.24, 0.265], [0.355, 0.125], [0.36, -0.285],
    [0.245, -0.405], [-0.25, -0.405], [-0.36, -0.275], [-0.355, 0.13],
  ];
  const face = faceOutline.map(([x, y]) => point(x, y, -0.35 - y * 0.025));
  panel(face, shell, "broad red central face");

  // Each clipped corner gets a 2 cm soft turn. Straight stretches stay straight; the shell retains its
  // clean polygon facets while the narrow side wall and rear lip round the formerly razor-sharp outline.
  const contour = outline.map(([x, y], i) => {
    const corner = new THREE.Vector2(x * width, y * height);
    const previous = outline[(i + outline.length - 1) % outline.length];
    const next = outline[(i + 1) % outline.length];
    const before = new THREE.Vector2(previous[0] * width, previous[1] * height).sub(corner).normalize();
    const after = new THREE.Vector2(next[0] * width, next[1] * height).sub(corner).normalize();
    const a = corner.clone().addScaledVector(before, 0.022);
    const b = corner.clone().addScaledVector(after, 0.022);
    return Array.from({ length: 4 }, (_, step) => {
      const t = step / 3;
      return a.clone().multiplyScalar((1 - t) ** 2).addScaledVector(corner, 2 * t * (1 - t)).addScaledVector(b, t * t);
    });
  });
  const ring = (scale: number, depth: number) => contour.map(corner => corner.map(p => new THREE.Vector3(p.x * scale, p.y * scale, bodyBack + depth)));
  const crown = ring(0.985, -0.235);
  const side = ring(1, -0.19);
  const lip = ring(0.99, -0.065);
  const lipBack = ring(0.985, -0.053);
  const body = ring(0.955, -0.026);
  for (let i = 0; i < outline.length; i++) {
    const next = (i + 1) % outline.length;
    panel([face[next], face[i], crown[i][3], crown[next][0]], shell, "broad red perimeter facet");
    panel([face[i], ...crown[i]], shell, "soft red facet corner");
  }
  const bridge = (a: THREE.Vector3[][], b: THREE.Vector3[][], material: THREE.Material, name: string) => {
    const aa = a.flat(), bb = b.flat();
    for (let i = 0; i < aa.length; i++) {
      const next = (i + 1) % aa.length;
      panel([aa[next], aa[i], bb[i], bb[next]], material, name);
    }
  };
  bridge(crown, side, shell, "soft shell edge chamfer");
  bridge(side, lip, shell, "red shell side wall");
  // One restrained dark-red closure at the body-facing edge; the front facets need no piping or rivets.
  bridge(lip, lipBack, edging, "dark-red perimeter closure");
  bridge(lipBack, body, back, "fitted red back panel bevel");
  panel(body.flat().toReversed(), back, "red body-facing back panel");

  // Retain separate flat normals at the large folds, but batch the small chamfer strips by finish.
  // The central face stays addressable for close-view review; every part remains in the bag's click target.
  for (const [material, name] of [[shell, "red chamfered shell"], [edging, "dark-red perimeter closure"], [back, "fitted red back panel"]] as const) {
    const parts = object.children.filter((part): part is THREE.Mesh => part instanceof THREE.Mesh && part.material === material && part.name !== "broad red central face");
    const geometry = mergeGeometries(parts.map(part => part.geometry));
    if (!geometry) continue;
    for (const part of parts) { object.remove(part); part.geometry.dispose(); }
    mesh(geometry, material, name);
  }

  type ClothBinding = {
    geometry: THREE.BufferGeometry; vertex: number; triangle: [number, number, number];
    barycentric: THREE.Vector3; offset: THREE.Vector3; normal: THREE.Vector3; original: THREE.Vector3;
    target: THREE.Vector3; surfaceNormal: THREE.Vector3; weight: number;
  };
  const cloth: ClothBinding[] = [];
  const ribbons: { geometry: THREE.BufferGeometry; original: Float32Array; scratch: Float32Array; spans: number[]; halfWidth: number }[] = [];
  // Thick flat ribbons wrap over the actual shoulder depth and return under the arms.
  const ribbon = (points: THREE.Vector3[], width: number, name: string, axis = new THREE.Vector3(1,0,0)) => {
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
    const vertices: number[] = [], indices: number[] = [];
    for (let i=0; i<=48; i++) {
      const p=curve.getPoint(i/48), tangent=curve.getTangent(i/48);
      const across=axis.clone().addScaledVector(tangent,-axis.dot(tangent)).normalize().multiplyScalar(width/2);
      const normal=new THREE.Vector3().crossVectors(across,tangent).normalize().multiplyScalar(0.003);
      for (const depth of [-1,1]) for (const side of [-1,1]) vertices.push(...p.clone().addScaledVector(across,side).addScaledVector(normal,depth).toArray());
      if(i<48) { const a=i*4; for (const [u,v] of [[0,1],[3,2],[2,0],[1,3]]) indices.push(a+u,a+v,a+u+4,a+v,a+v+4,a+u+4); }
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    const spans = Array.from({ length: 48 }, (_, i) => curve.getPoint(i / 48).distanceTo(curve.getPoint((i + 1) / 48)));
    ribbons.push({ geometry, original: new Float32Array(vertices), scratch: new Float32Array(vertices.length), spans, halfWidth: width / 2 });
    mesh(geometry,webbing,name);
    return geometry;
  };
  const at = (x: number,y: number,z: number) => new THREE.Vector3(x,y-center,z);
  const strapX = shoulderWidth * 0.46, front = config.clayBodyDepth / 200 + 0.018;
  const trunk = human.object.getObjectByName("trunk");
  const ray = new THREE.Raycaster();
  const skinAt = (origin: THREE.Vector3, direction: THREE.Vector3) => {
    ray.set(human.object.localToWorld(origin.clone()),direction.clone().transformDirection(human.object.matrixWorld));
    const hit = trunk ? ray.intersectObject(trunk,true)[0] : undefined;
    return hit ? human.object.worldToLocal(hit.point.clone()) : null;
  };
  for (const side of [-1,1]) {
    const shoulder: THREE.Vector3[]=[];
    for(let i=0;i<=12;i++) {
      const z=bodyBack + (front-bodyBack)*i/12;
      const hit=skinAt(new THREE.Vector3(side*strapX,shoulderTop+0.1,z),new THREE.Vector3(0,-1,0));
      if(hit && hit.y > shoulderTop - 0.16) shoulder.push(at(hit.x,hit.y+0.012,hit.z));
    }
    const frontPoints: THREE.Vector3[]=[];
    for(let i=0;i<=5;i++) {
      const y=top-0.09-height*0.49*i/5;
      const x=side*(strapX-shoulderWidth*.055*i/5);
      const hit=skinAt(new THREE.Vector3(x,y,1),new THREE.Vector3(0,0,-1));
      frontPoints.push(at(x,y,hit?hit.z+0.014:front));
    }
    const strap = ribbon([
      at(side*width*0.3,top-0.07,bodyBack-0.04),
      ...shoulder,...frontPoints,
      at(side*(width*0.48),top-height*0.78,front*0.15),
      at(side*(width*0.48),top-height*0.81,bodyBack-0.06),
    ],0.09,"woven red shoulder strap");
    // Bind the full strap width to the real skin triangles, not only its centre line. The same triangles
    // deform with the shoulder in podium, walking and flight poses, so an edge cannot disappear into Clay.
    if (trunk instanceof THREE.Mesh) {
      const positions = strap.getAttribute("position");
      const skinPositions = trunk.geometry.getAttribute("position");
      const indices = trunk.geometry.index;
      const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
      for (let i=0;i<positions.count;i++) {
        const p = new THREE.Vector3().fromBufferAttribute(positions,i);
        p.y += center;
        const upper = p.y > top - 0.22;
        if (!upper) continue;
        const direction = new THREE.Vector3(0,-1,0);
        const origin = new THREE.Vector3(p.x,shoulderTop+0.15,p.z);
        ray.set(human.object.localToWorld(origin),direction.transformDirection(human.object.matrixWorld));
        const hit = ray.intersectObject(trunk,false)[0];
        if (!hit || hit.faceIndex == null) continue;
        const surface = trunk.worldToLocal(hit.point.clone());
        // A downward shoulder ray can miss the torso and hit a thigh or foot. Such a distant attachment
        // retains a metre-long offset which rotates into a spike during a stride. Only bind nearby shoulder skin.
        if (surface.y < top - 0.24 || surface.distanceTo(p) > 0.065) continue;
        const face = hit.faceIndex * 3;
        const triangle: [number,number,number] = indices ? [indices.getX(face),indices.getX(face+1),indices.getX(face+2)] : [face,face+1,face+2];
        a.fromBufferAttribute(skinPositions,triangle[0]); b.fromBufferAttribute(skinPositions,triangle[1]); c.fromBufferAttribute(skinPositions,triangle[2]);
        const barycentric = THREE.Triangle.getBarycoord(trunk.worldToLocal(hit.point.clone()),a,b,c,new THREE.Vector3());
        if (barycentric) {
          const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
          const original = new THREE.Vector3().fromBufferAttribute(positions,i);
          const offset = new THREE.Vector3(original.x,original.y+center,original.z).sub(surface);
          const clearance = 0.01 + (i%4<2?-0.003:0.003);
          offset.addScaledVector(normal,Math.max(0,clearance-offset.dot(normal)));
          cloth.push({geometry:strap,vertex:i,triangle,barycentric,offset,normal,original,target:new THREE.Vector3(),surfaceNormal:new THREE.Vector3(),weight:THREE.MathUtils.smoothstep(p.y,top-0.22,top-0.12)});
        }
      }
    }
    const buckleAt=frontPoints[3];
    // Open dark frame with the red webbing showing through, rather than a solid black block.
    for(const [w,h,x,y] of [[.105,.012,0,.033],[.105,.012,0,-.033],[.012,.066,-.047,0],[.012,.066,.047,0],[.094,.012,0,0]]) {
      const buckle=mesh(new RoundedBoxGeometry(w,h,.017,2,.004),dark,"strap adjuster frame");
      buckle.position.copy(buckleAt).add(new THREE.Vector3(x,y,.012));
    }
  }
  human.bones.chest.add(object);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const normal = new THREE.Vector3(), clothPoint = new THREE.Vector3(), clothEdge = new THREE.Vector3();
  const changed = new Set<THREE.BufferGeometry>();
  const skinToBag = new THREE.Matrix4();
  const offset = new THREE.Vector3(), rotation = new THREE.Quaternion();
  const previous = new THREE.Vector3(), next = new THREE.Vector3(), fairPoint = new THREE.Vector3();
  const across = new THREE.Vector3(), thickness = new THREE.Vector3(), section = new THREE.Vector3();
  let lastSkinVersion = -1;
  const update = () => {
    if (!(trunk instanceof THREE.Mesh)) return;
    const skin = trunk.geometry.getAttribute("position");
    const version = skin instanceof THREE.BufferAttribute ? skin.version : skin.data.version;
    if (version === lastSkinVersion) return;
    lastSkinVersion = version;
    object.updateWorldMatrix(true,false);
    trunk.updateWorldMatrix(true,false);
    skinToBag.copy(object.matrixWorld).invert().multiply(trunk.matrixWorld);
    changed.clear();
    for (const ribbon of ribbons) {
      (ribbon.geometry.getAttribute("position").array as Float32Array).set(ribbon.original);
    }
    for (const binding of cloth) {
      a.fromBufferAttribute(skin,binding.triangle[0]); b.fromBufferAttribute(skin,binding.triangle[1]); c.fromBufferAttribute(skin,binding.triangle[2]);
      normal.subVectors(b,a).cross(clothEdge.subVectors(c,a)).normalize();
      clothPoint.copy(a).multiplyScalar(binding.barycentric.x).addScaledVector(b,binding.barycentric.y).addScaledVector(c,binding.barycentric.z);
      rotation.setFromUnitVectors(binding.normal,normal);
      clothPoint.add(offset.copy(binding.offset).applyQuaternion(rotation));
      clothPoint.applyMatrix4(skinToBag).lerp(binding.original,1-binding.weight);
      binding.target.copy(clothPoint);
      binding.surfaceNormal.copy(normal).transformDirection(skinToBag);
      binding.geometry.getAttribute("position").setXYZ(binding.vertex,clothPoint.x,clothPoint.y,clothPoint.z);
      changed.add(binding.geometry);
    }
    // A contact can end on one edge before the other. Fair the four longitudinal rails together through
    // that transition, instead of leaving a pointed corner where a skin-bound vertex meets a fixed one.
    // Project each pass back above its contact plane so smoothing cannot bury an edge in the shoulder.
    for (let pass = 0; pass < 12; pass++) {
      for (const ribbon of ribbons) {
        const positions = ribbon.geometry.getAttribute("position");
        ribbon.scratch.set(positions.array);
        for (let row = 1; row < 48; row++) {
          const before = ribbon.spans[row - 1], after = ribbon.spans[row];
          for (let rail = 0; rail < 4; rail++) {
            const vertex = row * 4 + rail;
            const weight = THREE.MathUtils.smoothstep(ribbon.original[vertex * 3 + 1] + center, top - 0.3, top - 0.17);
            previous.fromBufferAttribute(positions, vertex - 4);
            next.fromBufferAttribute(positions, vertex + 4);
            fairPoint.copy(previous).lerp(next, before / Math.max(0.00001, before + after));
            clothPoint.fromBufferAttribute(positions, vertex).lerp(fairPoint, weight * 0.5);
            clothPoint.toArray(ribbon.scratch, vertex * 3);
          }
        }
        (positions.array as Float32Array).set(ribbon.scratch);
        // Cloth bends across the shoulder without narrowing into a triangular tab. Keep each section's
        // original width and thickness; contact corrections below carry the whole section together.
        for (let row = 1; row < 48; row++) {
          const first = row * 4;
          previous.fromBufferAttribute(positions, first);
          next.fromBufferAttribute(positions, first + 1);
          across.subVectors(next, previous);
          section.copy(previous).add(next);
          thickness.copy(section).multiplyScalar(-0.5);
          previous.fromBufferAttribute(positions, first + 2);
          next.fromBufferAttribute(positions, first + 3);
          across.add(offset.subVectors(next, previous)).normalize();
          section.add(previous).add(next).multiplyScalar(0.25);
          thickness.addScaledVector(previous, 0.5).addScaledVector(next, 0.5);
          thickness.addScaledVector(across, -thickness.dot(across)).normalize();
          for (let rail = 0; rail < 4; rail++) {
            clothPoint.copy(section).addScaledVector(across, rail % 2 ? ribbon.halfWidth : -ribbon.halfWidth).addScaledVector(thickness, rail < 2 ? -0.003 : 0.003);
            positions.setXYZ(first + rail, clothPoint.x, clothPoint.y, clothPoint.z);
          }
        }
      }
      for (const binding of cloth) {
        const positions = binding.geometry.getAttribute("position");
        clothPoint.fromBufferAttribute(positions, binding.vertex);
        const inside = offset.subVectors(binding.target, clothPoint).dot(binding.surfaceNormal);
        if (inside > 0) {
          const first = Math.floor(binding.vertex / 4) * 4;
          for (let rail = 0; rail < 4; rail++) {
            clothPoint.fromBufferAttribute(positions, first + rail).addScaledVector(binding.surfaceNormal, inside);
            positions.setXYZ(first + rail, clothPoint.x, clothPoint.y, clothPoint.z);
          }
        }
      }
    }
    for (const geometry of changed) {
      geometry.getAttribute("position").needsUpdate = true;
      geometry.computeVertexNormals(); geometry.computeBoundingSphere();
    }
  };
  update();
  return { object, update };
}
