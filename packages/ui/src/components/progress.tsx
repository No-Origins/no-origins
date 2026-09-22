"use client"

import * as React from "react"
import { cn } from "cn"
import gsap from "gsap"
import { Progress as ProgressPrimitive } from "radix-ui"

/**
 * Diverges from shadcn's copy (packages/ui/CLAUDE.md rule 6): `animate` makes the indicator GROW into place instead
 * of appearing already full, tweened with GSAP — his call, 2026-09-21, for the bars on the Stack and Beyond screens.
 *
 * Why GSAP and not the `transition-all` the class list already carries: a transition needs two renders to fire, and
 * the bar's first render is the one that must start at zero, so a transition either misses the first frame or needs a
 * state flip per bar. GSAP owns the transform outright, interrupts cleanly when `value` changes under it
 * (`overwrite: "auto"`), and takes the `delay` that lets a card stagger its rows.
 *
 * `delay` is MILLISECONDS, like every other duration in this system; GSAP's own unit is seconds and the conversion
 * happens here. The transition class is dropped while GSAP drives, because a CSS transition on a property something
 * else writes every frame fights it.
 */
function Progress({
  className,
  value,
  animate,
  delay = 0,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  /** Grow the fill from empty rather than drawing it already full. */
  animate?: boolean
  /** Milliseconds before the growth starts — a card staggers its rows with it. */
  delay?: number
}) {
  const indicator = React.useRef<HTMLDivElement>(null)
  // The first run grows from empty; every later one carries on from wherever the bar is.
  const grown = React.useRef(false)

  React.useEffect(() => {
    const el = indicator.current
    if (!animate || !el) return
    const to = -(100 - (value || 0))
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(el, { xPercent: to, x: 0 })
      grown.current = true
      return
    }
    // `x: 0` is not decoration. GSAP reads an element's starting transform from the COMPUTED matrix, which the
    // browser has already resolved to pixels — so the inline `translateX(-100%)` below arrives as x = −width px, and
    // an `xPercent` tween lands on top of it: every bar sat exactly 100% too far left (measured, 2026-09-21).
    // Pinning x to 0 makes xPercent the whole of the translation.
    const tween = grown.current
      ? gsap.to(el, { xPercent: to, x: 0, duration: 0.4, ease: "power2.out", overwrite: "auto" })
      : gsap.fromTo(
          el,
          { xPercent: -100, x: 0 },
          { xPercent: to, x: 0, duration: 0.9, delay: delay / 1000, ease: "power3.out", overwrite: "auto" },
        )
    grown.current = true
    return () => {
      tween.kill()
    }
  }, [animate, value, delay])

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-0.5 w-full items-center overflow-x-hidden rounded-none bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        ref={indicator}
        data-slot="progress-indicator"
        className={cn("size-full flex-1 bg-primary", !animate && "transition-all")}
        // Empty on the first paint when GSAP is going to grow it, so no frame shows the full bar before the tween
        // starts. The value in the vdom never changes after that, so React does not write over what GSAP owns.
        style={{ transform: `translateX(-${animate ? 100 : 100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
