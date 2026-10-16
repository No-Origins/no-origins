import type { Jig } from "./jig";

/** Map v3, FROZEN (World.md W76: version 4 shows or hides the map by a switch): the square kilometre plane, with cardinal directions and click-to-travel (World.md W23).
 * Map v1/v2 and their drawings are frozen alongside this version.
 */
export type MapConfig = {
  /** How big the map is, in pixels across. */
  size: number;
  /** What the map shows: the whole plane (`plane`), or what is around the camera (`around`), as far as `reach`. */
  shows: string;
  /** How far the map reaches, edge to edge, in metres, when it shows what is around the camera. */
  reach: number;
  /** Whether the way the start faces stays up (`fixed`), or the way the camera faces does (`camera`). */
  turns: string;
};

export const MAP_START: MapConfig = { size: 200, shows: "plane", reach: 40, turns: "fixed" };

export const MAP_JIG: Jig<MapConfig> = {
  name: "Map",
  version: 3,
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
