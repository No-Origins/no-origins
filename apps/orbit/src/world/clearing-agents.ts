import * as THREE from "three/webgpu";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { COLOURS } from "./colours";
import { motionMs, motionNumber } from "@no-origins/ui/lib/motion";
import { bumpMap, float, mx_noise_float, positionLocal } from "three/tsl";

/** W108, clay companions v1: familiar silhouettes with hand-shaped bodies and individual expressions. */
export function buildClearingAgents(ring: (x: number, z: number) => void) {
  const object = new THREE.Group();
  object.name = "clay-companions-v1";
  const positions: THREE.Vector2[] = [];
  const tops: number[] = [];
  type Feature = { mesh: THREE.Mesh; role: "eye" | "brow" | "mouth" | "shade" | "visor"; position: THREE.Vector3; scale: THREE.Vector3; side: number };
  const faces: { index: number; group: THREE.Group; features: Feature[]; restYaw: number; response: number; blink: number; pulse: number }[] = [];
  let previousHover = -1, trackingClay = false;
  const center = { x: 0, z: 8.8 };
  // His seating sketch: three places each side of Clay, opening toward the screens.
  const places = [[-9.4, 3.7], [-7.2, 6.7], [-3.6, 8.3], [3.6, 8.3], [7.2, 6.7], [9.4, 3.7]];
  const ink = new THREE.MeshStandardNodeMaterial({ color: "#352d38", roughness: 0.9 });
  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D) {
    const made = new THREE.Mesh(geometry, material); made.castShadow = made.receiveShadow = true;
    parent.add(made); return made;
  }
  function clay(color: string) {
    const material = new THREE.MeshPhysicalNodeMaterial({ color, roughness: 0.96, metalness: 0,
      sheen: 0.08, sheenRoughness: 1, specularIntensity: 0.15 });
    material.normalNode = bumpMap(mx_noise_float(positionLocal.mul(145)).mul(0.0008)
      .add(mx_noise_float(positionLocal.mul(42)).mul(0.0014)), float(1));
    return material;
  }
  function turned(profile: number[][]) {
    const curve = new THREE.CatmullRomCurve3(profile.map(([r, y]) => new THREE.Vector3(r, y, 0)));
    return new THREE.LatheGeometry(curve.getPoints(64).map(p => new THREE.Vector2(Math.max(0, p.x), p.y)), 80);
  }
  function soften(source: THREE.BufferGeometry, character: number) {
    const p = source.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const pressure = Math.sin(y * 4 + character * 1.7) * 0.012 + Math.sin(x * 5 + z * 4) * 0.007;
      // Broad, continuous irregularities suggest pressure from fingers, without noisy silhouettes.
      p.setXYZ(i, x * (1 + pressure) + Math.sin(y * 2) * 0.013, Math.max(0, y), z * (1 - pressure * 0.7));
    }
    source.deleteAttribute("normal"); source.deleteAttribute("uv");
    const geometry = mergeVertices(source, 0.00001); geometry.computeVertexNormals(); source.dispose();
    return geometry;
  }
  const violet = new THREE.SphereGeometry(0.7, 64, 48); violet.scale(1.03, 0.93, 0.98); violet.translate(0, 0.64, 0);
  const lime = new RoundedBoxGeometry(1.22, 1.25, 1.15, 6, 0.18); lime.translate(0, 0.625, 0);
  const green = turned([[0,0],[0.5,0],[0.66,0.07],[0.69,0.18],[0.62,0.4],[0.47,0.83],[0.28,1.23],[0.12,1.54],[0.065,1.61],[0,1.64]]);
  // Preserve blue's original seven-sided prism silhouette.
  const blue = new THREE.CylinderGeometry(0.67, 0.67, 1.35, 7);
  blue.translate(0, 1.35 / 2, 0);
  const orange = turned([[0,0],[0.42,0],[0.57,0.07],[0.61,0.21],[0.6,1.22],[0.54,1.4],[0.4,1.45],[0,1.45]]);
  const pink = new THREE.SphereGeometry(0.78, 80, 48, 0, Math.PI * 2, 0, Math.PI / 2);
  const pp = pink.getAttribute("position");
  for (let i = 0; i < pp.count; i++) {
    const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i);
    const fold = 1 + 0.012 * Math.sin(y * 19 + Math.atan2(z, x) * 2) * (1 - y / 0.78);
    pp.setXYZ(i, x * fold, y, z * fold);
  }
  const specs = [
    { index: 0, name: "curious-violet", color: "#8d6cba", body: violet, faceY: 0.79, spacing: 0.145, tilt: -0.08 },
    { index: 1, name: "attentive-lime", color: "#bec22c", body: lime, faceY: 0.78, spacing: 0.155, tilt: 0.025 },
    { index: 2, name: "relaxed-green", color: "#4c8c66", body: green, faceY: 0.62, spacing: 0.14, tilt: -0.055 },
    { index: 5, name: "shy-blue", color: "#387cb4", body: blue, faceY: 1.35 * 0.7, spacing: 0.105, tilt: 0.075 },
    { index: 4, name: "eager-orange", color: "#f58c1e", body: orange, faceY: 0.91, spacing: 0.15, tilt: -0.04 },
    { index: 3, name: "easygoing-pink", color: "#e66f85", body: pink, faceY: 0.53, spacing: 0.15, tilt: 0 },
  ];
  for (const spec of specs) {
    const [x, z] = places[spec.index];
    ring(x, z); positions.push(new THREE.Vector2(x, z));
    const features: Feature[] = [];
    const register = (mesh: THREE.Mesh, role: Feature["role"], side = 0) => { features.push({ mesh, role, side, position: mesh.position.clone(), scale: mesh.scale.clone() }); return mesh; };
    const group = new THREE.Group(); group.userData.agent = spec.index; group.name = spec.name; group.position.set(x, 0.025, z);
    // Faces turn partway toward the gathering, keeping their expressions readable from the clearing's entrance.
    group.rotation.y = Math.abs(x) < 0.001 ? 0 : THREE.MathUtils.clamp(Math.atan2(-x, 2 - z) * 0.3, -0.5, 0.5);
    group.rotation.z = spec.tilt;
    object.add(group);
    const geometry = soften(spec.body, spec.index);
    const bodyPaint = clay(spec.color);
    mesh(geometry, bodyPaint, group);
    // Project each facial mark onto its own sculpted surface instead of floating it in front of a primitive.
    const proxy = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    proxy.updateMatrixWorld();
    const ray = new THREE.Raycaster();
    const front = (x: number, y: number, offset = 0.018) => {
      ray.set(new THREE.Vector3(x, y, 3), new THREE.Vector3(0, 0, -1));
      return new THREE.Vector3(x, y, (ray.intersectObject(proxy)[0]?.point.z ?? 0.5) + offset);
    };
    // Restore each original surface pattern as rounded clay relief on the softened body.
    const onBody = (angle: number, y: number, offset = 0.006) => {
      const outward = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      ray.set(outward.clone().multiplyScalar(3).setY(y), outward.clone().negate());
      const hit = ray.intersectObject(proxy)[0];
      return hit ? hit.point.clone().addScaledVector(outward, offset) : outward.multiplyScalar(0.5).setY(y);
    };
    const faceClear = (angle: number, y: number) => {
      const frontAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
      return Math.abs(frontAngle) < 0.42 && Math.abs(y - (spec.faceY - 0.045)) < 0.23;
    };
    if (spec.index === 2) {
      for (let row = 0; row < 8; row++) {
        const y = 0.16 + row * 0.18;
        const point = onBody(0, y);
        const radius = Math.hypot(point.x, point.z);
        const count = Math.max(4, Math.round(radius * 26));
        for (let j = 0; j < count; j++) {
          const angle = (j + (row % 2) / 2) / count * Math.PI * 2;
          if (faceClear(angle, y)) continue;
          const scale = mesh(new THREE.SphereGeometry(0.105, 24, 18), bodyPaint, group);
          scale.position.copy(onBody(angle, y, 0.002));
          scale.scale.set(1, 1.16, 0.22);
          scale.rotation.y = angle;
          // A soft overlapping scallop, pressed onto the body rather than an angular tile.
          scale.rotation.x = -0.16;
        }
      }
    }
    if (spec.index === 4) {
      const reliefPaint = clay(new THREE.Color(spec.color).multiplyScalar(0.9).getStyle());
      const columns = 24, circumference = Math.PI * 2 * 0.6;
      const cellRadius = circumference / columns / 1.5, rowHeight = Math.sqrt(3) * cellRadius;
      for (let j = 0; j < columns; j++) for (let row = 0; row < 6; row++) {
        const angle = j / columns * Math.PI * 2;
        const y = 0.19 + row * rowHeight + (j % 2) * rowHeight / 2;
        if (faceClear(angle, y)) continue;
        const points = Array.from({ length: 4 }, (_, k) => {
          const turn = k / 6 * Math.PI * 2;
          return onBody(angle + Math.cos(turn) * cellRadius / circumference * Math.PI * 2, y + Math.sin(turn) * cellRadius, 0.004);
        });
        mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 18, 0.0055, 6, false), reliefPaint, group);
      }
    }
    if (spec.index === 3) {
      for (let row = 0; row < 6; row++) {
        const y = 0.075 + row * 0.112;
        const points = Array.from({ length: 160 }, (_, i) => {
          const angle = i / 160 * Math.PI * 2;
          return onBody(angle, y + Math.sin(angle * 10 + row * 0.6) * 0.019, 0.003);
        });
        mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 160, 0.014, 8, true), bodyPaint, group);
      }
    }
    const stroke = (points: number[][], radius = 0.009, role: Feature["role"] = "mouth", side = 0) => {
      const curve = new THREE.CatmullRomCurve3(points.map(([x,y]) => front(x,y)));
      const geometry = new THREE.TubeGeometry(curve, 24, radius, 7, false);
      geometry.computeBoundingBox();
      const pivot = geometry.boundingBox!.getCenter(new THREE.Vector3());
      geometry.translate(-pivot.x, -pivot.y, -pivot.z);
      if (role === "mouth") {
        const base = geometry.getAttribute("position"), target = base.clone();
        const reach = Math.max(0.035, Math.max(Math.abs(geometry.boundingBox!.min.x), Math.abs(geometry.boundingBox!.max.x)));
        for (let i = 0; i < target.count; i++) target.setY(i, base.getY(i) + 0.035 * ((base.getX(i) / reach) ** 2 - 0.4));
        geometry.morphAttributes.position = [target];
      }
      const mark = mesh(geometry, ink, group); mark.position.copy(pivot);
      return register(mark, role, side);
    };
    if (spec.index !== 3) {
      if (spec.index === 5) {
        // Blue's existing identity: one lime bar of shades instead of two dot eyes.
        const barGeometry = new RoundedBoxGeometry(0.68, 0.13, 0.06, 6, 0.045);
        const barDepth = Math.max(...[-0.34,-0.17,0,0.17,0.34].map(x=>front(x,spec.faceY,0.065).z));
        const lime = COLOURS.find(c => c.label === "Lime")!.value;
        const bar = mesh(barGeometry, clay(lime), group);
        bar.name = "blue-lime-bar-shades";
        bar.position.set(0, spec.faceY, barDepth);
        register(bar, "visor");
      }
      for (const side of spec.index === 5 ? [] : [-1, 1]) {
        const ex = side * spec.spacing;
        const ey = spec.faceY + (spec.index === 0 && side === 1 ? 0.045 : 0);
        if (spec.index === 2) stroke([[ex - 0.047, ey], [ex, ey - 0.025], [ex + 0.047, ey + 0.005]], 0.012, "eye", side);
        else {
          const eye = mesh(new THREE.SphereGeometry(0.052, 24, 18), ink, group);
          eye.position.copy(front(ex, ey, 0.022));
          eye.scale.set(spec.index === 5 ? 0.62 : 0.78, spec.index === 4 ? 1.23 : 1.05, 0.52);
          register(eye, "eye", side);
        }
      }
      for (const side of spec.index === 5 ? [] : [-1, 1]) {
        const x = side * spec.spacing;
        const y = spec.faceY + 0.14 + (spec.index === 0 && side === 1 ? 0.035 : 0);
        stroke([[x - 0.055,y],[x,y + 0.025],[x + 0.055,y - side * 0.006]],0.01,"brow",side);
      }
      const mouthY = spec.faceY - 0.15;
      if (spec.index === 0) {
        stroke([[-0.06,mouthY],[0,mouthY-0.025],[0.07,mouthY+0.005]]);
      } else if (spec.index === 1) {
        const mouth = mesh(new THREE.TorusGeometry(0.029, 0.009, 8, 24), ink, group);
        mouth.position.copy(front(0,mouthY));
        register(mouth, "mouth");
      } else if (spec.index === 5) stroke([[-0.035,mouthY],[0,mouthY-0.012],[0.045,mouthY]]);
      else stroke([[-0.085,mouthY+0.025],[0,mouthY-0.02],[0.085,mouthY+0.025]], 0.011);
    } else {
      // Retain his small round shades, longer bridge and no temples.
      const lens = new THREE.MeshStandardNodeMaterial({ color: "#151419", roughness: 0.3 });
      const rim = new THREE.MeshStandardNodeMaterial({ color: "#252126", roughness: 0.48 });
      const lensZ = front(0.15,0.53,0.045).z;
      for (const side of [-1,1]) {
        const disc = mesh(new THREE.CylinderGeometry(0.085,0.085,0.022,48),lens,group);
        disc.rotation.x = Math.PI/2; disc.position.set(side*0.15,0.53,lensZ);
        register(disc, "shade", side);
        const ring = mesh(new THREE.TorusGeometry(0.088,0.007,8,48),rim,group); ring.position.set(side*0.15,0.53,lensZ+0.014); register(ring,"shade",side);
      }
      const bridge = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.065,0.555,lensZ+0.016),new THREE.Vector3(0,0.585,lensZ+0.022),new THREE.Vector3(0.065,0.555,lensZ+0.016));
      register(mesh(new THREE.TubeGeometry(bridge,16,0.006,6,false),rim,group),"shade");
      stroke([[-0.04,0.34],[0.035,0.33],[0.11,0.36]],0.01);
      group.rotation.y = -0.55;
    }
    faces.push({ index: spec.index, group, features, restYaw: group.rotation.y, response: 0, blink: 0, pulse: 0 });
    proxy.material.dispose();
    // Stand the hand-shaped body firmly on the sand even with its slight attitude tilt.
    const extent = new THREE.Box3().setFromObject(group);
    group.position.y += 0.025 - extent.min.y;
    tops.push(extent.max.y + 0.025 - extent.min.y);
  }
  const responseTime = motionMs(document.documentElement, "--motion-agent-react-response", 160);
  const blinkTime = motionMs(document.documentElement, "--motion-agent-react-blink", 220);
  const gazeReach = motionNumber(document.documentElement, "--motion-agent-react-gaze", 0.027);
  const turnTime = motionMs(document.documentElement, "--motion-agent-react-turn", 300);
  const proximity = motionNumber(document.documentElement, "--motion-agent-react-proximity", 8);
  const browLift = motionNumber(document.documentElement, "--motion-agent-react-brow", 0.045);
  return {
    object, positions, tops, center,
    press(index: number) { const face = faces.find(f => f.index === index); if (face) { face.pulse = 1; face.blink = blinkTime; } },
    update(dt: number, clay: THREE.Vector3, pointer: THREE.Vector3 | null, hovered: number, reduced: boolean, screenFocus: THREE.Vector3 | null = null) {
      let active = false;
      const amount = reduced ? 1 : 1 - Math.exp(-dt / Math.max(1,responseTime));
      const gatheringDistance = Math.hypot(clay.x-center.x,clay.z-center.z);
      // A small exit margin prevents agents turning back and forth at the edge of the gathering.
      trackingClay = !screenFocus && gatheringDistance < proximity + (trackingClay ? 1 : 0);
      const turn = reduced ? 1 : 1-Math.exp(-dt/Math.max(1,turnTime));
      for (const face of faces) {
        if (hovered === face.index && previousHover !== hovered) face.blink = blinkTime;
        face.blink = reduced ? 0 : Math.max(0,face.blink - dt);
        face.pulse = Math.max(0,face.pulse - dt / Math.max(1,responseTime * 5));
        const distance = Math.hypot(clay.x-face.group.position.x,clay.z-face.group.position.z);
        const near = Math.max(0,1-(distance-1.1)/2);
        const target = Math.min(1,Math.max(near,hovered === face.index ? 0.8 : 0,face.pulse));
        face.response += (target-face.response)*amount;
        if (Math.abs(target-face.response)<0.001) face.response=target;
        active ||= face.blink>0 || face.pulse>0 || face.response !== target;
        const facing = screenFocus ?? (trackingClay ? clay : null);
        const yaw = facing ? Math.atan2(facing.x-face.group.position.x,facing.z-face.group.position.z) : face.restYaw;
        const away = Math.atan2(Math.sin(yaw-face.group.rotation.y),Math.cos(yaw-face.group.rotation.y));
        if (Math.abs(away)>0.0005) { face.group.rotation.y+=away*turn; active=true; }
        else face.group.rotation.y=yaw;
        // The podium presentation takes priority over Clay and pointer gaze.
        const usePointer = !screenFocus && !trackingClay && pointer && hovered === face.index;
        const look = (screenFocus ?? (usePointer ? pointer : clay)).clone();
        if (!screenFocus && !usePointer) look.y+=1;
        face.group.worldToLocal(look);
        const gazeStrength = screenFocus ? 1 : face.response;
        const gx = THREE.MathUtils.clamp(look.x * 0.03,-gazeReach,gazeReach)*gazeStrength;
        const gy = THREE.MathUtils.clamp((look.y-0.6)*0.025,-gazeReach,gazeReach)*gazeStrength;
        const blink = face.blink ? 1-Math.sin(face.blink/blinkTime*Math.PI)*0.92 : 1;
        for (const feature of face.features) {
          const {mesh,position,scale,role,side}=feature;
          if (role === "eye") {
            const x = position.x+gx, y = position.y+gy;
            mesh.position.x += (x-mesh.position.x)*amount; mesh.position.y += (y-mesh.position.y)*amount;
            mesh.scale.y=scale.y*blink*(1+face.response*0.12);
            active ||= Math.abs(x-mesh.position.x)>0.0001 || Math.abs(y-mesh.position.y)>0.0001;
          } else if (role === "brow") {
            mesh.position.y=position.y+face.response*browLift*(side===1 ? 1 : 0.75);
            mesh.rotation.z=side*face.response*0.12;
          } else if (role === "mouth") {
            if(mesh.morphTargetInfluences)mesh.morphTargetInfluences[0]=face.response;
            else mesh.scale.y=scale.y*(1+face.response*0.6);
          } else if (role === "visor") {
            mesh.position.y=position.y+face.response*0.025;
            mesh.position.x=gx*0.4;
            mesh.rotation.z=face.response*0.035;
          } else {
            mesh.position.y=position.y+face.response*0.025;
          }
        }
      }
      previousHover=hovered;
      return { active, tracking: trackingClay, headings: faces.map(f=>`${f.index}:${f.group.rotation.y.toFixed(3)}`).join(","), response: faces.map(f=>`${f.index}:${f.response.toFixed(2)}`).join(",") };
    },
  };
}
