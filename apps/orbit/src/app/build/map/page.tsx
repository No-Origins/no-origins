import type { Metadata } from "next";

import { MapJig } from "@/components/jigs";

export const metadata: Metadata = { title: "Map" };

/** The map's page (World.md W14): the visitor's camera, as at `/`, its map at the top right, and the map's jig. */
export default function MapPage() {
  return <MapJig />;
}
