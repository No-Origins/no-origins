"use client";

import * as React from "react";

import { useGridMetrics } from "@no-origins/ui/components/grid";
import { Liquid } from "@no-origins/ui/components/liquid";
import { liquidFrame, paintLiquid, readLiquidMotion } from "@no-origins/ui/lib/liquid-motion";

import type { Family } from "@/content/families";
import { useHeld, useTrack, type Track } from "@/components/stage";
import { holdPhase, useStudio, type Phase } from "@/components/studio-context";

/**
 * The liquid's stage (Motion.md M25, version 1): the system's own `Liquid` filling the block — a cell to start with, a
 * circle, as the status page has it beside each app; Columns and Rows make it a bigger box — at the level the
 * specimen's Level sets, 40% unless moved. Live it flows on its own clock, reading the stage's tokens, and pours when
 * the level changes. On the timeline a play is the pour from empty to the level and then the flow for the hold, painted
 * from the package's own frames (`liquidFrame`, `paintLiquid`); on a loop it pours again from empty. While the
 * timeline holds it, the liquid is still and the timeline paints it.
 */
export function LiquidStage({ family, cols, rows }: { family: Family; cols: number; rows: number }) {
  const studio = useStudio();
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const pitch = cell + gap;
  const set = studio.blockOf(family);
  const across = Math.max(1, Math.min(set.columns, cols));
  const down = Math.max(1, Math.min(set.rows, rows));
  const level = studio.optionOf(family, "level", 40) / 100;
  const tuning = `${JSON.stringify(studio.values(family))}·${studio.tempo}`;
  const { hold, setHold } = studio;
  const held = useHeld(family);
  const block = React.useRef<HTMLDivElement>(null);

  const build = React.useCallback((): Track | null => {
    const el = block.current;
    if (!el) return null;
    const motion = readLiquidMotion(el);
    // The pour, then the flow for as long as the hold is dragged to.
    const phases: Phase[] = [{ label: "pour", ms: motion.pour }, holdPhase(hold, setHold)];
    return {
      phases,
      paint: (t) => {
        const liquid = el.querySelector<HTMLElement>('[data-slot="liquid"]');
        if (liquid) paintLiquid(liquid, motion, liquidFrame(motion, t, { from: 0, to: level, since: t }));
      },
    };
    // `tuning` says when to read the motion off the block again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuning, hold, setHold, level]);
  useTrack(family, build, held);

  const offCol = Math.floor((cols - across) / 2);
  const offRow = Math.floor((rows - down) / 2);

  return (
    <div
      ref={block}
      data-block
      className="absolute"
      style={{ left: offCol * pitch, top: offRow * pitch, width: across * pitch - gap, height: down * pitch - gap }}
    >
      <Liquid level={level} always still={held} tuning={tuning} label={`Liquid, ${Math.round(level * 100)}% full`} />
    </div>
  );
}
