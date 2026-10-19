import { motionMs, motionNumber } from "@no-origins/ui/lib/motion";
import * as THREE from "three/webgpu";
import { CLAY_INPUT, followsCursor, type ClayInput } from "./clay-input";
import { meadowHeight } from "./clearing-scenery";

/** The system's violet ring, projected onto the actual island top. */
export function createIslandCursor(canvas: HTMLCanvasElement, camera: THREE.PerspectiveCamera,
  floor: THREE.Mesh, scene: THREE.Scene, draw: () => void) {
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let target: THREE.Vector3 | null = null, inside = false, enabled = followsCursor(), blocked = false;
  // Version 1: a raised hollow cylinder and two expanding signal rings, for his tuning.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let phase = 0;
  let period = motionMs(canvas, "--motion-cursor-signal-period", 1400);
  let spread = motionNumber(canvas, "--motion-cursor-signal-spread", 1.7);
  const geometry = new THREE.CylinderGeometry(1, 1, 1, 64, 1, true);
  const topGeometry = new THREE.RingGeometry(0.77, 1, 64);
  const material = new THREE.MeshBasicMaterial({ color: "#9262f3", side: THREE.DoubleSide, depthWrite: false, depthTest: false });
  const sideMaterial = material.clone(); sideMaterial.color.multiplyScalar(0.72);
  const ring = new THREE.Group();
  const wall = new THREE.Mesh(geometry, sideMaterial);
  const inner = new THREE.Mesh(geometry, sideMaterial); inner.scale.set(0.77, 1, 0.77);
  const top = new THREE.Mesh(topGeometry, material); top.rotation.x = -Math.PI / 2; top.position.y = 0.5;
  ring.add(wall, inner, top);
  ring.name = "island-cursor";
  const rippleGeometries = [new THREE.RingGeometry(0.9, 1, 64), new THREE.RingGeometry(0.9, 1, 64)];
  const ripples = rippleGeometries.map(g => new THREE.Mesh(g, material));
  const rippleOriginals = rippleGeometries.map(g => g.getAttribute("position").array.slice());
  const marker = new THREE.Group(); marker.add(ring, ...ripples); marker.visible = false;
  marker.traverse(part => { part.frustumCulled = false; part.renderOrder = 100; });
  scene.add(marker);
  const update = (dt = 0, still = reduced.matches) => {
    marker.visible = inside && enabled && !blocked && target !== null;
    canvas.toggleAttribute("data-surface-cursor", marker.visible);
    if (!marker.visible || !target) return;
    const pixel = 2 * camera.position.distanceTo(target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.max(1, canvas.clientHeight);
    const radius = 16 * pixel, height = Math.max(0.18, 7 * pixel);
    ring.position.set(target.x, target.y + height / 2 + 0.06, target.z);
    ring.scale.set(radius, height, radius);
    phase = still ? 0 : (phase + dt / Math.max(1, period)) % 1;
    const heightOffset = target.y - meadowHeight(target.x, target.z);
    ripples.forEach((ripple, index) => {
      ripple.visible = !still;
      const progress = (phase + index / 2) % 1;
      const outer = radius * (1.1 + progress * spread), width = radius * 0.14 * (1 - progress);
      const vertices = ripple.geometry.getAttribute("position"), original = rippleOriginals[index];
      for (let i = 0; i < vertices.count; i++) {
        const ox = original[i * 3], oy = original[i * 3 + 1], length = Math.hypot(ox, oy);
        const r = length > 0.95 ? outer : outer - width;
        const x = target!.x + ox / length * r, z = target!.z + oy / length * r;
        vertices.setXYZ(i, x, meadowHeight(x, z) + heightOffset + 0.06, z);
      }
      vertices.needsUpdate = true;
    });
    canvas.dataset.cursorSignal = still ? "still" : phase.toFixed(3);
    canvas.dataset.cursorTarget = target.toArray().map(n => n.toFixed(3)).join(",");
  };
  const move = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    inside = true;
    period = motionMs(canvas, "--motion-cursor-signal-period", 1400);
    spread = motionNumber(canvas, "--motion-cursor-signal-spread", 1.7);
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    ray.setFromCamera(pointer, camera);
    floor.updateMatrixWorld(true);
    target = ray.intersectObject(floor, false)[0]?.point.clone() ?? null;
    update(); draw();
  };
  const leave = () => { inside = false; update(); draw(); };
  const input = (event: Event) => {
    const value = (event as CustomEvent<ClayInput>).detail;
    if ("action" in value) {
      if (value.action === "follow-cursor") enabled = value.enabled;
      if (value.action === "bag" || value.action === "visor") blocked = value.open;
      if (value.action === "reset") target = null;
    }
    update(); draw();
  };
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerleave", leave);
  window.addEventListener("blur", leave);
  window.addEventListener(CLAY_INPUT, input);
  return {
    get target() { return enabled && !blocked ? target : null; },
    get active() { return marker.visible && !reduced.matches; }, update,
    dispose() {
      canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave); window.removeEventListener(CLAY_INPUT, input);
      canvas.removeAttribute("data-surface-cursor");
      scene.remove(marker); geometry.dispose(); topGeometry.dispose();
      rippleGeometries.forEach(g => g.dispose()); material.dispose(); sideMaterial.dispose();
    },
  };
}
