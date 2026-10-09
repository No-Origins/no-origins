"use client";

import * as React from "react";

import type { Engine } from "@/engine/engine";
import type { Aspect, Shot } from "@/engine/types";

/**
 * The shot in its box (Cinema-Engine.md E1, E2): a canvas the engine draws on, fitted to the frame's shape (wide or
 * vertical) inside the box, the rest of the box left plain. three.js loads only when this mounts, as Home's model does.
 *
 * The engine never reads the clock; this does, to play. Playing, it moves `t` on by the time that passed and loops at
 * the shot's end; paused, it draws only when told where to be (`seek`) or when the shot changes.
 */
export function Picture({ shot, aspect, length, playing, seek, onTime, onProblems }: {
  shot: Shot;
  aspect: Aspect;
  /** The shot's length in seconds. */
  length: number;
  playing: boolean;
  /** Where to be: a new `n` moves there. */
  seek: { t: number; n: number };
  /** Where it is, a few times a second while playing. */
  onTime: (t: number) => void;
  onProblems: (problems: string[]) => void;
}) {
  const box = React.useRef<HTMLDivElement>(null);
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = React.useState<Engine | null>(null);
  const time = React.useRef(seek.t);
  const latest = React.useRef({ onTime, onProblems, length });
  React.useEffect(() => {
    latest.current = { onTime, onProblems, length };
  }, [onTime, onProblems, length]);

  React.useEffect(() => {
    let cancelled = false;
    let mounted: Engine | undefined;
    Promise.all([import("@/engine/engine"), import("@/engine/library"), import("@cinema/content")]).then(([{ createEngine }, { makeLibrary }, { ENTRIES }]) => {
      if (cancelled || !canvas.current) return;
      mounted = createEngine(canvas.current, makeLibrary(ENTRIES));
      setEngine(mounted);
    });
    return () => {
      cancelled = true;
      mounted?.dispose();
    };
  }, []);

  // The canvas takes the largest rectangle of the frame's shape that fits the box.
  const fit = React.useCallback(() => {
    const host = box.current, target = canvas.current;
    if (!host || !target || !engine) return;
    const ratio = aspect === "wide" ? 16 / 9 : 9 / 16;
    const { width: w, height: h } = host.getBoundingClientRect();
    const width = Math.max(1, Math.floor(Math.min(w, h * ratio)));
    const height = Math.max(1, Math.floor(width / ratio));
    target.style.width = `${width}px`;
    target.style.height = `${height}px`;
    engine.size(width, height, Math.min(window.devicePixelRatio, 2));
    engine.draw(time.current);
  }, [aspect, engine]);

  React.useEffect(() => {
    if (!engine) return;
    latest.current.onProblems(engine.load(shot));
    fit();
  }, [engine, shot, fit]);

  React.useEffect(() => {
    const host = box.current;
    if (!host) return;
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    return () => observer.disconnect();
  }, [fit]);

  React.useEffect(() => {
    time.current = seek.t;
    engine?.draw(seek.t);
  }, [engine, seek]);

  React.useEffect(() => {
    if (!engine || !playing) return;
    let frame = 0;
    let last = performance.now();
    let told = 0;
    const tick = (now: number) => {
      const end = latest.current.length;
      time.current = (time.current + (now - last) / 1000) % end;
      last = now;
      engine.draw(time.current);
      if (now - told > 100) {
        told = now;
        latest.current.onTime(time.current);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      latest.current.onTime(time.current);
    };
  }, [engine, playing]);

  return (
    <div ref={box} data-slot="picture" data-status={engine ? "ready" : "loading"} className="flex size-full items-center justify-center">
      <canvas ref={canvas} role="img" aria-label={`${shot.title}, the shot`} />
    </div>
  );
}
