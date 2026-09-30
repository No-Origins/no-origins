/**
 * Springs as a hand tunes them (Motion.md M16, his, 2026-09-30: "a little spring control"): a **response**, ms — how
 * long one swing takes, the spring's period with no damping — and a **bounce**, 0 none to 0.9 (1 less its damping
 * ratio). Solved in closed form, a damped oscillator of unit mass, so a frame at any moment is the same however it is
 * reached: what lets the motion studio's timeline hold any frame, and a frame loop step exactly whatever its rate.
 */

export type Spring = { response: number; bounce: number }

/** A spring's place and velocity (per ms). */
export type SpringState = { x: number; v: number }

/** Where a spring is `t` ms after it set off from `from` towards `to`. A response of 0 is there at once. */
export function springAt(from: SpringState, to: number, t: number, spring: Spring): SpringState {
  if (t <= 0) return from
  if (spring.response <= 0) return { x: to, v: 0 }
  const w0 = (2 * Math.PI) / spring.response
  const zeta = 1 - Math.min(0.9, Math.max(0, spring.bounce))
  const a = from.x - to
  if (zeta >= 1) {
    const b = from.v + w0 * a
    const e = Math.exp(-w0 * t)
    return { x: to + (a + b * t) * e, v: (b - w0 * (a + b * t)) * e }
  }
  const wd = w0 * Math.sqrt(1 - zeta * zeta)
  const b = (from.v + zeta * w0 * a) / wd
  const e = Math.exp(-zeta * w0 * t)
  const cos = Math.cos(wd * t)
  const sin = Math.sin(wd * t)
  return {
    x: to + e * (a * cos + b * sin),
    v: e * ((b * wd - zeta * w0 * a) * cos - (a * wd + zeta * w0 * b) * sin),
  }
}

/** Whether a spring has come to rest at `to`, within `eps` of it and hardly moving. */
export const springSettled = (s: SpringState, to: number, eps: number) =>
  Math.abs(s.x - to) < eps && Math.abs(s.v) < eps / 16

/**
 * A spring following a target that moves, `target(t)`, from `x0` at rest: where it is at `t`, stepped every `dt` ms
 * with the target held over each step — the timeline's way of playing what a hand does live, one frame at a time.
 */
export function springFollow(x0: number, target: (t: number) => number, t: number, spring: Spring, dt = 16): SpringState {
  let state: SpringState = { x: x0, v: 0 }
  for (let s = 0; s < t; s += dt) state = springAt(state, target(s), Math.min(dt, t - s), spring)
  return state
}
