import type { Jig } from "./jig";

/**
 * The map, version 2: the Orbit's map (environment version 2, `orbit.ts`). Version 1 (`map-v1.ts`, his: "we will need
 * map like in games to find items and move there") is frozen beside it. A card at the top right of the visitor's view
 * (`/`, the camera's page and its own page), drawn from above: the sphere's round where the camera is, the edge it never
 * passes; every block standing, by its column, deeper the higher its top; the portals; and the camera, a dot with a
 * wedge of what it sees. A click on a portal (or Enter on it) flies the camera to it, as a click on it in the world does;
 * a click anywhere else on the map takes the camera there, keeping its height, angle and turn, and never past the edge
 * (`src/components/minimap.tsx`).
 *
 * New in version 2 (mine, for him to tune): what it Shows, the whole Orbit, its middle at the map's, or the world
 * around the camera, as version 1 did, as far as its Reach.
 *
 * A version he has seen is frozen: a change to what it can be is version 3, beside this one.
 */
export type MapConfig = {
  /** How big the map is, in pixels across. */
  size: number;
  /** What the map shows: the whole Orbit (`orbit`), or what is around the camera (`around`), as far as `reach`. */
  shows: string;
  /** How far the map reaches, edge to edge, in metres, when it shows what is around the camera. */
  reach: number;
  /** Whether the way the start faces stays up (`fixed`), or the way the camera faces does (`camera`). */
  turns: string;
};

export const MAP_START: MapConfig = { size: 200, shows: "orbit", reach: 40, turns: "fixed" };

export const MAP_JIG: Jig<MapConfig> = {
  name: "Map",
  version: 2,
  start: MAP_START,
  groups: [
    {
      title: "Map",
      controls: [
        { kind: "number", key: "size", label: "Size", min: 120, max: 320, step: 20, unit: "px" },
        {
          kind: "choice",
          key: "shows",
          label: "Shows",
          options: [
            { value: "orbit", label: "The Orbit" },
            { value: "around", label: "Around the camera" },
          ],
        },
        { kind: "number", key: "reach", label: "Reach", min: 10, max: 200, step: 10, unit: "m" },
        {
          kind: "choice",
          key: "turns",
          label: "Turns",
          options: [
            { value: "fixed", label: "Fixed" },
            { value: "camera", label: "With camera" },
          ],
        },
      ],
    },
  ],
};

/**
 * Where the camera is, for the map: over the ground (`at`), the way it faces (`turn`, degrees), how wide it sees across
 * (`across`, degrees), and how high it is (`height`, metres), which sets how wide the sphere's round is there.
 */
export type Where = { at: readonly [number, number]; turn: number; across: number; height: number };

/** How the map is laid over the world: the point at its middle, its pixels a metre, and how far it is turned (radians). */
export type MapFrame = { middle: readonly [number, number]; k: number; turn: number };

const RAD = Math.PI / 180;

/** A little room round the Orbit's edge, when the map shows all of it. */
const AIR = 1.08;

/** How the map lies over the world, `side` pixels across, round a sphere of `radius`. */
export function frameOf(map: MapConfig, where: Where, radius: number, side: number): MapFrame {
  const orbit = map.shows !== "around";
  return {
    middle: orbit ? [0, 0] : where.at,
    k: side / (orbit ? radius * 2 * AIR : map.reach),
    turn: map.turns === "camera" ? where.turn * RAD : 0,
  };
}

/**
 * Where a point of the world (`x`, `z`) falls on the map, in pixels from its middle: north up (−z, the way the start
 * faces), or the way the camera faces up when the map turns with it.
 */
export function onMap(frame: MapFrame, x: number, z: number): { u: number; v: number } {
  const dx = x - frame.middle[0];
  const dz = z - frame.middle[1];
  const { k, turn } = frame;
  return { u: (dx * Math.cos(turn) + dz * Math.sin(turn)) * k, v: (-dx * Math.sin(turn) + dz * Math.cos(turn)) * k };
}

/** The point of the world under a point of the map (`u`, `v` pixels from its middle): `onMap` the other way round. */
export function offMap(frame: MapFrame, u: number, v: number): { x: number; z: number } {
  const a = u / frame.k;
  const b = v / frame.k;
  const { turn } = frame;
  return { x: frame.middle[0] + a * Math.cos(turn) - b * Math.sin(turn), z: frame.middle[1] + a * Math.sin(turn) + b * Math.cos(turn) };
}

/** A point on a map `side` pixels across held within it, `margin` pixels in from its edge, along the way from the middle; and whether it was held. */
export function withinMap(side: number, u: number, v: number, margin: number): { u: number; v: number; held: boolean } {
  const half = side / 2 - margin;
  const over = Math.max(Math.abs(u), Math.abs(v)) / half;
  return over <= 1 ? { u, v, held: false } : { u: u / over, v: v / over, held: true };
}

/** The way the camera's wedge points on the map, in degrees clockwise from up. */
export const headingOnMap = (map: MapConfig, where: Where) => (map.turns === "camera" ? 0 : where.turn);
