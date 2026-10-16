import { CAMERA_START, type CameraConfig } from "./camera";
import { CLOUDS_START, type CloudsConfig } from "./clouds";
import { ENVIRONMENT_START, environmentKeys, environmentOf, type ENVIRONMENT_PAGES, type EnvironmentConfig, type EnvironmentData } from "./environment";
import { MAP_START, type MapConfig } from "./map";
import { spacingIn, WORLD_START, worldOf, type WorldData } from "./hierarchy";
import { HUMAN_START, HUMAN_VARIANTS, humanConfigOf, type HumanConfig } from "./human";
import { libraryStore } from "./library";
import { MOUNTAIN_START, MOUNTAIN_VARIANTS, mountainConfigOf, type MountainConfig } from "./mountain-jig";
import { pipeLookOf } from "./pipe";
import { PLACE_START, type PlaceState } from "./place";
import { areaFrom } from "./area";
import { PUBLISHED_ENVIRONMENT, PUBLISHED_WORLD } from "./published";
import { roadLookOf } from "./road";
import { BUILD_START, ITEMS, SPACES_START, type BuildState, type SpacesConfig } from "./spaces";
import { treeLookOf } from "./tree";
import { WORLD_SIZE, type WorldSize } from "./orbit";

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
  /** Whether this browser holds settings of its own, set here and not reset. */
  kept(): boolean;
};

/**
 * A store kept under `key`. `before` is where an earlier name kept them, read once when there is nothing under `key`
 * and let go at the first change. `parse` makes what was kept whole, where a setting is more than a value (the world's
 * data, `worldOf`).
 */
export function settingsStore<C extends object>(key: string, start: C, before?: string, parse: (kept: C) => C = (kept) => kept): SettingsStore<C> {
  let held = false;
  /** What the browser kept, of the settings this version has: one an earlier version had and this one does not is let go. */
  const read = (): C => {
    try {
      if (typeof window === "undefined") return start;
      const saved = window.localStorage.getItem(key) ?? (before ? window.localStorage.getItem(before) : null);
      if (!saved) return start;
      const kept = Object.entries(JSON.parse(saved) as Record<string, unknown>).filter(
        ([name, value]) => name in start && typeof value === typeof start[name as keyof C],
      );
      held = true;
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
      held = true;
      keep(config);
      changed();
    },
    reset() {
      config = start;
      held = false;
      keep(null);
      changed();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    kept: () => held,
  };
}

/**
 * The world's size (World.md W29, W33), on the World page: fixed (his), so whatever its version 2 kept here is never
 * read, and Reset lets it go.
 */
export const boundsStore = settingsStore<WorldSize>("no-origins:orbit:bounds", WORLD_SIZE, undefined, () => WORLD_SIZE);

/**
 * The environment (World.md W75): one item in the database, unnamed, its draft and its versions, what every page under
 * the sidebar's Environment tunes; his copy in code, read against today's jigs, until the database is read.
 */
const HIS_ENVIRONMENT = { ...PUBLISHED_ENVIRONMENT, settings: environmentOf(PUBLISHED_ENVIRONMENT.settings) ?? PUBLISHED_ENVIRONMENT.settings };
export const environmentLibrary = libraryStore<EnvironmentData>("environment", [HIS_ENVIRONMENT], environmentOf);
/** The environment as published (or as he last saved it, signed in): what every page draws but the one tuning it. */
export const publishedEnvironment = (): EnvironmentData => environmentLibrary.picked()?.settings ?? HIS_ENVIRONMENT.settings;

/**
 * One part of the environment as its page tunes it (W75): this browser's where it keeps its own, else the environment
 * as published, so a page opens on what the world shows and a change starts from there; it changes when either does.
 */
function overPublished<C extends object>(store: SettingsStore<C>, part: (environment: EnvironmentData) => C): SettingsStore<C> {
  const get = () => (store.kept() ? store.get() : part(publishedEnvironment()));
  return {
    get,
    start: () => part(HIS_ENVIRONMENT.settings),
    set: (next) => store.set({ ...get(), ...next }),
    reset: store.reset,
    subscribe(listener) {
      const stops = [store.subscribe(listener), environmentLibrary.subscribe(listener)];
      return () => stops.forEach((stop) => stop());
    },
    kept: store.kept,
  };
}

/** W73: version 35 is the atmosphere alone, a page a group; version 34's atmosphere carries over, its placement let go. */
export const environmentStore = overPublished(settingsStore<EnvironmentConfig>("no-origins:orbit:environment:v35", ENVIRONMENT_START, "no-origins:orbit:environment:v34"), (environment) => environment.atmosphere);
/**
 * One of the Environment's pages (W73): the one atmosphere store, its Reset putting back only what that page's groups
 * tune, as published, so the Fog page's Reset leaves the sky as it was.
 */
export function environmentPageStore(page: keyof typeof ENVIRONMENT_PAGES): SettingsStore<EnvironmentConfig> {
  const keys = environmentKeys(page);
  return { ...environmentStore, reset: () => environmentStore.set(Object.fromEntries(keys.map((key) => [key, publishedEnvironment().atmosphere[key]])) as Partial<EnvironmentConfig>) };
}
export const cameraStore = overPublished(settingsStore<CameraConfig>("no-origins:orbit:camera", CAMERA_START), (environment) => environment.camera);
/** The ceiling clouds' (World.md W38), on the Clouds page: the layer, the edge, the paint and the motion. */
export const cloudsStore = overPublished(settingsStore<CloudsConfig>("no-origins:orbit:clouds", CLOUDS_START), (environment) => environment.clouds);
export const mapStore = overPublished(settingsStore<MapConfig>("no-origins:orbit:map:v3", MAP_START), (environment) => environment.map);
/**
 * The Sectors page's (World.md W81): its tuning alone, the blocks' grain, read once from the Sector element's (its
 * versions 4 and 5, W25) and let go there; version 3's key, with its zones, is left as it was, and nothing reads it.
 */
export const spacesStore = settingsStore<SpacesConfig>("no-origins:orbit:spaces", SPACES_START, "no-origins:orbit:sector:v4");
/**
 * What is built and placed (World.md W25, W73, W81): the world's sectors and zones, their blocks and the elements placed
 * in them, as someone makes, builds and places on the Sectors and World pages; everywhere else the world is as published (`worldLibrary`),
 * and so is this until something is placed here. Reset goes back to the published world.
 */
export const worldStore = settingsStore<WorldData>("no-origins:orbit:world", WORLD_START, undefined, worldOf);
/**
 * How it is being built (W25, W81, W82, W93): the sector picked, the tool, the item Place puts in, the next block's
 * shape, and the blocks picked with Select, let go on a reload. Kept under a key of its own since W93, whose block is
 * a size in metres or centimetres, not multiples of the lattice's (version 3's numbers would read as a centimetre
 * block); an item that went (the Portal) reads as Block.
 */
export const buildStore = settingsStore<BuildState>("no-origins:orbit:build:v4", BUILD_START, undefined, (kept) => ({
  ...kept,
  item: ITEMS.some((item) => item.value === kept.item) ? kept.item : "block",
  unit: kept.unit === "m" ? "m" : "cm",
  texture: kept.texture === "smooth" ? "smooth" : "grain",
  picked: [],
}));
/**
 * How elements are being placed, on the Sectors page (W73, W82, W84, W89, W93): a mountain's and a human's variant,
 * the next pipe's, road's and grove's look, the next grove's area and numbers, and the one picked and its joint, let go on
 * a reload as the blocks picked are; a look kept whole or not at all.
 */
export const placeStore = settingsStore<PlaceState>("no-origins:orbit:place", PLACE_START, undefined, (kept) => ({
  ...kept,
  pipeLook: pipeLookOf(kept.pipeLook) ?? PLACE_START.pipeLook,
  roadLook: roadLookOf(kept.roadLook) ?? PLACE_START.roadLook,
  treeLook: treeLookOf(kept.treeLook) ?? PLACE_START.treeLook,
  area: areaFrom(kept.area) ?? PLACE_START.area,
  // A Spacing in its range (W97); one kept as a Density before W97 is let go, and the next grove starts at 32 m.
  spacing: spacingIn(kept.spacing),
  picked: null,
  joint: null,
}));
/**
 * The human being tuned on its page. A version keeps its own key, earlier versions' tuning intact under theirs (W68),
 * except version 5's: version 6 (W102) only adds to it, so it reads version 5's tuning once where it has none of its
 * own and lets version 5's key go at the first change, the tuning moved, not lost. Version 7 (W103) keeps this
 * compatible schema and key; its renderer revision does not discard anyone's tuning.
 */
export const humanStore = settingsStore<HumanConfig>("no-origins:orbit:human:v6", HUMAN_START, "no-origins:orbit:human:v5");
/** The mountain being tuned on its page (W72, W73), alone at the world's middle. */
export const mountainStore = settingsStore<MountainConfig>("no-origins:orbit:mountain", MOUNTAIN_START);

/**
 * The elements' libraries (W72, W73), from the database: a mountain's and a human's variants, his published copy to
 * start, and the world, one item (`library.ts`). The trees', the pipes', the roads' and the portal's went with W93: a
 * tree's, a pipe's and a road's look is set as it is placed, and the portal is gone; the database keeps their items.
 */
export const mountainLibrary = libraryStore<MountainConfig>("mountain", MOUNTAIN_VARIANTS, mountainConfigOf);
export const humanLibrary = libraryStore<HumanConfig>("human", HUMAN_VARIANTS, humanConfigOf);
/** The world's (W73), his copy read as it is built on now (W81: sectors and zones, nothing over them), as every saved one is. */
export const worldLibrary = libraryStore<WorldData>("world", [{ ...PUBLISHED_WORLD, settings: WORLD_START }], (saved) => (saved && typeof saved === "object" ? worldOf(saved) : null));

/** The world as published (W73): what every page draws that is not building or placing, and what Reset goes back to. */
export const publishedWorld = (): WorldData => worldLibrary.picked()?.settings ?? WORLD_START;

const goes = new Set<() => void>();

/** Go to it, on the Sectors card (W81), heard by the world, which takes the camera to the sector picked again. */
export const sectorFraming = {
  go: () => goes.forEach((listener) => listener()),
  subscribe(listener: () => void) {
    goes.add(listener);
    return () => {
      goes.delete(listener);
    };
  },
};
