import type { Metadata } from "next";

import { MountainJig } from "@/components/jigs";

export const metadata: Metadata = { title: "Mountains" };

/**
 * The mountain's page (World.md W52, W72, W73; his: "I want mountains … I should just see the mountain and a dropdown
 * of variants"): one mountain alone at the world's middle, seen from the east, a drag going round it, and its jig with
 * its variants. The World page places them.
 */
export default function MountainsPage() {
  return <MountainJig />;
}
