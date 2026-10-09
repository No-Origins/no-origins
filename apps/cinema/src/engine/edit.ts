import { check } from "./controls.ts";
import type { Library } from "./library.ts";
import type { Shot, TrackKind, Use, Values } from "./types.ts";

/**
 * Setting controls (Cinema-Engine.md E6): the one change the screen and the `set` command share, so a value set by
 * hand and one set by an agent are checked the same way. Pure: it returns the changed shot and saves nothing.
 */

/** What a target names in a shot: its world, a cast member (by id), or an item on a track (by id). */
export function findUse(shot: Shot, target: string): { use: Use; where: "world" | "cast" | TrackKind } | undefined {
  if (target === "world") return shot.world ? { use: shot.world, where: "world" } : undefined;
  const placement = shot.cast.find((p) => p.id === target);
  if (placement) return { use: placement, where: "cast" };
  for (const track of shot.tracks) {
    const item = track.items.find((i) => i.id === target);
    if (item) return { use: item, where: track.kind };
  }
  return undefined;
}

/** The shot with `values` set over the target's, after checking them against its entry's controls. */
export function setControls(shot: Shot, target: string, values: Values, library: Library): Shot {
  const found = findUse(shot, target);
  if (!found) throw new Error(target === "world" ? `${shot.id} has no world yet` : `${shot.id} has no ${target}`);
  const entry = library.find(found.use.entry, found.use.version);
  if (!entry) throw new Error(`${found.use.entry}@${found.use.version} is not in the library`);
  const problems = check(entry.controls, values);
  if (problems.length) throw new Error(problems.join("; "));
  const merge = <T extends Use>(use: T): T => ({ ...use, values: { ...use.values, ...values } });
  if (found.where === "world") return { ...shot, world: merge(shot.world!) };
  if (found.where === "cast") return { ...shot, cast: shot.cast.map((p) => (p.id === target ? merge(p) : p)) };
  return { ...shot, tracks: shot.tracks.map((track) => ({ ...track, items: track.items.map((i) => (i.id === target ? merge(i) : i)) })) };
}
