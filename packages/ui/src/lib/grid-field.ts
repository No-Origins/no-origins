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
  /** The pointer's cell (D34): `--lime`. */
  cursor: FieldRgba
  /** The page's own colour, `--background`: what the intro reveals, tile by tile, over the grid's cover colour. */
  ground: FieldRgba
}

export type FieldMessage =
  | { type: "init"; field: unknown; lines: unknown; fade: number; pad: number }
  | { type: "geometry"; geometry: FieldGeometry }
  | { type: "colours"; colours: FieldColours }
  | { type: "overlay"; on: boolean }
  /** One pass on a colour: each cell is lit at `zero + delays[i]` and fades over `fade`. */
  | { type: "pass"; layer: number; delays: Float64Array; span: number; zero: number }
  /**
   * The intro's reveal (D31): while it runs the grid wears the cover's colour (`--grid-intro-from`, globals.css), and at
   * `zero + delays[i]` each cell's tile is painted back in the page's own colour and its dashes drawn — the cover
   * lifting, on the painter's clock, with nothing from the main thread in the way. `delays` omitted: the intro is over
   * and the grid has its own colour again, so what was painted for it need not be any more.
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
   * One cell's dashes, added to the current path in device px: the box's outermost pixel ring in 3px dashes, each side
   * its own run that starts and ends on a dash with the gaps evened out to fit — as the engines draw a 1px `dashed`
   * border, so the field looks as it did when it was drawn by CSS. Every edge snapped to a device pixel.
   */
  const dashes = (ctx: Ctx, x: number, y: number, s: number) => {
    const dpr = g!.dpr
    const px = (v: number) => Math.round(v * dpr)
    const n = Math.max(2, Math.round((s + 3) / 6))
    const step = (s - 3) / (n - 1)
    for (let i = 0; i < n; i++) {
      const a = i * step
      const x0 = px(x + a)
      const x1 = px(x + a + 3)
      const y0 = px(y + a)
      const y1 = px(y + a + 3)
      ctx.rect(x0, px(y), x1 - x0, px(y + 1) - px(y))
      ctx.rect(x0, px(y + s - 1), x1 - x0, px(y + s) - px(y + s - 1))
      ctx.rect(px(x), y0, px(x + 1) - px(x), y1 - y0)
      ctx.rect(px(x + s - 1), y0, px(x + s) - px(x + s - 1), y1 - y0)
    }
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
  /** The reveal's cells on this field, or none: a reveal made for another field (the box changed under it) shows all. */
  const shownCells = () => (reveal && g && reveal.shown.length === g.cols * g.rows ? reveal.shown : null)

  /** Paint these cells: their tiles in the page's colour while the intro is on, and their dashes if the overlay is. */
  const paintCells = (ctx: Ctx, cells: number[]) => {
    if (!g || !colours || !cells.length) return
    const pitch = g.cell + g.gap
    if (reveal) {
      ctx.beginPath()
      for (const i of cells) ctx.rect(...tile(i))
      ctx.fillStyle = rgba(colours.ground)
      ctx.fill()
    }
    if (!overlay) return
    ctx.beginPath()
    for (const i of cells) dashes(ctx, g.fx + (i % g.cols) * pitch, g.fy + Math.floor(i / g.cols) * pitch, g.cell)
    ctx.fillStyle = rgba(colours.dash)
    ctx.fill()
  }

  /**
   * The field's canvas, whole — the box: every cell's dashes at rest, when the field, the colours or the overlay change;
   * while the intro is on, only the cells it has revealed, the rest as their moment comes (`paintReveal`).
   */
  const paintField = () => {
    if (!fieldCv || !g) return
    size(fieldCv, g.boxW, g.boxH)
    const ctx = ctxOf(fieldCv)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, fieldCv.width, fieldCv.height)
    const shown = shownCells()
    const cells: number[] = []
    for (let i = 0; i < g.cols * g.rows; i++) if (!shown || shown[i]) cells.push(i)
    paintCells(ctx, cells)
  }

  /** The intro's reveal, this frame: every cell whose moment has come since the last. True until the last. */
  const paintReveal = (now: number) => {
    if (!reveal || reveal.done) return false
    const t = now - reveal.zero
    const shown = shownCells()
    if (fieldCv && shown) {
      const cells: number[] = []
      for (let i = 0; i < shown.length; i++) {
        if (shown[i] || reveal.delays[i]! > t) continue
        shown[i] = 1
        cells.push(i)
      }
      const ctx = ctxOf(fieldCv)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      paintCells(ctx, cells)
    }
    if (t <= reveal.span) return true
    reveal.done = true
    return false
  }

  /**
   * One lit cell per line colour, painted once and stamped wherever the cell is lit: the glow as the cell's box-shadows
   * had it (globals.css until D38) — outside the box, 1/3 of the blur at 12% and the whole blur at 30%, and the same two
   * inside it — and the dashes in the line's colour on top. A shadow is cast by a shape thrown off the sprite, so only
   * the shadow lands on it; the outer ones are clipped to outside the box and the inset ones to inside its border.
   */
  const makeSprites = () => {
    if (!g || !colours) return
    const key = `${g.cell}:${g.dpr}:${colours.glow}:${colours.lines.join("|")}`
    if (key === spritesFor) return
    spritesFor = key
    const dpr = g.dpr
    const S = Math.round((g.cell + 2 * pad) * dpr)
    const o = Math.round(pad * dpr)
    const s = Math.round(g.cell * dpr)
    const b = Math.round(dpr)
    const OFF = S * 3
    sprites = colours.lines.map((line) => {
      const sprite = scope.canvas(S, S) as HTMLCanvasElement
      const ctx = ctxOf(sprite)
      const shadow = (blur: number, alpha: number, inset: boolean) => {
        ctx.save()
        ctx.beginPath()
        if (inset) ctx.rect(o + b, o + b, s - 2 * b, s - 2 * b)
        else {
          ctx.rect(0, 0, S, S)
          ctx.rect(o, o, s, s)
        }
        ctx.clip(inset ? "nonzero" : "evenodd")
        ctx.shadowColor = rgba(line, alpha)
        ctx.shadowBlur = blur * dpr
        ctx.shadowOffsetX = OFF
        ctx.fillStyle = "#000"
        ctx.beginPath()
        if (inset) {
          ctx.rect(-OFF - S, -S, 3 * S, 3 * S)
          ctx.rect(o + b - OFF, o + b, s - 2 * b, s - 2 * b)
          ctx.fill("evenodd")
        } else {
          ctx.rect(o - OFF, o, s, s)
          ctx.fill()
        }
        ctx.restore()
      }
      // The first shadow in a CSS list is on top, so they go down in reverse: outer, then inset, then the dashes.
      shadow(colours!.glow, 0.3, false)
      shadow(colours!.glow / 3, 0.12, false)
      shadow(colours!.glow, 0.3, true)
      shadow(colours!.glow / 3, 0.12, true)
      ctx.beginPath()
      dashes(ctx, pad, pad, g!.cell)
      ctx.fillStyle = rgba(line)
      ctx.fill()
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
    // While the intro reveals the box, a line and its glow show only on the tiles already revealed, as they did when
    // the cover was over them: nothing lights the cover's colour ahead of the front.
    const shown = reveal && !reveal.done ? shownCells() : null
    ctx.save()
    if (shown) {
      const ox = Math.round((g.fx - pad) * dpr)
      const oy = Math.round((g.fy - pad) * dpr)
      ctx.beginPath()
      for (let i = 0; i < shown.length; i++) {
        if (!shown[i]) continue
        const [x, y, w, h] = tile(i)
        ctx.rect(x - ox, y - oy, w, h)
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
      ctx.setTransform(1, 0, 0, 1, Math.round(pad * dpr), Math.round(pad * dpr))
      ctx.beginPath()
      dashes(ctx, (cell % cols) * pitch, Math.floor(cell / cols) * pitch, g!.cell)
      ctx.fillStyle = rgba(colours!.cursor)
      ctx.fill()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
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
        // Over: nothing is painted again for it — the grid is back in its own colour, the same as the tiles'.
        if (!m.delays || m.span === undefined || m.zero === undefined) {
          if (reveal) reveal.done = true
          reveal = null
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
export function startFieldPainter(canvases: { field: HTMLCanvasElement; lines: HTMLCanvasElement }, init: { fade: number; pad: number }): FieldPainter {
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
