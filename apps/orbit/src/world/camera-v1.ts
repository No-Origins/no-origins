import type { Jig } from "./jig";

/**
 * The camera, version 1, FROZEN: he has seen it, and version 2 (`camera.ts`) answers his notes on it. Nothing draws it.
 *
 * The camera, version 1 (his: "Camera (Jigs for Camera control)"): the visitor's eye in the start location, standing
 * on their cell and looking out over the portals to the horizon. Its controls are mine, for him to tune: how high the
 * eye is, how far below the horizon it looks, and how wide it sees. Its starting values are the eye as it was before
 * it had a jig.
 *
 * A version he has seen is frozen: a change to what it can be is version 2, beside this one.
 */
export type CameraConfig = {
  /** How high the eye stands over the ground, in metres. */
  height: number;
  /** How far below the horizon it looks, in degrees. */
  tilt: number;
  /** How wide it sees, top to bottom, in degrees. */
  fov: number;
};

export const CAMERA_START: CameraConfig = { height: 1.6, tilt: 9, fov: 50 };

export const CAMERA_JIG: Jig<CameraConfig> = {
  name: "Camera",
  version: 1,
  start: CAMERA_START,
  groups: [
    {
      title: "Eye",
      controls: [
        { kind: "number", key: "height", label: "Height", min: 0.4, max: 3.2, step: 0.2, unit: "m" },
        { kind: "number", key: "tilt", label: "Tilt", min: 0, max: 20, step: 1, unit: "°" },
      ],
    },
    {
      title: "Lens",
      controls: [{ kind: "number", key: "fov", label: "Field of view", min: 20, max: 90, step: 5, unit: "°" }],
    },
  ],
};

/** Where the eye stands and what it looks at, in metres: on the visitor's cell, facing −z. */
export function eyeOf(camera: CameraConfig) {
  const tilt = (camera.tilt * Math.PI) / 180;
  return {
    position: [0, camera.height, 0] as const,
    target: [0, camera.height - 10 * Math.sin(tilt), -10 * Math.cos(tilt)] as const,
  };
}
