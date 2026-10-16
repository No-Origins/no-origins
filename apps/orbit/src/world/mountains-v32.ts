import { WORLD_SIZE } from "./orbit";

/** World.md W41, W43: seeded random mountain placement with room between complete footprints. */
export type Landform = "alpine" | "ridge" | "crag" | "hills" | "butte" | "mesa";
export type Mountain = { kind: Landform; x: number; z: number; top: number; radius: number; seed: number };
export type MountainSettings = { mountainCount: number; mountainSpacing: number; mountainSeed: number; mountainRoughness: number };
const FORMS: readonly Landform[] = ["alpine", "mesa", "ridge", "hills", "crag", "butte"];

/** W50: encloses the rounded rectangular foot, including maximum erosion and every rotation. */
export function mountainFootprint(mountain: Mountain) {
  return mountain.radius * 1.3;
}

export function mountainsOf(settings: MountainSettings): Mountain[] {
  let state = Math.round(settings.mountainSeed) >>> 0;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  const count = Math.max(0, Math.min(18, Math.round(settings.mountainCount)));
  const gap = Math.max(0, Math.min(300, settings.mountainSpacing));
  const mountains: Mountain[] = [];
  for (let i = 0; i < count; i++) {
    const mountain: Mountain = { kind: FORMS[i % FORMS.length], x: 0, z: 0, top: 110 + random() * 35, radius: 25 + random() * 15, seed: Math.floor(random() * 10000) };
    const footprint = mountainFootprint(mountain);
    const limit = WORLD_SIZE.diameter / 2 - footprint - 20;
    let placed = false;
    // Bounded rejection sampling: never place outside the world or reduce the requested gap.
    for (let attempt = 0; attempt < 4096; attempt++) {
      const angle = random() * Math.PI * 2, distance = Math.sqrt(random()) * limit;
      const x = Math.cos(angle) * distance, z = Math.sin(angle) * distance;
      if (distance < footprint + 100) continue;
      if (mountains.some((other) => Math.hypot(x - other.x, z - other.z) < footprint + mountainFootprint(other) + gap)) continue;
      mountain.x = x; mountain.z = z; placed = true; break;
    }
    if (!placed) break;
    mountains.push(mountain);
  }
  return mountains;
}
