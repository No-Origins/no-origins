"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import { MOVED_KEYS, zoomBy } from "@/world/camera";
import { HUMAN_START, HUMAN_VERSION } from "@/world/human";
import type { Library } from "@/world/library";
import type { Where } from "@/world/map";
import { MOUNTAIN_START, MOUNTAIN_VERSION } from "@/world/mountain-jig";
import { nextSeed, PLACE_START } from "@/world/place";
import { BUILD_START, SPACES_START } from "@/world/spaces";
import { byId } from "@/world/variants";
import { roomOf, sectorOf } from "@/world/hierarchy";
import { WORLD_SIZE } from "@/world/orbit";
import { fullView } from "@/world/full-view";
import { buildStore, cameraStore, cloudsStore, environmentStore, humanLibrary, humanStore, mapStore, mountainLibrary, mountainStore, placeStore, publishedEnvironment, publishedWorld, sectorFraming, spacesStore, worldLibrary, worldStore } from "@/world/store";
import { viewOf, type ViewName } from "@/world/start";
import type { WorldEngine, WorldSettings } from "@/world/engine";
import { WorldCompass } from "@/components/world-compass";
import { Minimap } from "@/components/minimap";

/**
 * The world (World.md): one canvas, mounted once in the root layout so that it outlives every navigation (W2). The
 * engine (`src/world/engine.ts`) and three.js are loaded after the page, so the page never waits for them (W7). The
 * route picks the view.
 *
 * The world is his, as published (W73: the elements' variants and the world from the database, W75: the environment
 * too, his published copy in code until they are read), except on a jig's page (`/build/…`, W14), where anyone may play with that jig: there that
 * one is the store's, the card's settings, and the rest stay his. An element's page shows that element alone (W72).
 * On the camera's page, the wheel zooms its lens, a step of the Zoom
 * control a notch, away from you in, towards you out, and a drag's or a click's values are written to its store as
 * they move, so its card shows them moving. At `/` they stay the world's own.
 *
 * On the Sectors page a click on the world builds a block or places an element into the sector picked, or with Select
 * picks blocks or an element for the card's Picked group, and a drag moves an element (W24, W73, W82): the engine says
 * what the world is now, and it is written to its store, so the card counts what stands and Copy sends it back; Save
 * and Publish keep it. The World page places nothing (W82): it shows the world as the sectors build it, every sector
 * drawn by its edges. On the Sectors page the camera goes to the sector picked (W81): as the page comes into view, and
 * whenever a sector is picked, made, moved or sized, or Go to it is pressed, so the sector is whole in view.
 *
 * Over the visitor's camera (`/`, the camera's page and the map's) stands the map (`minimap.tsx`), told where the
 * camera is each time it moves, with the Orbit's round; a click on it takes the camera there.
 */
export function World() {
  const rendererVersion = `${MOUNTAIN_VERSION}:${HUMAN_VERSION}`;
  const ref = useRef<HTMLCanvasElement>(null);
  const engine = useRef<WorldEngine | null>(null);
  const view = viewOf(usePathname());
  const viewNow = useRef(view);
  const [where, setWhere] = useState<Where | null>(null);
  const map = useSyncExternalStore(mapStore.subscribe, () => (view === "map" ? mapStore.get() : publishedEnvironment().map), mapStore.start);
  // The World page's full view (W105) puts the compass and the map away with the rest of the interface.
  const full = useSyncExternalStore(fullView.subscribe, fullView.get, fullView.start);

  // The pointer is the design system's ring (Grid.md D34; his: "Looks like Cursor is not used from design system. We
  // should"), over the whole page, the world and the interface over it, and whatever portals to the body: the page
  // carries `data-cursor` where the device hovers with a fine pointer, as the grid's field does, so a phone keeps its own.
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const read = () => document.body.toggleAttribute("data-cursor", query.matches);
    read();
    query.addEventListener("change", read);
    return () => {
      query.removeEventListener("change", read);
      document.body.removeAttribute("data-cursor");
    };
  }, []);

  useEffect(() => {
    viewNow.current = view;
    engine.current?.set(settingsFor(view));
    engine.current?.setView(view);
    // The Sectors page arrives at the sector picked, there at once (W81).
    if (engine.current) frameSector(engine.current, view, true);
  }, [view]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || view !== "camera") return;
    let held = 0;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      held += event.deltaY;
      const steps = Math.trunc(held / WHEEL_STEP);
      if (!steps) return;
      held -= steps * WHEEL_STEP;
      cameraStore.set({ zoom: zoomBy(cameraStore.get(), -steps) });
    };
    canvas.addEventListener("wheel", wheel, { passive: false });
    return () => canvas.removeEventListener("wheel", wheel);
  }, [view]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    delete canvas.dataset.ready;
    delete canvas.dataset.unavailable;
    let disposed = false;
    let unsubscribe = () => {};

    import("@/world/engine")
      .then(({ createWorld }) => (disposed ? null : createWorld(canvas, {
                settings: settingsFor(viewNow.current),
                view: viewNow.current,
                onEye: (eye) => {
                  if (viewNow.current === "camera") cameraStore.set(Object.fromEntries(MOVED_KEYS.map((key) => [key, eye[key]])));
                },
                onWhere: setWhere,
                onWorld: (world) => {
                  if (viewNow.current === "spaces") worldStore.set(world);
                },
                onPick: (picked, joint) => {
                  if (viewNow.current === "spaces") placeStore.set({ picked, joint: joint ?? null });
                },
                onPickBlocks: (picked) => {
                  if (viewNow.current === "spaces") buildStore.set({ picked });
                },
                onTool: (tool) => {
                  if (viewNow.current === "spaces") buildStore.set({ tool });
                },
                onPlaced: (kind) => {
                  // The next grove is scattered by another seed, so two groves never stand alike (W89).
                  if (kind === "tree") placeStore.set({ seed: nextSeed(placeStore.get().seed) });
                },
              })))
      .then((world) => {
        if (!world) return;
        if (disposed) return world.dispose();
        engine.current = world;
        const played = () => world.set(settingsFor(viewNow.current));
        // A sector picked, made, moved or sized takes the camera to it on the Sectors page (W81); a block built does not.
        const builds = () => {
          played();
          frameSector(world, viewNow.current);
        };
        frameSector(world, viewNow.current, true);
        const stops = [
          environmentStore.subscribe(played),
          mountainStore.subscribe(played),
          cloudsStore.subscribe(played),
          cameraStore.subscribe(played),
          humanStore.subscribe(played),
          spacesStore.subscribe(played),
          worldStore.subscribe(builds),
          placeStore.subscribe(played),
          mountainLibrary.subscribe(played),
          humanLibrary.subscribe(played),
          worldLibrary.subscribe(played),
          buildStore.subscribe(builds),
          sectorFraming.subscribe(() => frameSector(world, viewNow.current, false, true)),
        ];
        unsubscribe = () => stops.forEach((stop) => stop());
      })
      .catch(() => {
        // Neither WebGPU nor WebGL 2: the places are still pages (W11).
        canvas.dataset.unavailable = "true";
      });

    return () => {
      disposed = true;
      unsubscribe();
      engine.current?.dispose();
      engine.current = null;
    };
  // W64, W66: a new mountain or human renderer version replaces a running engine during development refresh.
  // Ordinary settings still retune the existing engine through its subscriptions.
  }, [rendererVersion]);

  // The map, over the visitor's camera: the Orbit; its Shown switch (W76) takes it away.

  return (
    <div data-slot="world" className="fixed inset-0">
      <canvas ref={ref} tabIndex={0} aria-label="Orbit world. Use WASD or arrow keys to travel." className="block size-full touch-none outline-none" />
      {where && !full ? <WorldCompass where={where} size={WORLD_SIZE} /> : null}
      {where && map.shown && !full ? (
        <Minimap
          // On a phone's Sectors page the item card stands where the map would (W89, mine).
          className={view === "spaces" ? "max-md:hidden" : undefined}
          map={map}
          where={where}
          size={WORLD_SIZE}
          onTravel={(x, z) => engine.current?.travelTo(x, z)}
        />
      ) : null}
    </div>
  );
}

/** How far the wheel turns for one step of zoom, in its pixels: a notch of a mouse's wheel. */
const WHEEL_STEP = 100;

/** The variants of a library by id, the same object while the library has not changed, so the engine remakes nothing for nothing. */
const variantsById = new WeakMap<Library<object>, Record<string, object>>();
function variantsOf<C extends object>(library: Library<C>): Record<string, C> {
  let held = variantsById.get(library as Library<object>);
  if (!held) {
    held = byId(library.variants);
    variantsById.set(library as Library<object>, held);
  }
  return held as Record<string, C>;
}

/**
 * The settings a view shows: on a jig's page, that jig's as played there; everything else, his. The world is the one
 * being built or placed on the Sector and World pages, where this browser holds one, else the world as published
 * (W73); a mountain's and a human's variants are the libraries' everywhere, so what is published, or what he last
 * saved, is what the placed ones are drawn from (a pipe, a road and a grove carry their own look, W93); and the
 * environment, the atmosphere, the clouds and the camera, is as published (W75) but on the page tuning it.
 */
function settingsFor(view: ViewName): WorldSettings {
  const building = view === "spaces" || view === "world";
  const environment = publishedEnvironment();
  return {
    bounds: WORLD_SIZE,
    environment: view === "environment" ? environmentStore.get() : environment.atmosphere,
    mountains: variantsOf(mountainLibrary.get()),
    mountain: view === "mountain" ? mountainStore.get() : MOUNTAIN_START,
    humanVariants: variantsOf(humanLibrary.get()),
    clouds: view === "clouds" ? cloudsStore.get() : environment.clouds,
    camera: view === "camera" ? cameraStore.get() : environment.camera,
    human: view === "human" ? humanStore.get() : HUMAN_START,
    spaces: building ? spacesStore.get() : SPACES_START,
    world: building && worldStore.kept() ? worldStore.get() : publishedWorld(),
    build: view === "spaces" ? buildStore.get() : BUILD_START,
    place: view === "spaces" ? placeStore.get() : PLACE_START,
  };
}

/** The sector room last framed: the camera goes again only when the room picked moves, grows or is another (W81). */
let framed = "";

/**
 * Takes the camera to the sector picked on the Sectors page (W81): the room of the sector picked, in the world
 * the page builds on; `instant` as the page arrives, `again` for Go to it, which goes even to the room last framed.
 */
function frameSector(engine: WorldEngine, view: ViewName, instant = false, again = false) {
  if (view !== "spaces") {
    framed = "";
    return;
  }
  const world = settingsFor("spaces").world;
  const room = roomOf(sectorOf(world, buildStore.get().sector));
  const key = JSON.stringify(room);
  if (key === framed && !again && !instant) return;
  framed = key;
  engine.frame(room, instant);
}
