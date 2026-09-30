import * as React from "react"
import { cn } from "cn"

// Diverged from sera (2026-09-29, his: "even inputs will have full rounded border", after the dropdowns): the same
// outlined pill as `SelectTrigger` — a box rounded to a pill (Grid.md D39), the text inside its ends — not sera's
// underline field. Focus and invalid ring it as the trigger does; a field is typed into, not pressed, so no hover tint.
// A number field drops the browser's spin buttons — a square control in the pill's round end, which also took the room
// a short value needed (the motion studio's jigs); the arrow keys still step it.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-border bg-transparent px-4 py-1 text-base transition-[color,border-color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&[type=number]]:[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className
      )}
      {...props}
    />
  )
}

export { Input }
