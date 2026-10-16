"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Maximize2Icon, Minimize2Icon } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@no-origins/ui/components/tooltip";

import { IconAction, JigCard } from "@/components/jig-card";
import { WORLD_JIG } from "@/world/bounds";
import { BuildControls, ItemJig, notesOf, SectorControls, type Libraries } from "@/components/spaces-world";
import { CAMERA_JIG } from "@/world/camera";
import { CLOUDS_JIG } from "@/world/clouds";
import { fullView } from "@/world/full-view";
import { environmentKeys, environmentPage, type ENVIRONMENT_PAGES, type EnvironmentData } from "@/world/environment";
import { metresOf, sectorsOf, worldLines, type WorldData } from "@/world/hierarchy";
import { humanJigOf } from "@/world/human";
import { jigSettings } from "@/world/jig";
import { MAP_JIG } from "@/world/map";
import { MOUNTAIN_JIG } from "@/world/mountain-jig";
import { SPACES_JIG } from "@/world/spaces";
import { boundsStore, buildStore, cameraStore, cloudsStore, environmentLibrary, environmentPageStore, environmentStore, humanLibrary, humanStore, mapStore, mountainLibrary, mountainStore, placeStore, publishedEnvironment, publishedWorld, spacesStore, worldLibrary, worldStore } from "@/world/store";

/** The environment as its pages tune it (World.md W75): each part this browser's where it keeps its own, else as published. */
function useEnvironment(): EnvironmentData {
  const atmosphere = useSyncExternalStore(environmentStore.subscribe, environmentStore.get, environmentStore.start);
  const clouds = useSyncExternalStore(cloudsStore.subscribe, cloudsStore.get, cloudsStore.start);
  const camera = useSyncExternalStore(cameraStore.subscribe, cameraStore.get, cameraStore.start);
  const map = useSyncExternalStore(mapStore.subscribe, mapStore.get, mapStore.start);
  return { atmosphere, clouds, camera, map };
}

/**
 * The environment's one item on an Environment page's card (W75; his: "we don't need names in environment. We need
 * versions to keep publishing"): no variants and no name; Save keeps the whole environment as its draft and Publish
 * makes it the next version, both in the card's own menu, the version the world shows on its status line; Reset puts
 * back this page's part as saved.
 */
function useEnvironmentOnCard(reset: (saved: EnvironmentData) => void) {
  return { store: environmentLibrary, current: useEnvironment(), apply: reset, single: true };
}

/** Each jig's card, bound to its store, for its page (World.md W14). */
export function CloudsJig() {
  return <JigCard jig={CLOUDS_JIG} store={cloudsStore} library={useEnvironmentOnCard((saved) => cloudsStore.set(saved.clouds))} />;
}
export function CameraJig() {
  return <JigCard jig={CAMERA_JIG} store={cameraStore} library={useEnvironmentOnCard((saved) => cameraStore.set(saved.camera))} />;
}
export function MapJig() {
  return <JigCard jig={MAP_JIG} store={mapStore} library={useEnvironmentOnCard((saved) => mapStore.set(saved.map))} />;
}

/** The Environment's pages (World.md W73): each a slice of the one atmosphere jig and its one store. */
export function EnvironmentPageJig({ page }: { page: keyof typeof ENVIRONMENT_PAGES }) {
  const library = useEnvironmentOnCard((saved) => environmentStore.set(Object.fromEntries(environmentKeys(page).map((key) => [key, saved.atmosphere[key]]))));
  return <JigCard jig={environmentPage(page)} store={environmentPageStore(page)} library={library} />;
}

/**
 * The elements' cards (World.md W72, W73): each tunes one of the element alone, with its variants from the database.
 * The human's shows its Form's own groups (W102): the Suit's or the Clay's, with the Figure and the Gait both share.
 */
export function HumanJig() {
  const config = useSyncExternalStore(humanStore.subscribe, humanStore.get, humanStore.start);
  // Float Glide is Clay's ability. Changing form keeps the closest supported Suit motion (W107).
  const store = { ...humanStore, set: (next: Partial<typeof config>) => humanStore.set(
    next.form === "suit" && config.moves === "gliding" ? { ...next, moves: "flying" } : next,
  ) };
  return <JigCard jig={humanJigOf(config.form)} store={store} library={{ store: humanLibrary }} />;
}

/** The mountain's card (W72, W73); W64: only the finish controls the picked glass uses are shown. */
export function MountainJig() {
  const config = useSyncExternalStore(mountainStore.subscribe, mountainStore.get, mountainStore.start);
  const shown = { ...MOUNTAIN_JIG, groups: MOUNTAIN_JIG.groups.map((group) => group.title !== "Glass" ? group : {
    ...group, controls: group.controls.filter((control) => config.cap === "stone" ? control.key === "cap" :
      config.cap === "mirror" ? ["cap", "glassTint", "glassRoughness"].includes(control.key) : true),
  }) };
  return <JigCard jig={shown} store={mountainStore} library={{ store: mountainLibrary }} />;
}

/** The world as the building pages have it: the browser's where something was built or placed here, else as published. */
function useWorld(): WorldData {
  const kept = useSyncExternalStore(worldStore.subscribe, worldStore.get, worldStore.start);
  useSyncExternalStore(worldLibrary.subscribe, worldLibrary.get, worldLibrary.start);
  return worldStore.kept() ? kept : publishedWorld();
}

/** The world's library on a card: the one item, its draft and its versions, the current world what Save keeps. */
const worldOnCard = (current: WorldData) => ({ store: worldLibrary, current, apply: (world: WorldData) => worldStore.set(world), single: true });

/**
 * The World page's card (World.md W29, W73, W82): the world's size, and its sectors, each where it stands and how big,
 * drawn by their edges in the world; nothing is placed here (his: "we will not place anything in the world
 * explicitly"): sectors are made, and elements placed into them, on the Sectors page. Save and Publish keep the
 * world (its one item).
 */
export function WorldJig() {
  const world = useWorld();
  const full = useFullView();
  const sectors = sectorsOf(world).map((sector) => {
    const [x, y, z] = metresOf(sector.at);
    return `${sector.name}, ${sector.size.join(" × ")} m at ${x}, ${y}, ${z} m`;
  });
  const notes = { Sectors: `${sectors.join("; ")}. Sectors are made, and blocks and elements put into them, on the Sectors page. C takes you down to walk it as the human you placed nearest where you look (none placed, it does nothing); C again goes into its helmet, and again (or Escape) back up here. F shows the world in full view, and F or Escape brings the card back.` };
  if (full) return <FullViewExit />;
  return (
    <JigCard
      actions={<IconAction label="Full view (F)" icon={Maximize2Icon} onClick={() => fullView.set(true)} />}
      jig={WORLD_JIG}
      store={boundsStore}
      notes={notes}
      open={["Sectors"]}
      library={worldOnCard(world)}
      copy={() => [jigSettings(WORLD_JIG, boundsStore.get()), ...worldLines(world)].join("\n")}
    />
  );
}

/**
 * Full view on the World page (World.md W105; his: "Give an option to view the world in full view in the world"): the
 * card's Full view, or F, puts the sidebar, the card, the compass and the map away, and the world is alone on the
 * screen, looked round and walked as before; F again, Escape or the one button left at the top right brings them back.
 * Escape on foot goes back up to the builder's camera first (W100), so it leaves full view only from there. The page
 * left, the interface comes back.
 */
function useFullView() {
  const full = useSyncExternalStore(fullView.subscribe, fullView.get, fullView.start);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat || typing()) return;
      if (event.code === "KeyF") {
        event.preventDefault();
        fullView.set(!fullView.get());
      } else if (event.key === "Escape" && fullView.get() && onBuilderCamera()) fullView.set(false);
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      fullView.set(false);
    };
  }, []);
  return full;
}

/** Whether a field or a control has the keys (as the engine's `busy`): F and Escape are theirs then. */
function typing() {
  const active = document.activeElement;
  return active instanceof HTMLElement && (active.isContentEditable || active.closest("input, textarea, select, [role='slider'], [role='listbox'], [role='menu']") !== null);
}

/** Whether the World page looks through the builder's camera, not on foot or on the way down or up (W100). */
function onBuilderCamera() {
  const camera = document.querySelector<HTMLCanvasElement>("[data-slot='world'] canvas")?.dataset.camera;
  return !camera || camera === "builder";
}

/** The one thing over the world in full view: the way back to the interface. */
function FullViewExit() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Leave full view (F)" className="pointer-events-auto fixed top-4 right-4 bg-background" onClick={() => fullView.set(false)}>
          <Minimize2Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Leave full view (F)</TooltipContent>
    </Tooltip>
  );
}

/**
 * The Sectors page's cards (World.md W24, W25, W81, W82, W89). On the left, the Sectors card: its own settings, the
 * grain, with the sector picked and Build's Tool and Item drawn over them from their own stores; Sector and Build open
 * as it arrives, since a sector is made and placed first (his: "once I create the sector … the camera should take me
 * to that location"), and what is built and placed goes into it (W91: no zones).
 * Reset puts the grain back and never touches what is built; Copy sends the grain and what is built, not how it is being
 * built; Save and Publish keep the world (W73). On the right, the item's card (his, W89: "the controls related to the
 * element should be on the right"): what the next one placed takes, or what is picked.
 */
export function SpacesJig() {
  const world = useWorld();
  const build = useSyncExternalStore(buildStore.subscribe, buildStore.get, buildStore.start);
  const place = useSyncExternalStore(placeStore.subscribe, placeStore.get, placeStore.start);
  const mountains = useSyncExternalStore(mountainLibrary.subscribe, mountainLibrary.get, mountainLibrary.start);
  const humans = useSyncExternalStore(humanLibrary.subscribe, humanLibrary.get, humanLibrary.start);
  // The map over the page (the environment's, as published, W75), under the compass: the item's card stands under it.
  useSyncExternalStore(environmentLibrary.subscribe, environmentLibrary.get, environmentLibrary.start);
  const map = publishedEnvironment().map;
  const below = map.shown ? `calc(10rem + min(${map.size}px, 40vw) + 1rem)` : undefined;
  const libraries: Libraries = { mountain: mountains, human: humans };
  return (
    <>
      <JigCard
        jig={SPACES_JIG}
        store={spacesStore}
        notes={notesOf(world, build)}
        library={worldOnCard(world)}
        open={["Sector", "Build"]}
        sections={{
          Sector: () => <SectorControls world={world} build={build} />,
          Build: () => <BuildControls build={build} />,
        }}
        copy={(spaces) => [jigSettings(SPACES_JIG, spaces), ...worldLines(world)].join("\n")}
      />
      <ItemJig world={world} build={build} place={place} libraries={libraries} below={below} />
    </>
  );
}
