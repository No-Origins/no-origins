"use client";

import { useSyncExternalStore } from "react";

import { JigCard } from "@/components/jig-card";
import { WORLD_JIG } from "@/world/bounds";
import { BuildControls, notesOf, UnitControls } from "@/components/sector-world";
import { CAMERA_JIG } from "@/world/camera";
import { ENVIRONMENT_JIG } from "@/world/environment";
import { worldLines } from "@/world/hierarchy";
import { jigSettings } from "@/world/jig";
import { MAP_JIG } from "@/world/map";
import { PORTAL_JIG } from "@/world/portal";
import { SECTOR_JIG } from "@/world/sector";
import { boundsStore, buildStore, cameraStore, environmentStore, mapStore, portalOpening, portalStore, sectorStore, worldStore } from "@/world/store";

/** Each jig's card, bound to its store, for its page (World.md W14). Only the portal has a motion to Play. */
export const WorldJig = () => <JigCard jig={WORLD_JIG} store={boundsStore} />;
export const EnvironmentJig = () => <JigCard jig={ENVIRONMENT_JIG} store={environmentStore} />;
export const CameraJig = () => <JigCard jig={CAMERA_JIG} store={cameraStore} />;
export const MapJig = () => <JigCard jig={MAP_JIG} store={mapStore} />;
export const PortalJig = () => <JigCard jig={PORTAL_JIG} store={portalStore} onPlay={portalOpening.play} />;

/**
 * The sector's card (World.md W25): its own settings, the grain, with the world's hierarchy and the builder drawn over
 * them from their own stores. Reset puts the grain back and never touches what is built; Copy sends the grain and what
 * is built, not how it is being built.
 */
export function SectorJig() {
  const world = useSyncExternalStore(worldStore.subscribe, worldStore.get, worldStore.start);
  const build = useSyncExternalStore(buildStore.subscribe, buildStore.get, buildStore.start);
  return (
    <JigCard
      jig={SECTOR_JIG}
      store={sectorStore}
      notes={notesOf(world, build)}
      sections={{
        Ecosystem: () => <UnitControls kind="ecosystem" world={world} build={build} />,
        Habitat: () => <UnitControls kind="habitat" world={world} build={build} />,
        Sector: () => <UnitControls kind="sector" world={world} build={build} />,
        Zone: () => <UnitControls kind="zone" world={world} build={build} />,
        Build: () => <BuildControls build={build} />,
      }}
      copy={(sector) => [jigSettings(SECTOR_JIG, sector), ...worldLines(world)].join("\n")}
    />
  );
}
