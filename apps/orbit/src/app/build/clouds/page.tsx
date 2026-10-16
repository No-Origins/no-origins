import type { Metadata } from "next";

import { CloudsJig } from "@/components/jigs";

export const metadata: Metadata = { title: "Clouds" };

/**
 * The clouds' page (World.md W14, W38): the ceiling clouds seen as the Environment's page sees them, looking up across
 * the open square, and their jig: the layer, the edge, the paint and the motion.
 */
export default function CloudsPage() {
  return <CloudsJig />;
}
