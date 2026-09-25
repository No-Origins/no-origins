"use client"

import * as React from "react"
import { cn } from "cn"

import { useGridMetrics } from "@no-origins/ui/components/grid"
import { Placed } from "@no-origins/ui/components/registry"
import { resolveSubSlots, type GridLayoutItem, type SlotAlign, type SlotFill, type SlotInset } from "@no-origins/ui/lib/grid-layout"

/**
 * A SLOT (Slots.md) — the box on the grid that holds a component or sub-slots. It was `GridBox` for an afternoon.
 *
 * Tokens (S3): `fill` — nothing, the page background (a mask over the grid lines), the muted surface, or the card
 * surface with a hairline (Grid.md D21); `inset` — a step of the spacing scale, none for `transparent`/`background`
 * and 12 for the surfaces unless set; `alignX`/`alignY` — where the component sits in the slot, `stretch` filling it.
 * There is no margin: on the grid the gutter is the margin.
 *
 * A slot fills its cell span exactly and CLIPS — nothing on the grid scrolls (Grid.md D3) — so a component that does
 * not fit is in a slot that is too small. A component that is already a box (a Card) is placed with `fill:
 * transparent`, `inset: 0` and `stretch`, so the slot is invisible around it and the card's own ring shows.
 */

const SURFACE: Record<SlotFill, string> = {
  transparent: "",
  background: "bg-background",
  muted: "bg-muted",
  card: "bg-card border-border border",
}

/** A fill's inset when none is set. */
function defaultInset(fill: SlotFill): SlotInset {
  return fill === "muted" || fill === "card" ? 12 : 0
}

export type SlotProps = React.ComponentProps<"div"> & {
  fill?: SlotFill
  inset?: SlotInset
  alignX?: SlotAlign
  alignY?: SlotAlign
}

function Slot({ fill = "transparent", inset, alignX = "stretch", alignY = "stretch", className, style, ...props }: SlotProps) {
  return (
    <div
      data-slot="slot"
      data-fill={fill}
      // One cell of CSS grid: `justify-items`/`align-items` place the single child, and `stretch` fills the slot.
      className={cn("grid h-full w-full min-h-0 min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] overflow-hidden", SURFACE[fill], className)}
      style={{ padding: inset ?? defaultInset(fill), justifyItems: alignX, alignItems: alignY, ...style }}
      {...props}
    />
  )
}

/**
 * What a placed item shows: its component from the registry, or its sub-slots on its own cells (S2), or nothing. The
 * default renderer for any layout item that carries `slot`, `component` or `children`, so an exported layout renders
 * with no custom `renderItem` at all.
 */
function SlotContent({ item }: { item: GridLayoutItem }) {
  const fill = item.slot?.fill ?? "transparent"
  if (item.children) {
    // Sub-slots ignore the parent's inset and alignment (S2, S3): they are placed by coordinate on the parent's cells.
    return (
      <Slot fill={fill} inset={0}>
        <SubSlots item={item} />
      </Slot>
    )
  }
  return (
    <Slot fill={fill} inset={item.slot?.inset} alignX={item.slot?.alignX} alignY={item.slot?.alignY}>
      {item.component ? <Placed kind={item.component.kind} props={item.component.props} /> : null}
    </Slot>
  )
}

/** A slot's children, on the slot's cells: the same cell and gutter as the field it sits on. One page only (S5). */
function SubSlots({ item }: { item: GridLayoutItem }) {
  const m = useGridMetrics()
  if (!m || !item.children) return null
  const children = resolveSubSlots(item.children, item, m)
  return (
    <div
      data-slot="sub-slots"
      className="grid h-full w-full"
      style={{
        gridTemplateColumns: `repeat(${item.colSpan}, ${m.cell}px)`,
        gridTemplateRows: `repeat(${item.rowSpan}, ${m.cell}px)`,
        gap: m.gap,
      }}
    >
      {children.map((child) => (
        <div
          key={child.id}
          data-slot="sub-slot"
          className="min-h-0 min-w-0"
          style={{ gridColumn: `${child.col} / span ${child.colSpan}`, gridRow: `${child.row} / span ${child.rowSpan}` }}
        >
          <SlotContent item={child} />
        </div>
      ))}
    </div>
  )
}

/** True when an item is a slot with something to show — which is any item with slot tokens, a component or children. */
export function isSlotItem(item: GridLayoutItem) {
  return !!(item.slot || item.component || item.children)
}

export { Slot, SlotContent }
