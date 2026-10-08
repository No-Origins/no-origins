"use client"

import * as React from "react"

import { agentColours, colourCss, eyeColours, toneCss } from "@no-origins/ui/lib/agent-colours"
import { checkDrawing, type DrawingData } from "@no-origins/ui/lib/agent-face"
import { sphereBowl, type SphereFrame, type SphereMotion } from "@no-origins/ui/lib/sphere-motion"

/**
 * THE AGENT, drawn (Motion.md M17, Orbit.md C3): one frame of the sphere, the agent's body, as the package's
 * `sphereFrame` gives it. Written by hand, not from a registry: no registry has it, and he approved it into the system
 * (2026-09-30) so the motion studio and Orbit paint one agent rather than each its own copy.
 *
 * **It draws, it does not move.** The model is `@no-origins/ui/lib/sphere-motion`, pure; a caller makes the frame and
 * hands it over, so how the agent moves (a course, a timeline, a blink clock) stays with whoever moves it. Two ways in:
 *
 * - **Still**: pass `frame` and `look`, and it paints them whenever they change (Orbit).
 * - **Every frame**: take the `ref`, an `AgentPainter`, and call `paint(frame, look)` from a ticker, which writes the
 *   paths straight onto the elements with no render (the motion studio's stage, on GSAP's ticker).
 *
 * It is an SVG group, so it goes inside the caller's `<svg>`, drawn over whatever the caller draws first (a nest, the
 * cells it takes the place of). Its coordinates are the frame's, px from the box the course was made on.
 *
 * **What it paints** (the motion studio's painting, moved here whole): flat colour only, no gradient and no glass
 * (2026-09-16). The body — the head and what of the tail is in front of the page — is painted twice: its paint mixed
 * toward black by `shade`, then its lit side in its paint cut to its outline, which leaves one dark band down its side
 * away from the light. The tail is cut to the nest's circle while it sits in one (`frame.opening`), since what is
 * outside it is behind the page. **The face is a layer of its own** inside the body's cut, so it rides the head and is
 * cut where the head squashes or leans past it: the eyes, each a circle cut to what its lids leave open, and the
 * face's parts (Motion.md M20): a pupil or a catchlight in each eye, a heavy upper lid's band over it, and the brows. **Colours by name** (`ColourName`): its `paint`; the `shade` of its dark
 * side; `deep`, its paint most of the way to black; the `ink` its eyes have always been; `light`, the page's white; and
 * the accents. **The eyes are drawn in their Colour** (Orbit.md C16): a solid eye is it; a Dot is a pupil in it on a
 * `light` eye; a Shine is a `light` catchlight on an eye in it. Ink, its default, is what they always were — the
 * paint's ink on a solid eye, `deep` with a pupil or a catchlight (`eyeColours`). **The symbol** a mood plays is drawn
 * over the head, not cut to it.
 *
 * **Uploaded drawings** (M20's "An uploaded style"): a slot whose style is `upload:<id>` wears the drawing `drawings[id]`
 * — the caller loads the ones its look wears and passes them, checked again here (`checkDrawing`) — placed on the slot's
 * anchor as the frame says, a pair's right part its mirror; in the face layer, or over the head for a symbol.
 *
 * **A shape** (Orbit.md C10): where the head is not the sphere, the frame's `shape` gives its
 * faces, each painted in its tone (`toneCss`: its paint, toward black on the side away from the light, toward white on
 * top), over its outline in its dark side's colour and cut to it; the face layer is cut to it the same way. Resting in
 * a nest, it stands on the floor, and the body is cut to the nest's bowl, where its rigid bottom passes the ring the
 * sphere's would follow. **A texture**
 * is a tile of flat shapes repeated over each face, in that face's tone, fixed to the head (`frame.head`) so it rides
 * it: `<pattern>`s, one a face, their colour and tile written each frame. The plain sphere draws none of it.
 *
 * The `data-sphere-*` attributes are the motion studio's specs' (e2e/agents.spec.ts): keep them.
 */

/**
 * What the agent is painted in: its paint; how dark its side away from the light is, 0 flat; its eyes' colour and the
 * pupils it wears, which say where that colour goes; its brows' and its symbol's colours; and its surface's pattern,
 * its size and its colour.
 */
export type AgentLook = Pick<
  SphereMotion,
  | "paint" | "shade" | "eyeColour" | "pupils" | "browColour" | "symbolColour"
  | "texture" | "textureSize" | "textureWobble" | "textureColour" | "textureOpacity" | "depth"
>

/** How many faces a shape paints at most: its facets by tone, or the sphere's bands of depth. */
const FACES = 40
/** How many groups of marks a texture paints at most: one a tone (C15). */
const MARKS = 12

/** Far enough out to cut nothing. */
const FAR = 1e5
const UNCUT = `M ${-FAR} ${-FAR} H ${FAR} V ${FAR} H ${-FAR} Z`

/** The agent's painter, for a caller that paints it every frame. */
export type AgentPainter = { paint: (frame: SphereFrame, look: AgentLook) => void }

type AgentProps = Omit<React.ComponentProps<"g">, "ref"> & {
  ref?: React.Ref<AgentPainter>
  /** A still frame to show, painted whenever it or `look` changes. Leave both out to paint through the `ref`. */
  frame?: SphereFrame | null
  look?: AgentLook | null
  /** The uploaded drawings its look wears, by version id (the `upload:<id>` of a slot's style). */
  drawings?: Record<string, DrawingData> | null
}

/** Where a drawing is put up to be shown: two in the face layer, a pair's parts; one over the head, a symbol's. */
const UPLOAD_PLACES = ["face-0", "face-1", "over-0"] as const

function Agent({ ref, frame, look, drawings, ...props }: AgentProps) {
  const outline = React.useRef<SVGPathElement>(null)
  const dark = React.useRef<SVGPathElement>(null)
  const lit = React.useRef<SVGPathElement>(null)
  const tailOutline = React.useRef<SVGPathElement>(null)
  const tailDark = React.useRef<SVGPathElement>(null)
  const tailLit = React.useRef<SVGPathElement>(null)
  const opening = React.useRef<SVGCircleElement>(null)
  const bowl = React.useRef<SVGPathElement>(null)
  const eyes = React.useRef<(SVGGElement | null)[]>([])
  const balls = React.useRef<(SVGCircleElement | null)[]>([])
  const lids = React.useRef<(SVGPathElement | null)[]>([])
  const pupils = React.useRef<(SVGCircleElement | null)[]>([])
  const shines = React.useRef<(SVGCircleElement | null)[]>([])
  const hoods = React.useRef<(SVGCircleElement | null)[]>([])
  const bands = React.useRef<(SVGPathElement | null)[]>([])
  const edges = React.useRef<(SVGPathElement | null)[]>([])
  const brows = React.useRef<(SVGPathElement | null)[]>([])
  const symbolStroke = React.useRef<SVGPathElement>(null)
  const symbolFill = React.useRef<SVGPathElement>(null)
  const faceLayer = React.useRef<SVGGElement>(null)
  const faces = React.useRef<(SVGPathElement | null)[]>([])
  const marks = React.useRef<(SVGPathElement | null)[]>([])
  // Uploaded drawings: checked once when they arrive, each put up hidden where it could be shown, and shown by `paint`.
  const worn = React.useMemo(
    () =>
      Object.entries(drawings ?? {}).flatMap(([key, raw]) => {
        const data = checkDrawing(raw)
        return data ? [{ key, data }] : []
      }),
    [drawings],
  )
  const wornRef = React.useRef(worn)
  const uploads = React.useRef(new Map<string, SVGGElement>())
  // A clip path is named in a url(), which React's ids (with their «» or colons) would break.
  const id = `agent-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`

  const paint = React.useCallback((f: SphereFrame, m: AgentLook) => {
    outline.current?.setAttribute("d", f.body)
    tailOutline.current?.setAttribute("d", f.tail)
    // In a nest, the tail is cut to the nest's circle, the page's opening; jumping, it is not cut.
    const o = opening.current
    if (o) {
      o.setAttribute("cx", String(f.opening ? f.opening.x : 0))
      o.setAttribute("cy", String(f.opening ? f.opening.y : 0))
      o.setAttribute("r", String(f.opening ? f.opening.r : 1e5))
    }
    // A shape resting in a nest stands on its floor, and what of its rigid bottom passes the bowl is behind the page;
    // the sphere settles inside it on its own, and is never cut.
    bowl.current?.setAttribute("d", f.shape && f.opening ? sphereBowl(f.opening) : UNCUT)
    // Flat colours only: its paint, and the same mixed toward black for its dark side.
    const colour = agentColours(m)
    const body = colour.paint
    const shade = colour.shade
    const fill = (el: SVGPathElement | null, d: string, colour: string) => {
      if (!el) return
      el.setAttribute("d", d)
      el.style.fill = colour
    }
    fill(dark.current, f.body, shade)
    fill(lit.current, f.lit, body)
    fill(tailDark.current, f.tail, shade)
    fill(tailLit.current, f.tailLit, body)
    // A shape's faces, each in its tone; none for the sphere. A hairline of its own colour closes the seams between them.
    const shaped = [...(f.shape?.faces ?? []), ...(f.bands ?? [])]
    for (let i = 0; i < FACES; i++) {
      const el = faces.current[i]
      const face = shaped[i]
      if (!el) continue
      el.setAttribute("d", face?.d ?? "")
      const c = face ? toneCss(body, face.tone, m.shade) : "none"
      el.style.fill = c
      el.style.stroke = c
    }
    // Its texture (C15): marks drawn on its surface, a path a tone, lines stroked round, shapes filled.
    // The marks' colour mixed into the paint by their opacity (C15, his: "part of the body rather than an externally
    // applied texture"): a flat tint of the body, never see-through; then toned as the surface under them is.
    // A light or a dark mark is the paint itself, lighter or darker by the opacity — its hue and its chroma kept, so a
    // violet body's marks stay violet (his: "on violet it is becoming pink"); a named colour is mixed into the paint.
    const named = colour[m.textureColour] ?? colour.light
    const op = m.textureOpacity
    const ink =
      m.textureColour === "light" ? `oklch(from ${body} calc(l + ${(0.45 * op).toFixed(3)}) c h)`
      : m.textureColour === "shade" || m.textureColour === "deep" ? `oklch(from ${body} calc(l - ${((m.textureColour === "deep" ? 0.55 : 0.35) * op).toFixed(3)}) c h)`
      : op >= 0.995 ? named : `color-mix(in oklch, ${body}, ${named} ${Math.round(op * 100)}%)`
    const groups = f.shape ? f.shape.texture : (f.texture ?? [])
    for (let i = 0; i < MARKS; i++) {
      const el = marks.current[i]
      const group = groups[i]
      if (!el) continue
      el.setAttribute("d", group?.d ?? "")
      const c = group ? toneCss(ink, group.tone, m.shade) : "none"
      el.style.fill = group?.stroke ? "none" : c
      el.style.stroke = group?.stroke ? c : "none"
      el.style.strokeWidth = (group?.stroke ?? 0).toFixed(2)
    }
    // Its face, laid where it has turned to (Orbit.md C10); nothing written while it is not turned.
    const layer = faceLayer.current
    if (layer) {
      if (f.faceTransform) layer.setAttribute("transform", f.faceTransform)
      else layer.removeAttribute("transform")
      layer.style.display = f.faceHidden ? "none" : ""
    }
    // Its eyes: circles cut to what their lids leave open — in their colour, or with a pupil in it or a catchlight on
    // it — and over each a heavy upper lid's band, where it wears one.
    const iris = eyeColours(m)[m.eyeColour]
    const eye = m.pupils === "dot" ? colour.light : iris
    f.eyes.forEach((e, i) => {
      eyes.current[i]?.setAttribute("transform", `translate(${e.x.toFixed(2)} ${e.y.toFixed(2)})`)
      const ball = balls.current[i]
      if (ball) {
        ball.setAttribute("r", Math.max(0, e.r).toFixed(2))
        ball.style.fill = eye
      }
      lids.current[i]?.setAttribute("d", e.lids)
      disc(pupils.current[i], e.pupil, iris)
      disc(shines.current[i], e.shine, colour.light)
      hoods.current[i]?.setAttribute("r", (e.lid?.hood ?? 0).toFixed(2))
      const band = bands.current[i]
      if (band) {
        band.setAttribute("d", e.lid?.band ?? "")
        band.style.fill = body
      }
      const edge = edges.current[i]
      if (edge) {
        edge.setAttribute("d", e.lid?.edge ?? "")
        edge.style.stroke = colour.deep
        edge.style.strokeWidth = (e.lid?.width ?? 0).toFixed(2)
      }
    })
    // Its brows: a line stroked round, or an arch or bushy brow filled.
    ;[0, 1].forEach((i) => {
      const el = brows.current[i]
      const b = f.brows?.[i]
      if (!el) return
      el.setAttribute("d", b?.d ?? "")
      const c = colour[m.browColour]
      el.style.fill = b && b.width === null ? c : "none"
      el.style.stroke = b && b.width !== null ? c : "none"
      el.style.strokeWidth = (b?.width ?? 0).toFixed(2)
    })
    // The symbol a mood plays, over the head.
    const sc = colour[m.symbolColour]
    const stroke = symbolStroke.current
    if (stroke) {
      stroke.setAttribute("d", f.symbol?.stroke ?? "")
      stroke.style.stroke = sc
      stroke.style.strokeWidth = (f.symbol?.width ?? 0).toFixed(2)
    }
    const filled = symbolFill.current
    if (filled) {
      filled.setAttribute("d", f.symbol?.fill ?? "")
      filled.style.fill = sc
    }
    // Its uploaded drawings: every one hidden, then each it wears shown on its anchor, in its colours.
    for (const g of uploads.current.values()) g.style.display = "none"
    for (const u of f.uploads) {
      const data = wornRef.current.find((w) => w.key === u.id)?.data
      if (!data) continue
      u.parts.forEach((part, i) => {
        const g = uploads.current.get(`${u.id}:${u.slot === "symbols" ? "over" : "face"}-${i}`)
        if (!g) return
        const k = u.scale / data.unit
        g.setAttribute(
          "transform",
          `translate(${part.x.toFixed(2)} ${part.y.toFixed(2)}) rotate(${part.turn.toFixed(2)}) scale(${(part.mirror ? -k : k).toFixed(4)} ${k.toFixed(4)})`,
        )
        g.style.display = ""
        g.querySelectorAll<SVGPathElement>("path").forEach((el, j) => {
          const shape = data.shapes[j]
          el.style.fill = colourCss(shape?.fill, colour)
          el.style.stroke = colourCss(shape?.stroke, colour)
        })
      })
    }
  }, [])

  // The drawings a paint reads are the ones now put up; a still frame is painted again when they change.
  React.useLayoutEffect(() => {
    wornRef.current = worn
  }, [worn])

  React.useImperativeHandle(ref, () => ({ paint }), [paint])

  // A still frame: painted as soon as it is on the page, and again whenever it or its look changes.
  React.useLayoutEffect(() => {
    if (frame && look) paint(frame, look)
  }, [frame, look, worn, paint])

  const upload = (place: (typeof UPLOAD_PLACES)[number]) =>
    worn.map(({ key, data }) => (
      <g
        key={`${key}:${place}`}
        ref={(el) => {
          if (el) uploads.current.set(`${key}:${place}`, el)
          else uploads.current.delete(`${key}:${place}`)
        }}
        style={{ display: "none" }}
        data-agent-upload={key}
      >
        {data.shapes.map((shape, j) => (
          <path
            key={j}
            d={shape.d}
            fillRule={shape.rule}
            strokeWidth={shape.width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>
    ))

  return (
    <g data-slot="agent" {...props}>
      <defs>
        {/* The head's outline and the tail's, which their lit sides are cut to; and the nest it is in, which the tail is. */}
        <clipPath id={`${id}-body`}>
          <path ref={outline} />
        </clipPath>
        <clipPath id={`${id}-tail`}>
          <path ref={tailOutline} />
        </clipPath>
        <clipPath id={`${id}-opening`}>
          <circle ref={opening} r={1e5} />
        </clipPath>
        <clipPath id={`${id}-bowl`}>
          <path ref={bowl} d={UNCUT} />
        </clipPath>
        {/* Each eye stays a whole circle and is cut to what its lids leave open; a heavy lid, to its hood. */}
        {[0, 1].map((i) => (
          <React.Fragment key={i}>
            <clipPath id={`${id}-lid-${i}`}>
              <path ref={(el) => void (lids.current[i] = el)} />
            </clipPath>
            <clipPath id={`${id}-hood-${i}`}>
              <circle ref={(el) => void (hoods.current[i] = el)} cx={0} cy={0} r={0} />
            </clipPath>
          </React.Fragment>
        ))}
      </defs>
      <g clipPath={`url(#${id}-opening)`} data-sphere-tail>
        <path ref={tailDark} />
        <g clipPath={`url(#${id}-tail)`}>
          <path ref={tailLit} />
        </g>
      </g>
      <g clipPath={`url(#${id}-bowl)`} data-sphere-body>
        <path ref={dark} />
        <g clipPath={`url(#${id}-body)`}>
          <path ref={lit} />
          <g data-agent-shape>
            {Array.from({ length: FACES }, (_, i) => (
              <path key={i} ref={(el) => void (faces.current[i] = el)} strokeWidth={0.8} strokeLinejoin="round" />
            ))}
          </g>
          <g data-agent-texture>
            {Array.from({ length: MARKS }, (_, i) => (
              <path key={i} ref={(el) => void (marks.current[i] = el)} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </g>
          {/* The face rides the head, cut to its outline where it squashes or leans past it. */}
          <g ref={faceLayer} data-agent-face>
            <g data-sphere-eyes>
              {[0, 1].map((i) => (
                <g key={i} ref={(el) => void (eyes.current[i] = el)} data-sphere-eye={i ? "right" : "left"}>
                  <g clipPath={`url(#${id}-lid-${i})`}>
                    <circle ref={(el) => void (balls.current[i] = el)} cx={0} cy={0} data-agent-eyeball />
                    <circle ref={(el) => void (pupils.current[i] = el)} r={0} data-agent-pupil />
                    <circle ref={(el) => void (shines.current[i] = el)} r={0} data-agent-shine />
                  </g>
                  <g clipPath={`url(#${id}-hood-${i})`} data-agent-lid>
                    <path ref={(el) => void (bands.current[i] = el)} />
                    <path ref={(el) => void (edges.current[i] = el)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                </g>
              ))}
            </g>
            <g data-agent-brows>
              {[0, 1].map((i) => (
                <path key={i} ref={(el) => void (brows.current[i] = el)} strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </g>
            <g data-agent-uploads>
              {upload("face-0")}
              {upload("face-1")}
            </g>
          </g>
        </g>
      </g>
      <g data-agent-symbol>
        <path ref={symbolStroke} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path ref={symbolFill} />
        {upload("over-0")}
      </g>
    </g>
  )
}

/** A circle about its eye's centre, or none. */
function disc(el: SVGCircleElement | null | undefined, c: { x: number; y: number; r: number } | null, fill: string) {
  if (!el) return
  el.setAttribute("cx", (c?.x ?? 0).toFixed(2))
  el.setAttribute("cy", (c?.y ?? 0).toFixed(2))
  el.setAttribute("r", Math.max(0, c?.r ?? 0).toFixed(2))
  el.style.fill = fill
}

export { Agent }
