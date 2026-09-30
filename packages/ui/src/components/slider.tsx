"use client"

import * as React from "react"
import { cn } from "cn"
import { Direction, Slider as SliderPrimitive } from "radix-ui"

import { useGripMotion } from "@no-origins/ui/hooks/use-grip-motion"

/** The corners on the start edge's side of a segment, and on the end's. */
const CORNERS = {
  left: [["borderTopLeftRadius", "borderBottomLeftRadius"], ["borderTopRightRadius", "borderBottomRightRadius"]],
  right: [["borderTopRightRadius", "borderBottomRightRadius"], ["borderTopLeftRadius", "borderBottomLeftRadius"]],
  top: [["borderTopLeftRadius", "borderTopRightRadius"], ["borderBottomLeftRadius", "borderBottomRightRadius"]],
  bottom: [["borderBottomLeftRadius", "borderBottomRightRadius"], ["borderTopLeftRadius", "borderTopRightRadius"]],
} as const

const HALF = "var(--slider-bar) / 2"

/*
 * Diverged from shadcn's (rule 6), his, 2026-09-30: the slider is a bar (`--slider-bar`, `--slider-height` — 8px, his
 * second tuning of the grip in globals.css; 16px at his pick, and the cursor's ring, 24px, before it; a subtree sets its
 * own, the motion studio's stage), rounded, and its head
 * a circle the bar's height (`--slider-head`) **merged into the bar**: the bar's lime and its grey meet under the head's
 * centre, square there, so the lime ends in the head's round end — his: "keep everything rounded, including the head,
 * but let's merge both head and body". There is no one bar under radix's Range: the track is drawn as segments, lime
 * from the start to the head (between the heads of a range) and the input's grey past it. Radix puts a head's near
 * edge at p × (length − head) from the start edge, in every direction (its in-bounds offset), so a segment's ends are
 * reckoned from the values alone, never measured. The value is held here as well as in radix, so an uncontrolled
 * slider knows where its heads are.
 *
 * **The grip** (Motion.md M16, his: "when I click the cursor doesn't need to fill, the head should detach and fit into
 * the cursor", and then "let's make the body more fluid"). The head the pointer holds is marked `data-held` — the pressed
 * one, else the one nearest the press, as radix moves it — and `useGripMotion` plays it: the bar's two sides draw back
 * from the held head, `--slider-gap` (2px) clear of the cursor's ring, and round their ends, and the head goes into the
 * ring; let go, it comes back and the bar closes over it. And the body follows each head on a spring, whenever the value
 * moves: where the sides meet (or part) chases the head, and a moving end stretches its cap. It writes where each
 * side stands on the track (`--slider-flow-<i>`, `--slider-hole-<i>`, `--slider-round-<i>`, `--slider-stretch-<i>`,
 * which the segments read, at rest unset) and the head's move and size on the head. The pressed cursor stays a ring over
 * a held head (globals.css). A segment's corners are half the bar, not the one radius: a half-cell radius on one corner
 * would scale every corner of the segment down with it, and the ends at a head would never round fully.
 *
 * (A segmented variant was tried the same night and taken out, his: "let's not have segments, I did not like it.")
 *
 * **Marks** (Motion.md M21, his, the same night: "an option to have segments … small dots above them … the size can be
 * controlled … it should give the tactile feedback"). `marks` draws a dot over each step's place — every step, or every
 * `marks` of the value's units when it is a number — above the bar (before it, standing vertical), in room the slider
 * keeps for them at the top of its box, so nothing stacked over it meets them. A mark stands where a head would at its value,
 * so a head at rest is right under its mark. It is the bar's grey, and lime where the value is; a value landing on one
 * ticks it — it pops, the head kicks, and the device vibrates where it can — and one the value has left stays lime until
 * the body's lime has flowed back past it (`useGripMotion`'s `land`, the package's `step-motion`). **Each mark has a
 * zone** (his, the same night): a held head whose cursor comes within `--motion-step-zone` of a mark snaps under it and
 * takes its value, and that snap is the tick; out of every zone the value lands on no mark. `--slider-mark-size` and
 * `--slider-mark-lift` set the dot and its distance from the bar (read, never declared; 6px and 6px unset).
 */
function Slider({
  className,
  defaultValue,
  value,
  onValueChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  min = 0,
  max = 100,
  step = 1,
  marks,
  orientation = "horizontal",
  inverted = false,
  dir,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  /** Draw a mark over every step's place, or — a number — every that many of the value's units from `min`. */
  marks?: boolean | number
}) {
  const [kept, setKept] = React.useState(defaultValue ?? [min])
  const values = value ?? kept
  // Which head the pointer holds, by its index, as radix numbers them.
  const [grip, setGrip] = React.useState<number | null>(null)
  const track = React.useRef<HTMLSpanElement>(null)
  const direction = Direction.useDirection(dir)
  const vertical = orientation === "vertical"
  // The edge radix slides the heads from, as its SliderHorizontal and SliderVertical decide it.
  const start = vertical
    ? inverted
      ? "top"
      : "bottom"
    : (direction === "ltr") !== inverted
      ? "left"
      : "right"
  const along = vertical ? "height" : "width"
  // The marks' values, from min: every step, or every `marks` of the value's units.
  const every = marks === true ? step : typeof marks === "number" ? marks : 0
  const span = max - min
  const count = every > 0 && span > 0 ? Math.floor(span / every + 1e-9) + 1 : 0
  const marked = Array.from({ length: count }, (_, k) => min + k * every)
  /** The mark a value is on, by index, or −1 between two. */
  const markOf = (v: number) => {
    const k = Math.round((v - min) / every)
    return k >= 0 && k < count && Math.abs(min + k * every - v) < 1e-6 * (every || 1) ? k : -1
  }
  const motion = useGripMotion({
    track,
    vertical,
    start,
    values: values.join(","),
    marks: count > 0,
    // A held head snapped under a mark takes the mark's value.
    onSnap: (index, k) => {
      const v = marked[k]
      if (v === undefined || values[index] === v) return
      const next = values.map((x, i) => (i === index ? v : x))
      if (value === undefined) setKept(next)
      onValueChange?.(next)
    },
  })
  const at = [...values]
    .sort((a, b) => a - b)
    .map((v) => Math.min(1, Math.max(0, (v - min) / (max - min || 1))))

  // Segment k runs from head k − 1 (or the start) to head k (or the end), from where the body meets at the head — the
  // head's centre at rest, chased by the follow — opened by the grip. A negative length is clamped to nothing.
  const edge = (k: number, side: "+" | "-") =>
    `${at[k]} * (100% - var(--slider-head)) + var(--slider-head) / 2 + var(--slider-flow-${k}, 0px) ${side} var(--slider-hole-${k}, 0px)`
  // A segment's end at a head: square at rest, round once open or away from the head, its cap stretched along the bar.
  const inner = (k: number) => {
    const r = `var(--slider-round-${k}, 0) * ${HALF}`
    const long = `calc(${r} * var(--slider-stretch-${k}, 1))`
    return vertical ? `calc(${r}) ${long}` : `${long} calc(${r})`
  }
  const outer = `calc(${HALF})`
  const [near, far] = CORNERS[start]
  const segments = Array.from({ length: at.length + 1 }, (_, k) => {
    const from = k === 0 ? "0px" : edge(k - 1, "+")
    const to = k === at.length ? "100%" : edge(k, "-")
    const round = { near: k === 0 ? outer : inner(k - 1), far: k === at.length ? outer : inner(k) }
    const style: React.CSSProperties = {
      [start]: `calc(${from})`,
      [along]: `calc(${to} - (${from}))`,
      [near[0]]: round.near,
      [near[1]]: round.near,
      [far[0]]: round.far,
      [far[1]]: round.far,
    }
    return { style, active: at.length === 1 ? k === 0 : k > 0 && k < at.length }
  })

  // At rest a mark is lit where the lime is: at or under one head, between the first and the last of a range.
  const lowest = values.length > 1 ? Math.min(...values) : -Infinity
  const highest = Math.max(...values)
  const across = vertical ? "width" : "height"
  const beside = vertical ? "end-full me-(--slider-lift) inset-y-0" : "bottom-full mb-(--slider-lift) inset-x-0"

  const letGo = () => {
    setGrip(null)
    motion.letGo()
  }

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      value={values}
      onValueChange={(raw) => {
        // Held with a zone, the value is the mark the head is snapped under, and out of every zone it lands on no mark.
        const zone = motion.snapped()
        const next = zone
          ? raw.map((v, i) => (i !== zone.index ? v : zone.mark !== null ? marked[zone.mark]! : markOf(v) >= 0 ? values[i]! : v))
          : raw
        if (zone && next.every((v, i) => v === values[i])) return
        // A head dragged past another takes the other's index in radix, so the grip follows the value that moved.
        if (grip !== null && next.length > 1) {
          const moved = next.findIndex((v) => !values.includes(v))
          if (moved >= 0 && moved !== grip) {
            setGrip(moved)
            motion.retarget(moved)
          }
        }
        // A value landing on a mark ticks it, and kicks the head that took it there.
        if (count) {
          const moved = next.flatMap((v, i) => (!values.includes(v) && markOf(v) >= 0 ? [i] : []))
          motion.land(moved.map((i) => markOf(next[i]!)), moved)
        }
        if (value === undefined) setKept(next)
        onValueChange?.(next)
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (props.disabled) return
        // The head radix will move: the one pressed, else the one nearest the press, as its closest value is.
        const heads = [...event.currentTarget.querySelectorAll<HTMLElement>('[data-slot="slider-thumb"]')]
        if (!heads.length) return
        const pressed = heads.indexOf(event.target as HTMLElement)
        const centre = (h: HTMLElement) => {
          const r = (h.parentElement ?? h).getBoundingClientRect()
          return vertical ? r.top + r.height / 2 : r.left + r.width / 2
        }
        const pointer = vertical ? event.clientY : event.clientX
        const nearest = heads.reduce(
          (best, h, i) => (Math.abs(centre(h) - pointer) < Math.abs(centre(heads[best]!) - pointer) ? i : best),
          0
        )
        const index = pressed >= 0 ? pressed : nearest
        setGrip(index)
        motion.hold(index, event)
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event)
        motion.move(event)
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event)
        letGo()
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event)
        letGo()
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event)
        letGo()
      }}
      min={min}
      max={max}
      step={step}
      orientation={orientation}
      inverted={inverted}
      dir={dir}
      className={cn(
        "relative flex w-full touch-none items-center select-none [--slider-bar:var(--slider-height,8px)] [--slider-gap:2px] [--slider-head:var(--slider-bar)] data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
        // The marks' room is the slider's own, above the bar (before it, standing vertical).
        count > 0 &&
          "[--slider-lift:var(--slider-mark-lift,6px)] [--slider-mark:var(--slider-mark-size,6px)] data-horizontal:pt-[calc(var(--slider-lift)+var(--slider-mark))] data-vertical:ps-[calc(var(--slider-lift)+var(--slider-mark))]",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        ref={track}
        data-slot="slider-track"
        className="relative grow data-horizontal:h-(--slider-bar) data-horizontal:w-full data-vertical:h-full data-vertical:w-(--slider-bar)"
      >
        {segments.map(({ style, active }, k) => (
          <span
            key={k}
            data-slot={active ? "slider-range" : "slider-rest"}
            className={cn("absolute select-none", vertical ? "inset-x-0" : "inset-y-0", active ? "bg-primary" : "bg-input")}
            style={style}
          />
        ))}
        {count > 0 ? (
          <span data-slot="slider-marks" aria-hidden className={cn("pointer-events-none absolute", beside)} style={{ [across]: "var(--slider-mark)" }}>
            {marked.map((v, k) => {
              const at = (v - min) / span
              const lit = v >= lowest - 1e-9 && v <= highest + 1e-9
              return (
                <span
                  key={k}
                  data-slot="slider-mark"
                  data-at={at}
                  data-lit={lit ? "" : undefined}
                  className={cn("absolute size-(--slider-mark) rounded-lg", vertical ? "inset-x-0" : "inset-y-0", lit ? "bg-primary" : "bg-input")}
                  style={{ [start]: `calc(${at} * (100% - var(--slider-head)) + var(--slider-head) / 2 - var(--slider-mark) / 2)` }}
                />
              )
            })}
          </span>
        ) : null}
      </SliderPrimitive.Track>
      {Array.from({ length: values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          data-held={grip === index ? "" : undefined}
          key={index}
          // The thumb owns the slider role, so it also needs the control's name.
          aria-label={props["aria-label"]}
          aria-labelledby={props["aria-labelledby"]}
          className="block shrink-0 rounded-lg bg-primary select-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-hidden data-horizontal:h-(--slider-bar) data-horizontal:w-(--slider-head) data-vertical:h-(--slider-head) data-vertical:w-(--slider-bar)"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
