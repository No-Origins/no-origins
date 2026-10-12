import type { Jig } from "./jig";

/**
 * The camera, version 3, FROZEN: he has seen it, and version 4 (`camera.ts`) answers his notes on it. Nothing draws it.
 *
 * The camera, version 3 (his: "Camera (Jigs for Camera control)"): the visitor's eye in the start location, looking
 * out over the portals to the horizon. How high the eye is, how far back it stands behind the visitor's cell, how far
 * below the horizon it looks, how wide its lens sees, how far the lens is zoomed, and how a drag moves it
 * (`drag.ts` as it was then). His notes: on version 1 (`camera-v1.ts`, frozen), "I need more distance. I need zoom controls and more
 * tilt", "And height too"; on version 2 (`camera-v2.ts`), "I'm unable to move with click and drag. Fix that. I also
 * need controls to create drag effects".
 *
 * A version he has seen is frozen: a change to what it can be is version 4, beside this one.
 */
export type CameraConfig = {
  /** How high the eye stands over the ground, in metres. */
  height: number;
  /** How far back the eye stands behind the visitor's cell, in metres. */
  distance: number;
  /** How far below the horizon it looks, in degrees: 0 level, 90 straight down. */
  tilt: number;
  /** How wide the lens sees, top to bottom, in degrees, at a zoom of 1×. */
  fov: number;
  /** How far the lens is zoomed: 2× sees half as wide and makes everything twice as big; under 1× it widens. */
  zoom: number;
  /**
   * How a drag moves the eye (`drag.ts`): round the point it looks at (`orbit`), turning where it stands (`look`), or
   * sliding over the ground (`pan`); how far a drag of the hand takes it (`speed`); how long it carries on once let go,
   * in seconds (`glide`); and whether it then stays where it was left or springs back to where its settings put it
   * (`after`), on a spring in the system's terms (`response`, ms; `bounce`, 0 to 0.9).
   */
  drag: string;
  speed: number;
  glide: number;
  after: string;
  response: number;
  bounce: number;
};

/**
 * The eye as it was before it had a jig, standing on the visitor's cell, the lens not zoomed; its drag is mine, for him
 * to tune: sliding over the ground (an orbit round one round portal looks the same from every side), carrying on a
 * little once let go, and staying where it is left.
 */
export const CAMERA_START: CameraConfig = {
  height: 1.6,
  distance: 0,
  tilt: 9,
  fov: 50,
  zoom: 1,
  drag: "pan",
  speed: 1,
  glide: 0.4,
  after: "stay",
  response: 600,
  bounce: 0.3,
};

/** The zoom's range and step, which the wheel on the camera's page steps by too (`zoomBy`). */
const ZOOM = { min: 0.5, max: 4, step: 0.25 };

export const CAMERA_JIG: Jig<CameraConfig> = {
  name: "Camera",
  version: 3,
  start: CAMERA_START,
  groups: [
    {
      title: "Eye",
      controls: [
        { kind: "number", key: "height", label: "Height", min: 0, max: 20, step: 0.2, marks: 2, unit: "m" },
        { kind: "number", key: "distance", label: "Distance", min: 0, max: 40, step: 1, marks: 5, unit: "m" },
        { kind: "number", key: "tilt", label: "Tilt", min: 0, max: 90, step: 1, marks: 15, unit: "°" },
      ],
    },
    {
      title: "Lens",
      controls: [
        { kind: "number", key: "fov", label: "Field of view", min: 20, max: 90, step: 5, unit: "°" },
        { kind: "number", key: "zoom", label: "Zoom", ...ZOOM, unit: "×" },
      ],
    },
    {
      title: "Drag",
      controls: [
        {
          kind: "choice",
          key: "drag",
          label: "Mode",
          options: [
            { value: "orbit", label: "Orbit" },
            { value: "look", label: "Look" },
            { value: "pan", label: "Pan" },
          ],
        },
        { kind: "number", key: "speed", label: "Speed", min: 0.2, max: 3, step: 0.2, unit: "×" },
        { kind: "number", key: "glide", label: "Glide", min: 0, max: 2, step: 0.1, unit: "s" },
        {
          kind: "choice",
          key: "after",
          label: "After",
          options: [
            { value: "stay", label: "Stay" },
            { value: "return", label: "Return" },
          ],
        },
        { kind: "number", key: "response", label: "Response", min: 200, max: 1600, step: 100, unit: "ms" },
        { kind: "number", key: "bounce", label: "Bounce", min: 0, max: 0.9, step: 0.1 },
      ],
    },
  ],
};

/** The zoom `steps` steps in (out where negative), within its range: the wheel on the camera's page. */
export function zoomBy(camera: CameraConfig, steps: number): number {
  return Math.min(ZOOM.max, Math.max(ZOOM.min, Math.round((camera.zoom + steps * ZOOM.step) / ZOOM.step) * ZOOM.step));
}

/** How wide the eye sees, top to bottom, in degrees: the lens's field of view, narrowed by its zoom. */
export function fovOf(camera: CameraConfig): number {
  const half = (camera.fov * Math.PI) / 360;
  return (Math.atan(Math.tan(half) / Math.max(0.01, camera.zoom)) * 360) / Math.PI;
}

/** Where the eye stands and what it looks at, in metres: `distance` behind the visitor's cell, facing −z. */
export function eyeOf(camera: CameraConfig) {
  const tilt = (camera.tilt * Math.PI) / 180;
  return {
    position: [0, camera.height, camera.distance] as const,
    target: [0, camera.height - 10 * Math.sin(tilt), camera.distance - 10 * Math.cos(tilt)] as const,
  };
}
