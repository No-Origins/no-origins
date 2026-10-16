"use client"

import * as React from "react"
import { cn } from "cn"

import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@no-origins/ui/components/tooltip"

/**
 * THE COLOUR PICKER (his, 2026-10-01: *"We have to keep it consistent, so make it part of the design system. That
 * color pickers should always be like the paint we have in character studio"*): swatches, one a colour, the one picked
 * pressed — what a colour is is seen, not read. It is Orbit's Paint line, moved here whole, and every
 * pick of a colour in every app is one (Orbit.md C17). Written for the system rather than pulled from a
 * registry, since shadcn has none; composed from `ToggleGroup`, so its arrows, focus and pressed state are the toggle's.
 *
 * - **Each option is a value, a name and a colour** (`colour`, any CSS colour, so a caller passes what the colour is
 *   now — the agent's paint, its ink on that paint). The name is each swatch's accessible name, and **a tooltip** on
 *   hover and on focus (his, 2026-10-15: *"add tooltips to these colors because I'm unable to see which color it
 *   is"*): two options can look alike (on a violet agent, its paint and Violet), and the name is what tells them apart.
 * - **Every swatch is the small size** (36px, a toggle's `sm`) and square, **and they stand in rows** (his, 2026-10-14:
 *   *"I'm unable to recognise colors from color palettes. Organize them and break them into rows"*): as many to a row
 *   as the column holds, the rest on the next, each row from the start. They never grow smaller to share a column —
 *   a swatch too small to see its colour is no use — and a palette of fifty in a card is rows, not a line of specks.
 * - **A family is a row** (`group`): options that name one stand on a row of their own, in the order given, so a
 *   palette organised by family (the creams, the blues, light to dark) reads as its families. The caller organises;
 *   the picker lays the rows. An option without a family shares a row with its neighbours without one.
 * - **One is always picked**: pressing the one picked does not unpick it.
 * - **Several may be picked** (`multiple`; his, 2026-10-15, of a grove's trees: *"allow me to select multi-colors so
 *   that we can randomly distribute these colors"*): each swatch pressed is picked, pressing it again unpicks it, and
 *   the last one picked stays, so one is still always picked. The value is the picked ones, in the options' order.
 * - Each swatch is a circle (the one radius, Grid.md D39, on a box a cell or less across), a 20px dot of the colour
 *   inside (16 until 2026-10-15, too little colour to read), ringed so the page's white shows on the page; the picked
 *   one's edge is the foreground.
 */

export type ColourOption = {
  value: string
  /** What it is called: the swatch's accessible name and its tooltip. */
  label: string
  /** What it looks like, as CSS. */
  colour: string
  /** The family it is in, where a palette has them (Neutrals, Blues): a family's swatches share a row. */
  group?: string
}

/** The options in their rows: a run of one family (or of none) is a row, in the order given. */
function rowsOf(options: readonly ColourOption[]) {
  const rows: { group?: string; options: ColourOption[] }[] = []
  for (const option of options) {
    const last = rows[rows.length - 1]
    if (last && last.group === option.group) last.options.push(option)
    else rows.push({ group: option.group, options: [option] })
  }
  return rows
}

/**
 * A swatch as its tooltip's trigger. Radix's Toggle lets a `data-state` it is handed override its own on · off, and the
 * tooltip's trigger hands one down (closed · delayed-open), so that one is dropped here and the swatch keeps its pressed
 * state, which its edge is drawn from.
 */
function Swatch({ "data-state": _tooltipState, ...props }: React.ComponentProps<typeof ToggleGroupItem> & { "data-state"?: string }) {
  return <ToggleGroupItem {...props} />
}

/** One colour picked, or (`multiple`) several, never none. */
type Picking =
  | { multiple?: false; value: string; onValueChange: (value: string) => void }
  | { multiple: true; value: readonly string[]; onValueChange: (value: string[]) => void }

function ColourPicker({
  options,
  disabled,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "onChange" | "defaultValue" | "dir"> &
  Picking & {
    options: readonly ColourOption[]
    disabled?: boolean
  }) {
  const { multiple, value, onValueChange, ...rest } = props as Picking & Omit<React.ComponentProps<"div">, "onChange" | "defaultValue" | "dir">
  const shared = {
    size: "sm",
    variant: "outline",
    spacing: 1,
    disabled,
    "data-slot": "colour-picker",
    className: cn("flex w-full flex-col items-stretch gap-1", className),
    ...rest,
  } as const
  const rows = rowsOf(options).map((row, index) => (
    <div
      key={row.group ?? index}
      role={row.group ? "group" : undefined}
      aria-label={row.group}
      data-slot="colour-picker-row"
      className="grid grid-cols-[repeat(auto-fill,2.25rem)] justify-start gap-1"
    >
      {row.options.map((option) => (
        <Tooltip key={option.value}>
          <TooltipTrigger asChild>
            <Swatch
              value={option.value}
              aria-label={option.label}
              data-slot="colour-picker-swatch"
              className="aspect-square h-auto w-full min-w-0 px-0 data-[state=on]:border-foreground"
            >
              <span
                aria-hidden
                className="aspect-square w-5 max-w-[65%] shrink-0 rounded-lg ring-1 ring-border"
                style={{ background: option.colour }}
              />
            </Swatch>
          </TooltipTrigger>
          <TooltipContent>{option.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ))
  return (
    <TooltipProvider>
      {multiple ? (
        <ToggleGroup
          type="multiple"
          value={[...value]}
          onValueChange={(next) => {
            // The options' order, so the value reads as the palette does; pressing the last one picked keeps it.
            if (next.length) onValueChange(options.map((option) => option.value).filter((one) => next.includes(one)))
          }}
          data-multiple=""
          {...shared}
        >
          {rows}
        </ToggleGroup>
      ) : (
        <ToggleGroup
          type="single"
          value={value}
          onValueChange={(next) => {
            if (next) onValueChange(next)
          }}
          {...shared}
        >
          {rows}
        </ToggleGroup>
      )}
    </TooltipProvider>
  )
}

export { ColourPicker }
