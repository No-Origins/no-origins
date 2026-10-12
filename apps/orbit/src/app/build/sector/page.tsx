import type { Metadata } from "next";

import { SectorJig } from "@/components/jigs";

export const metadata: Metadata = { title: "Sector" };

/**
 * The sector's page (World.md W14, W24): the world seen from a few metres off the start, a drag going round it, a click
 * placing a zone or taking one away, and its jig. The world stays mounted from `/` to here (W2): only the view changes.
 */
export default function SectorPage() {
  return <SectorJig />;
}
