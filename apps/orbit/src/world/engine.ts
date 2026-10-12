import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { buildClouds, type BuiltClouds } from "./build-clouds";
import { cloudPass } from "./cloud-pass";
import { buildBlocks, buildGhost } from "./build-blocks";
import { buildOrbit, type BuiltOrbit } from "./build-orbit";
import { buildPortal, type BuiltPortal } from "./build-portal";
import { eyeOf, fovOf, MOVED_KEYS, overlooking, startAt, type CameraConfig, type EyeValues, type Ground } from "./camera";
import type { EnvironmentConfig } from "./environment";
import { flightAt, focusOn, portalUnder, type Rig } from "./focus";
import type { Where } from "./map";
import { add, keysWant, movesCamera, NOWHERE, releasedAt, slideOf, steer } from "./movement";
import { edgesOf, onPlane, lookingOverPlane, overGroundPlane, type WorldSize } from "./orbit";
import { boxesOf, boxUnder, inside, occupancyOf, originsOf, pickedZone, placeUnder, withBlockAt, withoutAsset, type Box, type Place, type WorldData } from "./hierarchy";
import type { BuildState, SectorConfig } from "./sector";
import { cutOf, drawWaves, type PortalConfig, type Waves } from "./portal";
import { AHEAD, centreOf, PORTAL_STAND, PORTAL_TOP, portalsOn, viewFor, type ViewName } from "./start";

/**
 * What the world is drawn from: its boundaries (`bounds`, World.md W29) and each jig's settings (W14), his or someone's
 * at play on a jig's page; what is built (`world`, W25), and how it is being built (`build`, on the sector's page).
 */
export type WorldSettings = {
  bounds: WorldSize;
  portal: PortalConfig;
  environment: EnvironmentConfig;
  camera: CameraConfig;
  sector: SectorConfig;
  world: WorldData;
  build: BuildState;
};

export type WorldEngine = {
  /** Draws the world from new settings: what changed is made anew; a new camera moves the eye on a view that is it. */
  set(settings: WorldSettings): void;
  /** Plays the portals' opening from the start (`portal.ts`). */
  open(): void;
  /** The map's asks (`minimap.tsx`): fly the camera to a portal, as a click on it does; take it to a point of the world. */
  focusPortal(index: number): void;
  travelTo(x: number, z: number): void;
  setView(name: ViewName): void;
  dispose(): void;
};

/**
 * The world's engine (World.md W12): the renderer, the scene and the camera, made once for the canvas and kept for as
 * long as the page is open (W2). It draws only when something changes (W8): a resize, a new setting, a new view, a
 * drag. Three.js's WebGPU renderer falls back to WebGL 2 by itself (W9).
 *
 * The world is the Orbit (`orbit.ts`, `build-orbit.ts`): its open square, the clouds above it and what is built in it,
 * the hierarchy's blocks (`hierarchy.ts`, `build-blocks.ts`), each zone's made apart, so a click remakes only its own.
 * There is no ground plane (World.md W24). What is built is his everywhere, someone's at play on the sector's page.
 * Every camera stays over the world's square (W23), however it is moved. The portal is an element, not a part of the
 * environment: it stands only on its own page (`portalsOn`), on a block of its own, cut into its top.
 * On the sector's page a click builds: it places a block of the builder's size and colour into the zone picked where
 * the pointer shows one, or takes one away, and the page's store keeps the world (`onWorld`).
 *
 * A portal opens as it arrives, when its page is opened, and again when `open` is asked; under reduced motion it arrives
 * open (W11). On a view that is the visitor's camera, a drag, the arrows and W A S D move it over the ground
 * (`movement.ts`), and a click on a portal flies it to the portal (`focus.ts`). While a portal opens, the camera moves
 * or flies, the world draws every frame, and stops once everything rests.
 *
 * The canvas says when its first frame is drawn (`data-ready`), on which backend (`data-backend`), while the portals
 * are opening (`data-opening`), and which portal the eye is on (`data-focus`), for the review.
 */
export async function createWorld(
  canvas: HTMLCanvasElement,
  start: {
    settings: WorldSettings;
    view: ViewName;
    /** Hears the camera's values (and its zoom) as the hand moves them, so the camera's card can show them moving. */
    onEye?: (eye: EyeValues & { zoom: number }) => void;
    /** Hears where the camera is, each time it moves, for the map. */
    onWhere?: (where: Where) => void;
    /** Hears the world as a click on the sector's page builds a block into a zone or takes one away, to store. */
    onWorld?: (world: WorldData) => void;
  },
): Promise<WorldEngine> {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
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
  const atmospherePass = cloudPass(renderer, scene);

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

  // A jig's page lays its card over the world (`data-world-aside`): its view centres what it looks at in the room
  // the card leaves, right of it on a wide screen, above it on a phone, by shifting the picture, never the camera. The
  // camera's page too: the eye's picture is shifted, so what it centres (a portal flown to) is in the middle of the room.
  let aside: HTMLElement | null = null;
  const frame = (width: number, height: number) => {
    if (!aside?.isConnected) return camera.clearViewOffset();
    const box = aside.getBoundingClientRect();
    const field = canvas.getBoundingClientRect();
    const right = box.right - field.left;
    const top = box.top - field.top;
    if (right <= width / 2) camera.setViewOffset(width, height, -right / 2, 0, width, height);
    else if (top >= height / 3) camera.setViewOffset(width, height, 0, (height - top) / 2, width, height);
    else camera.clearViewOffset();
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
    clouds?.quality(atmospherePass.quality);
    atmospherePass.render(camera, clouds);
    canvas.dataset.cloudsReady = String(clouds?.ready ?? false);
    canvas.dataset.cloudFieldWidth = String(clouds?.fieldWidth ?? 0);
    canvas.dataset.cloudPixels = String(atmospherePass.stats.width * atmospherePass.stats.height);
    canvas.dataset.cloudRenders = String(atmospherePass.stats.renders);
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

  // The opening: when it set off, while it plays, and each portal's waves for it, drawn anew each time it opens. Each
  // frame poses every portal at the time since, until all rest.
  let settings = start.settings;
  let opening: number | null = null;
  let waves: Waves[] = [];
  let frameRequest = 0;
  const pose = () => {
    const t = opening === null ? Infinity : performance.now() - opening;
    const resting = portals.map((portal, i) => portal.pose(t, waves[i])).every(Boolean);
    if (opening !== null && resting) {
      opening = null;
      delete canvas.dataset.opening;
    }
  };
  // Independent sky and cloud clocks. Under reduced motion both hold still.
  // A hidden tab receives no RAF callbacks; elapsed time is capped on return, avoiding a catch-up jump.
  let orbit: BuiltOrbit | null = null;
  let clouds: BuiltClouds | null = null;
  let skyTime = 0;
  let cloudTime = 0;
  let flowAt = 0;
  let frameAverage = 16;
  let qualityAt = 0;
  let qualityFrames = 0;
  const flow = (now: number) => {
    const environment = settings.environment;
    if (environment.motion === "paused" || (!orbit?.flowing && !clouds?.flowing) || reduced.matches) {
      flowAt = 0;
      return false;
    }
    const elapsed = flowAt ? Math.min(100, now - flowAt) : 16;
    const seconds = elapsed / 1000;
    frameAverage += (elapsed - frameAverage) * 0.05;
    atmospherePass.cadence(elapsed, now);
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
    if (environment.cloudCoverage > 0 && environment.cloudFlow > 0) cloudTime += seconds * environment.cloudSpeed;
    flowAt = now;
    orbit?.flow(skyTime);
    clouds?.flow(cloudTime);
    return true;
  };
  // One frame loop for whatever moves: an opening, a drag carrying on after the hand let go, the keys, a flight, the atmosphere.
  const tick = () => {
    frameRequest = 0;
    if (document.hidden) return;
    if (opening !== null) pose();
    if (release) carryOn();
    if (flight) fly();
    const now = performance.now();
    const walking = walk(now);
    const flowing = flow(now);
    draw();
    if (opening !== null || release || flight || walking || flowing) frameRequest = requestAnimationFrame(tick);
  };
  const wake = () => {
    if (!frameRequest && !document.hidden) frameRequest = requestAnimationFrame(tick);
  };
  const visibility = () => {
    cancelAnimationFrame(frameRequest); frameRequest = 0; cancelAnimationFrame(drawRequest); drawRequest = 0; flowAt = 0;
    if (!document.hidden) wake();
  };
  document.addEventListener("visibilitychange", visibility);
  const open = () => {
    cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    waves = portals.map(() => drawWaves(settings.portal));
    opening = performance.now();
    canvas.dataset.opening = "true";
    tick();
  };

  // What the world is made of, each part made anew only when what it is made from changes: the Orbit round it (the
  // sky); on the portal's page, the portal on its cell and its block, posed where the opening is if it is playing (a
  // portal keeps its waves, and one new draws its own); and what is built, a part a zone.
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
  let portals: BuiltPortal[] = [];
  // What is built where it stands, in the world, on its square, and the lattice's steps it fills: worked out once a world.
  let builtFor: { world: WorldData; bounds: WorldSize; boxes: Box[]; taken: Map<string, string> } | null = null;
  const built = () => {
    if (builtFor?.world !== settings.world || builtFor.bounds !== settings.bounds) {
      const boxes = boxesOf(settings.world).filter((box) => inside(box, settings.bounds));
      builtFor = { world: settings.world, bounds: settings.bounds, boxes, taken: occupancyOf(boxes) };
    }
    return builtFor;
  };
  const build = () => {
    const { portal, environment, sector } = settings;
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
      environment.sunTurn, environment.shade, environment.grainSize];
    const cells = portalsOn(viewing);
    part("orbit", JSON.stringify(atmosphere), () => {
      orbit = buildOrbit(environment);
      orbit.flow(skyTime);
      return orbit.object;
    });
    orbit?.set(environment);
    // Cloud shape changes do not recreate the ground, sky or portals.
    part("clouds", "continuous-sky-v17", () => {
      clouds = buildClouds(environment, wake);
      clouds.flow(cloudTime);
      return clouds.object;
    });
    clouds?.set(environment);
    // The portal, on its page alone, standing on its block, its collar the block's colour (World.md W24).
    part("land", JSON.stringify([portal, cells]), () => {
      portals = cells.map((cell) => {
        const { x, z } = centreOf(cell);
        const made = buildPortal(portal, PORTAL_STAND.colour);
        made.object.position.set(x, PORTAL_TOP, z);
        return made;
      });
      waves = cells.map((_, i) => waves[i] ?? drawWaves(portal));
      const land = new THREE.Group();
      for (const made of portals) land.add(made.object);
      return land;
    });
    // What is built, on every view: his, or someone's at play on the sector's page; a part a zone, so a block placed
    // remakes its zone alone. Each block its own colour, lit by the environment's sun, a top cut round a portal on it.
    const cuts = cells.map((cell) => ({ ...centreOf(cell), y: PORTAL_TOP, radius: cutOf(portal) }));
    const grain = { grain: sector.grain, grainSize: sector.grainSize };
    const look = JSON.stringify([grain, ...atmosphere, cuts]);
    part("stand", cells.length ? look : null, () => buildBlocks([PORTAL_STAND], environment, cuts, grain));
    const zones = new Map<string, Box[]>();
    for (const box of built().boxes) zones.set(box.zone, [...(zones.get(box.zone) ?? []), box]);
    for (const name of parts.keys()) if (name.startsWith("zone ") && !zones.has(name.slice(5))) part(name, null, () => new THREE.Group());
    for (const [zone, boxes] of zones) part(`zone ${zone}`, JSON.stringify([boxes, look]), () => buildBlocks(boxes, environment, cuts, grain));
    tools();
    pose();
    // A flowing atmosphere keeps the frames coming.
    if (orbit?.flowing || clouds?.flowing) wake();
  };

  // Building, on the sector's page (`sector.ts`, Build, World.md W24, W25): where the pointer would build, a block of
  // the builder's size placed against a face or on the level's floor, or a block taken away (`placeUnder`, `boxUnder`),
  // a ghost showing which. A click does it, into the zone picked, and the page's store keeps the world (`onWorld`).
  type Building = {
    /** The level placed on, in the world's levels: the builder's, over the picked zone's origin. */
    level: number;
    size: readonly [number, number, number];
    tool: string;
    place(at: Place): void;
    take(box: Box): void;
  };
  const building = (): Building | null => {
    if (viewing !== "sector") return null;
    const { world, build } = settings;
    const zone = pickedZone(world, build.zone);
    const origin = originsOf(world).get(zone.id) ?? [0, 0, 0];
    const size = [build.width, build.length, build.height] as const;
    return {
      level: origin[2] + build.level,
      size,
      tool: build.tool,
      place: (at) => start.onWorld?.(withBlockAt(world, zone.id, at, size, build.colour)),
      take: (box) => start.onWorld?.(withoutAsset(world, box.id)),
    };
  };
  /** A page that is looked round and travelled over, by the keys, a right-drag and the map: the environment's and the sector's. */
  const roaming = () => viewing === "environment" || viewing === "sector";
  let pointer: { x: number; y: number } | null = null;
  let press: { id: number; x: number; y: number; at: number } | null = null;
  const tools = () => aim();
  const rayAt = (x: number, y: number) => {
    const box = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((x - box.left) / box.width) * 2 - 1, -((y - box.top) / box.height) * 2 + 1), camera);
    return { origin: ray.ray.origin.toArray(), direction: ray.ray.direction.toArray() };
  };
  /**
   * What a click at a point of the view would build or take away, by the tool: a block placed, from its least corner to
   * its greatest, or the first block the pointer meets (one behind it is not reached).
   */
  const buildsAt = (x: number, y: number, made: Building): { from: Place; to: Place; box?: Box } | null => {
    const { origin, direction } = rayAt(x, y);
    const { boxes, taken } = built();
    if (made.tool === "remove") {
      const box = boxUnder(origin, direction, boxes)?.box;
      return box ? { from: box.from, to: box.to, box } : null;
    }
    const from = placeUnder(origin, direction, boxes, taken, made.level, made.size, bounds());
    return from ? { from, to: [from[0] + made.size[0], from[1] + made.size[1], from[2] + made.size[2]] } : null;
  };
  /** Shows where the pointer would build, if it is over the world on a page that builds and no hand is down. */
  const aim = () => {
    const made = building();
    const at = made && pointer && !press ? buildsAt(pointer.x, pointer.y, made) : null;
    part("ghost", made && at ? `${viewing} ${at.from} ${at.to} ${made.tool}` : null, () => buildGhost(at as { from: Place; to: Place }, made?.tool ?? "place"));
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
  const clickToBuild = (event: PointerEvent) => {
    if (!press || event.pointerId !== press.id) return;
    const { x, y, at } = press;
    press = null;
    const still = Math.hypot(event.clientX - x, event.clientY - y) < CLICK_REACH && event.timeStamp - at < CLICK_TIME;
    const made = building();
    if (made && still && event.type === "pointerup") {
      const at = buildsAt(event.clientX, event.clientY, made);
      if (at?.box) made.take(at.box);
      else if (at) made.place(at.from);
    }
    aim();
    draw();
  };

  const resize = new ResizeObserver(draw);
  resize.observe(canvas);

  // The camera's movement (`movement.ts`): on a view that is the visitor's camera, it keeps its height, angle and turn
  // (`live`) and moves over the ground (`at`: where it is, not a value). A drag slides it from where the hand took hold
  // (`heldAt`, by `slid`), carrying on or springing back once let go; the arrows and W A S D carry it while held. A click
  // on a portal flies it there (`focus.ts`), its values moving, each told (`onEye`) so on the camera's page the card
  // shows them moving. A jig's page that is looked round is OrbitControls' instead.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let eyeView = false;
  let live: CameraConfig = start.settings.camera;
  let at: Ground = startAt(live, [centreOf(AHEAD)]);
  let heldAt: Ground = at;
  let slid: Ground = NOWHERE;
  let hand: { id: number; x: number; y: number; at: number; speed: Ground; from: { x: number; y: number; at: number }; far: number } | null = null;
  let release: { at: number; from: Ground; speed: Ground } | null = null;
  // The keys held, the speed they carry the camera at (metres a ms), and when they last moved it.
  const keys = new Set<string>();
  let keySpeed: Ground = NOWHERE;
  let keysAt = 0;
  // A click's flight (`focus.ts`): from where the camera was to where it goes; and, while it is on a portal, which one
  // and where it came from, for the way back.
  let flight: { from: Rig; to: Rig; at: number } | null = null;
  let focused: { portal: number; before: Rig } | null = null;
  /** Where over the floor the camera may be: inside the world's width and breadth, independently of height. */
  const held = (next: Ground): Ground => overGroundPlane(next, bounds());
  const placeEye = () => {
    at = held(at);
    const eye = eyeOf(live, at);
    // Height is held between the world's floor and its top, on its own; the sides hold where it is over the floor.
    const position = onPlane(eye.position, bounds());
    const shift = [0, 1, 2].map((i) => position[i] - eye.position[i]) as [number, number, number];
    camera.position.set(...position);
    camera.lookAt(eye.target[0] + shift[0], eye.target[1] + shift[1], eye.target[2] + shift[2]);
    const fov = fovOf(live);
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

  };
  /** The camera now: its values as a flight left them, with its settings as they are set now, and where it is. */
  const fromLive = (): Rig => ({ camera: { ...settings.camera, ...Object.fromEntries(MOVED_KEYS.map((key) => [key, live[key]])) }, at });
  const show = (rig: Rig) => {
    live = rig.camera;
    at = rig.at;
    placeEye();
    start.onEye?.(live);
  };
  const slideTo = (next: Ground) => {
    slid = next;
    at = held(add(heldAt, slid));
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
  /** The keys' frame: the camera carried the way they point, picking up and losing speed over the Glide. Whether it moved. */
  const walk = (now: number) => {
    if ((!eyeView && !roaming()) || (!keys.size && !keySpeed[0] && !keySpeed[1])) {
      keysAt = 0;
      return false;
    }
    const dt = keysAt ? Math.min(64, now - keysAt) : 16;
    keysAt = now;
    camera.getWorldDirection(direction);
    const walkingCamera = eyeView ? live : { ...live, turn: Math.atan2(direction.x, -direction.z) * 180 / Math.PI };
    keySpeed = steer(walkingCamera, keySpeed, keysWant(walkingCamera, keys), dt, reduced.matches);
    if (!keys.size && Math.hypot(keySpeed[0], keySpeed[1]) < 1e-6) {
      keySpeed = NOWHERE;
      return false;
    }
    if (eyeView) {
      at = held(add(at, keySpeed, dt));
      placeEye();
    } else {
      // Clip translation as a unit so panning/travelling preserves the camera's view at the world's sides.
      const edge = edgesOf(bounds());
      const shift = new THREE.Vector3(keySpeed[0] * dt, 0, keySpeed[1] * dt);
      for (const axis of ["x", "z"] as const) {
        const lo = Math.min(camera.position[axis], look.target[axis]);
        const hi = Math.max(camera.position[axis], look.target[axis]);
        shift[axis] = Math.max(-edge[axis] - lo, Math.min(edge[axis] - hi, shift[axis]));
      }
      camera.position.add(shift);
      look.target.add(shift);
      look.update();
      aim();
    }
    return true;
  };

  // The portals' middles on the ground, and which one is under a point of the view (client pixels), if any.
  const centres = () => portalsOn(viewing).map((cell) => [centreOf(cell).x, 0, centreOf(cell).z] as const);
  const ray = new THREE.Raycaster();
  const portalAt = (x: number, y: number) => {
    const box = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((x - box.left) / box.width) * 2 - 1, -((y - box.top) / box.height) * 2 + 1), camera);
    const { origin, direction } = ray.ray;
    const reach = settings.portal.radius + settings.portal.rimWidth + 0.15;
    return portalUnder([origin.x, origin.y, origin.z], [direction.x, direction.y, direction.z], centres(), reach);
  };
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
  /** Flies the camera back to where it was before it went to a portal. */
  const goBack = () => {
    if (!focused) return;
    const { before } = focused;
    focused = null;
    delete canvas.dataset.focus;
    flyTo({ camera: { ...fromLive().camera, ...Object.fromEntries(MOVED_KEYS.map((key) => [key, before.camera[key]])) }, at: before.at });
  };
  /** Flies the camera to a portal; Escape, or a click on the ground, brings it back to where it was before the first. */
  const goToPortal = (portal: number) => {
    const thing = centres()[portal];
    if (!thing || (focused?.portal === portal && !flight)) return;
    focused = { portal, before: focused?.before ?? fromLive() };
    canvas.dataset.focus = String(portal);
    flyTo(focusOn(fromLive(), thing));
  };
  /** A click on a portal flies the camera to it; on anything else, back to where it was before the first. */
  const click = (x: number, y: number) => {
    const portal = portalAt(x, y);
    if (portal === null) return goBack();
    goToPortal(portal);
  };
  /** Takes the camera to see a point of the world at the middle of its view, as it is: a journey, not a focus. */
  const travelTo = (x: number, z: number) => {
    if (roaming()) {
      const edge = edgesOf(bounds());
      const shift = new THREE.Vector3(x - look.target.x, 0, z - look.target.z);
      for (const axis of ["x", "z"] as const) {
        const lo = Math.min(camera.position[axis], look.target[axis]);
        const hi = Math.max(camera.position[axis], look.target[axis]);
        shift[axis] = Math.max(-edge[axis] - lo, Math.min(edge[axis] - hi, shift[axis]));
      }
      camera.position.add(shift);
      look.target.add(shift);
      look.update();
      aim();
      draw();
      return;
    }
    if (!eyeView) return;
    focused = null;
    delete canvas.dataset.focus;
    flyTo({ camera: fromLive().camera, at: held(overlooking(live, { x, z })) });
  };

  // The keys: held arrows and W A S D carry the camera, unless they are typing or working a control on the card.
  const busy = () => {
    const active = document.activeElement;
    return active instanceof HTMLElement && active !== canvas && active !== document.body && (active.isContentEditable || active.closest("input, textarea, select, [role='slider'], [role='radio'], [role='listbox'], [role='menu'], [data-world-aside], [data-slot='sidebar']") !== null);
  };
  const keyDown = (event: KeyboardEvent) => {
    if (!eyeView && !roaming()) return;
    if (event.key === "Escape") return goBack();
    if (event.metaKey || event.ctrlKey || event.altKey || !movesCamera(event.code) || busy()) return;
    event.preventDefault();
    keys.add(event.code);
    // A key stops a flight where it is, and a drag carrying on.
    flight = null;
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
  const drag = (event: PointerEvent) => {
    if (!eyeView || !hand || event.pointerId !== hand.id) return;
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
  };
  const letGo = (event: PointerEvent) => {
    if (!hand || event.pointerId !== hand.id) return;
    if (hand.far < CLICK_REACH && event.type === "pointerup" && event.timeStamp - hand.from.at < CLICK_TIME) {
      hand = null;
      click(event.clientX, event.clientY);
      return;
    }
    // A hand that came to a stop before letting go carries nothing on.
    const still = event.timeStamp - hand.at > 80;
    release = { at: performance.now(), from: slid, speed: still ? NOWHERE : hand.speed };
    hand = null;
    wake();
  };
  canvas.tabIndex = 0;
  canvas.addEventListener("pointerdown", grab);
  canvas.addEventListener("pointermove", drag);
  canvas.addEventListener("pointerup", letGo);
  canvas.addEventListener("pointercancel", letGo);
  canvas.addEventListener("pointerdown", pressToBuild);
  canvas.addEventListener("pointermove", hoverToBuild);
  canvas.addEventListener("pointerup", clickToBuild);
  canvas.addEventListener("pointercancel", clickToBuild);
  canvas.addEventListener("pointerleave", leaveBuild);
  // Caught on the way down, before the page's own keys: D walks the camera here, so it must not also flip the theme
  // (the design system's `d`, which leaves a key already taken).
  window.addEventListener("keydown", keyDown, { capture: true });
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", letKeysGo);

  let viewing = start.view;
  /** The view last shown, so a page coming into view is told from the same page shown again. */
  let shown: ViewName | null = null;
  /** Shows a view from its settings. `keepFocus`: the same view, its camera's settings changed; a portal it is on stays its way back. */
  const setView = (name: ViewName, keepFocus = false) => {
    const arriving = name !== shown;
    viewing = name;
    shown = name;
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
    look.maxDistance = roams ? Math.max(bounds().width, bounds().breadth) : Math.max(12, 2 * camera.position.distanceTo(look.target));
    look.enabled = view.look;
    look.enablePan = roams;
    // W26: Environment can inspect the sky. holdLook still keeps the eye above ground and inside the square.
    look.maxPolarAngle = !view.look || name === "environment" ? Math.PI - 0.05 : Math.PI / 2 - 0.05;
    holdLook();
    look.update();
    // Every view is dragged: a jig's page round what it looks at, the visitor's camera over the ground. The pointer is
    // the design system's ring over all of it (Grid.md D34, World.md W10): the world sets no cursor of its own.
    eyeView = !view.look;
    live = settings.camera;
    // A new view starts seeing the cell two ahead; the same view with new settings stays where the visitor has travelled.
    if (!keepFocus) at = startAt(live, [centreOf(AHEAD)]);
    heldAt = at;
    slid = NOWHERE;
    hand = null;
    release = null;
    flight = null;
    keys.clear();
    keySpeed = NOWHERE;
    if (!keepFocus || !eyeView) {
      focused = null;
      delete canvas.dataset.focus;
    }
    if (eyeView) placeEye();
    if (aside) resize.unobserve(aside);
    aside = document.querySelector<HTMLElement>("[data-world-aside]");
    if (aside) resize.observe(aside);
    press = null;
    // What this view shows: the portal on its page alone.
    build();
    draw();
    // The portal opens as it arrives, its page coming into view.
    if (arriving && portals.length && !reduced.matches) open();
  };

  build();
  setView(start.view);

  return {
    set(next) {
      const was = settings;
      settings = next;
      const moved = next.bounds !== was.bounds;
      if (moved || next.portal !== was.portal || next.environment !== was.environment || next.sector !== was.sector || next.world !== was.world) build();
      else if (next.build !== was.build) aim();
      // New boundaries hold the camera inside them at once (W29), where it is, not where its view starts.
      if (moved) {
        if (roaming()) look.maxDistance = Math.max(next.bounds.width, next.bounds.breadth);
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
        (hand !== null || release !== null || flight !== null) &&
        (Object.keys(next.camera) as (keyof CameraConfig)[]).every((key) => next.camera[key] === live[key]);
      const eyeMoved = next.camera !== was.camera && !echo && !viewFor(viewing, next.camera).look;
      if (eyeMoved) setView(viewing, true);
      else draw();
    },
    open,
    focusPortal(index) {
      if (eyeView) goToPortal(index);
    },
    travelTo,
    setView,
    dispose() {
      cancelAnimationFrame(frameRequest);
      cancelAnimationFrame(drawRequest);
      document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("pointerdown", grab);
      canvas.removeEventListener("pointermove", drag);
      canvas.removeEventListener("pointerup", letGo);
      canvas.removeEventListener("pointercancel", letGo);
      canvas.removeEventListener("pointerdown", pressToBuild);
      canvas.removeEventListener("pointermove", hoverToBuild);
      canvas.removeEventListener("pointerup", clickToBuild);
      canvas.removeEventListener("pointercancel", clickToBuild);
      canvas.removeEventListener("pointerleave", leaveBuild);
      window.removeEventListener("keydown", keyDown, { capture: true });
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", letKeysGo);
      resize.disconnect();
      look.dispose();
      canvas.style.removeProperty("cursor");
      for (const { object } of parts.values()) dispose(object);
      atmospherePass.dispose();
      renderer.dispose();
    },
  };
}

/** How far a hand may move, in pixels, and how long it may stay down, in ms, and still be clicking rather than dragging. */
const CLICK_REACH = 5;
const CLICK_TIME = 500;

/** Frees what a built object holds on the GPU. */
function dispose(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
      child.geometry.dispose();
      (Array.isArray(child.material) ? child.material : [child.material]).forEach((material) => material.dispose());
    }
  });
}
