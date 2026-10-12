import type { Metadata } from "next";

import { WorldJig } from "@/components/jigs";

export const metadata: Metadata = { title: "World" };

/**
 * The world's page (World.md W14, W29): its boundaries, width, breadth and height, on the visitor's camera, as at `/`,
 * which travels up to them and is held there, the map at the top right drawing them, and the world's jig.
 */
export default function WorldPage() {
  return <WorldJig />;
}
