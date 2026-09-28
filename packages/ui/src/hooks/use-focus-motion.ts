import * as React from "react"
import gsap from "gsap"

import {
  FOCUS_ON,
  focusLayerStyles,
  focusPlace,
  focusReach,
  levelBetween,
  levelEntering,
  levelFrom,
  levelIn,
  levelLeaving,
  paintFocus,
  placeBetween,
  readFocusMotion,
  type FocusBox,
  type FocusLevel,
  type FocusMotion,
  type FocusPlace,
} from "@no-origins/ui/lib/focus-motion"

/** The card in focus: a key the caller knows it by, and its box on the surface. */
export type FocusTarget = { key: string; box: FocusBox }

/**
 * Which card is in focus — its border goes to the secondary colour — and which stands over the blur. They part only
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
type Live = { key: string | null; lifted: string | null; place: FocusPlace; level: FocusLevel; shown: boolean; leaving: boolean }

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * Focus (Motion.md M13) on a surface: the card under the pointer in focus, and the page blurring round it, least at the
 * card and rising in rings out from it. A card reached from nothing brings the blur in by the motion's way — a ripple
 * spreading from it, the field swelling, or a fade. Another card reached takes the focus over and the field glides to
 * it or jumps. Off every card the focus holds for the motion's hold, and then goes by its way out. One GSAP ticker
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

  const live = React.useRef<Live>({ key: null, lifted: null, place: { x: 0, y: 0, r0: 0 }, level: FOCUS_ON, shown: false, leaving: false })
  const tweens = React.useRef<{ level?: Tween<FocusLevel>; place?: Tween<FocusPlace> }>({})
  const hold = React.useRef(0)
  const opts = React.useRef({ surface, pitch, onCards, still, always })
  React.useLayoutEffect(() => {
    opts.current = { surface, pitch, onCards, still, always }
  })

  const [clock] = React.useState(() => {
    let on = false
    const paint = () => {
      const l = live.current
      if (!opts.current.still) paintFocus(opts.current.surface.current, l.place, l.level, l.shown)
    }
    function frame() {
      const now = performance.now()
      const l = live.current
      const t = tweens.current
      const step = <T,>(tw: Tween<T> | undefined, between: (a: T, b: T, p: number) => T): T | null => {
        if (!tw) return null
        const p = tw.ms > 0 ? Math.min(1, (now - tw.start) / tw.ms) : 1
        return p >= 1 ? tw.to : between(tw.from, tw.to, tw.ease(p))
      }
      const place = step(t.place, placeBetween)
      if (place) l.place = place
      if (t.place && now - t.place.start >= t.place.ms) {
        const done = t.place.done
        t.place = undefined
        done?.()
      }
      const level = step(t.level, levelBetween)
      if (level) l.level = level
      if (t.level && now - t.level.start >= t.level.ms) {
        const done = t.level.done
        t.level = undefined
        done?.()
      }
      paint()
      if (!t.place && !t.level) stop()
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
    const quick = !opts.current.always && reduced()
    const ms = (n: number) => (quick ? 0 : n)
    const w = m.front * opts.current.pitch
    const reach = (p: FocusPlace) => focusReach(p, el.clientWidth, el.clientHeight)
    const l = live.current
    const now = performance.now()

    if (key && box) {
      const place = focusPlace(box, m.from)
      if (key === l.key && !l.leaving) {
        // The same card, moved (the field was measured again), or the pointer back on it from a gutter inside the hold:
        // the field goes with it. A glide on its way to it goes on to where it stands and lifts it when it arrives —
        // dropped, it took the lift with it and left the card under the blur.
        const glide = tweens.current.place
        if (glide) glide.to = place
        else l.place = place
        clock.paint()
        return
      }
      if (!l.shown) {
        // From nothing: the field stands on the card and comes in by its way. The card stands over it at once — there
        // is no blur yet for it to leave.
        tweens.current.place = undefined
        l.place = place
        l.level = levelEntering(m, w)
        l.shown = true
        l.lifted = key
      } else if (m.shift === "glide" && ms(m.glideMs) > 0 && l.lifted !== key) {
        // On to another card: the field glides over, and the card is lifted over it only once it has arrived. Lifted at
        // once it would snap from the blur where it stands to sharp; this way the blur round it thins as the field
        // comes, and it is at the field's least — next to its centre — when it goes over. The card left goes under
        // at once, at the least too, where the field still stands.
        l.lifted = null
        tweens.current.place = {
          from: l.place,
          to: place,
          start: now,
          ms: ms(m.glideMs),
          ease: m.glideEase,
          done: () => {
            const l = live.current
            if (l.key !== key) return
            l.lifted = key
            emit()
          },
        }
      } else {
        tweens.current.place = undefined
        l.place = place
        l.lifted = key
      }
      // A focus on its way in keeps going; one all in stays; one on its way out comes back in.
      const coming = tweens.current.level && !l.leaving
      if (!coming && (l.leaving || l.level !== FOCUS_ON)) {
        tweens.current.level = {
          from: levelFrom(l.level, reach(place), w),
          to: levelIn(reach(place), w),
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
    // Off every card: hold, then go.
    hold.current = window.setTimeout(() => {
      const now = performance.now()
      const g = readFocusMotion(el)
      const w = g.front * opts.current.pitch
      const r = reach(tweens.current.place?.to ?? l.place)
      const from = levelFrom(l.level, r, w)
      l.leaving = true
      tweens.current.level = {
        from,
        to: levelLeaving(g, from, r, w),
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
          emit()
        },
      }
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
