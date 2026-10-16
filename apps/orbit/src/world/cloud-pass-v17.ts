import * as THREE from "three/webgpu";
import { positionGeometry, screenUV, texture, vec4 } from "three/tsl";
import type { BuiltClouds } from "./build-clouds-v17";

/** W31: cloud shading has its own pixel budget. The scene and interface retain their normal resolution.
 * Reuse the last volume frame between slow flow updates; camera and material changes invalidate immediately.
 * A depth texture carries the gas's representative ray depth back into the world's depth test. */
export function cloudPass(renderer: THREE.WebGPURenderer, scene: THREE.Scene) {
  const target = new THREE.RenderTarget(1, 1, { depthTexture: new THREE.DepthTexture(1, 1), depthBuffer: true });
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, depthTest: true, fog: false });
  const sample = texture(target.texture, screenUV);
  material.vertexNode = vec4(positionGeometry.xy, 0, 1);
  material.colorNode = sample.rgb.div(sample.a.max(0.001));
  material.opacityNode = sample.a;
  material.depthNode = texture(target.depthTexture!, screenUV).r;
  const overlay = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  overlay.frustumCulled = false; overlay.renderOrder = 10000; overlay.name = "cloud-composite";
  scene.add(overlay);
  const dimensions = new THREE.Vector2();
  let lastClouds: BuiltClouds | null = null, lastPose = "", lastRevision = -1, lastDraw = -Infinity;
  let budget = 180000, scale = 0.45, average = 16, qualityAt = 0;
  let renders = 0, reuses = 0;
  const render = (camera: THREE.Camera, clouds: BuiltClouds | null, now = performance.now()) => {
    camera.updateMatrixWorld();
    renderer.getDrawingBufferSize(dimensions);
    const factor = Math.min(scale, Math.sqrt(budget / Math.max(1, dimensions.x * dimensions.y)));
    const width = Math.max(1, Math.floor(dimensions.x * factor)), height = Math.max(1, Math.floor(dimensions.y * factor));
    const resized = width !== target.width || height !== target.height;
    if (resized) target.setSize(width, height);
    const pose = [...camera.matrixWorld.elements, ...camera.projectionMatrix.elements].join(",");
    const present = !!clouds?.ready && clouds.covered;
    const changed = resized || clouds !== lastClouds || pose !== lastPose || clouds?.revision !== lastRevision;
    if (present && (changed || (clouds.flowing && now - lastDraw >= 50))) {
      clouds.place(camera.position);
      const background = scene.background, mask = camera.layers.mask, auto = renderer.autoClear;
      const colour = renderer.getClearColor(new THREE.Color()), alpha = renderer.getClearAlpha();
      overlay.visible = false; scene.background = null; camera.layers.set(1);
      renderer.setClearColor(0, 0); renderer.autoClear = true; renderer.setRenderTarget(target);
      try { renderer.render(scene, camera); }
      finally { renderer.setRenderTarget(null); camera.layers.mask = mask; scene.background = background; renderer.setClearColor(colour, alpha); renderer.autoClear = auto; }
      lastDraw = now; lastClouds = clouds; lastPose = pose; lastRevision = clouds.revision; renders++;
    } else if (present) reuses++;
    overlay.visible = present;
    const mask = camera.layers.mask; camera.layers.disable(1);
    try { renderer.render(scene, camera); } finally { camera.layers.mask = mask; }
  };
  return { render,
    cadence(ms: number, now: number) {
      average += (Math.min(200, ms) - average) * 0.08;
      if (now - qualityAt < 1500) return;
      if (average > 38) { budget = Math.max(45000, budget * 0.65); scale = Math.max(0.25, scale - 0.05); qualityAt = now; }
      else if (average < 23 && now - qualityAt > 10000) { budget = Math.min(180000, budget * 1.1); scale = Math.min(0.45, scale + 0.025); qualityAt = now; }
    },
    get quality() { return Math.min(1, budget / 180000); },
    get stats() { return { width: target.width, height: target.height, renders, reuses, budget }; },
    dispose() { scene.remove(overlay); overlay.geometry.dispose(); material.dispose(); target.dispose(); },
  };
}
