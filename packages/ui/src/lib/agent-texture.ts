/**
 * THE AGENT'S TEXTURES (Orbit.md C15; version 5), pure: what its surface is drawn with, **drawn on the
 * surface** (his, 2026-09-30, of version 4: *"the texture is being applied as a plain flat image and it doesn't adapt to
 * the face of the shape … Bali is a sphere and the lines are straight instead of bending based on the surface"*).
 *
 * A texture is **marks on a patch of surface**: each solid says what patches it has (a face of the cube, the side of
 * the cylinder as one sheet, the sphere as one sheet of longitude and latitude), each a rectangle `w × h` in the
 * solid's units with a map from a place on it to a point in 3D. The marks are drawn on that rectangle by hand — every
 * one placed, sized and bent by a seeded jitter (`noise`, the same every frame), by how hand-drawn he wants it
 * (`wobble`) — then each point is carried onto the surface, turned, dropped where it faces away, and projected as the
 * body is. So a cube's grid runs along its edges and breaks at them, as paint on a box does; the sphere's stripes are
 * its meridians and its contours its latitudes, bending toward the rim; a cylinder's stripes follow its side round.
 *
 * **His family** (his: *"I loved stripes and contours. I want to see more variations like that"*): line textures that
 * read as the form — stripes, zebra, meridians, latitudes, contours, spiral, strata, waves, chevron, hatch, grid — and
 * with them what surfaces are made of: bricks, weave, scales, honeycomb, crackle, woodgrain, marble, dots, splatter,
 * smears (textiles, stone, glaze, coats, print). Rays, scribble, dashes and pebbles went (his). Two tones, flat, no
 * gradient (2026-09-16): lines stroked with round ends, shapes filled, each in the tone of the surface it is on.
 */

export const AGENT_TEXTURES = [
  "none",
  "stripes", "zebra", "meridians", "latitudes", "contours", "spiral", "strata", "waves", "chevron", "hatch", "grid",
  "bricks", "weave", "scales", "honeycomb", "crackle", "woodgrain", "marble", "dots", "splatter", "smears",
] as const
export type AgentTexture = (typeof AGENT_TEXTURES)[number]
export const isAgentTexture = (t: unknown): t is AgentTexture => (AGENT_TEXTURES as readonly unknown[]).includes(t)

/** The look of a surface: its texture, a cell of its marks across (of the head), and how hand-drawn it is, 0 ruled to 1 loose. */
export type TextureLook = { texture: AgentTexture; size: number; wobble: number }

export type UV = { u: number; v: number }
/**
 * A mark on a patch: a line to stroke, a shape to fill, or a dot (`pts[0]`, radius `r`), in the patch's units. A line is
 * drawn as a smooth curve through its points unless it is `sharp` — a hexagon keeps its corners.
 */
export type Mark = { kind: "line" | "poly" | "dot"; pts: UV[]; r?: number; sharp?: boolean }

/**
 * A patch of a surface: `w × h` in the solid's units (a head's radius 1), `u` wrapping round where the surface does (a
 * side, the sphere), a place on it as a point in 3D, and whether a place is on the surface at all (a triangle's face, a
 * round end).
 */
export type Patch = {
  w: number
  h: number
  wrap: boolean
  at: (uv: UV) => { x: number; y: number; z: number }
  /** Its outward way at a place; the place itself where the surface is the unit sphere. */
  normal?: (uv: UV) => { x: number; y: number; z: number }
  inside?: (uv: UV) => boolean
}

/** Marks drawn, grouped by tone: one SVG path each, stroked `stroke` wide with round ends where it is lines, else filled. */
export type TextureGroup = { d: string; tone: number; stroke?: number }

const f2 = (n: number) => (Math.round(n * 100) / 100).toString()
type P = { x: number; y: number }

/** A number in 0..1 from a cell and a part of it, the same every time: the hand's seed. */
function noise(i: number, j: number, k: number): number {
  let h = (i * 374761393 + j * 668265263 + k * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}
const swing = (i: number, j: number, k: number) => noise(i, j, k) * 2 - 1

/**
 * The marks of `look`'s texture on a patch `w × h`, in its units: drawn by hand on the flat, to be carried onto the
 * surface. `seed` tells one patch's hand from another's, so two faces of a cube are not the same drawing.
 */
export function marksOn(look: TextureLook, w: number, h: number, seed: number): Mark[] {
  const c = Math.max(0.02, look.size * 2)
  const wb = look.wobble
  const marks: Mark[] = []
  const cols = Math.ceil(w / c)
  const rows = Math.ceil(h / c)
  const n = (i: number, j: number, k: number) => noise(i + seed * 7919, j, k)
  const s = (i: number, j: number, k: number) => swing(i + seed * 7919, j, k)
  // A hand-drawn line from `a` to `b`: bent off the straight by the wobble in one or two long, smooth bows — a hand
  // wavers slowly, it does not shake — and drawn in enough pieces to curve (his, 2026-09-30: "more smooth").
  const drawn = (a: UV, b: UV, sd: number, pieces = 20, bend = 0.1): UV[] => {
    const [b1, b2, ph] = [s(sd, 1, 7), s(sd, 2, 7) * 0.5, n(sd, 3, 7) * Math.PI]
    return Array.from({ length: pieces + 1 }, (_, k) => {
      const t = k / pieces
      const off = wb * bend * c * (Math.sin(Math.PI * t) * b1 + Math.sin(2 * Math.PI * t + ph) * b2)
      const du = b.u - a.u
      const dv = b.v - a.v
      const l = Math.hypot(du, dv) || 1
      return { u: a.u + du * t - (dv / l) * off, v: a.v + dv * t + (du / l) * off }
    })
  }
  // A ring round `cu, cv`, `r` out, bent its own way; stretched `ku` across.
  const ring = (cu: number, cv: number, r: number, sd: number, ku = 1, pts = 40): UV[] =>
    Array.from({ length: pts }, (_, k) => {
      const a = (2 * Math.PI * k) / pts
      const rr = r * (1 + wb * 0.15 * (Math.sin(2 * a + sd) * s(sd, 1, 3) + Math.sin(3 * a - sd) * s(sd, 2, 4)))
      return { u: cu + rr * ku * Math.cos(a), v: cv + rr * Math.sin(a) }
    })
  // A band along `v` (or along `u`) about `at`, its edges wandering, filled — in short pieces, so a band that goes round
  // the body keeps the part of it that faces you where the rest does not.
  const band = (at: number, half: number, along: "u" | "v", sd: number, taper = false): Mark[] => {
    const len = along === "v" ? h : w
    const k = Math.max(4, Math.ceil(len / (c * 0.5)))
    const edge = (i: number) => {
      const t = i / k
      const p = t * len
      const end = taper ? Math.sin(Math.PI * t) ** 0.5 : 1
      const hh = half * end * (1 + wb * 0.22 * s(sd, i, 1))
      const drift = wb * 0.1 * c * s(sd, i, 2)
      return along === "v"
        ? [{ u: at - hh + drift, v: p }, { u: at + hh + drift, v: p }]
        : [{ u: p, v: at - hh + drift }, { u: p, v: at + hh + drift }]
    }
    const out: Mark[] = []
    for (let i = 0; i < k; i++) {
      const [a1, a2] = edge(i)
      const [b1, b2] = edge(i + 1)
      out.push({ kind: "poly", pts: [a1!, b1!, b2!, a2!] })
    }
    return out
  }
  const each = (draw: (i: number, j: number, u0: number, v0: number) => void) => {
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) draw(i, j, i * c, j * c)
  }
  switch (look.texture) {
    case "none":
      break
    case "stripes":
      // Brushy bands along the patch's up: the sphere's meridians, a side's verticals.
      for (let i = 0; i < cols; i++) if (i % 2 === 0) marks.push(...band(i * c + c / 2, c * 0.45, "v", 100 + i))
      break
    case "zebra":
      // Thick uneven bands, tapered, some broken in two.
      for (let i = 0; i < cols; i++) {
        if (i % 2) continue
        const at = i * c + c / 2 + wb * 0.2 * c * s(i, 0, 5)
        if (n(i, 0, 6) < 0.3) {
          // Broken in two: each half its own tapered band.
          const split = 0.35 + 0.3 * n(i, 0, 8)
          for (const part of band(at, c * 0.4, "v", 200 + i, true)) {
            marks.push({ kind: "poly", pts: part.pts.map((p) => ({ u: p.u, v: p.v * split })) })
            marks.push({ kind: "poly", pts: part.pts.map((p) => ({ u: p.u, v: split * h + p.v * (1 - split) })) })
          }
        } else marks.push(...band(at, c * (0.3 + 0.25 * n(i, 0, 7)), "v", 200 + i, true))
      }
      break
    case "meridians":
      // Ruled, as a globe's are (his, 2026-09-30: "the lines are still crooked"): the wobble does not bend them.
      for (let i = 0; i < cols; i++) marks.push({ kind: "line", pts: drawn({ u: i * c, v: 0 }, { u: i * c, v: h }, 300 + i, 24, 0) })
      break
    case "latitudes":
      for (let j = 0; j <= rows; j++) marks.push({ kind: "line", pts: drawn({ u: 0, v: j * c }, { u: w, v: j * c }, 400 + j, 24, 0) })
      break
    case "contours": {
      // Rings round a point near the middle, each a little further out: on the sphere, round its front toward the rim.
      const cu = w / 2 + wb * 0.6 * c * s(1, 1, 1)
      const cv = h / 2 + wb * 0.6 * c * s(2, 2, 2)
      // As far out as the patch's narrower way allows, a little over: on the sphere, round to its back but not round again.
      const reach = Math.min(w, h) * 0.65
      for (let k = 1; k * c * 0.7 < reach; k++) marks.push({ kind: "line", pts: [...ring(cu, cv, k * c * 0.7, 500 + k), ring(cu, cv, k * c * 0.7, 500 + k)[0]!] })
      break
    }
    case "spiral": {
      // Round the middle and out, one line: on the sphere, wound about its front.
      const cu = w / 2
      const cv = h / 2
      const reach = Math.min(w, h) * 0.65
      const turns = reach / (c * 0.75)
      const pts: UV[] = []
      const k = Math.ceil(turns * 40)
      for (let i = 0; i <= k; i++) {
        const t = i / k
        const a = t * turns * 2 * Math.PI
        const r = t * reach * (1 + wb * 0.08 * s(600, i, 1))
        pts.push({ u: cu + r * Math.cos(a), v: cv + r * Math.sin(a) })
      }
      marks.push({ kind: "line", pts })
      break
    }
    case "strata":
      // Layers along the patch's across, thick and thin, wandering: sandstone.
      for (let j = 0; j < rows; j++) if (j % 2 === 0) marks.push(...band(j * c + c / 2, c * (0.15 + 0.3 * n(j, 0, 9)), "u", 700 + j))
      break
    case "waves":
      for (let j = 0; j <= rows; j++) {
        const pts: UV[] = []
        const phase = wb * Math.PI * s(j, 1, 1)
        for (let k = 0; k <= cols * 6; k++) {
          const u = (k / (cols * 6)) * w
          pts.push({ u, v: j * c + c * 0.25 * Math.sin((u / c) * Math.PI + phase) * (1 + wb * 0.3 * s(j, k, 2)) })
        }
        marks.push({ kind: "line", pts })
      }
      break
    case "chevron":
      for (let j = 0; j <= rows; j++) {
        const pts: UV[] = []
        for (let k = 0; k <= cols * 2; k++) pts.push({ u: (k / 2) * c, v: j * c + (k % 2 ? c * 0.35 : -c * 0.35) + wb * 0.1 * c * s(j, k, 3) })
        marks.push({ kind: "line", pts })
      }
      break
    case "hatch":
      for (let k = -rows; k < cols + rows; k++) {
        marks.push({ kind: "line", pts: drawn({ u: k * c, v: 0 }, { u: k * c + h, v: h }, 800 + k, 8, 0.1) })
        marks.push({ kind: "line", pts: drawn({ u: k * c + h, v: 0 }, { u: k * c, v: h }, 900 + k, 8, 0.1) })
      }
      break
    case "grid":
      for (let i = 0; i <= cols; i++) marks.push({ kind: "line", pts: drawn({ u: i * c, v: 0 }, { u: i * c, v: h }, 1000 + i, 10, 0.12) })
      for (let j = 0; j <= rows; j++) marks.push({ kind: "line", pts: drawn({ u: 0, v: j * c }, { u: w, v: j * c }, 1100 + j, 10, 0.12) })
      break
    case "bricks": {
      const bh = c * 0.5
      for (let j = 0; j < rows * 2; j++) {
        const v0 = j * bh
        const shift = j % 2 ? c / 2 : 0
        for (let i = -1; i < cols; i++) {
          const u0 = i * c + shift
          const gap = c * 0.1
          const q = (u: number, v: number, sd: number): UV => ({ u: u + wb * 0.06 * c * s(i, j, sd), v: v + wb * 0.06 * c * s(i, j, sd + 1) })
          marks.push({ kind: "poly", pts: [q(u0 + gap, v0 + gap, 1), q(u0 + c - gap, v0 + gap, 3), q(u0 + c - gap, v0 + bh - gap, 5), q(u0 + gap, v0 + bh - gap, 7)] })
        }
      }
      break
    }
    case "weave":
      // A basket: short thick strands, across and up by turns.
      each((i, j, u0, v0) => {
        const across = (i + j) % 2 === 0
        const gap = c * 0.12
        const q = (u: number, v: number, sd: number): UV => ({ u: u + wb * 0.05 * c * s(i, j, sd), v: v + wb * 0.05 * c * s(i, j, sd + 1) })
        marks.push(across
          ? { kind: "poly", pts: [q(u0, v0 + gap, 1), q(u0 + c, v0 + gap, 3), q(u0 + c, v0 + c - gap, 5), q(u0, v0 + c - gap, 7)] }
          : { kind: "poly", pts: [q(u0 + gap, v0, 1), q(u0 + c - gap, v0, 3), q(u0 + c - gap, v0 + c, 5), q(u0 + gap, v0 + c, 7)] })
      })
      break
    case "scales":
      // Each scale one smooth arc, its own size and a little off its place: the hand's, not a shake.
      for (let j = 0; j <= rows * 2; j++) {
        const v0 = (j * c) / 2
        const shift = j % 2 ? c / 2 : 0
        for (let i = -1; i <= cols; i++) {
          const cu = i * c + shift + c / 2 + wb * 0.05 * c * s(i, j, 1)
          const r = (c / 2) * (1 + wb * 0.08 * s(i, j, 2))
          const squash = 0.8 * (1 + wb * 0.1 * s(i, j, 3))
          const pts: UV[] = []
          for (let k = 0; k <= 16; k++) {
            const a = Math.PI + (Math.PI * k) / 16
            pts.push({ u: cu + r * Math.cos(a), v: v0 + r * Math.sin(a) * squash })
          }
          marks.push({ kind: "line", pts })
        }
      }
      break
    case "honeycomb": {
      const r = c / 2
      const dv = r * 1.5
      const du = r * Math.sqrt(3)
      for (let j = -1; j * dv <= h + r; j++) {
        for (let i = -1; i * du <= w + r; i++) {
          const cu = i * du + (j % 2 ? du / 2 : 0)
          const cv = j * dv
          const pts = Array.from({ length: 6 }, (_, k) => {
            const a = (Math.PI / 3) * k + Math.PI / 6
            const rr = r * 0.88 * (1 + wb * 0.08 * s(i, j, k))
            return { u: cu + rr * Math.cos(a), v: cv + rr * Math.sin(a) }
          })
          marks.push({ kind: "line", pts: [...pts, pts[0]!], sharp: true })
        }
      }
      break
    }
    case "crackle": {
      // A glaze: cracks between points thrown a little off a grid, some ways not taken.
      const pt = (i: number, j: number): UV => ({ u: i * c + (0.5 + 0.6 * wb * s(i, j, 1)) * c * 0.5 + c * 0.25, v: j * c + (0.5 + 0.6 * wb * s(i, j, 2)) * c * 0.5 + c * 0.25 })
      for (let j = -1; j <= rows; j++) {
        for (let i = -1; i <= cols; i++) {
          if (n(i, j, 3) > 0.25) marks.push({ kind: "line", pts: drawn(pt(i, j), pt(i + 1, j), 1200 + i * 31 + j, 4, 0.15) })
          if (n(i, j, 4) > 0.25) marks.push({ kind: "line", pts: drawn(pt(i, j), pt(i, j + 1), 1300 + i * 31 + j, 4, 0.15) })
        }
      }
      break
    }
    case "woodgrain": {
      // Grain: rings stretched along the patch, round a knot off its middle, closer as they near it.
      const cu = w * (0.35 + 0.3 * n(1, 1, 1))
      const cv = h * (0.4 + 0.2 * n(2, 2, 2))
      // Stretched along the grain, so a ring reaches the patch's across at two fifths of its up.
      // Never round the body and back: a ring's long way stops short of half the patch's across.
      const reach = Math.min(w / (2 * 1.8), h * 0.85)
      for (let k = 1; k * c * 0.45 < reach; k++) {
        const r = k * c * 0.45 * (1 + 0.015 * k)
        marks.push({ kind: "line", pts: [...ring(cu, cv, r, 1400 + k, 1.8, 60), ring(cu, cv, r, 1400 + k, 1.8, 60)[0]!] })
      }
      break
    }
    case "marble": {
      // Veins: a few long wanderers across the patch, each with a branch or two.
      for (let k = 0; k < 4 + Math.round(rows / 2); k++) {
        const from: UV = { u: -c, v: h * n(k, 1, 1) }
        const to: UV = { u: w + c, v: h * n(k, 2, 2) }
        const vein = drawn(from, to, 1500 + k, 14, 0.9)
        marks.push({ kind: "line", pts: vein })
        if (n(k, 3, 3) > 0.4) {
          const at = vein[Math.floor(vein.length * (0.3 + 0.4 * n(k, 4, 4)))]!
          marks.push({ kind: "line", pts: drawn(at, { u: at.u + c * 2 * s(k, 5, 5), v: at.v + c * 2 * s(k, 6, 6) }, 1600 + k, 6, 0.4) })
        }
      }
      break
    }
    case "dots":
      each((i, j, u0, v0) => {
        const r = c * 0.24 * (1 + wb * 0.25 * s(i, j, 3))
        const pts = Array.from({ length: 10 }, (_, k) => {
          const a = (2 * Math.PI * k) / 10
          const rr = r * (1 + wb * 0.3 * s(i * 131 + j, k, 3))
          return { u: u0 + c / 2 + wb * 0.15 * c * s(i, j, 1) + rr * Math.cos(a), v: v0 + c / 2 + wb * 0.15 * c * s(i, j, 2) + rr * Math.sin(a) }
        })
        marks.push({ kind: "poly", pts })
      })
      break
    case "splatter":
      each((i, j, u0, v0) => {
        for (let k = 0; k < 9; k++) {
          if (n(i, j, 30 + k) < 0.2) continue
          marks.push({ kind: "dot", pts: [{ u: u0 + n(i, j, k) * c, v: v0 + n(i, j, 10 + k) * c }], r: c * (0.035 + 0.12 * n(i, j, 20 + k) ** 2) })
        }
      })
      break
    case "smears":
      each((i, j, u0, v0) => {
        if (n(i, j, 9) < 0.25) return
        const a = -0.6 + wb * 0.5 * s(i, j, 1)
        const l = c * (0.6 + 0.5 * n(i, j, 2))
        const cu = u0 + c / 2 + wb * 0.3 * c * s(i, j, 3)
        const cv = v0 + c / 2 + wb * 0.3 * c * s(i, j, 4)
        const [ux, uy] = [Math.cos(a), Math.sin(a)]
        const up: UV[] = []
        const down: UV[] = []
        for (let k = 0; k <= 8; k++) {
          const t = k / 8 - 0.5
          const width = c * 0.14 * Math.sin(Math.PI * (t + 0.5)) * (1 + wb * 0.3 * s(i, j, 40 + k))
          up.push({ u: cu + ux * l * t - uy * width, v: cv + uy * l * t + ux * width })
          down.push({ u: cu + ux * l * t + uy * width, v: cv + uy * l * t - ux * width })
        }
        marks.push({ kind: "poly", pts: [...up, ...down.reverse()] })
      })
      break
  }
  return marks
}

/** A path through `pts`, smooth: each point a control, the curve through the midpoints between them. */
function smooth(pts: P[]): string {
  if (pts.length < 3) return `M ${pts.map((q) => `${f2(q.x)} ${f2(q.y)}`).join(" L ")}`
  let d = `M ${f2(pts[0]!.x)} ${f2(pts[0]!.y)}`
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]!
    const q = pts[i + 1]!
    d += ` Q ${f2(p.x)} ${f2(p.y)} ${f2((p.x + q.x) / 2)} ${f2((p.y + q.y) / 2)}`
  }
  const last = pts[pts.length - 1]!
  return `${d} L ${f2(last.x)} ${f2(last.y)}`
}

/** How wide a texture's lines are stroked, of a cell. */
const STROKE: Partial<Record<AgentTexture, number>> = {
  meridians: 0.08, latitudes: 0.08, contours: 0.08, spiral: 0.09, waves: 0.09, chevron: 0.08, hatch: 0.08, grid: 0.08,
  scales: 0.07, honeycomb: 0.07, crackle: 0.05, woodgrain: 0.06, marble: 0.07,
}

/**
 * The texture drawn on `patches`, projected: each mark's points carried onto the surface and through `place`, which
 * gives a point on the box and the tone of the surface there, or null where the surface faces away — a line breaks
 * there, a shape or a dot is left out when its middle does. Grouped by tone, one path a tone, in px.
 */
export function drawTexture(
  look: TextureLook,
  patches: Patch[],
  place: (p: { x: number; y: number; z: number }, n: { x: number; y: number; z: number }) => { at: P; tone: number } | null,
  R: number,
): TextureGroup[] {
  if (look.texture === "none") return []
  const stroke = STROKE[look.texture]
  const byTone = new Map<number, string[]>()
  const add = (tone: number, d: string) => byTone.set(tone, [...(byTone.get(tone) ?? []), d])
  patches.forEach((patch, pi) => {
    const marks = marksOn(look, patch.w, patch.h, pi)
    const on = (uv: UV) => {
      const p = { u: patch.wrap ? ((uv.u % patch.w) + patch.w) % patch.w : uv.u, v: uv.v }
      if (!patch.wrap && (p.u < 0 || p.u > patch.w)) return null
      if (p.v < 0 || p.v > patch.h) return null
      if (patch.inside && !patch.inside(p)) return null
      const at = patch.at(p)
      return place(at, patch.normal ? patch.normal(p) : at)
    }
    for (const m of marks) {
      if (m.kind === "dot") {
        const q = on(m.pts[0]!)
        if (!q) continue
        const r = m.r! * R
        add(q.tone, `M ${f2(q.at.x + r)} ${f2(q.at.y)} A ${f2(r)} ${f2(r)} 0 1 0 ${f2(q.at.x - r)} ${f2(q.at.y)} A ${f2(r)} ${f2(r)} 0 1 0 ${f2(q.at.x + r)} ${f2(q.at.y)} Z`)
        continue
      }
      const placed = m.pts.map(on)
      if (m.kind === "poly") {
        const shown = placed.filter((q): q is NonNullable<typeof q> => !!q)
        // Kept while most of it faces you, so a shape reaches the rim; what crosses it is cut by the body.
        if (shown.length < 3 || shown.length < placed.length * 0.5) continue
        const tone = shown[Math.floor(shown.length / 2)]!.tone
        add(tone, `M ${shown.map((q) => `${f2(q.at.x)} ${f2(q.at.y)}`).join(" L ")} Z`)
        continue
      }
      // A line: in runs between the places it faces away, each run its own stroke in the tone of its middle, drawn as
      // a smooth curve through its points (each straight piece bent into the next).
      let run: { at: P; tone: number }[] = []
      const flush = () => {
        if (run.length >= 2) add(run[Math.floor(run.length / 2)]!.tone, m.sharp ? `M ${run.map((q) => `${f2(q.at.x)} ${f2(q.at.y)}`).join(" L ")}` : smooth(run.map((q) => q.at)))
        run = []
      }
      for (const q of placed) {
        if (q) run.push(q)
        else flush()
      }
      flush()
    }
  })
  const c = Math.max(0.02, look.size * 2) * R
  return [...byTone.entries()].sort((a, b) => a[0] - b[0]).map(([tone, parts]) => ({ d: parts.join(" "), tone, ...(stroke ? { stroke: stroke * c } : {}) }))
}

/** The sphere as one patch: longitude across, latitude up, a head's radius 1, its front at the middle. */
export const SPHERE_PATCH: Patch = {
  w: 2 * Math.PI,
  h: Math.PI,
  wrap: true,
  at: ({ u, v }) => {
    const theta = u - Math.PI
    const phi = v - Math.PI / 2
    return { x: Math.cos(phi) * Math.sin(theta), y: Math.sin(phi), z: Math.cos(phi) * Math.cos(theta) }
  },
}
