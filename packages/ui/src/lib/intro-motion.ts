import { motionMs } from "@no-origins/ui/lib/motion"

/**
 * The intro (Grid.md D50, Motion.md M22, his, 2026-09-30: "take the avatar. It should breathe for like one, two seconds.
 * And then it should jump within the same cell and create a ripple activations of cells … each cell in circles around
 * the agent circle should activate. One circle by one circle from center to the borders of the layout, and then the
 * agent disappears and the card should render smoothly"), pure: when each part of it is, and when each cell of the
 * field lights.
 *
 * The agent — the design system's, `lib/sphere-motion` — stands in the page's circle for it (the portfolio's avatar
 * ring, `data-intro-agent`) while the page's boxes are held back. It **breathes** (its own rest, `sphereStill`) for
 * `breathe`, then **hops** and lands back in the same circle (a `sphereCourse` from its nest to its nest, its own
 * crouch and leap). As it lands the field **wakes ring by ring**: every cell whose centre is the same number of pitches
 * out from the circle's edge lights at once, the first ring at the landing and each next one `ring` later, out to the
 * field's farthest corner — one pass of the field's painter (grid-field.ts), in a worker, each cell lit and fading as
 * the pointer's does. When the last ring has lit the agent **fades away** over `vanish`, and the page's boxes **come
 * in** over `reveal`, from the same moment.
 *
 * Version 1's numbers are mine, his to tune. None of its `--motion-intro-*` tokens is in globals.css yet:
 * `readIntroMotion` falls back to INTRO_START.
 */
export type IntroMotion = {
  /** How long it breathes before it hops, ms. */
  breathe: number
  /** The time between one ring of cells lighting and the next, ms. */
  ring: number
  /** How long the agent takes to fade away once the last ring has lit, ms. */
  vanish: number
  /** How long the page's boxes take to come in, from the same moment, ms. */
  reveal: number
}

/**
 * Version 1 (2026-09-30, mine): 2s of breath — his "one, two seconds", and at his agent's 4s breath one breath in, so
 * it hops from the top of it — a ring every 45ms, about 0.8s from the avatar to a desktop's far corner, a 300ms fade
 * and a 500ms reveal.
 */
export const INTRO_START: IntroMotion = { breathe: 2000, ring: 45, vanish: 300, reveal: 500 }

/** The intro's tokens off `el`, read as it starts; INTRO_START where one is unset. */
export function readIntroMotion(el: Element): IntroMotion {
  return {
    breathe: motionMs(el, "--motion-intro-breathe", INTRO_START.breathe),
    ring: motionMs(el, "--motion-intro-ring", INTRO_START.ring),
    vanish: motionMs(el, "--motion-intro-vanish", INTRO_START.vanish),
    reveal: motionMs(el, "--motion-intro-reveal", INTRO_START.reveal),
  }
}

/** The field, as the rings are counted on it: px from its first cell's top-left corner. */
export type IntroField = { cols: number; rows: number; cell: number; gap: number }

/** The agent's circle on the field: its centre and radius, px from the field's first cell. */
export type IntroCircle = { x: number; y: number; r: number }

/**
 * Which ring each cell of the field is in, reading order: how many whole pitches its centre is out from the circle's
 * edge. A cell whose centre is inside the circle is ring 0, with the first ring outside it — under the agent, and hidden
 * by its nest.
 */
export function introRings({ cols, rows, cell, gap }: IntroField, circle: IntroCircle): Uint16Array {
  const pitch = cell + gap
  const rings = new Uint16Array(cols * rows)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = Math.hypot(c * pitch + cell / 2 - circle.x, r * pitch + cell / 2 - circle.y)
      rings[r * cols + c] = Math.max(0, Math.floor((d - circle.r) / pitch))
    }
  }
  return rings
}

/** When each part of the intro is, ms from its start, and each cell's delay after the landing. */
export type IntroPlan = {
  /** When it starts to hop: the breath is over. */
  hop: number
  /** When it lands, and the first ring lights. */
  land: number
  /** Each cell's time to light, ms after `land`, reading order: what the field's painter takes as one pass. */
  delays: Float64Array
  /** The last ring's delay. */
  span: number
  /** When the last ring lights, the agent starts to fade and the boxes start to come in. */
  vanish: number
  /** When it is over: the agent gone and the boxes in. */
  end: number
}

/** The intro's plan: `leap` is how long the hop takes from its start to its landing (its crouch and its hang). */
export function introPlan(m: IntroMotion, leap: number, rings: Uint16Array): IntroPlan {
  const delays = new Float64Array(rings.length)
  let span = 0
  for (let i = 0; i < rings.length; i++) {
    delays[i] = rings[i]! * m.ring
    span = Math.max(span, delays[i]!)
  }
  const hop = m.breathe
  const land = hop + leap
  const vanish = land + span
  return { hop, land, delays, span, vanish, end: vanish + Math.max(m.vanish, m.reveal) }
}
