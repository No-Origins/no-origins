import { CAMERA_START, type CameraConfig } from "./camera";
import { ENVIRONMENT_START, type EnvironmentConfig } from "./environment";
import { MAP_START, type MapConfig } from "./map";
import { BUILD_START, SECTOR_START, type BuildState, type SectorConfig } from "./sector";
import { WORLD_START, worldOf, type WorldData } from "./hierarchy";
import { PORTAL_START, type PortalConfig } from "./portal";
import { sizeOf } from "./bounds";
import { WORLD_SIZE_START, type WorldSize } from "./orbit";

/**
 * A jig's settings as someone plays with them on its page (his: "Let the build still be so that users can play with
 * it"): one store the jig's card writes and the world reads there, so a change on the card is in the world at once.
 * Kept in this browser alone, so a reload keeps them and nobody else ever sees them; the world everywhere else is his
 * (the jig's `start`), and Reset goes back to it. Copy sends the settings back, as his tuning always has.
 */
export type SettingsStore<C> = {
  get(): C;
  /** Before the browser's are read: what the server draws. */
  start(): C;
  set(next: Partial<C>): void;
  reset(): void;
  subscribe(listener: () => void): () => void;
};

/**
 * A store kept under `key`. `before` is where an earlier name kept them, read once when there is nothing under `key`
 * and let go at the first change. `parse` makes what was kept whole, where a setting is more than a value (the world's
 * data, `worldOf`).
 */
function settingsStore<C extends object>(key: string, start: C, before?: string, parse: (kept: C) => C = (kept) => kept): SettingsStore<C> {
  /** What the browser kept, of the settings this version has: one an earlier version had and this one does not is let go. */
  const read = (): C => {
    try {
      if (typeof window === "undefined") return start;
      const saved = window.localStorage.getItem(key) ?? (before ? window.localStorage.getItem(before) : null);
      if (!saved) return start;
      const kept = Object.entries(JSON.parse(saved) as Record<string, unknown>).filter(
        ([name, value]) => name in start && typeof value === typeof start[name as keyof C],
      );
      return parse({ ...start, ...(Object.fromEntries(kept) as Partial<C>) });
    } catch {
      return start;
    }
  };
  const keep = (next: C | null) => {
    try {
      if (next) window.localStorage.setItem(key, JSON.stringify(next));
      else window.localStorage.removeItem(key);
      if (before) window.localStorage.removeItem(before);
    } catch {
      // A browser that keeps nothing still plays; it forgets on reload.
    }
  };

  let config = read();
  const listeners = new Set<() => void>();
  const changed = () => listeners.forEach((listener) => listener());
  return {
    get: () => config,
    start: () => start,
    set(next) {
      config = { ...config, ...next };
      keep(config);
      changed();
    },
    reset() {
      config = start;
      keep(null);
      changed();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** The world's boundaries (World.md W29), on the World page: each way on its step, within its range. */
export const boundsStore = settingsStore<WorldSize>("no-origins:orbit:bounds", WORLD_SIZE_START, undefined, sizeOf);
/** The portal's; it was the hole's until the portal's version 5. */
export const portalStore = settingsStore<PortalConfig>("no-origins:orbit:portal", PORTAL_START, "no-origins:orbit:hole");
/** W31: v17 makes clouds a continuous, bounded-cost part of the sky; earlier tuning remains under its version keys. */
export const environmentStore = settingsStore<EnvironmentConfig>("no-origins:orbit:environment:v17", ENVIRONMENT_START);
export const cameraStore = settingsStore<CameraConfig>("no-origins:orbit:camera", CAMERA_START);
export const mapStore = settingsStore<MapConfig>("no-origins:orbit:map:v3", MAP_START);
/**
 * The sector's, from its version 4 (World.md W25): its tuning alone, the grain; version 3's key, with its zones, is left
 * as it was, and nothing reads it.
 */
export const sectorStore = settingsStore<SectorConfig>("no-origins:orbit:sector:v4", SECTOR_START);
/**
 * What is built (World.md W25): the world's units and their assets, as someone builds them on the sector's page; the
 * world everywhere else is his (`WORLD_START`). Reset never touches it.
 */
export const worldStore = settingsStore<WorldData>("no-origins:orbit:world", WORLD_START, undefined, worldOf);
/** How it is being built (W25): the zone built into, the tool, the level, the next block's size and colour. */
export const buildStore = settingsStore<BuildState>("no-origins:orbit:build", BUILD_START);

const plays = new Set<() => void>();

/** Play on the portal's card, heard by the world, which plays the opening from the start. */
export const portalOpening = {
  play: () => plays.forEach((listener) => listener()),
  subscribe(listener: () => void) {
    plays.add(listener);
    return () => {
      plays.delete(listener);
    };
  },
};
