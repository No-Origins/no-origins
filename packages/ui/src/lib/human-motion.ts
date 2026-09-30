import { motionMs, motionNumber } from "./motion"

export type JointId = "hips" | "spine" | "chest" | "neck" | "head" | "leftShoulder" | "rightShoulder" |
  "leftArm" | "rightArm" | "leftElbow" | "rightElbow" | "leftHand" | "rightHand" |
  "leftHip" | "rightHip" | "leftKnee" | "rightKnee" | "leftFoot" | "rightFoot"
export type Axis = 0 | 1 | 2
export type JointAngles = [number, number, number]
export type HumanPose = Partial<Record<JointId, JointAngles>>
export type HumanGait = "rest" | "walk" | "run"
type Joint = { id: JointId; label: string; parent: JointId | null; at: JointAngles; limits: [JointAngles, JointAngles] }

/** World-space bind positions; controls and the actual THREE.Bone hierarchy use this one declaration. Degrees. */
export const HUMAN_JOINTS: Joint[] = [
  { id: "hips", label: "Hips / whole body", parent: null, at: [0, 3.22, 0], limits: [[-30, -90, -25], [30, 90, 25]] },
  { id: "spine", label: "Spine", parent: "hips", at: [0, 3.78, 0], limits: [[-35, -45, -30], [45, 45, 30]] },
  { id: "chest", label: "Chest", parent: "spine", at: [0, 4.58, 0], limits: [[-30, -50, -25], [40, 50, 25]] },
  { id: "neck", label: "Neck", parent: "chest", at: [0, 5.2, 0], limits: [[-25, -40, -25], [25, 40, 25]] },
  { id: "head", label: "Head", parent: "neck", at: [0, 5.62, 0], limits: [[-45, -80, -35], [45, 80, 35]] },
  ...([-1, 1] as const).flatMap((side): Joint[] => {
    const prefix = side === 1 ? "left" : "right"
    const label = side === 1 ? "Left" : "Right"
    return [
      { id: `${prefix}Shoulder`, label: `${label} shoulder`, parent: "chest", at: [side * 0.64, 4.89, 0], limits: [[-30, -30, -25], [30, 30, 25]] },
      { id: `${prefix}Arm`, label: `${label} upper arm`, parent: `${prefix}Shoulder`, at: [side * 0.93, 4.86, 0], limits: [[-160, -85, -100], [65, 85, 100]] },
      { id: `${prefix}Elbow`, label: `${label} elbow`, parent: `${prefix}Arm`, at: [side * 1.16, 3.73, 0], limits: [[-145, -70, -10], [0, 70, 10]] },
      { id: `${prefix}Hand`, label: `${label} wrist`, parent: `${prefix}Elbow`, at: [side * 1.21, 2.9, 0.04], limits: [[-65, -65, -40], [65, 65, 40]] },
      { id: `${prefix}Hip`, label: `${label} hip`, parent: "hips", at: [side * 0.41, 3.22, 0], limits: [[-110, -45, -45], [45, 45, 45]] },
      { id: `${prefix}Knee`, label: `${label} knee`, parent: `${prefix}Hip`, at: [side * 0.43, 1.73, 0], limits: [[0, 0, 0], [145, 0, 0]] },
      { id: `${prefix}Foot`, label: `${label} ankle`, parent: `${prefix}Knee`, at: [side * 0.43, 0.32, 0], limits: [[-35, -25, -20], [50, 25, 20]] },
    ]
  }),
]

export type HumanMotion = {
  walkCycle: number; runCycle: number; walkStride: number; runStride: number; walkKnee: number; runKnee: number
  walkArms: number; runArms: number; walkElbow: number; runElbow: number; walkLift: number; runLift: number
  walkLean: number; runLean: number; sway: number; twist: number
}

/** Starting studies, not picked motions. Every animated magnitude is named in the shared stylesheet. */
export function readHumanMotion(element: Element): HumanMotion {
  const n = (name: string, fallback: number) => motionNumber(element, `--motion-human-${name}`, fallback)
  return {
    walkCycle: motionMs(element, "--motion-human-walk-cycle", 1200), runCycle: motionMs(element, "--motion-human-run-cycle", 700),
    walkStride: n("walk-stride", 25), runStride: n("run-stride", 48),
    walkKnee: n("walk-knee", 42), runKnee: n("run-knee", 100),
    walkArms: n("walk-arms", 22), runArms: n("run-arms", 48),
    walkElbow: n("walk-elbow", 18), runElbow: n("run-elbow", 85),
    walkLift: n("walk-lift", 0.045), runLift: n("run-lift", 0.18),
    walkLean: n("walk-lean", 2), runLean: n("run-lean", 10),
    sway: n("sway", 2), twist: n("twist", 5),
  }
}

export function humanGaitAt(gait: Exclude<HumanGait, "rest">, elapsed: number, motion: HumanMotion) {
  const running = gait === "run"
  const cycle = running ? motion.runCycle : motion.walkCycle
  const phase = elapsed / Math.max(1, cycle) * Math.PI * 2
  const stride = running ? motion.runStride : motion.walkStride
  const knee = running ? motion.runKnee : motion.walkKnee
  const arms = running ? motion.runArms : motion.walkArms
  const elbow = running ? motion.runElbow : motion.walkElbow
  const pose: HumanPose = {
    hips: [running ? motion.runLean : motion.walkLean, Math.sin(phase) * motion.twist, Math.sin(phase) * motion.sway],
    chest: [0, -Math.sin(phase) * motion.twist, -Math.sin(phase) * motion.sway],
    head: [-(running ? motion.runLean : motion.walkLean), 0, 0],
  }
  for (const [prefix, offset] of [["left", 0], ["right", Math.PI]] as const) {
    const swing = Math.sin(phase + offset)
    pose[`${prefix}Hip`] = [swing * stride, 0, 0]
    pose[`${prefix}Knee`] = [Math.max(0, swing) * knee, 0, 0]
    pose[`${prefix}Foot`] = [-Math.max(0, swing) * knee / 3, 0, 0]
    pose[`${prefix}Arm`] = [-swing * arms, 0, prefix === "left" ? 4 : -4]
    pose[`${prefix}Elbow`] = [-elbow, 0, 0]
  }
  return { pose, lift: Math.abs(Math.cos(phase)) * (running ? motion.runLift : motion.walkLift) }
}

export function setHumanJoint(pose: HumanPose, id: JointId, axis: Axis, degrees: number): HumanPose {
  const joint = HUMAN_JOINTS.find((joint) => joint.id === id)!
  const angles: JointAngles = [...(pose[id] ?? [0, 0, 0])]
  angles[axis] = Math.min(joint.limits[1][axis], Math.max(joint.limits[0][axis], Number.isFinite(degrees) ? degrees : 0))
  return { ...pose, [id]: angles }
}

export type HumanRigState = {
  pose: HumanPose; gait: HumanGait; playing: boolean; speed: number; skeleton: boolean; selected: JointId
}
export const HUMAN_RIG_START: HumanRigState = { pose: {}, gait: "rest", playing: false, speed: 1, skeleton: false, selected: "head" }
