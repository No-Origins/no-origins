import type { Object3D } from "three";

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
  | (ControlBase & { kind: "colour"; default: string });
export type Value = number | string | boolean;
export type Values = Record<string, Value>;

/** The kinds of library this version builds (Cinema.md F4); effects, grades, sound, music, props and titles come later. */
export type EntryKind = "environment" | "cast" | "camera" | "light";

/** What every entry declares (E4): its id, its version (up when its code changes), and its controls. */
type Declaration = { id: string; label: string; version: number; description: string; controls: readonly Control[] };

/** What an environment tells the rest of the shot about its world. */
export type World = {
  /** Where the eye goes by default: a camera move frames this unless told otherwise. */
  focus: Vec3;
  /** How far out the world reaches from its focus, so lights and cameras can be sized to it. */
  radius: number;
  /** The ground's height under a point, so a cast member stands on it. */
  heightAt: (x: number, z: number) => number;
  sky: string;
  /** Fog's density, 0 for none. */
  haze: number;
};

export type Built = { object: Object3D; dispose?: () => void };
export type CameraPose = { position: Vec3; target: Vec3; /** The lens, in millimetres of a full-frame camera. */ lens: number };

export type EnvironmentEntry = Declaration & { kind: "environment"; build: (values: Values) => Built & { world: World } };
/** A cast member stands at its origin, its feet on the ground, facing +z. */
export type CastEntry = Declaration & { kind: "cast"; build: (values: Values) => Built };
/** A camera move: where the camera is at `u`, 0 to 1 through the move. Pure: the same `u` is the same pose. */
export type CameraEntry = Declaration & { kind: "camera"; pose: (values: Values, u: number, world: World) => CameraPose };
export type LightEntry = Declaration & { kind: "light"; build: (values: Values, world: World) => Built };
export type Entry = EnvironmentEntry | CastEntry | CameraEntry | LightEntry;

/** A use of an entry: which one, the version it was set against (E4), and its controls' values. */
export type Use = { entry: string; version: number; values: Values };
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
export const DEPARTMENTS = ["direction", "set", "cast", "camera", "light", "sound", "effects", "colour"] as const;
export type Department = (typeof DEPARTMENTS)[number];
export const TRACK_DEPARTMENT: Record<TrackKind, Department> = { camera: "camera", light: "light" };
