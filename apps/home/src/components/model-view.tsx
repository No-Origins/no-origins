"use client";

import * as React from "react";

import { Text } from "@no-origins/ui/components/text";
import { cn } from "@no-origins/ui/lib/utils";

import type { House } from "@/lib/house";
import type { Tour } from "@/lib/tour";
import type { HomeViewer, TourState } from "@/lib/viewer";

export type ModelViewHandle = { view: (id: string) => void; tour: HomeViewer["tour"] };
export type ModelViewStatus = "loading" | "ready" | "unavailable";

/**
 * The model in its box (Home.md H2): a canvas the viewer draws on, mounted the way the design system mounts the avatar —
 * three.js loads only when this mounts. It opens on the tour's long shot, or at its first stop when it has none (H9);
 * `view` names a view of the description to show instead (the plan), and the handle's `tour` plays, pauses and goes to
 * a stop (−1 is the long shot). A drag or a turn by the keys
 * leaves whatever it was showing and `onMoved` says so; `onTour` hears where the tour is. Focused, the arrow keys turn
 * a look, Space plays and pauses, Home goes back to the first stop.
 */
export function ModelView({ ref, house, tour, view, className, onStatusChange, onMoved, onTour }: {
  ref?: React.Ref<ModelViewHandle>;
  house: House;
  tour: Tour;
  /** A named view of the description to show, or nothing for the tour's stop. */
  view: string;
  className?: string;
  onStatusChange?: (status: ModelViewStatus) => void;
  onMoved?: () => void;
  onTour?: (state: TourState) => void;
}) {
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const viewer = React.useRef<HomeViewer | null>(null);
  const [status, setStatus] = React.useState<ModelViewStatus>("loading");
  const [playing, setPlaying] = React.useState(false);
  const description = React.useId();
  const latestView = React.useRef(view);
  const latestMoved = React.useRef(onMoved);
  const latestTour = React.useRef(onTour);
  React.useEffect(() => { latestMoved.current = onMoved; }, [onMoved]);
  React.useEffect(() => { latestTour.current = onTour; }, [onTour]);
  React.useEffect(() => {
    latestView.current = view;
    if (view) viewer.current?.view(view);
  }, [view]);
  React.useImperativeHandle(ref, () => ({
    view: (id) => viewer.current?.view(id),
    tour: {
      play: () => viewer.current?.tour.play(),
      pause: () => viewer.current?.tour.pause(),
      go: (stop) => viewer.current?.tour.go(stop),
      rate: (times) => viewer.current?.tour.rate(times),
    },
  }), []);
  React.useEffect(() => { onStatusChange?.(status); }, [onStatusChange, status]);
  React.useEffect(() => {
    let cancelled = false;
    let mounted: HomeViewer | undefined;
    import("@/lib/viewer").then(({ mountHomeViewer }) => {
      if (cancelled || !canvas.current) return;
      mounted = mountHomeViewer(canvas.current, house, tour, {
        status: (ready) => { if (!cancelled) setStatus(ready ? "ready" : "unavailable"); },
        moved: () => latestMoved.current?.(),
        tour: (state) => {
          if (cancelled) return;
          setPlaying(state.playing);
          latestTour.current?.(state);
        },
      });
      viewer.current = mounted;
      if (latestView.current) mounted.view(latestView.current);
    }).catch(() => {
      if (!cancelled) setStatus("unavailable");
    });
    return () => {
      cancelled = true;
      viewer.current = null;
      mounted?.dispose();
    };
  }, [house, tour]);

  return (
    <div
      data-slot="model-view"
      data-status={status}
      role="group"
      aria-label={`${house.name}, the model`}
      aria-describedby={description}
      tabIndex={status === "ready" ? 0 : -1}
      className={cn("relative size-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset", className)}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        const step = Math.PI / 24;
        const turns: Record<string, [number, number]> = {
          ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
        };
        if (turns[event.key]) {
          event.preventDefault();
          event.stopPropagation();
          viewer.current?.turn(...turns[event.key]!);
        } else if (event.key === " ") {
          event.preventDefault();
          if (playing) viewer.current?.tour.pause();
          else viewer.current?.tour.play();
        } else if (event.key === "Home") {
          event.preventDefault();
          viewer.current?.tour.go(tour.opening ? -1 : 0);
        }
      }}
    >
      <canvas ref={canvas} aria-hidden className="absolute inset-0 size-full touch-none" />
      {status !== "ready" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
          <Text role="caption" tone="muted" align="center" aria-live="polite">
            {status === "loading" ? "Building the model…" : "3D is unavailable here."}
          </Text>
        </div>
      )}
      <Text id={description} className="sr-only">
        The house as a plain model: its frame, walls, doors, windows, stairs and terrace, with the realistic pictures of
        the tour hanging in its rooms. Drag to turn, drag with the wheel pressed to move the view, scroll to come
        closer. When focused, use the arrow keys to turn, Space to play or pause the tour and Home to go back to its
        first stop.
      </Text>
    </div>
  );
}
