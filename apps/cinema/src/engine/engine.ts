import * as THREE from "three";

import { resolve } from "./controls.ts";
import type { Library } from "./library.ts";
import { fieldOfView, radians } from "./math.ts";
import { holding } from "./shot.ts";
import type { AssetBook, Built, CameraEntry, CameraPose, Entry, EntryKind, Item, Shot, Use, World } from "./types.ts";

/**
 * The engine (Cinema-Engine.md E2): plain three.js on a canvas, mounted as Home's viewer is. It is asked one thing,
 * "draw the shot at second t", and the same t is the same picture however it is reached: nothing here reads the clock.
 * The screen drives t from its own clock to play; the renderer steps t frame by frame (E7).
 */
export type Engine = {
  /** Builds a shot's world, cast and lights, with his saved assets to hand. Says what it could not build. */
  load: (shot: Shot, assets?: AssetBook) => string[];
  /** Draws the moment `t`, through the shot's camera, or through `pose` when one is given (the screen's free look). */
  draw: (t: number, pose?: CameraPose) => void;
  /** Where the shot's camera is at `t`. */
  poseAt: (t: number) => CameraPose;
  /** The drawing's size in pixels, and how many device pixels to a pixel. */
  size: (width: number, height: number, pixelRatio?: number) => void;
  dispose: () => void;
};

/** A world when the shot has none yet: a plain floor's worth of space. */
const EMPTY_WORLD: World = { focus: [0, 1, 0], radius: 10, heightAt: () => 0, sky: "#e7e5e4", haze: 0 };

export function createEngine(canvas: HTMLCanvasElement, library: Library, options: { preserve?: boolean } = {}): Engine {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: options.preserve ?? false, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 5000);
  let aspect = 16 / 9;
  let shot: Shot | null = null;
  let world = EMPTY_WORLD;
  let built: Built[] = [];
  let lights: { item: Item; object: THREE.Object3D }[] = [];

  function entryFor<K extends EntryKind>(use: Use, kind: K, problems: string[]): Extract<Entry, { kind: K }> | undefined {
    const entry = library.find(use.entry, use.version);
    if (!entry) {
      const has = library.versions(use.entry);
      problems.push(has.length ? `${use.entry}@${use.version} is not in the library (it has ${has.join(", ")})` : `the library has no ${use.entry}`);
      return undefined;
    }
    if (entry.kind !== kind) {
      problems.push(`${use.entry} is ${entry.kind === "environment" ? "an" : "a"} ${entry.kind}, not a ${kind}`);
      return undefined;
    }
    return entry as Extract<Entry, { kind: K }>;
  }

  function add(piece: Built) {
    scene.add(piece.object);
    built.push(piece);
    return piece.object;
  }

  function clear() {
    for (const piece of built) {
      scene.remove(piece.object);
      piece.dispose?.();
    }
    built = [];
    lights = [];
  }

  function load(next: Shot, assets: AssetBook = {}) {
    clear();
    const problems: string[] = [];
    world = EMPTY_WORLD;
    if (next.world) {
      const entry = entryFor(next.world, "environment", problems);
      if (entry) {
        const piece = entry.build(resolve(entry.controls, next.world.values), { library, assets, cells: next.world.cells ?? {} });
        add(piece);
        world = piece.world;
      }
    }
    scene.background = new THREE.Color(world.sky);
    scene.fog = world.haze > 0 ? new THREE.FogExp2(world.sky, world.haze) : null;
    camera.far = Math.max(1000, world.radius * 40);

    for (const placement of next.cast) {
      const entry = entryFor(placement, "cast", problems);
      if (!entry) continue;
      const figure = add(entry.build(resolve(entry.controls, placement.values)));
      const [x, z] = placement.at;
      figure.position.set(x, world.heightAt(x, z), z);
      figure.rotation.y = radians(placement.facing);
    }

    let lit = false;
    for (const track of next.tracks) {
      if (track.kind !== "light") continue;
      for (const item of track.items) {
        const entry = entryFor(item, "light", problems);
        if (!entry) continue;
        lights.push({ item, object: add(entry.build(resolve(entry.controls, item.values), world)) });
        lit = true;
      }
    }
    // A shot with no light yet is lit by the plain sun, so there is something to see; it is not part of the shot.
    if (!lit) {
      const sun = library.find("sun", 1);
      if (sun?.kind === "light") add(sun.build(resolve(sun.controls, {}), world));
    }
    shot = next;
    return problems;
  }

  function poseAt(t: number): CameraPose {
    const track = shot?.tracks.find((candidate) => candidate.kind === "camera");
    const held = track ? holding(track, t) : undefined;
    const entry = held ? library.find(held.item.entry, held.item.version) : undefined;
    if (held && entry?.kind === "camera") return (entry as CameraEntry).pose(resolve(entry.controls, held.item.values), held.u, world);
    return { position: [world.focus[0], world.focus[1] + world.radius * 0.5, world.focus[2] + world.radius * 1.9], target: world.focus, lens: 35 };
  }

  function draw(t: number, override?: CameraPose) {
    if (!shot) return;
    for (const piece of built) piece.at?.(t);
    for (const light of lights) light.object.visible = light.item.start <= t && t <= light.item.start + light.item.length;

    const pose = override ?? poseAt(t);
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);
    camera.aspect = aspect;
    camera.fov = fieldOfView(pose.lens, aspect);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }

  return {
    load,
    draw,
    poseAt,
    size(width, height, pixelRatio = 1) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      aspect = width / height;
    },
    dispose() {
      clear();
      renderer.dispose();
    },
  };
}
