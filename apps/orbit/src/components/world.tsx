"use client";

import { useEffect, useRef } from "react";
import { CameraReadout } from "./camera-readout";
import { ClayVisor } from "./clay-visor";
import { ClayBag } from "./clay-bag";
import { ClayControls } from "./clay-controls";

/** The clearing replaces the former world and builder (World.md W108). */
export function World() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let disposed = false;
    let stop: (() => void) | undefined;
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const cursor = () => document.body.toggleAttribute("data-cursor", pointer.matches);
    cursor();
    pointer.addEventListener("change", cursor);
    import("@/world/clearing").then(async ({ createClearing }) => {
      if (disposed) return;
      const cleanup = await createClearing(canvas);
      if (disposed) cleanup();
      else stop = cleanup;
    }).catch(() => { canvas.dataset.unavailable = "true"; });
    return () => {
      disposed = true;
      stop?.();
      pointer.removeEventListener("change", cursor);
      document.body.removeAttribute("data-cursor");
    };
  }, []);
  return (
    <div data-slot="world" className="fixed inset-0 bg-[#eadbc9]">
      <canvas ref={ref} tabIndex={0}
        aria-label="Orbit: a hovering circular sandy island with a faceted rocky underside, four grassy hills and wildflowers, with one continuous curved blank black screen, a clay figure and six colorful companions. Drag to look around freely, including above and below the island. Right-drag or Shift-drag to pan without changing the angle; on touch, drag with two fingers to pan. Scroll or pinch to zoom. With Follow cursor enabled, the violet ring sits on the island, Clay looks at it, and W or the forward arrow walks toward it. Double-tap W or double-click the island or Walk to run there automatically, flying over obstacles and landing at the destination; any movement key stops auto-run. With Follow cursor off, WASD or arrows move relative to the camera. Shift runs; Space jumps; double Space toggles flight. In flight Space rises and Shift descends. Home resets the camera."
        className="block size-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" />
      <CameraReadout canvasRef={ref} />
      <ClayControls />
      <ClayBag />
      <ClayVisor />
    </div>
  );
}
