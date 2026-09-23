"use client"

import * as React from "react"
import { cn } from "cn"

import { countFor, GridFrameContext, specFor, type GridBreakpoint, type GridConfig } from "@no-origins/ui/components/grid"
import type { GridShape } from "@no-origins/ui/lib/grid-layout"

/**
 * A viewport to preview a breakpoint in (Grid.md D11).
 *
 * The grid resolves its field from the box it is given and nothing else (D12), so the only honest way to see what a
 * phone gets on a desktop is to give the grid a phone-sized box. The frame is that box: a plain hairline
 * rectangle of a stated width and height, scaled DOWN to fit the room it stands in and never up, with a corner to
 * drag and nothing else — no bezel, no notch, no device. Rotating it is the caller swapping width and height.
 *
 * The grid inside reads the scale from context and puts it in its metrics so the editor's pointer maths can divide
 * it back out; on screen a scaled cell is smaller than it is laid out.
 */

/**
 * Where each breakpoint's frame starts — Grid-v1.md §4's `Reference box` column, verbatim. A breakpoint is a RANGE,
 * so these are starting points, not the only sizes worth looking at: the frame drags to either end of the range and
 * past it, and since v2 every width in between is a different field (D12).
 */
export const GRID_REFERENCE_BOX: Record<GridBreakpoint, { width: number; height: number; label: string }> = {
  base: { width: 390, height: 844, label: "phone" },
  sm: { width: 640, height: 960, label: "" },
  md: { width: 768, height: 1024, label: "tablet portrait" },
  lg: { width: 1024, height: 768, label: "tablet landscape" },
  xl: { width: 1440, height: 900, label: "desktop" },
}

export type GridFrameSize = { width: number; height: number }

/**
 * The reference box a page's grid gets at a breakpoint, less whatever chrome sits above the grid (a nav bar), and the
 * field it produces under a config. Authoring is per breakpoint on this field (Grid.md D18), so the inspector that
 * sets a span for a breakpoint you are not looking at authors it here.
 */
export function referenceBox(bp: GridBreakpoint, chrome = 0): GridFrameSize {
  const box = GRID_REFERENCE_BOX[bp]
  return { width: box.width, height: Math.max(MIN_FRAME, box.height - chrome) }
}
export function referenceShape(bp: GridBreakpoint, config: GridConfig, chrome = 0): GridShape {
  const { width, height } = referenceBox(bp, chrome)
  const spec = specFor(config, bp)
  return { cols: countFor(width, spec.cell, spec.gap), rows: countFor(height, spec.cell, spec.gap) }
}

/** The smallest frame worth drawing: two cells and their gutters (D26's floor) at the decided 72 · 12 still fit. */
export const MIN_FRAME = 180

export type GridFrameProps = Omit<React.ComponentProps<"div">, "children"> & {
  children?: React.ReactNode
  /**
   * The frame's size in layout px. Omit both to FIT — the frame takes the room it stands in at scale 1, which is the
   * grid on the bare viewport, kept as one frame among the others rather than as a second mode.
   */
  size?: GridFrameSize | null
  /** Fires while the corner is dragged, in layout px. Omit to make the frame fixed. */
  onSizeChange?: (size: GridFrameSize) => void
  /** Reports the scale the frame settled on, so a readout can say it. */
  onScaleChange?: (scale: number) => void
  /** A caption above the frame — `390 × 844 · base`, say. The frame does not know its breakpoint; the grid does. */
  label?: React.ReactNode
}

function GridFrame({ children, size, onSizeChange, onScaleChange, label, className, style, ...props }: GridFrameProps) {
  const roomRef = React.useRef<HTMLDivElement>(null)
  const [room, setRoom] = React.useState<{ w: number; h: number } | null>(null)

  // The frame measures the room it stands in, and refits whenever the room changes.
  React.useLayoutEffect(() => {
    const el = roomRef.current
    if (!el) return
    const read = () => setRoom({ w: el.clientWidth, h: el.clientHeight })
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // The caption takes a line above the frame; the room for it comes off the height the frame may fill.
  const captionH = label ? 20 : 0
  const fitting = !size
  const width = size?.width ?? room?.w ?? 0
  const height = size?.height ?? (room ? Math.max(0, room.h - captionH) : 0)
  const scale = fitting || !room || width <= 0 || height <= 0 ? 1 : Math.min(1, room.w / width, Math.max(0, room.h - captionH) / height)

  React.useEffect(() => {
    onScaleChange?.(scale)
  }, [scale, onScaleChange])

  const frameState = React.useMemo(() => ({ scale }), [scale])

  // ── the corner ──────────────────────────────────────────────────────────────────────────────────────────────
  // Dragging the corner moves the frame's edge in LAYOUT px, so the pointer's screen delta is divided by the scale
  // the drag started at. When the frame is at its fit limit, dragging it bigger does not move the corner on screen
  // — the frame shrinks to stay in the room — and the readout is the truth, not the pointer.
  const drag = React.useRef<{ x: number; y: number; w: number; h: number; scale: number } | null>(null)

  const begin = (event: React.PointerEvent) => {
    if (!onSizeChange) return
    event.preventDefault()
    event.stopPropagation()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, y: event.clientY, w: width, h: height, scale }
  }
  const move = (event: React.PointerEvent) => {
    const d = drag.current
    if (!d || !onSizeChange) return
    event.stopPropagation()
    onSizeChange({
      width: Math.max(MIN_FRAME, Math.round(d.w + (event.clientX - d.x) / d.scale)),
      height: Math.max(MIN_FRAME, Math.round(d.h + (event.clientY - d.y) / d.scale)),
    })
  }
  const end = (event: React.PointerEvent) => {
    if (!drag.current) return
    event.stopPropagation()
    drag.current = null
  }

  return (
    <div ref={roomRef} data-slot="grid-frame-room" className={cn("relative flex h-full w-full flex-col items-center justify-center overflow-hidden", className)} style={style} {...props}>
      {room ? (
        <>
          {label ? (
            <div data-slot="grid-frame-label" className="text-muted-foreground shrink-0 font-mono text-[11px] leading-5" style={{ width: width * scale }}>
              {label}
            </div>
          ) : null}
          {/* The outer box is the frame's size ON SCREEN, so the room lays it out and centres it; the inner box is
              the frame's size in LAYOUT px, scaled to match. The grid inside measures the inner one. */}
          <div
            data-slot="grid-frame"
            data-fitting={fitting || undefined}
            className={cn("relative shrink-0", !fitting && "border-border border")}
            style={{ width: width * scale, height: height * scale }}
          >
            <div
              data-slot="grid-frame-viewport"
              className="absolute top-0 left-0 overflow-hidden"
              style={{ width, height, transform: scale === 1 ? undefined : `scale(${scale})`, transformOrigin: "top left" }}
            >
              <GridFrameContext.Provider value={frameState}>{children}</GridFrameContext.Provider>
            </div>
            {onSizeChange ? (
              <span
                role="presentation"
                aria-label="Resize the frame"
                data-slot="grid-frame-handle"
                className="bg-background border-foreground absolute -right-1 -bottom-1 z-40 size-3 border touch-none"
                style={{ cursor: "nwse-resize" }}
                onPointerDown={begin}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}

export { GridFrame }
