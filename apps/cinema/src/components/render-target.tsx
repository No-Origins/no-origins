"use client";

import * as React from "react";

/**
 * The renderer's canvas (Cinema-Engine.md E7). It offers `window.cinema`: load a shot at its frame's size, then draw
 * any moment and hand the picture back. The picture is read in the same call that draws it, so the drawing buffer need
 * not be kept.
 */
export function RenderTarget() {
  const canvas = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    Promise.all([import("@/engine/engine"), import("@/engine/library"), import("@/engine/shot"), import("@cinema/content")]).then(
      ([{ createEngine }, { makeLibrary }, { frameSize }, { ENTRIES }]) => {
        if (cancelled || !canvas.current) return;
        const target = canvas.current;
        const engine = createEngine(target, makeLibrary(ENTRIES));
        window.cinema = {
          ready: true,
          load(shot, assets) {
            const { width, height } = frameSize(shot.frame);
            engine.size(width, height, 1);
            return engine.load(shot, assets);
          },
          draw(t, type, quality) {
            engine.draw(t);
            return target.toDataURL(type, quality);
          },
        };
        dispose = () => {
          delete window.cinema;
          engine.dispose();
        };
      },
    );
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);
  return <canvas ref={canvas} data-slot="render-target" className="fixed top-0 left-0" />;
}
