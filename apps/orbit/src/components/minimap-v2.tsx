"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

import { Button } from "@no-origins/ui/components/button";
import { Card } from "@no-origins/ui/components/card";
import { cn } from "@no-origins/ui/lib/utils";

import { frameOf, headingOnMap, offMap, onMap, withinMap, type MapConfig, type Where } from "@/world/map-v2";
import { BLOCK, INSIDE, type Block } from "@/world/orbit-v10";

/** A portal for the map: its middle on the ground, and how far its opening reaches, in metres. */
export type MapPortal = { x: number; z: number; radius: number };

/** How far in from the map's edge a portal beyond it waits, in pixels: its marker's half and a little air. */
const EDGE = 14;

/**
 * The map, version 2 (`src/world/map.ts`; version 1 is frozen beside it, `minimap-v1.tsx`): a card at the top right of
 * the visitor's view. The drawing is the world's (W10 keeps the world's picture apart from the interface), from above:
 *
 * - the Orbit's round where the camera is, the edge it never passes, faintly filled;
 * - every block standing, a square a column of them, deeper the higher its top stands;
 * - each portal a ring as wide as its opening, or, beyond the map's reach, a dot waiting at its edge the way to it;
 * - the camera, a violet dot with a wedge of what it sees, filled under the blocks and outlined over them.
 *
 * Each portal is the design system's `Button`, named, so the keys reach it: it flies the camera to the portal. A click
 * anywhere else takes the camera to see that point at the middle of its view, as near as the dome lets it. On a phone
 * the map is at most 40% of the view across.
 */
export function Minimap({
  map,
  where,
  radius,
  blocks,
  portals,
  onPortal,
  onTravel,
}: {
  map: MapConfig;
  where: Where;
  radius: number;
  blocks: readonly Block[];
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

  // The map as it is shown: laid over the world at the size it has on this screen.
  const frame = frameOf(map, where, radius, side);
  const half = side / 2;
  const point = (x: number, z: number) => onMap(frame, x, z);

  // The Orbit's round at the camera's height: as far as the camera may go there.
  const centre = point(0, 0);
  const most = Math.max(0, radius - INSIDE);
  const round = Math.sqrt(Math.max(0, most * most - where.height * where.height)) * frame.k;

  // Each column of blocks once, by its top: the higher it stands, the deeper its square.
  const tops = new Map<string, { column: number; row: number; top: number }>();
  for (const [column, row, level] of blocks) {
    const key = `${column},${row}`;
    const was = tops.get(key);
    if (!was || level > was.top) tops.set(key, { column, row, top: level });
  }
  const columns = [...tops.values()];
  const lowest = Math.min(...columns.map((c) => c.top));
  const highest = Math.max(...columns.map((c) => c.top));
  const square = (column: number, row: number) => {
    const x = column * BLOCK.width;
    const z = row * BLOCK.length;
    const w = BLOCK.width / 2;
    const l = BLOCK.length / 2;
    return [point(x - w, z - l), point(x + w, z - l), point(x + w, z + l), point(x - w, z + l)].map(({ u, v }) => `${u},${v}`).join(" ");
  };

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
      className="pointer-events-auto fixed top-4 right-4 gap-0 overflow-hidden p-0 shadow-none"
      style={{ width: `min(${map.size}px, 40vw)`, height: "auto", aspectRatio: "1 / 1" }}
    >
      <div ref={box} role="group" aria-label="Map" className="relative size-full" onClick={travel}>
        <svg className="pointer-events-none absolute inset-0 size-full" viewBox={`${-half} ${-half} ${side} ${side}`} aria-hidden>
          <circle
            cx={centre.u}
            cy={centre.v}
            r={round}
            fill="color-mix(in oklch, var(--foreground) 4%, var(--card))"
            stroke="color-mix(in oklch, var(--foreground) 35%, var(--card))"
          />
          <path d={wedge} fill="color-mix(in oklch, var(--secondary) 28%, var(--card))" />
          {columns.map(({ column, row, top }) => (
            <polygon
              key={`${column},${row}`}
              points={square(column, row)}
              fill={`color-mix(in oklch, var(--foreground) ${Math.round(12 + (highest > lowest ? ((top - lowest) / (highest - lowest)) * 30 : 0))}%, var(--card))`}
              stroke="var(--card)"
            />
          ))}
          {/* Over the blocks, the wedge's outline: what it sees, wherever it stands. */}
          <path d={wedge} fill="none" stroke="var(--secondary)" strokeLinejoin="round" />
          <circle cx={camera.u} cy={camera.v} r={4} fill="var(--secondary)" />
        </svg>
        {portals.map((portal, i) => {
          const at = point(portal.x, portal.z);
          const held = withinMap(side, at.u, at.v, EDGE);
          const ring = Math.max(8, Math.min(24, portal.radius * 2 * frame.k));
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
