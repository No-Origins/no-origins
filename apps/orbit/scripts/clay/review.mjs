// Renders the Clay human (human.ts, World.md W102) in the reference turnaround's five views, at the picture's scale and
// placement, headless (three.js WebGPU in Chromium), so each view can be laid over the picture or compared as a mask.
// Usage: node apps/orbit/scripts/clay/review.mjs <out-dir>
// Env: CONFIG='{...}' merged over HUMAN_CLAY's settings; MODE=shaded|silhouette (default both); AXES='[x,x,x,x,x]' the
// figures' middle lines in the picture; GROUND=780 CROWN=220 (picture rows); POSE=rest|walk|run PHASE=0..1.
// Writes <out-dir>/clay-<mode>-<view>.png (1448x1086, transparent background) and prints a JSON report.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../../..");
const out = resolve(process.argv[2] ?? resolve(root, "e2e/.mcp/clay-review"));
mkdirSync(out, { recursive: true });
const W = 1448, H = 1086;
const GROUND = +(process.env.GROUND ?? 782.89), CROWN = +(process.env.CROWN ?? 221.53);
const AXES = JSON.parse(process.env.AXES ?? "[179.86, 477.72, 719.68, 974.99, 1277.2]");
const MODES = (process.env.MODE ?? "shaded,silhouette").split(",");
const CONFIG = process.env.CONFIG ?? "{}";
const POSE = process.env.POSE ?? "rest", PHASE = +(process.env.PHASE ?? 0.3);
// WORLD_DIR: where human.ts and build-human.ts are read from (a scratch copy of apps/orbit/src/world, to try a change).
const WORLD_DIR = resolve(process.env.WORLD_DIR ?? resolve(root, "apps/orbit/src/world"));
// The views: the camera's direction from the figure, round from its front (+z) toward its left (+x), in degrees.
const VIEWS = process.env.VIEWS ? JSON.parse(process.env.VIEWS) : [["front", 0], ["quarter-left", 45], ["side", 90], ["back", 180], ["quarter-right", -45]];
const dir = resolve(out, ".harness");
mkdirSync(dir, { recursive: true });
const tag = Math.random().toString(36).slice(2, 8);
const entry = resolve(dir, `clay-entry-${tag}.ts`);
writeFileSync(entry, `
import * as THREE from "three/webgpu";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { humanGaitAt, readHumanMotion } from "@no-origins/ui/lib/human-motion";
import { HUMAN_CLAY, HUMAN_HEIGHT, inPlaceOf, lookOf, postureOf, readHoverMotion, withExpression } from ${JSON.stringify(resolve(WORLD_DIR, "human.ts"))};
import { buildHuman } from ${JSON.stringify(resolve(WORLD_DIR, "build-human.ts"))};
import { clayFlightAt, clayFlightMode, readClayFlightMotion } from ${JSON.stringify(resolve(root, "apps/orbit/src/world/human-flight.ts"))};
import { UNIT } from ${JSON.stringify(resolve(WORLD_DIR, "human.ts"))};

const config = { ...HUMAN_CLAY.settings, ...${CONFIG} };
const canvas = document.getElementById("c") as HTMLCanvasElement;
const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(1);
renderer.setSize(${W}, ${H}, false);
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
await renderer.init();
const t0 = performance.now();
const built = buildHuman(config);
const buildMs = performance.now() - t0;
if (${JSON.stringify(POSE)}.startsWith("posture:")) {
  const { pose, lift } = postureOf(${JSON.stringify(POSE)}.slice(8) as any, readHumanMotion(document.body));
  built.pose(withExpression(pose, config.expression), lift);
} else if (${JSON.stringify(POSE)}.startsWith("motion:")) {
  const moves = ${JSON.stringify(POSE)}.slice(7);
  const mode = config.form === "clay" ? clayFlightMode(moves) : null;
  if (mode) {
    const motion = readClayFlightMotion(document.body);
    const cycle = mode === "hover" ? motion.hoverCycle : mode === "boost" ? motion.boostCycle : motion.glideCycle;
    const frame = clayFlightAt(mode, ${PHASE} * cycle, motion);
    built.pose(frame.pose, frame.height / UNIT); built.flight?.(frame);
  } else {
    const frame = inPlaceOf(moves as any, ${PHASE}, readHumanMotion(document.body), readHoverMotion(document.body));
    built.pose(frame.pose, frame.lift);
  }
} else if (${JSON.stringify(POSE)} !== "rest") {
  const motion = readHumanMotion(document.body);
  const gait = humanGaitAt(${JSON.stringify(POSE)} as "walk" | "run", ${PHASE} * (${JSON.stringify(POSE)} === "run" ? motion.runCycle : motion.walkCycle), motion);
  built.pose(gait.pose, gait.lift);
}
// HIDE="head,left arm": names of parts (meshes or groups) to leave out, to look at what is under them.
for (const name of ${JSON.stringify((process.env.HIDE ?? "").split(",").filter(Boolean))}) { const o = built.object.getObjectByName(name); if (o) o.visible = false; }
if (${process.env.SHADOWS === "off"}) built.object.traverse((o: any) => { if (o.isMesh) o.receiveShadow = false; });
built.object.updateMatrixWorld(true);
const box = new THREE.Box3().setFromObject(built.object);
let triangles = 0;
built.object.traverse((o: any) => { if (o.isMesh) { const g = o.geometry; triangles += (g.index ? g.index.count : g.getAttribute("position").count) / 3; } });
const scene = new THREE.Scene();
scene.add(built.object);
// Light like the turnaround's: a soft warm key from the camera's left and above, and a pale fill.
const key = new THREE.DirectionalLight("#fff4eb", 1.6);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = key.shadow.camera.bottom = -2; key.shadow.camera.right = key.shadow.camera.top = 3;
key.shadow.camera.near = 0.5; key.shadow.camera.far = 30; key.shadow.normalBias = 0.003; key.shadow.bias = -0.000015; key.shadow.radius = 5;
const fill = new THREE.HemisphereLight("#fbf8f5", "#d9d2cf", 2.4);
scene.add(key, key.target, fill);
const scale = (${GROUND} - ${CROWN}) / HUMAN_HEIGHT;
const ink = new THREE.MeshBasicNodeMaterial({ color: "#000000" });
const originals = new Map();
built.object.traverse((o: any) => { if (o.isMesh) originals.set(o, o.material); });
const shots: Record<string, string> = {};
for (const mode of ${JSON.stringify(MODES)}) {
  built.object.traverse((o: any) => { if (o.isMesh) o.material = mode === "silhouette" ? ink : originals.get(o); });
  for (const [name, degrees] of ${JSON.stringify(VIEWS)} as [string, number][]) {
    // Each view's middle line in the picture, by its name (front, quarter-left, side, back, quarter-right).
    const axis = (${JSON.stringify(AXES)} as number[])[["front", "quarter-left", "side", "back", "quarter-right"].indexOf(name)];
    const turn = THREE.MathUtils.degToRad(degrees);
    const camera = new THREE.OrthographicCamera(-axis / scale, (${W} - axis) / scale, ${GROUND} / scale, -(${H} - ${GROUND}) / scale, 0.1, 100);
    camera.position.set(Math.sin(turn) * 20, 0, Math.cos(turn) * 20);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    // The key from the camera's left, a little in front and above.
    const left = new THREE.Vector3(-1, 0, 0).applyQuaternion(camera.quaternion);
    const toward = new THREE.Vector3(Math.sin(turn), 0, Math.cos(turn));
    key.position.copy(left.multiplyScalar(6).add(toward.multiplyScalar(5)).add(new THREE.Vector3(0, 6, 0)));
    key.target.position.set(0, 1.2, 0);
    renderer.render(scene, camera);
    shots[mode + "-" + name] = canvas.toDataURL("image/png");
  }
}
// All five views share one physical studio floor; each is a clone of the actual rigged mesh.
if (${process.env.STUDIO !== "off"}) {
  built.object.traverse((o: any) => { if (o.isMesh) o.material = originals.get(o); });
  const studio = new THREE.Scene(); studio.background = new THREE.Color("#bdb3b0");
  const axes = ${JSON.stringify(AXES)} as number[];
  for (const [name, degrees] of (${JSON.stringify(VIEWS)} as [string, number][])) {
    const i = ["front", "quarter-left", "side", "back", "quarter-right"].indexOf(name);
    const figure = clone(built.object);
    figure.position.x = (axes[i] - axes[2]) / scale;
    figure.rotation.y = -THREE.MathUtils.degToRad(degrees);
    studio.add(figure);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardNodeMaterial({color:"#ccc5c5",roughness:1}));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; studio.add(floor);
  studio.add(new THREE.HemisphereLight("#fbf8f5", "#d9d2cf", 2.4));
  for (const a of [-0.8, 0.8]) for (const b of [-0.8, 0.8]) {
    const light = new THREE.DirectionalLight("#fff4eb", 1.6 / 4);
    light.position.set(-4 + a, 6, 6 + b); light.target.position.set(0, 1.2, 0);
    light.castShadow = true; light.shadow.mapSize.set(2048, 2048);
    light.shadow.camera.left = -5; light.shadow.camera.right = 5;
    light.shadow.camera.bottom = -3; light.shadow.camera.top = 4;
    light.shadow.camera.near = 0.1; light.shadow.camera.far = 30;
    light.shadow.normalBias = 0.003; light.shadow.bias = -0.000015; light.shadow.radius = 4;
    studio.add(light, light.target);
  }
  const camera = new THREE.OrthographicCamera(-axes[2] / scale, (${W} - axes[2]) / scale, ${GROUND} / scale, -(${H} - ${GROUND}) / scale, 0.1, 100);
  const tilt = THREE.MathUtils.degToRad(2);
  camera.position.set(0, 20 * Math.sin(tilt), 20 * Math.cos(tilt)); camera.lookAt(0, 0, 0);
  renderer.render(studio, camera); shots["studio"] = canvas.toDataURL("image/png");
}
// A sweep reuses one mesh through every pose, so stale updates and motion-only folds are visible.
const poseTimes: number[] = [];
const replay = new Map<string, { mesh: THREE.Mesh; points: Float32Array }[]>();
for (const sample of ${JSON.stringify(process.env.SWEEP === "on" ? [
  ...["stand", "walk", "run", "hover", "wave"].map(pose => ({ name: pose, pose: "posture:" + pose, phase: 0 })),
  ...["walk", "run"].flatMap(pose => Array.from({ length: 8 }, (_, i) => ({ name: pose + "-" + i, pose, phase: i / 8 }))),
  ...["hovering", "flying"].flatMap(move => Array.from({ length: 4 }, (_, i) => ({ name: move + "-" + i, pose: "motion:" + move, phase: i / 4 }))),
] : [])}) {
  const motion = readHumanMotion(document.body);
  const frame = sample.pose.startsWith("posture:") ? postureOf(sample.pose.slice(8) as any, motion)
    : sample.pose.startsWith("motion:") ? inPlaceOf(sample.pose.slice(7) as any, sample.phase, motion, readHoverMotion(document.body))
    : humanGaitAt(sample.pose as any, sample.phase * (sample.pose === "run" ? motion.runCycle : motion.walkCycle), motion);
  const start = performance.now(); built.pose(withExpression(frame.pose, config.expression), frame.lift); poseTimes.push(performance.now() - start);
  if (sample.name === "stand" || sample.name === "wave") {
    const meshes: { mesh: THREE.Mesh; points: Float32Array }[] = [];
    built.object.traverse((o: any) => { if (o.isMesh) meshes.push({ mesh: o, points: new Float32Array(o.geometry.getAttribute("position").array) }); });
    replay.set(sample.name, meshes);
  }
  built.object.traverse((o: any) => { if (o.isMesh) o.material = originals.get(o); });
  const axis = ${AXES[1]}, turn = Math.PI / 4;
  const camera = new THREE.OrthographicCamera(-axis / scale, (${W} - axis) / scale, ${GROUND} / scale, -(${H} - ${GROUND}) / scale, 0.1, 100);
  camera.position.set(Math.sin(turn) * 20, 0, Math.cos(turn) * 20); camera.lookAt(0, 0, 0); camera.updateMatrixWorld(true);
  key.position.set(-1, 6, 8); key.target.position.set(0, 1.2, 0);
  renderer.render(scene, camera); shots["sweep-" + sample.name] = canvas.toDataURL("image/png");
}
let replayMaxDelta = 0;
for (const [posture, meshes] of replay) {
  const frame = postureOf(posture as any, readHumanMotion(document.body)); built.pose(withExpression(frame.pose, config.expression), frame.lift);
  for (const { mesh, points } of meshes) {
    const posed = mesh.geometry.getAttribute("position").array;
    for (let i = 0; i < points.length; i++) replayMaxDelta = Math.max(replayMaxDelta, Math.abs(points[i]! - posed[i]!));
  }
}
if (!Number.isFinite(replayMaxDelta) || replayMaxDelta > 0.000001) throw new Error("Pose replay changed the surface: " + replayMaxDelta);
(window as any).__report = { buildMs: Math.round(buildMs), replayMaxDelta: poseTimes.length ? replayMaxDelta : undefined, poseMs: poseTimes.length ? { median: +[...poseTimes].sort((a,b)=>a-b)[Math.floor(poseTimes.length/2)]!.toFixed(2), max: +Math.max(...poseTimes).toFixed(2) } : undefined, triangles: Math.round(triangles), box: { w: +(box.max.x - box.min.x).toFixed(3), h: +(box.max.y - box.min.y).toFixed(3), d: +(box.max.z - box.min.z).toFixed(3), minY: +box.min.y.toFixed(3), maxY: +box.max.y.toFixed(3) }, look: lookOf(config).pieces.map((p) => p.name) };
(window as any).__shots = shots;
canvas.dataset.ready = "true";
`);
const bundle = resolve(dir, `clay-bundle-${tag}.js`);
execFileSync(process.env.ESBUILD ?? "pnpm", [...(process.env.ESBUILD ? [] : ["dlx", "esbuild"]), entry, "--bundle", "--format=esm", "--platform=browser", "--target=es2022", `--outfile=${bundle}`, "--log-level=warning"], {
  cwd: root, stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, NODE_PATH: `${root}/apps/orbit/node_modules:${root}/node_modules` },
});
const js = readFileSync(bundle, "utf8");
const browser = await chromium.launch({ channel: "chromium", headless: true, args: ["--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log(`console.${m.type()}:`, m.text().slice(0, 300)); });
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent"><canvas id="c" width="${W}" height="${H}"></canvas><script type="module">${js.replace(/<\/script>/g, "<\\/script>")}</script></body></html>`);
await page.waitForSelector('canvas[data-ready="true"]', { timeout: 120000 });
const report = await page.evaluate(() => window.__report);
const shots = await page.evaluate(() => window.__shots);
for (const [name, url] of Object.entries(shots)) writeFileSync(resolve(out, `clay-${name}.png`), Buffer.from(url.split(",")[1], "base64"));
console.log(JSON.stringify(report));
await browser.close();
execFileSync("rm", ["-f", entry, bundle]);
