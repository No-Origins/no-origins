import type { Object3D } from "three";

import type { Library } from "./library.ts";

/**
 * The Cinema Studio's shapes (Cinema-Engine.md): a shot as data (E3) and a library entry as a declaration and a builder
 * (E4). Public: the types are what his private entries and shots are written against (E5).
 *
 * Plain TypeScript the command line runs as it is (`node src/cli/cmd.ts`), so every import in the engine names its
 * file with `.ts`, and nothing here may need compiling: no enums, no parameter properties.
 */

export type Vec3 = [number, number, number];

/** The frame (his: wide or vertical is a control, Cinema.md F1). `size` is the short side, in pixels. */
export type Aspect = "wide" | "vertical";
export type Frame = { aspect: Aspect; size: number; fps: number };

/** A control, typed as the system's properties are (Motion.md M20): number, angle, choice, switch, colour. */
type ControlBase = { id: string; label: string; group?: string; help?: string };
export type Control =
  | (ControlBase & { kind: "number"; min: number; max: number; step: number; unit?: string; default: number })
  | (ControlBase & { kind: "angle"; min: number; max: number; step: number; default: number })
  | (ControlBase & { kind: "choice"; options: readonly string[]; default: string })
  | (ControlBase & { kind: "switch"; default: boolean })
  | (ControlBase & { kind: "colour"; default: string })
  /** One of his saved assets, by id (the newest version) or `id@n` (that one); "" for none. `of` keeps it to assets of
   *  one entry (clouds for a cloud layer). */
  | (ControlBase & { kind: "asset"; of?: string; default: string });
export type Value = number | string | boolean;
export type Values = Record<string, Value>;

/** A colour of his palette (Cinema.md F10: it grows with the scenes): what it is, and what it is called. */
export type PaletteColour = { value: string; label: string };
/** A further row of colours every colour control offers after his named ones, under its own name. */
export type Palette = { label: string; colours: PaletteColour[] };

/** The kinds of library this version builds (Cinema.md F4); effects, grades, sound, music, props and titles come later. */
export type EntryKind = "environment" | "cast" | "camera" | "light";

/**
 * What every entry declares (E4): its id, its version (up when its code changes), and its controls. `formerly` holds
 * the ids it had before he renamed it, so a shot or an asset saved under one still finds it.
 */
type Declaration = { id: string; label: string; version: number; description: string; controls: readonly Control[]; formerly?: readonly string[] };

/** What an environment tells the rest of the shot about its world. */
export type World = {
  /** The side of the square it stands on, when it is a tile that can sit beside others on a grid (an asset). */
  footprint?: number;
  /** Where the eye goes by default: a camera move frames this unless told otherwise. */
  focus: Vec3;
  /** How far out the world reaches from its focus, so lights and cameras can be sized to it. */
  radius: number;
  /** The ground's height under a point, so a cast member stands on it. */
  heightAt: (x: number, z: number) => number;
  sky: string;
  /** Fog's density, 0 for none. */
  haze: number;
  /** Facts about the world in words, for an agent planning in it (`describe`): where things stand, how big, how high. */
  notes?: string[];
};

/**
 * What a builder hands the engine. `at` moves what it built to the moment `t` (a drifting cloud), and must be a pure
 * function of `t`, as everything the engine draws is (Cinema-Engine.md E2).
 */
export type Built = { object: Object3D; dispose?: () => void; at?: (t: number) => void; wind?: (wind: Wind) => void };

/**
 * The wind a grid blows over what it carries (a cloud's gas): its velocity across the ground in metres a second (x, z),
 * how much it stirs the gas (turbulence, 0 to 1), and how much faster it runs higher up (shear, 0 to 1).
 */
export type Wind = { velocity: [number, number]; turbulence: number; shear: number };
export type CameraPose = { position: Vec3; target: Vec3; /** The lens, in millimetres of a full-frame camera. */ lens: number };

/** What an environment may draw on besides its values: the library, his saved assets, and its cells (a grid's). */
export type BuildContext = { library: Library; assets: AssetBook; cells: Record<string, Cell> };
/**
 * A grid of assets, as an environment declares it: its size, and which asset its rules put in a cell ("" for none).
 * `layers` are layers over the ground (clouds), each with its rules; a cell of one is keyed "<layer>:column,row".
 */
export type GridSpec = { columns: number; rows: number; rule: (column: number, row: number) => string; layers?: GridLayer[] };
export type GridLayer = { id: string; label: string; of?: string; rule: (column: number, row: number) => string };
export type EnvironmentEntry = Declaration & {
  kind: "environment";
  build: (values: Values, context: BuildContext) => Built & { world: World };
  /** Present when the world is a grid of assets: the builder, the cell edits and the screen's map all ask it. */
  grid?: (values: Values) => GridSpec;
};
/** A cast member stands at its origin, its feet on the ground, facing +z. */
export type CastEntry = Declaration & { kind: "cast"; build: (values: Values) => Built };
/**
 * A camera move: where the camera is at `u`, 0 to 1 through the move, `t` the shot's second (for what runs on its own
 * clock, a hand's shake). Pure: the same `u` and `t` are the same pose.
 */
export type CameraEntry = Declaration & { kind: "camera"; pose: (values: Values, u: number, world: World, t: number) => CameraPose };
export type LightEntry = Declaration & { kind: "light"; build: (values: Values, world: World) => Built };
export type Entry = EnvironmentEntry | CastEntry | CameraEntry | LightEntry;

/** A use of an entry: which one, the version it was set against (E4), and its controls' values. */
export type Use = { entry: string; version: number; values: Values; cells?: Record<string, Cell> };

/**
 * A cell of a grid, by "column,row" from 1 (his, 2026-10-09: rules fill the grid, then he changes cells by hand). With
 * no `asset` the rules decide what stands there; "" keeps it empty; an asset's id puts that asset there. `values` tune
 * that one copy over the asset's own.
 */
export type Cell = { asset?: string; values?: Values };

/**
 * An asset (his word, 2026-10-09): a configuration of an entry he saved under a name of his own, versioned. Saving
 * under a name he has used makes its next version; a draft uses the newest, a published shot the one it was made with.
 */
export type AssetVersion = {
  id: string;
  name: string;
  version: number;
  saved: string;
  /** What it is for and when to use it, in his words, so an agent configuring a set knows (his, 2026-10-09). */
  description?: string;
  use: { entry: string; version: number; values: Values };
};
/**
 * An asset's bench (his, 2026-10-09: "I should just be able to see the asset in the 3D space, look at it and play
 * around with it"): the values he is trying it at, apart from any shot. `asset` is the library entry it holds (an
 * asset of the Assets section, Cinema.md F11), at `version`; `rev` goes up with every change, as a draft's does.
 */
export type Bench = { asset: string; version: number; rev: number; values: Values };
/** Every asset he has saved, by id, its versions oldest first. */
export type AssetBook = Record<string, AssetVersion[]>;
/** An item on a track (E3): an entry on a timeline, when it starts and how long it lasts, in seconds. */
export type Item = Use & { id: string; start: number; length: number };
export type TrackKind = "camera" | "light";
export type Track = { id: string; kind: TrackKind; items: Item[] };
/** Who stands where (E3): on the floor at `at` (x, z), turned `facing` degrees from +z. */
export type Placement = Use & { id: string; name: string; at: [number, number]; facing: number };

/** A shot (E3). `rev` goes up with every change, so a screen watching it knows to draw it again. */
export type Shot = {
  schema: 1;
  id: string;
  title: string;
  rev: number;
  frame: Frame;
  world: Use | null;
  cast: Placement[];
  tracks: Track[];
};

/** The departments (Cinema.md F6), and the one that writes each kind of work (Cinema-Agents.md R5). */
export const DEPARTMENTS = ["direction", "art", "cast", "camera", "light", "sound", "effects", "colour"] as const;
export type Department = (typeof DEPARTMENTS)[number];
export const TRACK_DEPARTMENT: Record<TrackKind, Department> = { camera: "camera", light: "light" };
