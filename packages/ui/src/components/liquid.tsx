"use client"

import * as React from "react"

import { useLiquidMotion } from "@no-origins/ui/hooks/use-liquid-motion"
import { paintLiquid, type LiquidFrame, type LiquidMotion } from "@no-origins/ui/lib/liquid-motion"
import { cn } from "@no-origins/ui/lib/utils"

export type LiquidProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** How full, 0 to 1. It arrives pouring from `from` (empty unless given), and a new level pours from where it is. */
  level?: number
  /** The level it arrives from, 0 to 1: empty unless given. */
  from?: number
  /** The liquid's colour, as CSS. The primary, lime, unless given. */
  colour?: string
  /** What it says to a screen reader; "40% full" unless given. */
  label?: string
  /** Hold still and let the caller paint it (the motion studio's timeline). */
  still?: boolean
  /** Play even under reduced motion (the motion studio alone). */
  always?: boolean
  /** Anything that changes when the motion's tokens do: the motion is read off the box again (the studio's jig). */
  tuning?: unknown
}

/**
 * THE LIQUID (2026-10-03, his: "fill a cell beside in progress with flowing liquid. Fill only 40% of the liquid"; no
 * registry has one): a box — a cell is a circle, Grid.md D39 — holding liquid up to `level`, its surface flowing. The
 * motion is liquid (Motion.md M25), played by `useLiquidMotion` on the `--motion-liquid-*` tokens read off the box and
 * painted straight onto two SVG paths, the back wave a tone of the colour mixed toward the card (mixed, never
 * translucent). It fills whatever box it is given, border and card behind it unless the class says otherwise; the
 * motion studio's Liquid page and the status page's cells are its uses.
 */
export function Liquid({ level = 0.4, from, colour = "var(--primary)", label, still, always, tuning, className, style, ...props }: LiquidProps) {
  const root = React.useRef<HTMLDivElement>(null)
  const paint = React.useCallback((frame: LiquidFrame, motion: LiquidMotion) => {
    if (root.current) paintLiquid(root.current, motion, frame)
  }, [])
  const held = Math.min(1, Math.max(0, level))
  useLiquidMotion({ block: root, level: held, from: from === undefined ? 0 : Math.min(1, Math.max(0, from)), paint, still, always, tuning })
  return (
    <div
      ref={root}
      data-slot="liquid"
      role="img"
      aria-label={label ?? `${Math.round(held * 100)}% full`}
      className={cn("relative size-full overflow-hidden rounded-lg border bg-card", className)}
      style={{ "--liquid-colour": colour, ...style } as React.CSSProperties}
      {...props}
    >
      <svg data-slot="liquid-waves" aria-hidden className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 1 1">
        <path data-slot="liquid-back" d="" />
        <path data-slot="liquid-front" d="" />
      </svg>
    </div>
  )
}
