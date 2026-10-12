"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

import { Button } from "@no-origins/ui/components/button";
import { Card } from "@no-origins/ui/components/card";
import { cn } from "@no-origins/ui/lib/utils";

import { headingOnMap, offMap, onMap, withinMap, type MapConfig, type Where } from "@/world/map-v1";

/** A portal for the map: its middle on the ground, and how far its opening reaches, in metres. */
export type MapPortal = { x: number; z: number; radius: number };

/** How far in from the map's edge a portal beyond it waits, in pixels: its marker's half and a little air. */
const EDGE = 14;

/**
 * The map, version 1, FROZEN beside version 2 (`minimap.tsx`). Nothing draws it.
 *
 * The map (`src/world/map-v1.ts`; his: "we will need map like in games to find items and move there"): a card at the top
 * right of the visitor's view, the camera at its middle. The drawing is the world's (W10 keeps the world's picture
 * apart from the interface): the camera a violet dot with a wedge of what it sees; each portal a ring as wide as its
 * opening, or, beyond the map's reach, a dot waiting at its edge the way to it. Each portal is the design system's
 * `Button`, named, so the keys reach it: it flies the camera to the portal. A click anywhere else takes the camera to
 * see that point at the middle of its view. On a phone the map is at most 40% of the view across.
 */
export function MinimapV1({
  map,
  where,
  portals,
  onPortal,
  onTravel,
}: {
  map: MapConfig;
  where: Where;
  portals: readonly MapPortal[];
  onPortal: (index: number) => void;
  onTravel: (x: number, z: number) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState(map.size);
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () => setSide(element.clientWidth || map.size);
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    return () => resize.disconnect();
  }, [map.size]);

  // The map as it is shown: its settings, at the size it has on this screen.
  const shown: MapConfig = { ...map, size: side };
  const half = side / 2;
  const k = side / map.reach;

  // The wedge: from the camera, the way it faces, as wide as it sees across, a third of the map long.
  const heading = (headingOnMap(shown, where) * Math.PI) / 180;
  const spread = (Math.min(170, where.across) * Math.PI) / 360;
  const reach = side * 0.34;
  const ray = (angle: number) => `${Math.sin(angle) * reach} ${-Math.cos(angle) * reach}`;
  const wedge = `M 0 0 L ${ray(heading - spread)} A ${reach} ${reach} 0 0 1 ${ray(heading + spread)} Z`;

  const travel = (event: MouseEvent<HTMLDivElement>) => {
    const area = event.currentTarget.getBoundingClientRect();
    const point = offMap(shown, where, event.clientX - area.left - area.width / 2, event.clientY - area.top - area.height / 2);
    onTravel(point.x, point.z);
  };

  return (
    <Card
      data-world-map
      className="pointer-events-auto fixed top-4 right-4 gap-0 overflow-hidden p-0 shadow-none"
      style={{ width: `min(${map.size}px, 40vw)`, height: "auto", aspectRatio: "1 / 1" }}
    >
      <div ref={box} role="group" aria-label="Map" className="relative size-full cursor-crosshair" onClick={travel}>
        <svg className="pointer-events-none absolute inset-0 size-full" viewBox={`${-half} ${-half} ${side} ${side}`} aria-hidden>
          <path d={wedge} fill="color-mix(in oklch, var(--secondary) 28%, var(--card))" />
          <circle r={4} fill="var(--secondary)" />
        </svg>
        {portals.map((portal, i) => {
          const at = onMap(shown, where, portal.x, portal.z);
          const held = withinMap(shown, at.u, at.v, EDGE);
          const ring = Math.max(8, Math.min(24, portal.radius * 2 * k));
          return (
            <Button
              key={i}
              variant="ghost"
              size="icon-xs"
              aria-label={`Portal ${i + 1}${held.held ? ", beyond the map" : ""}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: half + held.u, top: half + held.v }}
              onClick={(event) => {
                event.stopPropagation();
                onPortal(i);
              }}
            >
              <span
                aria-hidden
                className={cn("block rounded-lg", held.held ? "size-2 bg-foreground" : "border-2 border-foreground")}
                style={held.held ? undefined : { width: ring, height: ring }}
              />
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
