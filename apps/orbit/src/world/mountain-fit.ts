import { mountainExtent } from "./mountain-profile";
import { WORLD_SIZE } from "./orbit";
import type { MountainConfig } from "./mountain-jig";
import type { Mountain } from "./mountains";

/**
 * W56: shared bounds for rendering and framing, including the curved body and separate head, fitting a seeded ring's
 * mountains within the world and the ring's spacing. The ring went with W73 (the mountains are placed by hand); this
 * stays for the frozen base builders that drew the ring.
 */
export function mountainFits(layout: Mountain[], configs: MountainConfig[], spacing: number) {
  const footprints = configs.map((c) => mountainExtent(c).radius);
  return layout.map((mountain, index) => {
    const foot = footprints[index];
    const room = WORLD_SIZE.diameter / 2 - Math.hypot(mountain.x, mountain.z) - 20;
    let scale = Math.min(1, room / foot);
    layout.forEach((other, i) => {
      if (i === index) return;
      const roomBetween = Math.hypot(mountain.x - other.x, mountain.z - other.z) - spacing;
      scale = Math.min(scale, roomBetween / (foot + footprints[i]));
    });
    return { scale, radius: foot * scale };
  });
}
