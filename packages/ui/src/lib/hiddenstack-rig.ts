import * as THREE from "three"

import { createHiddenstackHead, sculpt, sweep } from "./hiddenstack-model"
import { HUMAN_JOINTS, type HumanPose, type JointId } from "./human-motion"

/** A real bone hierarchy and weighted meshes. Head details remain rigid children of the head bone. */
export function createHiddenstackRig() {
  const root = new THREE.Group()
  root.name = "Hiddenstack"
  const bones = {} as Record<JointId, THREE.Bone>
  const byId = new Map(HUMAN_JOINTS.map((joint) => [joint.id, joint]))
  for (const joint of HUMAN_JOINTS) {
    const bone = new THREE.Bone()
    bone.name = joint.id
    bone.position.set(...joint.at)
    if (joint.parent) {
      bone.position.sub(new THREE.Vector3(...byId.get(joint.parent)!.at))
      bones[joint.parent].add(bone)
    } else root.add(bone)
    bones[joint.id] = bone
  }
  root.updateMatrixWorld(true)
  const skeleton = new THREE.Skeleton(Object.values(bones))
  const indices = new Map(HUMAN_JOINTS.map((joint, index) => [joint.id, index]))
  const skin = new THREE.MeshStandardMaterial({ color: "#d79a62", roughness: 0.72 })
  const shirt = new THREE.MeshStandardMaterial({ color: "#202222", roughness: 0.9 })
  const seam = new THREE.MeshStandardMaterial({ color: "#303232", roughness: 0.95 })
  const trousers = new THREE.MeshStandardMaterial({ color: "#b6a084", roughness: 0.95 })
  const shoe = new THREE.MeshStandardMaterial({ color: "#282a2a", roughness: 0.7 })
  const sole = new THREE.MeshStandardMaterial({ color: "#66645e", roughness: 0.92 })
  type Weight = (point: THREE.Vector3) => [JointId, JointId, number]
  const rigid = (id: JointId): Weight => () => [id, id, 1]
  const blend = (upper: JointId, lower: JointId, y: number, range: number): Weight => (point) =>
    [upper, lower, THREE.MathUtils.smoothstep(point.y, y - range, y + range)]
  const add = (name: string, geometry: THREE.BufferGeometry, material: THREE.Material, weights: Weight) => {
    const positions = geometry.getAttribute("position")
    const joints: number[] = [], amounts: number[] = []
    const point = new THREE.Vector3()
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i)
      const [a, b, amount] = weights(point)
      joints.push(indices.get(a)!, indices.get(b)!, 0, 0)
      amounts.push(amount, 1 - amount, 0, 0)
    }
    geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(joints, 4))
    geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(amounts, 4))
    const object = new THREE.SkinnedMesh(geometry, material)
    object.name = name
    object.castShadow = object.receiveShadow = true
    // A fixed rest-pose sphere can cull a moved limb. This small single character never needs per-part culling.
    object.frustumCulled = false
    root.add(object)
    object.bind(skeleton, new THREE.Matrix4())
    return object
  }
  const oval = (name: string, at: [number, number, number], scale: [number, number, number], material: THREE.Material, weights: Weight) => {
    const geometry = new THREE.SphereGeometry(1, 32, 24)
    geometry.scale(...scale).translate(...at)
    return add(name, geometry, material, weights)
  }
  const torso: Weight = (point) => point.y > 4.1
    ? ["chest", "spine", THREE.MathUtils.smoothstep(point.y, 4.1, 4.65)]
    : ["spine", "hips", THREE.MathUtils.smoothstep(point.y, 3.3, 3.95)]

  add("Black T-shirt", sculpt([
    [3.08, 0, 0, 0], [3.09, 0.65, 0.34, 0], [3.35, 0.72, 0.38, 0],
    [4.12, 0.78, 0.39, 0], [4.59, 0.85, 0.37, 0], [4.89, 0.7, 0.32, 0],
    [5.04, 0.29, 0.22, 0], [5.05, 0, 0, 0],
  ]), shirt, torso)
  oval("Neck", [0, 5.32, 0], [0.24, 0.39, 0.24], skin, blend("head", "neck", 5.5, 0.18))
  const collar = new THREE.TorusGeometry(0.26, 0.027, 12, 64)
  collar.rotateX(Math.PI / 2).translate(0, 5.01, 0)
  add("Collar", collar, seam, rigid("chest"))
  oval("Trouser waist", [0, 3.12, 0], [0.7, 0.42, 0.34], trousers, rigid("hips"))

  for (const side of [-1, 1]) {
    const prefix = side === 1 ? "left" : "right"
    const upper: JointId = `${prefix}Arm`, elbow: JointId = `${prefix}Elbow`, hand: JointId = `${prefix}Hand`
    const thigh: JointId = `${prefix}Hip`, knee: JointId = `${prefix}Knee`, foot: JointId = `${prefix}Foot`
    oval(`${prefix} sleeve`, [side * 0.93, 4.62, 0], [0.33, 0.43, 0.33], shirt, rigid(upper))
    add(`${prefix} arm`, sweep([
      [side * 0.97, 4.53, 0], [side * 1.08, 4.15, 0], [side * 1.16, 3.73, 0],
      [side * 1.2, 3.31, 0.025], [side * 1.21, 2.9, 0.04],
    ], [0.23, 0.205, 0.18, 0.16, 0.115]), skin, blend(upper, elbow, 3.73, 0.28))
    oval(`${prefix} palm`, [side * 1.21, 2.73, 0.045], [0.145, 0.235, 0.105], skin, rigid(hand))
    oval(`${prefix} thumb`, [side * 1.09, 2.76, 0.09], [0.065, 0.14, 0.07], skin, rigid(hand))
    for (let finger = 0; finger < 4; finger++) {
      oval(`${prefix} finger ${finger + 1}`, [side * (1.11 + finger * 0.064), 2.57 + Math.abs(finger - 1.5) * 0.025, 0.055],
        [0.041, 0.105, 0.073], skin, rigid(hand))
    }
    add(`${prefix} trouser leg`, sweep([
      [side * 0.4, 3.29, 0], [side * 0.42, 2.9, 0], [side * 0.43, 2.31, 0],
      [side * 0.43, 1.73, 0], [side * 0.43, 1.16, 0], [side * 0.43, 0.42, 0],
    ], [0.32, 0.32, 0.275, 0.235, 0.218, 0.17]), trousers, blend(thigh, knee, 1.73, 0.33))
    oval(`${prefix} shoe sole`, [side * 0.43, 0.115, 0.2], [0.235, 0.105, 0.42], sole, rigid(foot))
    oval(`${prefix} sneaker`, [side * 0.43, 0.26, 0.17], [0.225, 0.185, 0.4], shoe, rigid(foot))
    oval(`${prefix} shoe tongue`, [side * 0.43, 0.4, 0.24], [0.125, 0.026, 0.15], seam, rigid(foot))
  }
  const head = createHiddenstackHead()
  head.position.y = -2.1
  bones.head.add(head)

  const helper = new THREE.SkeletonHelper(root)
  helper.name = "Skeleton overlay"
  for (const material of Array.isArray(helper.material) ? helper.material : [helper.material]) material.dispose()
  helper.material = new THREE.LineBasicMaterial({ color: "#9c73ed", depthTest: false, transparent: true, opacity: 0.85 })
  helper.renderOrder = 10
  helper.visible = false
  root.add(helper)
  const markerGeometry = new THREE.SphereGeometry(0.065, 12, 10)
  const markers = new Map<JointId, THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>>()
  for (const { id } of HUMAN_JOINTS) {
    const marker = new THREE.Mesh(markerGeometry, new THREE.MeshBasicMaterial({ color: "#9c73ed", depthTest: false }))
    marker.name = `${id} joint`
    marker.renderOrder = 11
    marker.visible = false
    bones[id].add(marker)
    markers.set(id, marker)
  }

  return {
    root, bones, skeleton, helper,
    pose(pose: HumanPose, lift = 0) {
      for (const { id } of HUMAN_JOINTS) {
        const angles = pose[id] ?? [0, 0, 0]
        bones[id].rotation.set(...angles.map(THREE.MathUtils.degToRad) as [number, number, number])
      }
      bones.hips.position.y = HUMAN_JOINTS[0]!.at[1] + lift
      root.updateMatrixWorld(true)
    },
    showSkeleton(show: boolean, selected: JointId) {
      helper.visible = show
      markers.forEach((marker, id) => {
        marker.visible = show
        marker.material.color.set(id === selected ? "#bcf000" : "#9c73ed")
        marker.scale.setScalar(id === selected ? 1.6 : 1)
      })
    },
  }
}
