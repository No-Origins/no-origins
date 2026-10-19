import * as THREE from "three/webgpu";
import { loadLevelItems } from "./load-level";
import { compileReveal, loadingReveal } from "./loading-reveal";

export type WorldLoadItem = {
  id: string;
  load: () => Promise<THREE.Object3D[]>;
  reveal?: boolean;
};

/** One slow frame may advance a reveal by at most this much: a stall (a build, a
 * late shadow pipeline) slows the rise rather than skipping it to the end. */
const LONGEST_FRAME = 50;

/** World.md W111: synchronous builders take turns, a painted frame between each,
 * so an item that has arrived keeps revealing while its siblings are still built. */
export function buildTurns() {
  let tail = Promise.resolve();
  return () => {
    const turn = tail.then(() => new Promise<void>(resolve =>
      requestAnimationFrame(() => setTimeout(resolve, 0))));
    tail = turn;
    return turn;
  };
}

/** World.md W111: a level is a barrier; items within it present independently.
 * A single render pump owns the GPU, even when downloads/builds finish together.
 */
export function worldLoading(host: HTMLCanvasElement, scene: THREE.Scene,
  renderer: THREE.WebGPURenderer, camera: THREE.Camera, reduced: MediaQueryList) {
  type Pending = {
    id: string; objects: THREE.Object3D[]; holder: THREE.Group;
    reveal: ReturnType<typeof loadingReveal> | null;
    elapsed: number; last: number | null; resolve: () => void; reject: (error: unknown) => void;
  };
  const active: Pending[] = [];
  const states: Record<string, string> = {};
  let pumping = false;
  const report = () => {
    host.dataset.loadingItems = JSON.stringify(states);
    const revealing = active.filter(item => item.reveal);
    if (revealing.length) host.dataset.revealing = revealing.map(item => item.id).join(",");
    else delete host.dataset.revealing;
    host.dataset.loadingProgress = JSON.stringify(Object.fromEntries(revealing.map(item =>
      [item.id, Math.min(1, item.elapsed / Math.max(1, item.reveal!.duration))])));
  };
  // The item leaves its loading holder for the scene in the frame its reveal ends.
  const settle = (item: Pending) => {
    item.reveal?.finish();
    item.objects.forEach(object => scene.add(object));
    item.holder.removeFromParent();
  };
  const frame = () => new Promise<number>(resolve => requestAnimationFrame(resolve));
  async function pump() {
    if (pumping) return;
    pumping = true;
    try {
      while (active.length) {
        const now = await frame();
        // An item arriving during a render joins the next frame, with its own clock.
        const batch = [...active];
        for (const item of batch) {
          if (item.last !== null && !document.hidden) item.elapsed += Math.min(LONGEST_FRAME, Math.max(0, now - item.last));
          if (item.last !== null && item.reveal) {
            item.reveal.set(reduced.matches ? 1 : item.elapsed / Math.max(1, item.reveal.duration));
          }
        }
        const complete = batch.filter(item => !item.reveal || reduced.matches
          || (item.last !== null && item.elapsed >= item.reveal.duration));
        complete.forEach(settle);
        renderer.render(scene, camera);
        const painted = performance.now();
        for (const item of batch) {
          // The first render shows the item's base before its animation clock starts.
          if (item.last === null) { item.last = painted; states[item.id] = "revealing"; }
          else item.last = now;
        }
        for (const item of complete) {
          active.splice(active.indexOf(item), 1);
          states[item.id] = "complete";
          item.resolve();
        }
        report();
      }
    } catch (error) {
      for (const item of active.splice(0)) {
        settle(item); states[item.id] = "failed"; item.reject(error);
      }
      report();
    } finally { pumping = false; }
  }
  return async (level: 1 | 2 | 3, items: WorldLoadItem[]) => {
    host.dataset.stage = `level-${level}`;
    // All loaders start together. Each completion enqueues its reveal immediately;
    // The level barrier is only the barrier before the following priority level.
    const pause = () => { active.forEach(item => { item.last = null; }); };
    document.addEventListener("visibilitychange", pause);
    try {
    await loadLevelItems(items, async item => {
      try {
        states[item.id] = "loading"; report();
        const objects = await item.load();
        const holder = new THREE.Group(); holder.name = `${item.id}-loading`;
        objects.forEach(object => holder.add(object));
        // Compile off-screen first, the item's own paints and then its loading paints:
        // a pipeline compiled inside the pump stalls it, and the reveal pops at its
        // start (the loading paints) or its end (the restored ones) instead of rising.
        await compileReveal(renderer, holder, camera, scene);
        const reveal = item.reveal !== false && !reduced.matches ? loadingReveal(host, objects) : null;
        if (reveal) await compileReveal(renderer, holder, camera, scene);
        scene.add(holder);
        await new Promise<void>((resolve, reject) => {
          active.push({ id: item.id, objects, holder, reveal, elapsed: 0, last: null, resolve, reject });
          report(); void pump();
        });
      } catch (error) { states[item.id] = "failed"; report(); throw error; }
    });
    } finally { document.removeEventListener("visibilitychange", pause); }
  };
}
