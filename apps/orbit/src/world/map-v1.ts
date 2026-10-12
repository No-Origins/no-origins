import type { Jig } from "./jig";

/**
 * The map, version 1, FROZEN: he has seen it, and version 2 (`map.ts`, the Orbit's map) answers his notes on it.
 * Nothing draws it.
 *
 * The map, version 1 (his: "I'm unable to find the hole where it is. So I think we will need map like in games to find
 * items and move there"). A small map at the top right of the visitor's view (`/`, the camera's page and its own page):
 * the portals, and the camera, a dot with a wedge of what it sees. A portal further away than the map reaches waits at
 * its edge, the way to it. A click on a portal (or Enter on it) flies the camera to it, as a click on it in the world
 * does; a click anywhere else on the map takes the camera there, keeping its height, angle and turn
 * (`src/components/minimap.tsx`). Its controls are mine, for him to tune: how big it is, how far it reaches across, and
 * whether it turns with the camera.
 *
 * A version he has seen is frozen: a change to what it can be is version 2, beside this one.
 */
export type MapConfig = {
  /** How big the map is, in pixels across. */
  size: number;
  /** How far the map reaches, edge to edge, in metres. */
  reach: number;
  /** Whether the way the start faces stays up (`fixed`), or the way the camera faces does (`camera`). */
  turns: string;
};

export const MAP_START: MapConfig = { size: 200, reach: 40, turns: "fixed" };

export const MAP_JIG: Jig<MapConfig> = {
  name: "Map",
  version: 1,
  start: MAP_START,
  groups: [
    {
      title: "Map",
      controls: [
        { kind: "number", key: "size", label: "Size", min: 120, max: 320, step: 20, unit: "px" },
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

/** Where the camera is, for the map: over the ground (`at`), the way it faces (`turn`, degrees), how wide it sees across (`across`, degrees). */
export type Where = { at: readonly [number, number]; turn: number; across: number };

const RAD = Math.PI / 180;

/**
 * Where a point of the world (`x`, `z`) falls on the map, in pixels from its middle, the camera at the middle: north up
 * (−z, the way the start faces), or the way the camera faces up when the map turns with it.
 */
export function onMap(map: MapConfig, where: Where, x: number, z: number): { u: number; v: number } {
  const k = map.size / map.reach;
  const dx = x - where.at[0];
  const dz = z - where.at[1];
  if (map.turns !== "camera") return { u: dx * k, v: dz * k };
  const turn = where.turn * RAD;
  return { u: (dx * Math.cos(turn) + dz * Math.sin(turn)) * k, v: (-dx * Math.sin(turn) + dz * Math.cos(turn)) * k };
}

/** The point of the world under a point of the map (`u`, `v` pixels from its middle): `onMap` the other way round. */
export function offMap(map: MapConfig, where: Where, u: number, v: number): { x: number; z: number } {
  const k = map.size / map.reach;
  const a = u / k;
  const b = v / k;
  if (map.turns !== "camera") return { x: where.at[0] + a, z: where.at[1] + b };
  const turn = where.turn * RAD;
  return { x: where.at[0] + a * Math.cos(turn) - b * Math.sin(turn), z: where.at[1] + a * Math.sin(turn) + b * Math.cos(turn) };
}

/** A point on the map held within it, `margin` pixels in from its edge, along the way from the middle; and whether it was held. */
export function withinMap(map: MapConfig, u: number, v: number, margin: number): { u: number; v: number; held: boolean } {
  const half = map.size / 2 - margin;
  const over = Math.max(Math.abs(u), Math.abs(v)) / half;
  return over <= 1 ? { u, v, held: false } : { u: u / over, v: v / over, held: true };
}

/** The way the camera's wedge points on the map, in degrees clockwise from up. */
export const headingOnMap = (map: MapConfig, where: Where) => (map.turns === "camera" ? 0 : where.turn);
