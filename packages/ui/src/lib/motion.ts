/**
 * Motion tokens for script (Motion.md M3, 2026-09-27). The tokens are custom properties in globals.css — the value
 * there is the decision — and a stylesheet reads them through Tailwind. A component that moves from script (GSAP,
 * packages/ui rule 7) reads the SAME token off its own element with these, so a token overridden on a subtree — the
 * motion studio's stage — reaches it exactly as it reaches CSS.
 *
 * Read at the moment a motion starts, never cached: the studio changes a token between two plays.
 */

/**
 * A token's duration in ms, off `el`: `100ms` and `0.1s` both read as 100. `fallback` when it is unset or unreadable —
 * or negative, unless the token is `signed`, like a stagger that runs inward.
 */
export function motionMs(el: Element, token: `--motion-${string}`, fallback: number, signed = false): number {
  const raw = getComputedStyle(el).getPropertyValue(token).trim()
  const match = /^(-?[\d.]+)(ms|s)$/.exec(raw)
  if (!match) return fallback
  const n = Number(match[1]) * (match[2] === "s" ? 1000 : 1)
  return Number.isFinite(n) && (signed || n >= 0) ? n : fallback
}

/** A unitless token off `el` — a scale, a share — as a number. `fallback` when it is unset or not a number. */
export function motionNumber(el: Element, token: `--motion-${string}`, fallback: number): number {
  const raw = getComputedStyle(el).getPropertyValue(token).trim()
  const n = raw === "" ? NaN : Number(raw)
  return Number.isFinite(n) ? n : fallback
}

/** A token's easing, off `el`, as a function of progress 0..1 — what GSAP's `ease` takes. Linear when unreadable. */
export function motionEase(el: Element, token: `--motion-${string}`): (t: number) => number {
  return easing(getComputedStyle(el).getPropertyValue(token))
}

/** The CSS keyword easings, as the cubic-béziers the spec defines them by. */
const KEYWORDS: Record<string, [number, number, number, number]> = {
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
}

/** A CSS easing — a keyword or `cubic-bezier(x1, y1, x2, y2)` — as a function. `linear` and anything else: linear. */
export function easing(css: string): (t: number) => number {
  const value = css.trim()
  const keyword = KEYWORDS[value]
  if (keyword) return cubicBezier(...keyword)
  const match = /^cubic-bezier\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)$/.exec(value)
  if (match) {
    const [x1, y1, x2, y2] = match.slice(1).map(Number) as [number, number, number, number]
    if ([x1, y1, x2, y2].every(Number.isFinite)) return cubicBezier(x1, y1, x2, y2)
  }
  return (t) => t
}

/**
 * The curve CSS draws for `cubic-bezier(x1, y1, x2, y2)`: solve x(u) = t for the curve's parameter by Newton's method,
 * with bisection when the slope is too flat to trust, and return y(u). x1 and x2 are clamped to 0..1 as CSS requires;
 * y may go past 0..1, which is how an overshoot is written.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const ax1 = Math.min(1, Math.max(0, x1))
  const ax2 = Math.min(1, Math.max(0, x2))
  // B(u) = 3(1−u)²u·p1 + 3(1−u)u²·p2 + u³, as a polynomial in u.
  const cx = 3 * ax1, bx = 3 * (ax2 - ax1) - cx, axx = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ayy = 1 - cy - by
  const x = (u: number) => ((axx * u + bx) * u + cx) * u
  const y = (u: number) => ((ayy * u + by) * u + cy) * u
  const dx = (u: number) => (3 * axx * u + 2 * bx) * u + cx
  const solve = (t: number) => {
    let u = t
    for (let i = 0; i < 8; i++) {
      const err = x(u) - t
      if (Math.abs(err) < 1e-6) return u
      const slope = dx(u)
      if (Math.abs(slope) < 1e-6) break
      u -= err / slope
    }
    let lo = 0, hi = 1
    u = t
    for (let i = 0; i < 30; i++) {
      const v = x(u)
      if (Math.abs(v - t) < 1e-6) break
      if (v < t) lo = u
      else hi = u
      u = (lo + hi) / 2
    }
    return u
  }
  return (t) => (t <= 0 ? 0 : t >= 1 ? 1 : y(solve(t)))
}
