import { cubicBezier, motionMs, motionNumber } from "./motion"
import { springAt, springSettled, type Spring } from "./spring"

/**
 * The slider's steps (Motion.md M21, his, 2026-09-30): *"For sliders, we need an option to have segments … if the smallest
 * unit is 1 and if the total slider numbers are 5, we can have small dots above them, which can be controlled, the size …
 * it should give the tactile feedback and the motion should also be designed."* A slider given `marks` draws a dot over
 * each step's place, above the bar (slider.tsx). Three things make a step felt:
 *
 * - **The tick.** The value landing on a mark pops it: up to `pop` times its size in `popIn` ms, then back on a spring
 *   (`settle`), so a fast drag across the marks runs a wave through them. Where the device can, a vibration `haptic` ms
 *   long goes with it (`stepHaptic`; the Vibration API — Android's browsers, not iOS Safari).
 * - **The kick.** The head that moved pulses with the mark, `kick` times its size on the same curve — in the cursor
 *   while it is held, a bump in the bar's end at rest — so the tick is under the hand, not only over the bar.
 * - **The light.** A mark lights when the value lands on it, with its pop, and stays lit as long as the body's lime
 *   is over it (`markLit`): arriving is a click, leaving drains as the lime flows back.
 * - **The zone** (his, the same night: *"a control where I can control the zone for each mark, and if the cursor holding
 *   the head is in that zone, the head should snap right under the mark"*). Every mark has one, `zone` px either side
 *   of it along the bar (`zoneOf`; never past half way to the next mark, so zones meet at most). A held head whose
 *   cursor is in one goes under the mark on a spring `snap` ms long, and the value is the mark's; out of every zone the
 *   head is the cursor's again, and the value never lands on a mark it has not snapped to — let go between two and it
 *   falls back to the last. With a zone the tick is the snap, not the value landing; with none (0) it is the landing.
 *
 * Pure: `hooks/use-grip-motion.ts` plays it on the slider with the grip, and the motion studio's timeline paints any
 * moment of it from here. None of its tokens is in globals.css until he picks (M7): `STEP_START` is version 1's.
 */

const CUBIC_OUT = cubicBezier(0.215, 0.61, 0.355, 1)

export type StepMotion = {
  /** A mark's size at the top of its tick, times its size at rest. */
  pop: number
  /** ms from the tick to the top of the pop. */
  popIn: number
  /** The spring it comes back to its size on. */
  settle: Spring
  /** The head that moved at the top of its tick, times its size; 1 it does not move. */
  kick: number
  /** How long a tick vibrates, ms, where the device can; 0 never. */
  haptic: number
  /** How far either side of a mark a held head snaps under it, px; 0 never. */
  zone: number
  /** The spring a snapping head goes under its mark on, ms; 0 at once. */
  snap: number
}

/** Version 1's values: a quick pop to 1.8×, a bouncy settle, the head kicking to 1.2×, a 10ms buzz, a 16px zone. */
export const STEP_START = {
  pop: 1.8,
  popIn: 60,
  settle: { response: 360, bounce: 0.4 },
  kick: 1.2,
  haptic: 10,
  zone: 16,
  snap: 90,
} as const

const px = (el: Element, token: `--motion-${string}`, fallback: number) => {
  const n = parseFloat(getComputedStyle(el).getPropertyValue(token))
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

/** The steps' tokens off `el`, read when a tick or a hold starts, never cached. */
export function readStepMotion(el: Element): StepMotion {
  return {
    pop: Math.max(1, motionNumber(el, "--motion-step-pop", STEP_START.pop)),
    popIn: motionMs(el, "--motion-step-pop-in", STEP_START.popIn),
    settle: {
      response: motionMs(el, "--motion-step-settle", STEP_START.settle.response),
      bounce: Math.max(0, Math.min(0.9, motionNumber(el, "--motion-step-settle-bounce", STEP_START.settle.bounce))),
    },
    kick: Math.max(1, motionNumber(el, "--motion-step-kick", STEP_START.kick)),
    haptic: motionMs(el, "--motion-step-haptic", STEP_START.haptic),
    zone: px(el, "--motion-step-zone", STEP_START.zone),
    snap: motionMs(el, "--motion-step-snap", STEP_START.snap),
  }
}

/**
 * The mark whose zone `cursor` is in, by index, or null: `marks` are the marks' places and `cursor` the cursor's, px
 * along the bar from the start edge. A zone reaches `zone` either side of its mark, and never past half way to the next.
 */
export function zoneOf(cursor: number, marks: number[], zone: number): number | null {
  if (zone <= 0 || !marks.length) return null
  let nearest = 0
  marks.forEach((at, k) => void (Math.abs(at - cursor) < Math.abs(marks[nearest]! - cursor) && (nearest = k)))
  const gaps = marks.slice(1).map((at, k) => Math.abs(at - marks[k]!))
  const reach = Math.min(zone, gaps.length ? Math.min(...gaps) / 2 : Infinity)
  return Math.abs(marks[nearest]! - cursor) <= reach ? nearest : null
}

/**
 * A mark's scale `t` ms after its tick: up to `pop` on cubic out, then back to 1 on the settle spring. `peak` for another
 * height on the same curve — the head's kick.
 */
export function stepPopAt(motion: StepMotion, t: number, peak = motion.pop): number {
  if (t < 0) return 1
  if (t < motion.popIn) return 1 + (peak - 1) * CUBIC_OUT(t / motion.popIn)
  return springAt({ x: peak, v: 0 }, 1, t - motion.popIn, motion.settle).x
}

/** Whether a tick `t` ms ago is over, the mark back at its size. */
export function stepPopSettled(motion: StepMotion, t: number): boolean {
  if (t < motion.popIn) return motion.pop === 1
  return springSettled(springAt({ x: motion.pop, v: 0 }, 1, t - motion.popIn, motion.settle), 1, 0.002)
}

/**
 * How lit a mark is, 0 the bar's grey to 1 its lime, from the lime's two ends along the bar, `from` and `to` (px from the
 * start edge: the bar's start and the body's meeting point for one head, the two meeting points of a range): lit once
 * the lime has reached the mark's centre `at`, and fading over the mark's width `size` beyond either end.
 */
export function markLit(at: number, size: number, from: number, to: number): number {
  const outside = Math.max(from - at, at - to)
  return Math.max(0, Math.min(1, 1 - outside / Math.max(1, size)))
}

export type MarkFrame = { lit: number; scale: number }

/** A mark's frame, written on it; `null` puts it back to what the slider renders at rest. */
export function paintMark(mark: HTMLElement, frame: MarkFrame | null) {
  const lit = frame ? Math.round(frame.lit * 1000) / 10 : null
  mark.style.backgroundColor =
    lit === null ? "" : lit >= 100 ? "var(--primary)" : lit <= 0 ? "var(--input)" : `color-mix(in oklch, var(--primary) ${lit}%, var(--input))`
  mark.style.scale = frame && frame.scale !== 1 ? String(frame.scale) : ""
}

/** The tick a hand feels, where the device has a vibrator and the browser the Vibration API. */
export function stepHaptic(motion: StepMotion) {
  if (motion.haptic <= 0 || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return
  try {
    navigator.vibrate(Math.round(motion.haptic))
  } catch {
    // A browser may refuse it outside a gesture; the tick is still seen.
  }
}
