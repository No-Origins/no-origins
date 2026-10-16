import type { Metadata } from "next";

import { SpacesJig } from "@/components/jigs";

export const metadata: Metadata = { title: "Sectors" };

/**
 * Spaces' Sectors page (World.md W81): the world as it is placed, its sectors drawn by their edges, the camera at the
 * sector picked, and the card where sectors are made, placed and sized, zones made in them, and blocks built into a
 * zone. The world stays mounted from `/` to here (W2): only the view changes.
 */
export default function SectorsPage() {
  return <SpacesJig />;
}
