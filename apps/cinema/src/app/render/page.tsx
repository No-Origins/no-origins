import type { Metadata } from "next";

import { RenderTarget } from "@/components/render-target";

export const metadata: Metadata = { title: "Render", robots: { index: false, follow: false } };

/**
 * The engine's page for the renderer (Cinema-Engine.md E7): one canvas at the frame's exact size, which Playwright
 * drives frame by frame. Not a page anyone visits, so it is not on the grid: a grid's margins would be in every frame.
 */
export default function Page() {
  return <RenderTarget />;
}
