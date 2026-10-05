import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { buildHouse, doorLeaves, setDoorLeaf, type DoorLeaf } from "@/lib/build";
import { doorPlace, houseBounds, type House, type Look } from "@/lib/house";
import {
  alongLeg, easeInOut, legPath, pictureFrame, pictureShape, smoothstep, TOUR_MOTION, vec, walkProfile, type Leg, type Path, type Pose, type Tour,
} from "@/lib/tour";

/**
 * Where the tour is: the stop the camera is at or walking to (−1 at the long shot, before the first), whether it is
 * walking, playing, and how far along the whole tour it is.
 */
export type TourState = { stop: number; phase: "at" | "walk" | "ending"; playing: boolean; progress: number; completed: boolean; overview: boolean };

export type HomeViewer = {
  /** Go to one of the description's named views (H5). */
  view: (id: string) => void;
  /** Turn a look by an angle each way; the plan does not turn. */
  turn: (horizontal: number, vertical: number) => void;
  /** The tour (H9): play walks on from the stop the camera is at; pause finishes the leg it is on and waits; go walks to a neighbouring stop or cuts to a far one. */
  tour: { play: () => void; pause: () => void; go: (stop: number) => void; rate: (times: number) => void };
  dispose: () => void;
};

type Door = { leaves: THREE.Group[]; at: THREE.Vector3; normal: THREE.Vector2; open: number; target: number; side: 1 | -1 };
/**
 * A hung picture. `state`: its texture still coming, in, or not to be had (not published, or the sign-in lapsed); it
 * fades in only once it is in, so a stop never shows a blank plane. `wanted`: its stop is the one the camera is at.
 */
type Hung = {
  stop: number;
  mesh: THREE.Mesh;
  edge: THREE.LineLoop;
  material: THREE.MeshBasicMaterial;
  edges: THREE.LineBasicMaterial;
  opacity: number;
  target: number;
  state: "loading" | "ready" | "missing";
  wanted: boolean;
};
type Walk = { from: number; to: number; way: Leg; path: Path; start: number; pose: Pose; doors: string[] };

/**
 * The model on a canvas (Home.md H2): plain three.js, as the avatar viewer in `packages/ui` is mounted, rendering on
 * demand — a frame when the camera moves or the box resizes, none at rest — and every frame while the tour walks, a
 * door swings or a picture fades (H9). The canvas is clear, so the page's own colour is the sky; the house is lit by
 * one sun with shadows and the sky's light, nothing else.
 */
export function mountHomeViewer(
  canvas: HTMLCanvasElement,
  house: House,
  tour: Tour,
  on: { status: (ready: boolean) => void; moved?: () => void; tour?: (state: TourState) => void },
): HomeViewer {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const model = buildHouse(house);
  scene.add(model);
  const bounds = houseBounds(house);
  const centre = new THREE.Vector3((bounds.min[0] + bounds.max[0]) / 2, bounds.top / 2, (bounds.min[1] + bounds.max[1]) / 2);
  const extent = Math.max(bounds.max[0] - bounds.min[0], bounds.max[1] - bounds.min[1], bounds.top);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The sky's light, and a little from everywhere so a room the sun does not reach is still read.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8c8578, 1.4), new THREE.AmbientLight(0xffffff, 0.45));
  // A high sun, so a wall's shadow is a little over a third of its height and the plan stays readable.
  const sun = new THREE.DirectionalLight(0xfff4e6, 2.6);
  sun.position.copy(centre).add(new THREE.Vector3(-0.35, 1.6, 0.5).normalize().multiplyScalar(extent * 2));
  sun.target.position.copy(centre);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const reach = extent * 0.9;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -reach;
  sun.shadow.camera.right = sun.shadow.camera.top = reach;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = extent * 4;
  sun.shadow.normalBias = 0.05;
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);

  const look = new THREE.PerspectiveCamera(TOUR_MOTION.fov, 1, 0.5, extent * 20);
  const plan = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.5, extent * 20);
  let camera: THREE.Camera = look;
  let controls: OrbitControls | null = null;
  let disposed = false;
  let lost = false;
  let frame = 0;
  let loop = 0;

  // ── the tour's state ───────────────────────────────────────────────────────────────────────────────────────
  let at = 0;
  let playing = false;
  let completed = false;
  let thanksAt: number | null = null;
  let ending: { time: number; path: THREE.CatmullRomCurve3; rotation: THREE.Quaternion; targetRotation: THREE.Quaternion; viewHeight: number } | null = null;
  const roofFades: { object: THREE.Mesh | THREE.LineSegments; original: THREE.Material | THREE.Material[]; faded: THREE.Material | THREE.Material[] }[] = [];
  const restoreRoof = () => {
    for (const entry of roofFades) {
      entry.object.material = entry.original;
      for (const material of Array.isArray(entry.faded) ? entry.faded : [entry.faded]) material.dispose();
    }
    roofFades.length = 0;
  };
  let walk: Walk | null = null;
  let waitUntil: number | null = null;
  /** How fast the tour plays (version 7, his: 1× or 2×): every leg, the flight in and the wait at a stop take their time over it. */
  let rate = 1;
  let told = "";

  /** The doors the tour opens: each one's leaves, where it stands, and how open it is and should be. */
  const doors = new Map<string, Door>();
  for (const [id, leaves] of doorLeaves(model)) {
    const place = doorPlace(house, id);
    if (!place) continue;
    const leaf = leaves[0]!.userData.door as DoorLeaf;
    doors.set(id, {
      leaves,
      at: new THREE.Vector3(place.at[0], leaves[0]!.position.y, place.at[1]),
      normal: new THREE.Vector2(leaf.normal[0], leaf.normal[1]),
      open: 0,
      target: 0,
      side: 1,
    });
  }

  /**
   * The pictures, hung: one plane a stop with a picture, on its camera's axis, unlit so the picture keeps its own light,
   * drawn over the model (no depth test) so a wall never cuts a window that hangs in a room, and faded in at its stop.
   */
  const loader = new THREE.TextureLoader();
  const hung: Hung[] = tour.stops.flatMap((stop, index) => {
    if (!stop.picture) return [];
    const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
    const edges = new THREE.LineBasicMaterial({ color: 0x3a3632, transparent: true, opacity: 0, depthTest: false });
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    const edge = new THREE.LineLoop(new THREE.BufferGeometry(), edges);
    mesh.renderOrder = 10;
    edge.renderOrder = 11;
    mesh.visible = edge.visible = false;
    mesh.name = `picture-${stop.id}`;
    scene.add(mesh, edge);
    const picture: Hung = { stop: index, mesh, edge, material, edges, opacity: 0, target: 0, state: "loading", wanted: false };
    loader.load(
      stop.picture.src,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        material.map = texture;
        material.needsUpdate = true;
        picture.state = "ready";
        picture.target = picture.wanted ? 1 : 0;
        invalidate();
      },
      undefined,
      () => {
        // Not to be had: the stop shows its room alone.
        picture.state = "missing";
        picture.target = 0;
        invalidate();
      },
    );
    return [picture];
  });
  const hangPictures = () => {
    const { aspect } = size();
    for (const picture of hung) {
      const stop = tour.stops[picture.stop]!;
      const frame = pictureFrame(stop.look, stop.picture!.aspect, aspect);
      const shape = pictureShape(frame.width, frame.height);
      picture.mesh.geometry.dispose();
      picture.edge.geometry.dispose();
      const geometry = new THREE.ShapeGeometry(shape, 8);
      // A shape's texture coordinates are its own feet; the picture wants 0 to 1 across and up it.
      const uv = geometry.attributes.uv as THREE.BufferAttribute;
      const position = geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, position.getX(i) / frame.width + 0.5, position.getY(i) / frame.height + 0.5);
      uv.needsUpdate = true;
      picture.mesh.geometry = geometry;
      picture.edge.geometry = new THREE.BufferGeometry().setFromPoints(shape.getPoints(8));
      for (const object of [picture.mesh, picture.edge]) {
        object.position.copy(frame.position);
        object.lookAt(vec(stop.look.from));
      }
    }
  };

  // ── drawing ────────────────────────────────────────────────────────────────────────────────────────────────
  const render = () => {
    frame = 0;
    if (disposed || lost) return;
    renderer.render(scene, camera);
    canvas.dataset.ready = "true";
  };
  const invalidate = () => {
    if (!frame && !disposed && !lost) frame = requestAnimationFrame(render);
  };
  const size = () => {
    // Layout dimensions stay stable while the farewell scales the compositor layer.
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    return { width, height, aspect: width && height ? width / height : 1 };
  };
  /** Take everything whose foot stands on `level` or above off; nothing, to show it all. */
  const cut = (level?: number) => {
    model.traverse((object) => {
      if (typeof object.userData.base === "number") object.visible = level === undefined || object.userData.base < level;
    });
  };
  const moved = () => {
    completed = false;
    thanksAt = null;
    canvas.dataset.view = "custom";
    // A hand on the model during the tour is the visitor looking round: the walk waits for Play.
    if (playing) pause();
    tell(true);
    on.moved?.();
  };
  const mount = (next: THREE.Camera, rotate: boolean) => {
    controls?.dispose();
    camera = next;
    controls = new OrbitControls(next, canvas);
    controls.enableDamping = false;
    controls.enableRotate = rotate;
    // Left turns a look; the wheel pressed drags the view (his, version 4), as does the right button, and on the plan,
    // which does not turn, the left button too. The wheel turned comes closer.
    controls.mouseButtons = { LEFT: rotate ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
    // Never under the ground.
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.addEventListener("change", invalidate);
    controls.addEventListener("start", moved);
    return controls;
  };
  const fitPlan = () => {
    const { aspect } = size();
    const w = (bounds.max[0] - bounds.min[0]) * 1.1;
    const h = (bounds.max[1] - bounds.min[1]) * 1.1;
    const wide = aspect >= w / h;
    const viewW = wide ? h * aspect : w;
    const viewH = wide ? h : w / aspect;
    plan.left = -viewW / 2;
    plan.right = viewW / 2;
    plan.top = viewH / 2;
    plan.bottom = -viewH / 2;
    plan.updateProjectionMatrix();
  };
  /** Stand the look camera as a `Look` says, the controls following. */
  const pose = (next: Look) => {
    look.up.set(0, 1, 0);
    look.position.set(...next.from);
    look.fov = next.fov ?? TOUR_MOTION.fov;
    look.updateProjectionMatrix();
    const c = camera === look && controls ? controls : mount(look, true);
    c.target.set(...next.to);
    c.update();
  };

  // ── the tour ───────────────────────────────────────────────────────────────────────────────────────────────
  const n = tour.stops.length;
  /** The first place the camera can be: the long shot, before the stops, when the tour has one. */
  const first = tour.opening ? -1 : 0;
  /** A place's look: the long shot's or a stop's. */
  const lookOf = (stop: number): Look => (stop < 0 && tour.opening ? tour.opening.look : tour.stops[Math.max(0, stop)]!.look);
  const tell = (force = false) => {
    const along = walk ? THREE.MathUtils.lerp(walk.from, walk.to, walkEase()) : at;
    const progress = n > 1 ? THREE.MathUtils.clamp(along / (n - 1), 0, 1) : 0;
    const state: TourState = { stop: at, phase: ending ? "ending" : walk ? "walk" : "at", playing, progress, completed, overview: camera === plan };
    const key = `${state.stop}·${state.phase}·${state.playing}·${completed}·${state.overview}·${Math.round(progress * 200)}`;
    if (!force && key === told) return;
    told = key;
    // On the canvas too, for the review sweep: where the tour is and whether it is walking.
    const heading = walk ? walk.to : at;
    canvas.dataset.stop = heading < 0 ? "opening" : (tour.stops[heading]?.id ?? "");
    canvas.dataset.phase = state.phase;
    canvas.dataset.completed = String(completed);
    on.tour?.(state);
  };
  /** How far through its leg's time the walk is, 0 to 1; and how far along the leg, on the walk's profile (a cruise). */
  const walkTime = () => (walk ? (walk.path.duration ? THREE.MathUtils.clamp((performance.now() - walk.start) / ((walk.path.duration * 1000) / rate), 0, 1) : 1) : 0);
  const walkEase = () => (walk ? walkProfile(walkTime()) : 0);
  const animating = () =>
    thanksAt !== null ||
    !!walk ||
    (!!ending && playing) ||
    (playing && waitUntil !== null) ||
    [...doors.values()].some((door) => Math.abs(door.open - door.target) > 1e-3) ||
    hung.some((picture) => Math.abs(picture.opacity - picture.target) > 1e-3);
  const wake = () => {
    if (!loop && !disposed) loop = requestAnimationFrame(tick);
  };
  const show = (stop: number) => {
    for (const picture of hung) {
      picture.wanted = picture.stop === stop;
      picture.target = picture.wanted && picture.state === "ready" ? 1 : 0;
    }
  };
  /**
   * Stand at a stop — the look, its picture, and if the tour is playing, the wait before the next — or at the long
   * shot (−1), where nothing hangs and a playing tour sets off at once.
   */
  const arrive = (stop: number, now = performance.now()) => {
    ending = null;
    restoreRoof();
    completed = false;
    thanksAt = null;
    walk = null;
    at = stop;
    cut();
    pose(lookOf(stop));
    if (controls) controls.enabled = true;
    canvas.dataset.view = stop < 0 ? "opening" : tour.stops[stop]!.id;
    show(stop);
    for (const door of doors.values()) door.target = 0;
    if (playing) {
      if (stop < 0) waitUntil = now;
      else waitUntil = now + (TOUR_MOTION.dwell * 1000) / rate;
    } else waitUntil = null;
    tell(true);
    wake();
    invalidate();
  };
  /** Walk from where the camera is to a neighbouring stop along its leg — forwards or back — or in from the long shot. */
  const setOff = (to: number) => {
    ending = null;
    restoreRoof();
    completed = false;
    thanksAt = null;
    const from = at;
    const forward = to > from;
    const legIndex = forward ? from : to;
    // From the long shot (or back to it) the way is the opening's approach; between stops, their leg.
    const leg: Leg = legIndex < 0 ? (tour.opening?.approach ?? { look: "blend" }) : (tour.legs[legIndex] ?? {});
    // Back along a leg is the same way, its points in the other order.
    const way: Leg = forward ? leg : { ...leg, via: [...(leg.via ?? [])].reverse() };
    if (camera !== look || !controls) pose(lookOf(from));
    cut();
    const start: Pose = { position: look.position.clone(), target: controls!.target.clone(), fov: look.fov };
    const path = legPath(start, lookOf(to), way, reduced);
    walk = { from, to, way, path, start: performance.now(), pose: start, doors: [...(leg.doors ?? [])] };
    controls!.enabled = false;
    waitUntil = null;
    show(-1);
    canvas.dataset.view = to < 0 ? "opening" : tour.stops[to]!.id;
    tell(true);
    wake();
  };
  const play = () => {
    if (playing) return;
    completed = false;
    thanksAt = null;
    // At the end, the tour starts over from the long shot.
    if (at >= n - 1 && !walk && !ending) arrive(first);
    playing = true;
    // From the long shot, Play sets off at once; at a stop, after a breath.
    if (!walk && !ending) waitUntil = performance.now() + (at < 0 ? 0 : (TOUR_MOTION.resume * 1000) / rate);
    tell(true);
    wake();
  };
  const pause = () => {
    if (!playing) return;
    playing = false;
    waitUntil = null;
    tell(true);
  };
  const go = (stop: number) => {
    const target = THREE.MathUtils.clamp(Math.round(stop), first, n - 1);
    if (Math.abs(target - at) === 1 && camera === look && !walk) setOff(target);
    else {
      const wasPlaying = playing;
      playing = false;
      arrive(target);
      playing = wasPlaying;
      if (playing && target >= 0) {
        waitUntil = performance.now() + (TOUR_MOTION.dwell * 1000) / rate;
        tell(true);
        wake();
      } else if (playing) {
        waitUntil = performance.now();
        tell(true);
        wake();
      }
    }
  };
  const endInPlan = () => {
    const next = house.views.find((candidate) => candidate.kind === "plan");
    if (!next) { playing = false; completed = true; tell(true); return; }
    show(-1);
    waitUntil = null;
    fitPlan();
    plan.up.set(0, 0, -1);
    plan.position.set(centre.x, bounds.top + extent, centre.z);
    plan.zoom = 1;
    plan.lookAt(centre.x, 0, centre.z);
    plan.updateProjectionMatrix();
    ending = {
      time: 0,
      path: new THREE.CatmullRomCurve3([look.position.clone(), new THREE.Vector3(centre.x + extent * 0.35, bounds.top + extent * 1.2, centre.z + extent * 0.35), plan.position.clone()]),
      rotation: look.quaternion.clone(), targetRotation: plan.quaternion.clone(),
      viewHeight: 2 * look.position.distanceTo(new THREE.Vector3(centre.x, house.slabs[0]?.top ?? 0, centre.z)) * Math.tan(THREE.MathUtils.degToRad(look.fov / 2)),
    };
    if (controls) controls.enabled = false;
    // Fade only the elements Plan hides, with clones so other surfaces keep their materials.
    model.traverse((object) => {
      let parent: THREE.Object3D | null = object;
      let hidden = false;
      while (parent && parent !== model) {
        if (next.cut !== undefined && typeof parent.userData.base === "number" && parent.userData.base >= next.cut) hidden = true;
        parent = parent.parent;
      }
      if (!hidden || !(object instanceof THREE.Mesh || object instanceof THREE.LineSegments)) return;
      const original = object.material;
      const clone = (material: THREE.Material) => { const copied = material.clone(); copied.transparent = true; return copied; };
      const faded = Array.isArray(original) ? original.map(clone) : clone(original);
      object.material = faded;
      roofFades.push({ object, original, faded });
    });
    tell(true);
  };
  const tick = (now: number) => {
    loop = 0;
    if (disposed) return;
    const dt = Math.min(0.05, (now - lastTick) / 1000);
    lastTick = now;
    if (ending && playing) {
      ending.time += dt * rate;
      const t = reduced ? 1 : Math.min(1, ending.time / TOUR_MOTION.ending);
      const u = easeInOut(t);
      look.position.copy(ending.path.getPoint(u));
      look.quaternion.copy(ending.rotation).slerp(ending.targetRotation, u);
      const distance = look.position.distanceTo(new THREE.Vector3(centre.x, house.slabs[0]?.top ?? 0, centre.z));
      const viewHeight = THREE.MathUtils.lerp(ending.viewHeight, plan.top - plan.bottom, u);
      look.fov = THREE.MathUtils.radToDeg(2 * Math.atan(viewHeight / (2 * distance)));
      look.updateProjectionMatrix();
      const blend = smoothstep(0.25, 1, u);
      // Homogeneous matrices must share a scale before blending: otherwise the house shrinks then surges back.
      for (let i = 0; i < 16; i++) look.projectionMatrix.elements[i] = THREE.MathUtils.lerp(look.projectionMatrix.elements[i]! / distance, plan.projectionMatrix.elements[i]!, blend);
      look.projectionMatrixInverse.copy(look.projectionMatrix).invert();
      const opacity = 1 - smoothstep(0.45, 0.9, t);
      for (const entry of roofFades) for (const material of Array.isArray(entry.faded) ? entry.faded : [entry.faded]) material.opacity = opacity;
      if (t >= 1) {
        ending = null;
        view("plan");
        thanksAt = now + TOUR_MOTION.thanksDelay * 1000;
        tell(true);
      }
    } else if (walk) {
      const t = walkTime();
      const here = alongLeg(walk.path, walk.pose, lookOf(walk.to), walk.way, t);
      look.position.copy(here.position);
      look.lookAt(here.target);
      look.fov = here.fov;
      look.updateProjectionMatrix();
      controls?.target.copy(here.target);
      // A door on the way opens as the camera comes near, away from the side it comes from.
      for (const id of walk.doors) {
        const door = doors.get(id);
        if (!door || door.target === 1) continue;
        const dx = look.position.x - door.at.x;
        const dz = look.position.z - door.at.z;
        if (Math.hypot(dx, dz) < TOUR_MOTION.doorReach) {
          door.side = dx * door.normal.x + dz * door.normal.y >= 0 ? 1 : -1;
          door.target = 1;
        }
      }
      tell();
      if (t >= 1) arrive(walk.to, now);
    } else if (playing && waitUntil !== null && now >= waitUntil) {
      if (at < n - 1) setOff(at + 1);
      else {
        endInPlan();
      }
    }
    if (thanksAt !== null && now >= thanksAt) {
      thanksAt = null;
      completed = true;
      tell(true);
    }
    const doorStep = TOUR_MOTION.door > 0 && !reduced ? dt / TOUR_MOTION.door : 1;
    for (const door of doors.values()) {
      if (door.open === door.target) continue;
      door.open = door.target > door.open ? Math.min(door.target, door.open + doorStep) : Math.max(door.target, door.open - doorStep);
      for (const leaf of door.leaves) setDoorLeaf(leaf, easeInOut(door.open), door.side);
    }
    for (const picture of hung) {
      if (picture.opacity === picture.target) continue;
      const step = reduced ? 1 : dt / (picture.target > picture.opacity ? TOUR_MOTION.pictureIn : TOUR_MOTION.pictureOut);
      picture.opacity = picture.target > picture.opacity ? Math.min(picture.target, picture.opacity + step) : Math.max(picture.target, picture.opacity - step);
      picture.material.opacity = easeInOut(picture.opacity);
      picture.edges.opacity = 0.5 * easeInOut(picture.opacity);
      picture.mesh.visible = picture.edge.visible = picture.opacity > 0.005;
    }
    // For the review sweep: how far in the stop's picture is, 0 to 100.
    const shown = hung.find((picture) => picture.target === 1);
    canvas.dataset.picture = shown ? String(Math.round(shown.material.opacity * 100)) : "";
    render();
    // One loop only: arriving in this tick may already have woken the next one.
    if (animating() && !loop) loop = requestAnimationFrame(tick);
  };
  let lastTick = performance.now();

  const view = (id: string) => {
    const next = house.views.find((candidate) => candidate.id === id);
    if (!next) return;
    completed = false;
    thanksAt = null;
    ending = null;
    restoreRoof();
    pause();
    walk = null;
    canvas.dataset.view = id;
    cut(next.cut);
    show(-1);
    for (const door of doors.values()) door.target = 0;
    if (next.kind === "plan") {
      // From straight above, the top of the page up the screen.
      plan.up.set(0, 0, -1);
      plan.position.set(centre.x, bounds.top + extent, centre.z);
      plan.zoom = 1;
      fitPlan();
      const c = mount(plan, false);
      c.target.set(centre.x, 0, centre.z);
      c.update();
    } else {
      mount(look, true);
      pose(next);
    }
    tell(true);
    wake();
    invalidate();
  };
  const turn = (horizontal: number, vertical: number) => {
    if (camera !== look || !controls || walk) return;
    const spherical = new THREE.Spherical().setFromVector3(look.position.clone().sub(controls.target));
    spherical.theta += horizontal;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi + vertical, 0.05, controls.maxPolarAngle);
    look.position.setFromSpherical(spherical).add(controls.target);
    controls.update();
    moved();
    invalidate();
  };
  const resize = () => {
    const { width, height, aspect } = size();
    if (!width || !height) return;
    look.aspect = aspect;
    look.updateProjectionMatrix();
    fitPlan();
    hangPictures();
    renderer.setSize(width, height, false);
    // ResizeObserver runs before paint: draw the refitted Plan now, so no old-sized
    // frame flashes when its layer starts or finishes moving.
    if (frame) cancelAnimationFrame(frame);
    render();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    delete canvas.dataset.ready;
    on.status(false);
  };
  const contextRestored = () => {
    lost = false;
    resize();
    render();
    on.status(true);
  };
  canvas.addEventListener("webglcontextlost", contextLost);
  canvas.addEventListener("webglcontextrestored", contextRestored);
  // The model opens on the tour's long shot, or at its first stop when it has none (H9); the plan is a view away.
  arrive(first);
  resize();
  render();
  on.status(true);

  return {
    view,
    turn,
    tour: {
      play,
      pause,
      go,
      rate(times) {
        const next = THREE.MathUtils.clamp(times, 0.25, 4);
        if (next === rate) return;
        const now = performance.now();
        // Mid-walk the clock is rebased, so the camera stays where it is and goes on at the new pace; mid-wait, what
        // is left of the wait is scaled.
        if (walk && walk.path.duration) walk.start = now - walkTime() * ((walk.path.duration * 1000) / next);
        if (waitUntil !== null && Number.isFinite(waitUntil) && waitUntil > now) waitUntil = now + ((waitUntil - now) * rate) / next;
        rate = next;
      },
    },
    dispose() {
      disposed = true;
      restoreRoof();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(loop);
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
      controls?.dispose();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.LineLoop) {
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => {
        if (material instanceof THREE.MeshBasicMaterial) material.map?.dispose();
        material.dispose();
      });
      sun.shadow.dispose();
      renderer.dispose();
      delete canvas.dataset.ready;
    },
  };
}
