import { LIQUID_START, liquidFrame, liquidPath, type LiquidFrame, type LiquidMotion } from "./liquid-motion"
import { easing, motionMs, motionNumber } from "./motion"

/**
 * The scroll's liquid (Motion.md M26; Grid.md D52; version 1, 2026-10-09, his: "the scroll bar should show the
 * percentage like fluid in our status page … as we scroll the fluid should fill up … and the fluid should disappear
 * after a second"), pure: a component that scrolls its own content shows how far in the cursor, whose hollow ring
 * fills with `Liquid` to the share scrolled.
 *
 * Version 3 (2026-10-09, his: "show some minimum level of fluid in the cursor that floats up when the cursor enters a
 * scrollable area", then "the level of the fluid should always be tied to the amount of scroll in the section … it
 * should disappear. And whenever there's movement of the cursor, the fill should be visible again"): over a box that
 * scrolls, the ring holds liquid at the share scrolled, from Rest at the top to full at the end (`scrollLevel`),
 * flowing; it floats up as the pointer enters, follows the scroll, disappears once the hand has been still for Hold, and
 * shows again, at the level, when the pointer moves.
 *
 * Version 4 (2026-10-09, his: "while scrolling, let's scale up the cursor and the fluid in it. And then once the scroll
 * stops, we scale back. The motion, as usual, has to be fluid"): while the box scrolls, the ring and its liquid grow
 * to Grow times the cursor, and Settle after the last scroll they ease back.
 *
 * The family: **Rest**, the level at the top, so a box that scrolls always shows some; **Rise**, how long the liquid
 * takes to float up on entering, and **Rise ease**; **Hold**, how long it stays once the hand is still; **Fade**, how long
 * it takes to go, and to come back; **Pour**, how quickly it follows the scroll (the liquid's own pour, Motion.md M25,
 * made quick); **Wave**, its surface's height in the ring, a share of it (the liquid's wave, taller for a 20px glass);
 * **Grow**, how many times the cursor's size the ring is while it scrolls, growing over **Grow in** on **Grow in ease**
 * (a little past, then back) and easing back over **Grow out** on **Grow out ease**; **Settle**, how long after the last
 * scroll it counts as stopped. None is in globals.css: `SCROLL_START` is version 4's.
 */

export type ScrollMotion = {
  rest: number
  rise: number
  riseEase: (t: number) => number
  hold: number
  fade: number
  pour: number
  wave: number
  grow: number
  growIn: number
  /** As CSS, for the transition that plays it. */
  growInEase: string
  growOut: number
  growOutEase: string
  settle: number
}

export const SCROLL_START = {
  rest: 0.2,
  rise: 480,
  riseEase: LIQUID_START.pourEase,
  hold: 1000,
  fade: 240,
  pour: 280,
  wave: 0.14,
  grow: 2,
  growIn: 320,
  growInEase: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  growOut: 420,
  growOutEase: "cubic-bezier(0.22, 1, 0.36, 1)",
  settle: 180,
} as const

const css = (el: Element, token: string) => getComputedStyle(el).getPropertyValue(token).trim()

/** The scroll's motion off an element, read when the liquid shows. */
export function readScrollMotion(el: Element): ScrollMotion {
  const ease = getComputedStyle(el).getPropertyValue("--motion-scroll-rise-ease").trim()
  return {
    rest: Math.min(1, Math.max(0, motionNumber(el, "--motion-scroll-rest", SCROLL_START.rest))),
    rise: motionMs(el, "--motion-scroll-rise", SCROLL_START.rise),
    riseEase: easing(ease || SCROLL_START.riseEase),
    hold: motionMs(el, "--motion-scroll-hold", SCROLL_START.hold),
    fade: motionMs(el, "--motion-scroll-fade", SCROLL_START.fade),
    pour: motionMs(el, "--motion-scroll-pour", SCROLL_START.pour),
    wave: Math.min(0.5, Math.max(0, motionNumber(el, "--motion-scroll-wave", SCROLL_START.wave))),
    grow: Math.min(4, Math.max(1, motionNumber(el, "--motion-scroll-grow", SCROLL_START.grow))),
    growIn: motionMs(el, "--motion-scroll-grow-in", SCROLL_START.growIn),
    growInEase: css(el, "--motion-scroll-grow-in-ease") || SCROLL_START.growInEase,
    growOut: motionMs(el, "--motion-scroll-grow-out", SCROLL_START.growOut),
    growOutEase: css(el, "--motion-scroll-grow-out-ease") || SCROLL_START.growOutEase,
    settle: motionMs(el, "--motion-scroll-settle", SCROLL_START.settle),
  }
}

/** How far a box is scrolled, 0 at its start to 1 at its end; 0 when it does not scroll. */
export function scrollProgress(el: { scrollTop: number; scrollHeight: number; clientHeight: number }): number {
  const room = el.scrollHeight - el.clientHeight
  return room > 1 ? Math.min(1, Math.max(0, el.scrollTop / room)) : 0
}

/** The liquid's level for a share scrolled: Rest at the top, full at the end, in proportion between. */
export const scrollLevel = (progress: number, m: Pick<ScrollMotion, "rest">) =>
  m.rest + (1 - m.rest) * Math.min(1, Math.max(0, progress))

/** Whether a box scrolls at all: its content is taller than it is. */
export const scrolls = (el: { scrollHeight: number; clientHeight: number }) => el.scrollHeight > el.clientHeight + 1

/**
 * The component that scrolls its own content under an event's target, if any: the place a wheel, a finger or a key
 * belongs to before the grid's turn (Grid.md D52).
 */
export function scrollerAt(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null
  const el = target.closest<HTMLElement>('[data-slot="scroll-area-viewport"]')
  return el && scrolls(el) ? el : null
}

/** The ring's colour: `--violet` as sRGB, the same drawing as the cursor in globals.css (Grid.md D34, D43). */
export const CURSOR_RING = "#9262f3"

/** The colours a resting ring is drawn in, as sRGB: an image cannot read a custom property. */
export type ScrollCursorColours = { liquid: string; back: string }

/**
 * The liquid that rests in the ring: M25's flow (its waves, back wave and bob, version 1's) at the scroll's wave height,
 * rising to its rest over Rise on Rise ease as its pour.
 */
function restingLiquid(m: ScrollMotion): LiquidMotion {
  return { ...LIQUID_START, wave: m.wave, pour: m.rise, pourEase: m.riseEase }
}

/**
 * One size of the ring holding a frame of liquid: a 24-unit drawing at `px` pixels, the liquid a 20-unit glass, shown
 * `alpha` of the way (its fade in and out; the ring stays whole).
 */
function ringSvg(m: LiquidMotion, frame: LiquidFrame, colours: ScrollCursorColours, px: number, alpha: number): string {
  const back = liquidPath(m, frame, 20, 20, "back")
  const front = liquidPath(m, frame, 20, 20, "front")
  const shown = alpha >= 1 ? "" : ` fill-opacity='${alpha}'`
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='${px}' height='${px}' viewBox='0 0 24 24'>` +
    `<defs><clipPath id='g'><circle cx='12' cy='12' r='10'/></clipPath></defs>` +
    `<g clip-path='url(#g)'><g transform='translate(2 2)'>` +
    (back ? `<path d='${back}' fill='${colours.back}'${shown}/>` : "") +
    (front ? `<path d='${front}' fill='${colours.liquid}'${shown}/>` : "") +
    `</g></g><circle cx='12' cy='12' r='11' fill='none' stroke='${CURSOR_RING}' stroke-width='2'/></svg>`
  )
}

const url = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`

/**
 * How often the resting liquid's cursor image is redrawn, ms. A browser redraws a changed cursor about this often
 * while the mouse is still (Chromium every 50ms), so the flow plays at 20 frames a second.
 */
export const SCROLL_CURSOR_FRAME_MS = 50

/** Drawings already made, by frame: the flow loops, so the same few are asked for again and again. */
const drawn = new Map<string, string>()

/** A frame as CSS for `cursor`: the 2x drawing for a dense screen, the hotspot at the centre, or the 1x alone. */
function cursorOf(m: LiquidMotion, f: LiquidFrame, colours: ScrollCursorColours, alpha: number, fallback: boolean): string {
  // Rounded so the loop's frames repeat: a 48th of a wavelength, a 200th of the glass.
  const q = {
    level: Math.round(f.level * 200) / 200,
    phase: Math.round(f.phase * 48) / 48,
    backPhase: Math.round(f.backPhase * 48) / 48,
    bob: Math.round(f.bob * 500) / 500,
    waves: f.waves,
  }
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 10) / 10
  const key = `${q.level}|${q.phase}|${q.backPhase}|${q.bob}|${q.waves}|${a}|${m.wave}|${colours.liquid}|${colours.back}|${fallback}`
  const known = drawn.get(key)
  if (known) return known
  const one = url(ringSvg(m, q, colours, 24, a))
  const css = fallback ? `${one} 12 12, auto` : `image-set(${one} 1x, ${url(ringSvg(m, q, colours, 48, a))} 2x) 12 12, auto`
  if (drawn.size > 2000) drawn.clear()
  drawn.set(key, css)
  return css
}

/** Where the resting liquid is going: a pour from one level to another, `since` ms ago, and how far it is shown. */
export type ScrollCursorState = { from: number; to: number; since: number; alpha: number }

/**
 * The cursor over a box that scrolls, `t` ms after its flow started: the ring holding the liquid as it pours to its
 * level (rising on Rise's curve) and flows there, shown `alpha` of the way, as CSS for `cursor`. It is an image like the
 * ring itself, so it never trails the hand (Grid.md D34); redrawn every `SCROLL_CURSOR_FRAME_MS`, it flows. `fallback`
 * is the 1x line alone, for a browser without `image-set` for cursors.
 */
export function scrollCursorAt(t: number, m: ScrollMotion, colours: ScrollCursorColours, at: ScrollCursorState, fallback = false): string {
  const liquid = restingLiquid(m)
  return cursorOf(liquid, liquidFrame(liquid, t, { from: at.from, to: at.to, since: at.since }), colours, at.alpha, fallback)
}

/** The same still and flat at `level`, for reduced motion. */
export function scrollCursorStill(level: number, m: ScrollMotion, colours: ScrollCursorColours, fallback = false): string {
  const liquid = restingLiquid(m)
  return cursorOf(liquid, { level, phase: 0, backPhase: 0, bob: 0, waves: 0 }, colours, 1, fallback)
}
