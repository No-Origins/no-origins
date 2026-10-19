import { buildScreenIntro } from "./screen-intro";
import { createIslandCursor } from "./island-cursor";
import { motionMs } from "@no-origins/ui/lib/motion";
import { SCREEN_HEIGHT, SCREEN_WIDTH, SCREEN_THICKNESS, SCREEN_BASE, SCREEN_BACK, SCREEN_RADIUS, SCREEN_CENTER_Z, screenDistance } from "./clearing-screen";
import { createVisorView } from "./visor-view";
import { buildClayVR, CLAY_VR_PROPORTIONS } from "./clay-vr";
import { buildClayBag } from "./clay-bag";
import { CLAY_INPUT, OPEN_CLAY_BAG, type ClayInput } from "./clay-input";
import * as THREE from "three/webgpu";
import { buildClayPodium } from "./clay-podium";
import { buildClearingAgents } from "./clearing-agents";
import { clayTravel } from "./clay-travel";
import { buildClearingScenery, meadowHeight, islandRadius } from "./clearing-scenery";
import { buildFluidSky } from "./build-fluid-sky";
import { buildClouds } from "./build-clouds";
import { sunOf } from "./atmosphere";
import { drawnOf, type EnvironmentData } from "./environment";
import keptEnvironment from "./published-environment.json";
import { buildHuman } from "./build-human";
import { HUMAN_VARIANTS, HUMAN_CLAY } from "./human";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/** World.md W108: dimensions are metres; all detail belongs to geometry and materials. */
export async function createClearing(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: false });
  try { await renderer.init(); } catch (error) { renderer.dispose(); throw error; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#e7dcd1");
  scene.fog = new THREE.Fog("#e7dcd1", 35, 120);
  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 20000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.minPolarAngle = 0.01;
  controls.maxPolarAngle = Math.PI - 0.01;
  // Full orbit around the floating island; tiny pole margins avoid an inverted up axis.
  // Right-drag or Shift-drag translates camera and target together, preserving the view angle.
  controls.minDistance = 10;
  controls.maxDistance = 43;
  controls.target.set(0, -3, 0);

  const environment = keptEnvironment as unknown as EnvironmentData;
  const atmosphere = { ...drawnOf(environment.atmosphere), sunHeight: 2, sunTurn: 113, sunlight: "#ff9a45" };
  scene.fog!.color.set(atmosphere.horizon);
  const sky = buildFluidSky(atmosphere);
  const clouds = buildClouds({ ...environment.atmosphere, sunHeight: atmosphere.sunHeight, sunTurn: atmosphere.sunTurn, sunlight: atmosphere.sunlight }, environment.clouds, 1000, undefined, true);
  clouds.object.visible = environment.clouds.shown;
  scene.add(sky.mesh, clouds.object);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const ambient = new THREE.HemisphereLight("#fff5e6", "#c1aa94", 1.7);
  scene.add(ambient);
  // World.md W110: sky disc, cloud illumination and ground shadows share one sun.
  const sunDirection = sunOf(atmosphere);
  const sun = new THREE.DirectionalLight(atmosphere.sunlight, 3);
  sun.position.copy(sunDirection).multiplyScalar(42);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 0.5, far: 110 });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 4;
  scene.add(sun);

  let seed = 108;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = textureCanvas.height = 1024;
  const ctx = textureCanvas.getContext("2d")!;
  // Mottled warm sand with visible fine mineral flecks and short wind-worked traces.
  const sandPixels = ctx.createImageData(1024, 1024);
  const sandNoise = Array.from({ length: 1024 }, random);
  const mottling = (x: number, y: number, period: number) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const smooth = (t: number) => t * t * (3 - 2 * t);
    const at = (a: number, b: number) => sandNoise[((b + period) % period) * 32 + (a + period) % period];
    return THREE.MathUtils.lerp(THREE.MathUtils.lerp(at(ix, iy), at(ix + 1, iy), smooth(x - ix)),
      THREE.MathUtils.lerp(at(ix, iy + 1), at(ix + 1, iy + 1), smooth(x - ix)), smooth(y - iy));
  };
  for (let y = 0; y < 1024; y++) for (let x = 0; x < 1024; x++) {
    const broad = (mottling(x / 128, y / 128, 8) - 0.5) * 24;
    const fine = random() * 15 - 7.5;
    const mineral = (mottling(x / 32, y / 32, 32) - 0.5) * 10;
    const value = broad + fine + mineral;
    const i = (y * 1024 + x) * 4;
    sandPixels.data[i] = 231 + value; sandPixels.data[i + 1] = 210 + value;
    sandPixels.data[i + 2] = 177 + value; sandPixels.data[i + 3] = 255;
  }
  ctx.putImageData(sandPixels, 0, 0);
  for (let i = 0; i < 13000; i++) {
    const x = random() * 1024, y = random() * 1024;
    ctx.fillStyle = i % 3 ? "rgba(128,104,68,0.22)" : "rgba(255,243,214,0.55)";
    ctx.fillRect(x, y, 0.7 + random() * 2.2, 0.7 + random() * 1.1);
  }
  const grain = new THREE.CanvasTexture(textureCanvas);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(0.085, 0.085);
  grain.anisotropy = 8;
  grain.colorSpace = THREE.SRGBColorSpace;
  const material = (color: string, roughness = 0.85) => new THREE.MeshStandardNodeMaterial({ color, roughness });
  const sand = material("#f1deca");
  sand.map = grain;
  sand.bumpMap = grain;
  sand.bumpScale = 0.11;
  const meadow = await new THREE.TextureLoader().loadAsync("/textures/painted-meadow-v1.png");
  meadow.wrapS = meadow.wrapT = THREE.RepeatWrapping;
  meadow.repeat.set(0.065, 0.065);
  meadow.colorSpace = THREE.SRGBColorSpace;
  meadow.anisotropy = 8;
  const scenery = buildClearingScenery(sand, meadow);
  scene.add(scenery.object);
  const floor = new THREE.Mesh(scenery.groundGeometry, scenery.groundMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  function mesh(geometry: THREE.BufferGeometry, paint: THREE.Material, parent: THREE.Object3D = scene) {
    const object = new THREE.Mesh(geometry, paint);
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  const screen = material("#111113", 0.88);
  const screenThickness = SCREEN_THICKNESS;
  const screenHeight = SCREEN_HEIGHT;
  const screenBack = SCREEN_BACK;
  const screenWidth = SCREEN_WIDTH;
  // A continuous 60° arc keeps the former assembly's total width and gentle forward sweep.
  const screenRadius = SCREEN_RADIUS;
  const screenCenterZ = SCREEN_CENTER_Z;
  const screenGeometry = new THREE.BoxGeometry(screenWidth, screenHeight, screenThickness, 128, 1, 1);
  const screenVertices = screenGeometry.attributes.position;
  for (let i = 0; i < screenVertices.count; i++) {
    const angle = screenVertices.getX(i) / screenRadius;
    const radius = screenRadius - screenVertices.getZ(i);
    screenVertices.setXYZ(i, radius * Math.sin(angle), screenVertices.getY(i), screenCenterZ - radius * Math.cos(angle));
  }
  screenGeometry.computeVertexNormals();
  const panel = mesh(screenGeometry, screen);
  panel.name = "blank-screen";
  panel.position.y = SCREEN_BASE + screenHeight / 2;

  const screenIntro = buildScreenIntro(canvas);
  scene.add(screenIntro.object);

  const screenFocus = new THREE.Vector3(0, screenHeight / 2, screenBack);

  const ringPaint = material("#b79a7c");
  function ring(x: number, z: number, radius = 0.94) {
    const object = mesh(new THREE.TorusGeometry(radius, 0.016, 6, 96), ringPaint);
    object.rotation.x = -Math.PI / 2;
    object.position.set(x, 0.018, z);
    return object;
  }
  const agents = buildClearingAgents(ring);
  scene.add(agents.object);
  const agentPositions = agents.positions;
  ring(agents.center.x, agents.center.z, 1.04);

  // Reuse the existing measured Clay model, its connected skin, rig and saved proportions.
  const clayConfig = { ...(HUMAN_VARIANTS.find(variant => variant.settings.form === "clay")?.settings ?? HUMAN_CLAY.settings), ...CLAY_VR_PROPORTIONS };
  const human = buildHuman({ ...clayConfig, colour: "#e7decd", shows: "look", moves: "still", posture: "stand" });
  // His reference places Clay on the open sand in front of the left side of the gathering.
  human.object.position.set(0, 0, 17);
  human.object.rotation.y = Math.PI;
  scene.add(human.object);
  const bag = buildClayBag(human, clayConfig);
  buildClayVR(human, clayConfig);
  const podium = buildClayPodium(human, agents.center);
  scene.add(podium.object);
  const podiumHeight = podium.top;
  const onPodium = podium.footprint;


  // His copied camera settings are the overview's reference framing.
  const overviewTarget = new THREE.Vector3(6.105, 2.905, 9.232);
  const overviewReference = new THREE.Vector3(37.819, 19.28, 58.957).sub(overviewTarget);
  const overviewOffset = () => {
    const portraitDistance = 25 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    return overviewReference.clone().multiplyScalar(Math.max(1, portraitDistance / overviewReference.length()));
  };
  let wasDocked = false;
  let dockView: { position: THREE.Vector3; target: THREE.Vector3; elapsed: number; overview: boolean } | null = null;
  const dockViewTime = motionMs(canvas, "--motion-human-podium-settle", 850);
  const dockTarget = new THREE.Vector3(0, 7, SCREEN_BACK);
  const dockPosition = () => {
    // Match his screen-facing reference; portrait backs away to retain the screen's full width.
    const back = Math.max(34.5, SCREEN_WIDTH / (1.1 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
    return new THREE.Vector3(0, 6, SCREEN_BACK + back);
  };
  const cancelDockView = () => { dockView = null; };
  controls.addEventListener("start", cancelDockView);
  const resetDockView = (event: Event) => {
    const input = (event as CustomEvent<ClayInput>).detail;
    if ("action" in input && input.action === "reset") { wasDocked = false; dockView = null; }
  };
  window.addEventListener(CLAY_INPUT, resetDockView);
  let frameId = 0, disposed = false, last = 0, skySeconds = 0, cloudSeconds = 0;
  let hoveredAgent = -1, pointerTarget: THREE.Vector3 | null = null;
  const draw = () => {
    if (frameId) return;
    frameId = requestAnimationFrame((now) => {
      frameId = 0;
      if (disposed || document.hidden) { last = 0; return; }
      const elapsed = last ? Math.max(0, now - last) : 0;
      const delta = Math.min(elapsed / 1000, 0.05);
      last = now;
      if (environment.atmosphere.motion && !reduced.matches) {
        skySeconds += delta * atmosphere.skySpeed;
        cloudSeconds += delta * atmosphere.cloudSpeed;
        sky.clock.value = skySeconds;
        clouds.flow(cloudSeconds);
      }
      const moving = visorView.active ? false : (travel?.step(delta * 1000, reduced.matches) ?? false);
      if (travel.atPodium !== wasDocked && !visorView.active) {
        dockView = { position: camera.position.clone(), target: controls.target.clone(), elapsed: 0, overview: !travel.atPodium };
      }
      wasDocked = travel.atPodium;
      if (visorView.active) dockView = null;
      if (dockView) {
        dockView.elapsed += elapsed;
        const progress = reduced.matches ? 1 : Math.min(1, dockView.elapsed / Math.max(1, dockViewTime));
        const ease = progress * progress * (3 - 2 * progress);
        const target = dockView.overview
          ? overviewTarget.clone().add(new THREE.Vector3(human.object.position.x - agents.center.x, 0, human.object.position.z - agents.center.z))
          : dockTarget;
        const position = dockView.overview ? target.clone().add(overviewOffset()) : dockPosition();
        camera.position.lerpVectors(dockView.position, position, ease);
        controls.target.lerpVectors(dockView.target, target, ease);
        controls.update();
        if (progress === 1) dockView = null;
      }
      islandCursor.update(delta * 1000, reduced.matches);
      bag.update();
      const reaction = agents.update(delta * 1000, human.object.position, pointerTarget, hoveredAgent, reduced.matches, travel.atPodium ? screenFocus : null);
      canvas.dataset.agentReaction = reaction.response;
      canvas.dataset.agentAttention = travel.atPodium ? "screens" : reaction.tracking ? "clay" : "rest";
      canvas.dataset.agentTracking = String(reaction.tracking);
      canvas.dataset.agentHeadings = reaction.headings;
      const introducing = screenIntro.step(delta * 1000, travel.atPodium, reduced.matches);
      const viewing = visorView.step(elapsed, reduced.matches);
      renderer.render(scene, camera);
      canvas.dataset.ready = "true";
      const rounded = (value: number) => Number(value.toFixed(3));
      const reading = JSON.stringify({
        position: camera.position.toArray().map(rounded),
        target: controls.target.toArray().map(rounded),
        azimuth: rounded(THREE.MathUtils.radToDeg(controls.getAzimuthalAngle())),
        elevation: rounded(90 - THREE.MathUtils.radToDeg(controls.getPolarAngle())),
        fov: rounded(camera.fov),
      });
      if (canvas.dataset.cameraReading !== reading) canvas.dataset.cameraReading = reading;
      canvas.dataset.cameraPolar = controls.getPolarAngle().toFixed(3);
      canvas.dataset.cameraAzimuth = controls.getAzimuthalAngle().toFixed(3);
      canvas.dataset.backend = ("isWebGPUBackend" in renderer.backend && renderer.backend.isWebGPUBackend) ? "webgpu" : "webgl";
      if (introducing || islandCursor.active || dockView || viewing || moving || reaction.active || (environment.atmosphere.motion && !reduced.matches && ((atmosphere.skyFlow > 0 && atmosphere.skySpeed > 0) || (environment.clouds.shown && clouds.flowing)))) draw();
    });
  };
  const screenTop = screenHeight + SCREEN_BASE;
  const screenFootprint = (x: number,z: number) => {
    return screenDistance(x, z) < screenThickness / 2 + 0.45;
  };
  const floorAt = (x: number,z: number,from: number) => {
    let floor = Math.max(meadowHeight(x,z), scenery.stoneSupport(x,z,from,0.45));
    if (podiumHeight <= from + 0.001 && onPodium(x,z)) floor = Math.max(floor, podiumHeight);
    agentPositions.forEach((p,i)=> {
      if(agents.tops[i]<=from+0.001 && Math.hypot(x-p.x,z-p.y)<1.15) floor=Math.max(floor,agents.tops[i]);
    });
    if(screenTop<=from+0.001 && screenFootprint(x,z))floor=Math.max(floor,screenTop);
    return floor;
  };
  const islandCursor = createIslandCursor(canvas, camera, floor, scene, draw);
  const travel = clayTravel(canvas, human, clayConfig, camera, draw, (x,z,feet) => {
    if(Math.hypot(x,z)>islandRadius(Math.atan2(z,x))-1.4)return false;
    if(scenery.blocksStone(x,z,0.45,feet))return false;
    if(feet < podiumHeight - 0.001 && onPodium(x,z))return false;
    if(agentPositions.some((p,i)=>feet<agents.tops[i]-0.001 && Math.hypot(x-p.x,z-p.y)<1.15))return false;
    if(feet<screenTop-0.001 && screenFootprint(x,z))return false;
    return true;
  }, (dx,dz) => {
    camera.position.x+=dx; camera.position.z+=dz;
    controls.target.x+=dx; controls.target.z+=dz;
  },floorAt, { ...agents.center, radius: 1.04, pose: podium.pose }, () => islandCursor.target);
  const visorView = createVisorView(canvas, camera, controls, human, draw);
  const reset = () => {
    if (visorView.active) return;
    dockView = null;
    camera.fov = 44;
    camera.updateProjectionMatrix();
    const offset = overviewOffset();
    const distance = offset.length();
    controls.maxDistance = Math.max(80, distance * 1.5);
    if (scene.fog instanceof THREE.Fog) { scene.fog.near = distance + 12; scene.fog.far = distance + 100; }
    controls.target.copy(overviewTarget);
    camera.position.copy(controls.target).add(offset);
    controls.update(); draw();
  };
  const resize = () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    reset();
    if (travel.atPodium) { wasDocked = false; draw(); }
  };
  const key = (event: KeyboardEvent) => {
    if (visorView.active) return;
    if (event.key === "Home" || event.key === "Escape") { event.preventDefault(); reset(); return; }
    const turn = event.key === "ArrowLeft" ? -0.08 : event.key === "ArrowRight" ? 0.08 : 0;
    if (turn) {
      event.preventDefault();
      const offset = camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), turn);
      camera.position.copy(controls.target).add(offset); controls.update(); draw();
    }
  };
  const agentRay = new THREE.Raycaster();
  const pointAgent = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    agentRay.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
    const hit = agentRay.intersectObject(agents.object,true)[0];
    let target: THREE.Object3D | null = hit?.object ?? null;
    while (target && target.userData.agent === undefined) target=target.parent;
    hoveredAgent = target?.userData.agent ?? -1;
    pointerTarget = hit?.point ?? null;
    draw();
  };
  const leaveAgent = () => { hoveredAgent=-1; pointerTarget=null; draw(); };
  const pressAgent = (event: PointerEvent) => { pointAgent(event); agents.press(hoveredAgent); draw(); };
  canvas.addEventListener("pointermove",pointAgent);
  canvas.addEventListener("pointerleave",leaveAgent);
  canvas.addEventListener("pointerdown",pressAgent);
  let bagPress: { x: number; y: number } | null = null;
  const bagDown = (event: PointerEvent) => { if (event.isPrimary && event.button === 0) bagPress = { x: event.clientX, y: event.clientY }; };
  const bagUp = (event: PointerEvent) => {
    const start = bagPress; bagPress = null;
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) return;
    const rect = canvas.getBoundingClientRect();
    agentRay.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
    const hit = agentRay.intersectObjects([human.object, podium.object, agents.object, ...scene.children.filter(child => child.name === "blank-screen")], true)[0];
    let target: THREE.Object3D | null = hit?.object ?? null;
    while (target && target !== bag.object) target = target.parent;
    if (target === bag.object) window.dispatchEvent(new Event(OPEN_CLAY_BAG));
  };
  const bagCancel = () => { bagPress = null; };
  canvas.addEventListener("pointerdown", bagDown);
  canvas.addEventListener("pointerup", bagUp);
  canvas.addEventListener("pointercancel", bagCancel);
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  controls.addEventListener("change", draw);
  canvas.addEventListener("keydown", key);
  document.addEventListener("visibilitychange", draw);
  reduced.addEventListener("change", draw);
  resize();
  return () => {
    canvas.removeEventListener("pointerdown", bagDown); canvas.removeEventListener("pointerup", bagUp); canvas.removeEventListener("pointercancel", bagCancel);
    window.removeEventListener(CLAY_INPUT, resetDockView);
    islandCursor.dispose();
    visorView.dispose();
    disposed = true; cancelAnimationFrame(frameId); observer.disconnect(); controls.removeEventListener("start", cancelDockView); controls.dispose(); travel?.dispose();
    canvas.removeEventListener("pointermove",pointAgent); canvas.removeEventListener("pointerleave",leaveAgent); canvas.removeEventListener("pointerdown",pressAgent);
    canvas.removeEventListener("keydown", key); document.removeEventListener("visibilitychange", draw); reduced.removeEventListener("change", draw);
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        for (const paint of Array.isArray(object.material) ? object.material : [object.material]) materials.add(paint);
      }
    });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
    screenIntro.dispose();
    ringPaint.dispose();
    grain.dispose(); meadow.dispose(); renderer.dispose();
  };
}
