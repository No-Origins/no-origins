import * as React from "react"
import gsap from "gsap"

import {
  cellEnterFrame,
  cellEnterSettled,
  cellEnterTotal,
  cellEntries,
  cellMotionFrame,
  cellMotionTotal,
  cellMoves,
  cellPresence,
  readCellEnter,
  readCellMotion,
  settledFrames,
  type CellEnterFrame,
  type CellFlow,
  type CellFrame,
  type CellPresence,
  type CellState,
} from "@no-origins/ui/lib/cell-motion"

type CellMotionOptions = {
  /** The block the elements stand on. The motion is read off it (`readCellMotion`) as each move starts. */
  block: React.RefObject<HTMLElement | null>
  /**
   * Where every element stands with `which` grown. Its identity is the block's shape: a new one (another count, flow,
   * cell or grow) and the block stands still where the active element puts it, with no move.
   */
  states: (which: number | null) => CellState[]
  /** The element grown, or none. Every change of it is a move. */
  active: number | null
  flow: CellFlow
  cell: number
  gap: number
  /** Writes a frame onto the elements. It runs every tick, so it touches the DOM and never React state. */
  paint: (frames: CellFrame[]) => void
  /** Hold still: no move plays, and the caller paints through `draw` (the studio's scrub). */
  still?: boolean
  /**
   * Play even under reduced motion. Only the motion studio, where the motion is what is being looked at; everything
   * else jumps to where it is going (Motion.md §5).
   */
  always?: boolean
}

/**
 * Movement (Motion.md M9, his, 2026-09-27) on a block of elements: every change of `active` is a move from wherever
 * each element is NOW to where it goes, so a hover that changes its mind half way turns the block round from where it
 * stands. One GSAP clock a move, and each tick hands `cellMotionFrame`'s frame to `paint`; nothing renders per frame.
 * The motion studio's stage, the portfolio's tech column and the numbered pager bar (Grid.md D47) all play through
 * this, so what is tuned on the stage is what the others do.
 *
 * Returns `draw`, which paints a frame and remembers it as where the elements are, for a caller that paints one
 * itself.
 */
export function useCellMotion({ block, states, active, flow, cell, gap, paint, still = false, always = false }: CellMotionOptions) {
  const frames = React.useRef<CellFrame[]>([])
  const clock = React.useRef<gsap.core.Tween | null>(null)
  const last = React.useRef(0)

  const draw = React.useCallback(
    (next: CellFrame[]) => {
      frames.current = next
      paint(next)
    },
    [paint],
  )

  // A new block stands still where the active element puts it.
  React.useLayoutEffect(() => {
    clock.current?.kill()
    const count = states(null).length
    draw(settledFrames(states(active !== null && active < count ? active : null)))
    // Only the block's shape: `active` changing is the move below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states, draw])

  React.useLayoutEffect(() => {
    clock.current?.kill()
    if (still) return
    const to = states(active)
    const moves = cellMoves(frames.current, to, active ?? last.current)
    if (active !== null) last.current = active
    const el = block.current
    const reduced = !always && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const motion = el ? readCellMotion(el) : null
    const total = motion && !reduced ? cellMotionTotal(motion, moves) : 0
    if (!motion || total <= 0) {
      draw(settledFrames(to))
      return
    }
    const time = { ms: 0 }
    clock.current = gsap.to(time, {
      ms: total,
      duration: total / 1000,
      ease: "none",
      onUpdate: () => draw(cellMotionFrame(motion, moves, flow, time.ms, cell, gap)),
    })
    // A move starts on a change of the active element, or on letting go of `still`; the numbers are read as it starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, still])

  React.useEffect(() => () => void clock.current?.kill(), [])

  return { draw }
}

type CellEnterOptions = {
  /** The block the elements stand on. The motion is read off it (`readCellEnter`) as each enter or exit starts. */
  block: React.RefObject<HTMLElement | null>
  /** Where every element stands on its cell. A new array is a new block, which stands still, in or gone. */
  states: readonly CellState[]
  /** In or gone. Every change of it is an enter or an exit. */
  present: boolean
  flow: CellFlow
  cell: number
  gap: number
  /** Writes a frame onto the elements. It runs every tick, so it touches the DOM and never React state. */
  paint: (frames: CellEnterFrame[]) => void
  /** Hold still: nothing plays, and the caller paints through `draw` (the studio's timeline). */
  still?: boolean
  /** Play even under reduced motion: only the motion studio (Motion.md §5). */
  always?: boolean
}

/**
 * Enter and exit (Motion.md M11), movement's first primitive, on a block of elements: every change of `present` is an
 * enter or an exit from wherever each element is NOW, so one turned round part way goes back the way it came. One GSAP
 * clock a change, and each tick hands `cellEnterFrame`'s frame to `paint`. Only the motion studio plays it so far.
 *
 * Returns `draw`, which paints a frame and remembers it as where the elements are, for a caller that paints one
 * itself.
 */
export function useCellEnter({ block, states, present, flow, cell, gap, paint, still = false, always = false }: CellEnterOptions) {
  const frames = React.useRef<CellPresence[]>([])
  const clock = React.useRef<gsap.core.Tween | null>(null)

  const draw = React.useCallback(
    (next: CellEnterFrame[]) => {
      frames.current = next
      paint(next)
    },
    [paint],
  )

  // A new block stands still, in or gone.
  React.useLayoutEffect(() => {
    clock.current?.kill()
    const el = block.current
    if (el) draw(cellEnterSettled(readCellEnter(el), states, present, flow, cell, gap))
    // Only the block's shape: `present` changing is the enter or exit below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states, draw])

  React.useLayoutEffect(() => {
    clock.current?.kill()
    const el = block.current
    if (still || !el) return
    const motion = readCellEnter(el)
    const from = frames.current.length === states.length ? frames.current : cellPresence(states.length, !present)
    const list = cellEntries(from, present)
    const reduced = !always && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const total = reduced ? 0 : cellEnterTotal(motion, list)
    if (total <= 0) {
      draw(cellEnterSettled(motion, states, present, flow, cell, gap))
      return
    }
    const time = { ms: 0 }
    clock.current = gsap.to(time, {
      ms: total,
      duration: total / 1000,
      ease: "none",
      onUpdate: () => draw(cellEnterFrame(motion, list, states, flow, time.ms, cell, gap)),
    })
    // An enter or exit starts on a change of `present`, or on letting go of `still`; the numbers are read as it starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [present, still])

  React.useEffect(() => () => void clock.current?.kill(), [])

  return { draw }
}
