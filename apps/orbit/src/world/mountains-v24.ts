/** World.md W41: seeded random mountain placement with room between complete footprints. */
export type Landform = "alpine" | "ridge" | "crag" | "hills" | "butte" | "mesa";
export type Mountain = { kind: Landform; x: number; z: number; top: number; radius: number; seed: number };
export type MountainSettings = { mountainCount: number; mountainSpacing: number; mountainSeed: number; mountainRoughness: number };
const FORMS: readonly Landform[] = ["alpine", "mesa", "ridge", "hills", "crag", "butte"];

/** Includes stretch and maximum erosion, so spacing measures clear air between bases, not centres. */
export function mountainFootprint(mountain: Mountain) {
  const stretch = mountain.kind === "ridge" ? 1.42 : mountain.kind === "butte" ? 1 / 0.76 : mountain.kind === "mesa" ? 1.18 : 1;
  return mountain.radius * stretch * 1.12;
}

export function mountainsOf(settings: MountainSettings): Mountain[] {
  let state = Math.round(settings.mountainSeed) >>> 0;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  const count = Math.max(0, Math.min(18, Math.round(settings.mountainCount)));
  const gap = Math.max(0, Math.min(300, settings.mountainSpacing));
  const mountains: Mountain[] = [];
  for (let i = 0; i < count; i++) {
    const mountain: Mountain = { kind: FORMS[i % FORMS.length], x: 0, z: 0, top: 42 + random() * 22, radius: 90 + random() * 35, seed: Math.floor(random() * 10000) };
    const footprint = mountainFootprint(mountain);
    let extent = 720;
    // Expand the scenery only if the requested count/gap will not fit. Never silently shrink the gap.
    let placed = false;
    while (!placed) {
      for (let attempt = 0; attempt < 512; attempt++) {
        const x = (random() * 2 - 1) * extent, z = (random() * 2 - 1) * extent;
        if (Math.hypot(x, z) < footprint + 240) continue;
        if (mountains.some((other) => Math.hypot(x - other.x, z - other.z) < footprint + mountainFootprint(other) + gap)) continue;
        mountain.x = x; mountain.z = z; placed = true; break;
      }
      extent += 180;
    }
    mountains.push(mountain);
  }
  return mountains;
}
