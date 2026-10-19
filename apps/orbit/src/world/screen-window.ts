import * as THREE from "three/webgpu";
import { SCREEN_ARC, SCREEN_BASE, SCREEN_CENTER_Z, SCREEN_HEIGHT, SCREEN_RADIUS, SCREEN_WIDTH } from "./clearing-screen";
import type { ScreenPageRect } from "./screen-menu-items";

/**
 * The screen's window (World.md W112): while a page is open, the screen's face is drawn fully transparent, so the
 * page laid behind the canvas shows through it, and Clay and the companions still stand in front of it. Opaque with
 * blending off, three writes the material's opacity, 0, as the canvas's alpha.
 */
export function buildScreenWindow() {
  const geometry = new THREE.PlaneGeometry(SCREEN_WIDTH, SCREEN_HEIGHT, 128, 1);
  const vertices = geometry.attributes.position;
  // Well in front of the slab, the title and the menu, which are hidden while it shows: from a portrait view's
  // distance a few centimetres is inside the depth buffer's precision and they streak through.
  const radius = SCREEN_RADIUS - 0.3;
  for (let i = 0; i < vertices.count; i++) {
    const angle = vertices.getX(i) / SCREEN_RADIUS;
    vertices.setXYZ(i, radius * Math.sin(angle), vertices.getY(i), SCREEN_CENTER_Z - radius * Math.cos(angle));
  }
  geometry.computeVertexNormals();
  const material = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, blending: THREE.NoBlending, toneMapped: false, fog: false });
  const object = new THREE.Mesh(geometry, material);
  object.position.y = SCREEN_BASE + SCREEN_HEIGHT / 2;
  object.name = "no-origins-screen-window";
  object.visible = false;

  // The face's top and bottom edges, sampled along the arc.
  const samples = 33;
  const edge = (y: number) => Array.from({ length: samples }, (_, i) => {
    const angle = (i / (samples - 1) - 0.5) * SCREEN_ARC;
    return new THREE.Vector3(radius * Math.sin(angle), y, SCREEN_CENTER_Z - radius * Math.cos(angle));
  });
  const top = edge(SCREEN_BASE + SCREEN_HEIGHT);
  const bottom = edge(SCREEN_BASE);
  const point = new THREE.Vector3();

  return {
    object,
    /** Where the face falls in the canvas, in CSS px: all of it (`frame`), and the largest upright box inside (`page`). */
    rect(camera: THREE.Camera, width: number, height: number): ScreenPageRect {
      const at = (v: THREE.Vector3) => {
        point.copy(v).project(camera);
        return { x: ((point.x + 1) / 2) * width, y: ((1 - point.y) / 2) * height };
      };
      const t = top.map(at), b = bottom.map(at);
      const all = [...t, ...b];
      const frame = {
        x: Math.min(...all.map(p => p.x)), y: Math.min(...all.map(p => p.y)),
        w: 0, h: 0,
      };
      frame.w = Math.max(...all.map(p => p.x)) - frame.x;
      frame.h = Math.max(...all.map(p => p.y)) - frame.y;
      const left = Math.ceil(Math.max(t[0]!.x, b[0]!.x));
      const right = Math.floor(Math.min(t[samples - 1]!.x, b[samples - 1]!.x));
      const upper = Math.ceil(Math.max(...t.map(p => p.y)));
      const lower = Math.floor(Math.min(...b.map(p => p.y)));
      return {
        frame: { x: Math.floor(frame.x), y: Math.floor(frame.y), w: Math.ceil(frame.w) + 1, h: Math.ceil(frame.h) + 1 },
        page: { x: left, y: upper, w: Math.max(0, right - left), h: Math.max(0, lower - upper) },
      };
    },
  };
}
