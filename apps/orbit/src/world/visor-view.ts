import * as THREE from "three/webgpu";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { motionMs, motionNumber } from "@no-origins/ui/lib/motion";
import { CLAY_INPUT, type ClayInput } from "./clay-input";
import type { BuiltHuman } from "./build-human";

/** The visor camera shares its yaw with the scrolling choices, rather than moving an unrelated menu. */
export function createVisorView(canvas: HTMLCanvasElement, camera: THREE.PerspectiveCamera, controls: OrbitControls, human: BuiltHuman, draw: () => void) {
  let open = false, amount = 0, yaw = 0, duration = 650, maxYaw = 38;
  const saved = { position: new THREE.Vector3(), target: new THREE.Vector3(), rotation: new THREE.Quaternion(), fov: camera.fov };
  const eye = new THREE.Vector3(), ahead = new THREE.Vector3(), targetRotation = new THREE.Quaternion();
  const look = new THREE.PerspectiveCamera();
  const axis = new THREE.Vector3(0, 1, 0);
  const input = (event: Event) => {
    const value = (event as CustomEvent<ClayInput>).detail;
    if (!("action" in value) || value.action !== "visor" || value.open === open) return;
    open = value.open;
    duration = motionMs(canvas, "--motion-visor-camera", 650);
    maxYaw = motionNumber(canvas, "--motion-visor-yaw", 38);
    if (open) {
      if (amount === 0) {
        saved.position.copy(camera.position); saved.target.copy(controls.target); saved.rotation.copy(camera.quaternion); saved.fov = camera.fov;
      }
      yaw = 0;
      human.object.updateMatrixWorld(true);
      // The actual head centre, measured for the retained 2.95 m Clay stature.
      eye.copy(human.object.localToWorld(new THREE.Vector3(0, 2.56, 0)));
    }
    controls.enabled = false;
    canvas.dataset.visor = String(open);
    draw();
  };
  const turn = (event: Event) => {
    if (!open) return;
    yaw = THREE.MathUtils.clamp((event as CustomEvent<number>).detail, -1, 1);
    canvas.dataset.visorYaw = yaw.toFixed(3);
    draw();
  };
  window.addEventListener(CLAY_INPUT, input);
  window.addEventListener("orbit:visor-look", turn);
  return {
    get active() { return open || amount > 0; },
    step(ms: number, reduced: boolean) {
      if (!open && amount === 0) return false;
      const next = open ? 1 : 0;
      amount = reduced || duration === 0 ? next : THREE.MathUtils.clamp(amount + (open ? 1 : -1) * ms / duration, 0, 1);
      const t = amount * amount * amount * (amount * (amount * 6 - 15) + 10);
      ahead.set(0, 0, 1).applyQuaternion(human.object.quaternion).applyAxisAngle(axis, -THREE.MathUtils.degToRad(yaw * maxYaw));
      look.position.copy(eye); look.lookAt(eye.clone().add(ahead)); targetRotation.copy(look.quaternion);
      camera.position.lerpVectors(saved.position, eye, t);
      camera.quaternion.slerpQuaternions(saved.rotation, targetRotation, t);
      camera.fov = THREE.MathUtils.lerp(saved.fov, 70, t); camera.updateProjectionMatrix();
      human.object.visible = amount < 0.65;
      if (!open && amount === 0) {
        camera.position.copy(saved.position); camera.quaternion.copy(saved.rotation); camera.fov = saved.fov; camera.updateProjectionMatrix();
        controls.target.copy(saved.target); controls.enabled = true; controls.update(); human.object.visible = true;
      }
      return amount !== next;
    },
    dispose() {
      window.removeEventListener(CLAY_INPUT, input); window.removeEventListener("orbit:visor-look", turn);
    },
  };
}
