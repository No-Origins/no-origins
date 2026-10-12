"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import { CAMERA_START, MOVED_KEYS, zoomBy } from "@/world/camera";
import { ENVIRONMENT_START } from "@/world/environment";
import { MAP_START, type Where } from "@/world/map";
import { PORTAL_START } from "@/world/portal";
import { BUILD_START, SECTOR_START } from "@/world/sector";
import { boxesOf, metresOf, originsOf, pickedZone, WORLD_START, type WorldData } from "@/world/hierarchy";
import { WORLD_SIZE_START } from "@/world/orbit";
import { boundsStore, buildStore, cameraStore, environmentStore, mapStore, portalOpening, portalStore, sectorStore, worldStore } from "@/world/store";
import { centreOf, portalsOn, viewOf, type ViewName } from "@/world/start";
import type { WorldEngine, WorldSettings } from "@/world/engine";
import { WorldCompass } from "@/components/world-compass";
import { Minimap } from "@/components/minimap";

/**
 * The world (World.md): one canvas, mounted once in the root layout so that it outlives every navigation (W2). The
 * engine (`src/world/engine.ts`) and three.js are loaded after the page, so the page never waits for them (W7). The
 * route picks the view.
 *
 * The world is his settings, except on a jig's page (`/build/…`, W14), where anyone may play with that jig: there that
 * one is the store's, the card's settings, and the rest stay his. On the portal's page, Play plays its opening again; on
 * the camera's, the wheel zooms its lens, a step of the Zoom control a notch, away from you in, towards you out, and a
 * drag's or a click's values are written to its store as they move, so its card shows them moving. At `/` they stay
 * the world's own.
 *
 * On the sector's page a click on the world builds into the zone picked: the engine says what the world is now, and it
 * is written to its store, so the card counts the blocks and Copy sends them back. A zone newly picked there, or made,
 * is travelled to, so what is built into is in view.
 *
 * Over the visitor's camera (`/`, the world's page, the camera's and the map's) stands the map (`minimap.tsx`), told where the camera
 * is each time it moves, with the Orbit's round and its blocks (and a portal, were one in its view, which flies the camera
 * to it); a click elsewhere on it takes the camera there.
 */
export function World() {
  const ref = useRef<HTMLCanvasElement>(null);
  const engine = useRef<WorldEngine | null>(null);
  const view = viewOf(usePathname());
  const viewNow = useRef(view);
  const [where, setWhere] = useState<Where | null>(null);
  const map = useSyncExternalStore(mapStore.subscribe, () => (view === "map" ? mapStore.get() : MAP_START), () => MAP_START);
  // The world's boundaries (W29): someone's on the World page, where they are set; his everywhere else.
  const size = useSyncExternalStore(boundsStore.subscribe, () => (view === "world" ? boundsStore.get() : WORLD_SIZE_START), () => WORLD_SIZE_START);

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
                  if (viewNow.current === "sector") worldStore.set(world);
                },
              })))
      .then((world) => {
        if (!world) return;
        if (disposed) return world.dispose();
        engine.current = world;
        const played = () => world.set(settingsFor(viewNow.current));
        let picked = buildStore.get().zone;
        const builds = () => {
          played();
          const { zone } = buildStore.get();
          if (zone === picked) return;
          picked = zone;
          if (viewNow.current !== "sector") return;
          const [x, z] = middleOf(worldStore.get(), zone);
          world.travelTo(x, z);
        };
        const stops = [
          boundsStore.subscribe(played),
          portalStore.subscribe(played),
          environmentStore.subscribe(played),
          cameraStore.subscribe(played),
          sectorStore.subscribe(played),
          worldStore.subscribe(played),
          buildStore.subscribe(builds),
          portalOpening.subscribe(() => world.open()),
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
  }, []);

  // The map, over the visitor's camera: the Orbit, its blocks and the portals this view shows (none: the portal stands
  // only on its own page).
  const shown = settingsFor(view);
  const portals = portalsOn(view).map((cell) => ({ ...centreOf(cell), radius: shown.portal.radius + shown.portal.rimWidth }));
  const visitor = view !== "portal";

  return (
    <div data-slot="world" className="fixed inset-0">
      <canvas ref={ref} tabIndex={0} aria-label="Orbit world. Use WASD or arrow keys to travel." className="block size-full touch-none outline-none" />
      {where ? <WorldCompass where={where} size={size} /> : null}
      {visitor && where ? (
        <Minimap
          map={map}
          where={where}
          size={size}
          portals={portals}
          onPortal={(index) => engine.current?.focusPortal(index)}
          onTravel={(x, z) => engine.current?.travelTo(x, z)}
        />
      ) : null}
    </div>
  );
}

/** How far the wheel turns for one step of zoom, in its pixels: a notch of a mouse's wheel. */
const WHEEL_STEP = 100;

/** The settings a view shows: on a jig's page, that jig's as played there; everything else, his. */
function settingsFor(view: ViewName): WorldSettings {
  const building = view === "sector";
  return {
    bounds: view === "world" ? boundsStore.get() : WORLD_SIZE_START,
    portal: view === "portal" ? portalStore.get() : PORTAL_START,
    environment: view === "environment" ? environmentStore.get() : ENVIRONMENT_START,
    camera: view === "camera" ? cameraStore.get() : CAMERA_START,
    sector: building ? sectorStore.get() : SECTOR_START,
    world: building ? worldStore.get() : WORLD_START,
    build: building ? buildStore.get() : BUILD_START,
  };
}

/** Where a zone is, over the ground, in metres: the middle of its blocks, or its origin while it has none. */
function middleOf(world: WorldData, zone: string): [number, number] {
  const id = pickedZone(world, zone).id;
  const boxes = boxesOf(world).filter((box) => box.zone === id);
  if (!boxes.length) {
    const [x, , z] = metresOf(originsOf(world).get(id) ?? [0, 0, 0]);
    return [x, z];
  }
  const [x0, , z0] = metresOf([Math.min(...boxes.map((box) => box.from[0])), Math.min(...boxes.map((box) => box.from[1])), 0]);
  const [x1, , z1] = metresOf([Math.max(...boxes.map((box) => box.to[0])), Math.max(...boxes.map((box) => box.to[1])), 0]);
  return [(x0 + x1) / 2, (z0 + z1) / 2];
}
