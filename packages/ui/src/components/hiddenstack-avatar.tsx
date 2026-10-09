"use client"

import * as React from "react"

import { Avatar, AvatarImage } from "@no-origins/ui/components/avatar"
import { Text } from "@no-origins/ui/components/text"
import type { HiddenstackView, HiddenstackViewer } from "@no-origins/ui/lib/hiddenstack-viewer"
import { HUMAN_RIG_START, type HumanRigState } from "@no-origins/ui/lib/human-motion"
import { cn } from "@no-origins/ui/lib/utils"

export type HiddenstackAvatarHandle = { view: (view: HiddenstackView) => void }
export type HiddenstackAvatarStatus = "loading" | "ready" | "unavailable"

/**
 * Hiddenstack's figure in 3D, the character artwork beside `Agent` in the system (Orbit's `/hiddenstack`).
 * Three.js loads only when this portrait mounts. All surrounding controls remain the system's existing controls.
 */
export function HiddenstackAvatar({ ref, poster, className, onStatusChange, rig = HUMAN_RIG_START }: {
  ref?: React.Ref<HiddenstackAvatarHandle>
  poster: string
  className?: string
  onStatusChange?: (status: HiddenstackAvatarStatus) => void
  rig?: HumanRigState
}) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const viewer = React.useRef<HiddenstackViewer | null>(null)
  const [status, setStatus] = React.useState<HiddenstackAvatarStatus>("loading")
  const description = React.useId()
  const latestRig = React.useRef(rig)
  React.useEffect(() => {
    latestRig.current = rig
    viewer.current?.rig(rig)
  }, [rig])
  React.useImperativeHandle(ref, () => ({ view: (view) => viewer.current?.view(view) }), [])
  React.useEffect(() => { onStatusChange?.(status) }, [onStatusChange, status])
  React.useEffect(() => {
    let cancelled = false
    let mounted: HiddenstackViewer | undefined
    import("@no-origins/ui/lib/hiddenstack-viewer").then(({ mountHiddenstackViewer }) => {
      if (cancelled || !canvas.current) return
      mounted = mountHiddenstackViewer(canvas.current, (ready) => {
        if (!cancelled) setStatus(ready ? "ready" : "unavailable")
      })
      viewer.current = mounted
      mounted.rig(latestRig.current)
    }).catch(() => {
      if (!cancelled) setStatus("unavailable")
    })
    return () => {
      cancelled = true
      viewer.current = null
      mounted?.dispose()
    }
  }, [])

  return (
    <div
      data-slot="hiddenstack-avatar"
      data-status={status}
      role="group"
      aria-label="Hiddenstack 3D avatar"
      aria-describedby={description}
      tabIndex={status === "ready" ? 0 : -1}
      className={cn("relative size-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset", className)}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return
        const step = Math.PI / 18
        const turns: Record<string, [number, number]> = {
          ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
        }
        if (turns[event.key]) {
          event.preventDefault()
          event.stopPropagation()
          viewer.current?.turn(...turns[event.key]!)
        } else if (event.key === "Home") {
          event.preventDefault()
          viewer.current?.view("three-quarter")
        }
      }}
    >
      <canvas ref={canvas} aria-hidden className="absolute inset-0 size-full touch-none" />
      {status !== "ready" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
          <Avatar className="size-full">
            <AvatarImage src={poster} alt="Hiddenstack, with swept black hair, round glasses, a black tee and folded arms" />
          </Avatar>
        </div>
      )}
      <Text id={description} className="sr-only">
        A full-body, rigged character with swept black hair, round glasses, a black T-shirt, sand trousers and sneakers.
        Drag to turn. When focused, use the arrow keys to turn and Home to reset the view.
      </Text>
    </div>
  )
}
