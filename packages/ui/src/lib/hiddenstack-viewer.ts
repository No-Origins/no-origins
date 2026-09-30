import * as THREE from "three"
import { gsap } from "gsap"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"

import { createHiddenstackRig } from "./hiddenstack-rig"
import { HUMAN_RIG_START, humanGaitAt, readHumanMotion, type HumanRigState } from "./human-motion"

export type HiddenstackView = "front" | "three-quarter" | "back"
export type HiddenstackViewer = {
  view: (view: HiddenstackView) => void
  turn: (horizontal: number, vertical: number) => void
  rig: (state: HumanRigState) => void
  dispose: () => void
}

/** On demand at rest; one GSAP ticker while an explicitly selected gait plays. No work in a hidden tab. */
export function mountHiddenstackViewer(canvas: HTMLCanvasElement, status: (ready: boolean) => void): HiddenstackViewer {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  const character = createHiddenstackRig()
  scene.add(character.root)
  scene.add(new THREE.HemisphereLight(0xfff5e9, 0x81736a, 2.3))
  const key = new THREE.DirectionalLight(0xffecd9, 3.4)
  key.position.set(-3, 10, 7)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.left = key.shadow.camera.bottom = -8
  key.shadow.camera.right = key.shadow.camera.top = 8
  key.shadow.camera.near = 0.1
  key.shadow.camera.far = 25
  key.shadow.normalBias = 0.025
  key.shadow.bias = -0.0003
  key.shadow.radius = 3
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xdce8ff, 1.6)
  fill.position.set(4, 6, 4)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffffff, 3.5)
  rim.position.set(1, 8, -4)
  scene.add(rim)

  const half = 4.8
  const camera = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 40)
  const controls = new OrbitControls(camera, canvas)
  controls.target.set(0, 4.1, 0)
  controls.enablePan = false
  controls.enableZoom = false
  controls.enableDamping = false
  controls.minPolarAngle = Math.PI * 0.3
  controls.maxPolarAngle = Math.PI * 0.65
  controls.rotateSpeed = 0.65

  let disposed = false
  let lost = false
  let frame = 0
  let settings: HumanRigState = HUMAN_RIG_START
  let elapsed = 0
  let ticking = false
  let motion = readHumanMotion(canvas)
  const pose = () => {
    if (settings.gait === "rest") character.pose(settings.pose)
    else {
      const next = humanGaitAt(settings.gait, elapsed, motion)
      character.pose(next.pose, next.lift)
    }
  }
  const render = () => {
    frame = 0
    if (disposed || lost) return
    renderer.render(scene, camera)
    canvas.dataset.ready = "true"
    canvas.dataset.gait = settings.gait
    canvas.dataset.playing = String(ticking)
  }
  const invalidate = () => {
    if (!frame && !disposed && !lost) frame = requestAnimationFrame(render)
  }
  const tick = (_time: number, delta: number) => {
    elapsed += Math.min(delta, 64) * settings.speed
    pose()
    render()
  }
  const syncTicker = () => {
    const play = settings.playing && settings.gait !== "rest" && !document.hidden && !lost && !disposed
    if (play && !ticking) gsap.ticker.add(tick)
    if (!play && ticking) gsap.ticker.remove(tick)
    ticking = play
    canvas.dataset.playing = String(play)
  }
  document.addEventListener("visibilitychange", syncTicker)
  const rig = (next: HumanRigState) => {
    if (next.gait !== settings.gait) elapsed = 0
    settings = next
    motion = readHumanMotion(canvas)
    character.showSkeleton(settings.skeleton, settings.selected)
    pose()
    syncTicker()
    invalidate()
  }
  controls.addEventListener("change", invalidate)
  const setPosition = (theta: number, phi: number) => {
    camera.position.setFromSpherical(new THREE.Spherical(10, phi, theta)).add(controls.target)
    controls.update()
    invalidate()
  }
  const view = (next: HiddenstackView) => {
    canvas.dataset.view = next
    setPosition(next === "front" ? 0 : next === "back" ? Math.PI : 0.38, Math.PI / 2 - 0.065)
  }
  const turn = (horizontal: number, vertical: number) => {
    const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target))
    canvas.dataset.view = "custom"
    setPosition(spherical.theta + horizontal, THREE.MathUtils.clamp(spherical.phi + vertical, controls.minPolarAngle, controls.maxPolarAngle))
  }
  const custom = () => { canvas.dataset.view = "custom" }
  controls.addEventListener("start", custom)
  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect()
    if (!width || !height) return
    const aspect = width / height
    camera.left = -half * Math.max(1, aspect)
    camera.right = half * Math.max(1, aspect)
    camera.top = half / Math.min(1, aspect)
    camera.bottom = -half / Math.min(1, aspect)
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
    invalidate()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  const contextLost = (event: Event) => {
    event.preventDefault()
    lost = true
    syncTicker()
    delete canvas.dataset.ready
    status(false)
  }
  const contextRestored = () => {
    lost = false
    syncTicker()
    resize()
    render()
    status(true)
  }
  canvas.addEventListener("webglcontextlost", contextLost)
  canvas.addEventListener("webglcontextrestored", contextRestored)
  view("three-quarter")
  resize()
  render()
  status(true)

  return {
    view,
    turn,
    rig,
    dispose() {
      disposed = true
      syncTicker()
      document.removeEventListener("visibilitychange", syncTicker)
      cancelAnimationFrame(frame)
      observer.disconnect()
      canvas.removeEventListener("webglcontextlost", contextLost)
      canvas.removeEventListener("webglcontextrestored", contextRestored)
      controls.removeEventListener("change", invalidate)
      controls.removeEventListener("start", custom)
      controls.dispose()
      const geometries = new Set<THREE.BufferGeometry>()
      const materials = new Set<THREE.Material>()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          geometries.add(object.geometry)
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material)
        }
      })
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      character.skeleton.dispose()
      key.shadow.dispose()
      renderer.dispose()
      delete canvas.dataset.ready
    },
  }
}
