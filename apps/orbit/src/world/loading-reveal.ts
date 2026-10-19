import * as THREE from "three/webgpu";
import { color, float, frontFacing, mix, output, positionWorld, step, uniform, vec4 } from "three/tsl";
import { COLOURS } from "./colours";
import { easing, motionMs, motionNumber } from "@no-origins/ui/lib/motion";

/** World.md W111: loading reveal v2, a rising cut through each item's own bounds.
 * Clipping groups preserve shared paints, the Clay rig and shadow silhouettes.
 * Undecided motion values remain token fallbacks until he tunes this version.
 */
export function loadingReveal(host: HTMLCanvasElement, objects: THREE.Object3D[]) {
  const duration = motionMs(host, "--motion-world-reveal-duration", 1100);
  const curve = easing(getComputedStyle(host).getPropertyValue("--motion-world-reveal-ease").trim()
    || "cubic-bezier(0.4, 0, 0.2, 1)");
  const violet = color(COLOURS.find(paint => paint.label === "Violet")!.value);
  const layerShare = Math.max(0, motionNumber(host, "--motion-world-reveal-layer", 0.07));
  const cuts = objects.flatMap(object => {
    const parent = object.parent;
    if (!parent) return [];
    object.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(object);
    if (bounds.isEmpty()) return [];
    const group = new THREE.ClippingGroup();
    group.name = `${object.name || "item"}-loading-reveal`;
    group.clipShadows = true;
    // Keep the space below the plane, revealing upward from the item's base.
    const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), bounds.min.y);
    group.clippingPlanes = [plane];
    parent.add(group);
    group.add(object);
    const height = uniform(bounds.min.y);
    const thickness = (bounds.max.y - bounds.min.y) * layerShare;
    const paints = new Map<THREE.Material, THREE.Material>();
    const originals: { mesh: THREE.Mesh; material: THREE.Material | THREE.Material[] }[] = [];
    object.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      originals.push({ mesh: child, material: child.material });
      const layer = (source: THREE.Material) => {
        const kept = paints.get(source);
        if (kept) return kept;
        if (!(source instanceof THREE.NodeMaterial)) return source;
        const paint = source.clone();
        // An opaque violet surface layer follows the revealed top. Shared source
        // materials and the original Clay skin nodes stay intact beneath it.
        // Blended, not branched: a `select` over the output stage fails to build in the
        // WebGL fallback's GLSL, and the item never finishes appearing there.
        const lid = vec4(violet, 1);
        const surface = mix((source.outputNode ?? output) as ReturnType<typeof vec4>, lid,
          step(height.sub(thickness), positionWorld.y));
        // The cut opens a closed solid; its inner faces paint violet, so the top
        // reads as a solid violet lid rather than a hollow shell. Open surfaces
        // (grass, webbing) are already two-sided and keep their own paint.
        if (source.side === THREE.FrontSide) {
          paint.side = THREE.DoubleSide;
          paint.shadowSide = source.shadowSide ?? THREE.BackSide;
          paint.outputNode = mix(lid, surface, float(frontFacing));
        } else paint.outputNode = surface;
        paints.set(source, paint); return paint;
      };
      child.material = Array.isArray(child.material) ? child.material.map(layer) : layer(child.material);
    });
    return [{ group, object, parent, plane, height, paints, originals, bottom: bounds.min.y, top: bounds.max.y }];
  });
  return {
    duration,
    set(progress: number) {
      const amount = curve(THREE.MathUtils.clamp(progress, 0, 1));
      for (const cut of cuts) {
        cut.plane.constant = THREE.MathUtils.lerp(cut.bottom, cut.top, amount);
        cut.height.value = cut.plane.constant;
      }
    },
    finish() {
      // Remove the temporary clipping state entirely: later flight and terrain
      // interaction must never be constrained by the object's startup bounds.
      for (const cut of cuts) {
        cut.originals.forEach(({ mesh, material }) => { mesh.material = material; });
        cut.paints.forEach(paint => paint.dispose());
        cut.parent.add(cut.object);
        cut.group.removeFromParent();
      }
    },
  };
}

/** Shader compilation must not happen inside the reveal: compile the item's
 * temporary paints off-screen, in the world's lighting, before its clock starts.
 */
export function compileReveal(renderer: THREE.WebGPURenderer, holder: THREE.Object3D,
  camera: THREE.Camera, scene: THREE.Scene) {
  holder.updateMatrixWorld(true);
  return renderer.compileAsync(holder, camera, scene);
}
