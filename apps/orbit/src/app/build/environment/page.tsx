import type { Metadata } from "next";

import { EnvironmentJig } from "@/components/jigs";

export const metadata: Metadata = { title: "Environment" };

/**
 * The environment's page (World.md W14): the start location seen from above and behind the visitor, a drag going round
 * it, and its jig: the sky, the ground, and how the portals are laid out.
 */
export default function EnvironmentPage() {
  return <EnvironmentJig />;
}
