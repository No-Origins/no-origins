import type { Jig } from "./jig";
import type { WorldSize } from "./orbit";

/** Map v4: the square kilometre plane, with cardinal directions and click-to-travel (World.md W23), shown or hidden by a
 * switch (W76). Map v1 to v3 and their drawings are frozen alongside this version.
 */
export type MapConfig = {
  /** Whether the map stands over the world (W76). */
  shown: boolean;
  /** How big the map is, in pixels across. */
  size: number;
  /** What the map shows: the whole plane (`plane`), or what is around the camera (`around`), as far as `reach`. */
  shows: string;
  /** How far the map reaches, edge to edge, in metres, when it shows what is around the camera. */
  reach: number;
  /** Whether the way the start faces stays up (`fixed`), or the way the camera faces does (`camera`). */
  turns: string;
};

export const MAP_START: MapConfig = { shown: true, size: 200, shows: "plane", reach: 40, turns: "fixed" };

export const MAP_JIG: Jig<MapConfig> = {
  name: "Map",
  version: 4,
  start: MAP_START,
  groups: [
    {
      title: "Map",
      controls: [
        { kind: "switch", key: "shown", label: "Map shown", heads: true },
        { kind: "number", key: "size", label: "Size", min: 120, max: 320, step: 20, unit: "px" },
        {
          kind: "choice",
          key: "shows",
          label: "Shows",
          options: [
            // The world's square (World.md W23); the value is the plane's still, so a map kept in a browser reads.
            { value: "plane", label: "The Orbit" },
            { value: "around", label: "Around the camera" },
          ],
        },
        { kind: "number", key: "reach", label: "Reach", min: 10, max: 1000, step: 10, unit: "m" },
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
  // W71: Copy ends with the settings exactly, so what he sends back is what the world starts from.
  copy: (config) => [`Settings JSON: ${JSON.stringify(config)}`],
};

/**
 * Where the camera is, for the map: over the ground (`at`), the way it faces (`turn`, degrees), how wide it sees across
 * (`across`, degrees), and how high it is (`height`, metres). Height never changes the plane boundary.
 */
export type Where = { at: readonly [number, number]; turn: number; across: number; height: number };

/** How the map is laid over the world: the point at its middle, its pixels a metre, and how far it is turned (radians). */
export type MapFrame = { middle: readonly [number, number]; k: number; turn: number };

const RAD = Math.PI / 180;

/** A little room round the Orbit's edge, when the map shows all of it. */
// Leave the square corners inside the Card’s rounded clipping area, with room for compass labels.
const AIR = 1.32;

/** How the map lies over the world, `side` pixels across: over all of its round floor (W42), or as far as its reach. */
export function frameOf(map: MapConfig, where: Where, size: WorldSize, side: number): MapFrame {
  const orbit = map.shows !== "around";
  // The round fits across, however the map turns.
  const across = size.diameter;
  return {
    middle: orbit ? [0, 0] : where.at,
    k: side / (orbit ? across * AIR : map.reach),
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
