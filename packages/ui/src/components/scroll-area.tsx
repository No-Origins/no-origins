"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "cn"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

import { Liquid } from "@no-origins/ui/components/liquid"
import {
  readScrollMotion,
  SCROLL_CURSOR_FRAME_MS,
  SCROLL_START,
  scrollCursorAt,
  scrollCursorStill,
  scrollLevel,
  scrollProgress,
  scrolls,
  type ScrollCursorColours,
  type ScrollMotion,
} from "@no-origins/ui/lib/scroll-motion"

/*
 * Diverged from shadcn (his, 2026-10-09; Grid.md D52, Motion.md M26): there is no scrollbar. The page never scrolls,
 * but a component may scroll its own content, and the cursor shows how far. Over a box that scrolls, the cursor's ring
 * holds liquid at the share scrolled (Rest at the top, full at the end), flowing: it floats up as the pointer enters,
 * follows the scroll, disappears once the hand has been still for a second, and shows again, at the level, when the
 * pointer moves. While it scrolls, the ring and its liquid grow, and ease back when the scrolling stops. Leaving, the
 * ring is hollow. Radix's bar stays mounted, unseen and out of the pointer's way, because
 * the viewport scrolls only on an axis whose bar is mounted.
 */

// ── the liquid while it scrolls ──────────────────────────────────────────────────────────────────────────────

/** Where the scrolling liquid shows: centred on a point; `cursor` where it stands in for the ring cursor, hidden under it. */
type Showing = { level: number; from: number; x: number; y: number; cursor: boolean; grown: boolean; out: boolean }

type ScrollLiquidHandle = {
  /** Show (or move to) `level` at a point, grown; it arrives from `from` when it was not showing. */
  show: (level: number, from: number, x: number, y: number, cursor: boolean, motion: ScrollMotion) => void
  /** Fade away, then go. */
  fade: () => void
  /** Go at once. */
  drop: () => void
  at: () => Showing | null
}

/**
 * The ring and its liquid while the box scrolls under a still hand (a wheel turns under one): a 24px ring at the
 * point, the liquid a 20px glass inside it, growing to Grow times its size while the box scrolls and easing back Settle
 * after the last scroll (Motion.md M26). Where the grid draws a ring cursor (`cursor`), the cursor is hidden while this
 * stands in for it, and once it is back to the cursor's size it hands the level back to the cursor's own image
 * (`onBack`). Elsewhere (a finger, the keyboard, a grid without `cursor`) it fades Hold after. It plays at the screen's
 * rate, where the cursor's image is redrawn only 20 times a second, and nothing moves it after the pointer: when the
 * pointer moves, it goes. Drawn at the viewport's coordinates, so it is portalled to the body rather than to a
 * subtree's container (Motion.md M8): it belongs to the cursor, not a surface.
 */
const ScrollLiquid = React.forwardRef<ScrollLiquidHandle, { onBack: () => void }>(function ScrollLiquid({ onBack }, ref) {
  const [showing, setShowing] = React.useState<Showing | null>(null)
  const [motion, setMotion] = React.useState<ScrollMotion | null>(null)
  const timers = React.useRef<{ settle?: number; back?: number; hold?: number; gone?: number; frame?: number }>({})
  const current = React.useRef<Showing | null>(null)
  const back = React.useRef(onBack)
  React.useLayoutEffect(() => {
    back.current = onBack
  })

  const set = (next: Showing | null) => {
    current.current = next
    setShowing(next)
  }
  const clear = () => {
    const t = timers.current
    window.clearTimeout(t.settle)
    window.clearTimeout(t.back)
    window.clearTimeout(t.hold)
    window.clearTimeout(t.gone)
    if (t.frame) cancelAnimationFrame(t.frame)
  }
  const fade = (m: ScrollMotion) => {
    const was = current.current
    if (!was || was.out) return
    clear()
    set({ ...was, out: true })
    timers.current.gone = window.setTimeout(() => set(null), m.fade)
  }

  React.useImperativeHandle(
    ref,
    () => ({
      show(level, from, x, y, cursor, m) {
        clear()
        setMotion(m)
        const was = current.current
        if (was && !was.out) set({ ...was, level, cursor, grown: true })
        else {
          // In at the cursor's size, then grown the next frame, so the growth plays.
          set({ level, from, x, y, cursor, grown: false, out: false })
          timers.current.frame = requestAnimationFrame(() => {
            timers.current.frame = requestAnimationFrame(() => {
              if (current.current) set({ ...current.current, grown: true })
            })
          })
        }
        // Settle after the last scroll: back to the cursor's size, then the cursor's own (or, with no ring cursor, gone
        // Hold after).
        timers.current.settle = window.setTimeout(() => {
          if (!current.current) return
          set({ ...current.current, grown: false })
          timers.current.back = window.setTimeout(() => {
            if (!current.current) return
            if (current.current.cursor) back.current()
            else timers.current.hold = window.setTimeout(() => fade(m), m.hold)
          }, m.growOut)
        }, m.settle)
      },
      fade() {
        if (motion) fade(motion)
      },
      drop() {
        clear()
        if (current.current) set(null)
      },
      at: () => current.current,
    }),
    [motion],
  )

  React.useEffect(() => clear, [])

  if (!showing || !motion || typeof document === "undefined") return null
  const scale = showing.grown && !reduced() ? motion.grow : 1
  return createPortal(
    <div
      aria-hidden
      data-slot="scroll-liquid"
      data-grown={showing.grown || undefined}
      className="pointer-events-none fixed z-[100] size-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        left: showing.x,
        top: showing.y,
        scale,
        opacity: showing.out ? 0 : 1,
        transition: `scale ${showing.grown ? motion.growIn : motion.growOut}ms ${showing.grown ? motion.growInEase : motion.growOutEase}, opacity ${motion.fade}ms`,
      }}
    >
      <div className="absolute inset-0.5 overflow-hidden rounded-full">
        <Liquid
          level={showing.level}
          from={showing.from}
          label=""
          className="border-0 bg-transparent"
          style={{ "--motion-liquid-pour": `${motion.pour}ms`, "--motion-liquid-wave": motion.wave } as React.CSSProperties}
        />
      </div>
      <span className="border-secondary absolute inset-0 rounded-full border-2" />
    </div>,
    document.body,
  )
})

// ── the liquid in the cursor's own image ─────────────────────────────────────────────────────────────────────

/** A colour as sRGB, which an image can be drawn in: resolved by the page (custom properties, `color-mix`), then by a canvas. */
function srgb(css: string): string {
  const probe = document.createElement("span")
  probe.style.color = css
  document.body.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return resolved
  ctx.fillStyle = "#000"
  ctx.fillStyle = resolved
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return `rgb(${r},${g},${b})`
}

/** The liquid's colours now (the theme may have changed): the primary, and its back wave mixed toward the card. */
function liquidColours(): ScrollCursorColours {
  return { liquid: srgb("var(--primary)"), back: srgb("color-mix(in oklch, var(--primary) 55%, var(--card))") }
}

/** Whether a browser draws a cursor from `image-set`; else the 1x drawing alone. */
let imageSet: boolean | null = null
function oneX(): boolean {
  imageSet ??=
    typeof CSS !== "undefined" &&
    CSS.supports("cursor", scrollCursorStill(0.5, { ...SCROLL_START, riseEase: (t) => t }, { liquid: "red", back: "red" }))
  return !imageSet
}

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** The liquid in the cursor's image: the level it pours to, and whether it is shown, fading between. */
type CursorLiquid = {
  frame: number
  idle?: number
  motion: ScrollMotion | null
  colours: ScrollCursorColours | null
  /** When the flow started (its waves' clock), and the pour: from a level to another, since when. */
  flowAt: number
  from: number
  to: number
  pourAt: number
  /** Shown 1, gone 0; fading from `alphaFrom` toward `show` since `fadeAt`. */
  show: 0 | 1
  alphaFrom: number
  fadeAt: number
}

// ── the box ──────────────────────────────────────────────────────────────────────────────────────────────────

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  const viewport = React.useRef<HTMLDivElement>(null)
  const liquid = React.useRef<ScrollLiquidHandle>(null)
  /** The pointer over the viewport, as a hovering, fine one, or none (a finger, the keyboard, the pointer gone). */
  const pointer = React.useRef<{ x: number; y: number } | null>(null)
  const cursor = React.useRef<CursorLiquid>({
    frame: 0,
    motion: null,
    colours: null,
    flowAt: 0,
    from: 0,
    to: 0,
    pourAt: 0,
    show: 0,
    alphaFrom: 0,
    fadeAt: 0,
  })

  // A ring cursor to hold it: the grid's (Grid.md D34). Elsewhere the cursor's image is left alone.
  const ringCursor = () => !!viewport.current?.closest('[data-slot="grid"][data-cursor]')

  const levelNow = (c: CursorLiquid, now: number) => {
    if (!c.motion) return c.to
    const k = c.motion.rise <= 0 ? 1 : Math.min(1, (now - c.pourAt) / c.motion.rise)
    return c.from + (c.to - c.from) * c.motion.riseEase(k)
  }
  const alphaNow = (c: CursorLiquid, now: number) => {
    const fade = c.motion?.fade ?? SCROLL_START.fade
    const k = fade <= 0 ? 1 : Math.min(1, (now - c.fadeAt) / fade)
    return c.alphaFrom + (c.show - c.alphaFrom) * k
  }

  /** The ring hollow again: the cursor's image is the grid's own. */
  const hollow = () => {
    const el = viewport.current
    cancelAnimationFrame(cursor.current.frame)
    cursor.current.frame = 0
    el?.removeAttribute("data-scroll-cursor")
    el?.style.removeProperty("--scroll-cursor")
  }

  /** The cursor hidden while the scrolling ring stands in for it. */
  const hideCursor = () => {
    const el = viewport.current
    cancelAnimationFrame(cursor.current.frame)
    cursor.current.frame = 0
    el?.style.setProperty("--scroll-cursor", "none")
    el?.setAttribute("data-scroll-cursor", "")
  }

  /** Draws the cursor's image every `SCROLL_CURSOR_FRAME_MS` while the liquid shows or fades; hollow once it has gone. */
  const run = () => {
    const el = viewport.current
    const c = cursor.current
    if (!el || c.frame) return
    let last = -Infinity
    const step = (now: number) => {
      c.frame = 0
      if (!c.motion || !c.colours) return
      const alpha = alphaNow(c, now)
      if (c.show === 0 && alpha <= 0) return hollow()
      if (now - last >= SCROLL_CURSOR_FRAME_MS) {
        last = now
        const css = reduced()
          ? scrollCursorStill(c.to, c.motion, c.colours, oneX())
          : scrollCursorAt(now - c.flowAt, c.motion, c.colours, { from: c.from, to: c.to, since: now - c.pourAt, alpha }, oneX())
        el.style.setProperty("--scroll-cursor", css)
        el.setAttribute("data-scroll-cursor", "")
      }
      c.frame = requestAnimationFrame(step)
    }
    step(performance.now())
  }

  /** The liquid gone once the hand has been still for Hold. */
  const restart = () => {
    const c = cursor.current
    window.clearTimeout(c.idle)
    if (!c.motion) return
    c.idle = window.setTimeout(() => {
      const now = performance.now()
      c.alphaFrom = alphaNow(c, now)
      c.fadeAt = now
      c.show = 0
    }, c.motion.hold)
  }

  /**
   * The cursor's liquid at the box's level: floating up from empty as the pointer enters (`rise`), else shown again
   * where it is, fading in if it had gone.
   */
  const showCursor = (rise: boolean) => {
    const el = viewport.current
    const c = cursor.current
    if (!el || !ringCursor()) return
    if (!scrolls(el)) {
      c.show = 0
      return hollow()
    }
    const now = performance.now()
    // Read when the pointer comes in, not on every move.
    const m = rise || !c.motion ? readScrollMotion(el) : c.motion
    const level = scrollLevel(scrollProgress(el), m)
    if (!c.colours || rise) c.colours = liquidColours()
    c.motion = m
    if (rise) {
      c.flowAt = now
      c.from = 0
      c.to = level
      c.pourAt = now
      c.alphaFrom = 1
      c.show = 1
      c.fadeAt = now
    } else {
      if (c.to !== level) {
        c.from = levelNow(c, now)
        c.to = level
        c.pourAt = now
      }
      if (c.show === 0) {
        c.alphaFrom = alphaNow(c, now)
        c.fadeAt = now
        c.show = 1
      }
    }
    restart()
    run()
  }

  const onScroll = () => {
    const el = viewport.current
    if (!el || !liquid.current) return
    const m = readScrollMotion(el)
    const level = scrollLevel(scrollProgress(el), m)
    const at = pointer.current
    const c = cursor.current
    if (at && ringCursor()) {
      // The hand is still while a wheel turns: the scrolling ring stands in for the cursor at the screen's rate, grown,
      // arriving from the level the cursor's image held, and the cursor is hidden under it until it hands back.
      const now = performance.now()
      const from = c.show === 1 ? levelNow(c, now) : 0
      c.show = 0
      c.alphaFrom = 0
      c.from = level
      c.to = level
      c.pourAt = now
      window.clearTimeout(c.idle)
      hideCursor()
      return liquid.current.show(level, from, at.x, at.y, true, m)
    }
    // No ring cursor at the point (a finger, the keyboard, a grid without `cursor`): a ring of its own, at the pointer
    // or the box's end corner.
    if (at) return liquid.current.show(level, 0, at.x, at.y, false, m)
    const box = el.getBoundingClientRect()
    const rtl = getComputedStyle(el).direction === "rtl"
    liquid.current.show(level, 0, rtl ? box.left + 20 : box.right - 20, box.top + 20, false, m)
  }

  // Back at the cursor's size after a scroll: the cursor's own image takes the level on, shown at once, and the scrolling
  // ring goes a moment later, once the cursor has been redrawn; Hold after, the liquid disappears.
  const onBack = () => {
    const c = cursor.current
    c.show = 1
    c.alphaFrom = 1
    c.fadeAt = performance.now()
    showCursor(false)
    window.setTimeout(() => liquid.current?.drop(), SCROLL_CURSOR_FRAME_MS * 2)
  }

  React.useEffect(() => {
    const c = cursor.current
    return () => {
      cancelAnimationFrame(c.frame)
      window.clearTimeout(c.idle)
    }
  }, [])

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewport}
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
        onScroll={onScroll}
        onWheel={(event) => {
          pointer.current = { x: event.clientX, y: event.clientY }
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === "touch") return
          pointer.current = { x: event.clientX, y: event.clientY }
          showCursor(true)
        }}
        onPointerMove={(event) => {
          if (event.pointerType === "touch") return
          pointer.current = { x: event.clientX, y: event.clientY }
          const at = liquid.current?.at()
          // The pointer moving off the scrolling liquid lets it go: nothing here follows the pointer (Grid.md D34). The
          // cursor's own image carries the level on, at once where the scrolling liquid was still showing.
          if (at && Math.hypot(event.clientX - at.x, event.clientY - at.y) > 4) {
            const shown = !at.out
            liquid.current?.drop()
            if (shown) {
              const c = cursor.current
              c.show = 1
              c.alphaFrom = 1
              c.fadeAt = performance.now()
            }
            return showCursor(false)
          }
          if (!at) showCursor(false)
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "touch") pointer.current = null
        }}
        onPointerLeave={() => {
          pointer.current = null
          const c = cursor.current
          c.show = 0
          window.clearTimeout(c.idle)
          hollow()
          liquid.current?.fade()
        }}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
      <ScrollLiquid ref={liquid} onBack={onBack} />
    </ScrollAreaPrimitive.Root>
  )
}

/**
 * Radix's bar, kept because the viewport scrolls only on an axis whose bar is mounted, and never seen or pressed: the
 * scroll shows in the cursor (above).
 */
function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "pointer-events-none flex opacity-0 data-horizontal:h-2.5 data-horizontal:flex-col data-vertical:h-full data-vertical:w-2.5",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb data-slot="scroll-area-thumb" className="relative flex-1" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
