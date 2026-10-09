import { STAND_INS } from "./builtins/index.ts";
import type { Entry, EntryKind } from "./types.ts";

/**
 * The library (Cinema.md F4): the stand-ins (public, Cinema-Engine.md E5) and his entries (private, `@cinema/content`).
 * It keeps every version it is given: an entry's version goes up when its code changes and the old one stays in the
 * library, so a shot made against it still plays as it was made (E4).
 */
export type Library = {
  entries: readonly Entry[];
  /** An entry's id now, from any id it has had: what a shot or an asset saved before he renamed it says. */
  idOf: (id: string) => string;
  find: (id: string, version: number) => Entry | undefined;
  latest: (id: string) => Entry | undefined;
  versions: (id: string) => number[];
  ofKind: (kind: EntryKind) => Entry[];
};

export function makeLibrary(his: readonly Entry[]): Library {
  const entries = [...STAND_INS, ...his];
  const seen = new Set<string>();
  for (const entry of entries) {
    const key = `${entry.id}@${entry.version}`;
    if (seen.has(key)) throw new Error(`The library has ${key} twice.`);
    seen.add(key);
  }
  // Renamed entries (his names change): the old id reads as the new one, as a retired paint's name does.
  const renamed = new Map<string, string>();
  for (const entry of entries) for (const old of entry.formerly ?? []) renamed.set(old, entry.id);
  const idOf = (id: string) => renamed.get(id) ?? id;
  const versions = (id: string) => entries.filter((entry) => entry.id === idOf(id)).map((entry) => entry.version).sort((a, b) => a - b);
  return {
    entries,
    idOf,
    find: (id, version) => entries.find((entry) => entry.id === idOf(id) && entry.version === version),
    latest: (id) => {
      const newest = versions(id).at(-1);
      return newest === undefined ? undefined : entries.find((entry) => entry.id === idOf(id) && entry.version === newest);
    },
    versions,
    // The newest version of each, for listing what can be used.
    ofKind: (kind) => [...new Set(entries.filter((entry) => entry.kind === kind).map((entry) => entry.id))].map(
      (id) => entries.filter((entry) => entry.id === id).sort((a, b) => b.version - a.version)[0]!,
    ),
  };
}
