import { problem } from "./controls.ts";
import type { Library } from "./library.ts";
import type { Bench, Entry, Shot, Values } from "./types.ts";

/**
 * An asset's bench (Cinema.md F11, Cinema-Engine.md E1): where he looks at one asset of the Assets section in 3D and
 * plays with its controls, apart from any shot. Pure: the store reads and writes it.
 */

/** The values an entry's controls still take, of those given: what a bench keeps when its asset moves on a version. */
export function keepable(entry: Entry, values: Values): Values {
  return Object.fromEntries(
    Object.entries(values).filter(([id, value]) => {
      const control = entry.controls.find((c) => c.id === id);
      return control !== undefined && problem(control, value) === undefined;
    }),
  );
}

/**
 * The bench as it is now: the one saved, on the asset's newest version (keeping every value its controls still take),
 * or a new one at the asset's defaults. Nothing when the library has no such environment.
 */
export function benchFor(asset: string, saved: Bench | undefined, library: Library): Bench | undefined {
  const entry = library.latest(asset);
  if (!entry || entry.kind !== "environment" || entry.grid) return undefined;
  if (!saved) return { asset: entry.id, version: entry.version, rev: 0, values: {} };
  if (saved.version === entry.version) return saved;
  return { ...saved, asset: entry.id, version: entry.version, values: keepable(entry, saved.values) };
}

/** The bench as the engine draws it: the asset as the world, no camera (the screen looks freely), the plain sun. */
export function benchShot(bench: Bench, title: string): Shot {
  return {
    schema: 1,
    id: `bench-${bench.asset}`,
    title,
    rev: bench.rev,
    frame: { aspect: "wide", size: 1080, fps: 30 },
    world: { entry: bench.asset, version: bench.version, values: bench.values },
    cast: [],
    tracks: [],
  };
}
