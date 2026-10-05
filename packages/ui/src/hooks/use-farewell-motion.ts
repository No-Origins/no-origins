"use client"

import { useLayoutEffect, useRef, type RefObject } from "react"
import { gsap } from "gsap"
import { motionEase, motionMs, motionNumber } from "../lib/motion"

/** Closing sequence: scale the clear scene onto its cells, then reveal its hero and destinations. */
export function useFarewellMotion(ref: RefObject<HTMLElement | null>, visible: boolean, stage: RefObject<HTMLElement | null>, contentAspect: number) {
  const previous = useRef<DOMRect | null>(null)
  useLayoutEffect(() => {
    const element = ref.current
    const scene = stage.current
    if (!element || !visible || !scene) return
    const before = previous.current
    const after = scene.getBoundingClientRect()
    const hero = element.querySelector("[data-farewell-hero]")
    const links = element.querySelectorAll("[data-farewell-link]")
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const planDuration = reduced ? 0 : motionMs(element, "--motion-farewell-plan-in", 1200) / 1000
    const duration = reduced ? 0 : motionMs(element, "--motion-farewell-in", 1200) / 1000
    const delay = motionMs(element, "--motion-farewell-links-delay", 500) / 1000
    const ease = motionEase(element, "--motion-farewell-ease")
    const context = gsap.context(() => {
      gsap.set(hero, { autoAlpha: 0, y: reduced ? 0 : motionNumber(element, "--motion-farewell-shift", 16) })
      gsap.set(links, { autoAlpha: 0, y: reduced ? 0 : motionNumber(element, "--motion-farewell-links-shift", 8) })
      const timeline = gsap.timeline()
      if (before && !reduced) {
        // Fit once at the destination, then move only its compositor layer. Matching the
        // contained content's scale preserves the Plan even when the two boxes differ in aspect.
        const scale = Math.min(before.width / contentAspect, before.height)
          / Math.min(after.width / contentAspect, after.height)
        timeline.fromTo(scene, {
          x: before.left + before.width / 2 - after.left - after.width / 2,
          y: before.top + before.height / 2 - after.top - after.height / 2,
          scale, transformOrigin: "50% 50%", willChange: "transform",
        }, {
          x: 0, y: 0, scale: 1,
          duration: planDuration, ease,
          onComplete: () => { gsap.set(scene, { clearProps: "transform,transformOrigin,willChange" }) },
        }, 0)
      }
      timeline.to(hero, { autoAlpha: 1, y: 0, duration, ease }, planDuration)
      timeline.to(links, {
        autoAlpha: 1, y: 0,
        duration: reduced ? 0 : motionMs(element, "--motion-farewell-links-in", 700) / 1000,
        stagger: reduced ? 0 : motionMs(element, "--motion-farewell-links-stagger", 90) / 1000,
        ease,
        onComplete: () => { gsap.set([hero, ...links], { clearProps: "opacity,transform,visibility" }) },
      }, planDuration + duration + delay)
    }, element)
    return () => context.revert()
  }, [ref, visible, stage, contentAspect])
  // Keep the previous full-stage box before React places the compact Plan on its ending cells.
  useLayoutEffect(() => {
    if (!visible && stage.current) previous.current = stage.current.getBoundingClientRect()
  })
}
