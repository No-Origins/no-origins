"use client"

import * as React from "react"
import { cn } from "cn"

import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group"

/**
 * THE COLOUR PICKER (his, 2026-10-01: *"We have to keep it consistent, so make it part of the design system. That
 * color pickers should always be like the paint we have in character studio"*): swatches, one a colour, the one picked
 * pressed — what a colour is is seen, not read. It is the character studio's Paint line, moved here whole, and every
 * pick of a colour in every app is one (Character-Studio.md C17). Written for the system rather than pulled from a
 * registry, since shadcn has none; composed from `ToggleGroup`, so its arrows, focus and pressed state are the toggle's.
 *
 * - **Each option is a value, a name and a colour** (`colour`, any CSS colour, so a caller passes what the colour is
 *   now — the agent's paint, its ink on that paint). The name is each swatch's accessible name and its title: two
 *   options can look alike (on a violet agent, its paint and Violet), and the name is what tells them apart.
 * - **The swatches stand together from the picker's start**, each the small size across (36px, a toggle's `sm`) and
 *   square; where the column it is given is too narrow for them, they share it out and grow smaller, so seven fit a
 *   narrow card, and never wrap.
 * - **One is always picked**: pressing the one picked does not unpick it.
 * - Each swatch is a circle (the one radius, Grid.md D39, on a box a cell or less across), a dot of the colour inside,
 *   ringed so the page's white shows on the page; the picked one's edge is the foreground.
 */

export type ColourOption = {
  value: string
  /** What it is called: the swatch's accessible name and its title. */
  label: string
  /** What it looks like, as CSS. */
  colour: string
}

function ColourPicker({
  options,
  value,
  onValueChange,
  disabled,
  className,
  style,
  ...props
}: Omit<React.ComponentProps<"div">, "onChange" | "defaultValue" | "dir"> & {
  options: readonly ColourOption[]
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={value}
      onValueChange={(next) => next && onValueChange(next)}
      disabled={disabled}
      data-slot="colour-picker"
      className={cn("grid w-full justify-start gap-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 2.25rem))`, ...style }}
      {...props}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={option.label}
          title={option.label}
          data-slot="colour-picker-swatch"
          className="aspect-square h-auto w-full min-w-0 px-0 data-[state=on]:border-foreground"
        >
          <span
            aria-hidden
            className="aspect-square w-4 max-w-[65%] shrink-0 rounded-lg ring-1 ring-border"
            style={{ background: option.colour }}
          />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export { ColourPicker }
