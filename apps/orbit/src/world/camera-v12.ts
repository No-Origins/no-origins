import { COLOURS } from "./colours";
import type { Jig } from "./jig";

/**
 * The camera, version 12, FROZEN: he has seen it, and version 13 (`camera.ts`) switches between the eye in the helmet
 * and a camera that sees the figure (World.md W100). Nothing draws it.
 *
 * The camera, version 9 (his: "Camera (Jigs for Camera control)"; "We need a human character of 8 feet in orbit …
 * to travel in the orbit"): what the world is seen from. He decides how it looks at the world, its Height over the
 * ground, its Angle down, the way it faces (Turn), its lens (Field of view, Zoom), and the camera moves over the ground
 * (`movement.ts`): a drag, the arrows or W A S D carry it, at that height and angle. Where it is in the world is not a
 * setting. A click on a portal moves it so the portal is at the middle of the view, and Escape brings it back
 * (`focus.ts`).
 *
 * The visitor is the human (`human.ts`, World.md W51): the figure stands where the visitor is, and the camera stands
 * back from it (`following`), at its Height, looking down its Angle at the figure's hips, so the figure is at the
 * middle of the view and walks ahead of the camera as it travels. Version 8 stood where the visitor is, at its height,
 * and saw the ground ahead (`camera-v8.ts`, frozen). Mine: the start stands the camera a few metres behind the figure.
 *
 * His notes: on version 1 (`camera-v1.ts`, frozen), more distance, zoom, tilt and height; on version 2, the drag and its
 * effects; on version 3, seeing the values and the lock; on version 4, the click; on version 5, the camera set by what it
 * looks at; on version 6, the height; on version 7 (`camera-v7.ts`), "We don't need modes. Since I can decide on height
 * and angle, and since we also decided to have movement of the camera rather than distance from center, click and drag
 * or arrows or qwerty should move"; and "Angle of view should give me 1 degree level controls": every angle steps by
 * a degree; on version 8 (`camera-v8.ts`), the human to travel as; on version 9 (`camera-v9.ts`), the view through the
 * helmet "not controllable and … not smooth", and his pick of the five ways put to him (World.md W78, C2).
 *
 * Version 10 is steered from inside the helmet (W78): the figure faces the way the eye looks, a drag looks round
 * (Turn across, Angle up and down, the head tilting with it) and W A S D go by the view; **Steering** sets how. And
 * **Visor view** sets how the world looks through the visor: the air cleared round the eye, the haze past it, and
 * whether the rim frames the view. Both are the helmet's alone: without a head (Shows: Skeleton) the camera stands back
 * as version 9's did, and every other view's air is the world's.
 *
 * Version 11 (his: "I should also be able to see the body around the rim in the head … I should see the controls for
 * it", W79): Visor view shows the helmet's inside round the visor, its colour and how lit it is. Version 10 is frozen
 * (`camera-v10.ts`). Version 12 (his: "Opacity control is also needed", W80): how much of the world shows through the
 * inside. Version 11 is frozen (`camera-v11.ts`).
 *
 * A version he has seen is frozen: a change to what it can be is version 13, beside this one.
 */
export type CameraConfig = {
  /**
   * How it looks at the world: how high over the ground it is, in metres (`height`); how far below the horizon it
   * looks, in degrees (`angle`: 0 level, 90 straight down; in the helmet, under 0 looks up); the way it faces, in
   * degrees (`turn`: 0 the way the start faces, towards the cell two ahead, more to the right as it grows).
   */
  height: number;
  angle: number;
  turn: number;
  /** How wide the lens sees, top to bottom, in degrees, at a zoom of 1×. */
  fov: number;
  /** How far the lens is zoomed: 2× sees half as wide and makes everything twice as big; under 1× it widens. */
  zoom: number;
  /**
   * How it moves (`movement.ts`): how far a drag of the hand carries it (`speed`, 1× keeping the ground under the hand),
   * how fast a held key carries it, in metres a second (`keys`), how long it takes to get going and to come to rest, in
   * seconds (`glide`), and whether a drag, let go, stays where it was left or springs back to where the hand took hold
   * (`after`), on a spring in the system's terms (`response`, ms; `bounce`, 0 to 0.9).
   */
  speed: number;
  keys: number;
  glide: number;
  after: string;
  response: number;
  bounce: number;
  /**
   * Where a click on a portal takes it (`focus.ts`): `focusHeight` metres up, looking down `focusAngle` degrees, the lens
   * zoomed to `focusZoom`, the portal at the middle of the view; facing the way it faced.
   */
  focusZoom: number;
  focusHeight: number;
  focusAngle: number;
  /** How it flies there and back: on a spring in the system's terms (`flyResponse`, ms; `flyBounce`), lifting `arc` metres on the way. */
  flyResponse: number;
  flyBounce: number;
  arc: number;
  /**
   * Steering in the helmet (W78): whether a drag looks round or slides over the ground (`drag`: look · slide); how far
   * a drag of 100 px turns the look, in degrees (`lookSpeed`); whether it turns the other way across or up and down
   * (`reverseAcross`, `reverseUpDown`: off, the hand carries the world with it, as a drag over the ground did); how far
   * it may look up and down, in degrees from level (`lookUp`, `lookDown`); whether A and D (and ← →) step sideways or
   * turn (`sideKeys`: step · turn) and how fast they turn, in degrees a second (`turnSpeed`); and how long the eye takes
   * to come round to where it is steered, in ms (`smoothing`).
   */
  drag: string;
  lookSpeed: number;
  reverseAcross: boolean;
  reverseUpDown: boolean;
  lookUp: number;
  lookDown: number;
  sideKeys: string;
  turnSpeed: number;
  smoothing: number;
  /**
   * The view through the visor (W78): how far round the eye the air is clear, in metres (`clearAir`: the floor's veil,
   * the base clouds and the walls' fog drawn from there on), how much of that air is drawn past it, in percent
   * (`haze`: 100 the world's own), and whether the visor's rim frames the view (`rimInView`). And the helmet's inside
   * (W79): whether the eye sees it round the visor (`inside`), its colour (`insideColour`), and how much it is lit of
   * itself besides the world's light, in percent (`insideLight`: 0 the world's light alone, 100 its colour whole), and
   * how opaque it is, in percent (`insideOpacity`: 100 hides the world behind it, 0 is the inside not drawn; W80).
   */
  clearAir: number;
  haze: number;
  rimInView: boolean;
  inside: boolean;
  insideColour: string;
  insideLight: number;
  insideOpacity: number;
};

/**
 * The camera before he tunes it (mine): 3.2 m up, looking down 18° at the figure's hips, which stands it about six
 * metres behind the figure, the figure two fifths of the view's height. Keys carry it 4 m a second. Its drag, focus
 * and flight as version 7 left them; its focus 3 m up and 50° down. Steering (W78, mine): a drag looks, 12° a
 * 100 px, carrying the world with the hand, up to 40° up and 60° down; A and D step, or turn at 90° a second; the eye
 * comes round over 100 ms. Through the visor (mine): the air clear for 150 m round the eye, a third of it drawn past
 * that, the rim framing the view. The helmet's inside (W79, mine): shown, Cream as the figure is, lit a fifth of its own,
 * whole (W80: opaque, as version 11 drew it).
 */
export const CAMERA_START: CameraConfig = {
  height: 3.2,
  angle: 18,
  turn: 0,
  fov: 50,
  zoom: 1,
  speed: 1,
  keys: 4,
  glide: 0.4,
  after: "stay",
  response: 600,
  bounce: 0.3,
  focusZoom: 1.5,
  focusHeight: 3,
  focusAngle: 50,
  flyResponse: 900,
  flyBounce: 0.1,
  arc: 1,
  drag: "look",
  lookSpeed: 12,
  reverseAcross: false,
  reverseUpDown: false,
  lookUp: 40,
  lookDown: 60,
  sideKeys: "step",
  turnSpeed: 90,
  smoothing: 100,
  clearAir: 150,
  haze: 35,
  rimInView: true,
  inside: true,
  insideColour: "#f7f1f2",
  insideLight: 20,
  insideOpacity: 100,
};

/** The zoom's range and step, which the wheel on the camera's page steps by too (`zoomBy`). */
const ZOOM = { min: 0.5, max: 4, step: 0.25 };

export const CAMERA_JIG: Jig<CameraConfig> = {
  name: "Camera",
  version: 12,
  start: CAMERA_START,
  groups: [
    {
      title: "View",
      controls: [
        { kind: "number", key: "height", label: "Height", min: 0, max: 30, step: 0.2, marks: 5, unit: "m" },
        { kind: "number", key: "angle", label: "Angle", min: -60, max: 90, step: 1, marks: 15, unit: "°" },
        { kind: "number", key: "turn", label: "Turn", min: -180, max: 180, step: 1, marks: 45, unit: "°" },
      ],
    },
    {
      title: "Lens",
      controls: [
        { kind: "number", key: "fov", label: "Field of view", min: 20, max: 90, step: 1, marks: 10, unit: "°" },
        { kind: "number", key: "zoom", label: "Zoom", ...ZOOM, unit: "×" },
      ],
    },
    {
      title: "Movement",
      controls: [
        { kind: "number", key: "speed", label: "Speed", min: 0.2, max: 3, step: 0.2, unit: "×" },
        { kind: "number", key: "keys", label: "Keys", min: 1, max: 20, step: 1, unit: "m/s" },
        { kind: "number", key: "glide", label: "Glide", min: 0, max: 2, step: 0.1, unit: "s" },
        {
          kind: "choice",
          key: "after",
          label: "After a drag",
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
      title: "Steering",
      note: () => "In the helmet, the figure faces the way you look. A drag looks round (Slide: it moves you over the ground instead), the head tilting with it; W and S go ahead and back the way you look; A and D step sideways, or turn. Look speed is the degrees a drag of 100 px turns. Off the helmet (Shows: Skeleton) the camera stands back as before.",
      controls: [
        {
          kind: "choice",
          key: "drag",
          label: "Drag",
          options: [
            { value: "look", label: "Look" },
            { value: "slide", label: "Slide" },
          ],
        },
        { kind: "number", key: "lookSpeed", label: "Look speed", min: 2, max: 40, step: 2, unit: "°" },
        { kind: "switch", key: "reverseAcross", label: "Reverse across" },
        { kind: "switch", key: "reverseUpDown", label: "Reverse up and down" },
        { kind: "number", key: "lookUp", label: "Look up", min: 0, max: 60, step: 5, unit: "°" },
        { kind: "number", key: "lookDown", label: "Look down", min: 0, max: 90, step: 5, unit: "°" },
        {
          kind: "choice",
          key: "sideKeys",
          label: "A and D",
          options: [
            { value: "step", label: "Step" },
            { value: "turn", label: "Turn" },
          ],
        },
        { kind: "number", key: "turnSpeed", label: "Turn speed", min: 0, max: 360, step: 15, marks: 45, unit: "°/s" },
        { kind: "number", key: "smoothing", label: "Smoothing", min: 0, max: 400, step: 10, marks: 50, unit: "ms" },
      ],
    },
    {
      title: "Visor view",
      note: () => "How the world looks from inside the helmet. Clear air takes the white veil over the floor, the base clouds and the walls' fog away round the eye; Haze is how much of them is drawn past it (100% as everywhere else). Other views keep the world's air. Inside shows the head's shell from within, round the visor, in its own colour; Inside light lifts it out of its own shade (0%: the world's light alone); Inside opacity lets the world show through it (100%: none).",
      controls: [
        { kind: "number", key: "clearAir", label: "Clear air", min: 0, max: 300, step: 10, marks: 50, unit: "m" },
        { kind: "number", key: "haze", label: "Haze", min: 0, max: 100, step: 5, unit: "%" },
        { kind: "switch", key: "rimInView", label: "Rim in view" },
        { kind: "switch", key: "inside", label: "Inside" },
        { kind: "colour", key: "insideColour", label: "Inside colour", options: COLOURS },
        { kind: "number", key: "insideLight", label: "Inside light", min: 0, max: 100, step: 5, unit: "%" },
        { kind: "number", key: "insideOpacity", label: "Inside opacity", min: 0, max: 100, step: 5, unit: "%" },
      ],
    },
    {
      title: "Focus",
      controls: [
        { kind: "number", key: "focusZoom", label: "Zoom", min: 1, max: 4, step: 0.25, unit: "×" },
        { kind: "number", key: "focusHeight", label: "Height", min: 0.5, max: 20, step: 0.5, marks: 2, unit: "m" },
        { kind: "number", key: "focusAngle", label: "Angle", min: 10, max: 90, step: 1, marks: 10, unit: "°" },
      ],
    },
    {
      title: "Flight",
      controls: [
        { kind: "number", key: "flyResponse", label: "Response", min: 200, max: 2000, step: 100, unit: "ms" },
        { kind: "number", key: "flyBounce", label: "Bounce", min: 0, max: 0.9, step: 0.1 },
        { kind: "number", key: "arc", label: "Arc", min: 0, max: 10, step: 0.5, unit: "m" },
      ],
    },
  ],
  // W71: Copy ends with the settings exactly, so what he sends back is what the world starts from.
  copy: (config) => [`Settings JSON: ${JSON.stringify(config)}`],
};

/** The values that say how the camera looks at the world: what a click's flight moves, with the zoom. */
export const EYE_KEYS = ["height", "angle", "turn"] as const;
export type EyeValues = Pick<CameraConfig, (typeof EYE_KEYS)[number]>;
export const MOVED_KEYS = [...EYE_KEYS, "zoom"] as const;

type Vec = readonly [number, number, number];

/** Where the camera is over the ground, in metres: across (`x`) and along (`z`). Not a setting: it moves. */
export type Ground = readonly [number, number];

const RAD = Math.PI / 180;
/** Lower than this, an eye on the ground sees nothing of it: it never stands lower. */
const LOWEST = 0.2;

/** The zoom `steps` steps in (out where negative), within its range: the wheel on the camera's page. */
export function zoomBy(camera: CameraConfig, steps: number): number {
  return Math.min(ZOOM.max, Math.max(ZOOM.min, Math.round((camera.zoom + steps * ZOOM.step) / ZOOM.step) * ZOOM.step));
}

/** How wide the camera sees, top to bottom, in degrees: the lens's field of view, narrowed by its zoom. */
export function fovOf(camera: CameraConfig): number {
  const half = (camera.fov * Math.PI) / 360;
  return (Math.atan(Math.tan(half) / Math.max(0.01, camera.zoom)) * 360) / Math.PI;
}

/** The way across the ground the camera faces, as a unit vector: turned `turn` degrees right of −z. */
export function facing(turn: number): Vec {
  return [Math.sin(turn * RAD), 0, -Math.cos(turn * RAD)];
}

/** Where the camera stands and a point it looks at, in metres: over `at`, at its height, looking down its angle. */
export function eyeOf(camera: EyeValues, at: Ground): { position: Vec; target: Vec } {
  const way = facing(camera.turn);
  const angle = Math.min(89.9, Math.max(0, camera.angle)) * RAD;
  const position: Vec = [at[0], Math.max(LOWEST, camera.height), at[1]];
  const gaze: Vec = [way[0] * Math.cos(angle), -Math.sin(angle), way[2] * Math.cos(angle)];
  return { position, target: [position[0] + gaze[0] * 10, position[1] + gaze[1] * 10, position[2] + gaze[2] * 10] };
}

/**
 * How far back over the ground from a point the camera stands to see it at the middle of the view: as far as its gaze
 * travels, at its height and angle, before it meets the ground. Looking almost level, it stands at most 60 m back.
 */
export function reachOf(camera: EyeValues): number {
  const angle = Math.min(89.9, Math.max(0, camera.angle)) * RAD;
  return Math.min(60, Math.max(LOWEST, camera.height) / Math.tan(Math.max(angle, 0.5 * RAD)));
}

/** Where over the ground the camera stands to see `point` (on the ground) at the middle of its view. */
export function overlooking(camera: EyeValues, point: { x: number; z: number }): Ground {
  const way = facing(camera.turn);
  const back = reachOf(camera);
  return [point.x - way[0] * back, point.z - way[2] * back];
}

/**
 * Where the camera stands to follow the figure at `at`: back from it the way it faces, at its height, so its gaze meets
 * the figure `up` metres over the ground (its hips, `human.ts`) at the middle of the view. Lower than that, it stands
 * as near as it can and looks down at the feet.
 */
export function following(camera: EyeValues, at: Ground, up: number): Ground {
  return overlooking({ ...camera, height: camera.height - up }, { x: at[0], z: at[1] });
}
