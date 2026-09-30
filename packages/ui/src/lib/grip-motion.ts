import { easing, motionMs, motionNumber } from "./motion"
import type { Spring, SpringState } from "./spring"

/**
 * The grip (Motion.md M16, his, 2026-09-30): the slider's head, merged into the bar at rest, detaching when it is taken
 * hold of and fitting into the cursor — "when I click the cursor doesn't need to fill, the head should detach and fit
 * into the cursor" — and going back into the bar when it is let go; and the body, fluid — "instead of segments, let's
 * make the body more fluid … give me the controls". Three things move. **The bar** opens round the head, its two sides
 * drawing back to stand the gap clear of the cursor's ring and rounding their ends. **The head** shrinks or grows to its
 * size in the cursor and goes to the cursor's centre. **The body** follows the head on a spring: where the bar's two
 * sides meet (at rest) or part (held) chases the head, so a quick move leaves the lime behind and it flows after, and a
 * moving end stretches its round cap with its speed. Pure: `hooks/use-grip-motion.ts` plays it on the slider, and the
 * motion studio's timeline paints any moment of it from here.
 *
 * Its `--motion-grip-*` tokens are his since 2026-09-30 (globals.css, "A Today, tuned", his second tuning of his pick),
 * and with them the bar's height, `--slider-height`; every fallback here is the same.
 */

const CUBIC_OUT = "cubic-bezier(0.215, 0.61, 0.355, 1)"

/** The grid's pointer, a 24px ring (globals.css, Grid.md D34): what the head fits into and the bar parts round. */
export const GRIP_RING = 24

export type GripMotion = {
  /** ms to take hold: the bar opening and the head going into the cursor. */
  in: number
  /** ms to let go: the head coming back and the bar closing over it. */
  out: number
  inEase: (t: number) => number
  outEase: (t: number) => number
  /** The head's side in the cursor, px; the cursor's ring is clear inside 20. */
  size: number
  /** The bar's lead, −0.6 to 0.6: + it opens before the head goes in (and closes after it is back), − after. */
  lead: number
  /** The spring the body follows the head on. */
  follow: Spring
  /** How far a moving end of the body stretches its cap with its speed, 0 not at all. */
  stretch: number
}

/**
 * The values globals.css has, what every token falls back to where it is unset. His (2026-09-30, "A Today, tuned"): the
 * head in the cursor at once as an 8px dot, the bar's own size; let go, the bar closing and the head coming back after
 * it over 240ms on cubic out; the body following on a quick spring with a little bounce.
 */
export const GRIP_START = {
  in: 0,
  out: 240,
  inEase: CUBIC_OUT,
  outEase: CUBIC_OUT,
  size: 8,
  lead: -0.5,
  follow: { response: 180, bounce: 0.2 },
  stretch: 0.6,
} as const

const easeOr = (el: Element, token: `--motion-${string}`, fallback: string) =>
  easing(getComputedStyle(el).getPropertyValue(token).trim() || fallback)

/** The grip's tokens off `el`, read when a hold, a let go or a move of the value starts, never cached. */
export function readGripMotion(el: Element): GripMotion {
  return {
    in: motionMs(el, "--motion-grip-in", GRIP_START.in),
    out: motionMs(el, "--motion-grip-out", GRIP_START.out),
    inEase: easeOr(el, "--motion-grip-in-ease", GRIP_START.inEase),
    outEase: easeOr(el, "--motion-grip-out-ease", GRIP_START.outEase),
    size: motionNumber(el, "--motion-grip-size", GRIP_START.size),
    lead: Math.max(-0.6, Math.min(0.6, motionNumber(el, "--motion-grip-lead", GRIP_START.lead))),
    follow: {
      response: motionMs(el, "--motion-grip-follow", GRIP_START.follow.response),
      bounce: Math.max(0, Math.min(0.9, motionNumber(el, "--motion-grip-follow-bounce", GRIP_START.follow.bounce))),
    },
    stretch: Math.max(0, motionNumber(el, "--motion-grip-stretch", GRIP_START.stretch)),
  }
}

/** How far each part is, 0 at rest (merged) and 1 held (open, the head in the cursor); an overshoot goes past. */
export type GripState = { bar: number; head: number }
export const GRIP_REST: GripState = { bar: 0, head: 0 }
export const GRIP_HELD: GripState = { bar: 1, head: 1 }

/** How long taking hold (`held`) or letting go lasts. */
export const gripTotal = (motion: GripMotion, held: boolean) => (held ? motion.in : motion.out)

/**
 * `t` ms into taking hold (`held`) or letting go, from `from`, which is where a hold let go half way (or a let go
 * taken hold of again) left the parts. Each part moves for (1 − |lead|) of the time; the bar first when the lead is
 * positive and the hold is being taken, and last when it is let go, so it opens before the head leaves it and closes
 * after the head is back.
 */
export function gripAt(motion: GripMotion, from: GripState, held: boolean, t: number): GripState {
  const ms = gripTotal(motion, held)
  const ease = held ? motion.inEase : motion.outEase
  const to = held ? 1 : 0
  const span = ms * (1 - Math.abs(motion.lead))
  const barFirst = motion.lead >= 0 === held
  const part = (start: number, a: number) => {
    const p = span <= 0 ? (t >= start ? 1 : 0) : Math.min(1, Math.max(0, (t - start) / span))
    return a + (to - a) * ease(p)
  }
  const later = ms * Math.abs(motion.lead)
  return { bar: part(barFirst ? 0 : later, from.bar), head: part(barFirst ? later : 0, from.head) }
}

/**
 * What the grip draws. `offset` is the cursor from the head's place on the bar, px, already held to the bar, and
 * `along` its share along the bar's axis from the start edge; `flow` is where the body's meeting point is, along the
 * axis from the head's place, and how fast it is going (px a ms) — the follow spring's state. Unset, the body is with
 * the head. The head is scaled from the bar's height to `size` and moved to the cursor; the bar's sides stand `hole`
 * from the body's meeting point on each side and round their ends there by `round` (0 square, joined under the head;
 * 1 a pill's end) — the ends round once they are away from the head as well as when the bar opens, since a square end
 * left behind would show — each cap `stretch` times its length along the bar.
 */
export type GripFrame = { scale: number; x: number; y: number; flow: number; hole: number; round: number; stretch: number }

export function gripFrame(
  state: GripState,
  shape: { bar: number; gap: number; size: number },
  offset: { x: number; y: number; along: number },
  motion: Pick<GripMotion, "stretch">,
  flow?: SpringState
): GripFrame {
  const shift = offset.along * state.head
  const body = flow ?? { x: shift, v: 0 }
  const lag = Math.abs(body.x - shift)
  return {
    scale: 1 + (shape.size / shape.bar - 1) * state.head,
    x: offset.x * state.head,
    y: offset.y * state.head,
    flow: body.x,
    // Held, the sides stand the gap clear of the cursor's ring.
    hole: Math.max(0, state.bar) * (GRIP_RING / 2 + shape.gap),
    round: Math.min(1, Math.max(Math.max(0, state.bar), lag / 6)),
    stretch: 1 + motion.stretch * Math.min(2, Math.abs(body.v) * 1.5),
  }
}

/**
 * Head `index`'s frame, on the head (its move and size) and on the slider's track (where the body's sides stand, as
 * custom properties its segments read); `null` puts both back to rest.
 */
export function paintGrip(track: HTMLElement, head: HTMLElement, index: number, frame: GripFrame | null) {
  head.style.translate = frame ? `${frame.x}px ${frame.y}px` : ""
  head.style.scale = frame ? String(frame.scale) : ""
  const set = (name: string, value: string | null) =>
    value === null ? track.style.removeProperty(name) : track.style.setProperty(name, value)
  set(`--slider-flow-${index}`, frame ? `${frame.flow}px` : null)
  set(`--slider-hole-${index}`, frame ? `${frame.hole}px` : null)
  set(`--slider-round-${index}`, frame ? String(frame.round) : null)
  set(`--slider-stretch-${index}`, frame ? String(frame.stretch) : null)
}
