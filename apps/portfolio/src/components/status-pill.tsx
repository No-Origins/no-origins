"use client";

import * as React from "react";
import { ArrowUpRightIcon } from "lucide-react";

import { GRID_SPACING, useGridMetrics } from "@no-origins/ui/components/grid";
import { Text } from "@no-origins/ui/components/text";
import { useCellMotion } from "@no-origins/ui/hooks/use-cell-motion";
import { flowSpots, stateOf, type CellFlow, type CellFrame } from "@no-origins/ui/lib/cell-motion";

import { icon, ICON_GAP } from "@/components/profile-card";
import { STATUS_URL } from "@/content/resume";

/** The pill's cells when it is open: the dot's, and two for "Status page ↗". */
export const STATUS_CELLS = 3;

/** A colour over the border, `lit` of the way. */
const over = (colour: string, lit: number) => (lit <= 0 ? "var(--border)" : lit >= 1 ? colour : `color-mix(in oklch, ${colour} ${lit * 100}%, var(--border))`);

/**
 * The status pill (Portfolio.md P25): a bordered circle
 * one cell big in the field's bottom-right corner, a violet dot in it. The pointer on it, or the keys' focus, and it
 * grows LEFT to three cells — the dot staying in its cell, "Status page" and ↗ coming in beside it — by movement
 * (Motion.md M9, his decided motion for one-cell elements that grow to spell their name, the tech stack's), played by
 * `useCellMotion` and mirrored, since it grows from the right edge rather than the left; its border turns violet as it
 * grows. The whole pill is the link, to `status.no-origins.com` in a new tab, so a finger with no hover taps the circle
 * and goes. It stands in a `GridItem` three cells wide ending on the corner cell, a fixture the page's turn leaves
 * alone (`data-intro-fixed`).
 */
export function StatusPill() {
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const block = React.useRef<HTMLDivElement>(null);
  const ring = React.useRef<HTMLAnchorElement>(null);
  const name = React.useRef<HTMLSpanElement>(null);
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const active = hover || focus ? 0 : null;
  const flow = React.useMemo<CellFlow>(() => ({ axis: "row", line: STATUS_CELLS }), []);
  // One element on a block of three cells: grown, it takes them all.
  const states = React.useCallback(
    (which: number | null) => flowSpots(1, which, STATUS_CELLS, STATUS_CELLS).map((spot) => stateOf(spot, flow, cell, gap)),
    [flow, cell, gap],
  );
  const paint = React.useCallback(
    (frames: CellFrame[]) => {
      const f = frames[0];
      const el = ring.current;
      const label = name.current;
      if (!f || !el || !label) return;
      // Mirrored: the pill grows from the block's right end leftward, and the dot stays in the corner cell.
      const width = STATUS_CELLS * (cell + gap) - gap;
      el.style.left = `${width - f.r}px`;
      el.style.width = `${f.r - f.l}px`;
      el.style.top = `${f.t}px`;
      el.style.height = `${f.b - f.t}px`;
      el.style.setProperty("--status-ring", over("var(--violet)", f.lit));
      label.style.opacity = String(f.lit);
    },
    [cell, gap],
  );
  useCellMotion({ block, states, active, flow, cell, gap, paint });
  const hovers = (e: React.PointerEvent) => e.pointerType === "mouse" || e.pointerType === "pen";
  // The dot: the company marks' size, half the cell less a step of the spacing scale.
  const dot = Math.round(cell / 2) - GRID_SPACING[1];
  return (
    <div
      ref={block}
      data-status
      className="relative size-full"
      onPointerEnter={(e) => void (hovers(e) && setHover(true))}
      onPointerLeave={(e) => void (hovers(e) && setHover(false))}
    >
      <a
        ref={ring}
        href={STATUS_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Status page (opens in a new tab)"
        data-status-pill
        onFocus={(e) => void (e.target.matches(":focus-visible") && setFocus(true))}
        onBlur={() => setFocus(false)}
        className="absolute overflow-hidden rounded-lg border border-(--status-ring) bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ right: 0, top: 0, width: cell, height: cell, "--status-ring": "var(--border)" } as React.CSSProperties}
      >
        <span aria-hidden className="absolute top-1/2 -translate-y-1/2 rounded-lg bg-secondary" style={{ right: (cell - dot) / 2 - 1, width: dot, height: dot }} />
        <span
          ref={name}
          aria-hidden
          className="absolute top-1/2 flex -translate-y-1/2 items-center gap-1 whitespace-nowrap"
          style={{ right: cell - 1 + ICON_GAP, opacity: 0 }}
        >
          <Text as="span" className="font-semibold">
            Status page
          </Text>
          <ArrowUpRightIcon style={icon} />
        </span>
      </a>
    </div>
  );
}
