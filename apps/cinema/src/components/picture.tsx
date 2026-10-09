"use client";

import * as React from "react";

import type { Engine } from "@/engine/engine";
import type { Aspect, AssetBook, CameraPose, Shot, Vec3 } from "@/engine/types";

/** A free look: round a point, by a bearing and a pitch, from a distance, through a lens. */
type Orbit = { target: Vec3; yaw: number; pitch: number; distance: number; lens: number };

const poseOf = (o: Orbit): CameraPose => ({
  position: [
    o.target[0] + Math.sin(o.yaw) * Math.cos(o.pitch) * o.distance,
    o.target[1] + Math.sin(o.pitch) * o.distance,
    o.target[2] + Math.cos(o.yaw) * Math.cos(o.pitch) * o.distance,
  ],
  target: o.target,
  lens: o.lens,
});
const TURN = 0.006;
const STEP = 0.12;

/**
 * The shot in its box (Cinema-Engine.md E1, E2): a canvas the engine draws on, fitted to the frame's shape (wide or
 * vertical) inside the box, the rest of the box left plain. three.js loads only when this mounts, as Home's model does.
 *
 * The engine never reads the clock; this does, to play. Playing, it moves `t` on by the time that passed and loops at
 * the shot's end; paused, it draws only when told where to be (`seek`) or when the shot changes.
 *
 * **Free look**, the screen's alone: a drag turns round what the shot's camera is looking at, the wheel (or a pinch)
 * goes nearer or further, the arrow keys and + − do the same when the picture has focus, and Escape goes back. It
 * starts from wherever the shot's camera is, and `onFree` says it has; renders always use the shot's camera. With
 * `overview` (an asset's bench, which has no camera and frames nothing) it fills its box, starts from a view of the
 * whole world, and Escape goes back there.
 */
export function Picture({ shot, assets, aspect, length, playing, seek, free, onFree, onTime, onProblems, overview = false }: {
  shot: Shot;
  /** His saved assets, for a world built from them. */
  assets: AssetBook;
  aspect: Aspect;
  /** The shot's length in seconds. */
  length: number;
  playing: boolean;
  /** Where to be: a new `n` moves there. */
  seek: { t: number; n: number };
  /** Looking freely rather than through the shot's camera. */
  free: boolean;
  onFree: (free: boolean) => void;
  /** Where it is, a few times a second while playing. */
  onTime: (t: number) => void;
  onProblems: (problems: string[]) => void;
  /** Look at the whole world, not through the shot's camera. */
  overview?: boolean;
}) {
  const box = React.useRef<HTMLDivElement>(null);
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = React.useState<Engine | null>(null);
  const time = React.useRef(seek.t);
  const orbit = React.useRef<Orbit | null>(null);
  const latest = React.useRef({ onTime, onProblems, onFree, length });
  React.useEffect(() => {
    latest.current = { onTime, onProblems, onFree, length };
  }, [onTime, onProblems, onFree, length]);

  const paint = React.useCallback(() => {
    engine?.draw(time.current, orbit.current ? poseOf(orbit.current) : overview ? engine.overview() : undefined);
  }, [engine, overview]);

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
    const { width: w, height: h } = host.getBoundingClientRect();
    const ratio = overview ? Math.max(0.1, w / Math.max(1, h)) : aspect === "wide" ? 16 / 9 : 9 / 16;
    const width = Math.max(1, Math.floor(Math.min(w, h * ratio)));
    const height = Math.max(1, Math.floor(width / ratio));
    target.style.width = `${width}px`;
    target.style.height = `${height}px`;
    engine.size(width, height, Math.min(window.devicePixelRatio, 2));
    paint();
  }, [aspect, engine, paint, overview]);

  React.useEffect(() => {
    if (!engine) return;
    latest.current.onProblems(engine.load(shot, assets));
    fit();
  }, [engine, shot, assets, fit]);

  React.useEffect(() => {
    const host = box.current;
    if (!host) return;
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    return () => observer.disconnect();
  }, [fit]);

  React.useEffect(() => {
    time.current = seek.t;
    paint();
  }, [seek, paint]);

  // Back to the shot's camera when free look is let go.
  React.useEffect(() => {
    if (free) return;
    orbit.current = null;
    paint();
  }, [free, paint]);

  React.useEffect(() => {
    if (!engine || !playing) return;
    let frame = 0;
    let last = performance.now();
    let told = 0;
    const tick = (now: number) => {
      time.current = (time.current + (now - last) / 1000) % latest.current.length;
      last = now;
      paint();
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
  }, [engine, playing, paint]);

  /** The free look, from where the shot's camera is now. */
  const look = React.useCallback(() => {
    if (orbit.current || !engine) return orbit.current;
    const pose = overview ? engine.overview() : engine.poseAt(time.current);
    const [dx, dy, dz] = [0, 1, 2].map((i) => pose.position[i]! - pose.target[i]!) as Vec3;
    const distance = Math.max(0.5, Math.hypot(dx, dy, dz));
    orbit.current = { target: pose.target, yaw: Math.atan2(dx, dz), pitch: Math.asin(dy / distance), distance, lens: pose.lens };
    latest.current.onFree(true);
    return orbit.current;
  }, [engine, overview]);
  const turn = (yaw: number, pitch: number) => {
    const o = look();
    if (!o) return;
    o.yaw += yaw;
    o.pitch = Math.max(-1.45, Math.min(1.45, o.pitch + pitch));
    paint();
  };
  const zoom = (by: number) => {
    const o = look();
    if (!o) return;
    o.distance = Math.max(0.5, Math.min(5000, o.distance * Math.exp(by)));
    paint();
  };

  // The wheel is listened to directly, so it can be kept from the page.
  React.useEffect(() => {
    const target = canvas.current;
    if (!target) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      zoom(event.deltaY * 0.0015);
    };
    target.addEventListener("wheel", wheel, { passive: false });
    return () => target.removeEventListener("wheel", wheel);
  });

  const drag = React.useRef<{ x: number; y: number; pointers: Map<number, { x: number; y: number }> }>({ x: 0, y: 0, pointers: new Map() });
  const spread = () => {
    const [a, b] = [...drag.current.pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  return (
    <div ref={box} data-slot="picture" data-status={engine ? "ready" : "loading"} data-free={free} className="flex size-full items-center justify-center">
      <canvas
        ref={canvas}
        role="img"
        tabIndex={0}
        aria-label={`${shot.title}${overview ? "" : ", the shot"}. Drag, or the arrow keys, to look round; the wheel, or + and −, to go nearer.`}
        className={free ? "cursor-grabbing touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring" : "cursor-grab touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring"}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
          drag.current.x = event.clientX;
          drag.current.y = event.clientY;
        }}
        onPointerMove={(event) => {
          const pointers = drag.current.pointers;
          if (!pointers.has(event.pointerId)) return;
          if (pointers.size === 2) {
            const before = spread();
            pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
            const after = spread();
            if (before && after) zoom(Math.log(before / after));
            return;
          }
          pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
          turn(-(event.clientX - drag.current.x) * TURN, (event.clientY - drag.current.y) * TURN);
          drag.current.x = event.clientX;
          drag.current.y = event.clientY;
        }}
        onPointerUp={(event) => drag.current.pointers.delete(event.pointerId)}
        onPointerCancel={(event) => drag.current.pointers.delete(event.pointerId)}
        onKeyDown={(event) => {
          const keys: Record<string, () => void> = {
            ArrowLeft: () => turn(STEP, 0),
            ArrowRight: () => turn(-STEP, 0),
            ArrowUp: () => turn(0, STEP / 2),
            ArrowDown: () => turn(0, -STEP / 2),
            "+": () => zoom(-STEP),
            "=": () => zoom(-STEP),
            "-": () => zoom(STEP),
            Escape: () => latest.current.onFree(false),
          };
          const act = keys[event.key];
          if (!act) return;
          event.preventDefault();
          act();
        }}
      />
    </div>
  );
}
