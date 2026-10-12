import { COLOURS } from "./colours";
import type { Jig } from "./jig";
import type { Cell } from "./start";

/**
 * The environment, version 1, FROZEN: he has seen it, and version 2 (`environment.ts`, the Orbit) answers his notes on
 * it. Nothing draws it.
 *
 * The environment, version 1 (his: "Environment (Jigs for layout items in the environment)"): the start location's
 * sky and ground, and how what stands in it is laid out on the cells (World.md W4). Its controls are mine, for him to
 * tune; its starting values are the location as it was before it had a jig: the two colours from his first mock, and
 * one portal two cells ahead of the visitor.
 *
 * A version he has seen is frozen: a change to what it can be is version 2, beside this one.
 */
export type EnvironmentConfig = {
  /** The sky's and the ground's colours, each flat. */
  sky: string;
  ground: string;
  /** How many portals stand in a row across the visitor's view, how many cells apart, and how many cells ahead. */
  portals: number;
  spacing: number;
  ahead: number;
};

export const ENVIRONMENT_START: EnvironmentConfig = { sky: "#a7aae6", ground: "#efe5e8", portals: 1, spacing: 2, ahead: 2 };

export const ENVIRONMENT_JIG: Jig<EnvironmentConfig> = {
  name: "Environment",
  version: 1,
  start: ENVIRONMENT_START,
  groups: [
    {
      title: "Sky and ground",
      controls: [
        { kind: "colour", key: "sky", label: "Sky", options: COLOURS },
        { kind: "colour", key: "ground", label: "Ground", options: COLOURS },
      ],
    },
    {
      title: "Portals",
      controls: [
        { kind: "number", key: "portals", label: "Count", min: 1, max: 6, step: 1 },
        { kind: "number", key: "spacing", label: "Spacing", min: 1, max: 4, step: 1, unit: "cells" },
        { kind: "number", key: "ahead", label: "Ahead", min: 1, max: 6, step: 1, unit: "cells" },
      ],
    },
  ],
};

/**
 * The cells the portals stand on: a row across, `spacing` cells apart and `ahead` cells in front of the visitor,
 * centred on the visitor's column. Every portal is on a real cell: a row whose centre falls between two cells stands
 * half a cell to the left of it.
 */
export function portalCells(environment: EnvironmentConfig): Cell[] {
  const count = Math.max(1, Math.round(environment.portals));
  const spacing = Math.max(1, Math.round(environment.spacing));
  const first = -Math.floor(((count - 1) * spacing) / 2);
  return Array.from({ length: count }, (_, i) => [first + i * spacing, -Math.round(environment.ahead)] as const);
}
