/**
 * What the engine's page offers the renderer (Cinema-Engine.md E7, `components/render-target.tsx`): load a shot, then
 * draw it at a moment and hand back the picture as a data URL. Read by `cli/render.ts` through Playwright.
 */
interface Window {
  cinema?: {
    ready: boolean;
    load: (shot: import("@/engine/types").Shot, assets: import("@/engine/types").AssetBook) => string[];
    draw: (t: number, type: string, quality?: number) => string;
  };
}
