import type { Metadata } from "next";

import { PortalJig } from "@/components/jigs";

export const metadata: Metadata = { title: "Portal" };

/**
 * The portal's page (World.md W14): the world seen from over the portal in the start location, a drag going round it,
 * and its jig. The world stays mounted from `/` to here (W2): only the view changes.
 */
export default function PortalPage() {
  return <PortalJig />;
}
