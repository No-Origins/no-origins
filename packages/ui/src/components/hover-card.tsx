"use client"

import * as React from "react"
import { cn } from "cn"
import { HoverCard as HoverCardPrimitive } from "radix-ui"
import { usePortalContainer } from "@no-origins/ui/components/portal"

function HoverCard({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />
}

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  )
}

function HoverCardContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    // Motion.md M8: into the nearest PortalContainer (the motion studio's stage), else the body.
    <HoverCardPrimitive.Portal data-slot="hover-card-portal" container={usePortalContainer()}>
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 origin-(--radix-hover-card-content-transform-origin) rounded-lg bg-popover p-inset text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden motion-surface data-[side=bottom]:slide-in-from-top-(length:--motion-surface-shift) data-[side=left]:slide-in-from-right-(length:--motion-surface-shift) data-[side=right]:slide-in-from-left-(length:--motion-surface-shift) data-[side=top]:slide-in-from-bottom-(length:--motion-surface-shift) data-open:animate-in data-open:fade-in-0 data-open:zoom-in-(--motion-surface-scale) data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-(--motion-surface-scale)",
          className
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
