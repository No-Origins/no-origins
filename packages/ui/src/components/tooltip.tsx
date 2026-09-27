"use client"

import * as React from "react"
import { cn } from "cn"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import { usePortalContainer } from "@no-origins/ui/components/portal"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    // Motion.md M8: into the nearest PortalContainer (the motion studio's stage), else the body.
    <TooltipPrimitive.Portal container={usePortalContainer()}>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center motion-surface gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pe-1.5 data-[side=bottom]:slide-in-from-top-(length:--motion-surface-shift) data-[side=left]:slide-in-from-right-(length:--motion-surface-shift) data-[side=right]:slide-in-from-left-(length:--motion-surface-shift) data-[side=top]:slide-in-from-bottom-(length:--motion-surface-shift) **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-lg data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-(--motion-surface-scale) data-open:animate-in data-open:fade-in-0 data-open:zoom-in-(--motion-surface-scale) data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-(--motion-surface-scale)",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-none bg-foreground fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
