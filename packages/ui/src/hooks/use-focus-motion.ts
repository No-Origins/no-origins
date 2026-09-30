import * as React from "react"
import gsap from "gsap"

import {
  FOCUS_ON,
  focusLayerStyles,
  levelBetween,
  levelEntering,
  levelLeaving,
  paintFocus,
  placeBetween,
  readFocusMotion,
  type FocusBox,
  type FocusLevel,
  type FocusMotion,
} from "@no-origins/ui/lib/focus-motion"

/** The card in focus: a key the caller knows it by, and its box on the surface. */
export type FocusTarget = { key: string; box: FocusBox }

/**
 * Which card is in focus — its border goes to the secondary colour — and which stands over the cloth. They part only
 * while a focus goes: the card keeps its place over the layers until they are gone, so it is never blurred itself.
 */
export type FocusCards = { focused: string | null; lifted: string | null }

type FocusMotionOptions = {
  /** The surface the layers cover, which carries their custom properties. The motion is read off it. */
  surface: React.RefObject<HTMLElement | null>
  /** The card under the pointer, or null. Going null waits the motion's hold before the focus goes. */
  target: FocusTarget | null
  /** The field's pitch, cell and gutter, px: the tokens' distances are in cells. */
  pitch: number
  /** Told whenever the focused or the lifted card changes, to mark them. */
  onCards?: (cards: FocusCards) => void
  /** Anything that changes when the tokens do (the studio's jig): a new value and the motion is read again. */
  tuning?: unknown
  /** Hold still: nothing is painted here, and the caller paints frames of its own (the studio's timeline). */
  still?: boolean
  /** Play even under reduced motion — only the motion studio. Everything else goes straight to where it is going. */
  always?: boolean
}

type Tween<T> = { from: T; to: T; start: number; ms: number; ease: (t: number) => number; done?: () => void }
type Live = { key: string | null; lifted: string | null; box: FocusBox; level: FocusLevel; lift: number; shown: boolean; leaving: boolean }
type Tweens = { box?: Tween<FocusBox>; level?: Tween<FocusLevel>; lift?: Tween<number> }

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
const numberBetween = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Focus (Motion.md M13) on a surface: the card under the pointer in focus, and a cloth of blur round it, least at the
 * card and thicker out from it. A card reached from nothing brings the cloth by the motion's way — drawn out from under
 * it to every corner, swelling, or a fade — and is lifted over it, its shadow coming up on the cloth. Another card
 * reached takes the focus over: the cloth glides to it or jumps, and it is lifted once the cloth has come. Off every
 * card the focus holds for the motion's hold, and then goes by its way out, the lift going with it. One GSAP ticker
 * while anything moves, writing a few custom properties on the surface (`paintFocus`); nothing renders per frame.
 *
 * Returns the layers' styles, one element each over the whole surface, in order, for the caller to draw inside it.
 */
export function useFocusMotion({ surface, target, pitch, onCards, tuning, still = false, always = false }: FocusMotionOptions) {
  const [motion, setMotion] = React.useState<FocusMotion | null>(null)
  React.useLayoutEffect(() => {
    if (surface.current) setMotion(readFocusMotion(surface.current))
    // `tuning` says when to read the motion off the surface again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface, tuning])
  const layers = React.useMemo(() => (motion ? focusLayerStyles(motion, pitch) : []), [motion, pitch])

  const live = React.useRef<Live>({ key: null, lifted: null, box: { l: 0, t: 0, r: 0, b: 0 }, level: FOCUS_ON, lift: 0, shown: false, leaving: false })
  const tweens = React.useRef<Tweens>({})
  // The motion the frames are painted by: read again whenever a focus starts, moves or goes.
  const painting = React.useRef<FocusMotion | null>(null)
  const hold = React.useRef(0)
  const opts = React.useRef({ surface, pitch, onCards, still, always })
  React.useLayoutEffect(() => {
    opts.current = { surface, pitch, onCards, still, always }
  })

  const [clock] = React.useState(() => {
    let on = false
    const paint = () => {
      const l = live.current
      const el = opts.current.surface.current
      if (opts.current.still || !el) return
      painting.current ??= readFocusMotion(el)
      paintFocus(el, painting.current, { box: l.box, level: l.level, lift: l.lift, shown: l.shown }, opts.current.pitch)
    }
    function frame() {
      const now = performance.now()
      const l = live.current
      const t = tweens.current
      /** Where a tween is now, and whether it is there. */
      const at = <T,>(tw: Tween<T>, between: (a: T, b: T, p: number) => T): [T, boolean] => {
        const p = tw.ms > 0 ? Math.min(1, (now - tw.start) / tw.ms) : 1
        return p >= 1 ? [tw.to, true] : [between(tw.from, tw.to, tw.ease(p)), false]
      }
      // Each done with once it is there, and its `done` told — which may start the next (a glide's lift).
      if (t.box) {
        const [box, end] = at(t.box, placeBetween)
        l.box = box
        const done = end ? t.box.done : undefined
        if (end) t.box = undefined
        done?.()
      }
      if (t.level) {
        const [level, end] = at(t.level, levelBetween)
        l.level = level
        const done = end ? t.level.done : undefined
        if (end) t.level = undefined
        done?.()
      }
      if (t.lift) {
        const [lift, end] = at(t.lift, numberBetween)
        l.lift = lift
        if (end) t.lift = undefined
      }
      paint()
      if (!t.box && !t.level && !t.lift) stop()
    }
    const stop = () => {
      if (on) gsap.ticker.remove(frame)
      on = false
    }
    return {
      paint,
      run: () => {
        if (!on) gsap.ticker.add(frame)
        on = true
        frame()
      },
      stop,
    }
  })
  React.useEffect(() => clock.stop, [clock])

  // Letting go of the timeline shows the live state again.
  React.useLayoutEffect(() => {
    if (!still) clock.paint()
  }, [still, clock])

  const emit = React.useCallback(() => {
    const l = live.current
    opts.current.onCards?.({ focused: l.leaving ? null : l.key, lifted: l.lifted })
  }, [])

  const key = target?.key ?? null
  const box = target?.box
  const boxKey = box ? `${box.l},${box.t},${box.r},${box.b}` : ""
  React.useEffect(() => {
    const el = opts.current.surface.current
    if (!el) return
    window.clearTimeout(hold.current)
    const m = readFocusMotion(el)
    painting.current = m
    const quick = !opts.current.always && reduced()
    const ms = (n: number) => (quick ? 0 : n)
    const l = live.current
    const now = performance.now()
    /** The card lifted over the cloth, its shadow coming up from wherever it stands. */
    const liftUp = () => {
      tweens.current.lift = { from: live.current.lift, to: 1, start: performance.now(), ms: ms(m.liftMs), ease: m.liftEase }
    }

    if (key && box) {
      if (key === l.key && !l.leaving) {
        // The same card, moved (the field was measured again), or the pointer back on it from a gutter inside the hold:
        // the cloth goes with it. A glide on its way to it goes on to where it stands and lifts it when it arrives —
        // dropped, it took the lift with it and left the card under the cloth.
        const glide = tweens.current.box
        if (glide) glide.to = box
        else l.box = box
        clock.paint()
        return
      }
      if (!l.shown) {
        // From nothing: the cloth under the card, coming by its way. The card is over it at once — there is no blur yet
        // for it to leave — and lifts.
        tweens.current.box = undefined
        l.box = box
        l.level = levelEntering(m)
        l.shown = true
        l.lifted = key
        l.lift = 0
        liftUp()
      } else if (m.shift === "glide" && ms(m.glideMs) > 0 && l.lifted !== key) {
        // On to another card: the cloth glides over, and the card is lifted over it only once it has arrived. Lifted at
        // once it would snap from the blur where it stands to sharp; this way the blur round it thins as the cloth comes,
        // and it is at the cloth's least — next to where it is attached — when it goes over. The card left goes under at
        // once, its shadow with it, at the least too, where the cloth still is.
        l.lifted = null
        l.lift = 0
        tweens.current.lift = undefined
        tweens.current.box = {
          from: l.box,
          to: box,
          start: now,
          ms: ms(m.glideMs),
          ease: m.glideEase,
          done: () => {
            const l = live.current
            if (l.key !== key) return
            l.lifted = key
            emit()
            if (!l.leaving) liftUp()
          },
        }
      } else {
        tweens.current.box = undefined
        l.box = box
        if (l.lifted !== key) {
          l.lifted = key
          l.lift = 0
          liftUp()
        } else if (l.leaving) liftUp()
      }
      // A focus on its way in keeps going; one all out stays; one on its way out comes back.
      const coming = tweens.current.level && !l.leaving
      if (!coming && (l.leaving || l.level !== FOCUS_ON)) {
        tweens.current.level = {
          from: l.level,
          to: FOCUS_ON,
          start: now,
          ms: ms(m.inMs),
          ease: m.inEase,
          done: () => void (live.current.level = FOCUS_ON),
        }
      }
      l.key = key
      l.leaving = false
      emit()
      clock.run()
      return
    }

    if (!l.key) return
    // Off every card: hold, then go, the lift going down with the cloth.
    hold.current = window.setTimeout(() => {
      const now = performance.now()
      const g = readFocusMotion(el)
      painting.current = g
      l.leaving = true
      tweens.current.level = {
        from: l.level,
        to: levelLeaving(g, l.level),
        start: now,
        ms: ms(g.outMs),
        ease: g.outEase,
        done: () => {
          const l = live.current
          l.shown = false
          l.leaving = false
          l.key = null
          l.lifted = null
          l.level = FOCUS_ON
          l.lift = 0
          emit()
        },
      }
      tweens.current.lift = { from: l.lift, to: 0, start: now, ms: ms(g.outMs), ease: g.outEase }
      emit()
      clock.run()
      // The hold is not motion — it is how long a gutter takes to cross — so reduced motion keeps it.
    }, m.holdMs)
    // `boxKey` stands for the box.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, boxKey, clock, emit])

  React.useEffect(() => () => window.clearTimeout(hold.current), [])

  return { motion, layers }
}
