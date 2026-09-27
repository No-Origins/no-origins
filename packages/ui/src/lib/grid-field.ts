/**
 * The field's paint (Grid-v2.md D38, 2026-09-25): the cells' dashes (the overlay), the lines the intro and the ripple
 * light (D31, D32) and the cell under the pointer (D34) — drawn on two canvases by ONE painter, in a worker wherever the
 * browser can hand a canvas to one, else on the main thread. The intro's cover stays in the DOM (grid.tsx): it has to
 * be there before any script runs, and its tiles are cheap.
 *
 * Until D38 each of those was hundreds of elements: a div per cell for the overlay, two per cell for each of the two
 * line colours and one per cell for the cursor — about 1,300 on a desktop — and every cell the intro or a ripple drew
 * was a CSS animation, so a pass was 216 new compositor layers at once, in the page's
 * busiest second, and every pass after the first was handed out cell by cell from a frame loop on the main thread. On
 * a cold load in WebKit that cost 100–250ms of the main thread's frames (measured, `e2e/.mcp/intro-cost.mjs`), and a
 * busy main thread made the handed-out cells miss their turn: the front went missing in the middle and came back at the
 * end (his report, the same day). Painted, the field is two canvases, and a pass is one message: the painter keeps
 * its own clock, and from a worker it keeps it whatever the main thread is doing.
 *
 * `gridFieldPainter` must stay SELF-CONTAINED — no imports, nothing from this module's scope — because the worker runs
 * it from its own source text (`workerSource`). What it needs arrives in messages: the field, the colours, the timing
 * of each pass as the per-cell delays the main thread's plan computed (grid.tsx, `ripplePlan`), so the lines, the
 * cover and the wash (D37) share one plan and one clock — the epoch in ms (`timeOrigin + now`), the same in a worker.
 *
 * A cell is a circle (D40, 2026-09-26): its dashes run round the circle inside its square, and what the front reaches
 * first is that circle — the intro uncovers a disc, then, `lace` ms later, the rest of the cell's tile, so the front
 * leaves a lace of round holes behind it, as the wash does (grid.tsx, `washAway`). A circle cannot tile the box, and
 * the second step is what leaves nothing of the cover behind.
 */

/** How far the lines' canvas runs past the field on every side, in px: room for the glow, 16px on light (D31). */
export const FIELD_PAD = 32

export type FieldGeometry = {
  cols: number
  rows: number
  cell: number
  gap: number
  gridW: number
  gridH: number
  /** The grid's box, and where the field sits in it: the dashes' canvas is the box, the intro reveals all of it. */
  boxW: number
  boxH: number
  fx: number
  fy: number
  dpr: number
}

/** RGBA, 0–255 for the channels and 0–1 for alpha. */
export type FieldRgba = [number, number, number, number]

export type FieldColours = {
  /** The cells' dashes at rest: the overlay's `border-border/70`. */
  dash: FieldRgba
  /** The lit lines, one per pass colour, turn about: `--lime`, `--violet`. */
  lines: FieldRgba[]
  /** The glow's blur, in px: `--grid-intro-glow`. */
  glow: number
  /** The pointer's cell (D34, D43): `--violet`. */
  cursor: FieldRgba
  /** The page's own colour, `--background`: what the intro reveals, tile by tile, over the grid's cover colour. */
  ground: FieldRgba
}

export type FieldMessage =
  /** `lace`: how long a cell's round cut stands before the rest of its tile goes (D40). */
  | { type: "init"; field: unknown; lines: unknown; fade: number; pad: number; lace: number }
  | { type: "geometry"; geometry: FieldGeometry }
  | { type: "colours"; colours: FieldColours }
  | { type: "overlay"; on: boolean }
  /** One pass on a colour: each cell is lit at `zero + delays[i]` and fades over `fade`. */
  | { type: "pass"; layer: number; delays: Float64Array; span: number; zero: number }
  /**
   * The intro's reveal (D31): while it runs the grid wears the cover's colour (`--grid-intro-from`, globals.css), and at
   * `zero + delays[i]` each cell's disc is painted back in the page's own colour and its dashes drawn, and `lace` ms
   * later the rest of its tile (D40) — the cover lifting, on the painter's clock, with nothing from the main thread in
   * the way. `delays` omitted: the intro is over and the grid has its own colour again, so what was painted for it need
   * not be any more.
   */
  | { type: "reveal"; delays?: Float64Array; span?: number; zero?: number }
  /** The pointer's cell, −1 for none; the one it leaves fades over `fade` ms from `at`. */
  | { type: "cursor"; cell: number; at: number; fade: number }
  | { type: "stop" }

type PainterScope = {
  listen: (handler: (message: FieldMessage) => void) => void
  frame: (callback: () => void) => void
  canvas: (width: number, height: number) => unknown
  now: () => number
}

type Ctx = CanvasRenderingContext2D

/**
 * The painter. Runs on whatever `scope` gives it: a worker's `self`, or a shim on the main thread. Keep it
 * self-contained (see above).
 */
export function gridFieldPainter(scope: PainterScope) {
  // A CSS cubic-bezier timing function: the progress at t, found by bisection on x.
  const bezier = (x1: number, y1: number, x2: number, y2: number) => {
    const at = (a: number, b: number, s: number) => 3 * a * s * (1 - s) * (1 - s) + 3 * b * s * s * (1 - s) + s * s * s
    return (t: number) => {
      if (t <= 0) return 0
      if (t >= 1) return 1
      let lo = 0
      let hi = 1
      let s = t
      for (let i = 0; i < 20; i++) {
        const x = at(x1, x2, s)
        if (Math.abs(x - t) < 1e-4) break
        if (x < t) lo = s
        else hi = s
        s = (lo + hi) / 2
      }
      return at(y1, y2, s)
    }
  }
  // The lines' fade, as their keyframes had it (globals.css until D38), and the cursor's `ease-out`.
  const lineEase = bezier(0.37, 0, 0.63, 1)
  const cursorEase = bezier(0, 0, 0.58, 1)

  let fade = 500
  let pad = 32
  let lace = 0
  let g: FieldGeometry | null = null
  let colours: FieldColours | null = null
  let overlay = false
  let fieldCv: HTMLCanvasElement | null = null
  let linesCv: HTMLCanvasElement | null = null
  let sprites: HTMLCanvasElement[] = []
  let spritesFor = ""
  const passes: { delays: Float64Array; span: number; zero: number }[][] = [[], []]
  let cursor = -1
  let cursorFade = 500
  let fading: { cell: number; at: number }[] = []
  /** `shown`, a cell at a time: 0 still under the cover, 1 its disc uncovered, 2 its whole tile. */
  let reveal: { delays: Float64Array; span: number; zero: number; shown: Uint8Array; done: boolean } | null = null
  let scheduled = false
  let stopped = false

  const rgba = (c: FieldRgba, alpha = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3] * alpha})`
  const ctxOf = (cv: HTMLCanvasElement) => cv.getContext("2d") as Ctx
  const size = (cv: HTMLCanvasElement, w: number, h: number) => {
    const W = Math.max(1, Math.round(w * g!.dpr))
    const H = Math.max(1, Math.round(h * g!.dpr))
    if (cv.width !== W) cv.width = W
    if (cv.height !== H) cv.height = H
  }

  /**
   * One cell's ring, added to the current path in device px (D40): the circle through the middle of the cell's
   * outermost pixel ring, where a 1px border would have run, starting half a dash before the top so a dash is centred
   * there. Stroked with `strokeRings`. Until D40 it was the square's own 3px dashes, as the engines draw a `dashed`
   * border, each edge snapped to a device pixel; a circle has no pixel to snap to and is drawn antialiased.
   */
  const ring = (ctx: Ctx, x: number, y: number, s: number) => {
    const dpr = g!.dpr
    const r = (s / 2 - 0.5) * dpr
    const cx = (x + s / 2) * dpr
    const cy = (y + s / 2) * dpr
    const start = -Math.PI / 2 - (1.5 * dpr) / r
    ctx.moveTo(cx + r * Math.cos(start), cy + r * Math.sin(start))
    ctx.arc(cx, cy, r, start, start + 2 * Math.PI)
  }
  /**
   * Stroke the rings on the current path, 1px, in 3px dashes — as many round the circle as a 6px pitch gives, the gaps
   * evened out so the last closes on the first, the square's rule for each of its sides. Every cell is one size, so one
   * pattern serves the lot, and a pattern starts again with each ring.
   */
  const strokeRings = (ctx: Ctx, colour: FieldRgba) => {
    const dpr = g!.dpr
    const c = 2 * Math.PI * (g!.cell / 2 - 0.5) * dpr
    const n = Math.max(4, Math.round(c / (6 * dpr)))
    ctx.save()
    ctx.lineWidth = dpr
    ctx.setLineDash([3 * dpr, c / n - 3 * dpr])
    ctx.strokeStyle = rgba(colour)
    ctx.stroke()
    ctx.restore()
  }

  /**
   * A cell's tile in the box, in device px: the cell and half the gutter round it, the outer ones running to the box's
   * edge, snapped so neighbours share an edge and no seam shows. The intro reveals the box a tile at a time.
   */
  const tile = (i: number) => {
    const { cols, rows, cell, gap, boxW, boxH, fx, fy, dpr } = g!
    const pitch = cell + gap
    const px = (v: number) => Math.round(v * dpr)
    const edge = (k: number, n: number, origin: number, end: number) => (k <= 0 ? 0 : k >= n ? end : origin + k * pitch - gap / 2)
    const c = i % cols
    const r = Math.floor(i / cols)
    const x0 = px(edge(c, cols, fx, boxW))
    const y0 = px(edge(r, rows, fy, boxH))
    return [x0, y0, px(edge(c + 1, cols, fx, boxW)) - x0, px(edge(r + 1, rows, fy, boxH)) - y0] as const
  }
  /**
   * A cell's disc in the box, in device px — centre and radius: the circle the front uncovers first (D40), half a pitch
   * across so neighbouring discs touch in the middle of the gutter, and inside the cell's tile.
   */
  const disc = (i: number) => {
    const { cols, cell, gap, fx, fy, dpr } = g!
    const pitch = cell + gap
    return [(fx + (i % cols) * pitch + cell / 2) * dpr, (fy + Math.floor(i / cols) * pitch + cell / 2) * dpr, (pitch / 2) * dpr] as const
  }
  const addDisc = (ctx: Ctx, cx: number, cy: number, r: number) => {
    ctx.moveTo(cx + r, cy)
    ctx.arc(cx, cy, r, 0, 2 * Math.PI)
  }
  /** The reveal's cells on this field, or none: a reveal made for another field (the box changed under it) shows all. */
  const shownCells = () => (reveal && g && reveal.shown.length === g.cols * g.rows ? reveal.shown : null)

  /**
   * Paint these cells: while the intro is on, the discs of `discs` and the tiles of `tiles` in the page's colour; then
   * all their rings, if the overlay is on. A tile covers its own ring, so a ring is drawn again after its tile, and
   * neither a disc nor a tile reaches another cell's ring.
   */
  const paintCells = (ctx: Ctx, discs: number[], tiles: number[] = []) => {
    if (!g || !colours || (!discs.length && !tiles.length)) return
    const pitch = g.cell + g.gap
    if (reveal) {
      ctx.beginPath()
      for (const i of discs) addDisc(ctx, ...disc(i))
      for (const i of tiles) ctx.rect(...tile(i))
      ctx.fillStyle = rgba(colours.ground)
      ctx.fill()
    }
    if (!overlay) return
    ctx.beginPath()
    for (const i of [...discs, ...tiles]) ring(ctx, g.fx + (i % g.cols) * pitch, g.fy + Math.floor(i / g.cols) * pitch, g.cell)
    strokeRings(ctx, colours.dash)
  }

  /**
   * The field's canvas, whole — the box: every cell's ring at rest, when the field, the colours or the overlay change;
   * while the intro is on, only what it has revealed, the rest as its moment comes (`paintReveal`).
   */
  const paintField = () => {
    if (!fieldCv || !g) return
    size(fieldCv, g.boxW, g.boxH)
    const ctx = ctxOf(fieldCv)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, fieldCv.width, fieldCv.height)
    const shown = shownCells()
    const discs: number[] = []
    const tiles: number[] = []
    for (let i = 0; i < g.cols * g.rows; i++) {
      if (!shown) discs.push(i)
      else if (shown[i] === 2) tiles.push(i)
      else if (shown[i] === 1) discs.push(i)
    }
    paintCells(ctx, discs, tiles)
  }

  /** The intro's reveal, this frame: every disc and every tile whose moment has come since the last. True until the last. */
  const paintReveal = (now: number) => {
    if (!reveal || reveal.done) return false
    const t = now - reveal.zero
    const shown = shownCells()
    if (fieldCv && shown) {
      const discs: number[] = []
      const tiles: number[] = []
      for (let i = 0; i < shown.length; i++) {
        const at = reveal.delays[i]!
        if (shown[i]! < 2 && at + lace <= t) {
          shown[i] = 2
          tiles.push(i)
        } else if (shown[i] === 0 && at <= t) {
          shown[i] = 1
          discs.push(i)
        }
      }
      const ctx = ctxOf(fieldCv)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      paintCells(ctx, discs, tiles)
    }
    if (t <= reveal.span + lace) return true
    reveal.done = true
    return false
  }

  /**
   * One lit cell per line colour, painted once and stamped wherever the cell is lit: the glow as the cell's box-shadows
   * had it (globals.css until D38) — outside the cell, 1/3 of the blur at 12% and the whole blur at 30%, and the same two
   * inside it — and the ring in the line's colour on top. Since D40 the cell the glow is cast by is its circle, so it
   * glows round, as a ring does. A shadow is cast by a shape thrown off the sprite, so only the shadow lands on it; the
   * outer ones are clipped to outside the circle and the inset ones to inside its line.
   */
  const makeSprites = () => {
    if (!g || !colours) return
    const key = `${g.cell}:${g.dpr}:${colours.glow}:${colours.lines.join("|")}`
    if (key === spritesFor) return
    spritesFor = key
    const dpr = g.dpr
    const S = Math.round((g.cell + 2 * pad) * dpr)
    const r = (g.cell / 2) * dpr
    const c = pad * dpr + r
    const b = dpr
    const OFF = S * 3
    sprites = colours.lines.map((line) => {
      const sprite = scope.canvas(S, S) as HTMLCanvasElement
      const ctx = ctxOf(sprite)
      const shadow = (blur: number, alpha: number, inset: boolean) => {
        ctx.save()
        ctx.beginPath()
        if (inset) addDisc(ctx, c, c, r - b)
        else {
          ctx.rect(0, 0, S, S)
          addDisc(ctx, c, c, r)
        }
        ctx.clip(inset ? "nonzero" : "evenodd")
        ctx.shadowColor = rgba(line, alpha)
        ctx.shadowBlur = blur * dpr
        ctx.shadowOffsetX = OFF
        ctx.fillStyle = "#000"
        ctx.beginPath()
        if (inset) {
          ctx.rect(-OFF - S, -S, 3 * S, 3 * S)
          addDisc(ctx, c - OFF, c, r - b)
          ctx.fill("evenodd")
        } else {
          addDisc(ctx, c - OFF, c, r)
          ctx.fill()
        }
        ctx.restore()
      }
      // The first shadow in a CSS list is on top, so they go down in reverse: outer, then inset, then the ring.
      shadow(colours!.glow, 0.3, false)
      shadow(colours!.glow / 3, 0.12, false)
      shadow(colours!.glow, 0.3, true)
      shadow(colours!.glow / 3, 0.12, true)
      ctx.beginPath()
      ring(ctx, pad, pad, g!.cell)
      strokeRings(ctx, line)
      return sprite
    })
  }

  /** The lines and the pointer's cell, this frame. True while anything on them is still moving. */
  const paintLines = (now: number) => {
    if (!linesCv || !g || !colours) return false
    size(linesCv, g.gridW + 2 * pad, g.gridH + 2 * pad)
    makeSprites()
    const ctx = ctxOf(linesCv)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, linesCv.width, linesCv.height)
    const { cols, rows, dpr } = g
    const pitch = g.cell + g.gap
    let busy = false
    // While the intro reveals the box, a line and its glow show only on the discs and tiles already revealed, as they
    // did when the cover was over them: nothing lights the cover's colour ahead of the front.
    const shown = reveal && !reveal.done ? shownCells() : null
    ctx.save()
    if (shown) {
      const ox = Math.round((g.fx - pad) * dpr)
      const oy = Math.round((g.fy - pad) * dpr)
      ctx.beginPath()
      for (let i = 0; i < shown.length; i++) {
        if (shown[i] === 2) {
          const [x, y, w, h] = tile(i)
          ctx.rect(x - ox, y - oy, w, h)
        } else if (shown[i] === 1) {
          const [cx, cy, r] = disc(i)
          addDisc(ctx, cx - ox, cy - oy, r)
        }
      }
      ctx.clip()
    }
    // Each colour as its own layer, lime under violet; a cell shows the newest pass on its colour that has reached it.
    for (let k = 0; k < passes.length; k++) {
      const list = passes[k]!
      for (let p = list.length - 1; p >= 0; p--) if (now > list[p]!.zero + list[p]!.span + fade) list.splice(p, 1)
      if (!list.length) continue
      busy = true
      const sprite = sprites[k]
      if (!sprite) continue
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          let age = -1
          for (let p = list.length - 1; p >= 0; p--) {
            const a = now - list[p]!.zero - list[p]!.delays[i]!
            if (a >= 0) {
              age = a
              break
            }
          }
          if (age < 0 || age >= fade) continue
          const alpha = 1 - lineEase(age / fade)
          if (alpha <= 0.002) continue
          ctx.globalAlpha = alpha
          ctx.drawImage(sprite, Math.round(c * pitch * dpr), Math.round(r * pitch * dpr))
        }
      }
    }
    ctx.restore()
    // The pointer's cell over the lines, lit at once, and the ones it left fading back.
    const at = (cell: number, alpha: number) => {
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ring(ctx, pad + (cell % cols) * pitch, pad + Math.floor(cell / cols) * pitch, g!.cell)
      strokeRings(ctx, colours!.cursor)
    }
    fading = fading.filter((f) => now - f.at < cursorFade)
    for (const f of fading) {
      busy = true
      at(f.cell, 1 - cursorEase((now - f.at) / cursorFade))
    }
    if (cursor >= 0 && cursor < cols * rows) at(cursor, 1)
    ctx.globalAlpha = 1
    return busy
  }

  const tick = () => {
    scheduled = false
    if (stopped) return
    const now = scope.now()
    const revealing = paintReveal(now)
    if (paintLines(now) || revealing) request()
  }
  const request = () => {
    if (scheduled || stopped) return
    scheduled = true
    scope.frame(tick)
  }

  scope.listen((m) => {
    switch (m.type) {
      case "init":
        fieldCv = m.field as HTMLCanvasElement
        linesCv = m.lines as HTMLCanvasElement
        fade = m.fade
        pad = m.pad
        lace = m.lace
        break
      case "geometry":
        g = m.geometry
        paintField()
        break
      case "colours":
        colours = m.colours
        paintField()
        break
      case "overlay":
        overlay = m.on
        paintField()
        break
      case "pass":
        passes[m.layer]?.push({ delays: m.delays, span: m.span, zero: m.zero })
        break
      case "reveal":
        // Over: the field is painted again without its tiles, the rings on a clear canvas. The tiles are the page's own
        // colour, so the grid looks the same, but they are opaque: left on, they hid whatever an app draws behind the
        // grid (the portfolio's tagline, 2026-09-27).
        if (!m.delays || m.span === undefined || m.zero === undefined) {
          if (reveal) reveal.done = true
          reveal = null
          paintField()
          break
        }
        reveal = { delays: m.delays, span: m.span, zero: m.zero, shown: new Uint8Array(m.delays.length), done: false }
        paintField()
        break
      case "cursor":
        if (cursor >= 0 && cursor !== m.cell && m.fade > 0) fading.push({ cell: cursor, at: m.at })
        fading = fading.filter((f) => f.cell !== m.cell)
        cursor = m.cell
        cursorFade = m.fade || 1
        break
      case "stop":
        stopped = true
        return
    }
    request()
  })
}

/** The worker's source: the painter, run on the worker's own scope. */
function workerSource() {
  return `"use strict";
(${gridFieldPainter.toString()})({
  listen: function (h) { self.onmessage = function (e) { h(e.data); }; },
  frame: typeof self.requestAnimationFrame === "function" ? function (cb) { self.requestAnimationFrame(cb); } : function (cb) { setTimeout(cb, 16); },
  canvas: function (w, h) { return new OffscreenCanvas(w, h); },
  now: function () { return performance.timeOrigin + performance.now(); },
});`
}

export type FieldPainter = {
  post: (message: FieldMessage) => void
  stop: () => void
  /** Where it paints: off the main thread, or on it. */
  where: "worker" | "main"
}

/**
 * Start a painter on two fresh canvases. In a worker when the browser can hand it the canvases — Chrome, Firefox,
 * Safari 16.4+ — so its frames are its own; else, or if the worker cannot start, on the main thread with the same code.
 */
export function startFieldPainter(
  canvases: { field: HTMLCanvasElement; lines: HTMLCanvasElement },
  init: { fade: number; pad: number; lace: number },
): FieldPainter {
  const canHand =
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function"
  if (canHand) {
    let url = ""
    try {
      url = URL.createObjectURL(new Blob([workerSource()], { type: "text/javascript" }))
      // The worker first, the canvases after: a canvas handed to a worker cannot be drawn on here any more.
      const worker = new Worker(url)
      const off = [canvases.field, canvases.lines].map((cv) => cv.transferControlToOffscreen())
      worker.postMessage({ type: "init", field: off[0], lines: off[1], ...init } satisfies FieldMessage, off)
      return {
        post: (message) => worker.postMessage(message),
        stop: () => {
          worker.terminate()
          URL.revokeObjectURL(url)
        },
        where: "worker",
      }
    } catch {
      if (url) URL.revokeObjectURL(url)
    }
  }
  let handler: ((message: FieldMessage) => void) | null = null
  gridFieldPainter({
    listen: (h) => {
      handler = h
    },
    frame: (cb) => window.requestAnimationFrame(() => cb()),
    canvas: (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h }),
    now: () => performance.timeOrigin + performance.now(),
  })
  handler!({ type: "init", field: canvases.field, lines: canvases.lines, ...init })
  return {
    post: (message) => handler?.(message),
    stop: () => {
      handler?.({ type: "stop" })
      handler = null
    },
    where: "main",
  }
}
