/**
 * THE AGENT'S SHAPES (Orbit.md C10, C12, C18), pure: what the head is drawn as when it is not the sphere. **Rounded
 * solids in 3D**, turned by his rotation, resting in the cell as in a tunnel, **with smooth edges**.
 *
 * **Each shape is a solid with soft edges**, never sharp: a core — the
 * cube, the hexagonal prism and the pyramid as faces, the cylinder, the cone and the hemisphere as circles and a dome —
 * grown by a ball `RHO` wide, so every edge is a quarter-round and every corner a piece of a sphere (the Minkowski
 * sum). A round one keeps the sphere's two tones — its dark side, then its lit side moved toward the light — and flat
 * colour for its ends.
 *
 * **Its edges are smooth**, with no line, facet or star showing at an edge or a corner. **Its outline is the hull of its round parts,
 * finely** — the horizon of each of its corners' balls and of its dome, as the camera sees it, and its rims'
 * quarter-rounds, a few degrees apart — so it is a curve wherever the solid is round and straight where it is flat, and
 * it moves smoothly as it turns: it is the solid's, not a rounding on the page. It is found as the solid stands and
 * then bent with everything else (`bendOf`), so where the bowl bends a side in, the outline follows it in. **A
 * flat-sided one is toned where it faces** (`facing`): each face in its own tone, and every point of an edge's
 * quarter-round and a corner's ball in the tone of the way it faces there, drawn in steps of a twenty-fourth
 * (`TONE_STEPS`) — so an edge rounds from one face's tone to the next in steps too fine to see, and a corner with them.
 * An edge is cut into runs of one step along its round (`runsOf`); a corner's ball into regions between the circles
 * where its tone crosses a step, every boundary an arc on the ball (`cornerOf`). Flat colour still: each step is one
 * flat path, and what is one step is one path, so nothing shows between them.
 *
 * **Turned, then seen.** Rotate Y about its upright, on the spot, then X toward you or away, then Z about the way you
 * look; then a camera in front of it and above, in perspective, looking straight ahead (`VIEWS`, each shape's natural
 * view), so at rotation 0 its front is square to you and its base level.
 *
 * **It rests in the cell as in a tunnel** (his: *"imagine each cell is a tunnel and the character is resting on the
 * tunnel, so it should be a smooth curve"*). The nest is a cylinder going back into the page, so its floor under a
 * point depends only on how far across the point is: its underside is carried onto that floor — up where it would pass
 * the ring, down where it hangs clear, as slime settles — and what is over it moves with it, less the higher it stands,
 * so the bend fades up its body (`bendOf`). Every move is a smooth function of where a point is, so a turn moves every
 * point smoothly; its edges are drawn in pieces a few px long so a straight one can bend. Where its face goes is a
 * patch of its front carried through the same turn, bend and camera (`face`), hidden once the front turns away.
 */

export const AGENT_SHAPES = ["sphere", "cube", "pyramid", "hemisphere", "cylinder", "hexagonal-prism", "cone"] as const
export type AgentShape = (typeof AGENT_SHAPES)[number]
export const isAgentShape = (s: unknown): s is AgentShape => (AGENT_SHAPES as readonly unknown[]).includes(s)

import { drawTexture, type Patch, type TextureGroup, type TextureLook, type UV } from "./agent-texture"

/** A face of a shape: a closed SVG path (one or many subpaths, filled nonzero), and its tone (0 paint, −1 its dark side, above 0 toward white). */
export type ShapeFace = { d: string; tone: number }

/** His rotation, degrees: X toward you or away, Y about its upright, Z about the way you look. */
export type ShapeTurn = { x: number; y: number; z: number }

export type ShapeFrame = {
  /** The silhouette: what the head's outline is, and what everything of it is cut to. */
  outline: string
  /** Its texture, drawn on its surface (C15): marks by tone, projected as the body is. */
  texture: TextureGroup[]
  /** Its faces, painted in order, each cut to the outline. */
  faces: ShapeFace[]
  /** Where its face goes: its front's patch on the box, px, and how far out an eye's measures reach there (a head's radius). */
  front: { x: number; y: number; r: number }
  /**
   * The face laid on the front: the face drawn about 0,0 in its own px, then this matrix's `a b c d` (unitless) and the
   * front's `x y` put it there, turned as the front is.
   */
  face: { a: number; b: number; c: number; d: number }
  /** Whether the front faces you enough to wear the face. */
  faceShown: boolean
}

/** A box: its centre and its size, px. */
export type ShapeBox = { x: number; y: number; w: number; h: number }

type V = { x: number; y: number; z: number }
type P = { x: number; y: number }

/** A camera: in front of the shape `d` away, and `x` right and `y` up of its middle, looking straight ahead. */
type View = { x: number; y: number; d: number }

/** Each shape's natural view: where its camera stands, heads from its middle. */
const VIEWS: Record<Exclude<AgentShape, "sphere">, View> = {
  cube: { x: 1.7, y: 1.6, d: 4.6 },
  "hexagonal-prism": { x: 1.1, y: 1.6, d: 5 },
  pyramid: { x: 0, y: 1.9, d: 5 },
  cylinder: { x: 0, y: 1.5, d: 5 },
  cone: { x: 0, y: 1.5, d: 5 },
  hemisphere: { x: 0, y: 1.5, d: 5 },
}

/** How round its edges are: the ball a solid is grown by, of a head's radius. */
const RHO = 0.11
/** How many steps a round rim's quarter-round is drawn in for the outline: under a fifth of a px off. */
const RIM = 6
/** How many points a ball's horizon is drawn with at least: a corner's, about 11° apart. */
const HORIZON = 32
/**
 * How wide a step round a curve of ways is at most — an edge's quarter-round, a corner's lines — radians: 8°, under a
 * tenth of a px off the curve on a corner's ball at the studio's size.
 */
const ARC = Math.PI / 22.5
/** How far a round shape's lit side is moved toward the light, of its half width: the sphere's. */
const LIFT = 0.32
/** The light, toward it on the page: up and to the left, the sphere's. */
const LIGHT = (() => {
  const [x, y] = [-0.45, -0.6]
  const l = Math.hypot(x, y)
  return { x: x / l, y: y / l }
})()
/** How much a face's tone is moved by facing up, left, right and down (view space), before it is measured from its front's. */
const UP = 0.35
const LEFT = 0.15
const RIGHT = -1
const DOWN = -0.7
/**
 * A tone is drawn to this many steps a unit, so what is one tone is one path; fine enough that no step of a rounded
 * edge shows, and few enough that a shape is never more paths than the `Agent` paints (37 at most, of its 40).
 */
const TONE_STEPS = 24
/** How many points a circle is drawn with. */
const ROUNDS = 96
/** How far its front must face you, of straight on, to wear its face. */
const SHOWN = 0.12
/** How long a piece of an edge is at most when it may bend, of a head's radius: a few px, finer than the bend's curve. */
const PIECE = 0.06
/** How far up its body the bend fades out, of its height: its top stays as it was. */
const FADE = 0.9
/** How softly where it stands follows its lowest and widest points, px. */
const SETTLE_SOFT = 4
/** How far over the ring its underside rests, px: the settled sphere's. */
const SEAT = 1.8
/** Over how much of its height, lifted off the floor, it stops settling. */
const LETGO = 0.3
/** How far at most a part standing clear of the floor sags onto it, of its height: slime settles, it does not melt. */
const SAG = 0.1

/** A number to a tenth, written by hand: a path is thousands of them a frame, and this is twice as quick as `toString`. */
const f1 = (n: number) => {
  const t = Math.round(n * 10)
  const a = t < 0 ? -t : t
  const r = a % 10
  return (t < 0 ? "-" : "") + (a - r) / 10 + (r ? "." + r : "")
}
/** A polygon's area, signed by which way it goes round. */
const areaOf = (pts: P[]) => pts.reduce((s, p, i) => s + p.x * pts[(i + 1) % pts.length]!.y - pts[(i + 1) % pts.length]!.x * p.y, 0) / 2
const poly = (pts: P[]) => `M ${pts.map((p) => `${f1(p.x)} ${f1(p.y)}`).join(" L ")} Z`
const v = (x: number, y: number, z: number): V => ({ x, y, z })
const add = (a: V, b: V, k = 1): V => v(a.x + b.x * k, a.y + b.y * k, a.z + b.z * k)
const sub = (a: V, b: V): V => v(a.x - b.x, a.y - b.y, a.z - b.z)
const dot = (a: V, b: V) => a.x * b.x + a.y * b.y + a.z * b.z
const cross = (a: V, b: V): V => v(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x)
const len = (a: V) => Math.hypot(a.x, a.y, a.z)
const unit = (a: V): V => {
  const l = len(a) || 1
  return v(a.x / l, a.y / l, a.z / l)
}
const mean = (pts: V[]): V => pts.reduce((s, p) => add(s, p, 1 / pts.length), v(0, 0, 0))
/** From one direction to another along the great circle between them, `t` of the way. */
function slerp(a: V, b: V, t: number): V {
  const theta = Math.acos(Math.max(-1, Math.min(1, dot(a, b))))
  if (theta < 1e-6) return unit(add(a, sub(b, a), t))
  const s = Math.sin(theta)
  const [ka, kb] = [Math.sin((1 - t) * theta) / s, Math.sin(t * theta) / s]
  return unit(v(a.x * ka + b.x * kb, a.y * ka + b.y * kb, a.z * ka + b.z * kb))
}

/** His rotation as a turn of a point: Y first, on the spot; then X; then Z. */
function turner(t: ShapeTurn) {
  const [ax, ay, az] = [t.x, t.y, t.z].map((deg) => (deg * Math.PI) / 180) as [number, number, number]
  const [cx, sx, cy, sy, cz, sz] = [Math.cos(ax), Math.sin(ax), Math.cos(ay), Math.sin(ay), Math.cos(az), Math.sin(az)]
  return (p: V): V => {
    const a = v(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy)
    const b = v(a.x, a.y * cx - a.z * sx, a.y * sx + a.z * cx)
    return v(b.x * cz - b.y * sz, b.x * sz + b.y * cz, b.z)
  }
}

/** A point as the camera sees it: on its picture's plane through the shape's middle, x right and y up. */
const seen = (c: View) => (p: V): P => {
  const k = c.d / Math.max(0.2, c.d - p.z)
  return { x: c.x + (p.x - c.x) * k, y: c.y + (p.y - c.y) * k }
}

/** The convex hull of `pts`, anticlockwise as seen with y up. */
function hull(pts: P[]): P[] {
  const s = [...pts].sort((a, b) => a.x - b.x || a.y - b.y)
  const side = (o: P, a: P, b: P) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lower: P[] = []
  for (const p of s) {
    while (lower.length >= 2 && side(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: P[] = []
  for (const p of s.reverse()) {
    while (upper.length >= 2 && side(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop()
    upper.push(p)
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

// ── the solids ──────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * A flat-sided solid, made once: its faces moved out, each its corners and its normal; its edges' quarter-rounds, each
 * between two of its core's corners, from one face's normal round to the other's; and its corners' balls, each its
 * core's corner and the rim of its piece, the ways round it in order.
 */
type Flat = {
  faces: { corners: V[]; normal: V }[]
  edges: { a: V; b: V; from: V; to: V }[]
  corners: { at: V; rim: V[] }[]
}

/** A ball of a solid's surface, whose horizon its outline is drawn round: only its part toward `on.way`, past `on.least`. */
type Ball = { at: V; r: number; on?: { way: V; least: number } }

/**
 * A solid, about its middle, a head's radius a unit, its edges rounded: what its outline is the hull of, and it stands
 * on — points of its surface (`cloud`), and balls whose horizon is drawn as the camera sees them (`balls`), each its
 * centre, its radius, and where only part of it is the surface, the way that part is toward and how far; where it is
 * flat-sided, its faces, edges and corners (`flat`); where it is round, its flat ends, each a ring of points and its
 * normal; whether it is round; and the patch of its front the face is laid on — a point, its across and its down — with
 * how far out the face's measures reach.
 */
type Solid = {
  cloud: V[]
  balls: Ball[]
  flat: Flat | null
  caps: { ring: V[]; normal: V }[]
  round: boolean
  /** Its surface as patches a texture is drawn on (`agent-texture`), each with its outward way for the tone and the cull. */
  patches: Patch[]
  front: { at: V; across: V; down: V; normal: V; reach: number }
}

/**
 * A flat-sided core's faces as patches, each its own sheet: across along its first edge, up across it, from its first
 * corner, `rho` out along its normal, so the marks lie on the face as it is drawn; a place is on it inside the polygon.
 */
function facePatches(core: Core, rho: number): Patch[] {
  const centre = mean(core.verts)
  return core.faces.map((f) => {
    const pts = f.map((i) => core.verts[i]!)
    let n = unit(cross(sub(pts[1]!, pts[0]!), sub(pts[2]!, pts[0]!)))
    if (dot(n, sub(mean(pts), centre)) < 0) n = v(-n.x, -n.y, -n.z)
    const e1 = unit(sub(pts[1]!, pts[0]!))
    const e2 = cross(n, e1)
    const flat = pts.map((q) => ({ u: dot(sub(q, pts[0]!), e1), v: dot(sub(q, pts[0]!), e2) }))
    const u0 = Math.min(...flat.map((q) => q.u))
    const v0 = Math.min(...flat.map((q) => q.v))
    const w = Math.max(...flat.map((q) => q.u)) - u0
    const h = Math.max(...flat.map((q) => q.v)) - v0
    const origin = add(add(add(pts[0]!, e1, u0), e2, v0), n, rho)
    const poly2 = flat.map((q) => ({ u: q.u - u0, v: q.v - v0 }))
    const inside = (q: UV) => {
      let ins = false
      for (let i = 0, j = poly2.length - 1; i < poly2.length; j = i++) {
        const a = poly2[i]!
        const b = poly2[j]!
        if (a.v > q.v !== b.v > q.v && q.u < ((b.u - a.u) * (q.v - a.v)) / (b.v - a.v) + a.u) ins = !ins
      }
      return ins
    }
    return { w, h, wrap: false, at: (q) => add(add(origin, e1, q.u), e2, q.v), normal: () => n, inside }
  })
}

/** A round end as a patch: a disc `r` across in the plane at height `y`, facing `s` up or down. */
function discPatch(r: number, y: number, s: 1 | -1): Patch {
  return {
    w: 2 * r,
    h: 2 * r,
    wrap: false,
    at: (q) => v(q.u - r, y, q.v - r),
    normal: () => v(0, s, 0),
    inside: (q) => Math.hypot(q.u - r, q.v - r) <= r * 0.97,
  }
}

/** A flat-sided core: its corners, and its faces as corner indices, each going round the same way seen from outside. */
type Core = { verts: V[]; faces: number[][] }

/**
 * A line on the ball of ways: the circle of ways `w` with `toward · w = at`, `toward` a unit way — a great circle at 0,
 * a smaller one toward it as `at` grows — what of a way's is on its side (`keep`, 0 on it), and how a way is put on it.
 */
type Line = { toward: V; at: number; keep: (w: V) => number; on: (w: V) => boolean; onto: (w: V) => V }

function lineOf(toward: V, at: number): Line {
  const e = Math.max(-1 + 1e-9, Math.min(1 - 1e-9, at))
  const s = Math.sqrt(1 - e * e)
  return {
    toward,
    at: e,
    keep: (w) => dot(w, toward) - e,
    on: (w) => Math.abs(dot(w, toward) - e) < 1e-7,
    onto: (w) => add(v(toward.x * e, toward.y * e, toward.z * e), unit(add(w, toward, -dot(w, toward))), s),
  }
}

/** A line's whole circle, in `n` ways. */
function ringOf(line: Line, n: number): V[] {
  const d = line.toward
  const s = Math.sqrt(1 - line.at * line.at)
  const u = unit(cross(d, Math.abs(d.y) < 0.9 ? v(0, 1, 0) : v(1, 0, 0)))
  const w = cross(d, u)
  return roundabout(n).map((a) => add(add(v(d.x * line.at, d.y * line.at, d.z * line.at), u, s * Math.cos(a)), w, s * Math.sin(a)))
}

/**
 * What of a polygon of ways (unit vectors, its edges arcs) `keep` does not put below 0, `keep` linear: each edge that
 * crosses it is cut where it does, and the way there put back on the line it is cut along by `onto`.
 */
function cutWays(ways: V[], keep: (w: V) => number, onto: (w: V) => V): V[] {
  const out: V[] = []
  ways.forEach((a, i) => {
    const b = ways[(i + 1) % ways.length]!
    const [ka, kb] = [keep(a), keep(b)]
    if (ka >= 0) out.push(a)
    if (ka >= 0 !== kb >= 0) out.push(onto(add(a, sub(b, a), ka / (ka - kb))))
  })
  return out
}

/**
 * A polygon of ways with no edge wider than `most`: what is put in on an edge is on its great circle, or, where both
 * its ends are on one of `lines`, on that line.
 */
function finer(ways: V[], most: number, lines: Line[] = []): V[] {
  const out: V[] = []
  ways.forEach((a, i) => {
    const b = ways[(i + 1) % ways.length]!
    out.push(a)
    const n = Math.ceil(Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) / most)
    const put = lines.find((l) => l.on(a) && l.on(b))?.onto ?? unit
    for (let k = 1; k < n; k++) out.push(put(add(a, sub(b, a), k / n)))
  })
  return out
}

/** Whether a way is inside a polygon of ways that is convex on the ball; never inside one with no width. */
function insideWays(ways: V[], w: V): boolean {
  const c = unit(mean(ways))
  if (dot(w, c) <= 0) return false
  let sides = 0
  for (let i = 0; i < ways.length; i++) {
    const n = cross(ways[i]!, ways[(i + 1) % ways.length]!)
    const side = dot(n, c)
    if (Math.abs(side) < 1e-12) continue
    sides++
    if (dot(n, w) * Math.sign(side) < -1e-12) return false
  }
  return sides >= 3
}

/** The ways from one to another along the great circle between them, no step wider than `ARC`. */
function arcOf(from: V, to: V): V[] {
  const n = Math.max(1, Math.ceil(Math.acos(Math.max(-1, Math.min(1, dot(from, to)))) / ARC))
  return Array.from({ length: n + 1 }, (_, k) => slerp(from, to, k / n))
}

/**
 * `core` grown by a ball `rho` wide: its faces moved out along their normals; each edge a quarter-round between its
 * faces' normals; each corner the piece of its ball between its faces' normals, its rim the edges' arcs round it. Its
 * outline is its corners' balls'.
 */
function roundedFlat(core: Core, rho: number): Pick<Solid, "cloud" | "balls" | "flat"> {
  const centre = mean(core.verts)
  const normals = core.faces.map((f) => {
    const [a, b, c] = [core.verts[f[0]!]!, core.verts[f[1]!]!, core.verts[f[2]!]!]
    let n = unit(cross(sub(b, a), sub(c, a)))
    if (dot(n, sub(mean(f.map((i) => core.verts[i]!)), centre)) < 0) n = v(-n.x, -n.y, -n.z)
    return n
  })
  const faces = core.faces.map((f, fi) => ({ corners: f.map((vi) => add(core.verts[vi]!, normals[fi]!, rho)), normal: normals[fi]! }))
  // Each edge, the two faces at it, and the ways from the first's normal round to the second's.
  type Edge = { a: number; b: number; faces: number[]; arc: V[] }
  const edges = new Map<string, Edge>()
  const keyOf = (a: number, b: number) => (a < b ? `${a}|${b}` : `${b}|${a}`)
  core.faces.forEach((f, fi) => {
    f.forEach((a, i) => {
      const b = f[(i + 1) % f.length]!
      const e = edges.get(keyOf(a, b))
      if (e) e.faces.push(fi)
      else edges.set(keyOf(a, b), { a, b, faces: [fi], arc: [] })
    })
  })
  const rounds: Flat["edges"] = []
  for (const e of edges.values()) {
    if (e.faces.length !== 2) continue
    const [from, to] = [normals[e.faces[0]!]!, normals[e.faces[1]!]!]
    e.arc = arcOf(from, to)
    rounds.push({ a: core.verts[e.a]!, b: core.verts[e.b]!, from, to })
  }
  // Each corner: its faces in order round it, and the edges' arcs between them as its piece's rim.
  const corners: Flat["corners"] = []
  core.verts.forEach((at, vi) => {
    const first = core.faces.findIndex((f) => f.includes(vi))
    if (first < 0) return
    const rim: V[] = []
    let fi = first
    for (let guard = 0; guard < core.faces.length; guard++) {
      const f = core.faces[fi]!
      const i = f.indexOf(vi)
      const e = edges.get(keyOf(vi, f[(i + 1) % f.length]!))!
      if (e.faces.length !== 2) return
      const forward = e.faces[0] === fi
      rim.push(...(forward ? e.arc : [...e.arc].reverse()).slice(0, -1))
      fi = forward ? e.faces[1]! : e.faces[0]!
      if (fi === first) break
    }
    if (rim.length >= 3) corners.push({ at, rim })
  })
  return { cloud: [], balls: core.verts.map((at) => ({ at, r: rho })), flat: { faces, edges: rounds, corners } }
}

/** Round a circle: `n` angles. */
const roundabout = (n = ROUNDS) => Array.from({ length: n }, (_, i) => (2 * Math.PI * i) / n)

/** A quarter-round from one way to another about `at`, `rho` out: its `RIM` + 1 points. */
const quarter = (at: V, from: V, to: V, rho: number) => Array.from({ length: RIM + 1 }, (_, k) => add(at, slerp(from, to, k / RIM), rho))

const SOLIDS = new Map<Exclude<AgentShape, "sphere">, Solid>()

/** The solid `shape` is, made once: its sizes are its outer ones, the core grown by `RHO` reaching them. */
function solidOf(shape: Exclude<AgentShape, "sphere">): Solid {
  const made = SOLIDS.get(shape)
  if (made) return made
  const rho = RHO
  const up = v(0, 1, 0)
  const down = v(0, -1, 0)
  let solid: Solid
  switch (shape) {
    case "cube": {
      // Smaller than the sphere's radius across: a square as wide as a circle looks the bigger.
      const h = 0.58
      const c = h - rho
      const verts = [v(-c, -c, c), v(c, -c, c), v(c, c, c), v(-c, c, c), v(-c, -c, -c), v(c, -c, -c), v(c, c, -c), v(-c, c, -c)]
      const faces = [[0, 1, 2, 3], [5, 4, 7, 6], [1, 5, 6, 2], [4, 0, 3, 7], [3, 2, 6, 7], [4, 5, 1, 0]]
      solid = {
        ...roundedFlat({ verts, faces }, rho),
        caps: [],
        round: false,
        patches: facePatches({ verts, faces }, rho),
        front: { at: v(0, 0, h), across: v(1, 0, 0), down: v(0, -1, 0), normal: v(0, 0, 1), reach: h * 1.2 },
      }
      break
    }
    case "hexagonal-prism": {
      // Upright, a flat side to you: its corners at 0°, 60° … round from its right, so the side from 60° to 120° faces you.
      const r = 0.88
      const h = 0.72
      const apothem = r * Math.cos(Math.PI / 6)
      const rc = (apothem - rho) / Math.cos(Math.PI / 6)
      const hc = h - rho
      const ring = roundabout(6).map((a) => ({ x: rc * Math.cos(a), z: rc * Math.sin(a) }))
      const verts = [...ring.map((p) => v(p.x, -hc, p.z)), ...ring.map((p) => v(p.x, hc, p.z))]
      const faces = [...ring.map((_, i) => [i, (i + 1) % 6, 6 + ((i + 1) % 6), 6 + i]), [6, 7, 8, 9, 10, 11], [5, 4, 3, 2, 1, 0]]
      solid = {
        ...roundedFlat({ verts, faces }, rho),
        caps: [],
        round: false,
        patches: facePatches({ verts, faces }, rho),
        front: { at: v(0, 0, apothem), across: v(1, 0, 0), down: v(0, -1, 0), normal: v(0, 0, 1), reach: Math.min(h * 1.2, r * 0.9) },
      }
      break
    }
    case "pyramid": {
      // Its base a little narrower than the sphere is wide, so its corners do not stand where the bowl rises steeply.
      const b = 0.84
      const h = 1.1
      // Its core: each face moved in by rho — the base up, the sides in — and its corners where those planes meet.
      const L = Math.hypot(b, 2 * h)
      const bc = b - (rho * (L + b)) / (2 * h)
      const top = h - (rho * L) / b
      const low = -h + rho
      const verts = [v(-bc, low, bc), v(bc, low, bc), v(bc, low, -bc), v(-bc, low, -bc), v(0, top, 0)]
      const faces = [[0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4], [3, 2, 1, 0]]
      const slope = unit(sub(v(0, -h, b), v(0, h, 0)))
      const at = add(v(0, h, 0), sub(v(0, -h, b), v(0, h, 0)), 0.7)
      solid = {
        ...roundedFlat({ verts, faces }, rho),
        caps: [],
        round: false,
        patches: facePatches({ verts, faces }, rho),
        // Its outward way: down its slope, crossed with across, faces you and up.
        front: { at, across: v(1, 0, 0), down: slope, normal: unit(cross(slope, v(1, 0, 0))), reach: Math.min(b * 0.6, h * 0.52) },
      }
      break
    }
    case "cylinder": {
      const r = 0.9
      const h = 0.72
      const rc = r - rho
      const hc = h - rho
      const cloud: V[] = []
      const capTop: V[] = []
      const capLow: V[] = []
      for (const a of roundabout()) {
        const u = v(Math.cos(a), 0, Math.sin(a))
        for (const s of [1, -1]) {
          const corner = add(v(0, s * hc, 0), u, rc)
          // Its rim rounds from its side's direction to its end's.
          cloud.push(...quarter(corner, u, v(0, s, 0), rho))
          ;(s > 0 ? capTop : capLow).push(add(corner, v(0, s, 0), rho))
        }
      }
      solid = {
        cloud,
        balls: [],
        flat: null,
        caps: [{ ring: capTop, normal: up }, { ring: capLow, normal: down }],
        round: true,
        // Its side as one sheet round, its ends as discs.
        patches: [
          { w: 2 * Math.PI * r, h: 2 * hc, wrap: true, at: (q) => v(r * Math.cos(q.u / r - Math.PI / 2), q.v - hc, r * Math.sin(q.u / r - Math.PI / 2)), normal: (q) => v(Math.cos(q.u / r - Math.PI / 2), 0, Math.sin(q.u / r - Math.PI / 2)) },
          discPatch(rc, h, 1),
          discPatch(rc, -h, -1),
        ],
        front: { at: v(0, 0, r), across: v(1, 0, 0), down: v(0, -1, 0), normal: v(0, 0, 1), reach: Math.min(r * 0.95, h * 1.2) },
      }
      break
    }
    case "cone": {
      const r = 1.14
      const h = 1.05
      const L = Math.hypot(2 * h, r)
      const apex = v(0, h - (rho * L) / r, 0)
      const low = -h + rho
      const rc = r - (rho * (L + r)) / (2 * h)
      const cloud: V[] = []
      const cap: V[] = []
      for (const a of roundabout()) {
        const u = v(Math.cos(a), 0, Math.sin(a))
        const slant = unit(add(v(0, r, 0), u, 2 * h))
        // Its tip is a ball (below); its rim rounds from its side's direction to straight down.
        const rim = add(v(0, low, 0), u, rc)
        cloud.push(...quarter(rim, slant, down, rho))
        cap.push(add(rim, down, rho))
      }
      const lift = 0.36
      const slope = unit(v(0, -2 * h, r))
      solid = {
        cloud,
        // Its tip: what of the ball shows past its side is all on the surface, the rest inside it.
        balls: [{ at: apex, r: rho }],
        flat: null,
        caps: [{ ring: cap, normal: down }],
        round: true,
        // Its side as one sheet from the rim up to the tip, its base a disc.
        patches: [
          {
            w: 2 * Math.PI * r,
            h: L,
            wrap: true,
            at: (q) => {
              const a = q.u / r - Math.PI / 2
              const t = 1 - q.v / L
              return v(t * r * Math.cos(a), h - 2 * h * t, t * r * Math.sin(a))
            },
            normal: (q) => {
              const a = q.u / r - Math.PI / 2
              return unit(v(2 * h * Math.cos(a), r, 2 * h * Math.sin(a)))
            },
          },
          discPatch(rc, -h, -1),
        ],
        front: {
          at: v(0, -h + 2 * h * lift, r * (1 - lift)),
          across: v(1, 0, 0),
          down: slope,
          normal: unit(cross(slope, v(1, 0, 0))),
          reach: Math.min(r * (1 - lift) * 0.8, 2 * h * 0.28),
        },
      }
      break
    }
    case "hemisphere": {
      const r = 1.24
      const low = -r / 2
      const rc = r - rho
      // Its core is the dome cut a little over its middle; grown, its dome is the whole one again and its rim rounds over.
      const phi0 = Math.asin(rho / rc)
      const q = Math.sqrt(rc * rc - rho * rho)
      const cloud: V[] = []
      const cap: V[] = []
      for (const a of roundabout()) {
        const u = v(Math.cos(a), 0, Math.sin(a))
        const rim = add(v(0, low + rho, 0), u, q)
        const out = unit(add(v(0, Math.sin(phi0), 0), u, Math.cos(phi0)))
        cloud.push(...quarter(rim, out, down, rho))
        cap.push(add(rim, down, rho))
      }
      const phi = (25 * Math.PI) / 180
      solid = {
        cloud,
        // Its dome: the ball it is part of, what of it is over its rim.
        balls: [{ at: v(0, low, 0), r, on: { way: up, least: Math.sin(phi0) } }],
        flat: null,
        caps: [{ ring: cap, normal: down }],
        round: true,
        // Its dome as a sheet of longitude and latitude, its base a disc.
        patches: [
          {
            w: 2 * Math.PI * r,
            h: (Math.PI / 2) * r,
            wrap: true,
            at: (q) => {
              const a = q.u / r - Math.PI / 2
              const p = q.v / r
              return v(r * Math.cos(p) * Math.cos(a), low + r * Math.sin(p), r * Math.cos(p) * Math.sin(a))
            },
            normal: (q) => {
              const a = q.u / r - Math.PI / 2
              const p = q.v / r
              return v(Math.cos(p) * Math.cos(a), Math.sin(p), Math.cos(p) * Math.sin(a))
            },
          },
          discPatch(q, low, -1),
        ],
        front: {
          at: v(0, low + r * Math.sin(phi), r * Math.cos(phi)),
          across: v(1, 0, 0),
          down: v(0, -Math.cos(phi), Math.sin(phi)),
          normal: v(0, Math.sin(phi), Math.cos(phi)),
          reach: r * 0.62,
        },
      }
      break
    }
  }
  SOLIDS.set(shape, solid)
  return solid
}

/** How a face that faces `n` (view space, turned) is toned, before it is measured from the front's. */
const facing = (n: V) => UP * Math.max(0, n.y) + LEFT * Math.max(0, -n.x) + RIGHT * Math.max(0, n.x) + DOWN * Math.max(0, -n.y)

/** The tone `facing` gives, as a straight sum of a way's parts where it faces right or left and up or down. */
const facingIn = (right: boolean, up: boolean) => v(right ? RIGHT : -LEFT, up ? UP : -DOWN, 0)

/** A tone's step, `TONE_STEPS` a unit, held to the tones a shape has: from its dark side, −1, to 0.5 toward white. */
const stepOf = (tone: number) => Math.round(Math.max(-1, Math.min(0.5, tone)) * TONE_STEPS)

/**
 * What the camera at `eye` sees of an edge's quarter-round between `a` and `b` (turned), from `from` round to `to`,
 * in runs of one step of tone each (`toneOf` a way's): a run is the ways it spans, from the first strip any end of
 * which faces the camera to the last — the outline cuts what reaches past it — and each run ends where the tone crosses
 * into the next step, found between the arc's points by halving.
 */
function runsOf(a: V, b: V, from: V, to: V, eye: V, rho: number, toneOf: (n: V) => number): { step: number; ways: V[] }[] {
  const way = (t: number) => slerp(from, to, t)
  const shows = (t: number) => {
    const w = way(t)
    return dot(w, sub(eye, a)) > rho || dot(w, sub(eye, b)) > rho
  }
  // Where a test turns, between where it holds (`yes`) and where it does not (`no`): by halving.
  const turn = (yes: number, no: number, holds: (t: number) => boolean) => {
    for (let k = 0; k < 16; k++) {
      const m = (yes + no) / 2
      if (holds(m)) yes = m
      else no = m
    }
    return yes
  }
  const n = Math.max(2, Math.ceil(Math.acos(Math.max(-1, Math.min(1, dot(from, to)))) / ARC))
  const ts = Array.from({ length: n + 1 }, (_, j) => j / n)
  const first = ts.findIndex(shows)
  if (first < 0) return []
  const last = n - [...ts].reverse().findIndex(shows)
  const t0 = first === 0 ? 0 : turn(ts[first]!, ts[first - 1]!, shows)
  const t1 = last === n ? 1 : turn(ts[last]!, ts[last + 1]!, shows)
  const tone = (t: number) => Math.max(-1, Math.min(0.5, toneOf(way(t)))) * TONE_STEPS
  const runs: { step: number; ways: V[] }[] = []
  let run = { step: stepOf(toneOf(way(t0))), ways: [way(t0)] }
  let p = t0
  for (const q of [...ts.filter((t) => t > t0 && t < t1), t1]) {
    const target = stepOf(toneOf(way(q)))
    while (run.step !== target) {
      const next = run.step + Math.sign(target - run.step)
      const edge = (run.step + next) / 2
      const side = Math.sign(tone(p) - edge)
      const t = turn(p, q, (t) => Math.sign(tone(t) - edge) === side)
      run.ways.push(way(t))
      runs.push(run)
      run = { step: next, ways: [way(t)] }
      p = t
    }
    run.ways.push(way(q))
    p = q
  }
  runs.push(run)
  return runs
}

/**
 * What the camera at `eye` sees of a corner's ball, centred `at`, its piece's rim `rim` (turned), in regions of one step
 * of tone each: the piece cut to its horizon, then into the four quarters where `facing` is a straight sum of a way's
 * parts, then each quarter between the circles where its tone crosses from one step to the next — every boundary an arc
 * on the ball, so a corner's tones follow it round smoothly. Where a step's circle lies wholly inside a quarter (the
 * brightest or darkest way the quarter faces is in it), it is a hole in the region round it.
 */
function cornerOf(rim: V[], at: V, eye: V, rho: number, frontTone: number): { step: number; ways: V[]; holes: V[][] }[] {
  const out = sub(eye, at)
  const horizon = lineOf(unit(out), rho / len(out))
  const cutAway = cutWays(rim, horizon.keep, horizon.onto)
  if (cutAway.length < 3) return []
  const seen = finer(cutAway, ARC, [horizon])
  const regions: { step: number; ways: V[]; holes: V[][] }[] = []
  for (const right of [true, false]) {
    for (const up of [true, false]) {
      let piece = cutWays(seen, (w) => (right ? w.x : -w.x), unit)
      if (piece.length >= 3) piece = cutWays(piece, (w) => (up ? w.y : -w.y), unit)
      if (piece.length < 3) continue
      piece = finer(piece, ARC, [horizon])
      const L = facingIn(right, up)
      const size = len(L)
      const axis = unit(L)
      const back = v(-axis.x, -axis.y, -axis.z)
      const values = piece.map((w) => dot(L, w))
      const brightest = insideWays(piece, axis)
      const darkest = insideWays(piece, back)
      const low = stepOf((darkest ? -size : Math.min(...values)) - frontTone)
      const high = stepOf((brightest ? size : Math.max(...values)) - frontTone)
      for (let k = low; k <= high; k++) {
        let ways = piece
        const holes: V[][] = []
        const lines = [horizon]
        // At least this step: brighter than halfway down to the one under it.
        if (k > low) {
          const line = lineOf(axis, (frontTone + (k - 0.5) / TONE_STEPS) / size)
          if (ways.every((w) => line.keep(w) >= 0)) {
            const ring = darkest ? ringOf(line, Math.max(24, Math.ceil((2 * Math.PI) / ARC))) : []
            if (ring.length && ring.every((w) => insideWays(ways, w))) holes.push(ring)
          } else ways = cutWays(ways, line.keep, line.onto)
          lines.push(line)
        }
        // At most this step: darker than halfway up to the one over it.
        if (k < high && ways.length >= 3) {
          const line = lineOf(back, -(frontTone + (k + 0.5) / TONE_STEPS) / size)
          if (ways.every((w) => line.keep(w) >= 0)) {
            const ring = brightest ? ringOf(line, Math.max(24, Math.ceil((2 * Math.PI) / ARC))) : []
            if (ring.length && ring.every((w) => insideWays(ways, w))) holes.push(ring)
          } else ways = cutWays(ways, line.keep, line.onto)
          lines.push(line)
        }
        if (ways.length >= 3) regions.push({ step: k, ways: finer(ways, ARC, lines), holes })
      }
    }
  }
  return regions
}

/**
 * The points of a ball's horizon as the camera at `eye` sees it, turned: the circle on it where its surface turns away,
 * as many as its size wants; where only part of the ball is the surface, those on that part.
 */
function horizonOf(ball: Ball, turned: (p: V) => V, eye: V): V[] {
  const at = turned(ball.at)
  const out = sub(eye, at)
  const d = unit(out)
  const e = ball.r / len(out)
  const s = Math.sqrt(1 - e * e)
  const u = unit(cross(d, Math.abs(d.y) < 0.9 ? v(0, 1, 0) : v(1, 0, 0)))
  const w = cross(d, u)
  const on = ball.on && { way: turned(ball.on.way), least: ball.on.least }
  const pts: V[] = []
  for (const a of roundabout(Math.max(HORIZON, Math.ceil(ROUNDS * ball.r)))) {
    const way = add(add(v(d.x * e, d.y * e, d.z * e), u, s * Math.cos(a)), w, s * Math.sin(a))
    if (!on || dot(way, on.way) >= on.least) pts.push(add(at, way, ball.r))
  }
  return pts
}

/**
 * The least of `values`, softly: the mean of those near the least, each weighed by how near (`t` their spread). It is
 * the least where several tie — a flat base — and hands over smoothly where one takes the lead from another, as a
 * corner does when it is turned, where the least itself turns sharply.
 */
function softLeast(values: number[], t: number) {
  const least = Math.min(...values)
  let sum = 0
  let weight = 0
  for (const x of values) {
    const w = Math.exp(-(x - least) / t)
    sum += x * w
    weight += w
  }
  return sum / weight
}

/** Its underside on the page: the lower edge of its outline, as a function across — its lower hull, left to right. */
function undersideOf(pts: P[]) {
  const s = [...pts].sort((a, b) => a.x - b.x || b.y - a.y)
  // y down on the page: the lower hull keeps the points with the greatest y.
  const chain: P[] = []
  for (const p of s) {
    while (chain.length >= 2) {
      const a = chain[chain.length - 2]!
      const b = chain[chain.length - 1]!
      if ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) >= 0) chain.pop()
      else break
    }
    chain.push(p)
  }
  return (x: number) => {
    if (x <= chain[0]!.x) return chain[0]!.y
    if (x > chain[chain.length - 1]!.x) return chain[chain.length - 1]!.y
    // The piece of the chain over x, by halving: the bend asks this for every point it moves. Where the chain rises
    // straight up at its end, x there is its foot, the first point at it, as its outline's own end asks.
    let [lo, hi] = [0, chain.length - 1]
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1
      if (chain[m]!.x < x) lo = m
      else hi = m
    }
    const a = chain[lo]!
    const b = chain[hi]!
    return b.x - a.x > 1e-9 ? a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x) : Math.max(a.y, b.y)
  }
}

/**
 * How a solid's underside gives to the nest it rests in, on the page: the nest is a cylinder going back into the page,
 * so its floor under a point depends only on how far across the point is — on the page, the ring (`floorAt`). Its
 * underside is carried onto the floor — up where it would pass the ring, down where it stands clear of it, as slime
 * settles into a bowl, the sag easing into a limit — and what is over it moves with it, less the higher it stands, so
 * the bend fades up its body and its top stays as it was. Its underside is the lower edge of its outline as it stands
 * (`undersideOf`), which moves smoothly as it turns, so every point does too. A point moves straight down the page by
 * what is under it, whatever its depth, so the back of its base moves as its front does and shows over it, as the far
 * edge of a tunnel's floor would — and so the bend is of the picture: the outline as it stands, bent, is the bent
 * solid's. It settles only while it rests: lifted off the floor (a jump leaving, landing), it lets go as it rises,
 * though it never passes the ring.
 */
function bendOf(underside: (x: number) => number, nest: { x: number; y: number; r: number }, rests: number, tall: number) {
  const floorAt = (x: number) => {
    const dx = Math.min(Math.abs(x - nest.x), nest.r)
    return nest.y + Math.sqrt(nest.r * nest.r - dx * dx) - SEAT
  }
  const sag = SAG * tall
  return (q: P): P => {
    const under = underside(q.x)
    const shift = floorAt(q.x) - under
    // Down onto the floor only as far as it rests, easing into its limit; up off the ring always.
    const move = shift > 0 ? sag * Math.tanh(shift / sag) * rests : shift
    const fade = Math.max(0, 1 - Math.max(0, under - q.y) / (FADE * tall))
    return { x: q.x, y: q.y + move * fade }
  }
}

/**
 * A polygon bent by `bend`, each edge cut in as many pieces as the bend needs to curve it — halved until its middle
 * bends no more than a fifth of a px off the straight, and, where the bend moves it at all, no piece is longer than
 * `most` px, so a turn in the bend inside a long edge is not missed.
 */
function bentBy(bend: (q: P) => P, most: number) {
  return (pts: P[]): P[] => {
    const out: P[] = []
    const ends = pts.map(bend)
    const piece = (a: P, b: P, ba: P, bb: P, depth: number) => {
      const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const bm = bend(m)
      const off = Math.hypot(bm.x - (ba.x + bb.x) / 2, bm.y - (ba.y + bb.y) / 2)
      const moved = Math.max(Math.abs(ba.y - a.y), Math.abs(bb.y - b.y), Math.abs(bm.y - m.y)) > 0.01
      if (depth > 8 || (off < 0.2 && (!moved || Math.hypot(b.x - a.x, b.y - a.y) <= most))) return
      piece(a, m, ba, bm, depth + 1)
      out.push(bm)
      piece(m, b, bm, bb, depth + 1)
    }
    pts.forEach((a, i) => {
      const j = (i + 1) % pts.length
      out.push(ends[i]!)
      piece(a, pts[j]!, ends[i]!, ends[j]!, 0)
    })
    return out
  }
}

/**
 * `shape` in the room the sphere would take, `head`, turned by `turn`: null for the sphere, which its own model draws.
 * `R` is the sphere's radius there, px: a unit of the solid. The room's shape — the sphere settled, breathing,
 * squashed — squashes the solid's picture the same way; its lowest point stands on the room's bottom, centred across.
 * In a nest (`nest`, px) its underside gives to the bowl (`bendOf`) rather than passing it.
 */
export function shapeFrame(
  shape: AgentShape,
  head: ShapeBox,
  R: number,
  turn: ShapeTurn = { x: 0, y: 0, z: 0 },
  nest: { x: number; y: number; r: number } | null = null,
  depth = 0,
  texture: TextureLook = { texture: "none", size: 0.16, wobble: 0.6 },
): ShapeFrame | null {
  if (shape === "sphere") return null
  const solid = solidOf(shape)
  const view = VIEWS[shape]
  const turned = turner(turn)
  const look = seen(view)
  const eye = v(view.x, view.y, view.d)
  const sx = head.w / 2
  const sy = head.h / 2
  const floor = head.y + head.h / 2
  // Where it stands, from the solid as it is before it gives: its middle across over the room's, its lowest point on
  // the room's bottom, softly (`SETTLE_SOFT` px), so as it turns its place never jumps when another corner becomes the
  // lowest or the widest. The give only moves points up and down, so this stays where it stands.
  const rigid = [...solid.cloud.map(turned), ...solid.balls.flatMap((b) => horizonOf(b, turned, eye))].map(look)
  const [tx, ty] = [SETTLE_SOFT / sx, SETTLE_SOFT / sy]
  const middle = (softLeast(rigid.map((p) => p.x), tx) - softLeast(rigid.map((p) => -p.x), tx)) / 2
  const y0 = softLeast(rigid.map((p) => p.y), ty)
  const onBox = (p: P): P => ({ x: head.x + (p.x - middle) * sx, y: floor - (p.y - y0) * sy })
  const standing = rigid.map(onBox)
  const tall = (Math.max(...rigid.map((p) => p.y)) - y0) * sy
  // It rests as far as the room it stands in does: the sphere's bottom on the nest's floor, letting go as it rises.
  const bend = nest
    ? bendOf(undersideOf(standing), nest, Math.max(0, Math.min(1, 1 - (nest.y + nest.r - floor - SEAT) / (LETGO * tall))), tall)
    : null
  // A turned point on the box, as it stands; and as it is drawn, bent. A polygon is bent in pieces, so its edges curve.
  const placed = (p: V) => onBox(look(p))
  const drawn = (p: V) => (bend ? bend(placed(p)) : placed(p))
  const bent = bend ? bentBy(bend, 6 * PIECE * R) : (pts: P[]) => pts

  const front = solid.front
  const frontTone = facing(front.normal)
  const toneOf = (n: V) => Math.max(-1, Math.min(0.5, facing(n) - frontTone))
  const faces: ShapeFace[] = []
  // Its outline: the hull of its round parts as it stands, bent.
  const outline = bent(hull(standing))
  if (solid.round) {
    // Shaded as the sphere is: its dark side, then its lit side moved toward the light; then its flat ends that face you.
    const xs = outline.map((p) => p.x)
    const lift = ((Math.max(...xs) - Math.min(...xs)) / 2) * LIFT
    faces.push({ d: poly(outline), tone: -1 })
    const moved = (k: number) => poly(outline.map((p) => ({ x: p.x + LIGHT.x * lift * k, y: p.y + LIGHT.y * lift * k })))
    // Its depth (C14): bands between its dark side and its paint and toward the light; the lit side alone at 0.
    if (depth > 0) faces.push({ d: moved(0.5), tone: -0.5 * depth }, { d: moved(1), tone: 0 }, { d: moved(1.6), tone: 0.35 * depth })
    else faces.push({ d: moved(1), tone: 0 })
    for (const cap of solid.caps) {
      const n = turned(cap.normal)
      const ring = cap.ring.map(turned)
      if (dot(n, sub(eye, mean(ring))) <= 1e-6) continue
      faces.push({ d: poly(bent(ring.map(placed))), tone: toneOf(n) })
    }
  } else {
    // What it shows of each piece, in its way's tone; the pieces of one tone one path, painted darkest first.
    // Each face in its tone; each edge and corner in the tone of every way it faces, a step at a time, so it rounds
    // smoothly from one face's tone to the next; what is one step is one path, painted darkest first.
    const flat = solid.flat!
    const byTone = new Map<number, string[]>()
    const paint = (step: number, pts: V[], holes: V[][] = []) => {
      const shape = bent(pts.map(placed))
      const parts = byTone.get(step) ?? []
      parts.push(poly(shape))
      // A hole goes round the other way, so the path's fill leaves it out.
      for (const hole of holes) {
        const ring = bent(hole.map(placed))
        parts.push(poly(areaOf(ring) * areaOf(shape) > 0 ? ring.reverse() : ring))
      }
      byTone.set(step, parts)
    }
    for (const face of flat.faces) {
      const corners = face.corners.map(turned)
      const n = turned(face.normal)
      if (dot(n, sub(eye, corners[0]!)) > 1e-6) paint(stepOf(toneOf(n)), corners)
    }
    for (const edge of flat.edges) {
      const [a, b] = [turned(edge.a), turned(edge.b)]
      for (const run of runsOf(a, b, turned(edge.from), turned(edge.to), eye, RHO, toneOf)) {
        paint(run.step, [...run.ways.map((w) => add(a, w, RHO)), ...[...run.ways].reverse().map((w) => add(b, w, RHO))])
      }
    }
    for (const corner of flat.corners) {
      const at = turned(corner.at)
      for (const region of cornerOf(corner.rim.map(turned), at, eye, RHO, frontTone)) {
        const onBall = (w: V) => add(at, w, RHO)
        paint(region.step, region.ways.map(onBall), region.holes.map((h) => h.map(onBall)))
      }
    }
    for (const [step, parts] of [...byTone.entries()].sort((a, b) => a[0] - b[0])) faces.push({ d: parts.join(" "), tone: step / TONE_STEPS })
  }

  // The face's patch: its point on the box, and its across and down there, through the turn, the give and the camera.
  const at = drawn(turned(front.at))
  const e = 1e-3
  const across = drawn(turned(add(front.at, front.across, e)))
  const down = drawn(turned(add(front.at, front.down, e)))
  // Its own px are a head's radius a unit, as the solid's are: so the matrix is the patch's px per unit, over R.
  const per = e * R
  const n = turned(front.normal)
  // Its texture (C15), drawn on its patches: a place is shown where its surface faces the camera, in that face's tone.
  const drawnTexture = drawTexture(
    texture,
    solid.patches,
    (p, nrm) => {
      const tp = turned(p)
      const tn = turned(nrm)
      if (dot(tn, sub(eye, tp)) <= 0.02) return null
      return { at: drawn(tp), tone: Math.round(toneOf(tn) * 4) / 4 }
    },
    R,
  )
  return {
    outline: poly(outline),
    faces,
    texture: drawnTexture,
    front: { x: at.x, y: at.y, r: front.reach * R },
    face: { a: (across.x - at.x) / per, b: (across.y - at.y) / per, c: (down.x - at.x) / per, d: (down.y - at.y) / per },
    faceShown: dot(n, unit(sub(eye, turned(front.at)))) > SHOWN,
  }
}
