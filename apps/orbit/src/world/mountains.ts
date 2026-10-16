import { WORLD_SIZE } from "./orbit";

/** World.md W61: an evenly spaced ring of mountains facing the world centre. */
export type Landform = "alpine" | "ridge" | "crag" | "hills" | "butte" | "mesa";
export type Mountain = { kind: Landform; x: number; z: number; top: number; radius: number; seed: number };
export type MountainSettings = { mountainCount: number; mountainSpacing: number; mountainSeed: number; mountainRoughness: number };
/** A mountain's foot (World.md W71): where it stands and how far its fitted body reaches at the floor, in metres; what the trees gather round. */
export type MountainFoot = { x: number; z: number; radius: number };
const FORMS: readonly Landform[] = ["alpine", "mesa", "ridge", "hills", "crag", "butte"];

/** Placement allowance; the complete edited body/head/algae footprint is fitted separately (W61). */
export function mountainFootprint(mountain: Mountain) {
  return mountain.radius * 1.3;
}

/** W61: local +Z (the leaning head/low neck side) always points towards the cylinder centre. */
export const mountainTurn = (m: Pick<Mountain, "x" | "z">) => (Math.atan2(-m.x, -m.z) * 180 / Math.PI + 360) % 360;

export function mountainsOf(settings: MountainSettings): Mountain[] {
  let state = Math.round(settings.mountainSeed) >>> 0;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  const requested = Math.max(0, Math.min(18, Math.round(settings.mountainCount)));
  const gap = Math.max(0, Math.min(300, settings.mountainSpacing));
  const phase = random() * Math.PI * 2;
  const candidates = Array.from({ length: requested }, (_, i): Mountain => ({
    kind: FORMS[i % FORMS.length], x: 0, z: 0, top: 110 + random() * 35,
    radius: 25 + random() * 15, seed: Math.floor(random() * 10000),
  }));
  // Reduce the count only when the requested clear spacing cannot fit a complete ring.
  for (let count = requested; count > 0; count--) {
    const mountains = candidates.slice(0, count);
    const limit = WORLD_SIZE.diameter / 2 - Math.max(...mountains.map(mountainFootprint)) - 20;
    let radius = WORLD_SIZE.diameter * 0.35;
    if (count > 1) mountains.forEach((m, i) => {
      const next = mountains[(i + 1) % count];
      radius = Math.max(radius, (mountainFootprint(m) + mountainFootprint(next) + gap) / (2 * Math.sin(Math.PI / count)));
    });
    if (radius > limit) continue;
    mountains.forEach((m, i) => {
      const angle = phase + i * Math.PI * 2 / count;
      m.x = Math.sin(angle) * radius; m.z = Math.cos(angle) * radius;
    });
    return mountains;
  }
  return [];
}
