import type { Metadata } from "next";

import { CameraJig } from "@/components/jigs";

export const metadata: Metadata = { title: "Camera" };

/** The camera's page (World.md W14): the visitor's eye itself, as its jig sets it. */
export default function CameraPage() {
  return <CameraJig />;
}
