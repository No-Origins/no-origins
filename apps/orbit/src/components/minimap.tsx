"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

import { Text } from "@no-origins/ui/components/text";
import { Card } from "@no-origins/ui/components/card";
import { cn } from "@no-origins/ui/lib/utils";

import { frameOf, headingOnMap, offMap, onMap, type MapConfig, type Where } from "@/world/map";
import type { WorldSize } from "@/world/orbit";

/**
 * The map, version 3 (`src/world/map.ts`; version 1 is frozen beside it, `minimap-v1.tsx`): a card at the top right of
 * the visitor's view. The drawing is the world's (W10 keeps the world's picture apart from the interface), from above:
 *
 * - the world's round floor (World.md W42), and its boundary, faintly filled;
 * - the camera, a violet dot with a wedge of what it sees. (The environment's blocks were drawn here until they were
 *   removed, World.md W24; the portals, each a ring that flew the camera to it, until the portal went, W93.)
 *
 * A click takes the camera to see that point at the middle of its view, within the plane boundary. On a phone the map
 * is at most 40% of the view across.
 */
export function Minimap({
  map,
  where,
  size,
  onTravel,
  className,
}: {
  /** Where the page needs the room (W89: the Sectors page's item card on a phone), it hides the map there. */
  className?: string;
  map: MapConfig;
  where: Where;
  size: WorldSize;
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

  // The map as it is shown: laid over the world at the size it has on this screen.
  const frame = frameOf(map, where, size, side);
  const half = side / 2;
  const point = (x: number, z: number) => onMap(frame, x, z);

  // The world's round floor (W42), round its middle.
  const middle = point(0, 0);
  const round = (size.diameter / 2) * frame.k;

  // The camera: where it is on the map, and its wedge, the way it faces, as wide as it sees across.
  const camera = point(where.at[0], where.at[1]);
  const heading = (headingOnMap(map, where) * Math.PI) / 180;
  const spread = (Math.min(170, where.across) * Math.PI) / 360;
  const reach = side * (map.shows === "around" ? 0.34 : 0.2);
  const ray = (angle: number) => `${camera.u + Math.sin(angle) * reach} ${camera.v - Math.cos(angle) * reach}`;
  const wedge = `M ${camera.u} ${camera.v} L ${ray(heading - spread)} A ${reach} ${reach} 0 0 1 ${ray(heading + spread)} Z`;

  const travel = (event: MouseEvent<HTMLDivElement>) => {
    const area = event.currentTarget.getBoundingClientRect();
    const to = offMap(frame, event.clientX - area.left - area.width / 2, event.clientY - area.top - area.height / 2);
    onTravel(to.x, to.z);
  };

  return (
    <Card
      data-world-map
      className={cn("pointer-events-auto fixed top-40 right-4 gap-0 overflow-hidden p-0 shadow-none", className)}
      style={{ width: `min(${map.size}px, 40vw)`, height: "auto", aspectRatio: "1 / 1" }}
    >
      <div ref={box} role="group" aria-label="Map" className="relative size-full" onClick={travel}>
        <svg className="pointer-events-none absolute inset-0 size-full" viewBox={`${-half} ${-half} ${side} ${side}`} aria-hidden>
          <circle
            cx={middle.u}
            cy={middle.v}
            r={round}
            fill="color-mix(in oklch, var(--foreground) 4%, var(--card))"
            stroke="color-mix(in oklch, var(--foreground) 35%, var(--card))"
          />
          <path d={wedge} fill="color-mix(in oklch, var(--secondary) 28%, var(--card))" />
          <path d={wedge} fill="none" stroke="var(--secondary)" strokeLinejoin="round" />
          <circle cx={camera.u} cy={camera.v} r={4} fill="var(--secondary)" />
        </svg>
        {["N", "E", "S", "W"].map((label, index) => {
          const angle = index * Math.PI / 2 - frame.turn;
          const reach = half - 12;
          const u = Math.sin(angle) * reach;
          const v = -Math.cos(angle) * reach;
          return <Text key={label} role="caption" weight="heavy" className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: half + u, top: half + v }}>{label}</Text>;
        })}
      </div>
    </Card>
  );
}
