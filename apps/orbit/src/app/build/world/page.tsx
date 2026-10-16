import type { Metadata } from "next";

import { WorldJig } from "@/components/jigs";

export const metadata: Metadata = { title: "World" };

/**
 * The world's page (World.md W14, W29, W73): its size, and where the elements are placed by hand, each of its variants
 * (his: "once we save them, I can go into the world, and there we can place these elements and their variations
 * wherever we want"). A builder's view, looked round, travelled by the keys and the map; a click places, a press picks.
 */
export default function WorldPage() {
  return <WorldJig />;
}
