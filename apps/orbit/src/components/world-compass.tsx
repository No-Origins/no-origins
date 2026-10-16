"use client";

import { Card } from "@no-origins/ui/components/card";
import { Text } from "@no-origins/ui/components/text";
import type { Where } from "@/world/map";
import type { WorldSize } from "@/world/orbit";

/** Orientation is UI, separate from the world's drawing (World.md W10, W23), with the world's size (W29). North is −Z. */
export function WorldCompass({ where, size }: { where: Where; size: WorldSize }) {
  const turn = ((where.turn % 360) + 360) % 360;
  const facing = ["N", "E", "S", "W"][Math.round(turn / 90) % 4];
  return (
    <Card aria-label="Compass" className="pointer-events-none fixed top-4 right-4 w-[200px] max-w-[40vw] gap-stack-tight p-inset-tight shadow-none">
      <div className="flex justify-between gap-inline-tight">
        {["N", "E", "S", "W"].map((direction) => (
          <Text key={direction} role="label" tone={direction === facing ? "foreground" : "muted"} weight={direction === facing ? "heavy" : undefined} aria-current={direction === facing ? "true" : undefined}>{direction}</Text>
        ))}
      </div>
      <Text role="caption" align="center">{facing} · {Math.round(turn) % 360}°</Text>
      <Text role="caption" tone="muted" align="center">X {Math.round(where.at[0])} · Z {Math.round(where.at[1])} m</Text>
      <Text role="caption" tone="muted" align="center">⌀ {size.diameter} m · {size.height} m high</Text>
    </Card>
  );
}
