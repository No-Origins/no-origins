/**
 * THE AGENT'S SHAPES (Character-Studio.md C10, C12), pure: what the head is drawn as when it is not the sphere.
 * **Version 3 (2026-09-30): rounded solids in 3D**, turned by his rotation, resting in the cell as in a tunnel.
 *
 * **Each shape is a solid with soft edges** (his: *"let's not have sharp edges for the characters"*): a core — the cube,
 * the hexagonal prism and the pyramid as faces, the cylinder, the cone and the hemisphere as circles and a dome — grown
 * by a ball `RHO` wide, so every edge is a quarter-round and every corner a piece of a sphere (`roundedMesh`, the
 * Minkowski sum). A flat-sided one is drawn as facets: its faces moved out, a band of facets along each edge, a patch at
 * each corner — each facet one flat colour from which way it faces (`facing`), so an edge is a few steps of tone, not a
 * gradient, and its silhouette is the edges its shown facets do not share (`silhouette`), so it follows every facet
 * exactly. A round one keeps the sphere's two tones — its dark side, then its lit side moved toward the light — over
 * the hull of its rounded surface's points, and flat colour for its ends.
 *
 * **Turned, then seen.** Rotate Y about its upright, on the spot, then X toward you or away, then Z about the way you
 * look; then a camera in front of it and above, in perspective, looking straight ahead (`VIEWS`, each shape's natural
 * view), so at rotation 0 its front is square to you and its base level.
 *
 * **It rests in the cell as in a tunnel** (his: *"imagine each cell is a tunnel and the character is resting on the
 * tunnel, so it should be a smooth curve"*). The nest is a cylinder going back into the page, so its floor under a point
 * depends only on how far across the point is: its underside is carried onto that floor — up where it would pass the
 * ring, down where it hangs clear, as slime settles — and what is over it moves with it, less the higher it stands, so
 * the bend fades up its body (`giveOf`). Every move is a smooth function of where a point is, so a turn moves every
 * point smoothly; its edges are drawn in pieces a few px long so a straight one can bend. Where its face goes is a patch
 * of its front carried through the same turn, bend and camera (`face`), hidden once the front turns away.
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
/** How many facets a quarter-round edge is drawn in. */
const STEPS = 5
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
/** A facet's tone is drawn to this many steps, so facets of one tone are one path. */
const TONE_STEPS = 24
/** How many points a circle is drawn with. */
const ROUNDS = 64
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

const f2 = (n: number) => (Math.round(n * 100) / 100).toString()
const poly = (pts: P[]) => `M ${pts.map((p) => `${f2(p.x)} ${f2(p.y)}`).join(" L ")} Z`
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

/** A facet of a rounded solid: its corners as point ids, and which way it faces. */
type Facet = { ids: number[]; normal: V }

/**
 * A solid, about its middle, a head's radius a unit, its edges rounded: every point of its surface it is drawn with
 * (`points`, by id); its facets, where it is flat-sided; its flat ends, where it is round, each a polygon of point ids
 * and its normal; whether it is round; and the patch of its front the face is laid on — a point, its across and its
 * down — with how far out the face's measures reach.
 */
type Solid = {
  points: V[]
  facets: Facet[]
  caps: Facet[]
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

/** The points of a solid as they are made, each once: the same corner in the same direction is the same point. */
class Points {
  list: V[] = []
  private ids = new Map<string, number>()
  at(p: V): number {
    const key = `${p.x.toFixed(6)} ${p.y.toFixed(6)} ${p.z.toFixed(6)}`
    let id = this.ids.get(key)
    if (id === undefined) {
      id = this.list.length
      this.ids.set(key, id)
      this.list.push(p)
    }
    return id
  }
}

/**
 * `core` grown by a ball `rho` wide, as facets: each face moved out along its normal; along each edge, a band of
 * facets a quarter-turn (`STEPS` of them) from one face's normal round to the other's; at each corner, a fan of facets
 * over the piece of sphere between its faces' normals. Every point is `corner + rho · direction`, made once
 * (`Points`), so facets share their corners exactly and the silhouette can be walked along their edges.
 */
function roundedMesh(core: Core, rho: number, points: Points): Facet[] {
  const centre = mean(core.verts)
  const normals = core.faces.map((f) => {
    const [a, b, c] = [core.verts[f[0]!]!, core.verts[f[1]!]!, core.verts[f[2]!]!]
    let n = unit(cross(sub(b, a), sub(c, a)))
    if (dot(n, sub(mean(f.map((i) => core.verts[i]!)), centre)) < 0) n = v(-n.x, -n.y, -n.z)
    return n
  })
  const at = (vi: number, n: V) => points.at(add(core.verts[vi]!, n, rho))
  const facets: Facet[] = []
  for (const [fi, f] of core.faces.entries()) facets.push({ ids: f.map((vi) => at(vi, normals[fi]!)), normal: normals[fi]! })
  // Each edge, the two faces at it, and the directions from the first's normal round to the second's.
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
  for (const e of edges.values()) {
    if (e.faces.length !== 2) continue
    const [nA, nB] = [normals[e.faces[0]!]!, normals[e.faces[1]!]!]
    const theta = Math.acos(Math.max(-1, Math.min(1, dot(nA, nB))))
    const steps = Math.max(1, Math.round((theta / (Math.PI / 2)) * STEPS))
    e.arc = Array.from({ length: steps + 1 }, (_, k) => slerp(nA, nB, k / steps))
    for (let k = 0; k < steps; k++) {
      const [n0, n1] = [e.arc[k]!, e.arc[k + 1]!]
      facets.push({ ids: [at(e.a, n0), at(e.b, n0), at(e.b, n1), at(e.a, n1)], normal: unit(add(n0, n1)) })
    }
  }
  // Each corner: its faces in order round it, the arcs between them as its patch's rim, and a fan over the patch.
  core.verts.forEach((_, vi) => {
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
      const arc = forward ? e.arc : [...e.arc].reverse()
      for (const n of arc.slice(0, -1)) rim.push(n)
      fi = forward ? e.faces[1]! : e.faces[0]!
      if (fi === first) break
    }
    if (rim.length < 3) return
    const nc = unit(rim.reduce((s, n) => add(s, n), v(0, 0, 0)))
    const c = at(vi, nc)
    rim.forEach((n0, m) => {
      const n1 = rim[(m + 1) % rim.length]!
      if (len(sub(n0, n1)) < 1e-9) return
      facets.push({ ids: [c, at(vi, n0), at(vi, n1)], normal: unit(add(add(nc, n0), n1)) })
    })
  })
  return facets
}

/** Round a circle: `n` angles. */
const roundabout = (n = ROUNDS) => Array.from({ length: n }, (_, i) => (2 * Math.PI * i) / n)

const SOLIDS = new Map<Exclude<AgentShape, "sphere">, Solid>()

/** The solid `shape` is, made once: its sizes are its outer ones, the core grown by `RHO` reaching them. */
function solidOf(shape: Exclude<AgentShape, "sphere">): Solid {
  const made = SOLIDS.get(shape)
  if (made) return made
  const points = new Points()
  const rho = RHO
  let solid: Solid
  switch (shape) {
    case "cube": {
      // Smaller than the sphere's radius across: a square as wide as a circle looks the bigger.
      const h = 0.58
      const c = h - rho
      const verts = [v(-c, -c, c), v(c, -c, c), v(c, c, c), v(-c, c, c), v(-c, -c, -c), v(c, -c, -c), v(c, c, -c), v(-c, c, -c)]
      const faces = [[0, 1, 2, 3], [5, 4, 7, 6], [1, 5, 6, 2], [4, 0, 3, 7], [3, 2, 6, 7], [4, 5, 1, 0]]
      solid = {
        points: points.list,
        facets: roundedMesh({ verts, faces }, rho, points),
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
        points: points.list,
        facets: roundedMesh({ verts, faces }, rho, points),
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
        points: points.list,
        facets: roundedMesh({ verts, faces }, rho, points),
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
      const capTop: number[] = []
      const capLow: number[] = []
      for (const a of roundabout()) {
        const u = v(Math.cos(a), 0, Math.sin(a))
        for (const s of [1, -1]) {
          const corner = add(v(0, s * hc, 0), u, rc)
          // Its rim rounds from its side's direction to its end's.
          for (let k = 0; k <= STEPS; k++) points.at(add(corner, slerp(u, v(0, s, 0), k / STEPS), rho))
          ;(s > 0 ? capTop : capLow).push(points.at(add(corner, v(0, s, 0), rho)))
        }
      }
      solid = {
        points: points.list,
        facets: [],
        caps: [{ ids: capTop, normal: v(0, 1, 0) }, { ids: capLow, normal: v(0, -1, 0) }],
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
      const cap: number[] = []
      for (const a of roundabout()) {
        const u = v(Math.cos(a), 0, Math.sin(a))
        const slant = unit(add(v(0, r, 0), u, 2 * h))
        // Its tip rounds from its side's direction to straight up; its rim from its side's to straight down.
        for (let k = 0; k <= STEPS; k++) points.at(add(apex, slerp(slant, v(0, 1, 0), k / STEPS), rho))
        const rim = add(v(0, low, 0), u, rc)
        for (let k = 0; k <= STEPS; k++) points.at(add(rim, slerp(slant, v(0, -1, 0), k / STEPS), rho))
        cap.push(points.at(add(rim, v(0, -1, 0), rho)))
      }
      const up = 0.36
      const slope = unit(v(0, -2 * h, r))
      solid = {
        points: points.list,
        facets: [],
        caps: [{ ids: cap, normal: v(0, -1, 0) }],
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
          at: v(0, -h + 2 * h * up, r * (1 - up)),
          across: v(1, 0, 0),
          down: slope,
          normal: unit(cross(slope, v(1, 0, 0))),
          reach: Math.min(r * (1 - up) * 0.8, 2 * h * 0.28),
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
      const cap: number[] = []
      for (const a of roundabout()) {
        const u = v(Math.cos(a), 0, Math.sin(a))
        for (let i = 0; i <= 8; i++) {
          const phi = phi0 + (Math.PI / 2 - phi0) * (i / 8)
          points.at(add(v(0, low + r * Math.sin(phi), 0), u, r * Math.cos(phi)))
        }
        const rim = add(v(0, low + rho, 0), u, q)
        const out = unit(add(v(0, Math.sin(phi0), 0), u, Math.cos(phi0)))
        for (let k = 0; k <= STEPS; k++) points.at(add(rim, slerp(out, v(0, -1, 0), k / STEPS), rho))
        cap.push(points.at(add(rim, v(0, -1, 0), rho)))
      }
      const phi = (25 * Math.PI) / 180
      solid = {
        points: points.list,
        facets: [],
        caps: [{ ids: cap, normal: v(0, -1, 0) }],
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

/**
 * The silhouette of the facets shown: the edges no two of them share, walked into loops, the longest kept. Because
 * every facet's corners are shared exactly, the loops close, and the outline follows the facets however they bend.
 */
function silhouette(facets: Facet[]): number[] {
  const count = new Map<string, { a: number; b: number; n: number }>()
  const keyOf = (a: number, b: number) => (a < b ? `${a}|${b}` : `${b}|${a}`)
  for (const f of facets) {
    f.ids.forEach((a, i) => {
      const b = f.ids[(i + 1) % f.ids.length]!
      const e = count.get(keyOf(a, b))
      if (e) e.n += 1
      else count.set(keyOf(a, b), { a, b, n: 1 })
    })
  }
  const open = [...count.values()].filter((e) => e.n === 1)
  const next = new Map<number, number[]>()
  for (const e of open) {
    next.set(e.a, [...(next.get(e.a) ?? []), e.b])
    next.set(e.b, [...(next.get(e.b) ?? []), e.a])
  }
  const walked = new Set<string>()
  let best: number[] = []
  for (const e of open) {
    if (walked.has(keyOf(e.a, e.b))) continue
    const start = e.a
    const loop = [start]
    let prev = start
    let at = e.b
    walked.add(keyOf(start, at))
    while (at !== start) {
      loop.push(at)
      const onward = (next.get(at) ?? []).find((n) => n !== prev && !walked.has(keyOf(at, n)))
      if (onward === undefined) break
      walked.add(keyOf(at, onward))
      prev = at
      at = onward
    }
    if (loop.length > best.length) best = loop
  }
  return best
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
    for (let i = 1; i < chain.length; i++) {
      const a = chain[i - 1]!
      const b = chain[i]!
      if (x <= b.x) return b.x - a.x > 1e-9 ? a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x) : Math.max(a.y, b.y)
    }
    return chain[chain.length - 1]!.y
  }
}

/**
 * How a solid's underside gives to the nest it rests in: the nest is a cylinder going back into the page, so its floor
 * under a point depends only on how far across the point is — on the page, the ring (`floorAt`). Its underside is
 * carried onto the floor — up where it would pass the ring, down where it stands clear of it, as slime settles into a
 * bowl, the sag easing into a limit — and what is over it moves with it, less the higher it stands, so the bend fades
 * up its body and its top stays as it was. Its underside is the lower edge of its outline as it stands (`undersideOf`),
 * which moves smoothly as it turns, so every point does too. The move is on the page, carried back into the solid at the
 * point's depth, so the back of its base moves as its front does and shows over it, as the far edge of a tunnel's
 * floor would. It settles only while it rests: lifted off the floor (a jump leaving, landing), it lets go as it rises,
 * though it never passes the ring.
 */
function giveOf(
  place: (p: V) => P,
  depth: (p: V) => number,
  underside: (x: number) => number,
  nest: { x: number; y: number; r: number },
  rests: number,
  tall: number,
  perY: number,
) {
  const floorAt = (x: number) => {
    const dx = Math.min(Math.abs(x - nest.x), nest.r)
    return nest.y + Math.sqrt(nest.r * nest.r - dx * dx) - SEAT
  }
  const sag = SAG * tall
  return (p: V): V => {
    const q = place(p)
    const under = underside(q.x)
    const shift = floorAt(q.x) - under
    // Down onto the floor only as far as it rests, easing into its limit; up off the ring always.
    const move = shift > 0 ? sag * Math.tanh(shift / sag) * rests : shift
    const fade = Math.max(0, 1 - Math.max(0, under - q.y) / (FADE * tall))
    const dy = move * fade
    if (Math.abs(dy) < 1e-4) return p
    return v(p.x, p.y - dy / (perY * depth(p)), p.z)
  }
}

/**
 * `shape` in the room the sphere would take, `head`, turned by `turn`: null for the sphere, which its own model draws.
 * `R` is the sphere's radius there, px: a unit of the solid. The room's shape — the sphere settled, breathing,
 * squashed — squashes the solid's picture the same way; its lowest point stands on the room's bottom, centred across.
 * In a nest (`nest`, px) its underside gives to the bowl (`giveOf`) rather than passing it.
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
  const spun = solid.points.map(turned)
  const rigid = spun.map(look)
  const [tx, ty] = [SETTLE_SOFT / sx, SETTLE_SOFT / sy]
  const middle = (softLeast(rigid.map((p) => p.x), tx) - softLeast(rigid.map((p) => -p.x), tx)) / 2
  const y0 = softLeast(rigid.map((p) => p.y), ty)
  const onBox = (p: P): P => ({ x: head.x + (p.x - middle) * sx, y: floor - (p.y - y0) * sy })
  const tall = (Math.max(...rigid.map((p) => p.y)) - y0) * sy
  // It rests as far as the room it stands in does: the sphere's bottom on the nest's floor, letting go as it rises.
  const give = nest
    ? giveOf(
        (p) => onBox(look(p)),
        (p) => view.d / Math.max(0.2, view.d - p.z),
        undersideOf(rigid.map(onBox)),
        nest,
        Math.max(0, Math.min(1, 1 - (nest.y + nest.r - floor - SEAT) / (LETGO * tall))),
        tall,
        sy,
      )
    : (p: V) => p
  // A turned point on the box; and a polygon of point ids on the box, each edge in pieces where it may bend.
  const drawn = (p: V) => onBox(look(give(p)))
  const polygon = (ids: number[]): P[] => {
    const out: P[] = []
    ids.forEach((id, i) => {
      const a = spun[id]!
      const b = spun[ids[(i + 1) % ids.length]!]!
      const pieces = nest ? Math.max(1, Math.ceil(len(sub(b, a)) / PIECE)) : 1
      for (let k = 0; k < pieces; k++) out.push(drawn(add(a, sub(b, a), k / pieces)))
    })
    return out
  }

  const front = solid.front
  const frontTone = facing(front.normal)
  const toneOf = (n: V) => Math.max(-1, Math.min(0.5, facing(n) - frontTone))
  const faces: ShapeFace[] = []
  let outline: P[]
  if (solid.round) {
    // Shaded as the sphere is: its dark side, then its lit side moved toward the light; then its flat ends that face you.
    outline = hull(spun.map(drawn))
    const xs = outline.map((p) => p.x)
    const lift = ((Math.max(...xs) - Math.min(...xs)) / 2) * LIFT
    faces.push({ d: poly(outline), tone: -1 })
    const moved = (k: number) => poly(outline.map((p) => ({ x: p.x + LIGHT.x * lift * k, y: p.y + LIGHT.y * lift * k })))
    // Its depth (C14): bands between its dark side and its paint and toward the light; the lit side alone at 0.
    if (depth > 0) faces.push({ d: moved(0.5), tone: -0.5 * depth }, { d: moved(1), tone: 0 }, { d: moved(1.6), tone: 0.35 * depth })
    else faces.push({ d: moved(1), tone: 0 })
    for (const cap of solid.caps) {
      const n = turned(cap.normal)
      if (dot(n, sub(eye, mean(cap.ids.map((id) => spun[id]!)))) <= 1e-6) continue
      faces.push({ d: poly(polygon(cap.ids)), tone: toneOf(n) })
    }
  } else {
    // Its facets that show — the camera on their outer side — farther first; each in its tone, those of one tone one path.
    const shown = solid.facets
      .map((f) => ({ f, n: turned(f.normal), c: mean(f.ids.map((id) => spun[id]!)) }))
      .filter(({ n, c }) => dot(n, sub(eye, c)) > 1e-6)
      .sort((a, b) => a.c.z - b.c.z)
    const byTone = new Map<number, string[]>()
    for (const { f, n } of shown) {
      const step = Math.round(toneOf(n) * TONE_STEPS)
      byTone.set(step, [...(byTone.get(step) ?? []), poly(polygon(f.ids))])
    }
    for (const [step, parts] of [...byTone.entries()].sort((a, b) => a[0] - b[0])) faces.push({ d: parts.join(" "), tone: step / TONE_STEPS })
    outline = polygon(silhouette(shown.map(({ f }) => f)))
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
