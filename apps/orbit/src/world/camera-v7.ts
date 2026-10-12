import type { Jig } from "./jig";

/**
 * The camera, version 7, FROZEN: he has seen it, and version 8 (`camera.ts`) answers his notes on it. Nothing draws it;
 * its drag and its flight are `drag-v7.ts` and `focus-v7.ts`.
 *
 * The camera, version 7 (his: "Camera (Jigs for Camera control)"): what the world is seen from. It is set by the point
 * it looks at (the aim) and where it stands from that point: how high over the ground (Height, which stays where it is
 * set), how far back from the point over the ground (Distance), and from which side (Turn). How steeply it looks down
 * follows from the two: high and near looks down, low and far looks across; a Distance of 0 looks straight down. The aim is where the visitor is in the world, not a setting: it starts on the
 * portals (the middle of their row, `startAim`), a pan slides it anywhere, a click on a portal flies it onto the portal. Then its lens (Field of view,
 * Zoom), how a drag moves it (`drag.ts`), and where a click takes it and how (`focus.ts`). The hand moves its own
 * values, so on the camera's page the card shows them moving, and a value the drag's Mode cannot move is locked.
 *
 * His notes: on version 1 (`camera-v1.ts`, frozen), "I need more distance. I need zoom controls and more tilt", "And
 * height too"; on version 2 (`camera-v2.ts`), "I'm unable to move with click and drag. Fix that. I also need controls
 * to create drag effects"; on version 3 (`camera-v3.ts`), "I have to see them … it should have a lock icon"; on version
 * 4 (`camera-v4.ts`), "When we click on something, camera should move and zoom into that section"; on version 5
 * (`camera-v5.ts`), "Why I need distance from the start? The user can move or travel in any direction they want", and
 * yes to describing the camera by what it looks at; on version 6 (`camera-v6.ts`), "Why is height control removed?",
 * "I should be able to fix the height".
 *
 * A version he has seen is frozen: a change to what it can be is version 8, beside this one.
 */
export type CameraConfig = {
  /**
   * Where it stands from the point it looks at, in metres: how high over the ground (`height`), how far back from the
   * point over the ground (`distance`); and from which side, in degrees (`turn`: 0 looking the way the start faces,
   * towards the portals, more to the right as it grows).
   */
  height: number;
  distance: number;
  turn: number;
  /** How wide the lens sees, top to bottom, in degrees, at a zoom of 1×. */
  fov: number;
  /** How far the lens is zoomed: 2× sees half as wide and makes everything twice as big; under 1× it widens. */
  zoom: number;
  /**
   * How a drag moves it (`drag.ts`): round the point it looks at (`orbit`), turning where it stands (`look`), or
   * sliding the point over the ground (`pan`, travel); how far a drag of the hand takes it (`speed`); how long it carries
   * on once let go, in seconds (`glide`); and whether it then stays where it was left or springs back to where the hand
   * took hold (`after`), on a spring in the system's terms (`response`, ms; `bounce`, 0 to 0.9).
   */
  drag: string;
  speed: number;
  glide: number;
  after: string;
  response: number;
  bounce: number;
  /**
   * Where a click on a portal takes it (`focus.ts`): the point it looks at onto the portal's middle, the camera
   * `focusDistance` metres back from it over the ground and `focusHeight` metres up, from the side it already looked
   * from, the lens zoomed to `focusZoom`, the portal at the middle of the view.
   */
  focusZoom: number;
  focusDistance: number;
  focusHeight: number;
  /** How it flies there and back: on a spring in the system's terms (`flyResponse`, ms; `flyBounce`), lifting `arc` metres on the way. */
  flyResponse: number;
  flyBounce: number;
  arc: number;
};

/**
 * The camera before he tunes it (mine): looking at the portals from 1.6 m up and 4 m back, which is where it first stood
 * (on the start spot, at the height of an eye), the portal in the middle of the view. Its drag and its flight are as
 * version 6 left them; its focus 2.5 m back and 3 m up (about where version 6's 4 m at 50° put it).
 */
export const CAMERA_START: CameraConfig = {
  height: 1.6,
  distance: 4,
  turn: 0,
  fov: 50,
  zoom: 1,
  drag: "pan",
  speed: 1,
  glide: 0.4,
  after: "stay",
  response: 600,
  bounce: 0.3,
  focusZoom: 1.5,
  focusDistance: 2.5,
  focusHeight: 3,
  flyResponse: 900,
  flyBounce: 0.1,
  arc: 1,
};

/** How far the camera's values reach; an orbit keeps within them (`drag.ts`). */
export const REACH = {
  height: { min: 0, max: 30 },
  distance: { min: 0, max: 50 },
  turn: { min: -180, max: 180 },
};

/** The zoom's range and step, which the wheel on the camera's page steps by too (`zoomBy`). */
const ZOOM = { min: 0.5, max: 4, step: 0.25 };

export const CAMERA_JIG: Jig<CameraConfig> = {
  name: "Camera",
  version: 7,
  start: CAMERA_START,
  inputs: { key: "drag", always: ["wheel"] },
  groups: [
    {
      title: "View",
      controls: [
        { kind: "number", key: "height", label: "Height", ...REACH.height, step: 0.2, marks: 5, unit: "m", movedBy: ["orbit"] },
        { kind: "number", key: "distance", label: "Distance", ...REACH.distance, step: 0.5, marks: 10, unit: "m", movedBy: ["orbit"] },
        { kind: "number", key: "turn", label: "Turn", ...REACH.turn, step: 1, marks: 45, unit: "°", movedBy: ["orbit", "look"] },
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
        { kind: "number", key: "focusDistance", label: "Distance", min: 0, max: 20, step: 0.5, marks: 2, unit: "m" },
        { kind: "number", key: "focusHeight", label: "Height", min: 0.5, max: 20, step: 0.5, marks: 2, unit: "m" },
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

/** The values that say where the camera stands from the point it looks at. */
export const EYE_KEYS = ["height", "distance", "turn"] as const;
export type EyeValues = Pick<CameraConfig, (typeof EYE_KEYS)[number]>;

/** Every value the hand moves in the world, the zoom with them: what the camera's card is told as they move. */
export const MOVED_KEYS = [...EYE_KEYS, "zoom"] as const;

type Vec = readonly [number, number, number];

/** Where the point the camera looks at starts: on the portals, the middle of their row, on the ground. */
export function startAim(centres: readonly { x: number; z: number }[]): Vec {
  if (!centres.length) return [0, 0, 0];
  return [centres.reduce((sum, c) => sum + c.x, 0) / centres.length, 0, centres.reduce((sum, c) => sum + c.z, 0) / centres.length];
}

/** The zoom `steps` steps in (out where negative), within its range: the wheel on the camera's page. */
export function zoomBy(camera: CameraConfig, steps: number): number {
  return Math.min(ZOOM.max, Math.max(ZOOM.min, Math.round((camera.zoom + steps * ZOOM.step) / ZOOM.step) * ZOOM.step));
}

/** How wide the camera sees, top to bottom, in degrees: the lens's field of view, narrowed by its zoom. */
export function fovOf(camera: CameraConfig): number {
  const half = (camera.fov * Math.PI) / 360;
  return (Math.atan(Math.tan(half) / Math.max(0.01, camera.zoom)) * 360) / Math.PI;
}

const RAD = Math.PI / 180;

/** The way across the ground the camera faces, as a unit vector: turned `turn` degrees right of −z. */
export function facing(turn: number): Vec {
  return [Math.sin(turn * RAD), 0, -Math.cos(turn * RAD)];
}

/**
 * Where the camera stands and what it looks at, in metres: `distance` back over the ground from the point `aim`, the
 * way it faces, and `height` up. Never on the point itself: so close, it stands half a metre above it.
 */
export function eyeOf(camera: EyeValues, aim: Vec): { position: Vec; target: Vec } {
  const way = facing(camera.turn);
  const d = Math.max(0, camera.distance);
  const height = d < 0.5 && Math.abs(camera.height - aim[1]) < 0.5 ? aim[1] + 0.5 : camera.height;
  return { position: [aim[0] - way[0] * d, height, aim[2] - way[2] * d], target: aim };
}

/**
 * The camera's values for a camera standing at `position` and looking at `aim`: `eyeOf` the other way round. Straight
 * over the point, it keeps the side it looked from (`turn`).
 */
export function eyeValuesOf(position: Vec, aim: Vec, turn: number): EyeValues {
  const across = [aim[0] - position[0], aim[2] - position[2]];
  const distance = Math.hypot(across[0], across[1]);
  return { height: position[1], distance, turn: distance < 1e-3 ? turn : Math.atan2(across[0], -across[1]) / RAD };
}
