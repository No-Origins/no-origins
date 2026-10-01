import * as THREE from "three"

/**
 * Hiddenstack's first 3D bust (Orbit.md C11). Modelled from the portfolio's avatar.png, not the older
 * photo-derived Character.md proposal: swept hair, round wire glasses, a smile, black tee and folded arms.
 * These colours belong to the artwork, stay the same in either theme, and do not add UI palette tokens.
 * All parts are geometry, including the face and glasses; there is no portrait texture or camera-facing plane.
 */
type Point = [number, number, number]
type Profile = [y: number, width: number, depth: number, centreZ: number]

export function sculpt(profile: Profile[], around = 64, steps = 64) {
  const sides = new THREE.CatmullRomCurve3(profile.map(([y, w, d]) => new THREE.Vector3(w, y, d)))
  const centres = new THREE.CatmullRomCurve3(profile.map(([y, , , z]) => new THREE.Vector3(0, y, z)))
  const positions: number[] = []
  const indices: number[] = []
  for (let j = 0; j <= steps; j++) {
    const p = sides.getPoint(j / steps)
    const z = centres.getPoint(j / steps).z
    for (let i = 0; i <= around; i++) {
      const a = (i / around) * Math.PI * 2
      positions.push(Math.sin(a) * Math.max(0, p.x), p.y, Math.cos(a) * Math.max(0, p.z) + z)
      if (j < steps && i < around) {
        const n = j * (around + 1) + i
        indices.push(n, n + 1, n + around + 1, n + 1, n + around + 2, n + around + 1)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/** A soft, tapered solid swept along a centreline. Elliptical sections keep the quiff sculpted, not a pile of balls. */
export function sweep(points: Point[], radii: number[], flatten = 1, segments = 48) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  const frames = curve.computeFrenetFrames(segments, false)
  const around = 16
  const positions: number[] = []
  const indices: number[] = []
  for (let j = 0; j <= segments; j++) {
    const t = j / segments
    const p = curve.getPointAt(t)
    const index = t * (radii.length - 1)
    const from = Math.min(radii.length - 2, Math.floor(index))
    const r = THREE.MathUtils.lerp(radii[from]!, radii[from + 1]!, index - from)
    for (let i = 0; i <= around; i++) {
      const a = (i / around) * Math.PI * 2
      const v = p.clone()
        .addScaledVector(frames.normals[j]!, Math.cos(a) * r)
        .addScaledVector(frames.binormals[j]!, Math.sin(a) * r * flatten)
      positions.push(v.x, v.y, v.z)
      if (j < segments && i < around) {
        const n = j * (around + 1) + i
        indices.push(n, n + 1, n + around + 1, n + 1, n + around + 2, n + around + 1)
      }
    }
  }
  for (const end of [0, 1]) {
    const p = curve.getPointAt(end)
    const centre = positions.length / 3
    positions.push(p.x, p.y, p.z)
    const start = end * segments * (around + 1)
    for (let i = 0; i < around; i++) {
      if (end) indices.push(centre, start + i, start + i + 1)
      else indices.push(centre, start + i + 1, start + i)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function hairCap() {
  const geometry = new THREE.SphereGeometry(1, 64, 48)
  const position = geometry.getAttribute("position")
  // Remap the sphere into a closed cap: a high forehead, short sides and a low nape.
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i)
    const phi = Math.atan2(x, z)
    const front = (Math.cos(phi) + 1) / 2
    const limit = 2.18 - 1.02 * Math.pow(front, 2.8)
    const latitude = Math.acos(THREE.MathUtils.clamp(y, -1, 1)) / Math.PI
    // The second half folds inside the cap, keeping the underside closed without a flat horizontal brim.
    const theta = Math.min(latitude * 2, 1) * limit
    const inset = latitude > 0.5 ? 1 - (latitude - 0.5) * 2 : 1
    const wave = 1 + 0.018 * Math.sin(phi * 5 + theta * 4)
    position.setXYZ(i,
      Math.sin(phi) * Math.sin(theta) * 0.78 * inset * wave,
      3.35 + Math.cos(theta) * 1.02 * (latitude > 0.5 ? inset : 1),
      Math.cos(phi) * Math.sin(theta) * 0.63 * inset - 0.08,
    )
  }
  geometry.computeVertexNormals()
  return geometry
}

export function createHiddenstackHead() {
  const root = new THREE.Group()
  root.name = "Hiddenstack"
  const material = (color: string, roughness = 0.7, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness })
  const skin = material("#d79a62", 0.72)
  const earSkin = material("#bf7b4b", 0.82)
  const hair = material("#171614", 0.64)
  const hairRidge = material("#201e1b", 0.57)
  const wire = material("#292621", 0.35, 0.48)
  const eyes = material("#261c15", 0.35)
  const smile = material("#713f28", 0.88)
  const glint = material("#fff0d4", 0.2)
  const sphere = new THREE.SphereGeometry(1, 40, 32)

  const mesh = (name: string, geometry: THREE.BufferGeometry, paint: THREE.Material, parent = root) => {
    const object = new THREE.Mesh(geometry, paint)
    object.name = name
    object.castShadow = true
    object.receiveShadow = true
    parent.add(object)
    return object
  }
  const oval = (name: string, p: Point, s: Point, paint: THREE.Material, parent = root) => {
    const object = mesh(name, sphere, paint, parent)
    object.position.set(...p)
    object.scale.set(...s)
    return object
  }
  const line = (name: string, points: Point[], radius: number, paint: THREE.Material, parent = root) =>
    mesh(name, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), 40, radius, 8, false), paint, parent)

  const head = new THREE.Group()
  head.name = "Head"
  root.add(head)
  mesh("Face", sculpt([
    [2.1, 0, 0, 0.06], [2.16, 0.29, 0.28, 0.07], [2.3, 0.47, 0.39, 0.07],
    [2.56, 0.6, 0.48, 0.06], [2.89, 0.7, 0.55, 0.02], [3.23, 0.73, 0.56, -0.02],
    [3.56, 0.7, 0.54, -0.06], [3.89, 0.58, 0.46, -0.09], [4.08, 0.32, 0.28, -0.1], [4.14, 0, 0, -0.1],
  ]), skin, head)
  for (const side of [-1, 1]) {
    oval("Ear", [side * 0.71, 2.95, -0.015], [0.17, 0.245, 0.13], skin, head)
    oval("Inner ear", [side * 0.78, 2.96, 0.078], [0.072, 0.135, 0.035], earSkin, head)
    oval("Earlobe", [side * 0.73, 2.82, 0.038], [0.1, 0.12, 0.085], skin, head)
  }
  mesh("Hair cap", hairCap(), hair, head)
  // Three broad, overlapping locks give the silhouette its long, lifted sweep to the right.
  mesh("Swept quiff", sweep([
    [-0.57, 3.91, 0.24], [-0.4, 4.19, 0.38], [0.03, 4.35, 0.34], [0.51, 4.4, 0.17], [0.92, 4.31, 0.06],
  ], [0.22, 0.3, 0.32, 0.24, 0.015], 0.8), hair, head)
  mesh("Front lock", sweep([
    [-0.57, 3.84, 0.36], [-0.29, 4.03, 0.51], [0.2, 4.12, 0.52], [0.65, 4.19, 0.3], [0.82, 4.24, 0.14],
  ], [0.15, 0.2, 0.22, 0.16, 0.01], 0.72), hair, head)
  mesh("Crown lock", sweep([
    [-0.57, 4.0, -0.1], [-0.3, 4.3, -0.15], [0.2, 4.44, -0.15], [0.66, 4.42, -0.12], [0.84, 4.34, -0.12],
  ], [0.2, 0.24, 0.24, 0.14, 0.01], 0.8), hair, head)
  for (const side of [-1, 1]) {
    oval("Sideburn", [side * 0.674, 3.16, -0.025], [0.082, 0.27, 0.24], hair, head)
  }
  // Subtle sculpted ridges follow the sweep; they stay on the hair, including in a side view.
  line("Quiff ridge", [[-0.49, 4.1, 0.54], [-0.16, 4.25, 0.585], [0.23, 4.29, 0.535], [0.57, 4.3, 0.34]], 0.009, hairRidge, head)

  for (const side of [-1, 1]) {
    oval("Eye", [side * 0.32, 3.15, 0.535], [0.043, 0.068, 0.028], eyes, head)
    oval("Eye light", [side * 0.32 - 0.012, 3.171, 0.56], [0.012, 0.016, 0.008], glint, head)
    line("Eyebrow", [
      [side * 0.13, 3.47, 0.5], [side * 0.28, 3.52, 0.507], [side * 0.47, 3.48, 0.423],
    ], 0.034, hair, head)
  }
  oval("Nose bridge", [0, 3.04, 0.57], [0.102, 0.24, 0.14], skin, head)
  oval("Nose tip", [0.015, 2.9, 0.67], [0.13, 0.12, 0.145], skin, head)
  line("Nose crease", [[0.09, 2.86, 0.748], [0.048, 2.839, 0.775], [0.006, 2.846, 0.765]], 0.009, earSkin, head)
  line("Smile", [[-0.165, 2.656, 0.539], [-0.06, 2.612, 0.566], [0.07, 2.626, 0.573], [0.192, 2.718, 0.537]], 0.017, smile, head)
  oval("Smile corner", [0.189, 2.712, 0.536], [0.025, 0.021, 0.016], smile, head)

  const glasses = new THREE.Group()
  glasses.name = "Round glasses"
  head.add(glasses)
  for (const side of [-1, 1]) {
    const rim = mesh("Lens rim", new THREE.TorusGeometry(0.272, 0.018, 12, 80), wire, glasses)
    rim.position.set(side * 0.325, 3.16, 0.684)
    rim.scale.y = 1.06
    rim.rotation.y = side * 0.14
    line("Glasses temple", [
      [side * 0.596, 3.2, 0.646], [side * 0.716, 3.2, 0.37], [side * 0.766, 3.13, -0.01], [side * 0.752, 3.01, -0.09],
    ], 0.017, wire, glasses)
    oval("Hinge", [side * 0.597, 3.2, 0.646], [0.035, 0.028, 0.029], wire, glasses)
  }
  line("Glasses bridge", [[-0.065, 3.2, 0.701], [0, 3.234, 0.74], [0.065, 3.2, 0.701]], 0.017, wire, glasses)
  return root
}
