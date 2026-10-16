import type { Metadata } from "next";

import { HumanJig } from "@/components/jigs";

export const metadata: Metadata = { title: "Human" };

/**
 * The human's page (World.md W51): the visitor's camera itself, behind the figure, so it is walked while it is tuned
 * (WASD, the arrows, a drag, the map), and its jig. The world stays mounted from `/` to here (W2): only the view changes.
 */
export default function HumanPage() {
  return <HumanJig />;
}
