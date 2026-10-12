import type { Jig } from "./jig";

/**
 * The camera, version 5, FROZEN: he has seen it, and version 6 (`camera.ts`) answers his notes on it. Nothing draws it;
 * its drag and its flight are `drag-v5.ts` and `focus-v5.ts`.
 *
 * The camera, version 5 (his: "Camera (Jigs for Camera control)"): the visitor's eye in the start location. Where it
 * stands (Side, Distance, Height), which way it looks (Turn, Tilt), its lens (Field of view, Zoom), how a drag moves it
 * (`drag.ts`), and where a click takes it and how (`focus.ts`). The hand moves the eye's own values: a drag the place
 * and the gaze, as its Mode allows, the wheel the Zoom, a click all of them, so on the camera's page the card shows
 * them moving, and a control the drag's Mode cannot move is locked.
 *
 * His notes: on version 1 (`camera-v1.ts`, frozen), "I need more distance. I need zoom controls and more tilt", "And
 * height too"; on version 2 (`camera-v2.ts`), "I'm unable to move with click and drag. Fix that. I also need controls
 * to create drag effects"; on version 3 (`camera-v3.ts`), "I like how scroll is mapped with zoom. Similarly … based on
 * the mode I select in Camera … some values will change. I have to see them. If there is some control that will not
 * change when a mode is selected, it should have a lock icon"; on version 4 (`camera-v4.ts`), "When we click on something,
 * camera should move and zoom into that section with a zoom control. I need control to set that. I also need camera
 * movements controls to figure out the movement we need to zoom into that. And the selected section should be at the
 * center of the view".
 *
 * A version he has seen is frozen: a change to what it can be is version 6, beside this one.
 */
export type CameraConfig = {
  /** Where the eye stands, in metres from the visitor's cell: to the right (`side`), back (`distance`), and up. */
  side: number;
  distance: number;
  height: number;
  /** Which way it looks, in degrees: turned to the right of facing the portals (`turn`), and below the horizon (`tilt`). */
  turn: number;
  tilt: number;
  /** How wide the lens sees, top to bottom, in degrees, at a zoom of 1×. */
  fov: number;
  /** How far the lens is zoomed: 2× sees half as wide and makes everything twice as big; under 1× it widens. */
  zoom: number;
  /**
   * How a drag moves the eye (`drag.ts`): round the middle of the row of portals (`orbit`), turning where it stands
   * (`look`), or sliding over the ground (`pan`); how far a drag of the hand takes it (`speed`); how long it carries on
   * once let go, in seconds (`glide`); and whether it then stays where it was left or springs back to where the hand
   * took hold (`after`), on a spring in the system's terms (`response`, ms; `bounce`, 0 to 0.9).
   */
  drag: string;
  speed: number;
  glide: number;
  after: string;
  response: number;
  bounce: number;
  /**
   * Where a click on a portal takes the eye (`focus.ts`): it ends `focusDistance` metres from the portal's middle,
   * looking down at it `focusAngle` degrees below the horizon, from the way it already faced, the lens zoomed to
   * `focusZoom`, the portal at the middle of the view.
   */
  focusZoom: number;
  focusDistance: number;
  focusAngle: number;
  /** How it flies there and back: on a spring in the system's terms (`flyResponse`, ms; `flyBounce`), lifting `arc` metres on the way. */
  flyResponse: number;
  flyBounce: number;
  arc: number;
};

/**
 * The eye as it was before it had a jig, standing on the visitor's cell and facing the portals, the lens not zoomed.
 * Its drag is mine, for him to tune: sliding over the ground (an orbit round one round portal looks the same from every
 * side), carrying on a little once let go, and staying where it is left. So are its focus and its flight: 4 m from the
 * portal, 50° down, 1.5×, on a spring of 900 ms and a little bounce, lifting a metre on the way.
 */
export const CAMERA_START: CameraConfig = {
  side: 0,
  distance: 0,
  height: 1.6,
  turn: 0,
  tilt: 9,
  fov: 50,
  zoom: 1,
  drag: "pan",
  speed: 1,
  glide: 0.4,
  after: "stay",
  response: 600,
  bounce: 0.3,
  focusZoom: 1.5,
  focusDistance: 4,
  focusAngle: 50,
  flyResponse: 900,
  flyBounce: 0.1,
  arc: 1,
};

/** How far the eye's values reach; an orbit or a pan keeps within them (`drag.ts`). */
export const REACH = {
  side: { min: -50, max: 50 },
  distance: { min: -50, max: 50 },
  height: { min: 0, max: 20 },
  turn: { min: -180, max: 180 },
  tilt: { min: -45, max: 90 },
};

/** The zoom's range and step, which the wheel on the camera's page steps by too (`zoomBy`). */
const ZOOM = { min: 0.5, max: 4, step: 0.25 };

export const CAMERA_JIG: Jig<CameraConfig> = {
  name: "Camera",
  version: 5,
  start: CAMERA_START,
  inputs: { key: "drag", always: ["wheel"] },
  groups: [
    {
      title: "Position",
      controls: [
        { kind: "number", key: "side", label: "Side", ...REACH.side, step: 0.5, marks: 10, unit: "m", movedBy: ["pan", "orbit"] },
        { kind: "number", key: "distance", label: "Distance", ...REACH.distance, step: 0.5, marks: 10, unit: "m", movedBy: ["pan", "orbit"] },
        { kind: "number", key: "height", label: "Height", ...REACH.height, step: 0.2, marks: 2, unit: "m", movedBy: ["orbit"] },
      ],
    },
    {
      title: "Direction",
      controls: [
        { kind: "number", key: "turn", label: "Turn", ...REACH.turn, step: 1, marks: 45, unit: "°", movedBy: ["look", "orbit"] },
        { kind: "number", key: "tilt", label: "Tilt", ...REACH.tilt, step: 1, marks: 15, unit: "°", movedBy: ["look", "orbit"] },
      ],
    },
    {
      title: "Lens",
      controls: [
        { kind: "number", key: "fov", label: "Field of view", min: 20, max: 90, step: 5, unit: "°", movedBy: [] },
        { kind: "number", key: "zoom", label: "Zoom", ...ZOOM, unit: "×", movedBy: ["wheel"] },
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
    {
      title: "Focus",
      controls: [
        { kind: "number", key: "focusZoom", label: "Zoom", min: 1, max: 4, step: 0.25, unit: "×" },
        { kind: "number", key: "focusDistance", label: "Distance", min: 1, max: 20, step: 0.5, marks: 2, unit: "m" },
        { kind: "number", key: "focusAngle", label: "Angle", min: 10, max: 90, step: 5, unit: "°" },
      ],
    },
    {
      title: "Move",
      controls: [
        { kind: "number", key: "flyResponse", label: "Response", min: 200, max: 2000, step: 100, unit: "ms" },
        { kind: "number", key: "flyBounce", label: "Bounce", min: 0, max: 0.9, step: 0.1 },
        { kind: "number", key: "arc", label: "Arc", min: 0, max: 10, step: 0.5, unit: "m" },
      ],
    },
  ],
};

/** The eye's own values, the ones the hand moves: where it stands and which way it looks. */
export const EYE_KEYS = ["side", "distance", "height", "turn", "tilt"] as const;
export type EyeValues = Pick<CameraConfig, (typeof EYE_KEYS)[number]>;

/** Every value the hand moves in the world, the zoom with the eye's: what the camera's card is told as they move. */
export const MOVED_KEYS = [...EYE_KEYS, "zoom"] as const;

/** The zoom `steps` steps in (out where negative), within its range: the wheel on the camera's page. */
export function zoomBy(camera: CameraConfig, steps: number): number {
  return Math.min(ZOOM.max, Math.max(ZOOM.min, Math.round((camera.zoom + steps * ZOOM.step) / ZOOM.step) * ZOOM.step));
}

/** How wide the eye sees, top to bottom, in degrees: the lens's field of view, narrowed by its zoom. */
export function fovOf(camera: CameraConfig): number {
  const half = (camera.fov * Math.PI) / 360;
  return (Math.atan(Math.tan(half) / Math.max(0.01, camera.zoom)) * 360) / Math.PI;
}

const RAD = Math.PI / 180;

/** Where the eye stands and what it looks at, 10 m along its gaze, in metres. Facing the portals is −z. */
export function eyeOf(camera: EyeValues) {
  const turn = camera.turn * RAD;
  const tilt = camera.tilt * RAD;
  const position = [camera.side, camera.height, camera.distance] as const;
  const gaze = [Math.sin(turn) * Math.cos(tilt), -Math.sin(tilt), -Math.cos(turn) * Math.cos(tilt)] as const;
  return { position, target: [position[0] + 10 * gaze[0], position[1] + 10 * gaze[1], position[2] + 10 * gaze[2]] as const };
}

/** The eye's values for an eye standing at `position` and looking towards `target`: `eyeOf` the other way round. */
export function eyeValuesOf(position: readonly number[], target: readonly number[]): EyeValues {
  const gaze = [target[0] - position[0], target[1] - position[1], target[2] - position[2]];
  const length = Math.hypot(gaze[0], gaze[1], gaze[2]) || 1;
  return {
    side: position[0],
    height: position[1],
    distance: position[2],
    turn: Math.atan2(gaze[0], -gaze[2]) / RAD,
    tilt: Math.asin(Math.max(-1, Math.min(1, -gaze[1] / length))) / RAD,
  };
}
