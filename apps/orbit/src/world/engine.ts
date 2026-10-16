import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { readHumanMotion, type HumanMotion, type HumanPose } from "@no-origins/ui/lib/human-motion";
import { springAt, springSettled } from "@no-origins/ui/lib/spring";

import { buildClouds, type BuiltClouds } from "./build-clouds";
import type { CloudsConfig } from "./clouds";
import { buildBlocks, buildCutBlock, buildGhost, buildOutlines, buildSectorBounds, cutSegmentsOf, insideCut, type BuiltCutBlock, type CutSegment } from "./build-blocks";
import { buildHuman, type BuiltHuman } from "./build-human";
import { buildHumanStand } from "./build-human-stand";
import { blendFlight, clayFlightAt, clayFlightMode, flightStanding, groundedFlight, readClayFlightMotion, stepClayFlight, type ClayFlightFrame, type ClayFlightMotion, type ClayFlightState } from "./human-flight";
import { buildOrbit, type BuiltOrbit } from "./build-orbit";
import { buildRing, GHOST_RING, PICKED_RING } from "./build-ring";
import { AXES, AXIS_WAY, buildGizmo, type Axis, type BuiltGizmo } from "./build-gizmo";
import { buildSkeletonOverlay, buildSkeletons, pipeCutOf, type BuiltOverlay, type PlacedSkeleton } from "./build-skeletons";
import { buildTrees, type PlacedTree } from "./build-tree";
import type { PlacedMountain } from "./build-world-base";
import { treeOf } from "./tree";
import { CHARACTER_ANGLE, characterEye, fovOf, MOVED_KEYS, overlooking, type CameraConfig, type Ground, type MovedValues } from "./camera";
import type { MountainConfig } from "./mountain-jig";
import { mountainExtent } from "./mountain-profile";
import { mountainTurn } from "./mountains";
import { drawnOf, type EnvironmentConfig } from "./environment";
import { flightAt, type Rig } from "./focus";
import { cycleFor, figureStanding, figureStep, gazeAt, HUMAN_HEIGHT, UNIT, inPlaceOf, poseOf, postureOf, readHoverMotion, turnBetween, withExpression, withGaze, type Figure, type Gaze, type HoverMotion, type HumanConfig } from "./human";
import type { Where } from "./map";
import { add, keysRise, keysTurn, keysWant, movesCamera, NOWHERE, releasedAt, risesCamera, slideOf, steer } from "./movement";
import { BASE_BLOCK, onPlane, lookingOverPlane, overGroundPlane, riseInside, slideInside, type WorldSize } from "./orbit";
import { blockOf, bodyOf, groveOf, isGrove, landing, metresOf, placedOf, roomOf, sectorOf, sectorsOf, skeletonsOf, solidInside, solidsOf, solidUnder, stepOf, withBlockAt, withBlocksMoved, withBlocksTurned, withGrove, withGroveAt, withoutAsset, withoutAssets, withPlaced, withPlacedAt, withSkeleton, withSkeletonAt, PLACED_KINDS, SKELETON_KINDS, type BlockShape, type PlacedKind, type Rotation, type Room, type SkeletonAsset, type SkeletonKind, type Solid, type WorldData } from "./hierarchy";
import { blockColumnAt, bothOf, drapedLines, footAt, groveTrees, type ColumnAt } from "./grove";
import { meshColumnAt } from "./surface-crossings";
import { fallen, groundUnder, throughPipeWall, type PipeBody } from "./walking";
import { ceilingOver, jumpSpeed, mixPoses, readAirMotion, type AirMotion } from "./air";
import { areaLines } from "./area";
import type { PipeLook } from "./pipe";
import type { RoadLook } from "./road";
import { centreOf as jointCentre, directionOf, jointOf, JOINTS_MOST, onLattice, wayAlong, wayOf, withoutJoint, type Point, type Way } from "./skeleton";
import { nextGrove, type PlaceState } from "./place";
import { shapeOf, type BuildState, type SpacesConfig } from "./spaces";
import { aloneOn, centreOf, HUMAN_STAND, HUMAN_TOP, viewFor, VISITOR, type ViewName } from "./start";

/**
 * What the world is drawn from: its boundaries (`bounds`, World.md W29) and each jig's settings (W14), his or someone's
 * at play on a jig's page; what is built (`world`, W25), and how it is being built (`build`, on the Sectors page, W81).
 */
export type WorldSettings = {
  bounds: WorldSize;
  environment: EnvironmentConfig;
  /** The mountain's variants by id (World.md W72, W73), what the placed mountains are drawn from, and the one being tuned alone on its page. */
  mountains: Record<string, MountainConfig>;
  mountain: MountainConfig;
  clouds: CloudsConfig;
  camera: CameraConfig;
  human: HumanConfig;
  /** The human's variants by id, what the placed humans are drawn from (W89); `human` is the visitor's, and the one on its page. */
  humanVariants: Record<string, HumanConfig>;
  /** The Sectors page's tuning (W81): every block's grain. */
  spaces: SpacesConfig;
  world: WorldData;
  build: BuildState;
  /** How elements are being placed on the Sectors page (W73, W82, W93): each element's variant, the next pipe's, road's and grove's look, the one picked. */
  place: PlaceState;
};

export type WorldEngine = {
  /** Draws the world from new settings: what changed is made anew; a new camera moves the eye on a view that is it. */
  set(settings: WorldSettings): void;
  /** The map's ask (`minimap.tsx`): take the camera to a point of the world. */
  travelTo(x: number, z: number): void;
  /**
   * The Sectors page's (W81): takes a looked-round camera to see a sector's room whole, at the middle of the room the
   * card leaves, gliding there on the camera's Flight spring, or there at once.
   */
  frame(room: Room, instant?: boolean): void;
  setView(name: ViewName): void;
  dispose(): void;
};

/**
 * The world's engine (World.md W12): the renderer, the scene and the camera, made once for the canvas and kept for as
 * long as the page is open (W2). It draws only when something changes (W8): a resize, a new setting, a new view, a
 * drag. Three.js's WebGPU renderer falls back to WebGL 2 by itself (W9).
 *
 * The world is the Orbit (`orbit.ts`, `build-orbit.ts`): its open square, the clouds above it and what is built in it,
 * the hierarchy's blocks (`hierarchy.ts`, `build-blocks.ts`), each sector's made apart, so a click remakes only its own.
 * There is no ground plane (World.md W24). What is built is his everywhere, someone's at play on the Sectors page.
 * Every camera stays over the world's square (W23), however it is moved. The portal went with W93 (his: "Let's remove
 * Portal because Pipes can be portals now"), and its flight with it.
 * On the Sectors page (W81) a click builds: it places a block of the builder's shape into the sector picked where the
 * pointer shows one, flush with what it meets, or with Select picks blocks for the card to edit (`onPickBlocks`;
 * Backspace removes them, G moves them, R turns them), and the page's store keeps the world (`onWorld`).
 *
 * On a view that is the visitor's camera, a drag, the arrows and W A S D move it over the ground (`movement.ts`), and the
 * map flies it to a point (`focus.ts`). The visitor is the human (`human.ts`,
 * World.md W51): the figure stands where the visitor is, the camera in its helmet or behind it (W100), and as the visitor
 * travels the figure turns to face its way and walks or runs, its stride covering the ground (`figureStep`), until it
 * comes to rest. Its head is held in its Expression, or, with Looks at cursor on, turned to the pointer while it is
 * over the world (`hold`, `cursorGaze`). While the camera moves or flies, the figure walks or settles, the world draws
 * every frame, and stops once everything rests.
 *
 * The canvas says when its first frame is drawn (`data-ready`), on which backend (`data-backend`), and the human's gait
 * (`data-gait`), for the review.
 */
export async function createWorld(
  canvas: HTMLCanvasElement,
  start: {
    settings: WorldSettings;
    view: ViewName;
    /** Hears the camera's values (its zoom, and which camera it is) as the hand and C move them, so the camera's card can show them moving. */
    onEye?: (eye: MovedValues) => void;
    /** Hears where the camera is, each time it moves, for the map. */
    onWhere?: (where: Where) => void;
    /** Hears the world as a click on the Sectors page builds a block or places an element into a sector, or a drag moves an element, or Backspace takes them away (W24, W82), to store. */
    onWorld?: (world: WorldData) => void;
    /**
     * Hears which placed element a click on the Sectors page picked with Select, or none (W82); for a pipe or a road, the
     * joint of its skeleton picked too, or none (W84).
     */
    onPick?: (id: string | null, joint?: number | null) => void;
    /** Hears which blocks are picked on the Sectors page with Select (W24): a click one, Shift-click more, none on the ground or Escape. */
    onPickBlocks?: (ids: string[]) => void;
    /** Hears the Tool a key picked on the Sectors page (W93): V is Select, P is Place. */
    onTool?: (tool: "place" | "select") => void;
    /** Hears that a click placed an element of this kind: the grove brush then draws its next seed. */
    onPlaced?: (kind: PlacedKind) => void;
  },
): Promise<WorldEngine> {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;
  await renderer.init();
  const maximumRatio = Math.min(window.devicePixelRatio, 1.5);
  let pixelRatio = maximumRatio;
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const sky = new THREE.Color();
  scene.background = sky;
  // The fog (the environment's Fog): its colour, where it starts and where it is whole; never on the sky behind it.
  const fog = new THREE.Fog(0xffffff, 80, 1500);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 5000);

  // A drag turns the camera round what it looks at, on a view that allows it; on the environment's and the sector's
  // pages a right-drag moves what it looks at, and the wheel brings it nearer. The plane edges clip the camera along its line of sight.
  const look = new OrbitControls(camera, canvas);
  // OrbitControls writes `cursor: auto` on the canvas as it lets go of it (`disconnect`), which would hide the design
  // system's ring there (Grid.md D34); a world made on the same canvas again clears what the last one left.
  canvas.style.removeProperty("cursor");
  look.enablePan = false;
  look.screenSpacePanning = false;
  look.minDistance = 1;
  look.maxDistance = 12;
  /** The world's boundaries (W29): every camera, and everything built, stays inside them. */
  const bounds = () => settings.bounds;
  const holdLook = () => {
    const held = lookingOverPlane(camera.position.toArray(), look.target.toArray(), bounds());
    camera.position.set(...held.position);
    look.target.set(...held.target);
  };

  // A jig's page lays its card over the world (`data-world-aside`), and the Sectors page a second, the item's, on the
  // right (W89): its view centres what it looks at in the room the cards leave, between them on a wide screen, between
  // the one along the top and the one along the bottom on a phone, by shifting the picture, never the camera. The
  // camera's page too: the eye's picture is shifted, so what it centres (a portal flown to) is in the middle of the room.
  let asides: HTMLElement[] = [];
  /** The room the cards leave, in the canvas's pixels: a narrow card on the left or the right, a wide one along the top or the bottom. */
  const roomLeft = (width: number, height: number) => {
    const field = canvas.getBoundingClientRect();
    let left = 0;
    let right = width;
    let top = 0;
    let bottom = height;
    for (const aside of asides) {
      if (!aside.isConnected) continue;
      const box = aside.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      if (box.width < width * 0.7) {
        if (box.left + box.width / 2 - field.left < width / 2) left = Math.max(left, box.right - field.left);
        else right = Math.min(right, box.left - field.left);
      } else if (box.top + box.height / 2 - field.top >= height / 2) {
        // A card along the bottom taller than two thirds of the view leaves no room worth centring in.
        if (box.top - field.top >= height / 3) bottom = Math.min(bottom, box.top - field.top);
      } else top = Math.max(top, box.bottom - field.top);
    }
    return { left, right: Math.max(left + 1, right), top, bottom: Math.max(top + 1, bottom) };
  };
  let portraitFit: { key: string; zoom: number } | null = null;
  const frame = (width: number, height: number) => {
    const room = roomLeft(width, height);
    // The Clay stays whole above its card on a portrait screen, beside the compass rather than behind it (W103).
    const clayPortrait = viewing === "human" && settings.human.form === "clay" && width < height;
    if (clayPortrait) {
      const compass = document.querySelector<HTMLElement>('[aria-label="Compass"]')?.getBoundingClientRect();
      if (compass) room.right = Math.max(room.left + 1, Math.min(room.right, compass.left - canvas.getBoundingClientRect().left));
    }
    if (clayPortrait) {
      let figureWidth = (settings.human.clayBody + 2 * settings.human.clayArmWidth) / 100;
      if (settings.human.moves !== "still") figureWidth *= 1.7;
      else if (human) {
        // Fit asymmetric held poses about the figure's origin, including a raised arm (W104).
        const box = new THREE.Box3().setFromObject(human.object);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const across = Math.max(Math.abs(box.min.x - human.object.position.x), Math.abs(box.max.x - human.object.position.x));
        const deep = Math.max(Math.abs(box.min.z - human.object.position.z), Math.abs(box.max.z - human.object.position.z));
        figureWidth = Math.max(figureWidth, 2 * (Math.abs(right.x) * across + Math.abs(right.z) * deep));
      }
      const key = [width, height, room.left, room.right, room.top, room.bottom, figureWidth].join(":");
      if (portraitFit?.key !== key) {
        const projectedHeight = HUMAN_HEIGHT * height / (2 * camera.position.distanceTo(look.target) * Math.tan(camera.fov * Math.PI / 360));
        const availableHeight = 0.8 * Math.min(room.bottom - room.top, (room.right - room.left) * HUMAN_HEIGHT / figureWidth);
        portraitFit = { key, zoom: Math.min(1, availableHeight / projectedHeight) };
      }
    } else portraitFit = null;
    // Fit when the available room changes; subsequent wheel/drag inspection keeps its own camera distance.
    const zoom = portraitFit?.zoom ?? 1;
    if (camera.zoom !== zoom) { camera.zoom = zoom; camera.updateProjectionMatrix(); }
    const x = (room.left + room.right) / 2 - width / 2;
    const y = (room.top + room.bottom) / 2 - height / 2;
    if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) return camera.clearViewOffset();
    camera.setViewOffset(width, height, -x, -y, width, height);
  };
  /** Finds the cards over the world anew, watching each one's size. */
  const findAsides = () => {
    const next = [...document.querySelectorAll<HTMLElement>("[data-world-aside]")];
    if (next.length === asides.length && next.every((aside, i) => aside === asides[i])) return false;
    for (const aside of asides) resize.unobserve(aside);
    asides = next;
    for (const aside of asides) resize.observe(aside);
    return true;
  };

  let lastWhere = "";
  const direction = new THREE.Vector3();
  let size = { width: 0, height: 0 };
  let drawRequest = 0;
  const renderFrame = () => {
    const { clientWidth: width, clientHeight: height } = canvas;
    if (!width || !height) return;
    if (width !== size.width || height !== size.height) {
      size = { width, height };
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    frame(width, height);
    // The picked skeleton's joints stay the same few pixels however far the camera is (W84).
    overlay?.scaleFor(camera, height);
    gizmo?.scaleFor(camera, height);
    renderer.render(scene, camera);
    // Where the picked skeleton's joints and its arrow's head are on the screen, for the review (W87).
    const shown = overlay ? pickedSkeleton() : null;
    const tip = overlay?.tip();
    if (shown) canvas.dataset.skeleton = JSON.stringify({ joints: shown.centres.map((centre) => onScreen(new THREE.Vector3(...centre))), tip: tip ? onScreen(tip) : null });
    else delete canvas.dataset.skeleton;
    // How many joints the pipe or road being drawn has (W93), for the review.
    if (drawing) canvas.dataset.drawing = String(drawing.joints.length);
    else delete canvas.dataset.drawing;
    // Where the move gizmo's middle and arrow heads are on the screen, for the review (W88).
    if (gizmo) {
      const heads = gizmo.heads();
      const head = (axis: Axis) => (heads[axis] ? onScreen(heads[axis]) : null);
      canvas.dataset.gizmo = JSON.stringify({ at: onScreen(gizmo.object.position), x: head("x"), y: head("y"), z: head("z") });
    } else delete canvas.dataset.gizmo;
    camera.getWorldDirection(direction);
    const turn = Math.atan2(direction.x, -direction.z) * 180 / Math.PI;
    const poseKey = [camera.position.x, camera.position.y, camera.position.z, turn, camera.fov, camera.aspect].join(",");
    if (poseKey !== lastWhere) {
      lastWhere = poseKey;
      const across = 2 * Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect) * 180 / Math.PI;
      start.onWhere?.({ at: [camera.position.x, camera.position.z], turn, across, height: camera.position.y });
    }
    canvas.dataset.backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? "webgpu" : "webgl";
    canvas.dataset.ready = "true";
  };
  const draw = () => {
    if (!drawRequest && !document.hidden) drawRequest = requestAnimationFrame(() => { drawRequest = 0; renderFrame(); });
  };
  look.addEventListener("change", () => {
    holdLook();
    draw();
  });
  /** A looked-round camera gliding to frame a sector (W81, `frame`): from where it was to where it goes, and when it set off. */
  let glide: { from: { position: THREE.Vector3; target: THREE.Vector3 }; to: { position: THREE.Vector3; target: THREE.Vector3 }; at: number } | null = null;
  // The hand or the wheel on a looked-round view stops a glide where it is.
  look.addEventListener("start", () => {
    glide = null;
  });

  let settings = start.settings;
  let frameRequest = 0;
  // Independent sky and cloud clocks. Under reduced motion both hold still.
  // A hidden tab receives no RAF callbacks; elapsed time is capped on return, avoiding a catch-up jump.
  let orbit: BuiltOrbit | null = null;
  let clouds: BuiltClouds | null = null;
  /** The picked pipe's or road's skeleton drawn over it, or the one being drawn (W84, W93). */
  let overlay: BuiltOverlay | null = null;
  /**
   * A pipe or a road being drawn (W93; his: "placing start and then the sub sequent joints. The pipe will take share as
   * we place the points"): which, into which sector, in what look, its joints so far, in metres in the world, and their
   * ways (the start's out of the face it was clicked on, the last's into the one it was clicked on, every joint between
   * free), and the asset it is kept as, once it has two.
   */
  let drawing: { kind: SkeletonKind; sector: string; look: PipeLook | RoadLook; joints: Point[]; ways: (Way | null)[]; id: string | null } | null = null;
  /** A joint being moved by the hand (W84): the skeleton, which joint, the hand, where it pressed, its joints then, and whether it has moved. */
  let shaping: { id: string; kind: SkeletonKind; index: number; aiming: boolean; pointer: number; x: number; y: number; joints: Point[]; ways: (Way | null)[]; lift: number; room: Room; moved: boolean } | null = null;
  /** A skeleton's joints while a hand moves one, drawn before the world keeps them, on the hand's letting go. */
  let reshaping: { id: string; joints: Point[]; ways: (Way | null)[] } | null = null;
  let skyTime = 0;
  let cloudTime = 0;
  let baseTime = 0;
  let flowAt = 0;
  let frameAverage = 16;
  let qualityAt = 0;
  let qualityFrames = 0;
  // The ceiling flows only while it is shown (W76).
  const ceilingFlowing = () => !!clouds?.flowing && settings.clouds.shown;
  const flow = (now: number) => {
    // The atmosphere as drawn (W76): a part switched off is nothing, so its clock rests.
    const environment = drawnOf(settings.environment);
    if (!environment.motion || (!orbit?.flowing && !ceilingFlowing()) || reduced.matches) {
      flowAt = 0;
      return false;
    }
    const elapsed = flowAt ? Math.min(100, now - flowAt) : 16;
    const seconds = elapsed / 1000;
    frameAverage += (elapsed - frameAverage) * 0.05;
    qualityFrames++;
    // W8: volume quality follows frame cadence. Reduce resolution under sustained load; recover slowly.
    // This measures presented frame intervals, not isolated GPU execution time.
    if (qualityFrames >= 45 && now - qualityAt > 2000) {
      canvas.dataset.frameMs = frameAverage.toFixed(1);
      const nextRatio = frameAverage > 34 ? Math.max(0.75, pixelRatio - 0.25)
        : frameAverage < 19 && now - qualityAt > 10000 ? Math.min(maximumRatio, pixelRatio + 0.125) : pixelRatio;
      if (nextRatio !== pixelRatio) {
        pixelRatio = nextRatio;
        renderer.setPixelRatio(pixelRatio);
        size = { width: 0, height: 0 };
        qualityAt = now;
        qualityFrames = 0;
      }
      canvas.dataset.quality = pixelRatio.toFixed(3);
    }
    if (environment.skyFlow > 0) skyTime += seconds * environment.skySpeed;
    if (environment.cloudFlow > 0) cloudTime += seconds * environment.cloudSpeed;
    if (environment.baseCloudDensity > 0 && environment.baseCloudCoverage > 0) baseTime += seconds * environment.baseCloudSpeed;
    flowAt = now;
    orbit?.flow(skyTime, cloudTime, baseTime);
    clouds?.flow(cloudTime);
    return true;
  };
  // One frame loop for whatever moves: a drag carrying on after the hand let go, the keys, a flight, the atmosphere.
  const tick = () => {
    frameRequest = 0;
    if (document.hidden) return;
    inTick = true;
    if (release) carryOn();
    if (flight) fly();
    if (glide) glideOn();
    const now = performance.now();
    const leaving = unride(now);
    const walking = walk(now);
    const falling = falls(now);
    const striding = stride(now);
    // The eye in the helmet goes where the head is once the figure has stepped and been posed, every frame (World.md
    // W77): never a frame behind it, nor left where it was while the figure settles.
    const steadying = eyeView && human ? aimEye(now) : false;
    const flowing = flow(now);
    // W33: the sky and clouds alone drift slowly, so they redraw at most every 50 ms; anything else moving draws each frame.
    const moving = release || flight || glide || walking || falling || striding || steadying || leaving;
    if (moving || !flowing || now - flowDrawnAt >= 50) {
      draw();
      flowDrawnAt = now;
    }
    inTick = false;
    if (moving || flowing) frameRequest = requestAnimationFrame(tick);
  };
  let flowDrawnAt = 0;
  /** Whether a tick is running: what it moves asks for the next frame itself, so nothing inside it asks for one too. */
  let inTick = false;
  const wake = () => {
    if (!frameRequest && !inTick && !document.hidden) frameRequest = requestAnimationFrame(tick);
  };
  const visibility = () => {
    cancelAnimationFrame(frameRequest); frameRequest = 0; cancelAnimationFrame(drawRequest); drawRequest = 0; flowAt = 0;
    if (!document.hidden) wake();
  };
  document.addEventListener("visibilitychange", visibility);

  // What the world is made of, each part made anew only when what it is made from changes: the Orbit round it (the
  // sky), what is placed, and what is built, a part a sector.
  const parts = new Map<string, { key: string; object: THREE.Object3D }>();
  const part = (name: string, key: string | null, make: () => THREE.Object3D) => {
    const was = parts.get(name);
    if (was && was.key === key) return;
    if (was) {
      scene.remove(was.object);
      dispose(was.object);
      parts.delete(name);
    }
    if (key === null) return;
    const object = make();
    scene.add(object);
    parts.set(name, { key, object });
  };
  // The blocks where they stand in the world, inside its boundaries (W93): worked out once a world.
  let builtFor: { world: WorldData; bounds: WorldSize; solids: Solid[] } | null = null;
  const built = () => {
    if (builtFor?.world !== settings.world || builtFor.bounds !== settings.bounds) {
      builtFor = { world: settings.world, bounds: settings.bounds, solids: solidsOf(settings.world).filter((solid) => solidInside(solid, settings.bounds)) };
    }
    return builtFor;
  };
  /**
   * Where what stands in the world crosses each of its columns (World.md W96, W99), each surface facing up or down: the
   * blocks', met as boxes, and the drawn mountains', pipes' and roads' (`meshColumnAt`); never a human's, a tree's, or
   * the pipe or road being drawn. Worked out again only when what is drawn there could have changed.
   */
  let columnFor: { world: WorldData; mountains: WorldSettings["mountains"]; bounds: WorldSize; drawn: string | null; viewing: ViewName; column: ColumnAt; meshes: THREE.Mesh[]; meshColumn: ColumnAt; walk: ColumnAt } | null = null;
  const groundColumn = (): ColumnAt => {
    const drawn = drawing?.id ?? null;
    if (columnFor?.world === settings.world && columnFor.mountains === settings.mountains && columnFor.bounds === settings.bounds && columnFor.drawn === drawn && columnFor.viewing === viewing) return columnFor.column;
    const meshes: THREE.Mesh[] = [];
    for (const name of ["orbit", ...[...parts.keys()].filter((name) => name.startsWith("skeleton "))]) {
      const object = parts.get(name)?.object;
      if (!object) continue;
      object.updateMatrixWorld(true);
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh) || child instanceof THREE.InstancedMesh || child instanceof THREE.SkinnedMesh) return;
        let owner: THREE.Object3D | null = child;
        while (owner && typeof owner.userData.asset !== "string") owner = owner.parent;
        const asset = owner?.userData.asset as string | undefined;
        if (!asset || asset === "studio" || asset === "drawing" || asset === drawn) return;
        meshes.push(child);
      });
    }
    const meshColumn = meshColumnAt(meshes);
    const column = bothOf(blockColumnAt(built().solids), meshColumn);
    // The figure's (W101): the same, but a block a pipe is subtracted from is open where the hole is drawn
    // (`insideCut`, at its top), so the figure goes down through it.
    const solids = built().solids;
    const whole = blockColumnAt(solids.filter((solid) => !solid.cuts?.length));
    const cut = solids.filter((solid) => solid.cuts?.length).map((solid) => ({ id: solid.id, column: blockColumnAt([solid]) }));
    const walkMeshes = meshColumnAt(meshes, { sides: true });
    const walk: ColumnAt = (x, z) => [
      ...whole(x, z),
      ...walkMeshes(x, z),
      ...cut.flatMap((one) => {
        const crossings = one.column(x, z);
        const top = crossings.find((crossing) => crossing.up);
        return top && insideCut(cutSegments.get(one.id) ?? [], [x, top.y - 0.01, z]) ? [] : crossings;
      }),
    ];
    columnFor = { world: settings.world, mountains: settings.mountains, bounds: settings.bounds, drawn, viewing, column, meshes, meshColumn, walk };
    return column;
  };
  /** The columns the figure walks on (W101): `groundColumn`'s, open where a pipe is subtracted from a block. */
  const walkColumn = (): ColumnAt => {
    groundColumn();
    return columnFor!.walk;
  };
  /** Where each block a pipe is subtracted from is cut (W95), as last told: what its hole is for the figure (W101). */
  const cutSegments = new Map<string, CutSegment[]>();
  /** The pipes as the figure meets them (W101): their walls, and which ends are open. */
  let pipeBodies: PipeBody[] = [];
  /**
   * The trees (World.md W67, W73, W93, W96, W99): each grove's, drawn from its look, its numbers and its area, each tree
   * on the ground of the open space at the grove's height in its column (`groundColumn`) and carrying the grove, so a
   * click on one picks the grove; and a
   * tree placed alone before groves, in its own look. They stand in the base gas as the mountains do. An element's page
   * draws none.
   */
  const treeParts = () => {
    const alone = aloneOn(viewing);
    const column = alone ? null : groundColumn();
    const trees: PlacedTree[] = !column ? [] : placedOf(settings.world).flatMap(({ asset, x, y, z }) =>
      asset.kind === "tree" && asset.look ? [{ id: asset.id, tree: treeOf(asset.look, asset.seed, x, z, asset.turn, asset.height ?? 50, asset.height ?? 50, asset), look: asset.look, y }] : []);
    if (column) {
      for (const asset of settings.world.assets) {
        if (!isGrove(asset)) continue;
        for (const stood of groveTrees(settings.world, asset, column)) trees.push({ id: asset.id, tree: treeOf(asset.look, stood.seed, stood.x, stood.z, stood.turn, stood.height, asset.heightTo), look: asset.look, y: stood.y });
      }
    }
    part("trees", trees.length ? JSON.stringify(trees) : null, () => buildTrees(trees, orbit?.airAt).object);
  };
  const build = () => {
    const { spaces } = settings;
    const environment = drawnOf(settings.environment);
    sky.set(environment.sky);
    // The painted sky stays beyond every corner of the plane.
    const far = 20000;
    if (camera.far !== far) {
      camera.far = far;
      camera.updateProjectionMatrix();
    }
    fog.color.set(environment.fog);
    fog.near = environment.fogFrom;
    fog.far = Math.max(environment.fogTo, environment.fogFrom + 1);
    // Shared surface controls rebuild both surroundings and land, so the sun and grain always agree.
    const atmosphere = [environment.sunlight, environment.shadow, environment.warmth, environment.sunHeight,
      environment.sunTurn, environment.shade];
    // An element's page shows it alone (World.md W72; his: "just like human, where there is only one base and a human
    // standing there"): nothing of what is placed. Everywhere else the world is as placed (W73): each placed element
    // its variant where it stands.
    const alone = aloneOn(viewing);
    const placed = alone ? [] : placedOf(settings.world);
    // The human the visitor walks as takes its variant as it is now (W100).
    const walked = walker ? placed.find(({ asset }) => asset.id === walker?.id) : undefined;
    const walkedConfig = walked?.asset.kind === "human" ? settings.humanVariants[walked.asset.variant] : undefined;
    if (walker && walkedConfig) walker = { id: walker.id, config: walkedConfig };
    const mountains: PlacedMountain[] = alone === "mountain"
      ? [{ id: "studio", x: 0, z: 0, turn: 0, config: settings.mountain }]
      : placed.flatMap(({ asset, x, y, z }) => {
        const config = asset.kind === "mountain" ? settings.mountains[asset.variant] : undefined;
        return config ? [{ id: asset.id, x, y, z, turn: asset.turn, config }] : [];
      });
    part("orbit", "physical-cloud-world-v31", () => {
      orbit = buildOrbit(environment, settings.clouds, mountains);
      orbit.flow(skyTime, cloudTime, baseTime);
      return orbit.object;
    });
    orbit?.set(environment, settings.clouds, mountains);
    orbit?.inspectHuman(viewing === "human" && settings.human.form === "clay");
    // The clouds are the world's ceiling (W33), made once for its height; the sky, light and wind only retune them.
    part("clouds", `ceiling ${settings.bounds.height}`, () => {
      clouds = buildClouds(environment, settings.clouds, settings.bounds.height, orbit?.airAt);
      clouds.flow(cloudTime);
      return clouds.object;
    });
    clouds?.set(environment, settings.clouds);
    // Clouds' Shown (W76): off, the ceiling is not drawn and the sky shows overhead; the walls stay.
    if (clouds) clouds.object.visible = settings.clouds.shown;
    // The pipes and the roads (World.md W84, W93): the ones placed, each in its own look along its skeleton, a part each,
    // so a joint moved remakes its own alone; on an element's page, none. Before the trees, which may stand on them (W96).
    skeletonParts();
    treeParts();
    // What is built, on every view: his, or someone's at play on the Sectors page; a part a sector, so a block placed
    // remakes its sector's alone. Each block its own colour, lit by the environment's sun, in its own texture (W93).
    const grain = { grain: spaces.grain, grainSize: spaces.grainSize };
    const look = JSON.stringify([grain, ...atmosphere]);
    // The human's block, on its page alone (World.md W69): 4 × 4 m under the visitor's cell, to go round the figure.
    part("human stand", viewing === "human" ? `${look}:${settings.human.form}` : null, () =>
      settings.human.form === "clay" ? buildHumanStand(HUMAN_STAND) : buildBlocks([HUMAN_STAND], environment, grain));
    // The human (World.md W51), on a view that is the visitor's camera: where the visitor is, as its jig draws it; on
    // its own page, on its block in its posture (W69).
    const humanConfig = figureConfig();
    // Clay's effects are made once. A motion or expression change keeps the mesh and its takeoff/landing state.
    const humanShape = humanConfig.form === "clay" ? { ...humanConfig, moves: "still", posture: "stand", expression: "ahead", looksAtCursor: false } : humanConfig;
    part("human", eyeView || unriding || viewing === "human" ? JSON.stringify([humanShape, viewing === "human"]) : null, () => {
      // In the world its feet's boosts are built, as hovering builds them, and fired only while it flies (`air.ts`).
      human = buildHuman(viewing === "human" ? figureConfig() : { ...figureConfig(), moves: "hovering" });
      jets = { flames: [], lights: [], on: null };
      human.object.traverse((object) => {
        if (object instanceof THREE.PointLight && object.name.endsWith(" boost light")) jets.lights.push(object);
        else if (object.name.endsWith(" boost")) jets.flames.push(object);
      });
      // Its head bone as built, standing at rest at the origin: where the steady eye holds it from (W77).
      headRest = { local: human.bones.head.position.clone(), head: new THREE.Vector3().setFromMatrixPosition(human.bones.head.matrixWorld), hips: new THREE.Vector3().setFromMatrixPosition(human.bones.hips.matrixWorld) };
      // On the eye's view the eye is in its helmet: the figure stands and the camera goes in.
      if (viewing === "human") placeStatue();
      else if (eyeView) placeEye();
      else placeFigure();
      return human.object;
    });
    // Walking or running in place on its page keeps the frames coming.
    if (viewing === "human") {
      if (settings.human.form === "clay" && (clayFlightMode(settings.human.moves) || clayAir?.active)) wake();
      else if (settings.human.moves !== "still") wake();
      else placeStatue();
    }
    placedHumans(placed);
    const blocks = new Map<string, Solid[]>();
    const cut: Solid[] = [];
    for (const solid of alone ? [] : built().solids) {
      if (solid.cuts?.length) cut.push(solid);
      else blocks.set(solid.sector, [...(blocks.get(solid.sector) ?? []), solid]);
    }
    for (const name of parts.keys()) if (name.startsWith("blocks ") && !blocks.has(name.slice(7))) part(name, null, () => new THREE.Group());
    for (const [sector, solids] of blocks) part(`blocks ${sector}`, JSON.stringify([solids, look]), () => buildBlocks(solids, environment, grain));
    // A block a pipe is subtracted from (W95) is a part of its own, open where the pipe passes through it.
    const cutNames = new Set(cut.map((solid) => `cut ${solid.id}`));
    for (const name of [...parts.keys()]) if (name.startsWith("cut ") && !cutNames.has(name)) part(name, null, () => new THREE.Group());
    for (const solid of cut) {
      part(`cut ${solid.id}`, JSON.stringify([solid, look]), () => {
        const made = buildCutBlock(solid, environment, grain);
        made.object.userData.cutBy = made.cutBy;
        return made.object;
      });
    }
    cutParts();
    dressVisor();
    tools();
    // A flowing atmosphere keeps the frames coming.
    if (orbit?.flowing || ceilingFlowing()) wake();
  };

  /**
   * The humans placed in the world (W89; his: "For human, we don't need any, but only variants similar to mountains"):
   * each its variant, standing still in its Posture where it was placed, facing its turn; a part each, made anew only
   * when its variant changes, so moving one only moves it. The visitor is the human of the start, as before (W51).
   */
  const placedHumans = (placed: ReturnType<typeof placedOf>) => {
    // The one the visitor walks as is drawn once, as the visitor (W100).
    const humans = placed.filter(({ asset }) => asset.kind === "human" && settings.humanVariants[asset.variant] && asset.id !== walker?.id);
    const names = new Set(humans.map(({ asset }) => `placed human ${asset.id}`));
    for (const name of parts.keys()) if (name.startsWith("placed human ") && !names.has(name)) part(name, null, () => new THREE.Group());
    for (const { asset, x, y, z } of humans) {
      const config = settings.humanVariants[asset.variant];
      part(`placed human ${asset.id}`, JSON.stringify(config), () => {
        const made = buildHuman(config);
        const { pose, lift } = postureOf(config.posture, motion ?? (motion = readHumanMotion(canvas)));
        made.pose(withExpression(pose, config.expression), lift);
        made.object.userData.asset = asset.id;
        return made.object;
      });
      const object = parts.get(`placed human ${asset.id}`)?.object;
      if (object) {
        object.position.set(x, y, z);
        // The rig's front is +z; a turn of 0 faces north, −z (as the visitor's heading).
        object.rotation.y = Math.PI - (asset.turn * Math.PI) / 180;
      }
    }
  };
  /** The parts that draw what is placed, which a press may pick: the mountains, the trees and the placed humans. */
  const placedParts = () => ["orbit", "trees", ...[...parts.keys()].filter((name) => name.startsWith("placed human "))];

  // Building, on the Sectors page (`spaces.ts`, Build, World.md W24, W25, W81, W93): where the pointer would build, a
  // block of the builder's shape placed flush with the first thing the pointer meets in the sector picked (a block's face,
  // an element's surface, or the sector's floor: `meetAt`, `landing`), or with Select the block the pointer meets
  // (`solidUnder`), a ghost showing which. A click does it, into the sector picked, and the page's store keeps the world
  // (`onWorld`) and the pick (`onPickBlocks`): a click picks one block alone, a Shift-click (or Command, Control) adds
  // one or takes it out, a click on nothing lets them all go; each picked block wears an outline; Backspace or Delete
  // removes them (his: "I can select and then use backspace"), Escape lets them go. A block's middle is placed inside
  // the sector picked alone (W81, mine): its room; a block reaching past it is never refused (the card says so).
  type Building = {
    /** The picked sector's room, which a block's middle stands inside. */
    room: Room;
    /** The next block's shape, and how far it reaches and how it is turned. */
    shape: BlockShape;
    body: ReturnType<typeof bodyOf>;
    tool: string;
    /** The blocks picked with Select, in the order picked. */
    picked: readonly string[];
    place(centre: Point): void;
    pick(id: string | null, extend: boolean): void;
    removePicked(): void;
  };
  const building = (): Building | null => {
    // Blocks are the Place tool's with Block the item, and Select's (W82): Place with an element is the placing's.
    if (viewing !== "spaces" || (settings.build.tool !== "select" && settings.build.item !== "block")) return null;
    const { world, build } = settings;
    const sector = sectorOf(world, build.sector);
    const shape = shapeOf(build);
    return {
      room: roomOf(sector),
      shape,
      body: bodyOf(shape),
      tool: build.tool,
      picked: build.picked,
      place: (centre) => start.onWorld?.(withBlockAt(world, sector.id, centre, shape)),
      pick: (id, extend) => {
        const was = build.picked;
        const next = !id ? (extend ? was : []) : !extend ? [id] : was.includes(id) ? was.filter((picked) => picked !== id) : [...was, id];
        start.onPickBlocks?.(next);
        // Blocks picked, or none, lets a picked element go: one pick at a time, blocks or an element; but a pipe picked
        // stays beside blocks Shift- or Command-clicked to it, so it can be subtracted from them (W95).
        if (settings.place.picked && !(extend && isPipeId(settings.place.picked))) start.onPick?.(null);
      },
      removePicked: () => {
        if (!build.picked.length) return;
        start.onWorld?.(withoutAssets(world, build.picked));
        start.onPickBlocks?.([]);
      },
    };
  };
  /**
   * A page that is looked round and travelled over, by the keys, a right-drag and the map: the World page, the Sectors
   * page, the Environment's, the clouds' and the mountain's; not while the visitor is on foot there (W100).
   */
  const roaming = () => !onFoot() && (viewing === "world" || viewing === "spaces" || viewing === "environment" || viewing === "clouds" || viewing === "mountain");
  let pointer: { x: number; y: number } | null = null;
  let press: { id: number; x: number; y: number; at: number } | null = null;
  const tools = () => {
    sectorBounds();
    groveOutline();
    aim();
    pickedBlocks();
    ghostAt();
    pickedRing();
    skeletonOverlay();
    gizmoPart();
  };
  const rayAt = (x: number, y: number) => {
    const box = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((x - box.left) / box.width) * 2 - 1, -((y - box.top) / box.height) * 2 + 1), camera);
    return { origin: ray.ray.origin.toArray(), direction: ray.ray.direction.toArray() };
  };
  /** A point along a ray, `t` metres from its origin. */
  const along = (origin: readonly number[], direction: readonly number[], t: number): Point => [origin[0] + direction[0] * t, origin[1] + direction[1] * t, origin[2] + direction[2] * t];
  /**
   * What the pointer meets first inside a sector's room and the world's round (W87, W93): a block's face, an element's
   * surface (a mountain, a tree, a human, a pipe or a road) or the sector's floor, seen from above; where, how far along
   * the pointer's line, and the face's way out in the world (none for the floor).
   */
  const meetAt = (x: number, y: number, room: Room): { point: Point; normal: Point | null; t: number } | null => {
    const { origin, direction } = rayAt(x, y);
    const hits: { point: Point; normal: Point | null; t: number }[] = [];
    const block = solidUnder(origin, direction, built().solids);
    if (block) hits.push({ point: along(origin, direction, block.t), normal: block.normal, t: block.t });
    const surface = surfaceAt(origin, direction);
    if (surface) hits.push({ point: surface.point.toArray(), normal: surface.normal.toArray(), t: surface.t });
    if (direction[1] < -1e-6) {
      const t = (room.min[1] - origin[1]) / direction[1];
      if (t > 0) hits.push({ point: along(origin, direction, t), normal: null, t });
    }
    hits.sort((a, b) => a.t - b.t);
    return hits.find(({ point }) => Math.hypot(point[0], point[2]) <= bounds().diameter / 2 - 1 && inRoom(room, point[0], point[1], point[2])) ?? null;
  };
  /**
   * What a click at a point of the view would build or pick, by the tool: a block placed, flush with what the pointer
   * meets (`landing`: on the floor it stands on it), or the first block the pointer meets (one behind it is not reached),
   * to pick.
   */
  const buildsAt = (x: number, y: number, made: Building): { solid: Pick<Solid, "centre" | "half" | "axes">; picks?: Solid } | null => {
    if (made.tool === "select") {
      const { origin, direction } = rayAt(x, y);
      const solid = solidUnder(origin, direction, built().solids)?.solid;
      return solid ? { solid, picks: solid } : null;
    }
    const met = meetAt(x, y, made.room);
    if (!met) return null;
    return { solid: { centre: landing(met.point, met.normal ?? [0, 1, 0], made.body, stepOf(made.shape.unit)), ...made.body } };
  };
  /**
   * Shows where the pointer would build, if it is over the world on a page that builds and no hand is down and nothing is
   * being moved or turned; a block picked wears its own outline instead. The canvas says where the next block's middle
   * would be (`data-ghost`, metres) for the review.
   */
  const aim = () => {
    const made = building();
    const found = made && pointer && !press && !moving && !turning ? buildsAt(pointer.x, pointer.y, made) : null;
    const at = found?.picks && made?.picked.includes(found.picks.id) ? null : found;
    part("ghost", made && at ? `${viewing} ${JSON.stringify([at.solid.centre, at.solid.half, at.solid.axes])} ${made.tool}` : null, () => buildGhost(at!.solid, made?.tool ?? "place"));
    if (made) ghostSays(at && made.tool === "place" ? at.solid.centre : null);
  };
  /**
   * The sectors' rooms (W81, mine): each drawn by its edges where it stands, on the Sectors page alone, the one picked
   * violet, so where a sector stands and how big it is are seen as its place and size are set. The World page draws no
   * edges (W103, his); the visitor sees no lines.
   */
  const sectorBounds = () => {
    const shown = viewing === "spaces";
    const picked = viewing === "spaces" ? sectorOf(settings.world, settings.build.sector).id : "";
    const rooms = shown ? sectorsOf(settings.world).map((sector) => ({ ...roomOf(sector), picked: sector.id === picked })) : [];
    part("sectors", shown ? JSON.stringify(rooms) : null, () => buildSectorBounds(rooms));
  };
  /**
   * The grove picked, on the Sectors page (W91, W96, W99, mine): its area's outline and its hollow's, violet, draped
   * where its trees stand, from its height, moved with it while a hand or the gizmo moves it.
   */
  const groveOutline = () => {
    const grove = viewing === "spaces" && settings.place.picked ? settings.world.assets.find((asset) => asset.id === settings.place.picked) : undefined;
    const drawn = grove && isGrove(grove) ? (() => {
      const sector = sectorOf(settings.world, grove.sector);
      const [sx, sy, sz] = metresOf(sector.at);
      return [{ lines: drapedLines(areaLines([sx + grove.at[0], sz + grove.at[1]], grove.area), groundColumn(), roomOf(sector), sy + grove.y), y: 0.15, picked: true }];
    })() : [];
    part("grove outline", drawn.length ? JSON.stringify(drawn) : null, () => buildOutlines(drawn));
  };
  /** The outlines round the blocks picked with Select, while they stand in the world; while R turns them, where the turn has them. */
  const pickedBlocks = () => {
    const made = building();
    const solids = turning?.shown ?? (made?.picked.length ? built().solids.filter((solid) => made.picked.includes(solid.id)) : []);
    part("picked blocks", solids.length ? JSON.stringify(solids.map((solid) => [solid.id, solid.centre, solid.half, solid.axes])) : null, () => {
      const group = new THREE.Group();
      for (const solid of solids) group.add(buildGhost(solid, "picked"));
      return group;
    });
  };
  const pressToBuild = (event: PointerEvent) => {
    if (!building() || event.button !== 0) return;
    canvas.focus({ preventScroll: true });
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, at: event.timeStamp };
    aim();
    draw();
  };
  const hoverToBuild = (event: PointerEvent) => {
    if (!building()) return;
    pointer = { x: event.clientX, y: event.clientY };
    if (press) return;
    aim();
    draw();
  };
  const leaveBuild = () => {
    pointer = null;
    if (!building()) return;
    aim();
    draw();
  };
  // Placing, on the Sectors page (`place.ts`, World.md W73, option D, W82, W91; his: "we will not place anything in the
  // world explicitly", then "inside sectors, I will place the elements"): with Place and an element the item, a click
  // on the ground places it, of the variant picked on the card, into the sector picked, inside it alone, a ring on the
  // ground showing where and how wide (a grove's area its outline, W91); with Select,
  // a press on a placed element picks it (unless a block stands nearer), and a drag moves it within its own sector (the
  // page's store keeps the world, `onWorld`); Backspace removes it, Escape lets it go.
  type Placing = {
    /** The placing's state: the variants, the next grove, the one picked. */
    place: PlaceState;
    /** What Place puts in: the element, with Place and an element the item; else none. */
    element: PlacedKind | null;
    /** A pipe or a road, with Place and one of them the item (W84, W93): drawn a joint a click; else none. */
    skeleton: SkeletonKind | null;
    /** The sector picked, and its room, where an element is placed. */
    sector: string;
    room: Room;
    /** Whether a press on a placed element picks it: with Select. */
    picks: boolean;
  };
  const placing = (): Placing | null => {
    if (viewing !== "spaces") return null;
    const { world, build, place } = settings;
    const element = build.tool === "place" && PLACED_KINDS.includes(build.item as PlacedKind) ? (build.item as PlacedKind) : null;
    const skeleton = build.tool === "place" && SKELETON_KINDS.includes(build.item as SkeletonKind) ? (build.item as SkeletonKind) : null;
    const picks = build.tool === "select";
    if (!element && !skeleton && !picks) return null;
    const sector = sectorOf(world, build.sector);
    return { place, element, skeleton, sector: sector.id, room: roomOf(sector), picks };
  };
  /** The variant the next click places of a mountain or a human: the one picked on the card, or the element's first where none is picked yet. */
  const pickedVariant = (place: PlaceState, element: "mountain" | "human"): { id: string; config: MountainConfig | HumanConfig } | null => {
    const table: Record<string, MountainConfig | HumanConfig> = element === "mountain" ? settings.mountains : settings.humanVariants;
    const picked = place[element];
    const id = picked in table ? picked : Object.keys(table)[0];
    return id ? { id, config: table[id] } : null;
  };
  /** How wide the ring under the pointer is: a mountain's extent, a human's stance (a grove's area is drawn by its outline instead, W91). */
  const footprintOf = (place: PlaceState, element: "mountain" | "human") => {
    const config = pickedVariant(place, element)?.config;
    if (!config) return 0;
    return element === "mountain" ? mountainExtent(config as MountainConfig).radius : HUMAN_RING;
  };
  /** Whether a point in metres stands in a sector's room: over its floor's footprint, and between its floor and its top. */
  const inRoom = (room: Room, x: number, y: number, z: number) =>
    x >= room.min[0] && x <= room.max[0] && z >= room.min[2] && z <= room.max[2] && y >= room.min[1] - 1e-6 && y <= room.max[1];
  /**
   * Where a point of the view meets the floor, in metres, inside the world's round and inside a sector's room: a block's
   * top where the pointer meets one, else the sector's floor, for every element (W88; W82 kept mountains and trees to
   * the world's floor).
   */
  const floorAt = (x: number, y: number, room: Room): { x: number; y: number; z: number; level: number } | null => {
    const { origin, direction } = rayAt(x, y);
    // A block's top where the pointer meets one (W88), turned or not (W93), else the sector's floor.
    const hit = solidUnder(origin, direction, built().solids);
    if (hit && hit.normal[1] > 0.5) {
      const point = along(origin, direction, hit.t);
      if (Math.hypot(point[0], point[2]) <= bounds().diameter / 2 - 1 && inRoom(room, point[0], point[1], point[2])) return { x: point[0], y: point[1], z: point[2], level: Math.round(point[1] / BASE_BLOCK.height) };
    }
    if (direction[1] >= -1e-6) return null;
    const floor = room.min[1];
    const t = (floor - origin[1]) / direction[1];
    if (t <= 0) return null;
    const px = origin[0] + direction[0] * t, pz = origin[2] + direction[2] * t;
    if (Math.hypot(px, pz) > bounds().diameter / 2 - 1 || !inRoom(room, px, floor, pz)) return null;
    return { x: px, y: floor, z: pz, level: Math.round(floor / BASE_BLOCK.height) };
  };
  /**
   * Where the middle of the next grove would be under a point of the view (W91, W96, W99): where the pointer meets
   * anything in the sector's room, a block's face, a mountain, a pipe, a road or the floor, to the metre; and the height
   * it meets it at, which the grove is planted at.
   */
  const groveMiddleAt = (x: number, y: number, room: Room): { at: readonly [number, number]; y: number } | null => {
    const met = meetAt(x, y, room);
    return met ? { at: [Math.round(met.point[0]), Math.round(met.point[2])], y: met.point[1] } : null;
  };
  /** The room of the sector a placed element is in: where a drag may move it. */
  const roomOfAsset = (id: string): Room | null => {
    const asset = settings.world.assets.find((candidate) => candidate.id === id);
    return asset ? roomOf(sectorOf(settings.world, asset.sector)) : null;
  };
  /**
   * The placed element under a point of the view, if any: the first of the mountains', trees' or portals' meshes the
   * ray meets, by the asset its group carries, and how far along the ray.
   */
  const assetAt = (x: number, y: number): { id: string; object: THREE.Object3D; distance: number } | null => {
    const { origin, direction } = rayAt(x, y);
    ray.ray.origin.set(...origin);
    ray.ray.direction.set(...direction);
    const groups = [...placedParts(), ...[...parts.keys()].filter((name) => name.startsWith("skeleton "))].flatMap((name) => { const held = parts.get(name); return held ? [held.object] : []; });
    for (const hit of ray.intersectObjects(groups, true)) {
      let object: THREE.Object3D | null = hit.object;
      while (object && typeof object.userData.asset !== "string") object = object.parent;
      if (object && object.userData.asset !== "studio" && object.userData.asset !== "page") return { id: object.userData.asset as string, object, distance: hit.distance };
    }
    return null;
  };
  /** The placed element a press with Select picks: the one under the pointer, unless a block stands nearer. */
  const elementToPick = (x: number, y: number) => {
    const hit = assetAt(x, y);
    if (!hit) return null;
    const { origin, direction } = rayAt(x, y);
    const block = solidUnder(origin, direction, built().solids);
    return block && block.t < hit.distance ? null : hit;
  };
  let placePress: { id: number; x: number; y: number; at: number } | null = null;
  /**
   * An element being dragged; a pipe or a road by where it was taken hold of (`grab`, metres), all its joints moving
   * together (W84); a grove by the point of the floor taken hold of (`ground`), every tree of it moving together, a
   * whole metre a step (`by`, W91).
   */
  let dragging: { id: string; object: THREE.Object3D; from: THREE.Vector3; moved: boolean; grab?: THREE.Vector3; ground?: { x: number; z: number }; trees?: { object: THREE.Object3D; from: THREE.Vector3 }[]; by?: THREE.Vector3 } | null = null;
  /** A grove's trees as drawn, each with where it stands now: what a move of the grove carries (W91). */
  const groveTreeObjects = (id: string) => (parts.get("trees")?.object.children ?? []).filter((object) => object.userData.asset === id).map((object) => ({ object, from: object.position.clone() }));
  /** Shows a grove moved by a whole number of metres, its trees and its outline, before the world keeps it. */
  const previewGrove = (trees: readonly { object: THREE.Object3D; from: THREE.Vector3 }[], by: THREE.Vector3) => {
    for (const { object, from } of trees) object.position.copy(from).add(by);
    parts.get("grove outline")?.object.position.copy(by);
  };
  /** The ring under the pointer: where the next click would place, and how wide, inside the sector picked; none while a hand is down. */
  const ghostAt = () => {
    const made = placing();
    const element = made?.element ?? null;
    if (made?.skeleton) {
      // A pipe or a road (W84, W87, W93): a ring where the next click would put its next joint, as wide as it is, flat
      // on the floor, or standing on the face it would attach to, across its way; the one being drawn reaches to it.
      const look = lookFor(made.skeleton);
      const landed = pointer && !placePress && !shaping ? landAt(pointer.x, pointer.y, made.room, made.skeleton, liftOf(made.skeleton, look), !!drawing) : null;
      const radius = made.skeleton === "pipe" ? (look as PipeLook).radius : (look as RoadLook).width / 2;
      part("ghost ring", landed && radius > 0 ? JSON.stringify([landed.at, landed.way, radius]) : null, () => {
        const { at, way } = landed!;
        const ring = buildRing(at[0], at[2], radius, GHOST_RING, at[1] + 0.2);
        if (way) {
          const out = new THREE.Vector3(...directionOf(way));
          ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), out);
          ring.position.set(...at).addScaledVector(out, drawing ? -0.1 : 0.1);
        }
        return ring;
      });
      ghostSays(landed ? landed.at : null);
      if (drawing) {
        skeletonParts();
        skeletonOverlay();
      }
      return;
    }
    const ready = !!made && !!element && (element === "tree" || !!pickedVariant(made.place, element));
    const at = made && ready && pointer && !placePress && !dragging ? floorAt(pointer.x, pointer.y, made.room) : null;
    if (made && element === "tree") {
      // A grove (W91, W96, W99; his: "once I set the dimensions I should see that placeholder with that dimension so
      // that I will know where I am placing"): its area's outline and its hollow's, lilac, centred where the pointer
      // meets anything, to the metre, at that height, draped where its trees would stand, as the next click would plant it.
      const area = made.place.area;
      const middle = pointer && !placePress && !dragging ? groveMiddleAt(pointer.x, pointer.y, made.room) : null;
      part("ghost ring", middle ? JSON.stringify([middle, area, made.room]) : null, () => buildOutlines([{ lines: drapedLines(areaLines(middle!.at, area), groundColumn(), made.room, middle!.y), y: 0.2, picked: false }]));
      ghostSays(middle ? [middle.at[0], footAt(groundColumn(), made.room, middle.at[0], middle.at[1], middle.y) ?? middle.y, middle.at[1]] : null);
      return;
    }
    const radius = made && element && element !== "tree" ? footprintOf(made.place, element) : 0;
    part("ghost ring", at && radius > 0 ? `${at.x.toFixed(1)} ${at.y.toFixed(2)} ${at.z.toFixed(1)} ${radius.toFixed(1)}` : null, () => buildRing(at!.x, at!.z, radius, GHOST_RING, at!.y + 0.2));
    if (made) ghostSays(at && radius > 0 ? [at.x, at.y, at.z] : null);
  };
  /** Where the next click would place, on the canvas (`data-ghost`, metres, x y z), for the review scripts; none, none. */
  const ghostSays = (at: readonly [number, number, number] | null) => {
    const said = at ? at.map((value) => Math.round(value * 10) / 10).join(" ") : null;
    if (said === (canvas.dataset.ghost ?? null)) return;
    if (said) canvas.dataset.ghost = said;
    else delete canvas.dataset.ghost;
  };
  /** The ring round the picked element's foot, on the Sectors page, whatever the tool. */
  const pickedRing = () => {
    const id = viewing === "spaces" ? settings.place.picked : null;
    const picked = id ? placedOf(settings.world).find(({ asset }) => asset.id === id) : undefined;
    const radius = !picked ? 0 : picked.asset.kind === "mountain" ? (mountainExtent(settings.mountains[picked.asset.variant] ?? settings.mountain).radius) : picked.asset.kind === "tree" ? 6 : HUMAN_RING;
    part("picked ring", picked ? `${picked.asset.id} ${picked.x} ${picked.y} ${picked.z} ${radius.toFixed(1)}` : null, () => buildRing(picked!.x, picked!.z, radius, PICKED_RING, picked!.y + 0.25));
  };
  const pressToPlace = (event: PointerEvent) => {
    const made = placing();
    if (!made || event.button !== 0) return;
    canvas.focus({ preventScroll: true });
    // With Select, a press on a block is the building's (its pick); only a press on an element is the placing's.
    const hit = made.picks ? elementToPick(event.clientX, event.clientY) : null;
    if (made.picks && !hit) return;
    placePress = { id: event.pointerId, x: event.clientX, y: event.clientY, at: event.timeStamp };
    if (hit) {
      // A press on a placed element is the element's, never the camera's: the controls never see it.
      event.stopImmediatePropagation();
      canvas.setPointerCapture(event.pointerId);
      const { origin, direction } = rayAt(event.clientX, event.clientY);
      const grab = isSkeletonId(hit.id) ? new THREE.Vector3(...origin).addScaledVector(new THREE.Vector3(...direction), hit.distance) : undefined;
      dragging = { id: hit.id, object: hit.object, from: hit.object.position.clone(), moved: false, grab };
      // A grove is taken hold of by the floor under the pointer: a drag carries every tree of it (W91).
      const room = isGroveId(hit.id) ? roomOfAsset(hit.id) : null;
      const ground = room ? floorAt(event.clientX, event.clientY, room) : null;
      if (ground) dragging = { ...dragging, ground: { x: ground.x, z: ground.z }, trees: groveTreeObjects(hit.id) };
    }
    ghostAt();
    draw();
  };
  const moveToPlace = (event: PointerEvent) => {
    const made = placing();
    if (!made) return;
    pointer = { x: event.clientX, y: event.clientY };
    if (dragging && placePress && event.pointerId === placePress.id) {
      const room = roomOfAsset(dragging.id);
      if (room && dragging.grab && Math.hypot(event.clientX - placePress.x, event.clientY - placePress.y) >= CLICK_REACH) {
        // A pipe or a road moves whole, every joint by the same whole metres, within its own sector (W84).
        const by = skeletonMovedBy(dragging.id, dragging.grab, event.clientX, event.clientY, room);
        if (by) {
          dragging.object.position.set(by[0], 0, by[1]);
          overlay?.object.position.set(by[0], 0, by[1]);
          dragging.moved = true;
        }
      } else if (room && dragging.ground && dragging.trees && Math.hypot(event.clientX - placePress.x, event.clientY - placePress.y) >= CLICK_REACH) {
        // A grove moves whole, a whole metre a step, over its sector's floor (W91); past its edge, as far as it went.
        const at = floorAt(event.clientX, event.clientY, room);
        if (at) {
          dragging.by = new THREE.Vector3(Math.round(at.x - dragging.ground.x), 0, Math.round(at.z - dragging.ground.z));
          previewGrove(dragging.trees, dragging.by);
          dragging.moved = true;
        }
      } else if (room && !isGroveId(dragging.id) && Math.hypot(event.clientX - placePress.x, event.clientY - placePress.y) >= CLICK_REACH) {
        // It moves within its own sector, at its height: past its edge it stays where it last stood inside.
        const at = floorAt(event.clientX, event.clientY, room);
        if (at) {
          dragging.object.position.set(at.x, dragging.object.position.y, at.z);
          dragging.moved = true;
        }
      }
      draw();
      return;
    }
    if (placePress) return;
    ghostAt();
    draw();
  };
  const releaseToPlace = (event: PointerEvent) => {
    if (!placePress || event.pointerId !== placePress.id) return;
    const { x, y, at } = placePress;
    placePress = null;
    const still = Math.hypot(event.clientX - x, event.clientY - y) < CLICK_REACH && event.timeStamp - at < CLICK_TIME;
    const made = placing();
    if (dragging) {
      const drag = dragging;
      dragging = null;
      try { canvas.releasePointerCapture(event.pointerId); } catch { /* let go already */ }
      if (drag.trees && drag.by && drag.moved && event.type === "pointerup") {
        // A grove moved (W91): its middle by the metres the hand carried it; its trees are drawn again where it stands.
        const grove = settings.world.assets.find((asset) => asset.id === drag.id);
        if (grove && isGrove(grove)) start.onWorld?.(withGrove(settings.world, grove.id, { at: [grove.at[0] + drag.by.x, grove.at[1] + drag.by.z] }));
        start.onPick?.(drag.id, null);
        start.onPickBlocks?.([]);
      } else if (drag.moved && drag.grab && event.type === "pointerup") {
        const by = drag.object.position;
        const held = skeletonsOf(settings.world).find(({ asset }) => asset.id === drag.id);
        overlay?.object.position.set(0, 0, 0);
        if (held) start.onWorld?.(withSkeleton(settings.world, drag.id, { joints: held.joints.map(([jx, jy, jz]) => [jx + by.x, jy, jz + by.z]) }));
        start.onPick?.(drag.id, null);
        start.onPickBlocks?.([]);
      } else if (drag.moved && event.type === "pointerup") {
        const position = drag.object.position;
        // It keeps the height it stands at (W88: a tree or a mountain may stand over the floor).
        start.onWorld?.(withPlaced(settings.world, drag.id, { worldAt: [position.x, position.z], level: Math.round(position.y / 0.25) }));
        start.onPick?.(drag.id);
        start.onPickBlocks?.([]);
      } else {
        drag.object.position.copy(drag.from);
        if (drag.trees) previewGrove(drag.trees, new THREE.Vector3());
        overlay?.object.position.set(0, 0, 0);
        if (still) {
          start.onPick?.(drag.id, null);
          // A pipe Shift- or Command-clicked keeps the blocks picked beside it, to be subtracted from them (W95).
          if (!((event.shiftKey || event.metaKey || event.ctrlKey) && isPipeId(drag.id))) start.onPickBlocks?.([]);
        }
      }
    } else if (made?.element && still && event.type === "pointerup") {
      const element = made.element;
      const middle = element === "tree" ? groveMiddleAt(event.clientX, event.clientY, made.room) : null;
      const landed = element === "tree" ? null : floorAt(event.clientX, event.clientY, made.room);
      const picked = element === "tree" ? null : pickedVariant(made.place, element);
      if (middle || (landed && picked)) {
        let placedNow: { world: WorldData; id: string } | null = null;
        if (middle) {
          // A grove (W89, T1, W91, W93, W96, W97, W99): a click plants it, its area's middle where the outline under the
          // pointer showed, at the height the pointer met there, in the look set, at the Spacing, its trees between the
          // Length's shortest and tallest, each on the ground of the open space at that height; then it is picked, so its
          // card tunes it. One that would hold no tree is not planted.
          const planted = withGroveAt(settings.world, made.sector, middle.at, middle.y, nextGrove(made.place));
          const grove = groveOf(planted.world, planted.id);
          placedNow = grove && groveTrees(planted.world, grove, groundColumn()).length ? planted : null;
        } else if (landed && picked) {
          // A mountain faces the world's middle; a human its sector's (W89, mine).
          const [mx, , mz] = metresOf(sectorOf(settings.world, made.sector).at);
          const turn = element === "mountain" ? mountainTurn({ x: landed.x, z: landed.z }) : facing(landed.x, landed.z, mx, mz);
          placedNow = withPlacedAt(settings.world, made.sector, [landed.x, landed.z], element, picked.id, turn, 0, landed.level);
        }
        if (placedNow) {
          start.onWorld?.(placedNow.world);
          start.onPlaced?.(element);
          if (element === "tree") {
            start.onPick?.(placedNow.id, null);
            start.onPickBlocks?.([]);
          }
        }
      }
    } else if (made?.skeleton && still && event.type === "pointerup") {
      // A pipe or a road (W93): a joint a click, the first its start; a click on the last joint ends it.
      drawAt(made, event.clientX, event.clientY);
    }
    ghostAt();
    draw();
  };
  const leavePlace = () => {
    if (!placing()) return;
    pointer = null;
    ghostAt();
    draw();
  };

  // Pipes and roads (World.md W84; his: "for pipes and roads, we can have something like skeleton, where I can select
  // the joints to define the shape by moving the joints"): drawn with Place a joint a click (W93; his: "placing start and
  // then the sub sequent joints. The pipe will take share as we place the points"), the first its start, kept and
  // picked once it has two, each click after adding the next, the pipe or road reaching from its last joint to where the
  // pointer would put the next; a click on its last joint (so a double click), Enter or Escape ends it, Backspace takes
  // its last joint back (`drawAt`, `endDrawing`, `takeBack`). The one picked shows its skeleton (`skeletonOverlay`), and a press on one
  // of its joints, whatever the tool, takes hold of it: a drag moves it over the ground at its height, an Option-drag
  // (Alt) up and down, both within its sector (`pressToShape`); the world keeps the joints as the hand lets go. A
  // press with Select on the pipe or the road itself picks it, and a drag moves it whole.
  //
  // W87 (his: "there is no way for me to set the direction of the joint of a pipe or road"): a start or an end clicked
  // on a block's face, or on another element, attaches there (`landAt`), its way out of the face (or into it, at the
  // end), so a pipe off a block's top rises out of it; a road takes a block's side, never its top, which it lies on.
  // The picked joint shows an arrow along its way; a press on its head aims it (`aiming`): a drag turns it in the
  // picture's plane, an Option-drag level; a road's only ever level.

  /** Whether a placed asset is a grove (W89): picked by a click on any of its trees, never dragged. */
  const isGroveId = (id: string) => settings.world.assets.some((asset) => asset.id === id && asset.kind === "grove");
  /** Whether a placed asset is a pipe or a road. */
  const isSkeletonId = (id: string) => settings.world.assets.some((asset) => asset.id === id && SKELETON_KINDS.includes(asset.kind as SkeletonKind));
  const isPipeId = (id: string) => settings.world.assets.some((asset) => asset.id === id && asset.kind === "pipe");
  /** The look the next pipe or road is drawn in: the item's card's (W93), or the one being drawn's. */
  const lookFor = (kind: SkeletonKind): PipeLook | RoadLook => (drawing?.kind === kind ? drawing.look : kind === "pipe" ? settings.place.pipeLook : settings.place.roadLook);
  /** How far over its joints a skeleton's balls stand: a pipe's middle, its radius up; a road's top, its thickness up. */
  const liftOf = (kind: SkeletonKind, look: PipeLook | RoadLook) => (kind === "pipe" ? (look as PipeLook).radius : (look as RoadLook).thickness);
  /**
   * Where the pointer would put the next joint of the one being drawn, and that joint's way (into the face it is on);
   * none off the sector or with no pointer.
   */
  const nextJoint = () => {
    const made = placing();
    return drawing && pointer && made?.skeleton === drawing.kind ? landAt(pointer.x, pointer.y, made.room, drawing.kind, liftOf(drawing.kind, drawing.look), true) : null;
  };
  /** The one being drawn as it would be with the next joint where the pointer is: every joint between free, the start's way kept. */
  const drawnTo = (): { joints: Point[]; ways: (Way | null)[] } | null => {
    if (!drawing) return null;
    const next = nextJoint();
    const ways = drawing.ways.map((way, i) => (i === 0 ? way : null));
    return next && next.joint.some((value, i) => value !== drawing!.joints[drawing!.joints.length - 1][i])
      ? { joints: [...drawing.joints, next.joint], ways: [...ways, next.way] }
      : { joints: drawing.joints, ways: drawing.ways };
  };
  /** The pipes and roads drawn: the placed ones, each in its own look, a joint being moved where the hand has it, the one being drawn reaching to the pointer; on an element's page, none. */
  const skeletonsShown = (): PlacedSkeleton[] => {
    if (aloneOn(viewing)) return [];
    const shown = skeletonsOf(settings.world).flatMap(({ asset, joints, ways }): PlacedSkeleton[] => {
      if (drawing && asset.id === drawing.id) return [];
      const held = reshaping?.id === asset.id ? reshaping : { joints, ways };
      return asset.kind === "pipe"
        ? [{ id: asset.id, kind: "pipe", joints: held.joints, ways: held.ways, config: asset.look }]
        : [{ id: asset.id, kind: "road", joints: held.joints, ways: held.ways, config: asset.look }];
    });
    const drawn = drawnTo();
    if (drawing && drawn && drawn.joints.length >= 2) {
      const id = drawing.id ?? "drawing";
      shown.push(drawing.kind === "pipe"
        ? { id, kind: "pipe", joints: drawn.joints, ways: drawn.ways, config: drawing.look as PipeLook }
        : { id, kind: "road", joints: drawn.joints, ways: drawn.ways, config: drawing.look as RoadLook });
    }
    return shown;
  };
  /** The pipes and roads, a part each, so a joint moved remakes its own alone. */
  const skeletonParts = () => {
    const shown = skeletonsShown();
    const names = new Set(shown.map((one) => `skeleton ${one.id}`));
    for (const name of [...parts.keys()]) if (name.startsWith("skeleton ") && !names.has(name)) part(name, null, () => new THREE.Group());
    for (const one of shown) part(`skeleton ${one.id}`, JSON.stringify(one), () => buildSkeletons([one]));
    pipeBodies = shown.flatMap((one) => {
      if (one.kind !== "pipe") return [];
      const shape = pipeCutOf(one);
      return shape ? [{ points: shape.points, radius: one.config.radius, startOpen: !one.config.startFace, endOpen: !one.config.endFace }] : [];
    });
    cutParts();
  };
  /** Each block a pipe is cut out of (W95) told where its pipes run as they are drawn: a joint held moves its hole with it. */
  const cutParts = () => {
    const cut = built().solids.filter((solid) => solid.cuts?.length);
    if (!cut.length) return;
    const pipes = new Map(skeletonsShown().flatMap((one) => (one.kind === "pipe" ? [[one.id, one] as const] : [])));
    for (const solid of cut) {
      const cutBy = parts.get(`cut ${solid.id}`)?.object.userData.cutBy as BuiltCutBlock["cutBy"] | undefined;
      if (!cutBy) continue;
      const by = (solid.cuts ?? []).flatMap((id) => {
        const pipe = pipes.get(id);
        const shape = pipe ? pipeCutOf(pipe) : null;
        return shape ? [shape] : [];
      });
      const segments = cutSegmentsOf(solid, by);
      cutSegments.set(solid.id, segments);
      cutBy(segments);
    }
  };
  /**
   * A click while a pipe or a road is being drawn (W93): its first joint starts it, letting go what was picked; a click on
   * its last joint ends it; any other adds the next joint where the pointer met, the start keeping its way out of the face
   * it was clicked on, the new last its way into the one it is on (its end's, if it ends there), every joint between
   * free. It is kept, and picked, once it has two; each joint after is kept as it is added.
   */
  const drawAt = (made: Placing, x: number, y: number) => {
    const kind = made.skeleton;
    if (!kind) return;
    if (drawing && (drawing.kind !== kind || drawing.sector !== made.sector)) drawing = null;
    if (drawing && drawing.joints.length >= 2) {
      const last = drawing.joints.length - 1;
      const centre = jointCentre(drawing.joints[last], drawing.ways[last], liftOf(kind, drawing.look), kind);
      if (awayOnScreen(new THREE.Vector3(...centre), x, y) <= JOINT_REACH) return void endDrawing();
    }
    const look = lookFor(kind);
    const landed = landAt(x, y, made.room, kind, liftOf(kind, look), !!drawing);
    if (!landed) return;
    if (!drawing) {
      drawing = { kind, sector: made.sector, look: { ...look }, joints: [landed.joint], ways: [landed.way], id: null };
      if (settings.place.picked) start.onPick?.(null);
      start.onPickBlocks?.([]);
      return;
    }
    const last = drawing.joints[drawing.joints.length - 1];
    if (landed.joint.every((value, i) => value === last[i])) return;
    const joints = [...drawing.joints, landed.joint];
    const ways = [...drawing.ways.map((way, i) => (i === 0 ? way : null)), landed.way];
    if (!drawing.id) {
      const kept = withSkeletonAt(settings.world, made.sector, joints, ways, kind === "pipe" ? { kind, look: drawing.look as PipeLook } : { kind, look: drawing.look as RoadLook });
      drawing = { ...drawing, joints, ways, id: kept.id };
      start.onWorld?.(kept.world);
      start.onPick?.(kept.id, null);
    } else {
      const { id } = drawing;
      drawing = { ...drawing, joints, ways };
      start.onWorld?.(withSkeleton(settings.world, id, { joints, ways }));
    }
    if (joints.length >= JOINTS_MOST) endDrawing();
  };
  /** The drawing ends (W93): the pipe or road stays as drawn, picked, its joints to take hold of; a lone start is let go. */
  const endDrawing = () => {
    if (!drawing) return false;
    const { id } = drawing;
    drawing = null;
    if (id) start.onPick?.(id, null);
    skeletonParts();
    // Trees over it stand on it now it is ended (W96).
    treeParts();
    tools();
    draw();
    return true;
  };
  /** Backspace while drawing (W93): the last joint is taken back; a pipe or road back to its start alone is no longer kept. */
  const takeBack = () => {
    if (!drawing) return false;
    const joints = drawing.joints.slice(0, -1);
    const ways = drawing.ways.slice(0, -1);
    if (!joints.length) drawing = null;
    else if (drawing.id && joints.length >= 2) {
      const { id } = drawing;
      drawing = { ...drawing, joints, ways };
      start.onWorld?.(withSkeleton(settings.world, id, { joints, ways }));
    } else {
      if (drawing.id) {
        start.onWorld?.(withoutAsset(settings.world, drawing.id));
        start.onPick?.(null);
      }
      drawing = { ...drawing, joints, ways, id: null };
    }
    skeletonParts();
    tools();
    draw();
    return true;
  };
  type Held = { asset: SkeletonAsset; joints: Point[]; ways: (Way | null)[]; lift: number; centres: Point[] };
  /** The pipe or road picked on the Sectors page, if any: the asset, its joints in metres and their ways (where the hand has them), how far over them its balls stand, and where they stand. */
  const pickedSkeleton = (): Held | null => {
    if (viewing !== "spaces" || !settings.place.picked) return null;
    const found = skeletonsOf(settings.world).find(({ asset }) => asset.id === settings.place.picked);
    if (!found) return null;
    const { joints, ways } = reshaping?.id === found.asset.id ? reshaping : found;
    const lift = liftOf(found.asset.kind, found.asset.look);
    return { asset: found.asset, joints, ways, lift, centres: joints.map((joint, i) => jointCentre(joint, ways[i], lift, found.asset.kind)) };
  };
  /** The picked joint of the picked skeleton, if one is picked and still there. */
  const pickedJoint = (held: Held | null) => (held && settings.place.joint !== null && settings.place.joint < held.joints.length ? settings.place.joint : null);
  /**
   * The skeleton over the picked pipe or road, its picked joint larger with its arrow; or, over the one being drawn, its
   * joints and the bone to where the pointer would put the next, the last joint larger: a click on it ends the drawing.
   */
  const skeletonOverlay = () => {
    const made = placing();
    // Another item, another tool or another sector ends a drawing: what was kept of it stays.
    if (drawing && (made?.skeleton !== drawing.kind || made.sector !== drawing.sector)) drawing = null;
    const held = pickedSkeleton();
    let points: Point[] | null = null;
    let picked: number | null = null;
    let arrow: { along: Point; set: boolean } | null = null;
    const drawn = drawnTo();
    if (drawing && drawn) {
      const { kind } = drawing;
      const lift = liftOf(kind, drawing.look);
      points = drawn.joints.map((joint, i) => jointCentre(joint, drawn.ways[i], lift, kind));
      picked = drawing.joints.length - 1;
    } else if (held) {
      points = held.centres;
      picked = pickedJoint(held);
      if (picked !== null) arrow = { along: directionOf(held.ways[picked] ?? wayAlong(held.centres, picked)), set: !!held.ways[picked] };
    }
    part("skeleton overlay", points ? JSON.stringify([points, picked, arrow]) : null, () => {
      overlay = buildSkeletonOverlay(points!, picked, arrow);
      return overlay.object;
    });
    if (!points) overlay = null;
  };
  /**
   * The surface of a placed element under a point of the view, the nearest: a mountain, a tree, a portal, another pipe
   * or road; where the ray meets it, how far along, and its face's way out, in the world.
   */
  const surfaceAt = (origin: readonly number[], direction: readonly number[]): { point: THREE.Vector3; normal: THREE.Vector3; t: number } | null => {
    ray.ray.origin.set(origin[0], origin[1], origin[2]);
    ray.ray.direction.set(direction[0], direction[1], direction[2]);
    const names = [...placedParts(), ...[...parts.keys()].filter((name) => name.startsWith("skeleton "))];
    const groups = names.flatMap((name) => { const held = parts.get(name); return held ? [held.object] : []; });
    for (const hit of ray.intersectObjects(groups, true)) {
      let object: THREE.Object3D | null = hit.object;
      while (object && typeof object.userData.asset !== "string") object = object.parent;
      // The one being drawn is never met: its next joint would attach to its own reach to the pointer.
      if (!object || object.userData.asset === "studio" || object.userData.asset === "drawing" || (drawing && object.userData.asset === drawing.id) || !hit.face) continue;
      const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      // A face seen from behind (a tube's inside, an open end) faces the camera instead.
      if (normal.dot(ray.ray.direction) > 0) normal.negate();
      return { point: hit.point.clone(), normal, t: hit.distance };
    }
    return null;
  };
  /**
   * Where a pipe's or a road's start or end lands under a point of the view (W84, W87), on the skeleton's grid: the
   * nearest of a block's face, another element's surface and the floor of the sector picked, inside the world's round
   * and the sector's room. On the floor it is free and lies on it. On a face it attaches: a pipe's way is out of the face
   * at its start and into it at its end, its middle on the point clicked; a road's the same on a block's side, level,
   * and on a top it lies, free. The joint is where its underside passes (`jointOf`).
   */
  const landAt = (x: number, y: number, room: Room, kind: SkeletonKind, lift: number, end: boolean): { joint: Point; way: Way | null; at: Point } | null => {
    const met = meetAt(x, y, room);
    if (!met) return null;
    const { point, normal } = met;
    const at = onLattice(point);
    const out = !normal ? null : kind === "road" ? (Math.abs(normal[1]) > 0.5 ? null : ([normal[0], 0, normal[2]] as const)) : normal;
    const way = out ? wayOf(end ? [-out[0], -out[1], -out[2]] : out) : null;
    // On a face the point clicked is the pipe's middle; on the floor or a road's top, its underside.
    return { joint: onLattice(way && kind === "pipe" ? jointOf(at, way, lift, kind) : at), way, at };
  };
  /** The joint of the picked skeleton under a point of the view, within a ball's reach on the screen, the nearest; or none. */
  const jointUnder = (x: number, y: number, held: Held): number | null => {
    let best: { index: number; away: number } | null = null;
    held.centres.forEach((centre, index) => {
      const away = awayOnScreen(new THREE.Vector3(...centre), x, y);
      if (away <= JOINT_REACH && (!best || away < best.away)) best = { index, away };
    });
    return (best as { index: number; away: number } | null)?.index ?? null;
  };
  /** Where a point of the world is on the screen, in the page's pixels; none behind the camera. */
  const onScreen = (point: THREE.Vector3): [number, number] | null => {
    const box = canvas.getBoundingClientRect();
    const seen = point.clone().project(camera);
    if (seen.z > 1 || seen.z < -1) return null;
    return [Math.round(box.left + ((seen.x + 1) / 2) * box.width), Math.round(box.top + ((1 - seen.y) / 2) * box.height)];
  };
  /** How far a point of the world is from a point of the view, on the screen, in pixels; endless behind the camera. */
  const awayOnScreen = (point: THREE.Vector3, x: number, y: number) => {
    const seen = onScreen(point);
    return seen ? Math.hypot(seen[0] - x, seen[1] - y) : Infinity;
  };
  /**
   * How far a pipe or a road taken hold of at `grab` would move, in whole metres east and south, for a point of the
   * view: the ground at the height it was taken hold of; none where a joint would leave its sector.
   */
  const skeletonMovedBy = (id: string, grab: THREE.Vector3, x: number, y: number, room: Room): [number, number] | null => {
    const held = skeletonsOf(settings.world).find(({ asset }) => asset.id === id);
    const { origin, direction } = rayAt(x, y);
    if (!held || Math.abs(direction[1]) < 1e-6) return null;
    const t = (grab.y - origin[1]) / direction[1];
    if (t <= 0) return null;
    const by: [number, number] = [Math.round(origin[0] + direction[0] * t - grab.x), Math.round(origin[2] + direction[2] * t - grab.z)];
    return held.joints.every(([jx, jy, jz]) => inRoom(room, jx + by[0], jy, jz + by[1])) ? by : null;
  };
  /**
   * A press on the arrow's head of the picked joint aims it; a press on a joint of the picked pipe or road takes hold
   * of it, whatever the tool: never the camera's, never a block's or an element's.
   */
  const pressToShape = (event: PointerEvent) => {
    // While one is being drawn, its joints are not taken hold of: a click on its last ends it.
    if (viewing !== "spaces" || event.button !== 0 || drawing) return;
    const held = pickedSkeleton();
    if (!held) return;
    const joint = pickedJoint(held);
    const tip = overlay?.tip();
    const aims = joint !== null && tip && awayOnScreen(tip, event.clientX, event.clientY) <= JOINT_REACH;
    const index = aims ? joint : jointUnder(event.clientX, event.clientY, held);
    if (index === null) return;
    event.stopImmediatePropagation();
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    const room = roomOf(sectorOf(settings.world, held.asset.sector));
    shaping = { id: held.asset.id, kind: held.asset.kind, index, aiming: !!aims, pointer: event.pointerId, x: event.clientX, y: event.clientY, joints: held.joints, ways: held.ways, lift: held.lift, room, moved: false };
    if (settings.place.joint !== index) start.onPick?.(held.asset.id, index);
    tools();
    draw();
  };
  /**
   * The joint held goes where the hand takes it, on the grid, within its sector: over the ground at its height, or,
   * with Option (Alt) held, up and down on the upright plane through it facing the camera. The arrow held turns the
   * joint's way to the pointer: in the picture's plane through the joint, or level with Option held; a road's level.
   */
  const moveToShape = (event: PointerEvent) => {
    if (!shaping || event.pointerId !== shaping.pointer) return;
    event.stopImmediatePropagation();
    pointer = { x: event.clientX, y: event.clientY };
    if (!shaping.moved && Math.hypot(event.clientX - shaping.x, event.clientY - shaping.y) < CLICK_REACH) return;
    const { origin, direction } = rayAt(event.clientX, event.clientY);
    const held = shaping;
    const [jx, jy, jz] = held.joints[held.index];
    const middle = new THREE.Vector3(...jointCentre(held.joints[held.index], held.ways[held.index], held.lift, held.kind));
    const line = new THREE.Ray(new THREE.Vector3(...origin), new THREE.Vector3(...direction));
    const facing = camera.getWorldDirection(new THREE.Vector3());
    const level = new THREE.Plane(new THREE.Vector3(0, 1, 0), -middle.y);
    if (held.aiming) {
      const plane = event.altKey || held.kind === "road" ? level : new THREE.Plane().setFromNormalAndCoplanarPoint(facing.clone().negate(), middle);
      const hit = line.intersectPlane(plane, new THREE.Vector3());
      if (!hit || hit.distanceToSquared(middle) < 1e-6) return;
      const [turn, tilt] = wayOf(hit.sub(middle).toArray());
      const way: Way = [turn, held.kind === "road" ? 0 : tilt];
      held.moved = true;
      reshaping = { id: held.id, joints: held.joints, ways: held.ways.map((one, i) => (i === held.index ? way : one)) };
    } else {
      const upright = facing.clone().setY(0);
      const plane = event.altKey && upright.lengthSq() > 1e-6 ? new THREE.Plane().setFromNormalAndCoplanarPoint(upright.normalize(), middle) : level;
      const hit = line.intersectPlane(plane, new THREE.Vector3());
      if (!hit) return;
      const { min, max } = held.room;
      const lifted = middle.y - jy;
      const next: Point = event.altKey
        ? onLattice([jx, Math.max(min[1], Math.min(max[1], hit.y - lifted)), jz])
        : onLattice([Math.max(min[0], Math.min(max[0], hit.x - (middle.x - jx))), jy, Math.max(min[2], Math.min(max[2], hit.z - (middle.z - jz)))]);
      held.moved = true;
      reshaping = { id: held.id, joints: held.joints.map((joint, i) => (i === held.index ? next : joint)), ways: held.ways };
    }
    skeletonParts();
    skeletonOverlay();
    draw();
  };
  /** The hand lets go: the world keeps the skeleton as it has it; a press that did not move picked the joint alone. */
  const releaseToShape = (event: PointerEvent) => {
    if (!shaping || event.pointerId !== shaping.pointer) return;
    event.stopImmediatePropagation();
    const held = shaping;
    shaping = null;
    try { canvas.releasePointerCapture(event.pointerId); } catch { /* let go already */ }
    const kept = reshaping;
    if (held.moved && kept && event.type === "pointerup") start.onWorld?.(withSkeleton(settings.world, held.id, { joints: kept.joints, ways: kept.ways }));
    reshaping = null;
    skeletonParts();
    tools();
    draw();
  };
  /**
   * Option-drag (Alt) raises and lowers a looked-round camera and what it looks at together (W83; his: "hold option +
   * drag up and down to move up and down"), wherever Shift-drag pans: a drag up rises, as far a pixel as a pan goes,
   * stopping at the world's floor and top as E and Q do. A joint or a gizmo's arrow pressed is theirs first.
   */
  let rising: { pointer: number; y: number } | null = null;
  const pressToRise = (event: PointerEvent) => {
    if (!event.altKey || event.button !== 0 || !look.enabled || !look.enablePan) return;
    event.stopImmediatePropagation();
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    rising = { pointer: event.pointerId, y: event.clientY };
    glide = null;
  };
  const moveToRise = (event: PointerEvent) => {
    if (!rising || event.pointerId !== rising.pointer) return;
    // OrbitControls' pan: the picture's height spans 2 tan(fov / 2) of the way to what it looks at.
    const span = 2 * camera.position.distanceTo(look.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const by = riseInside(camera.position.toArray(), look.target.toArray(), ((rising.y - event.clientY) * look.panSpeed * span) / Math.max(1, canvas.clientHeight), bounds());
    rising.y = event.clientY;
    if (!by) return;
    camera.position.y += by;
    look.target.y += by;
    look.update();
  };
  const releaseToRise = (event: PointerEvent) => {
    if (!rising || event.pointerId !== rising.pointer) return;
    event.stopImmediatePropagation();
    rising = null;
    try { canvas.releasePointerCapture(event.pointerId); } catch { /* let go already */ }
  };
  // Moving what is picked, as Blender does (World.md W88; his: "I should be able to move anything in any direction …
  // every element/joint in any element can have options like blender"): whatever is picked on the Sectors page, a
  // pipe's or a road's joint, a whole pipe or road, a mountain, a tree or a portal, or the blocks picked, wears the move
  // gizmo (`build-gizmo.ts`), three arrows from its middle, X, Y (up) and Z; a press on an arrow moves it along that
  // axis alone. G grabs it: it follows the pointer in the picture's plane through its middle, X, Y or Z keeps it to that
  // axis (the same key again lets it go free), and a click or Enter keeps the move, Escape or a right-click puts it back.
  // Each moves on its own grid (a joint a quarter metre every way; an element a metre across and a level up; a block
  // the lattice's steps) and within its sector, a block as it always moved; the world keeps it as the move is kept.
  type Movable = {
    /** What it is, so the gizmo is made again when the pick changes. */
    key: string;
    /** The ways it moves, an arrow each; every way unless it says (W91: a grove over its floor, X and Z). */
    axes?: readonly Axis[];
    /** Its middle, where the gizmo stands, in metres. */
    at: THREE.Vector3;
    /** A move held to this one's grid. */
    snap(by: THREE.Vector3): THREE.Vector3;
    /** Shows it moved, before the world keeps it. */
    preview(by: THREE.Vector3): void;
    /** Puts back what a preview moved. */
    reset(): void;
    /** The world with it moved. */
    moved(by: THREE.Vector3): WorldData;
  };
  const quarter = (by: THREE.Vector3) => new THREE.Vector3(Math.round(by.x * 4) / 4, Math.round(by.y * 4) / 4, Math.round(by.z * 4) / 4);
  const lattice = (by: THREE.Vector3) => new THREE.Vector3(Math.round(by.x), Math.round(by.y * 4) / 4, Math.round(by.z));
  /** A point held inside a sector's room. */
  const keptIn = (room: Room, [x, y, z]: Point): Point => [
    Math.max(room.min[0], Math.min(room.max[0], x)),
    Math.max(room.min[1], Math.min(room.max[1], y)),
    Math.max(room.min[2], Math.min(room.max[2], z)),
  ];
  /** The object an asset is drawn as, among the mountains, the trees and the portals. */
  const objectOf = (id: string): THREE.Object3D | null => {
    for (const name of placedParts()) {
      let found: THREE.Object3D | null = null;
      parts.get(name)?.object.traverse((object) => { if (!found && object.userData.asset === id) found = object; });
      if (found) return found;
    }
    return null;
  };
  /** What a move moves now, on the Sectors page: the joint picked, else the pipe or road picked, else the element picked, else the grove picked (W91), else the blocks picked; nothing while one is being drawn. */
  const movable = (): Movable | null => {
    if (viewing !== "spaces" || drawing) return null;
    const world = settings.world;
    const held = pickedSkeleton();
    if (held) {
      const joint = pickedJoint(held);
      const room = roomOf(sectorOf(world, held.asset.sector));
      const at = joint !== null
        ? new THREE.Vector3(...held.centres[joint])
        : held.centres.reduce((sum, centre) => sum.add(new THREE.Vector3(...centre)), new THREE.Vector3()).divideScalar(held.centres.length);
      const shifted = (by: THREE.Vector3) => held.joints.map((point, i) => (joint === null || i === joint ? keptIn(room, onLattice([point[0] + by.x, point[1] + by.y, point[2] + by.z])) : point));
      return {
        key: `${held.asset.id} ${joint}`,
        at,
        snap: quarter,
        preview: (by) => {
          reshaping = { id: held.asset.id, joints: shifted(by), ways: held.ways };
          skeletonParts();
        },
        reset: () => {
          reshaping = null;
          skeletonParts();
        },
        moved: (by) => withSkeleton(world, held.asset.id, { joints: shifted(by), ways: held.ways }),
      };
    }
    const element = settings.place.picked ? placedOf(world).find(({ asset }) => asset.id === settings.place.picked) : undefined;
    if (element) {
      const object = objectOf(element.asset.id);
      const from = object?.position.clone() ?? null;
      const room = roomOf(sectorOf(world, element.asset.sector));
      const to = (by: THREE.Vector3) => keptIn(room, [element.x + by.x, element.y + by.y, element.z + by.z]);
      return {
        key: element.asset.id,
        at: new THREE.Vector3(element.x, element.y, element.z),
        snap: lattice,
        preview: (by) => {
          if (object && from) object.position.copy(from).add(by);
        },
        reset: () => {
          if (object && from) object.position.copy(from);
        },
        moved: (by) => {
          const [x, y, z] = to(by);
          return withPlaced(world, element.asset.id, { worldAt: [x, z], level: Math.round(y / BASE_BLOCK.height) });
        },
      };
    }
    // A grove (W91, W96, W99): standing where a tree at its middle would, from its height, moved over its sector a whole
    // metre a step, every tree of it and its outline with it.
    const grove = settings.place.picked ? world.assets.find((asset) => asset.id === settings.place.picked) : undefined;
    if (grove && isGrove(grove)) {
      const trees = groveTreeObjects(grove.id);
      const sector = sectorOf(world, grove.sector);
      const [sx, sy, sz] = metresOf(sector.at);
      return {
        key: grove.id,
        axes: ["x", "z"],
        at: new THREE.Vector3(sx + grove.at[0], footAt(groundColumn(), roomOf(sector), sx + grove.at[0], sz + grove.at[1], sy + grove.y) ?? sy + grove.y, sz + grove.at[1]),
        snap: (by) => new THREE.Vector3(Math.round(by.x), 0, Math.round(by.z)),
        preview: (by) => previewGrove(trees, by),
        reset: () => previewGrove(trees, new THREE.Vector3()),
        moved: (by) => withGrove(world, grove.id, { at: [grove.at[0] + Math.round(by.x), grove.at[1] + Math.round(by.z)] }),
      };
    }
    const made = building();
    const solids = made?.picked.length ? built().solids.filter((solid) => made.picked.includes(solid.id)) : [];
    const last = solids.find((solid) => solid.id === made?.picked[made.picked.length - 1]) ?? solids[0];
    if (made && last) {
      // A block moves a quarter metre a step, or a centimetre, by the unit of the one whose values the card shows (W93).
      const step = stepOf(blockOf(world, last.id)?.unit ?? "m");
      const outlines = () => parts.get("picked blocks")?.object;
      return {
        key: made.picked.join(" "),
        at: new THREE.Vector3(...last.centre),
        snap: (by) => new THREE.Vector3(Math.round(by.x / step) * step, Math.round(by.y / step) * step, Math.round(by.z / step) * step),
        preview: (by) => outlines()?.position.copy(by),
        reset: () => outlines()?.position.set(0, 0, 0),
        moved: (by) => withBlocksMoved(world, made.picked, [by.x, by.y, by.z]),
      };
    }
    return null;
  };
  /**
   * A turn under way (World.md W93, his pick "Any axis, as in Blender"): R turns the blocks picked round their middle (one
   * block's own), following the pointer round it on the screen, as Blender's R does: round the line of sight, or, with
   * X, Y or Z, round that axis of the world (the same key again lets it go); Control or Command held keeps it to 5°
   * steps. A click or Enter keeps it, Escape or a right-click puts it back. The blocks' outlines show where it has them
   * (`shown`); the world keeps it as it is kept.
   */
  let turning: { ids: string[]; pivot: THREE.Vector3; axis: Axis | null; centre: [number, number]; from: number; last: number; degrees: number; fine: boolean; shown: Solid[] } | null = null;
  /** The pointer's angle round a point of the screen, in degrees, counter-clockwise as seen. */
  const angleRound = ([cx, cy]: readonly [number, number], x: number, y: number) => (Math.atan2(-(y - cy), x - cx) * 180) / Math.PI;
  /** The way a turn goes round: the axis kept to, or the line of sight towards the camera; and whether a turn the pointer makes counter-clockwise is a turn of more degrees round it. */
  const turnAxis = (axis: Axis | null) => {
    const towards = camera.getWorldDirection(new THREE.Vector3()).negate();
    if (!axis) return towards;
    const way = new THREE.Vector3(...AXIS_WAY[axis]);
    return way.dot(towards) < 0 ? way.negate() : way;
  };
  /** The blocks picked as a turn of `degrees` round `way` (a unit) through the pivot has them: their middles moved round it, their axes turned. */
  const turnedBy = (ids: readonly string[], pivot: THREE.Vector3, way: THREE.Vector3, degrees: number): Solid[] => {
    const q = new THREE.Quaternion().setFromAxisAngle(way, (degrees * Math.PI) / 180);
    return built().solids.filter((solid) => ids.includes(solid.id)).map((solid) => {
      const centre = new THREE.Vector3(...solid.centre).sub(pivot).applyQuaternion(q).add(pivot);
      const axes = solid.axes.map((axis) => new THREE.Vector3(...axis).applyQuaternion(q).toArray()) as unknown as Solid["axes"];
      return { ...solid, centre: centre.toArray(), axes };
    });
  };
  /** A block's rotation from its axes, in whole degrees, round Y, then X, then Z of its own (`axesOf`'s order). */
  const rotationFrom = (axes: Solid["axes"]): Rotation => {
    const basis = new THREE.Matrix4().makeBasis(new THREE.Vector3(...axes[0]), new THREE.Vector3(...axes[1]), new THREE.Vector3(...axes[2]));
    const euler = new THREE.Euler().setFromRotationMatrix(basis, "YXZ");
    return [euler.x, euler.y, euler.z].map((radians) => Math.round((radians * 180) / Math.PI)) as unknown as Rotation;
  };
  /** R turns the blocks picked, from where the pointer is; none picked, nothing. */
  const turnPicked = () => {
    const made = building();
    const solids = made?.picked.length ? built().solids.filter((solid) => made.picked.includes(solid.id)) : [];
    if (!made || !solids.length || drawing) return false;
    const pivot = solids.reduce((sum, solid) => sum.add(new THREE.Vector3(...solid.centre)), new THREE.Vector3()).divideScalar(solids.length);
    const seen = onScreen(pivot);
    if (!seen) return false;
    const from = pointer ? angleRound(seen, pointer.x, pointer.y) : 0;
    turning = { ids: solids.map((solid) => solid.id), pivot, axis: null, centre: seen, from, last: from, degrees: 0, fine: false, shown: solids };
    canvas.dataset.turn = "0";
    tools();
    draw();
    return true;
  };
  /** The turn so far for the pointer at a point of the view: its angle round the pivot since the turn set off, unwound, in whole degrees or 5° steps. */
  const showTurn = (x: number, y: number, fine: boolean) => {
    if (!turning) return;
    const now = angleRound(turning.centre, x, y);
    // Unwound: the pointer may go round more than once.
    let step = now - turning.last;
    if (step > 180) step -= 360;
    if (step < -180) step += 360;
    turning.last = now;
    turning.fine = fine;
    turning.degrees += step;
    const degrees = fine ? Math.round(turning.degrees / 5) * 5 : Math.round(turning.degrees);
    turning.shown = turnedBy(turning.ids, turning.pivot, turnAxis(turning.axis), degrees);
    canvas.dataset.turn = `${turning.axis ?? "view"} ${degrees}`;
    pickedBlocks();
    draw();
  };
  /** The turn kept, or put back. */
  const endTurn = (keep: boolean) => {
    if (!turning) return;
    const held = turning;
    turning = null;
    delete canvas.dataset.turn;
    const degrees = held.fine ? Math.round(held.degrees / 5) * 5 : Math.round(held.degrees);
    if (keep && degrees % 360 !== 0) {
      const turned = turnedBy(held.ids, held.pivot, turnAxis(held.axis), degrees);
      start.onWorld?.(withBlocksTurned(settings.world, turned.map((solid) => ({ id: solid.id, centre: solid.centre, rotation: rotationFrom(solid.axes) }))));
    }
    tools();
    draw();
  };
  let gizmo: BuiltGizmo | null = null;
  /**
   * A move under way: what it moves, the axis it keeps to (none: free in the picture's plane), the hand pressing an
   * arrow (none for a grab by G), where the move set off on the screen, and how far it has gone.
   */
  let moving: { target: Movable; axis: Axis | null; pointer: number | null; x: number; y: number; by: THREE.Vector3 } | null = null;
  /** The gizmo on what is picked: at its middle, moved with it while a move previews, with the line of the axis kept to. */
  const gizmoPart = () => {
    const target = moving?.target ?? movable();
    const kept = moving?.axis ?? null;
    part("gizmo", target ? JSON.stringify([target.key, target.at.toArray(), kept, target.axes]) : null, () => {
      gizmo = buildGizmo(target!.at, kept, target!.axes);
      return gizmo.object;
    });
    if (!target) gizmo = null;
    if (gizmo && moving) gizmo.moveBy(moving.by);
  };
  /** How far along an axis through a point the pointer's line passes nearest, in metres; none where the axis runs along the line of sight. */
  const alongAxis = (axis: Axis, at: THREE.Vector3, x: number, y: number): number | null => {
    const { origin, direction } = rayAt(x, y);
    const way = new THREE.Vector3(...AXIS_WAY[axis]);
    const line = new THREE.Vector3(...direction);
    const apart = at.clone().sub(new THREE.Vector3(...origin));
    const b = way.dot(line);
    const denominator = 1 - b * b;
    if (denominator < 1e-4) return null;
    return (b * line.dot(apart) - way.dot(apart)) / denominator;
  };
  /** Where the pointer's line meets the plane through a point facing the camera. */
  const inPicture = (at: THREE.Vector3, x: number, y: number): THREE.Vector3 | null => {
    const { origin, direction } = rayAt(x, y);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), at);
    return new THREE.Ray(new THREE.Vector3(...origin), new THREE.Vector3(...direction)).intersectPlane(plane, new THREE.Vector3());
  };
  /** The move so far for a point of the view: along the axis kept to, or free in the picture's plane; held to its grid. */
  const moveFor = (x: number, y: number): THREE.Vector3 | null => {
    if (!moving) return null;
    const { target, axis } = moving;
    if (axis) {
      const now = alongAxis(axis, target.at, x, y);
      const then = alongAxis(axis, target.at, moving.x, moving.y);
      if (now === null || then === null) return null;
      return target.snap(new THREE.Vector3(...AXIS_WAY[axis]).multiplyScalar(now - then));
    }
    const now = inPicture(target.at, x, y);
    const then = inPicture(target.at, moving.x, moving.y);
    return now && then ? target.snap(now.sub(then)) : null;
  };
  const showMove = (x: number, y: number) => {
    if (!moving) return;
    const by = moveFor(x, y);
    if (!by) return;
    moving.by = by;
    moving.target.preview(by);
    gizmoPart();
    // The skeleton's balls follow its joints; an element's ring follows it.
    skeletonOverlay();
    parts.get("picked ring")?.object.position.copy(by);
    draw();
  };
  /** The move kept, or put back. */
  const endMove = (keep: boolean) => {
    if (!moving) return;
    const { target, by } = moving;
    moving = null;
    target.reset();
    parts.get("picked ring")?.object.position.set(0, 0, 0);
    if (keep && by.lengthSq() > 0) start.onWorld?.(target.moved(by));
    tools();
    draw();
  };
  /** The arrow of the gizmo under a point of the view: its head, or the outer part of its shaft, within reach on the screen. */
  const arrowUnder = (x: number, y: number): Axis | null => {
    if (!gizmo) return null;
    const middle = onScreen(gizmo.object.position);
    if (!middle) return null;
    const heads = gizmo.heads();
    let best: { axis: Axis; away: number } | null = null;
    for (const axis of AXES) {
      const tip = heads[axis];
      const head = tip ? onScreen(tip) : null;
      if (!head) continue;
      // The outer three fifths of the shaft and the head: the middle is the joint's, or the element's, to take hold of.
      const [sx, sy] = [middle[0] + (head[0] - middle[0]) * 0.4, middle[1] + (head[1] - middle[1]) * 0.4];
      const [dx, dy] = [head[0] - sx, head[1] - sy];
      const share = Math.max(0, Math.min(1, ((x - sx) * dx + (y - sy) * dy) / Math.max(1e-6, dx * dx + dy * dy)));
      const away = Math.hypot(sx + dx * share - x, sy + dy * share - y);
      if (away <= ARROW_REACH && (!best || away < best.away)) best = { axis, away };
    }
    return (best as { axis: Axis; away: number } | null)?.axis ?? null;
  };
  /** A press on an arrow of the gizmo moves what is picked along it; any press while G grabs keeps the move (or, the right button, puts it back). */
  const pressToMove = (event: PointerEvent) => {
    if (viewing !== "spaces") return;
    // Any press while R turns keeps the turn, or, the right button, puts it back.
    if (turning) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return endTurn(event.button === 0);
    }
    if (moving && moving.pointer === null) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return endMove(event.button === 0);
    }
    if (event.button !== 0) return;
    const axis = arrowUnder(event.clientX, event.clientY);
    const target = axis ? movable() : null;
    if (!axis || !target) return;
    event.stopImmediatePropagation();
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    moving = { target, axis, pointer: event.pointerId, x: event.clientX, y: event.clientY, by: new THREE.Vector3() };
    gizmoPart();
    draw();
  };
  const moveToMove = (event: PointerEvent) => {
    if (turning) {
      event.stopImmediatePropagation();
      pointer = { x: event.clientX, y: event.clientY };
      return showTurn(event.clientX, event.clientY, event.ctrlKey || event.metaKey);
    }
    if (!moving || (moving.pointer !== null && event.pointerId !== moving.pointer)) return;
    event.stopImmediatePropagation();
    showMove(event.clientX, event.clientY);
  };
  const releaseToMove = (event: PointerEvent) => {
    if (!moving || moving.pointer === null || event.pointerId !== moving.pointer) return;
    event.stopImmediatePropagation();
    try { canvas.releasePointerCapture(event.pointerId); } catch { /* let go already */ }
    endMove(event.type === "pointerup");
  };
  /** G grabs what is picked, from where the pointer is (or its middle, with the pointer off the world). */
  const grabPicked = () => {
    const target = movable();
    if (!target) return false;
    const seen = onScreen(target.at);
    const from = pointer ?? (seen ? { x: seen[0], y: seen[1] } : null);
    if (!from) return false;
    moving = { target, axis: null, pointer: null, x: from.x, y: from.y, by: new THREE.Vector3() };
    gizmoPart();
    draw();
    return true;
  };
  const clickToBuild = (event: PointerEvent) => {
    if (!press || event.pointerId !== press.id) return;
    const { x, y, at } = press;
    press = null;
    const still = Math.hypot(event.clientX - x, event.clientY - y) < CLICK_REACH && event.timeStamp - at < CLICK_TIME;
    const made = building();
    if (made && still && event.type === "pointerup") {
      const at = buildsAt(event.clientX, event.clientY, made);
      if (made.tool === "select") made.pick(at?.picks?.id ?? null, event.shiftKey || event.metaKey || event.ctrlKey);
      else if (at) made.place(at.solid.centre);
    }
    aim();
    draw();
  };

  const resize = new ResizeObserver(draw);
  resize.observe(canvas);
  const interfaceChanged = new MutationObserver(() => {
    if (findAsides()) draw();
  });
  interfaceChanged.observe(document.body, { childList: true, subtree: true });


  // The camera's movement (`movement.ts`): on a view that is the visitor's camera, it keeps its height, angle and turn
  // (`live`) and moves over the ground (`at`: where the visitor is, the human standing there, not a value; the camera
  // in its helmet or behind it, W100). A drag slides it from where the hand took hold (`heldAt`, by `slid`), carrying
  // on or springing back once let go; the arrows and W A S D carry it while held. A click on a portal flies it there
  // (`focus.ts`), its values moving, each told (`onEye`) so on the camera's page the card shows them moving. A jig's
  // page that is looked round is OrbitControls' instead.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let eyeView = false;
  let live: CameraConfig = start.settings.camera;
  const visitorsCell = (): Ground => [centreOf(VISITOR).x, centreOf(VISITOR).z];
  let at: Ground = visitorsCell();
  let heldAt: Ground = at;
  // The human (`human.ts`, World.md W51): the figure as it travels, where the visitor has been over the last tenth of a
  // second (`trail`: a hand's moves come less often than frames, so a frame's own step is too jerky to walk by), and
  // when its last frame was; its walk and run are the rig's tokens, read off the canvas as it sets off.
  let human: BuiltHuman | null = null;
  let figure: Figure = figureStanding(live.turn);
  let trail: { at: Ground; t: number }[] = [];
  let figureAt = 0;
  /** How far through its cycle the figure moving in place on its page is, and how it hovers and flies (tokens too). */
  let inPlace = 0;
  let clayAir: ClayFlightState | null = null;
  let clayAirMotion: ClayFlightMotion | null = null;
  let humanHeld = groundedFlight();
  let hover: HoverMotion | null = null;
  let motion: HumanMotion | null = null;
  /**
   * The figure off the ground (`air.ts`; his: "Space should jump. And double space should enable flight"): its jump's
   * and flight's tokens, read as it leaves the ground; whether it is flying, how fast it rises (metres a second, down
   * under 0), and the last Space pressed, for the second of two. `aloft` is how far its limbs are into the air's poses
   * from the ground's (`share`) and from hovering into flying (`fly`), each 0 to 1 eased over the Gait's Settle, and how
   * far through their cycle (`phase`); `jets` the feet's boosts as built, fired in flight.
   */
  let air: AirMotion | null = null;
  let flying = false;
  let climb = 0;
  let spaceAt = -Infinity;
  let aloft = { share: 0, fly: 0, phase: 0 };
  let jets: { flames: THREE.Object3D[]; lights: THREE.PointLight[]; on: boolean | null } = { flames: [], lights: [], on: null };
  /**
   * The steady eye in the helmet (World.md W77, W78): the head bone as built (`headRest`: its place on its neck, and
   * where it and the hips stand with the figure at rest at the origin); and the eye as it comes round to where it is
   * steered (`steady`: the way it faces, as a heading, and its tilt down, eased over Steering's Smoothing; the gait's
   * lean, eased over the Gait's Settle; when it was last eased).
   */
  let headRest: { local: THREE.Vector3; head: THREE.Vector3; hips: THREE.Vector3 } | null = null;
  let steady: { yaw: number; tilt: number; lean: number; at: number } | null = null;
  /**
   * Whether the visitor looks out of the figure's helmet: on the eye's view, from the View camera, with a head to look
   * out of (W69, W100). From the Character camera, or with no head, the camera sees the figure from behind.
   */
  const inHelmet = () => eyeView && live.kind !== "character" && figureConfig().shows !== "skeleton";
  /**
   * The human the visitor is (W100; his: "I haven't placed the human character at the bottom in the world. I placed one
   * in one section … Remove the one that I did not place"): a human placed in the world, walked as the visitor where it
   * stands, in its variant's look and gait (`config`), and drawn once, its placed self hidden while it is walked;
   * `standY` the height of its feet. With none placed, the start's figure on the visitor's cell, on the floor.
   */
  let walker: { id: string; config: HumanConfig } | null = null;
  let standY = 0;
  /** The figure's look and gait: the Human page's own, else the human walked as, else the start's. */
  function figureConfig(): HumanConfig {
    return viewing === "human" ? settings.human : walker?.config ?? settings.human;
  }
  /** The humans placed in the world, whose variants are known: those the visitor may walk as. */
  const walkable = () => placedOf(settings.world).filter(({ asset }) => asset.kind === "human" && settings.humanVariants[asset.variant]);
  /** Takes the visitor to a placed human (or, with none, to the start's figure on the visitor's cell), facing its way. */
  const walkAs = (placed: ReturnType<typeof placedOf>[number] | undefined) => {
    const config = placed?.asset.kind === "human" ? settings.humanVariants[placed.asset.variant] : undefined;
    walker = placed && config ? { id: placed.asset.id, config } : null;
    at = placed && config ? held([placed.x, placed.z]) : visitorsCell();
    standY = placed && config ? placed.y : 0;
    const turn = placed && config ? headingOf(placed.asset.turn) : live.turn;
    live = { ...live, turn };
    heldAt = at;
    slid = NOWHERE;
    trail = [];
    figureAt = 0;
    steady = null;
    figure = figureStanding(turn);
    fall = { speed: 0, at: 0 };
    land();
  };
  /**
   * The figure on what is built (W101; his: "I took the character on to the pipe, I thought the character fits into it
   * and it must fall"): how fast it is falling, in metres a second, and when it last fell.
   */
  let fall = { speed: 0, at: 0 };
  /** Where the figure stands at a point with its feet where they are, or `null` where a wall stands (`groundUnder`). */
  const groundAt = (x: number, z: number, feet = standY) => groundUnder(walkColumn()(x, z), feet);
  /**
   * Walks the figure towards a point (W101): not into a wall, nor through a pipe's wall; held, it slides along the wall
   * on whichever way is free. Stepping onto something at most a step up, it stands on it; off an edge, it falls (`falls`).
   */
  const walkTo = (next: Ground) => {
    const tryAt = (to: Ground) => {
      if (to[0] === at[0] && to[1] === at[1]) return false;
      const ground = groundAt(to[0], to[1]);
      if (ground === null) return false;
      const body = [0.3, HUMAN_HEIGHT / 2, HUMAN_HEIGHT - 0.2];
      if (body.some((up) => throughPipeWall(pipeBodies, [at[0], standY + up, at[1]], [to[0], standY + up, to[1]]))) return false;
      at = to;
      if (ground > standY) standY = ground;
      return true;
    };
    if (!tryAt(next) && !tryAt([next[0], at[1]])) tryAt([at[0], next[1]]);
  };
  /**
   * The figure's fall, a frame of it (W101): with nothing under its feet it falls, faster and faster, onto the first
   * thing under it; at once under reduced motion. A jump is a fall that starts going up (`air.ts`), its head stopping
   * under anything over it. In flight it climbs instead (`climbs`). Whether it is falling.
   */
  const falls = (now: number) => {
    if (!eyeView || !human || viewing === "human") {
      fall = { speed: 0, at: 0 };
      land();
      return false;
    }
    if (flying) return climbs(now);
    const ground = groundAt(at[0], at[1]);
    // In a wall (something built round it), it stays where it is.
    if (ground === null || (standY <= ground && fall.speed >= 0)) {
      if (ground !== null && standY < ground) {
        standY = ground;
        placeFigure();
      }
      fall = { speed: 0, at: 0 };
      return false;
    }
    const dt = fall.at ? Math.min(64, now - fall.at) : 16;
    const next = reduced.matches ? { feet: ground, speed: 0 } : fallen(standY, fall.speed, ground, dt);
    const ceiling = next.speed < 0 ? ceilingOver(walkColumn()(at[0], at[1]), standY + HUMAN_HEIGHT) : Infinity;
    if (next.feet + HUMAN_HEIGHT > ceiling) next.feet = Math.max(standY, ceiling - HUMAN_HEIGHT);
    if (next.feet + HUMAN_HEIGHT > ceiling - 1e-3) next.speed = Math.max(0, next.speed);
    standY = next.feet;
    fall = next.feet > ground || next.speed < 0 ? { speed: next.speed, at: now } : { speed: 0, at: 0 };
    placeFigure();
    return true;
  };
  /** Whether the figure stands on the ground: neither flying nor in a jump or a fall. */
  const grounded = () => !flying && !fall.at && fall.speed === 0;
  /** Space on the ground (`air.ts`): the figure jumps, as high as the jump's token says; under reduced motion, not at all. */
  const jump = () => {
    if (!grounded() || reduced.matches) return;
    air = readAirMotion(canvas);
    fall = { speed: -jumpSpeed(air.jumpHeight), at: 0 };
  };
  /** Space twice (`air.ts`): the figure takes off where it is, hovering; twice again it lets go, and falls. */
  const takeOff = () => {
    if (flying) return land();
    air = readAirMotion(canvas);
    hover = readHoverMotion(canvas);
    flying = true;
    climb = 0;
    fall = { speed: 0, at: 0 };
  };
  /** The flight ends: the figure falls from where it is, or stands where it landed. */
  function land() {
    flying = false;
    climb = 0;
  }
  /**
   * A frame of the flight (`air.ts`): Space held rises and Shift held sinks, at the flight's Rise, picking up and losing
   * speed over the camera's Glide; it stops under anything over it and under the world's top, and sunk onto the ground
   * it lands. Whether it is flying (it hovers, so it always is).
   */
  const climbs = (now: number) => {
    const dt = fall.at ? Math.min(64, now - fall.at) : 16;
    fall = { speed: 0, at: now };
    const rise = air?.flyRise ?? 6;
    const want = ((keys.has("Space") ? 1 : 0) - (running() ? 1 : 0)) * rise;
    const tau = live.glide * 1000;
    climb = reduced.matches || tau <= 0 ? want : climb + (want - climb) * (1 - Math.exp(-dt / tau));
    if (Math.abs(climb) < 1e-3 && !want) climb = 0;
    if (!climb) return true;
    const column = walkColumn()(at[0], at[1]);
    const ground = groundUnder(column, standY);
    let to = standY + (climb * dt) / 1000;
    if (climb > 0) {
      const top = Math.min(ceilingOver(column, standY + HUMAN_HEIGHT), bounds().height - 0.5) - HUMAN_HEIGHT;
      if (to >= top) {
        to = Math.max(standY, top);
        climb = 0;
      }
    } else if (ground !== null && to <= ground) {
      // Sunk onto the ground, it lands and walks again.
      standY = ground;
      fall = { speed: 0, at: 0 };
      land();
      placeFigure();
      return true;
    }
    standY = to;
    placeFigure();
    return true;
  };
  /**
   * The switch between the two cameras (W100): where the camera was as C was pressed, whether it goes into the helmet,
   * and when it set off. The camera glides from there to where the camera it switched to is now, which moves with the
   * figure, on the Switch's spring.
   */
  let switching: { from: { position: THREE.Vector3; quaternion: THREE.Quaternion; fov: number }; into: boolean; at: number } | null = null;
  /** While the camera glides (W100), how far into the helmet the eye is, 0 behind the figure to 1 in it. */
  let helmetShare = 0;
  /**
   * The view through the visor (W78), as far into the helmet as the eye is (`helmetShare`): the air cleared round the
   * eye and the haze past it, and the rim framing the view or not; behind the figure, and on every other view, the
   * world's air and the rim. While the camera glides in or out (W100) the air clears or comes back with it, and the rim
   * is shown. The helmet's inside round the visor (W79), in its colour, lit by the world and lifted by its own light, as
   * opaque as Inside opacity (W80): under 100% it is drawn over the world, which shows through, and writes no depth;
   * drawn whenever the eye may be in the head, and from outside always behind the shell.
   */
  const dressVisor = () => {
    const share = switching || unriding ? helmetShare : inHelmet() ? 1 : 0;
    orbit?.eyeAir(live.clearAir * share, 1 + (live.haze / 100 - 1) * share);
    const rim = human?.object.getObjectByName("visor rim");
    if (rim) rim.visible = share < 1 || live.rimInView;
    const lining = human?.object.getObjectByName("head lining");
    if (lining instanceof THREE.Mesh && lining.material instanceof THREE.MeshStandardNodeMaterial) {
      const opacity = live.insideOpacity / 100;
      lining.visible = share > 0 && live.inside && opacity > 0;
      lining.material.color.set(live.insideColour);
      lining.material.emissive.set(live.insideColour);
      lining.material.emissiveIntensity = live.insideLight / 100;
      const through = opacity < 1;
      if (lining.material.transparent !== through) {
        lining.material.transparent = through;
        lining.material.depthWrite = !through;
        lining.material.needsUpdate = true;
      }
      lining.material.opacity = opacity;
    }
  };
  /**
   * Poses the figure, its head held in its Expression, or, with Looks at cursor on and the pointer over the world,
   * turned to the pointer (`cursorGaze`): the figure stands first, since where the pointer is from its neck depends on
   * the pose, then its head alone is turned, without a tilt. In the helmet the visitor steers the head (W78): it is
   * held where the look is (`steadyHead`), and its Expression and the cursor are the figure's as seen from outside.
   */
  const hold = (pose: HumanPose, lift: number) => {
    if (!human) return;
    humanHeld = groundedFlight(pose, lift * UNIT);
    // The steady eye moves the head bone off its neck; every pose starts from where it was built.
    if (headRest) human.bones.head.position.copy(headRest.local);
    if (inHelmet()) return human.pose(pose, lift);
    human.pose(withExpression(pose, figureConfig().expression), lift);
    if (!figureConfig().looksAtCursor || !pointer) return;
    const gaze = cursorGaze(pointer);
    if (gaze) human.pose(withGaze(pose, gaze), lift);
  };
  /** On the human's page: stands the figure on its block at the visitor's cell, facing the camera (+z), in its Posture. */
  const placeStatue = () => {
    if (!human) return;
    const { x, z } = centreOf(VISITOR);
    human.object.position.set(x, HUMAN_TOP, z);
    human.object.rotation.y = 0;
    const { pose, lift } = postureOf(settings.human.posture, motion ?? (motion = readHumanMotion(canvas)));
    hold(pose, lift);
    if (canvas.dataset.gait !== "rest") canvas.dataset.gait = "rest";
  };
  /**
   * Stands the figure where the visitor is, facing its way (the rig's front is +z; a heading of 0 faces −z), in its pose.
   * In the helmet its way is the way the eye looks, the camera's Turn (W78).
   */
  const placeFigure = () => {
    if (!human) return;
    if (inHelmet() && figure.heading !== live.turn) figure = { ...figure, heading: live.turn };
    human.object.position.set(at[0], standY, at[1]);
    human.object.rotation.y = Math.PI - (figure.heading * Math.PI) / 180;
    // Where its feet are, x y z in metres, for the review (W101).
    const feet = [at[0], standY, at[1]].map((value) => value.toFixed(2)).join(" ");
    if (canvas.dataset.feet !== feet) canvas.dataset.feet = feet;
    const gaits = motion ?? (motion = readHumanMotion(canvas));
    let posed = poseOf(figure, gaits);
    let clayFrame: ClayFlightFrame | null = null;
    // Off the ground (`air.ts`), as far into the air's poses as its limbs are: hovering, or flying as it goes.
    if (aloft.share > 0) {
      if (figureConfig().form === "clay") {
        const airMotion = clayAirMotion ?? (clayAirMotion = readClayFlightMotion(canvas));
        const time = reduced.matches ? 0 : performance.now();
        const ability = clayFlightMode(figureConfig().moves) ?? "boost";
        clayFrame = blendFlight(clayFlightAt("hover", time, airMotion, reduced.matches), clayFlightAt(ability, time, airMotion, reduced.matches), ability === "boost" ? aloft.fly : 1);
        clayFrame = { ...clayFrame, jets: ability === "boost" ? aloft.share : 0, trails: ability === "glide" ? aloft.share : 0 };
        // World travel already positions the feet in the air. Only the pose and effects come from this ability.
        posed = mixPoses(posed, { pose: clayFrame.pose, lift: 0 }, aloft.share);
      } else {
        const hovers = hover ?? (hover = readHoverMotion(canvas));
        const inAir = mixPoses(inPlaceOf("hovering", aloft.phase, gaits, hovers), inPlaceOf("flying", aloft.phase, gaits, hovers), aloft.fly);
        posed = mixPoses(posed, inAir, aloft.share);
      }
    }
    hold(posed.pose, posed.lift);
    human.flight(clayFrame);
    const gait = flying ? (aloft.fly >= 0.5 ? "fly" : "hover") : figure.gait;
    if (canvas.dataset.gait !== gait) canvas.dataset.gait = gait;
    fireJets(flying || figureConfig().shows === "boost");
  };
  /** The feet's boosts fired or not (his: "flying with boosters on"): their jets shown and their lights lit. */
  const fireJets = (on: boolean) => {
    if (jets.on === on) return;
    jets.on = on;
    for (const flame of jets.flames) flame.visible = on;
    // A light kept and dimmed rather than hidden, so the world's materials are not made anew as it takes off.
    for (const light of jets.lights) light.intensity = on ? figureConfig().boostBrightness : 0;
  };
  /**
   * The figure's limbs a frame `dt` ms on into the air's poses or back to the ground's, and from hovering into flying as
   * it goes faster than its Stands under or back, each over the Gait's Settle (at once under reduced motion). Whether
   * they are off the ground or still coming down.
   */
  const easeAloft = (dt: number, speed: number) => {
    if (!flying && !aloft.share) return false;
    const config = figureConfig();
    const toward = (from: number, to: number) => (reduced.matches || config.settle <= 0 || Math.abs(to - from) < 0.005 ? to : from + (to - from) * (1 - Math.exp(-dt / config.settle)));
    const hovers = hover ?? (hover = readHoverMotion(canvas));
    const fly = toward(aloft.fly, flying && speed >= config.standUnder ? 1 : 0);
    const cycle = Math.max(1, hovers.hoverCycle + (hovers.flyCycle - hovers.hoverCycle) * fly);
    aloft = { share: toward(aloft.share, flying ? 1 : 0), fly, phase: (aloft.phase + dt / cycle) % 1 };
    return flying || aloft.share > 0;
  };
  /**
   * The figure's frame: facing its way and striding as far as the visitor is going, measured over the last `STRIDE_WINDOW`
   * ms. Whether it is still moving.
   */
  const stride = (now: number) => {
    // On its page the figure walks or runs in place at its gait's own pace (Motion), or holds still in its posture.
    if (viewing === "human") {
      trail = [];
      const mode = settings.human.form === "clay" ? clayFlightMode(settings.human.moves) : null;
      if (human && settings.human.form === "clay" && (mode || clayAir?.active)) {
        const dt = figureAt ? Math.min(64, now - figureAt) : 16;
        figureAt = now;
        const ground = postureOf(settings.human.posture, motion ?? (motion = readHumanMotion(canvas)));
        const resting = groundedFlight(ground.pose, ground.lift * UNIT);
        if (!clayAirMotion || clayAir?.target !== mode) clayAirMotion = readClayFlightMotion(canvas);
        if (!clayAir?.active) clayAir = flightStanding(humanHeld);
        clayAir = stepClayFlight(clayAir, mode, dt, clayAirMotion, resting, reduced.matches);
        const { frame } = clayAir;
        const { x, z } = centreOf(VISITOR);
        human.object.position.set(x + frame.offset[0], HUMAN_TOP, z + frame.offset[1]);
        hold(frame.pose, frame.height / UNIT);
        human.flight(frame);
        canvas.dataset.gait = mode ?? "rest";
        canvas.dataset.clayFlight = clayAir.stage;
        canvas.dataset.clayHeight = frame.height.toFixed(3);
        return clayAir.active && !reduced.matches;
      }
      if (clayAir) {
        clayAir = null;
        human?.flight(null);
        delete canvas.dataset.clayFlight;
        delete canvas.dataset.clayHeight;
        if (settings.human.form === "clay") placeStatue();
      }
      if (!human || settings.human.moves === "still") {
        figureAt = 0;
        return false;
      }
      const dt = figureAt ? Math.min(64, now - figureAt) : 16;
      figureAt = now;
      const moves = settings.human.moves;
      const gait = moves === "running" ? "run" : moves === "hovering" ? "hover" : moves === "flying" ? "fly" : "walk";
      inPlace = (inPlace + dt / cycleFor(moves, motion ?? (motion = readHumanMotion(canvas)), hover ?? (hover = readHoverMotion(canvas)))) % 1;
      const { pose, lift } = inPlaceOf(moves, inPlace, motion, hover);
      hold(pose, lift);
      if (canvas.dataset.gait !== gait) canvas.dataset.gait = gait;
      return true;
    }
    if (!eyeView || !human) {
      figureAt = 0;
      trail = [];
      return false;
    }
    const dt = figureAt ? Math.min(64, now - figureAt) : 16;
    figureAt = now;
    trail.push({ at, t: now });
    while (trail.length > 1 && now - trail[1].t >= STRIDE_WINDOW) trail.shift();
    const since = now - trail[0].t;
    const velocity: Ground = since > 0 ? [(at[0] - trail[0].at[0]) / since, (at[1] - trail[0].at[1]) / since] : NOWHERE;
    // The tokens are read as it sets off (Motion.md M3), so a token changed between two walks reaches the next.
    if (figure.gait === "rest" && (velocity[0] || velocity[1])) motion = readHumanMotion(canvas);
    // In the helmet it faces the way the eye looks, whichever way it goes (W78).
    // The keys walk it, and with Shift run it (`air.ts`); a drag's speed picks its gait.
    const pace = [...keys].some(movesCamera) ? (running() ? "run" : "walk") : undefined;
    const next = figureStep(figure, figureConfig(), motion ?? (motion = readHumanMotion(canvas)), velocity, dt, reduced.matches, inHelmet() ? live.turn : undefined, pace);
    figure = next.figure;
    const aloftNow = easeAloft(dt, Math.hypot(velocity[0], velocity[1]) * 1000);
    placeFigure();
    // The trail stays as it rests: the next frame's speed is measured from it, however long the frame took to come.
    if (next.done && !aloftNow) figureAt = 0;
    return !next.done || aloftNow;
  };
  let slid: Ground = NOWHERE;
  let hand: { id: number; x: number; y: number; at: number; speed: Ground; from: { x: number; y: number; at: number }; far: number } | null = null;
  let release: { at: number; from: Ground; speed: Ground } | null = null;
  // The keys held, the speed they carry the camera at over the ground and up (metres a ms), and when they last moved it.
  const keys = new Set<string>();
  /** Whether Shift is held: on foot it runs, in flight it sinks (`air.ts`). */
  const running = () => keys.has("ShiftLeft") || keys.has("ShiftRight");
  /**
   * How fast the keys carry the visitor, in metres a second (`air.ts`; his: "The default motion … should be walk. And
   * should run using Shift"): walking, at its Gait's Walk up to; running, at the camera's Keys; flying, faster than that
   * by the flight's pace.
   */
  const onFootSpeed = () => (flying ? live.keys * (air?.flyPace ?? 1.5) : running() ? live.keys : Math.min(live.keys, figureConfig().walkUpTo));
  let keySpeed: Ground = NOWHERE;
  let riseSpeed = 0;
  let keysAt = 0;
  // The map's flight (`focus.ts`): from where the camera was to where it goes.
  let flight: { from: Rig; to: Rig; at: number } | null = null;
  /** Where over the floor the camera may be: inside the world's width and breadth, independently of height. */
  const held = (next: Ground): Ground => overGroundPlane(next, bounds());
  /** A heading in degrees, the way the Turn takes it: −180 to 180. */
  const headingOf = (degrees: number) => ((((degrees % 360) + 540) % 360) - 180);
  /**
   * The visitor's eye is in the helmet (his: "The viewer camera should be through the helmet"): at the ball's centre
   * behind the visor, looking straight out through it, the way the head is held (`steadyHead`: the camera's Turn and
   * Angle, as the visitor steers them, W78); its Height is the figure's. Without a head to look out of (the skeleton),
   * none: the camera is the Character camera (W100).
   */
  const helmetEye = (): { position: [number, number, number]; target: [number, number, number]; up: [number, number, number] } | null => {
    const config = figureConfig();
    // The Clay's head is a group named "head" on the head bone, at the head's middle (World.md W102); a search by name
    // from the figure would find the bone, also named "head", at the head's foot. The Suit's is found as before.
    const head = config.shows === "skeleton" ? null : config.form === "clay" ? human?.bones.head.children.find((child) => child.name === "head") : human?.object.getObjectByName("head");
    if (!head) return null;
    const centre = head.getWorldPosition(new THREE.Vector3());
    const held = head.getWorldQuaternion(new THREE.Quaternion());
    const gaze = new THREE.Vector3(0, 0, 1).applyQuaternion(held);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(held);
    return { position: [centre.x, centre.y, centre.z], target: [centre.x + gaze.x * 10, centre.y + gaze.y * 10, centre.z + gaze.z * 10], up: [up.x, up.y, up.z] };
  };
  /**
   * Where the head turns to look at the pointer (Looks at cursor), as the figure stands now, seen from outside (in the
   * helmet the visitor steers the head instead, W78): its bone's turn, down and to its left, from its neck (`gazeAt`).
   * The head looks at the point under the pointer half way between it and the camera: where the pointer's line meets
   * the plane facing the camera through that middle, so the head turns by the pointer's own angle from the view's
   * middle (a plane through the ball's centre would turn it square to the camera wherever the pointer is; one at the
   * camera, to the camera).
   */
  const cursorGaze = ({ x, y }: { x: number; y: number }): Gaze | null => {
    if (!human) return null;
    const bone = human.bones.head;
    const neck = bone.parent;
    if (!neck) return null;
    // The ball (the look's head, or the skeleton's skull) rides the bone a little above the joint.
    const ball = bone.children.find((child) => child.name === "head" || child.name === "skull") ?? bone;
    const centre = ball.getWorldPosition(new THREE.Vector3());
    const held = neck.getWorldQuaternion(new THREE.Quaternion());
    const box = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((x - box.left) / box.width) * 2 - 1, -((y - box.top) / box.height) * 2 + 1), camera);
    const facing = camera.getWorldDirection(new THREE.Vector3());
    const middle = centre.clone().lerp(camera.position, 0.5);
    const hit = ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(facing, middle), new THREE.Vector3());
    if (!hit) return null;
    return gazeAt(hit.sub(centre).applyQuaternion(held.invert()).toArray() as [number, number, number]);
  };
  /** The steady frame (W77): the figure upright where it stands, facing the eye's way, as its neck is at rest. */
  const steadyFrame = () => new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI - ((steady?.yaw ?? figure.heading) * Math.PI) / 180, 0));
  /**
   * The head held steady in the helmet (World.md W77; his: "the movement of the head … is not smooth. Even when I'm
   * walking or running, it is not smooth"): the eye rides neither the stride's bounce nor the body's sway and twist.
   * It is held where the visitor steers it (W78): facing the camera's Turn, as the figure does, and tilted down its
   * Angle (up, under 0), coming round to them over Steering's Smoothing, so a look starts and ends softly. It does go
   * with the gait's lean, which a walk or a run holds all along, eased over the Gait's Settle, so the neck stays under
   * it: a head left upright over the hips would see its own neck lean out in front of it. The head bone is put there,
   * so the rim and the lens keep their place in the view; from inside, the neck under the ball is never seen. Whether
   * the eye is still coming round.
   */
  const steadyHead = (now: number) => {
    if (!human || !headRest || !inHelmet()) {
      steady = null;
      return false;
    }
    const gait = motion ?? (motion = readHumanMotion(canvas));
    const yaw = figure.heading;
    const tilt = live.angle;
    // The lean the figure's pose holds now (`poseOf`: the gait's, as far into it as its limbs are; in the air, the
    // flight's, as far as it is flying), and how high the air's poses lift it (`air.ts`).
    const hovers = aloft.share ? (hover ?? (hover = readHoverMotion(canvas))) : null;
    const groundLean = figure.blend * (figure.moving === "run" ? gait.runLean : gait.walkLean);
    const lean = hovers ? groundLean + (hovers.flyLean * aloft.fly - groundLean) * aloft.share : groundLean;
    const rise = hovers ? aloft.share * (hovers.hoverHeight + (hovers.flyHeight - hovers.hoverHeight) * aloft.fly) : 0;
    if (!steady || reduced.matches) steady = { yaw, tilt, lean, at: now };
    else {
      const dt = Math.min(64, Math.max(0, now - steady.at));
      const toward = (ms: number) => (ms > 0 ? 1 - Math.exp(-dt / ms) : 1);
      const look = toward(live.smoothing);
      const settle = toward(figureConfig().settle);
      steady = {
        yaw: steady.yaw + turnBetween(steady.yaw, yaw) * look,
        tilt: steady.tilt + (tilt - steady.tilt) * look,
        lean: steady.lean + (lean - steady.lean) * settle,
        at: now,
      };
    }
    const near = (a: number, b: number) => Math.abs(a - b) < 0.05;
    const settled = near(turnBetween(steady.yaw, yaw), 0) && near(steady.tilt, tilt) && near(steady.lean, lean);
    if (settled) steady = { yaw, tilt, lean, at: now };
    // Where the bone would be: the figure where it is, facing the eye's way, leaning from its hips by the lean alone,
    // its head tilted down by the look.
    const RAD = Math.PI / 180;
    const place = headRest.head.clone().sub(headRest.hips).applyAxisAngle(new THREE.Vector3(1, 0, 0), steady.lean * RAD).add(headRest.hips);
    place.y += rise;
    const world = new THREE.Matrix4()
      .compose(new THREE.Vector3(at[0], standY, at[1]), steadyFrame(), new THREE.Vector3(1, 1, 1))
      .multiply(new THREE.Matrix4().makeTranslation(place))
      .multiply(new THREE.Matrix4().makeRotationX(steady.tilt * RAD));
    const bone = human.bones.head;
    const local = bone.parent ? bone.parent.matrixWorld.clone().invert().multiply(world) : world;
    local.decompose(bone.position, bone.quaternion, bone.scale);
    bone.updateMatrixWorld(true);
    return !settled;
  };
  /**
   * The camera in the helmet, put there once the figure is posed (W77: every frame it moves, never a frame behind it):
   * the head steadied, the eye at its ball's centre; from the Character camera, or without a head, behind the figure
   * (W100). While it switches, it is the spring's share of the way from where it was to there. Whether the eye is
   * still coming round, or gliding.
   */
  const aimEye = (now = performance.now()) => {
    const steadying = steadyHead(now);
    const helmet = inHelmet() ? helmetEye() : null;
    const eye = helmet ?? characterEye(live, at, standY);
    // Height is held between the world's floor and its top, on its own; the sides hold where it is over the floor. The
    // Character camera comes in front of what stands between it and the figure (W101).
    const position = onPlane(helmet ? eye.position : clearSight(eye.target, eye.position), bounds());
    const shift = [0, 1, 2].map((i) => position[i] - eye.position[i]) as [number, number, number];
    camera.position.set(...position);
    // A tilted head tilts the view: the camera's up is the head's.
    camera.up.set(...(helmet?.up ?? [0, 1, 0]));
    camera.lookAt(eye.target[0] + shift[0], eye.target[1] + shift[1], eye.target[2] + shift[2]);
    const fov = fovOf(live);
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    return glideBetween(now) || steadying;
  };
  /**
   * Where the Character camera stands to see the figure (W101): where it would, or, with a block, a mountain, a pipe or a
   * road between them, just in front of it (`SIGHT_CLEAR`), so from inside a pipe it sees the figure in it, not the
   * pipe's outside.
   */
  const sight = new THREE.Raycaster();
  /** How far in front of what stands in the way the Character camera stands, in metres (mine). */
  const SIGHT_CLEAR = 0.3;
  const clearSight = (target: readonly [number, number, number], position: readonly [number, number, number]): [number, number, number] => {
    const from = new THREE.Vector3(...target);
    const way = new THREE.Vector3(...position).sub(from);
    const far = way.length();
    if (far < 1e-6) return [...position];
    groundColumn();
    sight.set(from, way.divideScalar(far));
    sight.far = far;
    const built = [...parts].flatMap(([name, { object }]) => (name.startsWith("blocks ") || name.startsWith("cut ") ? [object] : []));
    const hit = sight.intersectObjects([...(columnFor?.meshes ?? []), ...built], true)[0];
    if (!hit) return [...position];
    return from.addScaledVector(way, Math.max(0.3, hit.distance - SIGHT_CLEAR)).toArray();
  };
  /**
   * A frame of the switch between the cameras (W100): the camera the spring's share of the way from where it was to
   * where the camera it switched to is now (just put there), turning as it goes, the air through the visor clearing or
   * coming back with it. Whether it still glides.
   */
  const glideBetween = (now: number) => {
    if (!switching) return false;
    const state = springAt({ x: 0, v: 0 }, 1, now - switching.at, { response: live.switchResponse, bounce: live.switchBounce });
    const done = reduced.matches || springSettled(state, 1, 1e-3);
    if (done) {
      switching = null;
      if (canvas.dataset.camera !== live.kind) canvas.dataset.camera = live.kind;
    } else {
      const share = state.x;
      camera.position.lerpVectors(switching.from.position, camera.position.clone(), share);
      camera.quaternion.slerpQuaternions(switching.from.quaternion, camera.quaternion.clone(), share);
      // The lens too, from the builder's (W100); between the two cameras it is the same.
      const fov = switching.from.fov + (fovOf(live) - switching.from.fov) * share;
      if (camera.fov !== fov) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      helmetShare = Math.min(1, Math.max(0, switching.into ? share : 1 - share));
    }
    dressVisor();
    // The last frame is drawn too.
    return true;
  };
  const placeEye = () => {
    at = held(at);
    // The figure stands first: the eye is in its head.
    placeFigure();
    // Coming round, the eye takes the frames it needs (a frame loop already running carries it on itself).
    if (aimEye()) wake();
  };
  /** The camera now: its values as a flight left them, with its settings as they are set now, and where it is. */
  const fromLive = (): Rig => ({ camera: { ...settings.camera, ...Object.fromEntries(MOVED_KEYS.map((key) => [key, live[key]])) }, at });
  const show = (rig: Rig) => {
    live = rig.camera;
    at = rig.at;
    // Flown into something built, the figure stands on its top (W101); over a drop, it falls.
    const { diameter, height } = bounds();
    const foot = footAt(walkColumn(), { min: [-diameter / 2, 0, -diameter / 2], max: [diameter / 2, height, diameter / 2] }, at[0], at[1], standY);
    if (foot !== null && foot > standY) standY = foot;
    placeEye();
    start.onEye?.(live);
  };
  const slideTo = (next: Ground) => {
    slid = next;
    walkTo(held(add(heldAt, slid)));
    placeEye();
  };
  const carryOn = () => {
    if (!release || !eyeView) {
      release = null;
      return;
    }
    const after = releasedAt(live, release.from, release.speed, performance.now() - release.at, reduced.matches);
    if (after.done) release = null;
    slideTo(after.slid);
  };
  /**
   * Turns the look in the helmet (W78): `across` degrees to the right and `down` degrees down, its tilt held within
   * Steering's Look up and Look down; the figure faces it at once and the eye comes round over the Smoothing. From the
   * Character camera (W100) it goes round the figure instead, up and down within its Angle's range, the figure facing
   * the way it walks. The camera's page shows the Turn and the Angle moving (`onEye`), as a flight's do.
   */
  const steerLook = (across: number, down: number) => {
    const turn = headingOf(live.turn + across);
    if (!inHelmet()) {
      const characterAngle = Math.min(CHARACTER_ANGLE.max, Math.max(CHARACTER_ANGLE.min, live.characterAngle + down));
      if (turn === live.turn && characterAngle === live.characterAngle) return;
      live = { ...live, turn, characterAngle };
      placeEye();
      start.onEye?.(live);
      return;
    }
    const angle = Math.min(live.lookDown, Math.max(-live.lookUp, live.angle + down));
    if (turn === live.turn && angle === live.angle) return;
    live = { ...live, turn, angle };
    figure = { ...figure, heading: turn };
    placeEye();
    start.onEye?.(live);
  };
  /**
   * Switches to the other camera (W100; his: "transition between character camera and view camera"): C, or the
   * camera's card. The camera glides from where it is to the camera switched to, on the Switch's spring, at once
   * under reduced motion. Into the helmet the eye looks the way the figure faces, so its body does not swing round to
   * the camera's way, and comes in at the head as it is held; out of it, the camera goes behind the figure the way it
   * looked. `tell`: the camera's page shows it switched (`onEye`), unless its card asked.
   */
  const switchCamera = (kind: string, tell = true) => {
    if (!eyeView || kind === live.kind) return;
    const from = { position: camera.position.clone(), quaternion: camera.quaternion.clone(), fov: camera.fov };
    const into = kind !== "character";
    live = { ...live, kind, ...(into ? { turn: headingOf(figure.heading) } : {}) };
    if (into) steady = null;
    switching = reduced.matches ? null : { from, into, at: performance.now() };
    helmetShare = into ? 0 : 1;
    canvas.dataset.camera = switching ? "switching" : kind;
    // Hand, keys and drag carry on: only the camera goes elsewhere.
    flight = null;
    placeEye();
    dressVisor();
    if (tell) start.onEye?.(live);
    draw();
    wake();
  };
  /**
   * On foot on the World page (W100; his: C there, "Builder camera ↔ character" and "Both"): where the builder's camera
   * was when C took the visitor down to the figure (`builder`), to go back to; and the flight back up there
   * (`unriding`: from where the camera was, how far into the helmet the eye was, to the builder's camera, and when).
   */
  let builder: { position: THREE.Vector3; target: THREE.Vector3; fov: number } | null = null;
  let unriding: {
    from: { position: THREE.Vector3; quaternion: THREE.Quaternion; fov: number };
    helmet: number;
    to: { position: THREE.Vector3; target: THREE.Vector3; fov: number; quaternion: THREE.Quaternion };
    at: number;
  } | null = null;
  /** Whether the visitor is on foot on a builder's page, or flying back up from it. */
  function onFoot() {
    return builder !== null || unriding !== null;
  }
  /** A page whose looked-round camera C takes down to the figure: the World page (W100). */
  const mayGoOnFoot = () => viewing === "world";
  /**
   * C on the World page (W100): the figure stands on the ground under what the builder's camera looks at, facing the
   * way it looks, and the camera flies down to the Character camera behind it on the Switch's spring. From there the
   * world is the visitor's, as at `/`: W A S D walk it, a drag goes round it, C goes into the helmet.
   */
  const goOnFoot = () => {
    const back = unriding ? { position: unriding.to.position, target: unriding.to.target, fov: unriding.to.fov } : { position: camera.position.clone(), target: look.target.clone(), fov: camera.fov };
    // The human placed nearest what the builder's camera looks at; with none placed there is no one to walk as.
    const nearest = walkable().sort((a, b) => back.target.distanceTo(new THREE.Vector3(a.x, a.y, a.z)) - back.target.distanceTo(new THREE.Vector3(b.x, b.y, b.z)))[0];
    if (!nearest) return;
    unriding = null;
    builder = back;
    const from = { position: camera.position.clone(), quaternion: camera.quaternion.clone(), fov: camera.fov };
    live = { ...settings.camera, kind: "character" };
    walkAs(nearest);
    eyeView = true;
    look.enabled = false;
    glide = null;
    flight = null;
    release = null;
    hand = null;
    keys.clear();
    keySpeed = NOWHERE;
    riseSpeed = 0;
    switching = null;
    // The figure is made now that the view is on foot; it stands, and the camera sets off from where it was, once it
    // is made, so the flight is whole.
    build();
    switching = reduced.matches ? null : { from, into: false, at: performance.now() };
    helmetShare = 0;
    canvas.dataset.camera = switching ? "switching" : "character";
    placeEye();
    draw();
    wake();
  };
  /**
   * C from the helmet on the World page, or Escape (W100): the camera flies back up to where the builder's camera was,
   * and it is the builder's again; the figure stays where it stood until the camera is there.
   */
  const leaveFoot = () => {
    if (!builder) return;
    const to = builder;
    builder = null;
    const from = { position: camera.position.clone(), quaternion: camera.quaternion.clone(), fov: camera.fov };
    const helmet = switching ? helmetShare : inHelmet() ? 1 : 0;
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(to.position, to.target, new THREE.Vector3(0, 1, 0)));
    eyeView = false;
    switching = null;
    hand = null;
    release = null;
    flight = null;
    keys.clear();
    keySpeed = NOWHERE;
    camera.up.set(0, 1, 0);
    unriding = { from, helmet, to: { ...to, quaternion }, at: performance.now() };
    canvas.dataset.camera = "switching";
    if (reduced.matches) unride(performance.now(), true);
    draw();
    wake();
  };
  /** A frame of the flight back up to the builder's camera (W100); at its end the builder's camera takes over. Whether it flew. */
  const unride = (now: number, end = false) => {
    if (!unriding) return false;
    const state = springAt({ x: 0, v: 0 }, 1, now - unriding.at, { response: live.switchResponse, bounce: live.switchBounce });
    if (end || springSettled(state, 1, 1e-3)) {
      const { to } = unriding;
      unriding = null;
      camera.position.copy(to.position);
      camera.fov = to.fov;
      camera.updateProjectionMatrix();
      look.target.copy(to.target);
      look.enabled = true;
      look.update();
      canvas.dataset.camera = "builder";
      // The figure goes back to being the human placed, where it was placed, and the air is the world's.
      walker = null;
      standY = 0;
      land();
      build();
      return true;
    }
    const share = state.x;
    camera.position.lerpVectors(unriding.from.position, unriding.to.position, share);
    camera.quaternion.slerpQuaternions(unriding.from.quaternion, unriding.to.quaternion, share);
    camera.fov = unriding.from.fov + (unriding.to.fov - unriding.from.fov) * share;
    camera.updateProjectionMatrix();
    helmetShare = Math.min(1, Math.max(0, unriding.helmet * (1 - share)));
    dressVisor();
    return true;
  };
  /**
   * C (W100): on the visitor's views, the View camera and the Character camera in turn; on the World page a step in at
   * a time, from the builder's camera down to the Character camera, into the helmet, and back up to the builder's.
   */
  const stepCamera = () => {
    if (!eyeView) return goOnFoot();
    if (builder && (live.kind !== "character" || figureConfig().shows === "skeleton")) return leaveFoot();
    switchCamera(live.kind === "character" ? "view" : "character");
  };
  /**
   * The keys' frame: the camera carried the way they point, picking up and losing speed over the Glide; in the helmet
   * with A and D to Turn, those turn the look at the Turn speed instead (W78); on a looked-round page E and Q raise and
   * lower it, as far as the world's floor and top let it. Whether it moved.
   */
  const walk = (now: number) => {
    if ((!eyeView && !roaming()) || (!keys.size && !keySpeed[0] && !keySpeed[1] && !riseSpeed)) {
      keysAt = 0;
      return false;
    }
    const dt = keysAt ? Math.min(64, now - keysAt) : 16;
    keysAt = now;
    const turning = eyeView && live.sideKeys === "turn";
    const turn = turning ? keysTurn(keys) : 0;
    if (turn) steerLook(turn * live.turnSpeed * (dt / 1000), 0);
    camera.getWorldDirection(direction);
    const walkingCamera = eyeView ? { ...live, keys: onFootSpeed() } : { ...live, turn: Math.atan2(direction.x, -direction.z) * 180 / Math.PI };
    keySpeed = steer(walkingCamera, keySpeed, keysWant(walkingCamera, keys, !turning), dt, reduced.matches);
    riseSpeed = eyeView ? 0 : steer(walkingCamera, [riseSpeed, 0], [keysRise(walkingCamera, keys), 0], dt, reduced.matches)[0];
    if (!keys.size && Math.hypot(keySpeed[0], keySpeed[1], riseSpeed) < 1e-6) {
      keySpeed = NOWHERE;
      riseSpeed = 0;
      return false;
    }
    if (eyeView) {
      walkTo(held(add(at, keySpeed, dt)));
      placeEye();
    } else {
      // Move the camera and what it looks at as one, so the view keeps at the world's round side, sliding along it.
      const [sx, sz] = slideInside([[camera.position.x, camera.position.z], [look.target.x, look.target.z]], [keySpeed[0] * dt, keySpeed[1] * dt], bounds());
      const sy = riseInside(camera.position.toArray(), look.target.toArray(), riseSpeed * dt, bounds());
      const shift = new THREE.Vector3(sx, sy, sz);
      camera.position.add(shift);
      look.target.add(shift);
      look.update();
      aim();
    }
    return true;
  };

  const ray = new THREE.Raycaster();
  const fly = () => {
    if (!flight || !eyeView) {
      flight = null;
      return;
    }
    const now = flightAt(flight.from, flight.to, performance.now() - flight.at, reduced.matches);
    if (now.done) flight = null;
    show(now.rig);
  };
  const flyTo = (to: Rig) => {
    flight = { from: fromLive(), to, at: performance.now() };
    wake();
  };
  /** Takes the camera to see a point of the world at the middle of its view, as it is: a journey, not a focus. */
  const travelTo = (x: number, z: number) => {
    if (roaming()) {
      const [sx, sz] = slideInside([[camera.position.x, camera.position.z], [look.target.x, look.target.z]], [x - look.target.x, z - look.target.z], bounds());
      const shift = new THREE.Vector3(sx, 0, sz);
      camera.position.add(shift);
      look.target.add(shift);
      look.update();
      aim();
      draw();
      return;
    }
    if (!eyeView) return;
    flyTo({ camera: fromLive().camera, at: held(overlooking(live, { x, z })) });
  };

  /**
   * How wide the view sees, either way from its middle, in the room the cards leave (`frame`'s shift of the picture): the narrower
   * half-angle, in radians, so a thing that fits it fits whole.
   */
  const halfView = () => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    const room = roomLeft(width, height);
    const across = room.right - room.left;
    const up = room.bottom - room.top;
    const half = Math.tan((camera.fov * Math.PI) / 360);
    return Math.max(0.05, Math.min(Math.atan((half * up) / height), Math.atan((half * Math.max(1, across)) / height)));
  };
  /**
   * Takes the camera to a sector's room (World.md W81; his: "once I create the sector and decide its location and its
   * dimensions, the camera should take me to that location"), *mine*, how: what it looks at goes to the room's middle,
   * never more than `FRAME_UP` over its floor, where what is built stands; the camera stands off it, the way it faced,
   * looking down `FRAME_LIFT`, far enough for every corner of the room to be in view, but never past `FRAME_INSIDE` of
   * the way to the world's side or top, so a room the size of the world is seen from inside it, clear of the cloud
   * walls. It glides there on the camera's Flight spring (`@no-origins/ui/lib/spring`), or is there at once (`instant`,
   * or under reduced motion); the hand, the wheel and the keys stop it where it is.
   */
  const frameRoom = (room: Room, instant = false) => {
    if (!roaming()) return;
    const middle = new THREE.Vector3((room.min[0] + room.max[0]) / 2, Math.min((room.min[1] + room.max[1]) / 2, room.min[1] + FRAME_UP), (room.min[2] + room.max[2]) / 2);
    let reach = 0;
    for (const x of [room.min[0], room.max[0]]) for (const y of [room.min[1], room.max[1]]) for (const z of [room.min[2], room.max[2]]) reach = Math.max(reach, middle.distanceTo(new THREE.Vector3(x, y, z)));
    const fits = Math.max(look.minDistance, (reach / Math.sin(halfView())) * FRAME_ROOM);
    const way = camera.position.clone().sub(look.target).setY(0);
    if (way.lengthSq() < 1e-9) way.set(0, 0, 1);
    way.normalize();
    // As far as fits, or as far as the world lets it stand clear of its side and top.
    const { diameter, height } = bounds();
    const standAt = (distance: number) => middle.clone().addScaledVector(way, Math.cos(FRAME_LIFT) * distance).setY(middle.y + Math.sin(FRAME_LIFT) * distance);
    let distance = fits;
    for (let i = 0; i < 80; i++) {
      const at = standAt(distance);
      if (Math.hypot(at.x, at.z) <= (diameter / 2) * FRAME_INSIDE && at.y <= height * FRAME_INSIDE) break;
      distance *= 0.95;
    }
    const position = standAt(Math.max(look.minDistance, distance));
    look.maxDistance = Math.max(bounds().diameter, distance * 1.5);
    const held = lookingOverPlane(position.toArray(), middle.toArray(), bounds());
    const to = { position: new THREE.Vector3(...held.position), target: new THREE.Vector3(...held.target) };
    if (instant || reduced.matches) {
      glide = null;
      camera.position.copy(to.position);
      look.target.copy(to.target);
      look.update();
      draw();
      return;
    }
    glide = { from: { position: camera.position.clone(), target: look.target.clone() }, to, at: performance.now() };
    wake();
  };
  /** The glide, a frame of it: the camera and what it looks at, the spring's share of the way there. */
  const glideOn = () => {
    if (!glide) return;
    const state = springAt({ x: 0, v: 0 }, 1, performance.now() - glide.at, { response: settings.camera.flyResponse, bounce: settings.camera.flyBounce });
    const done = springSettled(state, 1, 1e-3);
    const share = done ? 1 : state.x;
    camera.position.lerpVectors(glide.from.position, glide.to.position, share);
    look.target.lerpVectors(glide.from.target, glide.to.target, share);
    look.update();
    if (done) glide = null;
  };

  // The keys: held arrows and W A S D carry the camera, unless they are typing or working a control on the card.
  const busy = () => {
    const active = document.activeElement;
    return active instanceof HTMLElement && active !== canvas && active !== document.body && (active.isContentEditable || active.closest("input, textarea, select, [role='slider'], [role='radio'], [role='listbox'], [role='menu'], [data-world-aside], [data-slot='sidebar']") !== null);
  };
  const keyDown = (event: KeyboardEvent) => {
    if (!eyeView && !roaming()) return;
    // A move by G (W88): X, Y or Z keeps it to that axis, again lets it go free; Enter keeps it, Escape puts it back.
    if (viewing === "spaces" && moving && moving.pointer === null && !busy()) {
      const axis = ({ KeyX: "x", KeyY: "y", KeyZ: "z" } as const)[event.code as "KeyX" | "KeyY" | "KeyZ"];
      if (axis || event.key === "Enter" || event.key === "Escape") event.preventDefault();
      // A way it does not move (a grove's up, W91) is not kept to.
      if (axis && (moving.target.axes ?? AXES).includes(axis)) {
        moving.axis = moving.axis === axis ? null : axis;
        if (pointer) showMove(pointer.x, pointer.y);
        gizmoPart();
        return draw();
      }
      if (event.key === "Enter") return endMove(true);
      if (event.key === "Escape") return endMove(false);
    }
    // A turn by R (W93): X, Y or Z keeps it to that axis of the world, again lets it go; Enter keeps it, Escape puts it back.
    if (viewing === "spaces" && turning && !busy()) {
      const axis = ({ KeyX: "x", KeyY: "y", KeyZ: "z" } as const)[event.code as "KeyX" | "KeyY" | "KeyZ"];
      if (axis || event.key === "Enter" || event.key === "Escape") event.preventDefault();
      if (axis) {
        turning.axis = turning.axis === axis ? null : axis;
        if (pointer) showTurn(pointer.x, pointer.y, turning.fine);
        return;
      }
      if (event.key === "Enter") return endTurn(true);
      if (event.key === "Escape") return endTurn(false);
    }
    const bare = !event.metaKey && !event.ctrlKey && !event.altKey;
    // C switches the camera (W100): View and Character in turn, and on the World page down to them and back up.
    if ((eyeView || mayGoOnFoot()) && event.code === "KeyC" && bare && !busy()) {
      event.preventDefault();
      if (!event.repeat) stepCamera();
      return;
    }
    if (viewing === "spaces" && event.code === "KeyG" && bare && !moving && !turning && !busy() && grabPicked()) return event.preventDefault();
    if (viewing === "spaces" && event.code === "KeyR" && bare && !moving && !turning && !busy() && turnPicked()) return event.preventDefault();
    // V picks the Select tool and P the Place tool (W93, his), as a click on Build's Tool does; a pipe or a road being
    // drawn ends as another Tool ends it.
    const tool = ({ KeyV: "select", KeyP: "place" } as const)[event.code as "KeyV" | "KeyP"];
    if (viewing === "spaces" && tool && bare && !moving && !turning && !busy()) {
      event.preventDefault();
      if (settings.build.tool !== tool) start.onTool?.(tool);
      return;
    }
    // Enter ends a pipe or a road being drawn (W93), as a click on its last joint does.
    if (event.key === "Enter" && viewing === "spaces" && drawing && !busy()) {
      event.preventDefault();
      return void endDrawing();
    }
    // Escape in a field on the card lets the typing go, and nothing else (his pick stays, the camera stays).
    if (event.key === "Escape") {
      if (busy()) return;
      // On foot on the World page, Escape goes back up to the builder's camera (W100).
      if (builder) return void leaveFoot();
      // A pipe or a road being drawn ends first, kept as drawn (W93), then a joint picked is let go, then what is picked (W84).
      if (viewing === "spaces" && drawing) return void endDrawing();
      if (viewing === "spaces" && settings.place.picked && settings.place.joint !== null && pickedSkeleton()) return start.onPick?.(settings.place.picked, null);
      if (viewing === "spaces" && settings.place.picked) return start.onPick?.(null);
      if (building()?.picked.length) return start.onPickBlocks?.([]);
      return;
    }
    // Backspace or Delete removes the element picked, or the blocks picked, unless a field on the card is being typed in;
    // while a pipe or a road is being drawn, it takes its last joint back (W93).
    if (event.key === "Backspace" || event.key === "Delete") {
      if (viewing === "spaces" && drawing && !busy()) {
        event.preventDefault();
        return void takeBack();
      }
      const element = viewing === "spaces" ? settings.place.picked : null;
      if (element && !busy()) {
        event.preventDefault();
        // A joint picked is taken out of its skeleton, never below its start and its end (W84); else the element goes.
        const held = pickedSkeleton();
        const joint = settings.place.joint;
        if (held && joint !== null) {
          if (held.joints.length > 2) start.onWorld?.(withSkeleton(settings.world, held.asset.id, withoutJoint(held.joints, held.ways, joint)));
          return start.onPick?.(held.asset.id, null);
        }
        start.onWorld?.(withoutAsset(settings.world, element));
        return start.onPick?.(null);
      }
      const made = building();
      if (!made?.picked.length || busy()) return;
      event.preventDefault();
      return made.removePicked();
    }
    // Space jumps the visitor, and twice flies it, or lands it; Shift runs it, and in flight sinks it (`air.ts`).
    if (eyeView && (event.code === "Space" || event.code === "ShiftLeft" || event.code === "ShiftRight") && !event.metaKey && !event.ctrlKey && !event.altKey && !busy()) {
      event.preventDefault();
      if (event.code === "Space" && !event.repeat) {
        const twice = event.timeStamp - spaceAt <= (air ?? (air = readAirMotion(canvas))).tap;
        spaceAt = twice ? -Infinity : event.timeStamp;
        if (twice) takeOff();
        else jump();
      }
      keys.add(event.code);
      flight = null;
      glide = null;
      release = null;
      wake();
      return;
    }
    // E and Q are a looked-round page's alone: the visitor walks on the ground.
    const moves = movesCamera(event.code) || (!eyeView && risesCamera(event.code));
    if (event.metaKey || event.ctrlKey || event.altKey || !moves || busy()) return;
    event.preventDefault();
    keys.add(event.code);
    // A key stops a flight where it is, a glide, and a drag carrying on.
    flight = null;
    glide = null;
    release = null;
    wake();
  };
  const keyUp = (event: KeyboardEvent) => {
    keys.delete(event.code);
  };
  const letKeysGo = () => keys.clear();

  const grab = (event: PointerEvent) => {
    if (!eyeView || hand || event.button !== 0) return;
    canvas.setPointerCapture(event.pointerId);
    // The world takes the keys from here: whatever on the card held them lets them go.
    canvas.focus({ preventScroll: true });
    const from = { x: event.clientX, y: event.clientY, at: event.timeStamp };
    hand = { id: event.pointerId, x: event.clientX, y: event.clientY, at: event.timeStamp, speed: NOWHERE, from, far: 0 };
    // The hand stops a flight where it is, and a drag carrying on.
    release = null;
    flight = null;
    heldAt = at;
    slid = NOWHERE;
  };
  /**
   * Whether a drag looks round rather than sliding over the ground: with Steering's Drag on Look (W78), in the helmet,
   * and from the Character camera, going round the figure (W100).
   */
  const draggingLooks = () => eyeView && live.drag === "look";
  const drag = (event: PointerEvent) => {
    if (!eyeView || !hand || event.pointerId !== hand.id) return;
    if (draggingLooks()) {
      const far = Math.max(hand.far, Math.hypot(event.clientX - hand.from.x, event.clientY - hand.from.y));
      const [dx, dy] = [event.clientX - hand.x, event.clientY - hand.y];
      hand = { ...hand, x: event.clientX, y: event.clientY, at: event.timeStamp, far };
      // Within a few pixels of where it went down, the hand is clicking, not dragging: the look stays.
      if (far < CLICK_REACH) return;
      // Unreversed, the hand carries the world with it, as a drag over the ground did: a drag to the right turns the
      // look left, a drag down looks up.
      const degrees = live.lookSpeed / 100;
      steerLook((live.reverseAcross ? dx : -dx) * degrees, (live.reverseUpDown ? dy : -dy) * degrees);
      draw();
      return;
    }
    const step = slideOf(live, camera.fov, canvas.clientHeight, event.clientX - hand.x, event.clientY - hand.y);
    // The hand's speed (metres a ms), smoothed over its last few moves: what carries on when it lets go.
    const dt = Math.max(1, event.timeStamp - hand.at);
    const speed = add([hand.speed[0] * 0.6, hand.speed[1] * 0.6], step, 0.4 / dt);
    const far = Math.max(hand.far, Math.hypot(event.clientX - hand.from.x, event.clientY - hand.from.y));
    hand = { ...hand, x: event.clientX, y: event.clientY, at: event.timeStamp, speed, far };
    // Within a few pixels of where it went down, the hand is clicking, not dragging: the camera stays.
    if (far < CLICK_REACH) return;
    slideTo(add(slid, step));
    draw();
    wake();
  };
  const letGo = (event: PointerEvent) => {
    if (!hand || event.pointerId !== hand.id) return;
    // A click carries nothing on (the portal it once flew to went with W93).
    if (hand.far < CLICK_REACH && event.type === "pointerup" && event.timeStamp - hand.from.at < CLICK_TIME) {
      hand = null;
      return;
    }
    // A look ends where the hand lets go; the eye comes round over the Smoothing.
    if (draggingLooks()) {
      hand = null;
      return;
    }
    // A hand that came to a stop before letting go carries nothing on.
    const still = event.timeStamp - hand.at > 80;
    release = { at: performance.now(), from: slid, speed: still ? NOWHERE : hand.speed };
    hand = null;
    wake();
  };
  /**
   * The pointer over the world, for the head that looks at it (Looks at cursor): each move turns the standing figure's
   * head and draws; a figure in motion takes the pointer at its next frame. Off the world (the card, the sidebar, the
   * window's edge) the head is held in its Expression again.
   */
  const glance = () => {
    if (!human || !figureConfig().looksAtCursor) return;
    if (viewing === "human") {
      if (settings.human.moves !== "still" || clayAir?.active) return;
      placeStatue();
    } else if (eyeView) {
      if (figureAt) return;
      placeEye();
    } else placeFigure();
    draw();
  };
  const follow = (event: PointerEvent) => {
    pointer = { x: event.clientX, y: event.clientY };
    glance();
  };
  const unfollow = () => {
    pointer = null;
    glance();
  };
  canvas.tabIndex = 0;
  canvas.addEventListener("pointerdown", grab);
  canvas.addEventListener("pointermove", drag);
  canvas.addEventListener("pointerup", letGo);
  canvas.addEventListener("pointercancel", letGo);
  // A press on a joint of the picked pipe or road is caught first (W84), then an Option-drag's (W83), then a press on a
  // placed element, before the controls see it (World.md W73).
  canvas.addEventListener("pointerdown", pressToMove, { capture: true });
  canvas.addEventListener("pointermove", moveToMove, { capture: true });
  canvas.addEventListener("pointerup", releaseToMove, { capture: true });
  canvas.addEventListener("pointercancel", releaseToMove, { capture: true });
  canvas.addEventListener("pointerdown", pressToShape, { capture: true });
  canvas.addEventListener("pointermove", moveToShape, { capture: true });
  canvas.addEventListener("pointerup", releaseToShape, { capture: true });
  canvas.addEventListener("pointercancel", releaseToShape, { capture: true });
  canvas.addEventListener("pointerdown", pressToRise, { capture: true });
  canvas.addEventListener("pointermove", moveToRise, { capture: true });
  canvas.addEventListener("pointerup", releaseToRise, { capture: true });
  canvas.addEventListener("pointercancel", releaseToRise, { capture: true });
  canvas.addEventListener("pointerdown", pressToPlace, { capture: true });
  canvas.addEventListener("pointermove", moveToPlace);
  canvas.addEventListener("pointerup", releaseToPlace);
  canvas.addEventListener("pointercancel", releaseToPlace);
  canvas.addEventListener("pointerleave", leavePlace);
  canvas.addEventListener("pointerdown", pressToBuild);
  canvas.addEventListener("pointermove", hoverToBuild);
  canvas.addEventListener("pointerup", clickToBuild);
  canvas.addEventListener("pointercancel", clickToBuild);
  canvas.addEventListener("pointerleave", leaveBuild);
  canvas.addEventListener("pointermove", follow);
  canvas.addEventListener("pointerleave", unfollow);
  // Caught on the way down, before the page's own keys: D walks the camera here, so it must not also flip the theme
  // (the design system's `d`, which leaves a key already taken).
  window.addEventListener("keydown", keyDown, { capture: true });
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", letKeysGo);

  let viewing = start.view;
  /** Shows a view from its settings. `keepFocus`: the same view, its camera's settings changed, where the visitor has travelled. */
  const setView = (name: ViewName, keepFocus = false) => {
    if (name !== "human") {
      clayAir = null;
      human?.flight(null);
      delete canvas.dataset.clayFlight;
      delete canvas.dataset.clayHeight;
    }
    viewing = name;
    // A new view is never on foot (W100).
    if (!keepFocus) {
      builder = null;
      unriding = null;
    }
    const view = viewFor(name, settings.camera);
    if (camera.fov !== view.fov) {
      camera.fov = view.fov;
      camera.updateProjectionMatrix();
    }
    // A view that looks at something steps back on a narrow screen, so all of it fits across.
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const back = view.look ? Math.min(2, Math.max(1, 0.8 / aspect)) : 1;
    look.target.set(...view.target);
    camera.position.set(...view.position).sub(look.target).multiplyScalar(back).add(look.target);
    // A drag may go twice as far back as the view stands, and never nearer than a metre; on a page that is travelled
    // over, as far as across the world.
    const roams = roaming();
    look.maxDistance = roams ? bounds().diameter : Math.max(12, 2 * camera.position.distanceTo(look.target));
    look.enabled = view.look;
    look.enablePan = roams;
    // W26: Environment can inspect the sky. holdLook still keeps the eye above ground and inside the square.
    look.maxPolarAngle = !view.look || name === "environment" || name === "clouds" || name === "world" || name === "spaces" ? Math.PI - 0.05 : Math.PI / 2 - 0.05;
    holdLook();
    look.update();
    // Every view is dragged: a jig's page round what it looks at, the visitor's camera over the ground. The pointer is
    // the design system's ring over all of it (Grid.md D34, World.md W10): the world sets no cursor of its own.
    eyeView = !view.look;
    // A page that is looked round keeps the world's up; only the helmet's eye tilts.
    if (!eyeView) camera.up.set(0, 1, 0);
    // A new view opens in its settings' camera; the same view, its settings changed, keeps the camera C switched to
    // (W100) and its glide.
    live = keepFocus ? { ...settings.camera, kind: live.kind } : settings.camera;
    if (!keepFocus) switching = null;
    canvas.dataset.camera = !eyeView ? "builder" : switching ? "switching" : live.kind;
    // A new view starts with the visitor on its cell, the human standing there facing the camera's way; the same view
    // with new settings stays where the visitor has travelled.
    // The visitor is the first human placed in the world, where it stands, facing its way; with none placed, the
    // start's figure on the visitor's cell (W100). The eye arrives where the head is held, not coming round from where
    // another view left it.
    if (!keepFocus) walkAs(eyeView ? walkable()[0] : undefined);
    heldAt = at;
    slid = NOWHERE;
    hand = null;
    release = null;
    flight = null;
    glide = null;
    keys.clear();
    keySpeed = NOWHERE;
    riseSpeed = 0;
    rising = null;
    if (eyeView) placeEye();
    findAsides();
    press = null;
    placePress = null;
    dragging = null;
    drawing = null;
    turning = null;
    build();
    draw();
  };

  build();
  setView(start.view);

  return {
    set(next) {
      const was = settings;
      settings = next;
      const moved = next.bounds !== was.bounds;
      // A world read after the view opened (W73, W100): a visitor not on foot on the World page walks as the first human
      // placed in it, where it stands, if that is another human than the one it walks as.
      if (eyeView && !builder && (next.world !== was.world || next.humanVariants !== was.humanVariants)) {
        const first = walkable()[0];
        if ((first?.asset.id ?? null) !== (walker?.id ?? null)) {
          walkAs(first);
          build();
          placeEye();
        }
      }
      if (moved || next.environment !== was.environment || next.mountains !== was.mountains || next.mountain !== was.mountain || next.humanVariants !== was.humanVariants || next.clouds !== was.clouds || next.human !== was.human || next.spaces !== was.spaces || next.world !== was.world) build();
      else if (next.build !== was.build || next.place !== was.place) tools();
      // New boundaries hold the camera inside them at once (W29), where it is, not where its view starts.
      if (moved) {
        if (roaming()) look.maxDistance = next.bounds.diameter;
        if (eyeView) {
          at = held(at);
          placeEye();
        } else {
          holdLook();
          look.update();
        }
      }

      // The eye is the camera's own: a new camera moves it where the view is the eye, unless it is the eye's own values
      // coming back from a drag (`onEye`, the camera's page writing them to its store). A page that is looked round keeps
      // where the hand left it.
      const echo =
        (hand !== null || release !== null || flight !== null || switching !== null) &&
        (Object.keys(next.camera) as (keyof CameraConfig)[]).every((key) => next.camera[key] === live[key]);
      // The camera's card picking the other camera switches to it as C does (W100), gliding there.
      const asked = eyeView && next.camera.kind !== was.camera.kind && next.camera.kind !== live.kind;
      // A new Turn turns the standing figure to face it: the eye in its helmet looks that way.
      if (eyeView && next.camera.turn !== was.camera.turn && figure.gait === "rest") figure = { ...figure, heading: next.camera.turn };
      const eyeMoved = next.camera !== was.camera && !echo && !viewFor(viewing, next.camera).look;
      if (eyeMoved) setView(viewing, true);
      else draw();
      if (asked) switchCamera(next.camera.kind, false);
    },
    travelTo,
    frame: frameRoom,
    setView,
    dispose() {
      cancelAnimationFrame(frameRequest);
      cancelAnimationFrame(drawRequest);
      document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("pointerdown", grab);
      canvas.removeEventListener("pointermove", drag);
      canvas.removeEventListener("pointerup", letGo);
      canvas.removeEventListener("pointercancel", letGo);
      canvas.removeEventListener("pointerdown", pressToMove, { capture: true });
      canvas.removeEventListener("pointermove", moveToMove, { capture: true });
      canvas.removeEventListener("pointerup", releaseToMove, { capture: true });
      canvas.removeEventListener("pointercancel", releaseToMove, { capture: true });
      canvas.removeEventListener("pointerdown", pressToShape, { capture: true });
      canvas.removeEventListener("pointermove", moveToShape, { capture: true });
      canvas.removeEventListener("pointerup", releaseToShape, { capture: true });
      canvas.removeEventListener("pointercancel", releaseToShape, { capture: true });
      canvas.removeEventListener("pointerdown", pressToRise, { capture: true });
      canvas.removeEventListener("pointermove", moveToRise, { capture: true });
      canvas.removeEventListener("pointerup", releaseToRise, { capture: true });
      canvas.removeEventListener("pointercancel", releaseToRise, { capture: true });
      canvas.removeEventListener("pointerdown", pressToPlace, { capture: true });
      canvas.removeEventListener("pointermove", moveToPlace);
      canvas.removeEventListener("pointerup", releaseToPlace);
      canvas.removeEventListener("pointercancel", releaseToPlace);
      canvas.removeEventListener("pointerleave", leavePlace);
      canvas.removeEventListener("pointerdown", pressToBuild);
      canvas.removeEventListener("pointermove", hoverToBuild);
      canvas.removeEventListener("pointerup", clickToBuild);
      canvas.removeEventListener("pointercancel", clickToBuild);
      canvas.removeEventListener("pointerleave", leaveBuild);
      canvas.removeEventListener("pointermove", follow);
      canvas.removeEventListener("pointerleave", unfollow);
      window.removeEventListener("keydown", keyDown, { capture: true });
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", letKeysGo);
      resize.disconnect();
      interfaceChanged.disconnect();
      look.dispose();
      canvas.style.removeProperty("cursor");
      for (const { object } of parts.values()) dispose(object);
      renderer.dispose();
    },
  };
}

/**
 * How a sector's room is seen (W81, mine): from a fifth further than it takes to fit, 30° above level, looking at its
 * middle no more than 50 m over its floor, and from no further out than four fifths of the way to the world's side or top.
 */
const FRAME_ROOM = 1.2;
const FRAME_LIFT = (30 * Math.PI) / 180;
const FRAME_UP = 50;
const FRAME_INSIDE = 0.8;

/** How far a hand may move, in pixels, and how long it may stay down, in ms, and still be clicking rather than dragging. */
const CLICK_REACH = 5;
const CLICK_TIME = 500;
/** How near a press must be to a pipe's or a road's joint on the screen, in pixels, to take hold of it (W84). */
const JOINT_REACH = 16;
/** How near a press must be to a gizmo's arrow on the screen, in pixels, to take hold of it (W88). */
const ARROW_REACH = 9;
/** How long the visitor's speed is measured over for the human's stride, in ms: a few of a hand's moves. */
const STRIDE_WINDOW = 100;
/** The ring round a placed human's feet, under the pointer and picked, in metres (W89, mine): its stance and a little. */
const HUMAN_RING = 0.8;

/**
 * The turn that faces from a point to another, in degrees round from north (−z) towards east (+x), as the visitor's
 * heading is: a placed human faces its sector's middle (W89, mine); at the middle, north.
 */
function facing(x: number, z: number, towardsX: number, towardsZ: number): number {
  const dx = towardsX - x;
  const dz = towardsZ - z;
  if (Math.hypot(dx, dz) < 1e-6) return 0;
  return ((((Math.atan2(dx, -dz) * 180) / Math.PI) % 360) + 360) % 360;
}

/** Frees what a built object holds on the GPU. */
function dispose(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
      // A skinned part (the human's look) keeps its bones' texture on its skeleton.
      if (child instanceof THREE.SkinnedMesh) child.skeleton.dispose();
      child.geometry.dispose();
      (Array.isArray(child.material) ? child.material : [child.material]).forEach((material) => material.dispose());
    }
  });
}
